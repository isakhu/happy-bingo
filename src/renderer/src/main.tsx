import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './game-overrides.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100
const RANGES: Record<string, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] }
const MANAGER_PASSWORD = '20260817'

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }

declare global {
  interface Window {
    happyBingo?: {
      generateCardsPdf?: () => Promise<{ cards: Card[]; path: string }>
      playVoice?: (file: string) => Promise<string>
    }
  }
}

const getLetter = (n: number) => n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O'
const makePool = () => Array.from({ length: 75 }, (_, i) => i + 1)

function generateCards(): Card[] {
  return Array.from({ length: CARD_COUNT }, (_, id) => {
    const cols = LETTERS.map((letter) => {
      const [min, max] = RANGES[letter]
      const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      let seed = (id + 1) * 97 + min * 31
      for (let i = values.length - 1; i > 0; i--) {
        seed = (seed * 1664525 + 1013904223) >>> 0
        const j = seed % (i + 1)
        ;[values[i], values[j]] = [values[j], values[i]]
      }
      return values.slice(0, 5)
    })
    return { id: id + 1, values: Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : cols[i % 5][Math.floor(i / 5)]) }
  })
}

function loadCards(): Card[] {
  try {
    const saved = JSON.parse(localStorage.getItem('happy-bingo-cards') || 'null')
    if (Array.isArray(saved) && saved.length === 100) return saved
  } catch { /* use defaults */ }
  const cards = generateCards()
  localStorage.setItem('happy-bingo-cards', JSON.stringify(cards))
  return cards
}

function playAudio(fileUrl: string, rate: number): Promise<void> {
  return new Promise(resolve => {
    const audio = new Audio()
    let settled = false
    const finish = () => { if (!settled) { settled = true; audio.onended = null; audio.onerror = null; resolve() } }
    audio.preload = 'auto'
    audio.playbackRate = rate
    audio.onended = finish
    audio.onerror = finish
    audio.src = fileUrl
    audio.load()
    void audio.play().catch(finish)
  })
}

function makeEmptyCard(id: number): Card { return { id, values: Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : 0) } }
function cardComplete(card: Card) { return card.values.every((n, i) => i === 12 || Number.isInteger(n) && n > 0) }
function cardValid(card: Card) {
  if (!cardComplete(card)) return false
  for (let row = 0; row < 5; row++) {
    const seen = new Set<number>()
    for (let col = 0; col < 5; col++) {
      const n = card.values[row * 5 + col]
      const letter = LETTERS[col]
      const [min, max] = RANGES[letter]
      if (n < min || n > max || seen.has(n)) return false
      seen.add(n)
    }
  }
  return card.values[12] === 0
}

