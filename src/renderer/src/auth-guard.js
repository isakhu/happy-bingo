let unlocked = sessionStorage.getItem('happy-bingo-authenticated') === '1'

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

function buildGate(needsSetup) {
  const existing = document.querySelector('#happy-bingo-auth-gate')
  if (existing) existing.remove()
  
  const gate = document.createElement('div')
  gate.id = 'happy-bingo-auth-gate'
  gate.style.cssText = 'position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#060913;color:#fff;font-family:"Inter",-apple-system,sans-serif;'
  
  const panel = document.createElement('div')
  panel.style.cssText = 'width:380px;padding:40px;background:linear-gradient(145deg, #101524, #060913);border:1px solid #1A243D;border-radius:24px;box-shadow:0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);text-align:center;display:flex;flex-direction:column;align-items:center;'
  
  const lockIcon = document.createElement('div')
  lockIcon.innerHTML = `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
  lockIcon.style.cssText = 'margin-bottom:24px;padding:24px;background:linear-gradient(145deg, #161D30, #0B0F1C);border-radius:50%;box-shadow:inset 0 4px 10px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.4);display:grid;place-items:center;'

  const title = document.createElement('h2')
  title.textContent = needsSetup ? 'SETUP PIN' : '6 digit code'
  title.style.cssText = 'margin:0 0 12px;font-size:22px;font-weight:700;'
  
  const description = document.createElement('p')
  description.textContent = needsSetup ? 'Create a 6-digit PIN code for this device.' : 'Please enter 6 digit verification code to unlock.'
  description.style.cssText = 'color:#8B9BB4;font-size:13px;line-height:1.6;margin:0 0 28px;'

  const error = document.createElement('div')
  error.id = 'hb-auth-error'
  error.style.cssText = 'min-height:22px;margin:12px 0 16px;color:#EF4444;font-size:13px;font-weight:600;'

  const inputContainer = document.createElement('div')
  inputContainer.style.width = '100%'

  const submit = document.createElement('button')
  submit.id = 'hb-auth-submit'
  submit.type = 'button'
  submit.textContent = needsSetup ? 'SET PIN' : 'UNLOCK'
  submit.style.cssText = 'width:100%;padding:14px;background:linear-gradient(135deg, #2563EB, #1D4ED8);border:none;border-radius:12px;color:#fff;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.4);transition:all 0.2s;'
  submit.addEventListener('mouseover', () => submit.style.filter = 'brightness(1.1)')
  submit.addEventListener('mouseout', () => submit.style.filter = 'none')
  submit.addEventListener('mousedown', () => submit.style.transform = 'scale(0.98)')
  submit.addEventListener('mouseup', () => submit.style.transform = 'none')

  gate.getPassword = () => ''
  gate.getSetupDefault = () => ''
  gate.getSetupNew = () => ''
  gate.getSetupConfirm = () => ''

  if (needsSetup) {
    const makeInput = (id, placeholder) => {
      const el = document.createElement('input')
      el.type = 'password'
      el.placeholder = placeholder
      el.style.cssText = 'display:block;width:100%;margin-bottom:12px;padding:14px;background:#0D1524;border:1px solid #1A243D;border-radius:12px;color:#fff;font-size:16px;outline:none;box-sizing:border-box;'
      el.addEventListener('focus', () => el.style.borderColor = '#3B82F6')
      el.addEventListener('blur', () => el.style.borderColor = '#1A243D')
      el.addEventListener('keydown', (e) => { if(e.key === 'Enter') submit.click() })
      return el
    }
    const def = makeInput('hb-default', 'Default Admin Password')
    const nw = makeInput('hb-new', 'Create 6-Digit PIN')
    const conf = makeInput('hb-confirm', 'Confirm 6-Digit PIN')
    inputContainer.append(def, nw, conf)
    gate.getSetupDefault = () => def.value
    gate.getSetupNew = () => nw.value
    gate.getSetupConfirm = () => conf.value
    window.setTimeout(() => def.focus(), 100)
  } else {
    const group = document.createElement('div')
    group.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-bottom:10px;'
    const inputs = []
    for(let i=0; i<6; i++){
      const input = document.createElement('input')
      input.type = 'text'
      input.maxLength = 1
      input.style.cssText = 'width:42px;height:52px;background:#0D1524;border:1px solid #1A243D;border-radius:12px;color:#fff;font-size:24px;font-weight:700;text-align:center;box-shadow:inset 0 4px 8px rgba(0,0,0,0.3);outline:none;transition:all 0.2s;'
      input.addEventListener('focus', () => { input.style.borderColor = '#3B82F6'; input.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.3), inset 0 4px 8px rgba(0,0,0,0.3)'; })
      input.addEventListener('blur', () => { input.style.borderColor = '#1A243D'; input.style.boxShadow = 'inset 0 4px 8px rgba(0,0,0,0.3)'; })
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '')
        if(input.value && i < 5) inputs[i+1].focus()
      })
      input.addEventListener('keydown', (e) => {
        if(e.key === 'Backspace' && !input.value && i > 0) {
          inputs[i-1].focus()
          inputs[i-1].value = ''
        } else if (e.key === 'Enter') {
          submit.click()
        }
      })
      inputs.push(input)
      group.appendChild(input)
    }
    inputContainer.appendChild(group)
    gate.getPassword = () => inputs.map(x=>x.value).join('')
    window.setTimeout(() => inputs[0].focus(), 100)
  }
  
  const footerLink = document.createElement('div')
  footerLink.textContent = 'Having trouble? Reset device'
  footerLink.style.cssText = 'margin-top:24px;font-size:12px;color:#64748B;cursor:pointer;'
  footerLink.addEventListener('click', () => { error.textContent = 'Contact administrator to reset device.' })

  panel.append(lockIcon, title, description, inputContainer, error, submit, footerLink)
  gate.appendChild(panel)
  document.body.appendChild(gate)
  return gate
}

async function startAuth() {
  if (unlocked) return
  try {
    const auth = await waitForAuthApi()
    const { needsSetup } = await auth.status()
    const gate = buildGate(needsSetup)
    const submit = gate.querySelector('#hb-auth-submit')
    const error = gate.querySelector('#hb-auth-error')
    
    const handleSubmit = async () => {
      error.textContent = ''
      submit.disabled = true
      submit.style.opacity = '0.7'
      try {
        const result = needsSetup
          ? await auth.setup(gate.getSetupDefault(), gate.getSetupNew(), gate.getSetupConfirm())
          : await auth.unlock(gate.getPassword())
          
        if (!result?.ok) {
          error.textContent = result?.error || 'Authentication failed.'
          submit.disabled = false
          submit.style.opacity = '1'
          return
        }
        sessionStorage.setItem('happy-bingo-authenticated','1')
        unlocked = true
        gate.remove()
      } catch (e) {
        error.textContent = 'Authentication could not be completed.'
        submit.disabled = false
        submit.style.opacity = '1'
        console.error(e)
      }
    }
    submit.addEventListener('click', () => void handleSubmit())
  } catch (error) {
    console.error(error)
    const root = document.querySelector('#root')
    if (root) root.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;background:#040D1A;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:20px;box-sizing:border-box"><div><div style="font-size:30px;font-weight:1000;letter-spacing:2px">YZAK BINGO</div><h2 style="margin:18px 0 8px">Startup error</h2><p style="color:#aebfcc;max-width:460px;line-height:1.5">The offline authentication service did not start. Please retry the application.</p><button id="hb-auth-retry" style="margin-top:16px;padding:12px 18px;border:0;border-radius:8px;background:#0066FF;color:#fff;font-weight:800;cursor:pointer">RETRY</button></div></div>'
    root.querySelector('#hb-auth-retry')?.addEventListener('click', () => window.location.reload())
  }
}

const bootAuth = () => void startAuth()
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootAuth, { once: true })
else bootAuth()

export {}
