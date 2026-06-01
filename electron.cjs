const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const {
  initDb, loginUser,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee,
  getAttendance, getAttendanceByDate, importAttendance,
  getProductGroups, getArchivedProducts,
  upsertProductGroup, deleteProductGroup,
  upsertProduct, archiveProduct, restoreProduct, permanentDeleteProduct,
  getOutlets, getArchivedOutlets,
  upsertOutlet, archiveOutlet, unarchiveOutlet, permanentDeleteOutlet,
  getOutletProductPrices, upsertOutletProductPrice, deleteOutletProductPrice,
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
  getUsers, updateUserRole, resetUserPassword, deleteUserAccount,
  saveOrder, getOrdersByOutlet, getOrdersByDefault, getAllOrders, deleteOrder,
} = require('./db.cjs')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'public/Logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'),
    }
  })
  win.removeMenu()
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'))
  }
}

// ── AUTH ──────────────────────────────────────────────────────────
ipcMain.handle('auth:login', (_, creds) => loginUser(creds.username, creds.password))

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

// ── SAVED ORDERS ──────────────────────────────────────────────────
ipcMain.handle('orders:save',          (_, order)    => saveOrder(order))
ipcMain.handle('orders:getByOutlet',   (_, outletId) => getOrdersByOutlet(outletId))
ipcMain.handle('orders:getByDefault',  ()            => getOrdersByDefault())
ipcMain.handle('orders:getAll',        ()            => getAllOrders())
ipcMain.handle('orders:delete',        (_, id)       => deleteOrder(id))

// ── APP LIFECYCLE ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  await initDb()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
