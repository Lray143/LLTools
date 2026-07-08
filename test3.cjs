const Database = require('better-sqlite3');

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE direct_messages (
    room_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sender_id TEXT,
    sender_name TEXT,
    message TEXT,
    file_url TEXT
  );
  INSERT INTO direct_messages (room_id, sender_id) VALUES 
    ('DM_1_2', '1'), 
    ('DM_10_2', '10'), 
    ('DM_2_1', '2'), 
    ('DM_2_10', '2'),
    ('DM_11_4', '11');
`);

const userId = 1;

const allDms = db.prepare(`
  SELECT room_id
  FROM (
    SELECT room_id,
           ROW_NUMBER() OVER(PARTITION BY room_id ORDER BY created_at DESC) as rn
    FROM direct_messages
    WHERE room_id LIKE ? ESCAPE '\\' OR room_id LIKE ? ESCAPE '\\'
  )
  WHERE rn = 1
`).all(`DM\\_${userId}\\_%`, `DM\\_%\\_${userId}`);

console.log("Matched DMs for user 1:", allDms.map(r => r.room_id));

const user10Dms = db.prepare(`
  SELECT room_id
  FROM (
    SELECT room_id,
           ROW_NUMBER() OVER(PARTITION BY room_id ORDER BY created_at DESC) as rn
    FROM direct_messages
    WHERE room_id LIKE ? ESCAPE '\\' OR room_id LIKE ? ESCAPE '\\'
  )
  WHERE rn = 1
`).all(`DM\\_10\\_%`, `DM\\_%\\_10`);

console.log("Matched DMs for user 10:", user10Dms.map(r => r.room_id));
