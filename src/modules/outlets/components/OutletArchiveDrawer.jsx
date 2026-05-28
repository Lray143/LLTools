import { X, RotateCcw, Trash2, Tag } from 'lucide-react'
import { getOutletColor } from '../outletConstants'

export default function OutletArchiveDrawer({ outlets, onRestore, onPermDelete, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Archived Outlets</h2>
            <p className="text-xs text-gray-400 mt-0.5">{outlets.length} outlet{outlets.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {outlets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <p className="font-medium">No archived outlets</p>
              <p className="text-sm">Archived outlets will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {outlets.map((o) => {
                const colorClass = getOutletColor(o.name)
                const initial    = (o.name || '?').charAt(0).toUpperCase()
                const discounts  = o.discounts ?? []
                return (
                  <div key={o.id} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-bold shrink-0`}>
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{o.name}</p>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Tag size={9} /> {discounts.length} discount{discounts.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRestore(o.id)}
                        title="Restore"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => onPermDelete(o.id)}
                        title="Delete permanently"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}