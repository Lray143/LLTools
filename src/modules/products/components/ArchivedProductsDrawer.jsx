// src/modules/products/components/ArchivedProductsDrawer.jsx
import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Archive, RotateCcw, Trash2, X, AlertCircle } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import SearchBar from '../../../components/ui/SearchBar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest first' },
  { value: 'oldest',  label: 'Oldest first' },
  { value: 'az',      label: 'A → Z' },
  { value: 'za',      label: 'Z → A' },
  { value: 'group',   label: 'By Group' },
]

export default function ArchivedProductsDrawer({ rows, loading, onRestore, onPermanentDelete, onClose }) {
  const [search,             setSearch]             = useState('')
  const [sortBy,             setSortBy]             = useState('newest')
  const [sortOpen,           setSortOpen]           = useState(false)
  const [confirmDeleteRow,   setConfirmDeleteRow]   = useState(null)

  const filtered = useMemo(() => {
    let result = rows
    if (search.trim()) {
      const t = search.toLowerCase()
      result = result.filter((r) =>
        r.productNo?.toLowerCase().includes(t) ||
        r.description?.toLowerCase().includes(t) ||
        r.caseBarcode?.toLowerCase().includes(t)  ||
        r.itemBarcode?.toLowerCase().includes(t)  ||
        r.groupName?.toLowerCase().includes(t)
      )
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return (b.archivedAt || b.id || 0) > (a.archivedAt || a.id || 0) ? 1 : -1
      if (sortBy === 'oldest') return (a.archivedAt || a.id || 0) > (b.archivedAt || b.id || 0) ? 1 : -1
      if (sortBy === 'az')     return (a.description || '').localeCompare(b.description || '')
      if (sortBy === 'za')     return (b.description || '').localeCompare(a.description || '')
      if (sortBy === 'group')  return (a.groupName || '').localeCompare(b.groupName || '')
      return 0
    })
  }, [rows, search, sortBy])

  const grouped = useMemo(() => {
    const map = {}
    for (const row of filtered) {
      const key = row.groupName ?? 'Unknown Group'
      if (!map[key]) map[key] = []
      map[key].push(row)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function handleConfirmPermanent() {
    if (confirmDeleteRow) {
      onPermanentDelete(confirmDeleteRow.id)
      setConfirmDeleteRow(null)
    }
  }

  return (
    <>
      {/* ── SIDE PANEL OVERLAY ── */}
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/40"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Archived Products</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {rows.length} archived row{rows.length !== 1 ? 's' : ''} · Restore or permanently delete
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-8 h-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search + Sort */}
          <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by description, barcode, or group..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Sort dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                className="h-9 flex items-center gap-1.5 px-3 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown size={12} style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: sortBy === opt.value ? '#f97316' : '#374151', fontWeight: sortBy === opt.value ? 600 : 400 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Loading archive…
              </div>
            )}

            {/* Empty state */}
            {!loading && rows.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Archive className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Archive is empty</p>
                  <p className="text-xs text-gray-400 mt-0.5">Removed products will appear here</p>
                </div>
              </div>
            )}

            {/* No search results */}
            {!loading && rows.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">No results for "{search}"</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try a different description, barcode, or group</p>
                </div>
              </div>
            )}

            {/* Grouped product list */}
            {!loading && grouped.map(([groupName, groupRows]) => {
              const groupStatus  = groupRows[0]?.groupStatus
              const groupIsGone  = groupStatus === 'Archived' || groupStatus === 'missing'

              return (
                <div key={groupName} className="mb-6">
                  {/* Group label */}
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-orange-200">
                    <span className="text-xs font-bold text-theme-500 uppercase tracking-wider">
                      {groupName}
                    </span>
                    <span className="text-xs text-orange-400">
                      ({groupRows.length} item{groupRows.length !== 1 ? 's' : ''})
                    </span>
                    {groupIsGone && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Group also archived — restoring will recover it
                      </span>
                    )}
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col gap-1.5">
                    {groupRows.map(row => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-orange-50/50 border border-gray-100 hover:border-orange-100 rounded-lg transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {row.description || <span className="text-gray-300 italic font-normal">No description</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[
                              row.size,
                              row.qty  ? `Qty: ${row.qty}`                    : null,
                              row.price ? `₱${Number(row.price).toFixed(2)}`  : null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                          {(row.productNo || row.caseBarcode || row.itemBarcode) && (
                            <p className="text-xs text-gray-300 mt-0.5 font-mono">
                              {[row.productNo, row.caseBarcode, row.itemBarcode].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 gap-1 px-2.5"
                            onClick={() => onRestore(row.id)}
                            title={groupIsGone ? 'Restore product and its group' : 'Restore to active'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {groupIsGone ? 'Restore both' : 'Restore'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 gap-1 px-2.5"
                            onClick={() => setConfirmDeleteRow(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400 text-center">
              Restore brings a product back to its original group · Permanent delete cannot be undone
            </p>
          </div>

        </div>
      </div>

      {/* ── CONFIRM PERMANENT DELETE DIALOG ── */}
      <Dialog open={confirmDeleteRow !== null} onOpenChange={val => { if (!val) setConfirmDeleteRow(null) }}>
        <DialogContent className="sm:max-w-sm bg-white border-0 outline-none focus:outline-none ring-0 p-6 z-[60]">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <DialogTitle className="text-gray-900 font-semibold text-base">Permanently Delete?</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-500 text-center px-1">
            This action cannot be undone.{" "}
            <span className="font-semibold text-gray-800">{confirmDeleteRow?.description || 'This product'}</span> will be completely removed from the database.
          </p>
          <DialogFooter className="gap-2 sm:justify-center mt-3">
            <Button variant="outline" className="border-gray-200 text-gray-600" onClick={() => setConfirmDeleteRow(null)}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white border-0" onClick={handleConfirmPermanent}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}