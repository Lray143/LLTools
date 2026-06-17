require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { createClient } = require('@libsql/client')
const path      = require('path')
const { app }   = require('electron')
const bcrypt    = require('bcryptjs')

// ── Turso Client (Embedded Replica) ───────────────────────────────────────────
// Reads/writes happen on a local SQLite file (instant, works offline).
// The SDK silently syncs that local file with Turso Cloud in the background.
const LOCAL_DB_PATH = path.join(app.getPath('userData'), 'lltools-turso.db')

// Lazily initialized — NOT created at require-time to avoid crashing Electron
// when the Turso cloud server is unreachable (OS error 10060).
let client = null

function getClient() {
  if (client) return client
  try {
    client = createClient({
      url:       `file:${LOCAL_DB_PATH}`,
      syncUrl:   process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    console.log('[DB] Client created (cloud sync enabled)')
  } catch (err) {
    console.warn('[DB] Cloud connection failed, falling back to local-only:', err.message)
    client = createClient({
      url: `file:${LOCAL_DB_PATH}`,
    })
  }
  return client
}

// ── Helper wrappers ───────────────────────────────────────────────────────────
// These mirror the old sql.js API so the rest of the code stays readable.

const executeWithRetry = async (sql, args = []) => {
  let retries = 20
  while (retries > 0) {
    try {
      return await getClient().execute({ sql, args })
    } catch (err) {
      const msg = err.message || ''
      const code = err.code || ''
      if (msg.includes('PermissionDenied') || msg.includes('Access is denied') || msg.includes('EBUSY') || msg.includes('database is locked') || msg.includes('WalConflict') || msg.includes('SQLITE_BUSY') || code === 'SQLITE_BUSY') {
        retries--
        if (retries === 0) throw err
        await new Promise(r => setTimeout(r, 250))
      } else {
        throw err
      }
    }
  }
}

const queryAll = async (sql, params = []) => {
  const result = await executeWithRetry(sql, params)
  return result.rows.map(r => Object.fromEntries(Object.entries(r)))
}

const queryOne = async (sql, params = []) => {
  const rows = await queryAll(sql, params)
  return rows[0] ?? null
}

const run = async (sql, params = []) => {
  await executeWithRetry(sql, params)
}

// Sync local replica with cloud (call this periodically)
let lastDataVersion = -1;
let isSyncing = false;
let isBulkOperating = false;

const syncCloud = async () => {
  if (isSyncing || isBulkOperating) return;
  isSyncing = true;
  try {
    await getClient().sync();
    // Check if the cloud sync actually brought in new data by checking the sqlite fingerprint
    const result = await getClient().execute('PRAGMA data_version;');
    const currentVersion = result.rows[0].data_version;
    
    if (lastDataVersion !== -1 && currentVersion !== lastDataVersion) {
      // The database actually changed (e.g. new chat, leave request)
      const { BrowserWindow } = require('electron');
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.send('db-synced');
      }
    }
    lastDataVersion = currentVersion;
  } catch (e) {
    // console.warn('[DB] Sync skipped:', e.message)
  } finally {
    isSyncing = false;
  }
}

// Background sync interval is handled by sync-worker.cjs (separate thread).
// The main thread no longer runs its own interval to avoid WAL contention.
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
      { id: 'r-c8', caseBarcode: '14809010740509', itemBarcode: '4809010740502', description: 'Placenta Cream',         qty: 12,  size: '20g',  price: 75.75  },
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
      { id: 'r-s9',  caseBarcode: '14809010740844', itemBarcode: '4809010740847', description: 'Baby Bath Soap w/ SB',               qty: 96,  size: '135g',  price: 53.00 },
      { id: 'r-s10', caseBarcode: '14809010740264', itemBarcode: '4809010740267', description: 'Tawas Soap',                         qty: 96,  size: '135g',  price: 83.50 },
      { id: 'r-s11', caseBarcode: '14806517781349', itemBarcode: '4806517781342', description: 'Kojic Soap',                         qty: 96,  size: '150g',  price: 66.25 },
      { id: 'r-s12', caseBarcode: '1480651770991',  itemBarcode: '4806517780994', description: 'RDL Papaya Soap',                    qty: 144, size: '90g',   price: 39.00 },
      { id: 'r-s13', caseBarcode: '14806517780212', itemBarcode: '4806517780215', description: 'Surewhite Soap w/ Gigawhite',        qty: 118, size: '135g',  price: 66.75 },
      { id: 'r-s14', caseBarcode: '14809010740561', itemBarcode: '4809010740564', description: 'Whitening Soap w/ Melawhite',        qty: 96,  size: '135g',  price: 69.00 },
      { id: 'r-s15', caseBarcode: '14809010740691', itemBarcode: '4809010740694', description: 'Papaya Soap Sachets',                qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s16', caseBarcode: '14809010740998', itemBarcode: '4809010740991', description: 'Papaya Soap with Milk Sachet',       qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s17', caseBarcode: '14806517781370', itemBarcode: '4806517781373', description: 'Kojic Soap sachet',                  qty: 432, size: '25g',   price: 17.00 },
      { id: 'r-s18', caseBarcode: '14809010740868', itemBarcode: '4809010740861', description: 'Babyskin Bath Soap-Sachet',          qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s19', caseBarcode: '14806517781974', itemBarcode: '4806617781977', description: 'Papaya Whitening Soap 3x Valuepack', qty: 60,  size: '65gms', price: 78.00 },
    ],
  },
  {
    id: 'g-lotion', name: 'LOTION', sortOrder: 4,
    rows: [
      { id: 'r-l1', caseBarcode: '14806517781363', itemBarcode: '4806517781366', description: 'Kojic Whitening Lotion', qty: 108, size: '50ml',  price: 59.50  },
      { id: 'r-l2', caseBarcode: '14806517781356', itemBarcode: '480651781359', description: 'Kojic Whitening Lotion', qty: 72,  size: '100ml', price: 116.50 },
      { id: 'r-l3', caseBarcode: '14806517781660', itemBarcode: '4806517781663', description: 'Kojic Whitening Lotion', qty: 24,  size: '500ml', price: 527.00 },
      { id: 'r-l4', caseBarcode: '14809010740646', itemBarcode: '4809010740649', description: 'Babyskin Moisturizing Lotion', qty: 144, size: '50ml', price: 43.50 },
      { id: 'r-l5', caseBarcode: '14809010740653', itemBarcode: '4809010740656', description: 'Babyskin Moisturizing Lotion', qty: 96,  size: '100ml', price: 74.25 },
    ],
  },
  {
    id: 'g-cleansers', name: "CLEANSER'S", sortOrder: 5,
    rows: [
      { id: 'r-cl1', caseBarcode: '14809010740165', itemBarcode: '4809010740168', description: 'Avocado Extract', qty: 144, size: '75ml', price: 32.25 },
      { id: 'r-cl2', caseBarcode: '14809010740158', itemBarcode: '4809010740151', description: 'Avocado Extract', qty: 72, size: '150ml', price: 47.00 },
      { id: 'r-cl3', caseBarcode: '14809010740813', itemBarcode: '4809010740816', description: 'Avocado Extract', qty: 72, size: '250ml', price: 64.75 },
      { id: 'r-cl4', caseBarcode: '14809010740127', itemBarcode: '4809010740120', description: 'Cucumber Extract', qty: 144, size: '75ml', price: 32.25 },
      { id: 'r-cl5', caseBarcode: '14809010740110', itemBarcode: '4809010740113', description: 'Cucumber Extract', qty: 72, size: '150ml', price: 47.00 },
      { id: 'r-cl6', caseBarcode: '14809010740820', itemBarcode: '4809010740823', description: 'Cucumber Extract', qty: 72, size: '250ml', price: 64.75 },
      { id: 'r-cl7', caseBarcode: '14809010740103', itemBarcode: '4809010740106', description: 'Kalamansi Extract', qty: 144, size: '75ml', price: 32.25 },
      { id: 'r-cl8', caseBarcode: '14809010740097', itemBarcode: '4809010740090', description: 'Kalamansi Extract', qty: 72, size: '150ml', price: 47.00 },
      { id: 'r-cl9', caseBarcode: '14809010740806', itemBarcode: '4809010740809', description: 'Kalamansi Extract', qty: 72, size: '250ml', price: 64.75 },
      { id: 'r-cl10', caseBarcode: '14809010740141', itemBarcode: '4809010740144', description: 'Papaya Extract', qty: 144, size: '75ml', price: 32.25 },
      { id: 'r-cl11', caseBarcode: '14809010740134', itemBarcode: '4809010740137', description: 'Papaya Extract', qty: 72, size: '150ml', price: 47.00 },
      { id: 'r-cl12', caseBarcode: '14809010740790', itemBarcode: '4809010740793', description: 'Papaya Extract', qty: 72, size: '250ml', price: 64.75 },
      { id: 'r-cl13', caseBarcode: '14806517781653', itemBarcode: '4806517781656', description: 'Kojic + Glutathione', qty: 144, size: '75ml', price: 38.50 },
      { id: 'r-cl14', caseBarcode: '14806517781646', itemBarcode: '4806517781649', description: 'Kojic + Glutathione', qty: 72, size: '150ml', price: 54.00 },
      { id: 'r-cl15', caseBarcode: '14806517781639', itemBarcode: '4806517781632', description: 'Kojic + Glutathione', qty: 72, size: '250ml', price: 71.00 },
      { id: 'r-cl16', caseBarcode: '14809010740080', itemBarcode: '4809010740083', description: 'Plain', qty: 144, size: '75ml', price: 32.25 },
      { id: 'r-cl17', caseBarcode: '14809010740073', itemBarcode: '4809010740076', description: 'Plain', qty: 72, size: '150ml', price: 47.00 },
      { id: 'r-cl18', caseBarcode: '14809010740837', itemBarcode: '4809010740830', description: 'Plain', qty: 72, size: '250ml', price: 64.75 },
      { id: 'r-cl19', caseBarcode: '14809010740738', itemBarcode: '4806517780314', description: 'Freshmen Papaya', qty: 144, size: '75ml', price: 35.75 },
      { id: 'r-cl20', caseBarcode: '14809010740745', itemBarcode: '4806517780321', description: 'Freshmen Papaya', qty: 72, size: '150ml', price: 48.75 },
    ],
  },
  {
    id: 'g-tawas', name: 'TAWAS', sortOrder: 6,
    rows: [
      { id: 'r-tw1', caseBarcode: '14806517781097', itemBarcode: '4806517781090', description: 'Tawas Powder Plain', qty: 432, size: '50g', price: 13.00 },
      { id: 'r-tw2', caseBarcode: '14806517781103', itemBarcode: '4806517781106', description: 'Tawas Powder w/ Perfume', qty: 432, size: '50g', price: 13.75 },
    ],
  },
]

