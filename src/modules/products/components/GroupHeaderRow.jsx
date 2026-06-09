// src/modules/products/components/GroupHeaderRow.jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function GroupHeaderRow({
  group, collapsed,
  onToggleCollapse, onRenameGroup, onAddRow, onDeleteGroup,
  editMode,
}) {
  const [editing,   setEditing]   = useState(false)
  const [draftName, setDraftName] = useState(group.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editMode && editing) cancelRename()
  }, [editMode])

  const commitRename = () => {
    const trimmed = draftName.trim()
    if (trimmed) onRenameGroup(group.id, trimmed)
    else setDraftName(group.name)
    setEditing(false)
  }

  const cancelRename = () => {
    setDraftName(group.name)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  commitRename()
    if (e.key === 'Escape') cancelRename()
  }

  return (
    <tr className="border-y" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-bg) 10%, var(--surface))', borderColor: 'color-mix(in srgb, var(--accent-bg) 20%, var(--border))' }}>
      <td colSpan={8} className="px-3 py-2.5">
        <div className="flex items-center gap-2">

          {/* Collapse toggle */}
          <button
            onClick={() => onToggleCollapse(group.id)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="transition-colors"
            style={{ color: 'var(--accent-bg)', opacity: 0.8 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Group name */}
          {editing ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRename}
                className="text-sm font-bold bg-white rounded px-2 py-0.5 outline-none w-48 tracking-wider"
                style={{ color: 'var(--accent-bg)', border: '1px solid var(--accent-bg)' }}
              />
              <button onClick={commitRename} className="border-none bg-transparent cursor-pointer text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={cancelRename} className="border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold tracking-wider flex-1 flex items-center" style={{ color: 'var(--accent-bg)' }}>
              {group.name}
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--accent-bg)', opacity: 0.7 }}>
                ({group.rows.length} item{group.rows.length !== 1 ? 's' : ''})
              </span>
            </span>
          )}

          {/* Action buttons — edit mode only */}
          {editMode && (
            <div className="flex items-center gap-1 ml-auto">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-none bg-transparent text-xs font-medium cursor-pointer transition-colors"
                  style={{ color: 'var(--accent-bg)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-bg) 15%, transparent)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Pencil size={12} /> Rename
                </button>
              )}
              <button
                onClick={() => onAddRow(group.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-none bg-transparent text-xs font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--accent-bg)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-bg) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus size={12} /> Add Row
              </button>
              <button
                onClick={() => onDeleteGroup(group.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-none bg-transparent text-red-500 text-xs font-medium cursor-pointer transition-colors hover:bg-red-100"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}