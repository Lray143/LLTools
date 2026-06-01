// src/modules/calculations/components/CalculationsMonthlySummary.jsx
import { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown, ChevronRight, Trash2, Receipt,
  TrendingUp, TrendingDown, Calendar, Minus, Download,
} from 'lucide-react'
import ExcelJS from 'exceljs'

// ── Formatting helpers ────────────────────────────────────────────
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

const getMonthKey = (dateStr) => {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const formatMonthKey = (key) => {
  if (key === 'Unknown') return 'Unknown Date'
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
}

// ── XLSX export (Vanselling format) ──────────────────────────────
const ACCT_FMT = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)'
const YELLOW   = 'FFFFC000'
const GREEN    = 'FFA8D08D'
const BORDER_THIN = {
  top:    { style: 'thin',   color: { argb: 'FF000000' } },
  bottom: { style: 'thin',   color: { argb: 'FF000000' } },
  left:   { style: 'thin',   color: { argb: 'FF000000' } },
  right:  { style: 'thin',   color: { argb: 'FF000000' } },
}
const BORDER_DATA = {
  top:    { style: 'thin', color: { argb: 'FFD0C8BC' } },
  bottom: { style: 'thin', color: { argb: 'FFD0C8BC' } },
  left:   { style: 'thin', color: { argb: 'FFD0C8BC' } },
  right:  { style: 'thin', color: { argb: 'FFD0C8BC' } },
}

function styleHeaderCell(cell, yellow = true) {
  cell.font      = { bold: true, size: 10, color: { argb: 'FF000000' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border    = BORDER_THIN
  if (yellow) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
  }
}

function styleDataCell(cell, colNum) {
  // Column A (NO.) has no fill in the original
  if (colNum > 1) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }
  }
  cell.border = BORDER_DATA
  cell.font   = { size: 10 }

  if (colNum === 1) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  } else if (colNum === 2) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  } else if (colNum === 3) {
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
  } else if (colNum === 4) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  } else if (colNum === 5 || colNum === 6 || colNum === 13) {
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
  } else if (colNum >= 7 && colNum <= 10) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  } else if (colNum === 11 || colNum === 12) {
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    cell.numFmt    = ACCT_FMT
  }
}

