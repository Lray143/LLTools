import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  X, ClipboardList, Paperclip, Send,
  Clock, Eye, Loader, CheckCircle, XCircle, UserCheck, MessageSquare, ArrowRight,
  Archive, Trash2, Edit, RefreshCw
} from 'lucide-react'
import { ReportStatusBadge, PriorityBadge } from './ReportStatusBadge'
import { formatDateTime, relativeTime, REPORT_STATUSES } from './reportConstants'
import { Button } from '../../../components/ui/button'
import { canManageReports } from '../../../lib/permissions'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select"

const STATUS_ICONS = {
  'Pending': Clock, 'Under Review': Eye, 'In Progress': Loader,
  'Resolved': CheckCircle, 'Rejected': XCircle,
}

const DETAIL_LABELS = {
  'Material Request': { itemName: 'Item Name', quantity: 'Quantity', unit: 'Unit', reason: 'Reason', neededBy: 'Needed By' },
  'Accident / Incident': { employeeInvolved: 'Employee Involved', accidentDate: 'Accident Date', location: 'Location', witnesses: 'Witnesses', severity: 'Severity', immediateAction: 'Immediate Action' },
  'Technical Issue': { affectedSystem: 'Affected System', device: 'Device', errorMessage: 'Error Message', urgency: 'Urgency' },
}

