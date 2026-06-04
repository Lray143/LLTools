import { FileText } from 'lucide-react'
import { StatusBadge }       from './StatusBadge'
import { formatDate, dayCount, truncate, thStyle, tdStyle } from './leaveConstants'

export function LeaveTable({ rows, isManageView, onView, onReview, onNewRequest }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <FileText size={36} color="#e5e0d8" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: '14px', color: '#c9bfaf', margin: 0 }}>No leave requests found</p>
        {!isManageView && (
          <button onClick={onNewRequest} style={{
            marginTop: '14px', padding: '8px 20px', borderRadius: '10px', border: 'none',
            background: '#f97316', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            File your first request
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            {isManageView && <th style={thStyle}>Employee</th>}
            <th style={thStyle}>Leave Type</th>
            <th style={thStyle}>Start</th>
            <th style={thStyle}>End</th>
            <th style={thStyle}>Days</th>
            <th style={{ ...thStyle, width: '160px' }}>Reason</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Filed</th>
            <th style={{ ...thStyle, width: '160px' }}>HR Note</th>
            <th style={thStyle}>Reviewed By</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const bg = i % 2 === 0 ? '#fff' : '#faf9f6'
            return (
              <tr
                key={r.id}
                onClick={() => onView(r)}
                style={{
                  background: bg,
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff8f2'}
                onMouseLeave={e => e.currentTarget.style.background = bg}
              >
                {/* Employee */}
                {isManageView && (
                  <td style={tdStyle}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#2c2010', whiteSpace: 'nowrap' }}>
                      {r.emp_name || r.employee_name || '—'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#a09278', whiteSpace: 'nowrap' }}>
                      {r.employee_no}
                    </p>
                  </td>
                )}

                {/* Leave Type */}
                <td style={tdStyle}>
                  <span style={{ fontSize: '13px', color: '#2c2010', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {r.leave_type}
                  </span>
                </td>

                {/* Dates */}
                <td style={tdStyle}>
                  <span style={{ fontSize: '12px', color: '#6b5c4c', whiteSpace: 'nowrap' }}>
                    {formatDate(r.start_date)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '12px', color: '#6b5c4c', whiteSpace: 'nowrap' }}>
                    {formatDate(r.end_date)}
                  </span>
                </td>

                {/* Days */}
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-block', padding: '2px 9px',
                    background: '#f3f4f6', borderRadius: '20px',
                    fontSize: '11px', fontWeight: 600, color: '#4b3a2a',
                  }}>
                    {dayCount(r.start_date, r.end_date)}d
                  </span>
                </td>

                {/* Reason — truncated */}
                <td style={{ ...tdStyle, maxWidth: '160px' }}>
                  <span style={{
                    fontSize: '12px', color: '#6b5c4c',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', display: 'block',
                  }}>
                    {r.reason ? truncate(r.reason, 40) : <span style={{ color: '#d4cfc9' }}>—</span>}
                  </span>
                </td>

                {/* Status */}
                <td style={tdStyle}>
                  <StatusBadge status={r.status} />
                </td>

                {/* Filed */}
                <td style={tdStyle}>
                  <span style={{ fontSize: '11px', color: '#c9bfaf', whiteSpace: 'nowrap' }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </td>

                {/* HR Note — truncated */}
                <td style={{ ...tdStyle, maxWidth: '160px' }}>
                  {r.review_note ? (
                    <span style={{
                      fontSize: '12px', color: '#4b3a2a',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', display: 'block',
                    }}>
                      {truncate(r.review_note, 40)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#d4cfc9' }}>
                      {r.status === 'Pending' ? 'Awaiting review…' : '—'}
                    </span>
                  )}
                </td>

                {/* Reviewed By */}
                <td style={tdStyle}>
                  {r.reviewed_by ? (
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#4b3a2a', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {r.reviewed_by}
                      </p>
                      {r.reviewed_at && (
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#c9bfaf', whiteSpace: 'nowrap' }}>
                          {new Date(r.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#d4cfc9' }}>—</span>
                  )}
                </td>

                {/* Action */}
                <td style={tdStyle} onClick={e => e.stopPropagation()}>
                  {isManageView && r.status === 'Pending' ? (
                    <button
                      onClick={() => onReview(r)}
                      style={{
                        padding: '5px 14px', borderRadius: '8px',
                        border: '1px solid #f97316', background: '#fff8f2', color: '#f97316',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Review
                    </button>
                  ) : (
                    <button
                      onClick={() => onView(r)}
                      style={{
                        padding: '5px 14px', borderRadius: '8px',
                        border: '1px solid #e5e7eb', background: '#fff', color: '#6b5c4c',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
