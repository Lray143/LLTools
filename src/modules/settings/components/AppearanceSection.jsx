import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import {
  THEMES,
  getSavedTheme, saveTheme, applyThemeToDocument
} from '../../../lib/theme'

export function AppearanceSection({ currentUser }) {
  const [themeId, setThemeId]     = useState(() => getSavedTheme())
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved'

  // Apply theme live when user changes it
  useEffect(() => {
    saveTheme(themeId)
    applyThemeToDocument(themeId)
  }, [themeId])

  const handleSave = async () => {
    setSaveState('saving')
    try {
      if (currentUser?.id && window.electronAPI?.updateUserTheme) {
        // We only save themeColor (which is now the themeId), no more mode.
        // If the backend requires a 3rd argument for mode, we'll just send 'default'.
        await window.electronAPI.updateUserTheme(currentUser.id, themeId, 'default')
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  return (
    <div>
      <SectionHeading
        title="Appearance"
        description="Customize how LLTools looks on your device."
      />

      <SettingRow
        label="Theme"
        description="Pick a theme. Each option applies a completely cohesive color palette across the entire app."
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          padding: '12px 0',
          maxWidth: '600px',
        }}>
          {THEMES.map((preset) => {
            const active = themeId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => setThemeId(preset.id)}
                title={preset.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: active ? `2.5px solid ${preset.colors.accentBg}` : '2.5px solid transparent',
                  boxShadow: active
                    ? `0 0 0 1px ${preset.colors.accentBg}40, 0 4px 12px ${preset.colors.accentBg}30`
                    : '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 150ms ease',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  position: 'relative',
                  background: preset.colors.pageBg
                }}
              >
                {/* Theme preview layout */}
                <div style={{ display: 'flex', width: '100%', height: '80px', padding: '8px', gap: '8px' }}>
                  {/* Fake Sidebar */}
                  <div style={{ width: '30%', height: '100%', borderRadius: '4px', background: preset.colors.sidebarBg, display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
                    <div style={{ height: '8px', width: '100%', background: preset.colors.accentBg, borderRadius: '2px' }} />
                    <div style={{ height: '6px', width: '80%', background: preset.colors.borderStrong, borderRadius: '2px', opacity: 0.3 }} />
                    <div style={{ height: '6px', width: '60%', background: preset.colors.borderStrong, borderRadius: '2px', opacity: 0.3 }} />
                  </div>
                  {/* Fake Content Area */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Header */}
                    <div style={{ height: '12px', width: '40%', background: preset.colors.textPrimary, borderRadius: '2px' }} />
                    {/* Surface Card */}
                    <div style={{ flex: 1, background: preset.colors.surface, borderRadius: '4px', border: `1px solid ${preset.colors.border}`, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ height: '6px', width: '100%', background: preset.colors.textSecondary, borderRadius: '2px', opacity: 0.5 }} />
                      <div style={{ height: '6px', width: '80%', background: preset.colors.textSecondary, borderRadius: '2px', opacity: 0.5 }} />
                      <div style={{ height: '12px', width: '50%', background: preset.colors.accentBg, borderRadius: '2px', marginTop: 'auto' }} />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div style={{
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 500,
                  color: active ? preset.colors.accentBg : preset.colors.textPrimary,
                  background: preset.colors.surface,
                  borderTop: `1px solid ${preset.colors.border}`,
                  textAlign: 'center',
                  transition: 'all 150ms',
                }}>
                  {preset.name}
                </div>

                {/* Active check */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: preset.colors.accentBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                  >
                    <Check size={12} color={preset.colors.accentText} strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

      </SettingRow>

      {/* ── Save Button ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 28px', borderRadius: '8px',
            background: saveState === 'saved' ? '#16a34a' : 'var(--accent-bg)',
            border: 'none',
            color: 'var(--accent-text)', fontSize: '14px', fontWeight: 600,
            cursor: saveState === 'saving' ? 'wait' : 'pointer',
            opacity: saveState === 'saving' ? 0.7 : 1,
            transition: 'background 200ms, transform 100ms',
            minWidth: '180px',
          }}
          onMouseEnter={e => {
            if (saveState === 'idle') e.currentTarget.style.background = 'var(--accent-hover)'
          }}
          onMouseLeave={e => {
            if (saveState === 'idle') e.currentTarget.style.background = 'var(--accent-bg)'
          }}
        >
          {saveState === 'saving' && 'Saving...'}
          {saveState === 'saved' && (
            <>
              <Check size={16} strokeWidth={2.5} />
              Saved
            </>
          )}
          {saveState === 'idle' && 'Save Appearance'}
        </button>
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

export function SectionHeading({ title, description }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
        {description}
      </p>
      <div style={{ marginTop: '16px', height: '1px', background: 'var(--border)' }} />
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
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: '3px' }}>
          {label}
        </p>
        {description && (
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
