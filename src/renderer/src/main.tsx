import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './game-overrides.css'

const LETTERS = ['B','I','N','G','O'] as const
const RANGES: Record<string,[number,number]> = { B:[1,15], I:[16,30], N:[31,45], G:[46,60], O:[61,75] }
const CARD_COUNT = 100
const MANAGER_PASSWORD = '20260817'
type Card = { id:number; values:number[] }
type Called = { letter:string; number:number }

declare global { interface Window { happyBingo?: { generateCardsPdf?:()=>Promise<{cards:Card[];path:string}>; playVoice?:(file:string)=>Promise<string> } } }

const letterOf = (n:number) => n<=15?'B':n<=30?'I':n<=45?'N':n<=60?'G':'O'
const pool75 = () => Array.from({length:75},(_,i)=>i+1)

function generateCards():Card[]{
  return Array.from({length:CARD_COUNT},(_,id)=>{
    const cols = LETTERS.map((letter,col)=>{
      const [min,max]=RANGES[letter]; const a=Array.from({length:max-min+1},(_,i)=>min+i)
      let seed=(id+1)*97+min*31
      for(let i=a.length-1;i>0;i--){ seed=(seed*1664525+1013904223)>>>0; const j=seed%(i+1); [a[i],a[j]]=[a[j],a[i]] }
      return a.slice(0,5)
    })
    return {id:id+1,values:Array.from({length:25},(_,i)=>i===12?0:cols[i%5][Math.floor(i/5)])}
  })
}
function loadCards():Card[]{
  try { const saved=JSON.parse(localStorage.getItem('happy-bingo-cards')||'null'); if(Array.isArray(saved)&&saved.length===100)return saved } catch{}
  const cards=generateCards(); localStorage.setItem('happy-bingo-cards',JSON.stringify(cards)); return cards
}
const emptyCard=(id:number):Card=>({id,values:Array.from({length:25},(_,i)=>i===12?0:0)})
const validCard=(card:Card)=>{
  if(card.values.length!==25)return false
  for(let col=0;col<5;col++){
    const letter=LETTERS[col], [min,max]=RANGES[letter], seen=new Set<number>()
    for(let row=0;row<5;row++){
      const i=row*5+col,n=card.values[i]
      if(i===12)continue
      if(!Number.isInteger(n)||n<min||n>max||seen.has(n))return false
      seen.add(n)
    }
  }
  return card.values[12]===0
}
function playElement(url:string,rate:number){
  return new Promise<void>((resolve,reject)=>{
    const a=new Audio(url); a.preload='auto'; a.playbackRate=rate
    const done=()=>{a.onended=null;a.onerror=null;resolve()}; const fail=()=>{a.onended=null;a.onerror=null;reject(new Error('Audio playback failed'))}
    a.onended=done; a.onerror=fail; void a.play().catch(fail)
  })
}

