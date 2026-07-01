export function BiometricStatCards({ stats, isLoading }) {
  const cards = [
    { label: 'Full Time',        value: stats.fullTime,       color: '#16a34a' },
    { label: 'Late',             value: stats.late,           color: 'var(--theme-500)' },
    { label: 'Undertime',        value: stats.undertime,      color: '#d97706' },
    { label: 'Late & Undertime', value: stats.lateUndertime,  color: '#dc2626' },
    { label: 'Incomplete',       value: stats.incomplete,     color: '#7c3aed' },
    { label: 'One Tap',          value: stats.oneTapOnly,     color: '#c026d3' },
    { label: 'Worked Rest Day',  value: stats.workedDayOff,   color: '#0284c7' },
    { label: 'On Leave',         value: stats.onLeave,        color: '#2563eb' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
      <style>{`
        @keyframes statSkeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .stat-skeleton {
          height: 36px;
          width: 50px;
          margin-top: 4px;
          border-radius: 8px;
          background-color: var(--border);
          animation: statSkeletonPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl px-4 py-4 flex flex-col gap-1 shadow-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest leading-tight m-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            {card.label}
          </p>
          {isLoading ? (
            <div className="stat-skeleton" />
          ) : (
            <p className="text-3xl font-semibold m-0" style={{ color: card.color }}>
              {card.value}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
