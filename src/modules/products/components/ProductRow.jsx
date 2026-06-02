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
  fontSize: '12px', color: '#4b3a2a', padding: '9px 12px',
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
      <td style={{ ...cellBase, padding: '6px 8px' }}>
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%', textAlign,
            padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
            border: '1px solid #f97316', outline: 'none',
            background: '#fff8f2', color: '#2c2010',
          }}
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      title={editMode ? 'Click to edit' : undefined}
      style={{
        ...cellBase,
        textAlign,
        cursor: editMode ? 'pointer' : 'default',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { if (editMode) e.currentTarget.style.background = '#fff8f2' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ transition: 'color 100ms' }}>
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
      <td style={{ ...cellBase, padding: '6px 8px', textAlign: 'right' }}>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%', textAlign: 'right',
            padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
            border: '1px solid #f97316', outline: 'none',
            background: '#fff8f2', color: '#2c2010',
          }}
        />
      </td>
    )
  }

  return (
    <td
      onClick={startEdit}
      style={{
        ...cellBase,
        textAlign: 'right',
        cursor: editMode ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { if (editMode) e.currentTarget.style.background = '#fff8f2' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{
        color: isOutletMode && hasOverride ? '#f97316' : '#4b3a2a',
        fontWeight: isOutletMode && hasOverride ? 600 : 400,
      }}>
        {formatted}
      </span>
      {/* Reset button — outlet override hover */}
      {isOutletMode && hasOverride && editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onResetOutlet() }}
          title="Reset to default price"
          style={{
            position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#9ca3af', padding: '2px', borderRadius: '4px',
            opacity: 0, transition: 'opacity 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = 1 }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
          className="price-reset-btn"
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
  const rowBg = selected
    ? '#fff8f2'
    : isEven ? '#fff' : '#faf9f6'

  return (
    <tr
      style={{
        background: rowBg,
        borderBottom: '1px solid #f0ebe3',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => {
        if (!selected && !editMode) return
        // reveal the reset button on hover
        const resetBtn = e.currentTarget.querySelector('.price-reset-btn')
        if (resetBtn) resetBtn.style.opacity = '1'
      }}
      onMouseLeave={e => {
        const resetBtn = e.currentTarget.querySelector('.price-reset-btn')
        if (resetBtn) resetBtn.style.opacity = '0'
      }}
    >
      {/* Checkbox */}
      <td style={{ padding: '9px 12px', width: '32px', verticalAlign: 'middle' }}>
        {editMode && !isOutletMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(row.id)}
            style={{ cursor: 'pointer', accentColor: '#f97316' }}
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
      <td style={{ padding: '9px 12px', textAlign: 'center', verticalAlign: 'middle', width: '40px' }}>
        {editMode && !isOutletMode && (
          <button
            onClick={() => onDeleteRow(groupId, row.id)}
            title="Archive row"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: '#d1cbbf', padding: '2px', borderRadius: '4px',
              opacity: 0, transition: 'opacity 150ms, color 150ms',
            }}
            className="row-delete-btn"
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#d1cbbf' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}