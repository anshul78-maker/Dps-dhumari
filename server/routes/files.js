// Authenticated PDF downloads. The browser fetches these with the login token
// in the Authorization header (never in the URL) and shows the file inline.
import { Router } from "express";
import fs from "fs";
import { requireAuth } from "../auth.js";
import { getSubmissionById, getDocumentById, teacherTeaches } from "../db.js";
import { pdfPath } from "../files.js";

const router = Router();
router.use(requireAuth);

function sendPdf(res, storedName, downloadName) {
  const p = pdfPath(storedName);
  if (!storedName || !fs.existsSync(p))
    return res.status(404).json({ error: "File not found" });
  const safe = String(downloadName || "file.pdf").replace(/[^\w.\- ]+/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safe}"`);
  res.sendFile(p);
}

// A student's assignment submission — the student who owns it, or a teacher
// who teaches that class+subject, may open it.
router.get("/submission/:id", (req, res) => {
  const s = getSubmissionById(Number(req.params.id));
  if (!s || !s.file_name) return res.status(404).json({ error: "File not found" });
  const u = req.user;
  const allowed =
    (u.role === "student" && u.id === s.student_id) ||
    (u.role === "teacher" && teacherTeaches(u.id, s.class_name, s.subject));
  if (!allowed) return res.status(403).json({ error: "Not allowed" });
  sendPdf(res, s.file_name, s.original_name || "submission.pdf");
});

// A report card or transfer certificate — the student it belongs to, or any
// staff member, may open it.
router.get("/document/:id", (req, res) => {
  const doc = getDocumentById(Number(req.params.id));
  if (!doc) return res.status(404).json({ error: "File not found" });
  const u = req.user;
  const allowed =
    (u.role === "student" && u.id === doc.student_id) ||
    u.role === "teacher" || u.role === "accountant";
  if (!allowed) return res.status(403).json({ error: "Not allowed" });
  sendPdf(res, doc.file_name, doc.original_name || (doc.title + ".pdf"));
});

export default router;
