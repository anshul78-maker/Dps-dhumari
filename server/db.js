import pkg from "node-sqlite3-wasm";
const { Database } = pkg;
import bcrypt from "bcryptjs";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { UPLOADS_DIR } from "./files.js";
import {
  users, teaching, marks, attendance, assignments, fees, notices, classes, settings
} from "../seed/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data.db");

const db = new Database(DB_PATH);
db.run("PRAGMA foreign_keys = ON");

// ------------------------------------------------------------------ schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL,          -- student | teacher | accountant
    name          TEXT NOT NULL,
    class_name    TEXT,                   -- students only
    roll          INTEGER                 -- students only
  );

  CREATE TABLE IF NOT EXISTS teaching (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    subject    TEXT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS marks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject    TEXT NOT NULL,
    exam       TEXT NOT NULL,
    score      INTEGER NOT NULL,
    max_score  INTEGER NOT NULL DEFAULT 100,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date       TEXT NOT NULL,
    present    INTEGER NOT NULL,          -- 1 present, 0 absent
    UNIQUE(student_id, date),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject    TEXT NOT NULL,
    details    TEXT,
    due_date   TEXT,
    teacher_id INTEGER NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id    INTEGER NOT NULL,
    done          INTEGER NOT NULL DEFAULT 0,
    UNIQUE(assignment_id, student_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id)    REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title      TEXT NOT NULL,
    amount     INTEGER NOT NULL,
    period     TEXT,
    status     TEXT NOT NULL DEFAULT 'due',   -- due | paid
    paid_at    TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    audience    TEXT NOT NULL DEFAULT 'all',  -- 'all' or a class_name
    author_id   INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  -- report cards (from teachers) and transfer certificates (from the
  -- accountant) — a PDF issued to one student, which that student can view.
  CREATE TABLE IF NOT EXISTS documents (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id       INTEGER NOT NULL,
    type             TEXT NOT NULL,            -- 'report_card' | 'tc'
    title            TEXT NOT NULL,
    file_name        TEXT NOT NULL,            -- stored filename on disk
    original_name    TEXT,
    size             INTEGER,
    uploaded_by      INTEGER NOT NULL,
    uploaded_by_name TEXT NOT NULL,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id)  REFERENCES users(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  -- classes the school runs — source of truth for "which classes exist".
  CREATE TABLE IF NOT EXISTS classes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT UNIQUE NOT NULL,
    class_teacher_id INTEGER,
    FOREIGN KEY (class_teacher_id) REFERENCES users(id)
  );

  -- school profile, managed by admin
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// --- migrations for databases created before file-upload support ---
function hasColumn(table, col) {
  return db.all(`PRAGMA table_info(${table})`).some(c => c.name === col);
}
function addColumn(table, col, defn) {
  if (!hasColumn(table, col)) db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${defn}`);
}
addColumn("submissions", "file_name", "TEXT");
addColumn("submissions", "original_name", "TEXT");
addColumn("submissions", "uploaded_at", "TEXT");

// --- migrations for the admin role's profile fields (student + staff) ---
for (const [col, defn] of [
  ["admission_no", "TEXT"], ["gender", "TEXT"], ["dob", "TEXT"],
  ["guardian_name", "TEXT"], ["phone", "TEXT"], ["email", "TEXT"], ["address", "TEXT"],
  ["employee_id", "TEXT"], ["designation", "TEXT"], ["joining_date", "TEXT"]
]) addColumn("users", col, defn);

// ------------------------------------------------------------------ seeding
function isEmpty() {
  const row = db.get("SELECT COUNT(*) AS c FROM users");
  return row.c === 0;
}

function seed() {
  const idOf = {}; // username -> id

  // The real roster shares a handful of default passwords (student123 /
  // teacher123 / …). Hashing each of ~1400 users separately would take over a
  // minute on boot, so cache the hash per distinct password string.
  const hashCache = {};
  const hashFor = (p) => (hashCache[p] ||= bcrypt.hashSync(p, 10));

  db.run("BEGIN");
  try {
    for (const u of users) {
      const hash = hashFor(u.password);
      db.run(
        `INSERT INTO users (username, password_hash, role, name, class_name, roll,
           admission_no, gender, dob, guardian_name, phone, email, address,
           employee_id, designation, joining_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [u.username, hash, u.role, u.name, u.className || null, u.roll ?? null,
         u.admissionNo || null, u.gender || null, u.dob || null, u.guardianName || null,
         u.phone || null, u.email || null, u.address || null,
         u.employeeId || null, u.designation || null, u.joiningDate || null]
      );
      idOf[u.username] = db.get("SELECT id FROM users WHERE username=?", [u.username]).id;
    }

    for (const t of teaching) {
      db.run("INSERT INTO teaching (teacher_id, class_name, subject) VALUES (?,?,?)",
        [idOf[t.teacher], t.className, t.subject]);
    }

    for (const c of (classes || [])) {
      db.run("INSERT INTO classes (name, class_teacher_id) VALUES (?,?)",
        [c.name, c.classTeacher ? idOf[c.classTeacher] : null]);
    }

    for (const [key, value] of Object.entries(settings || {})) {
      db.run("INSERT INTO settings (key, value) VALUES (?,?)", [key, value]);
    }

    for (const [uname, subject, exam, score, max] of marks) {
      db.run("INSERT INTO marks (student_id, subject, exam, score, max_score) VALUES (?,?,?,?,?)",
        [idOf[uname], subject, exam, score, max]);
    }

    for (const [uname, date, present] of attendance) {
      db.run("INSERT INTO attendance (student_id, date, present) VALUES (?,?,?)",
        [idOf[uname], date, present]);
    }

    for (const [title, className, subject, details, due, teacher] of assignments) {
      db.run("INSERT INTO assignments (title, class_name, subject, details, due_date, teacher_id) VALUES (?,?,?,?,?,?)",
        [title, className, subject, details, due, idOf[teacher]]);
    }

    for (const [uname, title, amount, period, status] of fees) {
      db.run("INSERT INTO fees (student_id, title, amount, period, status, paid_at) VALUES (?,?,?,?,?,?)",
        [idOf[uname], title, amount, period, status, status === "paid" ? "seed" : null]);
    }

    for (const [author, title, body, audience] of (notices || [])) {
      const a = users.find(u => u.username === author);
      db.run("INSERT INTO notices (title, body, audience, author_id, author_name) VALUES (?,?,?,?,?)",
        [title, body, audience || "all", idOf[author], a ? a.name : author]);
    }

    db.run("COMMIT");
    console.log(`Seeded ${users.length} users.`);
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}

