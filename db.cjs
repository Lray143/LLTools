const initSqlJs = require('sql.js')
const fs        = require('fs')
const path      = require('path')
const { app }   = require('electron')
const bcrypt    = require('bcryptjs')

const DB_PATH = path.join(app.getPath('userData'), 'lltools.db')
let db = null

const save = () => {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}
const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}
const queryOne = (sql, params = []) => queryAll(sql, params)[0] ?? null
const run = (sql, params = []) => { db.run(sql, params); save() }

const SEED_PRODUCT_GROUPS = [
  {
    id: 'g-astringents', name: 'ASTRINGENTS', sortOrder: 0,
    rows: [
      { id: 'r-a1', caseBarcode: '14809010740028', itemBarcode: '4809010740021', description: 'Hydroquinone + Tretinoin # 3',      qty: 144, size: '30 ml', price: 48.75  },
      { id: 'r-a2', caseBarcode: '14809010740011', itemBarcode: '4809010740014', description: 'Hydroquinone + Tretinoin # 3',      qty: 144, size: '60 ml', price: 77.75  },
      { id: 'r-a3', caseBarcode: '14809010740042', itemBarcode: '4809010740045', description: 'Hydroquinone + Tretinoin # 2',      qty: 144, size: '30 ml', price: 40.50  },
      { id: 'r-a4', caseBarcode: '14809010740035', itemBarcode: '4809010740038', description: 'Hydroquinone + Tretinoin # 2',      qty: 144, size: '60 ml', price: 73.00  },
      { id: 'r-a5', caseBarcode: '14809010740066', itemBarcode: '4809010740069', description: 'Babyface Astringent Solution Care', qty: 144, size: '30 ml', price: 39.00  },
      { id: 'r-a6', caseBarcode: '14809010740059', itemBarcode: '4809010740052', description: 'Babyface Astringent Solution Care', qty: 144, size: '60 ml', price: 68.25  },
      { id: 'r-a7', caseBarcode: '14806517781387', itemBarcode: '4806517781380', description: 'Babyface Serum',                   qty: 144, size: '30ml',  price: 229.25 },
    ],
  },
  {
    id: 'g-creams', name: 'CREAMS', sortOrder: 1,
    rows: [
      { id: 'r-c1', caseBarcode: '14809010740397', itemBarcode: '4809010740298', description: 'Sunblock Cream',         qty: 12,  size: '6g',   price: 16.25  },
      { id: 'r-c2', caseBarcode: '14809010740403', itemBarcode: '4809010740304', description: 'Sunblock Cream',         qty: 12,  size: '12g',  price: 32.50  },
      { id: 'r-c3', caseBarcode: '14809010740526', itemBarcode: '4809010740489', description: 'Sunblock Cream',         qty: 12,  size: '15g',  price: 35.00  },
      { id: 'r-c4', caseBarcode: '14806517780335', itemBarcode: '4806517780338', description: 'Sunblock Cream',         qty: 120, size: '25ml', price: 56.25  },
      { id: 'r-c5', caseBarcode: '14809010740458', itemBarcode: '4809010740359', description: 'Whitening Cream',        qty: 12,  size: '6g',   price: 31.00  },
      { id: 'r-c6', caseBarcode: '14809010740465', itemBarcode: '4809010740366', description: 'Whitening Cream',        qty: 12,  size: '12g',  price: 61.50  },
      { id: 'r-c7', caseBarcode: '14806517780359', itemBarcode: '4809010740352', description: 'Whitening Cream (tube)', qty: 120, size: '25mL', price: 110.00 },
      { id: 'r-c8', caseBarcode: '14809010740509', itemBarcode: '4809010740302', description: 'Placenta Cream',         qty: 12,  size: '20g',  price: 75.75  },
    ],
  },
  {
    id: 'g-toner', name: 'TONER', sortOrder: 2,
    rows: [
      { id: 'r-t1', caseBarcode: '14809010740271', itemBarcode: '4809010740274', description: 'Clarifying Toner', qty: 96, size: '60 ml',  price: 47.25 },
      { id: 'r-t2', caseBarcode: '14809010740288', itemBarcode: '4809010740281', description: 'Clarifying Toner', qty: 72, size: '120 ml', price: 79.25 },
    ],
  },
  {
    id: 'g-soaps', name: 'SOAPS (Regular & Sachet)', sortOrder: 3,
    rows: [
      { id: 'r-s1',  caseBarcode: '14809010710202', itemBarcode: '4809010740205', description: 'Avocado Soap',                      qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s2',  caseBarcode: '14809010740189', itemBarcode: '4809010740182', description: 'Bleaching Soap',                     qty: 96,  size: '135g',  price: 83.50 },
      { id: 'r-s3',  caseBarcode: '14809010740226', itemBarcode: '4809010740229', description: 'Kalamansi Soap',                     qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s4',  caseBarcode: '14809010740196', itemBarcode: '4809010740199', description: 'Cucumber Soap',                      qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s5',  caseBarcode: '14809010740332', itemBarcode: '4809010740463', description: 'Placenta Soap',                      qty: 96,  size: '150g',  price: 83.50 },
      { id: 'r-s6',  caseBarcode: '14809010740219', itemBarcode: '4809010740212', description: 'Papaya Soap',                        qty: 96,  size: '135g',  price: 52.80 },
      { id: 'r-s7',  caseBarcode: '14806517740851', itemBarcode: '4809010740854', description: 'Papaya Soap w/ Milk',                qty: 96,  size: '135g',  price: 52.80 },
      { id: 'r-s8',  caseBarcode: '14806517780991', itemBarcode: '4806517780994', description: 'RDL Papaya Soap',                    qty: 144, size: '90g',   price: 39.00 },
      { id: 'r-s9',  caseBarcode: '14809010740844', itemBarcode: '4809010740847', description: 'Babyskin Whitening Bath Soap',       qty: 96,  size: '135g',  price: 53.00 },
      { id: 'r-s10', caseBarcode: '14809010740264', itemBarcode: '4809010740267', description: 'Tawas Soap',                         qty: 96,  size: '135g',  price: 83.50 },
      { id: 'r-s11', caseBarcode: '14806517780212', itemBarcode: '4806517780215', description: 'Surewhite Soap',                     qty: 118, size: '90g',   price: 66.75 },
      { id: 'r-s12', caseBarcode: '14809010740561', itemBarcode: '4809010740564', description: 'Whitening Soap',                     qty: 96,  size: '150g',  price: 69.00 },
      { id: 'r-s13', caseBarcode: '14809010740691', itemBarcode: '4809010740694', description: 'Papaya Soap Sachets',                qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s14', caseBarcode: '14809010740998', itemBarcode: '4809010740991', description: 'Papaya Soap with Milk Sachet',       qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s15', caseBarcode: '14806517781370', itemBarcode: '4806517781373', description: 'Kojic Soap sachet',                  qty: 432, size: '25g',   price: 17.00 },
      { id: 'r-s16', caseBarcode: '14809010740868', itemBarcode: '4809010740861', description: 'Babyskin Bath Soap Sachet',          qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s17', caseBarcode: '14806517781974', itemBarcode: '4806517781977', description: 'Papaya Whitening Soap 3x Valuepack', qty: 60,  size: '65gms', price: 78.00 },
    ],
  },
  {
    id: 'g-lotion', name: 'LOTION', sortOrder: 4,
    rows: [
      { id: 'r-l1', caseBarcode: '14806517781383', itemBarcode: '4806517781386', description: 'Kojic Whitening Lotion', qty: 108, size: '50ml',  price: 59.50  },
      { id: 'r-l2', caseBarcode: '14806517781356', itemBarcode: '4806517781389', description: 'Kojic Whitening Lotion', qty: 72,  size: '100ml', price: 116.50 },
    ],
  },
]

const initDb = async () => {
  const SQL = await initSqlJs({
    locateFile: () => path.join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
  })

  db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database()

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'hr',
      employee_id   TEXT DEFAULT NULL REFERENCES employees(id) ON DELETE SET NULL,
      theme_color   TEXT DEFAULT NULL,
      theme_mode    TEXT DEFAULT 'light',
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
      extra_taps    TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS clinic_logs (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT REFERENCES employees(id),
      full_name     TEXT NOT NULL,
      employee_code TEXT,
      date          TEXT NOT NULL,
      time          TEXT NOT NULL,
      complaint     TEXT,
      disposition   TEXT,
      bp            TEXT,
      temp          REAL,
      pulse         INTEGER,
      spo2          INTEGER,
      gender        TEXT,
      age           INTEGER,
      treatment     TEXT,
      attachments   TEXT DEFAULT '[]',
      status        TEXT DEFAULT 'Active',
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS product_groups (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      sort_order  INTEGER DEFAULT 0,
      status      TEXT DEFAULT 'Active',
      created_at  TEXT DEFAULT (datetime('now')),
      synced_at   TEXT DEFAULT NULL,
      sync_status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      group_id      TEXT REFERENCES product_groups(id),
      case_barcode  TEXT,
      item_barcode  TEXT,
      description   TEXT,
      qty           REAL,
      size          TEXT,
      price         REAL,
      status        TEXT DEFAULT 'Active',
      sort_order    INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS outlets (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      code        TEXT,
      address     TEXT,
      region      TEXT,
      status      TEXT DEFAULT 'Active',
      discounts   TEXT DEFAULT '[]',
      archived    INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      synced_at   TEXT DEFAULT NULL,
      sync_status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS outlet_product_prices (
      outlet_id   TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
      product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      price       REAL NOT NULL,
      updated_at  TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (outlet_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS saved_orders (
      id             TEXT PRIMARY KEY,
      series_number  TEXT NOT NULL,
      outlet_id      TEXT,
      outlet_name    TEXT,
      groups_json    TEXT NOT NULL DEFAULT '[]',
      subtotal       REAL NOT NULL DEFAULT 0,
      discounts_json TEXT NOT NULL DEFAULT '[]',
      grand_total    REAL NOT NULL DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS leave_requests (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT REFERENCES employees(id) ON DELETE CASCADE,
      employee_no   TEXT,
      employee_name TEXT,
      leave_type    TEXT NOT NULL,
      start_date    TEXT NOT NULL,
      end_date      TEXT NOT NULL,
      reason        TEXT,
      status        TEXT DEFAULT 'Pending',
      review_note   TEXT DEFAULT NULL,
      reviewed_at   TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      sync_status   TEXT DEFAULT 'pending'
    );
  `)

  try { db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_emp_date ON attendance(employee_id, date)`) } catch (_) {}

  // ── MIGRATIONS ────────────────────────────────────────────────
  try { db.run(`ALTER TABLE products      ADD COLUMN price  REAL`) }              catch (_) {}
  try { db.run(`ALTER TABLE products      ADD COLUMN status TEXT DEFAULT 'Active'`) } catch (_) {}
  try { db.run(`ALTER TABLE product_groups ADD COLUMN status TEXT DEFAULT 'Active'`) } catch (_) {}
  try { db.run(`UPDATE products       SET price  = new_srp  WHERE price  IS NULL AND new_srp IS NOT NULL`) } catch (_) {}
  try { db.run(`UPDATE products       SET status = 'Active' WHERE status IS NULL`) } catch (_) {}
  try { db.run(`UPDATE product_groups SET status = 'Active' WHERE status IS NULL`) } catch (_) {}
  // ── USERS MIGRATIONS ────────────────────────────────────────────
  try { db.run(`ALTER TABLE users ADD COLUMN employee_id TEXT DEFAULT NULL`) } catch (_) {}
  try { db.run(`ALTER TABLE users ADD COLUMN theme_color TEXT DEFAULT NULL`) } catch (_) {}
  try { db.run(`ALTER TABLE users ADD COLUMN theme_mode TEXT DEFAULT 'light'`) } catch (_) {}
  // ── EMPLOYEE SCHEDULE MIGRATION ─────────────────────────────────
  try { db.run(`ALTER TABLE employees ADD COLUMN day_schedule TEXT DEFAULT NULL`) } catch (_) {}

  // ── CLINIC LOGS MIGRATIONS (for existing DBs with old schema) ─
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN full_name     TEXT NOT NULL DEFAULT ''`)  } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN employee_code TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN time          TEXT NOT NULL DEFAULT ''`)  } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN complaint     TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN disposition   TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN bp            TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN temp          TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN treatment     TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN pulse         TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN spo2          TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN gender        TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN age           TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN attachments   TEXT DEFAULT '[]'`)          } catch (_) {}
  try { db.run(`UPDATE clinic_logs SET attachments = '[]' WHERE attachments IS NULL`) }       catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN status        TEXT DEFAULT 'Active'`)      } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN created_at    TEXT DEFAULT (datetime('now'))`) } catch (_) {}
  try { db.run(`UPDATE clinic_logs SET status = 'Active' WHERE status IS NULL`) }             catch (_) {}
  // ── OUTLETS MIGRATIONS (for existing DBs missing the outlets table) ─
  try { db.run(`ALTER TABLE outlets ADD COLUMN code      TEXT`) }                             catch (_) {}
  try { db.run(`ALTER TABLE outlets ADD COLUMN address   TEXT`) }                             catch (_) {}
  try { db.run(`ALTER TABLE outlets ADD COLUMN region    TEXT`) }                             catch (_) {}
  try { db.run(`ALTER TABLE outlets ADD COLUMN status    TEXT DEFAULT 'Active'`) }            catch (_) {}
  try { db.run(`ALTER TABLE outlets ADD COLUMN discounts TEXT DEFAULT '[]'`) }                catch (_) {}
  try { db.run(`ALTER TABLE outlets ADD COLUMN archived  INTEGER DEFAULT 0`) }                catch (_) {}
  try { db.run(`UPDATE outlets SET discounts = '[]' WHERE discounts IS NULL`) }               catch (_) {}
  try { db.run(`UPDATE outlets SET archived  = 0    WHERE archived  IS NULL`) }               catch (_) {}
  // ── OUTLET PRODUCT PRICES MIGRATION ─────────────────────────
  try {
    db.run(`CREATE TABLE IF NOT EXISTS outlet_product_prices (
      outlet_id   TEXT NOT NULL,
      product_id  TEXT NOT NULL,
      price       REAL NOT NULL,
      updated_at  TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (outlet_id, product_id)
    )`)
  } catch (_) {}

  // ── SAVED ORDERS MIGRATION ────────────────────────────────────
  try {
    db.run(`CREATE TABLE IF NOT EXISTS saved_orders (
      id             TEXT PRIMARY KEY,
      series_number  TEXT NOT NULL,
      outlet_id      TEXT,
      outlet_name    TEXT,
      groups_json    TEXT NOT NULL DEFAULT '[]',
      subtotal       REAL NOT NULL DEFAULT 0,
      discounts_json TEXT NOT NULL DEFAULT '[]',
      grand_total    REAL NOT NULL DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now'))
    )`)
  } catch (_) {}

  // ── LEAVE REQUESTS MIGRATION ─────────────────────────────────────
  try {
    db.run(`CREATE TABLE IF NOT EXISTS leave_requests (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT REFERENCES employees(id) ON DELETE CASCADE,
      employee_no   TEXT,
      employee_name TEXT,
      leave_type    TEXT NOT NULL,
      start_date    TEXT NOT NULL,
      end_date      TEXT NOT NULL,
      reason        TEXT,
      status        TEXT DEFAULT 'Pending',
      review_note   TEXT DEFAULT NULL,
      reviewed_at   TEXT DEFAULT NULL,
      reviewed_by   TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      sync_status   TEXT DEFAULT 'pending'
    )`)
  } catch (_) {}
  try { db.run(`ALTER TABLE leave_requests ADD COLUMN reviewed_by TEXT DEFAULT NULL`) } catch (_) {}

  // ── SEED USERS ────────────────────────────────────────────────
  const seedUsers = [
    { username: 'admin@doublel.com',     password: 'admin123',     role: 'admin'     },
    { username: 'hr@doublel.com',        password: 'hr123',        role: 'hr'        },
    { username: 'clinic@doublel.com',    password: 'clinic123',    role: 'clinic'    },
    { username: 'inventory@doublel.com', password: 'inventory123', role: 'inventory' },
  ]
  for (const u of seedUsers) {
    db.run('INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [u.username, bcrypt.hashSync(u.password, 10), u.role])
  }

  // ── SEED PRODUCTS ─────────────────────────────────────────────
  const groupCount = queryOne('SELECT COUNT(*) as n FROM product_groups')
  if (!groupCount || groupCount.n === 0) {
    for (const group of SEED_PRODUCT_GROUPS) {
      db.run('INSERT OR IGNORE INTO product_groups (id, name, sort_order, status) VALUES (?, ?, ?, ?)',
        [group.id, group.name, group.sortOrder, 'Active'])
      for (let i = 0; i < group.rows.length; i++) {
        const p = group.rows[i]
        db.run(`INSERT OR IGNORE INTO products
                  (id, group_id, case_barcode, item_barcode, description, qty, size, price, status, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
          [p.id, group.id, p.caseBarcode ?? null, p.itemBarcode ?? null,
           p.description ?? null, p.qty ?? null, p.size ?? null, p.price ?? null, i])
      }
    }
  }

  save()
  console.log('[DB] Ready →', DB_PATH)
}