async function exportMonthToXLSX(monthLabel, orders) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'LLTools Calculations'
  wb.created = new Date()

  const ws = wb.addWorksheet(monthLabel)

  // ── Column widths (matching Vanselling exactly) ───────────────
  ws.getColumn(1).width  = 7.43   // A: NO.
  ws.getColumn(2).width  = 18.43  // B: DATE
  ws.getColumn(3).width  = 39.86  // C: PRODUCT NAME
  ws.getColumn(4).width  = 6.43   // D: AREA NO.
  ws.getColumn(5).width  = 47.71  // E: Outlet
  ws.getColumn(6).width  = 8.0    // F: SERIES #
  ws.getColumn(7).width  = 14.86  // G: BOX#
  ws.getColumn(8).width  = 10.43  // H: DOC'S QTY
  ws.getColumn(9).width  = 8.43   // I: ACTUAL QTY
  ws.getColumn(10).width = 8.0    // J: OVER/LACKING
  ws.getColumn(11).width = 16.86  // K: Discounted Price
  ws.getColumn(12).width = 23.14  // L: B.O TOTAL AMOUNT
  ws.getColumn(13).width = 14.29  // M: AREA

  const COLS = 13

  // Helper: style a merged banner row
  const banner = (rowNum, value, opts = {}) => {
    ws.mergeCells(rowNum, 1, rowNum, COLS)
    const cell           = ws.getCell(rowNum, 1)
    cell.value           = value
    cell.font            = { bold: !!opts.bold, size: opts.size ?? 11 }
    cell.alignment       = { horizontal: 'left', vertical: 'middle', indent: 1 }
    ws.getRow(rowNum).height = opts.height ?? 19.5
  }

  // ── ROWS 1-4: company header ──────────────────────────────────
  ws.getRow(1).height = 19.5
  banner(2, 'DOUBLE L BEAUTY PRODUCTS', { size: 12, height: 29.25 })
  banner(3, '1081 Quirino Highway, Brgy., Kaligayahan, Novaliches, Quezon City')
  banner(4, 'Tel No: 291 3248 Fax No: 288- 5812')

  // ── ROWS 5-6: B.O Van selling (tall merged block) ────────────
  ws.mergeCells(5, 1, 6, 10)
  const boCell        = ws.getCell(5, 1)
  boCell.value        = 'B.O Van selling'
  boCell.font         = { bold: true, size: 12 }
  boCell.alignment    = { horizontal: 'left', vertical: 'middle', indent: 1 }

  // ── ROW 7: Month of … ─────────────────────────────────────────
  ws.mergeCells(7, 1, 7, 10)
  const monthCell     = ws.getCell(7, 1)
  monthCell.value     = `MONTH OF ${monthLabel.toUpperCase()}`
  monthCell.font      = { bold: true, size: 11 }
  monthCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws.getRow(7).height = 25.5

  // ── ROW 8: Column headers ─────────────────────────────────────
  const HEADER_LABELS = [
    'NO.',              // A  1
    'DATE',             // B  2
    'PRODUCT NAME',     // C  3
    'AREA NO.',         // D  4
    'Outlet',           // E  5
    'SERIES #',         // F  6
    'BOX#',             // G  7
    "DOC'S QTY",        // H  8
    'ACTUAL QTY',       // I  9
    'OVER/ LACKING',    // J  10
    'Discounted Price', // K  11  ← no yellow fill
    'B.O TOTAL AMOUNT', // L  12  ← no yellow fill
    'AREA',             // M  13
  ]
  const NO_YELLOW = new Set([11, 12])  // K, L

  ws.getRow(8).height = 44.25
  for (let c = 1; c <= COLS; c++) {
    const cell  = ws.getCell(8, c)
    cell.value  = HEADER_LABELS[c - 1]
    styleHeaderCell(cell, !NO_YELLOW.has(c))
  }

  // Freeze first 8 rows
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8, activeCell: 'A9' }]

  // ── DATA ROWS ─────────────────────────────────────────────────
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  let currentRow = 9
  let areaSeq    = 1       // sequential area/order number per month
  let totalDocsQty = 0     // for footer totals

  for (const order of sortedOrders) {
    // Flatten all items across all groups in this order
    const allItems = []
    for (const group of order.groups) {
      for (const item of group.items) {
        allItems.push({ ...item, groupName: group.groupName })
      }
    }
    if (allItems.length === 0) continue

    const orderStart = currentRow
    const itemCount  = allItems.length
    const dateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-PH', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        })
      : '—'
    const outletLabel = order.outletName || 'Default'

    for (let i = 0; i < allItems.length; i++) {
      const item    = allItems[i]
      const isFirst = i === 0
      const row     = ws.getRow(currentRow)
      row.height    = 26.25

      const productName = item.size
        ? `${item.description} (${item.size})`
        : item.description

      // A: item sequence within this order (1, 2, 3…)
      ws.getCell(currentRow, 1).value  = i + 1
      // B: DATE — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 2).value  = isFirst ? dateFormatted : null
      // C: PRODUCT NAME
      ws.getCell(currentRow, 3).value  = productName
      // D: AREA NO. — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 4).value  = isFirst ? areaSeq : null
      // E: Outlet — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 5).value  = isFirst ? outletLabel : null
      // F: SERIES # — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 6).value  = isFirst ? order.seriesNumber : null
      // G: BOX# — blank
      ws.getCell(currentRow, 7).value  = null
      // H: DOC'S QTY
      ws.getCell(currentRow, 8).value  = item.qty
      // I: ACTUAL QTY (same as DOC'S for us)
      ws.getCell(currentRow, 9).value  = item.qty
      // J: OVER / LACKING
      ws.getCell(currentRow, 10).value = 0
      // K: Discounted Price (line total = qty × price)
      ws.getCell(currentRow, 11).value = item.total ?? (item.qty * item.price)
      // L: B.O TOTAL AMOUNT — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 12).value = isFirst ? order.grandTotal : null
      // M: AREA — only on first row; rest blank (will be merged)
      ws.getCell(currentRow, 13).value = isFirst ? outletLabel : null

      // Make L on first row bold (matching original)
      if (isFirst) {
        ws.getCell(currentRow, 12).font = { bold: true, size: 10 }
      }

      // Apply per-cell styling
      for (let c = 1; c <= COLS; c++) {
        styleDataCell(ws.getCell(currentRow, c), c)
      }

      totalDocsQty += Number(item.qty)
      currentRow++
    }

    // Merge repeated columns for multi-item orders
    if (itemCount > 1) {
      const endRow = orderStart + itemCount - 1
      const MERGE_COLS = [2, 4, 5, 6, 12, 13] // B, D, E, F, L, M
      for (const c of MERGE_COLS) {
        ws.mergeCells(orderStart, c, endRow, c)
        // Re-apply alignment on the merged cell
        const mc = ws.getCell(orderStart, c)
        mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }
        if (c === 2)  mc.alignment = { horizontal: 'center', vertical: 'middle' }
        if (c === 4)  mc.alignment = { horizontal: 'center', vertical: 'middle' }
        if (c === 5)  mc.alignment = { horizontal: 'left',   vertical: 'middle' }
        if (c === 6)  mc.alignment = { horizontal: 'center', vertical: 'middle' }
        if (c === 12) mc.alignment = { horizontal: 'right',  vertical: 'middle' }
        if (c === 13) mc.alignment = { horizontal: 'left',   vertical: 'middle' }
      }
    }

    areaSeq++
  }

  // ── TOTALS FOOTER ─────────────────────────────────────────────
  const footerRow = ws.getRow(currentRow)
  footerRow.height = 22

  ws.getCell(currentRow, 8).value  = totalDocsQty
  ws.getCell(currentRow, 9).value  = totalDocsQty
  ws.getCell(currentRow, 10).value = 0

  for (let c = 1; c <= COLS; c++) {
    const cell    = ws.getCell(currentRow, c)
    cell.font     = { bold: true, size: 10 }
    cell.border   = {
      top:    { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'thin',   color: { argb: 'FF000000' } },
      left:   { style: 'thin',   color: { argb: 'FF000000' } },
      right:  { style: 'thin',   color: { argb: 'FF000000' } },
    }
    if (c === 8 || c === 9 || c === 10) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
  }

  // ── DOWNLOAD ──────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `vanselling-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Expanded month orders table ───────────────────────────────────
