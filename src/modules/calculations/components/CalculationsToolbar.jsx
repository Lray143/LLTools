// src/modules/calculations/components/CalculationsToolbar.jsx
import { Search, Store, RotateCcw } from 'lucide-react'

export default function CalculationsToolbar({
  search,
  onSearchChange,
  outlets,
  selectedOutletId,
  onSelectOutlet,
  totalItems,
  totalGroups,
  hasQty,
  onClearAll,
}) {
  return (
    <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 flex flex-col gap-4">

      {/* Top row: title + controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calculations</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalItems} item{totalItems !== 1 ? 's' : ''} across {totalGroups} group{totalGroups !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* Outlet selector */}
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <Store size={14} className={selectedOutletId ? 'text-orange-500' : 'text-gray-400'} />
            <select
              value={selectedOutletId ?? ''}
              onChange={(e) => onSelectOutlet(e.target.value || null)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="">Default Prices</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Clear all quantities */}
          {hasQty && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200
                         text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Outlet context hint */}
      {selectedOutletId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
          <Store size={13} />
          <span>
            Using <strong>{outlets.find(o => o.id === selectedOutletId)?.name ?? 'outlet'}</strong> prices.
            Orange prices are outlet-specific overrides.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products, barcodes…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent
                     placeholder:text-gray-300"
        />
      </div>

    </div>
  )
}