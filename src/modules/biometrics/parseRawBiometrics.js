// parseRawBiometrics.js
export function parseRawBiometrics(text) {

  const MIN_VALID_EMP_ID = 100
  const SHIFT_START_HOUR = 7
  const LATE_CUTOFF_MIN  = 15   // 7:15 AM

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Map: "employee_no_YYYY-MM-DD" → { employee_no, date, ins: [], outs: [] }
  const punchMap = {}

  for (const line of lines) {
    const cols = line.split(/\s+/)
    // expected: [emp_id, date, time, 1, punch_type, 1, 0]
    if (cols.length < 5) continue

    const rawId      = cols[0].trim()
    const rawDate    = cols[1].trim()   // "YYYY-MM-DD"
    const rawTime    = cols[2].trim()   // "HH:MM:SS"
    const punchType  = cols[4].trim()   // "0" = IN, "1" = OUT

    const empIdNum = parseInt(rawId, 10)
    if (isNaN(empIdNum) || empIdNum < MIN_VALID_EMP_ID) continue

    const dt = new Date(`${rawDate}T${rawTime}`)
    if (isNaN(dt.getTime())) continue

    const employee_no = String(empIdNum)
    const mapKey      = `${employee_no}_${rawDate}`

    if (!punchMap[mapKey]) {
      punchMap[mapKey] = { employee_no, date: rawDate, ins: [], outs: [] }
    }

    if (punchType === '0') {
      punchMap[mapKey].ins.push(dt)   // tapped IN
    } else if (punchType === '1') {
      punchMap[mapKey].outs.push(dt)  // tapped OUT
    }
  }

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null

  const parsed = []

  for (const entry of Object.values(punchMap)) {
    entry.ins.sort((a, b)  => a - b)
    entry.outs.sort((a, b) => a - b)

    // First IN punch = shift start
    const firstIn  = entry.ins[0]  ?? null
    // Last OUT punch = shift end
    const lastOut  = entry.outs[entry.outs.length - 1] ?? null

    // ── Status ───────────────────────────────────────────────
    let status = 'Absent'
    if (firstIn) {
      const minsAfterShiftStart =
        (firstIn.getHours() - SHIFT_START_HOUR) * 60 + firstIn.getMinutes()
      status = minsAfterShiftStart > LATE_CUTOFF_MIN ? 'Late' : 'Present'
    }

    // ── Total Hours ──────────────────────────────────────────
    // Shift Out - Shift In - 1.5 hours (1hr lunch + 30min break)
    let totalHours = null
    if (firstIn && lastOut) {
      const diffMs    = lastOut - firstIn
      const diffHours = diffMs / (1000 * 60 * 60)
      const net       = diffHours - 1.5
      totalHours      = net > 0 ? Math.round(net * 100) / 100 : 0
    }

    const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    parsed.push({
      // ── DB fields ──────────────────────────────────────────
      employee_no : entry.employee_no,
      date        : entry.date,
      shift_in    : fmt(firstIn)  ?? null,
      shift_out   : fmt(lastOut)  ?? null,
      total_hours : totalHours,
      status,

      // ── UI fields ──────────────────────────────────────────
      id          : `EMP-${entry.employee_no}`,
      name        : '',
      department  : '—',
      timeframe   : `${dateLabel} · Morning`,
      shiftIn     : fmt(firstIn)  ?? null,
      shiftOut    : fmt(lastOut)  ?? null,
    })
  }

  parsed.sort((a, b) =>
    a.date.localeCompare(b.date) || a.employee_no.localeCompare(b.employee_no)
  )

  return parsed
}