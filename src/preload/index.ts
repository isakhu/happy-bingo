import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
})
