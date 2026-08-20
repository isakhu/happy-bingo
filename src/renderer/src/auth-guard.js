function waitForAuthApi(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      if (window.happyBingoAuth) return resolve(window.happyBingoAuth)
      if (Date.now() - started >= timeoutMs) return reject(new Error('Authentication API unavailable.'))
      window.setTimeout(check, 50)
    }
    check()
  })
}

function inputStyle() {
  return 'display:block;width:100%;margin-top:10px;padding:14px 16px;border-radius:9px;border:2px solid #42657d;background:#08131d;color:#fff;box-sizing:border-box;font-size:18px;font-weight:700;outline:none;opacity:1;visibility:visible;'
}

function buildGate(needsSetup) {
  const existing = document.querySelector('#happy-bingo-auth-gate')
  if (existing) existing.remove()

  const gate = document.createElement('div')
  gate.id = 'happy-bingo-auth-gate'
  gate.style.cssText = 'position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#08131d;color:#fff;font-family:Arial,Helvetica,sans-serif;opacity:1;visibility:visible;'

  const panel = document.createElement('div')
  panel.style.cssText = 'width:min(440px,92vw);padding:32px;background:#101c26;border:2px solid #1e88e5;border-radius:18px;box-shadow:0 25px 80px #000b;text-align:center;opacity:1;visibility:visible;'

  const brand = document.createElement('div')
  brand.textContent = 'HAPPY BINGO'
  brand.style.cssText = 'font-size:28px;font-weight:1000;letter-spacing:2px;'

  const title = document.createElement('h2')
  title.textContent = needsSetup ? 'FIRST-TIME SETUP' : 'ENTER PASSWORD'
  title.style.cssText = 'margin:18px 0 8px;'

  const description = document.createElement('p')
  description.textContent = needsSetup
    ? 'Enter the default password, then create your own password. Your new password will be required each time the app opens.'
    : 'Enter the password created for this computer.'
  description.style.cssText = 'color:#aebfcc;font-size:13px;line-height:1.5;'

  const error = document.createElement('div')
  error.id = 'hb-auth-error'
  error.style.cssText = 'min-height:22px;margin-top:10px;color:#ff737b;font-size:12px;font-weight:700;'

  const makeInput = (id, placeholder, autocomplete) => {
    const el = document.createElement('input')
    el.id = id
    el.type = 'password'
    el.placeholder = placeholder
    el.autocomplete = autocomplete
    el.style.cssText = inputStyle()
    return el
  }

  const inputs = needsSetup
    ? [
        makeInput('hb-default', 'Default password', 'off'),
        makeInput('hb-new', 'Create new password', 'new-password'),
        makeInput('hb-confirm', 'Confirm new password', 'new-password'),
      ]
    : [makeInput('hb-password', 'Password', 'current-password')]

  const submit = document.createElement('button')
  submit.id = 'hb-auth-submit'
  submit.type = 'button'
  submit.textContent = needsSetup ? 'CREATE PASSWORD' : 'UNLOCK'
  submit.style.cssText = 'display:block;width:100%;margin-top:8px;padding:14px;border:0;border-radius:9px;background:#1e88e5;color:#fff;font-weight:1000;font-size:16px;cursor:pointer;'

  panel.append(brand, title, description, ...inputs, error, submit)
  gate.appendChild(panel)
  document.body.appendChild(gate)

  window.setTimeout(() => inputs[0]?.focus(), 0)
  return gate
}

async function startAuth() {
  if (sessionStorage.getItem('happy-bingo-authenticated') === '1') return

  try {
    const auth = await waitForAuthApi()
    const { needsSetup } = await auth.status()
    const gate = buildGate(needsSetup)

    const submit = gate.querySelector('#hb-auth-submit')
    const error = gate.querySelector('#hb-auth-error')

    const handleSubmit = async () => {
      error.textContent = ''
      submit.disabled = true
      try {
        let result
        if (needsSetup) {
          const currentDefault = gate.querySelector('#hb-default')?.value || ''
          const nextPassword = gate.querySelector('#hb-new')?.value || ''
          const confirm = gate.querySelector('#hb-confirm')?.value || ''
          result = await auth.setup(currentDefault, nextPassword, confirm)
        } else {
          const password = gate.querySelector('#hb-password')?.value || ''
          result = await auth.unlock(password)
        }

        if (!result?.ok) {
          error.textContent = result?.error || 'Authentication failed.'
          submit.disabled = false
          return
        }

        sessionStorage.setItem('happy-bingo-authenticated', '1')
        gate.remove()
      } catch (e) {
        error.textContent = 'Authentication could not be completed.'
        submit.disabled = false
        console.error(e)
      }
    }

    submit.addEventListener('click', () => void handleSubmit())
    gate.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !submit.disabled) void handleSubmit()
    })
  } catch (error) {
    console.error(error)
    const root = document.querySelector('#root')
    if (root) {
      root.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;background:#071a3a;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:20px;box-sizing:border-box"><div><div style="font-size:30px;font-weight:1000;letter-spacing:2px">HAPPY BINGO</div><h2 style="margin:18px 0 8px">Startup error</h2><p style="color:#aebfcc;max-width:460px;line-height:1.5">The offline authentication service did not start. Please retry the application.</p><button id="hb-auth-retry" style="margin-top:16px;padding:12px 18px;border:0;border-radius:8px;background:#1e88e5;color:#fff;font-weight:800;cursor:pointer">RETRY</button></div></div>'
      root.querySelector('#hb-auth-retry')?.addEventListener('click', () => window.location.reload())
    }
  }
}

const bootAuth = () => void startAuth()
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAuth, { once: true })
} else {
  bootAuth()
}
