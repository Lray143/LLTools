import { useState, useRef, useEffect } from 'react'
import { Search, Archive, Plus, ScrollText, ChevronDown, Check } from 'lucide-react'

// ── Shared inline styles ────────────────────────
const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

// ── CustomSelect ────────────────────────
function CustomSelect({ value, onChange, options, minWidth = '148px' }) {
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
                {label}
                {isActive && <Check size={14} color="var(--theme-500)" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function OutletToolbar({
  view, setView,
  search, setSearch,
  statusFilter, setStatusFilter,
  regionFilter, setRegionFilter,
  ownershipFilter, setOwnershipFilter,
  regions,
  total,
  onAdd,
  onArchive,
}) {
  const isOrdersView = view === 'orders'

  const statusOptions = [
    { label: 'All Statuses', value: 'All Statuses' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ]

  const regionOptions = [
    { label: 'All Regions', value: 'All Regions' },
    ...regions.map(r => ({ label: r, value: r }))
  ]

  const ownershipOptions = [
    { label: 'My Outlets', value: 'My Outlets' },
    { label: 'All Outlets', value: 'All Outlets' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '32px', paddingRight: 'calc(32px + 15px)', gap: '16px', flexWrap: 'wrap' }}>
      
      {/* LEFT: view toggle + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        
        {/* Cards / List / Orders segmented toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '3px', gap: '2px',
        }}>
          {[
            { id: 'cards',  label: 'Cards' },
            { id: 'list',   label: 'List'  },
            { id: 'orders', label: 'Orders', icon: <ScrollText size={13} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '5px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: view === id ? 600 : 400,
                background: view === id ? 'var(--theme-500)' : 'transparent',
                color: view === id ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Status filter + Region filter + count — hidden in orders view */}
        {!isOrdersView && (
          <>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
            
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              minWidth="136px"
            />

            <CustomSelect
              value={regionFilter}
              onChange={setRegionFilter}
              options={regionOptions}
              minWidth="152px"
            />

            <CustomSelect
              value={ownershipFilter}
              onChange={setOwnershipFilter}
              options={ownershipOptions}
              minWidth="136px"
            />

            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400, userSelect: 'none' }}>
              {total} outlet{total !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* RIGHT: search + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        


        <button
          type="button"
          onClick={onArchive}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Archive size={14} />
          Archive
        </button>
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: 'none', background: 'var(--theme-500)',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Add Outlet
        </button>
      </div>

    </div>
  )
}