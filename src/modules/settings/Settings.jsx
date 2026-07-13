import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, HelpCircle } from 'lucide-react'
import { SettingsNav }        from './components/SettingsNav'
import { AppearanceSection }  from './components/AppearanceSection'
import { AccountSection }     from './components/AccountSection'
import { AboutSection }       from './components/AboutSection'

function Settings({ currentUser }) {
  const [activeSection, setActiveSection] = useState('appearance')

  useEffect(() => {
    const handleNavigation = (e) => {
      if (e.detail) setActiveSection(e.detail)
    }
    window.addEventListener('navigate-settings', handleNavigation)
    return () => window.removeEventListener('navigate-settings', handleNavigation)
  }, [])

  function renderSection() {
    if (activeSection === 'appearance') return <AppearanceSection currentUser={currentUser} />
    if (activeSection === 'account')    return <AccountSection currentUser={currentUser} />
    if (activeSection === 'about')      return <AboutSection />
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--page-bg)', overflow: 'hidden' }}>

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingsIcon size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Settings
              <button
                id="page-tour-help-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('start-page-tour'))}
                title="Page Guide"
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  width: '24px', height: '24px', position: 'relative',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <HelpCircle size={14} />
              </button>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>System configuration &amp; preferences</p>
          </div>
        </div>
      </div>

      {/* ── BODY: left nav + content ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left nav */}
        <div style={{
          background: 'var(--page-bg)',
          borderRight: '1px solid var(--border)',
          padding: '16px 8px',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <SettingsNav active={activeSection} onChange={setActiveSection} />
        </div>

        {/* Right content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 40px',
        }}>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}

export default Settings