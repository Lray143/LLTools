import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { DEPTS, STATUSES, LEAVE_TYPES } from "../employeeConstants"

export function EmployeeModal({ open, mode, employee, onSave, onClose }) {
  const isEdit = mode === "edit"
  const [form, setForm] = useState({ 
    name: "", 
    dept: "Sales", 
    status: "Active", 
    contact: "",
    leaveType: "Paid Leave", 
    leaveStart: "", 
    leaveEnd: "" 
  })

  useEffect(() => {
    if (open) {
      setForm(
        isEdit && employee
          ? { 
              name: employee.name, 
              dept: employee.dept, 
              status: employee.status || "Active",
              contact: employee.contact || "",
              leaveType: employee.leaveType || "Paid Leave",
              leaveStart: employee.leaveStart || "",
              leaveEnd: employee.leaveEnd || ""
            }
          : { name: "", dept: "Sales", status: "Active", contact: "", leaveType: "Paid Leave", leaveStart: "", leaveEnd: "" }
      )
    }
  }, [open, employee?.id, mode])

  function handleSave() {
    if (!form.name.trim()) return
    
    const submittedData = { ...form }
    if (submittedData.status !== "On Leave") {
      submittedData.leaveType = ""
      submittedData.leaveStart = ""
      submittedData.leaveEnd = ""
    }
    
    onSave(submittedData)
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              placeholder="e.g. Juan dela Cruz"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-white border-gray-200"
            />
          </div>

          {/* CONTACT NUMBER FIELD */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Contact Info</label>
            <Input
              placeholder="e.g. 0917-123-4567"
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="bg-white border-gray-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <Select value={form.dept} onValueChange={val => setForm({ ...form, dept: val })}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-white border border-gray-200">
                {DEPTS.map(d => (
                  <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={form.status} onValueChange={val => setForm({ ...form, status: val })}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-white border border-gray-200">
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.status === "On Leave" && (
            <div className="flex flex-col gap-4 pt-1 animate-in fade-in duration-150">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Type of Leave</label>
                <Select value={form.leaveType} onValueChange={val => setForm({ ...form, leaveType: val })}>
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-white border border-gray-200">
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
                  <Input
                    type="date"
                    value={form.leaveStart}
                    onChange={e => setForm({ ...form, leaveStart: e.target.value })}
                    className="bg-white border-gray-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Leave End</label>
                  <Input
                    type="date"
                    value={form.leaveEnd}
                    onChange={e => setForm({ ...form, leaveEnd: e.target.value })}
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={onClose}>Cancel</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}