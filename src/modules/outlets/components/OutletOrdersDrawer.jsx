// src/modules/outlets/components/OutletOrdersDrawer.jsx
import { useState, useEffect } from 'react'
import { X, Trash2, ChevronDown, ChevronRight, Receipt, Tag } from 'lucide-react'

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

function OrderRow({ order, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  // Total line-item count across all groups
  const itemCount = order.groups.reduce((s, g) => s + g.items.length, 0)

  // Recompute discount deductions for display
  let running = order.subtotal
  const discountSteps = order.discounts.map((d) => {
    const deduction = running * (d.value / 100)
    running -= deduction
    return { ...d, deduction }
  })
  const hasDiscount = discountSteps.length > 0

  return (
    <div className="hover:bg-white transition-colors">
      {/* Row header */}
      <div className="flex items-center gap-3 px-6 py-3.5 group">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-800 text-sm truncate">
              {order.seriesNumber}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-800">₱{fmt(order.grandTotal)}</p>
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through">₱{fmt(order.subtotal)}</p>
          )}
        </div>

        <button
          onClick={() => onDelete(order.id)}
          title="Delete order"
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500
                     transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-6 pb-4 pt-1 space-y-3 bg-white border-t border-gray-100">

          {/* Line items by group */}
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
                          <span className="ml-1 text-orange-500">●</span>
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
          <div className="border-t border-gray-200 pt-2 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₱{fmt(order.subtotal)}</span>
            </div>
            {discountSteps.map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-400">
                  <Tag size={10} className="text-orange-400" />
                  {d.name} ({d.value}% off)
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
      )}
    </div>
  )
}

export default function OutletOrdersDrawer({ outlet, onClose }) {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = outlet?.id
        ? await window.electronAPI.getOrdersByOutlet(outlet.id)
        : await window.electronAPI.getOrdersByDefault()
      setOrders(data ?? [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [outlet?.id])

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  // Grand total across all saved orders
  const portfolioTotal = orders.reduce((s, o) => s + o.grandTotal, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">
              {outlet?.name ?? 'Default'} — Orders
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading
                ? 'Loading…'
                : `${orders.length} saved order${orders.length !== 1 ? 's' : ''}${
                    orders.length > 0 ? ` · ₱${portfolioTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total` : ''
                  }`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-6 text-center">
              <Receipt size={36} className="text-gray-200" />
              <p className="font-medium text-gray-500">No saved orders</p>
              <p className="text-sm">
                Enter quantities in Calculations, open the receipt, and save it with a series number.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}