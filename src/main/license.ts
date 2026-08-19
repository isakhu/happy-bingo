import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
PASTE_PUBLIC_ED25519_KEY_HERE
-----END PUBLIC KEY-----`

const activationPath = () => path.join(app.getPath('userData'), 'activation.dat')

export type LicensePayload = {
  v: number
  product: string
  customerId: string
  expiry: string | null
  issued: string
}

export function verifyLicense(key: string): LicensePayload | null {
  try {
    const [payloadB64, signatureB64] = key.trim().split('.')
    if (!payloadB64 || !signatureB64) return null
    const publicKey = crypto.createPublicKey(PUBLIC_KEY_PEM)
    if (!crypto.verify(null, Buffer.from(payloadB64), publicKey, Buffer.from(signatureB64, 'base64url'))) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as LicensePayload
    if (payload.v !== 1 || payload.product !== 'happy-bingo' || !payload.customerId || !payload.issued) return null
    if (payload.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(payload.expiry)) return null
    if (payload.expiry && new Date(`${payload.expiry}T23:59:59.999Z`).getTime() < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getStoredLicense(): LicensePayload | null {
  if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(activationPath())) return null
  try {
    return verifyLicense(safeStorage.decryptString(fs.readFileSync(activationPath())))
  } catch {
    return null
  }
}

export function storeLicense(key: string): LicensePayload | null {
  const payload = verifyLicense(key)
  if (!payload || !safeStorage.isEncryptionAvailable()) return null
  fs.mkdirSync(path.dirname(activationPath()), { recursive: true })
  fs.writeFileSync(activationPath(), safeStorage.encryptString(key))
  return payload
}

export function clearStoredLicense(): void {
  try { fs.rmSync(activationPath(), { force: true }) } catch {}
}
