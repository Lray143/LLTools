import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STATUS_STYLES } from '../biometricConstants'

const Dash = () => <span style={{ color: '#c9bfaf' }}>-</span>

const COLUMNS = [
  { label: '#',           width: '100px' },
  { label: 'Name',        width: '180px' },
  { label: 'Department',  width: '140px' },
  { label: 'Time Frame',  width: '200px' },
  { label: 'Shift In',    width: '100px' },
  { label: 'Lunch Out',   width: '100px' },
  { label: 'Lunch In',    width: '100px' },
  { label: 'Shift Out',   width: '100px' },
  { label: 'Total Hours', width: '110px' },
  { label: 'Status',      width: '90px'  },
]

function parseTime(t) {
  if (!t) return null
  const [time, meridiem] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return h * 60 + m
}

function calcTotalHours(r) {
  const inMin  = parseTime(r.shiftIn)
  const outMin = parseTime(r.shiftOut)
  if (inMin == null || outMin == null) return null

  let diff = outMin - inMin

  const lunchOutMin = parseTime(r.lunchOut)
  const lunchInMin  = parseTime(r.lunchIn)
  if (lunchOutMin != null && lunchInMin != null) {
    diff -= (lunchInMin - lunchOutMin)
  } else {
    diff -= 90
  }

  if (diff <= 0) return null
  const h  = Math.floor(diff / 60)
  const mn = diff % 60
  return mn > 0 ? `${h}h ${mn}m` : `${h}h`
}

