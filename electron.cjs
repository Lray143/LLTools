const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { autoUpdater } = require('electron-updater')
const { uploadFileToR2 } = require('./r2.cjs')
const fs = require('fs')
const crypto = require('crypto')
const {
  initDb, loginUser, syncCloud,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, getMyAttendance, importAttendance,
  getProductGroups, getArchivedProducts,
  upsertProductGroup, deleteProductGroup,
  upsertProduct, archiveProduct, restoreProduct, permanentDeleteProduct,
  getOutlets, getArchivedOutlets,
  upsertOutlet, archiveOutlet, unarchiveOutlet, permanentDeleteOutlet,
  getOutletProductPrices, upsertOutletProductPrice, deleteOutletProductPrice,
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
  getUsers, updateUserRole, resetUserPassword, deleteUserAccount, updateUserTheme,
  saveOrder, getOrdersByOutlet, getOrdersByDefault, getAllOrders, deleteOrder, updateOrderDate,
  submitLeaveRequest, getLeaveRequests, getMyLeaveRequests, reviewLeaveRequest,
  createReport, getReports, getMyReports, getReportById,
  updateReportStatus, assignReport, addReportComment,
  getReportComments, getReportStatusLogs,
  updateReport, archiveReport, unarchiveReport, permanentDeleteReport,
  getDepartmentChats, sendDepartmentChat, getDirectMessages, sendDirectMessage,
  updateChatFileUrl, updateDmFileUrl,
  markChatAsRead, getChatSidebarData, getRoomReceipts,
  refreshUser, heartbeatUser,
} = require('./db.cjs')

const isDev = process.env.NODE_ENV === 'development'
let mainWindow = null

// MUST be called before app is ready — tells Electron to treat attachment://
// as a secure, standard scheme (same trust level as https://)
protocol.registerSchemesAsPrivileged([{
  scheme: 'attachment',
  privileges: { secure: true, standard: true, stream: true, supportFetchAPI: true }
}])

ipcMain.handle('app:getVersion', () => app.getVersion())

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'public/Logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'),
    }
  })
  mainWindow.removeMenu()
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

// ── AUTH ──────────────────────────────────────────────────────────
ipcMain.handle('auth:login', (_, creds) => loginUser(creds.username, creds.password))
ipcMain.handle('auth:refresh', async (_, id) => {
  const db = await import('./db.cjs')
  return await db.refreshUser(id)
})

// ── EMPLOYEES ─────────────────────────────────────────────────────
ipcMain.handle('employees:getAll',      ()       => getEmployees())
ipcMain.handle('employees:getArchived', ()       => getArchivedEmployees())
ipcMain.handle('employees:upsert',      (_, emp) => upsertEmployee(emp))
ipcMain.handle('employees:archive',     (_, id)  => archiveEmployee(id))
ipcMain.handle('employees:unarchive',   (_, id)  => unarchiveEmployee(id))
ipcMain.handle('employees:permDelete',  (_, id)  => permanentDeleteEmployee(id))

// ── ATTENDANCE ────────────────────────────────────────────────────
ipcMain.handle('attendance:getAll',    ()           => getAttendance())
ipcMain.handle('attendance:getByDate', (_, date)    => getAttendanceByDate(date))
ipcMain.handle('attendance:getMine',   (_, empId)   => getMyAttendance(empId))
ipcMain.handle('attendance:import',    (_, records) => importAttendance(records))

// ── PRODUCTS ──────────────────────────────────────────────────────
ipcMain.handle('products:getAll',        ()           => getProductGroups())
ipcMain.handle('products:getArchived',   ()           => getArchivedProducts())
ipcMain.handle('products:upsertGroup',   (_, group)   => upsertProductGroup(group))
ipcMain.handle('products:deleteGroup',   (_, id)      => deleteProductGroup(id))
ipcMain.handle('products:upsertProduct', (_, product) => upsertProduct(product))
ipcMain.handle('products:archive',       (_, id)      => archiveProduct(id))
ipcMain.handle('products:restore',       (_, id)      => restoreProduct(id))
ipcMain.handle('products:permDelete',    (_, id)      => permanentDeleteProduct(id))

// ── OUTLETS ───────────────────────────────────────────────────────
ipcMain.handle('outlets:getAll',      ()          => getOutlets())
ipcMain.handle('outlets:getArchived', ()          => getArchivedOutlets())
ipcMain.handle('outlets:upsert',      (_, outlet) => upsertOutlet(outlet))
ipcMain.handle('outlets:archive',     (_, id)     => archiveOutlet(id))
ipcMain.handle('outlets:unarchive',   (_, id)     => unarchiveOutlet(id))
ipcMain.handle('outlets:permDelete',  (_, id)     => permanentDeleteOutlet(id))

// ── OUTLET PRODUCT PRICES ────────────────────────────────────────
ipcMain.handle('outletPrices:get',    (_, outletId)              => getOutletProductPrices(outletId))
ipcMain.handle('outletPrices:upsert', (_, outletId, productId, price) => upsertOutletProductPrice(outletId, productId, price))
ipcMain.handle('outletPrices:delete', (_, outletId, productId)   => deleteOutletProductPrice(outletId, productId))

