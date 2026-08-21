(() => {
  const MONEY_TAB_ID = 'happy-bingo-money-tab'
  const MONEY_PANEL_ID = 'happy-bingo-money-panel'
  let active = false

  const fireReactInput = (input, value) => {
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const getFieldInput = (labelText) => {
    const labels = Array.from(document.querySelectorAll('.settings-field-real label'))
    const label = labels.find((node) => node.textContent?.trim().toLowerCase() === labelText.toLowerCase())
    return label?.parentElement?.querySelector('input') || null
  }

  function installTab() {
    const sidebar = document.querySelector('.settings-sidebar-real')
    if (!sidebar || sidebar.querySelector(`#${MONEY_TAB_ID}`)) return

    const button = document.createElement('button')
    button.id = MONEY_TAB_ID
    button.type = 'button'
    button.className = 'settings-tab-real'
    button.innerHTML = '<span>৳</span>MONEY'
    button.addEventListener('click', () => {
      active = true
      renderPanel()
      Array.from(sidebar.querySelectorAll('.settings-tab-real')).forEach((tab) => tab.classList.remove('active'))
      button.classList.add('active')
    })
    sidebar.appendChild(button)
  }

  function renderPanel() {
    const main = document.querySelector('.settings-main-real')
    if (!main || !active) return
    const existing = main.querySelector(`#${MONEY_PANEL_ID}`)
    if (existing) return

    const betInput = getFieldInput('Bet Amount (Birr)')
    const cutInput = getFieldInput('Manager Cut (%)')
    const bet = localStorage.getItem('happy-bingo-bet') || betInput?.value || ''
    const cut = localStorage.getItem('happy-bingo-cut') || cutInput?.value || ''
    const payout = Math.max(0, 100 - Number(cut || 0))
    const revenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0')

    const panel = document.createElement('div')
    panel.id = MONEY_PANEL_ID
    panel.className = 'settings-info-real'
    panel.style.cssText = 'margin-top:24px;display:grid;gap:18px;color:#fff;'
    panel.innerHTML = `
      <h3 style="margin:0;color:#fff;">MONEY</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="settings-field-real">
          <label>Bet Amount (Birr)</label>
          <input id="money-bet-input" inputmode="decimal" value="${String(bet).replace(/"/g, '&quot;')}" />
        </div>
        <div class="settings-field-real">
          <label>Manager Cut (%)</label>
          <input id="money-cut-input" inputmode="decimal" value="${String(cut).replace(/"/g, '&quot;')}" />
        </div>
        <div class="settings-field-real">
          <label>Payout (%)</label>
          <input id="money-payout-input" value="${payout}" readonly />
        </div>
        <div class="settings-field-real">
          <label>Company Revenue (Birr)</label>
          <input value="${Math.round(revenue).toLocaleString()}" readonly />
        </div>
      </div>
      <p style="margin:0;color:#fff;opacity:.8;">Money changes are stored on this PC and used for the current game calculations.</p>
    `

    const originalBet = panel.querySelector('#money-bet-input')
    const originalCut = panel.querySelector('#money-cut-input')
    const payoutInput = panel.querySelector('#money-payout-input')

    originalBet?.addEventListener('input', () => {
      const value = originalBet.value.replace(/[^0-9.]/g, '')
      originalBet.value = value
      localStorage.setItem('happy-bingo-bet', value)
      fireReactInput(betInput, value)
    })

    originalCut?.addEventListener('input', () => {
      const value = originalCut.value.replace(/[^0-9.]/g, '')
      originalCut.value = value
      localStorage.setItem('happy-bingo-cut', value)
      fireReactInput(cutInput, value)
      if (payoutInput) payoutInput.value = String(Math.max(0, 100 - Number(value || 0)))
    })

    const tabs = main.querySelector('.settings-section-label')
    if (tabs) tabs.textContent = 'MONEY'
    const subtitle = main.querySelector('.settings-subtitle')
    if (subtitle) subtitle.textContent = 'Bet, manager cut, payout and revenue'

    const header = main.querySelector('.settings-top-real')
    const existingClose = header?.querySelector('.settings-close-real')
    main.replaceChildren()
    if (header) main.appendChild(header)
    main.appendChild(panel)
    if (header && existingClose) existingClose.addEventListener('click', () => {})
  }

  function observe() {
    installTab()
    if (active) renderPanel()
  }

  const observer = new MutationObserver(observe)
  observer.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', observe)
  window.setInterval(observe, 400)
})()
