import { useState, useEffect, useRef } from 'react'
import { Calendar, HelpCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import PageGuide from '../../components/ui/PageGuide'

const DEFAULT_LEAVE_GFORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSBRl4zYfbTMCJzOfYz_bEK4y6LuV2cpu518K-xPbjWKibnA/viewform?embedded=true'

function normalizeFormUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return DEFAULT_LEAVE_GFORM
  if (!trimmed.includes('docs.google.com/forms')) return trimmed
  if (trimmed.includes('embedded=true')) return trimmed
  const sep = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${sep}embedded=true`
}

export default function LeaveRequests({ currentUser, refreshKey = 0, onNavigate }) {
  const [gformUrl, setGformUrl]     = useState(DEFAULT_LEAVE_GFORM)
  const [loadState, setLoadState]   = useState('loading') // 'loading' | 'loaded' | 'error'
  const [errorCode, setErrorCode]   = useState(null)
  const gformUrlRef = useRef(gformUrl)
  const webviewRef  = useRef(null)

  // ── Load leave form URL ──
  useEffect(() => {
    window.electronAPI?.getAppLink?.('leave_gform')
      .then(link => {
        if (!link?.url) return
        const next = normalizeFormUrl(link.url)
        if (next !== gformUrlRef.current) {
          gformUrlRef.current = next
          setLoadState('loading')
          setErrorCode(null)
          setGformUrl(next)
        }
      })
      .catch(() => {
        if (gformUrlRef.current !== DEFAULT_LEAVE_GFORM) {
          gformUrlRef.current = DEFAULT_LEAVE_GFORM
          setLoadState('loading')
          setErrorCode(null)
          setGformUrl(DEFAULT_LEAVE_GFORM)
        }
      })
  }, [refreshKey])

  // ── Attach webview event listeners once it's in the DOM ──
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const onLoad = () => setLoadState('loaded')
    const onFail = (e) => {
      // -3 = ERR_ABORTED (navigation cancelled, e.g. redirect) — ignore it
      if (e.errorCode === -3) return
      console.warn('[LeaveRequests] webview failed to load:', e.errorCode, e.errorDescription, e.validatedURL)
      setErrorCode(e.errorCode)
      setLoadState('error')
    }

    wv.addEventListener('did-finish-load', onLoad)
    wv.addEventListener('did-fail-load',   onFail)
    return () => {
      wv.removeEventListener('did-finish-load', onLoad)
      wv.removeEventListener('did-fail-load',   onFail)
    }
  }, [gformUrl]) // re-attach when URL changes (webview re-mounts)

  const handleRetry = () => {
    setLoadState('loading')
    setErrorCode(null)
    if (webviewRef.current) {
      webviewRef.current.src = gformUrl
    }
  }

  const handleOpenExternal = () => {
    const plainUrl = gformUrl.replace('?embedded=true', '').replace('&embedded=true', '')
    // Use Electron shell via IPC if available, otherwise open in webview navigation
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(plainUrl)
    } else {
      // Fallback: open via a temporary anchor click which Electron intercepts via setWindowOpenHandler
      const a = document.createElement('a')
      a.href = plainUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    }
  }

  const guideSteps = [
    {
      target: 'body',
      content: 'Welcome to the Leave Requests module! Let\'s take a quick look around.',
      placement: 'center',
    },
    {
      target: '#tour-leave-form',
      content: 'This is where you submit your leave requests. Make sure to fill out all the required details.',
      placement: 'center',
    },
    {
      target: '#page-tour-help-btn',
      content: 'If you ever need to restart this tour, just click this help button. You are good to go!',
      placement: 'bottom-end',
    },
  ]

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Leave Requests
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
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Submit your leave request via the form below
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 px-8 pb-8 flex flex-col pt-6 gap-5">
        <div
          id="tour-leave-form"
          className="flex-1 rounded-xl shadow-sm overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}
        >
          {/* Loading overlay */}
          {loadState === 'loading' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface)', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--theme-500)',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Loading form…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error state */}
          {loadState === 'error' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface)', gap: 16, padding: '32px',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={26} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 380 }}>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Could not load the form
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The leave request form failed to load{errorCode ? ` (error ${errorCode})` : ''}. This usually means the form URL is invalid or your connection is unavailable.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleRetry}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: 'var(--theme-500)', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} /> Try Again
                </button>
                <button
                  onClick={handleOpenExternal}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: 'var(--surface)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={13} /> Open in Browser
                </button>
              </div>
            </div>
          )}

          {/* The actual webview — always in DOM so event listeners attach */}
          <webview
            ref={webviewRef}
            allowpopups="true"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
            src={gformUrl || DEFAULT_LEAVE_GFORM}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none',
              opacity: loadState === 'loaded' ? 1 : 0,
              transition: 'opacity 300ms',
            }}
          />
        </div>
      </div>
      <PageGuide steps={guideSteps} storageKey="seen_leaves_tour" />
    </div>
  )
}
