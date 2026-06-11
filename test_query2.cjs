const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:C:\\Users\\Lawrence\\AppData\\Roaming\\lltools\\lltools-turso.db',
});

async function run() {
  const users = await client.execute("SELECT * FROM users WHERE username LIKE '%lester%' OR employee_id IN (SELECT id FROM employees WHERE name LIKE '%lester%')")
  console.log("USERS:", users.rows)
  
  const msgs = await client.execute("SELECT * FROM direct_messages WHERE sender_name LIKE '%lester%' OR room_id LIKE '%lester%' ORDER BY created_at DESC LIMIT 5")
  console.log("MESSAGES:", msgs.rows)

  const lawrence = await client.execute("SELECT * FROM users WHERE username LIKE '%lawrence%' OR employee_id IN (SELECT id FROM employees WHERE name LIKE '%lawrence%')")
  console.log("LAWRENCE:", lawrence.rows)
}

run().catch(console.error);
