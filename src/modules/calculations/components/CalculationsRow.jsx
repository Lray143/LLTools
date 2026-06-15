// src/modules/calculations/components/CalculationsRow.jsx
import { useRef } from 'react'

const fmt = (n) =>
  n === '' || n === null || n === undefined
    ? '—'
    : Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CalculationsRow({
  row,
  rowIndex,
  qty,           // number | '' — controlled from parent
  onQtyChange,   // (productId, value) => void
  unitPrice,     // number — already resolved (outlet override or base)
  isOutletPrice, // bool — true if price is an outlet override (show orange)
}) {
  const inputRef = useRef(null)
  const isEven   = rowIndex % 2 === 0
  const lineTotal = qty !== '' && !isNaN(Number(qty)) && Number(qty) > 0
    ? Number(qty) * Number(unitPrice)
    : null

  const handleChange = (e) => {
    const raw = e.target.value
    // Allow empty string or positive numbers only
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      onQtyChange(row.id, raw === '' ? '' : raw)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') inputRef.current?.blur()
  }

  return (
    <tr
      className={`border-b border-gray-100 transition-colors ${isEven ? 'bg-white' : 'bg-white'}`}
      style={lineTotal !== null ? { backgroundColor: 'color-mix(in srgb, var(--accent-bg) 8%, var(--surface))' } : {}}
    >
      {/* Item Description */}
      <td className="px-3 py-2 text-xs text-gray-700 w-auto">
        <p className="font-medium text-gray-800">{row.description || '—'}</p>
        <p className="text-gray-400 mt-0.5">{row.size || ''}</p>
      </td>

      {/* Case Barcode */}
      <td className="px-3 py-2 text-xs text-gray-500 font-mono w-36 hidden lg:table-cell">
        {row.caseBarcode || '—'}
      </td>

      {/* Item Barcode */}
      <td className="px-3 py-2 text-xs text-gray-500 font-mono w-36 hidden lg:table-cell">
        {row.itemBarcode || '—'}
      </td>

      {/* QTY / Case (catalog qty) */}
      <td className="px-3 py-2 text-xs text-gray-500 text-center w-20">
        {row.qty || '—'}
      </td>

      {/* Unit Price */}
      <td className="px-3 py-2 text-xs text-right w-28">
        <span
          className={isOutletPrice ? 'font-semibold' : 'text-gray-700'}
          style={isOutletPrice ? { color: 'var(--accent-bg)' } : {}}
        >
          {fmt(unitPrice)}
        </span>
      </td>

      {/* Editable Order Qty */}
      <td className="px-3 py-2 text-center w-24">
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="1"
          value={qty}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm font-medium
                      focus:outline-none focus:ring-2 focus:border-transparent
                      transition-colors
                      ${qty !== '' && Number(qty) > 0 ? '' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                      `}
          style={
            qty !== '' && Number(qty) > 0
              ? {
                  borderColor: 'color-mix(in srgb, var(--accent-bg) 40%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--accent-bg) 10%, var(--surface))',
                  color: 'color-mix(in srgb, var(--accent-bg) 90%, black)',
                  '--tw-ring-color': 'color-mix(in srgb, var(--accent-bg) 40%, transparent)'
                }
              : {
                  '--tw-ring-color': 'color-mix(in srgb, var(--accent-bg) 40%, transparent)'
                }
          }
        />
      </td>

      {/* Line Total */}
      <td className="px-3 py-2 text-right w-32">
        {lineTotal !== null ? (
          <span className="text-sm font-semibold text-gray-800">
            ₱{lineTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  )
}