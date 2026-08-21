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
    const nextText = `${format(amount)} BIRR`
    if (value && value.textContent !== nextText) value.textContent = nextText
  }

  // Do not observe characterData or continuously mutate the DOM from a
  // MutationObserver. That combination can create an infinite mutation loop
  // and make Electron appear to stop accepting mouse clicks after START GAME.
  const timer = window.setInterval(sync, 700)
  sync()
  window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true })
})()
