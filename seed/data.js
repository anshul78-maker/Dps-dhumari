// All starting data for the ERP. Loaded into the database on first run.
//
// Students and teachers are the school's REAL roster, imported from the office
// spreadsheets into seed/students.json and seed/teachers.json. Sensitive fields
// (Aadhaar, home address, caste, bank account, IFSC) are intentionally NOT
// imported. To refresh from new spreadsheets, regenerate those JSON files and
// run `npm run seed`.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf-8"));

const students = readJson("students.json"); // [{username,password,role,name,className,roll,admissionNo,gender,dob,guardianName,motherName,phone}]
const teachers = readJson("teachers.json"); // [{username,password,role,name,employeeId,gender,dob,designation,qualification,gradesTaught}]

// -------------------- USERS --------------------
// role is one of: "student", "teacher", "accountant". (No "admin" role.)
// Passwords are hashed automatically on seed.

// One office/accountant login for the fees & certificates desk.
const accountant = {
  username: "nair", password: "nair123", role: "accountant", name: "Office (Accounts)",
  employeeId: "EMP-201", designation: "Accountant", email: "office@dpsdhumari.edu", joiningDate: "2016-09-01"
};

export const users = [...teachers, accountant, ...students];

// -------------------- CLASSES --------------------
// Distinct classes the school runs, taken from the student roster and sorted in
// natural school order (Nursery → LKG → UKG → Class 1 … Class 12, section A→C).
function classSortKey(name) {
  const pre = { "Nursery": 0, "LKG": 1, "UKG": 2 };
  const m = name.match(/^(Nursery|LKG|UKG|Class\s+(\d+))-([A-Z])$/);
  if (!m) return [99, 0, name];
  const grade = m[2] ? 2 + Number(m[2]) : pre[m[1]];
  const section = m[3].charCodeAt(0);
  return [grade, section, ""];
}
const classNames = [...new Set(students.map(s => s.className))]
  .sort((a, b) => {
    const ka = classSortKey(a), kb = classSortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || String(ka[2]).localeCompare(String(kb[2]));
  });
export const classes = classNames.map(name => ({ name, classTeacher: null }));

// -------------------- WHO TEACHES WHAT --------------------
// Each teacher's spreadsheet lists the grades they teach (e.g. ["8","9","10"]).
// We map each grade to that grade's actual sections and assign a placeholder
// "General" subject — teachers can add real subjects/marks from their dashboard.
const bySection = {}; // grade number -> ["Class 8-A", "Class 8-B", ...]
for (const name of classNames) {
  const m = name.match(/^Class\s+(\d+)-[A-Z]$/);
  if (m) (bySection[m[1]] ||= []).push(name);
}
export const subjects = ["General"];
export const teaching = [];
for (const t of teachers) {
  const seen = new Set();
  for (const g of (t.gradesTaught || [])) {
    for (const cls of (bySection[g] || [])) {
      if (seen.has(cls)) continue;
      seen.add(cls);
      teaching.push({ teacher: t.username, className: cls, subject: "General" });
    }
  }
}

// -------------------- ACADEMIC DATA --------------------
// Starts empty — teachers enter marks/attendance/assignments and the accountant
// adds fees from within the app for the real students.
export const exams = [];
export const marks = [];
export const attendance = [];
export const assignments = [];
export const fees = [];

// -------------------- SCHOOL SETTINGS --------------------
export const settings = {
  school_name: "Dhumari Public School",
  address: "Dhumari, Etah, Uttar Pradesh",
  session_year: "2026-27",
  logo_text: "DPS"
};

// -------------------- NOTICES --------------------
// author username, title, message, audience ("all" or a class name).
export const notices = [
  ["nair", "Welcome to the DPS ERP",
    "The new school ERP is live. Teachers can mark attendance and enter marks; the accounts desk manages fees and certificates.",
    "all"]
];
