const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('cardSetup', {
  saveHbc: payload => ipcRenderer.invoke('save-hbc', payload),
  installHbc: payload => ipcRenderer.invoke('install-hbc', payload),
  openHbc: () => ipcRenderer.invoke('open-hbc'),
  buildCustomerPackage: payload => ipcRenderer.invoke('build-customer-package', payload)
})