// ── AUTH ──────────────────────────────────────────────────────────
const loginUser = (username, password) => {
  const user = queryOne('SELECT * FROM users WHERE username = ?', [username])
  if (!user) return { success: false, message: 'User not found.' }
  if (!bcrypt.compareSync(password, user.password_hash)) return { success: false, message: 'Incorrect password.' }
  return { success: true, user: { id: user.id, username: user.username, role: user.role, employeeId: user.employee_id ?? null, themeColor: user.theme_color ?? null, themeMode: user.theme_mode ?? 'light' } }
}

// ── EMPLOYEE ACCOUNTS ─────────────────────────────────────────────

// Maps a department name to the closest app role.
// Adjust this table to match your org's access needs.
const DEPT_ROLE_MAP = {
  'HR'         : 'hr',
  'Admin'      : 'hr',
  'Sales'      : 'outlets',
  'Warehouse'  : 'inventory',
  'Accounting' : 'inventory',
  'Finance'    : 'inventory',
  'Intern'     : 'hr',
  'Marketing'  : 'outlets',
  'Production' : 'inventory',
  'IT'         : 'admin',
}

function deptToRole(dept) {
  return DEPT_ROLE_MAP[dept] ?? 'hr'
}

// Creates (or updates) a user account tied to an employee.
// username = employee_no, password = employee_no (hashed).
// If an account already exists for this employee_id, it updates
// the username/role but does NOT reset the password — so a user
// who changed their password won't lose it when their record is edited.
const createEmployeeAccount = (employeeId, employeeNo, dept) => {
  const role     = deptToRole(dept)
  const existing = queryOne('SELECT id FROM users WHERE employee_id = ?', [employeeId])

  if (existing) {
    // Update username and role (e.g. dept changed), keep existing password_hash
    db.run(
      `UPDATE users SET username = ?, role = ?, sync_status = 'pending'
       WHERE employee_id = ?`,
      [employeeNo, role, employeeId]
    )
  } else {
    // Brand-new account — default password is the employee number
    const hash = bcrypt.hashSync(employeeNo, 10)
    db.run(
      `INSERT OR IGNORE INTO users (username, password_hash, role, employee_id)
       VALUES (?, ?, ?, ?)`,
      [employeeNo, hash, role, employeeId]
    )
  }
  save()
}

