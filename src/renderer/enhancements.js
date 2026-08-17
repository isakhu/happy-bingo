(() => {
  const PASSWORD = '20260817'
  const CARDS_KEY = 'happy-bingo-cards'
  const MONEY_KEY = 'happy-bingo-bingo-made'

  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]]
  const letters = ['B','I','N','G','O']
  const money = () => Number(localStorage.getItem(MONEY_KEY) || '0') || 0
  const selectedCount = () => document.querySelectorAll('.cartella.selected').length
  const cards = () => { try { const c = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'); return Array.isArray(c) && c.length === 100 ? c : [] } catch { return [] } }
  const saveCards = (c) => localStorage.setItem(CARDS_KEY, JSON.stringify(c))
  const cardValues = id => { const c = cards().find(x => x.id === id); return c?.values || null }
  const addMoney = amount => { if (amount > 0) localStorage.setItem(MONEY_KEY, String(money() + amount)) }
  const updateMoneyCards = () => document.querySelectorAll('[data-hb-bingo-made]').forEach(el => { const strong = el.querySelector('strong'); if (strong) strong.textContent = `${Math.round(money()).toLocaleString()} BIRR` })

  const closeOverlay = el => el?.remove()

  function passwordGate(onSuccess) {
    if (document.querySelector('.hb-password-backdrop')) return
    const overlay = document.createElement('div')
    overlay.className = 'hb-password-backdrop'
    overlay.innerHTML = `<div class="hb-password-card"><div class="hb-password-icon">🔒</div><div class="hb-password-kicker">MANAGER ONLY</div><h2>Cartella Building</h2><p>Build and save the 100 cartellas manually on this PC.</p><input id="hb-pass" type="password" inputmode="numeric" maxlength="12" placeholder="Manager password"/><div class="hb-password-error" hidden>Incorrect password</div><div class="hb-password-actions"><button data-cancel>Cancel</button><button class="confirm" data-ok>Unlock</button></div></div>`
    document.body.appendChild(overlay)
    const input = overlay.querySelector('#hb-pass')
    const error = overlay.querySelector('.hb-password-error')
    const close = () => closeOverlay(overlay)
    overlay.querySelector('[data-cancel]').onclick = close
    const submit = () => {
      if (input.value !== PASSWORD) { error.hidden = false; input.focus(); input.select(); return }
      close()
      onSuccess()
    }
    overlay.querySelector('[data-ok]').onclick = submit
    input.onkeydown = e => { if (e.key === 'Enter') submit() }
    input.focus()
  }

  function blankCard(id) { return { id, values: Array.from({length:25}, (_,i) => i === 12 ? 0 : 0) } }
  function validCard(card) {
    for (let col=0; col<5; col++) {
      const [min,max] = ranges[col], seen = new Set()
      for (let row=0; row<5; row++) {
        const idx = row*5+col, n = card.values[idx]
        if (idx===12) continue
        if (!Number.isInteger(n) || n < min || n > max || seen.has(n)) return false
        seen.add(n)
      }
    }
    return card.values[12] === 0
  }

  function builder() {
    let index = 0
    let draft = blankCard(1)
    const overlay = document.createElement('div')
    overlay.className = 'hb-builder-backdrop'
    overlay.innerHTML = `<div class="hb-builder"><div class="hb-builder-head"><div><span>HAPPY BINGO</span><small>MANAGER • CARTELLA BUILDING</small><h2>Cartella <b id="hb-card-num">001</b></h2></div><button data-close>×</button></div><div class="hb-builder-body"><div class="hb-builder-rules">B 1–15 &nbsp; I 16–30 &nbsp; N 31–45 &nbsp; G 46–60 &nbsp; O 61–75 &nbsp; • &nbsp; CENTER = FREE</div><div class="hb-builder-grid" id="hb-builder-grid"></div><div class="hb-builder-message" id="hb-builder-message"></div></div><div class="hb-builder-footer"><span>Card <b id="hb-progress">1</b> / 100</span><button class="save-next" id="hb-save">SAVE & NEXT</button></div></div>`
    document.body.appendChild(overlay)
    const grid = overlay.querySelector('#hb-builder-grid')
    const msg = overlay.querySelector('#hb-builder-message')
    const render = () => {
      const num = String(index+1).padStart(3,'0')
      overlay.querySelector('#hb-card-num').textContent = num
      overlay.querySelector('#hb-progress').textContent = String(index+1)
      grid.innerHTML = ''
      letters.forEach((letter,col) => {
        const head = document.createElement('div'); head.className = `hb-builder-letter ${letter.toLowerCase()}`; head.textContent = letter; grid.appendChild(head)
        for (let row=0; row<5; row++) {
          const cell = document.createElement('input'); cell.className='hb-builder-cell'; cell.inputMode='numeric'; cell.type='number'
          const idx = row*5+col
          if (idx===12) { cell.disabled=true; cell.value='FREE'; cell.classList.add('free') }
          else { const v=draft.values[idx]; cell.value=v?String(v):''; cell.min=ranges[col][0]; cell.max=ranges[col][1] }
          cell.oninput = e => { if (idx!==12) draft.values[idx]=e.target.value===''?0:Number(e.target.value) }
          grid.appendChild(cell)
        }
      })
      msg.textContent=''
    }
    overlay.querySelector('[data-close]').onclick = () => closeOverlay(overlay)
    overlay.querySelector('#hb-save').onclick = () => {
      if (!validCard(draft)) { msg.textContent='Fill all 24 cells correctly. Numbers must follow the B-I-N-G-O column ranges and cannot repeat within a column.'; return }
      const all = cards()
      all[index] = draft
      saveCards(all)
      if (index===99) { msg.textContent='All 100 cartellas saved successfully. Reloading the game…'; window.setTimeout(()=>window.location.reload(),500); return }
      index += 1; draft = blankCard(index+1); render()
    }
    render()
  }

  function calledSetFromBoard() {
    const set = new Set()
    document.querySelectorAll('.number-cell.called span').forEach(s => { const n=Number(s.textContent); if (n) set.add(n) })
    return set
  }

  const checkLines = [
    ...Array.from({length:5},(_,r)=>({type:'horizontal',row:r,idx:[0,1,2,3,4].map(c=>r*5+c)})),
    ...Array.from({length:5},(_,c)=>({type:'vertical',col:c,idx:[0,1,2,3,4].map(r=>r*5+c)})),
    {type:'diag-down',idx:[0,6,12,18,24]},
    {type:'diag-up',idx:[4,8,12,16,20]},
    {type:'four-corners',idx:[0,4,20,24]},
  ]

  function verificationOverlay() {
    if (document.querySelector('.hb-check-backdrop')) return
    const overlay=document.createElement('div'); overlay.className='hb-check-backdrop'
    overlay.innerHTML='<div class="hb-check-box"><div class="hb-check-title">CHECK CARTELLA</div><input id="hb-check-id" inputmode="numeric" maxlength="3" placeholder="001"/><button class="hb-check-go">CHECK</button><button class="hb-check-cancel">CANCEL</button></div>'
    document.body.appendChild(overlay)
    const input=overlay.querySelector('#hb-check-id')
    const run=()=>{
      const id=Number(input.value), vals=cardValues(id), called=calledSetFromBoard()
      if (!vals) { input.value=''; input.placeholder='Invalid cartella'; input.focus(); return }
      const result=document.createElement('div'); result.className='hb-result-backdrop'
      const marked=vals.map((n,i)=>i===12 || called.has(n))
      const wins=checkLines.filter(line=>line.idx.every(i=>marked[i]))
      const green=new Set(wins.flatMap(x=>x.idx))
      const status=wins.length>0
      result.innerHTML=`<div class="hb-result"><div class="hb-result-title">CARTELLA ${String(id).padStart(3,'0')}</div><div class="hb-result-card"><div class="hb-result-grid" id="hb-result-grid"></div><div class="hb-shapes" id="hb-shapes"></div></div><div class="hb-result-status ${status?'valid':'invalid'}">${status?'✓ VALID BINGO':'✕ NOT BINGO'}</div><button class="hb-result-close">CLOSE</button></div>`
      document.body.appendChild(result); closeOverlay(overlay)
      const g=result.querySelector('#hb-result-grid')
      vals.forEach((n,i)=>{const c=document.createElement('div'); c.className=`hb-result-cell ${marked[i]?'called':''} ${green.has(i)?'winning':''}`; c.textContent=i===12?'FREE':String(n); g.appendChild(c)})
      const shapes=result.querySelector('#hb-shapes')
      wins.forEach(w=>{
        const el=document.createElement('div'); el.className=`hb-shape ${w.type}`; if(w.type==='horizontal')el.style.top=`${w.row*20+10}%`; if(w.type==='vertical')el.style.left=`${w.col*20+10}%`; shapes.appendChild(el)
      })
      result.querySelector('.hb-result-close').onclick=()=>closeOverlay(result)
    }
    overlay.querySelector('.hb-check-go').onclick=run
    overlay.querySelector('.hb-check-cancel').onclick=()=>closeOverlay(overlay)
    input.onkeydown=e=>{if(e.key==='Enter')run()}
    input.focus()
  }

  function addBingoMadeCard() {
    const modal=document.querySelector('.settings-modal')
    if (!modal || modal.querySelector('[data-hb-bingo-made]')) return
    const box=document.createElement('section'); box.className='hb-money-card'; box.setAttribute('data-hb-bingo-made','true')
    box.innerHTML='<span>💰 BINGO MADE</span><strong>0 BIRR</strong><small>Manager cut accumulated from completed games. Read-only.</small>'
    const moneySection=Array.from(modal.querySelectorAll('section')).find(s=>/MANAGER CUT/i.test(s.textContent||''))
    ;(moneySection||modal).appendChild(box)
    updateMoneyCards()
  }

  document.addEventListener('click', e => {
    const el=e.target instanceof Element ? e.target.closest('button') : null
    if (!el) return
    const text=(el.textContent||'').trim()
    if (/FILL CARTELLA SETTING/i.test(text)) { e.preventDefault(); e.stopImmediatePropagation(); passwordGate(builder); return }
    if (text==='CHECK' && document.querySelector('.bingo-mode')) { e.preventDefault(); e.stopImmediatePropagation(); verificationOverlay(); return }
    if (/^END$/i.test(text)) {
      const count=selectedCount(), bet=Number(localStorage.getItem('happy-bingo-bet')||0), cut=Number(localStorage.getItem('happy-bingo-cut')||0)
      addMoney(Math.max(0,count*bet*cut/100)); window.setTimeout(updateMoneyCards,100)
    }
  }, true)

  const observer=new MutationObserver(()=>{addBingoMadeCard(); updateMoneyCards()})
  observer.observe(document.documentElement,{childList:true,subtree:true})
  window.setTimeout(addBingoMadeCard,300)

  // Audio fallback: if the preload bridge is missing, use Node's Electron IPC from the renderer.
  try {
    if ((!window.happyBingo || typeof window.happyBingo.playVoice !== 'function') && typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      window.happyBingo = { ...(window.happyBingo || {}), playVoice: (file) => ipcRenderer.invoke('play-voice', file) }
    }
  } catch (err) { console.error('Happy Bingo audio fallback unavailable', err) }
})()
