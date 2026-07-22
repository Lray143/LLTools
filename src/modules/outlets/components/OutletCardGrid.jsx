import { Pencil, Trash2, Tag, ScrollText, MapPin, User } from 'lucide-react'
import { getOutletColor } from '../outletConstants'

function OutletCard({ outlet, employees = [], onEdit, onDelete, onViewOrders }) {
  const colorClass = getOutletColor(outlet.name)
  const initial    = (outlet.name || '?').charAt(0).toUpperCase()
  const discounts  = outlet.discounts ?? []

  const emp = employees.find(e => String(e.no) === String(outlet.added_by) || String(e.employee_no) === String(outlet.added_by) || String(e.id) === String(outlet.added_by) || e.name === outlet.added_by)
  const addedByName = emp ? (emp.name || `${emp.first} ${emp.surname}`) : outlet.added_by

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow relative group">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewOrders(outlet)}
          className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-theme-500 hover:bg-theme-50 transition-colors"
          title="View saved orders"
        >
          <ScrollText size={13.5} />
        </button>
        <button
          onClick={() => onEdit(outlet)}
          className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-theme-500 hover:bg-theme-50 transition-colors"
        >
          <Pencil size={13.5} />
        </button>
        <button
          onClick={() => onDelete(outlet)}
          className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13.5} />
        </button>
      </div>

      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${colorClass}`}>
        {initial}
      </div>
      <p className="font-semibold text-gray-900 mt-1 text-center leading-tight">{outlet.name}</p>

      {/* Status badge — matches EmployeeStatusBadge style */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit ${
        outlet.status === 'Active'
          ? 'bg-green-50 text-green-600 border border-green-200'
          : 'bg-white text-gray-500 border border-gray-200'
      }`}>
        {outlet.status}
      </span>

      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
        <Tag size={11} className="text-gray-300" />
        <span>
          {discounts.length === 0 ? 'No discounts' : `${discounts.length} discount${discounts.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {outlet.address && (
        <p className="text-xs text-gray-400 text-center truncate w-full max-w-[160px]">{outlet.address}</p>
      )}

      {outlet.region && (
        <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full max-w-[180px] truncate">
          <MapPin size={9} className="shrink-0" />
          <span className="truncate">{outlet.region}</span>
        </span>
      )}
      
      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 border-t border-gray-100 pt-3 w-full justify-center">
        <User size={12} className="text-gray-300" />
        <span>Added by: <span className="font-medium text-gray-500">{addedByName || 'Unknown'}</span></span>
      </div>
    </div>
  )
}

export default function OutletCardGrid({ outlets, employees = [], onEdit, onDelete, onViewOrders }) {
  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No outlets found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {outlets.map((o, index) => (
        <div key={o.id} id={index === 0 ? 'tour-outlet-card' : undefined}>
          <OutletCard outlet={o} employees={employees} onEdit={onEdit} onDelete={onDelete} onViewOrders={onViewOrders} />
        </div>
      ))}
    </div>
  )
}