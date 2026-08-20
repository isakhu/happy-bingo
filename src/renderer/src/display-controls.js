(() => {
  const boot = () => {
    if (document.querySelector('.hb-display-controls')) return

    const bar = document.createElement('div')
    bar.className = 'hb-display-controls'
    bar.innerHTML = `
      <button type="button" data-action="fullscreen">FULL SCREEN</button>
      <button type="button" data-action="settings">SETTINGS</button>
      <button type="button" data-action="reset">RESET VIEW</button>
      <span class="hb-display-status">WINDOW</span>
    `
    document.body.appendChild(bar)

    const status = bar.querySelector('.hb-display-status')
    const fullscreenButton = bar.querySelector('[data-action="fullscreen"]')

    const updateStatus = () => {
      const on = document.fullscreenElement != null
      if (status) status.textContent = on ? 'FULL SCREEN' : 'WINDOW'
      fullscreenButton?.classList.toggle('active', on)
      if (fullscreenButton) fullscreenButton.textContent = on ? 'EXIT FULL SCREEN' : 'FULL SCREEN'
    }

    fullscreenButton?.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
        else await document.documentElement.requestFullscreen()
      } catch (error) {
        console.error('[Happy Bingo] Fullscreen toggle failed', error)
        window.dispatchEvent(new CustomEvent('happy-bingo-runtime-report', {
          detail: { title: 'Display control error', details: error instanceof Error ? error.message : String(error) },
        }))
      } finally {
        updateStatus()
      }
    })

    bar.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
      const button = document.querySelector('.top-button')
      if (button instanceof HTMLButtonElement) button.click()
    })

    bar.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      window.scrollTo({ left: 0, top: 0, behavior: 'instant' })
      document.body.style.zoom = '1'
      updateStatus()
    })

    document.addEventListener('fullscreenchange', updateStatus)
    updateStatus()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
