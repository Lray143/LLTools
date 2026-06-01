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
    <tr>
      <td
        colSpan={8}
        style={{
          background: '#fff8f2',
          borderTop: '1px solid #fed7aa',
          borderBottom: '1px solid #fed7aa',
          padding: '8px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Collapse toggle */}
          <button
            onClick={() => onToggleCollapse(group.id)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '22px', height: '22px', borderRadius: '6px',
              border: 'none', background: 'transparent',
              color: '#f97316', cursor: 'pointer',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fed7aa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronRight size={15} strokeWidth={2.5} /> : <ChevronDown size={15} strokeWidth={2.5} />}
          </button>

          {/* Group name */}
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <input
                ref={inputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRename}
                style={{
                  fontSize: '12px', fontWeight: 700, color: '#c2410c',
                  background: '#fff', border: '1px solid #f97316',
                  borderRadius: '6px', padding: '3px 8px',
                  outline: 'none', width: '200px',
                  letterSpacing: '0.05em',
                }}
              />
              <button onClick={commitRename} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#16a34a' }}>
                <Check size={13} />
              </button>
              <button onClick={cancelRename} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <span style={{
              fontSize: '12px', fontWeight: 700, color: '#c2410c',
              letterSpacing: '0.08em', flex: 1,
            }}>
              {group.name}
              <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: '#fb923c' }}>
                ({group.rows.length} item{group.rows.length !== 1 ? 's' : ''})
              </span>
            </span>
          )}

          {/* Action buttons — edit mode only */}
          {editMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '7px',
                    border: 'none', background: 'transparent',
                    color: '#f97316', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fed7aa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Pencil size={11} /> Rename
                </button>
              )}
              <button
                onClick={() => onAddRow(group.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '7px',
                  border: 'none', background: 'transparent',
                  color: '#f97316', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fed7aa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={11} /> Add Row
              </button>
              <button
                onClick={() => onDeleteGroup(group.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '7px',
                  border: 'none', background: 'transparent',
                  color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}