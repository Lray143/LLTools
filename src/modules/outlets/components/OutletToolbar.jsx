import { useState, useEffect, useRef } from 'react'
import { Search, Archive, Plus, ChevronDown, Check } from 'lucide-react'

const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
  fontSize: '13px', fontWeight: 500, color: '#2c2010',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

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
          border: open ? '1px solid #f97316' : '1px solid rgba(0,0,0,0.1)',
          color: open ? '#f97316' : '#2c2010',
          transition: 'border-color 150ms, color 150ms',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: open ? 600 : 500 }}>
          {activeLabel}
        </span>
        <ChevronDown
          size={13}
          color={open ? '#f97316' : '#a09278'}
          style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '200px', background: '#fff', borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.07)',
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
                  color: isActive ? '#f97316' : '#374151',
                  fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9f8f6' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {label}
                {isActive && <Check size={14} color="#f97316" strokeWidth={2.5} />}
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
  total,
  onAdd,
  onArchive,
}) {
  const statusOptions = [
    { label: 'All Statuses', value: 'All Statuses' },
    { label: 'Active',       value: 'Active' },
    { label: 'Inactive',     value: 'Inactive' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', gap: '16px', flexWrap: 'wrap' }}>

      {/* LEFT: view toggle + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

        {/* Cards / List segmented toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '10px', padding: '3px', gap: '2px',
        }}>
          {['cards', 'list'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: view === v ? 600 : 400,
                background: view === v ? '#f97316' : 'transparent',
                color: view === v ? '#fff' : '#6b5c4c',
                border: 'none', cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
                textTransform: 'capitalize',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

        {/* Status filter */}
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          minWidth="136px"
        />

        {/* Count */}
        <span style={{ fontSize: '13px', color: '#a09278', fontWeight: 400, userSelect: 'none' }}>
          {total} {total === 1 ? 'outlet' : 'outlets'}
        </span>
      </div>

      {/* RIGHT: search + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a09278', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search outlets…"
            style={{
              paddingLeft: '2.1rem', paddingRight: '0.75rem',
              height: '34px', borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
              fontSize: '13px', color: '#2c2010', outline: 'none', width: '200px',
            }}
          />
        </div>

        {/* Archive */}
        <button
          onClick={onArchive}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
            color: '#4b3a2a', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Archive size={14} />
          Archive
        </button>

        {/* Add Outlet */}
        <button
          onClick={onAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: 'none', background: '#f97316',
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