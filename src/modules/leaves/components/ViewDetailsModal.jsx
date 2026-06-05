import { formatDate, dayCount } from './leaveConstants'
import { StatusBadge } from './StatusBadge'
import { CalendarClock, CheckCircle } from 'lucide-react'

export function ViewDetailsModal({ request, onClose, onReview, isHR }) {
  if (!request) return null

  const isPending = request.status === 'Pending'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* ── Landscape modal — fixed height, no grow ── */}
      <div style={{
        background: 'var(--surface)', borderRadius: '20px',
        width: '820px', maxWidth: '95vw',
        height: '520px',                     // fixed height — same feel as ReviewModal
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--surface-hover)', border: '1px solid var(--theme-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CalendarClock size={17} color="var(--theme-500)" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Leave Request Details
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{request.leave_type}</span>
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '8px',
            border: '1px solid #e5e7eb', background: 'var(--surface)',
            cursor: 'pointer', fontSize: '16px', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* ── Two-column body — fills remaining height ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          flex: 1, minHeight: 0,               // critical — lets flex children shrink
        }}>

          {/* LEFT — details + reason */}
          <div style={{
            padding: '22px 24px 22px 28px',
            borderRight: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            overflow: 'hidden',                // no outer scroll — only the box scrolls
          }}>

            {/* Info grid */}
            <div style={{
              background: 'var(--surface-hover)', borderRadius: '12px', padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '9px',
              fontSize: '13px', flexShrink: 0,
            }}>
              <InfoRow label="Employee">
                {request.emp_name || request.employee_name || request.employee_no || '—'}
              </InfoRow>
              <InfoRow label="Employee No">{request.employee_no || '—'}</InfoRow>
              <InfoRow label="Period">
                {formatDate(request.start_date)} – {formatDate(request.end_date)}
              </InfoRow>
              <InfoRow label="Duration">
                <span style={{ fontWeight: 700, color: 'var(--theme-500)' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <p style={sectionLabelStyle}>Reason</p>
              <div style={{
                ...scrollBoxStyle,
                flex: 1,                        // fills remaining left-column space
              }}>
                {request.reason
                  ? request.reason
                  : <em style={{ color: 'var(--text-secondary)' }}>No reason provided.</em>}
              </div>
            </div>
          </div>

          {/* RIGHT — HR feedback */}
          <div style={{
            padding: '22px 28px 22px 24px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            overflow: 'hidden',
          }}>

            {/* HR Note — fixed height, scrollable */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <p style={sectionLabelStyle}>HR Note</p>
              <div style={{
                ...scrollBoxStyle,
                flex: 1,
                border: request.review_note
                  ? '1px solid rgba(0,0,0,0.06)'
                  : '1px dashed #e8e4df',
              }}>
                {request.review_note
                  ? request.review_note
                  : <em style={{ color: 'var(--text-secondary)' }}>
                      {request.status === 'Pending' ? 'Awaiting HR review…' : 'No note was added.'}
                    </em>}
              </div>
            </div>

            {/* Reviewer chip */}
            {request.reviewed_by ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 13px', borderRadius: '10px', background: 'var(--surface-hover)',
                fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0,
              }}>
                <CheckCircle size={13} color="#16a34a" />
                <span>
                  Reviewed by <strong>{request.reviewed_by}</strong>
                  {request.reviewed_at && (
                    <> · {new Date(request.reviewed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}</>
                  )}
                </span>
              </div>
            ) : (
              <div style={{
                padding: '9px 13px', borderRadius: '10px',
                background: 'var(--surface-hover)', border: '1px solid #fde68a',
                fontSize: '12px', color: '#92400e', flexShrink: 0,
              }}>
                ⏳ Pending review by HR
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: '1px solid #e5e7eb', background: 'var(--surface)',
                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>
                Close
              </button>
              {isHR && isPending && (
                <button onClick={onReview} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: 'var(--theme-500)', color: '#fff',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                }}>
                  Review Request →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
        {children}
      </span>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const sectionLabelStyle = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 8px',
}

const scrollBoxStyle = {
  background: 'var(--surface-hover)',
  borderRadius: '10px',
  padding: '13px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  lineHeight: '1.7',
  border: '1px solid var(--border)',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  overflowY: 'auto',           // scrolls inside the box
}
