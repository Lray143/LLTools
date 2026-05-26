// src/modules/products/components/ProductRow.jsx
import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

const FIELDS = [
  { key: 'caseBarcode', label: 'Case Barcode',    type: 'text',   align: 'left'   },
  { key: 'itemBarcode', label: 'Item Barcode',     type: 'text',   align: 'left'   },
  { key: 'description', label: 'Item Description', type: 'text',   align: 'left'   },
  { key: 'qty',         label: 'QTY / Case',       type: 'number', align: 'center' },
  { key: 'size',        label: 'Item Size',        type: 'text',   align: 'center' },
  { key: 'price',       label: 'Price / Piece',    type: 'number', align: 'right'  },
]

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

export default function ProductRow({
  row, rowIndex, groupId,
  onUpdateCell, onDeleteRow,
  editMode, selected, onToggleSelect,
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
        {editMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(row.id)}
            className="rounded border-gray-300 text-orange-500
                       focus:ring-orange-400 cursor-pointer"
          />
        )}
      </td>

      {FIELDS.map((field) => (
        <EditableCell
          key={field.key}
          value={row[field.key]}
          type={field.type}
          align={field.align}
          onCommit={(val) => onUpdateCell(groupId, row.id, field.key, val)}
          editMode={editMode}
        />
      ))}

      {/* Per-row delete */}
      <td className="px-3 py-2 text-center">
        {editMode && (
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