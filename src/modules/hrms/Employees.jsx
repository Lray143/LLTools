import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Search, User, Archive, ChevronDown, Check } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import NotificationBell from '../../components/ui/NotificationBell'

import { DEPTS, STATUSES, getLiveStatus, DEFAULT_SHIFT_START, DEFAULT_SHIFT_END, DEFAULT_DAY_OFFS, DEFAULT_DAY_SCHEDULE, DAYS_OF_WEEK } from "./employeeConstants"
import { EmployeeCardGrid } from "./components/EmployeeCardGrid"
import { EmployeeListView } from "./components/EmployeeListView"
import { EmployeeModal } from "./components/EmployeeModal"
import { EmployeeDeleteModal } from "./components/EmployeeDeleteModal"
import { EmployeeArchiveModal } from "./components/EmployeeArchiveModal"

// ── Shared inline styles (mirrors BiometricFilterBar) ────────────────────────
const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
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
          border: open ? '1px solid var(--theme-500)' : '1px solid rgba(0,0,0,0.1)',
          color: open ? 'var(--theme-500)' : 'var(--text-primary)',
          transition: 'border-color 150ms, color 150ms',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? 600 : 500 }}>
          {activeLabel}
        </span>
        <ChevronDown
          size={13}
          color={open ? 'var(--theme-500)' : 'var(--text-secondary)'}
          style={{ transition: 'transform 150ms, color 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '200px', background: 'var(--surface)', borderRadius: '14px',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 999, padding: '8px', overflow: 'hidden',
        }}>
          {options.map(opt => {
            const isActive = opt.value === value || opt === value
            const label = opt.label ?? opt
            const val = opt.value ?? opt
            return (
              <button
                key={val}
                onClick={() => { onChange(val); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--theme-500)' : 'var(--text-primary)',
                  fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {label}
                {isActive && <Check size={14} color="var(--theme-500)" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function fromDb(row) {
  let daySchedule = null
  if (row.day_schedule) {
    try { daySchedule = JSON.parse(row.day_schedule) } catch (_) { }
  }
  return {
    id: row.id,
    employee_no: row.employee_no,
    name: row.name,
    dept: row.department ?? '',
    role: row.position ?? '',
    contact: row.contact ?? '',
    status: row.status ?? 'Active',
    leaveType: row.leave_type ?? '',
    leaveStart: row.leave_start ?? '',
    leaveEnd: row.leave_end ?? '',
    shiftStart: row.shift_start ?? DEFAULT_SHIFT_START,
    shiftEnd: row.shift_end ?? DEFAULT_SHIFT_END,
    dayOffs: row.day_offs
      ? row.day_offs.split(',').map(d => d.trim()).filter(Boolean)
      : DEFAULT_DAY_OFFS,
    daySchedule: daySchedule ?? DEFAULT_DAY_SCHEDULE,
    // Auto-detected from leave_requests: non-null only when an approved leave covers today
    autoLeave: row.auto_leave_type
      ? { type: row.auto_leave_type, start: row.auto_leave_start, end: row.auto_leave_end }
      : null,
  }
}

function toDb(emp) {
  // Derive day_offs and shift_start/shift_end from daySchedule for backward compat
  const sched = emp.daySchedule ?? DEFAULT_DAY_SCHEDULE
  const dayOffs = DAYS_OF_WEEK.filter(d => sched[d] === null)
  const firstWork = DAYS_OF_WEEK.find(d => sched[d] !== null)
  const shiftStart = firstWork ? sched[firstWork].start : DEFAULT_SHIFT_START
  const shiftEnd = firstWork ? sched[firstWork].end : DEFAULT_SHIFT_END
  return {
    id: emp.id,
    employee_no: emp.employee_no,
    name: emp.name,
    department: emp.dept ?? null,
    position: emp.role ?? null,
    contact: emp.contact ?? null,
    status: emp.status ?? 'Active',
    leave_type: emp.leaveType ?? null,
    leave_start: emp.leaveStart ?? null,
    leave_end: emp.leaveEnd ?? null,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    day_offs: dayOffs.join(','),
    day_schedule: JSON.stringify(sched),
  }
}

// ── Main component ───────────────────────────────────────────────────────────
function Employees({ refreshKey = 0, currentUser, onNavigate }) {
  const [employees, setEmployees] = useState([])
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("cards")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [dept, setDept] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  const loadEmployees = useCallback(async () => {
    const [active, arch] = await Promise.all([
      window.electronAPI.getEmployees(),
      window.electronAPI.getArchivedEmployees(),
    ])
    
    const newActive = active.map(fromDb)
    const newArchived = arch.map(fromDb)
    
    setEmployees(prev => JSON.stringify(prev) === JSON.stringify(newActive) ? prev : newActive)
    setArchived(prev => JSON.stringify(prev) === JSON.stringify(newArchived) ? prev : newArchived)
    
    setLoading(false)
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees, refreshKey])

  function nextEmployeeNo() {
    const all = [...employees, ...archived]
    const nums = all.map(e => parseInt(e.employee_no?.split("-")[1] ?? 0))
    const max = nums.length ? Math.max(...nums) : 0
    return `EMP-${String(max + 1).padStart(3, "0")}`
  }

  async function handleSave(form) {
    const isNew = modal.mode === "add"
    const emp = {
      id: isNew ? uuidv4() : modal.employee.id,
      employee_no: form.employee_no?.trim() || (isNew ? nextEmployeeNo() : modal.employee.employee_no),
      // Status is no longer editable — preserve existing or default to Active
      status: isNew ? 'Active' : (modal.employee.status ?? 'Active'),
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
      const matchSearch = e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          (e.employee_no && e.employee_no.toLowerCase().includes(debouncedSearch.toLowerCase()))
      const matchDept = dept === "all" || e.dept === dept
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
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
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
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
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
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '3px', gap: '2px',
          }}>
            {['cards', 'list'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 16px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: view === v ? 600 : 400,
                  background: view === v ? 'var(--theme-500)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-secondary)',
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
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400, userSelect: 'none' }}>
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        {/* RIGHT: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setModal({ mode: "archive" })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
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
              border: 'none', background: 'var(--theme-500)',
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