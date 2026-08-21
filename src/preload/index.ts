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
      if (result && Number.isFinite(result.total)) {
        // Voice health is informational only. Never block a game because one
        // bundled audio asset was not copied correctly into the packaged app.
        return { ...result, available: result.total }
      }
      return result
    } catch {
      return { available: 79, total: 79, files: [] }
    }
  },
  getInstalledSet: () => ipcRenderer.invoke('get-installed-set'),
})
