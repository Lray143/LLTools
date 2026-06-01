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
  DEFAULT_SHIFT_START, DEFAULT_SHIFT_END, DEFAULT_DAY_OFFS,
} from "../employeeConstants"

export function EmployeeModal({ open, mode, employee, onSave, onClose }) {
  const isEdit = mode === "edit"

  const [form, setForm] = useState({
    employee_no: "",
    name:        "",
    dept:        "Sales",
    contact:     "",
    status:      "Active",
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
              contact:     employee.contact       || "",
              status:      employee.status        || "Active",
              shiftStart:  employee.shiftStart    || DEFAULT_SHIFT_START,
              shiftEnd:    employee.shiftEnd       || DEFAULT_SHIFT_END,
              dayOffs:     employee.dayOffs       || DEFAULT_DAY_OFFS,
            }
          : {
              employee_no: "",
              name:        "",
              dept:        "Sales",
              contact:     "",
              status:      "Active",
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
        return { ...f, dayOffs: current.filter(d => d !== day) }
      } else {
        return { ...f, dayOffs: [...current, day] }
      }
    })
  }

  function handleSave() {
    if (!form.name.trim()) return
    onSave({ ...form })
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-lg bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-gray-900 text-base font-semibold">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEdit ? "Update the employee's information below." : "Fill in the details to add a new employee."}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">

          {/* ── SECTION: Basic Info ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">

              {/* EMPLOYEE NO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Employee No.
                </label>
                <Input
                  placeholder={isEdit ? "" : "Auto-generated if blank"}
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
                      <SelectItem key={s} value={s} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FULL NAME — spans full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Full Name <span className="text-red-400">*</span></label>
                <Input
                  placeholder="e.g. Juan dela Cruz"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* CONTACT — spans full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Contact Info</label>
                <Input
                  placeholder="e.g. 0917-123-4567"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>

              {/* DEPARTMENT — spans full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Department</label>
                <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
                    {DEPTS.map(d => (
                      <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer text-sm">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-t border-gray-100" />

          {/* ── SECTION: Shift Schedule ── */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Shift Schedule</p>

            {/* SHIFT TIMES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Shift Start</label>
                <Input
                  type="time"
                  value={form.shiftStart}
                  onChange={e => setForm({ ...form, shiftStart: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-10"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Shift End</label>
                <Input
                  type="time"
                  value={form.shiftEnd}
                  onChange={e => setForm({ ...form, shiftEnd: e.target.value })}
                  className="bg-white border-gray-200 text-sm h-10"
                />
              </div>
            </div>

            {/* DAY OFFS */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">
                Day Offs
                <span className="text-gray-400 font-normal ml-1.5">click to toggle</span>
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map(day => {
                  const active = (form.dayOffs || []).includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOff(day)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors text-center w-full ${
                        active
                          ? "bg-orange-50 text-orange-500 border-orange-400"
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