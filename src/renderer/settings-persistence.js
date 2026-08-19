(() => {
  const KEYS = {
    bet: 'happy-bingo-bet',
    gap: 'happy-bingo-call-gap',
    cut: 'happy-bingo-cut',
    voice: 'happy-bingo-voice',
    speed: 'happy-bingo-voice-speed',
    starting: 'happy-bingo-company-starting-balance',
    balance: 'happy-bingo-company-balance',
    bingoMade: 'happy-bingo-bingo-made'
  }
  const DEFAULTS = { bet: '', gap: '5', cut: '20', voice: 'on', speed: '1', starting: '10000000' }

  function number(key, fallback) {
    const raw = localStorage.getItem(key)
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  }
  function ensureDefaults() {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (localStorage.getItem(KEYS[key]) === null) localStorage.setItem(KEYS[key], value)
    }
    if (localStorage.getItem(KEYS.bingoMade) === null) localStorage.setItem(KEYS.bingoMade, '0')
    if (localStorage.getItem(KEYS.balance) === null) {
      localStorage.setItem(KEYS.balance, String(number(KEYS.starting, 10000000)))
    }
    const gap = Math.min(15, Math.max(1, number(KEYS.gap, 5)))
    const speed = Math.min(4, Math.max(.25, number(KEYS.speed, 1)))
    const cut = Math.min(100, Math.max(0, number(KEYS.cut, 20)))
    localStorage.setItem(KEYS.gap, String(gap))
    localStorage.setItem(KEYS.speed, String(speed))
    localStorage.setItem(KEYS.cut, String(cut))
  }
  ensureDefaults()

  function saveField(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) return
    const type = el.type
    const label = `${el.getAttribute('aria-label') || ''} ${el.name || ''} ${el.id || ''} ${el.placeholder || ''}`.toLowerCase()
    const parent = (el.parentElement?.parentElement?.innerText || el.parentElement?.innerText || '').toLowerCase()
    const text = `${label} ${parent}`
    let key = null
    if (/bet amount|bet/.test(text)) key = KEYS.bet
    else if (/call gap|gap|second/.test(text) && type !== 'range') key = KEYS.gap
    else if (/manager cut|cut/.test(text)) key = KEYS.cut
    else if (/voice speed|speed/.test(text) || type === 'range' && /voice/.test(text)) key = KEYS.speed
    else if (/starting balance|company balance|initial balance/.test(text)) key = KEYS.starting
    if (!key) return
    let value = el.value
    if (key === KEYS.gap) value = String(Math.min(15, Math.max(1, Number(value) || 1)));
    if (key === KEYS.speed) value = String(Math.min(4, Math.max(.25, Number(value) || 1)));
    if (key === KEYS.cut) value = String(Math.min(100, Math.max(0, Number(value) || 0)));
    if (key === KEYS.starting) value = String(Math.max(0, Number(value) || 0));
    localStorage.setItem(key, value)
    if (key === KEYS.starting && localStorage.getItem(KEYS.bingoMade) === '0') localStorage.setItem(KEYS.balance, value)
  }

  function restoreInputs(root = document) {
    const modal = root.querySelector('.settings-modal')
    if (!modal) return
    const inputs = [...modal.querySelectorAll('input,select')]
    for (const el of inputs) {
      const text = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('name') || ''} ${el.id || ''} ${el.placeholder || ''} ${(el.parentElement?.parentElement?.innerText || el.parentElement?.innerText || '')}`.toLowerCase()
      let key = null
      if (/bet amount|bet/.test(text)) key = KEYS.bet
      else if (/call gap|gap/.test(text) && el.type !== 'range') key = KEYS.gap
      else if (/manager cut|cut/.test(text)) key = KEYS.cut
      else if (/voice speed|speed/.test(text) || (el.type === 'range' && /voice/.test(text))) key = KEYS.speed
      else if (/starting balance|company balance|initial balance/.test(text)) key = KEYS.starting
      if (key && localStorage.getItem(key) !== null) {
        el.value = localStorage.getItem(key)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
    updateMoneyDisplay(modal)
  }

  function updateMoneyDisplay(root = document) {
    const modal = root.querySelector('.settings-modal') || root
    const starting = number(KEYS.starting, 10000000)
    const made = number(KEYS.bingoMade, 0)
    const balance = Math.max(0, starting - made)
    localStorage.setItem(KEYS.balance, String(balance))
    let box = modal.querySelector('[data-company-balance]')
    if (!box) {
      const candidates = [...modal.querySelectorAll('input,div,strong,span,p')]
      box = candidates.find(el => /current balance/i.test(el.textContent || ''))
      if (box) {
        const value = document.createElement('strong')
        value.dataset.companyBalance = '1'
        value.style.cssText = 'display:block;font-size:28px;font-weight:1000;color:#fff;margin-top:6px;text-shadow:2px 3px 0 rgba(0,0,0,.45)'
        value.textContent = `${Math.round(balance).toLocaleString()} BIRR`
        box.appendChild(value)
        box = value
      }
    }
    if (box && 'dataset' in box) box.textContent = `${Math.round(balance).toLocaleString()} BIRR`
  }

  document.addEventListener('input', e => saveField(e.target), true)
  document.addEventListener('change', e => saveField(e.target), true)
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target : null
    if (!target) return
    const button = target.closest('button')
    if (button && /save/i.test(button.textContent || '')) {
      setTimeout(() => { restoreInputs(); updateMoneyDisplay() }, 0)
    }
    if (button && /end game/i.test(button.textContent || '')) {
      setTimeout(() => updateMoneyDisplay(), 80)
    }
    if (button && /settings/i.test(button.textContent || '')) setTimeout(() => restoreInputs(), 0)
  }, true)

  new MutationObserver(() => {
    if (document.querySelector('.settings-modal')) restoreInputs()
    updateMoneyDisplay()
  }).observe(document.documentElement, { childList: true, subtree: true })

  setInterval(() => {
    updateMoneyDisplay()
  }, 1000)
})()
