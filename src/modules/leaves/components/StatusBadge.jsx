import { STATUS_CONFIG } from './leaveConstants'
import { Check, X, Clock } from 'lucide-react'

const ICONS = { Pending: Clock, Approved: Check, Denied: X }

export function StatusBadge({ status }) {
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
