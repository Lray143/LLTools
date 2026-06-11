import { FileText } from 'lucide-react'
import { StatusBadge }       from './StatusBadge'
import { formatDate, dayCount, truncate } from './leaveConstants'

export function LeaveTable({ rows, isManageView, onView, onReview, onNewRequest }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <FileText size={36} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">No leave requests found</p>
        {!isManageView && (
          <button onClick={onNewRequest} className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-colors" style={{ background: 'var(--theme-500)' }}>
            File your first request
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Leave No</th>
            {isManageView && <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Employee</th>}
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Leave Type</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Start</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>End</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Days</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest w-40" style={{ color: 'var(--text-secondary)' }}>Reason</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Status</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Filed</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest w-40" style={{ color: 'var(--text-secondary)' }}>HR Note</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Reviewed By</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
          {rows.map((r, i) => {
            return (
              <tr
                key={r.id}
                onClick={() => onView(r)}
                className="cursor-pointer transition-colors group"
                style={{ background: 'var(--surface)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                {/* Leave No */}
                <td className="px-4 py-3 align-middle">
                  <span
                    className="font-mono font-bold text-[12px] whitespace-nowrap"
                    style={{ color: 'var(--accent-bg)' }}
                  >
                    {r.leave_no || '—'}
                  </span>
                </td>

                {/* Employee */}
                {isManageView && (
                  <td className="px-4 py-3 align-middle">
                    <p className="m-0 font-semibold text-[13px] whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {r.emp_name || r.employee_name || '—'}
                    </p>
                    <p className="m-0 mt-0.5 text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {r.employee_no}
                    </p>
                  </td>
                )}

                {/* Leave Type */}
                <td className="px-4 py-3 align-middle">
                  <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {r.leave_type}
                  </span>
                </td>

                {/* Dates */}
                <td className="px-4 py-3 align-middle">
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(r.start_date)}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(r.end_date)}
                  </span>
                </td>

                {/* Days */}
                <td className="px-4 py-3 align-middle">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                    {dayCount(r.start_date, r.end_date)}d
                  </span>
                </td>

                {/* Reason — truncated */}
                <td className="px-4 py-3 align-middle max-w-[160px]">
                  <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis block" style={{ color: 'var(--text-secondary)' }}>
                    {r.reason ? truncate(r.reason, 40) : <span className="opacity-50">—</span>}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={r.status} />
                </td>

                {/* Filed */}
                <td className="px-4 py-3 align-middle">
                  <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </td>

                {/* HR Note — truncated */}
                <td className="px-4 py-3 align-middle max-w-[160px]">
                  {r.review_note ? (
                    <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis block" style={{ color: 'var(--text-primary)' }}>
                      {truncate(r.review_note, 40)}
                    </span>
                  ) : (
                    <span className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
                      {r.status === 'Pending' ? 'Awaiting review…' : '—'}
                    </span>
                  )}
                </td>

                {/* Reviewed By */}
                <td className="px-4 py-3 align-middle">
                  {r.reviewed_by ? (
                    <div>
                      <p className="m-0 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        {r.reviewed_by}
                      </p>
                      {r.reviewed_at && (
                        <p className="m-0 mt-0.5 text-[10px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>—</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-4 py-3 align-middle" onClick={e => e.stopPropagation()}>
                  {isManageView && r.status === 'Pending' ? (
                    <button
                      onClick={() => onReview(r)}
                      className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap"
                      style={{ borderColor: 'var(--theme-500)', background: 'var(--surface-hover)', color: 'var(--theme-500)' }}
                    >
                      Review
                    </button>
                  ) : (
                    <button
                      onClick={() => onView(r)}
                      className="px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
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