function App() {
  const [cards, setCards] = useState<Card[]>(loadCards)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [called, setCalled] = useState<Called[]>([])
  const [remaining, setRemaining] = useState(makePool)
  const [locked, setLocked] = useState<Set<number>>(new Set())
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('happy-bingo-voice') !== 'off')
  const [voiceSpeed, setVoiceSpeed] = useState(() => Number(localStorage.getItem('happy-bingo-voice-speed') || '1'))
  const [callGap, setCallGap] = useState(() => Number(localStorage.getItem('happy-bingo-call-gap') || '3'))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cardSource, setCardSource] = useState<'printed' | 'pdf'>(() => (localStorage.getItem('happy-bingo-card-source') as 'printed' | 'pdf') || 'printed')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [message, setMessage] = useState('')
  const [checkOpen, setCheckOpen] = useState(false)
  const [verifyInput, setVerifyInput] = useState('')
  const [winner, setWinner] = useState<number | null>(null)
  const [inspectionCard, setInspectionCard] = useState<number | null>(null)
  const [winningIndexes, setWinningIndexes] = useState<number[]>([])
  const [betAmount, setBetAmount] = useState(() => localStorage.getItem('happy-bingo-bet') || '')
  const [cutPercent, setCutPercent] = useState(() => localStorage.getItem('happy-bingo-cut') || '')
  const [totalMoneyMade, setTotalMoneyMade] = useState(() => Math.max(0, Number(localStorage.getItem('happy-bingo-total-money-made') || '0')))
  const [manualSetup, setManualSetup] = useState(() => localStorage.getItem('happy-bingo-manual-setup') === 'on')
  const [setupIndex, setSetupIndex] = useState(0)
  const [draftCard, setDraftCard] = useState<Card>(() => loadCards()[0] || makeEmptyCard(1))

  const current = called[0] || null
  const calledSet = useMemo(() => new Set(called.map(item => item.number)), [called])
  const currentAmount = betAmount === '' ? null : selected.size * Number(betAmount || 0)
  const cutAmount = currentAmount === null ? null : currentAmount * Number(cutPercent || 0) / 100
  const prize = currentAmount === null ? null : Math.max(0, currentAmount - (cutAmount || 0))

  async function playVoice(file: string) {
    if (!voiceEnabled || !window.happyBingo?.playVoice) return
    setVoicePlaying(true)
    try {
      const fileUrl = await window.happyBingo.playVoice(file)
      await playAudio(fileUrl, voiceSpeed)
    } catch (error) {
      console.error(`Happy Bingo voice failed: ${file}`, error)
      setMessage(`VOICE ERROR: ${file}`)
    } finally { setVoicePlaying(false) }
  }

  function toggleCard(id: number) {
    if (started) return
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function startGame() {
    if (!selected.size) return setMessage('Select at least one cartella.')
    if (manualSetup && cards.some(card => selected.has(card.id) && !cardValid(card))) return setMessage('Finish all selected cartellas before starting the game.')
    setCalled([]); setRemaining(makePool()); setLocked(new Set()); setPaused(false); setWinner(null); setInspectionCard(null); setWinningIndexes([]); setVerifyInput(''); setCheckOpen(false); setMessage(''); setStarted(true)
    await playVoice('chewatawu.mp3')
  }

  async function callNext() {
    if (!started || paused || !remaining.length || voicePlaying) return
    const number = remaining[Math.floor(Math.random() * remaining.length)]
    const letter = getLetter(number)
    setRemaining(prev => prev.filter(value => value !== number))
    setCalled(prev => [{ letter, number }, ...prev])
    await playVoice(`${letter.toLowerCase()}${number}.mp3`)
  }

  useEffect(() => {
    if (!started || paused || voicePlaying || !remaining.length) return
    const timer = window.setTimeout(() => { void callNext() }, called.length === 0 ? 900 : Math.max(0.5, callGap) * 1000)
    return () => window.clearTimeout(timer)
  }, [started, paused, voicePlaying, remaining.length, called.length, callGap])

  function recordCompletedGame() {
    const amount = currentAmount
    if (amount === null || !Number.isFinite(amount) || amount <= 0) return
    setTotalMoneyMade(prev => { const next = prev + amount; localStorage.setItem('happy-bingo-total-money-made', String(next)); return next })
  }

  function newGame() {
    if (!window.confirm('End this game and return to cartella selection?')) return
    recordCompletedGame(); setStarted(false); setPaused(false); setCalled([]); setRemaining(makePool()); setLocked(new Set()); setWinner(null); setInspectionCard(null); setWinningIndexes([]); setVerifyInput(''); setCheckOpen(false); setMessage('')
  }

  function getWinningLines(card: Card) {
    const marked = card.values.map((n, i) => i === 12 || calledSet.has(n))
    const rows = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c))
    const cols = Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c))
    const diagonals = [[0, 6, 12, 18, 24], [4, 8, 12, 16, 20]]
    const fourCorners = [0, 4, 20, 24]
    return [...rows, ...cols, ...diagonals, fourCorners].filter(line => line.every(index => marked[index]))
  }

  async function checkWinner() {
    const id = Number(verifyInput)
    const card = cards.find(item => item.id === id)
    if (!Number.isInteger(id) || id < 1 || id > 100 || !card) return setMessage('Enter a valid cartella number from 001 to 100.')
    if (!selected.has(id)) return setMessage(`Cartella ${String(id).padStart(3, '0')} is not active.`)
    if (!cardValid(card)) return setMessage(`Cartella ${String(id).padStart(3, '0')} is not configured correctly.`)
    setInspectionCard(id)
    if (locked.has(id)) { await playVoice('cartellawu.mp3'); setCheckOpen(false); return setMessage(`CARTELLA ${String(id).padStart(3, '0')} IS LOCKED.`) }
    const lines = getWinningLines(card)
    setWinningIndexes(lines.flat())
    setCheckOpen(false)
    if (!lines.length) { setLocked(prev => new Set(prev).add(id)); await playVoice('cartellawu.mp3'); return setMessage(`CARTELLA ${String(id).padStart(3, '0')} LOCKED — INVALID BINGO.`) }
    await playVoice('Goodbingo.mp3'); setWinner(id)
  }

  async function createPdf() {
    if (!window.happyBingo?.generateCardsPdf) return setMessage('PDF generation is available in the Windows desktop build.')
    setGeneratingPdf(true)
    try { const result = await window.happyBingo.generateCardsPdf(); setCards(result.cards); localStorage.setItem('happy-bingo-cards', JSON.stringify(result.cards)); setCardSource('pdf'); localStorage.setItem('happy-bingo-card-source', 'pdf'); setSelected(new Set()); setMessage('New cartella PDF created.') }
    catch { setMessage('Could not create the PDF.') } finally { setGeneratingPdf(false) }
  }

  function saveCards(next: Card[]) { setCards(next); localStorage.setItem('happy-bingo-cards', JSON.stringify(next)) }
  function saveBet(value: string) { setBetAmount(value); value === '' ? localStorage.removeItem('happy-bingo-bet') : localStorage.setItem('happy-bingo-bet', value) }
  function saveCut(value: string) { setCutPercent(value); value === '' ? localStorage.removeItem('happy-bingo-cut') : localStorage.setItem('happy-bingo-cut', value) }
  function saveVoiceSpeed(value: number) { setVoiceSpeed(value); localStorage.setItem('happy-bingo-voice-speed', String(value)) }
  function saveCallGap(value: number) { setCallGap(value); localStorage.setItem('happy-bingo-call-gap', String(value)) }

  function openManualSetup() {
    const password = window.prompt('MANAGER PASSWORD\nEnter the numeric password to open Cartella Building:')
    if (password !== MANAGER_PASSWORD) { setMessage('Incorrect manager password.'); return }
    setManualSetup(true); localStorage.setItem('happy-bingo-manual-setup', 'on'); setSetupIndex(0); setDraftCard(cards[0] || makeEmptyCard(1)); setSettingsOpen(false)
  }

  function saveDraftAndNext() {
    if (!cardValid(draftCard)) return setMessage('Fill all 25 cells correctly. Each column must use its Bingo range, with the center as FREE.')
    const next = cards.map(card => card.id === draftCard.id ? draftCard : card)
    saveCards(next)
    if (setupIndex >= CARD_COUNT - 1) { setManualSetup(false); localStorage.setItem('happy-bingo-manual-setup', 'off'); setMessage('All 100 cartellas are saved.'); return }
    const nextIndex = setupIndex + 1
    setSetupIndex(nextIndex); setDraftCard(next[nextIndex] || makeEmptyCard(nextIndex + 1)); setMessage(`Cartella ${String(draftCard.id).padStart(3, '0')} saved.`)
  }

  function updateDraft(index: number, value: string) {
    const n = value === '' ? 0 : Number(value)
    setDraftCard(prev => ({ ...prev, values: prev.values.map((v, i) => i === index ? n : v) }))
  }

  const settings = <SettingsModal cardSource={cardSource} setCardSource={value => { setCardSource(value); localStorage.setItem('happy-bingo-card-source', value) }} voiceEnabled={voiceEnabled} setVoiceEnabled={value => { setVoiceEnabled(value); localStorage.setItem('happy-bingo-voice', value ? 'on' : 'off') }} voiceSpeed={voiceSpeed} setVoiceSpeed={saveVoiceSpeed} callGap={callGap} setCallGap={saveCallGap} betAmount={betAmount} setBetAmount={saveBet} cutPercent={cutPercent} setCutPercent={saveCut} totalMoneyMade={totalMoneyMade} generatingPdf={generatingPdf} createPdf={createPdf} manualSetup={manualSetup} openManualSetup={openManualSetup} onClose={() => setSettingsOpen(false)} />

  if (!started) return <div className="app-shell selection-mode">
    <header className="topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="ready-pill">● READY</span><button className="top-button" onClick={() => setSettingsOpen(true)}>SETTING</button></div></header>
    <main className="selection-screen">
      {manualSetup ? <section className="manual-card-editor"><div className="selection-title"><div><small>FILL CARTELLA SETTING</small><h1>Cartella {String(draftCard.id).padStart(3, '0')}</h1></div><div className="selection-count"><b>{setupIndex + 1}</b><span>/ 100</span></div></div><div className="manual-card-head"><span>Enter your printed cartella exactly</span><span>B 1–15 · I 16–30 · N 31–45 · G 46–60 · O 61–75</span></div><div className="manual-card-grid">{LETTERS.map((letter, col) => <div className="manual-col" key={letter}><div className={`manual-letter ${letter.toLowerCase()}`}>{letter}</div>{Array.from({ length: 5 }, (_, row) => { const index = row * 5 + col; const free = index === 12; return free ? <div className="manual-cell free" key={index}>FREE</div> : <input key={index} className="manual-cell" type="number" min={RANGES[letter][0]} max={RANGES[letter][1]} value={draftCard.values[index] || ''} onChange={e => updateDraft(index, e.target.value)} /> })}</div>)}</div><div className="manual-actions"><button className="manual-next" onClick={saveDraftAndNext}>{setupIndex === 99 ? 'SAVE ALL CARTELLAS' : 'SAVE & NEXT'}</button></div>{message && <div className="toast">{message}</div>}</section> : <>
        <div className="selection-title"><div><small>CARTELLA SELECTION</small><h1>Select cards for this game</h1></div><div className="selection-count"><b>{selected.size}</b><span>/ 100</span></div></div>
        <section className="selection-panel"><div className="selection-panel-head"><strong>001 — 100</strong><span>{cardSource === 'printed' ? 'PRINTED CARTELLA' : 'GENERATED CARTELLA'}</span></div><div className="cartella-grid">{Array.from({ length: 100 }, (_, i) => i + 1).map(id => <button key={id} className={`cartella ${selected.has(id) ? 'selected' : ''}`} onClick={() => toggleCard(id)} aria-pressed={selected.has(id)}>{String(id).padStart(3, '0')}</button>)}</div></section>
        <button className="start-button" onClick={startGame} disabled={!selected.size || voicePlaying}>START GAME</button>{message && <div className="toast">{message}</div>}
      </>}
    </main>{settingsOpen && settings}</div>

  return <div className="app-shell bingo-mode">
    <header className="topbar game-topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="live-pill">● LIVE</span><span className={`pause-status ${paused ? 'is-paused' : ''}`}>{paused ? 'PAUSED' : 'AUTO CALL'}</span></div></header>
    <main className="bingo-main">
      <section className="live-header"><div className="current-wrap"><div className="marquee-ball"><span>{current?.letter || '—'}</span><strong>{current?.number ?? '—'}</strong></div><div className="fraction">{called.length}/75</div></div><div className="recent-calls">{called.slice(0, 14).map((item, index) => <div key={`${item.number}-${index}`} className={`recent-ball ${item.letter.toLowerCase()} ${index === 0 ? 'latest' : ''}`}><span>{item.letter}</span>{item.number}</div>)}</div></section>
      <section className="prize-banner">PRIZE {prize === null ? '—' : Math.round(prize).toLocaleString()}</section>
      <section className="board-shell"><div className="board-grid">{LETTERS.map((letter, row) => <div className="board-row" key={letter}><div className={`letter-badge ${letter.toLowerCase()}`}>{letter}</div>{Array.from({ length: 15 }, (_, i) => i + 1 + row * 15).map(n => { const calledNow = calledSet.has(n); return <div key={n} className={`number-cell ${calledNow ? `called ${getLetter(n).toLowerCase()}` : ''} ${current?.number === n ? 'latest' : ''}`}><span>{n}</span></div> })}</div>)}</div></section>
      <section className="bottom-bar"><div className="game-id">Game ID <strong>100029-YAXT</strong></div><div className="bottom-actions"><button className="action setting" onClick={() => setSettingsOpen(true)}>SETTING</button><button className="action end" onClick={newGame}>END</button><button className="action check" onClick={() => { setVerifyInput(''); setCheckOpen(true) }}>CHECK</button><button className="action pause" onClick={() => setPaused(prev => !prev)}>{paused ? 'RESUME' : 'PAUSE'}</button></div></section>
      {checkOpen && <div className="check-backdrop"><div className="check-modal"><div className="check-head"><strong>CHECK</strong><button onClick={() => setCheckOpen(false)}>×</button></div><div className="check-body"><label>Card Number</label><input autoFocus inputMode="numeric" value={verifyInput} onChange={e => { const value = e.target.value.replace(/\D/g, ''); setVerifyInput(value); const id = Number(value); if (id >= 1 && id <= 100) setInspectionCard(id) }} placeholder="001" onKeyDown={e => e.key === 'Enter' && void checkWinner()} /><button onClick={() => void checkWinner()}>Check Win</button></div></div></div>}
      {inspectionCard !== null && paused && cards.find(card => card.id === inspectionCard) && <CardInspector card={cards.find(card => card.id === inspectionCard)!} calledSet={calledSet} winningIndexes={winningIndexes} onClose={() => { setInspectionCard(null); setWinningIndexes([]) }} />}
      {winner !== null && <div className="winner-overlay"><div className="winner-card"><div className="winner-star">★</div><h2>BINGO!</h2><p>Card {String(winner).padStart(3, '0')} is a valid winner.</p><button onClick={() => setWinner(null)}>CONFIRM WINNER</button></div></div>}
      {message && <div className="toast">{message}</div>}
    </main>{settingsOpen && settings}
  </div>
}

