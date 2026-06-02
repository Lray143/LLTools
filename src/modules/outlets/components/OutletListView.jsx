// src/modules/outlets/components/OutletToolbar.jsx
import { Search, Archive, Plus, ScrollText } from 'lucide-react'

export default function OutletToolbar({
  view, setView,
  search, setSearch,
  statusFilter, setStatusFilter,
  regionFilter, setRegionFilter,
  regions,
  total,
  onAdd,
  onArchive,
}) {
  const isOrdersView = view === 'orders'

  return (
    <div className="flex items-center gap-3 px-8 py-3 border-b border-gray-100 flex-wrap">

      {/* Cards / List / Orders toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        {[
          { id: 'cards',  label: 'Cards' },
          { id: 'list',   label: 'List'  },
          { id: 'orders', label: 'Orders', icon: <ScrollText size={13} /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Status filter + Region filter + count — hidden in orders view */}
      {!isOrdersView && (
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 max-w-[220px]"
          >
            <option value="All Regions">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <span className="text-sm text-gray-500 ml-1">
            {total} outlet{total !== 1 ? 's' : ''}
          </span>
        </>
      )}

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

      {/* Search — hidden in orders view */}
      {!isOrdersView && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outlets…"
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 w-52"
          />
        </div>
      )}

      {/* Spacer to push action buttons right */}
      <div className="flex-1" />

      {/* Action buttons */}
      <button
        onClick={onArchive}
        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Archive size={15} />
        Archive
      </button>

      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
      >
        <Plus size={15} />
        Add Outlet
      </button>

    </div>
  )
}