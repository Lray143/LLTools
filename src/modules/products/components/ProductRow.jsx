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

const cellBase = {
  fontSize: '12px', color: 'var(--text-primary)', padding: '9px 12px',
  verticalAlign: 'middle', userSelect: 'none',
}

// ── Regular editable cell ─────────────────────────────────────────
function EditableCell({ value, type, align, onCommit, editMode }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const inputRef = useRef(null)

  const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'

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

  const display =
    type === 'number' && (value === '' || value === null || value === undefined)
      ? '—'
      : type === 'number'
      ? Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : (value ?? '—')

  if (editing) {
    return (
      <td className="px-3 py-1.5 align-middle select-none">
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-xs rounded-md border border-orange-500 outline-none bg-orange-50 text-orange-900"
          style={{ textAlign }}
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      title={editMode ? 'Click to edit' : undefined}
      className={`px-3 py-2 text-xs align-middle select-none transition-colors ${editMode ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'}`}
      style={{ textAlign }}
    >
      <span className="transition-colors text-gray-700">
        {display}
      </span>
    </td>
  )
}

// ── Price cell ────────────────────────────────────────────────────
function PriceCell({ basePrice, outletPrice, onCommitBase, onCommitOutlet, onResetOutlet, editMode, isOutletMode }) {
  const [editing, setEditing] = useState(false)
  const hasOverride = outletPrice !== undefined && outletPrice !== null
  const displayPrice = isOutletMode ? (hasOverride ? outletPrice : basePrice) : basePrice
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
    if (isOutletMode) onCommitOutlet(val)
    else onCommitBase(val)
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
      <td className="px-3 py-1.5 text-right align-middle select-none">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full text-right px-2 py-1 text-xs rounded-md border border-orange-500 outline-none bg-orange-50 text-orange-900"
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      className={`px-3 py-2 text-xs text-right align-middle select-none relative transition-colors ${editMode ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'}`}
    >
      <span className={isOutletMode && hasOverride ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
        {formatted}
      </span>
      {/* Reset button — outlet override hover */}
      {isOutletMode && hasOverride && editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onResetOutlet() }}
          title="Reset to default price"
          className="absolute right-1 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-gray-400 p-0.5 rounded opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
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
  isOutletMode, outletPrice, onUpdateOutletPrice, onResetOutletPrice,
}) {
  const isEven = rowIndex % 2 === 0

  return (
    <tr
      className={`group border-b border-gray-100 transition-colors
                  ${selected ? 'bg-orange-50/30' : isEven ? 'bg-white' : 'bg-white'}`}
    >
      {/* Checkbox */}
      <td className="px-3 py-2 w-8 align-middle">
        {editMode && !isOutletMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(row.id)}
            className="cursor-pointer accent-orange-500"
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
          editMode={editMode && !isOutletMode}
        />
      ))}

      <PriceCell
        basePrice={row.price}
        outletPrice={outletPrice}
        onCommitBase={(val) => onUpdateCell(groupId, row.id, 'price', val)}
        onCommitOutlet={(val) => onUpdateOutletPrice(row.id, val)}
        onResetOutlet={() => onResetOutletPrice(row.id)}
        editMode={editMode}
        isOutletMode={isOutletMode}
      />

      {/* Delete */}
      <td className="px-3 py-2 text-center align-middle w-10">
        {editMode && !isOutletMode && (
          <button
            onClick={() => onDeleteRow(groupId, row.id)}
            title="Archive row"
            className="border-none bg-transparent cursor-pointer text-gray-300 p-0.5 rounded opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}