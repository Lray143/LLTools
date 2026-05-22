// ─────────────────────────────────────────────────────────────
// biometricConstants.js
// All static data, mock records, and style maps for Biometrics.
// When DB is ready, replace MOCK_RECORDS and MOCK_STATS with
// real SQLite queries inside a useEffect in Biometrics.jsx.
// ─────────────────────────────────────────────────────────────

// ── MOCK RECORDS ─────────────────────────────────────────────
// TODO: replace with → db.prepare('SELECT * FROM attendance').all()
export const MOCK_RECORDS = [
  { id:'EMP-001', name:'Ana Santos',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'8:02 AM',  lunchOut:'12:01 PM', lunchIn:'1:03 PM',  shiftOut:'5:08 PM',  status:'Present' },
  { id:'EMP-002', name:'Rico Dela Cruz',  department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'8:47 AM',  lunchOut:'12:10 PM', lunchIn:'1:12 PM',  shiftOut:'5:30 PM',  status:'Late'    },
  { id:'EMP-003', name:'Gina Flores',     department:'Marketing',  timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'  },
  { id:'EMP-004', name:'Ben Castillo',    department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:'7:58 AM',  lunchOut:'12:00 PM', lunchIn:'1:00 PM',  shiftOut:'4:59 PM',  status:'Present' },
  { id:'EMP-005', name:'Lita Mendoza',    department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Leave'   },
  { id:'EMP-006', name:'Jun Ramos',       department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'8:00 AM',  lunchOut:'12:00 PM', lunchIn:'1:00 PM',  shiftOut:'5:00 PM',  status:'Present' },
  { id:'EMP-007', name:'Maria Cruz',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'8:05 AM',  lunchOut:'12:05 PM', lunchIn:'1:06 PM',  shiftOut:'5:12 PM',  status:'Present' },
  { id:'EMP-008', name:'Carlo Reyes',     department:'IT',         timeframe:'May 15, 2025 · Morning', shiftIn:'9:15 AM',  lunchOut:'12:30 PM', lunchIn:'1:30 PM',  shiftOut:'6:15 PM',  status:'Late'    },
  { id:'EMP-009', name:'Dina Villanueva', department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:'7:55 AM',  lunchOut:'11:55 AM', lunchIn:'12:55 PM', shiftOut:'4:55 PM',  status:'Present' },
  { id:'EMP-010', name:'Paolo Bautista',  department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'  },
]

// ── MOCK STATS ───────────────────────────────────────────────
// TODO: compute dynamically from attendance table query
export const MOCK_STATS = { present: 131, late: 9, absent: 5, onLeave: 3 }

// ── DEPARTMENTS ──────────────────────────────────────────────
// TODO: fetch from Employees table → SELECT DISTINCT department
export const DEPARTMENTS = [
  'All Departments','Sales','HR','Accounting','Admin','Intern','Warehouse'
]

// ── MONTHS ───────────────────────────────────────────────────
export const MONTHS = [
  'January 2025','February 2025','March 2025','April 2025','May 2025'
]

// ── STATUS STYLES ────────────────────────────────────────────
// Used by BiometricTable badges. Add new statuses here only.
export const STATUS_STYLES = {
  Present : { color:'#16a34a', bg:'#dcfce7', border:'#bbf7d0' },
  Late    : { color:'#ea580c', bg:'#ffedd5', border:'#fed7aa' },
  Absent  : { color:'#dc2626', bg:'#fee2e2', border:'#fecaca' },
  Leave   : { color:'#2563eb', bg:'#dbeafe', border:'#bfdbfe' },
}

// ── XLSX STATUS COLORS ───────────────────────────────────────
// ExcelJS uses ARGB hex (FF = fully opaque). Used in exportToXLSX.
export const STATUS_XLSX = {
  Present : { fill: 'FFDCFCE7', font: 'FF166534' },
  Late    : { fill: 'FFFFEDD5', font: 'FFEA580C' },
  Absent  : { fill: 'FFFEE2E2', font: 'FFDC2626' },
  Leave   : { fill: 'FFDBEAFE', font: 'FF1D4ED8' },
}