import { useState, useEffect, useCallback, useRef } from "react"
import { getPusherChannel } from '../../lib/pusherSingleton'
import { Plus, User, Archive, ChevronDown, Check, HelpCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import NotificationBell from '../../components/ui/NotificationBell'
import ModuleActivityLog from '../../components/ui/ModuleActivityLog'
import SearchBar from '../../components/ui/SearchBar'
import PageGuide from '../../components/ui/PageGuide'
import { logModuleActivity, buildActivityDetails, diffFields, snapshotFromFields, EMPLOYEE_LOG_FIELDS } from '../../lib/activityLog'

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

  const activeOpt   = options.find(o => (o.value ?? o) === value)
  const activeLabel = activeOpt?.label ?? value
  const activeDot   = activeOpt?.dot

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
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? 600 : 500, display: 'flex', alignItems: 'center', gap: '7px' }}>
          {activeDot && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: activeDot,
              boxShadow: activeDot === '#22c55e' ? '0 0 0 2px rgba(34,197,94,0.2)' : undefined,
            }} />
          )}
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
            const val   = opt.value ?? opt
            const dot   = opt.dot
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {dot && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: dot,
                      boxShadow: dot === '#22c55e' ? '0 0 0 2px rgba(34,197,94,0.2)' : undefined,
                    }} />
                  )}
                  {label}
                </span>
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
  const [onlineFilter, setOnlineFilter] = useState("all")
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [modal, setModal] = useState(null)
  const [activityLogOpen, setActivityLogOpen] = useState(false)

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

  // ── Tour Guide: orchestrate all panels in sync with the guide ────────────
  // Step map:
  //  0  Welcome
  //  1  Search
  //  2  View Toggle
  //  3  Dept Filter
  //  4  Status Filter
  //  5  Presence Filter
  //  6  Employee Card
  //  7  Activity Log btn  → "Click Next to open it"
  //  8  Activity Log panel (tour-activity-log-panel)
  //  9  Activity Log entries → "Click Next to close & continue"
  // 10  Archive btn        → "Click Next to open it"
  // 11  Archive panel (tour-archive-panel)
  // 12  Archive search/sort (tour-archive-search-sort)
  // 13  Archive list → "Click Next to close & continue"
  // 14  Add Employee btn   → "Click Next to open the form"
  // 15  Modal: Basic Info
  // 16  Modal: Schedule
  // 17  Modal: Save
  // 18  Help button
  useEffect(() => {
    const handleNext = (e) => {
      e.preventDefault() // Take control of timing from PageGuide
      const { index } = e.detail
      
      const transitionPanel = (stateFn, advanceFn) => {
        document.body.classList.add('hide-joyride')
        stateFn() // Open/close the panel
        setTimeout(() => {
          advanceFn?.() // Move Joyride only after DOM is stable
          document.body.classList.remove('hide-joyride')
        }, 500)
      }

      if (index === 7) {
        transitionPanel(() => setActivityLogOpen(true), window.advanceJoyride)
      } else if (index === 9) {
        transitionPanel(() => setActivityLogOpen(false), window.advanceJoyride)
      } else if (index === 10) {
        transitionPanel(() => setModal({ mode: 'archive' }), window.advanceJoyride)
      } else if (index === 13) {
        transitionPanel(() => setModal(null), window.advanceJoyride)
      } else if (index === 14) {
        transitionPanel(() => setModal({ mode: 'add' }), window.advanceJoyride)
      } else if (index === 17) {
        transitionPanel(() => setModal(null), window.advanceJoyride)
      } else {
        window.advanceJoyride?.()
      }
    }
    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      
      const transitionPanel = (stateFn, retreatFn) => {
        document.body.classList.add('hide-joyride')
        stateFn() // Open/close the panel
        setTimeout(() => {
          retreatFn?.() // Move Joyride only after DOM is stable
          document.body.classList.remove('hide-joyride')
        }, 500)
      }

      if (index === 8) {
        transitionPanel(() => setActivityLogOpen(false), window.retreatJoyride)
      } else if (index === 9) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride)
      } else if (index === 11) {
        transitionPanel(() => setModal(null), window.retreatJoyride)
      } else if (index === 12) {
        transitionPanel(() => setModal({ mode: 'archive' }), window.retreatJoyride)
      } else if (index === 13) {
        transitionPanel(() => setModal({ mode: 'archive' }), window.retreatJoyride)
      } else if (index === 15) {
        transitionPanel(() => setModal(null), window.retreatJoyride)
      } else if (index === 16) {
        transitionPanel(() => setModal({ mode: 'add' }), window.retreatJoyride)
      } else if (index === 17) {
        transitionPanel(() => setModal({ mode: 'add' }), window.retreatJoyride)
      } else {
        window.retreatJoyride?.()
      }
    }
    const handleForceClose = () => {
      setActivityLogOpen(false)
      setModal(null)
    }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour', handleForceClose)
    return () => {
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
      window.removeEventListener('force-close-tour', handleForceClose)
    }
  }, [])

  // ── Pusher: track online/offline status (same as Chat module) ───────────────
  useEffect(() => {
    const channel = getPusherChannel()
    if (!channel) return

    const handleUserOnline = (data) => {
      if (data?.userId) {
        setOnlineUsers(prev => new Set([...prev, String(data.userId)]))
      }
    }
    const handleUserOffline = (data) => {
      if (data?.userId) {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          next.delete(String(data.userId))
          return next
        })
      }
    }
    const handleRequestStatus = () => {
      // Reply to any status request so others know we are here
      if (currentUser?.id) {
        window.electronAPI?.sendPusherEvent?.({
          channel: 'lltools-updates',
          event: 'user-online',
          data: { userId: String(currentUser.employeeId || currentUser.id) },
        }).catch(() => {})
      }
    }

    channel.bind('user-online', handleUserOnline)
    channel.bind('user-offline', handleUserOffline)
    channel.bind('request-status', handleRequestStatus)

    // Ask everyone to announce their current status
    window.electronAPI?.sendPusherEvent?.({
      channel: 'lltools-updates',
      event: 'request-status',
      data: {},
    }).catch(() => {})

    return () => {
      channel.unbind('user-online', handleUserOnline)
      channel.unbind('user-offline', handleUserOffline)
      channel.unbind('request-status', handleRequestStatus)
    }
  }, [currentUser?.id, currentUser?.employeeId])

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
    const afterLog = {
      employee_no: emp.employee_no,
      name: emp.name,
      dept: emp.dept,
      role: emp.role,
      contact: emp.contact,
      daySchedule: emp.daySchedule,
    }
    if (isNew) {
      await logModuleActivity(currentUser, 'employees', 'add', emp.name, emp.id, buildActivityDetails({
        recordType: 'Employee',
        recordId: emp.id,
        employeeNo: emp.employee_no,
        table: 'employees',
        snapshot: snapshotFromFields(afterLog, EMPLOYEE_LOG_FIELDS),
      }))
    } else {
      const beforeLog = {
        employee_no: modal.employee.employee_no,
        name: modal.employee.name,
        dept: modal.employee.dept,
        role: modal.employee.role,
        contact: modal.employee.contact,
        daySchedule: modal.employee.daySchedule,
      }
      await logModuleActivity(currentUser, 'employees', 'edit', emp.name, emp.id, buildActivityDetails({
        recordType: 'Employee',
        recordId: emp.id,
        employeeNo: emp.employee_no,
        table: 'employees',
        changes: diffFields(beforeLog, afterLog, EMPLOYEE_LOG_FIELDS),
      }))
    }
    await loadEmployees()
    setModal(null)
  }

  async function handleDelete() {
    await window.electronAPI.archiveEmployee(modal.employee.id)
    await logModuleActivity(currentUser, 'employees', 'archive', modal.employee.name, modal.employee.id, buildActivityDetails({
      recordType: 'Employee',
      recordId: modal.employee.id,
      employeeNo: modal.employee.employee_no,
      table: 'employees',
      removedSnapshot: snapshotFromFields({
        employee_no: modal.employee.employee_no,
        name: modal.employee.name,
        dept: modal.employee.dept,
        role: modal.employee.role,
        contact: modal.employee.contact,
        daySchedule: modal.employee.daySchedule,
      }, EMPLOYEE_LOG_FIELDS),
    }))
    await loadEmployees()
    setModal(null)
  }

  async function handleUnarchive(emp) {
    await window.electronAPI.unarchiveEmployee(emp.id)
    await logModuleActivity(currentUser, 'employees', 'restore', emp?.name ?? 'Employee', emp.id, buildActivityDetails({
      recordType: 'Employee',
      recordId: emp.id,
      employeeNo: emp?.employee_no,
      table: 'employees',
      snapshot: emp ? snapshotFromFields({
        employee_no: emp.employee_no,
        name: emp.name,
        dept: emp.dept,
        role: emp.role,
        contact: emp.contact,
        daySchedule: emp.daySchedule,
      }, EMPLOYEE_LOG_FIELDS) : { Name: emp?.name ?? '—' },
      note: 'Restored from archive',
    }))
    await loadEmployees()
  }

  async function handlePermanentDelete(id) {
    const emp = archived.find(e => e.id === id)
    await window.electronAPI.permanentDeleteEmployee(id)
    await logModuleActivity(currentUser, 'employees', 'permanent_delete', emp?.name ?? 'Employee', id, buildActivityDetails({
      recordType: 'Employee',
      recordId: id,
      employeeNo: emp?.employee_no,
      table: 'employees',
      removedSnapshot: emp ? snapshotFromFields({
        employee_no: emp.employee_no,
        name: emp.name,
        dept: emp.dept,
        role: emp.role,
        contact: emp.contact,
        daySchedule: emp.daySchedule,
      }, EMPLOYEE_LOG_FIELDS) : { Name: emp?.name ?? '—' },
      note: 'Permanently deleted from archive',
    }))
    await loadEmployees()
  }

  const filtered = employees
    .map(e => ({ ...e, liveStatus: getLiveStatus(e), isOnline: onlineUsers.has(String(e.id)) }))
    .filter(e => {
      const matchSearch = e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          (e.employee_no && e.employee_no.toLowerCase().includes(debouncedSearch.toLowerCase()))
      const matchDept = dept === "all" || e.dept === dept
      const matchStatus = statusFilter === "all" ||
        e.liveStatus === statusFilter ||
        (statusFilter === "On Leave" && e.liveStatus !== "Active")
      const matchOnline = onlineFilter === "all" ||
        (onlineFilter === "online" && e.isOnline) ||
        (onlineFilter === "offline" && !e.isOnline)
      return matchSearch && matchDept && matchStatus && matchOnline
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
  const onlineOptions = [
    { label: 'All Presence', value: 'all' },
    { label: 'Online',       value: 'online',  dot: '#22c55e' },
    { label: 'Offline',      value: 'offline', dot: 'var(--text-secondary)' },
  ]

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Employees
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
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Manage employee records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div id="tour-employees-search" style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div id="tour-employees-activity" style={{ display: 'inline-flex' }}>
            <ModuleActivityLog
              module="employees"
              refreshKey={refreshKey}
              forceOpen={activityLogOpen}
              onForceClose={() => setActivityLogOpen(false)}
            />
          </div>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>
      {/* ── FILTER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '32px', paddingRight: 'calc(32px + 15px)', gap: '16px', flexWrap: 'wrap' }}>

        {/* LEFT: view toggle + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Cards / List segmented toggle */}
          <div id="tour-employees-view-toggle" style={{
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
          <div id="tour-employees-dept-filter">
          <CustomSelect
            value={dept}
            onChange={setDept}
            options={deptOptions}
            minWidth="152px"
          />
          </div>

          {/* Status filter */}
          <div id="tour-employees-status-filter">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            minWidth="136px"
          />
          </div>

          {/* Online/Offline filter */}
          <div id="tour-employees-presence-filter">
          <CustomSelect
            value={onlineFilter}
            onChange={setOnlineFilter}
            options={onlineOptions}
            minWidth="128px"
          />
          </div>

          {/* Count */}
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400, userSelect: 'none' }}>
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        {/* RIGHT: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="tour-employees-archive-btn"
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
            id="tour-employees-add-btn"
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
              onlineUsers={onlineUsers}
              onEdit={e => setModal({ mode: "edit", employee: e })}
              onDelete={e => setModal({ mode: "delete", employee: e })}
            />
          ) : (
            <EmployeeListView
              employees={filtered}
              onlineUsers={onlineUsers}
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

      {/* ── TOUR GUIDE ── */}
      <PageGuide
        storageKey="seen_employees_tour"
        steps={[
          {
            target: 'body',
            content: 'Welcome to the Employees page! This is where HR manages all employee records across the company.',
            placement: 'center',
          },
          {
            target: '#tour-employees-search',
            content: 'Use this search bar to quickly find any employee by name or employee number.',
            placement: 'bottom',
          },
          {
            target: '#tour-employees-view-toggle',
            content: 'Switch between Card view (a visual grid) and List view (a compact table) depending on your preference.',
            placement: 'bottom',
          },
          {
            target: '#tour-employees-dept-filter',
            content: 'Filter employees by their Department, such as Sales, HR, or Operations.',
            placement: 'bottom',
          },
          {
            target: '#tour-employees-status-filter',
            content: 'Filter by Status — Active means working normally, while On Leave means they have an approved leave today.',
            placement: 'bottom',
          },
          {
            target: '#tour-employees-presence-filter',
            content: 'Filter by online presence. Online means the employee is currently logged into the system in real-time.',
            placement: 'bottom',
          },
          {
            target: filtered.length > 0 ? '#tour-employee-card' : 'body',
            content: filtered.length > 0 
              ? 'This is an employee card. Hover over it to reveal the Edit and Delete actions in the top right corner. The Edit button opens the same form as Add Employee, but pre-filled with their details.'
              : 'Normally, employee cards appear here in the center of the screen. You can hover over them to quickly Edit or Delete their records.',
            placement: filtered.length > 0 ? 'right' : 'center',
          },
          {
            target: '#tour-employees-activity',
            content: 'This is the Activity History Log button. It shows a full audit trail of every add, edit, archive, and restore action. Click Next to open it!',
            placement: 'bottom',
          },
          {
            target: '#tour-activity-log-panel',
            content: 'This is the Activity Log panel. It slides in from the right and shows everything that has happened in this module.',
            placement: 'left',
          },
          {
            target: '#tour-activity-log-entries',
            content: 'Each entry shows who made the change, what was changed, and a before/after comparison. Click Next to close the log and continue.',
            placement: 'left',
          },
          {
            target: '#tour-employees-archive-btn',
            content: 'The Archive button opens a side panel with all inactive employees. Click Next to open it and see what it looks like!',
            placement: 'bottom',
          },
          {
            target: '#tour-archive-panel',
            content: 'This is the Archive panel. It lists all employees who have been removed from the active roster.',
            placement: 'left',
          },
          {
            target: '#tour-archive-search-sort',
            content: 'You can search archived employees by name, department, or ID, and sort the list however you like.',
            placement: 'bottom',
          },
          {
            target: '#tour-archive-list',
            content: 'Hover over any employee to reveal the Restore and Delete buttons. Restore brings them back to active, while Delete removes them permanently. Click Next to close and continue.',
            placement: 'left',
          },
          {
            target: '#tour-employees-add-btn',
            content: 'Click this to add a brand new employee. Click Next to open the form and walk through each field!',
            placement: 'bottom',
          },
          {
            target: '#tour-emp-modal-basic',
            content: 'Fill in the employee\'s basic info here — Employee No. (auto-generated if left blank), Full Name, Position, Contact Info, and Department.',
            placement: 'right',
          },
          {
            target: '#tour-emp-modal-schedule',
            content: 'Set the employee\'s work schedule here. Toggle each day on or off for rest days, and set shift start/end times per day.',
            placement: 'left',
          },
          {
            target: '#tour-emp-modal-save',
            content: 'Once everything is filled in, click here to save the employee to the system. Click Next to close the form.',
            placement: 'top',
          },
          {
            target: '#page-tour-help-btn',
            content: 'You can always click this ? button to restart this tour anytime!',
            placement: 'bottom-end',
          },
        ]}
      />
    </div>
  )
}

export default Employees