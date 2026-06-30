require('dotenv').config()
const { createClient } = require('@libsql/client')

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

async function run() {
  const result = await client.execute("SELECT * FROM attendance WHERE status = 'Incomplete'")
  const records = result.rows.map(r => Object.fromEntries(Object.entries(r)))

  let updatedCount = 0

  for (const r of records) {
    let tapCount = 0
    if (r.shift_in && r.shift_in !== '--' && r.shift_in !== '-') tapCount++
    if (r.shift_out && r.shift_out !== '--' && r.shift_out !== '-') tapCount++
    if (r.lunch_in && r.lunch_in !== '--' && r.lunch_in !== '-') tapCount++
    if (r.lunch_out && r.lunch_out !== '--' && r.lunch_out !== '-') tapCount++

    let extraCount = 0
    if (r.extra_taps) {
      try {
        const extra = JSON.parse(r.extra_taps)
        if (Array.isArray(extra)) extraCount = extra.length
      } catch (e) {}
    }

    const totalTaps = tapCount + extraCount

    if (totalTaps === 1) {
      await client.execute({
        sql: 'UPDATE attendance SET status = ? WHERE id = ?',
        args: ['One Tap Only', r.id]
      })
      updatedCount++
    }
  }

  console.log(`Updated ${updatedCount} historical records from Incomplete to 'One Tap Only' in the CLOUD database`)
}

run().catch(console.error)
