// src/modules/outlets/Outlets.jsx
import { useState, useEffect, useMemo } from 'react'
import { User, Store } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import ModuleActivityLog from '../../components/ui/ModuleActivityLog'
import SearchBar from '../../components/ui/SearchBar'
import { logModuleActivity, buildActivityDetails, diffFields, snapshotFromFields, OUTLET_LOG_FIELDS } from '../../lib/activityLog'

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
    const isNew = !editTarget?.id
    const afterLog = {
      name: payload.name,
      address: payload.address,
      region: payload.region,
      status: payload.status,
      discounts: payload.discounts,
    }
    await window.electronAPI.upsertOutlet(payload)
    if (isNew) {
      await logModuleActivity(currentUser, 'outlets', 'add', payload.name, payload.id, buildActivityDetails({
        recordType: 'Outlet',
        recordId: payload.id,
        table: 'outlets',
        snapshot: snapshotFromFields(afterLog, OUTLET_LOG_FIELDS),
      }))
    } else {
      const beforeLog = {
        name: editTarget.name,
        address: editTarget.address,
        region: editTarget.region,
        status: editTarget.status,
        discounts: editTarget.discounts,
      }
      await logModuleActivity(currentUser, 'outlets', 'edit', payload.name, payload.id, buildActivityDetails({
        recordType: 'Outlet',
        recordId: payload.id,
        table: 'outlets',
        changes: diffFields(beforeLog, afterLog, OUTLET_LOG_FIELDS),
      }))
    }
    setEditTarget(null)
    await load()
  }

  const handleArchive = async (id) => {
    const outlet = outlets.find(o => o.id === id) ?? deleteTarget
    await window.electronAPI.archiveOutlet(id)
    await logModuleActivity(currentUser, 'outlets', 'archive', outlet?.name ?? 'Outlet', id, buildActivityDetails({
      recordType: 'Outlet',
      recordId: id,
      table: 'outlets',
      removedSnapshot: outlet ? snapshotFromFields({
        name: outlet.name,
        address: outlet.address,
        region: outlet.region,
        status: outlet.status,
        discounts: outlet.discounts,
      }, OUTLET_LOG_FIELDS) : null,
    }))
    setDeleteTarget(null)
    await load()
  }

  const handleRestore = async (id) => {
    await window.electronAPI.unarchiveOutlet(id)
    await load()
  }

  const handlePermDelete = async (id) => {
    const outlet = archivedOutlets.find(o => o.id === id)
    await window.electronAPI.permanentDeleteOutlet(id)
    await logModuleActivity(currentUser, 'outlets', 'permanent_delete', outlet?.name ?? 'Outlet', id, buildActivityDetails({
      recordType: 'Outlet',
      recordId: id,
      table: 'outlets',
      removedSnapshot: outlet ? snapshotFromFields({
        name: outlet.name,
        address: outlet.address,
        region: outlet.region,
        status: outlet.status,
        discounts: outlet.discounts,
      }, OUTLET_LOG_FIELDS) : null,
      note: 'Permanently deleted from archive',
    }))
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Store size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Outlets</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Manage store locations &amp; clients</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search outlets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ModuleActivityLog module="outlets" refreshKey={refreshKey} />
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