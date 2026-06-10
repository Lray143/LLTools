import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, FileText, CalendarClock, CheckCheck, CheckCircle, XCircle, Clock, Eye, Loader } from 'lucide-react'
import {
  getUnseenItems, markSeen, markAllSeen,
  SEEN_REPORTS_KEY, SEEN_LEAVES_KEY,
  myReportUpdatesKey, myLeaveUpdatesKey,
} from '../../lib/notifications'
import { canManageReports } from '../../lib/permissions'

// ── Helpers ──────────────────────────────────────────────────────────────────

const HR_ROLES = ['admin', 'hr']
const HR_DEPTS = ['Admin', 'HR']

function canManageLeaves(user) {
  if (!user) return false
  return HR_ROLES.includes(user.role) || HR_DEPTS.includes(user.department)
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Status color map for report/leave status updates
const STATUS_COLOR = {
  'Resolved':     '#16a34a',
  'Approved':     '#16a34a',
  'Rejected':     '#dc2626',
  'Under Review': '#2563eb',
  'In Progress':  '#7c3aed',
  'Pending':      '#d97706',
}
const STATUS_ICON = {
  'Resolved':     CheckCircle,
  'Approved':     CheckCircle,
  'Rejected':     XCircle,
  'Under Review': Eye,
  'In Progress':  Loader,
  'Pending':      Clock,
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationBell({ currentUser, refreshKey, onNavigate }) {
  // Admin/HR incoming streams
  const [incomingReports,    setIncomingReports]    = useState([])
  const [incomingLeaves,     setIncomingLeaves]     = useState([])
  const [unseenInReports,    setUnseenInReports]    = useState([])
  const [unseenInLeaves,     setUnseenInLeaves]     = useState([])

  // Personal status-update streams (all users)
  const [myReports,          setMyReports]          = useState([])
  const [myLeaves,           setMyLeaves]           = useState([])
  const [unseenMyReports,    setUnseenMyReports]    = useState([])
  const [unseenMyLeaves,     setUnseenMyLeaves]     = useState([])

  const [open, setOpen] = useState(false)
  const wrapperRef      = useRef(null)

  const isAdmin    = canManageReports(currentUser)
  const isHR       = canManageLeaves(currentUser)
  const userId     = currentUser?.id ?? currentUser?.username ?? 'anon'
  const myRepKey   = myReportUpdatesKey(userId)
  const myLeavKey  = myLeaveUpdatesKey(userId)

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!currentUser) return
    try {
      const username = currentUser.username

      await Promise.all([
        // ── Admin/HR: incoming pending items ────────────────────────────
        (async () => {
          if (!isAdmin) return
          const rows = (await window.electronAPI.getReports(false)) ?? []
          const pending = rows.filter(r => r.status === 'Pending')
          setIncomingReports(pending)
          setUnseenInReports(getUnseenItems(pending, SEEN_REPORTS_KEY))
        })(),

        (async () => {
          if (!isHR) return
          const rows = (await window.electronAPI.getLeaveRequests()) ?? []
          const pending = rows.filter(l => l.status === 'Pending')
          setIncomingLeaves(pending)
          setUnseenInLeaves(getUnseenItems(pending, SEEN_LEAVES_KEY))
        })(),

        // ── All users: status updates on their OWN reports ───────────────
        (async () => {
          try {
            const rows = (await window.electronAPI.getMyReports(username, false)) ?? []
            // Only show acted-on items (not still pending)
            const acted = rows.filter(r => r.status !== 'Pending')
            setMyReports(acted)
            setUnseenMyReports(getUnseenItems(acted, myRepKey))
          } catch (_) {}
        })(),

        // ── All users: status updates on their OWN leave requests ────────
        (async () => {
          try {
            const rows = (await window.electronAPI.getMyLeaveRequests(username)) ?? []
            const acted = rows.filter(l => l.status !== 'Pending')
            setMyLeaves(acted)
            setUnseenMyLeaves(getUnseenItems(acted, myLeavKey))
          } catch (_) {}
        })(),
      ])
    } catch (e) {
      console.error('[NotificationBell] fetch error:', e)
    }
  }, [currentUser, isAdmin, isHR, myRepKey, myLeavKey])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Mark single item as read in-place (panel stays open) ─────────────────
  function handleItemClick(stream, item) {
    if (stream === 'in-report') {
      markSeen(SEEN_REPORTS_KEY, item.id)
      setUnseenInReports(prev => prev.filter(r => r.id !== item.id))
    } else if (stream === 'in-leave') {
      markSeen(SEEN_LEAVES_KEY, item.id)
      setUnseenInLeaves(prev => prev.filter(l => l.id !== item.id))
    } else if (stream === 'my-report') {
      markSeen(myRepKey, item.id)
      setUnseenMyReports(prev => prev.filter(r => r.id !== item.id))
    } else {
      markSeen(myLeavKey, item.id)
      setUnseenMyLeaves(prev => prev.filter(l => l.id !== item.id))
    }
    
    // Navigate to the relevant module if onNavigate is provided
    if (onNavigate) {
      if (stream.includes('report')) {
        onNavigate('reports')
      } else if (stream.includes('leave')) {
        onNavigate('leaves')
      }
    }
  }

  function handleMarkAllRead() {
    markAllSeen(SEEN_REPORTS_KEY, incomingReports.map(r => r.id))
    markAllSeen(SEEN_LEAVES_KEY,  incomingLeaves.map(l => l.id))
    markAllSeen(myRepKey, myReports.map(r => r.id))
    markAllSeen(myLeavKey, myLeaves.map(l => l.id))
    setUnseenInReports([])
    setUnseenInLeaves([])
    setUnseenMyReports([])
    setUnseenMyLeaves([])
  }

  // ── Build combined list ───────────────────────────────────────────────────
  // Unseen IDs for quick lookup
  const unseenInReportIds  = new Set(unseenInReports.map(r => r.id))
  const unseenInLeaveIds   = new Set(unseenInLeaves.map(l => l.id))
  const unseenMyReportIds  = new Set(unseenMyReports.map(r => r.id))
  const unseenMyLeaveIds   = new Set(unseenMyLeaves.map(l => l.id))

  const allItems = [
    // Incoming admin reports
    ...incomingReports.map(r => ({
      ...r, _stream: 'in-report',
      _unread: unseenInReportIds.has(r.id),
      _sortTime: r.createdAt ?? r.created_at ?? 0,
    })),
    // Incoming admin leaves
    ...incomingLeaves.map(l => ({
      ...l, _stream: 'in-leave',
      _unread: unseenInLeaveIds.has(l.id),
      _sortTime: l.createdAt ?? l.created_at ?? 0,
    })),
    // My report updates
    ...myReports.map(r => ({
      ...r, _stream: 'my-report',
      _unread: unseenMyReportIds.has(r.id),
      _sortTime: r.updatedAt ?? r.createdAt ?? r.created_at ?? 0,
    })),
    // My leave updates
    ...myLeaves.map(l => ({
      ...l, _stream: 'my-leave',
      _unread: unseenMyLeaveIds.has(l.id),
      _sortTime: l.updatedAt ?? l.createdAt ?? l.created_at ?? 0,
    })),
  ]
    .sort((a, b) => new Date(b._sortTime) - new Date(a._sortTime))
    .slice(0, 25)

  const totalUnseen =
    unseenInReports.length + unseenInLeaves.length +
    unseenMyReports.length + unseenMyLeaves.length

  if (!currentUser) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className="flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: '34px', height: '34px', position: 'relative',
          border: 'none',
          background: open ? 'var(--surface-hover)' : 'transparent',
          color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => {
          e.currentTarget.style.background = open ? 'var(--surface-hover)' : 'transparent'
          e.currentTarget.style.color = open ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
      >
        <Bell className="w-4 h-4" />

        {/* Red badge */}
        {totalUnseen > 0 && (
          <span style={{
            position: 'absolute', top: '3px', right: '3px',
            minWidth: '15px', height: '15px', borderRadius: '8px',
            background: '#ef4444', color: '#fff',
            fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid var(--page-bg)',
            boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
          }}>
            {totalUnseen > 99 ? '99+' : totalUnseen}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '340px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--theme-500)' }}>
              Notifications
            </span>
            {totalUnseen > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent', border: 'none',
                  fontSize: '12px', fontWeight: 600, color: 'var(--theme-500)',
                  cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {allItems.length === 0 ? (
              <div style={{ padding: '32px 16px 28px', textAlign: 'center' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <Bell size={18} style={{ color: 'var(--text-secondary)', opacity: 0.45 }} />
                </div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  All caught up!
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: 0 }}>
                  No pending notifications
                </p>
              </div>
            ) : (
              allItems.map((item, idx) => {
                const isUnread   = item._unread
                const isIncoming = item._stream === 'in-report' || item._stream === 'in-leave'
                const isMyReport = item._stream === 'my-report'
                const isMyLeave  = item._stream === 'my-leave'
                const isInReport = item._stream === 'in-report'

                // --- Icon & color ---
                let Icon, iconColor, iconBg, dotColor, accentColor

                if (isIncoming) {
                  // Admin/HR incoming: orange for reports, indigo for leaves
                  Icon        = isInReport ? FileText : CalendarClock
                  accentColor = isInReport ? '#f97316' : '#6366f1'
                  iconColor   = isUnread ? accentColor : 'var(--text-secondary)'
                  iconBg      = isUnread
                    ? (isInReport ? 'rgba(249,115,22,0.12)' : 'rgba(99,102,241,0.12)')
                    : 'var(--surface-hover)'
                  dotColor = isUnread ? accentColor : 'transparent'
                } else {
                  // Personal status update: color by status
                  const status  = item.status ?? 'Pending'
                  accentColor   = STATUS_COLOR[status] ?? '#6b7280'
                  Icon          = isMyReport ? FileText : CalendarClock
                  iconColor     = isUnread ? accentColor : 'var(--text-secondary)'
                  iconBg        = isUnread
                    ? `${accentColor}18`  // ~10% opacity
                    : 'var(--surface-hover)'
                  dotColor = isUnread ? accentColor : 'transparent'
                }

                // --- Title & subtitle ---
                let title, subtitle
                if (isInReport) {
                  title    = item.subject || 'New Report'
                  subtitle = `Pending · from ${item.employeeName || item.employeeNo || 'Employee'}`
                } else if (item._stream === 'in-leave') {
                  title    = `${item.leave_type || 'Leave'} Request`
                  subtitle = `Pending · from ${item.employee_name || item.employee_no || 'Employee'}`
                } else if (isMyReport) {
                  const status = item.status ?? ''
                  const SIcon  = STATUS_ICON[status]
                  title    = item.subject || item.reportNo || 'Report Update'
                  subtitle = `Your report is now ${status}`
                } else {
                  const status = item.status ?? ''
                  title    = `${item.leave_type || 'Leave'} Request`
                  subtitle = `Your leave was ${status}`
                }

                const time = relativeTime(item._sortTime)

                return (
                  <button
                    key={`${item._stream}-${item.id}-${idx}`}
                    onClick={() => handleItemClick(item._stream, item)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 16px',
                      background: isUnread ? 'rgba(249,115,22,0.04)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: isUnread ? 'pointer' : 'default',
                      textAlign: 'left',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => { if (isUnread) e.currentTarget.style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isUnread ? 'rgba(249,115,22,0.04)' : 'transparent' }}
                  >
                    {/* Icon bubble */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 200ms',
                    }}>
                      <Icon size={17} color={iconColor} style={{ transition: 'color 200ms' }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: isUnread ? 600 : 400,
                        color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                        margin: 0, marginBottom: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {title}
                      </p>
                      <p style={{
                        fontSize: '11.5px', color: 'var(--text-secondary)',
                        margin: 0, marginBottom: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        opacity: isUnread ? 0.9 : 0.65,
                      }}>
                        {subtitle}
                      </p>
                      <p style={{
                        fontSize: '11px', fontWeight: isUnread ? 600 : 400,
                        color: isUnread ? accentColor : 'var(--text-secondary)',
                        margin: 0, opacity: isUnread ? 1 : 0.55,
                        transition: 'color 200ms',
                      }}>
                        {time}
                      </p>
                    </div>

                    {/* Unread dot */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: dotColor,
                      transition: 'background 200ms',
                    }} />
                  </button>
                )
              })
            )}
          </div>

        </div>
      )}
    </div>
  )
}
