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
  border: '1px solid #e5e7eb', background: '#fff',
  fontSize: '13px', fontWeight: 500, color: '#374151',
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
          borderColor: active ? '#f97316' : '#e5e7eb',
          color: active ? '#f97316' : '#374151',
          gap: '8px', paddingRight: '10px',
          justifyContent: 'space-between', minWidth: '150px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Store size={13} color={active ? '#f97316' : '#9ca3af'} />
          {label}
        </span>
        <ChevronDown size={12} color="#9ca3af"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '175px', background: '#fff', borderRadius: '12px',
          border: '1px solid #f3f4f6',
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
                  background: sel ? '#fff8f2' : 'transparent',
                  color: sel ? '#f97316' : '#374151', fontWeight: sel ? 600 : 400,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.name}
                {sel && <Check size={12} color="#f97316" strokeWidth={2.5} />}
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
    <div style={{ background: '#fff', flexShrink: 0, scrollbarGutter: 'stable', overflowY: 'auto' }}>

      {/* ══ Controls · Action buttons ════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '52px',
        borderBottom: '1px solid #f3f4f6',
        gap: '12px',
      }}>
        {/* LEFT — outlet selector + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <OutletSelect
            value={selectedOutletId}
            onChange={onSelectOutlet}
            options={outlets}
          />

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />

          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} across {totalGroups} group{totalGroups !== 1 ? 's' : ''}
          </span>

          {/* Outlet banner inline */}
          {selectedOutletId && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '12px', color: '#ea580c',
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              <Store size={11} color="#f97316" />
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
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <Archive size={14} color="#6b7280" />
            Archive
          </button>

          {/* Edit-mode toggle */}
          <button onClick={onToggleEditMode}
            style={{
              ...pill,
              background: editMode ? '#f0fdf4' : '#f9fafb',
              borderColor: editMode ? '#86efac' : '#e5e7eb',
              color: editMode ? '#16a34a' : '#374151',
              fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {editMode ? <Unlock size={14} /> : <Lock size={14} />}
            {editMode ? 'Editing' : 'Locked'}
          </button>

          {/* Add Group — only edit + default mode */}
          {editMode && !selectedOutletId && (
            <button onClick={onAddGroup}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 16px', borderRadius: '8px', border: 'none',
                background: '#f97316', color: '#fff',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ea580c'}
              onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
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