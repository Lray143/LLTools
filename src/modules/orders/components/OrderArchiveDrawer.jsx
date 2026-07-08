import { useState } from 'react'
import { X, RotateCcw, Trash2, Archive, Tag, ChevronDown, Receipt, Calendar } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import SearchBar from '../../../components/ui/SearchBar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest Total' },
  { value: 'lowest', label: 'Lowest Total' },
]

const fmt = (n) =>
  Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function OrderArchiveDrawer({ orders, onRestore, onPermDelete, onClose }) {
  const [search,           setSearch]           = useState('')
  const [sortBy,           setSortBy]           = useState('newest')
  const [sortOpen,         setSortOpen]         = useState(false)
  const [confirmDeleteOut, setConfirmDeleteOut] = useState(null)

  const filtered = [...orders]
    .filter(o =>
      (o.seriesNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.outletName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'highest') return (b.grandTotal || 0) - (a.grandTotal || 0)
      if (sortBy === 'lowest') return (a.grandTotal || 0) - (b.grandTotal || 0)
      return 0
    })

  function handleConfirmPermanent() {
    if (confirmDeleteOut) {
      onPermDelete(confirmDeleteOut.id)
      setConfirmDeleteOut(null)
    }
  }

  return (
    <>
      {/* ── SIDE PANEL ── */}
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/40"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Archived Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {orders.length} archived order{orders.length !== 1 ? 's' : ''} · Restore or permanently delete
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
                placeholder="Search by series # or outlet…"
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
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[130px]">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: sortBy === opt.value ? 'var(--theme-500)' : '#374151', fontWeight: sortBy === opt.value ? 600 : 400 }}
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

            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Archive className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Archive is empty</p>
                  <p className="text-xs text-gray-400 mt-0.5">Removed orders will appear here</p>
                </div>
              </div>
            )}

            {orders.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">No results for "{search}"</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try a different series # or outlet</p>
                </div>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {filtered.map(o => {
                  return (
                    <div
                      key={o.id}
                      className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-theme-50/50 border border-gray-100 hover:border-theme-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-theme-50 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-theme-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {o.seriesNumber} <span className="text-gray-400 font-normal">({o.outletName || 'Default'})</span>
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(o.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900 mr-2">₱{fmt(o.grandTotal)}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 gap-1 px-2.5"
                            onClick={() => onRestore(o.id)}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 gap-1 px-2.5"
                            onClick={() => setConfirmDeleteOut(o)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400 text-center">
              Restore brings an order back to active · Permanent delete cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFIRM PERMANENT DELETE ── */}
      <Dialog open={confirmDeleteOut !== null} onOpenChange={val => { if (!val) setConfirmDeleteOut(null) }}>
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
            This action cannot be undone.{' '}
            <span className="font-semibold text-gray-800">{confirmDeleteOut?.seriesNumber}</span> will be completely removed from the database.
          </p>
          <DialogFooter className="gap-2 sm:justify-center mt-3">
            <Button variant="outline" className="border-gray-200 text-gray-600" onClick={() => setConfirmDeleteOut(null)}>
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
