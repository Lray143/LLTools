import CalculationsTable from './components/CalculationsTable'

export default function Calculations({ currentUser, refreshKey = 0, onNavigate }) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <CalculationsTable currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
    </div>
  )
}