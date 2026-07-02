import { useState, useEffect, useCallback } from 'react'
import { History, X, Plus, Pencil, Archive, Trash2, Clock, User, Hash, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { ACTIVITY_ACTION_META, ACTIVITY_MODULE_LABELS, parseActivityDetails } from '../../lib/activityLog'

const ACTION_ICONS = {
  add:              Plus,
  edit:             Pencil,
  archive:          Archive,
  restore:          RotateCcw,
  permanent_delete: Trash2,
}

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function LineItemList({ items }) {
  const [expanded, setExpanded] = useState(false)
  const visibleItems = expanded ? items : items.slice(0, 4)

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {visibleItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-[12px] text-gray-700">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] text-gray-600">{index + 1}</span>
            <span className="truncate">{item}</span>
          </div>
        ))}
      </div>
      {items.length > visibleItems.length && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-1"
          style={{ color: 'var(--theme-500)', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide' : `Show ${items.length - visibleItems.length} more`}
        </button>
      )}
    </div>
  )
}

function renderSnapshotValue(label, value) {
  if (value == null || value === '') return '—'
  if (label === 'Line items') {
    const items = String(value)
      .split(', ')
      .map((v) => v.trim())
      .filter(Boolean)
    if (items.length === 0) return '—'
    if (items.length === 1) return <span style={{ whiteSpace: 'normal' }}>{items[0]}</span>
    return <LineItemList items={items} />
  }
  return <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
}

function SnapshotTable({ title, data, variant = 'default' }) {
  if (!data || Object.keys(data).length === 0) return null
  const borderColor = variant === 'removed' ? '#fecaca' : 'var(--border)'
  const bg = variant === 'removed'
    ? 'color-mix(in srgb, #dc2626 6%, var(--surface))'
    : variant === 'added'
      ? 'color-mix(in srgb, #16a34a 6%, var(--surface))'
      : 'var(--page-bg-alt)'

  return (
    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: bg }}>
      {title && (
        <p className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 m-0" style={{ color: 'var(--text-secondary)', borderBottom: `1px solid ${borderColor}` }}>
          {title}
        </p>
      )}
      <table className="w-full text-xs">
        <tbody>
          {Object.entries(data).map(([label, value]) => (
            <tr key={label} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-2.5 py-1.5 font-medium align-top w-[38%]" style={{ color: 'var(--text-secondary)' }}>{label}</td>
              <td className="px-2.5 py-1.5 align-top" style={{ color: 'var(--text-primary)' }}>{renderSnapshotValue(label, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChangesTable({ changes }) {
  if (!changes?.length) return null
  return (
    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--page-bg-alt)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 m-0" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
        Changes
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="px-2 py-1.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Field</th>
            <th className="px-2 py-1.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Before</th>
            <th className="px-2 py-1.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>After</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c, i) => (
            <tr key={`${c.field}-${i}`} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-2 py-1.5 font-medium align-top" style={{ color: 'var(--text-primary)' }}>{c.label || c.field}</td>
              <td className="px-2 py-1.5 align-top break-words" style={{ color: '#dc2626' }}>{c.before ?? '—'}</td>
              <td className="px-2 py-1.5 align-top break-words" style={{ color: '#16a34a' }}>{c.after ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ACTION_BADGE_STYLES = {
  add:              { color: '#15803d', background: '#dcfce7', border: '#86efac' },
  edit:             { color: '#c2410c', background: '#fff7ed', border: '#fdba74' },
  archive:          { color: '#92400e', background: '#fef3c7', border: '#fcd34d' },
  restore:          { color: '#0369a1', background: '#e0f2fe', border: '#7dd3fc' },
  permanent_delete: { color: '#b91c1c', background: '#fee2e2', border: '#fca5a5' },
}

function ActionBadge({ action, details }) {
  // For older DB records that have null action, try to infer it from the stored details
  let resolvedAction = action
  if (!resolvedAction && details) {
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details
      if (parsed?.removedSnapshot) resolvedAction = 'archive'
      else if (parsed?.snapshot)    resolvedAction = 'add'
      else if (parsed?.changes)     resolvedAction = 'edit'
    } catch { /* ignore parse errors */ }
  }

  if (!resolvedAction) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: '#6b7280', background: '#f3f4f6', border: '1px solid #d1d5db' }}
      >
        —
      </span>
    )
  }

  const style = ACTION_BADGE_STYLES[resolvedAction]
  if (style) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: style.color, background: style.background, border: `1px solid ${style.border}` }}
      >
        {ACTIVITY_ACTION_META[resolvedAction]?.label ?? resolvedAction}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
      style={{ color: '#374151', background: '#f3f4f6', border: '1px solid #d1d5db' }}
    >
      {resolvedAction}
    </span>
  )
}

