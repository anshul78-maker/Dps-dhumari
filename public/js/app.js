// ---------- shared helpers (used by role modules) ----------
// Escape anything user-entered before putting it inside innerHTML.
// Teachers, the accountant and students all type free text (titles, names,
// notices…) that other people's browsers render — without this, a value like
// "<img src=x onerror=alert(1)>" would run as script (stored XSS).
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const view = () => document.getElementById("view");
const setTitle = (t, sub = "") => {
  document.getElementById("pageTitle").textContent = t;
  document.getElementById("pageSub").textContent = sub;
};
let _toastTimer;
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
function initials(name) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ---------- PDF upload helpers (shared by student/teacher/accountant) ----------
const MAX_PDF_MB = 5;
// Returns an error string if the file isn't an acceptable PDF, else null.
function validatePdf(file) {
  if (!file) return "Choose a PDF first";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are allowed";
  if (file.size > MAX_PDF_MB * 1024 * 1024) return `PDF must be under ${MAX_PDF_MB} MB`;
  return null;
}
// Read a File as a base64 data URL ("data:application/pdf;base64,…").
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsDataURL(file);
  });
}
// Friendly file size, e.g. "384 KB".
function fileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  return bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + " KB"
    : (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
// "2026-08-07 09:12:00" (UTC from SQLite) -> friendly local date.
function niceDate(s) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T") + "Z");
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Small inline SVG line chart for marks growth. points = [[label, value], ...]
function lineChart(points, { max = 100 } = {}) {
  const W = 520, H = 200, padL = 34, padB = 26, padT = 12, padR = 12;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = points.length;
  const x = i => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => padT + ih - (v / max) * ih;
  let path = "", area = "", dots = "", labels = "";
  points.forEach(([lab, v], i) => {
    path += (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(v).toFixed(1) + " ";
    dots += `<circle class="chart-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4"/>`;
    dots += `<text class="chart-val" x="${x(i).toFixed(1)}" y="${(y(v) - 10).toFixed(1)}" text-anchor="middle">${v}</text>`;
    labels += `<text class="chart-lab" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(lab)}</text>`;
  });
  // soft filled area under the line
  if (n > 1) {
    area = `M${x(0).toFixed(1)} ${y(points[0][1]).toFixed(1)} `
      + points.slice(1).map(([, v], i) => `L${x(i + 1).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
      + ` L${x(n - 1).toFixed(1)} ${(padT + ih).toFixed(1)} L${x(0).toFixed(1)} ${(padT + ih).toFixed(1)} Z`;
  }
  const grid = [0, 25, 50, 75, 100].map(g =>
    `<line class="chart-grid" x1="${padL}" x2="${W - padR}" y1="${y(g)}" y2="${y(g)}"/>` +
    `<text class="chart-axis" x="${padL - 6}" y="${(y(g) + 3).toFixed(1)}" text-anchor="end">${g}</text>`
  ).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Marks growth line chart">
    ${grid}
    ${area ? `<path class="chart-area" d="${area}"/>` : ""}
    <path class="chart-line" d="${path}" fill="none"/>
    ${dots}${labels}
  </svg>`;
}

// Small SVG donut for a single percentage (0–100).
function ring(pct, label = "") {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const r = 52, c = 2 * Math.PI * r;
  const off = c * (1 - p / 100);
  return `<svg class="ring" viewBox="0 0 140 140" role="img" aria-label="${esc(label)} ${p} percent">
    <circle class="ring-track" cx="70" cy="70" r="${r}" fill="none" stroke-width="14"/>
    <circle class="ring-value" cx="70" cy="70" r="${r}" fill="none" stroke-width="14"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 70 70)"/>
    <text class="ring-num" x="70" y="70" text-anchor="middle" dominant-baseline="central">${p}%</text>
    ${label ? `<text class="ring-lab" x="70" y="94" text-anchor="middle">${esc(label)}</text>` : ""}
  </svg>`;
}

// ---------- boot ----------
document.getElementById("logout").addEventListener("click", () => {
  API.clear();
  location.href = "/login.html";
});

(function boot() {
  const token = API.token();
  const role = API.role();
  const name = API.name();
  if (!token || !role) { location.href = "/login.html"; return; }

  // header + identity
  const d = new Date();
  document.getElementById("dateline").textContent =
    d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("meName").textContent = name || "User";
  document.getElementById("meRole").textContent = role;
  document.getElementById("meIni").textContent = initials(name || "U");
  document.getElementById("roleLabel").textContent =
    role.charAt(0).toUpperCase() + role.slice(1);

  const modules = { student: StudentApp, teacher: TeacherApp, accountant: AccountantApp };
  const mod = modules[role];
  if (!mod) { toast("Unknown role"); return; }

  // build nav
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  mod.pages.forEach((p, i) => {
    const item = el("div", "nav-item" + (i === 0 ? " active" : ""),
      `<span class="nav-dot"></span> ${p.label}`);
    item.addEventListener("click", () => {
      nav.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
      item.classList.add("active");
      p.render();
    });
    nav.appendChild(item);
  });

  // first page
  mod.pages[0].render();
})();
