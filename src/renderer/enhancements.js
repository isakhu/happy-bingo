(() => {
  const PASSWORD = '20260817'
  const moneyKey = 'happy-bingo-bingo-made'
  const selectedKey = 'happy-bingo-selected-count'

  const getNumber = (key, fallback = 0) => {
    const n = Number(localStorage.getItem(key) || fallback)
    return Number.isFinite(n) ? n : fallback
  }

  const saveSelectedCount = () => {
    const count = document.querySelectorAll('.cartella.selected').length
    if (count > 0) localStorage.setItem(selectedKey, String(count))
  }

  const updateBingoMade = () => {
    const box = document.querySelector('[data-hb-bingo-made]')
    if (!box) return
    box.querySelector('strong').textContent = `${Math.round(getNumber(moneyKey)).toLocaleString()} BIRR`
  }

  const addBingoMadeCard = () => {
    const modal = document.querySelector('.settings-modal')
    if (!modal || modal.querySelector('[data-hb-bingo-made]')) return
    const card = document.createElement('section')
    card.className = 'hb-money-card'
    card.setAttribute('data-hb-bingo-made', 'true')
    card.innerHTML = '<span>BINGO MADE</span><strong>0 BIRR</strong><small>Manager cut earned across completed games. Read-only.</small>'
    modal.appendChild(card)
    updateBingoMade()
  }

  const showPasswordGate = (button) => {
    if (document.querySelector('[data-hb-password-gate]')) return
    const overlay = document.createElement('div')
    overlay.setAttribute('data-hb-password-gate', 'true')
    overlay.className = 'hb-password-backdrop'
    overlay.innerHTML = `
      <div class="hb-password-card">
        <div class="hb-password-icon">🔒</div>
        <div class="hb-password-kicker">MANAGER ONLY</div>
        <h2>Cartella Building</h2>
        <p>Enter the manager password to build or edit cartellas.</p>
        <input id="hb-password-input" inputmode="numeric" maxlength="8" type="password" placeholder="Password" />
        <div class="hb-password-error" hidden>Incorrect password.</div>
        <div class="hb-password-actions">
          <button data-hb-cancel>Cancel</button>
          <button class="confirm" data-hb-confirm>Unlock</button>
        </div>
      </div>`
    document.body.appendChild(overlay)
    const input = overlay.querySelector('#hb-password-input')
    const error = overlay.querySelector('.hb-password-error')
    const close = () => overlay.remove()
    overlay.querySelector('[data-hb-cancel]').addEventListener('click', close)
    const confirm = () => {
      if (input.value !== PASSWORD) {
        error.hidden = false
        input.focus()
        input.select()
        return
      }
      // The existing React handler expects window.prompt. Supply the verified value once,
      // then trigger the original button. This keeps the existing builder state flow intact.
      const originalPrompt = window.prompt
      let used = false
      window.prompt = () => {
        if (used) return originalPrompt.call(window, 'MANAGER PASSWORD', '')
        used = true
        window.prompt = originalPrompt
        return PASSWORD
      }
      overlay.remove()
      button.dataset.hbBypassed = 'true'
      button.click()
    }
    overlay.querySelector('[data-hb-confirm]').addEventListener('click', confirm)
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm() })
    input.focus()
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return

    if (target.closest('.cartella')) window.setTimeout(saveSelectedCount, 0)

    const builderButton = target.closest('button')
    if (builderButton && /FILL CARTELLA SETTING/i.test(builderButton.textContent || '') && !builderButton.dataset.hbBypassed) {
      event.preventDefault()
      event.stopPropagation()
      showPasswordGate(builderButton)
      return
    }

    if (builderButton?.dataset.hbBypassed) delete builderButton.dataset.hbBypassed

    if (builderButton && /^END$/i.test((builderButton.textContent || '').trim())) {
      const count = getNumber(selectedKey, 0)
      const bet = getNumber('happy-bingo-bet', 0)
      const cut = getNumber('happy-bingo-cut', 0)
      const earned = Math.max(0, count * bet * cut / 100)
      if (earned > 0) {
        localStorage.setItem(moneyKey, String(getNumber(moneyKey) + earned))
        window.setTimeout(updateBingoMade, 80)
      }
    }
  }, true)

  const observer = new MutationObserver(() => {
    saveSelectedCount()
    addBingoMadeCard()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.setTimeout(addBingoMadeCard, 250)
})()
