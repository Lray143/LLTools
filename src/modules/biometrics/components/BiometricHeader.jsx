import { Fingerprint } from 'lucide-react'
import NotificationBell from '../../../components/ui/NotificationBell'
import SearchBar from '../../../components/ui/SearchBar'

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
        <div style={{ width: '14rem' }}>
          <SearchBar
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
      </div>
    </>
  )
}
