// ─────────────────────────────────────────────────────────────
// Biometrics.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect }    from 'react'
import { DEPARTMENTS }                    from './biometricConstants'
import { parseRawBiometrics }             from './parseRawBiometrics'
import { exportToXLSX }                   from './exportToXLSX'
import { BiometricHeader }                from './components/BiometricHeader'
import { BiometricStatCards }             from './components/BiometricStatCards'
import { BiometricFilterBar }             from './components/BiometricFilterBar'
import { BiometricTable }                 from './components/BiometricTable'

// Converts a raw DB attendance row into the shape the UI components expect
const mapRow = (r) => ({
  employee_no : r.employee_no,
  date        : r.date,
  shift_in    : r.shift_in,
  lunch_out   : r.lunch_out,
  lunch_in    : r.lunch_in,
  shift_out   : r.shift_out,
  total_hours : r.total_hours,
  status      : r.status,
  id          : String(r.employee_no),   // ← fix: always a string so .toLowerCase() works
  name        : r.name || '—',
  department  : r.department || '—',
  timeframe   : `${new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })} · Morning`,
  shiftIn    : r.shift_in,
  lunchOut   : r.lunch_out,
  lunchIn    : r.lunch_in,
  shiftOut   : r.shift_out,
  totalHours : r.total_hours,
})

// ── helpers ───────────────────────────────────────────────────
const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
}

// Converts a timeframe string like "May 13, 2026 · Morning" to "2026-05-13"
function timeframeToISO(tf) {
  if (!tf) return ''
  try {
    const part   = tf.split('·')[0].trim()
    const tokens = part.replace(/,/g, '').split(/\s+/)
    const month  = MONTH_MAP[tokens[0]?.toLowerCase()]
    const day    = parseInt(tokens[1], 10)
    const year   = parseInt(tokens[2], 10)
    if (!month || isNaN(day) || isNaN(year)) return ''
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  } catch { return '' }
}

function isoYear(iso)  { return iso ? Number(iso.slice(0,4)) : null }
function isoMonth(iso) { return iso ? Number(iso.slice(5,7)) : null }

// Finds the most recent date present in a list of records
function latestDateIn(records) {
  let best = null
  for (const r of records) {
    const iso = timeframeToISO(r.timeframe)
    if (!iso) continue
    if (!best || iso > best) best = iso
  }
  return best
}

