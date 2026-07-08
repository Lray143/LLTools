// src/modules/orders/components/OrdersMonthlySummary.jsx
import { logModuleActivity, buildActivityDetails } from '../../../lib/activityLog'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ChevronDown, ChevronRight, Trash2, Receipt,
  TrendingUp, TrendingDown, Calendar, Minus, Download, Archive
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import OrderArchiveDrawer from './OrderArchiveDrawer'
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
const BORDER_THIN   = {
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
const BORDER_MEDIUM = {
  top:    { style: 'medium', color: { argb: 'FF000000' } },
  bottom: { style: 'medium', color: { argb: 'FF000000' } },
  left:   { style: 'medium', color: { argb: 'FF000000' } },
  right:  { style: 'medium', color: { argb: 'FF000000' } },
}

function styleHeaderCell(cell, yellow = true) {
  cell.font      = { bold: true, size: 10, color: { argb: 'FF000000' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border    = BORDER_THIN
  if (yellow) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
  }
}

// Column layout (11 cols — AREA NO. and BOX# removed):
//  1=NO. 2=DATE 3=PRODUCT NAME 4=Outlet 5=SERIES#
//  6=DOC'S QTY 7=ACTUAL QTY 8=OVER/LACKING 9=Discounted Price
//  10=B.O TOTAL AMOUNT 11=AREA
function styleDataCell(cell, colNum, fillArgb) {
  if (colNum > 1) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb ?? GREEN } }
  }
  cell.border = BORDER_THIN
  cell.font   = { name: 'Calibri', size: colNum === 1 ? 11 : 14 }

  if (colNum === 1) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  } else if (colNum === 2) {                        // DATE
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.numFmt    = 'mm-dd-yy'
  } else if (colNum === 3) {                        // PRODUCT NAME
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
  } else if (colNum === 4) {                        // Outlet
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
  } else if (colNum === 5) {                        // SERIES #
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  } else if (colNum === 6) {                        // DOC'S QTY
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  } else if (colNum === 7) {                        // ACTUAL QTY
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  } else if (colNum === 8) {                        // OVER/LACKING
    cell.alignment = { vertical: 'middle' }
    cell.numFmt    = '_(* #,##0_);_(* \\(#,##0\\);_(* "-"??_);_(@_)'
  } else if (colNum === 9) {                        // Discounted Price
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb ?? GREEN } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.numFmt    = ACCT_FMT
  } else if (colNum === 10) {                       // B.O TOTAL AMOUNT
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb ?? GREEN } }
    cell.border    = {
      top:    { style: 'thin',   color: { argb: 'FF000000' } },
      bottom: { style: 'thin',   color: { argb: 'FF000000' } },
      left:   { style: 'medium', color: { argb: 'FF000000' } },
      right:  { style: 'medium', color: { argb: 'FF000000' } },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.numFmt    = ACCT_FMT
    cell.font      = { name: 'Calibri', size: 14, bold: true }
  } else if (colNum === 11) {                       // AREA (region label)
    cell.border    = {
      left:  { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90, wrapText: true }
    cell.font      = { name: 'Algerian', size: 72 }
  }
}

