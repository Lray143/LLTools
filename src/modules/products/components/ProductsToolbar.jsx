// src/modules/products/components/ProductsToolbar.jsx
import { Search, FolderPlus, Lock, Unlock, Archive, Store } from 'lucide-react'

export default function ProductsToolbar({
  search, onSearchChange,
  onAddGroup, onOpenArchive,
  totalItems, totalGroups,
  editMode, onToggleEditMode,
  // Outlet selector
  outlets,
  selectedOutletId,
  onSelectOutlet,
}) {
  return (
    <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
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

          {/* Archive viewer — always accessible */}
          <button
            onClick={onOpenArchive}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Archive size={15} />
            Archive
          </button>

          {/* Edit mode toggle */}
          <button
            onClick={onToggleEditMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              editMode
                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {editMode ? <Unlock size={15} /> : <Lock size={15} />}
            {editMode ? 'Editing' : 'Locked'}
          </button>

          {editMode && !selectedOutletId && (
            <button
              onClick={onAddGroup}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200
                         text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              <FolderPlus size={15} />
              Add Group
            </button>
          )}
        </div>
      </div>

      {/* Outlet context banner */}
      {selectedOutletId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
          <Store size={13} />
          <span>
            Viewing <strong>{outlets.find(o => o.id === selectedOutletId)?.name ?? 'outlet'}</strong> prices.
            The <span className="italic">Price / Piece</span> column shows outlet-specific prices — orange means overridden, gray means using the default.
            {editMode && ' Click any price to set a custom price for this outlet.'}
          </span>
        </div>
      )}

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