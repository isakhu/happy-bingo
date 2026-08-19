import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  playVoice: (file: string) => ipcRenderer.invoke('play-voice', file),
  voiceHealth: () => ipcRenderer.invoke('voice-health'),
  getInstalledSet: () => ipcRenderer.invoke('get-installed-set'),
})

contextBridge.exposeInMainWorld('happyBingoActivation', {
  submit: (key: string) => ipcRenderer.invoke('submit-license', key),
})
