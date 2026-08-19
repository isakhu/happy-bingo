function buildFallbackCards() {
  const cards = []
  for (let id = 1; id <= 100; id += 1) {
    const values = []
    for (let col = 0; col < 5; col += 1) {
      const min = col * 15 + 1
      const pool = Array.from({ length: 15 }, (_, i) => min + i)
      let seed = (id * 97) + (col * 31)
      for (let i = pool.length - 1; i > 0; i -= 1) {
        seed = (seed * 1664525 + 1013904223) >>> 0
        const j = seed % (i + 1)
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      for (let row = 0; row < 5; row += 1) {
        values[row * 5 + col] = row === 2 && col === 2 ? 0 : pool[row]
      }
    }
    cards.push({ id, values })
  }
  return cards
}

function installCartellaFallback() {
  const bridge = window.happyBingo
  if (!bridge || typeof bridge.getInstalledSet !== 'function') return false
  if (bridge.__happyBingoFallbackInstalled) return true
  const original = bridge.getInstalledSet.bind(bridge)
  bridge.getInstalledSet = async () => {
    try {
      const result = await original()
      if (result?.cards?.length === 100) return result
    } catch (error) {
      console.warn('Customer Cartella IPC unavailable; using built-in test set.', error)
    }
    return {
      setId: 'HB-BUILTIN-100',
      createdAt: new Date().toISOString(),
      cards: buildFallbackCards(),
    }
  }
  Object.defineProperty(bridge, '__happyBingoFallbackInstalled', { value: true })
  return true
}

const started = Date.now()
const timer = window.setInterval(() => {
  if (installCartellaFallback() || Date.now() - started > 10000) window.clearInterval(timer)
}, 50)
installCartellaFallback()
