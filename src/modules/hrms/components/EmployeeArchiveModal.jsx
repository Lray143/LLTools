import { useState } from "react"
import { Archive, RotateCcw, Trash2, X, ChevronDown } from "lucide-react"
import { Button } from "../../../components/ui/button"
import SearchBar from "../../../components/ui/SearchBar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"
import { getColor, getInitials } from "../employeeConstants"

const SORT_OPTIONS = [
  { value: 'az',   label: 'A → Z' },
  { value: 'za',   label: 'Z → A' },
  { value: 'dept', label: 'By Department' },
  { value: 'id',   label: 'By Employee ID' },
]

export function EmployeeArchiveModal({ open, archived, onUnarchive, onPermanentDelete, onClose }) {
  const [search, setSearch] = useState("")
  const [sortBy,   setSortBy]   = useState('az')
  const [sortOpen, setSortOpen] = useState(false)
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState(null)

  const filtered = [...archived]
    .filter(emp =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.dept.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee_no ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'az')   return a.name.localeCompare(b.name)
      if (sortBy === 'za')   return b.name.localeCompare(a.name)
      if (sortBy === 'dept') return (a.dept || '').localeCompare(b.dept || '') || a.name.localeCompare(b.name)
      if (sortBy === 'id')   return (a.employee_no || '').localeCompare(b.employee_no || '')
      return 0
    })

  function handleConfirmPermanent() {
    if (confirmDeleteEmp) {
      onPermanentDelete(confirmDeleteEmp.id)
      setConfirmDeleteEmp(null)
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
        <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Archived Employees</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {archived.length} archived employee{archived.length !== 1 ? 's' : ''} · Restore or permanently delete
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
                placeholder="Search by name, department, or ID..."
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

            {/* Empty state — no archived employees at all */}
            {archived.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                  <Archive className="w-7 h-7 text-gray-300 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Archive is empty</p>
                  <p className="text-xs text-gray-400 mt-0.5">Removed employees will appear here</p>
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
                  <p className="text-xs text-gray-400 mt-0.5">Try a different name, department, or ID</p>
                </div>
              </div>
            )}

            {/* Employee list */}
            {filtered.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {filtered.map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between py-2.5 px-3 bg-white hover:bg-orange-50/50 border border-gray-100 hover:border-orange-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColor(emp.name)}`}>
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.dept} · {emp.employee_no}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 gap-1 px-2.5"
                        onClick={() => onUnarchive(emp)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 gap-1 px-2.5"
                        onClick={() => setConfirmDeleteEmp(emp)}
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
              Restore brings an employee back to active · Permanent delete cannot be undone
            </p>
          </div>

        </div>
      </div>

      {/* ── CONFIRM PERMANENT DELETE DIALOG ── */}
      <Dialog open={confirmDeleteEmp !== null} onOpenChange={val => { if (!val) setConfirmDeleteEmp(null) }}>
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
            <span className="font-semibold text-gray-800">{confirmDeleteEmp?.name}</span> will be completely removed from the database records.
          </p>
          <DialogFooter className="gap-2 sm:justify-center mt-3">
            <Button variant="outline" className="border-gray-200 text-gray-600" onClick={() => setConfirmDeleteEmp(null)}>
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