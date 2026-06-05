import { useState, useEffect } from 'react'
import { CalendarClock, ChevronDown, Calendar } from 'lucide-react'
import { LEAVE_TYPES, dayCount } from './leaveConstants'

export function LeaveModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0], start_date: '', end_date: '', reason: '',
  })

  useEffect(() => {
    if (open) setForm({ leave_type: LEAVE_TYPES[0], start_date: '', end_date: '', reason: '' })
  }, [open])

  function handleSubmit() {
    if (!form.start_date || !form.end_date || form.end_date < form.start_date) return
    onSubmit(form)
  }

  if (!open) return null
  const days = dayCount(form.start_date, form.end_date)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '20px',
        width: '500px', maxWidth: '95vw',
        padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CalendarClock size={18} color="var(--theme-500)" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              File a Leave Request
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Your request will be reviewed by HR.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Leave Type */}
          <div>
            <label style={labelStyle}>Leave Type</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.leave_type}
                onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
                style={selectStyle}
              >
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} color="var(--text-secondary)" style={chevronStyle} />
            </div>
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Start Date', key: 'start_date', min: undefined },
              { label: 'End Date',   key: 'end_date',   min: form.start_date },
            ].map(({ label, key, min }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="date" value={form[key]} min={min}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          {/* Day count pill */}
          {form.start_date && form.end_date && (
            <div style={{
              background: 'var(--surface-hover)', border: '1px solid var(--theme-200)',
              borderRadius: '10px', padding: '8px 14px',
              fontSize: '12px', color: 'var(--theme-600)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Calendar size={13} />
              {days} day{days !== 1 ? 's' : ''} of leave
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={labelStyle}>
              Reason <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Briefly explain the reason for your leave..."
              rows={3}
              style={textareaStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.start_date || !form.end_date}
            style={{
              ...primaryBtnStyle,
              opacity: (!form.start_date || !form.end_date) ? 0.5 : 1,
            }}
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared input styles ──
const labelStyle = {
  fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px',
}
const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #e5e7eb', borderRadius: '10px',
  fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}
const selectStyle = {
  width: '100%', padding: '9px 36px 9px 12px',
  border: '1px solid #e5e7eb', borderRadius: '10px',
  fontSize: '13px', color: 'var(--text-primary)', background: 'var(--surface)',
  appearance: 'none', outline: 'none', cursor: 'pointer',
}
const chevronStyle = {
  position: 'absolute', right: '12px', top: '50%',
  transform: 'translateY(-50%)', pointerEvents: 'none',
}
const textareaStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #e5e7eb', borderRadius: '10px',
  fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
  resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.5',
}
const cancelBtnStyle = {
  padding: '9px 20px', borderRadius: '10px', border: '1px solid #e5e7eb',
  background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
}
const primaryBtnStyle = {
  padding: '9px 24px', borderRadius: '10px', border: 'none',
  background: 'var(--theme-500)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
}
