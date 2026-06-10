import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Search, User, Users, ChevronDown, Check, Archive } from 'lucide-react'

import { ReportModal }          from './components/ReportModal'
import { ReportDetailsDrawer }  from './components/ReportDetailsDrawer'
import { ReportTable }          from './components/ReportTable'
import { REPORT_TYPES, REPORT_STATUSES, PRIORITIES, STATUS_CONFIG } from './components/reportConstants'
import { Button }               from '../../components/ui/button'
import { canManageReports }     from '../../lib/permissions'

// ── CustomSelect (matches Employees & LeaveRequests pattern) ─────
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
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '8px',
          background: 'var(--surface)',
          fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', cursor: 'pointer',
          paddingRight: '10px',
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

export default function Reports({ currentUser }) {
  const isAdmin = canManageReports(currentUser)

  const [adminTab,      setAdminTab]      = useState(isAdmin ? 'all' : 'mine')
  const [myReports,     setMyReports]     = useState([])
  const [allReports,    setAllReports]    = useState([])
  const [archivedReports, setArchivedReports] = useState([])
  const [employees,     setEmployees]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [showModal,     setShowModal]     = useState(false)
  const [editingReport, setEditingReport] = useState(null)
  const [drawerReport,  setDrawerReport]  = useState(null) // selected report for drawer
  const [statusFilter,  setStatusFilter]  = useState('All')
  const [typeFilter,    setTypeFilter]    = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [search,        setSearch]        = useState('')
  const [successMsg,    setSuccessMsg]    = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')

  // ── Data loading ────────────────────────────────────────────────
  const loadMine = useCallback(async () => {
    const rows = await window.electronAPI.getMyReports(currentUser.username, false)
    setMyReports(rows ?? [])
  }, [currentUser?.username])

  const loadAll = useCallback(async () => {
    const rows = await window.electronAPI.getReports(false)
    setAllReports(rows ?? [])
  }, [])

  const loadArchived = useCallback(async () => {
    const rows = await window.electronAPI.getReports(true)
    setArchivedReports(rows ?? [])
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getEmployees()
      setEmployees(rows ?? [])
    } catch (_) {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await loadMine()
      if (isAdmin) {
        await loadAll()
        await loadArchived()
      }
      await loadEmployees()
    } catch (e) {
      console.error(e)
      setErrorMsg('Failed to load reports. Please restart the app.')
      setTimeout(() => setErrorMsg(''), 6000)
    } finally {
      setLoading(false)
    }
  }, [loadMine, loadAll, loadEmployees, isAdmin])

  useEffect(() => { load() }, [load])

  // ── Submit ────────────────────────────────────────────────────────
  async function handleSubmit(form) {
    setSubmitting(true)
    setErrorMsg('')
    try {
      if (editingReport) {
        await window.electronAPI.updateReport({
          id:                editingReport.id,
          reportType:        form.reportType,
          subject:           form.subject,
          description:       form.description,
          priority:          form.priority,
          branch:            form.branch,
          attachmentPaths:   form.attachmentPaths ?? [],
          reportDetailsJson: form.reportDetailsJson,
        })
        flash('success', 'Report updated successfully!')
        setEditingReport(null)
      } else {
        await window.electronAPI.createReport({
          id:                uuidv4(),
          employeeId:        currentUser.employeeId ?? null,
          employeeNo:        currentUser.username,
          employeeName:      currentUser.username,
          reportType:        form.reportType,
          subject:           form.subject,
          description:       form.description,
          priority:          form.priority,
          branch:            form.branch,
          attachmentPaths:   form.attachmentPaths ?? [],
          reportDetailsJson: form.reportDetailsJson,
        })
        flash('success', 'Report submitted successfully!')
      }
      setShowModal(false)
      await load()
    } catch (e) {
      console.error(e)
      flash('error', 'Failed to submit: ' + (e?.message ?? String(e)))
    } finally {
      setSubmitting(false)
    }
  }

  function flash(type, msg) {
    if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000) }
    else                    { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''),   6000) }
  }

  // When drawer refreshes, reload the report from the list to get fresh data
  async function handleDrawerRefresh() {
    await load()
    // refresh the drawer's report with updated data
    if (drawerReport) {
      const fresh = await window.electronAPI.getReportById(drawerReport.id)
      if (fresh) setDrawerReport(fresh)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────
  const isManageView = isAdmin && adminTab !== 'mine'
  const sourceRows   = adminTab === 'all' ? allReports : adminTab === 'archived' ? archivedReports : myReports

  const filtered = sourceRows.filter(r => {
    const matchStatus   = statusFilter   === 'All' || r.status === statusFilter
    const matchType     = typeFilter     === 'All' || r.reportType === typeFilter
    const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter
    const matchSearch   = !search || (
      (r.reportNo      || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.employeeName  || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.employeeNo    || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.subject       || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.reportType    || '').toLowerCase().includes(search.toLowerCase())
    )
    return matchStatus && matchType && matchPriority && matchSearch
  })

  const counts = {
    All:           sourceRows.length,
    Pending:       sourceRows.filter(r => r.status === 'Pending').length,
    'Under Review': sourceRows.filter(r => r.status === 'Under Review').length,
    'In Progress': sourceRows.filter(r => r.status === 'In Progress').length,
    Resolved:      sourceRows.filter(r => r.status === 'Resolved').length,
    Rejected:      sourceRows.filter(r => r.status === 'Rejected').length,
  }

  const typeOptions = [
    { label: 'All Types', value: 'All' },
    ...REPORT_TYPES.map(t => ({ label: t, value: t })),
  ]

  const priorityOptions = [
    { label: 'All Priorities', value: 'All' },
    ...PRIORITIES.map(p => ({ label: p, value: p })),
  ]

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isManageView
              ? 'Manage and review all employee reports'
              : 'Submit and track your reports'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Admin tab switcher */}
          {isAdmin && (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '3px', gap: '2px', marginRight: '8px'
            }}>
              {[
                { id: 'mine',     label: 'My Reports', Icon: User  },
                { id: 'all',      label: 'Manage All', Icon: Users },
                { id: 'archived', label: 'Archived',   Icon: Archive },
              ].map(({ id, label, Icon }) => {
                const active = adminTab === id
                return (
                  <button key={id}
                    onClick={() => { setAdminTab(id); setStatusFilter('All'); setSearch('') }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: active ? 600 : 400,
                      background: active ? 'var(--theme-500)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      transition: 'background 150ms, color 150ms',
                      whiteSpace: 'nowrap', lineHeight: '1.4',
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <Button
            className="border-0 text-sm h-9 px-4 rounded-lg flex items-center gap-1.5"
            style={{ background: 'var(--theme-500)', color: '#fff' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            New Report
          </Button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 flex flex-col gap-5 pt-6">
        {/* Banners */}
        {successMsg && <Banner type="success">{successMsg}</Banner>}
        {errorMsg   && <Banner type="error">{errorMsg}</Banner>}

        {/* Stat cards */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Total',        val: counts.All,            color: 'var(--theme-500)' },
            { label: 'Pending',      val: counts.Pending,        color: '#d97706' },
            { label: 'Under Review', val: counts['Under Review'], color: '#2563eb' },
            { label: 'In Progress',  val: counts['In Progress'],  color: '#7c3aed' },
            { label: 'Resolved',     val: counts.Resolved,        color: '#16a34a' },
            { label: 'Rejected',     val: counts.Rejected,        color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 shadow-sm flex flex-col justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: s.color, lineHeight: 1 }}>
                {s.val}
              </p>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="flex items-center gap-3 py-1 flex-wrap">
          {/* Status pills */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '4px', gap: '4px',
          }}>
            {[
              { id: 'All',          label: 'All',          count: counts.All },
              { id: 'Pending',      label: 'Pending',      count: counts.Pending },
              { id: 'Under Review', label: 'Review',       count: counts['Under Review'] },
              { id: 'In Progress',  label: 'Progress',     count: counts['In Progress'] },
              { id: 'Resolved',     label: 'Resolved',     count: counts.Resolved },
              { id: 'Rejected',     label: 'Rejected',     count: counts.Rejected },
            ].map(f => {
              const active = statusFilter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: active ? 600 : 500,
                    background: active ? 'var(--theme-500)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    transition: 'background 150ms, color 150ms',
                  }}
                >
                  {f.label}
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--page-bg)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    padding: '1px 6px', borderRadius: '10px', fontSize: '11px',
                  }}>
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Type filter */}
          <CustomSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} minWidth="140px" />

          {/* Priority filter */}
          <CustomSelect value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} minWidth="130px" />

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              placeholder="Search..."
              className="pl-9 rounded-lg text-sm outline-none"
              style={{ width: '16rem', height: '36px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table container */}
        <div className="rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 opacity-50" style={{ color: 'var(--text-secondary)' }}>
              <p className="text-sm">Loading reports...</p>
            </div>
          ) : (
            <ReportTable
              rows={filtered}
              isAdmin={isManageView}
              onRowClick={r => setDrawerReport(r)}
              onNewReport={() => setShowModal(true)}
            />
          )}
        </div>
      </div>

      {/* ── Modals / Drawers ── */}
      <ReportModal
        open={showModal || !!editingReport}
        onClose={() => { setShowModal(false); setEditingReport(null) }}
        onSubmit={handleSubmit}
        loading={submitting}
        editReport={editingReport}
      />

      {drawerReport && (
        <ReportDetailsDrawer
          report={drawerReport}
          onClose={() => setDrawerReport(null)}
          currentUser={currentUser}
          onRefresh={handleDrawerRefresh}
          employees={employees}
          onEdit={(r) => { setEditingReport(r); setDrawerReport(null) }}
        />
      )}
    </div>
  )
}

// ── Banner helper ─────────────────────────────────────────────────
function Banner({ type, children }) {
  const isSuccess = type === 'success'
  return (
    <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {isSuccess ? '✓' : '✕'} {children}
    </div>
  )
}