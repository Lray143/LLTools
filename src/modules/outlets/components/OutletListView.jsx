import { Pencil, Trash2, Tag, ScrollText, MapPin } from 'lucide-react'
import { getOutletColor } from '../outletConstants'

export default function OutletListView({ outlets, onEdit, onDelete, onViewOrders }) {
  if (outlets.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-5 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Outlet</span>
        <span>Address</span>
        <span className="col-span-2">Discounts</span>
        <span>Status</span>
      </div>

      {outlets.map((o) => {
        const colorClass = getOutletColor(o.name)
        const initial    = (o.name || '?').charAt(0).toUpperCase()
        const discounts  = o.discounts ?? []

        return (
          <div
            key={o.id}
            className="grid grid-cols-5 px-6 py-4 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
          >
            {/* 1. NAME & AVATAR */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${colorClass}`}>
                {initial}
              </div>
              <span className="font-medium text-gray-900 text-sm">{o.name}</span>
            </div>

            {/* 2. ADDRESS */}
            <span className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
              {o.address ? (
                <>
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{o.address}</span>
                </>
              ) : (
                <span className="text-gray-300 italic font-normal">No address</span>
              )}
            </span>

            {/* 3. DISCOUNTS */}
            <div className="col-span-2 flex flex-wrap gap-1">
              {discounts.length === 0 ? (
                <span className="text-gray-300 italic text-sm font-normal">No discounts</span>
              ) : (
                discounts.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full"
                  >
                    <Tag size={9} />
                    {d.name} {d.value}%
                  </span>
                ))
              )}
            </div>

            {/* 4. STATUS + ACTIONS */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                o.status === 'Active'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                {o.status}
              </span>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onViewOrders(o)}
                  className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                  title="View saved orders"
                >
                  <ScrollText size={13.5} />
                </button>
                <button
                  onClick={() => onEdit(o)}
                  className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Pencil size={13.5} />
                </button>
                <button
                  onClick={() => onDelete(o)}
                  className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13.5} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}