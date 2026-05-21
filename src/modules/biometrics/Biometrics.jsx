// ─────────────────────────────────────────────────────────────
// Biometrics.jsx
// Entry point for the Biometrics module.
// Mirrors the structure of Employees.jsx — this file only
// handles state and logic, all UI lives in components/.
//
// Folder structure:
//   biometrics/
//   ├── Biometrics.jsx                ← you are here (state + logic)
//   ├── biometricConstants.js         ← mock data, style maps
//   ├── parseRawBiometrics.js         ← device file parser
//   ├── exportToXLSX.js               ← Excel export utility
//   └── components/
//       ├── BiometricHeader.jsx       ← title + search + icons
//       ├── BiometricStatCards.jsx    ← Present/Late/Absent/Leave cards
//       ├── BiometricFilterBar.jsx    ← month/dept/toggle + import/export
//       └── BiometricTable.jsx        ← attendance table
// ─────────────────────────────────────────────────────────────

import { useState, useRef }                              from 'react'
import { MOCK_RECORDS, MOCK_STATS, DEPARTMENTS, MONTHS } from './biometricConstants'
import { parseRawBiometrics }                            from './parseRawBiometrics'
import { exportToXLSX }                                  from './exportToXLSX'
import { BiometricHeader }                               from './components/BiometricHeader'
import { BiometricStatCards }                            from './components/BiometricStatCards'
import { BiometricFilterBar }                            from './components/BiometricFilterBar'
import { BiometricTable }                                from './components/BiometricTable'

function Biometrics() {

  // ── RECORDS STATE ────────────────────────────────────────────
  // TODO: load from SQLite on mount:
  //   useEffect(() => {
  //     const rows = db.prepare('SELECT * FROM attendance WHERE date = ?').all(today)
  //     setRecords(rows)
  //   }, [])
  const [records,       setRecords]       = useState(MOCK_RECORDS)

  // ── FILTER STATE ─────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState('May 2025')
  const [selectedDept,  setSelectedDept]  = useState('All Departments')
  const [viewMode,      setViewMode]      = useState('Monthly')
  const [searchQuery,   setSearchQuery]   = useState('')

  // ── IMPORT FEEDBACK STATE ────────────────────────────────────
  const [importError,   setImportError]   = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  // Ref for the hidden file input — triggered by Import button
  const fileInputRef = useRef(null)

  // ── DERIVED — filtered records ───────────────────────────────
  const filteredRecords = records.filter(r => {
    const matchDept   = selectedDept === 'All Departments' || r.department === selectedDept
    const matchSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDept && matchSearch
  })

  // ── DERIVED — stat counts ────────────────────────────────────
  // Falls back to MOCK_STATS when records array is the mock set
  const stats = {
    present : records.filter(r => r.status === 'Present').length || MOCK_STATS.present,
    late    : records.filter(r => r.status === 'Late').length    || MOCK_STATS.late,
    absent  : records.filter(r => r.status === 'Absent').length  || MOCK_STATS.absent,
    onLeave : records.filter(r => r.status === 'Leave').length   || MOCK_STATS.onLeave,
  }

  // ── IMPORT HANDLER ───────────────────────────────────────────
  // Reads a raw .txt/.dat file from the biometrics device,
  // parses it with parseRawBiometrics, and updates records state.
  // TODO: also INSERT parsed rows into SQLite attendance table.
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
      } catch (err) {
        setImportError(`Parse error: ${err.message}`)
      }
    }
    reader.onerror = () => setImportError('Could not read the file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── EXPORT HANDLER ───────────────────────────────────────────
  // Exports the currently filtered records as a formatted .xlsx
  async function handleExport() {
    const date     = new Date().toISOString().slice(0, 10)
    const safeName = selectedMonth.replace(' ', '_')
    await exportToXLSX(filteredRecords, `attendance_${safeName}_${date}.xlsx`)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // Matches Employees.jsx container style:
  //   flex flex-col w-full h-full bg-white
  // No negative margins or custom background — keeps it consistent
  // with the rest of the app's module pages.
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full bg-white">

      {/* TOP BAR — title + search + icon buttons
          Matches the Employees top bar layout exactly */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <BiometricHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* CONTENT AREA — stat cards, filters, table */}
      <div className="px-8 py-6 flex flex-col gap-6">

        {/* Present / Late / Absent / On Leave summary cards */}
        <BiometricStatCards stats={stats} />

        {/* Month / dept / view toggle + Import + Export buttons */}
        <BiometricFilterBar
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedDept={selectedDept}   setSelectedDept={setSelectedDept}
          viewMode={viewMode}           setViewMode={setViewMode}
          onImportClick={() => {
            setImportError('')
            setImportSuccess('')
            fileInputRef.current?.click()
          }}
          onExport={handleExport}
          months={MONTHS}
          departments={DEPARTMENTS}
        />

        {/* Hidden file input — triggered by Import button in FilterBar */}
        <input
          type="file"
          accept=".txt,.dat,.log,.csv"
          ref={fileInputRef}
          onChange={handleFileImport}
          style={{ display:'none' }}
        />

        {/* Import feedback messages — only shown when state is non-empty */}
        {importError && (
          <div
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background:'#fee2e2', border:'1px solid #fecaca', color:'#991b1b' }}
          >
            ⚠ {importError}
          </div>
        )}
        {importSuccess && (
          <div
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background:'#dcfce7', border:'1px solid #bbf7d0', color:'#166534' }}
          >
            ✓ {importSuccess}
          </div>
        )}

        {/* Main attendance table */}
        <BiometricTable
          records={filteredRecords}
          total={records.length}
        />

      </div>
    </div>
  )
}

export default Biometrics