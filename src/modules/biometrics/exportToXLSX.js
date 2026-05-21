// ─────────────────────────────────────────────────────────────
// exportToXLSX.js
// Produces a formatted .xlsx attendance report using ExcelJS.
// Requires: npm install exceljs
//
// Formatting applied:
//   • Bold orange headers with orange bottom border
//   • Alternating row shading (white / warm off-white)
//   • Colored Status cells matching the app badge colors
//   • Correct column widths so no text is cut off
//   • Frozen header row (stays visible while scrolling)
// ─────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs'
import { STATUS_XLSX } from './biometricConstants'

export async function exportToXLSX(records, filename) {
  const wb    = new ExcelJS.Workbook()
  wb.creator  = 'LLTools Biometrics'
  wb.created  = new Date()

  const ws = wb.addWorksheet('Attendance')

  // ── Column definitions ───────────────────────────────────────
  ws.columns = [
    { header:'Employee ID', key:'id',         width:14 },
    { header:'Name',        key:'name',        width:22 },
    { header:'Department',  key:'department',  width:15 },
    { header:'Time Frame',  key:'timeframe',   width:30 },
    { header:'Shift In',    key:'shiftIn',     width:12 },
    { header:'Lunch Out',   key:'lunchOut',    width:12 },
    { header:'Lunch In',    key:'lunchIn',     width:12 },
    { header:'Shift Out',   key:'shiftOut',    width:12 },
    { header:'Status',      key:'status',      width:11 },
  ]

  // ── Style the header row ─────────────────────────────────────
  const headerRow = ws.getRow(1)
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.font      = { bold:true, color:{ argb:'FFF97316' }, size:11 }
    cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF5F2EC' } }
    cell.alignment = { horizontal:'center', vertical:'middle' }
    cell.border    = {
      bottom: { style:'medium', color:{ argb:'FFF97316' } },
      top:    { style:'thin',   color:{ argb:'FFE5DDD0' } },
      left:   { style:'thin',   color:{ argb:'FFE5DDD0' } },
      right:  { style:'thin',   color:{ argb:'FFE5DDD0' } },
    }
  })

  // ── Freeze header row ────────────────────────────────────────
  ws.views = [{ state:'frozen', xSplit:0, ySplit:1, activeCell:'A2' }]

  // ── Add data rows ────────────────────────────────────────────
  records.forEach((r, idx) => {
    const row = ws.addRow({
      id         : r.id,
      name       : r.name,
      department : r.department,
      timeframe  : r.timeframe,
      shiftIn    : r.shiftIn   || '—',
      lunchOut   : r.lunchOut  || '—',
      lunchIn    : r.lunchIn   || '—',
      shiftOut   : r.shiftOut  || '—',
      status     : r.status,
    })

    row.height  = 18
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFAF9F6'
    const s     = STATUS_XLSX[r.status] || { fill:'FFFFFFFF', font:'FF2C2010' }

    row.eachCell((cell, colNum) => {
      cell.border = {
        top:    { style:'thin', color:{ argb:'FFF0EBE3' } },
        bottom: { style:'thin', color:{ argb:'FFF0EBE3' } },
        left:   { style:'thin', color:{ argb:'FFF0EBE3' } },
        right:  { style:'thin', color:{ argb:'FFF0EBE3' } },
      }
      switch (colNum) {
        case 1:
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:rowBg } }
          cell.font      = { color:{ argb:'FFB0A090' }, size:10 }
          cell.alignment = { vertical:'middle' }
          break
        case 2:
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:rowBg } }
          cell.font      = { bold:true, color:{ argb:'FF2C2010' }, size:10 }
          cell.alignment = { vertical:'middle' }
          break
        case 9:
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:s.fill } }
          cell.font      = { bold:true, color:{ argb:s.font }, size:10 }
          cell.alignment = { horizontal:'center', vertical:'middle' }
          break
        default:
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:rowBg } }
          cell.font      = { color:{ argb:'FF4B3A2A' }, size:10 }
          cell.alignment = { vertical:'middle' }
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