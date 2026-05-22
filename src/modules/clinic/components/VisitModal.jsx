import { useState, useEffect } from "react"
import { Button }  from "../../../components/ui/button"
import { Input }   from "../../../components/ui/input"
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

const DISPOSITIONS = ["Back to work", "Sent home", "Monitoring", "Referred"]

export default function VisitModal({ open, visit, onSave, onClose }) {
  const [form, setForm] = useState({
    fullName:    "",
    complaint:   "",
    bp:          "",
    temp:        "",
    treatment:   "",
    disposition: "Back to work",
  })

  // Pre-fill when a visit is passed in
  useEffect(() => {
    if (open && visit) {
      setForm({
        fullName:    visit.fullName || visit.employee || "",
        complaint:   visit.complaint   || "",
        bp:          visit.bp          || "",
        temp:        visit.temp        || "",
        treatment:   visit.treatment   || "",
        disposition: visit.disposition || "Back to work",
      })
    }
  }, [open, visit])

  function handleSave() {
    if (!form.fullName.trim()) return

    const parts     = form.fullName.trim().split(" ")
    const shortName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : form.fullName.trim()

    onSave({
      ...visit,                         // keep date / time / month unchanged
      fullName:    form.fullName.trim(),
      employee:    shortName,
      complaint:   form.complaint,
      bp:          form.bp,
      temp:        form.temp,
      treatment:   form.treatment,
      disposition: form.disposition,
    })
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Edit Visit Record</DialogTitle>
          {visit && (
            <p className="text-xs text-gray-400 mt-0.5">
              {visit.date} · {visit.time}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* Employee name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Employee Name</label>
            <Input
              placeholder="Full name"
              value={form.fullName}
              onChange={e => f("fullName", e.target.value)}
              className="bg-white border-gray-200"
            />
          </div>

          {/* Complaint */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Complaint / Reason</label>
            <Input
              placeholder="e.g. Headache, Fever, Wound care…"
              value={form.complaint}
              onChange={e => f("complaint", e.target.value)}
              className="bg-white border-gray-200"
            />
          </div>

          {/* Vital signs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Vital Signs</label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="BP (e.g. 120/80)"
                value={form.bp}
                onChange={e => f("bp", e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                placeholder="Temp (°C)"
                value={form.temp}
                onChange={e => f("temp", e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Treatment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Treatment / Action Taken</label>
            <textarea
              placeholder="Describe treatment or medication given…"
              value={form.treatment}
              onChange={e => f("treatment", e.target.value)}
              className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white resize-y outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Disposition */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Disposition</label>
            <Select value={form.disposition} onValueChange={val => f("disposition", val)}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-white border border-gray-200">
                {DISPOSITIONS.map(d => (
                  <SelectItem
                    key={d}
                    value={d}
                    className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer"
                  >
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}