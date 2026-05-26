import { useState, useEffect, useCallback } from "react"
import { Bell, Search, User } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import NewEntryForm from "./components/NewEntryForm"
import VisitsTable from "./components/VisitsTable"
import VisitModal from "./components/VisitModal"
import VisitDeleteModal from "./components/VisitDeleteModal"
import VisitArchiveModal from "./components/VisitArchiveModal"

const DISP_MAP = {
  "sent-back":  "Back to work",
  "sent-home":  "Sent home",
  "referred":   "Referred",
  "monitoring": "Monitoring",
}

function dbToVisit(r) {
  const [y, mo, day] = (r.date ?? "").split("-").map(Number)
  const month   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mo - 1] ?? ""
  const year    = y
  const dateStr = `${month} ${day}`
  return {
    id:          r.id,
    date:        dateStr,
    month,
    year,
    time:        r.time        ?? "",
    employee:    r.employeeCode ?? shortName(r.fullName),
    fullName:    r.fullName    ?? "",
    complaint:   r.complaint   ?? "",
    disposition: r.disposition ?? "",
    bp:          r.bp          ?? "",
    temp:        r.temp        ?? "",
    treatment:   r.treatment   ?? "",
    _rawDate:    r.date,
  }
}

function shortName(full = "") {
  const parts = full.trim().split(" ")
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : full.trim()
}

function to12(timeStr = "") {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export default function ClinicLog() {
  const todayISO = new Date().toISOString().split("T")[0]
  const nowTime  = new Date().toTimeString().slice(0, 5)

  const [visits,   setVisits]   = useState([])
  const [archived, setArchived] = useState([])
  const [loading,  setLoading]  = useState(true)

  const [form, setForm] = useState({
    date:        todayISO,
    time:        nowTime,
    employee:    "",
    complaint:   "",
    bp:          "",
    temp:        "",
    treatment:   "",
    disposition: "sent-back",
  })
  const [saved, setSaved] = useState(false)

  const [modal, setModal]                 = useState(null)
  const [tableExpanded, setTableExpanded] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Load from DB ───────────────────────────────────────────────
  const loadVisits = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getClinicLogs()
      setVisits(rows.map(dbToVisit))
    } catch (err) {
      console.error("[ClinicLog] getClinicLogs failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadArchived = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getArchivedClinicLogs()
      setArchived(rows.map(dbToVisit))
    } catch (err) {
      console.error("[ClinicLog] getArchivedClinicLogs failed:", err)
    }
  }, [])

  useEffect(() => {
    loadVisits()
    loadArchived()
  }, [loadVisits, loadArchived])

  // ── Save new entry ─────────────────────────────────────────────
  async function handleSave() {
    if (!form.employee.trim()) return

    const id       = crypto.randomUUID()
    const fullName = form.employee.trim()
    const timeStr  = to12(form.time)

    const log = {
      id,
      employeeId:   null,
      fullName,
      employeeCode: shortName(fullName),
      date:         form.date,
      time:         timeStr,
      complaint:    form.complaint,
      disposition:  DISP_MAP[form.disposition] || form.disposition,
      bp:           form.bp,
      temp:         form.temp,
      treatment:    form.treatment,
    }

    try {
      await window.electronAPI.upsertClinicLog(log)
      await loadVisits()
    } catch (err) {
      console.error("[ClinicLog] upsertClinicLog failed:", err)
    }

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setForm({
        date:        todayISO,
        time:        new Date().toTimeString().slice(0, 5),
        employee:    "",
        complaint:   "",
        bp:          "",
        temp:        "",
        treatment:   "",
        disposition: "sent-back",
      })
    }, 2000)
  }

  // ── Edit ───────────────────────────────────────────────────────
  async function handleEditSave(updatedVisit) {
    const log = {
      id:           modal.visit.id,
      employeeId:   null,
      fullName:     updatedVisit.fullName,
      employeeCode: shortName(updatedVisit.fullName),
      date:         modal.visit._rawDate,
      time:         modal.visit.time,
      complaint:    updatedVisit.complaint,
      disposition:  updatedVisit.disposition,
      bp:           updatedVisit.bp,
      temp:         updatedVisit.temp,
      treatment:    updatedVisit.treatment,
    }
    try {
      await window.electronAPI.upsertClinicLog(log)
      await loadVisits()
    } catch (err) {
      console.error("[ClinicLog] edit upsert failed:", err)
    }
    setModal(null)
  }

  // ── Archive ────────────────────────────────────────────────────
  async function handleDelete() {
    try {
      await window.electronAPI.archiveClinicLog(modal.visit.id)
      await loadVisits()
      await loadArchived()
    } catch (err) {
      console.error("[ClinicLog] archiveClinicLog failed:", err)
    }
    setModal(null)
  }

  // ── Restore ────────────────────────────────────────────────────
  async function handleUnarchive(visit) {
    try {
      await window.electronAPI.unarchiveClinicLog(visit.id)
      await loadVisits()
      await loadArchived()
    } catch (err) {
      console.error("[ClinicLog] unarchiveClinicLog failed:", err)
    }
  }

  // ── Permanent delete ───────────────────────────────────────────
  async function handlePermanentDelete(visit) {
    try {
      await window.electronAPI.permanentDeleteClinicLog(visit.id)
      await loadArchived()
    } catch (err) {
      console.error("[ClinicLog] permanentDeleteClinicLog failed:", err)
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">

      <VisitModal
        open={modal?.mode === "edit"}
        visit={modal?.visit}
        onSave={handleEditSave}
        onClose={() => setModal(null)}
      />
      <VisitDeleteModal
        open={modal?.mode === "delete"}
        visit={modal?.visit}
        onConfirm={handleDelete}
        onClose={() => setModal(null)}
      />
      <VisitArchiveModal
        open={modal?.mode === "archive"}
        archived={archived}
        onUnarchive={handleUnarchive}
        onPermanentDelete={handlePermanentDelete}
        onClose={() => setModal(null)}
      />

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Clinic Log</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search..." className="pl-9 w-56 bg-white border-gray-200" />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex gap-5 px-8 py-6 flex-1 overflow-auto min-h-0">
        {!tableExpanded && (
          <div className="w-[580px] flex-shrink-0">
            <NewEntryForm
              form={form}
              set={set}
              saved={saved}
              onSave={handleSave}
            />
          </div>
        )}
        <VisitsTable
          visits={visits}
          loading={loading}
          onEditVisit={v   => setModal({ mode: "edit",    visit: v })}
          onDeleteVisit={v => setModal({ mode: "delete",  visit: v })}
          onOpenArchive={() => setModal({ mode: "archive" })}
          tableExpanded={tableExpanded}
          onToggleExpand={() => setTableExpanded(e => !e)}
        />
      </div>

    </div>
  )
}