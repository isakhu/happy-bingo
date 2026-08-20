import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { join } from 'node:path'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { CUSTOMER_CARDS } from './customer-cards'

type Card = { id: number; values: number[] }
type AuthRecord = { salt: string; hash: string }

const DEFAULT_PASSWORD = '48261937'
const AUDIO_SCHEME = 'hb-audio'
const NUMBER_VOICES = [
  ...Array.from({ length: 15 }, (_, i) => `b${i + 1}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `i${i + 16}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `n${i + 31}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `g${i + 46}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `o${i + 61}.mp3`),
]
const SYSTEM_VOICES = ['Goodbingo.mp3', 'cartellawu.mp3', 'chewatawu.mp3', 'pause.mp3']
const ALLOWED_VOICES = new Set([...SYSTEM_VOICES, ...NUMBER_VOICES])
const VOICE_BY_KEY = new Map(Array.from(ALLOWED_VOICES, (file) => [file.toLowerCase(), file]))

protocol.registerSchemesAsPrivileged([
  {
    scheme: AUDIO_SCHEME,
    privileges: { standard: true, secure: true, supportsFetchAPI: true, stream: true, corsEnabled: true },
  },
])

function logError(context: string, error: unknown) {
  console.error(`[Happy Bingo] ${context}`, error)
}

