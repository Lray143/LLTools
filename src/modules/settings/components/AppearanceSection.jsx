import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import {
  THEME_PRESETS, generateThemeColors,
  getSavedTheme, saveTheme, applyThemeToDocument,
  getSavedMode, saveMode, applyModeToDocument,
} from '../../../lib/theme'



export function AppearanceSection({ currentUser }) {
  const [mode, setMode]             = useState(() => getSavedMode())
  const [themeColor, setThemeColor] = useState(() => getSavedTheme())
  const [saveState, setSaveState]   = useState('idle') // 'idle' | 'saving' | 'saved'

  // Apply mode live when user changes it
  useEffect(() => {
    saveMode(mode)
    applyModeToDocument(mode)
  }, [mode])

  // Apply theme color live when user changes it
  useEffect(() => {
    saveTheme(themeColor)
    applyThemeToDocument(themeColor)
  }, [themeColor])

  const handleSave = async () => {
    setSaveState('saving')
    try {
      if (currentUser?.id && window.electronAPI?.updateUserTheme) {
        await window.electronAPI.updateUserTheme(currentUser.id, themeColor, mode)
      }
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  // Get current preview colors
  const currentPalette = generateThemeColors(themeColor)

  return (
    <div>
      <SectionHeading
        title="Appearance"
        description="Customize how LLTools looks on your device."
      />

      {/* ── Theme Color Picker (Microsoft-style) ─────────────────── */}
      <SettingRow
        label="Theme Color"
        description="Pick a color theme. Each option applies 3 coordinated colors across the entire app."
      >
        {/* Grid of preset theme swatches — each shows 3 color bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '12px 0',
          maxWidth: '480px',
        }}>
          {THEME_PRESETS.map((preset) => {
            const active = themeColor === preset.base && mode === (preset.mode || 'default')
            return (
              <button
                key={preset.name}
                onClick={() => {
                  setThemeColor(preset.base)
                  setMode(preset.mode || 'default')
                }}
                title={preset.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: active ? `2.5px solid ${preset.preview[0]}` : '2.5px solid transparent',
                  boxShadow: active
                    ? `0 0 0 1px ${preset.preview[0]}40, 0 4px 12px ${preset.preview[0]}30`
                    : '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 150ms ease',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                {/* 3-color bar preview */}
                <div style={{ display: 'flex', height: '32px', width: '100%' }}>
                  <div style={{ flex: 1, background: preset.preview[0] }} />
                  <div style={{ flex: 1, background: preset.preview[1] }} />
                  <div style={{ flex: 1, background: preset.preview[2] }} />
                </div>
                {/* Label */}
                <div style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  color: active ? preset.preview[0] : 'var(--text-secondary)',
                  background: active ? `${preset.preview[1]}` : 'var(--surface)',
                  textAlign: 'center',
                  transition: 'all 150ms',
                }}>
                  {preset.name}
                </div>
                {/* Active check */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}>
                    <Check size={11} color={preset.preview[0]} strokeWidth={3} />
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
            background: saveState === 'saved' ? '#16a34a' : 'var(--theme-500)',
            border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: saveState === 'saving' ? 'wait' : 'pointer',
            opacity: saveState === 'saving' ? 0.7 : 1,
            transition: 'background 200ms, transform 100ms',
            minWidth: '180px',
          }}
          onMouseEnter={e => {
            if (saveState === 'idle') e.currentTarget.style.background = 'var(--theme-600)'
          }}
          onMouseLeave={e => {
            if (saveState === 'idle') e.currentTarget.style.background = 'var(--theme-500)'
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