// ── USER MANAGEMENT (for Settings / admin panel) ──────────────────

const getUsers = () =>
  queryAll(`
    SELECT u.id, u.username, u.role, u.employee_id, u.created_at,
           e.name AS employee_name, e.department
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    ORDER BY u.created_at
  `).map(u => ({
    id:           u.id,
    username:     u.username,
    role:         u.role,
    employeeId:   u.employee_id   ?? null,
    employeeName: u.employee_name ?? null,
    department:   u.department    ?? null,
    createdAt:    u.created_at    ?? '',
  }))

// Admin can change role or reset password for any user
const updateUserRole = (id, role) => {
  run(`UPDATE users SET role = ?, sync_status = 'pending' WHERE id = ?`, [role, id])
}

const resetUserPassword = (id, newPassword) => {
  const hash = bcrypt.hashSync(newPassword, 10)
  run(`UPDATE users SET password_hash = ?, sync_status = 'pending' WHERE id = ?`, [hash, id])
}

// Deletes only employee-linked accounts (not the seeded admin accounts)
const deleteUserAccount = (id) => {
  run(`DELETE FROM users WHERE id = ? AND employee_id IS NOT NULL`, [id])
}

const updateUserTheme = (id, color, mode) => {
  run(`UPDATE users SET theme_color = ?, theme_mode = ?, sync_status = 'pending' WHERE id = ?`, [color, mode, id])
}


