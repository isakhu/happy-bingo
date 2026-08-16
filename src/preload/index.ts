import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  generateCardsPdf: () => ipcRenderer.invoke('generate-cards-pdf'),
})
