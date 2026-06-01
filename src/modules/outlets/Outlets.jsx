// src/modules/outlets/Outlets.jsx
import { useState, useEffect, useMemo } from 'react'

import OutletToolbar       from './components/OutletToolbar'
import OutletCardGrid      from './components/OutletCardGrid'
import OutletListView      from './components/OutletListView'
import OutletOrdersView    from './components/OutletOrdersView'
import OutletModal         from './components/OutletModal'
import OutletDeleteModal   from './components/OutletDeleteModal'
import OutletArchiveDrawer from './components/OutletArchiveDrawer'
import OutletOrdersDrawer  from './components/OutletOrdersDrawer'

export default function Outlets() {
  const [outlets,         setOutlets]         = useState([])
  const [archivedOutlets, setArchivedOutlets] = useState([])
  const [loading,         setLoading]         = useState(true)

  // UI state — 'cards' | 'list' | 'orders'
  const [view,         setView]         = useState('cards')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  // Modal state
  const [editTarget,   setEditTarget]   = useState(null)   // outlet obj | {} for new
  const [deleteTarget, setDeleteTarget] = useState(null)   // outlet obj
  const [showArchive,  setShowArchive]  = useState(false)
  const [ordersTarget, setOrdersTarget] = useState(null)   // outlet obj | null

  // ── Data loading ────────────────────────────────────────────────
  const load = async () => {
    setLoading(true)
    const [active, archived] = await Promise.all([
      window.electronAPI.getOutlets(),
      window.electronAPI.getArchivedOutlets(),
    ])
    setOutlets(active    ?? [])
    setArchivedOutlets(archived ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── CRUD handlers ───────────────────────────────────────────────
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

  // ── Filtered list (for cards + list views only) ─────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return outlets.filter((o) => {
      const matchSearch =
        !q ||
        o.name.toLowerCase().includes(q) ||
        (o.code    ?? '').toLowerCase().includes(q) ||
        (o.address ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'All Statuses' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [outlets, search, statusFilter])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-5">Outlets</h1>

      {/* Toolbar */}
      <OutletToolbar
        view={view}              setView={setView}
        search={search}          setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        total={filtered.length}
        onAdd={() => setEditTarget({})}
        onArchive={() => setShowArchive(true)}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <p>Loading outlets…</p>
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

      {/* Add / Edit modal */}
      {editTarget !== null && (
        <OutletModal
          outlet={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Archive/delete confirm */}
      {deleteTarget && (
        <OutletDeleteModal
          outlet={deleteTarget}
          onConfirm={handleArchive}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Archive drawer */}
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