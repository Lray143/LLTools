// preload.cjs
const { ipcRenderer } = require('electron')

window.electronAPI = {
  // Auth
  login:                   (creds) => ipcRenderer.invoke('auth:login', creds),

  // Employees
  getEmployees:            ()      => ipcRenderer.invoke('employees:getAll'),
  getArchivedEmployees:    ()      => ipcRenderer.invoke('employees:getArchived'),
  upsertEmployee:          (emp)   => ipcRenderer.invoke('employees:upsert', emp),
  archiveEmployee:         (id)    => ipcRenderer.invoke('employees:archive', id),
  unarchiveEmployee:       (id)    => ipcRenderer.invoke('employees:unarchive', id),
  permanentDeleteEmployee: (id)    => ipcRenderer.invoke('employees:permDelete', id),
}