(() => {
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toUpperCase()

  const cleanMetrics = () => {
    document.querySelectorAll('.bingo-mode .game-topbar .game-metrics').forEach(metrics => {
      const items = Array.from(metrics.querySelectorAll(':scope > .game-metric'))
      items.forEach(metric => {
        const label = normalize(metric.querySelector(':scope > span')?.textContent)
        if (label === 'TOTAL CALLED') {
          metric.classList.add('total-called-metric')
          metric.classList.remove('obsolete-top-metric')

          const labelNode = metric.querySelector(':scope > span')
          if (labelNode) labelNode.textContent = ''

          const valueNode = metric.querySelector(':scope > strong')
          if (valueNode) {
            const raw = Number.parseInt(String(valueNode.textContent || '').replace(/[^0-9]/g, ''), 10)
            const count = Number.isFinite(raw) ? raw : 0
            const nextText = `${Math.min(75, Math.max(0, count))}/75`
            if (valueNode.textContent !== nextText) valueNode.textContent = nextText
          }
        } else {
          metric.remove()
        }
      })
    })
  }

  const observer = new MutationObserver(cleanMetrics)
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  cleanMetrics()
})()
