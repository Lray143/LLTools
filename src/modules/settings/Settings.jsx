import { useState } from 'react'
import { SettingsNav }        from './components/SettingsNav'
import { AppearanceSection }  from './components/AppearanceSection'
import { AccountSection }     from './components/AccountSection'
import { AboutSection }       from './components/AboutSection'

function Settings({ currentUser }) {
  const [activeSection, setActiveSection] = useState('appearance')

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
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Settings</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>System configuration &amp; preferences</p>
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
          maxWidth: '680px',
        }}>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}

export default Settings