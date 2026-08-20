(() => {
  const state = { lastError: '' }

  const safeText = (value) => String(value ?? '').replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]))

  function report(title, details) {
    const message = `${title}: ${details}`
    state.lastError = message
    console.error(`[Happy Bingo runtime] ${message}`)

    const root = document.querySelector('#root')
    if (!root) return
    if (document.querySelector('#happy-bingo-runtime-error')) return

    root.innerHTML = `
      <div id="happy-bingo-runtime-error" style="min-height:100vh;display:grid;place-items:center;background:#040D1A;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:24px;box-sizing:border-box">
        <main style="width:min(760px,94vw);background:#07152B;border:1px solid #18365c;border-radius:16px;padding:28px;box-sizing:border-box;box-shadow:0 24px 80px #000b">
          <div style="font-size:26px;font-weight:1000;letter-spacing:2px">HAPPY BINGO</div>
          <h2 style="margin:20px 0 10px">Application error</h2>
          <p style="color:#aebfcc;line-height:1.6;margin:0 0 14px">The application hit an unexpected renderer error. The screen above is intentionally stable so the real error can be diagnosed instead of showing a blank yellow or blue page.</p>
          <pre style="margin:0;padding:14px;background:#040D1A;color:#ff9da5;border:1px solid #18365c;border-radius:10px;white-space:pre-wrap;word-break:break-word">${safeText(message)}</pre>
          <button id="happy-bingo-runtime-reload" style="margin-top:16px;border:0;border-radius:9px;background:#0066FF;color:#fff;padding:11px 18px;font-weight:1000;cursor:pointer">RELOAD APPLICATION</button>
        </main>
      </div>`

    document.querySelector('#happy-bingo-runtime-reload')?.addEventListener('click', () => window.location.reload())
  }

  window.addEventListener('error', (event) => {
    report('Unhandled renderer exception', `${event.message || 'Unknown error'} at ${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? `${event.reason.name}: ${event.reason.message}` : String(event.reason)
    report('Unhandled promise rejection', reason)
  })

  window.addEventListener('happy-bingo-runtime-report', (event) => {
    const detail = event.detail || {}
    report(detail.title || 'Runtime failure', detail.details || 'Unknown runtime failure')
  })

  window.happyBingoRuntime = {
    getLastError: () => state.lastError,
    report,
  }
})()
