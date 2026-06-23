import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, User, Users, Bell, ChevronDown, Check, Calendar } from 'lucide-react'

import { ReviewModal }       from './components/ReviewModal'
import { ViewDetailsModal }  from './components/ViewDetailsModal'
import { LeaveTable }        from './components/LeaveTable'
import { HR_ROLES }          from './components/leaveConstants'
import { Button }            from '../../components/ui/button'
import NotificationBell      from '../../components/ui/NotificationBell'

const DEFAULT_LEAVE_GFORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSBRl4zYfbTMCJzOfYz_bEK4y6LuV2cpu518K-xPbjWKibnA/viewform?embedded=true'

function normalizeFormUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return DEFAULT_LEAVE_GFORM
  if (!trimmed.includes('docs.google.com/forms')) return trimmed
  if (trimmed.includes('embedded=true')) return trimmed
  const sep = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${sep}embedded=true`
}

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
  const [showGForm,    setShowGForm]    = useState(false)
  const [viewTarget,   setViewTarget]   = useState(null)   // details modal
  const [reviewTarget, setReviewTarget] = useState(null)   // review modal
  const [statusFilter, setStatusFilter] = useState('All')
  const [search,       setSearch]       = useState('')
  const [successMsg,   setSuccessMsg]   = useState('')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [gformUrl,     setGformUrl]     = useState(DEFAULT_LEAVE_GFORM)

  const gformUrlRef = useRef(gformUrl)

  // ── Load leave form URL — only update state when the URL actually changed ─
  useEffect(() => {
    window.electronAPI?.getAppLink?.('leave_gform')
      .then(link => {
        if (!link?.url) return
        const next = normalizeFormUrl(link.url)
        if (next !== gformUrlRef.current) {
          gformUrlRef.current = next
          setGformUrl(next)
        }
      })
      .catch(() => {
        if (gformUrlRef.current !== DEFAULT_LEAVE_GFORM) {
          gformUrlRef.current = DEFAULT_LEAVE_GFORM
          setGformUrl(DEFAULT_LEAVE_GFORM)
        }
      })
  }, [refreshKey])

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadMine = useCallback(async () => {
    const rows = await window.electronAPI.getMyLeaveRequests(currentUser.username)
    const newRows = rows ?? []
    setMyRequests(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
  }, [currentUser?.username])

  const loadAll = useCallback(async () => {
    const rows = await window.electronAPI.getLeaveRequests()
    const newRows = rows ?? []
    setAllRequests(prev => JSON.stringify(prev) === JSON.stringify(newRows) ? prev : newRows)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Leave Requests</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              {isManageView
                ? 'Review and manage all employee leave requests'
                : 'Submit and track your leave requests'}
            </p>
          </div>
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

          {!showGForm && (
            <Button 
              className="border-0 text-sm h-9 px-4 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--theme-500)', color: '#fff' }}
              onClick={() => setShowGForm(true)}
            >
              <Plus size={14} />
              New Request
            </Button>
          )}
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      {showGForm ? (
        <div className="flex-1 min-h-0 px-8 pb-8 flex flex-col pt-6 gap-5">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
               <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>File a Leave Request</h2>
               <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Complete the form below to submit your leave request</p>
             </div>
             <Button 
               onClick={() => setShowGForm(false)} 
               className="border-0 text-sm h-9 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
             >
               ✕ Back to Requests
             </Button>
          </div>
          <div className="flex-1 rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>
             <webview 
               allowpopups="true" 
               useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
               src={gformUrl || DEFAULT_LEAVE_GFORM} 
               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
             />
          </div>
        </div>
      ) : (
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
              onNewRequest={() => setShowGForm(true)}
            />
          )}
        </div>
        </div>
      )}


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
