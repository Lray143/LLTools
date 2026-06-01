// src/modules/outlets/components/OutletOrdersView.jsx
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Trash2, Tag, Receipt, TrendingUp, Package, Store } from 'lucide-react'

const fmt = (n) =>
  Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  )
}

// ── Expanded row detail ────────────────────────────────────────────
function OrderExpandedDetail({ order }) {
  let running = order.subtotal
  const discountSteps = order.discounts.map((d) => {
    const deduction = running * (d.value / 100)
    running -= deduction
    return { ...d, deduction }
  })

  return (
    <div className="space-y-3">
      {order.groups.map((group) => (
        <div key={group.groupName}>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1.5">
            {group.groupName}
          </p>
          <div className="space-y-1">
            {group.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-700">{item.description}</span>
                  {item.size && (
                    <span className="text-gray-400 ml-1 text-xs">({item.size})</span>
                  )}
                  <p className="text-xs text-gray-400">
                    {item.qty} × ₱{fmt(item.price)}
                    {item.isOutletPrice && (
                      <span className="ml-1 text-orange-500" title="Outlet-specific price">●</span>
                    )}
                  </p>
                </div>
                <span className="text-gray-700 font-medium shrink-0">₱{fmt(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="border-t border-gray-200 pt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span>₱{fmt(order.subtotal)}</span>
        </div>
        {discountSteps.map((d) => (
          <div key={d.id} className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-400">
              <Tag size={9} className="text-orange-400" />
              {d.name} ({d.value}%)
            </span>
            <span className="text-red-500">−₱{fmt(d.deduction)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold text-gray-800 pt-0.5 border-t border-gray-100">
          <span>Grand Total</span>
          <span>₱{fmt(order.grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Individual order row ───────────────────────────────────────────
function OrderRow({ order, onDelete, showOutletCol, colCount }) {
  const [expanded, setExpanded] = useState(false)
  const itemCount    = order.groups.reduce((s, g) => s + g.items.length, 0)
  const hasDiscount  = order.discounts.length > 0

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-orange-50/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand */}
        <td className="px-3 py-3 w-8">
          <span className="text-gray-400 flex items-center justify-center">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </td>

        {/* Series */}
        <td className="px-3 py-3">
          <span className="text-sm font-semibold text-gray-800">{order.seriesNumber}</span>
        </td>

        {/* Date */}
        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
          {formatDate(order.createdAt)}
        </td>

        {/* Outlet (conditional) */}
        {showOutletCol && (
          <td className="px-3 py-3">
            {order.outletName
              ? <span className="text-xs font-medium text-gray-700">{order.outletName}</span>
              : <span className="text-xs text-gray-300 italic">Default</span>
            }
          </td>
        )}

        {/* Item count */}
        <td className="px-3 py-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
        </td>

        {/* Subtotal */}
        <td className="px-3 py-3 text-sm text-gray-500 text-right whitespace-nowrap">
          ₱{fmt(order.subtotal)}
        </td>

        {/* Discounts */}
        <td className="px-3 py-3 text-center">
          {hasDiscount ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {order.discounts.map((d) => (
                <span
                  key={d.id}
                  className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                >
                  {d.name} {d.value}%
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>

        {/* Grand Total */}
        <td className="px-3 py-3 text-right whitespace-nowrap">
          <span className="text-sm font-bold text-gray-900">₱{fmt(order.grandTotal)}</span>
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through">₱{fmt(order.subtotal)}</p>
          )}
        </td>

        {/* Delete */}
        <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onDelete(order.id)}
            title="Delete order"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td
            colSpan={colCount}
            className="px-8 py-4 bg-orange-50/20 border-b border-gray-100"
          >
            <OrderExpandedDetail order={order} />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main OutletOrdersView ──────────────────────────────────────────
export default function OutletOrdersView({ outlets }) {
  const [selectedOutletId, setSelectedOutletId] = useState('__all__')
  const [orders,           setOrders]           = useState([])
  const [loading,          setLoading]          = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      let data
      if      (selectedOutletId === '__all__')     data = await window.electronAPI.getAllOrders()
      else if (selectedOutletId === '__default__') data = await window.electronAPI.getOrdersByDefault()
      else                                         data = await window.electronAPI.getOrdersByOutlet(selectedOutletId)
      setOrders(data ?? [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedOutletId])

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const showOutletCol = selectedOutletId === '__all__'
  // col count: expand + series + date + [outlet?] + items + subtotal + discounts + grandTotal + delete
  const colCount = showOutletCol ? 9 : 8

  const stats = useMemo(() => ({
    totalOrders:  orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.grandTotal, 0),
    totalItems:   orders.reduce((s, o) => s + o.groups.reduce((gs, g) => gs + g.items.length, 0), 0),
  }), [orders])

  const selectedOutletName =
    selectedOutletId === '__all__'     ? 'All Outlets' :
    selectedOutletId === '__default__' ? 'Default (No Outlet)' :
    (outlets.find((o) => o.id === selectedOutletId)?.name ?? 'Unknown')

  return (
    <div>
      {/* Selector + stats row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">

        {/* Outlet selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Store size={14} className={selectedOutletId !== '__all__' ? 'text-orange-500' : 'text-gray-400'} />
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            <option value="__all__">All Outlets</option>
            <option value="__default__">Default (No Outlet)</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 shadow-sm">
            <Receipt size={13} className="text-orange-400" />
            <strong className="text-gray-800">{stats.totalOrders}</strong>&nbsp;order{stats.totalOrders !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 shadow-sm">
            <Package size={13} className="text-orange-400" />
            <strong className="text-gray-800">{stats.totalItems}</strong>&nbsp;line item{stats.totalItems !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm shadow-sm">
            <TrendingUp size={13} className="text-orange-500" />
            <strong className="text-orange-700">₱{fmt(stats.totalRevenue)}</strong>
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Receipt size={40} className="text-gray-200" />
          <p className="font-medium text-gray-500">No orders found</p>
          <p className="text-sm text-center">
            {selectedOutletId === '__all__'
              ? 'No orders have been saved yet.'
              : `No orders found for "${selectedOutletName}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Series #</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                {showOutletCol && (
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Outlet</th>
                )}
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Discounts</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Grand Total</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onDelete={handleDelete}
                  showOutletCol={showOutletCol}
                  colCount={colCount}
                />
              ))}
            </tbody>

            {/* Footer total */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td
                  colSpan={showOutletCol ? 7 : 6}
                  className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  Total — {orders.length} order{orders.length !== 1 ? 's' : ''}
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                  ₱{fmt(stats.totalRevenue)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}