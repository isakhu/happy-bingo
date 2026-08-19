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
