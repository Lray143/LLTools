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

  // ── Outlets ─────────────────────────────────────────────────────
  getOutlets:              ()        => ipcRenderer.invoke('outlets:getAll'),
  getArchivedOutlets:      ()        => ipcRenderer.invoke('outlets:getArchived'),
  upsertOutlet:            (outlet)  => ipcRenderer.invoke('outlets:upsert', outlet),
  archiveOutlet:           (id)      => ipcRenderer.invoke('outlets:archive', id),
  unarchiveOutlet:         (id)      => ipcRenderer.invoke('outlets:unarchive', id),
  permanentDeleteOutlet:   (id)      => ipcRenderer.invoke('outlets:permDelete', id),

  // ── Outlet Product Prices ──────────────────────────────────────
  getOutletProductPrices:    (outletId)                    => ipcRenderer.invoke('outletPrices:get', outletId),
  upsertOutletProductPrice:  (outletId, productId, price)  => ipcRenderer.invoke('outletPrices:upsert', outletId, productId, price),
  deleteOutletProductPrice:  (outletId, productId)         => ipcRenderer.invoke('outletPrices:delete', outletId, productId),

  // ── Clinic Logs ─────────────────────────────────────────────────
  getClinicLogs:           ()        => ipcRenderer.invoke('clinic:getAll'),
  getArchivedClinicLogs:   ()        => ipcRenderer.invoke('clinic:getArchived'),
  upsertClinicLog:         (log)     => ipcRenderer.invoke('clinic:upsert', log),
  archiveClinicLog:        (id)      => ipcRenderer.invoke('clinic:archive', id),
  unarchiveClinicLog:      (id)      => ipcRenderer.invoke('clinic:unarchive', id),
  permanentDeleteClinicLog:(id)      => ipcRenderer.invoke('clinic:permDelete', id),

  // ── User Management (admin) ─────────────────────────────────────
  getUsers:                ()                   => ipcRenderer.invoke('users:getAll'),
  updateUserRole:          (id, role)           => ipcRenderer.invoke('users:updateRole', id, role),
  resetUserPassword:       (id, newPassword)    => ipcRenderer.invoke('users:resetPassword', id, newPassword),
  deleteUserAccount:       (id)                 => ipcRenderer.invoke('users:delete', id),

  // ── Saved Orders ─────────────────────────────────────────────────
  saveOrder:               (order)    => ipcRenderer.invoke('orders:save', order),
  getOrdersByOutlet:       (outletId) => ipcRenderer.invoke('orders:getByOutlet', outletId),
  getOrdersByDefault:      ()         => ipcRenderer.invoke('orders:getByDefault'),
  getAllOrders:             ()         => ipcRenderer.invoke('orders:getAll'),
  deleteOrder:             (id)       => ipcRenderer.invoke('orders:delete', id),

  // ── Attachments ─────────────────────────────────────────────────
  saveAttachment:          (data)     => ipcRenderer.invoke('attachments:save', data),
  openAttachment:          (path)     => ipcRenderer.invoke('attachments:open', path),
}
