import { useState, useEffect } from 'react'
import { formatDate, dayCount } from './leaveConstants'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"

export function ReviewModal({ request, onClose, onReview, loading }) {
  const [note, setNote] = useState('')
  useEffect(() => { if (request) setNote('') }, [request?.id])

  return (
    <Dialog open={!!request} onOpenChange={val => { if (!val) onClose() }}>
      {/* Landscape modal */}
      <DialogContent 
        className="outline-none focus:outline-none ring-0 focus:ring-0 border-0 p-0 flex flex-col overflow-hidden" 
        style={{ width: '820px', maxWidth: '95vw', maxHeight: '90vh', background: 'var(--surface)', color: 'var(--text-primary)' }}
      >
        {/* ── Top bar ── */}
        <DialogHeader className="px-7 py-5 border-b flex-shrink-0 flex flex-row items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-0.5 mt-2.5">
            <DialogTitle className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>
              Review Leave Request
            </DialogTitle>
            <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
              {request?.emp_name || request?.employee_name || request?.employee_no}
              {' · '}
              <span className="font-semibold" style={{ color: 'var(--theme-500)' }}>{request?.leave_type}</span>
            </p>
          </div>
        </DialogHeader>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-2 flex-1 min-h-0">

          {/* LEFT — Request details */}
          <div className="p-6 md:p-7 border-r overflow-y-auto flex flex-col gap-5" style={{ borderColor: 'var(--border)' }}>
            {/* Info cards */}
            <div className="rounded-xl p-4 flex flex-col gap-3 text-[13px]" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
              <InfoRow label="Employee">{request?.emp_name || request?.employee_name || request?.employee_no}</InfoRow>
              <InfoRow label="Employee No">{request?.employee_no}</InfoRow>
              <InfoRow label="Period">
                {formatDate(request?.start_date)} – {formatDate(request?.end_date)}
              </InfoRow>
              <InfoRow label="Duration">
                <span className="font-bold" style={{ color: 'var(--theme-500)' }}>
                  {dayCount(request?.start_date, request?.end_date)} day(s)
                </span>
              </InfoRow>
              <InfoRow label="Filed">
                {request?.created_at
                  ? new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
              </InfoRow>
            </div>

            {/* Reason — scrollable box */}
            <div className="flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                Reason
              </p>
              <div className="rounded-xl p-4 text-[13px] leading-relaxed max-h-[220px] overflow-y-auto border break-words whitespace-pre-wrap" style={{ background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                {request?.reason || <span className="italic" style={{ color: 'var(--text-secondary)' }}>No reason provided.</span>}
              </div>
            </div>
          </div>

          {/* RIGHT — Review note + actions */}
          <div className="p-6 md:p-7 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Review Note
                <span className="font-normal ml-1.5 opacity-70">
                  (optional — employee will see this)
                </span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note for the employee explaining your decision..."
                rows={8}
                className="w-full p-3 border rounded-xl text-[13px] outline-none resize-y flex-1 font-sans leading-relaxed"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Decision reminder */}
            <div className="rounded-xl p-3.5 text-xs leading-relaxed border shrink-0" style={{ background: 'var(--surface-hover)', borderColor: 'var(--theme-200)', color: 'var(--theme-600)' }}>
              <strong>Heads up:</strong> This action will update the request status immediately and the employee will be notified on their next login.
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 mt-2 shrink-0">
              <Button onClick={onClose} variant="outline" className="flex-1 h-11 rounded-xl text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Cancel
              </Button>
              <Button
                onClick={() => onReview('Denied', note)}
                disabled={loading}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-red-200 bg-red-50 text-red-600 text-[13px] font-semibold hover:bg-red-100 hover:text-red-700"
              >
                ✗ Deny
              </Button>
              <Button
                onClick={() => onReview('Approved', note)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border-0 text-[13px] font-semibold"
                style={{ background: 'var(--theme-500)', color: '#fff' }}
              >
                ✓ Approve
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="shrink-0 text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-semibold text-right text-[13px]">{children}</span>
    </div>
  )
}
