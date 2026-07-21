import { useState, useEffect } from 'react'
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride'

// Custom Tooltip matching the app's UI perfectly
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
        maxWidth: '320px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        pointerEvents: 'auto',
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
            window.dispatchEvent(new CustomEvent('force-close-tour'))
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
              onClick={(e) => {
                // Give the page complete control over when Joyride actually moves
                window.retreatJoyride = () => {
                  if (backProps.onClick) backProps.onClick(e)
                }
                const event = new CustomEvent('tour-prev-step', { detail: { index }, cancelable: true })
                window.dispatchEvent(event)
                if (!event.defaultPrevented) {
                  // Wait 150ms to allow React state updates to fully paint the DOM before Joyride scans
                  setTimeout(() => window.retreatJoyride(), 150)
                }
              }}
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
              // Give the page complete control over when Joyride actually moves
              window.advanceJoyride = () => {
                if (primaryProps.onClick) primaryProps.onClick(e)
              }
              const event = new CustomEvent('tour-next-step', { detail: { index }, cancelable: true })
              window.dispatchEvent(event)
              
              if (!event.defaultPrevented) {
                // Wait 150ms to allow React state updates to fully paint the DOM before Joyride scans
                setTimeout(() => window.advanceJoyride(), 150)
              }
              
              if (isLastStep) {
                window.dispatchEvent(new CustomEvent('force-close-tour'))
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

export default function PageGuide({ steps = [], storageKey = 'seen_page_tour', eventName = 'start-page-tour', onCallback }) {
  const [run, setRun] = useState(false)
  const [tourKey, setTourKey] = useState(0)

  useEffect(() => {
    // Scope both the app tour and page tour keys to the currently logged in user
    const userId = window.__CURRENT_USER_ID__ || 'anon'
    const scopedStorageKey = `${storageKey}_${userId}`
    const appTourKey = `app_has_seen_tour_${userId}`

    // Check if THIS specific page tour has been seen before
    const hasSeenTour = localStorage.getItem(scopedStorageKey)
    
    // NOTE: For page tours, we ONLY auto-run if the user has ALREADY SEEN the general app tour
    // AND they haven't seen this specific page tour yet.
    // However, if the general tour is currently running, we wait for it to finish and dispatch the event instead.
    const hasSeenAppTour = localStorage.getItem(appTourKey)
    const isAppTourRunning = sessionStorage.getItem('app_tour_running')
    
    if (hasSeenAppTour && !hasSeenTour && !isAppTourRunning) {
      setRun(true)
      // Immediately flag it as seen so it never auto-runs again on subsequent visits
      localStorage.setItem(scopedStorageKey, 'true')
    }

    // Listen for custom event to trigger the tour manually (or chained from the general tour)
    const startTour = () => {
      setTourKey(k => k + 1)
      setRun(true)
    }

    // Force close listener perfectly tied to our CustomTooltip buttons
    const forceClose = () => {
      setRun(false)
      localStorage.setItem(scopedStorageKey, 'true')
    }
    
    window.addEventListener(eventName, startTour)
    window.addEventListener('force-close-tour', forceClose)
    return () => {
      window.removeEventListener(eventName, startTour)
      window.removeEventListener('force-close-tour', forceClose)
    }
  }, [storageKey, eventName])

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

  const handleJoyrideCallback = (data) => {
    const { status, type, action } = data
    
    // Save state on FINISHED, SKIPPED, TOUR_END, or any form of 'close' action
    if (
      [STATUS.FINISHED, STATUS.SKIPPED].includes(status) || 
      type === EVENTS.TOUR_END || 
      action === 'close'
    ) {
      setRun(false)
      const userId = window.__CURRENT_USER_ID__ || 'anon'
      localStorage.setItem(`${storageKey}_${userId}`, 'true')
    }

    if (onCallback) {
      onCallback(data)
    }
  }

  // Ensure all steps have disableBeacon applied by default
  const formattedSteps = steps.map(step => ({
    ...step,
    disableBeacon: true,
    disableOverlayClose: true,
  }))

  return (
    <>
    <style>{`
      body.hide-joyride .react-joyride__overlay { opacity: 0 !important; pointer-events: none !important; transition: none !important; }
      body.hide-joyride .react-joyride__spotlight { opacity: 0 !important; pointer-events: none !important; transition: none !important; }
      body.hide-joyride #tour-tooltip-container { opacity: 0 !important; pointer-events: none !important; transition: none !important; }
    `}</style>
    <Joyride
      key={tourKey}
      callback={handleJoyrideCallback}
      continuous
      disableScrolling={true}
      disableOverlayClose={true}
      disableCloseOnEsc={true}
      spotlightClicks={true}
      hideCloseButton
      run={run}
      showProgress={false}
      showSkipButton
      steps={formattedSteps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.65)',
        }
      }}
    />
    </>
  )
}
