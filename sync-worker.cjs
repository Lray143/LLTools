const { parentPort, workerData } = require('worker_threads')
const { createClient } = require('@libsql/client')
require('dotenv').config()

const client = createClient({
  url:       `file:${workerData.dbPath}`,
  syncUrl:   process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Sync loop every 2 seconds
setInterval(async () => {
  try {
    await client.sync()
    // Tell the main thread that a sync just finished
    parentPort.postMessage('synced')
  } catch (err) {
    // Ignore sync errors (e.g. offline)
  }
}, 2000)
