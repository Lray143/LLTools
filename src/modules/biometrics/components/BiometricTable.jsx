// ─────────────────────────────────────────────────────────────
// components/BiometricTable.jsx
// The main attendance table with alternating row colors,
// status badges, and hover highlight.
//
// Props:
//   records — filtered array of attendance record objects
//   total   — total unfiltered record count (for footer text)
// ─────────────────────────────────────────────────────────────

import { STATUS_STYLES } from '../biometricConstants'

// Small dash component for empty time cells
const Dash = () => <span style={{ color:'#c9bfaf' }}>—</span>

// Column header definitions — edit labels/widths here
const COLUMNS = [
  { label:'#',          width:'100px' },
  { label:'Name',       width:'160px' },
  { label:'Department', width:'130px' },
  { label:'Time Frame', width:'180px' },
  { label:'In',         width:'90px'  },
  { label:'Out',        width:'90px'  },
  { label:'In',         width:'90px'  },
  { label:'Out',        width:'90px'  },
  { label:'Status',     width:'90px'  },
]

// Sub-header labels under the time columns
const TIME_LABELS = ['Shift Start','Lunch Start','Lunch End','Shift End']

export function BiometricTable({ records, total }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background : '#fff',
        border     : '1px solid rgba(0,0,0,0.07)',
        boxShadow  : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Table title */}
      <div className="px-6 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
        <p className="font-medium" style={{ fontSize:'14px', color:'#2c2010' }}>
          Attendance Log — May 15, 2025
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse:'collapse', minWidth:'920px' }}>

          {/* ── HEADER ──────────────────────────────────────── */}
          <thead>
            {/* Main column headers */}
            <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3"
                  style={{
                    width         : col.width,
                    fontSize      : '11px',
                    color         : '#a09278',
                    fontWeight    : 500,
                    letterSpacing : '0.06em',
                    textTransform : 'uppercase',
                    whiteSpace    : 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>

            {/* Sub-labels under the time punch columns */}
            <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
              <td colSpan={4} />
              {TIME_LABELS.map((lbl, i) => (
                <td
                  key={i}
                  className="px-4 pb-2"
                  style={{ fontSize:'9px', color:'#c9bfaf', letterSpacing:'0.04em', whiteSpace:'nowrap' }}
                >
                  {lbl}
                </td>
              ))}
              <td />
            </tr>
          </thead>

          {/* ── BODY ────────────────────────────────────────── */}
          <tbody>
            {records.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={9} className="text-center py-12" style={{ color:'#c9bfaf', fontSize:'13px' }}>
                  No attendance records found.
                </td>
              </tr>
            ) : records.map((r, idx) => {
              const ss = STATUS_STYLES[r.status] || STATUS_STYLES.Present
              return (
                <tr
                  key={r.id}
                  style={{
                    background   : idx % 2 === 0 ? '#fff' : '#faf9f6',
                    borderBottom : '1px solid rgba(0,0,0,0.04)',
                    transition   : 'background 100ms',
                    cursor       : 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff8f2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#faf9f6' }}
                >
                  <td className="px-4 py-3" style={{ fontSize:'12px', color:'#b0a090', whiteSpace:'nowrap' }}>{r.id}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#2c2010', fontWeight:600, whiteSpace:'nowrap' }}>{r.name}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#6b5c4c', whiteSpace:'nowrap' }}>{r.department}</td>
                  <td className="px-4 py-3" style={{ fontSize:'12px', color:'#a09278', whiteSpace:'nowrap' }}>{r.timeframe}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.shiftIn   ?? <Dash />}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.lunchOut  ?? <Dash />}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.lunchIn   ?? <Dash />}</td>
                  <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.shiftOut  ?? <Dash />}</td>
                  <td className="px-4 py-3">
                    {/* Status badge — color from STATUS_STYLES */}
                    <span
                      className="inline-block rounded-full px-3 py-0.5 font-medium"
                      style={{
                        fontSize   : '11px',
                        color      : ss.color,
                        background : ss.bg,
                        border     : `1px solid ${ss.border}`,
                        whiteSpace : 'nowrap',
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer — record count */}
      <div className="px-6 py-3" style={{ borderTop:'1px solid rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize:'12px', color:'#b0a090' }}>
          Showing {records.length} of {total} records
        </p>
      </div>
    </div>
  )
}