import { useRef, useState, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"

const DISPOSITION_OPTIONS = [
  { value: "sent-back", label: "Sent back to work" },
  { value: "sent-home", label: "Sent home" },
  { value: "referred",  label: "Referred to hospital" },
  { value: "monitoring", label: "Monitoring" },
]

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: "relative", display: "block", width: "100%" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "0 10px", height: "36px", borderRadius: "8px",
          border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          fontSize: "13px", fontWeight: 500, color: "#2c2010",
          cursor: "pointer", gap: "8px",
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{selected?.label ?? ""}</span>
        <ChevronDown
          size={13}
          color="#a09278"
          style={{ transition: "transform 150ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          width: "100%",
          minWidth: "180px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          zIndex: 999,
          padding: "6px",
          overflow: "hidden",
        }}>
          {options.map(opt => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "none",
                  background: isActive ? "#fff8f2" : "transparent",
                  color: isActive ? "#f97316" : "#2c2010",
                  fontSize: "13px", fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 100ms",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f9f8f6" }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
              >
                {opt.label}
                {isActive && <Check size={13} color="#f97316" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NewEntryForm({ form, set, saved, onSave }) {
  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">

      <h2 className="text-sm font-semibold text-gray-900">New Clinic Entry</h2>

      {/* ── Row 1: Date + Time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="bg-white border-gray-200 h-9" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Time</label>
          <Input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="bg-white border-gray-200 h-9" />
        </div>
      </div>

      {/* ── Row 2: Employee Name ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name</label>
        <Input
          placeholder="Full name"
          value={form.employee}
          onChange={e => set("employee", e.target.value)}
          className="bg-white border-gray-200 h-9"
        />
      </div>

      {/* ── Row 3: Complaint + Disposition side by side ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Complaint / Reason</label>
          <Input
            placeholder="e.g. Headache, Fever..."
            value={form.complaint}
            onChange={e => set("complaint", e.target.value)}
            className="bg-white border-gray-200 h-9"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Disposition</label>
          <CustomSelect
            value={form.disposition}
            onChange={v => set("disposition", v)}
            options={DISPOSITION_OPTIONS}
          />
        </div>
      </div>

      {/* ── Row 4: Vital Signs ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Vital Signs</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">BP</span>
            <Input
              placeholder="120/80"
              value={form.bp}
              onChange={e => set("bp", e.target.value)}
              className="bg-white border-gray-200 h-9 pl-9"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">°C</span>
            <Input
              placeholder="36.5"
              value={form.temp}
              onChange={e => set("temp", e.target.value)}
              className="bg-white border-gray-200 h-9 pl-9"
            />
          </div>
        </div>
      </div>

      {/* ── Row 5: Treatment (flex-1 so it fills remaining space) ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Treatment / Action Taken</label>
        <textarea
          placeholder="Treatment or medication given..."
          value={form.treatment}
          onChange={e => set("treatment", e.target.value)}
          className="flex-1 w-full min-h-[80px] px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white resize-none outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      {/* ── Save button ── */}
      <Button
        onClick={onSave}
        className={`w-full h-9 text-sm font-medium ${saved ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"} text-white`}
      >
        {saved ? "✓ Record Saved!" : "Save Clinic Record"}
      </Button>

    </div>
  )
}