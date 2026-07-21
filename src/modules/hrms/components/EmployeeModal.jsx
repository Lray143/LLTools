import { useState, useEffect } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog"
import { NotificationModal } from "../../../components/ui/NotificationModal"
import { toTitleCase, digitsOnly, formatContact } from "../../../lib/validation"
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
  const [error, setError] = useState("")

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Full Name is required.")
      return
    }
    setError("")
    setIsSaving(true)
    try {
      await onSave({ ...form })
    } finally {
      setIsSaving(false)
    }
  }

  const [resetOpen, setResetOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [notificationState, setNotificationState] = useState({ open: false, title: '', message: '', type: 'info' })

  async function handleResetCredentials() {
    if (!employee?.id) return
    setIsResetting(true)
    try {
      const res = await window.electronAPI.resetEmployeeCredentials(employee.id)
      if (res.success) {
        setResetOpen(false)
        setNotificationState({
          open: true,
          title: 'Credentials Reset',
          message: 'Credentials successfully reset to Employee No.',
          type: 'success'
        })
      } else {
        setNotificationState({
          open: true,
          title: 'Reset Failed',
          message: res.message || 'Failed to reset credentials.',
          type: 'error'
        })
      }
    } catch (err) {
      setNotificationState({
        open: true,
        title: 'Error',
        message: 'An error occurred while resetting credentials.',
        type: 'error'
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }} modal={false}>
      <DialogContent 
        className="outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[90vh] overflow-y-auto w-auto"
        style={{ maxWidth: '95vw', background: 'var(--surface)' }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {isEdit ? "Update the employee's information below." : "Fill in the details to add a new employee."}
          </p>
        </DialogHeader>

        {/* ── 2-COLUMN LAYOUT ── */}
        <div className="flex flex-col md:flex-row py-2">

          {/* ── LEFT: Basic Info ── */}
          <div id="tour-emp-modal-basic" className="flex flex-col gap-5 w-full md:w-[320px]">
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Basic Info</p>

            <div className="grid grid-cols-2 gap-4">
              {/* EMPLOYEE NO */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Employee No.</label>
                <Input
                  placeholder={isEdit ? "" : "Auto-generated"}
                  value={form.employee_no}
                  onChange={e => setForm({ ...form, employee_no: digitsOnly(e.target.value) })}
                  style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36 }}
                />
              </div>

              {/* FULL NAME */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <Input
                  placeholder="e.g. Juan dela Cruz"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onBlur={e => setForm(f => ({ ...f, name: toTitleCase(f.name) }))}
                  style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36 }}
                />
              </div>

              {/* POSITION */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Position</label>
                <Input
                  placeholder="e.g. Sales Associate"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  onBlur={e => setForm(f => ({ ...f, role: toTitleCase(f.role) }))}
                  style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36 }}
                />
              </div>

              {/* CONTACT */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Contact Info</label>
                <Input
                  placeholder="e.g. 0917-123-4567"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  onBlur={e => setForm(f => ({ ...f, contact: formatContact(f.contact) }))}
                  style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36 }}
                />
              </div>

              {/* DEPARTMENT */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Department</label>
                <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
                  <SelectTrigger style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', height: 36, fontSize: 13 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" style={{ zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                    {DEPTS.map(d => (
                      <SelectItem key={d} value={d} className="cursor-pointer text-sm">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Shift Schedule ── */}
          <div id="tour-emp-modal-schedule" className="flex flex-col gap-4 w-full md:w-[380px] md:border-l md:ml-8 md:pl-8 mt-8 md:mt-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Shift Schedule</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 12px' }}>Toggle to mark a day as rest day.</p>
            </div>

            <div className="flex gap-4 mb-2 px-1">
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lunch Start</label>
                <Input type="time" value={form.lunch_start} onChange={e => setForm({ ...form, lunch_start: e.target.value })} style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36, padding: '0 8px' }} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lunch End</label>
                <Input type="time" value={form.lunch_end} onChange={e => setForm({ ...form, lunch_end: e.target.value })} style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 13, height: 36, padding: '0 8px' }} />
              </div>
            </div>

            {/* Column headers */}
            <div className="grid items-center gap-2.5 px-1" style={{ gridTemplateColumns: '36px 44px 1fr 1fr' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Work</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Start</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>End</span>
            </div>

            {/* Per-day rows */}
            <div className="flex flex-col gap-2.5 px-1">
              {DAYS_OF_WEEK.map(day => {
                const entry = form.daySchedule?.[day] ?? null
                const isWork = entry !== null
                return (
                  <div key={day} className="grid items-center gap-2.5" style={{ gridTemplateColumns: '36px 44px 1fr 1fr' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isWork ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: isWork ? 1 : 0.4 }}>
                      {day.slice(0, 3)}
                    </span>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleDayOff(day)}
                        style={{
                          position: 'relative', height: 20, width: 36, borderRadius: 10,
                          border: 'none', cursor: 'pointer', flexShrink: 0,
                          background: isWork ? 'var(--theme-500)' : 'var(--surface-hover)',
                          transition: 'background 200ms',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2, width: 16, height: 16,
                          borderRadius: '50%', background: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'transform 200ms',
                          transform: isWork ? 'translateX(18px)' : 'translateX(2px)',
                        }} />
                      </button>
                    </div>

                    <Input
                      type="time"
                      value={isWork ? (entry?.start ?? '07:00') : ''}
                      disabled={!isWork}
                      onChange={e => setDayEntry(day, { ...entry, start: e.target.value })}
                      style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 12, height: 36, padding: '0 8px', opacity: isWork ? 1 : 0.35 }}
                    />
                    <Input
                      type="time"
                      value={isWork ? (entry?.end ?? '17:30') : ''}
                      disabled={!isWork}
                      onChange={e => setDayEntry(day, { ...entry, end: e.target.value })}
                      style={{ background: 'var(--page-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 12, height: 36, padding: '0 8px', opacity: isWork ? 1 : 0.35 }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <DialogFooter>
          <div className="flex flex-col w-full">
            {error && <div className="text-red-500 text-xs mb-3 font-medium text-right">{error}</div>}
            <div className="flex justify-end gap-2 w-full">
              {isEdit && (
                <div className="flex-1 flex justify-start">
                  <Button id="tour-emp-modal-reset" type="button" variant="ghost" className="text-muted-foreground hover:text-theme-600 hover:bg-theme-50 text-sm px-2 flex items-center gap-1.5" onClick={() => setResetOpen(true)}>
                    <RotateCcw className="w-4 h-4" />
                    Reset Credentials
                  </Button>
                </div>
              )}
              <Button variant="outline" className="text-sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button id="tour-emp-modal-save" className="bg-theme-500 hover:bg-theme-600 text-white border-0 text-sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={resetOpen} onOpenChange={val => { if (!val) setResetOpen(false) }}>
      <DialogContent className="sm:max-w-sm bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 z-[200]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2 pb-1">
            <div className="w-12 h-12 rounded-full bg-theme-50 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-theme-500" />
            </div>
            <DialogTitle className="text-center text-gray-900">Reset Credentials</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-gray-500 text-center px-2 pb-2">
          Are you sure you want to reset credentials for{" "}
          <span className="font-semibold text-gray-800">{employee?.name}</span>?
          <br/><br/>
          This will change their username and password back to their Employee No.
        </p>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setResetOpen(false)} disabled={isResetting}>Cancel</Button>
          <Button className="flex-1 bg-theme-500 hover:bg-theme-600 text-white border-0" onClick={handleResetCredentials} disabled={isResetting}>
            {isResetting ? "Resetting..." : "Confirm Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <NotificationModal 
      open={notificationState.open}
      title={notificationState.title}
      message={notificationState.message}
      type={notificationState.type}
      onClose={() => setNotificationState(prev => ({ ...prev, open: false }))}
    />
    </>
  )
}