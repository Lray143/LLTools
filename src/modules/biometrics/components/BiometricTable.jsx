import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STATUS_STYLES } from '../biometricConstants'


const Dash = () => <span style={{ color: '#c9bfaf' }}>-</span>

const COLUMNS = [
  { label: '#',           width: '100px' },
  { label: 'Name',        width: '180px' },
  { label: 'Department',  width: '140px' },
  { label: 'Time Frame',  width: '200px' },
  { label: 'Shift In',    width: '100px' },
  { label: 'Shift Out',   width: '100px' },
  { label: 'Total Hours', width: '110px' },
  { label: 'Status',      width: '90px'  },
]

// Parse "8:02 AM" → total minutes since midnight
function parseTime(t) {
  if (!t) return null
  const [time, meridiem] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return h * 60 + m
}

// Compute total worked hours as "Xh Ym", deducting lunch break if both times exist
function calcTotalHours(r) {
  const inMin  = parseTime(r.shiftIn)
  const outMin = parseTime(r.shiftOut)
  if (inMin == null || outMin == null) return null
  let diff = outMin - inMin
  const lunchOut = parseTime(r.lunchOut)
  const lunchIn  = parseTime(r.lunchIn)
  if (lunchOut != null && lunchIn != null) diff -= (lunchIn - lunchOut)
  if (diff <= 0) return null
  const h = Math.floor(diff / 60)
  const mn = diff % 60
  return mn > 0 ? `${h}h ${mn}m` : `${h}h`
}

const PAGE_SIZE = 10
const ROW_HEIGHT = 52

export function BiometricTable({ records, total, viewMode }) {
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the records list changes (search, filter, import)
  useEffect(() => { setPage(1) }, [records])

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = records.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
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
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Title */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="font-medium" style={{ fontSize: '14px', color: '#2c2010' }}>
          Attendance Log
        </p>
      </div>

      {/* Table — fixed height based on PAGE_SIZE rows */}
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '920px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3"
                  style={{
                    width: col.width,
                    fontSize: '11px',
                    color: '#a09278',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
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
                  <td colSpan={8} className="text-center" style={{ height: ROW_HEIGHT + 'px', color: '#c9bfaf', fontSize: '13px' }}>
                    No attendance records found.
                  </td>
                </tr>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <tr key={'empty-' + i} style={{ background: i % 2 === 0 ? '#faf9f6' : '#fff', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td colSpan={8} style={{ height: ROW_HEIGHT + 'px' }}></td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {paginated.map((r, idx) => {
                  const ss = STATUS_STYLES[r.status] || STATUS_STYLES.Present
                  const rowBg = idx % 2 === 0 ? '#fff' : '#faf9f6'
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        transition: 'background 100ms',
                        cursor: 'pointer',
                        height: ROW_HEIGHT + 'px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fff8f2' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = rowBg }}
                    >
                      <td className="px-4" style={{ fontSize: '12px', color: '#b0a090', whiteSpace: 'nowrap' }}>{r.id}</td>
                      <td className="px-4" style={{ fontSize: '13px', color: '#2c2010', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</td>
                      <td className="px-4" style={{ fontSize: '13px', color: '#6b5c4c', whiteSpace: 'nowrap' }}>{r.department}</td>
                      <td className="px-4" style={{ fontSize: '12px', color: '#a09278', whiteSpace: 'nowrap' }}>{r.timeframe}</td>
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', whiteSpace: 'nowrap' }}>{r.shiftIn != null ? r.shiftIn : <Dash />}</td>
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', whiteSpace: 'nowrap' }}>{r.shiftOut != null ? r.shiftOut : <Dash />}</td>
                      <td className="px-4" style={{ fontSize: '13px', color: '#4b3a2a', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {calcTotalHours(r) ?? <Dash />}
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
                  const fillerBg = (paginated.length + i) % 2 === 0 ? '#fff' : '#faf9f6'
                  return (
                    <tr
                      key={'filler-' + i}
                      style={{ background: fillerBg, borderBottom: '1px solid rgba(0,0,0,0.04)', height: ROW_HEIGHT + 'px' }}
                    >
                      <td colSpan={8}></td>
                    </tr>
                  )
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Spacer — pushes footer to bottom */}
      <div className="flex-1" />

      {/* Footer — always at bottom */}
      <div
        className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
      >
        <p style={{ fontSize: '12px', color: '#b0a090' }}>
          Showing {records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, records.length)} of {records.length} records
        </p>

        <div className="flex items-center gap-1">
          {/* Prev arrow — no box */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center justify-center w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: '#4b3a2a' }}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Page number pills */}
          {getPageNumbers().map((num) =>
            typeof num === 'string' && num.startsWith('ellipsis') ? (
              <span key={num} style={{ fontSize: '11px', color: '#b0a090', padding: '0 2px' }}>…</span>
            ) : (
              <button
                key={num}
                onClick={() => setPage(num)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: safePage === num ? 600 : 400,
                  background: safePage === num ? '#f97316' : 'transparent',
                  color: safePage === num ? '#fff' : '#6b5c4c',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {num}
              </button>
            )
          )}

          {/* Next arrow — no box */}
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