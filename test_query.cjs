const db = require('./db.cjs')
db.initDb().then(async () => {
  const users = await db.queryAll("SELECT * FROM users WHERE username LIKE '%lester%' OR employee_id IN (SELECT id FROM employees WHERE name LIKE '%lester%')")
  console.log("USERS:", users)
  
  const msgs = await db.queryAll("SELECT * FROM direct_messages WHERE sender_name LIKE '%lester%' OR room_id LIKE '%lester%' ORDER BY created_at DESC LIMIT 5")
  console.log("MESSAGES:", msgs)

  const lawrence = await db.queryAll("SELECT * FROM users WHERE username LIKE '%lawrence%' OR employee_id IN (SELECT id FROM employees WHERE name LIKE '%lawrence%')")
  console.log("LAWRENCE:", lawrence)
})
