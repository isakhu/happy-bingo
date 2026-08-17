const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

const CARD_COUNT = 100
const RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]]

function blankCard(id) { return { id, values: Array(25).fill(0) } }
function validCard(card) {
  if (!card || !Array.isArray(card.values) || card.values.length !== 25 || card.values[12] !== 0) return false
  for (let c=0;c<5;c++) {
    const [min,max]=RANGES[c], seen=new Set()
    for (let r=0;r<5;r++) {
      const i=r*5+c
      if (i===12) continue
      const n=Number(card.values[i])
      if (!Number.isInteger(n) || n<min || n>max || seen.has(n)) return false
      seen.add(n)
    }
  }
  return true
}
function validSet(cards) { return Array.isArray(cards) && cards.length===100 && cards.every(validCard) }
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 820, minWidth: 1000, minHeight: 700, backgroundColor:'#07131f', title:'Happy Bingo Card Setup', webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false} })
  win.loadFile(path.join(__dirname,'index.html'))
}
function makeDocument(payload) { return { format:'HAPPY_BINGO_CARTELLA_SET_V1', setId:payload.setId || 'HB-001', createdAt:new Date().toISOString(), cards:payload.cards } }

ipcMain.handle('save-hbc', async (_, payload) => {
  if (!payload || !validSet(payload.cards)) throw new Error('All 100 Cartellas must be valid before export.')
  const result = await dialog.showSaveDialog({ title:'Export Happy Bingo Cartella Set', defaultPath:`Happy-Bingo-${payload.setId || 'HB-001'}.hbc`, filters:[{name:'Happy Bingo Set',extensions:['hbc']},{name:'All Files',extensions:['*']}] })
  if (result.canceled || !result.filePath) return {canceled:true}
  const doc = makeDocument(payload)
  await fs.writeFile(result.filePath, JSON.stringify(doc,null,2), 'utf8')
  return {canceled:false,path:result.filePath,setId:doc.setId}
})

ipcMain.handle('install-hbc', async (_, payload) => {
  if (!payload || !validSet(payload.cards)) throw new Error('All 100 Cartellas must be valid before installation.')
  const doc = makeDocument(payload)
  const dir = path.join(app.getPath('appData'), 'Happy Bingo', 'cartella-sets')
  await fs.mkdir(dir, { recursive:true })
  const target = path.join(dir, `${doc.setId}.hbc`)
  await fs.writeFile(target, JSON.stringify(doc,null,2), 'utf8')
  return { path:target, setId:doc.setId }
})

ipcMain.handle('open-hbc', async () => {
  const result = await dialog.showOpenDialog({ title:'Open Happy Bingo Cartella Set', properties:['openFile'], filters:[{name:'Happy Bingo Set',extensions:['hbc']}] })
  if (result.canceled || !result.filePaths[0]) return {canceled:true}
  const raw = JSON.parse(await fs.readFile(result.filePaths[0],'utf8'))
  if (raw.format !== 'HAPPY_BINGO_CARTELLA_SET_V1' || !validSet(raw.cards)) throw new Error('Invalid Cartella Set file.')
  return {canceled:false,setId:raw.setId || 'HB-001',cards:raw.cards}
})

app.whenReady().then(() => { createWindow(); app.on('activate',()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow() }) })
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit() })
