import { Clock } from 'lucide-react'
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>My Attendance</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Your daily time &amp; attendance records</p>
        </div>
      </div>

      <div className="flex items-center gap-3">

        <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
      </div>
    </>
  )
}