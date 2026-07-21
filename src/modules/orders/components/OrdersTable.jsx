// src/modules/orders/components/OrdersTable.jsx
import { useState, useMemo, useEffect, Fragment } from 'react'
import { INITIAL_GROUPS } from '../../products/productData'

import OrdersToolbar      from './OrdersToolbar'
import OrdersGroupHeader  from './OrdersGroupHeader'
import OrdersRow          from './OrdersRow'
import OrdersSummary      from './OrdersSummary'
import OrdersReceiptModal from './OrdersReceiptModal'
import OrdersMonthlySummary from './OrdersMonthlySummary'
import OutletModal from '../../outlets/components/OutletModal'
import { logModuleActivity, buildActivityDetails, snapshotFromFields, OUTLET_LOG_FIELDS } from '../../../lib/activityLog'
import PageGuide from '../../../components/ui/PageGuide'

const COLUMNS = [
  { label: 'No#',              width: 'w-24',  align: 'left'   },
  { label: 'Item Description', width: 'w-auto'                },
  { label: 'Case Barcode',     width: 'w-36',  hidden: true   },
  { label: 'Item Barcode',     width: 'w-36',  hidden: true   },
  { label: 'QTY / Case',       width: 'w-20',  align: 'center' },
  { label: 'Unit Price',       width: 'w-28',  align: 'right'  },
  { label: 'Order Qty',        width: 'w-24',  align: 'center' },
  { label: 'Total',            width: 'w-32',  align: 'right'  },
]

const matchesSearch = (row, term) => {
  const t = term.toLowerCase()
  return (
    row.productNo?.toLowerCase().includes(t) ||
    row.description?.toLowerCase().includes(t) ||
    row.caseBarcode?.toLowerCase().includes(t)  ||
    row.itemBarcode?.toLowerCase().includes(t)
  )
}

