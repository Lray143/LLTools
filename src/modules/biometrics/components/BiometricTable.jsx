import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { STATUS_STYLES } from '../biometricConstants'

const Dash = () => <span style={{ color: 'var(--text-secondary)' }}>-</span>

// Parse "7:30 AM" / "6:00 PM" → total minutes from midnight
function parseTime(t) {
  if (!t) return null
  const [time, meridiem] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return h * 60 + m
}

// Parse "HH:MM" (24-hr) → total minutes from midnight
function parseHHMM(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// ACTUAL hours: raw tap-in to tap-out (deducts actual lunch taps, else scheduled lunch overlap)
function calcActualHours(r) {
  const inMin  = parseTime(r.shiftIn)
  const outMin = parseTime(r.shiftOut)
  if (inMin == null || outMin == null) return null

  let diff = outMin - inMin

  const lunchOutMin = parseTime(r.lunchOut)
  const lunchInMin  = parseTime(r.lunchIn)
  if (lunchOutMin != null && lunchInMin != null) {
    // Actual lunch taps recorded — deduct exactly that
    diff -= (lunchInMin - lunchOutMin)
  } else {
    // No lunch taps: deduct the overlap of the scheduled lunch window
    // with the actual work period [inMin, outMin]
    const lsMin = parseHHMM(r.lunchStart) ?? (12 * 60)
    const leMin = parseHHMM(r.lunchEnd)   ?? (13 * 60)
    const overlapStart = Math.max(inMin,  lsMin)
    const overlapEnd   = Math.min(outMin, leMin)
    const overlap      = Math.max(0, overlapEnd - overlapStart)
    diff -= overlap
  }

  if (diff <= 0) return null
  const h  = Math.floor(diff / 60)
  const mn = diff % 60
  return mn > 0 ? `${h}h ${mn}m` : `${h}h`
}

// SCHEDULED hours: clamp tap-in to schedStart, tap-out to schedEnd
// Employee who arrives early → starts counting at scheduled start
// Employee who leaves late   → stops counting at scheduled end
function calcSchedHours(r) {
  const tapIn  = parseTime(r.shiftIn)
  const tapOut = parseTime(r.shiftOut)
  if (tapIn == null || tapOut == null) return null

  const schedIn  = parseHHMM(r.schedStart)
  const schedOut = parseHHMM(r.schedEnd)
  if (schedIn == null || schedOut == null) return calcActualHours(r)

  // Clamp: don't count time before schedule start or after schedule end
  const effectiveIn  = Math.max(tapIn,  schedIn)
  const effectiveOut = Math.min(tapOut, schedOut)

  if (effectiveOut <= effectiveIn) return '0h'

  let diff = effectiveOut - effectiveIn

  // Lunch deduction: overlap of scheduled lunch window with the clamped work window
  const lunchOutMin = parseTime(r.lunchOut)
  const lunchInMin  = parseTime(r.lunchIn)
  if (lunchOutMin != null && lunchInMin != null) {
    // Actual lunch taps recorded
    diff -= (lunchInMin - lunchOutMin)
  } else {
    // Deduct the overlap of [lunchStart, lunchEnd] with [effectiveIn, effectiveOut]
    const lsMin = parseHHMM(r.lunchStart) ?? (12 * 60)
    const leMin = parseHHMM(r.lunchEnd)   ?? (13 * 60)
    const overlapStart = Math.max(effectiveIn,  lsMin)
    const overlapEnd   = Math.min(effectiveOut, leMin)
    const overlap      = Math.max(0, overlapEnd - overlapStart)
    diff -= overlap
  }

  if (diff <= 0) return '0h'
  const h  = Math.floor(diff / 60)
  const mn = diff % 60
  return mn > 0 ? `${h}h ${mn}m` : `${h}h`
}

// Converts "8h 59m" or "9h" → total minutes for numeric sort
function hoursLabelToMinutes(label) {
  if (!label) return -1
  const hMatch = label.match(/(\d+)h/)
  const mMatch = label.match(/(\d+)m/)
  const h = hMatch ? parseInt(hMatch[1], 10) : 0
  const m = mMatch ? parseInt(mMatch[1], 10) : 0
  return h * 60 + m
}

function ExtraTapsTooltip({ extraTaps }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ x: 0, y: 0 })

  if (!extraTaps || extraTaps.length === 0) return null

  return (
    <>
      <span
        onMouseEnter={e => { setPos({ x: e.clientX, y: e.clientY }); setVisible(true) }}
        onMouseMove={e  => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setVisible(false)}
        style={{
          display        : 'inline-flex',
          alignItems     : 'center',
          justifyContent : 'center',
          width          : '18px',
          height         : '18px',
          borderRadius   : '50%',
          background     : 'var(--theme-500)',
          color        : 'var(--accent-text)',
          fontSize       : '9px',
          fontWeight     : 700,
          marginLeft     : '6px',
          flexShrink     : 0,
          cursor         : 'default',
          userSelect     : 'none',
          verticalAlign  : 'middle',
        }}
      >
        +{extraTaps.length}
      </span>

      {visible && (
        <div style={{
          position     : 'fixed',
          top          : pos.y - 12,
          left         : pos.x + 14,
          transform    : 'translateY(-100%)',
          zIndex       : 99999,
          background   : 'var(--page-bg-alt)',
          border       : '1px solid var(--border)',
          color        : 'var(--text-primary)',
          borderRadius : '10px',
          padding      : '10px 14px',
          minWidth     : '200px',
          boxShadow    : '0 8px 28px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontSize     : '10px',
            color        : 'var(--text-secondary)',
            fontWeight   : 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom : '8px',
          }}>
            Additional taps detected
          </p>
          {extraTaps.map((t, i) => (
            <div key={i} style={{
              display      : 'flex',
              alignItems   : 'center',
              gap          : '8px',
              marginBottom : i < extraTaps.length - 1 ? '5px' : 0,
            }}>
              <span style={{
                fontSize     : '9px',
                fontWeight   : 700,
                color        : t.type === 'IN' ? '#16a34a' : '#dc2626',
                background   : t.type === 'IN' ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)',
                padding      : '2px 6px',
                borderRadius : '4px',
                letterSpacing: '0.04em',
              }}>
                {t.type}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{t.time}</span>
            </div>
          ))}
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
            Ignored — only the 4 main taps were used for calculation.
          </p>
        </div>
      )}
    </>
  )
}

