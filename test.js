const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec("CREATE TABLE test (room_id TEXT); INSERT INTO test VALUES ('DM_1_2'), ('DM_10_2'), ('DM_2_1'), ('DM_2_10'), ('DM_1_11');");
const rows = db.prepare("SELECT * FROM test WHERE room_id LIKE ? ESCAPE '\\' OR room_id LIKE ? ESCAPE '\\'").all('DM\\_1\\_%', 'DM\\_%\\_1');
console.log(rows);