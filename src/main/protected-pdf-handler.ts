import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { encryptPDF } from '@pdfsmaller/pdf-encrypt'

const PDF_PASSWORD = '20260817'
type Card = { id: number; values: number[] }

function validCards(input: unknown): input is Card[] {
  return Array.isArray(input) && input.length === 100 && input.every((c: any) => c && Number.isInteger(c.id) && Array.isArray(c.values) && c.values.length === 25)
}

function cardHtml(card: Card, setId: string) {
  const colors = ['#ffb300', '#29a9ff', '#7ee52d', '#ff4b19', '#f52ea4']
  const cells = card.values.map((n, i) => `<div class="cell ${i === 12 ? 'free' : ''}">${i === 12 ? 'FREE' : n}</div>`).join('')
  const heads = ['B', 'I', 'N', 'G', 'O'].map((l, i) => `<b style="background:${colors[i]}">${l}</b>`).join('')
  return `<section class="card"><div class="title"><span>HAPPY</span> BINGO</div><div class="sub">SET ${setId} · CARTELLA #${String(card.id).padStart(3, '0')}</div><div class="head">${heads}</div><div class="grid">${cells}</div><div class="footer">GOOD LUCK! · HAPPY BINGO · ${setId}</div></section>`
}

async function generateProtectedCardsPdf(savedCards: unknown, setId = 'HB-001') {
  if (!validCards(savedCards)) throw new Error('A saved Cartella Set is required. The PDF export never generates a new set.')
  const cards = savedCards
  const w = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { sandbox: true } })
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:6mm}*{box-sizing:border-box}body{margin:0;background:#170743;font-family:Arial;color:#fff}.page{width:100%;height:282mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6mm;page-break-after:always}.page:last-child{page-break-after:auto}.card{border:2px solid #8d5cff;border-radius:14px;padding:6mm;background:#28105e}.title{text-align:center;font-size:22px;font-weight:1000}.title span{color:#ffd13b}.sub{text-align:center;font-size:9px;margin:2mm 0 4mm;color:#d8c8ff;font-weight:800}.head,.grid{display:grid;grid-template-columns:repeat(5,1fr)}.head{gap:2px}.head b{text-align:center;padding:5px 0;border-radius:4px}.grid{gap:2px;margin-top:2mm}.cell{height:22mm;border:1px solid #bba8e5;background:#fffaf5;color:#1c1640;display:grid;place-items:center;font-size:16px;font-weight:900}.cell.free{background:#ffb52a;color:#fff}.footer{text-align:center;margin-top:3mm;font-size:8px;color:#e9dfff;font-weight:900}</style></head><body>${Array.from({ length: 25 }, (_, p) => `<div class="page">${cards.slice(p * 4, p * 4 + 4).map(c => cardHtml(c, setId)).join('')}</div>`).join('')}</body></html>`
  try {
    await w.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const rawPdf = await w.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    const encrypted = await encryptPDF(new Uint8Array(rawPdf), PDF_PASSWORD, {
      ownerPassword: `${PDF_PASSWORD}-OWNER`,
      allowPrinting: true,
      allowHighQualityPrint: true,
      allowCopying: false,
      allowModifying: false,
      allowAnnotating: false,
      allowAssembly: false,
    })
    const dir = join(app.getPath('documents'), 'Happy Bingo')
    await mkdir(dir, { recursive: true })
    const safeSet = setId.replace(/[^a-zA-Z0-9_-]/g, '_')
    const path = join(dir, `Happy-Bingo-${safeSet}.pdf`)
    await writeFile(path, Buffer.from(encrypted))
    await shell.openPath(path)
    return { cards, path, setId, protected: true }
  } finally {
    if (!w.isDestroyed()) w.close()
  }
}

ipcMain.handle('generate-protected-cards-pdf', async (_, cards, setId) => generateProtectedCardsPdf(cards, setId || 'HB-001'))
