import { Palette, User, Info } from 'lucide-react'

// Left-side navigation panel inside the Settings page
const NAV_ITEMS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account',    label: 'Account',    icon: User },
  { id: 'about',      label: 'About',      icon: Info  },
]

export function SettingsNav({ active, onChange }) {
  return (
    <nav
      style={{
        width: '200px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingRight: '8px',
      }}
    >
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
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
              background: isActive ? 'var(--page-bg-alt)' : 'transparent',
              color: isActive ? 'var(--accent-bg)' : 'var(--text-primary)',
              transition: 'background 120ms, color 120ms',
              textAlign: 'left',
              marginBottom: '2px',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
            {item.label}
            {isActive && (
              <span style={{
                marginLeft: 'auto',
                width: '3px',
                height: '16px',
                borderRadius: '99px',
                background: 'var(--accent-bg)',
                flexShrink: 0,
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
