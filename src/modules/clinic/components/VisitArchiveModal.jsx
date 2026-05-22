import { useState }        from "react"
import { Archive, Search, RotateCcw, Trash2 } from "lucide-react"
import { Button }           from "../../../components/ui/button"
import { Input }            from "../../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"
import { DISP_CLASS } from "./clinicConstants"

export default function VisitArchiveModal({
  open,
  archived,
  onUnarchive,
  onPermanentDelete,
  onClose,
}) {
  const [search,        setSearch]        = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = archived.filter(v => {
    const q = search.toLowerCase()
    return (
      (v.fullName  || v.employee  || "").toLowerCase().includes(q) ||
      (v.complaint || "").toLowerCase().includes(q) ||
      (v.date      || "").toLowerCase().includes(q)
    )
  })

  function handleConfirmPermanent() {
    if (confirmDelete) {
      onPermanentDelete(confirmDelete)
      setConfirmDelete(null)
    }
  }

  return (
    <>
      {/* ── MAIN ARCHIVE MODAL ──────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
        <DialogContent className="sm:max-w-lg w-full h-[520px] flex flex-col bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 p-6">

          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
              <Archive className="w-5 h-5 text-gray-500" />
              Archived Visit Records
            </DialogTitle>
          </DialogHeader>

          {/* Search – only shown when there's something to search */}
          {archived.length > 0 && (
            <div className="relative mt-2 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search archive…"
                className="pl-9 bg-white border-gray-200 w-full focus:border-gray-300 focus:ring-0"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Record list */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
            {archived.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1.5">
                <Archive className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                <p className="text-sm font-medium">Archive is empty</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1">
                <p className="text-sm font-medium">No results for "{search}"</p>
                <p className="text-xs">Check spelling or try another keyword</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filtered.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-gray-200 transition-all"
                  >
                    {/* Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {v.fullName || v.employee}
                      </p>
                      <p className="text-xs text-gray-400">
                        {v.date} · {v.complaint} ·{" "}
                        <span className={`font-medium ${DISP_CLASS[v.disposition]}`}>
                          {v.disposition}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 gap-1"
                        onClick={() => onUnarchive(v)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => setConfirmDelete(v)}
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex-shrink-0 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={onClose}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SECONDARY PERMANENT-DELETE CONFIRMATION ─────────────────────── */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={val => { if (!val) setConfirmDelete(null) }}
      >
        <DialogContent className="sm:max-w-sm bg-white border-0 outline-none p-6">
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