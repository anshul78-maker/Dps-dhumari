/** Indian-rupee amount, e.g. 1200 -> "₹1,200". */
export function money(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

/** ISO/SQLite datetime -> "12 Oct 2026". Returns "" for empty/invalid input. */
export function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Relative "due" wording for an assignment date (today / in N days / overdue). */
export function dueLabel(value?: string | null): { text: string; overdue: boolean } | null {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : value + "T00:00:00");
  if (isNaN(d.getTime())) return { text: `Due ${value}`, overdue: false };
  const today = new Date();
  const days = Math.round((startOfDay(d) - startOfDay(today)) / 86400000);
  if (days < 0) return { text: `Overdue by ${Math.abs(days)}d`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due in ${days} days`, overdue: false };
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
