import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  playVoice: (file: string) => {
    if (String(file).toLowerCase() === 'cartellawu.mp3') {
      const approved = window.confirm('FAILED BINGO\n\nThis Cartella did not win.\n\nPlay the failed-Bingo voice and lock this player?')
      if (!approved) return Promise.resolve('')
    }
    return ipcRenderer.invoke('play-voice', file)
  },
  voiceHealth: () => ipcRenderer.invoke('voice-health'),
  getInstalledSet: () => ipcRenderer.invoke('get-installed-set'),
})
