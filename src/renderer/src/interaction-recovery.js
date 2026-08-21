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
    if (event.__happyBingoRecovered) return
    const target = event.target
    if (isNativeInteractive(target)) return

    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    const button = elements.map(usableButton).find(Boolean)
    if (!button) return

    event.__happyBingoRecovered = true
    event.preventDefault()
    event.stopPropagation()
    button.click()
  }

  function refreshStartButton() {
    const button = document.querySelector('.selection-mode .start-button')
    if (!(button instanceof HTMLButtonElement)) return
    const selected = document.querySelectorAll('.selection-mode .cartella.selected').length
    const voiceBusy = document.querySelector('.selection-mode .start-button[data-voice-busy="true"]')
    if (selected > 0 && !voiceBusy) button.disabled = false
  }

  document.addEventListener('click', recoverClick, true)
  document.addEventListener('pointerup', event => {
    if (event.button === 0) recoverClick(event)
  }, true)

  const observer = new MutationObserver(refreshStartButton)
  observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['class','disabled']})
  window.setInterval(refreshStartButton, 300)
  refreshStartButton()
})()
