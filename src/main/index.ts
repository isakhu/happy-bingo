import { app, BrowserWindow, screen, shell } from 'electron'
import { join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

function load(win: BrowserWindow, player = false) {
  const url = process.env.ELECTRON_RENDERER_URL
  if (url) win.loadURL(`${url}${player ? '?player=1' : ''}`)
  else win.loadFile(join(__dirname, '../renderer/index.html'), player ? { search: '?player=1' } : undefined)
}

function generateCards() {
  const cards: { id: number; values: number[] }[] = []
  for (let id = 1; id <= 100; id++) {
    const columns: number[][] = []
    for (let col = 0; col < 5; col++) {
      const nums = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)
      let seed = id * 31 + col * 17
      for (let i = nums.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) >>> 0; const j = seed % (i + 1); [nums[i], nums[j]] = [nums[j], nums[i]] }
      columns.push(nums.slice(0, 5))
    }
    const values = Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columns[i % 5][Math.floor(i / 5)])
    cards.push({ id, values })
  }
  return cards
}

function cardHtml(card: { id: number; values: number[] }) {
  const cells = card.values.map((n, i) => `<div class="cell ${i === 12 ? 'free' : ''}">${i === 12 ? 'FREE' : n}</div>`).join('')
  return `<section class="card"><div class="title">HAPPY BINGO</div><div class="sub">BINGO CARD · #${String(card.id).padStart(3, '0')}</div><div class="head"><b>B</b><b>I</b><b>N</b><b>G</b><b>O</b></div><div class="grid">${cells}</div><div class="footer">Good luck!</div></section>`
}

async function generateCardsPdf() {
  const pdfWindow = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { sandbox: true } })
  const cards = generateCards()
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:7mm}*{box-sizing:border-box}body{margin:0;background:white;font-family:Arial,sans-serif;color:#0b2148}.page{width:100%;height:281mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8mm;page-break-after:always}.page:last-child{page-break-after:auto}.card{border:2px solid #1769d1;border-radius:8px;padding:7mm;display:flex;flex-direction:column;justify-content:center}.title{text-align:center;font-size:20px;font-weight:900;letter-spacing:2px;color:#0b55b7}.sub{text-align:center;font-size:10px;margin:3mm 0;color:#58708f}.head,.grid{display:grid;grid-template-columns:repeat(5,1fr)}.head b{background:#0b55b7;color:white;text-align:center;padding:5px;font-size:16px}.cell{height:25mm;border:1px solid #9db9dc;display:grid;place-items:center;font-size:17px;font-weight:800}.cell.free{background:#eaf3ff;color:#1769d1;font-size:12px}.footer{text-align:center;margin-top:3mm;font-size:9px;color:#6a7f99;text-transform:uppercase;letter-spacing:1px}</style></head><body>${Array.from({length:25},(_,page)=>`<div class="page">${cards.slice(page*4,page*4+4).map(cardHtml).join('')}</div>`).join('')}</body></html>`
  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    const dir = join(app.getPath('documents'), 'Happy Bingo')
    await mkdir(dir, { recursive: true })
    const path = join(dir, 'Happy-Bingo-100-Cards.pdf')
    await writeFile(path, pdf)
    await shell.openPath(path)
  } finally { if (!pdfWindow.isDestroyed()) pdfWindow.close() }
}

function createWindow() {
  const displays = screen.getAllDisplays(), primary = screen.getPrimaryDisplay()
  const win = new BrowserWindow({ x: primary.workArea.x, y: primary.workArea.y, width: primary.workAreaSize.width, height: primary.workAreaSize.height, minWidth: 1100, minHeight: 700, title: 'Happy Bingo — Manager', backgroundColor: '#071a3a', webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false } })
  win.maximize(); load(win)
  if (displays.length > 1) {
    const target = displays.find(d => d.id !== primary.id) ?? displays[1]
    const player = new BrowserWindow({ x: target.bounds.x, y: target.bounds.y, width: target.bounds.width, height: target.bounds.height, title: 'Happy Bingo — Player Screen', backgroundColor: '#061a42', fullscreen: true, webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false } })
    load(player, true)
  }
}

app.whenReady().then(async () => { createWindow(); await generateCardsPdf(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() }) })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
