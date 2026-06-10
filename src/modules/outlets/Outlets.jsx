// src/modules/outlets/Outlets.jsx
import { useState, useEffect, useMemo } from 'react'
import { Search, User } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'

import OutletToolbar       from './components/OutletToolbar'
import OutletCardGrid      from './components/OutletCardGrid'
import OutletListView      from './components/OutletListView'
import OutletOrdersView    from './components/OutletOrdersView'
import OutletModal         from './components/OutletModal'
import OutletDeleteModal   from './components/OutletDeleteModal'
import OutletArchiveDrawer from './components/OutletArchiveDrawer'
import OutletOrdersDrawer  from './components/OutletOrdersDrawer'

export default function Outlets({ refreshKey = 0, currentUser, onNavigate }) {
  const [outlets,         setOutlets]         = useState([])
  const [archivedOutlets, setArchivedOutlets] = useState([])
  const [loading,         setLoading]         = useState(true)

  // UI state — 'cards' | 'list' | 'orders'
  const [view,         setView]         = useState('cards')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [regionFilter, setRegionFilter] = useState('All Regions')

  // Modal state
  const [editTarget,   setEditTarget]   = useState(null)   // outlet obj | {} for new
  const [deleteTarget, setDeleteTarget] = useState(null)   // outlet obj
  const [showArchive,  setShowArchive]  = useState(false)
  const [ordersTarget, setOrdersTarget] = useState(null)   // outlet obj | null

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    const [active, archived] = await Promise.all([
      window.electronAPI.getOutlets(),
      window.electronAPI.getArchivedOutlets(),
    ])
    
    const newActive = active ?? []
    const newArchived = archived ?? []
    
    setOutlets(prev => JSON.stringify(prev) === JSON.stringify(newActive) ? prev : newActive)
    setArchivedOutlets(prev => JSON.stringify(prev) === JSON.stringify(newArchived) ? prev : newArchived)
    
    setLoading(false)
  }

  useEffect(() => { load(refreshKey === 0) }, [refreshKey])

  const handleSave = async (payload) => {
    await window.electronAPI.upsertOutlet(payload)
    setEditTarget(null)
    await load()
  }

  const handleArchive = async (id) => {
    await window.electronAPI.archiveOutlet(id)
    setDeleteTarget(null)
    await load()
  }

  const handleRestore = async (id) => {
    await window.electronAPI.unarchiveOutlet(id)
    await load()
  }

  const handlePermDelete = async (id) => {
    await window.electronAPI.permanentDeleteOutlet(id)
    await load()
  }

  // ── Unique region values for filter dropdown ────────────────────
  const regions = useMemo(() => {
    const set = new Set(outlets.map(o => o.region).filter(Boolean))
    return Array.from(set).sort()
  }, [outlets])

  // ── Filtered list (for cards + list views only) ─────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return outlets.filter((o) => {
      const matchSearch =
        !q ||
        o.name.toLowerCase().includes(q) ||
        (o.code    ?? '').toLowerCase().includes(q) ||
        (o.address ?? '').toLowerCase().includes(q) ||
        (o.region  ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'All Statuses' || o.status === statusFilter
      const matchRegion =
        regionFilter === 'All Regions' || o.region === regionFilter
      return matchSearch && matchStatus && matchRegion
    })
  }, [outlets, search, statusFilter, regionFilter])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between pl-8 pr-[calc(2rem+15px)] py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-semibold text-gray-900">Outlets</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search..."
              className="pl-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-gray-300"
              style={{ width: '14rem', height: '34px', fontSize: '13px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* ── FILTER / TOOLBAR BAR ── */}
      <OutletToolbar
        view={view}              setView={setView}
        search={search}          setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        regionFilter={regionFilter} setRegionFilter={setRegionFilter}
        regions={regions}
        total={filtered.length}
        onAdd={() => setEditTarget({})}
        onArchive={() => setShowArchive(true)}
      />

      {/* ── CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <p className="text-sm">Loading outlets...</p>
            </div>
          ) : view === 'orders' ? (
            <OutletOrdersView outlets={outlets} />
          ) : view === 'cards' ? (
            <OutletCardGrid
              outlets={filtered}
              onEdit={(o) => setEditTarget(o)}
              onDelete={(o) => setDeleteTarget(o)}
              onViewOrders={(o) => setOrdersTarget(o)}
            />
          ) : (
            <OutletListView
              outlets={filtered}
              onEdit={(o) => setEditTarget(o)}
              onDelete={(o) => setDeleteTarget(o)}
              onViewOrders={(o) => setOrdersTarget(o)}
            />
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-lg font-medium">No outlets found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS / DRAWERS ── */}
      {editTarget !== null && (
        <OutletModal
          outlet={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          regions={regions}
        />
      )}

      {deleteTarget && (
        <OutletDeleteModal
          outlet={deleteTarget}
          onConfirm={handleArchive}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showArchive && (
        <OutletArchiveDrawer
          outlets={archivedOutlets}
          onRestore={handleRestore}
          onPermDelete={handlePermDelete}
          onClose={() => setShowArchive(false)}
        />
      )}

      {/* Per-outlet orders drawer (from card/list view) */}
      {ordersTarget !== null && (
        <OutletOrdersDrawer
          outlet={ordersTarget}
          onClose={() => setOrdersTarget(null)}
        />
      )}
    </div>
  )
}