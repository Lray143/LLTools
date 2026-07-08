import { Pencil, Trash2, Tag, ScrollText } from 'lucide-react'
import { getOutletColor } from '../outletConstants'

export default function OutletListView({ outlets, onEdit, onDelete, onViewOrders }) {
  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No outlets found</p>
        <p className="text-sm mt-1">Add your first outlet to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outlet</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discounts</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added By</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {outlets.map((o) => {
            const colorClass = getOutletColor(o.name)
            const initial    = (o.name || '?').charAt(0).toUpperCase()
            const discounts  = o.discounts ?? []

            return (
              <tr key={o.id} className="hover:bg-white transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {initial}
                    </div>
                    <span className="font-medium text-gray-800">{o.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{o.address || '—'}</td>

                <td className="px-4 py-3">
                  {discounts.length === 0 ? (
                    <span className="text-gray-400 text-xs">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {discounts.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 text-xs bg-theme-50 text-theme-700 border border-theme-200 px-2 py-0.5 rounded-full"
                        >
                          <Tag size={9} />
                          {d.name}: {d.value}%
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                    o.status === 'Active'
                      ? 'border-green-300 text-green-700 bg-green-50'
                      : 'border-gray-300 text-gray-500 bg-white'
                  }`}>
                    {o.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {o.added_by || 'Unknown'}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button
                      onClick={() => onViewOrders(o)}
                      title="View saved orders"
                      className="p-1.5 rounded-lg hover:bg-theme-50 text-gray-400 hover:text-theme-500 transition-colors"
                    >
                      <ScrollText size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(o)}
                      className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(o)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}