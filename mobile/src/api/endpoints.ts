/**
 * Typed endpoint helpers, bound to a token + an unauthorized handler.
 * Build one with makeApi() (the AuthContext wires it to the signed-in session).
 */
import { apiRequest } from "./client";
import type {
  AccountantFee,
  AssignmentRow,
  ClassStudent,
  DocumentRow,
  FeeRow,
  LoginResult,
  MarkRow,
  NoticeRow,
  RosterStudent,
  StudentDashboard,
  SubmissionRow,
  TcDocument,
  TeacherAssignment,
  TeacherClass,
  TeacherStudent,
} from "./types";

export function makeApi(token: string | null, onUnauthorized?: () => void) {
  const call = <T>(path: string, init?: Parameters<typeof apiRequest>[1]) =>
    apiRequest<T>(path, { token, onUnauthorized, ...init });

  return {
    // ---- shared ----
    notices: () => call<{ notices: NoticeRow[]; role: string }>("/api/notices"),
    postNotice: (body: { title: string; body: string; audience?: string }) =>
      call<{ ok: true }>("/api/notices", { method: "POST", body }),
    deleteNotice: (id: number) =>
      call<{ ok: true }>(`/api/notices/${id}`, { method: "DELETE" }),

    // ---- student ----
    student: {
      dashboard: () => call<StudentDashboard>("/api/student/dashboard"),
      marks: () => call<{ marks: MarkRow[] }>("/api/student/marks"),
      assignments: () =>
        call<{ assignments: AssignmentRow[] }>("/api/student/assignments"),
      toggleAssignment: (id: number, done: boolean) =>
        call<{ ok: true; done: number }>(`/api/student/assignments/${id}/toggle`, {
          method: "POST",
          body: { done },
        }),
      submitAssignment: (id: number, file: string, name: string) =>
        call<{ ok: true }>(`/api/student/assignments/${id}/submit`, {
          method: "POST",
          body: { file, name },
        }),
      documents: () =>
        call<{ documents: DocumentRow[] }>("/api/student/documents"),
      fees: () => call<{ fees: FeeRow[]; totalDue: number }>("/api/student/fees"),
    },

    // ---- teacher ----
    teacher: {
      overview: () =>
        call<{ name: string; classes: TeacherClass[] }>("/api/teacher/overview"),
      classStudents: (className: string) =>
        call<{ students: ClassStudent[] }>(
          `/api/teacher/class?className=${encodeURIComponent(className)}`
        ),
      saveMark: (body: {
        studentId: number;
        className: string;
        subject: string;
        exam: string;
        score: number;
        max: number;
      }) => call<{ ok: true }>("/api/teacher/marks", { method: "POST", body }),
      saveAttendance: (body: {
        date: string;
        records: { studentId: number; present: boolean }[];
      }) =>
        call<{ ok: true; count: number }>("/api/teacher/attendance", {
          method: "POST",
          body,
        }),
      createAssignment: (body: {
        title: string;
        className: string;
        subject: string;
        details?: string;
        due?: string | null;
      }) => call<{ ok: true }>("/api/teacher/assignments", { method: "POST", body }),
      assignments: () =>
        call<{ assignments: TeacherAssignment[] }>("/api/teacher/assignments"),
      submissions: (id: number) =>
        call<{
          assignment: { id: number; title: string; class_name: string; subject: string };
          rows: SubmissionRow[];
        }>(`/api/teacher/assignments/${id}/submissions`),
      students: () => call<{ students: TeacherStudent[] }>("/api/teacher/students"),
      reportCard: (body: { studentId: number; file: string; title: string; name: string }) =>
        call<{ ok: true }>("/api/teacher/report-cards", { method: "POST", body }),
    },

    // ---- accountant ----
    accountant: {
      overview: () =>
        call<{
          students: TeacherStudent[];
          fees: AccountantFee[];
          totalDue: number;
          totalPaid: number;
        }>("/api/accountant/overview"),
      students: () => call<{ students: RosterStudent[] }>("/api/accountant/students"),
      addFee: (body: { studentId: number; title: string; amount: number; period?: string }) =>
        call<{ ok: true }>("/api/accountant/fees", { method: "POST", body }),
      addFeeToClass: (body: {
        className: string;
        title: string;
        amount: number;
        period?: string;
      }) => call<{ ok: true; count: number }>("/api/accountant/fees/class", { method: "POST", body }),
      markPaid: (feeId: number) =>
        call<{ ok: true }>(`/api/accountant/fees/${feeId}/paid`, { method: "POST", body: {} }),
      issueTc: (body: { studentId: number; file: string; title: string; name: string }) =>
        call<{ ok: true }>("/api/accountant/tc", { method: "POST", body }),
      tcs: () => call<{ documents: TcDocument[] }>("/api/accountant/documents"),
    },
  };
}

export type Api = ReturnType<typeof makeApi>;

/** Login is unauthenticated, so it stands apart from the bound API. */
export function login(username: string, password: string) {
  return apiRequest<LoginResult>("/api/login", {
    method: "POST",
    body: { username, password },
  });
}
