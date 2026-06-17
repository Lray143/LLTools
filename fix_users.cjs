const path = require('path');
const app = {
  getPath: () => 'C:/Users/Lray/AppData/Roaming/lltools'
};
// Mock electron
const m = require('module');
const originalRequire = m.prototype.require;
m.prototype.require = function (name) {
  if (name === 'electron') return { app };
  return originalRequire.apply(this, arguments);
};

const bcrypt = require('bcrypt');
const { queryAll, queryOne, run, syncCloud } = require('./db.cjs');

const DEPT_ROLE_MAP = {
  'Management': 'management',
  'HR': 'hr',
  'Warehouse': 'warehouse_manager',
  'Cashier': 'cashier'
};

function deptToRole(dept) {
  if (!dept || dept.trim() === '') return 'employee';
  return DEPT_ROLE_MAP[dept] ?? 'employee';
}

const createEmployeeAccount = async (employeeId, employeeNo, dept) => {
  const strNo = String(employeeNo);
  const role = deptToRole(dept);
  const existing = await queryOne('SELECT id, role FROM users WHERE employee_id = ?', [employeeId]);
  
  if (existing) {
    const hasDept = dept && dept.trim() !== '';
    if (hasDept) {
      await run(
        `UPDATE users SET username = ?, role = ?, sync_status = 'pending' WHERE employee_id = ?`,
        [strNo, role, employeeId]
      );
    } else {
      await run(
        `UPDATE users SET username = ?, sync_status = 'pending' WHERE employee_id = ?`,
        [strNo, employeeId]
      );
    }
  } else {
    const hash = await bcrypt.hash(strNo, 10);
    await run(
      `INSERT OR IGNORE INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)`,
      [strNo, hash, role, employeeId]
    );
  }
};

(async () => {
  const emps = await queryAll('SELECT id, employee_no, department FROM employees');
  let count = 0;
  for (const emp of emps) {
    const user = await queryOne('SELECT id FROM users WHERE employee_id = ?', [emp.id]);
    if (!user) {
      await createEmployeeAccount(emp.id, String(emp.employee_no), emp.department ?? '');
      console.log('Created user for ' + emp.employee_no);
      count++;
    }
  }
  await syncCloud(); // ensure changes are sent to cloud
  console.log('Finished creating ' + count + ' missing users.');
  process.exit(0);
})();
