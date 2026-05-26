const initSqlJs = require('sql.js')
const fs        = require('fs')
const path      = require('path')
const { app }   = require('electron')
const bcrypt    = require('bcryptjs')

const DB_PATH = path.join(app.getPath('userData'), 'lltools.db')

let db = null

// Writes the in-memory SQLite database back to disk after every change.
// sql.js keeps everything in memory, so we have to manually flush it.
const save = () => {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

// Runs a SELECT and returns all matching rows as plain JS objects.
const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

// Same as queryAll but only returns the first row (or null if nothing matched).
const queryOne = (sql, params = []) => queryAll(sql, params)[0] ?? null

// Runs an INSERT / UPDATE / DELETE and immediately saves to disk.
const run = (sql, params = []) => {
  db.run(sql, params)
  save()
}

// ── INIT ──────────────────────────────────────────────────────────
const initDb = async () => {
  const SQL = await initSqlJs({
    locateFile: () => path.join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
  })

  // Load existing DB file from disk, or create a fresh one.
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'hr',
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id            TEXT PRIMARY KEY,
      employee_no   TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      position      TEXT,
      department    TEXT,
      contact       TEXT,
      status        TEXT DEFAULT 'Active',
      leave_type    TEXT DEFAULT NULL,
      leave_start   TEXT DEFAULT NULL,
      leave_end     TEXT DEFAULT NULL,
      shift_start   TEXT DEFAULT '07:00',
      shift_end     TEXT DEFAULT '17:30',
      day_offs      TEXT DEFAULT 'Saturday,Sunday',
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT REFERENCES employees(id),
      date          TEXT NOT NULL,
      shift_in      TEXT,
      lunch_out     TEXT,
      lunch_in      TEXT,
      shift_out     TEXT,
      total_hours   REAL,
      status        TEXT,
      -- extra_taps stores any taps beyond the 4 main ones as a JSON string.
      -- Example: '[{"type":"IN","time":"08:45 AM"},{"type":"OUT","time":"05:10 PM"}]'
      -- Null means no extra taps were detected for this record.
      extra_taps    TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS clinic_logs (
      id            TEXT PRIMARY KEY,
      patient_name  TEXT NOT NULL,
      employee_id   TEXT REFERENCES employees(id),
      service       TEXT,
      notes         TEXT,
      date          TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );
  `)

  // Prevents duplicate attendance rows for the same employee on the same day.
  try {
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_emp_date
              ON attendance(employee_id, date)`)
  } catch (_) {}

  // ── SEED DEFAULT ACCOUNTS ─────────────────────────────────────
  // These only insert if the username doesn't already exist (INSERT OR IGNORE).
  const seedUsers = [
    { username: 'admin@doublel.com',     password: 'admin123',     role: 'admin'     },
    { username: 'hr@doublel.com',        password: 'hr123',        role: 'hr'        },
    { username: 'clinic@doublel.com',    password: 'clinic123',    role: 'clinic'    },
    { username: 'inventory@doublel.com', password: 'inventory123', role: 'inventory' },
  ]
  for (const u of seedUsers) {
    db.run(
      'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [u.username, bcrypt.hashSync(u.password, 10), u.role]
    )
  }

  save()
  console.log('[DB] Ready →', DB_PATH)
}

// ── AUTH ──────────────────────────────────────────────────────────
const loginUser = (username, password) => {
  const user = queryOne('SELECT * FROM users WHERE username = ?', [username])
  if (!user) return { success: false, message: 'User not found.' }
  const match = bcrypt.compareSync(password, user.password_hash)
  if (!match) return { success: false, message: 'Incorrect password.' }
  return { success: true, user: { id: user.id, username: user.username, role: user.role } }
}

// ── EMPLOYEES ─────────────────────────────────────────────────────
const getEmployees = () =>
  queryAll("SELECT * FROM employees WHERE status != 'Archived' ORDER BY name")

const getArchivedEmployees = () =>
  queryAll("SELECT * FROM employees WHERE status = 'Archived' ORDER BY name")

