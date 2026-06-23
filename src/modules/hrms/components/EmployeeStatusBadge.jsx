import { statusStyles } from "../employeeConstants"

export function EmployeeStatusBadge({ status }) {
  // Active → green, Resigned → gray, any leave type → amber
  const styling = statusStyles[status]
    ?? (status === 'Active'
      ? "bg-green-50 text-green-600 border border-green-200"
      : "bg-amber-50 text-amber-600 border border-amber-200")

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${styling}`}>
      {status}
    </span>
  )
}