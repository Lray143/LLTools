// ── Shared constants & helpers for the Leave Requests module ──────────────

export const LEAVE_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Birthday Leave',
  'Service Incentive Leave',
  'Emergency Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Other',
]

export const STATUS_CONFIG = {
  Pending:  { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Approved: { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  Denied:   { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
}

export const HR_ROLES = ['admin', 'hr']

export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function dayCount(start, end) {
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end   + 'T00:00:00')
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

export function truncate(str, max = 55) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}

export const thStyle = {
  textAlign    : 'left',
  padding      : '11px 16px',
  fontSize     : '11px',
  color        : '#a09278',
  fontWeight   : 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace   : 'nowrap',
}

export const tdStyle = {
  padding      : '13px 16px',
  verticalAlign: 'middle',
}
