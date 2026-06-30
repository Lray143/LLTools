require('dotenv').config()
const { createClient } = require('@libsql/client')
const path = require('path')

const dbPath = path.join(process.env.APPDATA || process.env.USERPROFILE + '\\AppData\\Roaming', 'lltools', 'lltools-turso.db')

const client = createClient({
  url: `file:${dbPath}`,
})

const executeWithRetry = async (sql, args = []) => {
  let retries = 20
  while (retries > 0) {
    try {
      return await client.execute({ sql, args })
    } catch (err) {
      if (err.message.includes('EBUSY') || err.message.includes('SQLITE_BUSY')) {
        retries--
        await new Promise(r => setTimeout(r, 250))
      } else {
        throw err
      }
    }
  }
}

async function run() {
  const result = await executeWithRetry("SELECT * FROM attendance WHERE status = 'Incomplete'")
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
      await executeWithRetry('UPDATE attendance SET status = ? WHERE id = ?', ['One Tap Only', r.id])
      updatedCount++
    }
  }

  console.log(`Updated ${updatedCount} historical records from Incomplete to 'One Tap Only'`)
  
  // Need to sync back to Turso? Not necessary for local db, electron app will sync it when it runs
}

run().catch(console.error)
