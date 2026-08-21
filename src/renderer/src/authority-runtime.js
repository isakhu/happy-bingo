(() => {
  // Money is maintained by the React game flow + selection-summary.js.
  // This runtime is intentionally limited to fullscreen support so two
  // independent ledgers cannot disagree or double-charge a completed game.
  function renderFullscreen() {
    let button = document.getElementById('happy-bingo-authoritative-fullscreen')
    if (!button) {
      button = document.createElement('button')
      button.id = 'happy-bingo-authoritative-fullscreen'
      button.type = 'button'
      button.title = 'Toggle full screen'
      document.body.appendChild(button)
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen()
          else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
        } catch (error) { console.error(error) }
      })
      document.addEventListener('fullscreenchange', () => updateFullscreen(button))
    }
    updateFullscreen(button)
  }

  function updateFullscreen(button) {
    button.textContent = document.fullscreenElement ? '⛶ EXIT FULL SCREEN' : '⛶ FULL SCREEN'
  }

  renderFullscreen()
  const observer = new MutationObserver(renderFullscreen)
  observer.observe(document.documentElement, { childList: true, subtree: true })
})()
