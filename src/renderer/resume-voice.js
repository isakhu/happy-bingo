(() => {
  let bypass = false
  document.addEventListener('click', async (event) => {
    if (bypass) return
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target || target.textContent?.trim() !== 'RESUME') return
    const api = window.happyBingo
    if (!api?.playVoice) return
    event.preventDefault()
    event.stopPropagation()
    try {
      const url = await api.playVoice('chewatawu.mp3')
      await new Promise((resolve, reject) => {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume = 1
        const speed = Number(localStorage.getItem('happy-bingo-voice-speed') || '1')
        audio.playbackRate = Number.isFinite(speed) ? Math.min(4, Math.max(.25, speed)) : 1
        audio.onended = resolve
        audio.onerror = reject
        void audio.play().catch(reject)
      })
    } catch (error) {
      console.error('Resume voice failed', error)
    } finally {
      bypass = true
      target.click()
      bypass = false
    }
  }, true)
})()
