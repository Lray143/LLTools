const { app, BrowserWindow, ipcMain, shell, protocol, net, Notification } = require('electron')

// Must be set before the app is ready / any window or notification is created.
// Without this, Windows falls back to showing "Electron" as the notification
// sender name in dev mode instead of your actual app name.
app.setAppUserModelId('com.lltools.app')

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { autoUpdater } = require('electron-updater')
const { uploadFileToR2, getBucketSize } = require('./r2.cjs')
const fs = require('fs')
const crypto = require('crypto')
const {
  initDb, loginUser, syncCloud, wipeAllData, getDatabaseSize,
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

  getUsers, updateUserRole, resetUserPassword, updateUserCredentials, deleteUserAccount, updateUserTheme,
  saveOrder, getOrdersByOutlet, getOrdersByDefault, getAllOrders, deleteOrder, updateOrderDate,
  getArchivedOrders, archiveOrder, unarchiveOrder,
  submitLeaveRequest, getLeaveRequests, getMyLeaveRequests, reviewLeaveRequest,
  createReport, getReports, getMyReports, getReportById,
  updateReportStatus, assignReport, addReportComment,
  getReportComments, getReportStatusLogs,
  updateReport, archiveReport, unarchiveReport, permanentDeleteReport,
  getDepartmentChats, sendDepartmentChat, getDirectMessages, sendDirectMessage,
  updateChatFileUrl, updateDmFileUrl,
  markChatAsRead, getChatSidebarData, getRoomReceipts,
  refreshUser, heartbeatUser, logoutUser,
  getAppLinks, getAppLink, upsertAppLink,
  addModuleActivityLog, getModuleActivityLogs,
  getAnnouncements, getArchivedAnnouncements, getAnnouncementHistory, upsertAnnouncement, archiveAnnouncement, permanentDeleteAnnouncement,
  acknowledgeAnnouncement, getAnnouncementAcknowledgements, getAnnouncementComments, addAnnouncementComment, reactToAnnouncementComment,
  markAnnouncementRead, getAnnouncementReads
} = require('./db.cjs')

// ── Pusher REST trigger (no SDK — avoids ESM require issues) ────────────
const https = require('https')

