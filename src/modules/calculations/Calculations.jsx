import CalculationsTable from './components/CalculationsTable'

export default function Calculations() {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <CalculationsTable />
    </div>
  )
}