(() => {
  const sync = () => {
    const button = document.querySelector('.selection-mode .start-button')
    if (!button) return
    const hasSelection = document.querySelectorAll('.selection-mode .cartella.selected').length > 0
    if (hasSelection) button.removeAttribute('disabled')
    else button.setAttribute('disabled', '')
    button.style.pointerEvents = 'auto'
    button.style.position = 'relative'
    button.style.zIndex = '10000'
  }

  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] })
  window.setInterval(sync, 250)
  sync()
})()
