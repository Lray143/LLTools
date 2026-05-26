import { useState } from "react"
import { Bell, Search, User, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import NewEntryForm from "./components/NewEntryForm"
import VisitsTable from "./components/VisitsTable"
import VisitModal from "./components/VisitModal"
import VisitDeleteModal from "./components/VisitDeleteModal"
import VisitArchiveModal from "./components/VisitArchiveModal"
import { RECENT_VISITS } from "./components/clinicConstants"

const DISP_MAP = {
  "sent-back":  "Back to work",
  "sent-home":  "Sent home",
  "referred":   "Referred",
  "monitoring": "Monitoring",
}

export default function ClinicLog() {
  const todayISO = new Date().toISOString().split("T")[0]
  const nowTime  = new Date().toTimeString().slice(0, 5)

  const [visits,   setVisits]   = useState(RECENT_VISITS)
  const [archived, setArchived] = useState([])

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

  function handleSave() {
    const d       = new Date(form.date + "T00:00:00")
    const month   = d.toLocaleString("en-US", { month: "short" })
    const year    = d.getFullYear()                               // ← year extracted
    const dateStr = `${month} ${d.getDate()}`

    const [h, m]  = form.time.split(":")
    const hour    = parseInt(h)
    const ampm    = hour >= 12 ? "PM" : "AM"
    const hour12  = hour % 12 || 12
    const timeStr = `${hour12}:${m} ${ampm}`

    const parts     = form.employee.trim().split(" ")
    const shortName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : form.employee.trim()

    const newVisit = {
      date:        dateStr,
      month,
      year,                                                        // ← stored in visit
      employee:    shortName,
      fullName:    form.employee.trim(),
      complaint:   form.complaint,
      disposition: DISP_MAP[form.disposition] || form.disposition,
      bp:          form.bp,
      temp:        form.temp,
      treatment:   form.treatment,
      time:        timeStr,
    }

    setVisits(prev => [newVisit, ...prev])
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

  function handleEditSave(updatedVisit) {
    setVisits(prev => prev.map(v => v === modal.visit ? updatedVisit : v))
    setModal(null)
  }

  function handleDelete() {
    setArchived(prev => [...prev, modal.visit])
    setVisits(prev => prev.filter(v => v !== modal.visit))
    setModal(null)
  }

  function handleUnarchive(visit) {
    setVisits(prev => [visit, ...prev])
    setArchived(prev => prev.filter(v => v !== visit))
  }

  function handlePermanentDelete(visit) {
    setArchived(prev => prev.filter(v => v !== visit))
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
          onEditVisit={v  => setModal({ mode: "edit",    visit: v })}
          onDeleteVisit={v => setModal({ mode: "delete", visit: v })}
          onOpenArchive={() => setModal({ mode: "archive" })}
          tableExpanded={tableExpanded}
          onToggleExpand={() => setTableExpanded(e => !e)}
        />
      </div>

    </div>
  )
}