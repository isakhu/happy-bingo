(() => {
  const TOTAL_CALLED_ID = 'happy-bingo-total-called-below-recent'
  const REVENUE_ID = 'happy-bingo-total-revenue'
  const BALANCE_ID = 'happy-bingo-current-balance'
  const STARTING_ID = 'happy-bingo-starting-balance'
  const MONEY_BALANCE_KEY = 'happy-bingo-money-balance'
  const MONEY_REVENUE_KEY = 'happy-bingo-total-revenue-value'
  const MONEY_LAST_GAME_KEY = 'happy-bingo-money-last-game'
  const MONEY_VERSION_KEY = 'happy-bingo-money-balance-version'
  const MONEY_VERSION = '5'
  const STARTING_MONEY = 10000000

  function getMoneyBalance() {
    const stored = Number(localStorage.getItem(MONEY_BALANCE_KEY))
    const version = localStorage.getItem(MONEY_VERSION_KEY)
    if (version !== MONEY_VERSION) {
      const revenue = Number(localStorage.getItem(MONEY_REVENUE_KEY) || '0')
      if (!Number.isFinite(stored) || stored < 0 || stored === 1000000 || (stored === 0 && revenue === 0)) localStorage.setItem(MONEY_BALANCE_KEY, String(STARTING_MONEY))
      localStorage.setItem(MONEY_VERSION_KEY, MONEY_VERSION)
      localStorage.removeItem(MONEY_LAST_GAME_KEY)
    }
    const current = Number(localStorage.getItem(MONEY_BALANCE_KEY))
    if (!Number.isFinite(current) || current < 0) {
      localStorage.setItem(MONEY_BALANCE_KEY, String(STARTING_MONEY))
      return STARTING_MONEY
    }
    return Math.round(current)
  }

  function getRevenue() {
    const value = Number(localStorage.getItem(MONEY_REVENUE_KEY) || '0')
    if (!Number.isFinite(value) || value < 0) {
      localStorage.setItem(MONEY_REVENUE_KEY, '0')
      return 0
    }
    return Math.round(value)
  }

  function applyCompletedGameRevenue() {
    const text = document.querySelector('.toast')?.textContent || ''
    const match = text.match(/COMPANY REVENUE \+([\d,]+(?:\.\d+)?)\s*BIRR/i)
    if (!match) return
    const gameId = localStorage.getItem('happy-bingo-game-id') || ''
    if (!gameId || localStorage.getItem(MONEY_LAST_GAME_KEY) === gameId) return
    const revenue = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(revenue) || revenue <= 0) return
    const rounded = Math.round(revenue)
    localStorage.setItem(MONEY_BALANCE_KEY, String(getMoneyBalance() + rounded))
    localStorage.setItem(MONEY_REVENUE_KEY, String(getRevenue() + rounded))
    localStorage.setItem(MONEY_LAST_GAME_KEY, gameId)
  }

  function installTotalCalled() {
    const gameMetrics = document.querySelector('.game-metrics')
    if (gameMetrics) {
      for (const metric of Array.from(gameMetrics.querySelectorAll('.game-metric'))) {
        const label = metric.querySelector('span')?.textContent?.trim().toUpperCase()
        if (label === 'TOTAL CALLED') metric.remove()
      }
    }
    const recentPanel = document.querySelector('.recent-panel')
    const recentCalls = document.querySelector('.recent-calls')
    if (!recentPanel || !recentCalls) return
    let total = document.getElementById(TOTAL_CALLED_ID)
    if (!total) {
      total = document.createElement('div')
      total.id = TOTAL_CALLED_ID
      total.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px;padding:10px 16px;border-radius:10px;background:#071a3a;border:1px solid rgba(0,102,255,.35);box-sizing:border-box;width:100%;color:#fff;font-weight:800;'
      recentPanel.appendChild(total)
    }
    const match = document.querySelector('.board-heading strong')?.textContent?.match(/(\d+)\s*\/\s*75\s*CALLED/i)
    const count = match ? Number(match[1]) : 0
    const value = `<span style="font-size:11px;letter-spacing:.5px;opacity:.85;">TOTAL CALLED</span><strong style="font-size:20px;line-height:1;">${count}</strong>`
    if (total.innerHTML !== value) total.innerHTML = value
  }

  function field(parent, id, label, value) {
    let node = document.getElementById(id)
    if (!node) {
      node = document.createElement('div')
      node.id = id
      node.className = 'settings-field-real'
      node.innerHTML = `<label>${label}</label><input readonly />`
      parent.appendChild(node)
    }
    const input = node.querySelector('input')
    if (input) {
      const next = value.toLocaleString()
      if (input.value !== next) input.value = next
    }
  }

  function installTotalMoneyBalance() {
    const settings = document.querySelector('.settings-main-real')
    if (!settings) return
    if (settings.querySelector('.settings-section-label')?.textContent?.trim().toUpperCase() !== 'GENERAL') return
    const left = settings.querySelector('.settings-left-real')
    if (!left) return
    applyCompletedGameRevenue()
    field(left, STARTING_ID, 'Starting Balance (Birr)', STARTING_MONEY)
    field(left, REVENUE_ID, 'Total Revenue (Birr)', getRevenue())
    field(left, BALANCE_ID, 'Current Balance (Birr)', getMoneyBalance())
  }

  let installing = false
  function install() {
    if (installing) return
    installing = true
    try {
      getMoneyBalance()
      getRevenue()
      applyCompletedGameRevenue()
      installTotalCalled()
      installTotalMoneyBalance()
    } finally {
      installing = false
    }
  }

  getMoneyBalance()
  getRevenue()

  // IMPORTANT: observe structural DOM changes only. Observing attributes/characterData
  // here caused a feedback loop: install() changes the DOM, which triggered install()
  // again continuously and eventually made the whole UI stop accepting clicks.
  const observer = new MutationObserver(() => install())
  observer.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', install)
  window.setInterval(install, 1500)
})()
