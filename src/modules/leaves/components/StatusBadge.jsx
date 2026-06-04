import { STATUS_CONFIG } from './leaveConstants'
import { Check, X, Clock } from 'lucide-react'

const ICONS = { Pending: Clock, Approved: Check, Denied: X }

export function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  const Icon = ICONS[status] ?? Clock
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap',
    }}>
      <Icon size={11} strokeWidth={2.5} />
      {status}
    </span>
  )
}
