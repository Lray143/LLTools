const path = require('path')
const os = require('os')
const electron = require('electron')
const { createClient } = require('@libsql/client')

const LOCAL_DB_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'lltools', 'lltools-turso.db')

async function fix() {
  const client = createClient({ url: `file:${LOCAL_DB_PATH}` })
  
  // Find Clemente (already 1051 in employees)
  const res = await client.execute("SELECT id FROM employees WHERE employee_no = '1051'")
  if (res.rows.length > 0) {
    const empId = res.rows[0].id
    console.log('Found Clemente with ID:', empId)
    
    // Update user account
    await client.execute({
      sql: "UPDATE users SET username = '1051' WHERE employee_id = ?",
      args: [empId]
    })
    console.log('Fixed Clemente login to 1051!')
  } else {
    console.log('Clemente 1051 not found.')
  }
}

fix().catch(console.error)