// ── DB Init ────────────────────────────────────────────────────────────────────
const initDb = async () => {
  // Pull latest data from cloud before we do anything
  await syncCloud()

  try {
    await getClient().execute("ALTER TABLE users ADD COLUMN last_active TEXT DEFAULT NULL")
  } catch (err) {
    // Column already exists or error
  }

  // Create all tables (with retry — syncCloud above may still hold WAL lock)
  let schemaRetries = 20
  while (schemaRetries > 0) {
    try {
      await getClient().executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'hr',
      employee_id   TEXT DEFAULT NULL,
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
      day_schedule  TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT DEFAULT NULL,
      sync_status   TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT,
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
      employee_id   TEXT,
      full_name     TEXT NOT NULL DEFAULT '',
      employee_code TEXT,
      date          TEXT NOT NULL DEFAULT '',
      time          TEXT NOT NULL DEFAULT '',
      complaint     TEXT,
      disposition   TEXT,
      bp            TEXT,
      temp          TEXT,
      pulse         TEXT,
      spo2          TEXT,
      gender        TEXT,
      age           TEXT,
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
      group_id      TEXT,
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
      outlet_id   TEXT NOT NULL,
      product_id  TEXT NOT NULL,
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
      leave_no      TEXT UNIQUE,
      employee_id   TEXT,
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
    );
    CREATE TABLE IF NOT EXISTS reports (
      id                  TEXT PRIMARY KEY,
      report_no           TEXT UNIQUE,
      employee_id         TEXT,
      employee_no         TEXT,
      employee_name       TEXT,
      report_type         TEXT,
      subject             TEXT,
      description         TEXT,
      priority            TEXT,
      branch              TEXT,
      status              TEXT DEFAULT 'Pending',
      assigned_to         TEXT DEFAULT NULL,
      attachment_paths    TEXT DEFAULT '[]',
      report_details_json TEXT DEFAULT NULL,
      is_archived         INTEGER DEFAULT 0,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS report_comments (
      id         TEXT PRIMARY KEY,
      report_id  TEXT,
      user_id    TEXT,
      username   TEXT,
      comment    TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS report_status_logs (
      id         TEXT PRIMARY KEY,
      report_id  TEXT,
      old_status TEXT,
      new_status TEXT,
      changed_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS department_chats (
      id           TEXT PRIMARY KEY,
      department   TEXT NOT NULL,
      sender_id    TEXT NOT NULL,
      sender_name  TEXT NOT NULL,
      message      TEXT,
      file_url     TEXT,
      reactions    TEXT DEFAULT '{}',
      created_at   TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS direct_messages (
      id           TEXT PRIMARY KEY,
      room_id      TEXT NOT NULL,
      sender_id    TEXT NOT NULL,
      sender_name  TEXT NOT NULL,
      message      TEXT,
      file_url     TEXT,
      reactions    TEXT DEFAULT '{}',
      created_at   TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chat_read_receipts (
      user_id      TEXT NOT NULL,
      room_id      TEXT NOT NULL,
      last_read_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, room_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_emp_date ON attendance(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_chat_dept ON department_chats(department);
    CREATE INDEX IF NOT EXISTS idx_dm_room ON direct_messages(room_id);
    
    -- Performance Indexes for Background Polling --
    CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    CREATE INDEX IF NOT EXISTS idx_leave_emp_no ON leave_requests(employee_no);
    CREATE INDEX IF NOT EXISTS idx_leave_created ON leave_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_emp_no ON reports(employee_no);
    CREATE INDEX IF NOT EXISTS idx_clinic_date_time ON clinic_logs(date DESC, time DESC);
    CREATE INDEX IF NOT EXISTS idx_outlets_name ON outlets(name);
    CREATE INDEX IF NOT EXISTS idx_products_sort ON products(group_id, sort_order, created_at);
  `)
      break // success — exit retry loop
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('SQLITE_BUSY') || msg.includes('database is locked') || msg.includes('WalConflict')) {
        schemaRetries--
        if (schemaRetries === 0) throw err
        await new Promise(r => setTimeout(r, 500))
      } else {
        throw err
      }
    }
  }

  // Migration: add leave_no to existing tables that don't have it yet
  try {
    await run("ALTER TABLE leave_requests ADD COLUMN leave_no TEXT")
  } catch (_) { /* column already exists — safe to ignore */ }

  try { await run("ALTER TABLE department_chats ADD COLUMN reactions TEXT DEFAULT '{}'") } catch (_) {}
  try { await run("ALTER TABLE direct_messages ADD COLUMN reactions TEXT DEFAULT '{}'") } catch (_) {}
  try { await run("ALTER TABLE department_chats ADD COLUMN is_unsent INTEGER DEFAULT 0") } catch (_) {}
  try { await run("ALTER TABLE department_chats ADD COLUMN is_edited INTEGER DEFAULT 0") } catch (_) {}
  try { await run("ALTER TABLE department_chats ADD COLUMN deleted_for TEXT DEFAULT '[]'") } catch (_) {}
  try { await run("ALTER TABLE direct_messages ADD COLUMN is_unsent INTEGER DEFAULT 0") } catch (_) {}
  try { await run("ALTER TABLE direct_messages ADD COLUMN is_edited INTEGER DEFAULT 0") } catch (_) {}
  try { await run("ALTER TABLE direct_messages ADD COLUMN deleted_for TEXT DEFAULT '[]'") } catch (_) {}

  // ── Seed admin user ────────────────────────────────────────────────────────
  const adminHash = bcrypt.hashSync('admin123', 10)
  await run(
    `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
    ['admin@doublel.com', adminHash, 'admin']
  )

  // Remove legacy hardcoded accounts
  await run(`DELETE FROM users WHERE username IN ('hr@doublel.com', 'clinic@doublel.com', 'inventory@doublel.com')`)

  // Fix employees wrongly assigned 'hr' role
  await run(`
    UPDATE users SET role = 'employee'
    WHERE role = 'hr'
      AND employee_id IS NOT NULL
      AND employee_id IN (SELECT id FROM employees WHERE department IS NULL OR department = '')
  `)

  // ── Seed products (only if empty) ─────────────────────────────────────────
  const groupCount = await queryOne('SELECT COUNT(*) as n FROM product_groups')
  if (!groupCount || groupCount.n === 0) {
    for (const group of SEED_PRODUCT_GROUPS) {
      await run(
        'INSERT OR IGNORE INTO product_groups (id, name, sort_order, status) VALUES (?, ?, ?, ?)',
        [group.id, group.name, group.sortOrder, 'Active']
      )
      for (let i = 0; i < group.rows.length; i++) {
        const p = group.rows[i]
        await run(
          `INSERT OR IGNORE INTO products
            (id, group_id, case_barcode, item_barcode, description, qty, size, price, status, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
          [p.id, group.id, p.caseBarcode ?? null, p.itemBarcode ?? null,
           p.description ?? null, p.qty ?? null, p.size ?? null, p.price ?? null, i]
        )
      }
    }
  }

  // Push seed data up to cloud
  await syncCloud()
  console.log('[DB] Ready (Turso Embedded Replica) →', LOCAL_DB_PATH)
}

// ── AUTH ───────────────────────────────────────────────────────────────────────
const loginUser = async (username, password) => {
  const user = await queryOne(`
    SELECT u.*, e.status AS employee_status, e.department, e.name AS employee_name, e.position AS employee_position
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    WHERE u.username = ?
  `, [username])
  if (!user) return { success: false, message: 'User not found.' }
  if (user.employee_status === 'Archived') return { success: false, message: 'This account has been deactivated.' }
  if (!bcrypt.compareSync(password, user.password_hash)) return { success: false, message: 'Incorrect password.' }
  return {
    success: true,
    user: {
      id           : user.id,
      username     : user.username,
      role         : user.role,
      employeeId   : user.employee_id        ?? null,
      department   : user.department         ?? null,
      employeeName : user.employee_name      ?? null,
      position     : user.employee_position  ?? null,
      themeColor   : user.theme_color        ?? null,
      themeMode    : user.theme_mode         ?? 'light',
      themeMode    : user.theme_mode         ?? 'light',
    },
  }
}

const refreshUser = async (id) => {
  const user = await queryOne(`
    SELECT u.*, e.department, e.name AS employee_name, e.position AS employee_position
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    WHERE u.id = ?
  `, [id])
  if (!user) return null
  return {
    id           : user.id,
    username     : user.username,
    role         : user.role,
    employeeId   : user.employee_id        ?? null,
    department   : user.department         ?? null,
    employeeName : user.employee_name      ?? null,
    position     : user.employee_position  ?? null,
    themeColor   : user.theme_color        ?? null,
    themeMode    : user.theme_mode         ?? 'light',
  }
}

// ── EMPLOYEE ACCOUNTS ──────────────────────────────────────────────────────────
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
  // Return 'employee' (no module access) when no department is set.
  // Do NOT default to 'hr' — that would give unassigned employees HR access.
  if (!dept || dept.trim() === '') return 'employee'
  return DEPT_ROLE_MAP[dept] ?? 'employee'
}

const createEmployeeAccount = async (employeeId, employeeNo, dept) => {
  const strNo = String(employeeNo)
  const role = deptToRole(dept)
  const existing = await queryOne('SELECT id, role FROM users WHERE employee_id = ?', [employeeId])
  
  if (existing) {
    const hasDept = dept && dept.trim() !== ''
    if (hasDept) {
      await run(
        `UPDATE users SET username = ?, role = ?, sync_status = 'pending' WHERE employee_id = ?`,
        [strNo, role, employeeId]
      )
    } else {
      await run(
        `UPDATE users SET username = ?, sync_status = 'pending' WHERE employee_id = ?`,
        [strNo, employeeId]
      )
    }
  } else {
    const hash = await bcrypt.hash(strNo, 10)
    await run(
      `INSERT OR IGNORE INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)`,
      [strNo, hash, role, employeeId]
    )
  }
}

// ── USER MANAGEMENT ────────────────────────────────────────────────────────────
const heartbeatUser = async (userId) => {
  if (!userId) return
  try {
    await run(`UPDATE users SET last_active = datetime('now') WHERE id = ?`, [userId])
  } catch (err) {
    console.error('Heartbeat error:', err)
  }
}

const getUsers = async () => {
  const rows = await queryAll(`
    SELECT u.id, u.username, u.role, u.employee_id, u.created_at, u.last_active,
           e.name AS employee_name, e.department
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    ORDER BY u.created_at
  `)
  return rows.map(u => ({
    id:           u.id,
    username:     u.username,
    role:         u.role,
    employeeId:   u.employee_id   ?? null,
    employeeName: u.employee_name ?? null,
    department:   u.department    ?? null,
    createdAt:    u.created_at    ?? '',
    lastActive:   u.last_active   ?? null,
  }))
}

const updateUserRole      = async (id, role) => run(`UPDATE users SET role = ?, sync_status = 'pending' WHERE id = ?`, [role, id])
const resetUserPassword   = async (id, newPassword) => run(`UPDATE users SET password_hash = ?, sync_status = 'pending' WHERE id = ?`, [bcrypt.hashSync(newPassword, 10), id])
const deleteUserAccount   = async (id) => run(`DELETE FROM users WHERE id = ? AND employee_id IS NOT NULL`, [id])
const updateUserTheme     = async (id, color, mode) => run(`UPDATE users SET theme_color = ?, theme_mode = ?, sync_status = 'pending' WHERE id = ?`, [color, mode, id])

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
const getEmployees = async () => queryAll(`
  SELECT
    e.*,
    u.last_active,
    (SELECT lr.leave_type  FROM leave_requests lr
      WHERE lr.employee_no = e.employee_no AND lr.status = 'Approved'
        AND date('now','localtime') BETWEEN lr.start_date AND lr.end_date LIMIT 1) AS auto_leave_type,
    (SELECT lr.start_date  FROM leave_requests lr
      WHERE lr.employee_no = e.employee_no AND lr.status = 'Approved'
        AND date('now','localtime') BETWEEN lr.start_date AND lr.end_date LIMIT 1) AS auto_leave_start,
    (SELECT lr.end_date    FROM leave_requests lr
      WHERE lr.employee_no = e.employee_no AND lr.status = 'Approved'
        AND date('now','localtime') BETWEEN lr.start_date AND lr.end_date LIMIT 1) AS auto_leave_end
  FROM employees e
  LEFT JOIN users u ON u.employee_id = e.id
  WHERE e.status != 'Archived'
  ORDER BY e.name
`)

const getArchivedEmployees = async () => queryAll("SELECT * FROM employees WHERE status = 'Archived' ORDER BY name")

const upsertEmployee = async (emp) => {
  await run(`
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
  await createEmployeeAccount(emp.id, emp.employee_no, emp.department ?? '')
}

const archiveEmployee         = async (id) => run("UPDATE employees SET status='Archived', sync_status='pending' WHERE id=?", [id])
const unarchiveEmployee       = async (id) => run("UPDATE employees SET status='Active',   sync_status='pending' WHERE id=?", [id])
const permanentDeleteEmployee = async (id) => {
  await run("DELETE FROM users WHERE employee_id=?", [id])
  return run("DELETE FROM employees WHERE id=?", [id])
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
const getAttendance = async () => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs, e.day_schedule
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  ORDER BY a.date DESC, e.name
`)

const getAttendanceByDate = async (date) => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs, e.day_schedule
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  WHERE a.date = ? ORDER BY e.name
`, [date])

const getMyAttendance = async (employeeId) => queryAll(`
  SELECT a.id, a.date, a.shift_in, a.lunch_out, a.lunch_in, a.shift_out,
         a.total_hours, a.status, a.extra_taps,
         e.employee_no, e.name, e.department, e.shift_start, e.shift_end, e.day_offs, e.day_schedule
  FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
  WHERE a.employee_id = ? ORDER BY a.date DESC
`, [employeeId])

const importAttendance = async (records) => {
  // Wait if a background sync is currently running to prevent SQLITE_BUSY errors
  while (isSyncing) {
    await new Promise(r => setTimeout(r, 100));
  }
  isBulkOperating = true;
  try {
    let newEmployees = 0, newRecords = 0, skippedRecords = 0

    // 1. Fetch all existing employees into memory to avoid per-record queries
    const allEmps = await queryAll('SELECT id, employee_no FROM employees')
    const empMap = new Map() // employee_no -> id
    for (const e of allEmps) empMap.set(String(e.employee_no), e.id)

    // 2. Fetch all attendance composite keys into a Set to avoid per-record queries
    const allAtt = await queryAll('SELECT employee_id, date FROM attendance')
    const attSet = new Set()
    for (const a of allAtt) attSet.add(`${a.employee_id}|${a.date}`)

    const empInsertArgs = []
    const attInsertArgs = []
    const missingAccounts = [] // Store info to create user accounts after batch

    for (const rec of records) {
      let empId = empMap.get(String(rec.employee_no))
      
      if (!empId) {
        empId = crypto.randomUUID()
        empMap.set(String(rec.employee_no), empId)
        empInsertArgs.push(
          empId, rec.employee_no, rec.employee_no, 
          'Active', '07:00', '17:30', 'Saturday,Sunday', 'pending'
        )
        missingAccounts.push({ id: empId, no: rec.employee_no })
        newEmployees++
      }

      const key = `${empId}|${rec.date}`
      if (attSet.has(key)) {
        skippedRecords++
        continue
      }

      attSet.add(key)
      attInsertArgs.push(
        crypto.randomUUID(), empId, rec.date,
        rec.shift_in ?? null, rec.lunch_out ?? null, rec.lunch_in ?? null, rec.shift_out ?? null,
        rec.total_hours ?? null, rec.status ?? 'Absent',
        rec.extraTaps?.length > 0 ? JSON.stringify(rec.extraTaps) : null,
        'pending'
      )
      newRecords++
    }

    const runBulkInsert = async (table, columns, args, argCountPerRow) => {
      if (args.length === 0) return;
      const CHUNK_ROWS = 500
      const totalArgsPerChunk = CHUNK_ROWS * argCountPerRow
      for (let i = 0; i < args.length; i += totalArgsPerChunk) {
        const chunkArgs = args.slice(i, i + totalArgsPerChunk)
        const rowCount = chunkArgs.length / argCountPerRow
        const rowPlaceholders = `(${Array(argCountPerRow).fill('?').join(', ')})`
        const placeholders = Array(rowCount).fill(rowPlaceholders).join(', ')
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`
        
        let retries = 20
        while (retries > 0) {
          try {
            await getClient().execute({ sql, args: chunkArgs })
            break
          } catch (err) {
            const msg = err.message || ''
            const code = err.code || ''
            if (msg.includes('PermissionDenied') || msg.includes('Access is denied') || msg.includes('EBUSY') || msg.includes('database is locked') || msg.includes('WalConflict') || msg.includes('SQLITE_BUSY') || code === 'SQLITE_BUSY') {
              retries--
              if (retries === 0) throw err
              await new Promise(r => setTimeout(r, 250))
            } else {
              throw err
            }
          }
        }
        await new Promise(r => setTimeout(r, 10))
      }
    }

    await runBulkInsert('employees', 'id, employee_no, name, status, shift_start, shift_end, day_offs, sync_status', empInsertArgs, 8)
    await runBulkInsert('attendance', 'id, employee_id, date, shift_in, lunch_out, lunch_in, shift_out, total_hours, status, extra_taps, sync_status', attInsertArgs, 11)

    // 4. Create dummy user accounts for any newly discovered employees
    for (const acc of missingAccounts) {
      await createEmployeeAccount(acc.id, acc.no, '')
    }

    return { newEmployees, newRecords, skippedRecords }
  } finally {
    isBulkOperating = false;
  }
}

const importAttendanceRawText = async (text) => {
  const { parseRawBiometrics } = require('./parseRawBiometrics.cjs');
  
  // 1. Fetch fresh employee map for parsing rules
  const allEmps = await queryAll('SELECT * FROM employees');
  const empMap = {};
  for (const e of allEmps) {
    let daySchedule = null
    if (e.day_schedule) {
      try { daySchedule = JSON.parse(e.day_schedule) } catch (_) {}
    }
    empMap[String(e.employee_no)] = {
      shiftStart  : e.shift_start ?? '07:00',
      shiftEnd    : e.shift_end   ?? '17:30',
      dayOffs     : e.day_offs ? e.day_offs.split(',').map(d => d.trim()).filter(Boolean) : ['Saturday', 'Sunday'],
      daySchedule,
    }
  }

  // 3. Parse raw biometrics in Main Thread
  const parsed = await parseRawBiometrics(text, empMap);
  if (parsed.length === 0) return { newEmployees: 0, newRecords: 0, skippedRecords: 0, parsedCount: 0 };

  // 4. Run the standard DB insertion
  const result = await importAttendance(parsed);
  return { ...result, parsedCount: parsed.length };
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
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

const getProductGroups = async () => {
  const groups = await queryAll(`SELECT * FROM product_groups WHERE status = 'Active' ORDER BY sort_order, created_at`)
  const result = []
  for (const g of groups) {
    const rows = await queryAll(
      `SELECT * FROM products WHERE group_id = ? AND status = 'Active' ORDER BY sort_order, created_at`,
      [g.id]
    )
    result.push({ id: g.id, name: g.name, rows: rows.map(mapProduct) })
  }
  return result
}

const getArchivedProducts = async () => {
  const rows = await queryAll(`
    SELECT p.*, pg.name AS group_name, pg.status AS group_status
    FROM products p
    LEFT JOIN product_groups pg ON pg.id = p.group_id
    WHERE p.status = 'Archived'
    ORDER BY pg.name, p.description
  `)
  return rows.map(p => ({ ...mapProduct(p), groupName: p.group_name ?? 'Unknown Group', groupStatus: p.group_status ?? 'missing' }))
}

const upsertProductGroup = async (group) => run(`
  INSERT INTO product_groups (id, name, sort_order, status)
  VALUES (?, ?, ?, 'Active')
  ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order, sync_status = 'pending'
`, [group.id, group.name, group.sortOrder ?? 0])

const deleteProductGroup = async (id) => {
  await run(`UPDATE products       SET status='Archived', sync_status='pending' WHERE group_id=? AND status='Active'`, [id])
  await run(`UPDATE product_groups SET status='Archived', sync_status='pending' WHERE id=?`, [id])
}

const upsertProduct = async (p) => run(`
  INSERT INTO products (id, group_id, case_barcode, item_barcode, description, qty, size, price, status, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
  ON CONFLICT(id) DO UPDATE SET
    group_id=excluded.group_id, case_barcode=excluded.case_barcode, item_barcode=excluded.item_barcode,
    description=excluded.description, qty=excluded.qty, size=excluded.size, price=excluded.price,
    sort_order=excluded.sort_order, sync_status='pending'
`, [p.id, p.groupId, p.caseBarcode ?? null, p.itemBarcode ?? null, p.description ?? null,
    p.qty ?? null, p.size ?? null, p.price ?? null, p.sortOrder ?? 0])

const archiveProduct = async (id) => run(`UPDATE products SET status='Archived', sync_status='pending' WHERE id=?`, [id])

const restoreProduct = async (id) => {
  const product = await queryOne(`SELECT group_id FROM products WHERE id = ?`, [id])
  if (product?.group_id) {
    await run(`UPDATE product_groups SET status='Active', sync_status='pending' WHERE id = ? AND status = 'Archived'`, [product.group_id])
  }
  await run(`UPDATE products SET status='Active', sync_status='pending' WHERE id=?`, [id])
}

const permanentDeleteProduct = async (id) => run(`DELETE FROM products WHERE id=?`, [id])

// ── OUTLETS ───────────────────────────────────────────────────────────────────
const mapOutlet = (o) => ({
  id:        o.id,
  name:      o.name      ?? '',
  code:      o.code      ?? '',
  address:   o.address   ?? '',
  region:    o.region    ?? '',
  status:    o.status    ?? 'Active',
  discounts: (() => { try { return JSON.parse(o.discounts ?? '[]') } catch { return [] } })(),
})

const getOutlets         = async () => (await queryAll(`SELECT * FROM outlets WHERE archived = 0 ORDER BY name`)).map(mapOutlet)
const getArchivedOutlets = async () => (await queryAll(`SELECT * FROM outlets WHERE archived = 1 ORDER BY name`)).map(mapOutlet)

const upsertOutlet = async (o) => run(`
  INSERT INTO outlets (id, name, code, address, region, status, discounts, archived)
  VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, code=excluded.code, address=excluded.address, region=excluded.region,
    status=excluded.status, discounts=excluded.discounts, sync_status='pending'
`, [o.id, o.name, o.code ?? null, o.address ?? null, o.region ?? null, o.status ?? 'Active', JSON.stringify(o.discounts ?? [])])

const archiveOutlet         = async (id) => run(`UPDATE outlets SET archived=1, sync_status='pending' WHERE id=?`, [id])
const unarchiveOutlet       = async (id) => run(`UPDATE outlets SET archived=0, sync_status='pending' WHERE id=?`, [id])
const permanentDeleteOutlet = async (id) => run(`DELETE FROM outlets WHERE id=?`, [id])

// ── OUTLET PRODUCT PRICES ─────────────────────────────────────────────────────
const getOutletProductPrices = async (outletId) => {
  const rows = await queryAll(`SELECT product_id, price FROM outlet_product_prices WHERE outlet_id = ?`, [outletId])
  const map = {}
  for (const r of rows) map[r.product_id] = r.price
  return map
}

const upsertOutletProductPrice = async (outletId, productId, price) => run(`
  INSERT INTO outlet_product_prices (outlet_id, product_id, price, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(outlet_id, product_id) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at
`, [outletId, productId, price])

const deleteOutletProductPrice = async (outletId, productId) => run(
  `DELETE FROM outlet_product_prices WHERE outlet_id=? AND product_id=?`, [outletId, productId]
)

// ── CLINIC LOGS ───────────────────────────────────────────────────────────────
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

const getClinicLogs         = async () => (await queryAll(`SELECT * FROM clinic_logs WHERE status = 'Active'   ORDER BY date DESC, time DESC`)).map(mapClinicLog)
const getArchivedClinicLogs = async () => (await queryAll(`SELECT * FROM clinic_logs WHERE status = 'Archived' ORDER BY date DESC, time DESC`)).map(mapClinicLog)

const upsertClinicLog = async (log) => run(`
  INSERT INTO clinic_logs
    (id, employee_id, full_name, employee_code, date, time,
     complaint, disposition, bp, temp, treatment, pulse, spo2, gender, age, attachments, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  ON CONFLICT(id) DO UPDATE SET
    employee_id=excluded.employee_id, full_name=excluded.full_name, employee_code=excluded.employee_code,
    date=excluded.date, time=excluded.time, complaint=excluded.complaint, disposition=excluded.disposition,
    bp=excluded.bp, temp=excluded.temp, treatment=excluded.treatment, pulse=excluded.pulse,
    spo2=excluded.spo2, gender=excluded.gender, age=excluded.age, attachments=excluded.attachments, sync_status='pending'
`, [log.id, log.employeeId ?? null, log.fullName, log.employeeCode ?? null,
    log.date, log.time, log.complaint ?? null, log.disposition ?? null,
    log.bp ?? null, log.temp ?? null, log.treatment ?? null,
    log.pulse ?? null, log.spo2 ?? null, log.gender ?? null, log.age ?? null,
    typeof log.attachments === 'string' ? log.attachments : JSON.stringify(log.attachments ?? [])])

const archiveClinicLog       = async (id) => run(`UPDATE clinic_logs SET status='Archived', sync_status='pending' WHERE id=?`, [id])
const unarchiveClinicLog     = async (id) => run(`UPDATE clinic_logs SET status='Active',   sync_status='pending' WHERE id=?`, [id])
const permanentDeleteClinicLog = async (id) => run(`DELETE FROM clinic_logs WHERE id=?`, [id])

// ── SAVED ORDERS ──────────────────────────────────────────────────────────────
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

const saveOrder = async (order) => run(`
  INSERT INTO saved_orders (id, series_number, outlet_id, outlet_name, groups_json, subtotal, discounts_json, grand_total, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [order.id, order.seriesNumber, order.outletId ?? null, order.outletName ?? null,
    JSON.stringify(order.groups ?? []), order.subtotal ?? 0, JSON.stringify(order.discounts ?? []), order.grandTotal ?? 0,
    order.orderDate ?? null])

const getOrdersByOutlet  = async (outletId) => (await queryAll(`SELECT * FROM saved_orders WHERE outlet_id = ?    ORDER BY created_at DESC`, [outletId])).map(mapOrder)
const getOrdersByDefault = async ()          => (await queryAll(`SELECT * FROM saved_orders WHERE outlet_id IS NULL ORDER BY created_at DESC`)).map(mapOrder)
const getAllOrders        = async ()          => (await queryAll(`SELECT * FROM saved_orders ORDER BY created_at DESC`)).map(mapOrder)
const deleteOrder        = async (id)        => run(`DELETE FROM saved_orders WHERE id=?`, [id])
const updateOrderDate    = async (id, date)  => run(`UPDATE saved_orders SET created_at = ? WHERE id = ?`, [date, id])

// ── LEAVE REQUESTS ────────────────────────────────────────────────────────────
const submitLeaveRequest = async (req) => {
  // Generate next LVE-XXX number
  const last = await queryOne(`SELECT leave_no FROM leave_requests WHERE leave_no IS NOT NULL ORDER BY created_at DESC LIMIT 1`)
  let nextNum = 1
  if (last?.leave_no) {
    const match = last.leave_no.match(/LVE-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  const leaveNo = `LVE-${String(nextNum).padStart(3, '0')}`

  await run(`
    INSERT INTO leave_requests (id, leave_no, employee_id, employee_no, employee_name, leave_type, start_date, end_date, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.id, leaveNo, req.employee_id, req.employee_no, req.employee_name,
      req.leave_type, req.start_date, req.end_date, req.reason ?? null])
  await syncCloud()
  return { leaveNo }
}

const getLeaveRequests = async () => queryAll(`
  SELECT lr.*, e.name AS emp_name, e.department
  FROM leave_requests lr
  LEFT JOIN employees e ON e.id = lr.employee_id
  ORDER BY lr.created_at DESC
`)

const getMyLeaveRequests = async (employeeNo) => queryAll(`
  SELECT * FROM leave_requests WHERE employee_no = ? ORDER BY created_at DESC
`, [employeeNo])

const reviewLeaveRequest = async (id, status, note, reviewedBy) => {
  await run(`
    UPDATE leave_requests
    SET status=?, review_note=?, reviewed_by=?, reviewed_at=datetime('now'), sync_status='pending'
    WHERE id=?
  `, [status, note ?? null, reviewedBy ?? null, id])
  await syncCloud()
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
const mapReport = (r) => ({
  id:               r.id,
  reportNo:         r.report_no           ?? '',
  employeeId:       r.employee_id         ?? null,
  employeeNo:       r.employee_no         ?? '',
  employeeName:     r.employee_name       ?? '',
  reportType:       r.report_type         ?? '',
  subject:          r.subject             ?? '',
  description:      r.description         ?? '',
  priority:         r.priority            ?? 'Medium',
  branch:           r.branch              ?? '',
  status:           r.status              ?? 'Pending',
  assignedTo:       r.assigned_to         ?? null,
  attachmentPaths:  (() => { try { return JSON.parse(r.attachment_paths ?? '[]') } catch { return [] } })(),
  reportDetailsJson: (() => { try { return JSON.parse(r.report_details_json ?? 'null') } catch { return null } })(),
  isArchived:       Boolean(r.is_archived),
  createdAt:        r.created_at          ?? '',
  updatedAt:        r.updated_at          ?? '',
})

const createReport = async (report) => {
  const last = await queryOne(`SELECT report_no FROM reports ORDER BY created_at DESC LIMIT 1`)
  let nextNum = 1
  if (last?.report_no) {
    const match = last.report_no.match(/RPT-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  const reportNo = `RPT-${String(nextNum).padStart(3, '0')}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await run(`
    INSERT INTO reports
      (id, report_no, employee_id, employee_no, employee_name,
       report_type, subject, description, priority, branch,
       status, assigned_to, attachment_paths, report_details_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, ?, ?, ?, ?)
  `, [report.id, reportNo,
      report.employeeId ?? null, report.employeeNo ?? null, report.employeeName ?? null,
      report.reportType, report.subject ?? null, report.description ?? null,
      report.priority ?? 'Medium', report.branch ?? null,
      JSON.stringify(report.attachmentPaths ?? []),
      report.reportDetailsJson ? JSON.stringify(report.reportDetailsJson) : null,
      now, now])
  await run(
    `INSERT INTO report_status_logs (id, report_id, old_status, new_status, changed_by, created_at) VALUES (?, ?, '', 'Pending', ?, ?)`,
    [crypto.randomUUID(), report.id, report.employeeName ?? report.employeeNo ?? 'System', now]
  )
  return { reportNo }
}

const getReports    = async (archived = false) => (await queryAll(`SELECT * FROM reports WHERE is_archived = ? ORDER BY created_at DESC`, [archived ? 1 : 0])).map(mapReport)
const getMyReports  = async (employeeNo, archived = false) => (await queryAll(`SELECT * FROM reports WHERE employee_no = ? AND is_archived = ? ORDER BY created_at DESC`, [employeeNo, archived ? 1 : 0])).map(mapReport)
const getReportById = async (id) => { const row = await queryOne(`SELECT * FROM reports WHERE id = ?`, [id]); return row ? mapReport(row) : null }

const updateReportStatus = async (id, status, changedBy) => {
  const current   = await queryOne(`SELECT status FROM reports WHERE id = ?`, [id])
  const oldStatus = current?.status ?? 'Pending'
  const now       = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await run(`UPDATE reports SET status=?, updated_at=? WHERE id=?`, [status, now, id])
  await run(`INSERT INTO report_status_logs (id, report_id, old_status, new_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), id, oldStatus, status, changedBy ?? 'System', now])
}

const assignReport = async (id, assignedTo) => {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await run(`UPDATE reports SET assigned_to=?, updated_at=? WHERE id=?`, [assignedTo, now, id])
}

const addReportComment = async (comment) => {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await run(`INSERT INTO report_comments (id, report_id, user_id, username, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [comment.id, comment.reportId, comment.userId ?? null, comment.username ?? '', comment.comment ?? '', now])
}

const getReportComments   = async (reportId) => (await queryAll(`SELECT * FROM report_comments WHERE report_id=? ORDER BY created_at ASC`, [reportId])).map(c => ({
  id: c.id, reportId: c.report_id, userId: c.user_id ?? null, username: c.username ?? '', comment: c.comment ?? '', createdAt: c.created_at ?? '',
}))

const getReportStatusLogs = async (reportId) => (await queryAll(`SELECT * FROM report_status_logs WHERE report_id=? ORDER BY created_at ASC`, [reportId])).map(l => ({
  id: l.id, reportId: l.report_id, oldStatus: l.old_status ?? '', newStatus: l.new_status ?? '', changedBy: l.changed_by ?? '', createdAt: l.created_at ?? '',
}))

const updateReport = async (report) => {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await run(`
    UPDATE reports
    SET report_type=?, subject=?, description=?, priority=?,
        attachment_paths=?, report_details_json=?, updated_at=?
    WHERE id=?
  `, [report.reportType, report.subject ?? null, report.description ?? null, report.priority ?? 'Medium',
      JSON.stringify(report.attachmentPaths ?? []),
      report.reportDetailsJson ? JSON.stringify(report.reportDetailsJson) : null,
      now, report.id])
}

const archiveReport         = async (id) => run(`UPDATE reports SET is_archived=1 WHERE id=?`, [id])
const unarchiveReport       = async (id) => run(`UPDATE reports SET is_archived=0 WHERE id=?`, [id])
const permanentDeleteReport = async (id) => {
  await run(`DELETE FROM reports WHERE id=?`, [id])
  await run(`DELETE FROM report_comments WHERE report_id=?`, [id])
  await run(`DELETE FROM report_status_logs WHERE report_id=?`, [id])
}

// ── DEPARTMENT CHATS ─────────────────────────────────────────────────────────
const getDepartmentChats = async (department) => {
  const rows = await queryAll(`
    SELECT * FROM department_chats 
    WHERE department = ? 
    ORDER BY created_at ASC 
    LIMIT 200
  `, [department])
  return rows.map(r => ({
    id:          r.id,
    department:  r.department,
    senderId:    r.sender_id,
    senderName:  r.sender_name,
    message:     r.message,
    fileUrl:     r.file_url,
    reactions:   (() => { try { return JSON.parse(r.reactions || '{}') } catch { return {} } })(),
    createdAt:   r.created_at ? r.created_at.replace(' ', 'T') + 'Z' : '',
    isUnsent:    !!r.is_unsent,
    isEdited:    !!r.is_edited,
    deletedFor:  (() => { try { return JSON.parse(r.deleted_for || '[]') } catch { return [] } })(),
  }))
}

const sendDepartmentChat = async ({ id, department, senderId, senderName, message, fileUrl }) => {
  await run(`
    INSERT INTO department_chats (id, department, sender_id, sender_name, message, file_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, department, senderId, senderName, message || null, fileUrl || null])
}

const getDirectMessages = async (roomId) => {
  const rows = await queryAll(`
    SELECT * FROM direct_messages 
    WHERE room_id = ? 
    ORDER BY created_at ASC 
    LIMIT 200
  `, [roomId])
  return rows.map(r => ({
    id:          r.id,
    roomId:      r.room_id,
    senderId:    r.sender_id,
    senderName:  r.sender_name,
    message:     r.message,
    fileUrl:     r.file_url,
    reactions:   (() => { try { return JSON.parse(r.reactions || '{}') } catch { return {} } })(),
    createdAt:   r.created_at ? r.created_at.replace(' ', 'T') + 'Z' : '',
    isUnsent:    !!r.is_unsent,
    isEdited:    !!r.is_edited,
    deletedFor:  (() => { try { return JSON.parse(r.deleted_for || '[]') } catch { return [] } })(),
  }))
}

const sendDirectMessage = async ({ id, roomId, senderId, senderName, message, fileUrl }) => {
  await run(`
    INSERT INTO direct_messages (id, room_id, sender_id, sender_name, message, file_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, roomId, senderId, senderName, message || null, fileUrl || null])
}

// Patches the file_url after a background cloud upload completes
const updateChatFileUrl  = async (id, fileUrl) => run(`UPDATE department_chats SET file_url = ? WHERE id = ?`, [fileUrl, id])
const updateDmFileUrl    = async (id, fileUrl) => run(`UPDATE direct_messages  SET file_url = ? WHERE id = ?`, [fileUrl, id])

const editMessage = async (msgId, userId, newText, isDm = false) => {
  const table = isDm ? 'direct_messages' : 'department_chats'
  const row = await queryOne(`SELECT sender_id, created_at FROM ${table} WHERE id = ?`, [msgId])
  if (!row || String(row.sender_id) !== String(userId)) return { success: false, error: 'Unauthorized' }
  const diffMs = Date.now() - new Date(row.created_at.replace(' ', 'T') + 'Z').getTime()
  if (diffMs > 15 * 60 * 1000) return { success: false, error: 'Message is too old to edit' }
  await run(`UPDATE ${table} SET message = ?, is_edited = 1 WHERE id = ?`, [newText, msgId])
  return { success: true }
}

const unsendMessage = async (msgId, userId, isDm = false) => {
  const table = isDm ? 'direct_messages' : 'department_chats'
  const row = await queryOne(`SELECT sender_id, created_at FROM ${table} WHERE id = ?`, [msgId])
  if (!row || String(row.sender_id) !== String(userId)) return { success: false, error: 'Unauthorized' }
  const diffMs = Date.now() - new Date(row.created_at.replace(' ', 'T') + 'Z').getTime()
  if (diffMs > 15 * 60 * 1000) return { success: false, error: 'Message is too old to unsend' }
  await run(`UPDATE ${table} SET message = NULL, is_unsent = 1, file_url = NULL WHERE id = ?`, [msgId])
  return { success: true }
}

const deleteMessageForMe = async (msgId, userId, isDm = false) => {
  const table = isDm ? 'direct_messages' : 'department_chats'
  const row = await queryOne(`SELECT deleted_for FROM ${table} WHERE id = ?`, [msgId])
  if (!row) return { success: false, error: 'Message not found' }
  let deletedFor = []
  try { deletedFor = JSON.parse(row.deleted_for || '[]') } catch (e) {}
  if (!deletedFor.includes(String(userId))) {
    deletedFor.push(String(userId))
    await run(`UPDATE ${table} SET deleted_for = ? WHERE id = ?`, [JSON.stringify(deletedFor), msgId])
  }
  return { success: true }
}
const toggleReaction = async (msgId, userId, userName, emoji, isDm = false) => {
  const table = isDm ? 'direct_messages' : 'department_chats'
  const row = await queryOne(`SELECT reactions FROM ${table} WHERE id = ?`, [msgId])
  if (!row) return

  let reactions = {}
  try { reactions = JSON.parse(row.reactions || '{}') } catch (e) {}

  let wasSameEmoji = false;
  // Remove user's previous reaction from ANY emoji
  for (const [existingEmoji, users] of Object.entries(reactions)) {
    const idx = users.findIndex(r => String(r.userId) === String(userId))
    if (idx >= 0) {
      if (existingEmoji === emoji) wasSameEmoji = true;
      users.splice(idx, 1)
      if (users.length === 0) delete reactions[existingEmoji]
    }
  }

  // If they clicked a DIFFERENT emoji than they already had, add it
  if (!wasSameEmoji) {
    if (!reactions[emoji]) reactions[emoji] = []
    reactions[emoji].push({ userId, userName })
  }

  await run(`UPDATE ${table} SET reactions = ? WHERE id = ?`, [JSON.stringify(reactions), msgId])
}

const markChatAsRead = async (userId, roomId) => {
  await run(`
    INSERT INTO chat_read_receipts (user_id, room_id, last_read_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id, room_id) DO UPDATE SET last_read_at = datetime('now')
  `, [userId, roomId])
}

const getChatSidebarData = async (userId) => {
  // Get latest message timestamp per department
  const depts = await queryAll(`
    SELECT room_id, last_msg_at, last_sender_id, last_sender_name, last_message, last_file_url
    FROM (
      SELECT department as room_id, created_at as last_msg_at, sender_id as last_sender_id, sender_name as last_sender_name, message as last_message, file_url as last_file_url,
             ROW_NUMBER() OVER(PARTITION BY department ORDER BY created_at DESC) as rn
      FROM department_chats
    )
    WHERE rn = 1
  `)

  const allDms = await queryAll(`
    SELECT room_id, last_msg_at, last_sender_id, last_sender_name, last_message, last_file_url
    FROM (
      SELECT room_id, created_at as last_msg_at, sender_id as last_sender_id, sender_name as last_sender_name, message as last_message, file_url as last_file_url,
             ROW_NUMBER() OVER(PARTITION BY room_id ORDER BY created_at DESC) as rn
      FROM direct_messages
      WHERE room_id LIKE ? OR room_id LIKE ?
    )
    WHERE rn = 1
  `, [`DM_${userId}_%`, `DM_%_${userId}`])

  // Get the user's read receipts
  const receipts = await queryAll(`
    SELECT room_id, last_read_at 
    FROM chat_read_receipts 
    WHERE user_id = ?
  `, [userId])

  const receiptMap = receipts.reduce((acc, r) => {
    acc[r.room_id] = r.last_read_at
    return acc
  }, {})

  return {
    departments: depts.map(d => ({
      roomId: d.room_id,
      lastMsgAt: d.last_msg_at ? d.last_msg_at.replace(' ', 'T') + 'Z' : null,
      lastSenderId: d.last_sender_id,
      lastSenderName: d.last_sender_name,
      lastMessage: d.last_message,
      lastFileUrl: d.last_file_url,
      unread: String(d.last_sender_id) !== String(userId) && (!receiptMap[d.room_id] || d.last_msg_at > receiptMap[d.room_id])
    })),
    dms: allDms.map(d => ({
      roomId: d.room_id,
      lastMsgAt: d.last_msg_at ? d.last_msg_at.replace(' ', 'T') + 'Z' : null,
      lastSenderId: d.last_sender_id,
      lastSenderName: d.last_sender_name,
      lastMessage: d.last_message,
      lastFileUrl: d.last_file_url,
      unread: String(d.last_sender_id) !== String(userId) && (!receiptMap[d.room_id] || d.last_msg_at > receiptMap[d.room_id])
    }))
  }
}

const getRoomReceipts = async (roomId) => {
  const rows = await queryAll(`
    SELECT r.user_id, r.last_read_at, u.username, e.name as employee_name
    FROM chat_read_receipts r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN employees e ON e.id = u.employee_id
    WHERE r.room_id = ?
  `, [roomId])
  return rows.map(r => ({
    userId: r.user_id,
    lastReadAt: r.last_read_at ? r.last_read_at.replace(' ', 'T') + 'Z' : null,
    userName: r.employee_name || r.username
  }))
}
const wipeAllData = async () => {
  // Wait if a background sync is currently running to prevent SQLITE_BUSY errors
  while (isSyncing) {
    await new Promise(r => setTimeout(r, 100));
  }
  isBulkOperating = true;
  try {
    const tables = [
      'attendance', 'clinic_logs', 'saved_orders', 'leave_requests', 'reports',
      'report_comments', 'report_status_logs', 'department_chats',
      'direct_messages', 'chat_read_receipts', 'outlet_product_prices', 'outlets',
      'products', 'product_groups', 'employees'
    ];
    for (const t of tables) {
      try { await run(`DELETE FROM ${t}`) } catch(e){}
      // Yield to let the main process handle OS window events (prevents "Not Responding")
      await new Promise(r => setTimeout(r, 50))
    }
    try { await run(`DELETE FROM users WHERE username != 'admin@doublel.com'`) } catch(e){}
    
    // Immediately reseed default products and sync to cloud
    await initDb()

    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('db-synced');
    }
  } finally {
    isBulkOperating = false;
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  initDb, loginUser, refreshUser, queryAll, queryOne, run, syncCloud, wipeAllData,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, getMyAttendance, importAttendance, importAttendanceRawText,
  getProductGroups, getArchivedProducts,
  upsertProductGroup, deleteProductGroup,
  upsertProduct, archiveProduct, restoreProduct, permanentDeleteProduct,
  getOutlets, getArchivedOutlets,
  upsertOutlet, archiveOutlet, unarchiveOutlet, permanentDeleteOutlet,
  getOutletProductPrices, upsertOutletProductPrice, deleteOutletProductPrice,
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
  getUsers, updateUserRole, resetUserPassword, deleteUserAccount, updateUserTheme, heartbeatUser,
  saveOrder, getOrdersByOutlet, getOrdersByDefault, getAllOrders, deleteOrder, updateOrderDate,
  submitLeaveRequest, getLeaveRequests, getMyLeaveRequests, reviewLeaveRequest,
  createReport, getReports, getMyReports, getReportById,
  updateReportStatus, assignReport, addReportComment,
  getReportComments, getReportStatusLogs,
  updateReport, archiveReport, unarchiveReport, permanentDeleteReport,
  getDepartmentChats, sendDepartmentChat, getDirectMessages, sendDirectMessage,
  updateChatFileUrl, updateDmFileUrl, toggleReaction,
  editMessage, unsendMessage, deleteMessageForMe,
  markChatAsRead, getChatSidebarData, getRoomReceipts
}
