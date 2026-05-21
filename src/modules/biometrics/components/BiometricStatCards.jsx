// ─────────────────────────────────────────────────────────────
// components/BiometricStatCards.jsx
// The four summary cards at the top: Present, Late, Absent, Leave.
// Props:
//   stats — { present, late, absent, onLeave }
// ─────────────────────────────────────────────────────────────

export function BiometricStatCards({ stats }) {
  const cards = [
    { label:'Present',  value:stats.present, color:'#16a34a' },
    { label:'Late',     value:stats.late,    color:'#d97706' },
    { label:'Absent',   value:stats.absent,  color:'#dc2626' },
    { label:'On Leave', value:stats.onLeave, color:'#2563eb' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl px-5 py-4"
          style={{
            background  : '#f5f2ec',
            border      : '1px solid rgba(0,0,0,0.07)',
            boxShadow   : '0 1px 4px rgba(0,0,0,0.05)',
            cursor      : 'default',
          }}
        >
          {/* Stat label */}
          <p style={{ fontSize:'12px', color:'#a09278', marginBottom:'6px' }}>
            {card.label}
          </p>

          {/* Stat number — italic for visual weight */}
          <p
            className="font-semibold"
            style={{ fontSize:'34px', color:card.color, lineHeight:1, fontStyle:'italic' }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}