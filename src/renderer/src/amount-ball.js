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

    const gross = parseAmount(bet.querySelector('strong')?.textContent) * parseAmount(players.querySelector('strong')?.textContent)
    const cutPercent = parseAmount(localStorage.getItem('happy-bingo-cut') || '0')
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

    const latestCall = stage.querySelector('.latest-call')
    if (latestCall) {
      let counter = latestCall.querySelector('.total-called-box')
      if (!counter) {
        counter = document.createElement('div')
        counter.className = 'total-called-box'
        counter.innerHTML = '<span>TOTAL CALLED</span><strong>0/75</strong>'
        latestCall.appendChild(counter)
      }
      const total = app.querySelectorAll('.recent-calls .recent-ball').length
      const called = Math.min(75, total)
      const counterValue = counter.querySelector('strong')
      if (counterValue) counterValue.textContent = `${called}/75`
    }
  }

  const timer = window.setInterval(sync, 700)
  sync()
  window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true })
})()
