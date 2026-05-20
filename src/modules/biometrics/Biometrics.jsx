// src/modules/biometrics/Biometrics.jsx
//
// ════════════════════════════════════════════════════════════════
// BIOMETRICS — Attendance Log Page
// ════════════════════════════════════════════════════════════════
//
// Requires: npm install exceljs  (0 vulnerabilities)
// exceljs is saved to package.json automatically, so teammates
// just need `npm install` after cloning.
//
// Color scheme: warm cream / off-white
//   Page BG    : #edeae3  (warm parchment)
//   Card BG    : #f5f2ec  (lighter cream)
//   Table BG   : #ffffff  (clean white)
//   Border     : rgba(0,0,0,0.07)
//   Text main  : #2c2010  (warm near-black)
//   Text muted : #a09278  (warm stone)
//   Accent     : #f97316  (brand orange)
//
// ── IMPORT FLOW ──────────────────────────────────────────────────
// The biometrics device exports a raw .txt/.dat log to a USB drive.
// The user clicks Import, picks the file, and parseRawBiometrics()
// converts it into structured records. See its comment block for
// how to adjust the parser for your specific device format.
//
// ── EXPORT FLOW ─────────────────────────────────────────────────
// Export downloads the filtered records as a formatted .xlsx file.
// Formatting: bold orange headers, alternating row shading,
// colored Status cells, correct column widths, frozen header row.
//
// ── DATABASE TODO ────────────────────────────────────────────────
// All data is mock. When SQLite (better-sqlite3) is ready:
//   1. Replace MOCK_RECORDS with a DB query on mount (useEffect).
//   2. Replace MOCK_STATS with computed counts from the query.
//   3. Wire Import to INSERT parsed rows into the attendance table.
//   4. Wire Export to SELECT from DB with the active filters.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import {
  Search, Bell, UserRound,
  Download, Upload, ChevronDown,
} from 'lucide-react'

