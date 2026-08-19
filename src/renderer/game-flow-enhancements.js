(() => {
  const LOCK_KEY = 'happy-bingo-locked-cartellas'
  const ACTIVE_KEY = 'happy-bingo-active-cartellas'
  const VOICE_ENABLED_KEY = 'happy-bingo-voice'
  const VOICE_SPEED_KEY = 'happy-bingo-voice-speed'
  const letters = ['B', 'I', 'N', 'G', 'O']
  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]]
  let activeCards = new Set()
  let lockedCards = new Set()
  let overlay = null

  const readCards = () => {
    try {
      const cards = JSON.parse(localStorage.getItem('happy-bingo-cards') || '[]')
      return Array.isArray(cards) ? cards : []
    } catch { return [] }
  }
  const loadSet = key => {
    try { return new Set((JSON.parse(localStorage.getItem(key) || '[]') || []).map(Number)) }
    catch { return new Set() }
  }
  const saveSet = (key, set) => localStorage.setItem(key, JSON.stringify([...set]))
  const voiceAllowed = () => localStorage.getItem(VOICE_ENABLED_KEY) !== 'off'

  async function playVoice(file) {
    if (!voiceAllowed() || !window.happyBingo?.playVoice) return
    try {
      const url = await window.happyBingo.playVoice(file)
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.playbackRate = Number(localStorage.getItem(VOICE_SPEED_KEY) || '1') || 1
      audio.volume = 1
      await audio.play()
    } catch (error) {
      console.error('Happy Bingo voice error:', file, error)
    }
  }

  function getCalledNumbers() {
    return new Set([...document.querySelectorAll('.number-cell.called span')]
      .map(el => Number(el.textContent)).filter(Number.isInteger))
  }

  function winningPatterns(card, called) {
    if (!card || !Array.isArray(card.values) || card.values.length !== 25) return []
    const marked = card.values.map((n, i) => i === 12 || called.has(n))
    const defs = []
    for (let r = 0; r < 5; r++) defs.push({ label: `Horizontal row ${r + 1}`, indexes: Array.from({length:5}, (_, c) => r * 5 + c) })
    for (let c = 0; c < 5; c++) defs.push({ label: `Vertical column ${c + 1}`, indexes: Array.from({length:5}, (_, r) => r * 5 + c) })
    defs.push(
      { label: 'Diagonal ↘', indexes: [0,6,12,18,24] },
      { label: 'Diagonal ↙', indexes: [4,8,12,16,20] },
      { label: 'Four corners', indexes: [0,4,20,24] }
    )
    return defs.filter(x => x.indexes.every(i => marked[i]))
  }

  function clearOverlay() {
    if (overlay) overlay.remove()
    overlay = null
  }

  function cardMarkup(card, called, wins) {
    const winning = new Set(wins.flatMap(w => w.indexes))
    return `<div class="hb-verify-card-grid">${card.values.map((n, i) => {
      const marked = i === 12 || called.has(n)
      return `<div class="hb-verify-cell ${marked ? 'marked' : ''} ${winning.has(i) ? 'winning' : ''}">${i === 12 ? 'FREE' : n}</div>`
    }).join('')}</div>`
  }

  function showResult(card, wins) {
    clearOverlay()
    const valid = wins.length > 0
    const called = getCalledNumbers()
    overlay = document.createElement('div')
    overlay.className = `hb-verify-overlay ${valid ? 'success' : 'failure'}`
    overlay.innerHTML = `
      <div class="hb-verify-modal">
        <div class="hb-verify-icon">${valid ? '✓' : '✕'}</div>
        <div class="hb-verify-title">${valid ? 'GOOD BINGO!' : 'NOT A BINGO'}</div>
        <div class="hb-verify-subtitle">CARTELLA ${String(card.id).padStart(3,'0')}</div>
        ${cardMarkup(card, called, wins)}
        <div class="hb-verify-reason">${valid ? wins.map(w => w.label).join(' + ') : 'The claimed Cartella does not contain a complete winning pattern.'}</div>
        ${valid
          ? '<div class="hb-verify-status">✓ EXACT WINNING PATTERN<br><small>Good Bingo voice is playing automatically.</small></div>'
          : '<div class="hb-verify-status">Manager confirmation required before the Cartella voice is played.</div>'}
        <div class="hb-verify-actions">
          ${valid ? '<button class="hb-verify-close">CLOSE</button>' : '<button class="hb-verify-play-lock">🔊 PLAY VOICE + LOCK</button><button class="hb-verify-close">CLOSE</button>'}
        </div>
      </div>`
    document.body.appendChild(overlay)
    overlay.querySelector('.hb-verify-close').onclick = clearOverlay
    if (valid) {
      lockedCards.add(card.id)
      saveSet(LOCK_KEY, lockedCards)
      void playVoice('Goodbingo.mp3')
    } else {
      overlay.querySelector('.hb-verify-play-lock').onclick = async () => {
        const button = overlay.querySelector('.hb-verify-play-lock')
        button.disabled = true
        button.textContent = '🔒 LOCKING...'
        await playVoice('cartellawu.mp3')
        lockedCards.add(card.id)
        saveSet(LOCK_KEY, lockedCards)
        button.textContent = '✓ LOCKED'
        button.classList.add('locked')
      }
    }
  }

  function verify(id) {
    if (!activeCards.has(id)) return showMessage(`Cartella ${String(id).padStart(3,'0')} is not active in this game.`)
    if (lockedCards.has(id)) return showMessage(`Cartella ${String(id).padStart(3,'0')} is locked and cannot be checked again.`)
    const card = readCards().find(c => Number(c.id) === id)
    if (!card) return showMessage('Cartella data could not be found.')
    const wins = winningPatterns(card, getCalledNumbers())
    showResult(card, wins)
  }

  function showMessage(text) {
    clearOverlay()
    const box = document.createElement('div')
    box.className = 'hb-flow-toast'
    box.textContent = text
    document.body.appendChild(box)
    setTimeout(() => box.remove(), 2600)
  }

  function createMetrics() {
    if (document.querySelector('.hb-top-metrics')) return
    const topbar = document.querySelector('.game-topbar')
    const main = document.querySelector('.bingo-main')
    if (!topbar || !main) return
    const metrics = document.createElement('section')
    metrics.className = 'hb-top-metrics'
    metrics.innerHTML = `
      <div class="hb-metric bet"><span>BET AMOUNT</span><strong data-hb-bet>—</strong></div>
      <div class="hb-metric players"><span>NUMBER OF PLAYERS</span><strong data-hb-players>0</strong></div>
      <div class="hb-metric payout"><span>PAY OUT</span><strong data-hb-payout>—</strong></div>`
    main.prepend(metrics)
  }

  function updateMetrics() {
    const bet = localStorage.getItem('happy-bingo-bet') || ''
    const cut = Number(localStorage.getItem('happy-bingo-cut') || '0')
    const playerCount = activeCards.size
    const total = bet === '' ? null : playerCount * Number(bet || 0)
    const payout = total === null ? null : Math.max(0, total - total * cut / 100)
    const betEl = document.querySelector('[data-hb-bet]')
    const playersEl = document.querySelector('[data-hb-players]')
    const payoutEl = document.querySelector('[data-hb-payout]')
    if (betEl) betEl.textContent = bet === '' ? '—' : `${bet} BIRR`
    if (playersEl) playersEl.textContent = String(playerCount)
    if (payoutEl) payoutEl.textContent = payout === null ? '—' : `${Math.round(payout).toLocaleString()} BIRR`
  }

  function isGameScreen() { return !!document.querySelector('.bingo-mode') }
  function isPaused() {
    const button = [...document.querySelectorAll('.bottom-actions .action')].find(b => /PAUSE|RESUME/i.test(b.textContent || ''))
    return !!button && /RESUME/i.test(button.textContent || '')
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target) return

    if (target.matches('.cartella')) {
      setTimeout(() => {
        activeCards = new Set([...document.querySelectorAll('.cartella.selected')].map(b => Number(b.textContent)).filter(Number.isInteger))
      }, 0)
      return
    }

    if (target.matches('.start-button')) {
      activeCards = new Set([...document.querySelectorAll('.cartella.selected')].map(b => Number(b.textContent)).filter(Number.isInteger))
      lockedCards = new Set()
      saveSet(ACTIVE_KEY, activeCards)
      saveSet(LOCK_KEY, lockedCards)
      setTimeout(updateMetrics, 250)
      return
    }

    if (target.matches('.action.check')) {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!isPaused()) return showMessage('Pause the game before checking a Bingo claim.')
      const input = prompt('CARTELLA NUMBER\nEnter 001–100:')
      if (input === null) return
      const id = Number(String(input).replace(/\D/g, ''))
      if (!Number.isInteger(id) || id < 1 || id > 100) return showMessage('Enter a valid Cartella number from 001 to 100.')
      verify(id)
      return
    }

    if (target.matches('.action.pause')) {
      const wasPause = /PAUSE/i.test(target.textContent || '')
      if (wasPause) void playVoice('pause.mp3')
      return
    }

    if (target.matches('.action.end')) {
      clearOverlay()
      activeCards = new Set()
      lockedCards = new Set()
      saveSet(ACTIVE_KEY, activeCards)
      saveSet(LOCK_KEY, lockedCards)
      return
    }
  }, true)

  const observer = new MutationObserver(() => {
    if (isGameScreen()) {
      createMetrics()
      updateMetrics()
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  activeCards = loadSet(ACTIVE_KEY)
  lockedCards = loadSet(LOCK_KEY)
  setInterval(() => { if (isGameScreen()) { createMetrics(); updateMetrics() } }, 700)
})()
