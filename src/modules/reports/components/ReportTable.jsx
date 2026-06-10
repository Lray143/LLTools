import { FileText } from 'lucide-react'
import { ReportStatusBadge, PriorityBadge } from './ReportStatusBadge'
import { formatDate, truncate } from './reportConstants'

export function ReportTable({ rows, isAdmin, onRowClick, onNewReport }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <FileText size={36} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">No reports found</p>
        {!isAdmin && (
          <button onClick={onNewReport} className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-colors" style={{ background: 'var(--theme-500)' }}>
            Create your first report
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
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Report No</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Date</th>
            {isAdmin && <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Employee</th>}
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Type</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest w-48" style={{ color: 'var(--text-secondary)' }}>Subject</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Priority</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Status</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r)}
              className="cursor-pointer transition-colors group"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              {/* Report No */}
              <td className="px-4 py-3 align-middle">
                <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: 'var(--theme-500)' }}>
                  {r.reportNo}
                </span>
              </td>

              {/* Date */}
              <td className="px-4 py-3 align-middle">
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(r.createdAt)}
                </span>
              </td>

              {/* Employee (admin only) */}
              {isAdmin && (
                <td className="px-4 py-3 align-middle">
                  <p className="m-0 font-semibold text-[13px] whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {r.employeeName || '—'}
                  </p>
                  <p className="m-0 mt-0.5 text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {r.employeeNo}
                  </p>
                </td>
              )}

              {/* Type */}
              <td className="px-4 py-3 align-middle">
                <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  {r.reportType}
                </span>
              </td>

              {/* Subject */}
              <td className="px-4 py-3 align-middle max-w-[200px]">
                <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis block" style={{ color: 'var(--text-secondary)' }}>
                  {r.subject ? truncate(r.subject, 40) : <span className="opacity-50">—</span>}
                </span>
              </td>

              {/* Priority */}
              <td className="px-4 py-3 align-middle">
                <PriorityBadge priority={r.priority} />
              </td>

              {/* Status */}
              <td className="px-4 py-3 align-middle">
                <ReportStatusBadge status={r.status} />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 align-middle" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onRowClick(r)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
