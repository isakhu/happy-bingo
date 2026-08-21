/* Offline 7-day revenue ledger and Settings dashboard. Uses the computer's local calendar date. */
(function () {
  const KEY = 'happy-bingo-revenue-7d'
  const TOTAL_KEY = 'happy-bingo-bingo-made'
  const DAY_MS = 86400000

  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}')
      return value && typeof value === 'object' ? value : {}
    } catch { return {} }
  }
  const write = (value) => localStorage.setItem(KEY, JSON.stringify(value))
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
  const addToday = (amount) => {
    const n = Math.max(0, Math.round(Number(amount) || 0))
    if (!n) return
    const data = cleanOld()
    const key = dateKey()
    data[key] = Math.max(0, Number(data[key] || 0)) + n
    write(data)
    render()
  }

  // The game currently persists company revenue through this key when a game ends.
  // Intercept only that specific write so existing game logic remains unchanged.
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

  const money = n => `${Math.round(Number(n) || 0).toLocaleString()} BIRR`
  const formatDate = key => {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function render() {
    cleanOld()
    const modal = document.querySelector('.settings-black, .settings-redesigned')
    const body = modal?.querySelector('.settings-body, .settings-main-real')
    if (!body) return
    let panel = body.querySelector('#hb-revenue-dashboard')
    if (!panel) {
      panel = document.createElement('section')
      panel.id = 'hb-revenue-dashboard'
      panel.innerHTML = '<div class="hb-revenue-head"><div><strong>7-DAY REVENUE</strong><span>Offline daily revenue history</span></div><div class="hb-revenue-total"></div></div><div class="hb-revenue-days"></div>'
      body.appendChild(panel)
    }
    const data = cleanOld()
    const today = new Date()
    const days = []
    let total = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setHours(0, 0, 0, 0)
      d.setDate(today.getDate() - i)
      const key = dateKey(d)
      const amount = Math.max(0, Number(data[key] || 0))
      total += amount
      days.push(`<div class="hb-revenue-day ${i === 0 ? 'today' : ''}"><span>${i === 0 ? 'Today' : formatDate(key)}</span><strong>${money(amount)}</strong></div>`)
    }
    panel.querySelector('.hb-revenue-total').textContent = `7-DAY TOTAL ${money(total)}`
    panel.querySelector('.hb-revenue-days').innerHTML = days.join('')
  }

  const observer = new MutationObserver(render)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.setInterval(cleanOld, 60000)
  window.happyBingoRevenue = { get: cleanOld, add: addToday }
})()
