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
      }}
    >
      <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }}>
        {step.content}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          {...skipProps}
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

export default function PageGuide({ steps, storageKey, eventName = 'start-page-tour' }) {
  const [run, setRun] = useState(false)
  const [tourKey, setTourKey] = useState(0)

  useEffect(() => {
    // Check if THIS specific page tour has been seen before
    const hasSeenTour = localStorage.getItem(storageKey)
    
    // NOTE: For page tours, we ONLY auto-run if the user has ALREADY SEEN the general app tour
    // AND they haven't seen this specific page tour yet.
    // However, if the general tour is currently running, we wait for it to finish and dispatch the event instead.
    const hasSeenAppTour = localStorage.getItem('app_has_seen_tour')
    if (hasSeenAppTour && !hasSeenTour) {
      setRun(true)
      // Immediately flag it as seen so it never auto-runs again on subsequent visits
      localStorage.setItem(storageKey, 'true')
    }

    // Listen for custom event to trigger the tour manually (or chained from the general tour)
    const startTour = () => {
      setTourKey(k => k + 1)
      setRun(true)
    }
    
    window.addEventListener(eventName, startTour)
    return () => window.removeEventListener(eventName, startTour)
  }, [storageKey, eventName])

  // Nuke all outside clicks during the tour
  useEffect(() => {
    if (!run) return
    const blockClicks = (e) => {
      if (e.target.closest('#tour-tooltip-container')) return // Allow clicks inside tooltip
      e.stopPropagation()
      e.preventDefault()
    }
    document.addEventListener('click', blockClicks, true)
    document.addEventListener('mousedown', blockClicks, true)
    return () => {
      document.removeEventListener('click', blockClicks, true)
      document.removeEventListener('mousedown', blockClicks, true)
    }
  }, [run])

  const handleJoyrideCallback = (data) => {
    const { status, action } = data
    
    // Save state on FINISHED, SKIPPED, or any form of 'close' action
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === 'close') {
      setRun(false)
      localStorage.setItem(storageKey, 'true')
    }
  }

  // Ensure all steps have disableBeacon applied by default
  const formattedSteps = steps.map(step => ({
    ...step,
    disableBeacon: true,
    disableOverlayClose: true,
  }))

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      disableScrolling={true}
      disableOverlayClose={true}
      disableCloseOnEsc={true}
      spotlightClicks={true}
      hideCloseButton
      run={run}
      stepIndex={stepIndex}
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
  )
}
