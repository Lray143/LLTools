import { useState } from "react"
import { Bell, Search, User } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import DetailModal from "./components/DetailModal"
import NewEntryForm from "./components/NewEntryForm"
import VisitsTable from "./components/VisitsTable"

export default function ClinicLog() {
  const todayISO = new Date().toISOString().split("T")[0]
  const nowTime  = new Date().toTimeString().slice(0, 5)

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
  const [selectedMonth, setSelectedMonth] = useState("All")
  const [selectedVisit, setSelectedVisit] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">

      <DetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />

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
      <div className="flex gap-5 px-8 py-6 flex-1 overflow-auto">
        <NewEntryForm form={form} set={set} saved={saved} onSave={handleSave} />
        <VisitsTable
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onViewVisit={setSelectedVisit}
        />
      </div>

    </div>
  )
}