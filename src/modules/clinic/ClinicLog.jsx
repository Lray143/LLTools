
import { useState, useEffect, useCallback } from "react"
import { User, Stethoscope, HelpCircle } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import SearchBar from '../../components/ui/SearchBar'
import NewEntryForm from "./components/NewEntryForm"
import VisitsTable from "./components/VisitsTable"
import VisitModal from "./components/VisitModal"
import VisitDeleteModal from "./components/VisitDeleteModal"
import VisitArchiveModal from "./components/VisitArchiveModal"
import DetailModal from "./components/DetailModal" // Imported DetailModal component
import PageGuide from '../../components/ui/PageGuide'

const DISP_MAP = {
  "sent-back": "Back to work",
  "sent-home": "Sent home",
  "referred": "Referred",
  "monitoring": "Monitoring",
}

function shortName(full = "") {
  const parts = full.trim().split(" ")
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : full.trim()
}

function buildEmpMaps(emps) {
  const byName = {}
  const byShort = {}
  const byId = {}
  const byNo = {}
  emps.forEach(e => {
    const no = e.employee_no ?? e.employeeNo ?? ""
    if (e.name) byName[e.name] = { no, emp: e }
    if (e.name) byShort[shortName(e.name)] = { no, emp: e }
    if (e.id) byId[e.id] = { no, emp: e }
    if (no) byNo[no] = { no, emp: e }
  })
  return { byName, byShort, byId, byNo }
}

