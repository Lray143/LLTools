import NotificationBell from '../../components/ui/NotificationBell'

function Dashboard({ currentUser, refreshKey = 0, onNavigate }) {
  return (
    <div className="flex flex-col w-full h-full" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>Welcome to Double L Management System</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}
export default Dashboard