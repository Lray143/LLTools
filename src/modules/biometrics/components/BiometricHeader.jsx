import { Search, User, Fingerprint } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'

export function BiometricHeader({ searchQuery, setSearchQuery, currentUser, refreshKey, onNavigate }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Fingerprint size={18} style={{ color: 'var(--theme-500)' }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Biometrics</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Fingerprint &amp; attendance records</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            placeholder="Search..."
            className="pl-9 rounded-lg text-sm outline-none"
            style={{
              width: '14rem',
              height: '34px',
              fontSize: '13px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        <button
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: '34px', height: '34px', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}
