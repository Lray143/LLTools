// employeeMap shape: { [employee_no]: { shiftStart: "07:00", shiftEnd: "17:30", dayOffs: ["Saturday","Sunday"] } }
export function parseRawBiometrics(text, employeeMap = {}) {

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
  function expectedHours(startStr, endStr) {
    const s = parseHHMM(startStr)
    const e = parseHHMM(endStr)
    if (!s || !e) return 8.5
    const diff = (e.hours * 60 + e.minutes) - (s.hours * 60 + s.minutes)
    // subtract standard 1hr lunch
    return Math.max(0, (diff / 60) - 1)
  }

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const punchMap = {}

  for (const line of lines) {
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

  for (const entry of Object.values(punchMap)) {
    entry.ins.sort((a, b)  => a - b)
    entry.outs.sort((a, b) => a - b)

    // ── Per-employee schedule ─────────────────────────────────
    const empSchedule  = employeeMap[entry.employee_no] ?? {}
    const shiftStartStr = empSchedule.shiftStart ?? DEFAULT_START
    const shiftEndStr   = empSchedule.shiftEnd   ?? DEFAULT_END
    const dayOffs       = empSchedule.dayOffs     ?? DEFAULT_DAY_OFFS
    const minHours      = expectedHours(shiftStartStr, shiftEndStr)

    // Parse shift start into hours + minutes for late check
    const shiftStartParsed = parseHHMM(shiftStartStr) ?? { hours: 7, minutes: 0 }

    // ── Check if this date is a day off ───────────────────────
    const dateObj    = new Date(entry.date + 'T00:00:00')
    const dayName    = DAY_NAMES[dateObj.getDay()]
    const isDayOff   = dayOffs.includes(dayName)

    const totalTaps  = entry.ins.length + entry.outs.length

    // ── Resolve tap slots ─────────────────────────────────────
    const insUsed  = new Set()
    const outsUsed = new Set()

    const shiftIn = entry.ins[0] ?? null
    if (shiftIn) insUsed.add(0)

    let lunchOut = null
    let lunchIn  = null
    if (entry.ins.length >= 2 && entry.outs.length >= 1) {
      lunchOut = entry.outs[0]
      outsUsed.add(0)
      lunchIn = entry.ins[1]
      insUsed.add(1)
    }

    let shiftOut = null
    if (lunchOut !== null) {
      if (entry.outs.length >= 2) {
        const idx = entry.outs.length - 1
        shiftOut = entry.outs[idx]
        outsUsed.add(idx)
      }
    } else {
      if (entry.outs.length >= 1) {
        const idx = entry.outs.length - 1
        shiftOut = entry.outs[idx]
        outsUsed.add(idx)
      }
    }

    if (!shiftOut && totalTaps >= 5 && shiftIn) {
      for (let i = entry.outs.length - 1; i >= 0; i--) {
        if (!outsUsed.has(i)) {
          shiftOut = entry.outs[i]
          outsUsed.add(i)
          break
        }
      }
    }

    // ── Extra taps ────────────────────────────────────────────
    const rawExtras = []
    entry.ins.forEach((d, i) => {
      if (!insUsed.has(i)) rawExtras.push({ dt: d, time: fmt(d), type: 'IN' })
    })
    entry.outs.forEach((d, i) => {
      if (!outsUsed.has(i)) rawExtras.push({ dt: d, time: fmt(d), type: 'OUT' })
    })
    rawExtras.sort((a, b) => a.dt - b.dt)
    const extraTaps = rawExtras.length > 0
      ? rawExtras.map(({ time, type }) => ({ time, type }))
      : null

    // ── Total Hours ───────────────────────────────────────────
    let totalHours = null
    if (shiftIn && shiftOut) {
      const shiftHrs = (shiftOut - shiftIn) / (1000 * 60 * 60)
      let deduction = 1
      if (lunchOut && lunchIn) {
        deduction = (lunchIn - lunchOut) / (1000 * 60 * 60)
      }
      const net = shiftHrs - deduction
      totalHours = net > 0 ? Math.round(net * 100) / 100 : 0
    }

    // ── Status ────────────────────────────────────────────────
    let status

    if (isDayOff && totalTaps === 0) {
      // No taps on a scheduled day off → just skip / mark as day off
      status = 'Day Off'
    } else if (totalTaps === 0) {
      status = 'Absent'
    } else if (!shiftIn || !shiftOut) {
      status = 'Incomplete'
    } else {
      // Late = arrived more than LATE_CUTOFF_MIN after their shift start
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
      employee_no : entry.employee_no,
      date        : entry.date,
      shift_in    : fmt(shiftIn),
      lunch_out   : fmt(lunchOut),
      lunch_in    : fmt(lunchIn),
      shift_out   : fmt(shiftOut),
      total_hours : totalHours,
      status,
      extraTaps,
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
    })
  }

  parsed.sort((a, b) =>
    a.date.localeCompare(b.date) || a.employee_no.localeCompare(b.employee_no)
  )

  return parsed
}