const { ipcRenderer } = require('electron')

window.electronAPI = {
  // ── Auth ────────────────────────────────────────────────────────
  login:                   (creds)   => ipcRenderer.invoke('auth:login', creds),

  // ── Employees ───────────────────────────────────────────────────
  getEmployees:            ()        => ipcRenderer.invoke('employees:getAll'),
  getArchivedEmployees:    ()        => ipcRenderer.invoke('employees:getArchived'),
  upsertEmployee:          (emp)     => ipcRenderer.invoke('employees:upsert', emp),
  archiveEmployee:         (id)      => ipcRenderer.invoke('employees:archive', id),
  unarchiveEmployee:       (id)      => ipcRenderer.invoke('employees:unarchive', id),
  permanentDeleteEmployee: (id)      => ipcRenderer.invoke('employees:permDelete', id),

  // ── Attendance ──────────────────────────────────────────────────
  getAttendance:           ()        => ipcRenderer.invoke('attendance:getAll'),
  getAttendanceByDate:     (date)    => ipcRenderer.invoke('attendance:getByDate', date),
  importAttendance:        (recs)    => ipcRenderer.invoke('attendance:import', recs),

  // ── Products ────────────────────────────────────────────────────
  getProductGroups:        ()        => ipcRenderer.invoke('products:getAll'),
  getArchivedProducts:     ()        => ipcRenderer.invoke('products:getArchived'),
  upsertProductGroup:      (group)   => ipcRenderer.invoke('products:upsertGroup', group),
  deleteProductGroup:      (id)      => ipcRenderer.invoke('products:deleteGroup', id),
  upsertProduct:           (product) => ipcRenderer.invoke('products:upsertProduct', product),
  archiveProduct:          (id)      => ipcRenderer.invoke('products:archive', id),
  restoreProduct:          (id)      => ipcRenderer.invoke('products:restore', id),
  permanentDeleteProduct:  (id)      => ipcRenderer.invoke('products:permDelete', id),
}