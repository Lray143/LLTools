import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  X, ClipboardList, Paperclip, Send,
  Clock, Eye, Loader, CheckCircle, XCircle,
  UserCheck, MessageSquare, ArrowRight,
  Archive, RotateCcw, Trash2, Edit, ChevronDown, Smile
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { ReportStatusBadge, PriorityBadge } from './ReportStatusBadge'
import { formatDateTime, relativeTime, REPORT_STATUSES } from './reportConstants'
import { canManageReports } from '../../../lib/permissions'

const STATUS_ICONS = {
  'Pending':      Clock,
  'Under Review': Eye,
  'In Progress':  Loader,
  'Resolved':     CheckCircle,
  'Rejected':     XCircle,
}

const STATUS_STYLES = {
  'Under Review': { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-primary)' },
  'In Progress':  { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-primary)' },
  'Resolved':     { bg: 'var(--theme-500)', border: 'var(--theme-500)', color: '#fff' },
  'Rejected':     { bg: '#fee2e2', border: '#fecaca', color: '#dc2626' },
}

const DETAIL_LABELS = {
  'Material Request':    { itemName: 'Item Name', quantity: 'Quantity', unit: 'Unit', reason: 'Reason', neededBy: 'Needed By' },
  'Accident / Incident': { employeeInvolved: 'Employee Involved', accidentDate: 'Accident Date', location: 'Location', witnesses: 'Witnesses', severity: 'Severity', immediateAction: 'Immediate Action' },
  'Technical Issue':     { affectedSystem: 'Affected System', device: 'Device', errorMessage: 'Error Message', urgency: 'Urgency' },
}

