// src/modules/calculations/components/CalculationsReceiptModal.jsx
import { X, Printer, Store, Tag } from 'lucide-react'

const fmt = (n) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CalculationsReceiptModal({
  outletName,
  groups,           // full group list with rows
  qtys,             // { productId: string }
  outletPrices,     // { productId: price }
  discounts,        // [{ id, name, value }]
  onClose,
}) {
  // Collect ordered lines
  const lines = []
  for (const group of groups) {
    const groupLines = []
    for (const row of group.rows) {
      const q = Number(qtys[row.id] ?? 0)
      if (q > 0) {
        const price = outletPrices[row.id] ?? row.price
        groupLines.push({
          description: row.description,
          size:        row.size,
          price,
          qty:         q,
          total:       q * Number(price),
          isOutletPrice: outletPrices[row.id] !== undefined,
        })
      }
    }
    if (groupLines.length > 0) {
      lines.push({ groupName: group.name, items: groupLines })
    }
  }

  // Totals
  const subtotal = lines.reduce((s, g) => s + g.items.reduce((ss, i) => ss + i.total, 0), 0)

  let running = subtotal
  const discountSteps = discounts.map((d) => {
    const deduction = running * (d.value / 100)
    running -= deduction
    return { ...d, deduction }
  })
  const grandTotal = running

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

  const handlePrint = () => window.print()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Order Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200
                         text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Receipt body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" id="receipt-print-area">

          {/* Store info */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-gray-700">
              <Store size={15} className="text-orange-500" />
              <span className="font-bold text-base">{outletName ?? 'Default Prices'}</span>
            </div>
            <p className="text-xs text-gray-400">{dateStr} · {timeStr}</p>
          </div>

          <hr className="border-dashed border-gray-200" />

          {/* Line items grouped */}
          <div className="space-y-4">
            {lines.map((group) => (
              <div key={group.groupName}>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1.5">
                  {group.groupName}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium leading-tight truncate">
                          {item.description}
                          {item.size && <span className="text-gray-400 font-normal ml-1">({item.size})</span>}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.qty} × ₱{fmt(item.price)}
                          {item.isOutletPrice && (
                            <span className="ml-1 text-orange-500">●</span>
                          )}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-800 shrink-0">₱{fmt(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <hr className="border-dashed border-gray-200" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">₱{fmt(subtotal)}</span>
            </div>

            {discountSteps.map((step) => (
              <div key={step.id} className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <Tag size={11} className="text-orange-400" />
                  {step.name} ({step.value}% off)
                </span>
                <span className="text-red-500 font-medium">−₱{fmt(step.deduction)}</span>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900 text-base">Grand Total</span>
              <span className="font-bold text-gray-900 text-xl">₱{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Outlet price legend */}
          {Object.keys(outletPrices).length > 0 && (
            <p className="text-xs text-gray-400 text-center">
              <span className="text-orange-500">●</span> Outlet-specific price
            </p>
          )}
        </div>
      </div>
    </div>
  )
}