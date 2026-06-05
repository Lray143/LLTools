import { statusStyles } from "../employeeConstants"

const ACTIVE_STATUSES = new Set(["Active", "Intern"])

export function EmployeeStatusBadge({ status }) {
  // Active → green, Intern → blue, any leave type → amber
  const styling = statusStyles[status]
    ?? (ACTIVE_STATUSES.has(status)
      ? "bg-gray-100 text-gray-500 border border-gray-200"
      : "bg-amber-50 text-amber-600 border border-amber-200")

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${styling}`}>
      {status}
    </span>
  )
}