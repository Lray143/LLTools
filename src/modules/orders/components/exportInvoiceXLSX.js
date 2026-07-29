import ExcelJS from 'exceljs'

// ── Formatting helpers ────────────────────────────────────────────
const ACCT_FMT = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)'
const YELLOW   = 'FFFFC000'
const GREEN    = 'FFA8D08D'
const BORDER_THIN   = {
  top:    { style: 'thin',   color: { argb: 'FF000000' } },
  bottom: { style: 'thin',   color: { argb: 'FF000000' } },
  left:   { style: 'thin',   color: { argb: 'FF000000' } },
  right:  { style: 'thin',   color: { argb: 'FF000000' } },
}

function styleHeaderCell(cell, yellow = true) {
  cell.font      = { bold: true, size: 10, color: { argb: 'FF000000' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border    = BORDER_THIN
  if (yellow) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
  }
}

// Column layout (10 cols):
//  1=NO. 2=DATE 3=PRODUCT NAME 4=Outlet 5=SERIES#
//  6=DISCOUNTS 7=QUANTITY 8=Discounted Price
//  9=TOTAL AMOUNT 10=AREA
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
  } else if (colNum === 6) {                        // DISCOUNTS
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.font      = { name: 'Calibri', size: 11 }
  } else if (colNum === 7) {                        // QUANTITY
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  } else if (colNum === 8) {                        // Discounted Price
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb ?? GREEN } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.numFmt    = ACCT_FMT
  } else if (colNum === 9) {                        // TOTAL AMOUNT
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
  } else if (colNum === 10) {                       // AREA (region label)
    cell.border    = {
      left:  { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90, wrapText: true }
    cell.font      = { name: 'Algerian', size: 72 }
  }
}

