(() => {
  const BUTTON_ID = 'happy-bingo-clear-selected'
  let observer

  function install() {
    if (document.getElementById(BUTTON_ID)) return

    const title = document.querySelector('.selection-title')
    if (!title) return

    const count = title.querySelector('.selection-count')
    if (!count) return

    const button = document.createElement('button')
    button.id = BUTTON_ID
    button.type = 'button'
    button.textContent = 'CLEAR ALL SELECTED'
    button.style.cssText = [
      'margin-right:12px',
      'padding:10px 14px',
      'border:1px solid #d34a4a',
      'border-radius:8px',
      'background:#7f2020',
      'color:#fff',
      'font-weight:900',
      'font-size:11px',
      'letter-spacing:.4px',
      'cursor:pointer',
    ].join(';')

    button.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('.cartella.selected'))
      selected.forEach((card) => {
        if (card instanceof HTMLElement) card.click()
      })
    })

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;'
    wrapper.append(button, count)

    const titleParent = title
    titleParent.replaceChild(wrapper, count)

    const update = () => {
      const anySelected = document.querySelector('.cartella.selected')
      button.disabled = !anySelected
      button.style.opacity = anySelected ? '1' : '.45'
      button.style.cursor = anySelected ? 'pointer' : 'default'
    }

    update()
    const grid = document.querySelector('.cartella-grid')
    if (grid && !observer) {
      observer = new MutationObserver(update)
      observer.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    }
  }

  document.addEventListener('DOMContentLoaded', install)
  const timer = window.setInterval(install, 250)
  window.setTimeout(() => window.clearInterval(timer), 15000)
})()
