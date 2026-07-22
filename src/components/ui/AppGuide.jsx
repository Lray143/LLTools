import { useState, useEffect } from 'react'
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride'

// Custom Tooltip perfectly matching the app's UI
function CustomTooltip({
  index,
  step,
  backProps,
  skipProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}) {
  return (
    <div
      id="tour-tooltip-container"
      {...tooltipProps}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: 'min(320px, calc(100vw - 40px))',
        width: 'min(320px, calc(100vw - 40px))',
        boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }}>
        {step.content}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          {...skipProps}
          onClick={(e) => {
            if (skipProps.onClick) skipProps.onClick(e)
            window.dispatchEvent(new CustomEvent('force-close-app-tour'))
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            padding: '6px 0',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          Skip Tour
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {index > 0 && (
            <button
              {...backProps}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 150ms'
              }}
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            onClick={(e) => {
              if (primaryProps.onClick) primaryProps.onClick(e)
              if (isLastStep) {
                window.dispatchEvent(new CustomEvent('force-close-app-tour'))
              }
            }}
            style={{
              background: 'var(--theme-500)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 150ms'
            }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppGuide({ currentUser }) {
  const [run, setRun] = useState(false)
  const [tourKey, setTourKey] = useState(0)

  const displayName = currentUser?.employeeName || currentUser?.username || 'there'
  // Use a per-user key so each user sees the tour on their first login on this machine
  const localStorageKey = `app_has_seen_tour_${window.__CURRENT_USER_ID__ || 'anon'}`

  useEffect(() => {
    // Check if the tour has been seen before
    const hasSeenTour = localStorage.getItem(localStorageKey)
    if (!hasSeenTour) {
      setRun(true)
      sessionStorage.setItem('app_tour_running', 'true')
      // Immediately flag it as seen so it NEVER auto-runs again on subsequent logins
      localStorage.setItem(localStorageKey, 'true')
    }

    // Listen for custom event to trigger the tour manually
    const startTour = () => {
      setTourKey(k => k + 1)
      setRun(true)
    }

    // Force close listener perfectly tied to our CustomTooltip buttons
    const forceClose = () => {
      setRun(false)
      sessionStorage.removeItem('app_tour_running')
      localStorage.setItem(localStorageKey, 'true')
      setTimeout(() => window.dispatchEvent(new CustomEvent('start-page-tour')), 300)
    }
    
    window.addEventListener('start-tour', startTour)
    window.addEventListener('force-close-app-tour', forceClose)
    return () => {
      window.removeEventListener('start-tour', startTour)
      window.removeEventListener('force-close-app-tour', forceClose)
    }
  }, [])

  // Nuke all outside clicks and Escape key during the tour
  useEffect(() => {
    if (!run) return
    const blockClicks = (e) => {
      if (e.target.closest('#tour-tooltip-container')) return // Allow clicks inside tooltip
      e.stopPropagation()
      e.preventDefault()
    }
    const blockKeys = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
      }
    }
    document.addEventListener('click', blockClicks, true)
    document.addEventListener('mousedown', blockClicks, true)
    document.addEventListener('keydown', blockKeys, true)
    return () => {
      document.removeEventListener('click', blockClicks, true)
      document.removeEventListener('mousedown', blockClicks, true)
      document.removeEventListener('keydown', blockKeys, true)
    }
  }, [run])

  const steps = [
    {
      target: 'body',
      content: `Hello ${displayName}! Let me give you a quick tour of how things work in the app.`,
      placement: 'center',
      disableBeacon: true,
      disableOverlayClose: true,
    },
    {
      target: '#tour-sidebar',
      content: 'This is the sidebar. You can use it to navigate through different pages and modules of the application.',
      placement: 'right',
      disableBeacon: true,
      disableOverlayClose: true,
    },
    {
      target: '#tour-nav-items',
      content: 'Here are all your available pages. Only the modules you have permission for will appear here.',
      placement: 'right',
      disableBeacon: true,
      disableOverlayClose: true,
    },
    {
      target: '#tour-notification-bell',
      content: 'This is the notification bell. You will receive real-time updates here for new chat messages, announcements, reports, and leaves.',
      placement: 'bottom-end',
      disableBeacon: true,
      disableOverlayClose: true,
    },
    {
      target: 'main',
      content: 'This is the main content area where you will interact with the selected module.',
      placement: 'center',
      disableBeacon: true,
      disableOverlayClose: true,
    },
    {
      target: '#tour-help-btn',
      content: 'If you ever need to see this guide again, just click this help button!',
      placement: 'bottom-start',
      disableBeacon: true,
      disableOverlayClose: true,
    },
  ]

  const handleJoyrideCallback = (data) => {
    const { status, type, action } = data
    
    // Save state on FINISHED, SKIPPED, TOUR_END, or any form of 'close' action
    if (
      [STATUS.FINISHED, STATUS.SKIPPED].includes(status) || 
      type === EVENTS.TOUR_END || 
      action === 'close'
    ) {
      setRun(false)
      sessionStorage.removeItem('app_tour_running')
      localStorage.setItem(localStorageKey, 'true')
      setTimeout(() => window.dispatchEvent(new CustomEvent('start-page-tour')), 300)
    }
  }

  return (
    <Joyride
      key={tourKey}
      callback={handleJoyrideCallback}
      continuous
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={120}
      disableOverlayClose={true}
      disableCloseOnEsc={true}
      spotlightClicks={true}
      hideCloseButton
      run={run}
      showProgress={false}
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.65)',
        }
      }}
    />
  )
}