function App(){
  const [cards,setCards]=useState<Card[]>(loadCards)
  const [selected,setSelected]=useState<Set<number>>(new Set())
  const [started,setStarted]=useState(false), [paused,setPaused]=useState(false)
  const [called,setCalled]=useState<Called[]>([]), [remaining,setRemaining]=useState(pool75)
  const [locked,setLocked]=useState<Set<number>>(new Set()), [voicePlaying,setVoicePlaying]=useState(false)
  const [voiceEnabled,setVoiceEnabled]=useState(()=>localStorage.getItem('happy-bingo-voice')!=='off')
  const [voiceSpeed,setVoiceSpeed]=useState(()=>Number(localStorage.getItem('happy-bingo-voice-speed')||'1'))
  const [callGap,setCallGap]=useState(()=>Number(localStorage.getItem('happy-bingo-call-gap')||'3'))
  const [settingsOpen,setSettingsOpen]=useState(false), [message,setMessage]=useState('')
  const [cardSource,setCardSource]=useState<'printed'|'pdf'>(()=>(localStorage.getItem('happy-bingo-card-source') as 'printed'|'pdf')||'printed')
  const [generatingPdf,setGeneratingPdf]=useState(false), [checkOpen,setCheckOpen]=useState(false), [verifyInput,setVerifyInput]=useState('')
  const [winner,setWinner]=useState<number|null>(null), [inspectionCard,setInspectionCard]=useState<number|null>(null), [winningIndexes,setWinningIndexes]=useState<number[]>([])
  const [betAmount,setBetAmount]=useState(()=>localStorage.getItem('happy-bingo-bet')||''), [cutPercent,setCutPercent]=useState(()=>localStorage.getItem('happy-bingo-cut')||'')
  const [totalMoneyMade,setTotalMoneyMade]=useState(()=>Math.max(0,Number(localStorage.getItem('happy-bingo-total-money-made')||'0')))
  const [manualSetup,setManualSetup]=useState(false), [setupIndex,setSetupIndex]=useState(0), [draftCard,setDraftCard]=useState<Card>(()=>emptyCard(1))
  const current=called[0]||null, calledSet=useMemo(()=>new Set(called.map(x=>x.number)),[called])
  const currentAmount=betAmount===''?null:selected.size*Number(betAmount||0), cutAmount=currentAmount===null?null:currentAmount*Number(cutPercent||0)/100, prize=currentAmount===null?null:Math.max(0,currentAmount-(cutAmount||0))

  async function voice(file:string){
    if(!voiceEnabled)return
    if(!window.happyBingo?.playVoice){setMessage('VOICE SYSTEM NOT AVAILABLE IN THIS BUILD.');return}
    setVoicePlaying(true); setMessage('')
    try { const url=await window.happyBingo.playVoice(file); await playElement(url,voiceSpeed) }
    catch(e){ console.error(e); setMessage(`VOICE ERROR: ${file}`) }
    finally{setVoicePlaying(false)}
  }
  function toggleCard(id:number){if(started)return;setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})}
  async function startGame(){
    if(!selected.size)return setMessage('Select at least one cartella.')
    if(selected.size&&cards.some(c=>selected.has(c.id)&&!validCard(c)))return setMessage('Finish every selected cartella before starting.')
    setCalled([]);setRemaining(pool75());setLocked(new Set());setWinner(null);setInspectionCard(null);setWinningIndexes([]);setPaused(false);setCheckOpen(false);setVerifyInput('');setStarted(true);await voice('chewatawu.mp3')
  }
  async function drawNext(){
    if(!started||paused||voicePlaying||!remaining.length)return
    const number=remaining[Math.floor(Math.random()*remaining.length)],letter=letterOf(number)
    setRemaining(p=>p.filter(n=>n!==number));setCalled(p=>[{letter,number},...p]);await voice(`${letter.toLowerCase()}${number}.mp3`)
  }
  useEffect(()=>{if(!started||paused||voicePlaying||!remaining.length)return;const t=window.setTimeout(()=>void drawNext(),called.length===0?900:Math.max(.5,callGap)*1000);return()=>window.clearTimeout(t)},[started,paused,voicePlaying,remaining.length,called.length,callGap])
  function endGame(){
    if(!window.confirm('End this game and return to cartella selection?'))return
    if(currentAmount!==null&&Number.isFinite(currentAmount)&&currentAmount>0){setTotalMoneyMade(p=>{const n=p+currentAmount;localStorage.setItem('happy-bingo-total-money-made',String(n));return n})}
    setStarted(false);setPaused(false);setCalled([]);setRemaining(pool75());setLocked(new Set());setWinner(null);setInspectionCard(null);setWinningIndexes([]);setCheckOpen(false);setVerifyInput('');setMessage('')
  }
  function winningLines(card:Card){
    const marked=card.values.map((n,i)=>i===12||calledSet.has(n))
    const lines:number[][]=[]
    for(let r=0;r<5;r++)lines.push(Array.from({length:5},(_,c)=>r*5+c))
    for(let c=0;c<5;c++)lines.push(Array.from({length:5},(_,r)=>r*5+c))
    lines.push([0,6,12,18,24],[4,8,12,16,20],[0,4,20,24])
    return lines.filter(line=>line.every(i=>marked[i]))
  }
  async function checkWinner(){
    const id=Number(verifyInput),card=cards.find(c=>c.id===id)
    if(!Number.isInteger(id)||id<1||id>100||!card)return setMessage('Enter a valid cartella number from 001 to 100.')
    if(!selected.has(id))return setMessage(`Cartella ${String(id).padStart(3,'0')} is not active.`)
    if(!validCard(card))return setMessage(`Cartella ${String(id).padStart(3,'0')} is not configured correctly.`)
    setInspectionCard(id)
    if(locked.has(id)){setCheckOpen(false);await voice('cartellawu.mp3');return setMessage(`CARTELLA ${String(id).padStart(3,'0')} IS LOCKED.`)}
    const lines=winningLines(card);setWinningIndexes(lines.flat());setCheckOpen(false)
    if(!lines.length){setLocked(p=>new Set(p).add(id));await voice('cartellawu.mp3');return setMessage(`CARTELLA ${String(id).padStart(3,'0')} LOCKED — INVALID BINGO.`)}
    await voice('Goodbingo.mp3');setWinner(id)
  }
  function saveCards(next:Card[]){setCards(next);localStorage.setItem('happy-bingo-cards',JSON.stringify(next))}
  function openManualSetup(){
    const password=window.prompt('MANAGER PASSWORD\nEnter the numeric password to open Cartella Building:')
    if(password!==MANAGER_PASSWORD){setMessage('Incorrect manager password.');return}
    const first=cards[0]||emptyCard(1);setManualSetup(true);setSetupIndex(0);setDraftCard({...emptyCard(1),id:first.id});setSettingsOpen(false);setMessage('Cartella Builder unlocked. Fill Cartella 001, then press SAVE & NEXT.')
  }
  function updateDraft(index:number,value:string){const n=value===''?0:Number(value);setDraftCard(p=>({...p,values:p.values.map((v,i)=>i===index?n:v)}))}
  function saveDraftAndNext(){
    if(!validCard(draftCard))return setMessage('Fill all 24 number cells correctly. B 1–15, I 16–30, N 31–45, G 46–60, O 61–75. Center is FREE.')
    const next=cards.map(c=>c.id===draftCard.id?draftCard:c);saveCards(next)
    if(setupIndex===CARD_COUNT-1){setManualSetup(false);setMessage('All 100 cartellas are saved.');return}
    const ni=setupIndex+1;setSetupIndex(ni);setDraftCard(emptyCard(ni+1));setMessage(`Cartella ${String(draftCard.id).padStart(3,'0')} saved. Now fill Cartella ${String(ni+1).padStart(3,'0')}.`)
  }
  async function createPdf(){
    if(!window.happyBingo?.generateCardsPdf)return setMessage('PDF generation is available in the Windows build.')
    setGeneratingPdf(true);try{const r=await window.happyBingo.generateCardsPdf();saveCards(r.cards);setCardSource('pdf');localStorage.setItem('happy-bingo-card-source','pdf');setSelected(new Set());setMessage('New 100-cartella PDF created.')}catch{setMessage('Could not create the PDF.')}finally{setGeneratingPdf(false)}
  }
  const settings=<SettingsModal {...{cardSource,setCardSource,voiceEnabled,setVoiceEnabled,voiceSpeed,setVoiceSpeed,callGap,setCallGap,betAmount,setBetAmount,cutPercent,setCutPercent,totalMoneyMade,generatingPdf,createPdf,openManualSetup,testVoice:()=>void voice('b1.mp3'),onClose:()=>setSettingsOpen(false)}} />

  if(!started)return <div className="app-shell selection-mode">
    <header className="topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="ready-pill">● READY</span><button className="top-button" onClick={()=>setSettingsOpen(true)}>SETTING</button></div></header>
    <main className="selection-screen">{manualSetup?<ManualBuilder card={draftCard} index={setupIndex} message={message} update={updateDraft} save={saveDraftAndNext}/>:<>
      <div className="selection-title"><div><small>CARTELLA SELECTION</small><h1>Select cards for this game</h1></div><div className="selection-count"><b>{selected.size}</b><span>/ 100</span></div></div>
      <section className="selection-panel"><div className="selection-panel-head"><strong>001 — 100</strong><span>{cardSource==='printed'?'PRINTED CARTELLA':'GENERATED CARTELLA'}</span></div><div className="cartella-grid">{Array.from({length:100},(_,i)=>i+1).map(id=><button key={id} className={`cartella ${selected.has(id)?'selected':''}`} onClick={()=>toggleCard(id)}>{String(id).padStart(3,'0')}</button>)}</div></section>
      <button className="start-button" onClick={startGame} disabled={!selected.size||voicePlaying}>START GAME</button>{message&&<div className="toast">{message}</div>}
    </>}</main>{settingsOpen&&settings}
  </div>

  return <div className="app-shell bingo-mode">
    <header className="topbar game-topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="live-pill">● LIVE</span><span className={`pause-status ${paused?'is-paused':''}`}>{paused?'PAUSED':'AUTO CALL'}</span></div></header>
    <main className="bingo-main">
      <section className="live-header"><div className="current-wrap"><div className="marquee-ball"><span>{current?.letter||'—'}</span><strong>{current?.number??'—'}</strong></div><div className="fraction">{called.length}/75</div></div><div className="recent-calls">{called.slice(0,14).map((x,i)=><div key={`${x.number}-${i}`} className={`recent-ball ${x.letter.toLowerCase()} ${i===0?'latest':''}`}><span>{x.letter}</span>{x.number}</div>)}</div></section>
      <section className="prize-banner">PRIZE {prize===null?'—':Math.round(prize).toLocaleString()}</section>
      <section className="board-shell"><div className="board-grid">{LETTERS.map((letter,row)=><div className="board-row" key={letter}><div className={`letter-badge ${letter.toLowerCase()}`}>{letter}</div>{Array.from({length:15},(_,i)=>i+1+row*15).map(n=>{const is=calledSet.has(n);return <div key={n} className={`number-cell ${is?`called ${letterOf(n).toLowerCase()}`:''} ${current?.number===n?'latest':''}`}><span>{n}</span></div>})}</div>)}</div></section>
      <section className="bottom-bar"><div className="game-id">Game ID <strong>100029-YAXT</strong></div><div className="bottom-actions"><button className="action setting" onClick={()=>setSettingsOpen(true)}>SETTING</button><button className="action end" onClick={endGame}>END</button><button className="action check" onClick={()=>{setVerifyInput('');setCheckOpen(true)}}>CHECK</button><button className="action pause" onClick={()=>setPaused(p=>!p)}>{paused?'RESUME':'PAUSE'}</button></div></section>
      {checkOpen&&<div className="check-backdrop"><div className="check-modal"><div className="check-head"><strong>CHECK</strong><button onClick={()=>setCheckOpen(false)}>×</button></div><div className="check-body"><label>Card Number</label><input autoFocus inputMode="numeric" value={verifyInput} onChange={e=>setVerifyInput(e.target.value.replace(/\D/g,''))} placeholder="001" onKeyDown={e=>e.key==='Enter'&&void checkWinner()}/><button onClick={()=>void checkWinner()}>Check Win</button></div></div></div>}
      {inspectionCard!==null&&paused&&cards.find(c=>c.id===inspectionCard)&&<CardInspector card={cards.find(c=>c.id===inspectionCard)!} calledSet={calledSet} winningIndexes={winningIndexes} onClose={()=>{setInspectionCard(null);setWinningIndexes([])}}/>}
      {winner!==null&&<div className="winner-overlay"><div className="winner-card"><div className="winner-star">★</div><h2>BINGO!</h2><p>Cartella {String(winner).padStart(3,'0')} is a valid winner.</p><button onClick={()=>setWinner(null)}>CONFIRM WINNER</button></div></div>}
      {message&&<div className="toast">{message}</div>}
    </main>{settingsOpen&&settings}
  </div>
}

