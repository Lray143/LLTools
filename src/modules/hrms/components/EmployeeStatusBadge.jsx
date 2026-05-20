import { statusStyles } from "../employeeConstants"

export function EmployeeStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${statusStyles[status] ?? "bg-gray-50 text-gray-500 border border-gray-200"}`}>
      {status}
    </span>
  )
}