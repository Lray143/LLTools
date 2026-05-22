// preload.cjs
const { ipcRenderer } = require('electron')

window.electronAPI = {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
}