async function exportMonthToXLSX(monthLabel, orders, outletMap = {}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'LLTools Orders'
  wb.created = new Date()

  const ws = wb.addWorksheet(monthLabel)

  // 11 columns: AREA NO. and BOX# removed to match original file
  const COLS = 11

  // ── Column widths ────────────────────────────────────────────
  ws.getColumn(1).width  = 7.43   // A: NO.
  ws.getColumn(2).width  = 18.43  // B: DATE
  ws.getColumn(3).width  = 39.86  // C: PRODUCT NAME
  ws.getColumn(4).width  = 47.71  // D: Outlet       (was E)
  ws.getColumn(5).width  = 8.0    // E: SERIES #     (was F)
  ws.getColumn(6).width  = 10.43  // F: DOC'S QTY    (was H)
  ws.getColumn(7).width  = 8.43   // G: ACTUAL QTY   (was I)
  ws.getColumn(8).width  = 8.0    // H: OVER/LACKING (was J)
  ws.getColumn(9).width  = 16.86  // I: Disc. Price  (was K)
  ws.getColumn(10).width = 23.14  // J: B.O TOTAL    (was L)
  ws.getColumn(11).width = 14.29  // K: AREA         (was M)

  // ── Helper: merged banner row ──────────────────────────────
  const banner = (rowNum, value, opts = {}) => {
    ws.mergeCells(rowNum, 1, rowNum, COLS)
    const cell     = ws.getCell(rowNum, 1)
    cell.value     = value
    cell.font      = { name: opts.fontName ?? 'Calibri', bold: !!opts.bold, size: opts.size ?? 11 }
    cell.alignment = { horizontal: 'center', vertical: 'center' }
    ws.getRow(rowNum).height = opts.height ?? 19.5
  }

  // ── ROWS 1-4: company header ──────────────────────────────
  ws.getRow(1).height = 19.5
  banner(2, 'DOUBLE L BEAUTY PRODUCTS', { fontName: 'Corben', size: 36, height: 55 })
  banner(3, '1081 Quirino Highway, Brgy., Kaligayahan, Novaliches, Quezon City', { fontName: 'Times New Roman', size: 12 })
  banner(4, 'Tel No: 291 3248 Fax No: 288- 5812', { fontName: 'Times New Roman', size: 12 })

  // ── ROWS 5-6: B.O Van Selling ──────────────────────────────
  ws.mergeCells(5, 1, 6, COLS)
  const boCell     = ws.getCell(5, 1)
  boCell.value     = 'B.O VAN SELLING'
  boCell.font      = { name: 'Algerian', bold: true, size: 20 }
  boCell.alignment = { horizontal: 'center', vertical: 'center' }

  // ── ROW 7: Month ──────────────────────────────────────────
  ws.mergeCells(7, 1, 7, COLS)
  const monthCell     = ws.getCell(7, 1)
  monthCell.value     = `MONTH OF ${monthLabel.toUpperCase()}`
  monthCell.font      = { name: 'Calibri', bold: true, size: 12 }
  monthCell.alignment = { horizontal: 'center', vertical: 'center' }
  ws.getRow(7).height = 25.5

  // ── ROW 8: Column headers ─────────────────────────────────
  const HEADER_LABELS = [
    'NO.',              // A  1
    'DATE',             // B  2
    'PRODUCT NAME',     // C  3
    'Outlet',           // D  4
    'SERIES #',         // E  5
    "DOC'S QTY",        // F  6
    'ACTUAL QTY',       // G  7
    'OVER/ LACKING',    // H  8
    'Discounted Price', // I  9
    'B.O TOTAL AMOUNT', // J  10
    'AREA',             // K  11
  ]
  const NO_YELLOW = new Set([])  // all header columns use yellow fill

  ws.getRow(8).height = 44.25
  for (let c = 1; c <= COLS; c++) {
    const cell = ws.getCell(8, c)
    cell.value = HEADER_LABELS[c - 1]
    styleHeaderCell(cell, !NO_YELLOW.has(c))
  }

  // Freeze first 8 rows
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8, activeCell: 'A9' }]

  // ── Region colour palette (cycles if > 8 regions) ──────────────
  const REGION_FILL_PALETTE = [
    'FFA8D08D',  // soft green
    'FFF4B083',  // peach
    'FFBDD6EE',  // light blue
    'FFFFD965',  // yellow
    'FFD4A0C7',  // lavender
    'FFFF9999',  // soft red
    'FF99CCFF',  // sky blue
    'FFFFE599',  // light yellow
  ]

  // ── DATA ROWS ─────────────────────────────────────────────
  // Sort: primary by region name, secondary by date
  const getRegion = (order) => {
    if (order.outletId && outletMap[order.outletId]?.region)
      return outletMap[order.outletId].region
    return order.outletRegion || 'Unknown Region'
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const rA = getRegion(a).toLowerCase()
    const rB = getRegion(b).toLowerCase()
    if (rA < rB) return -1
    if (rA > rB) return 1
    return new Date(a.createdAt) - new Date(b.createdAt)
  })

  let currentRow = 9

  // Region colour tracking
  let regionColorIdx = 0
  const regionFillMap = {}
  const getRegionFill = (region) => {
    if (!regionFillMap[region]) {
      regionFillMap[region] = REGION_FILL_PALETTE[regionColorIdx % REGION_FILL_PALETTE.length]
      regionColorIdx++
    }
    return regionFillMap[region]
  }

  const regionSpans = []        // { region, startRow, endRow }
  let currentRegion   = null
  let regionSpanStart = 9

  // ── Region subtotal row ───────────────────────────────────
  // One summary row per region, same fill colour as the region.
  // F(6)=SUM DOC'S QTY, G(7)=SUM ACTUAL QTY, H(8)=F-G — all bold red.
  const insertRegionSubtotal = (region, regionStart, regionEnd) => {
    const sRow  = currentRow
    const rFill = regionFillMap[region] ?? GREEN
    ws.getRow(sRow).height = 22

    // Fill cols 1-10 with region colour
    for (let c = 1; c <= 10; c++) {
      ws.getCell(sRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rFill } }
    }

    // F (col 6): SUM DOC'S QTY
    const cellF = ws.getCell(sRow, 6)
    cellF.value     = { formula: `SUM(F${regionStart}:F${regionEnd})` }
    cellF.font      = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFF0000' } }
    cellF.alignment = { horizontal: 'center', vertical: 'middle' }
    cellF.border    = {
      left: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } },
      top:  { style: 'medium', color: { argb: 'FF000000' } }, bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }

    // G (col 7): SUM ACTUAL QTY
    const cellG = ws.getCell(sRow, 7)
    cellG.value     = { formula: `SUM(G${regionStart}:G${regionEnd})` }
    cellG.font      = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFF0000' } }
    cellG.alignment = { horizontal: 'center', vertical: 'middle' }
    cellG.border    = {
      left: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } },
      top:  { style: 'medium', color: { argb: 'FF000000' } }, bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }

    // H (col 8): OVER/LACKING diff
    const cellH = ws.getCell(sRow, 8)
    cellH.value     = { formula: `F${sRow}-G${sRow}`, result: 0 }
    cellH.font      = { name: 'Calibri', size: 14, color: { argb: 'FFFF0000' } }
    cellH.alignment = { vertical: 'middle' }
    cellH.numFmt    = '_(* #,##0_);_(* \\(#,##0\\);_(* "-"??_);_(@_)'
    cellH.border    = {
      left: { style: 'thin', color: { argb: 'FF000000' } },
      top:  { style: 'medium', color: { argb: 'FF000000' } }, bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }

    // K (col 11): keep AREA column frame visible
    ws.getCell(sRow, 11).border = {
      left:  { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } },
    }

    currentRow++
  }

  // ── Main data loop ────────────────────────────────────────────
  for (const order of sortedOrders) {
    const allItems = []
    for (const group of order.groups) {
      for (const item of group.items) {
        allItems.push({ ...item, groupName: group.groupName })
      }
    }
    if (allItems.length === 0) continue

    const region      = getRegion(order) || 'Unknown Region'
    const itemCount   = allItems.length
    const dateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-PH', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        })
      : '—'
    const outletLabel = order.outletName || 'Default'

    // Insert subtotal row and reset span when region changes
    if (region !== currentRegion) {
      if (currentRegion !== null) {
        const regionEndRow = currentRow - 1
        regionSpans.push({ region: currentRegion, startRow: regionSpanStart, endRow: regionEndRow })
        insertRegionSubtotal(currentRegion, regionSpanStart, regionEndRow)
      }
      currentRegion   = region
      regionSpanStart = currentRow
    }

    // orderStart MUST be declared AFTER the region check (insertRegionSubtotal increments currentRow)
    const orderStart = currentRow
    const fillArgb   = getRegionFill(region)

    for (let i = 0; i < allItems.length; i++) {
      const item    = allItems[i]
      const isFirst = i === 0

      const productName = item.size
        ? `${item.description} (${item.size})`
        : item.description

      // Auto-height: let Excel expand rows to fit wrapped product names
      // Col 1 (A): product number from products table (falls back to item sequence for old orders)
      const rawNo = item.productNo != null && item.productNo !== '' ? item.productNo : (i + 1)
      ws.getCell(currentRow, 1).value  = isNaN(Number(rawNo)) ? rawNo : Number(rawNo)
      // Col 2 (B): DATE — first row only
      ws.getCell(currentRow, 2).value  = isFirst ? dateFormatted : null
      // Col 3 (C): PRODUCT NAME
      ws.getCell(currentRow, 3).value  = productName
      // Col 4 (D): Outlet — first row only
      ws.getCell(currentRow, 4).value  = isFirst ? outletLabel : null
      // Col 5 (E): SERIES # — first row only
      ws.getCell(currentRow, 5).value  = isFirst ? order.seriesNumber : null
      // Col 6 (F): DOC'S QTY
      ws.getCell(currentRow, 6).value  = item.qty
      // Col 7 (G): ACTUAL QTY
      ws.getCell(currentRow, 7).value  = item.qty
      // Col 8 (H): OVER/LACKING = F - G
      ws.getCell(currentRow, 8).value  = { formula: `F${currentRow}-G${currentRow}`, result: 0 }
      // Col 9 (I): Discounted Price
      ws.getCell(currentRow, 9).value  = item.total ?? (item.qty * item.price)
      // Col 10 (J): B.O TOTAL — SUM of col I for this order (first row only)
      ws.getCell(currentRow, 10).value = isFirst
        ? { formula: `SUM(I${orderStart}:I${orderStart + itemCount - 1})` }
        : null
      // Col 11 (K): AREA — first row only; merged per region below
      ws.getCell(currentRow, 11).value = isFirst ? region : null

      // Apply per-cell styling with region fill
      for (let c = 1; c <= COLS; c++) {
        styleDataCell(ws.getCell(currentRow, c), c, fillArgb)
      }

      currentRow++
    }

    // Merge repeated columns for multi-item orders
    if (itemCount > 1) {
      const endRow = orderStart + itemCount - 1
      // DATE(2), Outlet(4), SERIES#(5), B.O TOTAL(10)
      for (const c of [2, 4, 5, 10]) {
        ws.mergeCells(orderStart, c, endRow, c)
        const mc = ws.getCell(orderStart, c)
        mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
        if (c === 2) {
          mc.border = BORDER_THIN
          mc.alignment = { horizontal: 'center', vertical: 'middle' }
        } else if (c === 4) {
          mc.border = BORDER_THIN
          mc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        } else if (c === 5) {
          mc.border = BORDER_THIN
          mc.alignment = { horizontal: 'center', vertical: 'middle' }
        } else if (c === 10) {
          mc.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } }, bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'medium', color: { argb: 'FF000000' } }, right: { style: 'medium', color: { argb: 'FF000000' } },
          }
          mc.alignment = { horizontal: 'center', vertical: 'middle' }
          mc.numFmt    = ACCT_FMT
          mc.font      = { name: 'Calibri', size: 14, bold: true }
        }
      }
    }
  }

  // Close the last region
  if (currentRegion !== null) {
    const regionEndRow = currentRow - 1
    regionSpans.push({ region: currentRegion, startRow: regionSpanStart, endRow: regionEndRow })
    insertRegionSubtotal(currentRegion, regionSpanStart, regionEndRow)
  }

  // ── Merge col 11 (K/AREA) per region span ─────────────────────
  // Each region: one tall merged cell, rotated Algerian text.
  for (const span of regionSpans) {
    if (span.endRow >= span.startRow) {
      if (span.endRow > span.startRow) {
        ws.mergeCells(span.startRow, 11, span.endRow, 11)
      }
      const mc        = ws.getCell(span.startRow, 11)
      const rFill     = regionFillMap[span.region] ?? GREEN
      const rowCount  = span.endRow - span.startRow + 1
      const charCount = span.region.length || 1
      const dynFontSize = Math.max(8, Math.min(72, Math.floor((rowCount * 20) / (charCount * 0.62))))

      mc.value     = span.region
      mc.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rFill } }
      mc.font      = { name: 'Algerian', size: dynFontSize, bold: true, color: { argb: 'FF000000' } }
      mc.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90, wrapText: true }
      mc.border    = {
        left:   { style: 'medium', color: { argb: 'FF000000' } },
        right:  { style: 'medium', color: { argb: 'FF000000' } },
        top:    { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
      }
    }
  }

  // ── TOTALS FOOTER ────────────────────────────────────────────
  const lastData  = currentRow - 1
  ws.getRow(currentRow).height = 22

  ws.getCell(currentRow, 6).value  = { formula: `SUM(F9:F${lastData})` }   // DOC'S QTY
  ws.getCell(currentRow, 7).value  = { formula: `SUM(G9:G${lastData})` }   // ACTUAL QTY
  ws.getCell(currentRow, 8).value  = { formula: `F${currentRow}-G${currentRow}` } // OVER/LACKING
  ws.getCell(currentRow, 9).value  = { formula: `SUM(I9:I${lastData})` }   // Disc. Price
  ws.getCell(currentRow, 10).value = { formula: `SUM(J9:J${lastData})` }   // B.O TOTAL

  for (let c = 1; c <= COLS; c++) {
    const cell = ws.getCell(currentRow, c)
    cell.font  = { bold: true, size: 10 }
    cell.border = {
      top:    { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'thin',   color: { argb: 'FF000000' } },
      left:   { style: 'thin',   color: { argb: 'FF000000' } },
      right:  { style: 'thin',   color: { argb: 'FF000000' } },
    }
    if (c === 6 || c === 7) cell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (c === 8) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.numFmt    = '_(* #,##0_);_(* \\(#,##0\\);_(* "-"??_);_(@_)'
    }
    if (c === 9 || c === 10) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      cell.numFmt    = ACCT_FMT
    }
  }

  // ── SIGNATURE FOOTER ──────────────────────────────────────
  // 2 blank rows, then the signature block (matches original template)
  currentRow += 2  // skip 2 rows after totals

  const sigRow1 = currentRow      // "PREPARED BY:" / "CHECKED BY:" / "VERIFIED BY:"
  const sigRow2 = currentRow + 1  // Name row
  const sigRow3 = currentRow + 2  // Title row

  ws.getRow(sigRow1).height = 15
  ws.getRow(sigRow2).height = 15
  ws.getRow(sigRow3).height = 15

  // ── Row 1: Labels ─────────────────────────────────────────
  // "PREPARED BY:" starts at col B (2), "CHECKED BY:" at col E (5), "VERIFIED BY:" at col H (8)
  const labelStyle = { bold: true, size: 10, name: 'Calibri' }

  ws.getCell(sigRow1, 2).value = 'PREPARED BY:'
  ws.getCell(sigRow1, 2).font  = labelStyle

  ws.getCell(sigRow1, 5).value = 'CHECKED BY:'
  ws.getCell(sigRow1, 5).font  = labelStyle

  ws.getCell(sigRow1, 8).value = 'VERIFIED BY:'
  ws.getCell(sigRow1, 8).font  = labelStyle

  // ── Row 2: Names (underlined bold) ────────────────────────
  const nameStyle = { bold: true, size: 10, name: 'Calibri', underline: true }

  ws.getCell(sigRow2, 2).value = 'Marjun S. Mallanao'
  ws.getCell(sigRow2, 2).font  = nameStyle

  ws.getCell(sigRow2, 5).value = 'Krizia A. Guerrero'
  ws.getCell(sigRow2, 5).font  = nameStyle

  ws.getCell(sigRow2, 8).value = 'Rubilyn A. Omega'
  ws.getCell(sigRow2, 8).font  = nameStyle

  // ── Row 3: Titles (italic) ────────────────────────────────
  const titleStyle = { italic: true, size: 10, name: 'Calibri' }

  ws.getCell(sigRow3, 2).value = 'Inventory Staff'
  ws.getCell(sigRow3, 2).font  = titleStyle

  ws.getCell(sigRow3, 5).value = 'Jr. Acctg. Supervisor'
  ws.getCell(sigRow3, 5).font  = titleStyle

  ws.getCell(sigRow3, 8).value = 'Sr. Acctg. Supervisor'
  ws.getCell(sigRow3, 8).font  = titleStyle

  // ── DOWNLOAD ───────────────────────────────────────────────
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
function MonthOrdersTable({ orders, onArchiveClick, onDateChange }) {
  const [editingId, setEditingId] = useState(null)
  const [dateVal,   setDateVal]   = useState('')
  const inputRef = useRef(null)

  const startEdit = (order) => {
    setEditingId(order.id)
    // createdAt is like '2026-06-15T00:00:00' or '2026-06-15 00:00:00'
    const iso = order.createdAt.slice(0, 10)
    setDateVal(iso)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const commitEdit = async (orderId) => {
    if (!dateVal) { setEditingId(null); return }
    await onDateChange(orderId, dateVal)
    setEditingId(null)
  }

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-3">
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
                <td className="py-2 text-gray-400 whitespace-nowrap">
                  {editingId === order.id ? (
                    <input
                      ref={inputRef}
                      type="date"
                      value={dateVal}
                      onChange={e => setDateVal(e.target.value)}
                      onBlur={() => commitEdit(order.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(order.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="border border-theme-300 rounded px-1.5 py-0.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-theme-300"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(order)}
                      title="Click to change date"
                      className="flex items-center gap-1 hover:text-theme-500 transition-colors group/date"
                    >
                      {formatDate(order.createdAt)}
                      <span className="opacity-0 group-hover/date:opacity-100 transition-opacity">
                        <Calendar size={10} className="text-theme-400" />
                      </span>
                    </button>
                  )}
                </td>
                <td className="py-2 text-center">
                  <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                </td>
                <td className="py-2 text-right text-gray-500">₱{fmt(order.subtotal)}</td>
                <td className="py-2 text-center">
                  {order.discounts.length > 0 ? (
                    <span className="text-theme-600 font-medium">
                      {order.discounts.map((d) => `${d.value}%`).join(' + ')}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2 text-right font-bold text-gray-800">₱{fmt(order.grandTotal)}</td>
                <td className="py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onArchiveClick(order)}
                    className="p-1 rounded hover:bg-theme-50 text-gray-300 hover:text-theme-500 transition-colors"
                    title="Archive order"
                  >
                    <Archive size={12} />
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
export default function OrdersMonthlySummary({ currentUser, refreshKey = 0, type = 'Vanselling' }) {
  const [orders,         setOrders]         = useState([])
  const [archivedOrders, setArchivedOrders] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [expandedMonths, setExpandedMonths] = useState({})
  const [exportingMonth, setExportingMonth] = useState(null)
  const [showArchive,    setShowArchive]    = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      window.electronAPI.getAllOrders(),
      window.electronAPI.getArchivedOrders()
    ])
      .then(([active, arch]) => {
        const filteredActive = (active ?? []).filter(o => (o.orderType || 'Vanselling') === type)
        const filteredArch = (arch ?? []).filter(o => (o.orderType || 'Vanselling') === type)
        setOrders(filteredActive)
        setArchivedOrders(filteredArch)
      })
      .catch(() => { setOrders([]); setArchivedOrders([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setOrders([])
    setArchivedOrders([])
    loadData()
  }, [refreshKey, type])

  const handleArchive = async () => {
    if (!confirmArchive) return
    const id = confirmArchive.id
    try {
      await window.electronAPI.archiveOrder(id)
      await logModuleActivity(currentUser, 'orders', 'archive', `${type === 'Invoice' ? 'Invoice' : 'Vanselling Order'} ${confirmArchive.seriesNumber}`, id, buildActivityDetails({
        recordType: type === 'Invoice' ? 'Invoice' : 'Saved order',
        recordId: id,
        table: 'saved_orders',
        note: `Archived ${type === 'Invoice' ? 'invoice' : 'saved order'}`,
      }))
      setConfirmArchive(null)
      loadData()
    } catch (e) { console.error(e) }
  }

  const handleRestore = async (id) => {
    const order = archivedOrders.find(o => o.id === id)
    try {
      await window.electronAPI.unarchiveOrder(id)
      await logModuleActivity(currentUser, 'orders', 'restore', order ? `${type === 'Invoice' ? 'Invoice' : 'Vanselling Order'} ${order.seriesNumber}` : (type === 'Invoice' ? 'Invoice' : 'Saved order'), id, buildActivityDetails({
        recordType: type === 'Invoice' ? 'Invoice' : 'Saved order',
        recordId: id,
        table: 'saved_orders',
        note: `Restored ${type === 'Invoice' ? 'invoice' : 'saved order'} from archive`,
      }))
      loadData()
    } catch (e) { console.error(e) }
  }

  const handlePermDelete = async (id) => {
    const order = archivedOrders.find(o => o.id === id)
    try {
      await window.electronAPI.deleteOrder(id)
      await logModuleActivity(currentUser, 'orders', 'permanent_delete', order ? `${type === 'Invoice' ? 'Invoice' : 'Vanselling Order'} ${order.seriesNumber}` : (type === 'Invoice' ? 'Invoice' : 'Saved order'), id, buildActivityDetails({
        recordType: type === 'Invoice' ? 'Invoice' : 'Saved order',
        recordId: id,
        table: 'saved_orders',
        removedSnapshot: order ? {
          'Series #': order.seriesNumber ?? '—',
          Outlet: order.outletName ?? 'Default prices',
          Date: order.createdAt ? formatDate(order.createdAt) : '—',
          'Grand total': order.grandTotal != null ? `₱${fmt(order.grandTotal)}` : '—',
        } : { ID: id },
        note: `Permanently deleted ${type === 'Invoice' ? 'invoice' : 'saved order'}`,
      }))
      loadData()
    } catch (e) { console.error(e) }
  }

  const handleDateChange = async (id, dateStr) => {
    const order = orders.find(o => o.id === id)
    try {
      const isoDate = `${dateStr}T00:00:00`
      const oldDate = order?.orderDate ? order.orderDate.slice(0, 10) : '—'
      await window.electronAPI.updateOrderDate(id, isoDate)
      await logModuleActivity(currentUser, 'orders', 'edit', order ? `${type === 'Invoice' ? 'Invoice' : 'Vanselling Order'} ${order.seriesNumber}` : (type === 'Invoice' ? 'Invoice' : 'Saved order'), id, buildActivityDetails({
        recordType: type === 'Invoice' ? 'Invoice' : 'Saved order',
        recordId: id,
        table: 'saved_orders',
        changes: [{
          field: 'orderDate',
          label: 'Order date',
          before: oldDate,
          after: dateStr,
        }],
      }))
      // Re-fetch so the monthly grouping reflects the new date
      const data = await window.electronAPI.getAllOrders()
      setOrders((data ?? []).filter(o => (o.orderType || 'Vanselling') === type))
    } catch (e) {
      console.error('Failed to update date:', e)
    }
  }

  const toggleMonth = (key) =>
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleExport = async (e, month) => {
    e.stopPropagation() // don't toggle expand when clicking export
    if (exportingMonth) return
    if (type === 'Invoice') {
      // Stub: Do nothing for invoice for now
      console.log('Invoice export not implemented yet')
      return
    }
    setExportingMonth(month.key)
    try {
      // Fetch all outlets so we can resolve outlet → region for each order
      let outletMap = {}
      try {
        const outlets = await window.electronAPI.getOutlets()
        if (Array.isArray(outlets)) {
          outletMap = Object.fromEntries(outlets.map(o => [String(o.id), o]))
        }
      } catch (outletErr) {
        console.warn('Could not load outlets for export:', outletErr)
      }
      await exportMonthToXLSX(formatMonthKey(month.key), month.orders, outletMap)
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

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setShowArchive(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
            >
              <Archive size={13} />
              Archive ({archivedOrders.length})
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Receipt size={40} className="text-gray-200" />
            <p className="font-medium text-gray-500">No saved orders yet</p>
            <p className="text-sm text-center max-w-xs">
              Orders saved from the receipt modal will appear here, grouped by month.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* All-time stat cards */}
          <div className="grid grid-cols-3 gap-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-theme-100 flex items-center justify-center shrink-0">
            <Receipt size={18} className="text-theme-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{allTimeOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-theme-100 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-theme-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Monthly Periods</p>
            <p className="text-2xl font-bold text-gray-900">{monthGroups.length}</p>
            <p className="text-xs text-gray-400">{allTimeItems} line items total</p>
          </div>
        </div>

        <div className="bg-theme-50 rounded-xl border border-theme-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-theme-200 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-theme-600" />
          </div>
          <div>
            <p className="text-xs text-theme-500 uppercase tracking-wide mb-0.5">All-Time Revenue</p>
            <p className="text-2xl font-bold text-theme-700">₱{fmt(allTimeTotal)}</p>
            <p className="text-xs text-theme-400">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchive(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
            >
              <Archive size={13} />
              Archive ({archivedOrders.length})
            </button>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {monthGroups.length} month{monthGroups.length !== 1 ? 's' : ''}
            </span>
          </div>
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
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-theme-50/50 transition-colors group"
                  onClick={() => toggleMonth(month.key)}
                >
                  {/* Expand toggle */}
                  <button className="text-gray-400 group-hover:text-theme-500 transition-colors shrink-0">
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
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-theme-400 to-theme-500 rounded-full transition-all duration-500"
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
                                  ? 'border-theme-300 bg-theme-50 text-theme-500 cursor-wait'
                                  : 'border-gray-200 text-gray-500 hover:border-theme-300 hover:bg-theme-50 hover:text-theme-600'
                                }
                                disabled:opacity-50`}
                  >
                    <Download size={12} className={isExporting ? 'animate-bounce' : ''} />
                    {isExporting ? 'Exporting…' : 'Export'}
                  </button>
                </div>

                {/* Expanded orders */}
                {isExpanded && (
                  <MonthOrdersTable orders={month.orders} onArchiveClick={setConfirmArchive} onDateChange={handleDateChange} />
                )}
              </div>
            )
          })}
        </div>

        {/* Grand total footer */}
        <div className="px-6 py-3 border-t-2 border-gray-200 bg-white flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            All-Time Grand Total
          </span>
          <span className="font-bold text-gray-900">₱{fmt(allTimeTotal)}</span>
        </div>

      </div>
      </>
      )}

      {showArchive && (
        <OrderArchiveDrawer
          orders={archivedOrders}
          onRestore={handleRestore}
          onPermDelete={handlePermDelete}
          onClose={() => setShowArchive(false)}
        />
      )}

      {/* ── CONFIRM ARCHIVE DIALOG ── */}
      <Dialog open={confirmArchive !== null} onOpenChange={val => { if (!val) setConfirmArchive(null) }}>
        <DialogContent className="sm:max-w-sm bg-white border-0 outline-none focus:outline-none ring-0 p-6 z-[60]">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <div className="w-11 h-11 rounded-full bg-theme-50 flex items-center justify-center mb-1">
                <Archive className="w-5 h-5 text-theme-500" />
              </div>
              <DialogTitle className="text-gray-900 font-semibold text-base">Archive this order?</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-500 text-center px-1">
            <span className="font-semibold text-gray-800">{confirmArchive?.seriesNumber}</span> will be moved to the archive. You can restore or permanently delete it there.
          </p>
          <DialogFooter className="gap-2 sm:justify-center mt-3">
            <Button variant="outline" className="border-gray-200 text-gray-600" onClick={() => setConfirmArchive(null)}>
              Cancel
            </Button>
            <Button className="bg-theme-500 hover:bg-theme-600 text-white border-0" onClick={handleArchive}>
              Move to Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
