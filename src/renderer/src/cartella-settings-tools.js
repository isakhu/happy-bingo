(() => {
  const TOOL_ID = 'happy-bingo-cartella-tools'

  function install() {
    const settings = document.querySelector('.settings-main-real')
    if (!settings) return
    if (document.getElementById(TOOL_ID)) return

    const tab = settings.querySelector('.settings-section-label')?.textContent?.trim().toUpperCase()
    if (tab !== 'GENERAL') return

    const tools = document.createElement('div')
    tools.id = TOOL_ID
    tools.className = 'settings-info-real'
    tools.style.marginTop = '16px'
    tools.innerHTML = `
      <h3>CARTELLA TOOLS</h3>
      <p>Clear every Cartella currently selected for the next game. This does not delete the installed 100-Cartella set.</p>
      <button type="button" id="hb-clear-all-cartellas" class="clear-selection-button" style="width:100%;margin-top:8px;">
        CLEAR ALL SELECTED CARTELLAS
      </button>
    `
    const target = settings.querySelector('.settings-left-real') || settings
    target.appendChild(tools)

    tools.querySelector('#hb-clear-all-cartellas')?.addEventListener('click', () => {
      const clear = document.querySelector('.clear-selection-button:not(#hb-clear-all-cartellas)')
      if (clear && !clear.disabled) {
        clear.click()
        const button = tools.querySelector('#hb-clear-all-cartellas')
        if (button) button.textContent = 'ALL CARTELLAS CLEARED'
        window.setTimeout(() => {
          if (button) button.textContent = 'CLEAR ALL SELECTED CARTELLAS'
        }, 1200)
        return
      }

      const message = document.querySelector('.toast')
      if (message) {
        message.textContent = 'NO CARTELLAS ARE CURRENTLY SELECTED.'
      }
    })
  }

  const observer = new MutationObserver(install)
  const start = () => {
    if (!document.body) return
    observer.observe(document.body, { childList: true, subtree: true })
    install()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
