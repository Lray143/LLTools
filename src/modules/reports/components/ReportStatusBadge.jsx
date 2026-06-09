import { STATUS_CONFIG } from './reportConstants'
import { Clock, Eye, Loader, CheckCircle, XCircle } from 'lucide-react'

const ICONS = {
  'Pending':      Clock,
  'Under Review': Eye,
  'In Progress':  Loader,
  'Resolved':     CheckCircle,
  'Rejected':     XCircle,
}

export function ReportStatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  const Icon = ICONS[status] ?? Clock
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border"
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
      }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const cfg = {
    'Low':    { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
    'Medium': { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'High':   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'Urgent': { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  }[priority] ?? { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }

  return (
    <span
      className="text-[12.5px] font-semibold whitespace-nowrap"
      style={{ color: cfg.color }}
    >
      {priority}
    </span>
  )
}
