/** Shapes returned by the ERP backend (kept permissive where the API is loose). */

export type Role = "student" | "teacher" | "accountant" | "admin";

export interface LoginResult {
  token: string;
  name: string;
  role: Role;
}

export interface SubjectScore {
  subject: string;
  score: number; // latest %
  change: number; // vs first exam
}

export interface StudentDashboard {
  name: string;
  className: string;
  roll: string | number;
  overall: number;
  attendance: number;
  trend: [string, number][]; // [["Unit Test 1", 66], ...]
  subjects: SubjectScore[];
  rank: { position: number; total: number };
}

export interface MarkRow {
  subject: string;
  exam: string;
  score: number;
  max_score: number;
  [k: string]: unknown;
}

export interface AssignmentRow {
  id: number;
  title: string;
  subject: string;
  details?: string | null;
  due_date?: string | null;
  done?: 0 | 1;
  submission_id?: number | null;
  original_name?: string | null;
  uploaded_at?: string | null;
  [k: string]: unknown;
}

export interface FeeRow {
  id: number;
  title: string;
  amount: number;
  period?: string;
  status: "due" | "paid";
  [k: string]: unknown;
}

export interface DocumentRow {
  id: number;
  type: "report_card" | "tc" | string;
  title: string;
  original_name?: string | null;
  uploaded_by_name?: string;
  size?: number;
  created_at?: string;
  [k: string]: unknown;
}

export interface NoticeRow {
  id: number;
  title: string;
  body: string;
  audience: string;
  author_id?: number;
  author_name?: string;
  created_at?: string;
  [k: string]: unknown;
}

// ---- teacher ----
export interface TeacherClass {
  class_name: string;
  subject: string;
}

export interface ClassStudent {
  id: number;
  name: string;
  roll: string | number;
}

export interface TeacherAssignment {
  id: number;
  title: string;
  class_name: string;
  subject: string;
  due_date?: string | null;
  class_size: number;
  submitted: number;
}

export interface SubmissionRow {
  student_id: number;
  name: string;
  roll: string | number;
  submission_id: number | null;
  original_name?: string | null;
  uploaded_at?: string | null;
  has_file: 0 | 1;
}

export interface TeacherStudent {
  id: number;
  name: string;
  class_name: string;
  roll: string | number;
}

// ---- accountant ----
export interface AccountantFee {
  id: number;
  title: string;
  amount: number;
  period?: string;
  status: "due" | "paid";
  student_name: string;
  class_name: string;
  roll: string | number;
}

export interface RosterStudent {
  id: number;
  name: string;
  class_name: string;
  roll: string | number;
  admission_no?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  phone?: string | null;
}

export interface TcDocument extends DocumentRow {
  student_name: string;
  class_name: string;
  roll: string | number;
}
