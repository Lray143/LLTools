import { useState, useEffect, useRef } from "react"
import { CalendarPlus, Search, ChevronDown, X } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input }  from "../../../components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select"
import { LEAVE_TYPES, getColor, getInitials } from "../employeeConstants"

// ── Searchable employee combobox ─────────────────────────────────────────────
function EmployeeCombobox({ employees, value, onChange }) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState("")
  const containerRef        = useRef(null)
  const inputRef            = useRef(null)

  const selected = employees.find(e => e.id === value)

  const filtered = query.trim()
    ? employees.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        (e.employee_no ?? "").toLowerCase().includes(query.toLowerCase()) ||
        e.dept.toLowerCase().includes(query.toLowerCase())
      )
    : employees

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  function select(emp) {
    onChange(emp.id)
    setOpen(false)
    setQuery("")
  }

  function handleTriggerClick() {
    setOpen(o => !o)
    // focus the search input after opening
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-800 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className={`flex-shrink-0 inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-[9px] font-bold ${getColor(selected.name)}`}>
              {getInitials(selected.name)}
            </span>
            <span className="font-medium truncate">{selected.name}</span>
            <span className="text-gray-400 text-xs flex-shrink-0">· {selected.dept}</span>
          </span>
        ) : (
          <span className="text-gray-400">Select employee…</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[300] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, ID, or dept…"
              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No employees match "{query}"</p>
            ) : (
              filtered.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => select(emp)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-white ${emp.id === value ? "bg-sky-50" : ""}`}
                >
                  <span className={`flex-shrink-0 inline-flex w-7 h-7 rounded-full items-center justify-center text-white text-xs font-bold ${getColor(emp.name)}`}>
                    {getInitials(emp.name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 block truncate">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.dept} · {emp.employee_no}</span>
                  </span>
                  {emp.id === value && (
                    <span className="text-sky-500 text-xs font-semibold flex-shrink-0">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────
export function EmployeeLeaveModal({ open, employees, onSave, onClose }) {
  const [employeeId, setEmployeeId] = useState("")
  const [leaveType,  setLeaveType]  = useState("Paid Leave")
  const [leaveStart, setLeaveStart] = useState("")
  const [leaveEnd,   setLeaveEnd]   = useState("")
  const [error,      setError]      = useState("")

  useEffect(() => {
    if (open) {
      setEmployeeId("")
      setLeaveType("Paid Leave")
      setLeaveStart("")
      setLeaveEnd("")
      setError("")
    }
  }, [open])

  const selectedEmp = employees.find(e => e.id === employeeId)

  function handleSave() {
    if (!employeeId)               { setError("Please select an employee.");        return }
    if (!leaveStart)               { setError("Please set a leave start date.");    return }
    if (!leaveEnd)                 { setError("Please set a leave end date.");      return }
    if (leaveEnd < leaveStart)     { setError("End date must be after start date."); return }
    setError("")
    onSave({ employeeId, leaveType, leaveStart, leaveEnd })
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 min-h-[580px] flex flex-col overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <CalendarPlus className="w-4 h-4 text-sky-500" />
            File a Leave
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 flex-1">

          {/* EMPLOYEE PICKER */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Employee</label>
            <EmployeeCombobox
              employees={employees}
              value={employeeId}
              onChange={setEmployeeId}
            />

            {/* Mini preview card */}
            {selectedEmp && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 mt-0.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${getColor(selectedEmp.name)}`}>
                  {getInitials(selectedEmp.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{selectedEmp.name}</p>
                  <p className="text-xs text-gray-400">{selectedEmp.dept} · {selectedEmp.employee_no}</p>
                </div>
              </div>
            )}
          </div>

          {/* LEAVE TYPE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Type of Leave</label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="z-[200] bg-white border border-gray-200"
                style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}
              >
                {LEAVE_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="focus:bg-white focus:text-gray-900 cursor-pointer">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATE RANGE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Leave Start</label>
              <Input
                type="date"
                value={leaveStart}
                onChange={e => setLeaveStart(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Leave End</label>
              <Input
                type="date"
                value={leaveEnd}
                min={leaveStart || undefined}
                onChange={e => setLeaveEnd(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* DATE RANGE SUMMARY */}
          {leaveStart && leaveEnd && leaveEnd >= leaveStart && (
            <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-xs text-sky-700">
              <span className="font-semibold">
                {(() => {
                  const s    = new Date(leaveStart + "T00:00:00")
                  const e    = new Date(leaveEnd   + "T00:00:00")
                  const days = Math.round((e - s) / 86400000) + 1
                  return `${days} day${days !== 1 ? "s" : ""}`
                })()}
              </span>
              {" "}of leave will be filed.
              Attendance records will be marked as <span className="font-semibold">Leave</span> for each day.
            </div>
          )}

          {/* ERROR */}
          {error && (
            <p className="text-xs text-red-500 -mt-1">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-white" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-sky-500 hover:bg-sky-600 text-white border-0" onClick={handleSave}>
            File Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}