// Re-seed on demand: `node server/db.js --reseed`
if (process.argv.includes("--reseed")) {
  db.exec(`
    DELETE FROM documents;   DELETE FROM notices;       DELETE FROM submissions;
    DELETE FROM assignments; DELETE FROM fees;          DELETE FROM attendance;
    DELETE FROM marks;       DELETE FROM teaching;      DELETE FROM classes;
    DELETE FROM settings;    DELETE FROM users;
  `);
  // wipe uploaded PDFs so a reset really is a clean slate
  try {
    for (const f of fs.readdirSync(UPLOADS_DIR)) fs.unlinkSync(path.join(UPLOADS_DIR, f));
  } catch { /* uploads dir may not exist yet */ }
  seed();
  console.log("Database reset to seed data.");
  process.exit(0);
}

if (isEmpty()) seed();

// =================================================================== QUERIES

// ---- auth ----
export function getUserByUsername(username) {
  return db.get("SELECT * FROM users WHERE username=?", [username]) || null;
}
export function getUserById(id) {
  return db.get("SELECT * FROM users WHERE id=?", [id]) || null;
}

// ---- student ----
export function studentMarks(studentId) {
  return db.all("SELECT subject, exam, score, max_score FROM marks WHERE student_id=?", [studentId]);
}
export function studentAttendance(studentId) {
  return db.all("SELECT date, present FROM attendance WHERE student_id=? ORDER BY date", [studentId]);
}
export function studentAssignments(className, studentId) {
  return db.all(`
    SELECT a.id, a.title, a.subject, a.details, a.due_date,
           COALESCE(s.done,0) AS done,
           s.id AS submission_id, s.original_name, s.uploaded_at
    FROM assignments a
    LEFT JOIN submissions s ON s.assignment_id=a.id AND s.student_id=?
    WHERE a.class_name=?
    ORDER BY a.due_date`, [studentId, className]);
}
export function toggleSubmission(assignmentId, studentId, done) {
  const existing = db.get("SELECT id FROM submissions WHERE assignment_id=? AND student_id=?",
    [assignmentId, studentId]);
  if (existing) {
    db.run("UPDATE submissions SET done=? WHERE id=?", [done, existing.id]);
  } else {
    db.run("INSERT INTO submissions (assignment_id, student_id, done) VALUES (?,?,?)",
      [assignmentId, studentId, done]);
  }
}
export function assignmentById(id) {
  return db.get("SELECT * FROM assignments WHERE id=?", [id]) || null;
}
// Student uploads (or replaces) a PDF for an assignment — marks it done.
// Returns the previous submission row so the caller can delete the old file.
export function submitAssignmentFile(assignmentId, studentId, fileName, originalName) {
  const existing = db.get("SELECT * FROM submissions WHERE assignment_id=? AND student_id=?",
    [assignmentId, studentId]);
  if (existing) {
    db.run(`UPDATE submissions SET done=1, file_name=?, original_name=?,
            uploaded_at=datetime('now') WHERE id=?`,
      [fileName, originalName, existing.id]);
  } else {
    db.run(`INSERT INTO submissions (assignment_id, student_id, done, file_name, original_name, uploaded_at)
            VALUES (?,?,1,?,?,datetime('now'))`,
      [assignmentId, studentId, fileName, originalName]);
  }
  return existing;
}
export function getSubmissionById(id) {
  return db.get(`
    SELECT s.*, a.class_name, a.subject, a.title AS assignment_title,
           u.name AS student_name, u.roll
    FROM submissions s
    JOIN assignments a ON a.id=s.assignment_id
    JOIN users u ON u.id=s.student_id
    WHERE s.id=?`, [id]) || null;
}
export function studentFees(studentId) {
  return db.all("SELECT id, title, amount, period, status FROM fees WHERE student_id=? ORDER BY id DESC",
    [studentId]);
}