function CardInspector({ card, calledSet, winningIndexes, onClose }: { card: Card; calledSet: Set<number>; winningIndexes: number[]; onClose: () => void }) {
  const lines = [0, 1, 2, 3, 4].map(r => `ROW ${r + 1}`).concat([0, 1, 2, 3, 4].map(c => `COLUMN ${LETTERS[c]}`), 'DIAGONAL ↘', 'DIAGONAL ↙', 'FOUR CORNERS')
  const winningLine = winningIndexes.length ? lines.find((_, i) => {
    const candidate = i < 5 ? [0,1,2,3,4].map(c => i * 5 + c) : i < 10 ? [0,1,2,3,4].map(r => r * 5 + (i - 5)) : i === 10 ? [0,6,12,18,24] : i === 11 ? [4,8,12,16,20] : [0,4,20,24]
    return candidate.every(index => winningIndexes.includes(index))
  }) : null
  return <div className="card-inspector"><div className="inspector-head"><div><small>PAUSED • CARTELLA CHECK</small><h2>CARTELLA {String(card.id).padStart(3, '0')}</h2></div><button onClick={onClose}>×</button></div><div className="inspector-grid">{card.values.map((n, i) => { const marked = i === 12 || calledSet.has(n); const winning = winningIndexes.includes(i); return <div key={i} className={`inspector-cell ${marked ? 'marked' : ''} ${winning ? 'winning' : ''}`}>{i === 12 ? 'FREE' : n}</div> })}</div>{winningLine && <div className="winning-line-label">🏆 {winningLine} • BINGO</div>}</div>
}

