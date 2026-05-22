// ─────────────────────────────────────────────────────────────
// BiometricFilterBar.jsx
// ─────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react'
import { Upload, Download, ChevronDown, ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react'

const MODES = ['Daily', 'Monthly', 'Yearly']

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function formatDate(dateObj) {
  if (!dateObj) return ''
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}
function formatDow(dateObj) {
  return dateObj.toLocaleDateString('en-US', { weekday: 'short' })
}

const navBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
  color: '#4b3a2a', cursor: 'pointer', flexShrink: 0,
}

const displayPill = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 12px', borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
  fontSize: '13px', fontWeight: 500, color: '#2c2010',
  whiteSpace: 'nowrap', cursor: 'pointer',
}

// ── Custom dropdown component ─────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...displayPill,
          paddingRight: '10px',
          gap: '8px',
          minWidth: '148px',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{value}</span>
        <ChevronDown
          size={13}
          color="#a09278"
          style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: '180px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          zIndex: 999,
          padding: '6px',
          overflow: 'hidden',
        }}>
          {options.map(opt => {
            const isActive = opt === value
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#fff8f2' : 'transparent',
                  color: isActive ? '#f97316' : '#2c2010',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9f8f6' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {opt}
                {isActive && <Check size={13} color="#f97316" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main filter bar ───────────────────────────────────────────
export function BiometricFilterBar({
  viewMode, setViewMode,
  selectedDate, setSelectedDate,
  selectedMonth, setSelectedMonth,
  selectedYear,  setSelectedYear,
  selectedYearOnly, setSelectedYearOnly,
  selectedDept, setSelectedDept,
  departments,
  onImportClick, onExport,
  availableYears,
}) {
  const hiddenDateRef = useRef(null)

  function stepDay(delta) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  function stepMonth(delta) {
    let m = selectedMonth + delta
    let y = selectedYear
    if (m > 12) { m = 1;  y++ }
    if (m < 1)  { m = 12; y-- }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  // Year options as strings for CustomSelect
  const yearOptions = availableYears.map(y => `All of ${y}`)
  const yearValue   = `All of ${selectedYearOnly}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

        {/* Segmented mode toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '10px', padding: '3px', gap: '2px',
        }}>
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: viewMode === mode ? 600 : 400,
                background: viewMode === mode ? '#f97316' : 'transparent',
                color: viewMode === mode ? '#fff' : '#6b5c4c',
                border: 'none', cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
                whiteSpace: 'nowrap', lineHeight: '1.4',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

        {/* DAILY */}
        {viewMode === 'Daily' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button style={navBtn} onClick={() => stepDay(-1)}>
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <button
              style={displayPill}
              onClick={() => hiddenDateRef.current?.showPicker?.() || hiddenDateRef.current?.click()}
            >
              <Calendar size={14} color="#f97316" />
              <span style={{ color: '#a09278', fontSize: '11px', fontWeight: 400, marginRight: '2px' }}>
                {formatDow(selectedDate)}
              </span>
              {formatDate(selectedDate)}
            </button>
            <input
              type="date" ref={hiddenDateRef}
              value={selectedDate instanceof Date && !isNaN(selectedDate)
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
                : ''}
              onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            />
            <button style={navBtn} onClick={() => stepDay(1)}>
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* MONTHLY */}
        {viewMode === 'Monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button style={navBtn} onClick={() => stepMonth(-1)}>
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <div style={displayPill}>
              <Calendar size={14} color="#f97316" />
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </div>
            <button style={navBtn} onClick={() => stepMonth(1)}>
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* YEARLY */}
        {viewMode === 'Yearly' && (
          <CustomSelect
            value={yearValue}
            onChange={val => setSelectedYearOnly(Number(val.replace('All of ', '')))}
            options={yearOptions}
          />
        )}

        {/* Department */}
        <CustomSelect
          value={selectedDept}
          onChange={setSelectedDept}
          options={departments}
        />

      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onImportClick}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
            color: '#4b3a2a', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Upload size={14} />
          Import
        </button>
        <button
          onClick={onExport}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px',
            border: 'none', background: '#f97316',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

    </div>
  )
}