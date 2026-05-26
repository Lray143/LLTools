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
  getClinicLogs, getArchivedClinicLogs,
  upsertClinicLog, archiveClinicLog, unarchiveClinicLog, permanentDeleteClinicLog,
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

// ── CLINIC LOGS ───────────────────────────────────────────────────
ipcMain.handle('clinic:getAll',       ()        => getClinicLogs())
ipcMain.handle('clinic:getArchived',  ()        => getArchivedClinicLogs())
ipcMain.handle('clinic:upsert',       (_, log)  => upsertClinicLog(log))
ipcMain.handle('clinic:archive',      (_, id)   => archiveClinicLog(id))
ipcMain.handle('clinic:unarchive',    (_, id)   => unarchiveClinicLog(id))
ipcMain.handle('clinic:permDelete',   (_, id)   => permanentDeleteClinicLog(id))

// ── APP LIFECYCLE ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  await initDb()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})