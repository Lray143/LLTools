// ─────────────────────────────────────────────────────────────
// parseRawBiometrics.js
// Converts raw .txt/.dat log from fingerprint device into
// structured record objects for the attendance table.
//
// ── HOW TO ADJUST FOR YOUR DEVICE ────────────────────────────
// Update the constants in the ADJUST block:
//   FIELD_SEPARATOR  — '\t' for tab, ',' for CSV, /\s+/ for spaces
//   EMP_ID_COLUMN    — 0-based column index of the employee ID
//   DATETIME_COLUMN  — 0-based column index of the timestamp
//   NAME_COLUMN      — set to -1 if name is not in the file
//   HEADER_ROWS      — number of header rows to skip
// ─────────────────────────────────────────────────────────────

export function parseRawBiometrics(text) {

  // ── ADJUST THESE FOR YOUR DEVICE ─────────────────────────────
  const FIELD_SEPARATOR  = /\t|,/
  const EMP_ID_COLUMN    = 1
  const DATETIME_COLUMN  = 2
  const NAME_COLUMN      = -1   // -1 = not in file
  const HEADER_ROWS      = 1
  const SHIFT_START_HOUR = 8
  const LATE_CUTOFF_MIN  = 15   // grace period in minutes
  // ─────────────────────────────────────────────────────────────

  const lines    = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dataLines = lines.slice(HEADER_ROWS)
  const punchMap  = {}

  for (const line of dataLines) {
    const cols    = line.split(FIELD_SEPARATOR).map(c => c.trim())
    if (cols.length < 3) continue

    const rawId   = cols[EMP_ID_COLUMN]   || ''
    const rawTime = cols[DATETIME_COLUMN] || ''
    const name    = NAME_COLUMN >= 0 ? (cols[NAME_COLUMN] || '') : ''

    let dt = new Date(rawTime)
    if (isNaN(dt.getTime())) {
      dt = new Date(rawTime.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'))
    }
    if (isNaN(dt.getTime())) continue

    const empId  = rawId.startsWith('EMP')
      ? rawId
      : `EMP-${String(rawId).padStart(3, '0')}`

    const dateKey = dt.toISOString().slice(0, 10)
    const mapKey  = `${empId}_${dateKey}`

    if (!punchMap[mapKey]) {
      punchMap[mapKey] = { empId, name, date: dateKey, punches: [] }
    }
    punchMap[mapKey].punches.push(dt)
  }

  const parsed = []

  for (const entry of Object.values(punchMap)) {
    entry.punches.sort((a, b) => a - b)

    const fmt = (d) => d
      ? d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
      : null

    const [p0, p1, p2, p3] = entry.punches

    let status = 'Absent'
    if (p0) {
      const minsLate = (p0.getHours() - SHIFT_START_HOUR) * 60 + p0.getMinutes()
      status = minsLate > LATE_CUTOFF_MIN ? 'Late' : 'Present'
    }

    const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
      month:'long', day:'numeric', year:'numeric',
    })

    parsed.push({
      id        : entry.empId,
      name      : entry.name || entry.empId,
      department: '—',   // TODO: join from Employees table
      timeframe : `${dateLabel} · Morning`,
      shiftIn   : fmt(p0) ?? null,
      lunchOut  : fmt(p1) ?? null,
      lunchIn   : fmt(p2) ?? null,
      shiftOut  : fmt(p3) ?? null,
      status,
    })
  }

  return parsed
}