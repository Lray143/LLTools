import { useRef, useState, useEffect } from "react"
import { ChevronDown, Check, Search, X, Paperclip, FileText, Image as ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { COMPLAINT_GROUPS } from "./clinicConstants"
import { toTitleCase, clampNumber, toSentenceCase, formatBP } from "../../../lib/validation"

// ── Inlined helpers ────────────────────────────────────────────────────────────
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

const GENDER_OPTIONS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
]

// ── File to Data URL (for lightweight DB storage) ─────────────────────────────
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("File read failed"))
    reader.readAsDataURL(file)
  })
}

function getFileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase()
  if (["jpg","jpeg","png","gif","webp","bmp","svg"].includes(ext)) return ImageIcon
  return FileText
}

// ── Employee autocomplete ─────────────────────────────────────────────────────
function EmployeeAutocomplete({ employees = [], value, onChange, onSelect }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState(value ?? "")
  const containerRef      = useRef(null)
  const inputRef          = useRef(null)

  useEffect(() => { setQuery(value ?? "") }, [value])

  const filtered = query.trim().length > 0
    ? employees.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        (e.employee_no ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (e.dept ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : employees

  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  function select(emp) {
    setQuery(emp.name)
    onChange(emp.name)
    onSelect?.(emp)
    setOpen(false)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    onChange(e.target.value)
    onSelect?.(null)
    setOpen(true)
  }

  function handleClear() {
    setQuery("")
    onChange("")
    onSelect?.(null)
    inputRef.current?.focus()
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-[999] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No employees match &ldquo;{query}&rdquo;</p>
            ) : (
              filtered.map(emp => {
                const isActive = emp.name === value
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => select(emp)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-white ${isActive ? "bg-orange-50" : ""}`}
                  >
                    <span className={`flex-shrink-0 inline-flex w-7 h-7 rounded-full items-center justify-center text-white text-xs font-bold ${getColor(emp.name)}`}>
                      {getInitials(emp.name)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block truncate">{emp.name}</span>
                      <span className="text-xs text-gray-400">{[emp.dept, emp.employee_no].filter(Boolean).join(" · ")}</span>
                    </span>
                    {isActive && <Check size={13} color="var(--theme-500)" strokeWidth={2.5} className="flex-shrink-0" />}
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


// ── Attachment uploader ────────────────────────────────────────────────────────
function AttachmentUploader({ attachments = [], onChange }) {
  const fileInputRef = useRef(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newAttachments = await Promise.all(
      files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`"${file.name}" exceeds 5 MB and was skipped.`)
          return null
        }
        const buffer = await file.arrayBuffer()
        const result = await window.electronAPI.saveAttachment({ name: file.name, buffer: new Uint8Array(buffer) })
        return {
          name:    file.name,
          type:    file.type,
          size:    file.size,
          path:    result.path,
        }
      })
    )

    const valid = newAttachments. filter(Boolean)
    onChange([...attachments, ...valid])
    e.target.value = ""
  }

  function remove(idx) {
    onChange(attachments.filter((_, i) => i !== idx))
  }

  async function openPreview(att) {
    if (window.electronAPI && att.path) {
      window.electronAPI.openAttachment(att.path)
    } else if (window.electronAPI && att.dataUrl) {
      try {
        const res = await fetch(att.dataUrl)
        const buffer = await res.arrayBuffer()
        const result = await window.electronAPI.saveAttachment({ name: att.name, buffer: new Uint8Array(buffer) })
        window.electronAPI.openAttachment(result.path)
      } catch (err) {
        alert("Failed to render legacy attachment.")
      }
    } else if (att.dataUrl) {
      const w = window.open()
      w.document.write(`
        <title>${att.name}</title>
        <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">
          ${att.type && att.type.startsWith("image/")
            ? `<img src="${att.dataUrl}" style="max-width:100%;max-height:100vh;object-fit:contain" />`
            : `<iframe src="${att.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`
          }
        </body>
      `)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Uploaded list */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((att, idx) => {
            const Icon = getFileIcon(att.name)
            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg group"
              >
                <Icon size={13} className="text-orange-400 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-700 truncate font-medium">{att.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {att.size < 1024 * 1024
                    ? `${(att.size / 1024).toFixed(0)} KB`
                    : `${(att.size / 1024 / 1024).toFixed(1)} MB`}
                </span>
                <button
                  type="button"
                  onClick={() => openPreview(att)}
                  className="text-gray-300 hover:text-orange-400 transition-colors flex-shrink-0"
                  title="Preview"
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-orange-300 hover:text-orange-400 hover:bg-orange-50/50 transition-colors"
      >
        <Paperclip size={13} />
        <span>Attach file or photo</span>
        <span className="ml-auto text-gray-300">max 5 MB each</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.csv"
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}

// ── Complaint Autocomplete ───────────────────────────────────────────────────
function ComplaintAutocomplete({ value, onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState(value ?? "")
  const containerRef      = useRef(null)
  const inputRef          = useRef(null)

  useEffect(() => { setQuery(value ?? "") }, [value])

  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = COMPLAINT_GROUPS
    .map(g => ({ group: g.group, options: q ? g.options.filter(o => o.toLowerCase().includes(q)) : g.options }))
    .filter(g => g.options.length > 0)

  function select(opt) {
    setQuery(opt)
    onChange(opt)
    setOpen(false)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  function handleClear() {
    setQuery("")
    onChange("")
    inputRef.current?.focus()
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search complaint / reason…"
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          className="w-full h-9 pl-8 pr-8 text-sm border border-gray-200 rounded-md bg-white outline-none focus:border-orange-400 transition-colors placeholder:text-gray-400 text-gray-800"
        />
        {query && (
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-[999] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {query.trim() && !COMPLAINT_GROUPS.some(g => g.options.some(o => o.toLowerCase() === query.trim().toLowerCase())) && (
              <button
                type="button"
                onClick={() => select(query.trim())}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-orange-100 bg-orange-50 mb-1"
              >
                <span className="text-orange-600 font-medium">Use "{query.trim()}"</span>
                <Check size={13} color="var(--theme-600)" strokeWidth={2.5} className="flex-shrink-0" />
              </button>
            )}
            {filtered.length === 0 ? (
              !query.trim() && <p className="text-xs text-gray-400 text-center py-4">No complaints match “{query}”</p>
            ) : (
              filtered.map(g => (
                <div key={g.group}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 px-3 pt-2 pb-1">{g.group}</p>
                  {g.options.map(opt => {
                    const isActive = opt === value
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => select(opt)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-sm text-left transition-colors hover:bg-white ${isActive ? "bg-theme-50" : ""}`}
                      >
                        <span className={isActive ? "text-theme-500 font-medium" : "text-gray-800"}>{opt}</span>
                        {isActive && <Check size={13} color="var(--theme-500)" strokeWidth={2.5} className="flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function NewEntryForm({ form, set, saved, onSave, employees = [] }) {
  const [error, setError] = useState("")

  const handleSaveClick = () => {
    if (!form.employee?.trim()) {
      setError("Employee Name is required.")
      return
    }
    setError("")
    onSave()
  }

  return (
    <div id="tour-clinic-entry-form" className="w-full h-full bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4 overflow-y-auto">

      <h2 className="text-sm font-semibold text-gray-900 flex-shrink-0">New Clinic Entry</h2>

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
            set("employeeCode", emp ? (emp.employee_no ?? "") : "")
          }}
        />
      </div>

      {/* ── Row 3: Gender + Age ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
          <Select value={form.gender} onValueChange={v => set("gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Age</label>
          <Input
            type="number"
            min="1"
            max="120"
            placeholder="e.g. 35"
            value={form.age}
            onChange={e => set("age", e.target.value)}
            onBlur={() => set("age", clampNumber(form.age, 1, 120))}
            className="bg-white border-gray-200 h-9"
          />
        </div>
      </div>

      {/* ── Row 4: Complaint + Disposition ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Complaint / Reason</label>
          <ComplaintAutocomplete
            value={form.complaint}
            onChange={v => set("complaint", v)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Disposition</label>
          <Select value={form.disposition} onValueChange={v => set("disposition", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPOSITION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Row 5: Vital Signs (BP, Temp, Pulse, SpO2) ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Vital Signs</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">BP</span>
            <Input
              placeholder="120/80"
              value={form.bp}
              onChange={e => set("bp", e.target.value)}
              onBlur={() => set("bp", formatBP(form.bp))}
              className="bg-white border-gray-200 h-9 pl-9"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">°C</span>
            <Input
              type="number"
              step="any"
              placeholder="36.5"
              value={form.temp}
              onChange={e => set("temp", e.target.value)}
              onBlur={() => set("temp", clampNumber(form.temp, 30, 45))}
              className="bg-white border-gray-200 h-9 pl-9"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none leading-none" style={{fontSize:"10px"}}>bpm</span>
            <Input
              type="number"
              placeholder="Pulse (e.g. 72)"
              value={form.pulse}
              onChange={e => set("pulse", e.target.value)}
              onBlur={() => set("pulse", clampNumber(form.pulse, 30, 250))}
              className="bg-white border-gray-200 h-9 pl-10"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">SpO₂</span>
            <Input
              type="number"
              placeholder="98"
              value={form.spo2}
              onChange={e => set("spo2", e.target.value)}
              onBlur={() => set("spo2", clampNumber(form.spo2, 50, 100))}
              className="bg-white border-gray-200 h-9 pl-12"
            />
          </div>
        </div>
      </div>

      {/* ── Row 6: Treatment ── */}
      <div className="flex flex-col min-h-0">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Treatment / Action Taken</label>
        <textarea
          placeholder="Treatment or medication given..."
          value={form.treatment}
          onChange={e => set("treatment", e.target.value)}
          onBlur={() => set("treatment", toSentenceCase(form.treatment))}
          className="w-full min-h-[70px] px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white resize-none outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      {/* ── Row 7: Attachments ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Attachments</label>
        <AttachmentUploader
          attachments={form.attachments ?? []}
          onChange={v => set("attachments", v)}
        />
      </div>

      {/* ── Save button ── */}
      <div className="flex flex-col gap-2 mt-2">
        {error && <div className="text-red-500 text-xs font-medium text-center">{error}</div>}
        <Button
          onClick={handleSaveClick}
          className={`w-full h-9 text-sm font-medium flex-shrink-0 transition-opacity hover:opacity-90 ${saved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          style={!saved ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' } : {}}
        >
          {saved ? "✓ Record Saved!" : "Save Clinic Record"}
        </Button>
      </div>

    </div>
  )
}