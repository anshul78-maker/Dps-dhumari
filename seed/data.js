// All starting data. Loaded into the database on first run.
// Edit values here and run `npm run seed` to reset the database to this.

// -------------------- USERS --------------------
// role is one of: "student", "teacher", "accountant"
// Passwords are hashed automatically on seed.

export const users = [
  // ---- Students (Class 8-A) ----
  { username: "priya",  password: "priya123",  role: "student", name: "Priya Sharma",  className: "Class 8-A", roll: 14 },
  { username: "arjun",  password: "arjun123",  role: "student", name: "Arjun Verma",   className: "Class 8-A", roll: 5  },
  { username: "sara",   password: "sara123",   role: "student", name: "Sara Khan",     className: "Class 8-A", roll: 22 },

  // ---- Teachers ----
  // subjects/classes they teach are set in `teaching` below.
  { username: "verma",  password: "verma123",  role: "teacher", name: "Mr. Verma" },
  { username: "iyer",   password: "iyer123",   role: "teacher", name: "Ms. Iyer" },

  // ---- Accountant ----
  { username: "nair",   password: "nair123",   role: "accountant", name: "Mr. Nair" }
];

// -------------------- WHO TEACHES WHAT --------------------
// Each teacher can teach several subjects in a class.
export const teaching = [
  { teacher: "verma", className: "Class 8-A", subject: "Mathematics" },
  { teacher: "verma", className: "Class 8-A", subject: "Science" },
  { teacher: "iyer",  className: "Class 8-A", subject: "English" },
  { teacher: "iyer",  className: "Class 8-A", subject: "Social Studies" }
];

export const subjects = ["Mathematics", "Science", "English", "Social Studies"];

// -------------------- MARKS --------------------
// Several exams across the year so the student's growth line is meaningful.
// Each row: student username, subject, exam name, score, max.
// Exams are listed oldest -> newest (order matters for the trend).
export const exams = ["Unit Test 1", "Mid Term", "Unit Test 2", "Final Term"];

export const marks = [
  // Priya — steady growth
  ["priya", "Mathematics",   "Unit Test 1", 62, 100],
  ["priya", "Mathematics",   "Mid Term",    68, 100],
  ["priya", "Mathematics",   "Unit Test 2", 74, 100],
  ["priya", "Mathematics",   "Final Term",  80, 100],
  ["priya", "Science",       "Unit Test 1", 58, 100],
  ["priya", "Science",       "Mid Term",    64, 100],
  ["priya", "Science",       "Unit Test 2", 69, 100],
  ["priya", "Science",       "Final Term",  72, 100],
  ["priya", "English",       "Unit Test 1", 75, 100],
  ["priya", "English",       "Mid Term",    78, 100],
  ["priya", "English",       "Unit Test 2", 80, 100],
  ["priya", "English",       "Final Term",  82, 100],
  ["priya", "Social Studies","Unit Test 1", 70, 100],
  ["priya", "Social Studies","Mid Term",    72, 100],
  ["priya", "Social Studies","Unit Test 2", 71, 100],
  ["priya", "Social Studies","Final Term",  74, 100],

  // Arjun
  ["arjun", "Mathematics",   "Unit Test 1", 80, 100],
  ["arjun", "Mathematics",   "Mid Term",    82, 100],
  ["arjun", "Mathematics",   "Unit Test 2", 79, 100],
  ["arjun", "Mathematics",   "Final Term",  85, 100],
  ["arjun", "Science",       "Unit Test 1", 72, 100],
  ["arjun", "Science",       "Mid Term",    75, 100],
  ["arjun", "Science",       "Unit Test 2", 77, 100],
  ["arjun", "Science",       "Final Term",  80, 100],
  ["arjun", "English",       "Unit Test 1", 65, 100],
  ["arjun", "English",       "Mid Term",    68, 100],
  ["arjun", "English",       "Unit Test 2", 70, 100],
  ["arjun", "English",       "Final Term",  73, 100],
  ["arjun", "Social Studies","Unit Test 1", 68, 100],
  ["arjun", "Social Studies","Mid Term",    70, 100],
  ["arjun", "Social Studies","Unit Test 2", 72, 100],
  ["arjun", "Social Studies","Final Term",  75, 100],

  // Sara
  ["sara", "Mathematics",   "Unit Test 1", 55, 100],
  ["sara", "Mathematics",   "Mid Term",    60, 100],
  ["sara", "Mathematics",   "Unit Test 2", 63, 100],
  ["sara", "Mathematics",   "Final Term",  66, 100],
  ["sara", "Science",       "Unit Test 1", 60, 100],
  ["sara", "Science",       "Mid Term",    62, 100],
  ["sara", "Science",       "Unit Test 2", 65, 100],
  ["sara", "Science",       "Final Term",  68, 100],
  ["sara", "English",       "Unit Test 1", 78, 100],
  ["sara", "English",       "Mid Term",    80, 100],
  ["sara", "English",       "Unit Test 2", 83, 100],
  ["sara", "English",       "Final Term",  85, 100],
  ["sara", "Social Studies","Unit Test 1", 66, 100],
  ["sara", "Social Studies","Mid Term",    69, 100],
  ["sara", "Social Studies","Unit Test 2", 70, 100],
  ["sara", "Social Studies","Final Term",  72, 100]
];

