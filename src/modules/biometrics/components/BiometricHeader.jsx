import { Search, User } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'

export function BiometricHeader({ searchQuery, setSearchQuery, currentUser, refreshKey, onNavigate }) {
  return (
    <>
      <h1 className="text-2xl font-semibold m-0" style={{ color: 'var(--text-primary)' }}>Biometrics</h1>

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
