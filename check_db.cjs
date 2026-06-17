const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:C:/Users/Lray/AppData/Roaming/lltools/lltools-turso.db' });
client.execute('SELECT id, username, role FROM users').then(res => console.log('USERS:', res.rows)).catch(console.error);
client.execute('SELECT employee_no FROM employees').then(res => console.log('EMPLOYEES:', res.rows.map(r => r.employee_no).join(', '))).catch(console.error);
