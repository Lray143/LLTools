import { User } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'

export function MyAttendanceHeader({ currentUser, refreshKey, onNavigate }) {
  return (
    <>
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>My Attendance</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Your daily time &amp; attendance records</p>
      </div>

      <div className="flex items-center gap-3">

        <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
          <User className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}