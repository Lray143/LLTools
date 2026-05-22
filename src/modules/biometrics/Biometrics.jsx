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

import { useState, useRef, useEffect }    from 'react'
import { DEPARTMENTS, MONTHS }            from './biometricConstants'
import { parseRawBiometrics }             from './parseRawBiometrics'
import { exportToXLSX }                   from './exportToXLSX'
import { BiometricHeader }                from './components/BiometricHeader'
import { BiometricStatCards }             from './components/BiometricStatCards'
import { BiometricFilterBar }             from './components/BiometricFilterBar'
import { BiometricTable }                 from './components/BiometricTable'

// ── helper: map a DB attendance row → UI record shape ────────
const mapRow = (r) => ({
  employee_no : r.employee_no,
  date        : r.date,
  shift_in    : r.shift_in,
  lunch_out   : r.lunch_out,
  lunch_in    : r.lunch_in,
  shift_out   : r.shift_out,
  status      : r.status,
  id          : `EMP-${r.employee_no}`,
  name        : r.name || r.employee_no,
  department  : r.department || '—',
  timeframe   : `${new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })} · Morning`,
  shiftIn     : r.shift_in,
  lunchOut    : r.lunch_out,
  lunchIn     : r.lunch_in,
  shiftOut    : r.shift_out,
})

function Biometrics() {

  // ── RECORDS STATE ────────────────────────────────────────────
  const [records,       setRecords]       = useState([])

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

  // ── LOAD FROM DB ON MOUNT ────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getAttendance().then(rows => {
      setRecords(rows.map(mapRow))
    })
  }, [])

  // ── DERIVED — filtered records ───────────────────────────────
  const filteredRecords = records.filter(r => {
    const matchDept   = selectedDept === 'All Departments' || r.department === selectedDept
    const matchSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDept && matchSearch
  })

  // ── DERIVED — stat counts ────────────────────────────────────
  const stats = {
    present : records.filter(r => r.status === 'Present').length,
    late    : records.filter(r => r.status === 'Late').length,
    absent  : records.filter(r => r.status === 'Absent').length,
    onLeave : records.filter(r => r.status === 'Leave').length,
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

        // Save to DB — also creates stub employees for new IDs
        const result = await window.electronAPI.importAttendance(parsed)

        // Reload from DB so table always reflects what's actually saved
        const rows = await window.electronAPI.getAttendance()
        setRecords(rows.map(mapRow))

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
    const date     = new Date().toISOString().slice(0, 10)
    const safeName = selectedMonth.replace(' ', '_')
    await exportToXLSX(filteredRecords, `attendance_${safeName}_${date}.xlsx`)
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full bg-white">

      {/* TOP BAR — title + search + icon buttons */}
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