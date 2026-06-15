// src/modules/calculations/components/CalculationsGroupHeader.jsx
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function CalculationsGroupHeader({ group, collapsed, onToggleCollapse }) {
  return (
    <tr className="border-y" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-bg) 10%, var(--surface))', borderColor: 'color-mix(in srgb, var(--accent-bg) 20%, var(--border))' }}>
      <td colSpan={7} className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleCollapse(group.id)}
            className="transition-colors"
            style={{ color: 'var(--accent-bg)', opacity: 0.8 }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="text-sm font-bold tracking-wider" style={{ color: 'var(--accent-bg)' }}>
            {group.name}
          </span>
          <span className="text-xs font-normal" style={{ color: 'var(--accent-bg)', opacity: 0.7 }}>
            ({group.rows.length} item{group.rows.length !== 1 ? 's' : ''})
          </span>
          {/* Group subtotal if any rows have qty */}
          {group.groupTotal > 0 && (
            <span
              className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                color: 'var(--accent-bg)',
                backgroundColor: 'color-mix(in srgb, var(--accent-bg) 15%, transparent)'
              }}
            >
              ₱{group.groupTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}