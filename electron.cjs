// electron.cjs
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { initDb, loginUser } = require('./db.cjs')

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

ipcMain.handle('auth:login', (event, { username, password }) => {
  return loginUser(username, password)
})

app.whenReady().then(async () => {
  await initDb()    // DB and tables ready first
  createWindow()    // then open the window
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})