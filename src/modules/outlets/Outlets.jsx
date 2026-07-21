// src/modules/outlets/Outlets.jsx
import { useState, useEffect, useMemo, useRef } from 'react'
import { Store, HelpCircle } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import ModuleActivityLog from '../../components/ui/ModuleActivityLog'
import SearchBar from '../../components/ui/SearchBar'
import PageGuide from '../../components/ui/PageGuide'
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
  const [view,            setView]            = useState('cards')
  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('All Statuses')
  const [regionFilter,    setRegionFilter]    = useState('All Regions')
  const [ownershipFilter, setOwnershipFilter] = useState('My Outlets')

  // Modal / drawer state
  const [editTarget,   setEditTarget]   = useState(null)   // outlet obj | {} for new
  const [deleteTarget, setDeleteTarget] = useState(null)   // outlet obj
  const [showArchive,  setShowArchive]  = useState(false)
  const [ordersTarget, setOrdersTarget] = useState(null)   // outlet obj | null
  const [activityLogOpen, setActivityLogOpen] = useState(false)
  const [isTourMode,      setIsTourMode]      = useState(false)

  // ── Data loading ────────────────────────────────────────────────
  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    const [active, archived] = await Promise.all([
      window.electronAPI.getOutlets(),
      window.electronAPI.getArchivedOutlets(),
    ])
    const newActive   = active   ?? []
    const newArchived = archived ?? []
    setOutlets(prev        => JSON.stringify(prev) === JSON.stringify(newActive)   ? prev : newActive)
    setArchivedOutlets(prev => JSON.stringify(prev) === JSON.stringify(newArchived) ? prev : newArchived)
    setLoading(false)
  }

  useEffect(() => { load(refreshKey === 0) }, [refreshKey])

  // ── Handlers ────────────────────────────────────────────────────
  const handleSave = async (payload) => {
    const isNew = !editTarget?.id
    const afterLog = {
      name: payload.name, address: payload.address,
      region: payload.region, status: payload.status, discounts: payload.discounts,
    }
    const payloadToSave = { ...payload }
    if (isNew) payloadToSave.added_by = currentUser?.name || 'Unknown'
    await window.electronAPI.upsertOutlet(payloadToSave)
    if (isNew) {
      await logModuleActivity(currentUser, 'outlets', 'add', payload.name, payload.id, buildActivityDetails({
        recordType: 'Outlet', recordId: payload.id, table: 'outlets',
        snapshot: snapshotFromFields(afterLog, OUTLET_LOG_FIELDS),
      }))
    } else {
      const beforeLog = {
        name: editTarget.name, address: editTarget.address,
        region: editTarget.region, status: editTarget.status, discounts: editTarget.discounts,
      }
      await logModuleActivity(currentUser, 'outlets', 'edit', payload.name, payload.id, buildActivityDetails({
        recordType: 'Outlet', recordId: payload.id, table: 'outlets',
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
      recordType: 'Outlet', recordId: id, table: 'outlets',
      removedSnapshot: outlet ? snapshotFromFields({
        name: outlet.name, address: outlet.address, region: outlet.region,
        status: outlet.status, discounts: outlet.discounts,
      }, OUTLET_LOG_FIELDS) : null,
    }))
    setDeleteTarget(null)
    await load()
  }

  const handleRestore = async (id) => {
    const outlet = archivedOutlets.find(o => o.id === id)
    await window.electronAPI.unarchiveOutlet(id)
    await logModuleActivity(currentUser, 'outlets', 'restore', outlet?.name ?? 'Outlet', id, buildActivityDetails({
      recordType: 'Outlet', recordId: id, table: 'outlets',
      snapshot: outlet ? snapshotFromFields({
        name: outlet.name, address: outlet.address, region: outlet.region,
        status: outlet.status, discounts: outlet.discounts,
      }, OUTLET_LOG_FIELDS) : null,
      note: 'Restored from archive',
    }))
    await load()
  }

  const handlePermDelete = async (id) => {
    const outlet = archivedOutlets.find(o => o.id === id)
    await window.electronAPI.permanentDeleteOutlet(id)
    await logModuleActivity(currentUser, 'outlets', 'permanent_delete', outlet?.name ?? 'Outlet', id, buildActivityDetails({
      recordType: 'Outlet', recordId: id, table: 'outlets',
      removedSnapshot: outlet ? snapshotFromFields({
        name: outlet.name, address: outlet.address, region: outlet.region,
        status: outlet.status, discounts: outlet.discounts,
      }, OUTLET_LOG_FIELDS) : null,
      note: 'Permanently deleted from archive',
    }))
    await load()
  }

  // ── Derived data ─────────────────────────────────────────────────
  const regions = useMemo(() => {
    const set = new Set(outlets.map(o => o.region).filter(Boolean))
    return Array.from(set).sort()
  }, [outlets])

  const TOUR_MOCK_OUTLET = {
    id: 'tour-mock-123',
    name: 'Sample Outlet',
    code: 'SO',
    address: '123 Guide Street',
    region: 'North',
    status: 'Active',
    discounts: [],
    added_by: 'System',
    _isMock: true
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let result = outlets.filter(o => {
      const matchSearch =
        !q ||
        o.name.toLowerCase().includes(q) ||
        (o.code    ?? '').toLowerCase().includes(q) ||
        (o.address ?? '').toLowerCase().includes(q) ||
        (o.region  ?? '').toLowerCase().includes(q)
      const matchStatus    = statusFilter    === 'All Statuses' || o.status    === statusFilter
      const matchRegion    = regionFilter    === 'All Regions'  || o.region    === regionFilter
      const matchOwnership = ownershipFilter === 'All Outlets'  || o.added_by  === currentUser?.name
      return matchSearch && matchStatus && matchRegion && matchOwnership
    })

    if (result.length === 0 && isTourMode) {
      result = [TOUR_MOCK_OUTLET]
    }

    return result
  }, [outlets, search, statusFilter, regionFilter, ownershipFilter, currentUser, isTourMode])

  // Ref so the stable tour useEffect can always read latest filtered
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered

  // ── Tour guide ───────────────────────────────────────────────────
  // Step index map:
  //  0  Welcome (body)
  //  1  Search bar
  //  2  View toggle (Cards / List / Orders)
  //  3  Status filter
  //  4  Region filter
  //  5  Ownership filter
  //  6  Outlet card
  //  7  Add Outlet button  → opens modal on Next
  //  8  Add modal form     → closes modal on Next
  //  9  Archive button     → opens archive on Next
  // 10  Archive panel
  // 11  Archive search/sort
  // 12  Archive list       → closes archive on Next
  // 13  Activity log button
  // 14  Help button

  const guideSteps = [
    {
      target: 'body',
      content: 'Welcome to the Outlets page! This is where you manage all your store locations and client outlets.',
      placement: 'center',
    },
    {
      target: '#tour-outlets-search',
      content: 'Search for any outlet by name, code, address, or region.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-view-toggle',
      content: 'Switch between Cards view for a visual grid, List view for a compact table, and Orders view to see all saved orders across outlets.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-status-filter',
      content: 'Filter outlets by their status, either Active or Inactive.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-region-filter',
      content: 'Narrow down the list to a specific region. Regions are pulled automatically from the outlets you have saved.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-ownership-filter',
      content: 'Toggle between seeing only the outlets you added and all outlets in the system.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-card',
      content: 'This is an outlet card. Hover over it to reveal quick-action buttons for viewing orders, editing, or deleting the outlet.',
      placement: 'right',
    },
    {
      target: '#tour-outlet-add-btn',
      content: 'Click here to add a brand new outlet. Click Next to open the form!',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-modal-form',
      content: 'Fill in the outlet name, address, region, status, and any applicable discounts here. Click Next to close.',
      placement: 'right',
    },
    {
      target: '#tour-outlet-archive-btn',
      content: 'The Archive button opens a side panel with all inactive outlets. Click Next to open it!',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-archive-panel',
      content: 'This is the Archive panel. It lists all outlets that have been removed from the active roster.',
      placement: 'left',
    },
    {
      target: '#tour-outlet-archive-search',
      content: 'Search archived outlets by name or address, and sort the list however you like.',
      placement: 'bottom',
    },
    {
      target: '#tour-outlet-archive-list',
      content: 'Hover over any outlet to reveal the Restore and Delete buttons. Restore brings it back to active, and Delete removes it permanently. Click Next to close.',
      placement: 'left',
    },
    {
      target: '#tour-outlets-activity',
      content: 'This is the Activity History button. It shows a full log of every add, edit, archive, and restore action. Click Next and we will open it!',
      placement: 'bottom',
    },
    {
      target: '#tour-activity-log-panel',
      content: 'This is the Activity Log panel. It slides in from the right and shows everything that has happened in this module.',
      placement: 'left',
    },
    {
      target: '#tour-activity-log-entries',
      content: 'Each entry shows who made the change, what was changed, and a before and after comparison. Click Next to close the log.',
      placement: 'left',
    },
    {
      target: '#page-tour-help-btn',
      content: 'You can always click this button to restart the tour anytime!',
      placement: 'bottom-end',
    },
  ]

  useEffect(() => {
    const transitionPanel = (stateFn, advanceFn, advanceFirst = false, delay = 500) => {
      document.body.classList.add('hide-joyride')
      if (advanceFirst) {
        advanceFn?.()
        setTimeout(() => {
          stateFn()
          document.body.classList.remove('hide-joyride')
        }, delay)
      } else {
        stateFn()
        setTimeout(() => {
          advanceFn?.()
          document.body.classList.remove('hide-joyride')
        }, delay)
      }
    }

    const handleNext = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 7) {
        transitionPanel(() => setEditTarget({}), window.advanceJoyride)   // open add modal
      } else if (index === 8) {
        transitionPanel(() => setEditTarget(null), window.advanceJoyride, true) // close modal
      } else if (index === 9) {
        transitionPanel(() => setShowArchive(true), window.advanceJoyride) // open archive
      } else if (index === 12) {
        transitionPanel(() => setShowArchive(false), window.advanceJoyride, true) // close archive
      } else if (index === 13) {
        transitionPanel(() => setActivityLogOpen(true), window.advanceJoyride, false, 900) // open activity log
      } else if (index === 15) {
        transitionPanel(() => setActivityLogOpen(false), window.advanceJoyride, true) // close activity log
      } else {
        window.advanceJoyride?.()
      }
    }

    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 8) {
        transitionPanel(() => setEditTarget(null), window.retreatJoyride, true)  // going back from modal step 1
      } else if (index === 9) {
        transitionPanel(() => setEditTarget({}), window.retreatJoyride)    // going back reopens modal
      } else if (index === 10) {
        transitionPanel(() => setShowArchive(false), window.retreatJoyride, true) // going back closes archive
      } else if (index === 11) {
        transitionPanel(() => setShowArchive(true), window.retreatJoyride)  // going back reopens archive
      } else if (index === 12) {
        transitionPanel(() => setShowArchive(true), window.retreatJoyride)
      } else if (index === 13) {
        transitionPanel(() => setShowArchive(true), window.retreatJoyride) // from activity log button to archive list
      } else if (index === 14) {
        transitionPanel(() => setActivityLogOpen(false), window.retreatJoyride, true) // going back from log panel closes log
      } else if (index === 15) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride) // going back reopens log
      } else if (index === 16) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride) // going back from help button opens log
      } else {
        window.retreatJoyride?.()
      }
    }

    const handleForceClose = () => {
      setEditTarget(null)
      setShowArchive(false)
      setActivityLogOpen(false)
      setIsTourMode(false)
    }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour', handleForceClose)
    const handleStartTour = () => {
      setEditTarget(null)
      setShowArchive(false)
      setActivityLogOpen(false)
      setView('cards')
      setIsTourMode(true)
    }
    window.addEventListener('start-page-tour', handleStartTour)
    return () => {
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
      window.removeEventListener('force-close-tour', handleForceClose)
      window.removeEventListener('start-page-tour', handleStartTour)
    }
  }, [])

  // ── Render ───────────────────────────────────────────────────────
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
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Outlets
              <button
                id="page-tour-help-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('start-page-tour'))}
                title="Page Guide"
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  width: '24px', height: '24px',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <HelpCircle size={14} />
              </button>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Manage store locations &amp; clients</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div id="tour-outlets-search" style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search outlets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div id="tour-outlets-activity">
            <ModuleActivityLog
              module="outlets"
              refreshKey={refreshKey}
              forceOpen={activityLogOpen}
              onForceClose={() => setActivityLogOpen(false)}
            />
          </div>
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── FILTER / TOOLBAR BAR ── */}
      <OutletToolbar
        view={view}                       setView={setView}
        search={search}                   setSearch={setSearch}
        statusFilter={statusFilter}       setStatusFilter={setStatusFilter}
        regionFilter={regionFilter}       setRegionFilter={setRegionFilter}
        ownershipFilter={ownershipFilter} setOwnershipFilter={setOwnershipFilter}
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
              onEdit={o => setEditTarget(o)}
              onDelete={o => setDeleteTarget(o)}
              onViewOrders={o => setOrdersTarget(o)}
            />
          ) : (
            <OutletListView
              outlets={filtered}
              onEdit={o => setEditTarget(o)}
              onDelete={o => setDeleteTarget(o)}
              onViewOrders={o => setOrdersTarget(o)}
            />
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

      {ordersTarget !== null && (
        <OutletOrdersDrawer
          outlet={ordersTarget}
          onClose={() => setOrdersTarget(null)}
        />
      )}

      <PageGuide
        storageKey="seen_outlets_tour"
        steps={guideSteps}
      />
    </div>
  )
}