// ═════════════════════════════════════════════════════════════════
// MOCK DATA — replace with SQLite queries when DB layer is ready
// ═════════════════════════════════════════════════════════════════
const MOCK_RECORDS = [
  { id:'EMP-001', name:'Ana Santos',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'8:02 AM',  lunchOut:'12:01 PM', lunchIn:'1:03 PM',  shiftOut:'5:08 PM',  status:'Present' },
  { id:'EMP-002', name:'Rico Dela Cruz',  department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'8:47 AM',  lunchOut:'12:10 PM', lunchIn:'1:12 PM',  shiftOut:'5:30 PM',  status:'Late'    },
  { id:'EMP-003', name:'Gina Flores',     department:'Marketing',  timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'  },
  { id:'EMP-004', name:'Ben Castillo',    department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:'7:58 AM',  lunchOut:'12:00 PM', lunchIn:'1:00 PM',  shiftOut:'4:59 PM',  status:'Present' },
  { id:'EMP-005', name:'Lita Mendoza',    department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Leave'   },
  { id:'EMP-006', name:'Jun Ramos',       department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'8:00 AM',  lunchOut:'12:00 PM', lunchIn:'1:00 PM',  shiftOut:'5:00 PM',  status:'Present' },
  { id:'EMP-007', name:'Maria Cruz',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'8:05 AM',  lunchOut:'12:05 PM', lunchIn:'1:06 PM',  shiftOut:'5:12 PM',  status:'Present' },
  { id:'EMP-008', name:'Carlo Reyes',     department:'IT',         timeframe:'May 15, 2025 · Morning', shiftIn:'9:15 AM',  lunchOut:'12:30 PM', lunchIn:'1:30 PM',  shiftOut:'6:15 PM',  status:'Late'    },
  { id:'EMP-009', name:'Dina Villanueva', department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:'7:55 AM',  lunchOut:'11:55 AM', lunchIn:'12:55 PM', shiftOut:'4:55 PM',  status:'Present' },
  { id:'EMP-010', name:'Paolo Bautista',  department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'  },
]

// Summary counts — compute dynamically from records when DB is live.
const MOCK_STATS = { present: 131, late: 9, absent: 5, onLeave: 3 }

// Department list — TODO: fetch from Employees table.
const DEPARTMENTS = ['All Departments','Sales','Production','Marketing','Finance','HR','IT']

// ─────────────────────────────────────────────────────────────────
// STATUS STYLES — add new statuses here without touching JSX
// ─────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Present : { color:'#16a34a', bg:'#dcfce7', border:'#bbf7d0' },
  Late    : { color:'#ea580c', bg:'#ffedd5', border:'#fed7aa' },
  Absent  : { color:'#dc2626', bg:'#fee2e2', border:'#fecaca' },
  Leave   : { color:'#2563eb', bg:'#dbeafe', border:'#bfdbfe' },
}

// ExcelJS uses ARGB hex (Alpha + RGB). FF = fully opaque.
const STATUS_XLSX = {
  Present : { fill: 'FFDCFCE7', font: 'FF166534' },
  Late    : { fill: 'FFFFEDD5', font: 'FFEA580C' },
  Absent  : { fill: 'FFFEE2E2', font: 'FFDC2626' },
  Leave   : { fill: 'FFDBEAFE', font: 'FF1D4ED8' },
}

const Dash = () => <span style={{ color:'#c9bfaf' }}>—</span>

// ═════════════════════════════════════════════════════════════════
// parseRawBiometrics(text)
//
// Converts the raw text file from the fingerprint hardware into an
// array of structured record objects.
//
// ── COMMON DEVICE FORMATS ────────────────────────────────────────
//   FORMAT A — tab-separated (ZKTeco ATT logs):
//     1\t1001\t2025-05-15 08:02:15\t0\t0\t\t0
//
//   FORMAT B — space-padded:
//     No.  ID     Name         Date        Time      In/Out
//     1    1001   Ana Santos   05/15/2025  08:02:15  In
//
//   FORMAT C — CSV with header:
//     UserID,Name,Date,CheckIn,CheckOut
//     1001,Ana Santos,2025-05-15,08:02,17:08
//
// ── HOW TO ADJUST FOR YOUR DEVICE ────────────────────────────────
// Update the constants in the ADJUST block below:
//   FIELD_SEPARATOR  — '\t' for tab, ',' for CSV, /\s+/ for spaces
//   EMP_ID_COLUMN    — 0-based column index of the employee ID
//   DATETIME_COLUMN  — 0-based column index of the timestamp
//   NAME_COLUMN      — set to -1 if the file has no name column
//   HEADER_ROWS      — number of header rows to skip
// ─────────────────────────────────────────────────────────────────
function parseRawBiometrics(text) {

  // ── ADJUST THESE FOR YOUR DEVICE ────────────────────────────────
  const FIELD_SEPARATOR  = /\t|,/
  const EMP_ID_COLUMN    = 1
  const DATETIME_COLUMN  = 2
  const NAME_COLUMN      = -1   // -1 = not in file; join from DB
  const HEADER_ROWS      = 1
  const SHIFT_START_HOUR = 8
  const LATE_CUTOFF_MIN  = 15  // 08:15 grace period
  // ────────────────────────────────────────────────────────────────

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dataLines = lines.slice(HEADER_ROWS)
  const punchMap = {}

  for (const line of dataLines) {
    const cols = line.split(FIELD_SEPARATOR).map(c => c.trim())
    if (cols.length < 3) continue

    const rawId   = cols[EMP_ID_COLUMN]   || ''
    const rawTime = cols[DATETIME_COLUMN] || ''
    const name    = NAME_COLUMN >= 0 ? (cols[NAME_COLUMN] || '') : ''

    let dt = new Date(rawTime)
    if (isNaN(dt.getTime())) {
      dt = new Date(rawTime.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'))
    }
    if (isNaN(dt.getTime())) continue

    const empId = rawId.startsWith('EMP')
      ? rawId
      : `EMP-${String(rawId).padStart(3, '0')}`

    const dateKey = dt.toISOString().slice(0, 10)
    const mapKey  = `${empId}_${dateKey}`

    if (!punchMap[mapKey]) {
      punchMap[mapKey] = { empId, name, date: dateKey, punches: [] }
    }
    punchMap[mapKey].punches.push(dt)
  }

  const parsed = []

  for (const entry of Object.values(punchMap)) {
    entry.punches.sort((a, b) => a - b)

    const fmt = (d) => d
      ? d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
      : null

    const [p0, p1, p2, p3] = entry.punches

    let status = 'Absent'
    if (p0) {
      const minsLate = (p0.getHours() - SHIFT_START_HOUR) * 60 + p0.getMinutes()
      status = minsLate > LATE_CUTOFF_MIN ? 'Late' : 'Present'
    }

    const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
      month:'long', day:'numeric', year:'numeric',
    })

    parsed.push({
      id        : entry.empId,
      name      : entry.name || entry.empId,
      department: '—',  // TODO: join from Employees table
      timeframe : `${dateLabel} · Morning`,
      shiftIn   : fmt(p0) ?? null,
      lunchOut  : fmt(p1) ?? null,
      lunchIn   : fmt(p2) ?? null,
      shiftOut  : fmt(p3) ?? null,
      status,
    })
  }

  return parsed
}

// ═════════════════════════════════════════════════════════════════
// exportToXLSX(records, filename)
//
// Uses ExcelJS (0 vulnerabilities) to produce a fully formatted
// .xlsx file that opens correctly in Excel, Google Sheets, and
// LibreOffice Calc.
//
// Formatting applied:
//   • Bold orange headers with orange bottom border
//   • Alternating row shading (white / warm off-white)
//   • Colored Status cells matching the app's badge colors
//   • Correct column widths so no text is cut off
//   • Frozen header row (stays visible while scrolling)
// ═════════════════════════════════════════════════════════════════
async function exportToXLSX(records, filename) {
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'LLTools Biometrics'
  wb.created  = new Date()

  const ws = wb.addWorksheet('Attendance')

  // ── Column definitions ─────────────────────────────────────────
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

  // ── Style the header row (row 1) ───────────────────────────────
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

  // ── Freeze header row ──────────────────────────────────────────
  ws.views = [{ state:'frozen', xSplit:0, ySplit:1, activeCell:'A2' }]

  // ── Add data rows ──────────────────────────────────────────────
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

    row.height = 18
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFAF9F6'
    const s     = STATUS_XLSX[r.status] || { fill:'FFFFFFFF', font:'FF2C2010' }

    row.eachCell((cell, colNum) => {
      // Default border for every cell
      cell.border = {
        top:    { style:'thin', color:{ argb:'FFF0EBE3' } },
        bottom: { style:'thin', color:{ argb:'FFF0EBE3' } },
        left:   { style:'thin', color:{ argb:'FFF0EBE3' } },
        right:  { style:'thin', color:{ argb:'FFF0EBE3' } },
      }

      switch (colNum) {
        case 1: // Employee ID — muted
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:rowBg } }
          cell.font      = { color:{ argb:'FFB0A090' }, size:10 }
          cell.alignment = { vertical:'middle' }
          break
        case 2: // Name — bold
          cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:rowBg } }
          cell.font      = { bold:true, color:{ argb:'FF2C2010' }, size:10 }
          cell.alignment = { vertical:'middle' }
          break
        case 9: // Status — colored badge
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

  // ── Write buffer and trigger download ──────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ═════════════════════════════════════════════════════════════════
// Biometrics Component
// ═════════════════════════════════════════════════════════════════
function Biometrics() {

  // ── RECORDS STATE ────────────────────────────────────────────────
  // TODO: initialise from SQLite on mount:
  //   useEffect(() => {
  //     setRecords(db.prepare('SELECT * FROM attendance WHERE date = ?').all(today))
  //   }, [])
  const [records,       setRecords]       = useState(MOCK_RECORDS)

  // ── FILTER STATE ─────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState('May 2025')
  const [selectedDept,  setSelectedDept]  = useState('All Departments')
  const [viewMode,      setViewMode]      = useState('Monthly')
  const [searchQuery,   setSearchQuery]   = useState('')

  // ── IMPORT UI STATE ──────────────────────────────────────────────
  const [importError,   setImportError]   = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const fileInputRef = useRef(null)

  // ── DERIVED ──────────────────────────────────────────────────────
  const filteredRecords = records.filter(r => {
    const matchDept   = selectedDept === 'All Departments' || r.department === selectedDept
    const matchSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDept && matchSearch
  })

  const stats = {
    present : records.filter(r => r.status === 'Present').length || MOCK_STATS.present,
    late    : records.filter(r => r.status === 'Late').length    || MOCK_STATS.late,
    absent  : records.filter(r => r.status === 'Absent').length  || MOCK_STATS.absent,
    onLeave : records.filter(r => r.status === 'Leave').length   || MOCK_STATS.onLeave,
  }

  // ── IMPORT HANDLER ───────────────────────────────────────────────
  // TODO: after parsing, INSERT records into SQLite:
  //   const stmt = db.prepare('INSERT OR REPLACE INTO attendance VALUES (?,?,?,?,?,?,?,?,?)')
  //   parsedRecords.forEach(r => stmt.run(r.id, r.name, r.department, ...))
  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportSuccess('')

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      try {
        const parsed = parseRawBiometrics(text)
        if (parsed.length === 0) {
          setImportError('No records could be read. Check that the file matches the expected device format.')
          return
        }
        setRecords(parsed)
        setImportSuccess(`Imported ${parsed.length} records from ${file.name}`)
      } catch (err) {
        setImportError(`Parse error: ${err.message}. Try adjusting the column settings in parseRawBiometrics().`)
      }
    }
    reader.onerror = () => setImportError('Could not read the file. Make sure it is a plain text (.txt or .dat) file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── EXPORT HANDLER ───────────────────────────────────────────────
  // exportToXLSX is async (ExcelJS uses Promises internally).
  const handleExport = async () => {
    const date     = new Date().toISOString().slice(0, 10)
    const safeName = selectedMonth.replace(' ', '_')
    await exportToXLSX(filteredRecords, `attendance_${safeName}_${date}.xlsx`)
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        margin:'-2rem', padding:'2rem',
        minHeight:'100vh',
        background:'#edeae3',
        color:'#2c2010',
        fontFamily:'inherit',
      }}
    >

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold tracking-tight" style={{ fontSize:'22px', color:'#2c2010' }}>
          Biometrics
        </h1>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', width:'200px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <Search size={13} style={{ color:'#a09278', flexShrink:0 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full"
              style={{ fontSize:'13px', color:'#2c2010' }}
            />
          </div>

          {[Bell, UserRound].map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded-xl transition-colors duration-150"
              style={{ width:'36px', height:'36px', background:'#fff', border:'1px solid rgba(0,0,0,0.10)', color:'#a09278', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background='#fef3e8'; e.currentTarget.style.color='#ea580c' }}
              onMouseLeave={(e) => { e.currentTarget.style.background='#fff';    e.currentTarget.style.color='#a09278' }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Present',  value:stats.present, color:'#16a34a' },
          { label:'Late',     value:stats.late,    color:'#d97706' },
          { label:'Absent',   value:stats.absent,  color:'#dc2626' },
          { label:'On Leave', value:stats.onLeave, color:'#2563eb' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl px-5 py-4"
            style={{ background:'#f5f2ec', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', cursor:'default' }}
          >
            <p style={{ fontSize:'12px', color:'#a09278', marginBottom:'6px' }}>{stat.label}</p>
            <p className="font-semibold" style={{ fontSize:'34px', color:stat.color, lineHeight:1, fontStyle:'italic' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          {/* Month selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.12)', color:'#2c2010', fontSize:'13px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {['January 2025','February 2025','March 2025','April 2025','May 2025'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#a09278' }} />
          </div>

          {/* Department filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.12)', color:'#2c2010', fontSize:'13px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#a09278' }} />
          </div>

          {/* Daily / Weekly / Monthly toggle */}
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ border:'1px solid rgba(0,0,0,0.12)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {['Daily','Weekly','Monthly'].map((mode) => {
              const active = viewMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-4 py-2 transition-colors duration-150"
                  style={{ fontSize:'13px', background:active?'#f97316':'#fff', color:active?'#fff':'#6b5c4c', border:'none', cursor:'pointer', fontWeight:active?500:400 }}
                >
                  {mode}
                </button>
              )
            })}
          </div>
        </div>

        {/* Import + Export ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".txt,.dat,.log,.csv"
            ref={fileInputRef}
            onChange={handleFileImport}
            style={{ display:'none' }}
          />

          <button
            onClick={() => { setImportError(''); setImportSuccess(''); fileInputRef.current?.click() }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors duration-150"
            style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.12)', color:'#4b3a2a', fontSize:'13px', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background='#fef3e8'; e.currentTarget.style.borderColor='#f97316' }}
            onMouseLeave={(e) => { e.currentTarget.style.background='#fff';    e.currentTarget.style.borderColor='rgba(0,0,0,0.12)' }}
          >
            <Upload size={14} />
            Import
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-150"
            style={{ background:'#f97316', border:'none', color:'#fff', fontSize:'13px', cursor:'pointer', boxShadow:'0 2px 8px rgba(249,115,22,0.30)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity='0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity='1'   }}
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* ── IMPORT FEEDBACK ──────────────────────────────────────── */}
      {importError && (
        <div className="mb-3 px-4 py-2 rounded-xl text-sm" style={{ background:'#fee2e2', border:'1px solid #fecaca', color:'#991b1b' }}>
          ⚠ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="mb-3 px-4 py-2 rounded-xl text-sm" style={{ background:'#dcfce7', border:'1px solid #bbf7d0', color:'#166534' }}>
          ✓ {importSuccess}
        </div>
      )}

      {/* ── ATTENDANCE TABLE CARD ────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <p className="font-medium" style={{ fontSize:'14px', color:'#2c2010' }}>
            Attendance Log — May 15, 2025
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse:'collapse', minWidth:'920px' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
                {[
                  { label:'#',          w:'100px' },
                  { label:'Name',       w:'160px' },
                  { label:'Department', w:'130px' },
                  { label:'Time Frame', w:'180px' },
                  { label:'In',         w:'90px'  },
                  { label:'Out',        w:'90px'  },
                  { label:'In',         w:'90px'  },
                  { label:'Out',        w:'90px'  },
                  { label:'Status',     w:'90px'  },
                ].map((col, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3"
                    style={{ width:col.w, fontSize:'11px', color:'#a09278', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                <td colSpan={4} />
                {['Shift Start','Lunch Start','Lunch End','Shift End'].map((lbl, i) => (
                  <td key={i} className="px-4 pb-2" style={{ fontSize:'9px', color:'#c9bfaf', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
                    {lbl}
                  </td>
                ))}
                <td />
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12" style={{ color:'#c9bfaf', fontSize:'13px' }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : filteredRecords.map((r, idx) => {
                const ss = STATUS_STYLES[r.status] || STATUS_STYLES.Present
                return (
                  <tr
                    key={r.id}
                    style={{ background:idx%2===0?'#fff':'#faf9f6', borderBottom:'1px solid rgba(0,0,0,0.04)', transition:'background 100ms', cursor:'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background='#fff8f2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background=idx%2===0?'#fff':'#faf9f6' }}
                  >
                    <td className="px-4 py-3" style={{ fontSize:'12px', color:'#b0a090', whiteSpace:'nowrap' }}>{r.id}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#2c2010', fontWeight:600, whiteSpace:'nowrap' }}>{r.name}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#6b5c4c', whiteSpace:'nowrap' }}>{r.department}</td>
                    <td className="px-4 py-3" style={{ fontSize:'12px', color:'#a09278', whiteSpace:'nowrap' }}>{r.timeframe}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.shiftIn  ?? <Dash />}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.lunchOut ?? <Dash />}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.lunchIn  ?? <Dash />}</td>
                    <td className="px-4 py-3" style={{ fontSize:'13px', color:'#4b3a2a', whiteSpace:'nowrap' }}>{r.shiftOut ?? <Dash />}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-3 py-0.5 font-medium"
                        style={{ fontSize:'11px', color:ss.color, background:ss.bg, border:`1px solid ${ss.border}`, whiteSpace:'nowrap' }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3" style={{ borderTop:'1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize:'12px', color:'#b0a090' }}>
            Showing {filteredRecords.length} of {records.length} records
          </p>
        </div>
      </div>

    </div>
  )
}

export default Biometrics