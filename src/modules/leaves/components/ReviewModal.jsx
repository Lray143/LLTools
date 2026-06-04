import { useState, useEffect } from 'react'
import { formatDate, dayCount } from './leaveConstants'

export function ReviewModal({ request, onClose, onReview, loading }) {
  const [note, setNote] = useState('')
  useEffect(() => { if (request) setNote('') }, [request?.id])
  if (!request) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Landscape modal */}
      <div style={{
        background: '#fff', borderRadius: '20px',
        width: '820px', maxWidth: '95vw',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* ── Top bar ── */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1008', margin: 0 }}>
              Review Leave Request
            </h2>
            <p style={{ fontSize: '12px', color: '#a09278', margin: '2px 0 0' }}>
              {request.emp_name || request.employee_name || request.employee_no}
              {' · '}
              <span style={{ color: '#f97316', fontWeight: 500 }}>{request.leave_type}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: '#a09278', lineHeight: 1,
          }}>
            ×
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>

          {/* LEFT — Request details */}
          <div style={{
            padding: '24px 28px',
            borderRight: '1px solid rgba(0,0,0,0.07)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            {/* Info cards */}
            <div style={{
              background: '#faf9f6', borderRadius: '12px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              fontSize: '13px', color: '#4b3a2a',
            }}>
              <InfoRow label="Employee">{request.emp_name || request.employee_name || request.employee_no}</InfoRow>
              <InfoRow label="Employee No">{request.employee_no}</InfoRow>
              <InfoRow label="Period">
                {formatDate(request.start_date)} – {formatDate(request.end_date)}
              </InfoRow>
              <InfoRow label="Duration">
                <span style={{ fontWeight: 700, color: '#f97316' }}>
                  {dayCount(request.start_date, request.end_date)} day(s)
                </span>
              </InfoRow>
              <InfoRow label="Filed">
                {request.created_at
                  ? new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
              </InfoRow>
            </div>

            {/* Reason — scrollable box */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#a09278', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Reason
              </p>
              <div style={{
                background: '#faf9f6', borderRadius: '10px', padding: '14px',
                fontSize: '13px', color: '#4b3a2a', lineHeight: '1.6',
                maxHeight: '220px', overflowY: 'auto',
                border: '1px solid rgba(0,0,0,0.06)',
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              }}>
                {request.reason || <span style={{ color: '#c9bfaf', fontStyle: 'italic' }}>No reason provided.</span>}
              </div>
            </div>
          </div>

          {/* RIGHT — Review note + actions */}
          <div style={{
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            overflowY: 'auto',
          }}>
            <div>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#6b5c4c',
                display: 'block', marginBottom: '6px',
              }}>
                Review Note
                <span style={{ color: '#a09278', fontWeight: 400, marginLeft: '6px' }}>
                  (optional — employee will see this)
                </span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note for the employee explaining your decision..."
                rows={8}
                style={{
                  width: '100%', padding: '12px',
                  border: '1px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '13px', color: '#1c1008', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit', lineHeight: '1.6',
                }}
              />
            </div>

            {/* Decision reminder */}
            <div style={{
              background: '#fff8f2', borderRadius: '10px', padding: '12px 14px',
              fontSize: '12px', color: '#92400e', lineHeight: '1.5',
              border: '1px solid #fed7aa',
            }}>
              <strong>Heads up:</strong> This action will update the request status immediately and the employee will be notified on their next login.
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '11px', borderRadius: '10px',
                border: '1px solid #e5e7eb', background: '#fff',
                color: '#6b5c4c', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={() => onReview('Denied', note)}
                disabled={loading}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                  background: '#fee2e2', color: '#dc2626',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                ✗ Deny
              </button>
              <button
                onClick={() => onReview('Approved', note)}
                disabled={loading}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                  background: '#f97316', color: '#fff',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                }}
              >
                ✓ Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ color: '#a09278', flexShrink: 0, fontSize: '12px' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right', fontSize: '13px' }}>{children}</span>
    </div>
  )
}
