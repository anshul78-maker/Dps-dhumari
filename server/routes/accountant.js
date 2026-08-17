import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import {
  allStudents, studentsRoster, addFee, addFeeToClass, markFeePaid, allFees, getFeeById,
  getUserById, addDocument, documentsByType
} from "../db.js";
import { savePdfFromDataUrl } from "../files.js";

// A positive whole-rupee amount, or null if invalid.
function cleanAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

const router = Router();
router.use(requireAuth, requireRole("accountant"));

// Everything the accountant needs on one screen
router.get("/overview", (req, res) => {
  const fees = allFees();
  const totalDue = fees.filter(f => f.status === "due").reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  res.json({ students: allStudents(), fees, totalDue, totalPaid });
});

// Full student roster for the Students table
router.get("/students", (req, res) => {
  res.json({ students: studentsRoster() });
});

// Add a fee to a single student
router.post("/fees", (req, res) => {
  const { studentId, title, amount, period } = req.body || {};
  const amt = cleanAmount(amount);
  if (!studentId || !String(title || "").trim() || amt == null)
    return res.status(400).json({ error: "Student, title and a positive amount are required" });
  addFee(Number(studentId), String(title).trim(), amt, String(period || "").trim());
  res.json({ ok: true });
});

// Add a fee to a whole class at once
router.post("/fees/class", (req, res) => {
  const { className, title, amount, period } = req.body || {};
  const amt = cleanAmount(amount);
  if (!className || !String(title || "").trim() || amt == null)
    return res.status(400).json({ error: "Class, title and a positive amount are required" });
  const count = addFeeToClass(className, String(title).trim(), amt, String(period || "").trim());
  res.json({ ok: true, count });
});

// Mark a fee paid
router.post("/fees/:id/paid", (req, res) => {
  const fee = getFeeById(Number(req.params.id));
  if (!fee) return res.status(404).json({ error: "Fee not found" });
  markFeePaid(fee.id);
  res.json({ ok: true });
});

// Issue a Transfer Certificate (PDF) to a student — the student can then see it
router.post("/tc", (req, res) => {
  const student = getUserById(Number(req.body?.studentId));
  if (!student || student.role !== "student")
    return res.status(400).json({ error: "Pick a valid student" });

  let saved;
  try { saved = savePdfFromDataUrl(req.body?.file); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  const me = getUserById(req.user.id);
  const title = String(req.body?.title || "Transfer Certificate").slice(0, 120);
  const name = String(req.body?.name || "tc.pdf").slice(0, 120);
  addDocument(student.id, "tc", title, saved.storedName, name, saved.size, me.id, me.name);
  res.json({ ok: true });
});

// All transfer certificates issued so far
router.get("/documents", (req, res) => {
  res.json({ documents: documentsByType("tc") });
});

export default router;