function ManualBuilder({card,index,message,update,save}:{card:Card;index:number;message:string;update:(i:number,v:string)=>void;save:()=>void}){
  return <section className="manual-card-editor"><div className="selection-title"><div><small>FILL CARTELLA SETTING</small><h1>Cartella {String(card.id).padStart(3,'0')}</h1></div><div className="selection-count"><b>{index+1}</b><span>/ 100</span></div></div><div className="manual-card-head"><span>Enter the printed cartella exactly</span><span>B 1–15 · I 16–30 · N 31–45 · G 46–60 · O 61–75</span></div><div className="manual-card-grid">{LETTERS.map((letter,col)=><div className="manual-col" key={letter}><div className={`manual-letter ${letter.toLowerCase()}`}>{letter}</div>{Array.from({length:5},(_,row)=>{const i=row*5+col;return i===12?<div className="manual-cell free" key={i}>FREE</div>:<input key={i} className="manual-cell" type="number" min={RANGES[letter][0]} max={RANGES[letter][1]} value={card.values[i]||''} onChange={e=>update(i,e.target.value)}/>})}</div>)}</div><div className="manual-actions"><button className="manual-next" onClick={save}>{index===99?'SAVE ALL CARTELLAS':'SAVE & NEXT'}</button></div>{message&&<div className="toast">{message}</div>}</section>
}
function CardInspector({card,calledSet,winningIndexes,onClose}:{card:Card;calledSet:Set<number>;winningIndexes:number[];onClose:()=>void}){
  const candidates=[...Array.from({length:5},(_,r)=>({name:`ROW ${r+1}`,line:Array.from({length:5},(_,c)=>r*5+c)})),...Array.from({length:5},(_,c)=>({name:`COLUMN ${LETTERS[c]}`,line:Array.from({length:5},(_,r)=>r*5+c)})),{name:'DIAGONAL ↘',line:[0,6,12,18,24]},{name:'DIAGONAL ↙',line:[4,8,12,16,20]},{name:'FOUR CORNERS',line:[0,4,20,24]}]
  const win=candidates.find(x=>x.line.every(i=>winningIndexes.includes(i)))
  return <div className="card-inspector"><div className="inspector-head"><div><small>PAUSED • CARTELLA CHECK</small><h2>CARTELLA {String(card.id).padStart(3,'0')}</h2></div><button onClick={onClose}>×</button></div><div className="inspector-grid">{card.values.map((n,i)=>{const marked=i===12||calledSet.has(n);return <div key={i} className={`inspector-cell ${marked?'marked':''} ${winningIndexes.includes(i)?'winning':''}`}>{i===12?'FREE':n}</div>})}</div>{win&&<div className="winning-line-label">🏆 {win.name} • BINGO</div>}</div>
}
function SettingsModal(p:{cardSource:'printed'|'pdf';setCardSource:(v:'printed'|'pdf')=>void;voiceEnabled:boolean;setVoiceEnabled:(v:boolean)=>void;voiceSpeed:number;setVoiceSpeed:(v:number)=>void;callGap:number;setCallGap:(v:number)=>void;betAmount:string;setBetAmount:(v:string)=>void;cutPercent:string;setCutPercent:(v:string)=>void;totalMoneyMade:number;generatingPdf:boolean;createPdf:()=>Promise<void>;openManualSetup:()=>void;testVoice:()=>void;onClose:()=>void}){
  return <div className="modal-backdrop"><div className="settings-modal"><div className="modal-head"><div><small>MANAGER SETTINGS</small><h2>Settings</h2></div><button className="close-button" onClick={p.onClose}>×</button></div><div className="settings-grid">
    <section><h3>CARTELLA</h3><button className={`setting-choice ${p.cardSource==='printed'?'active':''}`} onClick={()=>p.setCardSource('printed')}>Existing printed 001–100</button><button className={`setting-choice ${p.cardSource==='pdf'?'active':''}`} onClick={()=>p.setCardSource('pdf')}>Generated PDF set</button><button className="setting-choice" onClick={p.openManualSetup}>🔒 FILL CARTELLA SETTING</button><button className="pdf-action" onClick={()=>void p.createPdf()} disabled={p.generatingPdf}>{p.generatingPdf?'CREATING…':'GENERATE 100 CARTELLA PDF'}</button></section>
    <section><h3>VOICE & CALLING</h3><div className="setting-row"><span>Recorded Bingo voices</span><button className="toggle" onClick={()=>p.setVoiceEnabled(!p.voiceEnabled)}>{p.voiceEnabled?'ON':'OFF'}</button></div><button className="pdf-action" style={{marginTop:10}} onClick={p.testVoice} disabled={!p.voiceEnabled}>TEST B1 VOICE</button><label className="range-label">VOICE SPEED <strong>{p.voiceSpeed.toFixed(2)}×</strong></label><input className="range-input" type="range" min=".75" max="1.5" step=".05" value={p.voiceSpeed} onChange={e=>{const v=Number(e.target.value);p.setVoiceSpeed(v);localStorage.setItem('happy-bingo-voice-speed',String(v))}}/><div className="range-scale"><span>.75×</span><span>1×</span><span>1.25×</span><span>1.5×</span></div><label className="range-label">CALLING GAP <strong>{p.callGap.toFixed(1)} sec</strong></label><input className="range-input" type="range" min=".5" max="10" step=".5" value={p.callGap} onChange={e=>{const v=Number(e.target.value);p.setCallGap(v);localStorage.setItem('happy-bingo-call-gap',String(v))}}/><p className="setting-help">Gap starts after the recorded voice finishes.</p></section>
    <section><h3>ACCOUNT</h3><div className="money-setting"><label>BET AMOUNT</label><input type="number" min="0" value={p.betAmount} placeholder="" onChange={e=>{p.setBetAmount(e.target.value);localStorage.setItem('happy-bingo-bet',e.target.value)}}/></div><div className="money-setting"><label>CUT PERCENTAGE</label><input type="number" min="0" max="100" value={p.cutPercent} placeholder="" onChange={e=>{p.setCutPercent(e.target.value);localStorage.setItem('happy-bingo-cut',e.target.value)}}/></div><div className="money-setting total-money"><label>BINGO MADE</label><strong>{Math.round(p.totalMoneyMade).toLocaleString()} ETB</strong><small>Read-only. Automatically increases after each completed game.</small></div></section>
  </div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)
