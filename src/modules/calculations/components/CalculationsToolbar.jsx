// src/modules/calculations/components/CalculationsToolbar.jsx
import { useState, useRef, useEffect } from 'react'
import { User, Store, RotateCcw, BarChart2, Table2, ChevronDown, Check, Plus, Calculator } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'
import ModuleActivityLog from '../../../components/ui/ModuleActivityLog'
import SearchBar from '../../../components/ui/SearchBar'

// ── Shared inline styles (matches Employees / Outlets) ──────────────
const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

// ── CustomSelect (same pattern as Outlets / Employees) ──────────────
function CustomSelect({ value, onChange, options, minWidth = '148px', onAdd }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeLabel = options.find(o => (o.value ?? o) === value)?.label ?? value

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...displayPill,
          paddingRight: '10px',
          gap: '8px',
          minWidth,
          justifyContent: 'space-between',
          border: open ? '1px solid var(--theme-500)' : '1px solid rgba(0,0,0,0.1)',
          color: open ? 'var(--theme-500)' : 'var(--text-primary)',
          transition: 'border-color 150ms, color 150ms',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? 600 : 500 }}>
          {activeLabel}
        </span>
        <ChevronDown
          size={13}
          color={open ? 'var(--theme-500)' : 'var(--text-secondary)'}
          style={{ transition: 'transform 150ms, color 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '200px', background: 'var(--surface)', borderRadius: '14px',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 999, padding: '8px', overflow: 'hidden',
        }}>
          {options.map(opt => {
            const isActive = opt.value === value || opt === value
            const label    = opt.label ?? opt
            const val      = opt.value ?? opt
            return (
              <button
                key={val}
                onClick={() => { onChange(val); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--theme-500)' : 'var(--text-primary)',
                  fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>{label}</span>
                  {opt.subLabel && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      {opt.subLabel}
                    </span>
                  )}
                </div>
                {isActive && <Check size={14} color="var(--theme-500)" strokeWidth={2.5} />}
              </button>
            )
          })}

          {/* Add outlet button */}
          {onAdd && (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button
                onClick={() => { setOpen(false); onAdd() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-500)',
                  fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Plus size={13} />
                Add Outlet
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function CalculationsToolbar({
  mode,
  onSetMode,
  search,
  onSearchChange,
  outlets,
  selectedOutletId,
  onSelectOutlet,
  onAddOutlet,
  totalItems,
  totalGroups,
  hasQty,
  onClearAll,
  currentUser,
  refreshKey,
  onNavigate,
}) {
  const isSummary = mode === 'summary'

  // Build outlet options for the CustomSelect
  const outletOptions = [
    { label: 'Default Prices', value: '', subLabel: 'Standard base prices' },
    ...outlets.map(o => {
      let subLabel = 'No discounts'
      if (o.discounts && o.discounts.length > 0) {
        subLabel = o.discounts.map(d => `${d.name}: ${d.value}%`).join(', ')
      }
      return { label: o.name, value: o.id, subLabel }
    }),
  ]

  return (
    <>
      {/* ── TOP HEADER (matches Outlets / Employees) ── */}
      <div className="flex items-center justify-between pl-8 pr-[calc(2rem+15px)] py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calculator size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Calculations</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Product order &amp; pricing calculator</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search — always visible */}
          <div style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search products…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          <ModuleActivityLog module="calculations" refreshKey={refreshKey} />
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── FILTER / TOOLBAR BAR (matches Outlets / Employees) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '32px', paddingRight: 'calc(32px + 15px)', gap: '16px', flexWrap: 'wrap' }}>

        {/* LEFT: view toggle + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* Table / Monthly Summary segmented toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '3px', gap: '2px',
          }}>
            {[
              { id: 'table',   label: 'Table',           icon: <Table2 size={13} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> },
              { id: 'summary', label: 'Monthly Summary', icon: <BarChart2 size={13} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => onSetMode(id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '5px 16px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: mode === id ? 600 : 400,
                  background: mode === id ? 'var(--theme-500)' : 'transparent',
                  color: mode === id ? '#fff' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Divider + table-mode filters */}
          {!isSummary && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

              {/* Outlet selector */}
              <CustomSelect
                value={selectedOutletId ?? ''}
                onChange={(val) => onSelectOutlet(val || null)}
                options={outletOptions}
                minWidth="160px"
                onAdd={onAddOutlet}
              />

              {/* Count */}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400, userSelect: 'none' }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} · {totalGroups} group{totalGroups !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {/* RIGHT: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Clear all — table mode, has qty */}
          {!isSummary && hasQty && (
            <button
              onClick={onClearAll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              Clear All
            </button>
          )}
        </div>

      </div>

      {/* Outlet context hint */}
      {!isSummary && selectedOutletId && (
        <div className="mx-8 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          color: '#f97316'
        }}>
          <Store size={13} />
          <span>
            Using <strong style={{ color: '#ea580c', textShadow: '0 0 1px rgba(255,255,255,0.1)' }}>{outlets.find((o) => o.id === selectedOutletId)?.name ?? 'outlet'}</strong> prices.
            Orange prices are outlet-specific overrides.
          </span>
        </div>
      )}
    </>
  )
}