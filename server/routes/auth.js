import { Router } from "express";
import { getUserByUsername } from "../db.js";
import { verifyPassword, signToken } from "../auth.js";

const router = Router();

// ---- simple in-memory login rate limiter ----
// Blocks brute-force guessing: max attempts per IP inside a rolling window.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
const attempts = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  let rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, rec);
  }
  if (rec.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((rec.resetAt - now) / 60000);
    return res.status(429).json({ error: `Too many attempts. Try again in ${mins} min.` });
  }
  rec.count++;
  next();
}

// Occasionally drop expired entries so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of attempts) if (now > rec.resetAt) attempts.delete(ip);
}, WINDOW_MS).unref?.();

router.post("/login", rateLimit, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Enter your username and password" });

  const user = getUserByUsername(String(username).trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash))
    return res.status(401).json({ error: "Wrong username or password" });

  // Successful sign-in clears this IP's failed-attempt count.
  attempts.delete(req.ip || req.socket?.remoteAddress || "unknown");

  const token = signToken(user);
  res.json({ token, name: user.name, role: user.role });
});

export default router;
