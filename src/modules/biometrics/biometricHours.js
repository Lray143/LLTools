// Shared hour calculations — used by Attendance table display and Manhours Summary.
// Keep in sync with parseRawBiometrics.cjs lunch/default logic.

export function parseTime12h(t) {
  if (!t) return null
  const [time, meridiem] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return h * 60 + m
}

export function parseHHMM(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

function minutesToDecimalHours(minutes) {
  if (minutes == null || minutes <= 0) return 0
  return Math.round((minutes / 60) * 100) / 100
}

/** Actual punch hours: shift-in → shift-out minus lunch (or 60 min default). */
export function calcActualHoursDecimal(r) {
  const inMin  = parseTime12h(r.shiftIn)
  const outMin = parseTime12h(r.shiftOut)
  if (inMin == null || outMin == null) return null

  let diff = outMin - inMin
  // Strictly deduct only the scheduled lunch window overlap
  const lStart = parseHHMM(r.lunchStart ?? '12:00') ?? (12 * 60)
  const lEnd   = parseHHMM(r.lunchEnd ?? '13:00')   ?? (13 * 60)
  
  const overlapSchedStart = Math.max(inMin, lStart)
  const overlapSchedEnd   = Math.min(outMin, lEnd)
  const schedDeduction    = Math.max(0, overlapSchedEnd - overlapSchedStart)
  
  diff -= schedDeduction

  if (diff <= 0) return 0
  return minutesToDecimalHours(diff)
}

/** Scheduled hours: clamped to schedStart/schedEnd, minus lunch (or 60 min default). */
export function calcScheduledHoursDecimal(r) {
  const tapIn  = parseTime12h(r.shiftIn)
  const tapOut = parseTime12h(r.shiftOut)
  if (tapIn == null || tapOut == null) return null

  const schedIn  = parseHHMM(r.schedStart)
  const schedOut = parseHHMM(r.schedEnd)
  if (schedIn == null || schedOut == null) return calcActualHoursDecimal(r)

  const effectiveIn  = Math.max(tapIn, schedIn)
  const effectiveOut = Math.min(tapOut, schedOut)
  if (effectiveOut <= effectiveIn) return 0

  let diff = effectiveOut - effectiveIn
  // Strictly deduct only the scheduled lunch window overlap
  const lStart = parseHHMM(r.lunchStart ?? '12:00') ?? (12 * 60)
  const lEnd   = parseHHMM(r.lunchEnd ?? '13:00')   ?? (13 * 60)
  
  const overlapSchedStart = Math.max(effectiveIn, lStart)
  const overlapSchedEnd   = Math.min(effectiveOut, lEnd)
  const schedDeduction    = Math.max(0, overlapSchedEnd - overlapSchedStart)
  
  diff -= schedDeduction

  if (diff <= 0) return 0
  return minutesToDecimalHours(diff)
}

/** Statuses that must NOT count toward DOLE manhours totals. */
export const EXCLUDED_MANHOUR_STATUSES = new Set([
  'Absent',
  'Incomplete',
  'Day Off',
])

export function resolveRecordHours(r, mode = 'actual') {
  const fromPunches = mode === 'scheduled'
    ? calcScheduledHoursDecimal(r)
    : calcActualHoursDecimal(r)

  if (fromPunches != null) return fromPunches
  const stored = Number(r.totalHours ?? r.total_hours)
  return Number.isFinite(stored) ? stored : 0
}

export function isCountableManhourRecord(r, mode = 'actual') {
  if (!r?.date) return false
  if (EXCLUDED_MANHOUR_STATUSES.has(r.status)) return false
  const hours = resolveRecordHours(r, mode)
  return hours > 0
}
