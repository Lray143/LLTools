// src/modules/orders/components/OrdersSummary.jsx
import { ShoppingCart, Receipt } from 'lucide-react'

export default function OrdersSummary({
  subtotal,
  discounts,        // array from the selected outlet: [{ id, name, value }]
  lineCount,        // how many rows have qty > 0
  onViewReceipt,    // () => void — opens the receipt modal
}) {
  // Apply all discounts sequentially (compound): each discount applies to the result of the previous
  let running = subtotal
  const steps = discounts.map((d) => {
    const deduction = running * (d.value / 100)
    running -= deduction
    return { ...d, deduction, resultAfter: running }
  })
  const grandTotal = running

  const fmt = (n) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (subtotal === 0) return null

  return (
    <div className="border-t px-8 py-4 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-end justify-between gap-6 flex-wrap">

        {/* Left: line count + discount info */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <ShoppingCart size={14} className="text-theme-400" />
            <span>{lineCount} item{lineCount !== 1 ? 's' : ''} in order</span>
          </div>

          {discounts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
              <span className="font-medium">
                {discounts.length} discount{discounts.length !== 1 ? 's' : ''} applied
              </span>
              <span className="text-theme-400">·</span>
              <span>{discounts.map(d => `${d.name} (${d.value}%)`).join(' → ')}</span>
            </div>
          )}
        </div>

        {/* Right: totals + receipt button */}
        <div className="flex items-end gap-6">

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Subtotal</p>
            <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>₱{fmt(subtotal)}</p>
          </div>

          {/* Show each discount step */}
          {steps.map((step) => (
            <div key={step.id} className="text-right">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {step.name} ({step.value}%)
              </p>
              <p className="text-base font-medium text-red-500">−₱{fmt(step.deduction)}</p>
            </div>
          ))}

          <div className="text-right pl-4 border-l" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Grand Total</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>₱{fmt(grandTotal)}</p>
          </div>

          {/* View Receipt */}
          <button
            onClick={onViewReceipt}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '10px',
              border: 'none', background: 'var(--theme-500)',
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Receipt size={14} />
            View Receipt
          </button>
        </div>

      </div>
    </div>
  )
}