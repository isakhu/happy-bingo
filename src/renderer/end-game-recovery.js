(() => {
  let attached = false

  const attach = () => {
    if (attached) return
    const button = document.querySelector('.bingo-mode .bottom-actions .action.end')
    if (!button) return
    attached = true
    button.addEventListener('click', () => {
      window.setTimeout(() => {
        if (document.querySelector('.bingo-mode')) {
          window.location.reload()
        }
      }, 350)
    })
  }

  const observer = new MutationObserver(attach)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  attach()
})()
