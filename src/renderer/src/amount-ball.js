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
    const cut = metrics.find(x => x.querySelector('span')?.textContent?.trim() === 'MANAGER CUT')
    if (!bet || !players) return

    const gross = parseAmount(bet.querySelector('strong')?.textContent) * parseAmount(players.querySelector('strong')?.textContent)
    const cutPercent = cut ? parseAmount(cut.querySelector('strong')?.textContent) : 0
    const possibleWin = Math.max(0, gross * (1 - cutPercent / 100))

    let ball = stage.querySelector('.total-amount-ball')
    if (!ball) {
      ball = document.createElement('div')
      ball.className = 'total-amount-ball'
      ball.innerHTML = '<span>POSSIBLE WIN</span><strong>0 Br</strong>'
      stage.appendChild(ball)
    }

    const label = ball.querySelector('span')
    if (label) label.textContent = 'POSSIBLE WIN'

    const value = ball.querySelector('strong')
    const nextText = `${format(possibleWin)} Br`
    if (value && value.textContent !== nextText) value.textContent = nextText
  }

  const timer = window.setInterval(sync, 700)
  sync()
  window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true })
})()
