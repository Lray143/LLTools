// electron.cjs
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const {
  initDb, loginUser,
  getEmployees, getArchivedEmployees,
  upsertEmployee, archiveEmployee, unarchiveEmployee, permanentDeleteEmployee
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
ipcMain.handle('auth:login', (event, { username, password }) => {
  return loginUser(username, password)
})

// ── EMPLOYEES ─────────────────────────────────────────────────────
ipcMain.handle('employees:getAll',      ()        => getEmployees())
ipcMain.handle('employees:getArchived', ()        => getArchivedEmployees())
ipcMain.handle('employees:upsert',      (e, emp)  => upsertEmployee(emp))
ipcMain.handle('employees:archive',     (e, id)   => archiveEmployee(id))
ipcMain.handle('employees:unarchive',   (e, id)   => unarchiveEmployee(id))
ipcMain.handle('employees:permDelete',  (e, id)   => permanentDeleteEmployee(id))

// ── APP LIFECYCLE ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  await initDb()    // DB and tables ready first
  createWindow()    // then open the window
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})