// parseRawBiometrics.js
export function parseRawBiometrics(text) {

  const SHIFT_START_HOUR = 7
  const LATE_CUTOFF_MIN  = 15
  const MIN_VALID_EMP_ID = 100

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const punchMap = {}

  for (const line of lines) {
    const cols = line.split(/\s+/)
    if (cols.length < 3) continue

    const rawId   = cols[0].trim()
    const rawDate = cols[1].trim()
    const rawTime = cols[2].trim()

    const empIdNum = parseInt(rawId, 10)
    if (isNaN(empIdNum) || empIdNum < MIN_VALID_EMP_ID) continue

    const dt = new Date(`${rawDate}T${rawTime}`)
    if (isNaN(dt.getTime())) continue

    const employee_no = String(empIdNum)
    const mapKey      = `${employee_no}_${rawDate}`

    if (!punchMap[mapKey]) {
      punchMap[mapKey] = { employee_no, date: rawDate, punches: [] }
    }
    punchMap[mapKey].punches.push(dt)
  }

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null

  const parsed = []

  for (const entry of Object.values(punchMap)) {
    entry.punches.sort((a, b) => a - b)

    const deduped = entry.punches.filter((dt, i, arr) =>
      i === 0 || (dt - arr[i - 1]) > 60_000
    )

    const [p0, p1, p2, p3] = deduped

    let status = 'Absent'
    if (p0) {
      const totalMins = (p0.getHours() - SHIFT_START_HOUR) * 60 + p0.getMinutes()
      status = totalMins > LATE_CUTOFF_MIN ? 'Late' : 'Present'
    }

    const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    parsed.push({
      // ── used by the DB import ──────────────────────────────
      employee_no : entry.employee_no,
      date        : entry.date,
      shift_in    : fmt(p0) ?? null,
      lunch_out   : fmt(p1) ?? null,
      lunch_in    : fmt(p2) ?? null,
      shift_out   : fmt(p3) ?? null,
      status,

      // ── used by the UI table ───────────────────────────────
      id          : `EMP-${entry.employee_no}`,
      name        : '',
      department  : '—',
      timeframe   : `${dateLabel} · Morning`,
      shiftIn     : fmt(p0) ?? null,
      lunchOut    : fmt(p1) ?? null,
      lunchIn     : fmt(p2) ?? null,
      shiftOut    : fmt(p3) ?? null,
    })
  }

  parsed.sort((a, b) =>
    a.date.localeCompare(b.date) || a.employee_no.localeCompare(b.employee_no)
  )

  return parsed
}