// Sort icon — shows neutral/up/down depending on state
function SortIcon({ colKey, sortKey, sortDir }) {
  const active = sortKey === colKey
  if (!active) return <ChevronsUpDown size={12} style={{ marginLeft: '4px', color: 'var(--text-secondary)', flexShrink: 0 }} />
  if (sortDir === 'asc')  return <ChevronUp   size={12} style={{ marginLeft: '4px', color: 'var(--theme-500)', flexShrink: 0 }} />
  return                         <ChevronDown size={12} style={{ marginLeft: '4px', color: 'var(--theme-500)', flexShrink: 0 }} />
}

const PAGE_SIZE  = 10
const ROW_HEIGHT = 52

export function BiometricTable({ records, total, viewMode }) {
  const [page,      setPage]      = useState(1)
  const [sortKey,   setSortKey]   = useState('date')
  const [sortDir,   setSortDir]   = useState('desc')
  const [hoursMode, setHoursMode] = useState('scheduled') // 'scheduled' | 'actual'

  useEffect(() => { setPage(1) }, [total])

  function handleSort(colKey) {
    if (sortKey === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(colKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  function getHoursLabel(r) {
    return hoursMode === 'scheduled' ? calcSchedHours(r) : calcActualHours(r)
  }

  // ── Sort records ─────────────────────────────────────────────
  const sorted = [...records].sort((a, b) => {
    let aVal, bVal

    if (sortKey === 'id') {
      aVal = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0
      bVal = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0
    } else if (sortKey === 'date') {
      aVal = a.date ?? ''
      bVal = b.date ?? ''
    } else if (sortKey === 'totalHours') {
      aVal = hoursLabelToMinutes(getHoursLabel(a))
      bVal = hoursLabelToMinutes(getHoursLabel(b))
    } else {
      aVal = String(a[sortKey] ?? '').toLowerCase()
      bVal = String(b[sortKey] ?? '').toLowerCase()
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ?  1 : -1
    return 0
  })

  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const fillerCount = PAGE_SIZE - paginated.length

  function getPageNumbers() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3)   return [1, 2, 3, 4, 'ellipsis1', totalPages]
    if (safePage >= totalPages - 2) return [1, 'ellipsis1', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, 'ellipsis1', safePage - 1, safePage, safePage + 1, 'ellipsis2', totalPages]
  }

  // Column definitions — Total Hours header is rendered specially
  const COLUMNS = [
    { label: '#',           key: 'id',          width: '100px',  sortable: true  },
    { label: 'Name',        key: 'name',         width: '180px',  sortable: false },
    { label: 'Department',  key: 'department',   width: '140px',  sortable: false },
    { label: 'Time Frame',  key: 'date',         width: '200px',  sortable: true  },
    { label: 'Shift In',    key: 'shiftIn',      width: '100px',  sortable: false },
    { label: 'Lunch Out',   key: 'lunchOut',     width: '100px',  sortable: false },
    { label: 'Lunch In',    key: 'lunchIn',      width: '100px',  sortable: false },
    { label: 'Shift Out',   key: 'shiftOut',     width: '100px',  sortable: false },
    { label: 'Total Hours', key: 'totalHours',   width: '130px',  sortable: true, isHours: true },
    { label: 'Status',      key: 'status',       width: '90px',   sortable: false },
  ]

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background : 'var(--surface)',
        border     : '1px solid var(--border)',
        boxShadow  : '0 2px 8px rgba(0,0,0,0.06)',
        flex       : 1,
        minHeight  : 0,
      }}
    >
      {/* Title bar */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-medium" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
          Attendance Log
        </p>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '1080px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3"
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{
                    width        : col.width,
                    fontSize     : '11px',
                    color        : sortKey === col.key ? 'var(--theme-500)' : 'var(--text-secondary)',
                    fontWeight   : 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace   : 'nowrap',
                    cursor       : col.sortable ? 'pointer' : 'default',
                    userSelect   : 'none',
                    transition   : 'color 120ms',
                  }}
                  onMouseEnter={e => { if (col.sortable) e.currentTarget.style.color = 'var(--theme-500)' }}
                  onMouseLeave={e => { if (col.sortable) e.currentTarget.style.color = sortKey === col.key ? 'var(--theme-500)' : 'var(--text-secondary)' }}
                >
                  {col.isHours ? (
                    // ── Toggle header for Total Hours ──────────────────────
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Total Hours
                        <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setHoursMode(m => m === 'scheduled' ? 'actual' : 'scheduled') }}
                        title={hoursMode === 'scheduled'
                          ? 'Showing scheduled hours (clamped to shift). Click for actual tap hours.'
                          : 'Showing actual tap hours. Click for scheduled hours.'}
                        style={{
                          display       : 'inline-flex',
                          alignItems    : 'center',
                          gap           : '3px',
                          padding       : '2px 7px',
                          borderRadius  : '6px',
                          border        : `1px solid ${hoursMode === 'scheduled' ? 'var(--theme-500)' : 'var(--border)'}`,
                          background    : hoursMode === 'scheduled' ? 'var(--page-bg-alt)' : 'var(--surface)',
                          color         : hoursMode === 'scheduled' ? 'var(--theme-500)' : 'var(--text-secondary)',
                          fontSize      : '9px',
                          fontWeight    : 700,
                          letterSpacing : '0.04em',
                          cursor        : 'pointer',
                          transition    : 'all 150ms',
                          flexShrink    : 0,
                          textTransform : 'uppercase',
                        }}
                      >
                        {hoursMode === 'scheduled' ? '⏱ Sched' : '⏱ Actual'}
                      </button>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}
                      {col.sortable && (
                        <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <>
                <tr>
                  <td colSpan={10} className="text-center"
                    style={{ height: ROW_HEIGHT + 'px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No attendance records found.
                  </td>
                </tr>
                 {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <tr key={'empty-' + i} style={{
                    background  : i % 2 === 0 ? 'var(--surface-hover)' : 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <td colSpan={10} style={{ height: ROW_HEIGHT + 'px' }}></td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {paginated.map((r, idx) => {
                  const ss    = STATUS_STYLES[r.status] || STATUS_STYLES['Full Time']
                  const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-hover)'
                  const hoursLabel = getHoursLabel(r)
                  return (
                    <tr
                      key={r.id + '_' + r.date}
                      style={{
                        background  : rowBg,
                        borderBottom: '1px solid var(--border)',
                        transition  : 'background 100ms',
                        cursor      : 'pointer',
                        height      : ROW_HEIGHT + 'px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--page-bg-alt)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = rowBg }}
                    >
                      <td className="px-4" style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.id}
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {r.name}
                          <ExtraTapsTooltip extraTaps={r.extraTaps} />
                        </span>
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.department}
                      </td>
                      <td className="px-4" style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.timeframe}
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {r.shiftIn  != null ? r.shiftIn  : <Dash />}
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.lunchOut != null ? r.lunchOut : <Dash />}
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.lunchIn  != null ? r.lunchIn  : <Dash />}
                      </td>
                      <td className="px-4" style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {r.shiftOut != null ? r.shiftOut : <Dash />}
                      </td>
                      <td className="px-4" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {hoursLabel ?? <Dash />}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {hoursMode === 'scheduled' ? 'sched' : 'actual'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="text-xs font-semibold" style={{ color: ss.color, whiteSpace: 'nowrap' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {Array.from({ length: fillerCount }).map((_, i) => {
                  const fillerBg = (paginated.length + i) % 2 === 0 ? 'var(--surface)' : 'var(--surface-hover)'
                  return (
                    <tr key={'filler-' + i} style={{
                      background  : fillerBg,
                      borderBottom: '1px solid var(--border)',
                      height      : ROW_HEIGHT + 'px',
                    }}>
                      <td colSpan={10}></td>
                    </tr>
                  )
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-1" />

      {/* Pagination footer */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing {records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, records.length)} of {records.length} records
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center justify-center w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: 'var(--text-primary)' }}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {getPageNumbers().map((num) =>
            typeof num === 'string' && num.startsWith('ellipsis') ? (
              <span key={num} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '0 2px' }}>…</span>
            ) : (
              <button
                key={num}
                onClick={() => setPage(num)}
                style={{
                  width          : '24px',
                  height         : '24px',
                  borderRadius   : '6px',
                  fontSize       : '11px',
                  fontWeight     : safePage === num ? 600 : 400,
                  background     : safePage === num ? 'var(--theme-500)' : 'transparent',
                  color          : safePage === num ? '#fff' : 'var(--text-secondary)',
                  border         : 'none',
                  cursor         : 'pointer',
                  display        : 'inline-flex',
                  alignItems     : 'center',
                  justifyContent : 'center',
                }}
              >
                {num}
              </button>
            )
          )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center justify-center w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: 'var(--text-primary)' }}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}