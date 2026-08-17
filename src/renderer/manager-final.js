(() => {
  const MONEY_KEY = 'happy-bingo-bingo-made'
  const CARDS_KEY = 'happy-bingo-cards'
  const PASSWORD = '20260817'
  const RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]]
  const money = () => Number(localStorage.getItem(MONEY_KEY) || '0') || 0
  const saveMoney = n => localStorage.setItem(MONEY_KEY, String(Math.max(0, Math.round(n))))
  const getCards = () => { try { const x=JSON.parse(localStorage.getItem(CARDS_KEY)||'[]'); return Array.isArray(x)&&x.length===100?x:[] } catch { return [] } }
  const saveCards = x => localStorage.setItem(CARDS_KEY, JSON.stringify(x))
  const updateMoney = () => document.querySelectorAll('[data-hb-final-money]').forEach(el => { const value=el.querySelector('[data-value]'); if(value)value.textContent=`${money().toLocaleString()} BIRR` })
  const addMoneyCard = () => {
    const modal=document.querySelector('.settings-modal'); if(!modal)return
    let card=modal.querySelector('[data-hb-final-money]')
    if(!card){card=document.createElement('section');card.setAttribute('data-hb-final-money','true');card.className='hb-final-money-card';card.innerHTML='<div class="hb-final-money-title">💰 BINGO MADE</div><div class="hb-final-money-value" data-value>0 BIRR</div><div class="hb-final-money-note">Manager cut accumulated from completed games on this PC.</div>';const grid=modal.querySelector('.settings-grid');(grid||modal).appendChild(card)}
    updateMoney()
  }
  const hideGameLabels=()=>document.querySelectorAll('.game-topbar .live-pill,.game-topbar .pause-status').forEach(el=>el.style.display='none')
  function passwordGate(done){
    const old=document.querySelector('.hb-final-password');if(old)return
    const o=document.createElement('div');o.className='hb-final-password';o.innerHTML='<div class="hb-final-password-card"><div class="hb-final-icon">🔐</div><small>MANAGER ONLY</small><h2>Cartella Building</h2><p>Enter the numeric manager password to build the 100 cartellas.</p><input id="hb-final-pass" inputmode="numeric" maxlength="12" type="password" placeholder="PASSWORD"><div id="hb-final-error"></div><div class="hb-final-actions"><button id="hb-final-cancel">CANCEL</button><button id="hb-final-unlock">UNLOCK</button></div></div>'
    document.body.appendChild(o);const input=o.querySelector('#hb-final-pass'),err=o.querySelector('#hb-final-error');
    const submit=()=>{if(input.value!==PASSWORD){err.textContent='Incorrect password';input.focus();input.select();return}o.remove();done()}
    o.querySelector('#hb-final-cancel').onclick=()=>o.remove();o.querySelector('#hb-final-unlock').onclick=submit;input.onkeydown=e=>{if(e.key==='Enter')submit()};input.focus()
  }
  function builder(){
    let cards=getCards(); if(cards.length!==100){alert('The 100 cartellas are not available yet. Generate the 100-card PDF once first.');return}
    let index=0;let values=[...cards[0].values]
    const o=document.createElement('div');o.className='hb-final-builder';o.innerHTML='<div class="hb-final-builder-card"><header><div><small>HAPPY BINGO • MANAGER</small><h2>CARTELLA <span id="hb-fb-num">001</span></h2></div><button id="hb-fb-close">×</button></header><div class="hb-fb-rules">B 1–15 &nbsp; I 16–30 &nbsp; N 31–45 &nbsp; G 46–60 &nbsp; O 61–75 &nbsp; • CENTER FREE</div><div class="hb-fb-head"><b>B</b><b>I</b><b>N</b><b>G</b><b>O</b></div><div id="hb-fb-grid"></div><div id="hb-fb-msg"></div><footer><span>Card <b id="hb-fb-progress">1 / 100</b></span><button id="hb-fb-save">SAVE & NEXT</button></footer></div>'
    document.body.appendChild(o);const grid=o.querySelector('#hb-fb-grid'),msg=o.querySelector('#hb-fb-msg')
    const render=()=>{o.querySelector('#hb-fb-num').textContent=String(index+1).padStart(3,'0');o.querySelector('#hb-fb-progress').textContent=`${index+1} / 100`;grid.innerHTML='';for(let i=0;i<25;i++){const input=document.createElement('input');input.type='number';input.className='hb-fb-cell';if(i===12){input.disabled=true;input.value='FREE';input.classList.add('free')}else{input.value=values[i]||'';input.min=RANGES[i%5][0];input.max=RANGES[i%5][1];input.oninput=e=>values[i]=e.target.value===''?0:Number(e.target.value)}grid.appendChild(input)}msg.textContent=''}
    const valid=()=>{if(values[12]!==0)return false;for(let c=0;c<5;c++){const seen=new Set();for(let r=0;r<5;r++){const i=r*5+c,n=values[i];if(i===12)continue;if(!Number.isInteger(n)||n<RANGES[c][0]||n>RANGES[c][1]||seen.has(n))return false;seen.add(n)}}return true}
    o.querySelector('#hb-fb-close').onclick=()=>o.remove();o.querySelector('#hb-fb-save').onclick=()=>{if(!valid()){msg.textContent='Fill all 24 numbers correctly. No duplicates in a B-I-N-G-O column.';return}cards[index]={id:index+1,values:[...values]};saveCards(cards);if(index===99){msg.textContent='All 100 cartellas saved successfully.';o.querySelector('#hb-fb-save').disabled=true;return}index++;values=[...cards[index].values];render()};render()
  }
  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target.closest('button'):null;if(!target)return
    const text=(target.textContent||'').replace(/🔐|📄|🎫|💰/g,'').trim()
    if(text.includes('CARTELLA BUILDER')){e.preventDefault();e.stopImmediatePropagation();passwordGate(builder);return}
    if(/^END$/i.test(text)){const count=document.querySelectorAll('.cartella.selected').length;const bet=Number(localStorage.getItem('happy-bingo-bet')||0);const cut=Number(localStorage.getItem('happy-bingo-cut')||0);if(count>0&&bet>0&&cut>0)saveMoney(money()+count*bet*cut/100);updateMoney()}
  },true)
  const observer=new MutationObserver(()=>{hideGameLabels();addMoneyCard();updateMoney()});observer.observe(document.documentElement,{childList:true,subtree:true});hideGameLabels();addMoneyCard();updateMoney()
})()
