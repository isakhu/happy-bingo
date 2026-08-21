(() => {
  const ID = 'happy-bingo-total-money-made'

  function install() {
    const settings = document.querySelector('.settings-main-real')
    if (!settings) return

    const existing = document.getElementById(ID)
    const tab = settings.querySelector('.settings-section-label')
    const isGeneral = tab?.textContent?.trim().toUpperCase() === 'GENERAL'
    if (!isGeneral) {
      if (existing) existing.remove()
      return
    }

    const left = settings.querySelector('.settings-left-real')
    if (!left) return

    let field = existing
    if (!field) {
      field = document.createElement('div')
      field.id = ID
      field.className = 'settings-field-real'
      field.innerHTML = '<label>Total Money Made (Birr)</label><input readonly />'
      const fields = left.querySelectorAll('.settings-field-real')
      const playerField = fields[fields.length - 1]
      if (playerField) playerField.insertAdjacentElement('afterend', field)
      else left.appendChild(field)
    }

    const input = field.querySelector('input')
    if (!input) return

    const total = Number(localStorage.getItem('happy-bingo-bingo-made') || '0')
    input.value = Math.round(Number.isFinite(total) ? total : 0).toLocaleString()
  }

  const observer = new MutationObserver(install)
  observer.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', install)
  window.setInterval(install, 500)
})()
