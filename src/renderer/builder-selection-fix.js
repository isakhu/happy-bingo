(() => {
  const PASSWORD = '20260817'
  const KEY = 'happy-bingo-cards'
  const LETTERS = ['B','I','N','G','O']
  const RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]]
  let cards = []
  let index = 0

  const readCards = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]')
      if (Array.isArray(value) && value.length === 100) return value
    } catch (_) {}
    return Array.from({length:100}, (_,i) => ({id:i+1, values:Array.from({length:25}, (_,j)=>j===12?0:0)}))
  }
  const writeCards = () => localStorage.setItem(KEY, JSON.stringify(cards))

  const valid = card => {
    if (!card || !Array.isArray(card.values) || card.values.length !== 25 || card.values[12] !== 0) return false
    for (let col=0; col<5; col++) {
      const [min,max] = RANGES[col], seen = new Set()
      for (let row=0; row<5; row++) {
        const pos=row*5+col
        if (pos===12) continue
        const n=Number(card.values[pos])
        if (!Number.isInteger(n) || n<min || n>max || seen.has(n)) return false
        seen.add(n)
      }
    }
    return true
  }

  const closeAll = () => document.querySelectorAll('.hb-builder-overlay,.hb-password-overlay').forEach(x=>x.remove())

  function openPassword() {
    if (document.querySelector('.hb-password-overlay')) return
    const o=document.createElement('div'); o.className='hb-password-overlay'
    o.innerHTML=`<div class="hb-password-panel">
      <h3>🔐 Manager Cartella Builder</h3>
      <p>Enter the manager password to create or edit all 100 cartellas.</p>
      <input id="hb-password-input" type="password" inputmode="numeric" autocomplete="off" placeholder="PASSWORD" />
      <div class="hb-password-error" id="hb-password-error"></div>
      <div class="hb-password-actions"><button class="hb-password-cancel">CANCEL</button><button class="hb-password-unlock">UNLOCK</button></div>
    </div>`
    document.body.appendChild(o)
    const input=o.querySelector('#hb-password-input'), error=o.querySelector('#hb-password-error')
    const unlock=()=>{ if(input.value!==PASSWORD){error.textContent='Incorrect password';input.focus();input.select();return} o.remove(); openBuilder() }
    o.querySelector('.hb-password-cancel').onclick=()=>o.remove()
    o.querySelector('.hb-password-unlock').onclick=unlock
    input.onkeydown=e=>{if(e.key==='Enter')unlock();if(e.key==='Escape')o.remove()}
    input.focus()
  }

  function openBuilder() {
    cards=readCards(); index=0
    const o=document.createElement('div'); o.className='hb-builder-overlay'
    o.innerHTML=`<div class="hb-builder-panel">
      <div class="hb-builder-top"><div><small>HAPPY BINGO • MANAGER</small><h2>Cartella Builder <span id="hb-builder-number">001</span></h2></div><button class="hb-builder-close">×</button></div>
      <div class="hb-builder-rules"><span>B 1–15</span><span>I 16–30</span><span>N 31–45</span><span>G 46–60</span><span>O 61–75</span><span>CENTER = FREE</span></div>
      <div class="hb-builder-grid" id="hb-builder-grid"></div>
      <div class="hb-builder-controls"><button class="hb-builder-prev">← PREVIOUS</button><span class="hb-builder-status" id="hb-builder-status">1 / 100</span><button class="hb-builder-save">SAVE CARTELLA</button><button class="hb-builder-next">NEXT →</button></div>
    </div>`
    document.body.appendChild(o)
    o.querySelector('.hb-builder-close').onclick=()=>o.remove()
    o.querySelector('.hb-builder-prev').onclick=()=>{saveCurrent(false);index=Math.max(0,index-1);render()}
    o.querySelector('.hb-builder-next').onclick=()=>{if(!saveCurrent(false))return;index=Math.min(99,index+1);render()}
    o.querySelector('.hb-builder-save').onclick=()=>{if(!saveCurrent(true))return;if(index<99){index++;render()}else{writeCards();o.remove();showToast('All 100 Cartellas saved successfully.')}}
    render()
  }

  function render() {
    const card=cards[index]
    document.querySelector('#hb-builder-number').textContent=String(index+1).padStart(3,'0')
    document.querySelector('#hb-builder-status').textContent=`${index+1} / 100`
    const grid=document.querySelector('#hb-builder-grid'); grid.innerHTML=''
    for(let i=0;i<25;i++){
      const input=document.createElement('input'); input.type='number'; input.className='hb-builder-input'
      if(i===12){input.type='text';input.value='FREE';input.disabled=true;input.classList.add('hb-free')}
      else {input.value=card.values[i] || '';input.min=RANGES[i%5][0];input.max=RANGES[i%5][1];input.addEventListener('input',e=>card.values[i]=e.target.value===''?0:Number(e.target.value))}
      grid.appendChild(input)
    }
  }

  function saveCurrent(showError) {
    const card=cards[index]
    if(!valid(card)){if(showError)showToast('Invalid Cartella. Check B/I/N/G/O ranges and duplicate numbers.');return false}
    cards[index]={id:index+1,values:[...card.values]};writeCards();return true
  }

  function showToast(text){
    const old=document.querySelector('.hb-builder-toast');if(old)old.remove()
    const t=document.createElement('div');t.className='hb-builder-toast';t.textContent=text
    Object.assign(t.style,{position:'fixed',left:'50%',bottom:'28px',transform:'translateX(-50%)',zIndex:1000001,background:'#e31b23',color:'#fff',padding:'14px 22px',borderRadius:'12px',fontWeight:'900',boxShadow:'0 12px 30px rgba(0,0,0,.35)'})
    document.body.appendChild(t);setTimeout(()=>t.remove(),2800)
  }

  function hook() {
    const buttons=[...document.querySelectorAll('button')]
    buttons.forEach(btn=>{
      if(btn.dataset.hbBuilderHooked==='1')return
      const text=(btn.textContent||'').replace(/[🔐📄🎫💰]/g,'').trim().toUpperCase()
      if(text.includes('BUILD / EDIT 100 CARTELLAS')){
        btn.dataset.hbBuilderHooked='1'
        btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openPassword()},true)
      }
    })
  }
  new MutationObserver(hook).observe(document.documentElement,{childList:true,subtree:true})
  hook()
})()
