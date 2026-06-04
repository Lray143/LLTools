import { useState, useEffect } from 'react'
import { Monitor, Sun, Moon } from 'lucide-react'

const THEMES = [
  { id: 'light',  label: 'Light',  icon: Sun     },
  { id: 'dark',   label: 'Dark',   icon: Moon    },
  { id: 'system', label: 'System', icon: Monitor },
]

export function AppearanceSection() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ll-theme') ?? 'light')

  useEffect(() => {
    localStorage.setItem('ll-theme', theme)
  }, [theme])

  return (
    <div>
      <SectionHeading
        title="Appearance"
        description="Customize how LLTools looks on your device."
      />

      {/* Theme picker */}
      <SettingRow
        label="Theme"
        description="Choose between Light, Dark, or follow your system preference."
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {THEMES.map(({ id, label, icon: Icon }) => {
            const active = theme === id
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '90px',
                  padding: '16px 0 12px',
                  borderRadius: '14px',
                  border: active ? '2px solid #f97316' : '2px solid rgba(0,0,0,0.08)',
                  background: active ? '#fff5ee' : '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 150ms, background 150ms',
                  boxShadow: active ? '0 0 0 4px rgba(249,115,22,0.08)' : 'none',
                }}
              >
                <Icon
                  size={20}
                  color={active ? '#f97316' : '#9ca3af'}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span style={{
                  fontSize: '12.5px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#f97316' : '#6b7280',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Coming soon badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '12px',
          padding: '5px 10px',
          borderRadius: '99px',
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.15)',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#f97316', flexShrink: 0,
          }} />
          <span style={{ fontSize: '11.5px', color: '#f97316', fontWeight: 500 }}>
            Theme switching coming soon — preference saved
          </span>
        </div>
      </SettingRow>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

export function SectionHeading({ title, description }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1410', margin: 0, marginBottom: '4px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
        {description}
      </p>
      <div style={{ marginTop: '16px', height: '1px', background: 'rgba(0,0,0,0.06)' }} />
    </div>
  )
}

export function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '20px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div>
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1c1410', margin: 0, marginBottom: '3px' }}>
          {label}
        </p>
        {description && (
          <p style={{ fontSize: '12.5px', color: '#9ca3af', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
