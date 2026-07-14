export function MyAttendanceStatCards({ stats }) {
  const cards = [
    { label: 'Full Time',       value: stats.fullTime,      color: '#16a34a' },
    { label: 'Late',            value: stats.late,          color: 'var(--theme-600)' },
    { label: 'Undertime',       value: stats.undertime,     color: '#d97706' },
    { label: 'Late & Undertime',value: stats.lateUndertime, color: '#dc2626' },
    { label: 'Incomplete',      value: stats.incomplete,    color: '#7c3aed' },
    { label: 'On Leave',        value: stats.onLeave,       color: '#2563eb' },
  ]

  return (
    <div id="tour-my-att-stat-cards" className="grid grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl px-4 py-4 flex flex-col gap-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-medium uppercase tracking-wider leading-tight" style={{ color: 'var(--text-secondary)' }}>
            {card.label}
          </p>
          <p className="text-3xl font-semibold" style={{ color: card.color }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}