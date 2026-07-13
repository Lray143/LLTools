import { Pencil, Trash2, Clock } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { EmployeeStatusBadge } from "./EmployeeStatusBadge"
import { getColor, getInitials, formatShiftTime } from "../employeeConstants"

export function EmployeeCardGrid({ employees, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {employees.map(emp => (
        <div
          key={emp.id}
          className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-theme-500 hover:bg-theme-50"
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

          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getColor(emp.name)}`}>
            {getInitials(emp.name)}
          </div>
          <p className="font-semibold text-gray-900 mt-1">{emp.name}</p>
          {emp.role && (
            <p className="text-xs text-gray-500 font-medium -mt-0.5">{emp.role}</p>
          )}
          <p className="text-sm text-gray-400">{emp.dept} · {emp.employee_no}</p>
          {/* Use the dynamically resolved status value */}
          <EmployeeStatusBadge status={emp.liveStatus} />
          {formatShiftTime(emp.shiftStart, emp.shiftEnd) ? (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-300" />
              <span>{formatShiftTime(emp.shiftStart, emp.shiftEnd)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-300 italic">
              <Clock className="w-3.5 h-3.5" />
              <span>No shift set</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}