/* Additive MONEY control for the Cartella Selection screen. Reuses the existing offline revenue ledger. */
(() => {
  const buttonId = 'happy-bingo-money-button'
  const overlayId = 'happy-bingo-money-overlay'

  const format = n => Math.round(Number(n) || 0).toLocaleString()

  function readRevenue() {
    const ledger = window.happyBingoRevenue?.get?.() || {}
    const entries = Object.entries(ledger)
      .map(([date, amount]) => ({ date, amount: Math.max(0, Number(amount) || 0) }))
      .sort((a, b) => b.date.localeCompare(a.date))
    const today = entries[0]?.amount || 0
    const sevenDay = entries.reduce((sum, item) => sum + item.amount, 0)
    const lifetime = Math.max(0, Number(localStorage.getItem('happy-bingo-bingo-made') || 0))
    return { today, sevenDay, lifetime, entries }
  }

  function closeOverlay() {
    document.getElementById(overlayId)?.remove()
  }

  function openOverlay() {
    closeOverlay()
    const data = readRevenue()
    const overlay = document.createElement('div')
    overlay.id = overlayId
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);padding:24px;font-family:Arial,Helvetica,sans-serif;'

    const panel = document.createElement('div')
    panel.style.cssText = 'width:min(680px,94vw);max-height:82vh;overflow:auto;background:#0b1020;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.55);'

    const rows = data.entries.length
      ? data.entries.map(item => `<div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)"><span>${item.date}</span><strong>${format(item.amount)} BIRR</strong></div>`).join('')
      : '<div style="padding:14px;color:#94a3b8">No revenue recorded yet.</div>'

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px">
        <strong style="font-size:24px;font-weight:900;letter-spacing:.02em">MONEY</strong>
        <button type="button" data-money-close style="border:0;background:#1f2937;color:#fff;border-radius:10px;padding:8px 12px;font-size:20px;font-weight:900;cursor:pointer">×</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px">
        <div style="background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px"><div style="font-size:12px;color:#67e8f9;font-weight:800">TODAY</div><div style="font-size:22px;font-weight:900;margin-top:5px">${format(data.today)} BIRR</div></div>
        <div style="background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px"><div style="font-size:12px;color:#fbbf24;font-weight:800">7 DAYS</div><div style="font-size:22px;font-weight:900;margin-top:5px">${format(data.sevenDay)} BIRR</div></div>
        <div style="background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px"><div style="font-size:12px;color:#86efac;font-weight:800">TOTAL</div><div style="font-size:22px;font-weight:900;margin-top:5px">${format(data.lifetime)} BIRR</div></div>
      </div>
      <div style="font-size:13px;color:#94a3b8;font-weight:800;margin-bottom:8px">LAST 7 DAYS</div>
      <div style="border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden">${rows}</div>
    `

    panel.querySelector('[data-money-close]')?.addEventListener('click', closeOverlay)
    overlay.addEventListener('click', event => { if (event.target === overlay) closeOverlay() })
    overlay.appendChild(panel)
    document.body.appendChild(overlay)
  }

  function sync() {
    const selectionMode = document.querySelector('.selection-mode')
    const actions = selectionMode?.querySelector('.top-actions')
    if (!actions) return
    if (!document.getElementById(buttonId)) {
      const settings = actions.querySelector('.top-button')
      if (!settings) return
      const button = document.createElement('button')
      button.id = buttonId
      button.type = 'button'
      button.className = settings.className
      button.textContent = 'MONEY'
      button.addEventListener('click', openOverlay)
      actions.insertBefore(button, settings)
    }
  }

  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true })
  sync()
})()
