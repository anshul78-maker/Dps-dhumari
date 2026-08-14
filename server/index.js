import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import "./db.js"; // initialises + seeds the database on import
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import teacherRoutes from "./routes/teacher.js";
import accountantRoutes from "./routes/accountant.js";
import noticeRoutes from "./routes/notices.js";
import fileRoutes from "./routes/files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();

// The frontend is served from this same origin, so cross-origin API calls
// aren't needed. Keep CORS off by default; opt in with CORS_ORIGIN if you
// ever host the API separately.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}

// Baseline security headers (no extra dependency needed).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // inline style attributes are used throughout; Google Fonts stylesheet
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      // no inline scripts — this blocks injected <script> even if any slips in
      "script-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join("; ")
  );
  next();
});

// Most requests are tiny JSON, capped at 100kb. PDF-upload endpoints send a
// base64 file, so those few paths get a larger 8mb cap.
const bigJson = express.json({ limit: "8mb" });
const smallJson = express.json({ limit: "100kb" });
app.use((req, res, next) => {
  if (/\/(submit|report-cards|tc)$/.test(req.path)) return bigJson(req, res, next);
  return smallJson(req, res, next);
});

// API
app.use("/api", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/accountant", accountantRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/files", fileRoutes);

// Static site
app.use(express.static(path.join(__dirname, "..", "public")));

// Any non-API route serves the app shell (so refresh works)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

function start(port, triesLeft = 10) {
  const server = app.listen(port, () => {
    console.log(`\n  Dhumari Public School ERP running`);
    console.log(`  Open  http://localhost:${port}\n`);
    console.log(`  Demo logins:`);
    console.log(`    Student     ->  nursery-a-1 / student123`);
    console.log(`    Teacher     ->  t3201744    / teacher123`);
    console.log(`    Accountant  ->  nair        / nair123\n`);
    console.log(`  Press Ctrl+C to stop.\n`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (triesLeft > 0) {
        console.log(`  Port ${port} is busy — trying ${port + 1} instead...`);
        start(port + 1, triesLeft - 1);
      } else {
        console.error(`\n  Could not find a free port near ${PORT}.`);
        console.error(`  Another copy of the server is probably already running.`);
        console.error(`  Just open http://localhost:${PORT} in your browser,`);
        console.error(`  or stop the old one with Ctrl+C in its terminal.\n`);
        process.exit(1);
      }
    } else {
      throw err;
    }
  });
}

start(PORT);
