import { useState, useEffect, useRef } from "react"
import { X, Paperclip, FileText, Image as ImageIcon, ExternalLink, ChevronDown, Check, Search } from "lucide-react"
import FilePreviewModal, { resolveAttachment } from "./FilePreviewModal"
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
import { COMPLAINT_GROUPS } from "./clinicConstants"

const DISPOSITIONS = ["Back to work", "Sent home", "Monitoring", "Referred"]
const GENDERS      = ["male", "female"]

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

function GroupedComplaintSelect({ value, onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState("")
  const ref               = useRef(null)
  const searchRef         = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handler)
      setTimeout(() => searchRef.current?.focus(), 50)
    }
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = COMPLAINT_GROUPS
    .map(g => ({ group: g.group, options: q ? g.options.filter(o => o.toLowerCase().includes(q)) : g.options }))
    .filter(g => g.options.length > 0)

  function select(opt) { onChange(opt); setOpen(false); setQuery("") }
  function clear(e) { e.stopPropagation(); onChange("") }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "0 10px", height: "38px", borderRadius: "8px",
          border: `1px solid ${open ? "#fb923c" : "rgb(226,232,240)"}`,
          background: "#fff", fontSize: "14px", fontWeight: value ? 500 : 400,
          color: value ? "#111" : "#9ca3af", cursor: "pointer", gap: "6px",
          transition: "border-color 150ms",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "Select complaint / reason…"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {value && (
            <span role="button" onClick={clear}
              style={{ cursor: "pointer", color: "#d1c4b8", display: "flex", alignItems: "center", padding: "2px" }}>
              <X size={11} />
            </span>
          )}
          <ChevronDown size={13} color="#a09278"
            style={{ transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }} />
        </span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%",
          background: "#fff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, overflow: "hidden",
        }}>
          <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }} />
              <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search complaint…"
                style={{ width: "100%", padding: "6px 8px 6px 26px", fontSize: "12px",
                  border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px",
                  outline: "none", background: "#f9f8f6", color: "#2c2010" }} />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    cursor: "pointer", color: "#ccc", background: "none", border: "none", padding: 0 }}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
          <div style={{ maxHeight: "260px", overflowY: "auto", padding: "6px" }}>
            {query.trim() && !COMPLAINT_GROUPS.some(g => g.options.some(o => o.toLowerCase() === query.trim().toLowerCase())) && (
              <button type="button" onClick={() => select(query.trim())}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "7px 10px", borderRadius: "8px", border: "none",
                  background: "#fff8f2", color: "#ea580c", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", textAlign: "left", marginBottom: "4px" }}
              >
                Use "{query.trim()}"
                <Check size={12} color="#ea580c" strokeWidth={2.5} />
              </button>
            )}
            {filtered.length === 0
              ? (!query.trim() && <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", padding: "16px 0" }}>No results for "{query}"</p>)
              : filtered.map(g => (
                <div key={g.group}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "#f97316", padding: "8px 10px 4px" }}>{g.group}</p>
                  {g.options.map(opt => {
                    const isActive = opt === value
                    return (
                      <button key={opt} type="button" onClick={() => select(opt)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", padding: "7px 10px", borderRadius: "8px", border: "none",
                          background: isActive ? "#fff8f2" : "transparent",
                          color: isActive ? "#f97316" : "#2c2010",
                          fontSize: "13px", fontWeight: isActive ? 600 : 400,
                          cursor: "pointer", textAlign: "left", transition: "background 80ms" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f9f8f6" }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                      >
                        {opt}
                        {isActive && <Check size={12} color="#f97316" strokeWidth={2.5} />}
                      </button>
                    )
                  })}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function AttachmentUploader({ attachments = [], onChange }) {
  const fileInputRef           = useRef(null)
  const [previewAtt, setPreviewAtt] = useState(null)

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
        return { name: file.name, type: file.type, size: file.size, path: result.path }
      })
    )
    const valid = newAttachments.filter(Boolean)
    onChange([...attachments, ...valid])
    e.target.value = ""
  }

  function remove(idx) {
    onChange(attachments.filter((_, i) => i !== idx))
  }

  async function handleOpenFile(att) {
    const result = await resolveAttachment(att)
    if (result.useModal) setPreviewAtt(result.att)
  }

  return (
    <>
      {previewAtt && (
        <FilePreviewModal
          att={previewAtt}
          onClose={() => setPreviewAtt(null)}
        />
      )}
      <div className="flex flex-col gap-2">
        {attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {attachments.map((att, idx) => {
              const Icon = getFileIcon(att.name)
              return (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
                  <Icon size={13} className="text-orange-400 flex-shrink-0" />
                  <span className="flex-1 text-xs text-gray-700 truncate font-medium">{att.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {att.size < 1024 * 1024
                      ? `${(att.size / 1024).toFixed(0)} KB`
                      : `${(att.size / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                  <button type="button" onClick={() => handleOpenFile(att)} className="text-gray-300 hover:text-orange-400 transition-colors flex-shrink-0" title="Preview">
                    <ExternalLink size={12} />
                  </button>
                  <button type="button" onClick={() => remove(idx)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0" title="Remove">
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
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
    </>
  )
}

export default function VisitModal({ open, visit, onSave, onClose }) {
  const [form, setForm] = useState({
    fullName:    "",
    gender:      "",
    age:         "",
    complaint:   "",
    bp:          "",
    temp:        "",
    pulse:       "",
    spo2:        "",
    treatment:   "",
    disposition: "Back to work",
    attachments: [],
  })

  useEffect(() => {
    if (open && visit) {
      setForm({
        fullName:    visit.fullName    || visit.employee || "",
        gender:      visit.gender      || "",
        age:         visit.age         || "",
        complaint:   visit.complaint   || "",
        bp:          visit.bp          || "",
        temp:        visit.temp        || "",
        pulse:       visit.pulse       || "",
        spo2:        visit.spo2        || "",
        treatment:   visit.treatment   || "",
        disposition: visit.disposition || "Back to work",
        attachments: visit.attachments || [],
      })
    }
  }, [open, visit])

  function handleSave() {
    if (!form.fullName.trim()) return
    const parts     = form.fullName.trim().split(" ")
    const sName     = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : form.fullName.trim()

    onSave({
      ...visit,
      fullName:    form.fullName.trim(),
      employee:    sName,
      gender:      form.gender,
      age:         form.age,
      complaint:   form.complaint,
      bp:          form.bp,
      temp:        form.temp,
      pulse:       form.pulse,
      spo2:        form.spo2,
      treatment:   form.treatment,
      disposition: form.disposition,
      attachments: form.attachments,
    })
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-lg bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Edit Visit Record</DialogTitle>
          {visit && (
            <p className="text-xs text-gray-400 mt-0.5">{visit.date} · {visit.time}</p>
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

          {/* Gender + Age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <Select value={form.gender} onValueChange={val => f("gender", val)}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-white border border-gray-200">
                  {GENDERS.map(g => (
                    <SelectItem key={g} value={g} className="capitalize focus:bg-gray-50 cursor-pointer">
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Age</label>
              <Input
                type="number"
                min="1"
                max="120"
                placeholder="e.g. 35"
                value={form.age}
                onChange={e => f("age", e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Complaint */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Complaint / Reason</label>
            <GroupedComplaintSelect
              value={form.complaint}
              onChange={v => f("complaint", v)}
            />
          </div>

          {/* Vital signs: BP, Temp, Pulse, SpO2 */}
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
                type="number"
                step="any"
                placeholder="Temp (°C)"
                value={form.temp}
                onChange={e => f("temp", e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                type="number"
                placeholder="Pulse (bpm)"
                value={form.pulse}
                onChange={e => f("pulse", e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                type="number"
                placeholder="SpO₂ (%)"
                value={form.spo2}
                onChange={e => f("spo2", e.target.value)}
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
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white resize-y outline-none focus:border-orange-400 transition-colors"
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
                  <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Attachments</label>
            <AttachmentUploader
              attachments={form.attachments}
              onChange={v => f("attachments", v)}
            />
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