function dbToVisit(r, maps = {}) {
  const { byName = {}, byShort = {}, byId = {}, byNo = {} } = maps
  const [y, mo, day] = (r.date ?? "").split("-").map(Number)
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mo - 1] ?? ""
  const year = y
  const dateStr = `${month} ${day}`
  const fullName = r.fullName ?? r.full_name ?? ""

  const rawCode = r.employeeCode || r.employee_code || r.employeeNo || r.employee_no || ""
  let empNo = (rawCode && byNo[rawCode]) ? rawCode : ""

  if (!empNo) {
    const byIdHit = (r.employeeId || r.employee_id) ? byId[r.employeeId ?? r.employee_id] : null
    const byNameHit = byName[fullName]
    const byShortHit = byShort[fullName] || byShort[shortName(fullName)]
    const hit = byIdHit || byNameHit || byShortHit
    empNo = hit?.no ?? ""
  }

  let displayName = shortName(fullName)
  if (empNo) {
    const hit = byNo[empNo]
    if (hit?.emp?.name) displayName = shortName(hit.emp.name)
  }

  // Parse attachments — stored in DB as JSON string
  let attachments = []
  try {
    if (r.attachments) {
      attachments = typeof r.attachments === "string"
        ? JSON.parse(r.attachments)
        : r.attachments
    }
  } catch (_) { }

  return {
    id: r.id,
    date: dateStr,
    month,
    year,
    time: r.time ?? "",
    employeeCode: empNo,
    employee: displayName,
    fullName,
    complaint: r.complaint ?? "",
    disposition: r.disposition ?? "",
    bp: r.bp ?? "",
    temp: r.temp ?? "",
    treatment: r.treatment ?? "",
    gender: r.gender ?? "",
    age: r.age ?? "",
    pulse: r.pulse ?? "",
    spo2: r.spo2 ?? "",
    attachments,
    _rawDate: r.date,
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

export default function ClinicLog({ refreshKey = 0, currentUser, onNavigate }) {
  const todayISO = new Date().toISOString().split("T")[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const [visits, setVisits] = useState([])
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])

  // State hook to store the visit data currently previewed in the details panel
  const [selectedVisit, setSelectedVisit] = useState(null)

  function empFromDb(row) {
    return {
      id: row.id,
      employee_no: row.employee_no,
      name: row.name,
      dept: row.department ?? "",
      contact: row.contact ?? "",
    }
  }

  const [form, setForm] = useState({
    date: todayISO,
    time: nowTime,
    employee: "",
    employeeCode: "",
    gender: "",
    age: "",
    complaint: "",
    bp: "",
    temp: "",
    pulse: "",
    spo2: "",
    treatment: "",
    disposition: "sent-back",
    attachments: [],
  })
  const [saved, setSaved] = useState(false)

  const [modal, setModal] = useState(null)
  const [tableExpanded, setTableExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadEmployees = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getEmployees()
      const newEmps = rows.map(empFromDb)
      setEmployees(prev => JSON.stringify(prev) === JSON.stringify(newEmps) ? prev : newEmps)
    } catch (err) {
      console.error("[ClinicLog] getEmployees failed:", err)
    }
  }, [])

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
      const newVisits = rows.map(r => dbToVisit(r, maps))
      setVisits(prev => JSON.stringify(prev) === JSON.stringify(newVisits) ? prev : newVisits)
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
      const newArch = rows.map(r => dbToVisit(r, maps))
      setArchived(prev => JSON.stringify(prev) === JSON.stringify(newArch) ? prev : newArch)
    } catch (err) {
      console.error("[ClinicLog] getArchivedClinicLogs failed:", err)
    }
  }, [])

  useEffect(() => {
    loadVisits()
    loadArchived()
    loadEmployees()
  }, [loadVisits, loadArchived, loadEmployees, refreshKey])

  async function handleSave() {
    if (!form.employee.trim()) return

    const id = crypto.randomUUID()
    const fullName = form.employee.trim()
    const timeStr = to12(form.time)

    const matchedEmp = employees.find(e => e.name === fullName)
    const employeeNo = form.employeeCode || matchedEmp?.employee_no || ""

    const log = {
      id,
      employeeId: matchedEmp?.id ?? null,
      fullName,
      employeeCode: employeeNo,
      date: form.date,
      time: timeStr,
      complaint: form.complaint,
      disposition: DISP_MAP[form.disposition] || form.disposition,
      bp: form.bp,
      temp: form.temp,
      treatment: form.treatment,
      gender: form.gender,
      age: form.age,
      pulse: form.pulse,
      spo2: form.spo2,
      attachments: JSON.stringify(form.attachments ?? []),
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
        date: todayISO,
        time: new Date().toTimeString().slice(0, 5),
        employee: "",
        employeeCode: "",
        gender: "",
        age: "",
        complaint: "",
        bp: "",
        temp: "",
        pulse: "",
        spo2: "",
        treatment: "",
        disposition: "sent-back",
        attachments: [],
      })
    }, 2000)
  }

  async function handleEditSave(updatedVisit) {
    const matchedEmp = employees.find(e => e.name === updatedVisit.fullName)
    const employeeNo = matchedEmp?.employee_no || modal.visit.employeeCode || ""

    const log = {
      id: modal.visit.id,
      employeeId: matchedEmp?.id ?? null,
      fullName: updatedVisit.fullName,
      employeeCode: employeeNo,
      date: modal.visit._rawDate,
      time: modal.visit.time,
      complaint: updatedVisit.complaint,
      disposition: updatedVisit.disposition,
      bp: updatedVisit.bp,
      temp: updatedVisit.temp,
      treatment: updatedVisit.treatment,
      gender: updatedVisit.gender,
      age: updatedVisit.age,
      pulse: updatedVisit.pulse,
      spo2: updatedVisit.spo2,
      attachments: JSON.stringify(updatedVisit.attachments ?? []),
    }
    try {
      await window.electronAPI.upsertClinicLog(log)
      await loadVisits()
    } catch (err) {
      console.error("[ClinicLog] edit upsert failed:", err)
    }
    setModal(null)
  }

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

  async function handleUnarchive(visit) {
    try {
      await window.electronAPI.unarchiveClinicLog(visit.id)
      await loadVisits()
      await loadArchived()
    } catch (err) {
      console.error("[ClinicLog] unarchiveClinicLog failed:", err)
    }
  }

  async function handlePermanentDelete(visit) {
    try {
      await window.electronAPI.permanentDeleteClinicLog(visit.id)
      await loadArchived()
    } catch (err) {
      console.error("[ClinicLog] permanentDeleteClinicLog failed:", err)
    }
  }

  const guideSteps = [
    {
      target: 'body',
      content: 'Welcome to the Clinic Log! This is where you can record, view, and manage all employee health visits and medical incidents.',
      placement: 'center'
    },
    {
      target: '#tour-clinic-entry-form',
      content: 'This is the New Clinic Entry form. Fill in the patient\'s details — name, vitals, complaint, and disposition — then save to log the visit instantly.',
      placement: 'right'
    },
    {
      target: '#tour-clinic-search',
      content: 'Use the search bar here to quickly find a visit by employee name, ID number, or complaint keyword. Results update live as you type.',
      placement: 'bottom-end'
    },
    {
      target: '#tour-clinic-table',
      content: 'This is the Visit Log — every recorded clinic visit appears here. You can click any row to see the full details of that visit.',
      placement: 'left'
    },
    {
      target: '#tour-clinic-complaint-filter',
      content: 'Use this filter to narrow down visits by a specific complaint or medical reason. It shows you how many cases each complaint has in the current period.',
      placement: 'bottom'
    },
    {
      target: '#tour-clinic-modes',
      content: 'Switch between Daily, Monthly, and Yearly views to browse visits across different time periods.',
      placement: 'bottom'
    },
    {
      target: '#tour-clinic-date-nav',
      content: 'Use these arrows to step forward or backward through time, or click the date pill to jump directly to a period.',
      placement: 'bottom'
    },
    {
      target: '#tour-clinic-archive',
      content: 'Click here to open the Archive — a safe holding area for visits removed from the active log. Let\'s open it now so you can see what\'s inside!',
      placement: 'bottom'
    },
    {
      target: '#tour-clinic-archive-panel',
      content: 'Here is the Archive panel! You can search through archived records, restore them back to the active log, or permanently delete them. Click Next to close this panel.',
      placement: 'left'
    },
    {
      target: '#tour-clinic-export',
      content: 'Export the currently filtered visit log to a neatly formatted Excel spreadsheet in one click.',
      placement: 'bottom'
    },
    {
      target: '#tour-clinic-expand',
      content: 'Toggle this button to hide the entry form and give the visit log the full width of the screen — perfect for reviewing a large number of records.',
      placement: 'bottom'
    },
    {
      target: '#page-tour-help-btn',
      content: 'You can restart this guide anytime by clicking here.',
      placement: 'bottom-end'
    }
  ]

  useEffect(() => {
    const transitionPanel = (stateFn, advanceFn) => {
      document.body.classList.add('hide-joyride')
      stateFn()
      setTimeout(() => {
        advanceFn?.()
        document.body.classList.remove('hide-joyride')
      }, 500)
    }

    const handleNext = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 7) { // Archive button step → open archive panel
        transitionPanel(() => setModal({ mode: 'archive' }), window.advanceJoyride)
      } else if (index === 8) { // Archive panel step → close it, continue
        transitionPanel(() => setModal(null), window.advanceJoyride)
      } else {
        window.advanceJoyride?.()
      }
    }

    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 8) { // Going back from archive panel → close panel, go back to archive button
        transitionPanel(() => setModal(null), window.retreatJoyride)
      } else if (index === 9) { // Going back from export → reopen archive panel
        transitionPanel(() => setModal({ mode: 'archive' }), window.retreatJoyride)
      } else {
        window.retreatJoyride?.()
      }
    }

    const handleForceClose = () => {
      if (modal?.mode === 'archive') setModal(null)
    }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour', handleForceClose)
    return () => {
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
      window.removeEventListener('force-close-tour', handleForceClose)
    }
  }, [modal])

  return (
    <div className="flex flex-col w-full h-full" style={{ background: 'var(--page-bg)' }}>

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

      {/* DetailModal opens up when a visit is selected via table cell click */}
      {selectedVisit && (
        <DetailModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
        />
      )}

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Clinic Log
              <button
                id="page-tour-help-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('start-page-tour'))}
                title="Page Guide"
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  width: '24px', height: '24px', position: 'relative',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <HelpCircle size={14} />
              </button>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Employee health &amp; visit records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div id="tour-clinic-search" style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search name, ID, complaint…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
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
          searchQuery={searchQuery}
          onEditVisit={v => setModal({ mode: "edit", visit: v })}
          onDeleteVisit={v => setModal({ mode: "delete", visit: v })}
          onOpenArchive={() => setModal({ mode: "archive" })}
          tableExpanded={tableExpanded}
          onToggleExpand={() => setTableExpanded(e => !e)}
          onRowClick={(v) => setSelectedVisit(v)}
        />
      </div>

      <PageGuide steps={guideSteps} storageKey="seen_clinic_tour" />
    </div>
  )
}