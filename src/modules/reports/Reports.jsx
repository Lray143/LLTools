import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, User, Users, ChevronDown, Check, Archive, BarChart2, HelpCircle } from 'lucide-react'

import { ReportModal }          from './components/ReportModal'
import { ReportDetailsDrawer }  from './components/ReportDetailsDrawer'
import { ReportTable }          from './components/ReportTable'
import { REPORT_TYPES, REPORT_STATUSES, PRIORITIES, STATUS_CONFIG } from './components/reportConstants'
import { Button }               from '../../components/ui/button'
import SearchBar                from '../../components/ui/SearchBar'
import { canManageReports }     from '../../lib/permissions'
import NotificationBell         from '../../components/ui/NotificationBell'
import ModuleActivityLog        from '../../components/ui/ModuleActivityLog'
import PageGuide                from '../../components/ui/PageGuide'

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

export default function Reports({ currentUser, refreshKey = 0, onNavigate }) {
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [successMsg,    setSuccessMsg]    = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')
  const [activityLogOpen, setActivityLogOpen] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  // ── Data loading ────────────────────────────────────────────────
  const loadMine = useCallback(async () => {
    const rows = await window.electronAPI.getMyReports(currentUser.username, false)
    const newRows = rows ?? []
    setMyReports(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
  }, [currentUser?.username])

  const loadAll = useCallback(async () => {
    const rows = await window.electronAPI.getReports(false)
    const newRows = rows ?? []
    setAllReports(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
  }, [])

  const loadArchived = useCallback(async () => {
    const rows = await window.electronAPI.getReports(true)
    const newRows = rows ?? []
    setArchivedReports(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getEmployees()
      const newRows = rows ?? []
      setEmployees(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
    } catch (_) {}
  }, [])

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
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

  useEffect(() => { load(refreshKey === 0) }, [load, refreshKey])

  useEffect(() => {
    if (drawerReport && refreshKey !== 0) {
      window.electronAPI.getReportById(drawerReport.id).then(fresh => {
        if (fresh) setDrawerReport(fresh)
      })
    }
  }, [refreshKey]) // Update drawer data when refreshKey changes

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
    const matchSearch   = !debouncedSearch || (
      (r.reportNo      || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (r.employeeName  || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (r.employeeNo    || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (r.subject       || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (r.reportType    || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    return matchStatus && matchType && matchPriority && matchSearch
  })
  const filteredRef = useRef(filtered)
  useEffect(() => { filteredRef.current = filtered }, [filtered])

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

  // ── Tour Guide ────────────────────────────────────────────────────
  const TOUR_MOCK_REPORT = {
    _isMock: true,
    id: null,
    reportNo: 'RPT-001',
    subject: 'Sample Material Request',
    reportType: 'Material Request',
    status: 'Pending',
    priority: 'Medium',
    employeeName: currentUser?.employeeName || 'Sample Employee',
    employeeNo: currentUser?.employeeNo || '—',
    assignedTo: null,
    createdAt: new Date().toISOString(),
    reportDetailsJson: null,
  }
  const baseSteps = [
    {
      target: 'body',
      content: 'Welcome to the Reports module! This is where employees submit work reports and admins review, track, and resolve them.',
      placement: 'center',
    },
  ]

  const adminSteps = isAdmin ? [
    {
      target: '#tour-reports-admin-tabs',
      content: 'As an admin, you have three views available. By default, you see "Manage All" to oversee everyone\'s reports.',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-tab-mine',
      content: 'The "My Reports" tab shows only the reports you have submitted yourself. Click Next to open it!',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-tab-archived',
      content: 'The "Archived" tab stores resolved or rejected reports that are no longer active. Click Next to open it!',
      placement: 'bottom',
    },
  ] : []

  const remainingSteps = [
    {
      target: '#tour-reports-new-btn',
      content: 'Click "New Report" to submit a report. Let\'s open it now to see how it works!',
      placement: 'bottom-end',
    },
    {
      target: '#tour-report-modal',
      content: 'Here you can set a title, type, priority, description, and attach supporting files. Click Next to close it and continue.',
      placement: 'center',
    },
    {
      target: '#tour-reports-stat-cards',
      content: 'These cards give you a quick overview of all report statuses — Total, Pending, Under Review, In Progress, Resolved, and Rejected.',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-status-filter',
      content: 'Click these pills to filter reports by their current status. The number inside each pill shows how many reports are in that state.',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-type-filter',
      content: 'Filter reports by their type — such as Incident, Maintenance, or Safety reports.',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-priority-filter',
      content: 'Filter by priority: Low, Medium, High, or Critical. Use this to focus on the most urgent reports first.',
      placement: 'bottom',
    },
    {
      target: '#tour-reports-search',
      content: 'Search for a specific report by its title, type, or description. Results update live as you type.',
      placement: 'bottom-end',
    },
    {
      target: '#tour-reports-table',
      content: 'This is the main reports list. Each row shows the report title, status, priority, type, and who submitted it. Click Next to open a report and see how the details panel looks!',
      placement: 'center',
    },
    {
      target: '#tour-report-details-drawer',
      content: filtered.length > 0
        ? 'Here you can view the full report details, see all activity and comments, and (if you have permission) change the status or assign it to someone. Click Next to close.'
        : 'This is the report details panel. Even though there are no reports yet, this is what it looks like when you click on one — you can view details, update the status, assign it, and leave comments. Click Next to close.',
      placement: 'left',
    },
    {
      target: '#tour-reports-activity',
      content: 'This is the Activity History button. It shows a full log of every action taken in this module. Click Next and we will open it!',
      placement: 'bottom',
    },
    {
      target: '#tour-activity-log-panel',
      content: 'This is the Activity Log panel. It slides in from the right and shows everything that has happened in this module.',
      placement: 'left',
    },
    {
      target: '#tour-activity-log-entries',
      content: 'Each entry shows who made the change, what was changed, and a before and after comparison. Click Next to close the log.',
      placement: 'left',
    },
    {
      target: '#page-tour-help-btn',
      content: 'You can always click this button to restart the tour anytime!',
      placement: 'bottom-end',
    },
  ]

  const guideSteps = [...baseSteps, ...adminSteps, ...remainingSteps]

  useEffect(() => {
    const transitionPanel = (stateFn, advanceFn, advanceFirst = false, delay = 500) => {
      document.body.classList.add('hide-joyride')
      if (advanceFirst) {
        advanceFn?.()
        setTimeout(() => {
          stateFn()
          document.body.classList.remove('hide-joyride')
        }, delay)
      } else {
        stateFn()
        setTimeout(() => {
          advanceFn?.()
          document.body.classList.remove('hide-joyride')
        }, delay)
      }
    }

    const newBtnIndex = baseSteps.length + adminSteps.length
    const modalIndex = newBtnIndex + 1

    const tableIndex = guideSteps.length - 6
    const drawerIndex = guideSteps.length - 5
    const activityBtnIndex = guideSteps.length - 4
    const activityPanelIndex = guideSteps.length - 3
    const activityEntriesIndex = guideSteps.length - 2
    const helpBtnIndex = guideSteps.length - 1

    const handleNext = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (isAdmin && index === 1) {
        transitionPanel(() => setAdminTab('mine'), window.advanceJoyride)
      } else if (isAdmin && index === 2) {
        transitionPanel(() => setAdminTab('archived'), window.advanceJoyride)
      } else if (isAdmin && index === 3) {
        transitionPanel(() => setAdminTab('all'), window.advanceJoyride)
      } else if (index === newBtnIndex) {
        transitionPanel(() => setShowModal(true), window.advanceJoyride)
      } else if (index === modalIndex) {
        transitionPanel(() => setShowModal(false), window.advanceJoyride, true)
      } else if (index === tableIndex) {
        const reportToOpen = filteredRef.current && filteredRef.current.length > 0
          ? filteredRef.current[0]
          : TOUR_MOCK_REPORT
        transitionPanel(() => setDrawerReport(reportToOpen), window.advanceJoyride)
      } else if (index === drawerIndex) {
        transitionPanel(() => setDrawerReport(null), window.advanceJoyride, true)
      } else if (index === activityBtnIndex) {
        // Open activity log — use 900ms to allow the panel to mount + load data
        transitionPanel(() => setActivityLogOpen(true), window.advanceJoyride, false, 900)
      } else if (index === activityEntriesIndex) {
        // Close activity log, advance first
        transitionPanel(() => setActivityLogOpen(false), window.advanceJoyride, true)
      } else {
        window.advanceJoyride?.()
      }
    }

    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (isAdmin && index === 2) {
        transitionPanel(() => setAdminTab('all'), window.retreatJoyride)
      } else if (isAdmin && index === 3) {
        transitionPanel(() => setAdminTab('mine'), window.retreatJoyride)
      } else if (isAdmin && index === 4) {
        transitionPanel(() => setAdminTab('archived'), window.retreatJoyride)
      } else if (index === modalIndex + 1) {
        transitionPanel(() => setShowModal(true), window.retreatJoyride)
      } else if (index === modalIndex) {
        transitionPanel(() => setShowModal(false), window.retreatJoyride, true)
      } else if (index === drawerIndex + 1) {
        const reportToOpen = filteredRef.current && filteredRef.current.length > 0
          ? filteredRef.current[0]
          : TOUR_MOCK_REPORT
        transitionPanel(() => setDrawerReport(reportToOpen), window.retreatJoyride)
      } else if (index === drawerIndex) {
        transitionPanel(() => setDrawerReport(null), window.retreatJoyride, true)
      } else if (index === activityPanelIndex) {
        // Going back from panel step: close log first
        transitionPanel(() => setActivityLogOpen(false), window.retreatJoyride, true)
      } else if (index === activityEntriesIndex) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride)
      } else if (index === helpBtnIndex) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride)
      } else {
        window.retreatJoyride?.()
      }
    }

    const handleForceClose = () => { setActivityLogOpen(false); setShowModal(false); }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour-panels', handleForceClose)
    const handleStartTour = () => {
      setAdminTab(isAdmin ? 'all' : 'mine')
      setActivityLogOpen(false)
      setShowModal(false)
      setDrawerReport(prev => prev?._isMock ? null : prev)
    }
    window.addEventListener('start-page-tour', handleStartTour)
    return () => {
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
      window.removeEventListener('force-close-tour-panels', handleForceClose)
      window.removeEventListener('start-page-tour', handleStartTour)
    }
  }, [])

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <PageGuide steps={guideSteps} storageKey="seen_reports_tour" />
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Reports
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
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              {isManageView
                ? 'Manage and review all employee reports'
                : 'Submit and track your reports'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Admin tab switcher */}
          {isAdmin && (
            <div id="tour-reports-admin-tabs" style={{
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
                    id={`tour-reports-tab-${id}`}
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
            id="tour-reports-new-btn"
            className="border-0 text-sm h-9 px-4 rounded-lg flex items-center gap-1.5"
            style={{ background: 'var(--theme-500)', color: '#fff' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            New Report
          </Button>
          <div id="tour-reports-activity" style={{ display: 'inline-flex' }}>
            <ModuleActivityLog
              module="reports"
              refreshKey={refreshKey}
              forceOpen={activityLogOpen}
              onForceClose={() => setActivityLogOpen(false)}
            />
          </div>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 flex flex-col gap-5 pt-6">
        {/* Banners */}
        {successMsg && <Banner type="success">{successMsg}</Banner>}
        {errorMsg   && <Banner type="error">{errorMsg}</Banner>}

        {/* Stat cards */}
        <div id="tour-reports-stat-cards" className="grid grid-cols-6 gap-3">
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
          <div id="tour-reports-status-filter" style={{
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
          <div id="tour-reports-type-filter">
            <CustomSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} minWidth="140px" />
          </div>

          {/* Priority filter */}
          <div id="tour-reports-priority-filter">
            <CustomSelect value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} minWidth="130px" />
          </div>

          {/* Search */}
          <div id="tour-reports-search" style={{ width: '16rem', marginLeft: 'auto' }}>
            <SearchBar
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table container */}
        <div id="tour-reports-table" className="rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
          refreshKey={refreshKey}
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