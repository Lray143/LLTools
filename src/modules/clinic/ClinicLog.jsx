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

function shortName(full = "") {
  const parts = full.trim().split(" ")
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : full.trim()
}

// ── Build all lookup maps from employees array ─────────────────
function buildEmpMaps(emps) {
  const byName  = {}   // exact name  -> { no, emp }
  const byShort = {}   // short name  -> { no, emp }
  const byId    = {}   // employee id -> { no, emp }
  const byNo    = {}   // employee_no -> { no, emp }
  emps.forEach(e => {
    const no = e.employee_no ?? e.employeeNo ?? ""
    if (e.name)        byName[e.name]             = { no, emp: e }
    if (e.name)        byShort[shortName(e.name)] = { no, emp: e }
    if (e.id)          byId[e.id]                 = { no, emp: e }
    if (no)            byNo[no]                   = { no, emp: e }
  })
  return { byName, byShort, byId, byNo }
}

function dbToVisit(r, maps = {}) {
  const { byName = {}, byShort = {}, byId = {}, byNo = {} } = maps
  const [y, mo, day] = (r.date ?? "").split("-").map(Number)
  const month   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mo - 1] ?? ""
  const year    = y
  const dateStr = `${month} ${day}`
  const fullName = r.fullName ?? r.full_name ?? ""

  // Priority order for resolving the employee number:
  // 1. employeeCode (what db.cjs mapClinicLog() returns — this is the canonical field)
  //    BUT only accept it if it's actually a known employee_no (byNo lookup).
  //    Old records had shortName like "Lester G." saved as employeeCode — discard those.
  // 2. Lookup by employee UUID (employeeId foreign key)
  // 3. Lookup by exact/short name match
  const rawCode =
    r.employeeCode  ||
    r.employee_code ||
    r.employeeNo    ||
    r.employee_no   ||
    ""

  // Only trust rawCode if it resolves to a real employee number
  let empNo = (rawCode && byNo[rawCode]) ? rawCode : ""

  if (!empNo) {
    const byIdHit    = (r.employeeId || r.employee_id)
                         ? byId[r.employeeId ?? r.employee_id]
                         : null
    const byNameHit  = byName[fullName]
    // byShort keys are shortName(emp.name) — so try both the raw fullName
    // and the shortName version of fullName to catch "Lester Gulferic" -> "Lester G." matches
    const byShortHit = byShort[fullName] || byShort[shortName(fullName)]
    const hit = byIdHit || byNameHit || byShortHit
    empNo = hit?.no ?? ""
  }

  // Resolve display name: prefer real name from employee lookup,
  // fall back to shortName of fullName
  let displayName = shortName(fullName)
  if (empNo) {
    const hit = byNo[empNo]
    if (hit?.emp?.name) displayName = shortName(hit.emp.name)
  }

  return {
    id:          r.id,
    date:        dateStr,
    month,
    year,
    time:        r.time        ?? "",
    employeeCode: empNo,
    employee:    displayName,
    fullName,
    complaint:   r.complaint   ?? "",
    disposition: r.disposition ?? "",
    bp:          r.bp          ?? "",
    temp:        r.temp        ?? "",
    treatment:   r.treatment   ?? "",
    _rawDate:    r.date,
  }
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

  const [visits,    setVisits]    = useState([])
  const [archived,  setArchived]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [employees, setEmployees] = useState([])

  function empFromDb(row) {
    return {
      id:          row.id,
      employee_no: row.employee_no,
      name:        row.name,
      dept:        row.department ?? "",
      contact:     row.contact    ?? "",
    }
  }

  const [form, setForm] = useState({
    date:         todayISO,
    time:         nowTime,
    employee:     "",
    employeeCode: "",   // ← stores employee_no when picked from autocomplete
    complaint:    "",
    bp:           "",
    temp:         "",
    treatment:    "",
    disposition:  "sent-back",
  })
  const [saved, setSaved] = useState(false)

  const [modal,         setModal]         = useState(null)
  const [tableExpanded, setTableExpanded] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadEmployees = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getEmployees()
      setEmployees(rows.map(empFromDb))
    } catch (err) {
      console.error("[ClinicLog] getEmployees failed:", err)
    }
  }, [])

  // ── Shared helper: fetch employees + build all maps ────────────
  async function fetchMaps() {
    try {
      const emps = await window.electronAPI.getEmployees()
      return buildEmpMaps(emps)
    } catch (_) {
      return { byName: {}, byShort: {}, byId: {}, byNo: {} }
    }
  }

  const loadVisits = useCallback(async () => {
    try {
      const [rows, maps] = await Promise.all([
        window.electronAPI.getClinicLogs(),
        fetchMaps(),
      ])
      setVisits(rows.map(r => dbToVisit(r, maps)))
    } catch (err) {
      console.error("[ClinicLog] getClinicLogs failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadArchived = useCallback(async () => {
    try {
      const [rows, maps] = await Promise.all([
        window.electronAPI.getArchivedClinicLogs(),
        fetchMaps(),
      ])
      setArchived(rows.map(r => dbToVisit(r, maps)))
    } catch (err) {
      console.error("[ClinicLog] getArchivedClinicLogs failed:", err)
    }
  }, [])

  useEffect(() => {
    loadVisits()
    loadArchived()
    loadEmployees()
  }, [loadVisits, loadArchived, loadEmployees])

  // ── Save new entry ─────────────────────────────────────────────
  async function handleSave() {
    if (!form.employee.trim()) return

    const id       = crypto.randomUUID()
    const fullName = form.employee.trim()
    const timeStr  = to12(form.time)

    // Use employeeCode set by NewEntryForm's onSelect first,
    // then fall back to name-matching for safety
    const matchedEmp = employees.find(e => e.name === fullName)
    const employeeNo = form.employeeCode || matchedEmp?.employee_no || ""

    const log = {
      id,
      employeeId:   matchedEmp?.id ?? null,
      fullName,
      employeeCode: employeeNo,   // ← stored in DB as employee_code
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
        date:         todayISO,
        time:         new Date().toTimeString().slice(0, 5),
        employee:     "",
        employeeCode: "",
        complaint:    "",
        bp:           "",
        temp:         "",
        treatment:    "",
        disposition:  "sent-back",
      })
    }, 2000)
  }

  // ── Edit ───────────────────────────────────────────────────────
  async function handleEditSave(updatedVisit) {
    const matchedEmp = employees.find(e => e.name === updatedVisit.fullName)
    const employeeNo = matchedEmp?.employee_no || modal.visit.employeeCode || ""

    const log = {
      id:           modal.visit.id,
      employeeId:   matchedEmp?.id ?? null,
      fullName:     updatedVisit.fullName,
      employeeCode: employeeNo,
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
              employees={employees}
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