export function ReportDetailsDrawer({ report, onClose, currentUser, onRefresh, employees = [], onEdit, refreshKey }) {
  const [comments,   setComments]   = useState([])
  const [statusLogs, setStatusLogs] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [assignTo,   setAssignTo]   = useState(report?.assignedTo ?? '')

  const isAdmin   = canManageReports(currentUser)
  const isAuthor  = currentUser?.username === report?.employeeNo || currentUser?.employeeId === report?.employeeId
  const canEdit   = isAuthor && (report?.status === 'Pending' || report?.status === 'Under Review')

  const loadDetails = useCallback(async () => {
    if (!report?.id) return
    const [c, s] = await Promise.all([
      window.electronAPI.getReportComments(report.id),
      window.electronAPI.getReportStatusLogs(report.id),
    ])
    setComments(c ?? [])
    setStatusLogs(s ?? [])
  }, [report?.id])

  useEffect(() => { loadDetails() }, [loadDetails, refreshKey])
  useEffect(() => { setAssignTo(report?.assignedTo ?? '') }, [report?.assignedTo])

  if (!report) return null

  async function handleStatusChange(newStatus) {
    setSubmitting(true)
    try {
      await window.electronAPI.updateReportStatus(report.id, newStatus, currentUser.username)
      await loadDetails()
      onRefresh()
    } finally { setSubmitting(false) }
  }

  async function handleAssign() {
    if (!assignTo) return
    setSubmitting(true)
    try {
      await window.electronAPI.assignReport(report.id, assignTo, currentUser.username)
      onRefresh()
    } finally { setSubmitting(false) }
  }

  async function handleComment() {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await window.electronAPI.addReportComment({
        id: uuidv4(), reportId: report.id,
        userId: String(currentUser.id), username: currentUser.username,
        comment: newComment.trim(),
      })
      setNewComment('')
      await loadDetails()
    } finally { setSubmitting(false) }
  }

  async function handleArchive() {
    setSubmitting(true)
    try { await window.electronAPI.archiveReport(report.id); onRefresh(); onClose() } finally { setSubmitting(false) }
  }
  async function handleUnarchive() {
    setSubmitting(true)
    try { await window.electronAPI.unarchiveReport(report.id); onRefresh(); onClose() } finally { setSubmitting(false) }
  }
  async function handleDelete() {
    if (!confirm('Permanently delete this report? This cannot be undone.')) return
    setSubmitting(true)
    try { await window.electronAPI.permanentDeleteReport(report.id); onRefresh(); onClose() } finally { setSubmitting(false) }
  }

  const timeline = [
    ...statusLogs.map(l => ({ type: 'status',  time: l.createdAt, data: l })),
    ...comments.map(c   => ({ type: 'comment', time: c.createdAt, data: c })),
  ].sort((a, b) => new Date(a.time) - new Date(b.time))

  const detailLabels = DETAIL_LABELS[report.reportType]
  const details      = report.reportDetailsJson

  // Status buttons for admin — exclude current status and Pending
  const statusActions = REPORT_STATUSES.filter(s => s !== report.status && s !== 'Pending')

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Dim overlay */}
      <div
        className="flex-1"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* ── Drawer panel ──────────────────────────────────────────────── */}
      <div
        className="flex flex-col h-full shadow-2xl"
        style={{
          width: '520px',
          maxWidth: '100%',
          background: 'var(--page-bg)',
          borderLeft: '1px solid var(--border)',
        }}
      >

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-6 py-5 flex items-center justify-between border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--page-bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClipboardList size={18} style={{ color: 'var(--theme-500)' }} />
            </div>
            {/* Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--theme-500)' }}>
                  {report.reportNo}
                </span>
                <ReportStatusBadge status={report.status} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '1px' }}>
                {report.reportType}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <button
                onClick={() => onEdit(report)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  height: '32px', padding: '0 12px', borderRadius: '8px', border: 'none',
                  background: 'var(--page-bg)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--page-bg)' }}
              >
                <Edit size={13} /> Edit
              </button>
            )}
            {isAdmin && (
              report.isArchived ? (
                <>
                  <IconBtn onClick={handleUnarchive} disabled={submitting} title="Unarchive"><RotateCcw size={15} /></IconBtn>
                  <IconBtn onClick={handleDelete} disabled={submitting} title="Delete" danger><Trash2 size={15} /></IconBtn>
                </>
              ) : (
                <IconBtn onClick={handleArchive} disabled={submitting} title="Archive"><Archive size={15} /></IconBtn>
              )
            )}
            <IconBtn onClick={onClose} title="Close"><X size={17} /></IconBtn>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── REPORT META ── */}
          <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
            {/* Subject */}
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: '16px', lineHeight: 1.4 }}>
              {report.subject || '—'}
            </p>

            {/* 2-col meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              <MetaRow label="Employee" value={report.employeeName || report.employeeNo || '—'} />
              <MetaRow label="Priority"    value={<PriorityBadge priority={report.priority} />} />
              {report.branch && <MetaRow label="Branch" value={report.branch} />}
              <MetaRow
                label="Assigned To"
                value={report.assignedTo
                  ? report.assignedTo
                  : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 400, fontSize: '12px' }}>Unassigned</span>}
              />
              <MetaRow label="Filed" value={formatDateTime(report.createdAt)} />
              {report.updatedAt !== report.createdAt && (
                <MetaRow label="Last Updated" value={formatDateTime(report.updatedAt)} />
              )}
            </div>
          </div>

          {/* ── BODY SECTIONS ── */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Description */}
            {report.description && (
              <div>
                <SectionLabel>Description</SectionLabel>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {report.description}
                </div>
              </div>
            )}

            {/* Type-specific details */}
            {detailLabels && details && (() => {
              const entries = Object.entries(detailLabels).filter(([key]) => details[key])
              if (!entries.length) return null
              return (
                <div>
                  <SectionLabel accent>{report.reportType} Details</SectionLabel>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                    {entries.map(([key, label], idx) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 14px',
                          background: idx % 2 === 0 ? 'var(--surface)' : 'var(--page-bg)',
                          borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{details[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Attachments */}
            {report.attachmentPaths?.length > 0 && (
              <div>
                <SectionLabel>Attachments ({report.attachmentPaths.length})</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {report.attachmentPaths.map((fp, i) => {
                    const name = fp.split(/[/\\]/).pop()
                    return (
                      <button
                        key={i}
                        onClick={() => window.electronAPI.openAttachment(fp)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                          background: 'var(--surface)', color: 'var(--text-primary)',
                          fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          maxWidth: '200px', transition: 'background 150ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                      >
                        <Paperclip size={12} style={{ color: 'var(--theme-500)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── ADMIN ACTIONS ── */}
            {isAdmin && (
              <div>
                <SectionLabel>Actions</SectionLabel>
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}>
                  {/* Assign row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}>
                    {/* Native select — styled to match the app dropdowns */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <select
                        value={assignTo}
                        onChange={e => setAssignTo(e.target.value)}
                        style={{
                          width: '100%',
                          height: '36px',
                          paddingLeft: '12px',
                          paddingRight: '32px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--page-bg)',
                          color: assignTo ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          outline: 'none',
                        }}
                      >
                        <option value="">Assign to…</option>
                        {employees.map(e => (
                          <option key={e.employee_no || e.id} value={e.name || e.employee_no}>
                            {e.name} ({e.employee_no})
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={13}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}
                      />
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={submitting || !assignTo}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        height: '36px', padding: '0 14px', borderRadius: '8px', border: 'none',
                        background: assignTo ? 'var(--theme-500)' : 'var(--border)',
                        color: assignTo ? '#fff' : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: 600, cursor: assignTo ? 'pointer' : 'not-allowed',
                        transition: 'background 150ms', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      <UserCheck size={14} /> Assign
                    </button>
                  </div>

                  {/* Status change buttons */}
                  <div style={{
                    display: 'flex', gap: '8px', flexWrap: 'wrap',
                    padding: '12px 14px',
                    background: 'var(--page-bg)',
                  }}>
                    {statusActions.map(s => {
                      const Icon = STATUS_ICONS[s] ?? Clock
                      const st = STATUS_STYLES[s] ?? { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-primary)' }
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={submitting}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            flex: 1, minWidth: 0,
                            height: '34px', padding: '0 10px', borderRadius: '8px',
                            border: `1px solid ${st.border}`,
                            background: st.bg,
                            color: st.color,
                            fontSize: '12.5px', fontWeight: 600,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            transition: 'opacity 150ms', whiteSpace: 'nowrap',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.8' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                        >
                          <Icon size={13} /> {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVITY TIMELINE ── */}
            <div>
              <SectionLabel>Activity</SectionLabel>
              {timeline.length === 0 ? (
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  No activity yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {timeline.map((item, idx) => {
                    const isStatus = item.type === 'status'
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', gap: '12px',
                          padding: '10px 0',
                          borderBottom: idx < timeline.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        {/* Icon dot */}
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isStatus ? 'var(--surface)' : 'var(--theme-500)',
                          border: isStatus ? '1px solid var(--border)' : 'none',
                          marginTop: '1px',
                        }}>
                          {isStatus
                            ? <ArrowRight size={12} style={{ color: 'var(--text-secondary)' }} />
                            : <MessageSquare size={12} style={{ color: '#fff' }} />
                          }
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isStatus ? (
                            <>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600 }}>{item.data.changedBy}</span>
                                <span style={{ color: 'var(--text-secondary)' }}> changed status</span>
                                {item.data.oldStatus && (
                                  <span style={{ color: 'var(--text-secondary)' }}> from {item.data.oldStatus}</span>
                                )}
                                <span style={{ color: 'var(--text-secondary)' }}> to </span>
                                <span style={{ fontWeight: 700 }}>{item.data.newStatus}</span>
                              </p>
                              <p style={{ margin: 0, marginTop: '3px', fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.65 }}>
                                {relativeTime(item.time)}
                              </p>
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.data.username}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.65 }}>
                                  {relativeTime(item.time)}
                                </span>
                              </div>
                              <div style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '9px 12px',
                                fontSize: '13px',
                                lineHeight: 1.55,
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {item.data.comment}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── COMMENT INPUT ────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-6 py-4 border-t flex gap-2 items-center relative"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="relative shrink-0">
            <button
              onClick={() => setShowEmojiPicker(prev => !prev)}
              style={{
                width: '38px', height: '38px', borderRadius: '8px', border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-[48px] left-0 z-50 shadow-2xl rounded-xl border border-gray-100">
                <EmojiPicker
                  onEmojiClick={(e) => {
                    setNewComment(prev => prev + e.emoji)
                    setShowEmojiPicker(false)
                  }}
                />
              </div>
            )}
          </div>
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
            placeholder="Write a comment…"
            style={{
              flex: 1, height: '38px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--page-bg)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleComment}
            disabled={submitting || !newComment.trim()}
            style={{
              width: '38px', height: '38px', borderRadius: '8px', border: 'none',
              background: newComment.trim() ? 'var(--theme-500)' : 'var(--border)',
              color: newComment.trim() ? '#fff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 150ms, color 150ms',
              flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children, accent }) {
  return (
    <p style={{
      margin: 0,
      marginBottom: '8px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: accent ? 'var(--theme-500)' : 'var(--text-secondary)',
    }}>
      {children}
    </p>
  )
}

function MetaRow({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</p>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function IconBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
        background: 'transparent',
        color: danger ? '#ef4444' : 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 150ms, color 150ms',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = danger ? '#fee2e2' : 'var(--surface-hover)'
          if (danger) e.currentTarget.style.color = '#dc2626'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = danger ? '#ef4444' : 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}
