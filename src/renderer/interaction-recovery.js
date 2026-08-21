(() => {
  const isRealControl = (el) => {
    if (!(el instanceof HTMLElement)) return false
    if (el.matches('button,input,select,textarea,a,[role="button"]')) return true
    const child = el.closest('button,input,select,textarea,a,[role="button"]')
    return Boolean(child)
  }

  const findUnderlyingControl = (x, y) => {
    const stack = document.elementsFromPoint(x, y)
    for (const el of stack) {
      const button = el instanceof HTMLElement ? el.closest('button,input,select,textarea,a,[role="button"]') : null
      if (!(button instanceof HTMLElement)) continue
      if (button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true') continue
      const rect = button.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      return button
    }
    return null
  }

  window.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    const target = event.target
    if (isRealControl(target)) return

    const control = findUnderlyingControl(event.clientX, event.clientY)
    if (!(control instanceof HTMLElement)) return

    event.preventDefault()
    event.stopPropagation()
    control.click()
  }, true)

  // Decorative pseudo-elements must never become a click target.
  const style = document.createElement('style')
  style.textContent = `
    .app-shell::before,
    .app-shell::after,
    .topbar.game-topbar .brand::before,
    .topbar.game-topbar .brand::after,
    .board-shell::before,
    .board-shell::after,
    .total-amount-ball::before,
    .total-amount-ball::after { pointer-events:none !important; }
  `
  document.head.appendChild(style)
})()