function SettingsModal(props: { cardSource: 'printed' | 'pdf'; setCardSource: (value: 'printed' | 'pdf') => void; voiceEnabled: boolean; setVoiceEnabled: (value: boolean) => void; voiceSpeed: number; setVoiceSpeed: (value: number) => void; callGap: number; setCallGap: (value: number) => void; betAmount: string; setBetAmount: (value: string) => void; cutPercent: string; setCutPercent: (value: string) => void; totalMoneyMade: number; generatingPdf: boolean; createPdf: () => Promise<void>; manualSetup: boolean; openManualSetup: () => void; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="settings-modal"><div className="modal-head"><div><small>MANAGER SETTINGS</small><h2>Settings</h2></div><button className="close-button" onClick={props.onClose}>×</button></div><div className="settings-grid">
    <section><h3>CARTELLA</h3><button className={`setting-choice ${props.cardSource === 'printed' ? 'active' : ''}`} onClick={() => props.setCardSource('printed')}>Existing printed 001–100</button><button className={`setting-choice ${props.cardSource === 'pdf' ? 'active' : ''}`} onClick={() => props.setCardSource('pdf')}>Generated PDF set</button><button className="setting-choice" onClick={props.openManualSetup}>{props.manualSetup ? 'CONTINUE FILLING CARTELLA' : 'FILL CARTELLA SETTING'}</button><button className="pdf-action" onClick={props.createPdf} disabled={props.generatingPdf}>{props.generatingPdf ? 'CREATING…' : 'GENERATE 100 CARTELLA PDF'}</button></section>
    <section><h3>VOICE & CALLING</h3><div className="setting-row"><span>Recorded Bingo voices</span><button className="toggle" onClick={() => props.setVoiceEnabled(!props.voiceEnabled)}>{props.voiceEnabled ? 'ON' : 'OFF'}</button></div><label className="range-label">VOICE SPEED <strong>{props.voiceSpeed.toFixed(2)}×</strong></label><input className="range-input" type="range" min="0.75" max="1.5" step="0.05" value={props.voiceSpeed} onChange={e => props.setVoiceSpeed(Number(e.target.value))} /><div className="range-scale"><span>0.75×</span><span>1.00×</span><span>1.25×</span><span>1.50×</span></div><label className="range-label">CALLING GAP <strong>{props.callGap.toFixed(1)} sec</strong></label><input className="range-input" type="range" min="0.5" max="10" step="0.5" value={props.callGap} onChange={e => props.setCallGap(Number(e.target.value))} /><div className="range-scale"><span>0.5s</span><span>3s</span><span>6s</span><span>10s</span></div><p className="setting-help">The gap starts after the recorded voice finishes.</p></section>
    <section><h3>ACCOUNT</h3><div className="money-setting"><label>BET AMOUNT</label><input type="number" min="0" value={props.betAmount} onChange={e => props.setBetAmount(e.target.value)} placeholder="" /></div><div className="money-setting"><label>CUT PERCENTAGE</label><input type="number" min="0" max="100" value={props.cutPercent} onChange={e => props.setCutPercent(e.target.value)} placeholder="" /></div><div className="money-setting total-money"><label>BINGO MADE</label><strong>{Math.round(props.totalMoneyMade).toLocaleString()} ETB</strong><small>Automatically increases after each completed game.</small></div></section>
  </div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)