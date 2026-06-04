// Left-side navigation panel inside the Settings page
const NAV_ITEMS = [
  { id: 'appearance', label: 'Appearance', emoji: '🎨' },
  { id: 'account',    label: 'Account',    emoji: '👤' },
  { id: 'about',      label: 'About',      emoji: 'ℹ️'  },
]

export function SettingsNav({ active, onChange }) {
  return (
    <nav
      style={{
        width: '200px',
        flexShrink: 0,
        borderRight: '1px solid rgba(0,0,0,0.07)',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingRight: '8px',
      }}
    >
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        color: '#a09278',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '4px 12px 10px',
      }}>
        Settings
      </p>
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? '#fff5ee' : 'transparent',
              color: isActive ? '#f97316' : '#4b3a2a',
              transition: 'background 120ms, color 120ms',
              textAlign: 'left',
              marginBottom: '2px',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = '#f9f8f6'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.emoji}</span>
            {item.label}
            {isActive && (
              <span style={{
                marginLeft: 'auto',
                width: '3px',
                height: '16px',
                borderRadius: '99px',
                background: '#f97316',
                flexShrink: 0,
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
