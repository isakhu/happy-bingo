import { contextBridge, ipcRenderer } from 'electron'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const DEFAULT_PASSWORD = 'HB-2026!'
const AUTH_FILE = join(process.env.APPDATA || process.cwd(), 'Happy Bingo', 'auth.json')

type AuthRecord = { salt: string; hash: string }

async function readAuthRecord(): Promise<AuthRecord | null> {
  try {
    const value = JSON.parse(await readFile(AUTH_FILE, 'utf8'))
    if (typeof value?.salt === 'string' && typeof value?.hash === 'string') return value
  } catch {}
  return null
}

function derive(password: string, salt: Buffer) {
  return scryptSync(password, salt, 64)
}

async function savePassword(password: string) {
  const salt = randomBytes(32)
  const hash = derive(password, salt)
  await mkdir(dirname(AUTH_FILE), { recursive: true })
  await writeFile(AUTH_FILE, JSON.stringify({ salt: salt.toString('hex'), hash: hash.toString('hex') }), 'utf8')
}

async function verifyPassword(password: string) {
  const record = await readAuthRecord()
  if (!record) return false
  try {
    const expected = Buffer.from(record.hash, 'hex')
    const actual = derive(password, Buffer.from(record.salt, 'hex'))
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

contextBridge.exposeInMainWorld('happyBingoAuth', {
  defaultPassword: DEFAULT_PASSWORD,
  status: async () => ({ needsSetup: !(await readAuthRecord()) }),
  setup: async (currentDefault: string, newPassword: string, confirmPassword: string) => {
    if (currentDefault !== DEFAULT_PASSWORD) return { ok: false, error: 'The default password is incorrect.' }
    if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    if (newPassword !== confirmPassword) return { ok: false, error: 'Passwords do not match.' }
    await savePassword(newPassword)
    return { ok: true }
  },
  unlock: async (password: string) => ({ ok: await verifyPassword(password), error: 'Incorrect password.' }),
})

contextBridge.exposeInMainWorld('happyBingo', {
  appName: 'Happy Bingo',
  version: '0.1.0',
  playVoice: (file: string) => ipcRenderer.invoke('play-voice', file),
  voiceHealth: () => ipcRenderer.invoke('voice-health'),
  getInstalledSet: () => ipcRenderer.invoke('get-installed-set'),
})
