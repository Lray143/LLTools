// ── DEPARTMENTS ──────────────────────────────────────────────
// Used in the department filter dropdown.
// TODO: eventually fetch these dynamically from Supabase
// SELECT DISTINCT department FROM employees
export const DEPTS = ["Sales", "HR", "Accounting", "Admin", "Intern"]

// ── AVATAR COLORS ────────────────────────────────────────────
// Used by getColor() to pick a consistent color per employee name
export const avatarColors = [
  "bg-orange-500", "bg-blue-600",  "bg-purple-500",
  "bg-teal-600",   "bg-yellow-500","bg-red-700",
  "bg-pink-500",   "bg-indigo-500","bg-lime-600",
]

// ── STATUS BADGE STYLES ──────────────────────────────────────
// Used by EmployeeStatusBadge to color the status pill
export const statusStyles = {
  "Active"    : "bg-green-50  text-green-600  border border-green-200",
  "Late today": "bg-orange-50 text-orange-500 border border-orange-200",
  "Absent"    : "bg-red-50    text-red-500    border border-red-200",
  "On Leave"  : "bg-sky-50    text-sky-500    border border-sky-200",
}

// ── HELPERS ──────────────────────────────────────────────────

// Generates initials from a full name
// "Ana Santos" → "AS"
export function getInitials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

// Picks a consistent avatar color based on the employee's name
// Same name always gets the same color
export function getColor(name = "") {
  let h = 0
  for (let c of name) h += c.charCodeAt(0)
  return avatarColors[h % avatarColors.length]
}

export const STATUSES = ["Active", "Late today", "Absent", "On Leave"]
