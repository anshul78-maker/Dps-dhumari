# DPS Dhumari — School ERP Specification

**Project:** Delhi Public School, Dhumari — Enterprise Resource Planning system
**Version:** 1.0
**Status:** Working prototype (single-file web app, runs in any browser)

---

## 1. Overview

The DPS Dhumari School ERP is a browser-based management system that lets school
staff manage students, teachers, attendance, fees, classes, and examinations from
one dashboard. The working prototype runs entirely in the browser and saves all
data on the local device (no server or internet required). It can later be upgraded
to a full-stack app with a shared database.

---

## 2. Modules & Features

### 2.1 Dashboard
- At-a-glance counts: total students, total staff, classes, fees collected vs. pending.
- Today's attendance summary (present / absent).
- Quick links to every module.

### 2.2 Students
- Add, edit, delete student records.
- Fields: name, admission no., class/section, roll no., gender, date of birth,
  guardian name, contact phone, address.
- Search and filter by name or class.

### 2.3 Staff / Teachers
- Add, edit, delete staff records.
- Fields: name, employee ID, designation, subject, phone, email, joining date.
- Search by name or designation.

### 2.4 Classes & Sections
- Define classes (e.g. Nursery–XII) and sections (A, B, C).
- Assign a class teacher.
- View student count per class.

### 2.5 Attendance
- Mark daily attendance per class (present / absent).
- Pick a date and class, then toggle each student.
- Saved per date; view past attendance summaries.

### 2.6 Fees
- Record fee structure per class (tuition, transport, etc.).
- Log payments against a student (amount, date, mode, receipt no.).
- Track paid vs. pending; generate a simple receipt view.

### 2.7 Examinations & Results
- Create exams (name, class, subject, max marks, date).
- Enter marks per student.
- Auto-calculate percentage and pass/fail; simple report card view.

### 2.8 Settings / Data
- School profile (name, address, session year, logo text).
- Export all data to a JSON backup file.
- Import data from a JSON backup file.
- Reset / clear all data.

---

## 3. Technical Design (Prototype)

- **Single HTML file** (`index.html`) — HTML + CSS + JavaScript, no build step.
- **Storage:** browser `localStorage` (persists between sessions on the same device).
- **No dependencies / no internet required** — open the file in any browser.
- **Responsive layout** — works on desktop and tablet.

---

## 4. Roadmap (Future Upgrades)

1. Multi-user login with roles (admin, teacher, accountant).
2. Central database (PostgreSQL / MySQL) with a backend API.
3. SMS / email alerts to guardians (fees due, absences).
4. Timetable and homework modules.
5. Printable PDF report cards and fee receipts.
6. Photo uploads for students and staff.

---

## 5. How to Run

Open `index.html` in any web browser (Chrome, Edge, Firefox). No installation needed.
All data is saved automatically on the device. Use **Settings → Export** to back up
your data, and **Import** to restore it on another device.
