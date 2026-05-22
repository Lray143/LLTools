export function BiometricStatCards({ stats }) {
  const cards = [
    { label: 'Present',  value: stats.present, color: '#16a34a' },
    { label: 'Late',     value: stats.late,    color: '#ea580c' },
    { label: 'Absent',   value: stats.absent,  color: '#dc2626' },
    { label: 'On Leave', value: stats.onLeave, color: '#2563eb' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl px-5 py-4 flex flex-col gap-1 bg-white border border-gray-200"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
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