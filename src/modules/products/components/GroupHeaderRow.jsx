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
    <tr className="bg-orange-50/80 border-y border-orange-100">
      <td colSpan={8} className="px-4 py-2.5">
        <div className="flex items-center gap-2">

          {/* Collapse toggle */}
          <button
            onClick={() => onToggleCollapse(group.id)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="text-orange-400 hover:text-orange-600 transition-colors"
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
                className="text-sm font-bold text-orange-700 bg-white border border-orange-400 rounded px-2 py-0.5 outline-none w-48 tracking-wider"
              />
              <button onClick={commitRename} className="border-none bg-transparent cursor-pointer text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={cancelRename} className="border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold tracking-wider text-orange-700 flex-1 flex items-center">
              {group.name}
              <span className="ml-2 text-xs font-normal text-orange-400">
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-none bg-transparent text-orange-500 text-xs font-medium cursor-pointer transition-colors hover:bg-orange-200"
                >
                  <Pencil size={12} /> Rename
                </button>
              )}
              <button
                onClick={() => onAddRow(group.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-none bg-transparent text-orange-500 text-xs font-medium cursor-pointer transition-colors hover:bg-orange-200"
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