const getEmployees         = () => queryAll("SELECT * FROM employees WHERE status != 'Archived' ORDER BY name")
const getArchivedEmployees = () => queryAll("SELECT * FROM employees WHERE status = 'Archived' ORDER BY name")

const upsertEmployee = (emp) => {
  run(`
    INSERT INTO employees
      (id, employee_no, name, position, department, contact, status,
       leave_type, leave_start, leave_end, shift_start, shift_end, day_offs, day_schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      employee_no  = excluded.employee_no, name         = excluded.name,
      position     = excluded.position,    department   = excluded.department,
      contact      = excluded.contact,     status       = excluded.status,
      leave_type   = excluded.leave_type,  leave_start  = excluded.leave_start,
      leave_end    = excluded.leave_end,   shift_start  = excluded.shift_start,
      shift_end    = excluded.shift_end,   day_offs     = excluded.day_offs,
      day_schedule = excluded.day_schedule, sync_status = 'pending'
  `, [emp.id, emp.employee_no, emp.name,
      emp.position ?? null, emp.department ?? null, emp.contact ?? null,
      emp.status ?? 'Active',
      emp.leave_type ?? null, emp.leave_start ?? null, emp.leave_end ?? null,
      emp.shift_start ?? '07:00', emp.shift_end ?? '17:30', emp.day_offs ?? 'Saturday,Sunday',
      emp.day_schedule ?? null])

  // Auto-create or sync the employee's login account
  createEmployeeAccount(emp.id, emp.employee_no, emp.department ?? '')
}

