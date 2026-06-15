import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, FileText, CalendarClock, CheckCheck, CheckCircle, XCircle, Clock, Eye, Loader, MessageSquare } from 'lucide-react'
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

  const [unseenChats,        setUnseenChats]        = useState([])
  const [filter,             setFilter]             = useState('all') // 'all' | 'unread'

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

        // ── All users: unread chat messages ──────────────────────────────
        (async () => {
          try {
            const chatUserId = currentUser.employeeId || String(currentUser.id)
            const chatData = await window.electronAPI.getChatSidebarData(chatUserId)
            if (chatData) {
              const depts = (chatData.departments || []).filter(d => d.unread).map(d => ({ ...d, isDept: true }))
              const dms = (chatData.dms || []).filter(d => d.unread).map(d => ({ ...d, isDept: false }))
              setUnseenChats([...depts, ...dms])
            }
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
    } else if (stream === 'my-leave') {
      markSeen(myLeavKey, item.id)
      setUnseenMyLeaves(prev => prev.filter(l => l.id !== item.id))
    } else if (stream === 'chat') {
      const chatUserId = currentUser.employeeId || String(currentUser.id)
      window.electronAPI.markChatAsRead(chatUserId, item.roomId).catch(() => {})
      setUnseenChats(prev => prev.filter(c => c.roomId !== item.roomId))
      if (onNavigate) onNavigate('chat')
      return // skip the report/leave navigation below
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
    
    // Mark chats as read
    const chatUserId = currentUser?.employeeId || String(currentUser?.id)
    unseenChats.forEach(c => {
      window.electronAPI.markChatAsRead(chatUserId, c.roomId).catch(() => {})
    })

    setUnseenInReports([])
    setUnseenInLeaves([])
    setUnseenMyReports([])
    setUnseenMyLeaves([])
    setUnseenChats([])
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
    // Unread Chat Messages
    ...unseenChats.map(c => ({
      ...c, _stream: 'chat',
      _unread: true,
      _sortTime: c.lastMsgAt || 0,
      id: c.roomId, // needed for key
    })),
  ]
    .sort((a, b) => new Date(b._sortTime) - new Date(a._sortTime))
    .slice(0, 25)

  const filteredItems = filter === 'unread' ? allItems.filter(i => i._unread) : allItems

  const totalUnseen = unseenInReports.length + unseenInLeaves.length + unseenMyReports.length + unseenMyLeaves.length + unseenChats.length

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
          width: '360px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column'
        }}>

          {/* Header */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {totalUnseen > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'transparent', border: 'none',
                    fontSize: '14px', color: 'var(--text-secondary)',
                    cursor: 'pointer', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '8px', transition: 'background 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  title="Mark all as read"
                >
                  <CheckCheck size={20} />
                </button>
              )}
            </div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setFilter('all')}
                style={{
                  padding: '6px 12px', borderRadius: '16px', fontSize: '15px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'background 150ms',
                  background: filter === 'all' ? 'rgba(var(--theme-500-rgb, 59, 130, 246), 0.1)' : 'transparent',
                  color: filter === 'all' ? 'var(--theme-500)' : 'var(--text-primary)',
                }}
                onMouseEnter={e => { if (filter !== 'all') e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (filter !== 'all') e.currentTarget.style.background = 'transparent' }}
              >
                All
              </button>
              <button onClick={() => setFilter('unread')}
                style={{
                  padding: '6px 12px', borderRadius: '16px', fontSize: '15px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'background 150ms',
                  background: filter === 'unread' ? 'rgba(var(--theme-500-rgb, 59, 130, 246), 0.1)' : 'transparent',
                  color: filter === 'unread' ? 'var(--theme-500)' : 'var(--text-primary)',
                }}
                onMouseEnter={e => { if (filter !== 'unread') e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (filter !== 'unread') e.currentTarget.style.background = 'transparent' }}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="chat-scroll" style={{ maxHeight: '480px', overflowY: 'auto', padding: '0 8px 8px' }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px 16px 32px', textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <Bell size={24} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {filter === 'unread' ? "You're all caught up" : "No notifications"}
                </p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isUnread   = item._unread
                const isIncoming = item._stream === 'in-report' || item._stream === 'in-leave'
                const isMyReport = item._stream === 'my-report'
                const isMyLeave  = item._stream === 'my-leave'
                const isInReport = item._stream === 'in-report'
                const isChat     = item._stream === 'chat'

                // --- Avatar & Badge Icon ---
                let Icon, accentColor, avatarInitial, avatarBg

                if (isChat) {
                  Icon        = MessageSquare
                  accentColor = '#14b8a6' // Teal
                  avatarBg    = 'var(--theme-500)'
                  avatarInitial = item.isDept ? '#' : String(item.lastSenderName || '?').charAt(0).toUpperCase()
                } else if (isIncoming) {
                  Icon        = isInReport ? FileText : CalendarClock
                  accentColor = isInReport ? '#f97316' : '#6366f1'
                  avatarBg    = 'var(--page-bg-alt)'
                  avatarInitial = String(item.employeeName || item.employee_name || item.employeeNo || item.employee_no || '?').charAt(0).toUpperCase()
                } else {
                  const status  = item.status ?? 'Pending'
                  accentColor   = STATUS_COLOR[status] ?? '#6b7280'
                  Icon          = STATUS_ICON[status] || (isMyReport ? FileText : CalendarClock)
                  avatarBg      = 'var(--page-bg-alt)'
                  avatarInitial = String(currentUser.employeeName || currentUser.username || '?').charAt(0).toUpperCase()
                }

                // --- Text Formatting (Inline Flow) ---
                let boldText, mainText
                if (isChat) {
                  boldText = item.isDept ? item.roomId : (item.lastSenderName?.split(' ')[0] || 'Someone')
                  mainText = ` sent a message: "${item.lastMessage || 'Attachment'}"`
                } else if (isInReport) {
                  boldText = item.employeeName || item.employeeNo || 'Employee'
                  mainText = ` submitted a new report: ${item.subject || 'Report'}`
                } else if (item._stream === 'in-leave') {
                  boldText = item.employee_name || item.employee_no || 'Employee'
                  mainText = ` requested a ${item.leave_type || 'Leave'}`
                } else if (isMyReport) {
                  const status = item.status ?? ''
                  boldText = 'Your report'
                  mainText = ` "${item.subject || item.reportNo}" was marked as ${status}.`
                } else {
                  const status = item.status ?? ''
                  boldText = 'Your leave request'
                  mainText = ` for ${item.leave_type || 'Leave'} was ${status}.`
                }

                return (
                  <button
                    key={`${item._stream}-${item.id}-${idx}`}
                    onClick={() => handleItemClick(item._stream, item)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar Container with Overlapping Badge */}
                    <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: avatarBg, color: avatarBg === 'var(--page-bg-alt)' ? 'var(--text-primary)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', fontWeight: 600
                      }}>
                        {avatarInitial}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: accentColor,
                        border: '2.5px solid var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={13} color="#fff" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <p style={{
                        fontSize: '15px', color: 'var(--text-primary)',
                        margin: 0, lineHeight: '1.3',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        <span style={{ fontWeight: 600 }}>{boldText}</span>
                        {mainText}
                      </p>
                      <p style={{
                        fontSize: '13px', fontWeight: isUnread ? 600 : 400,
                        color: isUnread ? 'var(--theme-500)' : 'var(--text-secondary)',
                        margin: '4px 0 0 0',
                      }}>
                        {relativeTime(item._sortTime)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {isUnread && (
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--theme-500)',
                      }} />
                    )}
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