// ── CLINIC LOGS ───────────────────────────────────────────────────
ipcMain.handle('clinic:getAll',       ()        => getClinicLogs())
ipcMain.handle('clinic:getArchived',  ()        => getArchivedClinicLogs())
ipcMain.handle('clinic:upsert',       (_, log)  => upsertClinicLog(log))
ipcMain.handle('clinic:archive',      (_, id)   => archiveClinicLog(id))
ipcMain.handle('clinic:unarchive',    (_, id)   => unarchiveClinicLog(id))
ipcMain.handle('clinic:permDelete',   (_, id)   => permanentDeleteClinicLog(id))

// ── USER MANAGEMENT ───────────────────────────────────────────────
ipcMain.handle('users:getAll',         ()                    => getUsers())
ipcMain.handle('users:updateRole',     (_, id, role)         => updateUserRole(id, role))
ipcMain.handle('users:resetPassword',  (_, id, newPassword)  => resetUserPassword(id, newPassword))
ipcMain.handle('users:delete',         (_, id)               => deleteUserAccount(id))
ipcMain.handle('users:updateTheme',    (_, id, color, mode)  => updateUserTheme(id, color, mode))
ipcMain.handle('users:heartbeat',      (_, id)               => heartbeatUser(id))

// ── SAVED ORDERS ──────────────────────────────────────────────────
ipcMain.handle('orders:save',          (_, order)    => saveOrder(order))
ipcMain.handle('orders:getByOutlet',   (_, outletId) => getOrdersByOutlet(outletId))
ipcMain.handle('orders:getByDefault',  ()            => getOrdersByDefault())
ipcMain.handle('orders:getAll',        ()            => getAllOrders())
ipcMain.handle('orders:delete',        (_, id)       => deleteOrder(id))
ipcMain.handle('orders:updateDate',    (_, id, date) => updateOrderDate(id, date))

// ── LEAVE REQUESTS ────────────────────────────────────────────────
ipcMain.handle('leaves:submit',  (_, req)              => submitLeaveRequest(req))
ipcMain.handle('leaves:getAll',  ()                    => getLeaveRequests())
ipcMain.handle('leaves:getMine', (_, employeeId)       => getMyLeaveRequests(employeeId))
ipcMain.handle('leaves:review',  (_, id, status, note, reviewedBy) => reviewLeaveRequest(id, status, note, reviewedBy))

// ── REPORTS ───────────────────────────────────────────────────────
ipcMain.handle('reports:create',        (_, report)                    => createReport(report))
ipcMain.handle('reports:update',        (_, report)                    => updateReport(report))
ipcMain.handle('reports:getAll',        (_, archived)                  => getReports(archived))
ipcMain.handle('reports:getMine',       (_, employeeNo, archived)      => getMyReports(employeeNo, archived))
ipcMain.handle('reports:getById',       (_, id)                        => getReportById(id))
ipcMain.handle('reports:updateStatus',  (_, id, status, changedBy)     => updateReportStatus(id, status, changedBy))
ipcMain.handle('reports:assign',        (_, id, assignedTo, changedBy) => assignReport(id, assignedTo, changedBy))
ipcMain.handle('reports:addComment',    (_, comment)                   => addReportComment(comment))
ipcMain.handle('reports:getComments',   (_, reportId)                  => getReportComments(reportId))
ipcMain.handle('reports:getStatusLogs', (_, reportId)                  => getReportStatusLogs(reportId))
ipcMain.handle('reports:archive',       (_, id)                        => archiveReport(id))
ipcMain.handle('reports:unarchive',     (_, id)                        => unarchiveReport(id))
ipcMain.handle('reports:permanentDelete', (_, id)                      => permanentDeleteReport(id))