// ---- shared ----
export function classmates(className) {
  return db.all("SELECT id, name, roll FROM users WHERE role='student' AND class_name=? ORDER BY roll",
    [className]);
}

// All marks for every student in a class, oldest -> newest per student.
// Used to compute a real academic rank (latest score per subject, averaged).
export function classMarks(className) {
  return db.all(`
    SELECT m.student_id, m.subject, m.score, m.max_score
    FROM marks m JOIN users u ON u.id = m.student_id
    WHERE u.class_name = ? AND u.role = 'student'
    ORDER BY m.student_id, m.id`, [className]);
}

// ---- teacher ----
export function teacherClasses(teacherId) {
  return db.all("SELECT DISTINCT class_name, subject FROM teaching WHERE teacher_id=? ORDER BY class_name, subject",
    [teacherId]);
}
export function teacherTeaches(teacherId, className, subject) {
  return !!db.get("SELECT 1 FROM teaching WHERE teacher_id=? AND class_name=? AND subject=?",
    [teacherId, className, subject]);
}
export function saveMark(studentId, subject, exam, score, max) {
  db.run("INSERT INTO marks (student_id, subject, exam, score, max_score) VALUES (?,?,?,?,?)",
    [studentId, subject, exam, score, max]);
}
export function markAttendance(studentId, date, present) {
  const existing = db.get("SELECT id FROM attendance WHERE student_id=? AND date=?", [studentId, date]);
  if (existing) db.run("UPDATE attendance SET present=? WHERE id=?", [present, existing.id]);
  else db.run("INSERT INTO attendance (student_id, date, present) VALUES (?,?,?)", [studentId, date, present]);
}
export function createAssignment(title, className, subject, details, due, teacherId) {
  db.run("INSERT INTO assignments (title, class_name, subject, details, due_date, teacher_id) VALUES (?,?,?,?,?,?)",
    [title, className, subject, details, due, teacherId]);
}
// Assignments for the classes/subjects a teacher teaches, with how many of
// that class have submitted a file so far.
export function teacherAssignments(teacherId) {
  return db.all(`
    SELECT a.id, a.title, a.class_name, a.subject, a.due_date,
      (SELECT COUNT(*) FROM users u
         WHERE u.role='student' AND u.class_name=a.class_name) AS class_size,
      (SELECT COUNT(*) FROM submissions s
         WHERE s.assignment_id=a.id AND s.file_name IS NOT NULL) AS submitted
    FROM assignments a
    JOIN teaching t ON t.teacher_id=? AND t.class_name=a.class_name AND t.subject=a.subject
    ORDER BY a.due_date DESC, a.id DESC`, [teacherId]);
}
// One row per student in the assignment's class, with their submission (if any).
export function assignmentSubmissions(assignmentId) {
  const a = assignmentById(assignmentId);
  if (!a) return { assignment: null, rows: [] };
  const rows = db.all(`
    SELECT u.id AS student_id, u.name, u.roll,
           s.id AS submission_id, s.original_name, s.uploaded_at,
           (s.file_name IS NOT NULL) AS has_file
    FROM users u
    LEFT JOIN submissions s ON s.student_id=u.id AND s.assignment_id=?
    WHERE u.role='student' AND u.class_name=?
    ORDER BY u.roll`, [assignmentId, a.class_name]);
  return { assignment: a, rows };
}
// Students across all the classes a teacher teaches (for sending report cards).
export function studentsForTeacher(teacherId) {
  return db.all(`
    SELECT DISTINCT u.id, u.name, u.class_name, u.roll
    FROM users u
    JOIN teaching t ON t.class_name=u.class_name AND t.teacher_id=?
    WHERE u.role='student'
    ORDER BY u.class_name, u.roll`, [teacherId]);
}
export function studentInTeacherClass(teacherId, studentId) {
  return !!db.get(`
    SELECT 1 FROM users u
    JOIN teaching t ON t.class_name=u.class_name
    WHERE u.id=? AND u.role='student' AND t.teacher_id=? LIMIT 1`,
    [studentId, teacherId]);
}

