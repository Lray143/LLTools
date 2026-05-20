export const DEPTS    = ["Sales", "HR", "Accounting", "Admin", "Intern"]
export const STATUSES = ["Active", "Late today", "Absent", "On Leave"]

export const avatarColors = [
  "bg-orange-500", "bg-blue-600",  "bg-purple-500",
  "bg-teal-600",   "bg-yellow-500","bg-red-700",
  "bg-pink-500",   "bg-indigo-500","bg-lime-600",
]

export const statusStyles = {
  "Active":     "bg-green-50  text-green-600  border border-green-200",
  "Late today": "bg-orange-50 text-orange-500 border border-orange-200",
  "Absent":     "bg-red-50    text-red-500    border border-red-200",
  "On Leave":   "bg-sky-50    text-sky-500    border border-sky-200",
}

export const seedEmployees = [
  { id: "EMP-001", name: "Ana Santos",     dept: "Sales",      status: "Active"     },
  { id: "EMP-002", name: "Rico Dela Cruz", dept: "Production", status: "Late today" },
  { id: "EMP-003", name: "Gina Flores",    dept: "Marketing",  status: "Absent"     },
  { id: "EMP-004", name: "Ben Castillo",   dept: "Finance",    status: "Active"     },
  { id: "EMP-005", name: "Lita Mendoza",   dept: "HR",         status: "On Leave"   },
  { id: "EMP-006", name: "Jun Ramos",      dept: "Production", status: "Active"     },
]

export function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

export function getColor(name) {
  let h = 0
  for (let c of name) h += c.charCodeAt(0)
  return avatarColors[h % avatarColors.length]
}