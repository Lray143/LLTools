// ─────────────────────────────────────────────────────────────
// exportToXLSX.js
// ─────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs'
import { STATUS_XLSX } from './myAttendanceConstants'

// Formats the extraTaps array into a readable string for the sheet:
// e.g. [{ type:'IN', time:'12:01 PM' }, { type:'OUT', time:'3:45 PM' }]
//   → "IN 12:01 PM  ·  OUT 3:45 PM"
function formatExtraTaps(extraTaps) {
  if (!extraTaps || extraTaps.length === 0) return null
  return extraTaps.map(t => `${t.type} ${t.time}`).join('  ·  ')
}

export async function exportToXLSX(records, filename, label = '') {
  const wb   = new ExcelJS.Workbook()
  wb.creator = 'LLTools Biometrics'
  wb.created = new Date()

  const ws = wb.addWorksheet('Attendance')

  // ── Column definitions ──────────────────────────────────────
  ws.columns = [
    { header: 'Employee ID',  key: 'id',          width: 14 },
    { header: 'Name',         key: 'name',         width: 24 },
    { header: 'Department',   key: 'department',   width: 16 },
    { header: 'Time Frame',   key: 'timeframe',    width: 30 },
    { header: 'Shift In',     key: 'shiftIn',      width: 12 },
    { header: 'Lunch Out',    key: 'lunchOut',     width: 12 },
    { header: 'Lunch In',     key: 'lunchIn',      width: 12 },
    { header: 'Shift Out',    key: 'shiftOut',     width: 12 },
    { header: 'Total Hours',  key: 'totalHours',   width: 14 },
    { header: 'Status',       key: 'status',       width: 18 },
    { header: 'Extra Taps',   key: 'extraTaps',    width: 32 },
  ]

  const TOTAL_COLS = 11

  // ── Row 1: subtitle / filter label ─────────────────────────
  ws.spliceRows(1, 0, [label])
  ws.mergeCells(1, 1, 1, TOTAL_COLS)
  const titleCell = ws.getCell('A1')
  titleCell.value     = label
  titleCell.font      = { bold: true, color: { argb: 'FFF97316' }, size: 12 }
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F2' } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  titleCell.border    = {
    bottom: { style: 'medium', color: { argb: 'FFF97316' } },
  }
  ws.getRow(1).height = 26

  // ── Row 2: column headers ────────────────────────────────────
  const headerRow = ws.getRow(2)
  headerRow.height = 22
  headerRow.eachCell((cell, colNum) => {
    // Extra Taps header gets a distinct orange-tinted style
    // so it reads as a supplemental column, not a core one
    const isExtraCol = colNum === TOTAL_COLS
    cell.font      = {
      bold  : true,
      color : { argb: isExtraCol ? 'FFEA8A3A' : 'FFF97316' },
      size  : 11,
    }
    cell.fill      = {
      type    : 'pattern',
      pattern : 'solid',
      fgColor : { argb: isExtraCol ? 'FFFFF3E8' : 'FFF5F2EC' },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = {
      bottom: { style: 'medium', color: { argb: isExtraCol ? 'FFEA8A3A' : 'FFF97316' } },
      top:    { style: 'thin',   color: { argb: 'FFE5DDD0' } },
      left:   { style: 'thin',   color: { argb: 'FFE5DDD0' } },
      right:  { style: 'thin',   color: { argb: 'FFE5DDD0' } },
    }
  })

  // Freeze rows 1+2
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }]

  // ── Data rows (start at row 3) ───────────────────────────────
  records.forEach((r, idx) => {
    const extraTapsStr = formatExtraTaps(r.extraTaps)

    const row = ws.addRow({
      id         : r.id,
      name       : r.name,
      department : r.department,
      timeframe  : r.timeframe,
      shiftIn    : r.shiftIn    || '—',
      lunchOut   : r.lunchOut   || '—',
      lunchIn    : r.lunchIn    || '—',
      shiftOut   : r.shiftOut   || '—',
      totalHours : r.totalHours ?? '—',
      status     : r.status,
      extraTaps  : extraTapsStr || '—',
    })

    row.height  = 18
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFAF9F6'
    const s     = STATUS_XLSX[r.status] || { fill: 'FFFFFFFF', font: 'FF2C2010' }
    const hasExtra = !!extraTapsStr

    row.eachCell((cell, colNum) => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFF0EBE3' } },
        bottom: { style: 'thin', color: { argb: 'FFF0EBE3' } },
        left:   { style: 'thin', color: { argb: 'FFF0EBE3' } },
        right:  { style: 'thin', color: { argb: 'FFF0EBE3' } },
      }

      switch (colNum) {
        case 1: // Employee ID
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FFB0A090' }, size: 10 }
          cell.alignment = { vertical: 'middle' }
          break
        case 2: // Name
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { bold: true, color: { argb: 'FF2C2010' }, size: 10 }
          cell.alignment = { vertical: 'middle' }
          break
        case 9: // Total Hours
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { bold: true, color: { argb: 'FF4B3A2A' }, size: 10 }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        case 10: // Status
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.fill } }
          cell.font      = { bold: true, color: { argb: s.font }, size: 10 }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        case 11: // Extra Taps
          // Orange tint when there are actual extra taps, neutral otherwise
          cell.fill      = {
            type    : 'pattern',
            pattern : 'solid',
            fgColor : { argb: hasExtra ? 'FFFFF3E8' : rowBg },
          }
          cell.font      = {
            italic : true,
            color  : { argb: hasExtra ? 'FFEA580C' : 'FFC9BFAF' },
            size   : 10,
          }
          cell.alignment = { vertical: 'middle', wrapText: false }
          break
        default:
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FF4B3A2A' }, size: 10 }
          cell.alignment = { vertical: 'middle' }
      }
    })
  })

  // ── Trigger download ─────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}