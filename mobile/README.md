# Dr. Lokmandas Public School — ERP Mobile App

A native **Android & iOS** app for the Lokmandas school ERP, built with
**Expo (React Native)**. It talks to the existing Express + SQLite backend in
this repo over the same `/api` it already exposes — no backend changes needed.

The look matches the school's public site
(`lockmandas-school-erp-web.vercel.app`): deep royal **navy `#171065`** + **gold
`#ffd400`**, Libre Franklin display type over DM Sans, editorial cards, a gold
pill section system, and the "Choose your portal" sign-in.

> **Note on the Vercel URL:** that site is the **public website only** — it does
> not serve the `/api` backend. The app points at wherever the Express server
> runs (see *API base URL* below).

---

## What's built

**Login** — the "Choose your portal" screen with Student / Teacher / Office
selectors (Student signs in with an *Admission number*, Teacher with a
*Teacher ID*), the navy crest hero, and friendly errors (including the
rate-limit message). The signed-in session is stored encrypted
(`expo-secure-store`) and restored on next launch.

**Student portal (complete):**
| Screen | What it does |
|--------|--------------|
| **Home** | Overall average, real class rank, attendance ring, marks-growth line chart, per-subject breakdown, quick links |
| **Marks** | Every exam score grouped by subject, with per-subject averages |
| **Work** | Assignments with due badges; **upload a PDF submission** (or mark done) and re-open it |
| **Documents** | Report cards & Transfer Certificate — opened as authenticated PDFs |
| **Fees** | Outstanding vs paid totals and an itemised list |
| **Notices** | School-wide and class announcements |

**Teacher portal (complete):**
| Screen | What it does |
|--------|--------------|
| **Classes** | Timetable, KPIs, quick actions |
| **Attendance** | Class picker + date stepper, tap-to-toggle present/absent, bulk set, save |
| **Marks** | Class + subject pickers, exam/total, per-student score entry with validation |
| **Work** | Assignments with submission progress; create new; drill into **submissions** and open each student's PDF |
| **Report cards** | Pick a student, attach a PDF, send |
| **Notices** | Post to the whole school or a class; delete your own |

**Accountant portal (complete):**
| Screen | What it does |
|--------|--------------|
| **Fees** | Outstanding/collected totals, searchable fee list (Due/Paid/All), **mark paid** |
| **Add fee** | Charge one student (searchable) or a whole class at once |
| **Students** | Full roster grouped by class, searchable, with guardian/contact |
| **TCs** | Issue a Transfer Certificate PDF to a student; history of issued certificates |
| **Notices** | Post as the office to the school or a class; delete any notice |

All three portals share one design system and the same API client — no backend
changes.

---

## Run it (dev)

You need [Node.js](https://nodejs.org) 20+ and the **Expo Go** app on your phone
(App Store / Play Store), or an Android/iOS emulator.

```bash
cd mobile
npm install
```

### 1. Start the ERP backend (in the repo root, a separate terminal)

```bash
npm start
```

This serves the API at `http://localhost:3000`.

### 2. Point the app at that backend

Copy the env template and set the base URL so your phone can reach your PC:

```bash
cp .env.example .env
```

- **Real phone (Expo Go)** on the same Wi-Fi: use your computer's LAN IP, e.g.
  `EXPO_PUBLIC_API_BASE=http://192.168.1.23:3000`
  (find it with `ipconfig` → *IPv4 Address* on Windows).
- **Android emulator:** `http://10.0.2.2:3000`
- **iOS simulator:** `http://localhost:3000`

If you leave `.env` unset, the app falls back to deriving your PC's host from
the Expo dev server, which works for most Wi-Fi setups.

### 3. Start the app

```bash
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Or press `a`
for an Android emulator / `i` for an iOS simulator.

> Web preview isn't set up (this targets phones). To enable it, run
> `npx expo install react-native-web react-dom @expo/metro-runtime`, then
> press `w`.

### Demo logins

Use the credentials seeded in the backend. For the stock seed these are:

| Portal  | ID            | Password     |
|---------|---------------|--------------|
| Student | `nursery-a-1` | `student123` |
| Teacher | `t3201744`    | `teacher123` |
| Office  | `nair`        | `nair123`    |

(The exact student/teacher IDs depend on your seed data — any student account
works in the Student portal.)

---

## Project structure

```
mobile/
├── app/                      Expo Router routes
│   ├── _layout.tsx           fonts + AuthProvider + splash
│   ├── index.tsx             auth-aware redirect
│   ├── login.tsx             "Choose your portal" sign-in
│   ├── (student)/            student tabs + 6 screens
│   ├── (teacher)/            placeholder (next phase)
│   └── (accountant)/         placeholder (next phase)
├── src/
│   ├── theme.ts              brand colours, type, spacing, shadows
│   ├── api/                  client, typed endpoints, response types
│   ├── auth/                 AuthContext + encrypted session storage
│   ├── components/           UI kit (Button, Card, Field, charts, states…)
│   ├── hooks/useAsync.ts     load / error / pull-to-refresh
│   └── utils/                formatting + PDF pick/open helpers
└── assets/                   icon, splash, adaptive icon
```

The medallion in `assets/` is a generated stand-in for the school crest. Drop
the real crest PNG in and update `app.json` / `src/components/Crest.tsx` if you
want the photographic emblem.

---

## Build a real APK / app (optional)

Expo builds in the cloud with **EAS** — no Android Studio/Xcode needed locally:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # produces an installable APK
```

For production you'll also want the Express backend deployed somewhere
reachable (a small VM/Render/Railway, with a managed DB and HTTPS), then set
`EXPO_PUBLIC_API_BASE` to that URL.
