import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingoAuth', {
  defaultPassword: '48261937',
  status: () => ipcRenderer.invoke('auth-status'),
  setup: (currentDefault: string, newPassword: string, confirmPassword: string) => ipcRenderer.invoke('auth-setup', currentDefault, newPassword, confirmPassword),
  unlock: (password: string) => ipcRenderer.invoke('auth-unlock', password),
})

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  playVoice: (file: string) => ipcRenderer.invoke('play-voice', file),
  voiceHealth: async () => {
    try {
      const result = await ipcRenderer.invoke('voice-health')
      if (result && Number.isFinite(result.total) && Number.isFinite(result.available)) {
        return result
      }
      return { available: 0, total: 79, files: [] }
    } catch {
      return { available: 0, total: 79, files: [] }
    }
  },
  getInstalledSet: () => ipcRenderer.invoke('get-installed-set'),
})
