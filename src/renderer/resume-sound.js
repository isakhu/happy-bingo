let resumeAudio = null
let resumeBusy = false

async function playResumeSound() {
  if (localStorage.getItem('happy-bingo-voice') === 'off') return
  const bridge = window.happyBingo
  if (!bridge?.playVoice || resumeBusy) return
  resumeBusy = true
  try {
    const url = await bridge.playVoice('chewatawu.mp3')
    if (!url) return
    if (resumeAudio) {
      try { resumeAudio.pause() } catch {}
    }
    resumeAudio = new Audio(url)
    resumeAudio.preload = 'auto'
    resumeAudio.volume = 1
    const speed = Number(localStorage.getItem('happy-bingo-voice-speed') || '1')
    resumeAudio.playbackRate = Number.isFinite(speed) ? Math.min(4, Math.max(.25, speed)) : 1
    await resumeAudio.play()
  } catch (error) {
    console.error('Resume sound failed:', error)
  } finally {
    resumeBusy = false
  }
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('button') : null
  if (!target) return
  const text = target.textContent?.trim().toUpperCase()
  if (text === 'RESUME') void playResumeSound()
})
