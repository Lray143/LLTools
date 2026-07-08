// src/modules/products/components/ProductsToolbar.jsx
// Header matches the app-wide pattern:
//   ROW 1 (border-bottom): Page title LEFT · Search + Bell + User RIGHT
//   ROW 2 (border-bottom): Filters/controls LEFT · Action buttons RIGHT
import { useRef, useState, useEffect } from 'react'
import { FolderPlus, Lock, Unlock, Archive, Store,
         ChevronDown, Check } from 'lucide-react'

// ── Shared tokens ─────────────────────────────────────────────────
const pill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '6px 14px', borderRadius: '8px',
  border: '1px solid var(--border, #e5e7eb)', background: 'var(--surface, #fff)',
  fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #374151)',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

// ── Outlet / Store dropdown ───────────────────────────────────────
function OutletSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const label = value
    ? (options.find(o => o.id === value)?.name ?? 'Outlet')
    : 'Default Prices'
  const active = !!value

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...pill,
          borderColor: active ? 'var(--theme-500)' : '#e5e7eb',
          color: active ? 'var(--theme-500)' : 'var(--text-primary)',
          gap: '8px', paddingRight: '10px',
          justifyContent: 'space-between', minWidth: '150px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Store size={13} color={active ? 'var(--theme-500)' : 'var(--text-secondary)'} />
          {label}
        </span>
        <ChevronDown size={12} color="var(--text-secondary)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '175px', background: 'var(--surface, #fff)', borderRadius: '12px',
          border: '1px solid var(--border, #f3f4f6)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 999, padding: '5px',
        }}>
          {[{ id: null, name: 'Default Prices' }, ...options].map(opt => {
            const sel = opt.id === null ? !value : opt.id === value
            return (
              <button key={opt.id ?? '_def'}
                onClick={() => { onChange(opt.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                  background: sel ? 'var(--hover-bg, #f9fafb)' : 'transparent',
                  color: sel ? 'var(--theme-500)' : 'var(--text-primary, #374151)', fontWeight: sel ? 600 : 400,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--hover-bg, #f9fafb)' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.name}
                {sel && <Check size={12} color="var(--theme-500)" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main toolbar ──────────────────────────────────────────────────
export default function ProductsToolbar({
  search, onSearchChange,
  onAddGroup, onOpenArchive,
  totalItems, totalGroups,
  editMode, onToggleEditMode,
  outlets, selectedOutletId, onSelectOutlet,
}) {
  return (
    <div style={{ background: 'transparent', flexShrink: 0, position: 'relative' }}>

      {/* ══ Controls · Action buttons ════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '52px',
        gap: '12px',
      }}>
        {/* LEFT — outlet selector + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <OutletSelect
            value={selectedOutletId}
            onChange={onSelectOutlet}
            options={outlets}
          />



          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} across {totalGroups} group{totalGroups !== 1 ? 's' : ''}
          </span>

          {/* Outlet banner inline */}
          {selectedOutletId && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '12px', color: 'var(--theme-600)',
              background: 'var(--surface-hover)', border: '1px solid var(--theme-200)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              <Store size={11} color="var(--theme-500)" />
              {outlets.find(o => o.id === selectedOutletId)?.name} prices
              {editMode && ' · click price to override'}
            </span>
          )}
        </div>

        {/* RIGHT — Archive · Lock/Unlock · Add Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Archive */}
          <button onClick={onOpenArchive}
            style={{ ...pill }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg, #f9fafb)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface, #fff)'}
          >
            <Archive size={14} color="var(--text-secondary)" />
            Archive
          </button>

          {/* Edit-mode toggle */}
          <button onClick={onToggleEditMode}
            style={{
              ...pill,
              background: editMode ? '#f0fdf4' : 'var(--surface, #f9fafb)',
              borderColor: editMode ? '#86efac' : 'var(--border, #e5e7eb)',
              color: editMode ? '#16a34a' : 'var(--text-primary, #374151)',
              fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {editMode ? <Unlock size={14} /> : <Lock size={14} />}
            {editMode ? 'Editing' : 'Edit'}
          </button>

          {/* Add Group — only edit + default mode */}
          {editMode && !selectedOutletId && (
            <button onClick={onAddGroup}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 16px', borderRadius: '8px', border: 'none',
                background: 'var(--theme-500)', color: '#fff',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-600)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--theme-500)'}
            >
              <FolderPlus size={14} />
              Add Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}