const archiveEmployee         = (id) => run("UPDATE employees SET status='Archived', sync_status='pending' WHERE id=?", [id])
const unarchiveEmployee       = (id) => run("UPDATE employees SET status='Active',   sync_status='pending' WHERE id=?", [id])
const permanentDeleteEmployee = (id) => run("DELETE FROM employees WHERE id=?", [id])

// ── ATTENDANCE ────────────────────────────────────────────────────
const getAttendance = () => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs, e.day_schedule
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  ORDER BY a.date DESC, e.name
`)
const getAttendanceByDate = (date) => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs, e.day_schedule
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  WHERE a.date = ? ORDER BY e.name
`, [date])

const importAttendance = (records) => {
  let newEmployees = 0, newRecords = 0, skippedRecords = 0
  for (const rec of records) {
    let emp = queryOne('SELECT id FROM employees WHERE employee_no = ?', [rec.employee_no])
    if (!emp) {
      const newId = crypto.randomUUID()
      db.run(`INSERT OR IGNORE INTO employees
                (id, employee_no, name, status, shift_start, shift_end, day_offs, sync_status)
              VALUES (?, ?, ?, 'Active', '07:00', '17:30', 'Saturday,Sunday', 'pending')`,
        [newId, rec.employee_no, rec.employee_no])
      emp = { id: newId }
      newEmployees++
      // Create default login account for stub employee (username = password = employee_no)
      createEmployeeAccount(newId, rec.employee_no, '')
    }
    const existing = queryOne('SELECT id FROM attendance WHERE employee_id=? AND date=?', [emp.id, rec.date])
    if (existing) { skippedRecords++; continue }
    db.run(`INSERT INTO attendance
              (id, employee_id, date, shift_in, lunch_out, lunch_in, shift_out,
               total_hours, status, extra_taps, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [crypto.randomUUID(), emp.id, rec.date,
       rec.shift_in ?? null, rec.lunch_out ?? null, rec.lunch_in ?? null, rec.shift_out ?? null,
       rec.total_hours ?? null, rec.status ?? 'Absent',
       rec.extraTaps?.length > 0 ? JSON.stringify(rec.extraTaps) : null])
    newRecords++
  }
  save()
  return { newEmployees, newRecords, skippedRecords }
}

// ── PRODUCTS ──────────────────────────────────────────────────────
const mapProduct = (p) => ({
  id:          p.id,
  groupId:     p.group_id,
  caseBarcode: p.case_barcode ?? '',
  itemBarcode: p.item_barcode ?? '',
  description: p.description  ?? '',
  qty:         p.qty          ?? '',
  size:        p.size         ?? '',
  price:       p.price        ?? '',
  status:      p.status       ?? 'Active',
})

// Only active groups with their active products
const getProductGroups = () => {
  const groups = queryAll(`SELECT * FROM product_groups WHERE status = 'Active' ORDER BY sort_order, created_at`)
  return groups.map((g) => ({
    id:   g.id,
    name: g.name,
    rows: queryAll(
      `SELECT * FROM products WHERE group_id = ? AND status = 'Active' ORDER BY sort_order, created_at`,
      [g.id]
    ).map(mapProduct),
  }))
}

// All archived products — includes group name for display
const getArchivedProducts = () =>
  queryAll(`
    SELECT p.*, pg.name AS group_name, pg.status AS group_status
    FROM products p
    LEFT JOIN product_groups pg ON pg.id = p.group_id
    WHERE p.status = 'Archived'
    ORDER BY pg.name, p.description
  `).map((p) => ({
    ...mapProduct(p),
    groupName:   p.group_name   ?? 'Unknown Group',
    groupStatus: p.group_status ?? 'missing',
  }))

const upsertProductGroup = (group) => run(`
  INSERT INTO product_groups (id, name, sort_order, status)
  VALUES (?, ?, ?, 'Active')
  ON CONFLICT(id) DO UPDATE SET
    name        = excluded.name,
    sort_order  = excluded.sort_order,
    sync_status = 'pending'
`, [group.id, group.name, group.sortOrder ?? 0])

const deleteProductGroup = (id) => {
  db.run(`UPDATE products      SET status='Archived', sync_status='pending' WHERE group_id=? AND status='Active'`, [id])
  db.run(`UPDATE product_groups SET status='Archived', sync_status='pending' WHERE id=?`, [id])
  save()
}

const upsertProduct = (p) => run(`
  INSERT INTO products
    (id, group_id, case_barcode, item_barcode, description, qty, size, price, status, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
  ON CONFLICT(id) DO UPDATE SET
    group_id     = excluded.group_id,
    case_barcode = excluded.case_barcode,
    item_barcode = excluded.item_barcode,
    description  = excluded.description,
    qty          = excluded.qty,
    size         = excluded.size,
    price        = excluded.price,
    sort_order   = excluded.sort_order,
    sync_status  = 'pending'
`, [p.id, p.groupId,
    p.caseBarcode ?? null, p.itemBarcode ?? null, p.description ?? null,
    p.qty ?? null, p.size ?? null, p.price ?? null, p.sortOrder ?? 0])

const archiveProduct = (id) =>
  run(`UPDATE products SET status='Archived', sync_status='pending' WHERE id=?`, [id])

const restoreProduct = (id) => {
  const product = queryOne(`SELECT group_id FROM products WHERE id = ?`, [id])
  if (product?.group_id) {
    db.run(`UPDATE product_groups SET status='Active', sync_status='pending'
            WHERE id = ? AND status = 'Archived'`, [product.group_id])
  }
  db.run(`UPDATE products SET status='Active', sync_status='pending' WHERE id=?`, [id])
  save()
}

const permanentDeleteProduct = (id) => run(`DELETE FROM products WHERE id=?`, [id])


// ── OUTLETS ───────────────────────────────────────────────────────
const mapOutlet = (o) => ({
  id:        o.id,
  name:      o.name      ?? '',
  code:      o.code      ?? '',
  address:   o.address   ?? '',
  region:    o.region    ?? '',
  status:    o.status    ?? 'Active',
  discounts: (() => { try { return JSON.parse(o.discounts ?? '[]') } catch { return [] } })(),
})

const getOutlets = () =>
  queryAll(`SELECT * FROM outlets WHERE archived = 0 ORDER BY name`)
    .map(mapOutlet)

const getArchivedOutlets = () =>
  queryAll(`SELECT * FROM outlets WHERE archived = 1 ORDER BY name`)
    .map(mapOutlet)

const upsertOutlet = (o) => run(`
  INSERT INTO outlets (id, name, code, address, region, status, discounts, archived)
  VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  ON CONFLICT(id) DO UPDATE SET
    name        = excluded.name,
    code        = excluded.code,
    address     = excluded.address,
    region      = excluded.region,
    status      = excluded.status,
    discounts   = excluded.discounts,
    sync_status = 'pending'
`, [
  o.id,
  o.name,
  o.code    ?? null,
  o.address ?? null,
  o.region  ?? null,
  o.status  ?? 'Active',
  JSON.stringify(o.discounts ?? []),
])

const archiveOutlet = (id) =>
  run(`UPDATE outlets SET archived = 1, sync_status = 'pending' WHERE id = ?`, [id])

const unarchiveOutlet = (id) =>
  run(`UPDATE outlets SET archived = 0, sync_status = 'pending' WHERE id = ?`, [id])

const permanentDeleteOutlet = (id) =>
  run(`DELETE FROM outlets WHERE id = ?`, [id])


// ── OUTLET PRODUCT PRICES ─────────────────────────────────────────
const getOutletProductPrices = (outletId) => {
  const rows = queryAll(
    `SELECT product_id, price FROM outlet_product_prices WHERE outlet_id = ?`,
    [outletId]
  )
  const map = {}
  for (const r of rows) map[r.product_id] = r.price
  return map
}

const upsertOutletProductPrice = (outletId, productId, price) => {
  run(
    `INSERT INTO outlet_product_prices (outlet_id, product_id, price, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(outlet_id, product_id) DO UPDATE SET
       price      = excluded.price,
       updated_at = excluded.updated_at`,
    [outletId, productId, price]
  )
}

const deleteOutletProductPrice = (outletId, productId) => {
  run(
    `DELETE FROM outlet_product_prices WHERE outlet_id = ? AND product_id = ?`,
    [outletId, productId]
  )
}


// ── CLINIC LOGS ───────────────────────────────────────────────────
const mapClinicLog = (r) => ({
  id:           r.id,
  employeeId:   r.employee_id   ?? null,
  fullName:     r.full_name     ?? '',
  employeeCode: r.employee_code ?? '',
  date:         r.date          ?? '',
  time:         r.time          ?? '',
  complaint:    r.complaint     ?? '',
  disposition:  r.disposition   ?? '',
  bp:           r.bp            ?? '',
  temp:         r.temp          ?? '',
  treatment:    r.treatment     ?? '',
  pulse:        r.pulse         ?? '',
  spo2:         r.spo2          ?? '',
  gender:       r.gender        ?? '',
  age:          r.age           ?? '',
  attachments:  (() => { try { return JSON.parse(r.attachments ?? '[]') } catch { return [] } })(),
  status:       r.status        ?? 'Active',
  createdAt:    r.created_at    ?? '',
})

const getClinicLogs = () =>
  queryAll(`SELECT * FROM clinic_logs WHERE status = 'Active' ORDER BY date DESC, time DESC`)
    .map(mapClinicLog)

const getArchivedClinicLogs = () =>
  queryAll(`SELECT * FROM clinic_logs WHERE status = 'Archived' ORDER BY date DESC, time DESC`)
    .map(mapClinicLog)

const upsertClinicLog = (log) => run(`
  INSERT INTO clinic_logs
    (id, employee_id, full_name, employee_code, date, time,
     complaint, disposition, bp, temp, treatment,
     pulse, spo2, gender, age, attachments, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  ON CONFLICT(id) DO UPDATE SET
    employee_id   = excluded.employee_id,
    full_name     = excluded.full_name,
    employee_code = excluded.employee_code,
    date          = excluded.date,
    time          = excluded.time,
    complaint     = excluded.complaint,
    disposition   = excluded.disposition,
    bp            = excluded.bp,
    temp          = excluded.temp,
    treatment     = excluded.treatment,
    pulse         = excluded.pulse,
    spo2          = excluded.spo2,
    gender        = excluded.gender,
    age           = excluded.age,
    attachments   = excluded.attachments,
    sync_status   = 'pending'
`, [
  log.id, log.employeeId ?? null, log.fullName, log.employeeCode ?? null,
  log.date, log.time,
  log.complaint ?? null, log.disposition ?? null,
  log.bp ?? null, log.temp ?? null, log.treatment ?? null,
  log.pulse ?? null, log.spo2 ?? null, log.gender ?? null, log.age ?? null,
  typeof log.attachments === 'string' ? log.attachments : JSON.stringify(log.attachments ?? []),
])

const archiveClinicLog = (id) =>
  run(`UPDATE clinic_logs SET status='Archived', sync_status='pending' WHERE id=?`, [id])

const unarchiveClinicLog = (id) =>
  run(`UPDATE clinic_logs SET status='Active', sync_status='pending' WHERE id=?`, [id])

const permanentDeleteClinicLog = (id) =>
  run(`DELETE FROM clinic_logs WHERE id=?`, [id])

// ── SAVED ORDERS ─────────────────────────────────────────────────
const mapOrder = (r) => ({
  id:           r.id,
  seriesNumber: r.series_number,
  outletId:     r.outlet_id    ?? null,
  outletName:   r.outlet_name  ?? null,
  groups:       (() => { try { return JSON.parse(r.groups_json    ?? '[]') } catch { return [] } })(),
  subtotal:     r.subtotal     ?? 0,
  discounts:    (() => { try { return JSON.parse(r.discounts_json ?? '[]') } catch { return [] } })(),
  grandTotal:   r.grand_total  ?? 0,
  createdAt:    r.created_at   ?? '',
})

const saveOrder = (order) => run(`
  INSERT INTO saved_orders
    (id, series_number, outlet_id, outlet_name, groups_json, subtotal, discounts_json, grand_total)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, [
  order.id,
  order.seriesNumber,
  order.outletId    ?? null,
  order.outletName  ?? null,
  JSON.stringify(order.groups     ?? []),
  order.subtotal    ?? 0,
  JSON.stringify(order.discounts  ?? []),
  order.grandTotal  ?? 0,
])

const getOrdersByOutlet  = (outletId) =>
  queryAll(`SELECT * FROM saved_orders WHERE outlet_id = ?    ORDER BY created_at DESC`, [outletId]).map(mapOrder)

const getOrdersByDefault = () =>
  queryAll(`SELECT * FROM saved_orders WHERE outlet_id IS NULL ORDER BY created_at DESC`).map(mapOrder)

const getAllOrders = () =>
  queryAll(`SELECT * FROM saved_orders ORDER BY created_at DESC`).map(mapOrder)

const deleteOrder = (id) => run(`DELETE FROM saved_orders WHERE id = ?`, [id])


// ── LEAVE REQUESTS ────────────────────────────────────────────────
const submitLeaveRequest = (req) => {
  run(`
    INSERT INTO leave_requests
      (id, employee_id, employee_no, employee_name, leave_type, start_date, end_date, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.id, req.employee_id, req.employee_no, req.employee_name,
      req.leave_type, req.start_date, req.end_date, req.reason ?? null])
  save()
}

const getLeaveRequests = () => queryAll(`
  SELECT lr.*, e.name AS emp_name, e.department
  FROM leave_requests lr
  LEFT JOIN employees e ON e.id = lr.employee_id
  ORDER BY lr.created_at DESC
`)

const getMyLeaveRequests = (employeeNo) => queryAll(`
  SELECT * FROM leave_requests
  WHERE employee_no = ?
  ORDER BY created_at DESC
`, [employeeNo])

const reviewLeaveRequest = (id, status, note, reviewedBy) => {
  run(`
    UPDATE leave_requests
    SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), sync_status = 'pending'
    WHERE id = ?
  `, [status, note ?? null, reviewedBy ?? null, id])
  save()
}

module.exports = {
  initDb, loginUser, queryAll, queryOne, run,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, importAttendance,
  getProductGroups, getArchivedProducts,
  upsertProductGroup, deleteProductGroup,
  upsertProduct, archiveProduct, restoreProduct, permanentDeleteProduct,
  getOutlets, getArchivedOutlets,
  upsertOutlet, archiveOutlet, unarchiveOutlet, permanentDeleteOutlet,
  getOutletProductPrices, upsertOutletProductPrice, deleteOutletProductPrice,
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
  getUsers, updateUserRole, resetUserPassword, deleteUserAccount, updateUserTheme,
  saveOrder, getOrdersByOutlet, getOrdersByDefault, getAllOrders, deleteOrder,
  submitLeaveRequest, getLeaveRequests, getMyLeaveRequests, reviewLeaveRequest,
}