export async function exportMonthInvoiceToXLSX(monthLabel, orders, outletMap = {}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'LLTools Orders'
  wb.created = new Date()

  const ws = wb.addWorksheet(monthLabel)

  // 10 columns
  const COLS = 10

  // ── Column widths ────────────────────────────────────────────
  ws.getColumn(1).width  = 7.43   // A: NO.
  ws.getColumn(2).width  = 18.43  // B: DATE
  ws.getColumn(3).width  = 39.86  // C: PRODUCT NAME
  ws.getColumn(4).width  = 47.71  // D: Outlet
  ws.getColumn(5).width  = 12.0   // E: SERIES #
  ws.getColumn(6).width  = 14.0   // F: DISCOUNTS
  ws.getColumn(7).width  = 12.43  // G: QUANTITY
  ws.getColumn(8).width  = 16.86  // H: Disc. Price
  ws.getColumn(9).width  = 23.14  // I: TOTAL AMOUNT
  ws.getColumn(10).width = 14.29  // J: AREA

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

  // ── ROWS 5-6: INVOICE ──────────────────────────────
  ws.mergeCells(5, 1, 6, COLS)
  const boCell     = ws.getCell(5, 1)
  boCell.value     = 'INVOICE'
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
    'DISCOUNTS',        // F  6
    'QUANTITY',         // G  7
    'Discounted Price', // H  8
    'TOTAL AMOUNT',     // I  9
    'AREA',             // J  10
  ]

  ws.getRow(8).height = 44.25
  for (let c = 1; c <= COLS; c++) {
    const cell = ws.getCell(8, c)
    cell.value = HEADER_LABELS[c - 1]
    styleHeaderCell(cell, true)
  }

  // Freeze first 8 rows
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8, activeCell: 'A9' }]

  // ── Region colour palette ──────────────────────────────
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

  let regionColorIdx = 0
  const regionFillMap = {}
  const getRegionFill = (region) => {
    if (!regionFillMap[region]) {
      regionFillMap[region] = REGION_FILL_PALETTE[regionColorIdx % REGION_FILL_PALETTE.length]
      regionColorIdx++
    }
    return regionFillMap[region]
  }

  const regionSpans = []
  let currentRegion   = null
  let regionSpanStart = 9

  const insertRegionSubtotal = (region, regionStart, regionEnd) => {
    const sRow  = currentRow
    const rFill = regionFillMap[region] ?? GREEN
    ws.getRow(sRow).height = 22

    for (let c = 1; c <= 9; c++) {
      ws.getCell(sRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rFill } }
    }

    // G (col 7): SUM QUANTITY
    const cellG = ws.getCell(sRow, 7)
    cellG.value     = { formula: `SUM(G${regionStart}:G${regionEnd})` }
    cellG.font      = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFF0000' } }
    cellG.alignment = { horizontal: 'center', vertical: 'middle' }
    cellG.border    = {
      left: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } },
      top:  { style: 'medium', color: { argb: 'FF000000' } }, bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }

    // J (col 10): keep AREA column frame visible
    ws.getCell(sRow, 10).border = {
      left:  { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } },
    }

    currentRow++
  }

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

    // Build discount label e.g. "10% + 5%"
    const discountLabel = Array.isArray(order.discounts) && order.discounts.length > 0
      ? order.discounts.map(d => `${d.value}%`).join(' + ')
      : '—'

    if (region !== currentRegion) {
      if (currentRegion !== null) {
        const regionEndRow = currentRow - 1
        regionSpans.push({ region: currentRegion, startRow: regionSpanStart, endRow: regionEndRow })
        insertRegionSubtotal(currentRegion, regionSpanStart, regionEndRow)
      }
      currentRegion   = region
      regionSpanStart = currentRow
    }

    const orderStart = currentRow
    const fillArgb   = getRegionFill(region)

    for (let i = 0; i < allItems.length; i++) {
      const item    = allItems[i]
      const isFirst = i === 0

      const productName = item.size
        ? `${item.description} (${item.size})`
        : item.description

      const rawNo = item.productNo != null && item.productNo !== '' ? item.productNo : (i + 1)
      ws.getCell(currentRow, 1).value  = isNaN(Number(rawNo)) ? rawNo : Number(rawNo)
      ws.getCell(currentRow, 2).value  = isFirst ? dateFormatted : null
      ws.getCell(currentRow, 3).value  = productName
      ws.getCell(currentRow, 4).value  = isFirst ? outletLabel : null
      ws.getCell(currentRow, 5).value  = isFirst ? order.seriesNumber : null
      ws.getCell(currentRow, 6).value  = isFirst ? discountLabel : null   // DISCOUNTS
      ws.getCell(currentRow, 7).value  = item.qty                          // QUANTITY
      ws.getCell(currentRow, 8).value  = item.total ?? (item.qty * item.price) // Disc. Price
      ws.getCell(currentRow, 9).value  = isFirst
        ? { formula: `SUM(H${orderStart}:H${orderStart + itemCount - 1})` }
        : null                                                               // TOTAL AMOUNT
      ws.getCell(currentRow, 10).value = isFirst ? region : null            // AREA

      for (let c = 1; c <= COLS; c++) {
        styleDataCell(ws.getCell(currentRow, c), c, fillArgb)
      }

      currentRow++
    }

    // Merge repeated columns for multi-item orders
    if (itemCount > 1) {
      const endRow = orderStart + itemCount - 1
      // DATE(2), Outlet(4), SERIES#(5), DISCOUNTS(6), TOTAL AMOUNT(9)
      for (const c of [2, 4, 5, 6, 9]) {
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
        } else if (c === 6) {
          mc.border = BORDER_THIN
          mc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          mc.font      = { name: 'Calibri', size: 11 }
        } else if (c === 9) {
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

  if (currentRegion !== null) {
    const regionEndRow = currentRow - 1
    regionSpans.push({ region: currentRegion, startRow: regionSpanStart, endRow: regionEndRow })
    insertRegionSubtotal(currentRegion, regionSpanStart, regionEndRow)
  }

  // ── Merge col 10 (J/AREA) per region span ─────────────────────
  for (const span of regionSpans) {
    if (span.endRow >= span.startRow) {
      if (span.endRow > span.startRow) {
        ws.mergeCells(span.startRow, 10, span.endRow, 10)
      }
      const mc        = ws.getCell(span.startRow, 10)
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

  ws.getCell(currentRow, 7).value  = { formula: `SUM(G9:G${lastData})` }   // QUANTITY
  ws.getCell(currentRow, 8).value  = { formula: `SUM(H9:H${lastData})` }   // Disc. Price
  ws.getCell(currentRow, 9).value  = { formula: `SUM(I9:I${lastData})` }   // TOTAL AMOUNT

  for (let c = 1; c <= COLS; c++) {
    const cell = ws.getCell(currentRow, c)
    cell.font  = { bold: true, size: 10 }
    cell.border = {
      top:    { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'thin',   color: { argb: 'FF000000' } },
      left:   { style: 'thin',   color: { argb: 'FF000000' } },
      right:  { style: 'thin',   color: { argb: 'FF000000' } },
    }
    if (c === 7) cell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (c === 8 || c === 9) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      cell.numFmt    = ACCT_FMT
    }
  }

  // ── DOWNLOAD ───────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `invoice-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
