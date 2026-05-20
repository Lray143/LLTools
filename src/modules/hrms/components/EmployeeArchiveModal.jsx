import { useState } from "react"
import { Archive, Search } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"
import { getColor, getInitials } from "../employeeConstants"

export function EmployeeArchiveModal({ open, archived, onUnarchive, onClose }) {
  const [search, setSearch] = useState("")

  const filtered = archived.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.dept.toLowerCase().includes(search.toLowerCase()) ||
    emp.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-lg bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-gray-500" /> Archived Employees
          </DialogTitle>
        </DialogHeader>

        {/* SEARCH */}
        {archived.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, department, or ID..."
              className="pl-9 bg-white border-gray-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col py-1 max-h-[50vh] overflow-y-auto">
          {archived.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Archive className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No archived employees yet.</p>
              <p className="text-xs mt-1">Deleted employees will appear here.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <p className="text-sm">No results for "{search}"</p>
            </div>
          ) : (
            filtered.map(emp => (
              <div key={emp.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3 opacity-60">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColor(emp.name)}`}>
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.dept} · {emp.id}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-gray-500 hover:text-green-600 hover:border-green-400"
                  onClick={() => onUnarchive(emp)}
                >
                  Restore
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}