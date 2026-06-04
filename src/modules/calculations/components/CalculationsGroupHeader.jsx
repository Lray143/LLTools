// src/modules/calculations/components/CalculationsGroupHeader.jsx
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function CalculationsGroupHeader({ group, collapsed, onToggleCollapse }) {
  return (
    <tr className="bg-orange-50/80 border-y border-orange-100">
      <td colSpan={7} className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleCollapse(group.id)}
            className="text-orange-400 hover:text-orange-600 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="text-sm font-bold tracking-wider text-orange-700">
            {group.name}
          </span>
          <span className="text-xs font-normal text-orange-400">
            ({group.rows.length} item{group.rows.length !== 1 ? 's' : ''})
          </span>
          {/* Group subtotal if any rows have qty */}
          {group.groupTotal > 0 && (
            <span className="ml-auto text-xs font-semibold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
              ₱{group.groupTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}