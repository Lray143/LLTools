const { parentPort, workerData } = require('worker_threads')
const { createClient } = require('@libsql/client')
require('dotenv').config()

let client = null
let isSyncing = false

function getClient() {
  if (client) return client
  try {
    client = createClient({
      url:       `file:${workerData.dbPath}`,
      syncUrl:   process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  } catch (err) {
    // Cloud unreachable — use local-only (sync will be a no-op)
    client = createClient({
      url: `file:${workerData.dbPath}`,
    })
  }
  return client
}

async function runSync() {
  if (isSyncing) return
  isSyncing = true
  try {
    const client = getClient()
    await client.execute('PRAGMA busy_timeout = 5000')
    await client.sync()
    parentPort.postMessage('synced')
  } catch (err) {
    // Ignore sync errors (e.g. offline or WAL conflict)
  } finally {
    isSyncing = false
  }
}

// Wait for the main thread to signal that initDb is done before starting syncs.
// This prevents SQLITE_BUSY during schema creation.
parentPort.on('message', async (msg) => {
  if (msg === 'start') {
    // Wait 2 seconds for initDb to fully complete before first sync
    await new Promise(r => setTimeout(r, 2000))
    setInterval(() => {
      runSync().catch(() => {})
    }, 5000)
  }

  if (msg === 'sync-now') {
    runSync().catch(() => {})
  }
})