function MonthOrdersTable({ orders, onDelete }) {
  return (
    <div className="bg-gray-50/60 border-t border-gray-100 px-6 py-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 uppercase tracking-wide">
            <th className="pb-2 text-left font-semibold">Series #</th>
            <th className="pb-2 text-left font-semibold">Outlet</th>
            <th className="pb-2 text-left font-semibold">Date</th>
            <th className="pb-2 text-center font-semibold">Items</th>
            <th className="pb-2 text-right font-semibold">Subtotal</th>
            <th className="pb-2 text-center font-semibold">Discounts</th>
            <th className="pb-2 text-right font-semibold">Grand Total</th>
            <th className="pb-2 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const itemCount = order.groups.reduce((s, g) => s + g.items.length, 0)
            return (
              <tr key={order.id} className="hover:bg-white transition-colors group">
                <td className="py-2 font-semibold text-gray-700">{order.seriesNumber}</td>
                <td className="py-2 text-gray-500">
                  {order.outletName
                    ? order.outletName
                    : <span className="text-gray-300 italic">Default</span>
                  }
                </td>
                <td className="py-2 text-gray-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                <td className="py-2 text-center">
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                </td>
                <td className="py-2 text-right text-gray-500">₱{fmt(order.subtotal)}</td>
                <td className="py-2 text-center">
                  {order.discounts.length > 0 ? (
                    <span className="text-orange-600 font-medium">
                      {order.discounts.map((d) => `${d.value}%`).join(' + ')}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2 text-right font-bold text-gray-800">₱{fmt(order.grandTotal)}</td>
                <td className="py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDelete(order.id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete order"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td colSpan={6} className="pt-2 text-right text-gray-500 font-semibold uppercase text-xs tracking-wide">
              Month Total
            </td>
            <td className="pt-2 text-right font-bold text-gray-900">
              ₱{fmt(orders.reduce((s, o) => s + o.grandTotal, 0))}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Trend indicator ───────────────────────────────────────────────
function TrendBadge({ current, previous }) {
  if (previous == null) return null
  if (current === previous) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-gray-400 ml-1">
        <Minus size={10} /> flat
      </span>
    )
  }
  const pct = Math.round(Math.abs((current - previous) / previous) * 100)
  const up  = current > previous
  return (
    <span className={`flex items-center gap-0.5 text-xs ml-1 font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pct}%
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function CalculationsMonthlySummary() {
  const [orders,         setOrders]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [expandedMonths, setExpandedMonths] = useState({})
  const [exportingMonth, setExportingMonth] = useState(null) // key of month being exported

  useEffect(() => {
    window.electronAPI.getAllOrders()
      .then((data) => setOrders(data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const toggleMonth = (key) =>
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleExport = async (e, month) => {
    e.stopPropagation() // don't toggle expand when clicking export
    if (exportingMonth) return
    setExportingMonth(month.key)
    try {
      await exportMonthToXLSX(formatMonthKey(month.key), month.orders)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExportingMonth(null)
    }
  }

  // Group orders by YYYY-MM, sorted newest first
  const monthGroups = useMemo(() => {
    const map = {}
    for (const order of orders) {
      const key = getMonthKey(order.createdAt)
      if (!map[key]) map[key] = { key, orders: [], total: 0, itemCount: 0 }
      map[key].orders.push(order)
      map[key].total     += order.grandTotal
      map[key].itemCount += order.groups.reduce((s, g) => s + g.items.length, 0)
    }
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key))
  }, [orders])

  const allTimeTotal  = orders.reduce((s, o) => s + o.grandTotal, 0)
  const allTimeOrders = orders.length
  const allTimeItems  = orders.reduce(
    (s, o) => s + o.groups.reduce((gs, g) => gs + g.items.length, 0), 0
  )
  const maxRevenue = Math.max(...monthGroups.map((m) => m.total), 1)

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Loading orders…
      </div>
    )
  }

  // ── Empty ─────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Receipt size={40} className="text-gray-200" />
        <p className="font-medium text-gray-500">No saved orders yet</p>
        <p className="text-sm text-center max-w-xs">
          Orders saved from the receipt modal will appear here, grouped by month.
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* All-time stat cards */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Receipt size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{allTimeOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Monthly Periods</p>
            <p className="text-2xl font-bold text-gray-900">{monthGroups.length}</p>
            <p className="text-xs text-gray-400">{allTimeItems} line items total</p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl border border-orange-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-orange-500 uppercase tracking-wide mb-0.5">All-Time Revenue</p>
            <p className="text-2xl font-bold text-orange-700">₱{fmt(allTimeTotal)}</p>
            <p className="text-xs text-orange-400">
              avg ₱{fmt(allTimeTotal / allTimeOrders)} / order
            </p>
          </div>
        </div>

      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Monthly Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any month to expand · Use the export button to download</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {monthGroups.length} month{monthGroups.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {monthGroups.map((month, idx) => {
            const isExpanded   = !!expandedMonths[month.key]
            const widthPct     = (month.total / maxRevenue) * 100
            const prevMonth    = monthGroups[idx + 1]
            const avgPerOrder  = month.total / month.orders.length
            const isExporting  = exportingMonth === month.key

            return (
              <div key={month.key}>
                {/* Month row */}
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-orange-50/40 transition-colors group"
                  onClick={() => toggleMonth(month.key)}
                >
                  {/* Expand toggle */}
                  <button className="text-gray-400 group-hover:text-orange-500 transition-colors shrink-0">
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {/* Month name + meta */}
                  <div className="w-44 shrink-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-gray-800 text-sm">{formatMonthKey(month.key)}</p>
                      <TrendBadge current={month.total} previous={prevMonth?.total} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {month.orders.length} order{month.orders.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
                      {month.itemCount} item{month.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Mini bar */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  {/* Revenue */}
                  <div className="text-right shrink-0 w-36">
                    <p className="font-bold text-gray-900 text-sm">₱{fmt(month.total)}</p>
                    <p className="text-xs text-gray-400">
                      avg ₱{fmt(avgPerOrder)} / order
                    </p>
                  </div>

                  {/* Export button */}
                  <button
                    onClick={(e) => handleExport(e, month)}
                    disabled={!!exportingMonth}
                    title={`Export ${formatMonthKey(month.key)} to Excel`}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
                                transition-colors
                                ${isExporting
                                  ? 'border-orange-300 bg-orange-50 text-orange-500 cursor-wait'
                                  : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                                }
                                disabled:opacity-50`}
                  >
                    <Download size={12} className={isExporting ? 'animate-bounce' : ''} />
                    {isExporting ? 'Exporting…' : 'Export'}
                  </button>
                </div>

                {/* Expanded orders */}
                {isExpanded && (
                  <MonthOrdersTable orders={month.orders} onDelete={handleDelete} />
                )}
              </div>
            )
          })}
        </div>

        {/* Grand total footer */}
        <div className="px-6 py-3 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            All-Time Grand Total
          </span>
          <span className="font-bold text-gray-900">₱{fmt(allTimeTotal)}</span>
        </div>

      </div>
    </div>
  )
}