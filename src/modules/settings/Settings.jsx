import { useState, useEffect, useMemo } from 'react'
import { Settings as SettingsIcon, HelpCircle } from 'lucide-react'
import { SettingsNav }        from './components/SettingsNav'
import { AppearanceSection }  from './components/AppearanceSection'
import { AccountSection }     from './components/AccountSection'
import { AboutSection }       from './components/AboutSection'
import PageGuide from '../../components/ui/PageGuide'

function Settings({ currentUser }) {
  const [activeSection, setActiveSection] = useState('appearance')

  useEffect(() => {
    const handleNavigation = (e) => {
      if (e.detail) setActiveSection(e.detail)
    }
    window.addEventListener('navigate-settings', handleNavigation)
    return () => window.removeEventListener('navigate-settings', handleNavigation)
  }, [])

  const isAdmin = currentUser?.username === 'admin@doublel.com'

  const guideSteps = useMemo(() => {
    const steps = [
      {
        target: 'body',
        content: 'Welcome to Settings! Here you can customize the app and manage your account.',
        placement: 'center',
      },
      {
        target: '#tour-settings-nav-appearance',
        content: 'The Appearance tab lets you customize the visual style of the application.',
        placement: 'right',
      },
      {
        target: '#tour-settings-themes',
        content: 'Choose from a variety of curated color themes. Clicking one will preview it immediately.',
        placement: 'bottom',
      },
      {
        target: '#tour-settings-save',
        content: 'Don\'t forget to click Save Appearance to keep your new theme!',
        placement: 'left',
      },
      {
        target: '#tour-settings-nav-account',
        content: 'Now let\'s check out the Account tab. Click Next to open it.',
        placement: 'right',
      },
      {
        target: '#tour-settings-account-info',
        content: 'This section displays your registered employee details, current role, and department.',
        placement: 'bottom',
      },
      {
        target: '#tour-settings-creds',
        content: 'You can update your username or change your password here.',
        placement: 'left',
      }
    ]

    if (isAdmin) {
      steps.push({
        target: '#tour-settings-wipe',
        content: 'As an admin, you have the ability to completely wipe the test data from the database here.',
        placement: 'left',
      })
    }

    steps.push(
      {
        target: '#tour-settings-nav-about',
        content: 'Finally, the About tab contains system information. Click Next to open it.',
        placement: 'right',
      },
      {
        target: '#tour-settings-about-info',
        content: 'Here you can see the application version, developers, and platform information.',
        placement: 'bottom',
      },
      {
        target: '#tour-settings-update',
        content: 'You can check for and install software updates directly from this button.',
        placement: 'bottom',
      },
      {
        target: '#page-tour-help-btn',
        content: 'You can restart this tour anytime by clicking the help icon. You\'re all set!',
        placement: 'bottom-end',
      }
    )
    return steps
  }, [isAdmin])

  useEffect(() => {
    const handleNext = (e) => {
      const { index } = e.detail
      const currentStep = guideSteps[index]
      if (currentStep?.target === '#tour-settings-nav-account') {
        e.preventDefault()
        setActiveSection('account')
        setTimeout(() => window.advanceJoyride?.(), 150)
      } else if (currentStep?.target === '#tour-settings-nav-about') {
        e.preventDefault()
        setActiveSection('about')
        setTimeout(() => window.advanceJoyride?.(), 150)
      }
    }
    const handlePrev = (e) => {
      const { index } = e.detail
      const currentStep = guideSteps[index]
      if (currentStep?.target === '#tour-settings-account-info') {
        e.preventDefault()
        setActiveSection('appearance')
        setTimeout(() => window.retreatJoyride?.(), 150)
      } else if (currentStep?.target === '#tour-settings-about-info') {
        e.preventDefault()
        setActiveSection('account')
        setTimeout(() => window.retreatJoyride?.(), 150)
      }
    }
    const handleStartTour = () => {
      setActiveSection('appearance')
    }
    window.addEventListener('start-page-tour', handleStartTour)
    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    return () => {
      window.removeEventListener('start-page-tour', handleStartTour)
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
    }
  }, [guideSteps])

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
      <PageGuide steps={guideSteps} storageKey="seen_settings_tour" />
    </div>
  )
}

export default Settings