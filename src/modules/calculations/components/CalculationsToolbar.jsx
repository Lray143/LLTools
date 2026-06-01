// src/modules/calculations/components/CalculationsToolbar.jsx
import { Search, Store, RotateCcw, BarChart2, Table2 } from 'lucide-react'

export default function CalculationsToolbar({
  // mode
  mode,
  onSetMode,
  // existing props
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
  const isSummary = mode === 'summary'

  return (
    <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 flex flex-col gap-4">

      {/* Top row: title + controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calculations</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isSummary
              ? 'Monthly overview of all saved orders'
              : `${totalItems} item${totalItems !== 1 ? 's' : ''} across ${totalGroups} group${totalGroups !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Mode toggle: Table | Summary */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => onSetMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'table'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Table2 size={13} />
              Table
            </button>
            <button
              onClick={() => onSetMode('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'summary'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart2 size={13} />
              Monthly Summary
            </button>
          </div>

          {/* Outlet selector — table mode only */}
          {!isSummary && (
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
          )}

          {/* Clear all quantities — table mode only, when there are qtys */}
          {!isSummary && hasQty && (
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

      {/* Table-mode only sections */}
      {!isSummary && (
        <>
          {/* Outlet context hint */}
          {selectedOutletId && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <Store size={13} />
              <span>
                Using <strong>{outlets.find((o) => o.id === selectedOutletId)?.name ?? 'outlet'}</strong> prices.
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
        </>
      )}

    </div>
  )
}