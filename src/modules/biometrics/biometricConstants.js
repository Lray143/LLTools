export const MOCK_RECORDS = [
  { id:'EMP-001', name:'Ana Santos',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'6:58 AM',  lunchOut:'12:01 PM', lunchIn:'12:45 PM', shiftOut:'5:08 PM',  status:'Full Time'      },
  { id:'EMP-002', name:'Rico Dela Cruz',  department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'7:47 AM',  lunchOut:'12:10 PM', lunchIn:'1:12 PM',  shiftOut:'5:30 PM',  status:'Late'           },
  { id:'EMP-003', name:'Gina Flores',     department:'Marketing',  timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'         },
  { id:'EMP-004', name:'Ben Castillo',    department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:'6:55 AM',  lunchOut:'12:00 PM', lunchIn:'1:00 PM',  shiftOut:'3:30 PM',  status:'Undertime'      },
  { id:'EMP-005', name:'Lita Mendoza',    department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Leave'          },
  { id:'EMP-006', name:'Jun Ramos',       department:'Production', timeframe:'May 15, 2025 · Morning', shiftIn:'6:50 AM',  lunchOut:'12:00 PM', lunchIn:'12:40 PM', shiftOut:'5:00 PM',  status:'Full Time'      },
  { id:'EMP-007', name:'Maria Cruz',      department:'Sales',      timeframe:'May 15, 2025 · Morning', shiftIn:'7:30 AM',  lunchOut:'12:05 PM', lunchIn:'1:06 PM',  shiftOut:'4:00 PM',  status:'Late & Undertime'},
  { id:'EMP-008', name:'Carlo Reyes',     department:'IT',         timeframe:'May 15, 2025 · Morning', shiftIn:'6:45 AM',  lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Incomplete'     },
  { id:'EMP-009', name:'Dina Villanueva', department:'HR',         timeframe:'May 15, 2025 · Morning', shiftIn:'6:55 AM',  lunchOut:'11:55 AM', lunchIn:'12:35 PM', shiftOut:'5:10 PM',  status:'Full Time'      },
  { id:'EMP-010', name:'Paolo Bautista',  department:'Finance',    timeframe:'May 15, 2025 · Morning', shiftIn:null,       lunchOut:null,       lunchIn:null,       shiftOut:null,       status:'Absent'         },
]

export const MOCK_STATS = {
  fullTime       : 3,
  late           : 1,
  undertime      : 1,
  lateUndertime  : 1,
  incomplete     : 1,
  absent         : 2,
  onLeave        : 1,
}

export const DEPARTMENTS = [
  'All Departments','Sales','HR','Accounting','Admin','Warehouse'
]

export const MONTHS = [
  'January 2025','February 2025','March 2025','April 2025','May 2025'
]

// ── STATUS STYLES ────────────────────────────────────────────
export const STATUS_STYLES = {
  'Full Time'      : { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  'Late'           : { color: 'var(--theme-600)', bg: 'var(--theme-100)', border: 'var(--theme-200)' },
  'Undertime'      : { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  'Late & Undertime': { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  'Incomplete'     : { color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  'One Tap Only'   : { color: '#c026d3', bg: '#fae8ff', border: '#f5d0fe' },
  'Absent'         : { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  'Leave'          : { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
  'Worked on Day Off': { color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
}

// ── XLSX STATUS COLORS ───────────────────────────────────────
export const STATUS_XLSX = {
  'Full Time'       : { fill: 'FFDCFCE7', font: 'FF166534' },
  'Late'            : { fill: 'FFFFEDD5', font: 'FFEA580C' },
  'Undertime'       : { fill: 'FFFEF3C7', font: 'FFD97706' },
  'Late & Undertime': { fill: 'FFFEE2E2', font: 'FFDC2626' },
  'Incomplete'      : { fill: 'FFEDE9FE', font: 'FF7C3AED' },
  'One Tap Only'    : { fill: 'FFFAE8FF', font: 'FFC026D3' },
  'Absent'          : { fill: 'FFFEE2E2', font: 'FFDC2626' },
  'Leave'           : { fill: 'FFDBEAFE', font: 'FF1D4ED8' },
  'Worked on Day Off': { fill: 'FFE0F2FE', font: 'FF0284C7' },
}