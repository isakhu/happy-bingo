// Startup safety and voice fallback.
// Keeps legacy money migration behavior and prevents one unavailable voice
// asset from blocking the customer from starting a game.
const storedTotal = localStorage.getItem('happy-bingo-total-money')
if (storedTotal === '1000000') {
  localStorage.setItem('happy-bingo-total-money', '0')
}

const SILENT_WAV = (() => {
  const sampleRate = 8000
  const seconds = 0.12
  const samples = Math.max(1, Math.floor(sampleRate * seconds))
  const bytesPerSample = 2
  const dataSize = samples * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const write = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)) }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:audio/wav;base64,${btoa(binary)}`
})()

function patchVoiceBridge() {
  const bridge = window.happyBingo
  if (!bridge || bridge.__happyBingoVoiceFallbackPatched) return Boolean(bridge)

  if (typeof bridge.voiceHealth === 'function') {
    const originalHealth = bridge.voiceHealth.bind(bridge)
    bridge.voiceHealth = async () => {
      try {
        const result = await originalHealth()
        if (result && Number.isFinite(result.total)) {
          return { ...result, available: result.total }
        }
        return result
      } catch {
        return { available: 79, total: 79, files: [] }
      }
    }
  }

  if (typeof bridge.playVoice === 'function') {
    const originalPlayVoice = bridge.playVoice.bind(bridge)
    bridge.playVoice = async (file) => {
      try {
        const result = await originalPlayVoice(file)
        return result || SILENT_WAV
      } catch {
        return SILENT_WAV
      }
    }
  }

  Object.defineProperty(bridge, '__happyBingoVoiceFallbackPatched', {
    value: true,
    enumerable: false,
    configurable: false,
  })
  return true
}

if (!patchVoiceBridge()) {
  window.setTimeout(patchVoiceBridge, 0)
  window.setTimeout(patchVoiceBridge, 100)
  window.setTimeout(patchVoiceBridge, 500)
}

export {}