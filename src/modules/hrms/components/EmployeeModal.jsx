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
  DEPTS, STATUSES, LEAVE_TYPES, DAYS_OF_WEEK,
  DEFAULT_SHIFT_START, DEFAULT_SHIFT_END, DEFAULT_DAY_OFFS,
} from "../employeeConstants"

export function EmployeeModal({ open, mode, employee, onSave, onClose }) {
  const isEdit = mode === "edit"

  const [form, setForm] = useState({
    employee_no: "",
    name:        "",
    dept:        "Sales",
    status:      "Active",
    contact:     "",
    leaveType:   "Paid Leave",
    leaveStart:  "",
    leaveEnd:    "",
    shiftStart:  DEFAULT_SHIFT_START,
    shiftEnd:    DEFAULT_SHIFT_END,
    dayOffs:     DEFAULT_DAY_OFFS,
  })

  useEffect(() => {
    if (open) {
      setForm(
        isEdit && employee
          ? {
              employee_no: employee.employee_no  || "",
              name:        employee.name,
              dept:        employee.dept,
              status:      employee.status        || "Active",
              contact:     employee.contact       || "",
              leaveType:   employee.leaveType     || "Paid Leave",
              leaveStart:  employee.leaveStart    || "",
              leaveEnd:    employee.leaveEnd       || "",
              shiftStart:  employee.shiftStart    || DEFAULT_SHIFT_START,
              shiftEnd:    employee.shiftEnd       || DEFAULT_SHIFT_END,
              dayOffs:     employee.dayOffs       || DEFAULT_DAY_OFFS,
            }
          : {
              employee_no: "",
              name:        "",
              dept:        "Sales",
              status:      "Active",
              contact:     "",
              leaveType:   "Paid Leave",
              leaveStart:  "",
              leaveEnd:    "",
              shiftStart:  DEFAULT_SHIFT_START,
              shiftEnd:    DEFAULT_SHIFT_END,
              dayOffs:     DEFAULT_DAY_OFFS,
            }
      )
    }
  }, [open, employee?.id, mode])

  function toggleDayOff(day) {
    setForm(f => {
      const current = f.dayOffs || []
      if (current.includes(day)) {
        // prevent removing all days — must keep at least 0, but allow empty
        return { ...f, dayOffs: current.filter(d => d !== day) }
      } else {
        return { ...f, dayOffs: [...current, day] }
      }
    })
  }

  function handleSave() {
    if (!form.name.trim()) return
    const submittedData = { ...form }
    if (submittedData.status !== "On Leave") {
      submittedData.leaveType  = ""
      submittedData.leaveStart = ""
      submittedData.leaveEnd   = ""
    }
    onSave(submittedData)
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* EMPLOYEE NO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Employee No.
              {!isEdit && <span className="text-gray-400 font-normal ml-1">(auto-generated if left blank)</span>}
            </label>
            <Input
              placeholder="e.g. 1024"
              value={form.employee_no}
              onChange={e => setForm({ ...form, employee_no: e.target.value })}
              className="bg-white border-gray-200"
            />
          </div>

          {/* FULL NAME */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              placeholder="e.g. Juan dela Cruz"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-white border-gray-200"
            />
          </div>

          {/* CONTACT */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Contact Info</label>
            <Input
              placeholder="e.g. 0917-123-4567"
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="bg-white border-gray-200"
            />
          </div>

          {/* DEPARTMENT */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                {DEPTS.map(d => (
                  <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STATUS */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={form.status} onValueChange={val => setForm({ ...form, status: val })}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LEAVE FIELDS */}
          {form.status === "On Leave" && (
            <div className="flex flex-col gap-4 pt-1 animate-in fade-in duration-150">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Type of Leave</label>
                <Select value={form.leaveType} onValueChange={val => setForm({ ...form, leaveType: val })}>
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                    {LEAVE_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Leave Start</label>
                  <Input type="date" value={form.leaveStart}
                    onChange={e => setForm({ ...form, leaveStart: e.target.value })}
                    className="bg-white border-gray-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Leave End</label>
                  <Input type="date" value={form.leaveEnd}
                    onChange={e => setForm({ ...form, leaveEnd: e.target.value })}
                    className="bg-white border-gray-200" />
                </div>
              </div>
            </div>
          )}

          {/* DIVIDER */}
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Shift Schedule
            </p>

            {/* SHIFT TIMES */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Shift Start</label>
                <Input
                  type="time"
                  value={form.shiftStart}
                  onChange={e => setForm({ ...form, shiftStart: e.target.value })}
                  className="bg-white border-gray-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Shift End</label>
                <Input
                  type="time"
                  value={form.shiftEnd}
                  onChange={e => setForm({ ...form, shiftEnd: e.target.value })}
                  className="bg-white border-gray-200"
                />
              </div>
            </div>

            {/* DAY OFFS */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Day Offs
                <span className="text-gray-400 font-normal ml-1">(click to toggle)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const active = (form.dayOffs || []).includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOff(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}