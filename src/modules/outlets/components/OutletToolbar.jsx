import { Search, Archive, Plus } from 'lucide-react'

export default function OutletToolbar({
  view, setView,
  search, setSearch,
  statusFilter, setStatusFilter,
  total,
  onAdd,
  onArchive,
}) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {/* Cards / List toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setView('cards')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === 'cards'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Cards
        </button>
        <button
          onClick={() => setView('list')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === 'list'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          List
        </button>
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        <option value="All Statuses">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      {/* Count */}
      <span className="text-sm text-gray-500 ml-1">
        {total} outlet{total !== 1 ? 's' : ''}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search outlets…"
          className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 w-52"
        />
      </div>

      {/* Archive */}
      <button
        onClick={onArchive}
        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Archive size={15} />
        Archive
      </button>

      {/* Add */}
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