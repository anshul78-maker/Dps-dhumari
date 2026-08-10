# Dhumari Public School — ERP

A full-stack school ERP with three roles — **Student, Teacher, Accountant** —
sharing one database. No AI. Plain Node.js + Express + SQLite backend and
vanilla HTML/CSS/JS frontend, so it runs anywhere with nothing to compile.
Themed in the school's crimson-and-gold crest colours.

---

## Run it in VS Code (about 3 minutes)

You need [Node.js](https://nodejs.org) version 20 or newer.

1. Open this folder in **VS Code** (File → Open Folder).
2. Open the terminal: **Terminal → New Terminal**.
3. Install dependencies:
   ```
   npm install
   ```
4. (Optional) set a login secret. On Windows PowerShell:
   ```
   $env:JWT_SECRET="any-long-random-text"
   ```
   Or just copy `.env.example` to `.env` and edit it. If you skip this, it
   still runs with a default secret.
5. Start the app:
   ```
   npm start
   ```
6. Open **http://localhost:3000** in your browser.

Stop the server with **Ctrl + C** in the terminal.

---

## Demo logins

| Role        | Username | Password  |
|-------------|----------|-----------|
| Student     | `priya`  | `priya123`|
| Teacher     | `verma`  | `verma123`|
| Accountant  | `nair`   | `nair123` |

Extra students for testing: `arjun` / `arjun123`, `sara` / `sara123`.
Second teacher (English & Social Studies): `iyer` / `iyer123`.

---

## What each role can do

**Student** (sees only their own data)
- Dashboard: overall average, attendance ring, **real class rank** (by latest
  average), and a **marks-growth line** across the year's exams
- Subject scores (latest)
- Assignments for their class — **upload a PDF to submit** (shows "Submitted")
- Report Card — view/download report-card PDFs sent by teachers
- Certificates — view/download a Transfer Certificate issued by the accountant
- Notices — school-wide and class announcements
- Fees — what's due and what's paid

**Teacher** (only their assigned classes/subjects)
- See classes and subjects they teach
- Mark attendance for a class on a date
- Enter an exam mark for a student (validated: 0 ≤ score ≤ total, and the
  student must be in that class)
- Create assignments for a class they teach
- **Submissions** — see who has submitted and open each student's PDF
- **Report Cards** — upload a report-card PDF to a student in their class
- Post notices to the whole school or a specific class

**Accountant**
- See all dues and payments, with totals collected / outstanding
- Mark any fee as paid (the student sees it update)
- Add a fee to one student, or to a whole class at once
- **Transfer Certificate** — upload a TC PDF to a student, who can then view it
- Post notices to the whole school or a specific class

Everything shares one database, so a change by one role shows up for another —
e.g. the accountant marking a fee paid clears it on the student's screen, and a
teacher's new mark moves the student's growth line.

---

## Project layout

```
school-erp/
├── server/
│   ├── index.js            Express server (API + serves the site)
│   ├── db.js               SQLite schema, seeding, and all queries
│   ├── auth.js             JWT login tokens + role guards
│   ├── files.js            PDF upload validation + on-disk storage
│   └── routes/
│       ├── auth.js         POST /api/login (rate-limited)
│       ├── student.js      dashboard, assignments (+PDF submit), documents, fees
│       ├── teacher.js      classes, attendance, marks, assignments, submissions, report cards
│       ├── accountant.js   fees overview, add fee, mark paid, transfer certificates
│       ├── notices.js      list / post / delete notices (shared)
│       └── files.js        authenticated PDF downloads (submissions + documents)
├── public/                 the website the browser loads
│   ├── login.html
│   ├── index.html          app shell (sidebar changes per role)
│   ├── css/styles.css
│   └── js/                 api.js, login.js, app.js, notices.js,
│                           student.js, teacher.js, accountant.js
├── uploads/                stored PDF files (created on first upload)
├── seed/data.js            all demo data — edit, then `npm run seed`
├── .env.example
└── package.json
```

---

## Common tasks

- **Change demo data** (students, marks, fees): edit `seed/data.js`, then
  `npm run seed` to reset the database to it.
- **Reset everything:** delete `data.db` and restart, or run `npm run seed`.
- **Add a student:** add an entry to `users` in `seed/data.js` with
  `role: "student"`, then `npm run seed`.

---

## Security built in

- **Login rate limiting** — max 10 attempts per IP in a 15-minute window
  (returns HTTP 429), reset on a successful sign-in.
- **Output escaping** — all user-entered text (names, titles, notices…) is
  HTML-escaped before rendering, so a value like `<script>` can't run in
  another user's browser (no stored XSS).
- **Security headers** — a Content-Security-Policy (`script-src 'self'`, so
  injected inline scripts don't execute), plus `X-Frame-Options`,
  `X-Content-Type-Options` and `Referrer-Policy`.
- **Server-side validation** — marks must be 0…total for a student who's
  actually in the class; fees must be a positive amount.
- **PDF uploads are checked** — server verifies the `%PDF` magic bytes and caps
  size at 5 MB; files are stored under random names (no path traversal).
- **Downloads are authorised** — a PDF is served only to the student it belongs
  to or the relevant staff member; the login token travels in the request
  header, never in the URL.
- **CORS off by default** — the frontend and API share one origin; enable
  cross-origin only by setting `CORS_ORIGIN`.

## Before a real school uses this

This is a solid working foundation, not a hardened product. For real use, still
add HTTPS, a managed database (Postgres) with backups, and a privacy policy —
it holds children's data, which is regulated in most places.