const upsertEmployee = (emp) => run(`
  INSERT INTO employees
    (id, employee_no, name, position, department, contact, status,
     leave_type, leave_start, leave_end, shift_start, shift_end, day_offs)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    employee_no  = excluded.employee_no,
    name         = excluded.name,
    position     = excluded.position,
    department   = excluded.department,
    contact      = excluded.contact,
    status       = excluded.status,
    leave_type   = excluded.leave_type,
    leave_start  = excluded.leave_start,
    leave_end    = excluded.leave_end,
    shift_start  = excluded.shift_start,
    shift_end    = excluded.shift_end,
    day_offs     = excluded.day_offs,
    sync_status  = 'pending'
`, [
  emp.id, emp.employee_no, emp.name,
  emp.position    ?? null,
  emp.department  ?? null,
  emp.contact     ?? null,
  emp.status      ?? 'Active',
  emp.leave_type  ?? null,
  emp.leave_start ?? null,
  emp.leave_end   ?? null,
  emp.shift_start ?? '07:00',
  emp.shift_end   ?? '17:30',
  emp.day_offs    ?? 'Saturday,Sunday',
])

const archiveEmployee         = (id) =>
  run("UPDATE employees SET status = 'Archived', sync_status = 'pending' WHERE id = ?", [id])

const unarchiveEmployee       = (id) =>
  run("UPDATE employees SET status = 'Active', sync_status = 'pending' WHERE id = ?", [id])

const permanentDeleteEmployee = (id) =>
  run("DELETE FROM employees WHERE id = ?", [id])

// ── ATTENDANCE ────────────────────────────────────────────────────

// Returns every attendance row joined with its employee's info.
// extra_taps comes back as a raw JSON string — the frontend parses it.
const getAttendance = () => queryAll(`
  SELECT
    a.id, a.date,
    a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
    a.total_hours, a.status, a.extra_taps,
    e.employee_no, e.name, e.department,
    e.shift_start, e.shift_end, e.day_offs
  FROM attendance a
  LEFT JOIN employees e ON e.id = a.employee_id
  ORDER BY a.date DESC, e.name
`)

const getAttendanceByDate = (date) => queryAll(`
  SELECT
    a.id, a.date,
    a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
    a.total_hours, a.status, a.extra_taps,
    e.employee_no, e.name, e.department,
    e.shift_start, e.shift_end, e.day_offs
  FROM attendance a
  LEFT JOIN employees e ON e.id = a.employee_id
  WHERE a.date = ?
  ORDER BY e.name
`, [date])

// Processes a batch of parsed biometric records and inserts them into the DB.
// Skips any record that already exists for that employee+date combination.
// If an employee number isn't in the DB yet, a stub employee row is created.
const importAttendance = (records) => {
  let newEmployees   = 0
  let newRecords     = 0
  let skippedRecords = 0

  for (const rec of records) {
    // Look up the employee by their biometric device number.
    let emp = queryOne(
      'SELECT id FROM employees WHERE employee_no = ?',
      [rec.employee_no]
    )

    // Employee not found — create a minimal stub so the attendance row has
    // something to reference. HR can fill in the real details later.
    if (!emp) {
      const newId = crypto.randomUUID()
      db.run(`
        INSERT OR IGNORE INTO employees
          (id, employee_no, name, status, shift_start, shift_end, day_offs, sync_status)
        VALUES (?, ?, ?, 'Active', '07:00', '17:30', 'Saturday,Sunday', 'pending')
      `, [newId, rec.employee_no, rec.employee_no])
      emp = { id: newId }
      newEmployees++
    }

    // Skip if this employee already has a record for this date.
    const existing = queryOne(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [emp.id, rec.date]
    )
    if (existing) { skippedRecords++; continue }

    // Serialize extra taps array to JSON for storage.
    // If there are no extra taps, we store NULL to keep things clean.
    const extraTapsJson = rec.extraTaps?.length > 0
      ? JSON.stringify(rec.extraTaps)
      : null

    db.run(`
      INSERT INTO attendance
        (id, employee_id, date,
         shift_in, lunch_out, lunch_in, shift_out,
         total_hours, status, extra_taps, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      crypto.randomUUID(),
      emp.id,
      rec.date,
      rec.shift_in    ?? null,
      rec.lunch_out   ?? null,
      rec.lunch_in    ?? null,
      rec.shift_out   ?? null,
      rec.total_hours ?? null,
      rec.status      ?? 'Absent',
      extraTapsJson,
    ])
    newRecords++
  }

  save()
  return { newEmployees, newRecords, skippedRecords }
}

module.exports = {
  initDb, loginUser, queryAll, queryOne, run,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, importAttendance,
}
