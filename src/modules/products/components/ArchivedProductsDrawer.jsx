// src/modules/products/components/ArchivedProductsDrawer.jsx
import { useState, useMemo } from 'react'
import { X, RotateCcw, Trash2, Search, AlertCircle } from 'lucide-react'

export default function ArchivedProductsDrawer({ rows, loading, onRestore, onPermanentDelete, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const t = search.toLowerCase()
    return rows.filter((r) =>
      r.description?.toLowerCase().includes(t) ||
      r.caseBarcode?.toLowerCase().includes(t)  ||
      r.itemBarcode?.toLowerCase().includes(t)  ||
      r.groupName?.toLowerCase().includes(t)
    )
  }, [rows, search])

  const grouped = useMemo(() => {
    const map = {}
    for (const row of filtered) {
      const key = row.groupName ?? 'Unknown Group'
      if (!map[key]) map[key] = []
      map[key].push(row)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Archived Products</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {rows.length} archived row{rows.length !== 1 ? 's' : ''} · Restore or permanently delete
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived products…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                         placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Loading archive…
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <span className="text-3xl">📦</span>
              <p>No archived products yet.</p>
              <p className="text-xs text-gray-300">Deleted rows will appear here.</p>
            </div>
          )}

          {!loading && rows.length > 0 && filtered.length === 0 && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No archived products match your search.
            </div>
          )}

          {!loading && grouped.map(([groupName, groupRows]) => {
            // Check if this group itself is archived/missing (all rows in it share the same group status)
            const groupStatus = groupRows[0]?.groupStatus
            const groupIsGone = groupStatus === 'Archived' || groupStatus === 'missing'

            return (
              <div key={groupName} className="mb-6">
                {/* Group label */}
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-orange-100">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    {groupName}
                  </span>
                  <span className="text-xs font-normal text-orange-400">
                    ({groupRows.length} item{groupRows.length !== 1 ? 's' : ''})
                  </span>
                  {/* Badge when the group header itself was deleted */}
                  {groupIsGone && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-amber-600
                                     bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertCircle size={11} />
                      Group also archived — restoring will recover it
                    </span>
                  )}
                </div>

                {/* Rows */}
                <div className="space-y-1">
                  {groupRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                 bg-gray-50 hover:bg-orange-50/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {row.description || <span className="text-gray-300 italic">No description</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[
                            row.size,
                            row.qty ? `Qty: ${row.qty}` : null,
                            row.price ? `₱${Number(row.price).toFixed(2)}` : null,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        {(row.caseBarcode || row.itemBarcode) && (
                          <p className="text-xs text-gray-300 mt-0.5 font-mono">
                            {row.caseBarcode} / {row.itemBarcode}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onRestore(row.id)}
                          title={groupIsGone ? 'Restore product and its group' : 'Restore to active'}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700
                                     px-2.5 py-1.5 rounded-md hover:bg-green-50 transition-colors font-medium"
                        >
                          <RotateCcw size={13} />
                          {groupIsGone ? 'Restore both' : 'Restore'}
                        </button>
                        <button
                          onClick={() => onPermanentDelete(row.id)}
                          title="Permanently delete"
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600
                                     px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors font-medium"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            Restore brings a product back to its original group · Permanent delete cannot be undone
          </p>
        </div>
      </div>
    </div>
  )
}