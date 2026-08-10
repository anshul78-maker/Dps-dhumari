import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import {
  getUserById, noticesFor, createNotice, getNoticeById, deleteNotice
} from "../db.js";

const router = Router();
router.use(requireAuth);

// Anyone signed in can read the notices meant for them.
router.get("/", (req, res) => {
  const me = getUserById(req.user.id);
  res.json({ notices: noticesFor(me), role: me.role });
});

// Only staff (teacher or accountant) can post a notice.
router.post("/", requireRole("teacher", "accountant"), (req, res) => {
  const me = getUserById(req.user.id);
  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  const audience = String(req.body?.audience || "all").trim() || "all";
  if (!title || !body)
    return res.status(400).json({ error: "A title and a message are required" });
  if (title.length > 120)
    return res.status(400).json({ error: "Title is too long (max 120 characters)" });
  createNotice(title, body, audience, me.id, me.name);
  res.json({ ok: true });
});

// The author (or an accountant, as admin) can remove a notice.
router.delete("/:id", requireRole("teacher", "accountant"), (req, res) => {
  const notice = getNoticeById(Number(req.params.id));
  if (!notice) return res.status(404).json({ error: "Notice not found" });
  if (notice.author_id !== req.user.id && req.user.role !== "accountant")
    return res.status(403).json({ error: "You can only remove your own notices" });
  deleteNotice(notice.id);
  res.json({ ok: true });
});

export default router;
