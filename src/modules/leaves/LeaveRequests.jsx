import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'

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
  const [gformUrl, setGformUrl] = useState(DEFAULT_LEAVE_GFORM)
  const gformUrlRef = useRef(gformUrl)

  // ── Load leave form URL ──
  useEffect(() => {
    window.electronAPI?.getAppLink?.('leave_gform')
      .then(link => {
        if (!link?.url) return
        const next = normalizeFormUrl(link.url)
        if (next !== gformUrlRef.current) {
          gformUrlRef.current = next
          setGformUrl(next)
        }
      })
      .catch(() => {
        if (gformUrlRef.current !== DEFAULT_LEAVE_GFORM) {
          gformUrlRef.current = DEFAULT_LEAVE_GFORM
          setGformUrl(DEFAULT_LEAVE_GFORM)
        }
      })
  }, [refreshKey])

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
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Leave Requests</h1>
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
        <div className="flex-1 rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>
           <webview 
             allowpopups="true" 
             useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
             src={gformUrl || DEFAULT_LEAVE_GFORM} 
             style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
           />
        </div>
      </div>
    </div>
  )
}
