import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Search, User, Users } from 'lucide-react'

import { LeaveModal }        from './components/LeaveModal'
import { ReviewModal }       from './components/ReviewModal'
import { ViewDetailsModal }  from './components/ViewDetailsModal'
import { LeaveTable }        from './components/LeaveTable'
import { HR_ROLES }          from './components/leaveConstants'

export default function LeaveRequests({ currentUser }) {
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

  const load = useCallback(async () => {
    setLoading(true)
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

  useEffect(() => { load() }, [load])

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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--page-bg)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', background: 'var(--page-bg)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Leave Requests
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              {isManageView
                ? 'Review and manage all employee leave requests'
                : 'Submit and track your leave requests'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* HR tab switcher — consistent with BiometricFilterbar segmented toggle */}
          {isHR && (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '3px', gap: '2px',
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
                      padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
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

          {/* New Request — everyone can file leave */}
          <button onClick={() => setShowModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '9px 20px', borderRadius: '11px', border: 'none',
            background: 'var(--theme-500)', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
          }}>
            <Plus size={15} />
            New Request
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Banners */}
        {successMsg && <Banner type="success">{successMsg}</Banner>}
        {errorMsg   && <Banner type="error">{errorMsg}</Banner>}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total',    val: counts.All,      color: 'var(--theme-500)', bg: '#f9fafb', border: 'var(--theme-200)' },
            { label: 'Pending',  val: counts.Pending,  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
            { label: 'Approved', val: counts.Approved, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
            { label: 'Denied',   val: counts.Denied,   color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', borderRadius: '14px', padding: '16px 20px',
              border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>
                {s.val}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '10px', padding: '3px', gap: '2px',
          }}>
            {['All', 'Pending', 'Approved', 'Denied'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                fontWeight: statusFilter === s ? 600 : 400,
                background: statusFilter === s ? 'var(--theme-500)' : 'transparent',
                color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 150ms',
              }}>
                {s}&nbsp;
                <span style={{ opacity: 0.8, fontSize: '10px' }}>{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>

          {isManageView && (
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <Search size={14} color="var(--text-secondary)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder="Search employee or leave type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                  background: 'var(--surface)', boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>

        {/* Table card */}
        <div style={{
          background: 'var(--surface)', borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading…
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
    <div style={{
      padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
      background: isSuccess ? '#dcfce7' : '#fee2e2',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      color: isSuccess ? '#166534' : '#991b1b',
    }}>
      {isSuccess ? '✓' : '✕'} {children}
    </div>
  )
}
