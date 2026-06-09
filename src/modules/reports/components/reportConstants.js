// ── Shared constants & helpers for the Reports module ──────────────

export const REPORT_TYPES = [
  'Material Request',
  'Accident / Incident',
  'Technical Issue',
  'Equipment Damage',
  'Safety Concern',
  'Facility Maintenance',
  'Inventory Shortage',
  'Customer Complaint',
  'Suggestion / Improvement',
  'HR Concern',
  'Other',
]

export const REPORT_STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected']

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export const STATUS_CONFIG = {
  'Pending':      { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  'Under Review': { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
  'In Progress':  { color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  'Resolved':     { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  'Rejected':     { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
}

export const PRIORITY_CONFIG = {
  'Low':    { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  'Medium': { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  'High':   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  'Urgent': { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
}

export const ADMIN_ROLES = ['admin', 'hr']

export function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function truncate(str, max = 55) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}

export function relativeTime(iso) {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}
