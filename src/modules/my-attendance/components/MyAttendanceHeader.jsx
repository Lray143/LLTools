import { Clock, HelpCircle } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'

export function MyAttendanceHeader({ currentUser, refreshKey, onNavigate }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Clock size={18} style={{ color: 'var(--theme-500)' }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              My Attendance
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
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Your daily time &amp; attendance records</p>
        </div>
      </div>

      <div className="flex items-center gap-3">

        <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
      </div>
    </>
  )
}