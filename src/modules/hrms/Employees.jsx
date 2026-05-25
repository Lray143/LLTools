import { useState, useEffect, useCallback } from "react"
import { Bell, Plus, Search, User, Archive } from "lucide-react"
import { Button }  from "../../components/ui/button"
import { Input }   from "../../components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select"
import { v4 as uuidv4 } from 'uuid'

import { DEPTS, STATUSES, getLiveStatus, DEFAULT_SHIFT_START, DEFAULT_SHIFT_END, DEFAULT_DAY_OFFS } from "./employeeConstants"
import { EmployeeCardGrid }     from "./components/EmployeeCardGrid"
import { EmployeeListView }     from "./components/EmployeeListView"
import { EmployeeModal }        from "./components/EmployeeModal"
import { EmployeeDeleteModal }  from "./components/EmployeeDeleteModal"
import { EmployeeArchiveModal } from "./components/EmployeeArchiveModal"

function fromDb(row) {
  return {
    id:          row.id,
    employee_no: row.employee_no,
    name:        row.name,
    dept:        row.department  ?? '',
    role:        row.position    ?? '',
    contact:     row.contact     ?? '',
    status:      row.status      ?? 'Active',
    leaveType:   row.leave_type  ?? '',
    leaveStart:  row.leave_start ?? '',
    leaveEnd:    row.leave_end   ?? '',
    shiftStart:  row.shift_start ?? DEFAULT_SHIFT_START,
    shiftEnd:    row.shift_end   ?? DEFAULT_SHIFT_END,
    dayOffs:     row.day_offs
                   ? row.day_offs.split(',').map(d => d.trim()).filter(Boolean)
                   : DEFAULT_DAY_OFFS,
  }
}

function toDb(emp) {
  return {
    id:          emp.id,
    employee_no: emp.employee_no,
    name:        emp.name,
    department:  emp.dept       ?? null,
    position:    emp.role       ?? null,
    contact:     emp.contact    ?? null,
    status:      emp.status     ?? 'Active',
    leave_type:  emp.leaveType  ?? null,
    leave_start: emp.leaveStart ?? null,
    leave_end:   emp.leaveEnd   ?? null,
    shift_start: emp.shiftStart ?? DEFAULT_SHIFT_START,
    shift_end:   emp.shiftEnd   ?? DEFAULT_SHIFT_END,
    day_offs:    Array.isArray(emp.dayOffs)
                   ? emp.dayOffs.join(',')
                   : (emp.dayOffs ?? DEFAULT_DAY_OFFS.join(',')),
  }
}

function Employees() {
  const [employees, setEmployees]   = useState([])
  const [archived,  setArchived]    = useState([])
  const [loading,   setLoading]     = useState(true)
  const [view,      setView]        = useState("cards")
  const [search,    setSearch]      = useState("")
  const [dept,      setDept]        = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modal,     setModal]       = useState(null)

  const loadEmployees = useCallback(async () => {
    const [active, arch] = await Promise.all([
      window.electronAPI.getEmployees(),
      window.electronAPI.getArchivedEmployees(),
    ])
    setEmployees(active.map(fromDb))
    setArchived(arch.map(fromDb))
    setLoading(false)
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  function nextEmployeeNo() {
    const all  = [...employees, ...archived]
    const nums = all.map(e => parseInt(e.employee_no?.split("-")[1] ?? 0))
    const max  = nums.length ? Math.max(...nums) : 0
    return `EMP-${String(max + 1).padStart(3, "0")}`
  }

  async function handleSave(form) {
    const isNew = modal.mode === "add"
    const emp = {
      id:          isNew ? uuidv4() : modal.employee.id,
      employee_no: form.employee_no?.trim() || (isNew ? nextEmployeeNo() : modal.employee.employee_no),
      ...form,
    }
    await window.electronAPI.upsertEmployee(toDb(emp))
    await loadEmployees()
    setModal(null)
  }

  async function handleDelete() {
    await window.electronAPI.archiveEmployee(modal.employee.id)
    await loadEmployees()
    setModal(null)
  }

  async function handleUnarchive(emp) {
    await window.electronAPI.unarchiveEmployee(emp.id)
    await loadEmployees()
  }

  async function handlePermanentDelete(id) {
    await window.electronAPI.permanentDeleteEmployee(id)
    await loadEmployees()
  }

  const filtered = employees
    .map(e => ({ ...e, liveStatus: getLiveStatus(e) }))
    .filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
      const matchDept   = dept === "all" || e.dept === dept
      const matchStatus = statusFilter === "all" ||
                          e.liveStatus === statusFilter ||
                          (statusFilter === "On Leave" && e.liveStatus !== "Active")
      return matchSearch && matchDept && matchStatus
    })

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <style>{`
        [role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}
        [role="option"]:focus,[data-highlighted],[role="option"][data-disabled]{
          outline:none!important;border-color:transparent!important;box-shadow:none!important;
        }
      `}</style>

      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              className="pl-9 w-56 bg-white border-gray-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
            <button
              onClick={() => setView("cards")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === "cards" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >Cards</button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === "list" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >List</button>
          </div>

          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-44 bg-white border-gray-200">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent align="start" className="z-50 bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
              <SelectItem value="all" className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">All Departments</SelectItem>
              {DEPTS.map(d => (
                <SelectItem key={d} value={d} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-200">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent align="start" className="z-50 bg-white border border-gray-200" style={{ minWidth: 0, width: "var(--radix-select-trigger-width)" }}>
              <SelectItem value="all" className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">All Statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-gray-400 font-normal select-none">
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-1"
            onClick={() => setModal({ mode: "archive" })}
          >
            <Archive className="w-4 h-4" /> Archive
          </Button>
          <Button
            onClick={() => setModal({ mode: "add" })}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <p className="text-sm">Loading employees...</p>
          </div>
        ) : view === "cards" ? (
          <EmployeeCardGrid
            employees={filtered}
            onEdit={e => setModal({ mode: "edit", employee: e })}
            onDelete={e => setModal({ mode: "delete", employee: e })}
          />
        ) : (
          <EmployeeListView
            employees={filtered}
            onEdit={e => setModal({ mode: "edit", employee: e })}
            onDelete={e => setModal({ mode: "delete", employee: e })}
          />
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No employees found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <EmployeeModal
        open={modal?.mode === "add" || modal?.mode === "edit"}
        mode={modal?.mode}
        employee={modal?.employee}
        onSave={handleSave}
        onClose={() => setModal(null)}
      />
      <EmployeeDeleteModal
        open={modal?.mode === "delete"}
        employee={modal?.employee}
        onConfirm={handleDelete}
        onClose={() => setModal(null)}
      />
      <EmployeeArchiveModal
        open={modal?.mode === "archive"}
        archived={archived}
        onUnarchive={handleUnarchive}
        onPermanentDelete={handlePermanentDelete}
        onClose={() => setModal(null)}
      />
    </div>
  )
}

export default Employees