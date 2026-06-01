// ─────────────────────────────────────────────────────────────
// exportClinicToXLSX.js
// ─────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs'

const DISP_XLSX = {
  "Back to work": { fill: 'FFD1FAE5', font: 'FF059669' },
  "Sent home":    { fill: 'FFFEF9C3', font: 'FFB45309' },
  "Referred":     { fill: 'FFFEE2E2', font: 'FFDC2626' },
  "Monitoring":   { fill: 'FFDBEAFE', font: 'FF2563EB' },
}

export async function exportClinicToXLSX(visits, filename, label = '') {
  const wb   = new ExcelJS.Workbook()
  wb.creator = 'LLTools Clinic'
  wb.created = new Date()

  const ws = wb.addWorksheet('Clinic Visits')

  // ── Column definitions ──────────────────────────────────────
  ws.columns = [
    { header: 'Date',        key: 'date',        width: 12 },
    { header: 'Time',        key: 'time',        width: 12 },
    { header: 'Employee',    key: 'employee',    width: 24 },
    { header: 'Emp ID',      key: 'employeeNo',  width: 12 },
    { header: 'Complaint',   key: 'complaint',   width: 24 },
    { header: 'BP',          key: 'bp',          width: 10 },
    { header: 'Temp (°C)',   key: 'temp',        width: 10 },
    { header: 'Treatment',   key: 'treatment',   width: 34 },
    { header: 'Disposition', key: 'disposition', width: 16 },
  ]

  const TOTAL_COLS = 9

  // ── Row 1: filter label ─────────────────────────────────────
  ws.spliceRows(1, 0, [label])
  ws.mergeCells(1, 1, 1, TOTAL_COLS)
  const titleCell = ws.getCell('A1')
  titleCell.value     = label
  titleCell.font      = { bold: true, color: { argb: 'FFF97316' }, size: 12, name: 'Arial' }
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F2' } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  titleCell.border    = { bottom: { style: 'medium', color: { argb: 'FFF97316' } } }
  ws.getRow(1).height = 26

  // ── Row 2: column headers ────────────────────────────────────
  const headerRow = ws.getRow(2)
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFF97316' }, size: 11, name: 'Arial' }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F2EC' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = {
      bottom: { style: 'medium', color: { argb: 'FFF97316' } },
      top:    { style: 'thin',   color: { argb: 'FFE5DDD0' } },
      left:   { style: 'thin',   color: { argb: 'FFE5DDD0' } },
      right:  { style: 'thin',   color: { argb: 'FFE5DDD0' } },
    }
  })

  // ── Freeze rows 1 + 2 ───────────────────────────────────────
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }]

  // ── Data rows ────────────────────────────────────────────────
  visits.forEach((v, idx) => {
    const row   = ws.addRow({
      date:        v.date,
      time:        v.time,
      employee:    v.fullName || v.employee,
      employeeNo:  v.employeeNo  || '—',
      complaint:   v.complaint   || '—',
      bp:          v.bp          || '—',
      temp:        v.temp        || '—',
      treatment:   v.treatment   || '—',
      disposition: v.disposition || '—',
    })

    row.height  = 20
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFAF9F6'
    const ds    = DISP_XLSX[v.disposition] || { fill: rowBg, font: 'FF4B3A2A' }

    row.eachCell((cell, colNum) => {
      // Base border for every cell
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFF0EBE3' } },
        bottom: { style: 'thin', color: { argb: 'FFF0EBE3' } },
        left:   { style: 'thin', color: { argb: 'FFF0EBE3' } },
        right:  { style: 'thin', color: { argb: 'FFF0EBE3' } },
      }

      switch (colNum) {
        case 1: // Date
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FFB0A090' }, size: 10, name: 'Arial' }
          cell.alignment = { vertical: 'middle' }
          break
        case 2: // Time
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FFB0A090' }, size: 10, name: 'Arial' }
          cell.alignment = { vertical: 'middle' }
          break
        case 3: // Employee name
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { bold: true, color: { argb: 'FF2C2010' }, size: 10, name: 'Arial' }
          cell.alignment = { vertical: 'middle' }
          break
        case 4: // Emp ID
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FFB0A090' }, size: 10, name: 'Arial' }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        case 5: // Complaint
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FF4B3A2A' }, size: 10, name: 'Arial' }
          cell.alignment = { vertical: 'middle' }
          break
        case 6: // BP
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FF4B3A2A' }, size: 10, name: 'Arial' }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        case 7: // Temp
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FF4B3A2A' }, size: 10, name: 'Arial' }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        case 8: // Treatment
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { italic: true, color: { argb: 'FF6B5C4C' }, size: 10, name: 'Arial' }
          cell.alignment = { vertical: 'middle', wrapText: true }
          break
        case 9: // Disposition
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: ds.fill } }
          cell.font      = { bold: true, color: { argb: ds.font }, size: 10, name: 'Arial' }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          break
        default:
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
          cell.font      = { color: { argb: 'FF4B3A2A' }, size: 10, name: 'Arial' }
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