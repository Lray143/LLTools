import { Pencil, Trash2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { EmployeeStatusBadge } from "./EmployeeStatusBadge"
import { getColor, getInitials } from "../employeeConstants"

export function EmployeeListView({ employees, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Employee</span>
        <span>Department</span>
        <span>ID</span>
        <span>Status</span>
      </div>
      {employees.map(emp => (
        <div
          key={emp.id}
          className="grid grid-cols-4 px-6 py-4 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${getColor(emp.name)}`}>
              {getInitials(emp.name)}
            </div>
            <span className="font-medium text-gray-900 text-sm">{emp.name}</span>
          </div>
          <span className="text-sm text-gray-500">{emp.dept}</span>
          <span className="text-sm text-gray-400">{emp.id}</span>

          <div className="flex items-center justify-between">
            <EmployeeStatusBadge status={emp.status} />
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                onClick={() => onEdit(emp)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => onDelete(emp)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}