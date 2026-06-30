const { createClient } = require('@libsql/client')
const path = require('path')
const fs = require('fs')

async function audit() {
  const appData = process.env.APPDATA || (process.env.USERPROFILE + '/AppData/Roaming')
  const dbPath = path.join(appData, 'lltools', 'lltools-turso.db')
  
  if (!fs.existsSync(dbPath)) {
    console.log('No database found at:', dbPath)
    return
  }

  const client = createClient({ url: `file:${dbPath}` })

  const result = await client.execute(`
    SELECT employee_id, date, status, shift_in, shift_out 
    FROM attendance
    WHERE status IN ('Full Time', 'Late', 'Undertime', 'Late & Undertime')
  `)
  
  // We need to parse employees to know their day_schedule
  const empResult = await client.execute(`SELECT employee_no, name, day_schedule, day_offs FROM employees`)
  
  const empMap = {}
  for (const e of empResult.rows) {
    let sched = null
    try { sched = JSON.parse(e.day_schedule) } catch (err) {}
    empMap[String(e.employee_no)] = {
      name: e.name,
      daySchedule: sched,
      dayOffs: e.day_offs ? e.day_offs.split(',').map(d => d.trim()) : ['Saturday', 'Sunday']
    }
  }

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

  let affected = 0
  const summary = {}

  for (const r of result.rows) {
    const e = empMap[String(r.employee_id)]
    if (!e) continue

    const dateObj = new Date(r.date + 'T00:00:00')
    const dayName = DAY_NAMES[dateObj.getDay()]

    let isDayOff = false
    if (e.daySchedule) {
      const dayEntry = e.daySchedule[dayName] ?? null
      if (dayEntry === null) isDayOff = true
    } else {
      isDayOff = e.dayOffs.includes(dayName)
    }

    if (isDayOff && r.shift_in && r.shift_out) {
      affected++
      const key = r.date.substring(0, 7) // YYYY-MM
      if (!summary[key]) summary[key] = new Set()
      summary[key].add(e.name || r.employee_id)
    }
  }

  console.log('=== AUDIT RESULTS ===')
  console.log(`Total historical records affected by the bug: ${affected}`)
  if (affected > 0) {
    console.log('Breakdown by month:')
    for (const [month, names] of Object.entries(summary)) {
      console.log(` - ${month}: ${names.size} employees affected`)
      // console.log(`   [${Array.from(names).join(', ')}]`)
    }
  } else {
    console.log('No historical records need fixing.')
  }
}
audit().catch(console.error)
