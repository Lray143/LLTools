export function BiometricStatCards({ stats }) {
  const cards = [
    { label: 'Full Time',        value: stats.fullTime,       color: '#16a34a' },
    { label: 'Late',             value: stats.late,           color: 'var(--theme-500)' },
    { label: 'Undertime',        value: stats.undertime,      color: '#d97706' },
    { label: 'Late & Undertime', value: stats.lateUndertime,  color: '#dc2626' },
    { label: 'Incomplete',       value: stats.incomplete,     color: '#7c3aed' },
    { label: 'On Leave',         value: stats.onLeave,        color: '#2563eb' },
  ]

  return (
    <div className="grid grid-cols-6 gap-3">
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
          <p className="text-3xl font-semibold m-0" style={{ color: card.color }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
