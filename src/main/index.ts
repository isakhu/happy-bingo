import { app, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

function load(win: BrowserWindow, player = false) {
  const url = process.env.ELECTRON_RENDERER_URL
  if (url) win.loadURL(`${url}${player ? '?player=1' : ''}`)
  else win.loadFile(join(__dirname, '../renderer/index.html'), player ? { search: '?player=1' } : undefined)
}

function createWindow() {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const win = new BrowserWindow({
    x: primary.bounds.x,
    y: primary.bounds.y,
    width: Math.max(1200, primary.workAreaSize.width),
    height: Math.max(750, primary.workAreaSize.height),
    minWidth: 1100,
    minHeight: 700,
    title: 'Happy Bingo — Manager',
    backgroundColor: '#0b1020',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false },
  })
  win.maximize()
  load(win)

  if (displays.length > 1) {
    const target = displays.find(d => d.id !== primary.id) ?? displays[1]
    const player = new BrowserWindow({
      x: target.bounds.x,
      y: target.bounds.y,
      width: target.bounds.width,
      height: target.bounds.height,
      title: 'Happy Bingo — Player Screen',
      backgroundColor: '#05070b',
      fullscreen: true,
      webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false },
    })
    load(player, true)
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
