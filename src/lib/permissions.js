// src/lib/permissions.js

// 'reports' is included for every role —
// staff use it to submit reports, HR gets notified
export const MODULE_ACCESS = {
  admin: [
    'dashboard', 'employees', 'biometrics',
    'clinic', 'products', 'outlets',
    'calculations', 'reports', 'settings', 'leaves'
  ],
  hr: [
    'dashboard', 'employees', 'biometrics', 'reports', 'leaves'
  ],
  clinic: [
    'dashboard', 'clinic', 'reports', 'leaves'
  ],
  inventory: [
    'dashboard', 'products', 'calculations', 'reports', 'leaves'
  ],
  outlets: [
    'dashboard', 'outlets', 'reports', 'leaves'
  ],
}

export const canAccess = (role, module) => {
  return MODULE_ACCESS[role]?.includes(module) ?? false
}