import { Pencil, Trash2, Tag, ScrollText } from 'lucide-react'
import { getOutletColor } from '../outletConstants'

function OutletCard({ outlet, onEdit, onDelete, onViewOrders }) {
  const colorClass = getOutletColor(outlet.name)
  const initial    = (outlet.name || '?').charAt(0).toUpperCase()
  const discounts  = outlet.discounts ?? []

  return (
    <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col items-center gap-2 group">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewOrders(outlet)}
          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
          title="View saved orders"
        >
          <ScrollText size={14} />
        </button>
        <button
          onClick={() => onEdit(outlet)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(outlet)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className={`w-16 h-16 rounded-full ${colorClass} flex items-center justify-center text-white text-2xl font-bold shadow-sm`}>
        {initial}
      </div>

      <p className="font-semibold text-gray-800 text-center leading-tight mt-1">{outlet.name}</p>

      <span className={`text-xs px-3 py-0.5 rounded-full border font-medium ${
        outlet.status === 'Active'
          ? 'border-green-300 text-green-700 bg-green-50'
          : 'border-gray-300 text-gray-500 bg-gray-50'
      }`}>
        {outlet.status}
      </span>

      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
        <Tag size={11} />
        {discounts.length === 0
          ? <span>No discounts</span>
          : <span>{discounts.length} discount{discounts.length !== 1 ? 's' : ''}</span>
        }
      </div>

      {outlet.address && (
        <p className="text-xs text-gray-400 text-center truncate w-full max-w-[160px]">{outlet.address}</p>
      )}
    </div>
  )
}

export default function OutletCardGrid({ outlets, onEdit, onDelete, onViewOrders }) {
  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No outlets found</p>
        <p className="text-sm mt-1">Add your first outlet to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {outlets.map((o) => (
        <OutletCard key={o.id} outlet={o} onEdit={onEdit} onDelete={onDelete} onViewOrders={onViewOrders} />
      ))}
    </div>
  )
}