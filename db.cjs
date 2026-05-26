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
      temp          TEXT,
      treatment     TEXT,
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
  `)

  try { db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_emp_date ON attendance(employee_id, date)`) } catch (_) {}

  // ── MIGRATIONS ────────────────────────────────────────────────
  try { db.run(`ALTER TABLE products      ADD COLUMN price  REAL`) }              catch (_) {}
  try { db.run(`ALTER TABLE products      ADD COLUMN status TEXT DEFAULT 'Active'`) } catch (_) {}
  try { db.run(`ALTER TABLE product_groups ADD COLUMN status TEXT DEFAULT 'Active'`) } catch (_) {}
  try { db.run(`UPDATE products       SET price  = new_srp  WHERE price  IS NULL AND new_srp IS NOT NULL`) } catch (_) {}
  try { db.run(`UPDATE products       SET status = 'Active' WHERE status IS NULL`) } catch (_) {}
  try { db.run(`UPDATE product_groups SET status = 'Active' WHERE status IS NULL`) } catch (_) {}
  // ── CLINIC LOGS MIGRATIONS (for existing DBs with old schema) ─
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN full_name     TEXT NOT NULL DEFAULT ''`)  } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN employee_code TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN time          TEXT NOT NULL DEFAULT ''`)  } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN complaint     TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN disposition   TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN bp            TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN temp          TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN treatment     TEXT`)                       } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN status        TEXT DEFAULT 'Active'`)      } catch (_) {}
  try { db.run(`ALTER TABLE clinic_logs ADD COLUMN created_at    TEXT DEFAULT (datetime('now'))`) } catch (_) {}
  // backfill status for any old rows
  try { db.run(`UPDATE clinic_logs SET status = 'Active' WHERE status IS NULL`) }             catch (_) {}

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
  return { success: true, user: { id: user.id, username: user.username, role: user.role } }
}

// ── EMPLOYEES ─────────────────────────────────────────────────────
const getEmployees         = () => queryAll("SELECT * FROM employees WHERE status != 'Archived' ORDER BY name")
const getArchivedEmployees = () => queryAll("SELECT * FROM employees WHERE status = 'Archived' ORDER BY name")

const upsertEmployee = (emp) => run(`
  INSERT INTO employees
    (id, employee_no, name, position, department, contact, status,
     leave_type, leave_start, leave_end, shift_start, shift_end, day_offs)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    employee_no = excluded.employee_no, name        = excluded.name,
    position    = excluded.position,    department  = excluded.department,
    contact     = excluded.contact,     status      = excluded.status,
    leave_type  = excluded.leave_type,  leave_start = excluded.leave_start,
    leave_end   = excluded.leave_end,   shift_start = excluded.shift_start,
    shift_end   = excluded.shift_end,   day_offs    = excluded.day_offs,
    sync_status = 'pending'
`, [emp.id, emp.employee_no, emp.name,
    emp.position ?? null, emp.department ?? null, emp.contact ?? null,
    emp.status ?? 'Active',
    emp.leave_type ?? null, emp.leave_start ?? null, emp.leave_end ?? null,
    emp.shift_start ?? '07:00', emp.shift_end ?? '17:30', emp.day_offs ?? 'Saturday,Sunday'])

const archiveEmployee         = (id) => run("UPDATE employees SET status='Archived', sync_status='pending' WHERE id=?", [id])
const unarchiveEmployee       = (id) => run("UPDATE employees SET status='Active',   sync_status='pending' WHERE id=?", [id])
const permanentDeleteEmployee = (id) => run("DELETE FROM employees WHERE id=?", [id])

// ── ATTENDANCE ────────────────────────────────────────────────────
const getAttendance = () => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  ORDER BY a.date DESC, e.name
`)
const getAttendanceByDate = (date) => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs
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
// Also flags whether the parent group itself is gone (archived or missing)
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
    groupStatus: p.group_status ?? 'missing',   // 'Active' | 'Archived' | 'missing'
  }))

const upsertProductGroup = (group) => run(`
  INSERT INTO product_groups (id, name, sort_order, status)
  VALUES (?, ?, ?, 'Active')
  ON CONFLICT(id) DO UPDATE SET
    name        = excluded.name,
    sort_order  = excluded.sort_order,
    sync_status = 'pending'
`, [group.id, group.name, group.sortOrder ?? 0])

// Soft-archive the group AND all its active products
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

// Restore product — AND also restore its parent group if it was archived
const restoreProduct = (id) => {
  // Find the product's group_id first
  const product = queryOne(`SELECT group_id FROM products WHERE id = ?`, [id])
  if (product?.group_id) {
    // If the parent group is archived, bring it back to Active
    db.run(`UPDATE product_groups SET status='Active', sync_status='pending'
            WHERE id = ? AND status = 'Archived'`, [product.group_id])
  }
  // Now restore the product itself
  db.run(`UPDATE products SET status='Active', sync_status='pending' WHERE id=?`, [id])
  save()
}

const permanentDeleteProduct = (id) => run(`DELETE FROM products WHERE id=?`, [id])


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
     complaint, disposition, bp, temp, treatment, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
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
    sync_status   = 'pending'
`, [
  log.id, log.employeeId ?? null, log.fullName, log.employeeCode ?? null,
  log.date, log.time,
  log.complaint ?? null, log.disposition ?? null,
  log.bp ?? null, log.temp ?? null, log.treatment ?? null,
])

const archiveClinicLog = (id) =>
  run(`UPDATE clinic_logs SET status='Archived', sync_status='pending' WHERE id=?`, [id])

const unarchiveClinicLog = (id) =>
  run(`UPDATE clinic_logs SET status='Active', sync_status='pending' WHERE id=?`, [id])

const permanentDeleteClinicLog = (id) =>
  run(`DELETE FROM clinic_logs WHERE id=?`, [id])

module.exports = {
  initDb, loginUser, queryAll, queryOne, run,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, importAttendance,
  getProductGroups, getArchivedProducts,
  upsertProductGroup, deleteProductGroup,
  upsertProduct, archiveProduct, restoreProduct, permanentDeleteProduct,
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
}