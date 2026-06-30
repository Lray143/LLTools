require('dotenv').config()
const { createClient } = require('@libsql/client')
const path = require('path')
const client = createClient({ url: 'file:' + path.join(process.env.APPDATA, 'lltools', 'lltools-turso.db') })

async function run() {
  const empRes = await client.execute({ sql: "SELECT id FROM employees WHERE employee_no = ?", args: ['1024'] })
  if (!empRes.rows.length) { console.log('employee 1024 not found'); return }
  const empId = empRes.rows[0].id
  console.log('emp id:', empId)

  const recRes = await client.execute({ sql: "SELECT * FROM attendance WHERE employee_id = ? AND date = '2026-05-13'", args: [empId] })
  console.log('attendance record:', JSON.stringify(recRes.rows[0], null, 2))

  const empFull = await client.execute({ sql: "SELECT shift_start, shift_end, day_schedule, sched_lunch_start, sched_lunch_end FROM employees WHERE id = ?", args: [empId] })
  console.log('employee schedule:', JSON.stringify(empFull.rows[0], null, 2))
}
run().catch(console.error)
