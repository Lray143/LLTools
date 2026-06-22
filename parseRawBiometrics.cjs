// employeeMap shape:
// { [employee_no]: { shiftStart, shiftEnd, dayOffs, daySchedule } }
// daySchedule: { Monday: { start, end } | null, ... }
async function parseRawBiometrics(text, employeeMap = {}) {

  const MIN_VALID_EMP_ID  = 100
  const DEFAULT_START     = "07:00"
  const DEFAULT_END       = "17:30"
  const DEFAULT_DAY_OFFS  = ["Saturday", "Sunday"]
  const LATE_CUTOFF_MIN   = 15   // grace period in minutes

  // Parse "HH:MM" → { hours, minutes }
  function parseHHMM(str) {
    if (!str) return null
    const [h, m] = str.split(":").map(Number)
    if (isNaN(h) || isNaN(m)) return null
    return { hours: h, minutes: m }
  }

  // Total shift duration in hours from shiftStart/shiftEnd strings
  function expectedHours(startStr, endStr, lunchStartStr, lunchEndStr) {
    const s = parseHHMM(startStr)
    const e = parseHHMM(endStr)
    if (!s || !e) return 8.5

    const startMins = s.hours * 60 + s.minutes
    const endMins = e.hours * 60 + e.minutes
    const diff = endMins - startMins

    let lunchDeductionMins = 60 // fallback
    const ls = parseHHMM(lunchStartStr)
    const le = parseHHMM(lunchEndStr)
    if (ls && le) {
       const lunchStartMins = ls.hours * 60 + ls.minutes
       const lunchEndMins = le.hours * 60 + le.minutes
       
       const overlapStart = Math.max(startMins, lunchStartMins)
       const overlapEnd = Math.min(endMins, lunchEndMins)
       if (overlapEnd > overlapStart) {
         lunchDeductionMins = overlapEnd - overlapStart
       } else {
         lunchDeductionMins = 0 // no overlap
       }
    }

    return Math.max(0, (diff - lunchDeductionMins) / 60)
  }

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

  // Yield to avoid freezing the UI for massive files
  await new Promise(r => setTimeout(r, 10))

  const lines = text.split('\n')
  const punchMap = {}

  let processedCount = 0
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const cols = line.split(/\s+/)
    if (cols.length < 5) continue

    const rawId     = cols[0].trim()
    const rawDate   = cols[1].trim()
    const rawTime   = cols[2].trim()
    const punchType = cols[4].trim()

    const empIdNum = parseInt(rawId, 10)
    if (isNaN(empIdNum) || empIdNum < MIN_VALID_EMP_ID) continue

    const dt = new Date(`${rawDate}T${rawTime}`)
    if (isNaN(dt.getTime())) continue

    const employee_no = String(empIdNum)
    const mapKey      = `${employee_no}_${rawDate}`

    if (!punchMap[mapKey]) {
      punchMap[mapKey] = { employee_no, date: rawDate, ins: [], outs: [] }
    }

    if      (punchType === '0') punchMap[mapKey].ins.push(dt)
    else if (punchType === '1') punchMap[mapKey].outs.push(dt)

    processedCount++
    if (processedCount % 5000 === 0) {
      // Yield every 5000 lines
      await new Promise(r => setTimeout(r, 0))
    }
  }

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null

  const shiftPeriod = (d) => {
    if (!d) return 'Morning'
    const h = d.getHours()
    if (h < 12) return 'Morning'
    if (h < 17) return 'Afternoon'
    return 'Evening'
  }

  const parsed = []
  
  const entries = Object.values(punchMap)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    
    // Yield every 100 entries to keep the UI smooth
    if (i > 0 && i % 100 === 0) {
      await new Promise(r => setTimeout(r, 0))
    }

    entry.ins.sort((a, b)  => a - b)
    entry.outs.sort((a, b) => a - b)

    // ── Per-employee schedule ─────────────────────────────────
    const empSchedule  = employeeMap[entry.employee_no] ?? {}
    const daySchedule  = empSchedule.daySchedule ?? null   // per-day map

    // ── Day of week for this record ───────────────────────────
    const dateObj    = new Date(entry.date + 'T00:00:00')
    const dayName    = DAY_NAMES[dateObj.getDay()]

    // ── Resolve shift times from per-day schedule or flat fallback ──
    let shiftStartStr, shiftEndStr, isDayOff

    if (daySchedule) {
      const dayEntry = daySchedule[dayName] ?? null
      if (dayEntry === null) {
        // Explicitly a day off in the per-day schedule
        isDayOff      = true
        shiftStartStr = DEFAULT_START
        shiftEndStr   = DEFAULT_END
      } else {
        isDayOff      = false
        shiftStartStr = dayEntry.start ?? DEFAULT_START
        shiftEndStr   = dayEntry.end   ?? DEFAULT_END
      }
    } else {
      // Fallback to flat schedule
      shiftStartStr = empSchedule.shiftStart ?? DEFAULT_START
      shiftEndStr   = empSchedule.shiftEnd   ?? DEFAULT_END
      const dayOffs = empSchedule.dayOffs    ?? DEFAULT_DAY_OFFS
      isDayOff      = dayOffs.includes(dayName)
    }

    const minHours         = expectedHours(shiftStartStr, shiftEndStr, empSchedule.lunchStart ?? '12:00', empSchedule.lunchEnd ?? '13:00')
    const shiftStartParsed = parseHHMM(shiftStartStr) ?? { hours: 7, minutes: 0 }

    const totalTaps  = entry.ins.length + entry.outs.length

    // ── Resolve tap slots ─────────────────────────────────────
    const insUsed  = new Set()
    const outsUsed = new Set()

    const shiftIn = entry.ins[0] ?? null
    if (shiftIn !== null) insUsed.add(0)

    let shiftOut = null
    if (entry.outs.length >= 1) {
      const lastIdx = entry.outs.length - 1
      shiftOut = entry.outs[lastIdx]
      outsUsed.add(lastIdx)
    }

    let lunchOut = null
    let lunchIn  = null
    for (let oi = 0; oi < entry.outs.length - 1; oi++) {
      for (let ii = 1; ii < entry.ins.length; ii++) {
        if (!insUsed.has(ii) && entry.ins[ii] > entry.outs[oi]) {
          lunchOut = entry.outs[oi]
          lunchIn  = entry.ins[ii]
          outsUsed.add(oi)
          insUsed.add(ii)
          break
        }
      }
      if (lunchOut !== null) break
    }

    // ── Extra taps ────────────────────────────────────────────
    const rawExtras = []
    entry.ins.forEach((d, idx) => {
      if (!insUsed.has(idx)) rawExtras.push({ dt: d, time: fmt(d), type: 'IN' })
    })
    entry.outs.forEach((d, idx) => {
      if (!outsUsed.has(idx)) rawExtras.push({ dt: d, time: fmt(d), type: 'OUT' })
    })
    rawExtras.sort((a, b) => a.dt - b.dt)
    const extraTaps = rawExtras.length > 0
      ? rawExtras.map(({ time, type }) => ({ time, type }))
      : null

    // ── Lunch deduction helper ────────────────────────────────
    let lunchDeductionMs = 0
    if (lunchOut && lunchIn) {
      lunchDeductionMs = lunchIn - lunchOut
    } else {
      const ls = parseHHMM(empSchedule.lunchStart ?? '12:00')
      const le = parseHHMM(empSchedule.lunchEnd ?? '13:00')
      
      if (ls && le && shiftIn && shiftOut) {
         const lunchStartDt = new Date(shiftIn)
         lunchStartDt.setHours(ls.hours, ls.minutes, 0, 0)
         
         const lunchEndDt = new Date(shiftIn)
         lunchEndDt.setHours(le.hours, le.minutes, 0, 0)

         const overlapStart = Math.max(shiftIn.getTime(), lunchStartDt.getTime())
         const overlapEnd = Math.min(shiftOut.getTime(), lunchEndDt.getTime())

         if (overlapEnd > overlapStart) {
           lunchDeductionMs = overlapEnd - overlapStart
         }
      } else {
         lunchDeductionMs = 60 * 60 * 1000 // default fallback
      }
    }

    // ── Total Hours (RAW — tap-in to tap-out) ─────────────────
    let totalHours = null
    if (shiftIn && shiftOut) {
      const rawMs  = (shiftOut - shiftIn) - lunchDeductionMs
      const rawHrs = rawMs / (1000 * 60 * 60)
      totalHours = rawHrs > 0 ? Math.round(rawHrs * 100) / 100 : 0
    }

    // ── Status ────────────────────────────────────────────────
    let status

    if (isDayOff && totalTaps === 0) {
      status = 'Day Off'
    } else if (totalTaps === 0) {
      status = 'Absent'
    } else if (!shiftIn || !shiftOut) {
      status = 'Incomplete'
    } else {
      const minsAfterStart =
        (shiftIn.getHours() - shiftStartParsed.hours) * 60 +
        (shiftIn.getMinutes() - shiftStartParsed.minutes)
      const isLate      = minsAfterStart > LATE_CUTOFF_MIN
      const isUndertime = totalHours !== null && totalHours < minHours

      if      (isLate && isUndertime) status = 'Late & Undertime'
      else if (isLate)                status = 'Late'
      else if (isUndertime)           status = 'Undertime'
      else                            status = 'Full Time'
    }

    const period = shiftPeriod(shiftIn)

    parsed.push({
      employee_no        : entry.employee_no,
      date               : entry.date,
      shift_in           : fmt(shiftIn),
      lunch_out          : fmt(lunchOut),
      lunch_in           : fmt(lunchIn),
      shift_out          : fmt(shiftOut),
      total_hours        : totalHours,
      status,
      extraTaps,
      // Snapshot the employee's lunch schedule at import time
      // so historical records are unaffected by future lunch schedule changes
      sched_lunch_start  : empSchedule.lunchStart ?? '12:00',
      sched_lunch_end    : empSchedule.lunchEnd   ?? '13:00',
      id         : `EMP-${entry.employee_no}`,
      name       : '',
      department : '—',
      timeframe  : `${new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                     month: 'long', day: 'numeric', year: 'numeric',
                   })} · ${period}`,
      shiftIn    : fmt(shiftIn),
      lunchOut   : fmt(lunchOut),
      lunchIn    : fmt(lunchIn),
      shiftOut   : fmt(shiftOut),
      // Expose schedule times so BiometricTable can compute scheduled hours
      schedStart : shiftStartStr,
      schedEnd   : shiftEndStr,
      lunchStart : empSchedule.lunchStart ?? '12:00',
      lunchEnd   : empSchedule.lunchEnd ?? '13:00',
    })
  }

  // Yield before sorting just in case
  await new Promise(r => setTimeout(r, 0))

  parsed.sort((a, b) =>
    a.date.localeCompare(b.date) || a.employee_no.localeCompare(b.employee_no)
  )

  return parsed
}

module.exports = { parseRawBiometrics }