// -------------------- ATTENDANCE --------------------
// A few recent days per student: 1 = present, 0 = absent.
export const attendance = [
  ["priya", "2026-02-02", 1], ["priya", "2026-02-03", 1], ["priya", "2026-02-04", 0],
  ["priya", "2026-02-05", 1], ["priya", "2026-02-06", 1],
  ["arjun", "2026-02-02", 1], ["arjun", "2026-02-03", 0], ["arjun", "2026-02-04", 1],
  ["arjun", "2026-02-05", 1], ["arjun", "2026-02-06", 1],
  ["sara",  "2026-02-02", 1], ["sara",  "2026-02-03", 1], ["sara",  "2026-02-04", 1],
  ["sara",  "2026-02-05", 0], ["sara",  "2026-02-06", 1]
];

// -------------------- ASSIGNMENTS --------------------
// title, class, subject, details, due date, teacher username.
export const assignments = [
  ["Algebra worksheet 4",       "Class 8-A", "Mathematics",   "Solve Q1–Q10 on quadratic equations.", "2026-02-12", "verma"],
  ["Chemistry: balancing eqns", "Class 8-A", "Science",       "Balance the 8 equations on page 44.",   "2026-02-10", "verma"],
  ["Essay: My favourite book",  "Class 8-A", "English",       "Write 300 words. Bring to class.",       "2026-02-13", "iyer"]
];

// -------------------- FEES --------------------
// student username, title, amount, period, status (due|paid).
export const fees = [
  ["priya", "Tuition fee",  2500, "January 2026",  "paid"],
  ["priya", "Tuition fee",  2500, "February 2026", "due"],
  ["priya", "Bus fee",       800, "February 2026", "due"],
  ["arjun", "Tuition fee",  2500, "February 2026", "due"],
  ["sara",  "Tuition fee",  2500, "January 2026",  "paid"],
  ["sara",  "Tuition fee",  2500, "February 2026", "due"]
];

// -------------------- NOTICES --------------------
// author username, title, message, audience ("all" or a class name).
// Teachers and the accountant post these; students see "all" + their class.
export const notices = [
  ["nair",  "Fee deadline extended", "February tuition can now be paid up to the 20th without a late charge.", "all"],
  ["iyer",  "Parent–teacher meeting", "PTM for Class 8-A is on Saturday 14th Feb, 10 AM in the main hall.", "Class 8-A"],
  ["verma", "Science lab reopens", "The science lab is back in use from Monday. Wear closed shoes for practicals.", "all"]
];
