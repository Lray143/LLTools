const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

const db = new Database(path.join(app.getPath('userData'), 'lltools.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clinic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    service TEXT,
    notes TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

module.exports = db