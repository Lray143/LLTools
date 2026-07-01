require('dotenv').config()
const { createClient } = require('@libsql/client')
const path = require('path')

// Exact copies of UI functions
function parseTime12h(t) {
  if (!t) return null
  const [time, meridiem] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return h * 60 + m
}

function parseHHMM(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

function minutesToDecimalHours(minutes) {
  if (minutes == null || minutes <= 0) return 0
  return Math.round((minutes / 60) * 100) / 100
}

function calcActualHoursDecimal(r) {
  const inMin  = parseTime12h(r.shiftIn)
  let outMin = parseTime12h(r.shiftOut)
  if (inMin == null || outMin == null) return null
  if (outMin < inMin) outMin += 1440
  let diff = outMin - inMin
  const lStart = parseHHMM(r.lunchStart ?? '12:00') ?? (12 * 60)
  let lEnd   = parseHHMM(r.lunchEnd ?? '13:00')   ?? (13 * 60)
  if (lEnd < lStart) lEnd += 1440
  let alignedLStart = lStart
  let alignedLEnd = lEnd
  if (inMin > 12 * 60 && lStart < 12 * 60) {
    alignedLStart += 1440
    alignedLEnd += 1440
  }
  const overlapSchedStart = Math.max(inMin, alignedLStart)
  const overlapSchedEnd   = Math.min(outMin, alignedLEnd)
  const schedDeduction    = Math.max(0, overlapSchedEnd - overlapSchedStart)
  diff -= schedDeduction
  if (diff <= 0) return 0
  return minutesToDecimalHours(diff)
}

function calcScheduledHoursDecimal(r) {
  const tapIn  = parseTime12h(r.shiftIn)
  let tapOut = parseTime12h(r.shiftOut)
  if (tapIn == null || tapOut == null) return null
  if (tapOut < tapIn) tapOut += 1440
  const schedIn  = parseHHMM(r.schedStart)
  let schedOut = parseHHMM(r.schedEnd)
  if (schedIn == null || schedOut == null) return calcActualHoursDecimal(r)
  if (schedOut < schedIn) schedOut += 1440
  let alignedSchedIn = schedIn
  let alignedSchedOut = schedOut
  if (tapIn > 12 * 60 && schedIn < 12 * 60) {
    alignedSchedIn += 1440
    alignedSchedOut += 1440
  }
  const effectiveIn  = Math.max(tapIn, alignedSchedIn)
  const effectiveOut = Math.min(tapOut, alignedSchedOut)
  if (effectiveOut <= effectiveIn) return 0
  let diff = effectiveOut - effectiveIn
  const lStart = parseHHMM(r.lunchStart ?? '12:00') ?? (12 * 60)
  let lEnd   = parseHHMM(r.lunchEnd ?? '13:00')   ?? (13 * 60)
  if (lEnd < lStart) lEnd += 1440
  let alignedLStart = lStart
  let alignedLEnd = lEnd
  if (tapIn > 12 * 60 && lStart < 12 * 60) {
    alignedLStart += 1440
    alignedLEnd += 1440
  }
  const overlapSchedStart = Math.max(effectiveIn, alignedLStart)
  const overlapSchedEnd   = Math.min(effectiveOut, alignedLEnd)
  const schedDeduction    = Math.max(0, overlapSchedEnd - overlapSchedStart)
  diff -= schedDeduction
  if (diff <= 0) return 0
  return minutesToDecimalHours(diff)
}

const EXCLUDED_MANHOUR_STATUSES = new Set(['Absent','Incomplete','Day Off','Worked on Day Off','One Tap Only'])

function resolveRecordHours(r, mode = 'actual') {
  const fromPunches = mode === 'scheduled' ? calcScheduledHoursDecimal(r) : calcActualHoursDecimal(r)
  if (fromPunches != null) return fromPunches
  const stored = Number(r.totalHours ?? r.total_hours)
  return Number.isFinite(stored) ? stored : 0
}

async function main() {
  const client = createClient({ url: 'file:' + path.join(process.env.APPDATA, 'lltools', 'lltools-turso.db') })
  
  // Fetch employees to build day_schedule mapping
  const empRes = await client.execute('SELECT * FROM employees')
  const empMap = {}
  for (const e of empRes.rows) {
    let daySchedule = null
    if (e.day_schedule) { try { daySchedule = JSON.parse(e.day_schedule) } catch(_) {} }
    empMap[String(e.employee_no)] = {
      shiftStart  : e.shift_start ?? '07:00',
      shiftEnd    : e.shift_end   ?? '17:30',
      lunchStart  : e.lunch_start ?? '12:00',
      lunchEnd    : e.lunch_end   ?? '13:00',
      daySchedule,
    }
  }

  // Fetch all 2025 attendance
  const attRes = await client.execute("SELECT * FROM attendance WHERE date LIKE '2025%'")
  const records = attRes.rows

  console.log(`[DB] Found ${records.length} records in 2025`)

  let sumSched = 0
  let sumSchedWithDO = 0
  let sumActual = 0
  let sumActualWithDO = 0

  const DAY_NAMES_MAP = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  for (const row of records) {
    const e = empMap[String(row.employee_no)] || {}
    let schedStart = e.shiftStart ?? '07:00'
    let schedEnd   = e.shiftEnd   ?? '17:30'
    if (e.daySchedule) {
      const dateObj = new Date((row.date ?? '') + 'T00:00:00')
      const dayName = DAY_NAMES_MAP[dateObj.getDay()]
      const entry   = e.daySchedule[dayName]
      if (entry) {
        schedStart = entry.start ?? schedStart
        schedEnd   = entry.end   ?? schedEnd
      }
    }

    const r = {
      shiftIn: row.shift_in,
      shiftOut: row.shift_out,
      lunchStart: e.lunchStart ?? '12:00',
      lunchEnd: e.lunchEnd ?? '13:00',
      schedStart,
      schedEnd,
      status: row.status,
      total_hours: row.total_hours
    }

    const hrsSched = resolveRecordHours(r, 'scheduled')
    const hrsActual = resolveRecordHours(r, 'actual')

    const isExcluded = EXCLUDED_MANHOUR_STATUSES.has(r.status)
    
    if (!isExcluded) {
      if (hrsSched > 0) sumSched += hrsSched
      if (hrsActual > 0) sumActual += hrsActual
    }

    const includeDayOff = (r.status === 'Worked on Day Off')
    if (!isExcluded || includeDayOff) {
      if (hrsSched > 0) sumSchedWithDO += hrsSched
      if (hrsActual > 0) sumActualWithDO += hrsActual
    }
  }

  console.log('UI Calculation Simulation:')
  console.log(`Scheduled (no DO)  : ${sumSched.toFixed(2)}`)
  console.log(`Scheduled (with DO): ${sumSchedWithDO.toFixed(2)}`)
  console.log(`Actual (no DO)     : ${sumActual.toFixed(2)}`)
  console.log(`Actual (with DO)   : ${sumActualWithDO.toFixed(2)}`)
}

main()
