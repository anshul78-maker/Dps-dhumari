import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import {
  getUserById, teacherClasses, teacherTeaches, classmates,
  saveMark, markAttendance, createAssignment,
  teacherAssignments, assignmentSubmissions,
  studentsForTeacher, studentInTeacherClass, addDocument
} from "../db.js";
import { savePdfFromDataUrl } from "../files.js";

const router = Router();
router.use(requireAuth, requireRole("teacher"));

// My classes + subjects
router.get("/overview", (req, res) => {
  const me = getUserById(req.user.id);
  res.json({ name: me.name, classes: teacherClasses(me.id) });
});

// Students in one of my classes
router.get("/class", (req, res) => {
  const { className } = req.query;
  res.json({ students: classmates(className) });
});

// Save a mark for a student (must teach that class+subject)
router.post("/marks", (req, res) => {
  const { studentId, className, subject, exam, score, max } = req.body || {};
  if (!teacherTeaches(req.user.id, className, subject))
    return res.status(403).json({ error: "You don't teach this class/subject" });
  if (score == null || !String(exam || "").trim())
    return res.status(400).json({ error: "Exam and score required" });

  // The student must actually be in this class.
  const student = getUserById(Number(studentId));
  if (!student || student.role !== "student" || student.class_name !== className)
    return res.status(400).json({ error: "That student is not in this class" });

  const s = Number(score), m = Number(max) || 100;
  if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0)
    return res.status(400).json({ error: "Score and total must be numbers" });
  if (s < 0 || s > m)
    return res.status(400).json({ error: `Score must be between 0 and ${m}` });

  saveMark(student.id, subject, String(exam).trim(), s, m);
  res.json({ ok: true });
});

// Mark attendance for a list of students on a date
router.post("/attendance", (req, res) => {
  const { date, records } = req.body || {};
  if (!date || !Array.isArray(records))
    return res.status(400).json({ error: "date and records required" });
  for (const r of records) markAttendance(Number(r.studentId), date, r.present ? 1 : 0);
  res.json({ ok: true, count: records.length });
});

// Create an assignment for a class I teach
router.post("/assignments", (req, res) => {
  const { title, className, subject, details, due } = req.body || {};
  if (!teacherTeaches(req.user.id, className, subject))
    return res.status(403).json({ error: "You don't teach this class/subject" });
  if (!title) return res.status(400).json({ error: "Title required" });
  createAssignment(title, className, subject, details || "", due || null, req.user.id);
  res.json({ ok: true });
});

// My assignments (to review who has submitted)
router.get("/assignments", (req, res) => {
  res.json({ assignments: teacherAssignments(req.user.id) });
});

// The submissions for one of my assignments
router.get("/assignments/:id/submissions", (req, res) => {
  const { assignment, rows } = assignmentSubmissions(Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });
  if (!teacherTeaches(req.user.id, assignment.class_name, assignment.subject))
    return res.status(403).json({ error: "That isn't your assignment" });
  res.json({
    assignment: {
      id: assignment.id, title: assignment.title,
      class_name: assignment.class_name, subject: assignment.subject
    },
    rows
  });
});

// Students across the classes I teach (for report cards)
router.get("/students", (req, res) => {
  res.json({ students: studentsForTeacher(req.user.id) });
});

// Send a report-card PDF to one of my students
router.post("/report-cards", (req, res) => {
  const sid = Number(req.body?.studentId);
  if (!studentInTeacherClass(req.user.id, sid))
    return res.status(403).json({ error: "That student isn't in a class you teach" });

  let saved;
  try { saved = savePdfFromDataUrl(req.body?.file); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  const me = getUserById(req.user.id);
  const title = String(req.body?.title || "Report card").slice(0, 120);
  const name = String(req.body?.name || "report-card.pdf").slice(0, 120);
  addDocument(sid, "report_card", title, saved.storedName, name, saved.size, me.id, me.name);
  res.json({ ok: true });
});

export default router;
