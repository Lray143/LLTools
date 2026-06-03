import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, Plus, Search, User, Archive, CalendarPlus, ChevronDown, Check } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'

import { DEPTS, STATUSES, getLiveStatus, DEFAULT_SHIFT_START, DEFAULT_SHIFT_END, DEFAULT_DAY_OFFS } from "./employeeConstants"
import { EmployeeCardGrid }     from "./components/EmployeeCardGrid"
import { EmployeeListView }     from "./components/EmployeeListView"
import { EmployeeModal }        from "./components/EmployeeModal"
import { EmployeeDeleteModal }  from "./components/EmployeeDeleteModal"
import { EmployeeArchiveModal } from "./components/EmployeeArchiveModal"
import { EmployeeLeaveModal }   from "./components/EmployeeLeaveModal"

// ── Shared inline styles (mirrors BiometricFilterBar) ────────────────────────
const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
  fontSize: '13px', fontWeight: 500, color: '#2c2010',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

// ── CustomSelect (same pattern as BiometricFilterBar) ────────────────────────
function CustomSelect({ value, onChange, options, minWidth = '148px' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeLabel = options.find(o => (o.value ?? o) === value)?.label ?? value

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...displayPill,
          paddingRight: '10px',
          gap: '8px',
          minWidth,
          justifyContent: 'space-between',
          border: open ? '1px solid #f97316' : '1px solid rgba(0,0,0,0.1)',
          color: open ? '#f97316' : '#2c2010',
          transition: 'border-color 150ms, color 150ms',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? 600 : 500 }}>
          {activeLabel}
        </span>
        <ChevronDown
          size={13}
          color={open ? '#f97316' : '#a09278'}
          style={{ transition: 'transform 150ms, color 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '200px', background: '#fff', borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 999, padding: '8px', overflow: 'hidden',
        }}>
          {options.map(opt => {
            const isActive = opt.value === value || opt === value
            const label    = opt.label ?? opt
            const val      = opt.value ?? opt
            return (
              <button
                key={val}
                onClick={() => { onChange(val); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: 'transparent',
                  color: isActive ? '#f97316' : '#374151',
                  fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9f8f6' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {label}
                {isActive && <Check size={14} color="#f97316" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── DB mappers ───────────────────────────────────────────────────────────────
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

// ── Main component ───────────────────────────────────────────────────────────
function Employees() {
  const [employees,    setEmployees]    = useState([])
  const [archived,     setArchived]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [view,         setView]         = useState("cards")
  const [search,       setSearch]       = useState("")
  const [dept,         setDept]         = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modal,        setModal]        = useState(null)

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

  async function handleLeave({ employeeId, leaveType, leaveStart, leaveEnd }) {
    const emp = employees.find(e => e.id === employeeId)
    if (!emp) return
    await window.electronAPI.upsertEmployee(toDb({
      ...emp, status: "On Leave", leaveType, leaveStart, leaveEnd,
    }))
    const start = new Date(leaveStart + "T00:00:00")
    const end   = new Date(leaveEnd   + "T00:00:00")
    const rows  = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
      rows.push({ employee_no: emp.employee_no, date: iso, shift_in: null, lunch_out: null, lunch_in: null, shift_out: null, total_hours: null, status: "Leave", extra_taps: null })
    }
    if (rows.length > 0) await window.electronAPI.importAttendance(rows)
    await loadEmployees()
    setModal(null)
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

  // Options for dropdowns
  const deptOptions = [
    { label: 'All Departments', value: 'all' },
    ...DEPTS.map(d => ({ label: d, value: d })),
  ]
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    ...STATUSES.map(s => ({ label: s, value: s })),
  ]

  return (
    <div className="flex flex-col w-full h-full bg-[#fcfcfc] overflow-hidden">
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between pl-8 pr-[calc(2rem+15px)] py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search..."
              className="pl-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-gray-300"
              style={{ width: '14rem', height: '34px', fontSize: '13px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <Bell className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* ── FILTER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '32px', paddingRight: 'calc(32px + 15px)', gap: '16px', flexWrap: 'wrap' }}>

        {/* LEFT: view toggle + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Cards / List segmented toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px', padding: '3px', gap: '2px',
          }}>
            {['cards', 'list'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 16px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: view === v ? 600 : 400,
                  background: view === v ? '#f97316' : 'transparent',
                  color: view === v ? '#fff' : '#6b5c4c',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                  textTransform: 'capitalize',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

          {/* Department filter */}
          <CustomSelect
            value={dept}
            onChange={setDept}
            options={deptOptions}
            minWidth="152px"
          />

          {/* Status filter */}
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            minWidth="136px"
          />

          {/* Count */}
          <span style={{ fontSize: '13px', color: '#a09278', fontWeight: 400, userSelect: 'none' }}>
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        {/* RIGHT: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setModal({ mode: "leave" })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
              color: '#4b3a2a', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <CalendarPlus size={14} />
            Leave
          </button>
          <button
            onClick={() => setModal({ mode: "archive" })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
              color: '#4b3a2a', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Archive size={14} />
            Archive
          </button>
          <button
            onClick={() => setModal({ mode: "add" })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '10px',
              border: 'none', background: '#f97316',
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
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
      </div>

      {/* ── MODALS ── */}
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
      <EmployeeLeaveModal
        open={modal?.mode === "leave"}
        employees={employees}
        onSave={handleLeave}
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