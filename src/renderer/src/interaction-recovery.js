(() => {
  /*
   * START GAME is guarded in React by startGame() itself.
   * Do not use the native disabled state, because legacy CSS/layers can make
   * a visible disabled control appear permanently unclickable.
   */
  function repairStartGameButton() {
    const button = document.querySelector('.selection-mode .start-button')
    if (!(button instanceof HTMLButtonElement)) return

    if (button.disabled) {
      button.disabled = false
    }
    button.style.pointerEvents = 'auto'
    button.style.position = 'relative'
    button.style.zIndex = '1000'
    button.style.cursor = 'pointer'
  }

  repairStartGameButton()

  const observer = new MutationObserver(() => repairStartGameButton())
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'style'],
  })

  window.setInterval(repairStartGameButton, 250)
})()
