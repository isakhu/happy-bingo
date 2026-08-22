(() => {
  const BOX_ID = 'happy-bingo-amount-display'

  function numberFromText(value) {
    const n = Number(String(value || '').replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  function render() {
    const game = document.querySelector('.bingo-mode')
    const stage = game?.querySelector('.call-stage')
    if (!game || !stage) {
      document.getElementById(BOX_ID)?.remove()
      return
    }

    let box = document.getElementById(BOX_ID)
    if (!box) {
      box = document.createElement('div')
      box.id = BOX_ID
      box.className = 'amount-display'
      box.setAttribute('aria-hidden', 'true')
      box.innerHTML = '<span>AMOUNT</span><strong>—</strong>'
      stage.appendChild(box)
    }

    const players = numberFromText(game.querySelector('.total-players strong')?.textContent)
    const bet = numberFromText(game.querySelector('.bet-amount strong')?.textContent)
    const total = players * bet
    const payout = Math.max(0, Math.round(total * 0.8))
    const value = box.querySelector('strong')
    if (value) value.textContent = `${payout.toLocaleString()} BIRR`
  }

  const observer = new MutationObserver(render)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  window.addEventListener('load', render, { once: true })
  render()
})()
