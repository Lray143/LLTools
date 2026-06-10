// src/lib/permissions.js
// ─────────────────────────────────────────────────────────────
// DEPARTMENT-BASED ACCESS CONTROL
//
// Each department maps directly to the modules it can access.
// To change a department's access, just edit its array below.
//
// Available modules:
//   'dashboard', 'employees', 'biometrics', 'clinic',
//   'products', 'outlets', 'calculations', 'reports',
//   'leaves', 'settings'
//
// Note: 'biometrics', 'reports', 'leaves', and 'settings' are
// included for every department:
//   - biometrics: all employees can view their own attendance
//   - reports/leaves/settings: standard self-service access
// ─────────────────────────────────────────────────────────────

export const DEPT_MODULES = {
  'HR': [
    'dashboard', 'employees', 'biometrics', 'my-attendance',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Admin': [
    'dashboard', 'employees', 'biometrics', 'my-attendance', 'clinic',
    'products', 'outlets', 'calculations',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Accounting': [
    'dashboard', 'my-attendance', 'calculations',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Finance': [
    'dashboard', 'my-attendance', 'calculations', 'products',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Sales': [
    'dashboard', 'my-attendance', 'outlets',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Marketing': [
    'dashboard', 'my-attendance', 'outlets',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Warehouse': [
    'dashboard', 'my-attendance', 'products',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Production': [
    'dashboard', 'my-attendance', 'products', 'calculations',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'IT': [
    'dashboard', 'my-attendance',
    'reports', 'leaves', 'chat', 'settings',
  ],
  'Intern': [
    'dashboard', 'my-attendance', 'reports', 'leaves', 'chat', 'settings',
  ],
}

// ─────────────────────────────────────────────────────────────
// ROLE-BASED FALLBACK
// Only used for seeded system accounts (admin@doublel.com, etc.)
// that are not linked to an employee and have no department.
// Employee accounts always use DEPT_MODULES above.
// ─────────────────────────────────────────────────────────────
const ROLE_MODULES = {
  admin: [
    'dashboard', 'employees', 'biometrics', 'my-attendance', 'clinic',
    'products', 'outlets', 'calculations',
    'reports', 'leaves', 'chat', 'settings',
  ],
  hr: [
    'dashboard', 'employees', 'biometrics', 'my-attendance',
    'reports', 'leaves', 'chat', 'settings',
  ],
  clinic: [
    'dashboard', 'my-attendance', 'clinic', 'reports', 'leaves', 'chat', 'settings',
  ],
  inventory: [
    'dashboard', 'my-attendance', 'products', 'calculations',
    'reports', 'leaves', 'chat', 'settings',
  ],
  outlets: [
    'dashboard', 'my-attendance', 'outlets', 'reports', 'leaves', 'chat', 'settings',
  ],
}

// Pass the full currentUser object.
// If the user has a department, DEPT_MODULES is used.
// Seeded system accounts without a department fall back to ROLE_MODULES.
export const getAllowedModules = (user) => {
  if (user?.department && DEPT_MODULES[user.department]) {
    return DEPT_MODULES[user.department]
  }
  return ROLE_MODULES[user?.role] ?? []
}

export const canAccess = (user, module) => {
  return getAllowedModules(user).includes(module)
}