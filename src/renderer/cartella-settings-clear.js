(() => {
  const BUTTON_ID = 'happy-bingo-settings-clear-cartellas'

  function addButton() {
    const settings = document.querySelector('.settings-main-real')
    if (!settings || document.getElementById(BUTTON_ID)) return
    const footer = settings.querySelector('.settings-footer-real')
    if (!footer) return

    const button = document.createElement('button')
    button.id = BUTTON_ID
    button.type = 'button'
    button.textContent = 'CLEAR ALL SELECTED CARTELLAS'
    button.style.cssText = 'margin-right:auto;padding:10px 14px;border:1px solid #e53935;border-radius:8px;background:#2b0d12;color:#fff;font-weight:900;cursor:pointer;'
    button.title = 'Clear selected Cartellas for the game. This does not delete the installed Cartella set.'
    button.addEventListener('click', () => {
      const clearSelection = document.querySelector('.clear-selection-button')
      if (clearSelection && !clearSelection.hasAttribute('disabled')) clearSelection.click()
    })
    footer.insertBefore(button, footer.firstChild)
  }

  const observer = new MutationObserver(addButton)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', addButton)
  window.setInterval(addButton, 500)
})()