// ---- documents: report cards + transfer certificates ----
export function addDocument(studentId, type, title, fileName, originalName, size, uploadedBy, uploadedByName) {
  db.run(`INSERT INTO documents
            (student_id, type, title, file_name, original_name, size, uploaded_by, uploaded_by_name)
          VALUES (?,?,?,?,?,?,?,?)`,
    [studentId, type, title, fileName, originalName, size, uploadedBy, uploadedByName]);
}
export function documentsForStudent(studentId, type) {
  if (type)
    return db.all("SELECT * FROM documents WHERE student_id=? AND type=? ORDER BY id DESC", [studentId, type]);
  return db.all("SELECT * FROM documents WHERE student_id=? ORDER BY id DESC", [studentId]);
}
export function documentsByType(type) {
  return db.all(`
    SELECT d.*, u.name AS student_name, u.class_name, u.roll
    FROM documents d JOIN users u ON u.id=d.student_id
    WHERE d.type=? ORDER BY d.id DESC`, [type]);
}
export function getDocumentById(id) {
  return db.get(`
    SELECT d.*, u.name AS student_name, u.class_name, u.roll
    FROM documents d JOIN users u ON u.id=d.student_id
    WHERE d.id=?`, [id]) || null;
}

// ---- accountant ----
export function allStudents() {
  return db.all("SELECT id, name, class_name, roll FROM users WHERE role='student' ORDER BY class_name, roll");
}
export function addFee(studentId, title, amount, period) {
  db.run("INSERT INTO fees (student_id, title, amount, period, status) VALUES (?,?,?,?, 'due')",
    [studentId, title, amount, period]);
}
export function addFeeToClass(className, title, amount, period) {
  const students = db.all("SELECT id FROM users WHERE role='student' AND class_name=?", [className]);
  for (const s of students) addFee(s.id, title, amount, period);
  return students.length;
}
export function getFeeById(feeId) {
  return db.get("SELECT * FROM fees WHERE id=?", [feeId]) || null;
}
export function markFeePaid(feeId) {
  db.run("UPDATE fees SET status='paid', paid_at=datetime('now') WHERE id=?", [feeId]);
}
export function allFees() {
  return db.all(`
    SELECT f.id, f.title, f.amount, f.period, f.status,
           u.name AS student_name, u.class_name, u.roll
    FROM fees f JOIN users u ON u.id=f.student_id
    ORDER BY f.status ASC, u.class_name, u.roll`);
}

