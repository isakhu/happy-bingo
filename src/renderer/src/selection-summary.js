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

  // React owns the UI. This helper does not observe, rewrite, or periodically
  // mutate the DOM. A single stylesheet is added for the polished Cartella
  // checking/winner presentation; it never creates or replaces UI elements.
  if (!document.getElementById('happy-bingo-check-screen-style')) {
    const style = document.createElement('style')
    style.id = 'happy-bingo-check-screen-style'
    style.textContent = `
      .check-backdrop{position:fixed!important;inset:0!important;z-index:1000!important;display:grid!important;place-items:center!important;background:rgba(2,7,16,.82)!important;backdrop-filter:blur(8px)!important;padding:24px!important}
      .check-modal{width:min(560px,92vw)!important;background:#07152b!important;border:2px solid #0066ff!important;border-radius:20px!important;box-shadow:0 24px 80px rgba(0,0,0,.65),0 0 35px rgba(0,102,255,.28)!important;overflow:hidden!important;color:#fff!important}
      .check-head{min-height:66px!important;padding:0 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;background:#0b1e3b!important;border-bottom:1px solid #214b80!important}
      .check-head strong{font-size:18px!important;letter-spacing:1.4px!important;color:#fff!important;font-weight:1000!important}
      .check-head button{width:38px!important;height:38px!important;border:0!important;border-radius:10px!important;background:#122d50!important;color:#bcdcff!important;font-size:25px!important;line-height:1!important;cursor:pointer!important}
      .check-head button:hover{background:#0066ff!important;color:#fff!important}
      .check-body{padding:28px!important;display:grid!important;gap:14px!important}
      .check-body label{color:#8fc5ff!important;font-size:12px!important;font-weight:1000!important;letter-spacing:1px!important;text-transform:uppercase!important}
      .check-body input{width:100%!important;box-sizing:border-box!important;background:#040d1a!important;color:#fff!important;border:2px solid #315b8e!important;border-radius:12px!important;padding:16px!important;font-size:25px!important;font-weight:1000!important;text-align:center!important;outline:none!important}
      .check-body input:focus{border-color:#0066ff!important;box-shadow:0 0 0 3px rgba(0,102,255,.22)!important}
      .check-body>button{height:52px!important;border:0!important;border-radius:12px!important;background:#0066ff!important;color:#fff!important;font-weight:1000!important;font-size:15px!important;letter-spacing:.8px!important;cursor:pointer!important;box-shadow:0 8px 22px rgba(0,102,255,.3)!important}
      .check-body>button:hover{filter:brightness(1.12)!important;transform:translateY(-1px)!important}
      .card-inspector{position:fixed!important;inset:0!important;z-index:1100!important;display:grid!important;place-items:center!important;background:rgba(2,7,16,.86)!important;backdrop-filter:blur(7px)!important;padding:24px!important;color:#fff!important}
      .card-inspector>*{box-sizing:border-box!important}
      .card-inspector .winner-card-with-grid,.card-inspector>div{width:min(620px,92vw)!important;max-height:88vh!important;overflow:auto!important;background:#07152b!important;border:2px solid #0066ff!important;border-radius:20px!important;padding:22px!important;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 35px rgba(0,102,255,.22)!important}
      .card-inspector h1,.card-inspector h2,.card-inspector h3{color:#fff!important;font-weight:1000!important}
      .card-inspector .winner-grid{display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:8px!important;margin:18px 0!important}
      .card-inspector .winner-grid-cell{aspect-ratio:1!important;display:grid!important;place-items:center!important;border-radius:10px!important;background:#0d2139!important;color:#9fb4c9!important;border:2px solid #294967!important;font-size:clamp(16px,2.1vw,27px)!important;font-weight:1000!important}
      .card-inspector .winner-grid-cell.marked{background:#063b1b!important;color:#fff!important;border-color:#0aa74b!important}
      .card-inspector .winner-grid-cell.winning{background:#0b9b43!important;color:#fff!important;border-color:#8bffb7!important;box-shadow:0 0 18px rgba(44,255,126,.65)!important;transform:scale(1.04)!important}
      .card-inspector .failed-check{background:#4f1620!important;border:2px solid #ff5264!important;color:#fff!important;border-radius:12px!important;padding:12px 14px!important;font-weight:1000!important}
      .card-inspector .lock-failed-button{width:100%!important;margin-top:12px!important;border:0!important;border-radius:12px!important;background:#ef233c!important;color:#fff!important;padding:14px!important;font-weight:1000!important;font-size:14px!important;cursor:pointer!important;box-shadow:0 0 20px rgba(239,35,60,.35)!important}
      .card-inspector .lock-failed-button:hover{filter:brightness(1.1)!important}
      .card-inspector button{cursor:pointer!important}
      .winner-card-with-grid{width:min(560px,92vw)!important;max-height:90vh!important;overflow:auto!important;background:#07152b!important;border:2px solid #0066ff!important;border-radius:20px!important;padding:22px!important;color:#fff!important;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 35px rgba(0,102,255,.24)!important}
      .winner-card-with-grid .winner-grid{display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:7px!important;margin:14px 0!important}
      .winner-card-with-grid .winner-grid-cell{aspect-ratio:1!important;display:grid!important;place-items:center!important;border-radius:10px!important;background:#0d2139!important;color:#9fb4c9!important;border:2px solid #294967!important;font-weight:1000!important;font-size:clamp(15px,2.1vw,27px)!important}
      .winner-card-with-grid .winner-grid-cell.marked{background:#063b1b!important;color:#fff!important;border-color:#0aa74b!important}
      .winner-card-with-grid .winner-grid-cell.winning{background:#0b9b43!important;color:#fff!important;border-color:#8bffb7!important;box-shadow:0 0 18px rgba(44,255,126,.65)!important;transform:scale(1.04)!important}
    `
    document.head.appendChild(style)
  }

  window.happyBingoMoney = {
    getBalance: getMoneyBalance,
    getRevenue,
  }
})()
