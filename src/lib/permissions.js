// src/lib/permissions.js

// 'reports' is included for every role —
// staff use it to submit reports, HR gets notified
// 'settings' is included for every role —
// all employees can access their personal settings
export const MODULE_ACCESS = {
  admin: [
    'dashboard', 'employees', 'biometrics',
    'clinic', 'products', 'outlets',
    'calculations', 'reports', 'settings', 'leaves'
  ],
  hr: [
    'dashboard', 'employees', 'biometrics', 'reports', 'leaves', 'settings'
  ],
  clinic: [
    'dashboard', 'clinic', 'reports', 'leaves', 'settings'
  ],
  inventory: [
    'dashboard', 'products', 'calculations', 'reports', 'leaves', 'settings'
  ],
  outlets: [
    'dashboard', 'outlets', 'reports', 'leaves', 'settings'
  ],
}

export const canAccess = (role, module) => {
  return MODULE_ACCESS[role]?.includes(module) ?? false
}