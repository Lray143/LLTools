const { ipcRenderer } = require('electron')

window.electronAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  // ── Auth ────────────────────────────────────────────────────────
  login:                   (creds)              => ipcRenderer.invoke('auth:login', creds),
  refreshUser:             (id)                 => ipcRenderer.invoke('auth:refresh', id),
  wipeAllData:             ()                   => ipcRenderer.invoke('db:wipeAll'),

  // ── App Links ───────────────────────────────────────────────────
  getAppLinks:             ()                   => ipcRenderer.invoke('appLinks:getAll'),
  getAppLink:              (key)                => ipcRenderer.invoke('appLinks:get', key),
  upsertAppLink:           (link)               => ipcRenderer.invoke('appLinks:upsert', link),

  getSystemUsage: () => ipcRenderer.invoke('getSystemUsage'),

  // ── Module Activity Logs ──────────────────────────────────────────
  addModuleActivityLog:    (entry)              => ipcRenderer.invoke('activityLog:add', entry),
  getModuleActivityLogs:   (module, limit)      => ipcRenderer.invoke('activityLog:get', module, limit),

  // ── Employees ───────────────────────────────────────────────────
  getEmployees:            ()        => ipcRenderer.invoke('employees:getAll'),
  getArchivedEmployees:    ()        => ipcRenderer.invoke('employees:getArchived'),
  upsertEmployee:          (emp)     => ipcRenderer.invoke('employees:upsert', emp),
  archiveEmployee:         (id)      => ipcRenderer.invoke('employees:archive', id),
  unarchiveEmployee:       (id)      => ipcRenderer.invoke('employees:unarchive', id),
  permanentDeleteEmployee: (id)      => ipcRenderer.invoke('employees:permDelete', id),
  resetEmployeeCredentials:(id)      => ipcRenderer.invoke('employees:resetCredentials', id),

  // ── Attendance ──────────────────────────────────────────────────
  getAttendance:           ()        => ipcRenderer.invoke('attendance:getAll'),
  getAttendanceByDate:     (date)    => ipcRenderer.invoke('attendance:getByDate', date),
  getMyAttendance:         (employeeId) => ipcRenderer.invoke('attendance:getMine', employeeId),
  importAttendance:        (recs)    => ipcRenderer.invoke('attendance:import', recs),
  importAttendanceRawText: (text)    => ipcRenderer.invoke('attendance:importRawText', text),

  // ── Reports ─────────────────────────────────────────────────────
  getReports:              ()         => ipcRenderer.invoke('reports:getAll'),
  createReport:            (r)        => ipcRenderer.invoke('reports:create', r),
  updateReport:            (r)        => ipcRenderer.invoke('reports:update', r),
  deleteReport:            (id)       => ipcRenderer.invoke('reports:delete', id),
  getReportComments:       (id)       => ipcRenderer.invoke('reports:getComments', id),
  addReportComment:        (id, user_id, username, text) => ipcRenderer.invoke('reports:addComment', id, user_id, username, text),
  getReportStatusLogs:     (id)       => ipcRenderer.invoke('reports:getStatusLogs', id),
  archiveReport:           (id)       => ipcRenderer.invoke('reports:archive', id),
  unarchiveReport:         (id)       => ipcRenderer.invoke('reports:unarchive', id),
  permanentDeleteReport:   (id)       => ipcRenderer.invoke('reports:permanentDelete', id),

  // ── Chat ────────────────────────────────────────────────────────
  getChatMessages: (dept) => ipcRenderer.invoke('chat:getMessages', dept),
  sendChatMessage: (msg) => ipcRenderer.invoke('chat:sendMessage', msg),
  getDirectMessages: (roomId) => ipcRenderer.invoke('chat:getDMs', roomId),
  sendDirectMessage: (msg) => ipcRenderer.invoke('chat:sendDM', msg),
  sendPusherEvent: (payload) => ipcRenderer.invoke('chat:sendPusherEvent', payload),
  forceSync: () => ipcRenderer.invoke('system:forceSync'),
  markChatAsRead: (userId, roomId) => ipcRenderer.invoke('chat:markAsRead', userId, roomId),
  getChatSidebarData: (userId) => ipcRenderer.invoke('chat:getSidebarData', userId),
  getRoomReceipts: (roomId) => ipcRenderer.invoke('chat:getRoomReceipts', roomId),
  uploadAttachment:        (buffer, name, type, id, msgType) => ipcRenderer.invoke('chat:uploadAttachment', buffer, name, type, id, msgType),
  openAttachment:          (filePath)           => ipcRenderer.invoke('chat:openAttachment', filePath),
  openR2File:              (fileName)           => ipcRenderer.invoke('chat:openR2File', fileName),
  toggleReaction:   (msgId, userId, userName, emoji, isDm) => ipcRenderer.invoke('chat:toggleReaction', msgId, userId, userName, emoji, isDm),
  editMessage:      (msgId, userId, newText, isDm) => ipcRenderer.invoke('chat:editMessage', msgId, userId, newText, isDm),
  unsendMessage:    (msgId, userId, isDm) => ipcRenderer.invoke('chat:unsendMessage', msgId, userId, isDm),
  deleteForMe:      (msgId, userId, isDm) => ipcRenderer.invoke('chat:deleteForMe', msgId, userId, isDm),

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
  updateUserCredentials:   (id, username, oldPassword, newPassword) => ipcRenderer.invoke('users:updateCredentials', id, username, oldPassword, newPassword),
  updateUserTheme:         (id, color, mode)    => ipcRenderer.invoke('users:updateTheme', id, color, mode),
  heartbeatUser:           (id)                 => ipcRenderer.invoke('users:heartbeat', id),
  logoutUser:              (id)                 => ipcRenderer.invoke('users:logout', id),

  // ── Saved Orders ─────────────────────────────────────────────────
  saveOrder:               (order)    => ipcRenderer.invoke('orders:save', order),
  getOrdersByOutlet:       (outletId) => ipcRenderer.invoke('orders:getByOutlet', outletId),
  getOrdersByDefault:      ()         => ipcRenderer.invoke('orders:getByDefault'),
  getAllOrders:             ()         => ipcRenderer.invoke('orders:getAll'),
  deleteOrder:             (id)       => ipcRenderer.invoke('orders:delete', id),
  updateOrderDate:         (id, date) => ipcRenderer.invoke('orders:updateDate', id, date),

  // ── Leave Requests ───────────────────────────────────────────────
  submitLeaveRequest:      (req)                   => ipcRenderer.invoke('leaves:submit', req),
  getLeaveRequests:        ()                       => ipcRenderer.invoke('leaves:getAll'),
  getMyLeaveRequests:      (employeeId)             => ipcRenderer.invoke('leaves:getMine', employeeId),
  reviewLeaveRequest:      (id, status, note)       => ipcRenderer.invoke('leaves:review', id, status, note),

  // ── Reports ────────────────────────────────────────────────────
  createReport:          (report)                       => ipcRenderer.invoke('reports:create', report),
  updateReport:          (report)                       => ipcRenderer.invoke('reports:update', report),
  getReports:            (archived)                     => ipcRenderer.invoke('reports:getAll', archived),
  getMyReports:          (employeeNo, archived)         => ipcRenderer.invoke('reports:getMine', employeeNo, archived),
  getReportById:         (id)                           => ipcRenderer.invoke('reports:getById', id),
  updateReportStatus:    (id, status, changedBy)        => ipcRenderer.invoke('reports:updateStatus', id, status, changedBy),
  assignReport:          (id, assignedTo, changedBy)    => ipcRenderer.invoke('reports:assign', id, assignedTo, changedBy),
  addReportComment:      (comment)                      => ipcRenderer.invoke('reports:addComment', comment),
  getReportComments:     (reportId)                     => ipcRenderer.invoke('reports:getComments', reportId),
  getReportStatusLogs:   (reportId)                     => ipcRenderer.invoke('reports:getStatusLogs', reportId),
  archiveReport:         (id)                           => ipcRenderer.invoke('reports:archive', id),
  unarchiveReport:       (id)                           => ipcRenderer.invoke('reports:unarchive', id),
  permanentDeleteReport: (id)                           => ipcRenderer.invoke('reports:permanentDelete', id),

  // ── Attachments ─────────────────────────────────────────────────
  saveAttachment:          (data)     => ipcRenderer.invoke('attachments:save', data),
  openAttachment:          (path)     => ipcRenderer.invoke('attachments:open', path),
  submitLeaveRequest:      (req)                   => ipcRenderer.invoke('leaves:submit', req),
  getLeaveRequests:        ()                      => ipcRenderer.invoke('leaves:getAll'),
  getMyLeaveRequests:      (employeeNo)            => ipcRenderer.invoke('leaves:getMine', employeeNo),
  reviewLeaveRequest:      (id, status, note, reviewedBy) => ipcRenderer.invoke('leaves:review', id, status, note, reviewedBy),

  // ── Announcements ─────────────────────────────────────────────────
  getAnnouncements:        (empId, incArch) => ipcRenderer.invoke('announcements:getAll', empId, incArch),
  getArchivedAnnouncements:(empId)          => ipcRenderer.invoke('announcements:getArchived', empId),
  getHistory:              (empId)          => ipcRenderer.invoke('announcements:getHistory', empId),
  upsertAnnouncement:      (ann)            => ipcRenderer.invoke('announcements:upsert', ann),
  archiveAnnouncement:     (id)             => ipcRenderer.invoke('announcements:archive', id),
  permDeleteAnnouncement:  (id)             => ipcRenderer.invoke('announcements:permDelete', id),
  acknowledgeAnnouncement: (annId, empId, empName) => ipcRenderer.invoke('announcements:acknowledge', annId, empId, empName),
  getAnnouncementAcks:     (annId)          => ipcRenderer.invoke('announcements:getAcks', annId),
  markAnnouncementRead:    (annId, empId, empName) => ipcRenderer.invoke('announcements:markRead', annId, empId, empName),
  getAnnouncementReads:    (annId)          => ipcRenderer.invoke('announcements:getReads', annId),
  getAnnouncementComments: (annId)          => ipcRenderer.invoke('announcements:getComments', annId),
  addAnnouncementComment:  (annId, empId, empName, content, parentId) => ipcRenderer.invoke('announcements:addComment', annId, empId, empName, content, parentId),
  reactAnnouncementComment:(commentId, empId, empName, reaction) => ipcRenderer.invoke('announcements:reactComment', commentId, empId, empName, reaction),

  // ── Cloud Sync Events ───────────────────────────────────────────
  // Called every 10 seconds after a cloud sync completes.
  // Returns a cleanup function — call it when the component unmounts.
  onDbSynced: (callback) => {
    ipcRenderer.on('db:synced', callback)
    return () => ipcRenderer.removeListener('db:synced', callback)
  },

  // ── Auto Updater ────────────────────────────────────────────────
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onChecking: (cb) => {
      const listener = () => cb();
      ipcRenderer.on('updater:checking', listener);
      return () => ipcRenderer.removeListener('updater:checking', listener);
    },
    onUpdateAvailable: (cb) => {
      const listener = (_, info) => cb(info);
      ipcRenderer.on('updater:update-available', listener);
      return () => ipcRenderer.removeListener('updater:update-available', listener);
    },
    onUpdateNotAvailable: (cb) => {
      const listener = (_, info) => cb(info);
      ipcRenderer.on('updater:update-not-available', listener);
      return () => ipcRenderer.removeListener('updater:update-not-available', listener);
    },
    onDownloadProgress: (cb) => {
      const listener = (_, progressObj) => cb(progressObj);
      ipcRenderer.on('updater:download-progress', listener);
      return () => ipcRenderer.removeListener('updater:download-progress', listener);
    },
    onUpdateDownloaded: (cb) => {
      const listener = (_, info) => cb(info);
      ipcRenderer.on('updater:update-downloaded', listener);
      return () => ipcRenderer.removeListener('updater:update-downloaded', listener);
    },
    onError: (cb) => {
      const listener = (_, err) => cb(err);
      ipcRenderer.on('updater:error', listener);
      return () => ipcRenderer.removeListener('updater:error', listener);
    }
  }
}
