import { useState } from 'react'
import { SettingsNav }        from './components/SettingsNav'
import { AppearanceSection }  from './components/AppearanceSection'
import { AccountSection }     from './components/AccountSection'
import { AboutSection }       from './components/AboutSection'

function Settings({ currentUser }) {
  const [activeSection, setActiveSection] = useState('appearance')

  function renderSection() {
    if (activeSection === 'appearance') return <AppearanceSection />
    if (activeSection === 'account')    return <AccountSection currentUser={currentUser} />
    if (activeSection === 'about')      return <AboutSection />
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fcfcfc', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '32px',
        paddingRight: 'calc(32px + 15px)',
        paddingTop: '16px',
        paddingBottom: '16px',
        background: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1c1410', margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* ── BODY: left nav + content ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left nav */}
        <div style={{
          background: '#fff',
          borderRight: '1px solid rgba(0,0,0,0.07)',
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