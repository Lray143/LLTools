const { parseRawBiometrics } = require('./parseRawBiometrics.cjs')

async function runTest() {
  const employeeMap = {
    '101': {
      shiftStart: '07:00',
      shiftEnd: '17:00',
      dayOffs: ['Saturday', 'Sunday'],
      daySchedule: null
    }
  }

  // 101 - Date 1: Normal Wednesday workday
  // 101 - Date 2: Saturday day off, zero taps
  // 101 - Date 3: Sunday day off, tapped in and out
  // 101 - Date 4: Monday, one tap only

  const text = `
101 2025-05-14 07:00:00 A 0
101 2025-05-14 17:10:00 A 1
101 2025-05-18 07:30:00 A 0
101 2025-05-18 17:00:00 A 1
101 2025-05-19 07:00:00 A 0
  `.trim()

  const parsed = await parseRawBiometrics(text, employeeMap)
  
  for (const record of parsed) {
    const dayName = new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    console.log(`Date: ${record.date} (${dayName})`)
    console.log(`Taps: In=${record.shift_in} Out=${record.shift_out}`)
    console.log(`Status: ${record.status}`)
    console.log(`------------------------------------`)
  }
}

runTest()