// ---- notices (shared across roles) ----
export function createNotice(title, body, audience, authorId, authorName) {
  db.run("INSERT INTO notices (title, body, audience, author_id, author_name) VALUES (?,?,?,?,?)",
    [title, body, audience, authorId, authorName]);
}
// Notices a given user should see. Staff see everything; a student sees
// school-wide notices plus any addressed to their class.
export function noticesFor(user) {
  if (user.role === "student" && user.class_name) {
    return db.all(
      "SELECT * FROM notices WHERE audience='all' OR audience=? ORDER BY id DESC",
      [user.class_name]);
  }
  return db.all("SELECT * FROM notices ORDER BY id DESC");
}
export function getNoticeById(id) {
  return db.get("SELECT * FROM notices WHERE id=?", [id]) || null;
}
export function deleteNotice(id) {
  db.run("DELETE FROM notices WHERE id=?", [id]);
}

// ---- admin: dashboard ----
export function adminOverview() {
  const totalStudents = db.get("SELECT COUNT(*) AS c FROM users WHERE role='student'").c;
  const totalStaff = db.get("SELECT COUNT(*) AS c FROM users WHERE role IN ('teacher','accountant')").c;
  const totalClasses = db.get("SELECT COUNT(*) AS c FROM classes").c;
  const feeRows = db.all("SELECT amount, status FROM fees");
  const feesDue = feeRows.filter(f => f.status === "due").reduce((s, f) => s + f.amount, 0);
  const feesPaid = feeRows.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const attRows = db.all("SELECT present, COUNT(*) AS c FROM attendance WHERE date=? GROUP BY present", [today]);
  const present = attRows.find(r => r.present === 1)?.c || 0;
  const absent = attRows.find(r => r.present === 0)?.c || 0;
  return { totalStudents, totalStaff, totalClasses, feesDue, feesPaid, today, present, absent };
}

