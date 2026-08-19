const DEFAULT_PASSWORD = window.happyBingoAuth?.defaultPassword || ''

function buildGate(needsSetup) {
  const gate = document.createElement('div')
  gate.id = 'happy-bingo-auth-gate'
  gate.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#08131d;color:#fff;font-family:Arial,Helvetica,sans-serif;'
  gate.innerHTML = `
    <div style="width:min(440px,92vw);padding:32px;background:#101c26;border:2px solid #1e88e5;border-radius:18px;box-shadow:0 25px 80px #000b;text-align:center">
      <div style="font-size:28px;font-weight:1000;letter-spacing:2px">HAPPY <span style="color:#ffd22f">BINGO</span></div>
      <h2 style="margin:18px 0 8px">${needsSetup ? 'FIRST-TIME SETUP' : 'ENTER PASSWORD'}</h2>
      <p id="hb-auth-help" style="color:#aebfcc;font-size:12px;line-height:1.5">${needsSetup ? 'Enter the default password, then create your own password. Your new password will be required each time the app opens.' : 'Enter the password you created for this computer.'}</p>
      ${needsSetup ? '<input id="hb-default" type="password" placeholder="Default password" autocomplete="off" style="width:100%;margin-top:14px;padding:12px;border-radius:9px;border:1px solid #42657d;background:#08131d;color:#fff;box-sizing:border-box"><input id="hb-new" type="password" placeholder="Create new password" autocomplete="new-password" style="width:100%;margin-top:9px;padding:12px;border-radius:9px;border:1px solid #42657d;background:#08131d;color:#fff;box-sizing:border-box"><input id="hb-confirm" type="password" placeholder="Confirm new password" autocomplete="new-password" style="width:100%;margin-top:9px;padding:12px;border-radius:9px;border:1px solid #42657d;background:#08131d;color:#fff;box-sizing:border-box">' : '<input id="hb-password" type="password" placeholder="Password" autocomplete="current-password" style="width:100%;margin-top:14px;padding:12px;border-radius:9px;border:1px solid #42657d;background:#08131d;color:#fff;box-sizing:border-box">'}
      <div id="hb-auth-error" style="min-height:20px;margin-top:9px;color:#ff737b;font-size:11px;font-weight:700"></div>
      <button id="hb-auth-submit" style="width:100%;margin-top:9px;padding:12px;border:0;border-radius:9px;background:#1e88e5;color:#fff;font-weight:1000">${needsSetup ? 'CREATE PASSWORD' : 'UNLOCK'}</button>
    </div>`
  document.body.appendChild(gate)
  return gate
}

async function startAuth() {
  document.documentElement.style.visibility = 'hidden'
  const auth = window.happyBingoAuth
  if (!auth) {
    document.documentElement.style.visibility = 'visible'
    return
  }

  const { needsSetup } = await auth.status()
  const gate = buildGate(needsSetup)
  document.documentElement.style.visibility = 'visible'

  const submit = gate.querySelector('#hb-auth-submit')
  const error = gate.querySelector('#hb-auth-error')

  submit?.addEventListener('click', async () => {
    if (needsSetup) {
      const currentDefault = gate.querySelector('#hb-default')?.value || ''
      const nextPassword = gate.querySelector('#hb-new')?.value || ''
      const confirm = gate.querySelector('#hb-confirm')?.value || ''
      const result = await auth.setup(currentDefault, nextPassword, confirm)
      if (!result.ok) {
        error.textContent = result.error || 'Could not create password.'
        return
      }
    } else {
      const password = gate.querySelector('#hb-password')?.value || ''
      const result = await auth.unlock(password)
      if (!result.ok) {
        error.textContent = result.error || 'Incorrect password.'
        return
      }
    }
    gate.remove()
  })

  gate.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit?.click()
  })
}

document.addEventListener('DOMContentLoaded', () => void startAuth())
