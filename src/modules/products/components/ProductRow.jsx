// src/modules/products/components/ProductRow.jsx
import { useRef, useState } from 'react'
import { Trash2, RotateCcw } from 'lucide-react'

const BASE_FIELDS = [
  { key: 'caseBarcode', label: 'Case Barcode',    type: 'text',   align: 'left'   },
  { key: 'itemBarcode', label: 'Item Barcode',     type: 'text',   align: 'left'   },
  { key: 'description', label: 'Item Description', type: 'text',   align: 'left'   },
  { key: 'qty',         label: 'QTY / Case',       type: 'number', align: 'center' },
  { key: 'size',        label: 'Item Size',        type: 'text',   align: 'center' },
]

// ── Regular editable cell (non-price fields) ─────────────────────
function EditableCell({ value, type, align, onCommit, editMode }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const inputRef = useRef(null)

  const startEdit = () => {
    if (!editMode) return
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    setEditing(false)
    const parsed = type === 'number' ? parseFloat(draft) || 0 : draft.trim()
    onCommit(parsed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') { setEditing(false); setDraft(value) }
  }

  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }[align]

  const display =
    type === 'number' && (value === '' || value === null || value === undefined)
      ? '—'
      : type === 'number'
      ? Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : (value ?? '—')

  if (editing) {
    return (
      <td className="px-3 py-1.5">
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`w-full border border-orange-400 rounded px-2 py-1 text-xs
                      focus:outline-none focus:ring-2 focus:ring-orange-300
                      bg-orange-50 ${alignClass}`}
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      title={editMode ? 'Click to edit' : undefined}
      className={`px-3 py-2 text-xs text-gray-700 select-none transition-colors group
                  ${editMode ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'}
                  ${alignClass}`}
    >
      <span className={editMode ? 'group-hover:text-orange-600 transition-colors' : ''}>
        {display}
      </span>
    </td>
  )
}

// ── Price cell — outlet-aware ─────────────────────────────────────
// outletPrice = number (outlet override) | undefined (no override → fall back to base)
// basePrice   = number (always the canonical price stored in products table)
function PriceCell({ basePrice, outletPrice, onCommitBase, onCommitOutlet, onResetOutlet, editMode, isOutletMode }) {
  const [editing, setEditing] = useState(false)
  const hasOverride = outletPrice !== undefined && outletPrice !== null
  const displayPrice = isOutletMode
    ? (hasOverride ? outletPrice : basePrice)
    : basePrice
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const startEdit = () => {
    if (!editMode) return
    setDraft(String(displayPrice ?? ''))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    setEditing(false)
    const val = parseFloat(draft) || 0
    if (isOutletMode) {
      onCommitOutlet(val)
    } else {
      onCommitBase(val)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const formatted =
    displayPrice === '' || displayPrice === null || displayPrice === undefined
      ? '—'
      : Number(displayPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (editing) {
    return (
      <td className="px-3 py-1.5 text-right">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full border border-orange-400 rounded px-2 py-1 text-xs text-right
                     focus:outline-none focus:ring-2 focus:ring-orange-300 bg-orange-50"
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      title={
        !editMode ? undefined
        : isOutletMode && hasOverride ? 'Click to edit outlet price · (i) has custom price'
        : editMode ? 'Click to edit'
        : undefined
      }
      className={`px-3 py-2 text-xs select-none transition-colors text-right relative group
                  ${editMode ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'}`}
    >
      {/* Price value */}
      <span className={
        isOutletMode && hasOverride
          ? 'text-orange-600 font-semibold'
          : 'text-gray-700'
      }>
        {formatted}
      </span>

      {/* Reset-to-default button — shown on hover in outlet+edit mode when there's an override */}
      {isOutletMode && hasOverride && editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onResetOutlet() }}
          title="Reset to default price"
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                     transition-opacity text-gray-400 hover:text-red-400 p-0.5 rounded"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </td>
  )
}

// ── Main ProductRow ────────────────────────────────────────────────
export default function ProductRow({
  row, rowIndex, groupId,
  onUpdateCell, onDeleteRow,
  editMode, selected, onToggleSelect,
  // Outlet price props
  isOutletMode,
  outletPrice,         // number | undefined
  onUpdateOutletPrice, // (productId, price) => void
  onResetOutletPrice,  // (productId) => void
}) {
  const isEven = rowIndex % 2 === 0

  return (
    <tr className={`border-b border-gray-100 transition-colors group
                    ${selected
                      ? 'bg-orange-50'
                      : isEven ? 'bg-white' : 'bg-gray-50/60'
                    }
                    ${editMode && !selected ? 'hover:bg-orange-50/40' : ''}`}>

      {/* Checkbox */}
      <td className="px-3 py-2 w-8">
        {editMode && !isOutletMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(row.id)}
            className="rounded border-gray-300 text-orange-500
                       focus:ring-orange-400 cursor-pointer"
          />
        )}
      </td>

      {BASE_FIELDS.map((field) => (
        <EditableCell
          key={field.key}
          value={row[field.key]}
          type={field.type}
          align={field.align}
          onCommit={(val) => onUpdateCell(groupId, row.id, field.key, val)}
          editMode={editMode && !isOutletMode}  // base fields locked in outlet mode
        />
      ))}

      {/* Price cell — outlet-aware */}
      <PriceCell
        basePrice={row.price}
        outletPrice={outletPrice}
        onCommitBase={(val) => onUpdateCell(groupId, row.id, 'price', val)}
        onCommitOutlet={(val) => onUpdateOutletPrice(row.id, val)}
        onResetOutlet={() => onResetOutletPrice(row.id)}
        editMode={editMode}
        isOutletMode={isOutletMode}
      />

      {/* Per-row delete — only in default mode */}
      <td className="px-3 py-2 text-center">
        {editMode && !isOutletMode && (
          <button
            onClick={() => onDeleteRow(groupId, row.id)}
            title="Delete row"
            className="opacity-0 group-hover:opacity-100 transition-opacity
                       text-gray-300 hover:text-red-500 hover:scale-110 transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}