export function ReportDetailsDrawer({ report, onClose, currentUser, onRefresh, employees = [], onEdit }) {
  const [comments, setComments] = useState([])
  const [statusLogs, setStatusLogs] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [assignTo, setAssignTo] = useState(report?.assignedTo ?? '')

  const isAdmin = canManageReports(currentUser)

  const loadDetails = useCallback(async () => {
    if (!report?.id) return
    const [c, s] = await Promise.all([
      window.electronAPI.getReportComments(report.id),
      window.electronAPI.getReportStatusLogs(report.id),
    ])
    setComments(c ?? [])
    setStatusLogs(s ?? [])
  }, [report?.id])

  useEffect(() => { loadDetails() }, [loadDetails])
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
        id: uuidv4(),
        reportId: report.id,
        userId: String(currentUser.id),
        username: currentUser.username,
        comment: newComment.trim(),
      })
      setNewComment('')
      await loadDetails()
    } finally { setSubmitting(false) }
  }

  function handleOpenAttachment(filePath) {
    window.electronAPI.openAttachment(filePath)
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
    if (!confirm('Are you sure you want to permanently delete this report? This cannot be undone.')) return
    setSubmitting(true)
    try { await window.electronAPI.permanentDeleteReport(report.id); onRefresh(); onClose() } finally { setSubmitting(false) }
  }

  const timeline = [
    ...statusLogs.map(l => ({ type: 'status', time: l.createdAt, data: l })),
    ...comments.map(c => ({ type: 'comment', time: c.createdAt, data: c })),
  ].sort((a, b) => new Date(a.time) - new Date(b.time))

  const detailLabels = DETAIL_LABELS[report.reportType]
  const details = report.reportDetailsJson
  const isFinal = report.status === 'Resolved' || report.status === 'Rejected'
  const isAuthor = currentUser?.username === report?.employeeNo || currentUser?.employeeId === report?.employeeId
  const canEdit = isAuthor && (report.status === 'Pending' || report.status === 'Under Review')

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Overlay */}
      <div className="flex-1" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />

      {/* Drawer */}
      <div className="w-[560px] max-w-full h-full flex flex-col shadow-2xl" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-hover)', border: '1px solid var(--theme-200)' }}>
              <ClipboardList size={20} style={{ color: 'var(--theme-500)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>{report.reportNo}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{report.reportType}</span>
                <ReportStatusBadge status={report.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {canEdit && (
              <button onClick={() => onEdit(report)} title="Edit report" className="h-8 px-3 rounded-lg flex items-center gap-1.5 transition-colors font-medium text-xs" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <Edit size={14} /> Edit
              </button>
            )}
            {isAdmin && (
              report.isArchived ? (
                <>
                  <button
                    onClick={handleUnarchive}
                    disabled={submitting}
                    title="Unarchive report"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    title="Permanently delete report"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleArchive}
                  disabled={submitting}
                  title="Archive report"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Archive size={16} />
                </button>
              )
            )}
            <button onClick={onClose} title="Close" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* ══ REPORT INFO — always visible, top section ══ */}
          <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
            {/* Subject */}
            <p className="text-[15px] font-semibold m-0 mb-4 leading-snug" style={{ color: 'var(--text-primary)' }}>
              {report.subject || '—'}
            </p>
            {/* Info in 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <InfoCell label="Employee" value={report.employeeName || report.employeeNo || '—'} />
              <InfoCell label="Priority" value={<PriorityBadge priority={report.priority} />} />
              {report.branch && <InfoCell label="Branch" value={report.branch} />}
              <InfoCell label="Assigned To" value={report.assignedTo || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Unassigned</span>} />
              <InfoCell label="Filed" value={formatDateTime(report.createdAt)} />
              {report.updatedAt !== report.createdAt && (
                <InfoCell label="Last Updated" value={formatDateTime(report.updatedAt)} />
              )}
            </div>
          </div>

          {/* ══ Remaining sections ══ */}
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Description */}
            {report.description && (
              <div>
                <SectionLabel>Description</SectionLabel>
                <div className="rounded-lg p-3.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                  {report.description}
                </div>
              </div>
            )}

            {/* Type-specific details */}
            {detailLabels && details && (() => {
              const entries = Object.entries(detailLabels).filter(([key]) => details[key])
              if (entries.length === 0) return null
              return (
                <div>
                  <SectionLabel color="var(--theme-500)">{report.reportType} Details</SectionLabel>
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {entries.map(([key, label], idx) => (
                      <div key={key} className="flex items-center justify-between px-4 py-2.5" style={{ background: idx % 2 === 0 ? 'var(--surface-hover)' : 'var(--surface)' }}>
                        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span className="text-[13px] font-semibold text-right" style={{ color: 'var(--text-primary)' }}>{details[key]}</span>
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
                <div className="flex flex-wrap gap-2">
                  {report.attachmentPaths.map((fp, i) => {
                    const name = fp.split(/[\\/]/).pop()
                    return (
                      <button key={i} onClick={() => handleOpenAttachment(fp)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                        style={{ borderColor: 'var(--theme-200)', background: 'var(--surface-hover)', color: 'var(--theme-600)', cursor: 'pointer' }}
                      >
                        <Paperclip size={12} />
                        <span className="max-w-[160px] truncate">{name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div>
                <SectionLabel>Admin Actions</SectionLabel>
                <div className="rounded-lg p-4 flex flex-col gap-3.5" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                  {/* Assign */}
                  <div className="flex items-center gap-2">
                    <Select value={assignTo} onValueChange={setAssignTo}>
                      <SelectTrigger className="h-9 text-sm flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {employees.map(e => (
                          <SelectItem key={e.employee_no || e.id} value={e.name || e.employee_no} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>
                            {e.name} ({e.employee_no})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssign} disabled={submitting || !assignTo} className="h-9 px-4 text-xs font-semibold border-0 shrink-0" style={{ background: 'var(--theme-500)', color: '#fff' }}>
                      <UserCheck size={14} className="mr-1" /> Assign
                    </Button>
                  </div>

                  {/* Status buttons */}
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  <div className="flex gap-2 flex-wrap">
                    {REPORT_STATUSES.filter(s => s !== report.status && s !== 'Pending').map(s => {
                      const Icon = STATUS_ICONS[s] ?? Clock
                      const isResolve = s === 'Resolved'
                      const isReject = s === 'Rejected'
                      return (
                        <Button key={s} onClick={() => handleStatusChange(s)} disabled={submitting}
                          variant="outline"
                          className={`h-9 px-3 rounded-lg text-xs font-semibold transition-colors flex-1 ${isReject ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : isResolve ? 'border-0' : ''}`}
                          style={isResolve ? { background: 'var(--theme-500)', color: '#fff', border: 'none' } : isReject ? {} : { borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                        >
                          <Icon size={13} className="mr-1" /> {s}
                        </Button>
                      )
                    })}
                  </div>


                </div>
              </div>
            )}

            {/* Activity timeline */}
            <div>
              <SectionLabel>Activity Timeline</SectionLabel>
              {timeline.length === 0 ? (
                <p className="text-xs italic m-0 px-1" style={{ color: 'var(--text-secondary)' }}>No activity yet.</p>
              ) : (
                <div className="flex flex-col">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-3 relative" style={{ paddingTop: idx === 0 ? 0 : 12, paddingBottom: idx === timeline.length - 1 ? 0 : 12, borderBottom: idx < timeline.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {/* Icon */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.type === 'status' ? 'var(--surface-hover)' : 'var(--theme-500)', border: item.type === 'status' ? '2px solid var(--border)' : 'none' }}>
                        {item.type === 'status' ? (
                          <ArrowRight size={12} style={{ color: 'var(--text-secondary)' }} />
                        ) : (
                          <MessageSquare size={12} style={{ color: '#fff' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {item.type === 'status' ? (
                          <>
                            <p className="m-0 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                              <span className="font-semibold">{item.data.changedBy}</span>
                              <span style={{ color: 'var(--text-secondary)' }}> changed status </span>
                              {item.data.oldStatus && (
                                <><span style={{ color: 'var(--text-secondary)' }}>{item.data.oldStatus}</span> <span style={{ color: 'var(--text-secondary)' }}>→</span> </>
                              )}
                              <span className="font-bold">{item.data.newStatus}</span>
                            </p>
                            <p className="m-0 mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{relativeTime(item.time)}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.data.username}</span>
                              <span className="text-[11px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{relativeTime(item.time)}</span>
                            </div>
                            <div className="mt-1 rounded-lg p-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                              {item.data.comment}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Comment input ── */}
        <div className="px-6 py-4 border-t shrink-0 flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
            placeholder="Write a comment..."
            className="flex-1 px-3.5 py-2.5 rounded-lg text-sm outline-none border"
            style={{ background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Button onClick={handleComment} disabled={submitting || !newComment.trim()} className="h-[38px] px-4 border-0" style={{ background: 'var(--theme-500)', color: '#fff' }}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Section label ────────────────────────────────────────────────
function SectionLabel({ children, color }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest m-0 mb-2"
      style={{ color: color || 'var(--text-secondary)' }}
    >
      {children}
    </p>
  )
}

// ── Info cell (for the 2-col grid) ──────────────────────────────
function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-[11px] m-0 mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
