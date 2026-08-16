import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

type Card = { id: number; values: number[] }

function load(win: BrowserWindow) {
  const url = process.env.ELECTRON_RENDERER_URL
  if (url) win.loadURL(url)
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

function generateCards(seedBase = 2026): Card[] {
  const cards: Card[] = []
  for (let id = 1; id <= 100; id++) {
    const columns: number[][] = []
    for (let col = 0; col < 5; col++) {
      const nums = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)
      let seed = (seedBase + id * 31 + col * 17) >>> 0
      for (let i = nums.length - 1; i > 0; i--) {
        seed = (seed * 1103515245 + 12345) >>> 0
        const j = seed % (i + 1)
        ;[nums[i], nums[j]] = [nums[j], nums[i]]
      }
      columns.push(nums.slice(0, 5))
    }
    const values = Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columns[i % 5][Math.floor(i / 5)])
    cards.push({ id, values })
  }
  return cards
}

function cardHtml(card: Card) {
  const colors = ['#ffb300', '#29a9ff', '#7ee52d', '#ff4b19', '#f52ea4']
  const cells = card.values.map((n, i) => `<div class="cell ${i === 12 ? 'free' : ''}">${i === 12 ? 'FREE' : n}</div>`).join('')
  const heads = ['B', 'I', 'N', 'G', 'O'].map((letter, i) => `<b style="background:${colors[i]}">${letter}</b>`).join('')
  return `<section class="card"><div class="spark">✦</div><div class="title"><span>HAPPY</span> BINGO</div><div class="sub">CARTELLA · #${String(card.id).padStart(3, '0')}</div><div class="head">${heads}</div><div class="grid">${cells}</div><div class="footer">GOOD LUCK! · HAPPY BINGO</div></section>`
}

async function generateCardsPdf(seedBase = 2026) {
  const pdfWindow = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { sandbox: true } })
  const cards = generateCards(seedBase)
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>
@page{size:A4;margin:6mm}*{box-sizing:border-box}body{margin:0;background:#170743;font-family:Arial,sans-serif;color:#fff}.page{width:100%;height:282mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6mm;page-break-after:always}.page:last-child{page-break-after:auto}.card{position:relative;overflow:hidden;border:2px solid #8d5cff;border-radius:14px;padding:6mm;background:radial-gradient(circle at 50% 5%,#6d2fd0,#28105e 45%,#12052f 100%);box-shadow:inset 0 0 35px #8b43ff55}.card:before{content:'';position:absolute;inset:-30%;background:conic-gradient(from 20deg,#ff4fc3,#6f5cff,#27cfff,#8cff3e,#ffd23f,#ff4fc3);opacity:.08;filter:blur(25px)}.spark{position:absolute;right:8mm;top:4mm;color:#ffd95a;font-size:20px}.title{position:relative;text-align:center;font-size:22px;font-weight:1000;letter-spacing:2px;text-shadow:0 2px 0 #12052f}.title span{color:#ffd13b}.sub{position:relative;text-align:center;font-size:9px;margin:2mm 0 4mm;color:#d8c8ff;font-weight:800;letter-spacing:1.4px}.head,.grid{position:relative;display:grid;grid-template-columns:repeat(5,1fr)}.head{gap:2px}.head b{color:white;text-align:center;padding:5px 0;font-size:15px;border-radius:4px;text-shadow:0 1px 2px #0008}.grid{gap:2px;margin-top:2px}.cell{height:22mm;border:1px solid #bba8e5;background:#fffaf5;color:#1c1640;display:grid;place-items:center;font-size:16px;font-weight:900}.cell.free{background:linear-gradient(135deg,#ffd63f,#ff9d21);color:#fff;font-size:10px;text-shadow:0 1px 2px #8b3c00}.footer{position:relative;text-align:center;margin-top:3mm;font-size:8px;color:#e9dfff;letter-spacing:1.5px;font-weight:900}
</style></head><body>${Array.from({ length: 25 }, (_, page) => `<div class="page">${cards.slice(page * 4, page * 4 + 4).map(cardHtml).join('')}</div>`).join('')}</body></html>`
  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    const dir = join(app.getPath('documents'), 'Happy Bingo')
    await mkdir(dir, { recursive: true })
    const path = join(dir, 'Happy-Bingo-100-Cards.pdf')
    await writeFile(path, pdf)
    await shell.openPath(path)
    return { cards, path }
  } finally {
    if (!pdfWindow.isDestroyed()) pdfWindow.close()
  }
}

ipcMain.handle('generate-cards-pdf', async () => generateCardsPdf(Date.now() >>> 0))

const ALLOWED_VOICES = new Set([
  'Goodbingo.mp3', 'cartellawu.mp3', 'chewatawu.mp3',
  ...Array.from({ length: 15 }, (_, i) => `b${i + 1}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `i${i + 16}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `n${i + 31}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `g${i + 46}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `o${i + 61}.mp3`),
])

async function readVoiceFile(file: string) {
  const locations = [
    join(app.getAppPath(), 'audio', 'voices', file),
    join(process.resourcesPath, 'audio', 'voices', file),
  ]
  let lastError: unknown
  for (const location of locations) {
    try { return await readFile(location) } catch (error) { lastError = error }
  }
  throw lastError instanceof Error ? lastError : new Error(`Voice file not found: ${file}`)
}

ipcMain.handle('play-voice', async (_event, file: string) => {
  if (!ALLOWED_VOICES.has(file)) throw new Error('Voice file is not allowed')
  const bytes = await readVoiceFile(file)
  return `data:audio/mpeg;base64,${bytes.toString('base64')}`
})

function enableAutomaticCaller(win: BrowserWindow) {
  const script = `(() => {
    if (window.__happyBingoAutoCaller) return;
    window.__happyBingoAutoCaller = true;
    let lastClick = 0;
    const tick = () => {
      try {
        const live = document.querySelector('.status-pill.live');
        const call = document.querySelector('.call-button');
        if (live && call) {
          const text = call.textContent || '';
          const disabled = call.hasAttribute('disabled') || call.getAttribute('aria-disabled') === 'true';
          const now = Date.now();
          if (!disabled && !text.includes('PLAYING') && now - lastClick >= 1000) {
            lastClick = now;
            call.click();
          }
        }
      } catch {}
    };
    setInterval(tick, 500);
  })()`
  win.webContents.executeJavaScript(script).catch(() => {})
}

function createWindow() {
  const primary = screen.getPrimaryDisplay()
  const win = new BrowserWindow({
    x: primary.workArea.x,
    y: primary.workArea.y,
    width: primary.workAreaSize.width,
    height: primary.workAreaSize.height,
    minWidth: 1100,
    minHeight: 700,
    title: 'Happy Bingo — Manager',
    backgroundColor: '#071a3a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.maximize()
  win.webContents.on('did-finish-load', () => enableAutomaticCaller(win))
  load(win)
}

// Electron blocks programmatic HTML5 audio in some packaged Windows builds unless
// autoplay is explicitly allowed. Bingo is an offline kiosk-style app, so allow
// the recorded caller audio to start automatically after the game begins.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

app.whenReady().then(async () => {
  createWindow()
  await generateCardsPdf(2026)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