// ---- admin: students ----
export function allStudentsDetailed() {
  return db.all(`
    SELECT id, username, name, class_name, roll, admission_no, gender, dob,
           guardian_name, phone, email, address
    FROM users WHERE role='student' ORDER BY class_name, roll`);
}
export function createStudent(u) {
  db.run(`
    INSERT INTO users (username, password_hash, role, name, class_name, roll,
      admission_no, gender, dob, guardian_name, phone, email, address)
    VALUES (?,?,'student',?,?,?,?,?,?,?,?,?,?)`,
    [u.username, u.passwordHash, u.name, u.className, u.roll ?? null,
     u.admissionNo || null, u.gender || null, u.dob || null, u.guardianName || null,
     u.phone || null, u.email || null, u.address || null]);
  return db.get("SELECT id FROM users WHERE username=?", [u.username]).id;
}
export function updateStudent(id, u) {
  db.run(`
    UPDATE users SET name=?, class_name=?, roll=?, admission_no=?, gender=?, dob=?,
      guardian_name=?, phone=?, email=?, address=?
    WHERE id=? AND role='student'`,
    [u.name, u.className, u.roll ?? null, u.admissionNo || null, u.gender || null, u.dob || null,
     u.guardianName || null, u.phone || null, u.email || null, u.address || null, id]);
}
export function deleteStudent(id) {
  db.run("BEGIN");
  try {
    db.run("DELETE FROM marks WHERE student_id=?", [id]);
    db.run("DELETE FROM attendance WHERE student_id=?", [id]);
    db.run("DELETE FROM submissions WHERE student_id=?", [id]);
    db.run("DELETE FROM fees WHERE student_id=?", [id]);
    db.run("DELETE FROM documents WHERE student_id=?", [id]);
    db.run("DELETE FROM users WHERE id=? AND role='student'", [id]);
    db.run("COMMIT");
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}

// ---- admin: staff (teachers + accountant) ----
export function allStaff() {
  return db.all(`
    SELECT id, username, name, role, employee_id, designation, phone, email, joining_date
    FROM users WHERE role IN ('teacher','accountant') ORDER BY role, name`);
}
export function createStaff(u) {
  db.run(`
    INSERT INTO users (username, password_hash, role, name, employee_id, designation, phone, email, joining_date)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [u.username, u.passwordHash, u.role, u.name, u.employeeId || null, u.designation || null,
     u.phone || null, u.email || null, u.joiningDate || null]);
  return db.get("SELECT id FROM users WHERE username=?", [u.username]).id;
}
export function updateStaff(id, u) {
  db.run(`
    UPDATE users SET name=?, employee_id=?, designation=?, phone=?, email=?, joining_date=?
    WHERE id=? AND role IN ('teacher','accountant')`,
    [u.name, u.employeeId || null, u.designation || null, u.phone || null, u.email || null,
     u.joiningDate || null, id]);
}
// Throws if the staff member is still referenced by their own historical
// records (assignments/notices/documents) — the FK constraint rejects it.
export function deleteStaff(id) {
  db.run("DELETE FROM teaching WHERE teacher_id=?", [id]);
  db.run("DELETE FROM users WHERE id=? AND role IN ('teacher','accountant')", [id]);
}

// ---- admin: teaching assignments (which class+subject a teacher teaches) ----
export function teachingForTeacher(teacherId) {
  return db.all("SELECT id, class_name, subject FROM teaching WHERE teacher_id=? ORDER BY class_name, subject",
    [teacherId]);
}
export function addTeaching(teacherId, className, subject) {
  const existing = db.get("SELECT id FROM teaching WHERE teacher_id=? AND class_name=? AND subject=?",
    [teacherId, className, subject]);
  if (!existing)
    db.run("INSERT INTO teaching (teacher_id, class_name, subject) VALUES (?,?,?)", [teacherId, className, subject]);
}
export function removeTeaching(id) {
  db.run("DELETE FROM teaching WHERE id=?", [id]);
}

// ---- admin: classes ----
export function allClassesWithCounts() {
  return db.all(`
    SELECT c.id, c.name, c.class_teacher_id, u.name AS class_teacher_name,
      (SELECT COUNT(*) FROM users s WHERE s.role='student' AND s.class_name=c.name) AS student_count
    FROM classes c LEFT JOIN users u ON u.id=c.class_teacher_id
    ORDER BY c.name`);
}
export function classById(id) {
  return db.get("SELECT * FROM classes WHERE id=?", [id]) || null;
}
export function createClass(name, classTeacherId) {
  db.run("INSERT INTO classes (name, class_teacher_id) VALUES (?,?)", [name, classTeacherId || null]);
  return db.get("SELECT id FROM classes WHERE name=?", [name]).id;
}
// Renaming cascades class_name across every table that stores it as free text.
export function updateClass(id, name, classTeacherId) {
  const cls = classById(id);
  if (!cls) return;
  db.run("BEGIN");
  try {
    if (name && name !== cls.name) {
      db.run("UPDATE users SET class_name=? WHERE class_name=?", [name, cls.name]);
      db.run("UPDATE teaching SET class_name=? WHERE class_name=?", [name, cls.name]);
      db.run("UPDATE assignments SET class_name=? WHERE class_name=?", [name, cls.name]);
    }
    db.run("UPDATE classes SET name=?, class_teacher_id=? WHERE id=?",
      [name || cls.name, classTeacherId ?? cls.class_teacher_id, id]);
    db.run("COMMIT");
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}
export function deleteClass(id) {
  db.run("DELETE FROM classes WHERE id=?", [id]);
}

// ---- admin: examinations ----
export function distinctExams() {
  return db.all(`
    SELECT DISTINCT u.class_name, m.exam
    FROM marks m JOIN users u ON u.id=m.student_id
    WHERE u.role='student'
    ORDER BY u.class_name, m.exam`);
}
export function examResults(className, exam) {
  return db.all(`
    SELECT u.id, u.name, u.roll, SUM(m.score) AS total, SUM(m.max_score) AS max_total
    FROM users u JOIN marks m ON m.student_id=u.id AND m.exam=?
    WHERE u.role='student' AND u.class_name=?
    GROUP BY u.id ORDER BY u.roll`, [exam, className]);
}

// ---- admin: attendance overview (read-only) ----
export function attendanceOverview(className, date) {
  return db.all(`
    SELECT u.id, u.name, u.roll, a.present
    FROM users u LEFT JOIN attendance a ON a.student_id=u.id AND a.date=?
    WHERE u.role='student' AND u.class_name=?
    ORDER BY u.roll`, [date, className]);
}

// ---- admin: settings ----
export function getSettings() {
  const rows = db.all("SELECT key, value FROM settings");
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}
export function updateSettings(obj) {
  for (const [key, value] of Object.entries(obj || {})) {
    const existing = db.get("SELECT key FROM settings WHERE key=?", [key]);
    if (existing) db.run("UPDATE settings SET value=? WHERE key=?", [value, key]);
    else db.run("INSERT INTO settings (key, value) VALUES (?,?)", [key, value]);
  }
}

export default db;
