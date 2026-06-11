import { formatDate, dayCount } from './leaveConstants'
import { StatusBadge } from './StatusBadge'
import { CalendarClock, CheckCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"

export function ViewDetailsModal({ request, onClose, onReview, isHR }) {
  if (!request) return null

  const isPending = request.status === 'Pending'

  return (
    <Dialog open={!!request} onOpenChange={val => { if (!val) onClose() }}>
      {/* ── Landscape modal — fixed height, no grow ── */}
      <DialogContent 
        className="outline-none focus:outline-none ring-0 focus:ring-0 border-0 p-0 flex flex-col overflow-hidden" 
        style={{ width: '820px', maxWidth: '95vw', height: '520px', background: 'var(--surface)', color: 'var(--text-primary)' }}
      >
        {/* ── Top bar ── */}
        <DialogHeader className="px-7 py-5 border-b flex-shrink-0 flex flex-row items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-hover)', border: '1px solid var(--theme-200)' }}>
              <CalendarClock size={20} style={{ color: 'var(--theme-500)' }} />
            </div>
            <div className="flex flex-col mt-2">
              <DialogTitle className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                Leave Request Details
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{request.leave_type}</span>
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Two-column body — fills remaining height ── */}
        <div className="grid grid-cols-2 flex-1 min-h-0">

          {/* LEFT — details + reason */}
          <div className="p-6 md:p-7 border-r flex flex-col gap-4 overflow-hidden" style={{ borderColor: 'var(--border)' }}>

            {/* Info grid */}
            <div className="rounded-xl p-4 flex flex-col gap-2.5 text-[13px] shrink-0" style={{ background: 'var(--surface-hover)' }}>
              <InfoRow label="Reference No">
                <span className="font-mono font-bold" style={{ color: 'var(--accent-bg)' }}>
                  {request.leave_no || '—'}
                </span>
              </InfoRow>
              <InfoRow label="Employee">
                {request.emp_name || request.employee_name || request.employee_no || '—'}
              </InfoRow>
              <InfoRow label="Employee No">{request.employee_no || '—'}</InfoRow>
              <InfoRow label="Period">
                {formatDate(request.start_date)} – {formatDate(request.end_date)}
              </InfoRow>
              <InfoRow label="Duration">
                <span className="font-bold" style={{ color: 'var(--theme-500)' }}>
                  {dayCount(request.start_date, request.end_date)} day(s)
                </span>
              </InfoRow>
              <InfoRow label="Filed">
                {request.created_at
                  ? new Date(request.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
              </InfoRow>
            </div>

            {/* Reason — fixed height, scrollable */}
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                Reason
              </p>
              <div className="rounded-xl p-3.5 text-[13px] leading-relaxed border break-words whitespace-pre-wrap overflow-y-auto flex-1" style={{ background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                {request.reason
                  ? request.reason
                  : <em className="font-normal not-italic opacity-50" style={{ color: 'var(--text-secondary)' }}>No reason provided.</em>}
              </div>
            </div>
          </div>

          {/* RIGHT — HR feedback */}
          <div className="p-6 md:p-7 flex flex-col gap-3.5 overflow-hidden">

            {/* HR Note — fixed height, scrollable */}
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                HR Note
              </p>
              <div className={`rounded-xl p-3.5 text-[13px] leading-relaxed overflow-y-auto flex-1 break-words whitespace-pre-wrap border`} style={{ background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)', borderStyle: request.review_note ? 'solid' : 'dashed' }}>
                {request.review_note
                  ? request.review_note
                  : <em className="font-normal not-italic opacity-50" style={{ color: 'var(--text-secondary)' }}>
                      {request.status === 'Pending' ? 'Awaiting HR review…' : 'No note was added.'}
                    </em>}
              </div>
            </div>

            {/* Reviewer chip */}
            {request.reviewed_by ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs shrink-0" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} className="text-green-600" />
                <span>
                  Reviewed by <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{request.reviewed_by}</strong>
                  {request.reviewed_at && (
                    <> · {new Date(request.reviewed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}</>
                  )}
                </span>
              </div>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl text-xs shrink-0 font-medium border" style={{ background: 'var(--surface-hover)', borderColor: 'var(--theme-200)', color: 'var(--theme-600)' }}>
                ⏳ Pending review by HR
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 shrink-0 mt-2">
              <Button onClick={onClose} variant="outline" className="flex-1 h-10 rounded-xl text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Close
              </Button>
              {isHR && isPending && (
                <Button onClick={onReview} className="flex-1 h-10 rounded-xl border-0 text-[13px] font-semibold" style={{ background: 'var(--theme-500)', color: '#fff' }}>
                  Review Request →
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-[13px] font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
        {children}
      </span>
    </div>
  )
}
