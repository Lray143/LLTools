require('dotenv').config()
const { parseRawBiometrics } = require('./parseRawBiometrics.cjs')
const { createClient } = require('@libsql/client')
const path = require('path')
const fs = require('fs')

async function main() {
  // 1. Read the DAT file
  const filePath = path.join(process.env.USERPROFILE || 'C:\\Users\\Lray', 'Downloads', 'OPH7030057022400056_attlog_2025_full_year.dat')
  const text = fs.readFileSync(filePath, 'utf-8')
  console.log(`[File] Read ${text.length} chars from DAT file`)

  // 2. Get employee schedule map from DB
  const client = createClient({ url: 'file:' + path.join(process.env.APPDATA, 'lltools', 'lltools-turso.db') })
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
      dayOffs     : e.day_offs ? e.day_offs.split(',').map(d => d.trim()).filter(Boolean) : ['Saturday','Sunday'],
      daySchedule,
    }
  }
  console.log(`[DB] Loaded ${Object.keys(empMap).length} employees`)

  // 3. Parse
  const records = await parseRawBiometrics(text, empMap)
  console.log(`[Parse] Got ${records.length} records total`)

  // 4. Filter to 2024 only
  const records2025 = records.filter(r => r.date && r.date.startsWith('2025'))
  console.log(`[Filter] 2025 records: ${records2025.length}`)

  // 5. Status breakdown
  const byStatus = {}
  for (const r of records2025) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
  }
  console.log('\n[Status breakdown]')
  for (const [s, n] of Object.entries(byStatus).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${s.padEnd(25)} ${n}`)
  }

  // 6. Excluded statuses (same as DOLE logic)
  const EXCLUDED = new Set(['Absent','Incomplete','Day Off','Worked on Day Off','One Tap Only'])

  // 7. Compute total hours — SCHEDULED (shift-clamped)
  // Replicate calcScheduledHoursDecimal logic inline
  function parseHHMM(str) {
    if (!str) return null
    const m = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!m) return null
    let h = parseInt(m[1]), min = parseInt(m[2])
    const ampm = (m[3] || '').toUpperCase()
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return h * 60 + min
  }

  function scheduledMins(r) {
    const inMin  = parseHHMM(r.shift_in)
    const outMin = parseHHMM(r.shift_out)
    if (inMin === null || outMin === null) return null

    const schedIn  = parseHHMM(r.schedStart)
    const schedOut = parseHHMM(r.schedEnd)

    let effectiveIn  = schedIn  !== null ? Math.max(inMin, schedIn)   : inMin
    let effectiveOut = schedOut !== null ? Math.min(outMin, schedOut)  : outMin

    // overnight
    if (effectiveOut < effectiveIn) effectiveOut += 1440

    let diff = effectiveOut - effectiveIn
    if (diff <= 0) return 0

    // lunch deduction
    const ls = parseHHMM(r.lunchStart || '12:00')
    const le = parseHHMM(r.lunchEnd   || '13:00')
    if (ls !== null && le !== null) {
      const alignedLStart = ls < effectiveIn ? ls + 1440 : ls
      const alignedLEnd   = le < effectiveIn ? le + 1440 : le
      const overlapStart  = Math.max(effectiveIn, alignedLStart)
      const overlapEnd    = Math.min(effectiveOut, alignedLEnd)
      const deduct        = Math.max(0, overlapEnd - overlapStart)
      diff -= deduct
    }

    return diff <= 0 ? 0 : diff / 60
  }

  let totalHoursScheduled = 0
  let countableRecords = 0
  let excludedCount = 0
  const dayOffWorkHours = { count: 0, hours: 0 }

  for (const r of records2025) {
    if (EXCLUDED.has(r.status)) {
      excludedCount++
      if (r.status === 'Worked on Day Off') {
        const h = scheduledMins(r)
        if (h !== null && h > 0) {
          dayOffWorkHours.count++
          dayOffWorkHours.hours += h
        }
      }
      continue
    }
    const h = scheduledMins(r)
    if (h !== null && h > 0) {
      totalHoursScheduled += h
      countableRecords++
    }
  }

  console.log('\n========== RESULTS (Scheduled / Shift-Clamped) ==========')
  console.log(`  Countable records : ${countableRecords}`)
  console.log(`  Excluded records  : ${excludedCount}`)
  console.log(`  Total Hours 2024  : ${totalHoursScheduled.toFixed(2)} h`)
  console.log('')
  console.log(`  + If "Include Day-Off Work" ON:`)
  console.log(`    Day-Off records with hours : ${dayOffWorkHours.count}`)
  console.log(`    Day-Off total hours        : ${dayOffWorkHours.hours.toFixed(2)} h`)
  console.log(`    Grand Total (incl. D.O.)   : ${(totalHoursScheduled + dayOffWorkHours.hours).toFixed(2)} h`)
  console.log('=========================================================')
}

main().catch(console.error)
