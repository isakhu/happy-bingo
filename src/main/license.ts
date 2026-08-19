import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAjjP7/0cbuchl7+EYT+aq
ud9Qjm7V3Q57VdM05uSLuKq5I+4bx+LcHWxkJTnxaS6ssSWWJVWbJMS8E+JsNOZT
10Gz4CzKWb695NaktvnrwN4wrlCMDYiVe+YDWiThHOafDEZNk8a2/za7qXR3/FYC
FcBY0zps2+STTcwd3qkeq+wPi8naiGraRQwTWOCngfzlar9+sAHb8hp3borgsa1Z
oag/G4oVfMgRSBX97PFZK6jMNIHH78InCn71G13fa8daJ6MOe3Bpsj3YPpcXHinq
BANkrMpCwOP48fUcZCReA0wqEd2wtAKsezwPDur+/auNIFppNOe0epi/h/F1qIkz
CgDYYt9AWfNX4M8HaWJ7+7X+qG42LvhZpXU4Zd4sdOxMbGR2irUmzJlCjpOdpG9W
n2dHsSYgrO54q7G3kSJdtRJEQnrdj02eqwW2M7Wn9SIu/t2Kht5Jvs0XUYZy8X0u
ilomNjAyMbT60gWR4OCL/pw/2sqwMh3T3q7E9oyARpM7AgMBAAE=
-----END PUBLIC KEY-----`

const activationPath = () => path.join(app.getPath('userData'), 'activation.dat')

export type LicensePayload = { v: number; product: string; customerId: string; expiry: string | null; issued: string }

export function verifyLicense(key: string): LicensePayload | null {
  try {
    const [payloadB64, signatureB64] = key.trim().split('.')
    if (!payloadB64 || !signatureB64) return null
    const publicKey = crypto.createPublicKey(PUBLIC_KEY_PEM)
    if (!crypto.verify('sha256', Buffer.from(payloadB64), publicKey, Buffer.from(signatureB64, 'base64url'))) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as LicensePayload
    if (payload.v !== 1 || payload.product !== 'happy-bingo' || !payload.customerId || !payload.issued) return null
    if (payload.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(payload.expiry)) return null
    if (payload.expiry && new Date(`${payload.expiry}T23:59:59.999Z`).getTime() < Date.now()) return null
    return payload
  } catch { return null }
}

export function getStoredLicense(): LicensePayload | null {
  if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(activationPath())) return null
  try { return verifyLicense(safeStorage.decryptString(fs.readFileSync(activationPath()))) } catch { return null }
}

export function storeLicense(key: string): LicensePayload | null {
  const payload = verifyLicense(key)
  if (!payload || !safeStorage.isEncryptionAvailable()) return null
  fs.mkdirSync(path.dirname(activationPath()), { recursive: true })
  fs.writeFileSync(activationPath(), safeStorage.encryptString(key))
  return payload
}

export function clearStoredLicense(): void { try { fs.rmSync(activationPath(), { force: true }) } catch {} }
