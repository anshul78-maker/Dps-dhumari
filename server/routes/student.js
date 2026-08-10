import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import {
  getUserById, studentMarks, studentAttendance,
  studentAssignments, toggleSubmission, studentFees, classmates, classMarks,
  assignmentById, submitAssignmentFile, documentsForStudent
} from "../db.js";
import { savePdfFromDataUrl, deletePdf } from "../files.js";

const router = Router();
router.use(requireAuth, requireRole("student"));

// Overall % for one student: latest score per subject, averaged.
function overallFromMarks(rows) {
  const latestBySubject = {};
  for (const m of rows) latestBySubject[m.subject] = m; // rows are oldest->newest
  const pcts = Object.values(latestBySubject)
    .map(m => (m.max_score ? (m.score / m.max_score) * 100 : 0));
  return pcts.length ? pcts.reduce((s, x) => s + x, 0) / pcts.length : 0;
}

// Build the whole dashboard payload.
router.get("/dashboard", (req, res) => {
  const me = getUserById(req.user.id);
  const marks = studentMarks(me.id);
  const att = studentAttendance(me.id);

  // ----- overall average (latest exam per subject) -----
  const bySubject = {};
  for (const m of marks) {
    (bySubject[m.subject] ||= []).push(m);
  }
  const subjectScores = Object.entries(bySubject).map(([subject, rows]) => {
    const latest = rows[rows.length - 1];
    const pct = Math.round((latest.score / latest.max_score) * 100);
    const first = rows[0];
    const firstPct = Math.round((first.score / first.max_score) * 100);
    return { subject, score: pct, change: pct - firstPct };
  });
  const overall = subjectScores.length
    ? Math.round(subjectScores.reduce((s, x) => s + x.score, 0) / subjectScores.length)
    : 0;

  // ----- growth trend: class average % across the exams (in order) -----
  const examOrder = [];
  const examTotals = {};
  for (const m of marks) {
    if (!examTotals[m.exam]) { examTotals[m.exam] = { sum: 0, n: 0 }; examOrder.push(m.exam); }
    examTotals[m.exam].sum += (m.score / m.max_score) * 100;
    examTotals[m.exam].n += 1;
  }
  const trend = examOrder.map(e => [e, Math.round(examTotals[e].sum / examTotals[e].n)]);

  // ----- attendance % -----
  const present = att.filter(a => a.present).length;
  const attendance = att.length ? Math.round((present / att.length) * 100) : 0;

  // ----- rank within class (by overall latest average) -----
  const peers = classmates(me.class_name);
  const classRows = classMarks(me.class_name);
  const byStudent = {};
  for (const r of classRows) (byStudent[r.student_id] ||= []).push(r);
  const standings = peers
    .map(p => ({ id: p.id, avg: overallFromMarks(byStudent[p.id] || []) }))
    // higher average first; ties keep a stable order by id
    .sort((a, b) => b.avg - a.avg || a.id - b.id);
  const rank = {
    position: standings.findIndex(s => s.id === me.id) + 1,
    total: peers.length
  };

  res.json({
    name: me.name,
    className: me.class_name,
    roll: me.roll,
    overall,
    attendance,
    trend,             // [["Unit Test 1", 66], ...] for the growth line
    subjects: subjectScores,
    rank
  });
});

// Full marks table (per subject, per exam)
router.get("/marks", (req, res) => {
  res.json({ marks: studentMarks(req.user.id) });
});

// Assignments for my class
router.get("/assignments", (req, res) => {
  const me = getUserById(req.user.id);
  res.json({ assignments: studentAssignments(me.class_name, me.id) });
});

router.post("/assignments/:id/toggle", (req, res) => {
  const done = req.body?.done ? 1 : 0;
  toggleSubmission(Number(req.params.id), req.user.id, done);
  res.json({ ok: true, done });
});

// Upload (or replace) a PDF submission for an assignment in my class.
router.post("/assignments/:id/submit", (req, res) => {
  const me = getUserById(req.user.id);
  const a = assignmentById(Number(req.params.id));
  if (!a || a.class_name !== me.class_name)
    return res.status(404).json({ error: "Assignment not found" });

  let saved;
  try { saved = savePdfFromDataUrl(req.body?.file); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  const name = String(req.body?.name || "assignment.pdf").slice(0, 120);
  const prev = submitAssignmentFile(a.id, me.id, saved.storedName, name);
  if (prev && prev.file_name) deletePdf(prev.file_name); // remove the old file
  res.json({ ok: true });
});

// Report cards and certificates issued to me
router.get("/documents", (req, res) => {
  res.json({ documents: documentsForStudent(req.user.id) });
});

// Fees
router.get("/fees", (req, res) => {
  const rows = studentFees(req.user.id);
  const due = rows.filter(f => f.status === "due").reduce((s, f) => s + f.amount, 0);
  res.json({ fees: rows, totalDue: due });
});

export default router;
