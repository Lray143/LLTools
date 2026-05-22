// src/lib/permissions.js

// 'reports' is included for every role —
// staff use it to submit reports, HR gets notified
export const MODULE_ACCESS = {
  admin: [
    'dashboard', 'employees', 'biometrics',
    'clinic', 'products', 'outlets',
    'calculations', 'reports', 'settings'
  ],
  hr: [
    'dashboard', 'employees', 'biometrics', 'reports'
  ],
  clinic: [
    'dashboard', 'clinic', 'reports'
  ],
  inventory: [
    'dashboard', 'products', 'calculations', 'reports'
  ],
  outlets: [
    'dashboard', 'outlets', 'reports'
  ],
}

export const canAccess = (role, module) => {
  return MODULE_ACCESS[role]?.includes(module) ?? false
}