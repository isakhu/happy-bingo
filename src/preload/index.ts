import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  getLicenseInfo: () => ipcRenderer.invoke('license-info'),
  activateLicense: (key: string) => ipcRenderer.invoke('activate-license', key),
  managerPassword: (password: string) => ipcRenderer.invoke('manager-password', password),
  generateCardsPdf: (cards?: unknown[], setId?: string) => ipcRenderer.invoke('generate-cards-pdf', cards, setId),
  playVoice: (file: string) => ipcRenderer.invoke('play-voice', file),
  voiceHealth: () => ipcRenderer.invoke('voice-health'),
})
