(() => {
  const TOTAL_ID = 'happy-bingo-total-called-below-recent'

  function install() {
    const gameMetrics = document.querySelector('.game-metrics')
    if (gameMetrics) {
      const metrics = Array.from(gameMetrics.querySelectorAll('.game-metric'))
      for (const metric of metrics) {
        const label = metric.querySelector('span')?.textContent?.trim().toUpperCase()
        if (label === 'TOTAL CALLED') {
          metric.remove()
        }
      }
    }

    const recentPanel = document.querySelector('.recent-panel')
    const recentCalls = document.querySelector('.recent-calls')
    if (!recentPanel || !recentCalls) return

    let total = document.getElementById(TOTAL_ID)
    if (!total) {
      total = document.createElement('div')
      total.id = TOTAL_ID
      total.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'gap:12px',
        'margin-top:14px',
        'padding:10px 16px',
        'border-radius:10px',
        'background:#071a3a',
        'border:1px solid rgba(0,102,255,.35)',
        'box-sizing:border-box',
        'width:100%',
        'color:#fff',
        'font-weight:800',
      ].join(';')
      recentPanel.appendChild(total)
    }

    const heading = document.querySelector('.board-heading strong')
    const match = heading?.textContent?.match(/(\d+)\s*\/\s*75\s*CALLED/i)
    const count = match ? Number(match[1]) : 0
    total.innerHTML = `<span style="font-size:11px;letter-spacing:.5px;opacity:.85;">TOTAL CALLED</span><strong style="font-size:20px;line-height:1;">${count}</strong>`
  }

  const observer = new MutationObserver(install)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  document.addEventListener('DOMContentLoaded', install)
  window.setInterval(install, 500)
})()
