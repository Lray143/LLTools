import OrdersTable from './components/OrdersTable'

export default function Orders({ currentUser, refreshKey = 0, onNavigate }) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <OrdersTable currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
    </div>
  )
}