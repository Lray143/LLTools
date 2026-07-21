import { useState, useRef, useEffect }    from 'react'
import { DEPARTMENTS }                    from './myAttendanceConstants'
import { exportToXLSX }                   from './exportMyAttendanceXLSX'
import { MyAttendanceHeader }             from './components/MyAttendanceHeader'
import { MyAttendanceStatCards }          from './components/MyAttendanceStatCards'
import { MyAttendanceFilterBar }          from './components/MyAttendanceFilterBar'
import { MyAttendanceTable }              from './components/MyAttendanceTable'
import PageGuide                          from '../../components/ui/PageGuide'

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
    lunchStart : r.lunch_start ?? '12:00',
    lunchEnd   : r.lunch_end   ?? '13:00',
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

function MyAttendance({ currentUser, refreshKey = 0, onNavigate }) {

  const [records,     setRecords]     = useState([])
  const [employeeMap, setEmployeeMap] = useState({})

  const [viewMode,         setViewMode]         = useState('Daily')

  const [selectedDate,     setSelectedDate]     = useState(new Date())
  const [selectedMonth,    setSelectedMonth]    = useState(new Date().getMonth() + 1)
  const [selectedYear,     setSelectedYear]     = useState(new Date().getFullYear())
  const [selectedYearOnly, setSelectedYearOnly] = useState(new Date().getFullYear())

  // On mount: load all attendance rows from the DB and map them to UI shape.
  // extra_taps is parsed inside mapRow, so extraTaps will be correct right away.
  useEffect(() => {
    async function load() {
      const [rows, empRows] = await Promise.all([
        window.electronAPI.getMyAttendance(currentUser?.employeeId),
        window.electronAPI.getEmployees(),
      ])
      const mapped = rows.map(mapRow)
      setRecords(mapped)
      setEmployeeMap(buildEmployeeMap(empRows))

      // Jump the date picker to the most recent record in the DB.
      const latest = latestDateIn(mapped)
      if (latest) setSelectedDate(isoToDate(latest))
    }
    load()
  }, [currentUser?.employeeId, refreshKey])

  // Build the list of years that actually have records, for the year picker.
  const availableYears = [...new Set(
    records.map(r => isoYear(timeframeToISO(r.timeframe))).filter(Boolean)
  )].sort((a, b) => b - a)

  // Filter records based on the current view mode, department, and search query.
  const filteredRecords = records.filter(r => {
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

    return matchView
  })

  // Tally up each status category for the stat cards at the top.
  const stats = {
    fullTime      : filteredRecords.filter(r => r.status === 'Full Time').length,
    late          : filteredRecords.filter(r => r.status === 'Late').length,
    undertime     : filteredRecords.filter(r => r.status === 'Undertime').length,
    lateUndertime : filteredRecords.filter(r => r.status === 'Late & Undertime').length,
    incomplete    : filteredRecords.filter(r => r.status === 'Incomplete').length,
    absent        : filteredRecords.filter(r => r.status === 'Absent').length,
    onLeave       : filteredRecords.filter(r => r.status === 'Leave').length,
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

    const label = periodLabel

    const filename = `my_attendance_${viewMode.toLowerCase()}_${periodKey}.xlsx`

    await exportToXLSX(filteredRecords, filename, label)
  }

  const guideSteps = [
    {
      target: 'body',
      content: 'Welcome to the My Attendance page! Here you can keep track of all your personal attendance records.',
      placement: 'center'
    },
    {
      target: '#tour-my-att-stat-cards',
      content: 'These summary cards show a quick breakdown of your attendance status for the selected period. Each card tells you how many days you were Full Time, Late, Undertime, Incomplete, or On Leave.',
      placement: 'bottom'
    },
    {
      target: '#tour-my-att-modes',
      content: 'Switch between Daily, Monthly, and Yearly views to look at your attendance over different time periods.',
      placement: 'bottom'
    },
    {
      target: '#tour-my-att-date-nav',
      content: 'Navigate through time using these arrows, or click the date pill to jump to a specific period using the calendar.',
      placement: 'bottom'
    },
    {
      target: '#tour-my-att-table-header',
      content: 'Click on any column header to sort your logs. You can also click the SCHED/ACTUAL button on the Total Hours column to toggle between your calculated shift hours and your raw tapping times.',
      placement: 'center'
    },
    {
      target: '#tour-my-att-export',
      content: 'Need a copy of your records? Click here to export your current view into a cleanly formatted Excel spreadsheet.',
      placement: 'bottom-end'
    },
    {
      target: '#page-tour-help-btn',
      content: 'You can restart this guide anytime by clicking here.',
      placement: 'bottom-end'
    }
  ]

  return (
    <div className="flex flex-col w-full h-full" style={{ background: 'var(--page-bg)' }}>
      <style>{`
        [role="option"]:focus,[data-highlighted],[role="option"][data-disabled]{
          outline:none!important;border-color:transparent!important;box-shadow:none!important;
        }
        [role="option"][data-state="checked"]{background:var(--surface-hover)!important;color:var(--text-primary)!important;}
      `}</style>

      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <MyAttendanceHeader currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
      </div>

      <div className="px-8 py-6 flex flex-col gap-6 flex-1 min-h-0">

        <MyAttendanceStatCards stats={stats} />

        <MyAttendanceFilterBar
          viewMode={viewMode}                   setViewMode={setViewMode}
          selectedDate={selectedDate}           setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}         setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}           setSelectedYear={setSelectedYear}
          selectedYearOnly={selectedYearOnly}   setSelectedYearOnly={setSelectedYearOnly}
          availableYears={availableYears}
          onExport={handleExport}
        />

        <MyAttendanceTable
          key={viewMode}
          records={filteredRecords}
          total={filteredRecords.length}
          viewMode={viewMode}
        />

      </div>

      <PageGuide steps={guideSteps} storageKey="seen_my_attendance_tour" />
    </div>
  )
}

export default MyAttendance