function loadRenderer(win: BrowserWindow) {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (devUrl) {
    return win.loadURL(devUrl)
  }
  return win.loadFile(join(__dirname, '../renderer/index.html'))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Happy Bingo',
    backgroundColor: '#040D1A',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.maximize()
  void loadRenderer(win).catch((error) => {
    logError('Renderer failed to load', error)
    const details = error instanceof Error ? error.message : String(error)
    void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><body style="margin:0;background:#040D1A;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh"><main style="max-width:700px;padding:32px;text-align:center"><h1>HAPPY BINGO</h1><h2>Renderer failed to load</h2><p>${details.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p><p>Restart the application after rebuilding.</p></main></body></html>`)}`)
  })

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logError(`Renderer did-fail-load ${errorCode}: ${errorDescription} (${validatedURL})`, new Error(errorDescription))
  })
  win.webContents.on('render-process-gone', (_event, details) => {
    logError(`Renderer process gone: ${details.reason}`, new Error(details.exitCode ? `exitCode=${details.exitCode}` : 'no exit code'))
  })
  win.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`)
  })

  return win
}

async function ensureVoices() {
  const sourceDirs = [
    join(app.getAppPath(), 'audio', 'voices'),
    join(process.resourcesPath, 'audio', 'voices'),
    join(process.cwd(), 'audio', 'voices'),
  ]
  const targetDir = join(app.getPath('userData'), 'voices')
  await mkdir(targetDir, { recursive: true })

  for (const file of ALLOWED_VOICES) {
    const target = join(targetDir, file)
    try {
      await readFile(target)
      continue
    } catch {
      // Copy a packaged/source asset below when it is not already installed locally.
    }

    let copied = false
    for (const sourceDir of sourceDirs) {
      try {
        await copyFile(join(sourceDir, file), target)
        copied = true
        break
      } catch {
        // Try the next known offline source.
      }
    }

    if (!copied) logError(`Missing voice asset: ${file}`, new Error('Asset not found in packaged or development locations'))
  }

  return targetDir
}

async function getVoiceData(file: string) {
  const canonical = VOICE_BY_KEY.get(String(file).toLowerCase())
  if (!canonical) throw new Error(`Voice file is not allowed: ${file}`)

  const dir = await ensureVoices()
  const data = await readFile(join(dir, canonical))
  return `data:audio/mpeg;base64,${data.toString('base64')}`
}

async function getInstalledSet() {
  const dir = join(app.getPath('userData'), 'cartella-sets')
  await mkdir(dir, { recursive: true })
  const files = (await readdir(dir)).filter((file) => file.toLowerCase().endsWith('.hbc')).sort()

  if (!files.length) {
    return { setId: 'HB-CUSTOMER-100', createdAt: '2026-08-19', cards: CUSTOMER_CARDS as Card[] }
  }

  for (const file of files) {
    try {
      const raw = JSON.parse(await readFile(join(dir, file), 'utf8'))
      if (raw?.format !== 'HAPPY_BINGO_CARTELLA_SET_V1' || !Array.isArray(raw.cards) || raw.cards.length !== 100) continue
      return {
        setId: String(raw.setId || file.replace(/\.hbc$/i, '')),
        createdAt: String(raw.createdAt || ''),
        cards: raw.cards as Card[],
      }
    } catch (error) {
      logError(`Ignoring invalid Cartella set file ${file}`, error)
    }
  }

  return { setId: 'HB-CUSTOMER-100', createdAt: '2026-08-19', cards: CUSTOMER_CARDS as Card[] }
}

function authDir() {
  return join(app.getPath('appData'), 'Happy Bingo')
}

function authFile() {
  return join(authDir(), 'auth.json')
}

function legacyAuthFile() {
  return join(process.env.APPDATA || process.cwd(), 'Happy Bingo', 'auth.json')
}

function derive(password: string, salt: Buffer) {
  return scryptSync(password, salt, 64)
}

async function readAuthRecord(): Promise<AuthRecord | null> {
  const current = authFile()
  try {
    const value = JSON.parse(await readFile(current, 'utf8'))
    if (typeof value?.salt === 'string' && typeof value?.hash === 'string') return value
  } catch {
    // Fall through to the legacy location.
  }

  const legacy = legacyAuthFile()
  if (legacy !== current) {
    try {
      const value = JSON.parse(await readFile(legacy, 'utf8'))
      if (typeof value?.salt === 'string' && typeof value?.hash === 'string') {
        await mkdir(authDir(), { recursive: true })
        await writeFile(current, JSON.stringify(value), 'utf8')
        return value
      }
    } catch {
      // No legacy record.
    }
  }

  return null
}

async function savePassword(password: string) {
  const salt = randomBytes(32)
  const hash = derive(password, salt)
  await mkdir(authDir(), { recursive: true })
  await writeFile(authFile(), JSON.stringify({ salt: salt.toString('hex'), hash: hash.toString('hex') }), 'utf8')
  if (!(await verifyPassword(password))) throw new Error('Password verification after save failed.')
}

async function verifyPassword(password: string) {
  const record = await readAuthRecord()
  if (!record) return false
  try {
    const expected = Buffer.from(record.hash, 'hex')
    const actual = derive(password, Buffer.from(record.salt, 'hex'))
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch (error) {
    logError('Stored authentication record is invalid', error)
    return false
  }
}

app.whenReady().then(async () => {
  ipcMain.handle('auth-status', async () => {
    try {
      return { needsSetup: !(await readAuthRecord()) }
    } catch (error) {
      logError('auth-status failed', error)
      throw new Error('Authentication storage could not be read.')
    }
  })

  ipcMain.handle('auth-setup', async (_event, currentDefault: string, newPassword: string, confirmPassword: string) => {
    if (currentDefault !== DEFAULT_PASSWORD) return { ok: false, error: 'The default password is incorrect.' }
    if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    if (newPassword !== confirmPassword) return { ok: false, error: 'Passwords do not match.' }
    try {
      await savePassword(newPassword)
      return { ok: true, error: '' }
    } catch (error) {
      logError('auth-setup failed', error)
      return { ok: false, error: 'Could not save the new password on this computer.' }
    }
  })

  ipcMain.handle('auth-unlock', async (_event, password: string) => {
    try {
      const ok = await verifyPassword(password)
      return { ok, error: ok ? '' : 'Incorrect password.' }
    } catch (error) {
      logError('auth-unlock failed', error)
      return { ok: false, error: 'Authentication service error.' }
    }
  })

  ipcMain.handle('play-voice', async (_event, file: string) => getVoiceData(file))

  ipcMain.handle('voice-health', async () => {
    const dir = await ensureVoices()
    const files: string[] = []
    for (const file of ALLOWED_VOICES) {
      try {
        await readFile(join(dir, file))
        files.push(file)
      } catch {
        // Keep the missing file out of the health result.
      }
    }
    return { available: files.length, total: ALLOWED_VOICES.size, files }
  })

  ipcMain.handle('get-installed-set', async () => getInstalledSet())

  protocol.handle(AUDIO_SCHEME, async (request) => {
    const name = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '')
    const canonical = VOICE_BY_KEY.get(name.toLowerCase())
    if (!canonical) return new Response('Not found', { status: 404 })

    try {
      const dir = await ensureVoices()
      const data = await readFile(join(dir, canonical))
      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' },
      })
    } catch (error) {
      logError(`Audio protocol failed for ${canonical}`, error)
      return new Response('Not found', { status: 404 })
    }
  })

  try {
    await ensureVoices()
    const win = createWindow()
    win.on('closed', () => console.log('[Happy Bingo] Main window closed'))
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    logError('Fatal main-process startup failure', error)
    app.quit()
  }
}).catch((error) => {
  logError('app.whenReady startup failed', error)
  app.quit()
})

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
