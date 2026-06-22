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
  DEPTS, DAYS_OF_WEEK,
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
    name: "",
    role: "",
    dept: "Sales",
    contact: "",
    lunch_start: "12:00",
    lunch_end: "13:00",
    daySchedule: DEFAULT_DAY_SCHEDULE,
  })

  useEffect(() => {
    if (open) {
      setForm(
        isEdit && employee
          ? {
            employee_no: employee.employee_no || "",
            name: employee.name,
            role: employee.role || "",
            dept: employee.dept,
            contact: employee.contact || "",
            lunch_start: employee.lunch_start || "12:00",
            lunch_end: employee.lunch_end || "13:00",
            daySchedule: employee.daySchedule || DEFAULT_DAY_SCHEDULE,
          }
          : {
            employee_no: "",
            name: "",
            role: "",
            dept: "Sales",
            contact: "",
            lunch_start: "12:00",
            lunch_end: "13:00",
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

  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      await onSave({ ...form })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[90vh] overflow-y-auto w-auto"
        style={{ maxWidth: '95vw' }}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-gray-900 text-base font-semibold">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEdit ? "Update the employee's information below." : "Fill in the details to add a new employee."}
          </p>
        </DialogHeader>

        {/* ── 2-COLUMN LAYOUT ── */}
        <div className="flex flex-col md:flex-row py-2">

          {/* ── LEFT: Basic Info ── */}
          <div className="flex flex-col gap-5 w-full md:w-[320px]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Basic Info</p>

            <div className="grid grid-cols-2 gap-4">
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

              {/* FULL NAME */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Full Name <span className="text-red-400">*</span></label>
                <Input
                  placeholder="e.g. Juan dela Cruz"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* POSITION */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Position</label>
                <Input
                  placeholder="e.g. Sales Associate"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* CONTACT */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Contact Info</label>
                <Input
                  placeholder="e.g. 0917-123-4567"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* DEPARTMENT */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Department</label>
                <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                    {DEPTS.map(d => (
                      <SelectItem key={d} value={d} className="focus:bg-white focus:text-gray-900 cursor-pointer text-sm">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Shift Schedule ── */}
          <div className="flex flex-col gap-4 w-full md:w-[380px] md:border-l md:border-gray-100 md:ml-8 md:pl-8 mt-8 md:mt-0">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Shift Schedule</p>
              <p className="text-[11px] text-gray-400 mb-3">Toggle to mark a day as rest day.</p>
            </div>

            <div className="flex gap-4 mb-2 px-1">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Lunch Start</label>
                <Input type="time" value={form.lunch_start} onChange={e => setForm({ ...form, lunch_start: e.target.value })} className="bg-white border-gray-200 text-sm h-9 px-2" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Lunch End</label>
                <Input type="time" value={form.lunch_end} onChange={e => setForm({ ...form, lunch_end: e.target.value })} className="bg-white border-gray-200 text-sm h-9 px-2" />
              </div>
            </div>

            {/* Column headers */}
            <div className="grid items-center gap-2.5 px-1" style={{ gridTemplateColumns: '36px 44px 1fr 1fr' }}>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Day</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center">Work</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Start</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">End</span>
            </div>

            {/* Per-day rows */}
            <div className="flex flex-col gap-2.5 px-1">
              {DAYS_OF_WEEK.map(day => {
                const entry = form.daySchedule?.[day] ?? null
                const isWork = entry !== null
                return (
                  <div key={day} className="grid items-center gap-2.5" style={{ gridTemplateColumns: '36px 44px 1fr 1fr' }}>
                    <span className={`text-xs font-semibold ${isWork ? 'text-gray-700' : 'text-gray-300'}`}>
                      {day.slice(0, 3)}
                    </span>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleDayOff(day)}
                        className={`relative h-[20px] w-[36px] rounded-full transition-colors focus:outline-none ${isWork ? 'bg-orange-500' : 'bg-gray-100 dark:bg-gray-100'}`}
                      >
                        <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isWork ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>

                    <Input
                      type="time"
                      value={isWork ? (entry?.start ?? '07:00') : ''}
                      disabled={!isWork}
                      onChange={e => setDayEntry(day, { ...entry, start: e.target.value })}
                      className={`bg-white border-gray-200 text-sm h-9 px-2 transition-opacity ${!isWork ? 'opacity-40 pointer-events-none bg-white' : ''}`}
                    />
                    <Input
                      type="time"
                      value={isWork ? (entry?.end ?? '17:30') : ''}
                      disabled={!isWork}
                      onChange={e => setDayEntry(day, { ...entry, end: e.target.value })}
                      className={`bg-white border-gray-200 text-sm h-9 px-2 transition-opacity ${!isWork ? 'opacity-40 pointer-events-none bg-white' : ''}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-gray-100 mt-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-white text-sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}