// PDF upload storage — no external dependency.
// The browser sends a file as a base64 data URL inside a normal JSON body;
// we validate it's really a PDF, cap the size, and write it to /uploads
// under a random name. Downloads are served back through authenticated routes.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Accepts a data URL ("data:application/pdf;base64,....") or raw base64.
// Returns { storedName, size } or throws an error carrying a .status.
export function savePdfFromDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl) throw httpErr(400, "No file provided");

  const comma = dataUrl.indexOf(",");
  const meta = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (meta && !/application\/pdf/i.test(meta))
    throw httpErr(400, "Only PDF files are allowed");

  let buf;
  try { buf = Buffer.from(b64, "base64"); }
  catch { throw httpErr(400, "The file could not be read"); }

  if (!buf.length) throw httpErr(400, "The file is empty");
  if (buf.length > MAX_PDF_BYTES) throw httpErr(413, "PDF must be under 5 MB");
  // Real PDFs start with the magic bytes "%PDF-"
  if (buf.slice(0, 5).toString("latin1") !== "%PDF-")
    throw httpErr(400, "That file doesn't look like a PDF");

  const storedName = crypto.randomUUID() + ".pdf";
  fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buf);
  return { storedName, size: buf.length };
}

// Absolute path to a stored file (guards against path traversal).
export function pdfPath(storedName) {
  return path.join(UPLOADS_DIR, path.basename(storedName || ""));
}

export function deletePdf(storedName) {
  if (!storedName) return;
  try { fs.unlinkSync(pdfPath(storedName)); } catch { /* already gone */ }
}
