import { statusStyles } from "../employeeConstants"

export function EmployeeStatusBadge({ status }) {
  // If status is Active use green style, otherwise fall back to soft sky-blue for any Leave Type
  const styling = statusStyles[status] || "bg-sky-50 text-sky-500 border border-sky-200"

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${styling}`}>
      {status}
    </span>
  )
}