// Converts an ISO date string to a local Date object
function isoToDate(iso) {
  if (!iso) return new Date()
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─────────────────────────────────────────────────────────────
function Biometrics() {

  // ── RECORDS STATE ────────────────────────────────────────────
  const [records, setRecords] = useState([])

  // ── FILTER STATE ─────────────────────────────────────────────
  const [searchQuery,      setSearchQuery]      = useState('')
  const [selectedDept,     setSelectedDept]     = useState('All Departments')
  const [viewMode,         setViewMode]         = useState('Daily')

  // Daily view: tracks a single selected date
  const [selectedDate,     setSelectedDate]     = useState(new Date())

  // Monthly view: tracks month + year separately
  const [selectedMonth,    setSelectedMonth]    = useState(new Date().getMonth() + 1)
  const [selectedYear,     setSelectedYear]     = useState(new Date().getFullYear())

  // Yearly view: tracks year only
  const [selectedYearOnly, setSelectedYearOnly] = useState(new Date().getFullYear())

  // ── IMPORT FEEDBACK STATE ────────────────────────────────────
  const [importError,   setImportError]   = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  // Hidden file input ref used for the Import button
  const fileInputRef = useRef(null)

  // ── LOAD FROM DB ON MOUNT ────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getAttendance().then(rows => {
      const mapped = rows.map(mapRow)
      setRecords(mapped)

      // Automatically jump the Daily view to the most recent date in the DB
      const latest = latestDateIn(mapped)
      if (latest) setSelectedDate(isoToDate(latest))
    })
  }, [])

  // ── DERIVED — list of years that actually have records ───────
  const availableYears = [...new Set(
    records.map(r => isoYear(timeframeToISO(r.timeframe))).filter(Boolean)
  )].sort((a, b) => b - a)

  // ── DERIVED — records after applying all active filters ──────
  const filteredRecords = records.filter(r => {
    const iso = timeframeToISO(r.timeframe)

    // Filter by the active view mode (Daily / Monthly / Yearly)
    const matchView = (() => {
      if (viewMode === 'Daily') {
        const d = selectedDate instanceof Date ? selectedDate : new Date()
        const selISO = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        return iso === selISO
      }
      if (viewMode === 'Monthly') {
        return isoYear(iso) === selectedYear && isoMonth(iso) === selectedMonth
      }
      if (viewMode === 'Yearly') {
        return isoYear(iso) === selectedYearOnly
      }
      return true
    })()

    const matchDept = selectedDept === 'All Departments' || r.department === selectedDept

    // fix: String(r.id) ensures .toLowerCase() never crashes on a number
    const matchSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.id).toLowerCase().includes(searchQuery.toLowerCase())

    return matchView && matchDept && matchSearch
  })

  // ── DERIVED — stat card counts ───────────────────────────────
  const stats = {
    present : filteredRecords.filter(r => r.status === 'Present').length,
    late    : filteredRecords.filter(r => r.status === 'Late').length,
    absent  : filteredRecords.filter(r => r.status === 'Absent').length,
    onLeave : filteredRecords.filter(r => r.status === 'Leave').length,
  }

  // ── IMPORT HANDLER ───────────────────────────────────────────
  async function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess('')

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const parsed = parseRawBiometrics(evt.target.result)
        if (parsed.length === 0) {
          setImportError('No records could be read. Check the file matches the expected device format.')
          return
        }

        const result = await window.electronAPI.importAttendance(parsed)

        // Reload all records from DB after import so the table is up to date
        const rows   = await window.electronAPI.getAttendance()
        const mapped = rows.map(mapRow)
        setRecords(mapped)

        // Jump Daily view to the most recently imported date
        const latest = latestDateIn(mapped)
        if (latest) setSelectedDate(isoToDate(latest))

        setImportSuccess(
          `Imported ${result.newRecords} records from ${file.name}` +
          (result.skippedRecords > 0 ? ` · ${result.skippedRecords} already existed (skipped)` : '') +
          (result.newEmployees   > 0 ? ` · ${result.newEmployees} new employee stubs created`   : '')
        )
      } catch (err) {
        setImportError(`Import error: ${err.message}`)
      }
    }
    reader.onerror = () => setImportError('Could not read the file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── EXPORT HANDLER ───────────────────────────────────────────
  async function handleExport() {
    const today = new Date().toISOString().slice(0,10)
    let label = ''
    if (viewMode === 'Daily') {
      const d = selectedDate instanceof Date ? selectedDate : new Date()
      label = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }
    if (viewMode === 'Monthly') label = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}`
    if (viewMode === 'Yearly')  label = String(selectedYearOnly)
    await exportToXLSX(filteredRecords, `attendance_${label}_${today}.xlsx`)
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full bg-white">
      <style>{`
        [role="option"]:focus,[data-highlighted],[role="option"][data-disabled]{
          outline:none!important;border-color:transparent!important;box-shadow:none!important;
        }
        [role="option"][data-state="checked"]{background:#f9fafb!important;color:#111827!important;}
      `}</style>

      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <BiometricHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      <div className="px-8 py-6 flex flex-col gap-6 flex-1 min-h-0">

        <BiometricStatCards stats={stats} />

        <BiometricFilterBar
          viewMode={viewMode}                   setViewMode={setViewMode}
          selectedDate={selectedDate}           setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}         setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}           setSelectedYear={setSelectedYear}
          selectedYearOnly={selectedYearOnly}   setSelectedYearOnly={setSelectedYearOnly}
          selectedDept={selectedDept}           setSelectedDept={setSelectedDept}
          departments={DEPARTMENTS}
          availableYears={availableYears}
          onImportClick={() => {
            setImportError('')
            setImportSuccess('')
            fileInputRef.current?.click()
          }}
          onExport={handleExport}
        />

        <input
          type="file" accept=".txt,.dat,.log,.csv"
          ref={fileInputRef} onChange={handleFileImport}
          style={{ display:'none' }}
        />

        {importError && (
          <div className="px-4 py-2 rounded-xl text-sm"
            style={{ background:'#fee2e2', border:'1px solid #fecaca', color:'#991b1b' }}>
            ⚠ {importError}
          </div>
        )}
        {importSuccess && (
          <div className="px-4 py-2 rounded-xl text-sm"
            style={{ background:'#dcfce7', border:'1px solid #bbf7d0', color:'#166534' }}>
            ✓ {importSuccess}
          </div>
        )}

        <BiometricTable records={filteredRecords} total={filteredRecords.length} viewMode={viewMode} />

      </div>
    </div>
  )
}

export default Biometrics