// ── CHATS ─────────────────────────────────────────────────────────
ipcMain.handle('chat:getMessages', async (_, dept) => {
  const db = await import('./db.cjs')
  return await db.getDepartmentChats(dept)
})
ipcMain.handle('chat:sendMessage', async (_, msgData) => {
  const db = await import('./db.cjs')
  await db.sendDepartmentChat(msgData)
  // Background worker handles the sync
})
ipcMain.handle('chat:getDMs', async (_, roomId) => {
  const db = await import('./db.cjs')
  return await db.getDirectMessages(roomId)
})
ipcMain.handle('chat:sendDM', async (_, msgData) => {
  const db = await import('./db.cjs')
  await db.sendDirectMessage(msgData)
  // Background worker handles the sync
})
ipcMain.handle('chat:markAsRead', async (_, userId, roomId) => {
  const db = await import('./db.cjs')
  await db.markChatAsRead(userId, roomId)
  // We DO NOT force db.syncCloud() here because it locks the database
  // and prevents getChatMessages from loading instantly when switching channels.
  // The background 2-second interval sync will pick this up automatically.
})
ipcMain.handle('chat:getSidebarData', async (_, userId) => {
  const db = await import('./db.cjs')
  return await db.getChatSidebarData(userId)
})
ipcMain.handle('chat:getRoomReceipts', async (_, roomId) => {
  const db = await import('./db.cjs')
  return await db.getRoomReceipts(roomId)
})
ipcMain.handle('chat:toggleReaction', async (_, msgId, userId, userName, emoji, isDm) => {
  const db = await import('./db.cjs')
  await db.toggleReaction(msgId, userId, userName, emoji, isDm)
})
ipcMain.handle('chat:editMessage', async (_, msgId, userId, newText, isDm) => {
  const db = await import('./db.cjs')
  return await db.editMessage(msgId, userId, newText, isDm)
})
ipcMain.handle('chat:unsendMessage', async (_, msgId, userId, isDm) => {
  const db = await import('./db.cjs')
  return await db.unsendMessage(msgId, userId, isDm)
})
ipcMain.handle('chat:deleteForMe', async (_, msgId, userId, isDm) => {
  const db = await import('./db.cjs')
  return await db.deleteMessageForMe(msgId, userId, isDm)
})
ipcMain.handle('chat:uploadAttachment', async (_, arrayBuffer, fileName, mimeType, msgId, msgType) => {
  const buffer = Buffer.from(arrayBuffer)

  // ── Step 1: Save locally first so the image shows IMMEDIATELY (even offline)
  const uploadsDir = path.join(app.getPath('userData'), 'chat-uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  const ext = path.extname(fileName) || ''
  const localName = `${crypto.randomUUID()}${ext}`
  const localPath = path.join(uploadsDir, localName)
  fs.writeFileSync(localPath, buffer)

  // Return an attachment:// URL — works offline, displays instantly
  const localUrl = `attachment://${localPath.replace(/\\/g, '/')}`

  // ── Step 2: Upload to R2 in the background (fire-and-forget)
  // Once done, patch the DB record with the real public URL so OTHER devices can see it
  setImmediate(async () => {
    try {
      const { updateChatFileUrl, updateDmFileUrl } = require('./db.cjs')
      const publicUrl = await uploadFileToR2(buffer, localName, mimeType)
      if (msgType === 'dm') {
        await updateDmFileUrl(msgId, publicUrl)
      } else {
        await updateChatFileUrl(msgId, publicUrl)
      }
    } catch (err) {
      console.error('[R2] Background upload failed — local copy still works:', err)
    }
  })

  return localUrl
})

ipcMain.handle('chat:openAttachment', async (_, filePath) => {
  await shell.openPath(filePath)
})

// ── AUTO UPDATER ──────────────────────────────────────────────────
autoUpdater.autoDownload = false

ipcMain.handle('updater:check', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates().catch(err => {
      if (mainWindow) mainWindow.webContents.send('updater:error', err.message)
    })
  } else {
    if (mainWindow) mainWindow.webContents.send('updater:checking')
    setTimeout(() => {
      if (mainWindow) mainWindow.webContents.send('updater:update-not-available', { version: 'Dev Mode' })
    }, 1000)
  }
})

ipcMain.handle('updater:download', () => {
  if (!isDev) {
    autoUpdater.downloadUpdate().catch(err => {
      if (mainWindow) mainWindow.webContents.send('updater:error', err.message)
    })
  } else {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (mainWindow) mainWindow.webContents.send('updater:download-progress', { percent: progress })
      if (progress >= 100) {
        clearInterval(interval);
        if (mainWindow) mainWindow.webContents.send('updater:update-downloaded')
      }
    }, 500)
  }
})

ipcMain.handle('updater:install', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall()
  }
})

autoUpdater.on('checking-for-update', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:checking')
})
autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:update-available', info)
})
autoUpdater.on('update-not-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:update-not-available', info)
})
autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:error', err.message)
})
autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:download-progress', progressObj)
})
autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:update-downloaded', info)
})

// ── ATTACHMENTS ───────────────────────────────────────────────────
ipcMain.handle('attachments:save', async (_, { name, buffer }) => {
  const uploadsDir = path.join(app.getPath('userData'), 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  const ext = path.extname(name) || ''
  const filename = `${crypto.randomUUID()}${ext}`
  const filepath = path.join(uploadsDir, filename)
  fs.writeFileSync(filepath, buffer)
  return { path: filepath }
})
ipcMain.handle('attachments:open', async (_, filepath) => {
  await shell.openPath(filepath)
})

// ── APP LIFECYCLE ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  await initDb()
  createWindow()

  // Register attachment:// protocol handler — serves local chat upload files
  // registerSchemesAsPrivileged (called before ready) makes this trusted & streamable
  protocol.handle('attachment', (request) => {
    // Strip the scheme prefix to get the raw absolute file path
    const filePath = decodeURIComponent(request.url.slice('attachment://'.length))
    return net.fetch(`file:///${filePath}`)
  })

  // ── Background sync in a dedicated worker thread ──────────────
  // This completely offloads the heavy DB sync operations from the main
  // thread, meaning the UI and typing will never lag!
  const { Worker } = require('worker_threads')
  const syncWorker = new Worker(path.join(__dirname, 'sync-worker.cjs'), {
    workerData: { dbPath: path.join(app.getPath('userData'), 'lltools-turso.db') }
  })
  
  syncWorker.on('message', (msg) => {
    if (msg === 'synced' && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('db:synced')
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
