import { useState, useEffect } from 'react'
import {
  Megaphone, AlertTriangle, MessageSquare, ChevronDown, ChevronUp,
  CheckCheck, Users, Archive, Trash2, CheckCircle, Eye
} from 'lucide-react'
import CommentSection from './CommentSection'

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 40 }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#0ea5e9','#f59e0b','#ef4444']
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[idx], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, letterSpacing: '-0.5px',
    }}>
      {getInitials(name)}
    </div>
  )
}

// ── AcknowledgeModal ──────────────────────────────────────────────────────────
function AckListModal({ acks, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: '24px',
        width: 380, maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CheckCircle size={20} style={{ color: 'var(--theme-500)' }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Acknowledged by</span>
          <span style={{ marginLeft: 'auto', background: 'var(--surface-hover)', padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {acks.length}
          </span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {acks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, margin: '20px 0' }}>No acknowledgements yet.</p>
          ) : (
            acks.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={a.employee_name} size={32} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{a.employee_name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{relativeTime(a.acknowledged_at)}</p>
                </div>
                <CheckCircle size={16} style={{ marginLeft: 'auto', color: '#16a34a' }} />
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} style={{
          marginTop: 16, padding: '8px', borderRadius: 10, border: 'none',
          background: 'var(--surface-hover)', color: 'var(--text-primary)',
          fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>
  )
}

// ── AnnouncementCard ──────────────────────────────────────────────────────────
export default function AnnouncementCard({
  announcement,
  currentUser,
  canPost,          // is this user HR/Admin?
  pusherChannel,
  onArchive,
  onDelete,
  isArchived = false,
}) {
  const [expanded,      setExpanded]     = useState(false)
  const [showComments,  setShowComments] = useState(false)
  const [acks,          setAcks]         = useState([])
  const [hasAcknowledged, setHasAcknowledged] = useState(!!announcement.has_acknowledged)
  const [ackCount,      setAckCount]     = useState(Number(announcement.ack_count) || 0)
  const [showAckModal,  setShowAckModal] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const empId   = String(currentUser.employeeId || currentUser.id)
  const empName = currentUser.employeeName || currentUser.username

  const audience = (() => { try { return JSON.parse(announcement.target_audience || '[]') } catch { return [] } })()
  const isForAll = audience.length === 0

  const requiresAck = !!announcement.require_ack
  const isUrgent    = !!announcement.is_urgent
  const allowComments = !!announcement.allow_comments
  const commentCount  = Number(announcement.comment_count) || 0

  // Load ack list on demand (HR only)
  const loadAcks = async () => {
    try {
      const rows = await window.electronAPI.getAnnouncementAcks(announcement.id)
      setAcks(rows || [])
    } catch(e) { console.error(e) }
  }

  const handleAcknowledge = async () => {
    if (hasAcknowledged || acknowledging) return
    setAcknowledging(true)
    try {
      await window.electronAPI.acknowledgeAnnouncement(announcement.id, empId, empName)
      setHasAcknowledged(true)
      setAckCount(c => c + 1)
    } catch(e) { console.error(e) }
    finally { setAcknowledging(false) }
  }

  const handleShowAcks = async () => {
    await loadAcks()
    setShowAckModal(true)
  }

  const content = announcement.content || ''

  return (
    <>
      {showAckModal && <AckListModal acks={acks} onClose={() => setShowAckModal(false)} />}

      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isUrgent
          ? '0 2px 20px rgba(239,68,68,0.08)'
          : '0 1px 8px rgba(0,0,0,0.05)',
        transition: 'box-shadow 200ms',
        opacity: isArchived ? 0.75 : 1,
      }}>

        {/* Urgent stripe */}
        {isUrgent && (
          <div style={{
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
            padding: '6px 16px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={13} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Urgent Announcement
            </span>
          </div>
        )}

        <div
          style={{ padding: '16px 20px', cursor: 'pointer' }}
          onClick={(e) => {
            // Prevent toggling if clicking a button inside
            if (e.target.closest('button')) return
            setExpanded(o => !o)
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <Avatar name={announcement.author_name} size={42} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {announcement.author_name}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(var(--theme-500-rgb,99,102,241),0.1)',
                  color: 'var(--theme-500)',
                }}>
                  HR / Admin
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  {relativeTime(announcement.created_at)}
                </span>
              </div>

              {/* Audience badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Users size={11} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {isForAll ? 'Posted to: Everyone' : `Posted to: ${audience.length} employees`}
                </span>
              </div>
            </div>

            {/* HR Controls */}
            {canPost && !isArchived && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                  title="Archive"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <Archive size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  title="Delete"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
            {canPost && isArchived && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                title="Permanently Delete"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 600 }}
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
            {/* Expand indicator */}
            <div style={{ alignSelf: 'center', color: 'var(--text-secondary)', marginLeft: 8 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {/* Subject */}
          <h3 style={{
            margin: '0',
            fontSize: 17, fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {announcement.subject}
          </h3>

          {/* Content (Only shown if expanded) */}
          {expanded && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
                {content}
              </div>



          {/* Posted by footer line */}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '10px 0 0', fontStyle: 'italic' }}>
            Posted by {announcement.author_name} · {new Date(announcement.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

            {/* Acknowledge button (non-HR, requires ack) */}
            {requiresAck && !canPost && (
              <button
                onClick={handleAcknowledge}
                disabled={hasAcknowledged || acknowledging}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: hasAcknowledged ? 'default' : 'pointer',
                  border: hasAcknowledged ? '1.5px solid #16a34a' : '1.5px solid var(--theme-500)',
                  background: hasAcknowledged ? 'rgba(22,163,74,0.08)' : 'rgba(var(--theme-500-rgb,99,102,241),0.08)',
                  color: hasAcknowledged ? '#16a34a' : 'var(--theme-500)',
                  transition: 'all 200ms',
                }}
              >
                {hasAcknowledged
                  ? <><CheckCircle size={14} /> Acknowledged</>
                  : <><CheckCheck size={14} /> {acknowledging ? 'Acknowledging…' : 'Acknowledge'}</>
                }
              </button>
            )}

            {/* HR: see who acknowledged */}
            {requiresAck && canPost && (
              <button
                onClick={handleShowAcks}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface-hover)', color: 'var(--text-secondary)',
                }}
              >
                <Eye size={13} /> {ackCount} Acknowledged
              </button>
            )}

            {/* Comments toggle */}
            {allowComments && (
              <button
                onClick={() => setShowComments(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  background: showComments ? 'var(--surface-hover)' : 'transparent',
                  color: 'var(--text-secondary)',
                  marginLeft: (!requiresAck) ? 0 : 'auto',
                }}
              >
                <MessageSquare size={13} />
                {commentCount > 0 ? `${commentCount} Comments` : 'Comment'}
                {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          {/* Comment section */}
          {allowComments && showComments && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <CommentSection
                announcementId={announcement.id}
                currentUser={currentUser}
                pusherChannel={pusherChannel}
              />
            </div>
          )}

              {/* Delete confirmation */}
              {confirmDelete && (
                <div style={{
                  marginTop: 12, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#ef4444' }}>
                    {isArchived ? 'Permanently delete this announcement?' : 'Archive this announcement?'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); onDelete(); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Yes, {isArchived ? 'Delete' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
