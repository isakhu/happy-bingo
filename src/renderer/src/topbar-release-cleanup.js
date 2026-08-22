(() => {
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toUpperCase()

  const cleanMetrics = () => {
    document.querySelectorAll('.bingo-mode .game-topbar .game-metrics').forEach(metrics => {
      metrics.querySelectorAll('.game-metric').forEach(metric => {
        const label = normalize(metric.querySelector(':scope > span')?.textContent)
        metric.classList.toggle('total-called-metric', label === 'TOTAL CALLED')
        metric.classList.toggle('obsolete-top-metric', label !== 'TOTAL CALLED')
      })
    })
  }

  const observer = new MutationObserver(cleanMetrics)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  cleanMetrics()
})()
