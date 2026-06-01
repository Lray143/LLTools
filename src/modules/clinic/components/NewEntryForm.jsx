import { useRef, useState, useEffect } from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
// ── Inlined helpers (avoids cross-module import) ──────────────────────────────
const avatarColors = [
  "bg-orange-500", "bg-blue-600",  "bg-purple-500",
  "bg-teal-600",   "bg-yellow-500","bg-red-700",
  "bg-pink-500",   "bg-indigo-500","bg-lime-600",
]
function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}
function getColor(name) {
  let h = 0
  for (let c of name) h += c.charCodeAt(0)
  return avatarColors[h % avatarColors.length]
}

const DISPOSITION_OPTIONS = [
  { value: "sent-back",   label: "Sent back to work" },
  { value: "sent-home",   label: "Sent home" },
  { value: "referred",    label: "Referred to hospital" },
  { value: "monitoring",  label: "Monitoring" },
]

// ── Employee autocomplete ─────────────────────────────────────────────────────
function EmployeeAutocomplete({ employees = [], value, onChange, onSelect }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState(value ?? "")
  const containerRef      = useRef(null)
  const inputRef          = useRef(null)

  // Keep query in sync when form resets externally
  useEffect(() => { setQuery(value ?? "") }, [value])

  const filtered = query.trim().length > 0
    ? employees.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        (e.employee_no ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (e.dept ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : employees

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  function select(emp) {
    setQuery(emp.name)
    onChange(emp.name)
    onSelect?.(emp)       // ← pass full employee object so parent can grab employee_no
    setOpen(false)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    onChange(e.target.value)
    onSelect?.(null)      // ← typed freely, clear stored employee_no
    setOpen(true)
  }

  function handleClear() {
    setQuery("")
    onChange("")
    onSelect?.(null)      // ← cleared, so clear stored employee_no too
    inputRef.current?.focus()
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input row */}
      <div className="relative flex items-center">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search name or ID…"
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          className="w-full h-9 pl-8 pr-8 text-sm border border-gray-200 rounded-md bg-white outline-none focus:border-orange-400 transition-colors placeholder:text-gray-400 text-gray-800"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[999] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No employees match &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map(emp => {
                const isActive = emp.name === value
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => select(emp)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 ${isActive ? "bg-orange-50" : ""}`}
                  >
                    <span className={`flex-shrink-0 inline-flex w-7 h-7 rounded-full items-center justify-center text-white text-xs font-bold ${getColor(emp.name)}`}>
                      {getInitials(emp.name)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block truncate">{emp.name}</span>
                      <span className="text-xs text-gray-400">
                        {[emp.dept, emp.employee_no].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {isActive && <Check size={13} color="#f97316" strokeWidth={2.5} className="flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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

export default function NewEntryForm({ form, set, saved, onSave, employees = [] }) {
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
        <EmployeeAutocomplete
          employees={employees}
          value={form.employee}
          onChange={v => set("employee", v)}
          onSelect={emp => {
            // Store as "employeeCode" to match the DB column name (employee_code)
            set("employeeCode", emp ? (emp.employee_no ?? "") : "")
          }}
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