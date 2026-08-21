(() => {
  const MONEY_BALANCE_KEY = 'happy-bingo-money-balance'
  const MONEY_REVENUE_KEY = 'happy-bingo-total-revenue-value'
  const MONEY_VERSION_KEY = 'happy-bingo-money-balance-version'
  const MONEY_VERSION = '6'
  const STARTING_MONEY = 10000000

  function getMoneyBalance() {
    const version = localStorage.getItem(MONEY_VERSION_KEY)
    if (version !== MONEY_VERSION) {
      const stored = Number(localStorage.getItem(MONEY_BALANCE_KEY))
      const revenue = Number(localStorage.getItem(MONEY_REVENUE_KEY) || '0')
      if (!Number.isFinite(stored) || stored < 0 || stored === 1000000 || (stored === 0 && revenue === 0)) {
        localStorage.setItem(MONEY_BALANCE_KEY, String(STARTING_MONEY))
      }
      localStorage.setItem(MONEY_VERSION_KEY, MONEY_VERSION)
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

  getMoneyBalance()
  getRevenue()

  // React owns the UI. This legacy helper intentionally does not observe,
  // rewrite, or periodically mutate the DOM because doing so can block clicks.
  window.happyBingoMoney = {
    getBalance: getMoneyBalance,
    getRevenue,
  }
})()
