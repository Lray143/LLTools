import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select"
import {
  DEPTS, STATUSES, DAYS_OF_WEEK,
  DEFAULT_DAY_SCHEDULE,
} from "../employeeConstants"

// Helper: "07:00" → "7:00 AM", "18:00" → "6:00 PM"
function fmtTime(str) {
  if (!str) return ''
  const [h, m] = str.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function EmployeeModal({ open, mode, employee, onSave, onClose }) {
  const isEdit = mode === "edit"

  const [form, setForm] = useState({
    employee_no: "",
    name:        "",
    dept:        "Sales",
    contact:     "",
    status:      "Active",
    daySchedule: DEFAULT_DAY_SCHEDULE,
  })

  useEffect(() => {
    if (open) {
      setForm(
        isEdit && employee
          ? {
              employee_no: employee.employee_no  || "",
              name:        employee.name,
              dept:        employee.dept,
              contact:     employee.contact       || "",
              status:      employee.status        || "Active",
              daySchedule: employee.daySchedule   || DEFAULT_DAY_SCHEDULE,
            }
          : {
              employee_no: "",
              name:        "",
              dept:        "Sales",
              contact:     "",
              status:      "Active",
              daySchedule: DEFAULT_DAY_SCHEDULE,
            }
      )
    }
  }, [open, employee?.id, mode])

  function setDayEntry(day, entry) {
    setForm(f => ({
      ...f,
      daySchedule: { ...f.daySchedule, [day]: entry },
    }))
  }

  function toggleDayOff(day) {
    const current = form.daySchedule[day]
    if (current === null) {
      // Turn back on — use default for that day
      setDayEntry(day, DEFAULT_DAY_SCHEDULE[day] ?? { start: '07:00', end: '17:30' })
    } else {
      setDayEntry(day, null)
    }
  }

  function handleSave() {
    if (!form.name.trim()) return
    onSave({ ...form })
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: '820px', width: '95vw' }}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-gray-900 text-base font-semibold">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEdit ? "Update the employee's information below." : "Fill in the details to add a new employee."}
          </p>
        </DialogHeader>

        {/* ── 2-COLUMN LAYOUT ── */}
        <div className="grid gap-6 py-1" style={{ gridTemplateColumns: '1fr 1fr' }}>

          {/* ── LEFT: Basic Info ── */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Basic Info</p>

            <div className="grid grid-cols-2 gap-3">
              {/* EMPLOYEE NO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Employee No.</label>
                <Input
                  placeholder={isEdit ? "" : "Auto-generated"}
                  value={form.employee_no}
                  onChange={e => setForm({ ...form, employee_no: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* STATUS */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Status</label>
                <Select value={form.status} onValueChange={val => setForm({ ...form, status: val })}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer text-sm">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* FULL NAME */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Full Name <span className="text-red-400">*</span></label>
              <Input
                placeholder="e.g. Juan dela Cruz"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="bg-white border-gray-200 text-sm h-9"
              />
            </div>

            {/* CONTACT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Contact Info</label>
              <Input
                placeholder="e.g. 0917-123-4567"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                className="bg-white border-gray-200 text-sm h-9"
              />
            </div>

            {/* DEPARTMENT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Department</label>
              <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
                <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                  {DEPTS.map(d => (
                    <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer text-sm">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Summary card */}
            <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-3 mt-auto">
              <p className="text-[11px] text-orange-600 font-semibold mb-2 uppercase tracking-widest">Schedule Summary</p>
              <div className="flex flex-col gap-1">
                {DAYS_OF_WEEK.map(day => {
                  const entry = form.daySchedule?.[day] ?? null
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-[11px] text-orange-400 w-9 font-medium">{day.slice(0, 3)}</span>
                      <span className="text-[11px] font-semibold text-orange-700">
                        {entry === null ? 'Day Off' : `${fmtTime(entry.start)} – ${fmtTime(entry.end)}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-l border-gray-100 pl-6 flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Shift Schedule</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Toggle "Off" to mark a rest day.</p>
            </div>

            {/* Column headers */}
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: '36px 52px 1fr 1fr' }}>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Day</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Off</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Start</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">End</span>
            </div>

            {/* Per-day rows */}
            {DAYS_OF_WEEK.map(day => {
              const entry = form.daySchedule?.[day] ?? null
              const isOff = entry === null
              return (
                <div key={day} className="grid items-center gap-2" style={{ gridTemplateColumns: '36px 52px 1fr 1fr' }}>
                  <span className={`text-xs font-semibold ${isOff ? 'text-gray-300' : 'text-gray-600'}`}>
                    {day.slice(0, 3)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDayOff(day)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all text-center ${
                      isOff
                        ? 'bg-orange-50 text-orange-500 border-orange-300'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-orange-300 hover:text-orange-400'
                    }`}
                  >
                    {isOff ? 'Off ✓' : 'Off'}
                  </button>
                  <Input
                    type="time"
                    value={isOff ? '' : (entry?.start ?? '07:00')}
                    disabled={isOff}
                    onChange={e => setDayEntry(day, { ...entry, start: e.target.value })}
                    className={`bg-white border-gray-200 text-sm h-9 transition-opacity ${isOff ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                  <Input
                    type="time"
                    value={isOff ? '' : (entry?.end ?? '17:30')}
                    disabled={isOff}
                    onChange={e => setDayEntry(day, { ...entry, end: e.target.value })}
                    className={`bg-white border-gray-200 text-sm h-9 transition-opacity ${isOff ? 'opacity-30 pointer-events-none' : ''}`}
                  />
                </div>
              )
            })}
          </div>

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}