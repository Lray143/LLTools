import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"

export default function NewEntryForm({ form, set, saved, onSave }) {
  return (
    <div className="flex-[1.45] bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">New Clinic Entry</h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="bg-white border-gray-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Time</label>
          <Input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="bg-white border-gray-200" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name</label>
        <Input
          placeholder="Enter employee name..."
          value={form.employee}
          onChange={e => set("employee", e.target.value)}
          className="bg-white border-gray-200"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Complaint / Reason</label>
        <Input
          placeholder="e.g. Headache, Fever, Wound care..."
          value={form.complaint}
          onChange={e => set("complaint", e.target.value)}
          className="bg-white border-gray-200"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Vital Signs</label>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="BP (e.g. 120/80)" value={form.bp} onChange={e => set("bp", e.target.value)} className="bg-white border-gray-200" />
          <Input placeholder="Temp (°C)" value={form.temp} onChange={e => set("temp", e.target.value)} className="bg-white border-gray-200" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Treatment / Action Taken</label>
        <textarea
          placeholder="Describe treatment or medication given..."
          value={form.treatment}
          onChange={e => set("treatment", e.target.value)}
          className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white resize-y outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Disposition</label>
        <Select value={form.disposition} onValueChange={v => set("disposition", v)}>
          <SelectTrigger className="w-full bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="sent-back">Sent back to work</SelectItem>
            <SelectItem value="sent-home">Sent home</SelectItem>
            <SelectItem value="referred">Referred to hospital</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onSave}
        className={`w-full ${saved ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"} text-white`}
      >
        {saved ? "✓ Record Saved!" : "Save Clinic Record"}
      </Button>
    </div>
  )
}