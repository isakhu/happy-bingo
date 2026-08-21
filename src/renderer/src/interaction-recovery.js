(() => {
  const isNativeInteractive = el => {
    if (!(el instanceof Element)) return false
    return !!el.closest('button, input, select, textarea, a, [role="button"]')
  }

  const usableButton = el => {
    if (!(el instanceof HTMLButtonElement)) return null
    if (el.disabled) return null
    return el
  }

  function recoverClick(event) {
    if (isNativeInteractive(event.target)) return
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    const button = elements.map(usableButton).find(Boolean)
    if (!button) return
    event.preventDefault()
    event.stopPropagation()
    button.click()
  }

  function refreshStartButton() {
    const button = document.querySelector('.selection-mode .start-button')
    if (!(button instanceof HTMLButtonElement)) return
    const selected = document.querySelectorAll('.selection-mode .cartella.selected').length
    if (selected > 0) button.disabled = false
  }

  document.addEventListener('click', recoverClick, true)
  const observer = new MutationObserver(refreshStartButton)
  observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['class','disabled']})
  window.setInterval(refreshStartButton, 300)
  refreshStartButton()
})()
