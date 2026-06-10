import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Search, User, Users, Bell, ChevronDown, Check } from 'lucide-react'

import { LeaveModal }        from './components/LeaveModal'
import { ReviewModal }       from './components/ReviewModal'
import { ViewDetailsModal }  from './components/ViewDetailsModal'
import { LeaveTable }        from './components/LeaveTable'
import { HR_ROLES }          from './components/leaveConstants'
import { Button }            from '../../components/ui/button'
import NotificationBell      from '../../components/ui/NotificationBell'

// ── CustomSelect (matches BiometricFilterBar and Employees) ──────────────────
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

export default function LeaveRequests({ currentUser, refreshKey = 0, onNavigate }) {
  const isHR = HR_ROLES.includes(currentUser?.role)

  // HR defaults to 'all' (Manage All); employees only ever see 'mine'
  const [hrTab,        setHrTab]        = useState(isHR ? 'all' : 'mine')
  const [myRequests,   setMyRequests]   = useState([])
  const [allRequests,  setAllRequests]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [viewTarget,   setViewTarget]   = useState(null)   // details modal
  const [reviewTarget, setReviewTarget] = useState(null)   // review modal
  const [statusFilter, setStatusFilter] = useState('All')
  const [search,       setSearch]       = useState('')
  const [successMsg,   setSuccessMsg]   = useState('')
  const [errorMsg,     setErrorMsg]     = useState('')

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadMine = useCallback(async () => {
    const rows = await window.electronAPI.getMyLeaveRequests(currentUser.username)
    setMyRequests(rows ?? [])
  }, [currentUser?.username])

  const loadAll = useCallback(async () => {
    const rows = await window.electronAPI.getLeaveRequests()
    setAllRequests(rows ?? [])
  }, [])

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      await loadMine()
      if (isHR) await loadAll()
    } catch (e) {
      console.error(e)
      setErrorMsg('Failed to load requests. Please restart the app.')
      setTimeout(() => setErrorMsg(''), 6000)
    } finally {
      setLoading(false)
    }
  }, [loadMine, loadAll, isHR])

  useEffect(() => { load(refreshKey === 0) }, [load, refreshKey])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(form) {
    setSubmitting(true)
    setErrorMsg('')
    try {
      await window.electronAPI.submitLeaveRequest({
        id            : uuidv4(),
        employee_id   : currentUser.employeeId ?? null,
        employee_no   : currentUser.username,
        employee_name : currentUser.username,
        leave_type    : form.leave_type,
        start_date    : form.start_date,
        end_date      : form.end_date,
        reason        : form.reason,
      })
      setShowModal(false)
      flash('success', 'Leave request submitted successfully!')
      await load()
    } catch (e) {
      console.error(e)
      flash('error', 'Failed to submit: ' + (e?.message ?? String(e)))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Review ────────────────────────────────────────────────────────────────
  async function handleReview(status, note) {
    if (!reviewTarget) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      await window.electronAPI.reviewLeaveRequest(
        reviewTarget.id, status, note, currentUser.username
      )
      setReviewTarget(null)
      flash('success', `Request ${status.toLowerCase()} successfully.`)
      await load()
    } catch (e) {
      console.error(e)
      flash('error', 'Failed to save review: ' + (e?.message ?? String(e)))
    } finally {
      setSubmitting(false)
    }
  }

  function flash(type, msg) {
    if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000) }
    else                    { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''),   6000) }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const isManageView = isHR && hrTab === 'all'
  const sourceRows   = isManageView ? allRequests : myRequests

  const filtered = sourceRows.filter(r => {
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    const matchSearch = !search || (
      (r.employee_name || r.emp_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.employee_no   || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.leave_type    || '').toLowerCase().includes(search.toLowerCase())
    )
    return matchStatus && matchSearch
  })

  const counts = {
    All     : sourceRows.length,
    Pending : sourceRows.filter(r => r.status === 'Pending').length,
    Approved: sourceRows.filter(r => r.status === 'Approved').length,
    Denied  : sourceRows.filter(r => r.status === 'Denied').length,
  }

  const statusOptions = [
    { label: `All (${counts.All})`, value: 'All' },
    { label: `Pending (${counts.Pending})`, value: 'Pending' },
    { label: `Approved (${counts.Approved})`, value: 'Approved' },
    { label: `Denied (${counts.Denied})`, value: 'Denied' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Leave Requests</h1>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isManageView
              ? 'Review and manage all employee leave requests'
              : 'Submit and track your leave requests'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* HR tab switcher (moved to Top Header) */}
          {isHR && (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '3px', gap: '2px', marginRight: '8px'
            }}>
              {[
                { id: 'mine', label: 'My Requests', Icon: User  },
                { id: 'all',  label: 'Manage All',  Icon: Users },
              ].map(({ id, label, Icon }) => {
                const active = hrTab === id
                return (
                  <button key={id}
                    onClick={() => { setHrTab(id); setStatusFilter('All'); setSearch('') }}
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
            New Request
          </Button>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 flex flex-col gap-5 pt-6">
        {/* Banners */}
        {successMsg && <Banner type="success">{successMsg}</Banner>}
        {errorMsg   && <Banner type="error">{errorMsg}</Banner>}

        {/* Stat cards - Modern UI */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', val: counts.All,      color: 'var(--theme-500)', bg: 'var(--surface)', border: 'var(--border)' },
            { label: 'Pending', val: counts.Pending,  color: '#d97706', bg: 'var(--surface)', border: 'var(--border)' },
            { label: 'Approved',       val: counts.Approved, color: '#16a34a', bg: 'var(--surface)', border: 'var(--border)' },
            { label: 'Denied',         val: counts.Denied,   color: '#dc2626', bg: 'var(--surface)', border: 'var(--border)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 shadow-sm flex flex-col justify-between" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: s.color, lineHeight: 1 }}>
                {s.val}
              </p>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR (Pills instead of Select) ── */}
        <div className="flex items-center gap-3 py-1">
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '4px', gap: '4px',
          }}>
            {[
              { id: 'All',      label: 'All',      count: counts.All },
              { id: 'Pending',  label: 'Pending',  count: counts.Pending },
              { id: 'Approved', label: 'Approved', count: counts.Approved },
              { id: 'Denied',   label: 'Denied',   count: counts.Denied },
            ].map(f => {
              const active = statusFilter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
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

          {/* Search bar inside content instead of top header for spacing */}
          {isManageView && (
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
          )}
        </div>

        {/* Table container */}
        <div className="rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 opacity-50" style={{ color: 'var(--text-secondary)' }}>
              <p className="text-sm">Loading leave requests...</p>
            </div>
          ) : (
            <LeaveTable
              rows={filtered}
              isManageView={isManageView}
              onView={setViewTarget}
              onReview={r => { setViewTarget(null); setReviewTarget(r) }}
              onNewRequest={() => setShowModal(true)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <LeaveModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={submitting}
      />
      <ReviewModal
        request={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onReview={handleReview}
        loading={submitting}
      />
      <ViewDetailsModal
        request={viewTarget}
        onClose={() => setViewTarget(null)}
        isHR={isHR}
        onReview={() => { setReviewTarget(viewTarget); setViewTarget(null) }}
      />
    </div>
  )
}

// ── Banner helper ─────────────────────────────────────────────────────────
function Banner({ type, children }) {
  const isSuccess = type === 'success'
  return (
    <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 border \${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {isSuccess ? '✓' : '✕'} {children}
    </div>
  )
}