export default function OrdersTable({ currentUser, refreshKey = 0, onNavigate }) {
  // ── Product data ─────────────────────────────────────────────────
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(true)

  // ── UI state ─────────────────────────────────────────────────────
  const [mode,           setMode]           = useState('table')   // 'table' | 'summary'
  const [search,         setSearch]         = useState('')
  const [collapsed,      setCollapsed]      = useState({})
  const [showReceipt,    setShowReceipt]    = useState(false)
  const [activityLogOpen, setActivityLogOpen] = useState(false)
  const [isTourMode,      setIsTourMode]      = useState(false)

  // ── Outlet state ─────────────────────────────────────────────────
  const [outlets,          setOutlets]          = useState([])
  const [selectedOutletId, setSelectedOutletId] = useState(null)
  const [outletPrices,     setOutletPrices]     = useState({})   // { productId: price }
  const [outletDiscounts,  setOutletDiscounts]  = useState([])   // all discounts from selected outlet
  const [showAddOutlet,    setShowAddOutlet]    = useState(false)

  // ── Order state ──────────────────────────────────────────────────
  const [qtys, setQtys] = useState({})

  // ── Load products ─────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getProductGroups()
      .then((data) => setGroups(data?.length ? data : INITIAL_GROUPS))
      .catch(() => setGroups(INITIAL_GROUPS))
      .finally(() => setLoading(false))
  }, [refreshKey])

  // ── Load outlets ──────────────────────────────────────────────────
  const loadOutlets = () =>
    window.electronAPI.getOutlets()
      .then((data) => setOutlets(data ?? []))
      .catch(() => setOutlets([]))

  useEffect(() => { loadOutlets() }, [refreshKey])

  // ── Load outlet prices + discounts when outlet changes ────────────
  useEffect(() => {
    if (!selectedOutletId) {
      setOutletPrices({})
      setOutletDiscounts([])
      return
    }
    window.electronAPI.getOutletProductPrices(selectedOutletId)
      .then((map) => setOutletPrices(map ?? {}))
      .catch(() => setOutletPrices({}))

    const outlet = outlets.find(o => o.id === selectedOutletId)
    setOutletDiscounts(outlet?.discounts ?? [])
  }, [selectedOutletId, outlets])

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSelectOutlet = (id) => {
    setSelectedOutletId(id || null)
    setQtys({})
  }

  const handleAddOutletSave = async (payload) => {
    await window.electronAPI.upsertOutlet(payload)
    await logModuleActivity(currentUser, 'orders', 'add', `Outlet: ${payload.name}`, payload.id, buildActivityDetails({
      recordType: 'Outlet',
      recordId: payload.id,
      table: 'outlets',
      snapshot: snapshotFromFields({
        name: payload.name,
        address: payload.address,
        region: payload.region,
        status: payload.status,
        discounts: payload.discounts,
      }, OUTLET_LOG_FIELDS),
      note: 'Added from Orders page',
    }))
    await loadOutlets()
    setSelectedOutletId(payload.id)
    setShowAddOutlet(false)
  }

  const handleQtyChange = (productId, value) => {
    setQtys((prev) => ({ ...prev, [productId]: value }))
  }

  const handleClearAll = () => setQtys({})

  const handleToggleCollapse = (groupId) =>
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }))

  // ── Resolve unit price for a product ─────────────────────────────
  const resolvePrice = (productId, basePrice) => ({
    price:         outletPrices[productId] ?? basePrice,
    isOutletPrice: outletPrices[productId] !== undefined,
  })

  // ── Filtered groups ───────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    return groups
      .map((g) => ({ ...g, rows: g.rows.filter((r) => matchesSearch(r, search)) }))
      .filter((g) => g.rows.length > 0)
  }, [groups, search])

  // ── Tour Guide ───────────────────────────────────────────────────
  const guideSteps = [
    { target: 'body', content: 'Welcome to the Orders module! This page allows you to create bulk product orders, view monthly vanselling performance, and generate invoices.', placement: 'center' },
    { target: '#tour-orders-search', content: 'Use the search bar to quickly find products by name, description, or barcode.', placement: 'bottom' },
    { target: '#tour-orders-view-toggles', content: 'Switch between the main Add Orders table and the Vanselling / Invoice monthly summaries.', placement: 'bottom' },
    { target: '#tour-orders-monthly-summary', content: 'This is the Vanselling summary. It tracks your total amount and orders. The cards give you a quick breakdown of your overall performance.', placement: 'center' },
    { target: '#tour-orders-monthly-summary', content: 'And this is the Invoice summary. It works just like the Vanselling tab but tracks your generated invoices instead.', placement: 'center' },
    { target: '#tour-orders-outlet-selector', content: 'Select an outlet here to automatically apply their specific product discounts and price overrides.', placement: 'bottom' },
    { target: '#tour-orders-table', content: 'This is the main product table. Here you can browse all items grouped by category and input the quantity you want to order.', placement: 'center' },
    { target: 'body', content: 'To save an order, simply input quantities for the items you want. A summary bar will appear at the bottom. Click "View Receipt" to review your totals and save the order as an Invoice or Vanselling record.', placement: 'center' },
    { target: '#tour-orders-activity', content: 'This is the Activity History button. Click Next and we will open it to see the log of changes.', placement: 'bottom' },
    { target: '#tour-activity-log-panel', content: 'This is the Activity Log panel. It slides in from the right and shows everything that has happened in this module.', placement: 'left' },
    { target: '#tour-activity-log-entries', content: 'Each entry shows who made the change, what was changed, and a before and after comparison. Click Next to close the log.', placement: 'left' },
    { target: '#page-tour-help-btn', content: 'You can always click this button to restart the tour anytime!', placement: 'bottom-end' }
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
      if (index === 2) {
        transitionPanel(() => setMode('vanselling'), window.advanceJoyride)
      } else if (index === 3) {
        transitionPanel(() => setMode('invoice'), window.advanceJoyride)
      } else if (index === 4) {
        transitionPanel(() => setMode('table'), window.advanceJoyride)
      } else if (index === 8) {
        transitionPanel(() => setActivityLogOpen(true), window.advanceJoyride, false, 900)
      } else if (index === 10) {
        transitionPanel(() => setActivityLogOpen(false), window.advanceJoyride, true)
      } else {
        window.advanceJoyride?.()
      }
    }

    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 3) {
        transitionPanel(() => setMode('table'), window.retreatJoyride)
      } else if (index === 4) {
        transitionPanel(() => setMode('vanselling'), window.retreatJoyride)
      } else if (index === 5) {
        transitionPanel(() => setMode('invoice'), window.retreatJoyride)
      } else if (index === 9) {
        transitionPanel(() => setActivityLogOpen(false), window.retreatJoyride, true)
      } else if (index === 10) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride)
      } else if (index === 11) {
        transitionPanel(() => setActivityLogOpen(true), window.retreatJoyride)
      } else {
        window.retreatJoyride?.()
      }
    }

    const handleForceClose = () => {
      setActivityLogOpen(false)
      setIsTourMode(false)
    }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour', handleForceClose)
    const handleStartTour = () => {
      setActivityLogOpen(false)
      setMode('table')
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

  // ── Totals ────────────────────────────────────────────────────────
  const { subtotal, lineCount, groupTotals } = useMemo(() => {
    let subtotal  = 0
    let lineCount = 0
    const groupTotals = {}

    for (const group of groups) {
      let gTotal = 0
      for (const row of group.rows) {
        const q = Number(qtys[row.id] ?? 0)
        if (q > 0) {
          const { price } = resolvePrice(row.id, row.price)
          const line = q * Number(price)
          subtotal  += line
          gTotal    += line
          lineCount += 1
        }
      }
      groupTotals[group.id] = gTotal
    }
    return { subtotal, lineCount, groupTotals }
  }, [qtys, groups, outletPrices])

  const hasQty      = lineCount > 0
  const totalItems  = groups.reduce((s, g) => s + g.rows.length, 0)
  const totalGroups = groups.length

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Loading products…
      </div>
    )
  }

  return (
    <>
      <PageGuide steps={guideSteps} storageKey="seen_orders_tour" />
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      <OrdersToolbar
        mode={mode}
        onSetMode={setMode}
        search={search}
        onSearchChange={setSearch}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={handleSelectOutlet}
        onAddOutlet={() => setShowAddOutlet(true)}
        totalItems={totalItems}
        totalGroups={totalGroups}
        hasQty={hasQty}
        onClearAll={handleClearAll}
        currentUser={currentUser}
        refreshKey={refreshKey}
        onNavigate={onNavigate}
        activityLogOpen={activityLogOpen}
        setActivityLogOpen={setActivityLogOpen}
      />

      {/* ── VANSELLING / INVOICE SUMMARY MODE ───────────────────────── */}
      {(mode === 'vanselling' || mode === 'invoice') && (
        <div id="tour-orders-monthly-summary" className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-8 pb-8">
            <OrdersMonthlySummary 
              currentUser={currentUser} 
              refreshKey={refreshKey} 
              type={mode === 'vanselling' ? 'Vanselling' : 'Invoice'} 
              isTourMode={isTourMode}
            />
          </div>
        </div>
      )}

      {/* ── TABLE MODE ───────────────────────────────────────────── */}
      {mode === 'table' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-8 pb-8">
              <div id="tour-orders-table" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm border-collapse">

                  <thead className="sticky top-0 z-10 bg-white border-b border-gray-200">
                    <tr>
                      {COLUMNS.map((col, i) => (
                        <th
                          key={i}
                          className={`px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide
                                      ${col.align === 'right'  ? 'text-right'  : ''}
                                      ${col.align === 'center' ? 'text-center' : 'text-left'}
                                      ${col.width}
                                      ${col.hidden ? 'hidden lg:table-cell' : ''}`}
                        >
                          {col.label}
                          {col.label === 'Unit Price' && selectedOutletId && (
                            <span className="ml-1 font-normal normal-case tracking-normal" style={{ color: 'var(--accent-bg)', opacity: 0.8 }}>
                              (outlet)
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGroups.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                          {search ? 'No products match your search.' : 'No products found.'}
                        </td>
                      </tr>
                    )}

                    {filteredGroups.map((group) => {
                      const groupWithTotal = {
                        ...group,
                        groupTotal: groupTotals[group.id] ?? 0,
                      }
                      return (
                        <Fragment key={group.id}>
                          <OrdersGroupHeader
                            group={groupWithTotal}
                            collapsed={!!collapsed[group.id]}
                            onToggleCollapse={handleToggleCollapse}
                          />
                          {!collapsed[group.id] &&
                            group.rows.map((row, rowIndex) => {
                              const { price, isOutletPrice } = resolvePrice(row.id, row.price)
                              return (
                                <OrdersRow
                                  key={row.id}
                                  row={row}
                                  rowIndex={rowIndex}
                                  qty={qtys[row.id] ?? ''}
                                  onQtyChange={handleQtyChange}
                                  unitPrice={price}
                                  isOutletPrice={isOutletPrice}
                                />
                              )
                            })
                          }
                        </Fragment>
                      )
                    })}
                  </tbody>

                </table>
              </div>

              {/* Helper hint */}
              <p className="text-xs text-gray-400 mt-3 text-center">
                {selectedOutletId
                  ? 'Prices reflect the selected outlet · Orange = outlet-specific price'
                  : 'Enter quantities to calculate totals · Select an outlet to use outlet-specific prices'}
              </p>
            </div>
          </div>

          {/* Summary bar */}
          <OrdersSummary
            subtotal={subtotal}
            discounts={outletDiscounts}
            lineCount={lineCount}
            onViewReceipt={() => setShowReceipt(true)}
          />

          {/* Receipt modal */}
          {showReceipt && (
            <OrdersReceiptModal
              outletId={selectedOutletId}
              outletName={outlets.find(o => o.id === selectedOutletId)?.name ?? null}
              groups={groups}
              qtys={qtys}
              outletPrices={outletPrices}
              discounts={outletDiscounts}
              currentUser={currentUser}
              onClose={() => setShowReceipt(false)}
            />
          )}

          {showAddOutlet && (
            <OutletModal
              outlet={null}
              onSave={handleAddOutletSave}
              onClose={() => setShowAddOutlet(false)}
              regions={[...new Set(outlets.map(o => o.region).filter(Boolean))].sort()}
            />
          )}
        </>
      )}
    </>
  )
}