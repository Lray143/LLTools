const { parentPort, workerData } = require('worker_threads')
const { createClient } = require('@libsql/client')
require('dotenv').config()

let client = null

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

// Wait for the main thread to signal that initDb is done before starting syncs.
// This prevents SQLITE_BUSY during schema creation.
parentPort.once('message', (msg) => {
  if (msg === 'start') {
    setInterval(async () => {
      try {
        await getClient().sync()
        parentPort.postMessage('synced')
      } catch (err) {
        // Ignore sync errors (e.g. offline)
      }
    }, 5000)
  }
})
