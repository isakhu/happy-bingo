(() => {
  const root = () => document.querySelector('.bingo-mode')
  const parseAmount = text => Number(String(text || '').replace(/[^0-9.-]/g, '')) || 0
  const format = n => Math.round(n).toLocaleString()
  function sync() {
    const app = root()
    if (!app) return
    const stage = app.querySelector('.call-stage')
    if (!stage) return
    const metrics = [...app.querySelectorAll('.game-metric')]
    const bet = metrics.find(x => x.querySelector('span')?.textContent?.trim() === 'BET AMOUNT')
    const players = metrics.find(x => x.querySelector('span')?.textContent?.trim() === 'NUMBER OF PLAYERS')
    if (!bet || !players) return
    const amount = parseAmount(bet.querySelector('strong')?.textContent) * parseAmount(players.querySelector('strong')?.textContent)
    let ball = stage.querySelector('.total-amount-ball')
    if (!ball) {
      ball = document.createElement('div')
      ball.className = 'total-amount-ball'
      ball.innerHTML = '<span>TOTAL</span><span>AMOUNT</span><strong>0 BIRR</strong>'
      stage.appendChild(ball)
    }
    const value = ball.querySelector('strong')
    if (value) value.textContent = `${format(amount)} BIRR`
  }
  const observer = new MutationObserver(sync)
  window.setInterval(sync, 500)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  sync()
})()
