// ─────────────────────────────────────────────────────────────
// Biometrics.jsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useMemo }             from 'react'
import { MOCK_RECORDS, MOCK_STATS, DEPARTMENTS } from './biometricConstants'
import { parseRawBiometrics }                    from './parseRawBiometrics'
import { exportToXLSX }                          from './exportToXLSX'
import { BiometricHeader }                       from './components/BiometricHeader'
import { BiometricStatCards }                    from './components/BiometricStatCards'
import { BiometricFilterBar }                    from './components/BiometricFilterBar'
import { BiometricTable }                        from './components/BiometricTable'

// ── helpers ───────────────────────────────────────────────────
// Safely parse a timeframe string like "May 15, 2025 · Morning"
// into a plain ISO date string "2025-05-15", without relying on
// new Date() which can produce NaN for non-standard strings.
const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
}

function timeframeToISO(tf) {
  if (!tf) return ''
  try {
    // Strip everything after "·" → "May 15, 2025"
    const part = tf.split('·')[0].trim()
    // Split on spaces/commas: ["May", "15,", "2025"] or ["May", "15", "2025"]
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

// Find the most recent date in a records array (so Daily view
// doesn't start on today with 0 results when using mock data)
function latestDateIn(records) {
  let best = null
  for (const r of records) {
    const iso = timeframeToISO(r.timeframe)
    if (!iso) continue
    if (!best || iso > best) best = iso
  }
  return best   // "YYYY-MM-DD" or null
}

function isoToDate(iso) {
  // Parse without timezone shift: "2025-05-15" → local midnight
  if (!iso) return new Date()
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─────────────────────────────────────────────────────────────
function Biometrics() {

  // ── RECORDS ───────────────────────────────────────────────────
  const [records, setRecords] = useState(MOCK_RECORDS)

  // ── VIEW MODE ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('Daily')

  // ── DAILY — default to latest date in mock records ────────────
  const [selectedDate, setSelectedDate] = useState(() => {
    const iso = latestDateIn(MOCK_RECORDS)
    return iso ? isoToDate(iso) : new Date()
  })

  // ── MONTHLY ───────────────────────────────────────────────────
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear())

  // ── YEARLY ────────────────────────────────────────────────────
  const [selectedYearOnly, setSelectedYearOnly] = useState(now.getFullYear())

  // ── DEPT + SEARCH ─────────────────────────────────────────────
  const [selectedDept,  setSelectedDept]  = useState('All Departments')
  const [searchQuery,   setSearchQuery]   = useState('')

  // ── IMPORT FEEDBACK ───────────────────────────────────────────
  const [importError,   setImportError]   = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const fileInputRef = useRef(null)

  // ── AVAILABLE YEARS ───────────────────────────────────────────
  const availableYears = useMemo(() => {
    const set = new Set()
    records.forEach(r => {
      const y = isoYear(timeframeToISO(r.timeframe))
      if (y) set.add(y)
    })
    set.add(now.getFullYear())
    return Array.from(set).sort((a,b) => b - a)
  }, [records])

  // ── FILTERED RECORDS ──────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const selDayISO = selectedDate instanceof Date && !isNaN(selectedDate)
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
      : ''

    return records.filter(r => {
      const matchDept   = selectedDept === 'All Departments' || r.department === selectedDept
      const matchSearch = !searchQuery ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase())

      const iso = timeframeToISO(r.timeframe)
      let matchDate = true
      if (viewMode === 'Daily')   matchDate = iso === selDayISO
      if (viewMode === 'Monthly') matchDate = isoYear(iso) === selectedYear && isoMonth(iso) === selectedMonth
      if (viewMode === 'Yearly')  matchDate = isoYear(iso) === selectedYearOnly

      return matchDept && matchSearch && matchDate
    })
  }, [records, viewMode, selectedDate, selectedMonth, selectedYear, selectedYearOnly, selectedDept, searchQuery])

  // ── STATS ─────────────────────────────────────────────────────
  const stats = {
    present : filteredRecords.filter(r => r.status === 'Present').length || MOCK_STATS.present,
    late    : filteredRecords.filter(r => r.status === 'Late').length    || MOCK_STATS.late,
    absent  : filteredRecords.filter(r => r.status === 'Absent').length  || MOCK_STATS.absent,
    onLeave : filteredRecords.filter(r => r.status === 'Leave').length   || MOCK_STATS.onLeave,
  }

  // ── IMPORT ────────────────────────────────────────────────────
  function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = parseRawBiometrics(evt.target.result)
        if (parsed.length === 0) {
          setImportError('No records could be read. Check the file matches the expected device format.')
          return
        }
        setRecords(parsed)
        setImportSuccess(`Imported ${parsed.length} records from ${file.name}`)
        // Auto-jump Daily view to the latest imported date
        const iso = latestDateIn(parsed)
        if (iso) setSelectedDate(isoToDate(iso))
      } catch (err) {
        setImportError(`Parse error: ${err.message}`)
      }
    }
    reader.onerror = () => setImportError('Could not read the file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── EXPORT ────────────────────────────────────────────────────
  async function handleExport() {
    const today = new Date().toISOString().slice(0,10)
    let label = ''
    if (viewMode === 'Daily')   label = selectedDate instanceof Date
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
      : 'daily'
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
          viewMode={viewMode}                 setViewMode={setViewMode}
          selectedDate={selectedDate}         setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}       setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}         setSelectedYear={setSelectedYear}
          selectedYearOnly={selectedYearOnly} setSelectedYearOnly={setSelectedYearOnly}
          selectedDept={selectedDept}         setSelectedDept={setSelectedDept}
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

        <BiometricTable records={filteredRecords} total={records.length} viewMode={viewMode} />

      </div>
    </div>
  )
}

export default Biometrics