// ── Extra-taps tooltip ────────────────────────────────────────
function ExtraTapsTooltip({ extraTaps }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ x: 0, y: 0 })

  if (!extraTaps || extraTaps.length === 0) return null

  return (
    <>
      {/* Orange badge — shows number of extra taps */}
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
          background     : '#f97316',
          color          : '#fff',
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

      {/* Tooltip — fixed so it's never clipped by table overflow */}
      {visible && (
        <div
          style={{
            position     : 'fixed',
            top          : pos.y - 12,
            left         : pos.x + 14,
            transform    : 'translateY(-100%)',
            zIndex       : 99999,
            background   : '#1c1008',
            color        : '#fff',
            borderRadius : '10px',
            padding      : '10px 14px',
            minWidth     : '200px',
            boxShadow    : '0 8px 28px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          <p style={{
            fontSize     : '10px',
            color        : '#a09278',
            fontWeight   : 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom : '8px',
          }}>
            Additional taps detected
          </p>

          {extraTaps.map((t, i) => (
            <div
              key={i}
              style={{
                display      : 'flex',
                alignItems   : 'center',
                gap          : '8px',
                marginBottom : i < extraTaps.length - 1 ? '5px' : 0,
              }}
            >
              <span style={{
                fontSize  : '9px',
                fontWeight: 700,
                color     : t.type === 'IN' ? '#4ade80' : '#f87171',
                background: t.type === 'IN'
                  ? 'rgba(74,222,128,0.18)'
                  : 'rgba(248,113,113,0.18)',
                padding     : '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}>
                {t.type}
              </span>
              <span style={{ fontSize: '12px', color: '#e8ddd0' }}>{t.time}</span>
            </div>
          ))}

          <p style={{
            fontSize    : '10px',
            color       : '#6b5040',
            marginTop   : '8px',
            lineHeight  : 1.4,
          }}>
            Ignored — only the 4 main taps were used for calculation.
          </p>
        </div>
      )}
    </>
  )
}

const PAGE_SIZE = 10
const ROW_HEIGHT = 52

export function BiometricTable({ records, total, viewMode }) {
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [records])

  const totalPages  = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = records.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const fillerCount = PAGE_SIZE - paginated.length

  function getPageNumbers() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3)   return [1, 2, 3, 4, 'ellipsis1', totalPages]
    if (safePage >= totalPages - 2) return [1, 'ellipsis1', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, 'ellipsis1', safePage - 1, safePage, safePage + 1, 'ellipsis2', totalPages]
  }

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background : '#fff',
        border     : '1px solid rgba(0,0,0,0.07)',
        boxShadow  : '0 2px 8px rgba(0,0,0,0.06)',
        flex       : 1,
        minHeight  : 0,
      }}
    >
      {/* Title bar */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="font-medium" style={{ fontSize: '14px', color: '#2c2010' }}>
          Attendance Log
        </p>
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '1060px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3"
                  style={{
                    width        : col.width,
                    fontSize     : '11px',
                    color        : '#a09278',
                    fontWeight   : 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace   : 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <>
                <tr>
                  <td colSpan={10} className="text-center" style={{ height: ROW_HEIGHT + 'px', color: '#c9bfaf', fontSize: '13px' }}>
                    No attendance records found.
                  </td>
                </tr>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <tr key={'empty-' + i} style={{ background: i % 2 === 0 ? '#faf9f6' : '#fff', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td colSpan={10} style={{ height: ROW_HEIGHT + 'px' }}></td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {paginated.map((r, idx) => {
                  const ss    = STATUS_STYLES[r.status] || STATUS_STYLES.Present
                  const rowBg = idx % 2 === 0 ? '#fff' : '#faf9f6'
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background  : rowBg,
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        transition  : 'background 100ms',
                        cursor      : 'pointer',
                        height      : ROW_HEIGHT + 'px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fff8f2' }}
                      onMouseLeave={e => { e.currentTarget.style.background = rowBg }}
                    >
                      {/* Employee ID */}
                      <td className="px-4" style={{ fontSize: '12px', color: '#b0a090', whiteSpace: 'nowrap' }}>
                        {r.id}
                      </td>

                      {/* Name — extra-taps badge lives here */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#2c2010', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {r.name}
                          <ExtraTapsTooltip extraTaps={r.extraTaps} />
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#6b5c4c', whiteSpace: 'nowrap' }}>
                        {r.department}
                      </td>

                      {/* Date / Time Frame */}
                      <td className="px-4" style={{ fontSize: '12px', color: '#a09278', whiteSpace: 'nowrap' }}>
                        {r.timeframe}
                      </td>

                      {/* Shift In */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', whiteSpace: 'nowrap' }}>
                        {r.shiftIn  != null ? r.shiftIn  : <Dash />}
                      </td>

                      {/* Lunch Out */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#a09278', whiteSpace: 'nowrap' }}>
                        {r.lunchOut != null ? r.lunchOut : <Dash />}
                      </td>

                      {/* Lunch In */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#a09278', whiteSpace: 'nowrap' }}>
                        {r.lunchIn  != null ? r.lunchIn  : <Dash />}
                      </td>

                      {/* Shift Out */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', whiteSpace: 'nowrap' }}>
                        {r.shiftOut != null ? r.shiftOut : <Dash />}
                      </td>

                      {/* Total Hours */}
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {calcTotalHours(r) ?? <Dash />}
                      </td>

                      {/* Status badge */}
                      <td className="px-4">
                        <span className="text-xs font-semibold" style={{ color: ss.color, whiteSpace: 'nowrap' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {Array.from({ length: fillerCount }).map((_, i) => {
                  const fillerBg = (paginated.length + i) % 2 === 0 ? '#fff' : '#faf9f6'
                  return (
                    <tr
                      key={'filler-' + i}
                      style={{ background: fillerBg, borderBottom: '1px solid rgba(0,0,0,0.04)', height: ROW_HEIGHT + 'px' }}
                    >
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
      <div
        className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
      >
        <p style={{ fontSize: '12px', color: '#b0a090' }}>
          Showing {records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, records.length)} of {records.length} records
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center justify-center w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: '#4b3a2a' }}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {getPageNumbers().map((num) =>
            typeof num === 'string' && num.startsWith('ellipsis') ? (
              <span key={num} style={{ fontSize: '11px', color: '#b0a090', padding: '0 2px' }}>…</span>
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
                  background     : safePage === num ? '#f97316' : 'transparent',
                  color          : safePage === num ? '#fff' : '#6b5c4c',
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
            style={{ color: '#4b3a2a' }}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}