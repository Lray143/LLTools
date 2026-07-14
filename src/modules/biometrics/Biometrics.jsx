import { useState, useRef, useEffect, useMemo } from 'react'
import { DEPARTMENTS }                    from './biometricConstants'
import { exportToXLSX }                   from './exportToXLSX'
import { BiometricHeader }                from './components/BiometricHeader'
import { BiometricStatCards }             from './components/BiometricStatCards'
import { BiometricFilterBar }             from './components/BiometricFilterBar'
import { BiometricTable }                 from './components/BiometricTable'
import BiometricManhoursSummary           from './components/BiometricManhoursSummary'
import PageGuide                          from '../../components/ui/PageGuide'

// ── Global Import State ─────────────────────────────────────────
// Persists the "Importing..." state even if the user clicks away to another module and returns.
let globalIsImporting = false
let globalImportError = ''
let globalImportSuccess = ''
let importClearTimeout = null
const importListeners = new Set()

function setGlobalImportState(isImporting, error = '', success = '') {
  globalIsImporting = isImporting
  globalImportError = error
  globalImportSuccess = success
  importListeners.forEach(listener => listener())

  if (importClearTimeout) clearTimeout(importClearTimeout)
  if (!isImporting && (error || success)) {
    importClearTimeout = setTimeout(() => {
      globalImportError = ''
      globalImportSuccess = ''
      importListeners.forEach(listener => listener())
    }, 8000) // Auto-dismiss after 8 seconds
  }
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// Looks at the shift-in time and decides which part of the day the shift belongs to.
function shiftPeriodFromString(timeStr) {
  if (!timeStr) return 'Morning'
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 'Morning'
  let h = parseInt(match[1], 10)
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

const DAY_NAMES_MAP = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Transforms a raw DB row into the shape the UI components expect.
// Derives schedStart/schedEnd from day_schedule JSON (or falls back to shift_start/shift_end)
// so BiometricTable can compute schedule-clamped hours without a separate lookup.
const mapRow = (r) => {
  let extraTaps = null
  if (r.extra_taps) {
    try {
      extraTaps = JSON.parse(r.extra_taps)
    } catch {
      extraTaps = null
    }
  }

  // Resolve per-day schedule for this record's date
  let schedStart = r.shift_start ?? '07:00'
  let schedEnd   = r.shift_end   ?? '17:30'
  if (r.day_schedule) {
    try {
      const sched   = JSON.parse(r.day_schedule)
      const dateObj = new Date((r.date ?? '') + 'T00:00:00')
      const dayName = DAY_NAMES_MAP[dateObj.getDay()]
      const entry   = sched[dayName] ?? null
      if (entry !== null && entry) {
        schedStart = entry.start ?? schedStart
        schedEnd   = entry.end   ?? schedEnd
      }
    } catch (_) {}
  }

  return {
    employee_no : r.employee_no,
    date        : r.date,
    shift_in    : r.shift_in,
    lunch_out   : r.lunch_out,
    lunch_in    : r.lunch_in,
    shift_out   : r.shift_out,
    total_hours : r.total_hours,
    status      : r.status,
    extraTaps,
    id          : String(r.employee_no),
    name        : r.name       || '—',
    department  : r.department || '—',
    timeframe   : `${new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })} · ${shiftPeriodFromString(r.shift_in)}`,
    shiftIn    : r.shift_in,
    lunchOut   : r.lunch_out,
    lunchIn    : r.lunch_in,
    shiftOut   : r.shift_out,
    totalHours : r.total_hours,
    schedStart,
    schedEnd,
    lunchStart : r.sched_lunch_start ?? r.lunch_start ?? '12:00',
    lunchEnd   : r.sched_lunch_end   ?? r.lunch_end   ?? '13:00',
  }
}

// ── Date helpers ──────────────────────────────────────────────────

const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
}

// Converts a timeframe string like "May 14, 2025 · Morning" into an ISO date "2025-05-14".
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

// Scans all records and returns the most recent ISO date found.
// Used to auto-select the latest date after a load or import.
function latestDateIn(records) {
  let best = null
  for (const r of records) {
    const iso = timeframeToISO(r.timeframe)
    if (!iso) continue
    if (!best || iso > best) best = iso
  }
  return best
}

// Converts an ISO date string into a JS Date object at local midnight.
function isoToDate(iso) {
  if (!iso) return new Date()
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function pad2(n) { return String(n).padStart(2, '0') }

// Builds a lookup map from employee_no → { shiftStart, shiftEnd, dayOffs }
// so we can quickly check schedule rules without querying the DB again.
function buildEmployeeMap(employees) {
  const map = {}
  for (const e of employees) {
    let daySchedule = null
    if (e.day_schedule) {
      try { daySchedule = JSON.parse(e.day_schedule) } catch (_) {}
    }
    map[String(e.employee_no)] = {
      shiftStart  : e.shift_start ?? '07:00',
      shiftEnd    : e.shift_end   ?? '17:30',
      dayOffs     : e.day_offs
                     ? e.day_offs.split(',').map(d => d.trim()).filter(Boolean)
                     : ['Saturday', 'Sunday'],
      daySchedule,
    }
  }
  return map
}

function Biometrics({ refreshKey = 0, currentUser, onNavigate }) {

  const [records,     setRecords]     = useState([])
  const [employeeMap, setEmployeeMap] = useState({})
  const [isLoading,   setIsLoading]   = useState(true)

  const [searchQuery,      setSearchQuery]      = useState('')
  const [debouncedSearch,  setDebouncedSearch]  = useState('')
  const [selectedDept,     setSelectedDept]     = useState('All Departments')
  const [viewMode,         setViewMode]         = useState('Daily')
  const [pageMode,         setPageMode]         = useState('attendance')

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const [selectedDate,     setSelectedDate]     = useState(new Date())
  const [selectedMonth,    setSelectedMonth]    = useState(new Date().getMonth() + 1)
  const [selectedYear,     setSelectedYear]     = useState(new Date().getFullYear())
  const [selectedYearOnly, setSelectedYearOnly] = useState(new Date().getFullYear())

  const [importError,   setImportError]   = useState(globalImportError)
  const [importSuccess, setImportSuccess] = useState(globalImportSuccess)
  const [isImporting,   setIsImporting]   = useState(globalIsImporting)

  const fileInputRef = useRef(null)

  // Listen to background import progress
  useEffect(() => {
    const listener = () => {
      setIsImporting(globalIsImporting)
      setImportError(globalImportError)
      setImportSuccess(globalImportSuccess)
    }
    importListeners.add(listener)
    return () => importListeners.delete(listener)
  }, [])

  // On mount: load all attendance rows from the DB and map them to UI shape.
  // extra_taps is parsed inside mapRow, so extraTaps will be correct right away.
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [rows, empRows] = await Promise.all([
          window.electronAPI.getAttendance(),
          window.electronAPI.getEmployees(),
        ])
        const mapped = rows.map(mapRow)
        setRecords(mapped)
        setEmployeeMap(buildEmployeeMap(empRows))

        // Jump the date picker to the most recent record in the DB.
        const latest = latestDateIn(mapped)
        if (latest) setSelectedDate(isoToDate(latest))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [refreshKey])

  // Build the list of years that actually have records, for the year picker.
  const availableYears = [...new Set(
    records.map(r => isoYear(timeframeToISO(r.timeframe))).filter(Boolean)
  )].sort((a, b) => b - a)

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const iso = timeframeToISO(r.timeframe)

      const matchView = (() => {
        if (viewMode === 'Daily') {
          const d      = selectedDate instanceof Date ? selectedDate : new Date()
          const selISO = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
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

      const matchDept   = selectedDept === 'All Departments' || r.department === selectedDept
      const matchSearch = !debouncedSearch ||
        r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        String(r.id).toLowerCase().includes(debouncedSearch.toLowerCase())

      return matchView && matchDept && matchSearch
    })
  }, [records, viewMode, selectedDate, selectedYear, selectedMonth, selectedYearOnly, selectedDept, debouncedSearch])

  // Tally up each status category for the stat cards at the top.
  const stats = useMemo(() => {
    return {
      fullTime      : filteredRecords.filter(r => r.status === 'Full Time').length,
      late          : filteredRecords.filter(r => r.status === 'Late').length,
      undertime     : filteredRecords.filter(r => r.status === 'Undertime').length,
      lateUndertime : filteredRecords.filter(r => r.status === 'Late & Undertime').length,
      incomplete    : filteredRecords.filter(r => r.status === 'Incomplete').length,
      oneTapOnly    : filteredRecords.filter(r => r.status === 'One Tap Only').length,
      workedDayOff  : filteredRecords.filter(r => r.status === 'Worked on Day Off').length,
      absent        : filteredRecords.filter(r => r.status === 'Absent').length,
      onLeave       : filteredRecords.filter(r => r.status === 'Leave').length,
    }
  }, [filteredRecords])

  async function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setGlobalImportState(true, '', '')

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        // Yield to let React paint the "Importing..." button
        await new Promise(r => setTimeout(r, 50))
        
        // We pass the raw text string (which is small) to the Main Process.
        // This avoids the massive JSON serialization bottleneck of passing an array of 50,000 objects.
        const result = await window.electronAPI.importAttendanceRawText(evt.target.result)

        if (result.parsedCount === 0) {
          setGlobalImportState(false, 'No records could be read. Check the file matches the expected device format.', '')
          return
        }

        // Generate success message
        const successMsg = `Imported ${result.newRecords} records from ${file.name}` +
          (result.skippedRecords > 0 ? ` · ${result.skippedRecords} already existed (skipped)` : '') +
          (result.newEmployees   > 0 ? ` · ${result.newEmployees} new employee stubs created`   : '')

        // Update global state
        setGlobalImportState(false, '', successMsg)

        // Attempt to reload records immediately if the component is still mounted.
        // (If the user navigated away, the mount effect will automatically load the new data when they return).
        try {
          const rows   = await window.electronAPI.getAttendance()
          const mapped = rows.map(mapRow)
          setRecords(mapped)
          const latest = latestDateIn(mapped)
          if (latest) setSelectedDate(isoToDate(latest))
        } catch (_) {
          // Ignore state update errors on unmounted component
        }
      } catch (err) {
        setGlobalImportState(false, `Import error: ${err.message}`, '')
      }
    }
    reader.onerror = () => {
      setGlobalImportState(false, 'Could not read the file.', '')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleExport() {
    let periodKey   = ''
    let periodLabel = ''

    if (viewMode === 'Daily') {
      const d      = selectedDate instanceof Date ? selectedDate : new Date()
      const isoDay = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
      const human  = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      periodKey    = isoDay
      periodLabel  = `Daily · ${human}`
    }

    if (viewMode === 'Monthly') {
      const monthName = MONTH_NAMES[selectedMonth - 1]
      periodKey   = `${monthName}-${selectedYear}`
      periodLabel = `Monthly · ${monthName} ${selectedYear}`
    }

    if (viewMode === 'Yearly') {
      periodKey   = String(selectedYearOnly)
      periodLabel = `Yearly · ${selectedYearOnly}`
    }

    const deptSuffix = selectedDept !== 'All Departments'
      ? `_${selectedDept.replace(/\s+/g, '-')}`
      : ''

    const label = selectedDept !== 'All Departments'
      ? `${periodLabel}  ·  ${selectedDept}`
      : periodLabel

    const filename = `attendance_${viewMode.toLowerCase()}_${periodKey}${deptSuffix}.xlsx`

    await exportToXLSX(filteredRecords, filename, label)
  }

  const guideSteps = [
    {
      target: 'body',
      content: 'Welcome to the Biometrics page! Here you can view, import, and analyze all employee attendance records.',
      placement: 'center'
    },
    {
      target: '#tour-bio-stat-cards',
      content: 'These summary cards give you an instant snapshot of your attendance data for the current filter. Each card counts employees by their attendance status: Full Time, Late, Undertime, Late & Undertime, Incomplete, One Tap, Worked Rest Day, and On Leave.',
      placement: 'bottom'
    },
    {
      target: '#tour-bio-modes', // Visible in Attendance
      content: 'Use these to switch between Daily, Monthly, and Yearly attendance logs.',
      placement: 'bottom'
    },
    {
      target: '#tour-bio-date-nav', // Visible in Attendance
      content: 'Quickly navigate through time using these arrows, or click the date itself to open a calendar picker.',
      placement: 'bottom'
    },
    {
      target: '#tour-bio-table-header', // Visible in Attendance
      content: 'Click on any column header to sort the attendance log. You can also click the "SCHED/ACTUAL" button to instantly toggle between calculated shift hours and raw punching times!',
      placement: 'bottom'
    },
    {
      target: '#tour-bio-import', // Visible in Attendance
      content: 'Clicking here opens a file browser to upload raw biometric .dat or .txt files straight from your fingerprint scanner.',
      placement: 'bottom'
    },
    {
      target: '#tour-bio-export', // Visible in Attendance
      content: 'Export whichever view you are currently looking at into a neatly formatted Excel spreadsheet.',
      placement: 'bottom-end'
    },
    {
      target: '#tour-bio-tabs',
      content: 'Toggle between the detailed Attendance Log and the overarching Manhours Summary. Let\'s click Next to switch to the Summary view!',
      placement: 'bottom-start'
    },
    {
      target: '#tour-bio-dept', // In summary view, this is visible
      content: records.length > 0 
        ? 'Here in the Summary view, you can see total hours aggregated. Use this dropdown to filter by specific departments.'
        : 'Normally, you would see total manhours aggregated here. Since you have no records yet, use this dropdown to filter once you import some data.',
      placement: 'bottom'
    },
    {
      target: '#page-tour-help-btn',
      content: 'You can restart this guide anytime by clicking here.',
      placement: 'bottom-end'
    }
  ]

  useEffect(() => {
    const transitionPanel = (stateFn, advanceFn) => {
      document.body.classList.add('hide-joyride')
      stateFn()
      setTimeout(() => {
        advanceFn?.()
        document.body.classList.remove('hide-joyride')
      }, 500)
    }

    const handleNext = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 7) { // Moving from step 7 (Tabs) to step 8 (Summary Dept)
        transitionPanel(() => setPageMode('summary'), window.advanceJoyride)
      } else {
        window.advanceJoyride?.()
      }
    }

    const handlePrev = (e) => {
      e.preventDefault()
      const { index } = e.detail
      if (index === 8) { // Moving backward from step 8 (Summary Dept) to step 7 (Tabs)
        transitionPanel(() => setPageMode('attendance'), window.retreatJoyride)
      } else {
        window.retreatJoyride?.()
      }
    }
    
    const handleForceClose = () => {
      if (pageMode === 'summary') setPageMode('attendance')
    }

    window.addEventListener('tour-next-step', handleNext)
    window.addEventListener('tour-prev-step', handlePrev)
    window.addEventListener('force-close-tour', handleForceClose)
    return () => {
      window.removeEventListener('tour-next-step', handleNext)
      window.removeEventListener('tour-prev-step', handlePrev)
      window.removeEventListener('force-close-tour', handleForceClose)
    }
  }, [pageMode])

  return (
    <div className="flex flex-col w-full h-full" style={{ background: 'var(--page-bg)' }}>
      <style>{`
        [role="option"]:focus,[data-highlighted],[role="option"][data-disabled]{
          outline:none!important;border-color:transparent!important;box-shadow:none!important;
        }
        [role="option"][data-state="checked"]{background:var(--surface-hover)!important;color:var(--text-primary)!important;}
      `}</style>

      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <BiometricHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
      </div>

      <div className="px-8 py-6 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">

        <BiometricFilterBar
          pageMode={pageMode}                   setPageMode={setPageMode}
          viewMode={viewMode}                   setViewMode={setViewMode}
          selectedDate={selectedDate}           setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}         setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}           setSelectedYear={setSelectedYear}
          selectedYearOnly={selectedYearOnly}   setSelectedYearOnly={setSelectedYearOnly}
          selectedDept={selectedDept}           setSelectedDept={setSelectedDept}
          departments={DEPARTMENTS}
          availableYears={availableYears}
          isImporting={isImporting}
          onImportClick={() => {
            setGlobalImportState(false, '', '')
            fileInputRef.current?.click()
          }}
          onExport={handleExport}
        />

        <input
          type="file" accept=".txt,.dat,.log,.csv"
          ref={fileInputRef} onChange={handleFileImport}
          style={{ display: 'none' }}
        />

        {importError && (
          <div className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-strong)', borderLeft: '4px solid #ef4444', color: 'var(--text-primary)' }}>
            ⚠ {importError}
          </div>
        )}
        {importSuccess && (
          <div className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-strong)', borderLeft: '4px solid var(--accent-bg)', color: 'var(--text-primary)' }}>
            ✓ {importSuccess}
          </div>
        )}

        {pageMode === 'summary' ? (
          <BiometricManhoursSummary records={records} selectedDept={selectedDept} refreshKey={refreshKey} />
        ) : (
          <>
            <BiometricStatCards stats={stats} isLoading={isLoading} />

            <BiometricTable
              key={debouncedSearch + '|' + selectedDept + '|' + viewMode}
              records={filteredRecords}
              total={filteredRecords.length}
              viewMode={viewMode}
              isLoading={isLoading}
            />
          </>
        )}

      </div>
      <PageGuide steps={guideSteps} storageKey="seen_biometrics_tour" />
    </div>
  )
}

export default Biometrics