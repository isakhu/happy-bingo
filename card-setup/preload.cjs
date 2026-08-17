const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('cardSetup', {
  saveHbc: (payload) => ipcRenderer.invoke('save-hbc', payload),
  openHbc: () => ipcRenderer.invoke('open-hbc'),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath)
})
