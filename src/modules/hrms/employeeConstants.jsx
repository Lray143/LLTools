export const DEPTS    = ["Sales", "HR", "Accounting", "Admin", "Intern", "Warehouse"]
export const STATUSES = ["Active", "On Leave"]

export const LEAVE_TYPES = [
  "Paid Leave",
  "Birthday Leave",
  "Sick Leave",
  "Service Incentive Leave",
  "Paid Leave Allocation",
  "Maternity Leave",
  "Paternity Leave"
]

export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export const DEFAULT_SHIFT_START = "07:00"
export const DEFAULT_SHIFT_END   = "17:30"
export const DEFAULT_DAY_OFFS    = ["Saturday", "Sunday"]

export const avatarColors = [
  "bg-orange-500", "bg-blue-600",  "bg-purple-500",
  "bg-teal-600",   "bg-yellow-500","bg-red-700",
  "bg-pink-500",   "bg-indigo-500","bg-lime-600",
]

export const statusStyles = {
  "Active": "bg-green-50 text-green-600 border border-green-200",
}

export function getLiveStatus(emp) {
  if (emp.status === "On Leave" && emp.leaveStart && emp.leaveEnd) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(emp.leaveStart)
    start.setHours(0, 0, 0, 0)
    const end = new Date(emp.leaveEnd)
    end.setHours(0, 0, 0, 0)
    if (today < start || today > end) return "Active"
    return emp.leaveType || "On Leave"
  }
  return emp.status || "Active"
}

export const seedEmployees = [
  { id: "EMP-001", name: "Ana Santos",     dept: "Sales",      status: "On Leave", leaveType: "Sick Leave", leaveStart: "2026-05-22", leaveEnd: "2026-05-23", contact: "0917-123-4567" },
  { id: "EMP-002", name: "Rico Dela Cruz", dept: "Warehouse",  status: "Active", contact: "0918-987-6543" },
  { id: "EMP-003", name: "Gina Flores",    dept: "Accounting", status: "Active", contact: "0922-456-7890" },
  { id: "EMP-004", name: "Ben Castillo",   dept: "Admin",      status: "Active", contact: "0915-333-4444" },
  { id: "EMP-005", name: "Lita Mendoza",   dept: "HR",         status: "Active", contact: "0999-888-7777" },
  { id: "EMP-006", name: "Jun Ramos",      dept: "Intern",     status: "Active", contact: "0906-111-2222" },
]

export function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

export function getColor(name) {
  let h = 0
  for (let c of name) h += c.charCodeAt(0)
  return avatarColors[h % avatarColors.length]
}