(() => {
  const MONEY_KEY = 'happy-bingo-bingo-made'
  const money = () => Number(localStorage.getItem(MONEY_KEY) || '0') || 0
  const saveMoney = n => localStorage.setItem(MONEY_KEY, String(Math.max(0, Math.round(n))))
  const updateMoney = () => document.querySelectorAll('[data-hb-final-money]').forEach(el => {
    const value = el.querySelector('[data-value]'); if (value) value.textContent = `${money().toLocaleString()} BIRR`
  })
  const addMoneyCard = () => {
    const modal = document.querySelector('.settings-modal'); if (!modal) return
    let card = modal.querySelector('[data-hb-final-money]')
    if (!card) {
      card = document.createElement('section')
      card.setAttribute('data-hb-final-money','true')
      card.className = 'hb-final-money-card'
      card.innerHTML = '<div class="hb-final-money-title">💰 BINGO MADE</div><div class="hb-final-money-value" data-value>0 BIRR</div><div class="hb-final-money-note">Manager cut accumulated from completed games on this PC.</div>'
      const grid = modal.querySelector('.settings-grid')
      if (grid) grid.appendChild(card); else modal.appendChild(card)
    }
    updateMoney()
  }
  const hideGameLabels = () => {
    document.querySelectorAll('.game-topbar .live-pill,.game-topbar .pause-status').forEach(el => { el.style.display='none' })
  }
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target.closest('button') : null
    if (!target || !/^END$/i.test((target.textContent || '').trim())) return
    const count = document.querySelectorAll('.cartella.selected').length
    const bet = Number(localStorage.getItem('happy-bingo-bet') || 0)
    const cut = Number(localStorage.getItem('happy-bingo-cut') || 0)
    if (count > 0 && bet > 0 && cut > 0) saveMoney(money() + count * bet * cut / 100)
    updateMoney()
  }, true)
  const observer = new MutationObserver(() => { hideGameLabels(); addMoneyCard(); updateMoney() })
  observer.observe(document.documentElement, {childList:true, subtree:true})
  hideGameLabels(); addMoneyCard(); updateMoney()
})()
