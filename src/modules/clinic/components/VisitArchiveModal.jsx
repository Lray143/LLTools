import { useState }        from "react"
import { Archive, RotateCcw, Trash2, X, ChevronDown } from "lucide-react"
import { Button }           from "../../../components/ui/button"
import SearchBar            from "../../../components/ui/SearchBar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"
import { DISP_CLASS } from "./clinicConstants"

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az',     label: 'A → Z (name)' },
  { value: 'za',     label: 'Z → A (name)' },
]

export default function VisitArchiveModal({
  open,
  archived,
  onUnarchive,
  onPermanentDelete,
  onClose,
}) {
  const [search,        setSearch]        = useState("")
  const [sortBy,        setSortBy]        = useState('newest')
  const [sortOpen,      setSortOpen]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = [...archived]
    .filter(v => {
      const q = search.toLowerCase()
      return (
        (v.fullName  || v.employee  || "").toLowerCase().includes(q) ||
        (v.complaint || "").toLowerCase().includes(q) ||
        (v.date      || "").toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b._rawDate || '') > (a._rawDate || '') ? 1 : -1
      if (sortBy === 'oldest') return (a._rawDate || '') > (b._rawDate || '') ? 1 : -1
      if (sortBy === 'az')     return (a.fullName || a.employee || '').localeCompare(b.fullName || b.employee || '')
      if (sortBy === 'za')     return (b.fullName || b.employee || '').localeCompare(a.fullName || a.employee || '')
      return 0
    })

  function handleConfirmPermanent() {
    if (confirmDelete) {
      onPermanentDelete(confirmDelete)
      setConfirmDelete(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* ── SIDE PANEL OVERLAY ── */}
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/40"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div id="tour-clinic-archive-panel" className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Archived Visit Records</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {archived.length} archived record{archived.length !== 1 ? 's' : ''} · Restore or permanently delete
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

          {/* Search + Sort — always visible */}
          <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by name, complaint, or date..."
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

            {/* Empty state — no archived records at all */}
            {archived.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Archive className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Archive is empty</p>
                  <p className="text-xs text-gray-400 mt-0.5">Removed visit records will appear here</p>
                </div>
              </div>
            )}

            {/* No search results */}
            {archived.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">No results for "{search}"</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try a different name, complaint, or date</p>
                </div>
              </div>
            )}

            {/* Record list */}
            {filtered.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {filtered.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-orange-50/50 border border-gray-100 hover:border-orange-100 rounded-lg transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {v.fullName || v.employee}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.date} · {v.complaint} ·{" "}
                        <span className={`font-medium ${DISP_CLASS[v.disposition]}`}>
                          {v.disposition}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 gap-1 px-2.5"
                        onClick={() => onUnarchive(v)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 gap-1 px-2.5"
                        onClick={() => setConfirmDelete(v)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400 text-center">
              Restore brings a record back to active · Permanent delete cannot be undone
            </p>
          </div>

        </div>
      </div>

      {/* ── CONFIRM PERMANENT DELETE DIALOG ── */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={val => { if (!val) setConfirmDelete(null) }}
      >
        <DialogContent className="sm:max-w-sm bg-white border-0 outline-none focus:outline-none ring-0 p-6 z-[60]">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <DialogTitle className="text-gray-900 font-semibold text-base">
                Permanently Delete?
              </DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-500 text-center px-1">
            This action cannot be undone. The visit record for{" "}
            <span className="font-semibold text-gray-800">
              {confirmDelete?.fullName || confirmDelete?.employee}
            </span>{" "}
            will be permanently removed.
          </p>
          <DialogFooter className="gap-2 sm:justify-center mt-3">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-600"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white border-0"
              onClick={handleConfirmPermanent}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}