function ActivityDetails({ entry }) {
  const parsed = parseActivityDetails(entry.details)
  const [showDetails, setShowDetails] = useState(false)
  if (!parsed) return null

  const ids = []
  if (parsed.recordType) ids.push(parsed.recordType)
  if (parsed.employeeNo) ids.push(`Emp # ${parsed.employeeNo}`)
  if (parsed.recordId && parsed.recordId !== parsed.employeeNo) ids.push(`ID ${parsed.recordId}`)
  if (entry.entityId && !ids.some(s => s.includes(entry.entityId))) ids.push(`ID ${entry.entityId}`)

  const detailCount = (
    (parsed.changes?.length || 0) +
    (parsed.snapshot ? Object.keys(parsed.snapshot).length : 0) +
    (parsed.removedSnapshot ? Object.keys(parsed.removedSnapshot).length : 0)
  )

  return (
    <div className="mt-2">
      {ids.length > 0 && (
        <p className="text-[11px] m-0 flex items-center gap-1 flex-wrap" style={{ color: 'var(--text-secondary)' }}>
          <Hash size={10} />
          {ids.join(' · ')}
        </p>
      )}
      {parsed.table && (
        <p className="text-[11px] m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
          Table: <span style={{ color: 'var(--text-primary)' }}>{parsed.table}</span>
        </p>
      )}
      {parsed.note && (
        <p className="text-xs m-0 mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {parsed.note}
        </p>
      )}

      {detailCount > 0 && (
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="mt-2 text-[11px] font-semibold rounded-full px-2 py-1"
          style={{ color: 'var(--theme-500)', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
        >
          {showDetails ? 'Hide details' : `View details (${detailCount})`}
        </button>
      )}

      {showDetails && (
        <>
          <ChangesTable changes={parsed.changes} />
          <SnapshotTable title="Added values" data={parsed.snapshot} variant="added" />
          <SnapshotTable title="Removed record" data={parsed.removedSnapshot} variant="removed" />
        </>
      )}
    </div>
  )
}

function ActivityLogDrawer({ module, refreshKey, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const rows = await window.electronAPI.getModuleActivityLogs(module, 200)
      setLogs(rows ?? [])
    } catch (err) {
      console.error('Failed to load activity logs', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [module])

  useEffect(() => { load() }, [load, refreshKey])

  const moduleLabel = ACTIVITY_MODULE_LABELS[module] ?? module

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{
          width: 'min(480px, 100vw)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--theme-500) 12%, var(--surface))' }}
            >
              <History size={17} style={{ color: 'var(--theme-500)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold m-0 truncate" style={{ color: 'var(--text-primary)' }}>
                Activity History
              </h2>
              <p className="text-xs m-0 mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                {moduleLabel} · field-level changes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border-none cursor-pointer rounded-lg p-2 transition-colors"
            style={{ background: 'transparent', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading history…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <History size={32} style={{ color: 'var(--text-secondary)', opacity: 0.35 }} />
              <p className="text-sm font-medium m-0" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
              <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
                Adds, edits, archives, and deletions with before/after values appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(entry => {
                const meta = ACTIVITY_ACTION_META[entry.action] ?? { label: entry.action, color: 'var(--text-secondary)' }
                const Icon = ACTION_ICONS[entry.action] ?? Clock
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'var(--page-bg-alt)' }}
                      >
                        <Icon size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ActionBadge action={entry.action} details={entry.details} />
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Clock size={10} />
                            {formatWhen(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold m-0 mt-1.5" style={{ color: 'var(--text-primary)' }}>
                          {entry.entityLabel}
                        </p>
                        <ActivityDetails entry={entry} />
                        <p className="text-xs m-0 mt-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <User size={11} />
                          {entry.userName}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function ModuleActivityLog({ module, refreshKey = 0 }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Activity history"
        className="inline-flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer"
        style={{
          height: '34px', padding: '0 12px',
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-500)'; e.currentTarget.style.color = 'var(--theme-500)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <History size={14} />
        History
      </button>
      {open && (
        <ActivityLogDrawer
          module={module}
          refreshKey={refreshKey}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