function pusherTrigger(channelName, eventName, data) {
  return new Promise((resolve) => {
    const appId   = process.env.PUSHER_APP_ID
    const key     = process.env.VITE_PUSHER_KEY
    const secret  = process.env.PUSHER_SECRET
    const cluster = process.env.VITE_PUSHER_CLUSTER || 'ap1'
    if (!appId || !key || !secret) return resolve({ ok: false, reason: 'No Pusher credentials' })

    const body      = JSON.stringify({ name: eventName, channel: channelName, data: JSON.stringify(data) })
    const timestamp = Math.floor(Date.now() / 1000)
    const md5Body   = crypto.createHash('md5').update(body).digest('hex')
    const reqPath   = `/apps/${appId}/events`
    // Parameters MUST be in alphabetical order per Pusher spec
    const paramStr  = `auth_key=${key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Body}`
    const toSign    = `POST\n${reqPath}\n${paramStr}`
    const signature = crypto.createHmac('sha256', secret).update(toSign).digest('hex')
    const queryStr  = `${paramStr}&auth_signature=${signature}`

    const options = {
      hostname: `api-${cluster}.pusher.com`,
      path: `${reqPath}?${queryStr}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }
    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', d => { raw += d })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`[Pusher] HTTP ${res.statusCode}:`, raw)
        }
        resolve({ ok: res.statusCode === 200, status: res.statusCode })
      })
    })
    req.on('error', (e) => { console.error('[Pusher] request error:', e.message); resolve({ ok: false }) })
    req.write(body)
    req.end()
  })
}

let pusherDisabled = false
let syncWorkerRef = null

const isDev = process.env.NODE_ENV === 'development'
let mainWindow = null

// Disable WebAuthentication to stop Windows Security "Choose a passkey" dialog from popping up
// app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationUI')

// Fix Google Sign-In inside Electron by completely spoofing a Firefox User Agent
const FIREFOX_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0";

// MUST be called before app is ready — tells Electron to treat attachment://
// as a secure, standard scheme (same trust level as https://)
protocol.registerSchemesAsPrivileged([{
  scheme: 'attachment',
  privileges: { secure: true, standard: true, stream: true, supportFetchAPI: true }
}, {
  scheme: 'r2',
  privileges: { secure: true, standard: true, stream: true, supportFetchAPI: true }
}])

ipcMain.handle('app:getVersion', () => app.getVersion())

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'LLTools',
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'public/Logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
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
ipcMain.handle('employees:resetCredentials', async (_, employeeId) => {
  const db = await import('./db.cjs')
  return await db.resetEmployeeCredentials(employeeId)
})

// ── ATTENDANCE ────────────────────────────────────────────────────
ipcMain.handle('attendance:getAll',    ()           => getAttendance())
ipcMain.handle('attendance:getByDate', (_, date)    => getAttendanceByDate(date))
ipcMain.handle('attendance:getMine',   (_, empId)   => getMyAttendance(empId))
ipcMain.handle('attendance:import',    (_, records) => importAttendance(records))
ipcMain.handle('attendance:importRawText', (_, text) => {
  return import('./db.cjs').then(db => db.importAttendanceRawText(text))
})

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
ipcMain.handle('users:updateCredentials', (_, id, username, oldPassword, newPassword) => updateUserCredentials(id, username, oldPassword, newPassword))
ipcMain.handle('users:delete',         (_, id)               => deleteUserAccount(id))
ipcMain.handle('users:updateTheme',    (_, id, color, mode)  => updateUserTheme(id, color, mode))
ipcMain.handle('users:heartbeat',      (_, id)               => heartbeatUser(id))
ipcMain.handle('users:logout',         (_, id)               => logoutUser(id))

ipcMain.handle('db:wipeAll',           ()                    => wipeAllData())

ipcMain.handle('getSystemUsage', async () => {
  let tursoBytes = 0
  let r2Bytes = 0
  try { tursoBytes = await getDatabaseSize() } catch(e) { console.error(e) }
  try { r2Bytes = await getBucketSize() } catch(e) { console.error(e) }

  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return {
    turso: { bytes: tursoBytes, label: formatBytes(tursoBytes) },
    r2: { bytes: r2Bytes, label: formatBytes(r2Bytes) },
    pusher: { label: 'Active (200k msgs/day tier)' } // Pusher API doesn't expose limits easily
  }
})

// ── ANNOUNCEMENTS ──────────────────────────────────────────────────
ipcMain.handle('announcements:getAll',       (_, empId, incArch) => getAnnouncements(empId, incArch))
ipcMain.handle('announcements:getArchived',  (_, empId)          => getArchivedAnnouncements(empId))
ipcMain.handle('announcements:getHistory',   (_, empId)          => getAnnouncementHistory(empId))
ipcMain.handle('announcements:upsert',       (_, ann)            => upsertAnnouncement(ann))
ipcMain.handle('announcements:archive',      (_, id)             => archiveAnnouncement(id))
ipcMain.handle('announcements:permDelete',   (_, id)             => permanentDeleteAnnouncement(id))
ipcMain.handle('announcements:acknowledge',  (_, annId, empId, empName) => acknowledgeAnnouncement(annId, empId, empName))
ipcMain.handle('announcements:getAcks',      (_, annId)          => getAnnouncementAcknowledgements(annId))
ipcMain.handle('announcements:markRead',     (_, annId, empId, empName) => markAnnouncementRead(annId, empId, empName))
ipcMain.handle('announcements:getReads',     (_, annId)          => getAnnouncementReads(annId))
ipcMain.handle('announcements:getComments',  (_, annId)          => getAnnouncementComments(annId))
ipcMain.handle('announcements:addComment',   (_, annId, empId, empName, content, parentId) => addAnnouncementComment(annId, empId, empName, content, parentId))
ipcMain.handle('announcements:reactComment', (_, commentId, empId, empName, reaction) => reactToAnnouncementComment(commentId, empId, empName, reaction))

// ── APP LINKS ─────────────────────────────────────────────────────
ipcMain.handle('appLinks:getAll',      ()                    => getAppLinks())
ipcMain.handle('appLinks:get',         (_, key)              => getAppLink(key))
ipcMain.handle('appLinks:upsert',      (_, link)             => upsertAppLink(link))

// ── MODULE ACTIVITY LOGS ──────────────────────────────────────────
ipcMain.handle('activityLog:add',      (_, entry)            => addModuleActivityLog(entry))
ipcMain.handle('activityLog:get',      (_, module, limit)    => getModuleActivityLogs(module, limit ?? 200))

// ── SAVED ORDERS ──────────────────────────────────────────────────
ipcMain.handle('orders:save',          (_, order)    => saveOrder(order))
ipcMain.handle('orders:getByOutlet',   (_, outletId) => getOrdersByOutlet(outletId))
ipcMain.handle('orders:getByDefault',  ()            => getOrdersByDefault())
ipcMain.handle('orders:getAll',        ()            => getAllOrders())
ipcMain.handle('orders:getArchived',   ()            => getArchivedOrders())
ipcMain.handle('orders:archive',       (_, id)       => archiveOrder(id))
ipcMain.handle('orders:unarchive',     (_, id)       => unarchiveOrder(id))
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

ipcMain.handle('chat:sendPusherEvent', async (_, { channel, event, data }) => {
  if (pusherDisabled) return { success: false, reason: 'Pusher disabled' }
  try {
    const result = await pusherTrigger(channel, event, data)
    if (!result.ok && (result.status === 403 || result.status === 429)) {
      pusherDisabled = true
      console.warn('Pusher quota exceeded or forbidden, falling back to 5-second polling')
    }
    return result
  } catch (err) {
    console.error('Pusher trigger error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('system:forceSync', () => {
  if (syncWorkerRef) syncWorkerRef.postMessage('sync-now')
})

// ── Native OS notifications (Facebook-style popup, bottom-right on Windows) ──
// Only fires when the window is minimized — if it's visible, the in-app
// NotificationBell badge/dropdown is enough and we don't want a duplicate popup.
ipcMain.handle('system:showNativeNotification', (_, { title, body }) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { shown: false }
  if (!mainWindow.isMinimized()) return { shown: false }
  if (!Notification.isSupported()) return { shown: false }

  const notification = new Notification({
    title: title || 'LLTools',
    body: body || '',
    icon: path.join(__dirname, 'public/icon.png'),
  })

  notification.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  notification.show()
  return { shown: true }
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
  return await db.toggleReaction(msgId, userId, userName, emoji, isDm)
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
ipcMain.handle('chat:uploadAttachment', async (_, fileData, fileName, mimeType, msgId, msgType) => {
  let buffer
  if (typeof fileData === 'string') {
    buffer = await fs.promises.readFile(fileData)
  } else {
    buffer = Buffer.from(fileData)
  }

  // ── Step 1: Save locally first so the image shows IMMEDIATELY (even offline)
  const uploadsDir = path.join(app.getPath('userData'), 'chat-uploads')
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  const ext = path.extname(fileName) || ''
  const localName = `${Date.now()}-${crypto.randomUUID()}${ext}`
  const localPath = path.join(uploadsDir, localName)
  await fs.promises.writeFile(localPath, buffer)

  // Use the native r2:// protocol immediately so the UI optimistic cache handles it identically
  const localUrl = `r2://${localName}`

  // ── Step 2: Upload to R2 in the background (fire-and-forget)
  // Once done, patch the DB record with the r2:// internal URL
  setImmediate(async () => {
    try {
      const { updateChatFileUrl, updateDmFileUrl } = require('./db.cjs')
      const { uploadFileToR2 } = require('./r2.cjs')
      await uploadFileToR2(buffer, localName, mimeType)
      
      const r2Url = `r2://${localName}`
      if (msgType === 'dm') {
        await updateDmFileUrl(msgId, r2Url)
      } else {
        await updateChatFileUrl(msgId, r2Url)
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

ipcMain.handle('chat:openR2File', async (_, fileName) => {
  const uploadsDir = path.join(app.getPath('userData'), 'chat-uploads')
  const localPath = path.join(uploadsDir, fileName)
  if (fs.existsSync(localPath)) {
    await shell.openPath(localPath)
  } else {
    try {
      const { downloadFileFromR2 } = require('./r2.cjs')
      const fileBuffer = await downloadFileFromR2(fileName)
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      await fs.promises.writeFile(localPath, fileBuffer)
      await shell.openPath(localPath)
    } catch (err) {
      console.error(`[openR2File] Failed:`, err)
    }
  }
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
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  const ext = path.extname(name) || ''
  const filename = `${crypto.randomUUID()}${ext}`
  const filepath = path.join(uploadsDir, filename)
  await fs.promises.writeFile(filepath, buffer)
  return { path: filepath }
})
ipcMain.handle('attachments:open', async (_, filepath) => {
  await shell.openPath(filepath)
})

// ── APP LIFECYCLE ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  const { session } = require('electron')
  // session.defaultSession.webRequest.onBeforeSendHeaders(
  //   { urls: ['*://*.google.com/*', '*://*.googleapis.com/*', '*://accounts.google.com/*'] },
  //   (details, callback) => {
  //     details.requestHeaders['User-Agent'] = FIREFOX_UA;
  //     callback({ cancel: false, requestHeaders: details.requestHeaders });
  //   }
  // )

  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url }) => {
        if (url.includes('accounts.google.com') || url.includes('google.com')) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: { autoHideMenuBar: true, width: 500, height: 600 }
          }
        }
        shell.openExternal(url)
        return { action: 'deny' }
      })

      contents.on('did-create-window', (newWindow) => {
        // Immediately spoof UA on the popup window so Google doesn't detect Electron
        newWindow.webContents.setUserAgent(FIREFOX_UA)

        // Only auto-close the auth popup once Google has redirected BACK to the form
        // (i.e. sign-in is complete). Don't close it while still on accounts.google.com
        // so that "Switch account" and multi-step auth flows work normally.
        const checkUrlAndClose = (e, navigatedUrl) => {
          const isGoogleAuth = navigatedUrl.includes('accounts.google.com')
          const isBackToForm = navigatedUrl.includes('docs.google.com/forms')
          if (isBackToForm && !isGoogleAuth) {
            if (e && e.preventDefault) e.preventDefault()
            newWindow.close()
            contents.reload()
          }
        }
        newWindow.webContents.on('will-navigate', checkUrlAndClose)
        newWindow.webContents.on('did-redirect-navigation', checkUrlAndClose)
      })
    }
  })

  try {
    await initDb()
  } catch (err) {
    console.error('[DB] Init failed (app will still open):', err.message)
  }
  createWindow()

  // Register attachment:// protocol handler — serves local chat upload files
  // registerSchemesAsPrivileged (called before ready) makes this trusted & streamable
  protocol.handle('attachment', (request) => {
    // Strip the scheme prefix to get the raw absolute file path
    const filePath = decodeURIComponent(request.url.slice('attachment://'.length))
    return net.fetch(`file:///${filePath}`)
  })

  // Register r2:// protocol handler — intelligent local cache proxy for cloud files
  protocol.handle('r2', async (request) => {
    // Chromium auto-appends a trailing slash to hostnames in custom protocols. Remove it.
    let fileName = decodeURIComponent(request.url.slice('r2://'.length))
    if (fileName.endsWith('/')) fileName = fileName.slice(0, -1)
    
    const uploadsDir = path.join(app.getPath('userData'), 'chat-uploads')
    const localPath = path.join(uploadsDir, fileName)

    // 1. Check local cache first
    if (fs.existsSync(localPath)) {
      return net.fetch(`file:///${localPath.replace(/\\/g, '/')}`)
    }

    // 2. Not cached -> Download securely via AWS SDK (bypassing public domain blocks)
    try {
      const { downloadFileFromR2 } = require('./r2.cjs')
      const fileBuffer = await downloadFileFromR2(fileName)
      
      // Save to cache for next time
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      await fs.promises.writeFile(localPath, fileBuffer)
      
      return net.fetch(`file:///${localPath.replace(/\\/g, '/')}`)
    } catch (err) {
      console.error(`[r2:// proxy] Failed to download ${fileName}:`, err)
      return new Response('File not found or network error', { status: 404 })
    }
  })

  // ── Background sync in a dedicated worker thread ──────────────
  // Only notify the renderer when the database actually changed
  // (data_version check avoids a re-render storm on every poll cycle).
  const { Worker } = require('worker_threads')
  const syncWorker = new Worker(path.join(__dirname, 'sync-worker.cjs'), {
    workerData: { dbPath: path.join(app.getPath('userData'), 'lltools-turso.db') }
  })
  syncWorkerRef = syncWorker
  global.syncWorkerRef = syncWorker

  let lastKnownVersion = -1
  syncWorker.on('message', async (msg) => {
    if (msg !== 'synced' || !mainWindow || mainWindow.isDestroyed()) return
    // Always notify frontend that a sync completed. 
    // PRAGMA data_version is unreliable with libsql embedded replica syncs.
    mainWindow.webContents.send('db:synced')
  })

  // Tell the worker it's safe to start syncing (initDb is done, schema is ready)
  syncWorker.postMessage('start')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
