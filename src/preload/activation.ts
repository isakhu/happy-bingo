import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingoActivation', {
  submit: (key: string) => ipcRenderer.invoke('submit-license', key),
})
