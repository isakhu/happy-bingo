(() => {
  const TOTAL_CALLED_ID = 'happy-bingo-total-called-below-recent'
  const TOTAL_MONEY_ID = 'happy-bingo-total-money-made'
  const MONEY_BALANCE_KEY = 'happy-bingo-money-balance'
  const MONEY_LAST_GAME_KEY = 'happy-bingo-money-last-game'
  const STARTING_MONEY = 10000000

  function getMoneyBalance() {
    const stored = Number(localStorage.getItem(MONEY_BALANCE_KEY))
    if (!Number.isFinite(stored) || stored < 0) {
      localStorage.setItem(MONEY_BALANCE_KEY, String(STARTING_MONEY))
      return STARTING_MONEY
    }
    return stored
  }

  function applyCompletedGameRevenue() {
    const toast = document.querySelector('.toast')
    const text = toast?.textContent || ''
    const match = text.match(/COMPANY REVENUE \+([\d,]+(?:\.\d+)?)\s*BIRR/i)
    if (!match) return

    const gameId = localStorage.getItem('happy-bingo-game-id') || ''
    if (!gameId) return

    const lastGame = localStorage.getItem(MONEY_LAST_GAME_KEY)
    if (lastGame === gameId) return

    const revenue = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(revenue) || revenue <= 0) return

    const next = Math.max(0, getMoneyBalance() - Math.round(revenue))
    localStorage.setItem(MONEY_BALANCE_KEY, String(next))
    localStorage.setItem(MONEY_LAST_GAME_KEY, gameId)
  }

  function installTotalCalled() {
    const gameMetrics = document.querySelector('.game-metrics')
    if (gameMetrics) {
      const metrics = Array.from(gameMetrics.querySelectorAll('.game-metric'))
      for (const metric of metrics) {
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
      total.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'gap:12px',
        'margin-top:14px',
        'padding:10px 16px',
        'border-radius:10px',
        'background:#071a3a',
        'border:1px solid rgba(0,102,255,.35)',
        'box-sizing:border-box',
        'width:100%',
        'color:#fff',
        'font-weight:800',
      ].join(';')
      recentPanel.appendChild(total)
    }

    const heading = document.querySelector('.board-heading strong')
    const match = heading?.textContent?.match(/(\d+)\s*\/\s*75\s*CALLED/i)
    const count = match ? Number(match[1]) : 0
    total.innerHTML = `<span style="font-size:11px;letter-spacing:.5px;opacity:.85;">TOTAL CALLED</span><strong style="font-size:20px;line-height:1;">${count}</strong>`
  }

  function installTotalMoneyMade() {
    const settings = document.querySelector('.settings-main-real')
    if (!settings) return

    const tab = settings.querySelector('.settings-section-label')
    const isGeneral = tab?.textContent?.trim().toUpperCase() === 'GENERAL'
    const existing = document.getElementById(TOTAL_MONEY_ID)

    if (!isGeneral) {
      existing?.remove()
      return
    }

    const left = settings.querySelector('.settings-left-real')
    if (!left) return

    let field = existing
    if (!field) {
      field = document.createElement('div')
      field.id = TOTAL_MONEY_ID
      field.className = 'settings-field-real'
      field.innerHTML = '<label>Total Money (Birr)</label><input readonly />'
      const fields = left.querySelectorAll('.settings-field-real')
      const playerField = fields[fields.length - 1]
      if (playerField) playerField.insertAdjacentElement('afterend', field)
      else left.appendChild(field)
    }

    const input = field.querySelector('input')
    if (!input) return

    applyCompletedGameRevenue()
    const total = getMoneyBalance()
    input.value = Math.round(total).toLocaleString()
  }

  function install() {
    applyCompletedGameRevenue()
    installTotalCalled()
    installTotalMoneyMade()
  }

  getMoneyBalance()

  const observer = new MutationObserver(install)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true })
  document.addEventListener('DOMContentLoaded', install)
  window.setInterval(install, 500)
})()
