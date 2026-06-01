// src/modules/calculations/components/CalculationsTable.jsx
import { useState, useMemo, useEffect, Fragment } from 'react'
import { INITIAL_GROUPS } from '../../products/productData'

import CalculationsToolbar     from './CalculationsToolbar'
import CalculationsGroupHeader from './CalculationsGroupHeader'
import CalculationsRow         from './CalculationsRow'
import CalculationsSummary     from './CalculationsSummary'
import CalculationsReceiptModal from './CalculationsReceiptModal'

const COLUMNS = [
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
    row.description?.toLowerCase().includes(t) ||
    row.caseBarcode?.toLowerCase().includes(t)  ||
    row.itemBarcode?.toLowerCase().includes(t)
  )
}

export default function CalculationsTable() {
  // ── Product data ─────────────────────────────────────────────────
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(true)

  // ── UI state ─────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [collapsed,      setCollapsed]      = useState({})
  const [showReceipt,    setShowReceipt]    = useState(false)

  // ── Outlet state ─────────────────────────────────────────────────
  const [outlets,          setOutlets]          = useState([])
  const [selectedOutletId, setSelectedOutletId] = useState(null)
  const [outletPrices,     setOutletPrices]     = useState({})   // { productId: price }
  const [outletDiscounts,  setOutletDiscounts]  = useState([])   // all discounts from selected outlet

  // ── Order state ──────────────────────────────────────────────────
  const [qtys, setQtys] = useState({})

  // ── Load products ─────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getProductGroups()
      .then((data) => setGroups(data?.length ? data : INITIAL_GROUPS))
      .catch(() => setGroups(INITIAL_GROUPS))
      .finally(() => setLoading(false))
  }, [])

  // ── Load outlets ──────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getOutlets()
      .then((data) => setOutlets(data ?? []))
      .catch(() => setOutlets([]))
  }, [])

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
    <div className="h-full flex flex-col">

      <CalculationsToolbar
        search={search}
        onSearchChange={setSearch}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={handleSelectOutlet}
        totalItems={totalItems}
        totalGroups={totalGroups}
        hasQty={hasQty}
        onClearAll={handleClearAll}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm border-collapse">

            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
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
                      <span className="ml-1 text-orange-400 font-normal normal-case tracking-normal">
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
                    <CalculationsGroupHeader
                      group={groupWithTotal}
                      collapsed={!!collapsed[group.id]}
                      onToggleCollapse={handleToggleCollapse}
                    />
                    {!collapsed[group.id] &&
                      group.rows.map((row, rowIndex) => {
                        const { price, isOutletPrice } = resolvePrice(row.id, row.price)
                        return (
                          <CalculationsRow
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

        <p className="text-xs text-gray-400 mt-3 text-center">
          {selectedOutletId
            ? 'Prices reflect the selected outlet · Orange = outlet-specific price'
            : 'Enter quantities to calculate totals · Select an outlet to use outlet-specific prices'}
        </p>
      </div>

      {/* Summary bar */}
      <CalculationsSummary
        subtotal={subtotal}
        discounts={outletDiscounts}
        lineCount={lineCount}
        onViewReceipt={() => setShowReceipt(true)}
      />

      {/* Receipt modal */}
      {showReceipt && (
        <CalculationsReceiptModal
          outletId={selectedOutletId}
          outletName={outlets.find(o => o.id === selectedOutletId)?.name ?? null}
          groups={groups}
          qtys={qtys}
          outletPrices={outletPrices}
          discounts={outletDiscounts}
          onClose={() => setShowReceipt(false)}
        />
      )}

    </div>
  )
}