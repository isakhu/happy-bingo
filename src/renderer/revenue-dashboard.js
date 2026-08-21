/* Offline 7-day revenue ledger. UI is owned by React; this file never observes or mutates the DOM. */
(() => {
  const KEY = 'happy-bingo-revenue-7d'
  const TOTAL_KEY = 'happy-bingo-bingo-made'

  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}')
      return value && typeof value === 'object' ? value : {}
    } catch { return {} }
  }

  const write = value => localStorage.setItem(KEY, JSON.stringify(value))

  const dateKey = (date = new Date()) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const cleanOld = () => {
    const today = new Date()
    const data = read()
    const kept = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setHours(0, 0, 0, 0)
      d.setDate(today.getDate() - i)
      const key = dateKey(d)
      kept[key] = Math.max(0, Number(data[key] || 0))
    }
    write(kept)
    return kept
  }

  const addToday = amount => {
    const n = Math.max(0, Math.round(Number(amount) || 0))
    if (!n) return
    const data = cleanOld()
    const key = dateKey()
    data[key] = Math.max(0, Number(data[key] || 0)) + n
    write(data)
  }

  cleanOld()

  // Kept only as a backwards-compatible ledger hook. It does not touch the DOM.
  const originalSetItem = Storage.prototype.setItem
  if (!window.__happyBingoRevenueHooked) {
    window.__happyBingoRevenueHooked = true
    Storage.prototype.setItem = function (key, value) {
      if (key === TOTAL_KEY) {
        const previous = Number(localStorage.getItem(TOTAL_KEY) || 0)
        const next = Number(value || 0)
        if (next > previous) addToday(next - previous)
      }
      return originalSetItem.call(this, key, value)
    }
  }

  window.happyBingoRevenue = { get: cleanOld, add: addToday }
})()
