import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100
const CALL_INTERVAL_MS = 5000
const AMHARIC_ONES = ['', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ']
const AMHARIC_TENS: Record<number, string> = { 10: 'አስር', 20: 'ሃያ', 30: 'ሰላሳ', 40: 'አርባ', 50: 'ሃምሳ', 60: 'ስልሳ', 70: 'ሰባ' }
const AMHARIC_LETTERS: Record<string, string> = { B: 'ቢ', I: 'አይ', N: 'ኤን', G: 'ጂ', O: 'ኦ' }
const B01_VOICE = new URL('../../../audio/voices/B01.mp3.m4a', import.meta.url).href

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }
type Winner = { card: number; pattern: string; indexes: number[] }

function getLetter(n: number) { return n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O' }
function makePool() { return Array.from({ length: 75 }, (_, i) => i + 1) }
function pad(n: number) { return String(n).padStart(2, '0') }
function amharicNumber(n: number) { if (n < 10) return AMHARIC_ONES[n]; if (n % 10 === 0) return AMHARIC_TENS[n]; return `${AMHARIC_TENS[Math.floor(n / 10) * 10]} ${AMHARIC_ONES[n % 10]}` }

function generateDemoCards(): Card[] {
  const cards: Card[] = []
  for (let id = 1; id <= CARD_COUNT; id++) {
    const columns: number[][] = []
    for (let col = 0; col < 5; col++) {
      const nums = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)
      let seed = id * 31 + col * 17
      for (let i = nums.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) >>> 0; const j = seed % (i + 1); [nums[i], nums[j]] = [nums[j], nums[i]] }
      columns.push(nums.slice(0, 5))
    }
    cards.push({ id, values: Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columns[i % 5][Math.floor(i / 5)]) })
  }
  return cards
}

function checkCard(card: Card, called: Set<number>) {
  const marked = card.values.map((n, i) => i === 12 || called.has(n))
  const rows = [0,1,2,3,4].map(r => [0,1,2,3,4].map(c => r * 5 + c))
  const cols = [0,1,2,3,4].map(c => [0,1,2,3,4].map(r => r * 5 + c))
  const diagA = [0,6,12,18,24], diagB = [4,8,12,16,20], corners = [0,4,20,24]
  const hit = (indexes: number[]) => indexes.every(i => marked[i])
  const patterns: { name: string; indexes: number[] }[] = []
  rows.forEach((x, i) => hit(x) && patterns.push({ name: `ROW ${i + 1}`, indexes: x }))
  cols.forEach((x, i) => hit(x) && patterns.push({ name: `COLUMN ${LETTERS[i]}`, indexes: x }))
  if (hit(diagA)) patterns.push({ name: 'DIAGONAL', indexes: diagA })
  if (hit(diagB)) patterns.push({ name: 'DIAGONAL', indexes: diagB })
  if (hit(corners)) patterns.push({ name: 'FOUR CORNERS', indexes: corners })
  return { valid: patterns.length > 0, patterns }
}

function speakNumber(item: Called) {
  if (item.number === 1) {
    const audio = new Audio(B01_VOICE)
    audio.volume = 1
    audio.play().catch(() => speakFallback(item))
    return
  }
  speakFallback(item)
}

function speakFallback(item: Called) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(`${AMHARIC_LETTERS[item.letter] ?? item.letter} ${amharicNumber(item.number)}`)
  u.lang = 'am-ET'; u.rate = 0.9
  const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('am')) || window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('en'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

function BingoCard({ card, called, highlight }: { card: Card; called: Set<number>; highlight?: Set<number> }) {
  return <div className="bingo-card"><div className="card-head">{LETTERS.map(l => <b key={l}>{l}</b>)}</div><div className="card-grid">{card.values.map((n, i) => <span key={i} className={`${i === 12 ? 'free' : ''} ${called.has(n) ? 'marked' : ''} ${highlight?.has(i) ? 'winning' : ''}`}>{i === 12 ? 'FREE' : n}</span>)}</div></div>
}

function App() {
  const [cards, setCards] = useState<Card[]>(() => { try { const saved = localStorage.getItem('happy-bingo-cards'); return saved ? JSON.parse(saved) : generateDemoCards() } catch { return generateDemoCards() } })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [entryFee, setEntryFee] = useState(() => Number(localStorage.getItem('happy-bingo-entry') || 10))
  const [remaining, setRemaining] = useState(makePool)
  const [called, setCalled] = useState<Called[]>([])
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [winners, setWinners] = useState<Winner[]>([])
  const [message, setMessage] = useState('')
  const [gameNumber, setGameNumber] = useState(() => Number(localStorage.getItem('happy-bingo-game') || 0) + 1)

  const players = selected.size
  const total = players * entryFee
  const managerFee = Math.floor(total * 0.2)
  const prizePool = Math.floor(total * 0.8)
  const current = called[0] ?? null
  const calledSet = useMemo(() => new Set(called.map(x => x.number)), [called])
  const selectedCards = useMemo(() => Array.from(selected).sort((a, b) => a - b).map(id => cards.find(c => c.id === id)!).filter(Boolean), [selected, cards])

  useEffect(() => { localStorage.setItem('happy-bingo-cards', JSON.stringify(cards)) }, [cards])
  useEffect(() => { localStorage.setItem('happy-bingo-entry', String(entryFee)) }, [entryFee])
  useEffect(() => { if (!started || paused || remaining.length === 0) return; const timer = window.setInterval(callNext, CALL_INTERVAL_MS); return () => window.clearInterval(timer) }, [started, paused, remaining.length])

  function toggleCard(id: number) {
    if (started) return
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function startGame() {
    if (!players) return setMessage('Select at least one cartella before starting the game.')
    setRemaining(makePool()); setCalled([]); setWinners([]); setPaused(false); setMessage(''); setStarted(true)
    localStorage.setItem('happy-bingo-game', String(gameNumber))
  }

  function callNext() {
    if (!started || paused || remaining.length === 0) return
    const number = remaining[Math.floor(Math.random() * remaining.length)]
    const item = { letter: getLetter(number), number }
    setRemaining(pool => pool.filter(n => n !== number))
    setCalled(items => [item, ...items])
    setTimeout(() => speakNumber(item), 50)
  }

  function verify(cardId: number) {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const result = checkCard(card, calledSet)
    if (!result.valid) return setMessage(`CARD ${pad(cardId)} — NOT BINGO YET.`)
    if (!winners.some(w => w.card === cardId)) setWinners(prev => [...prev, { card: cardId, pattern: result.patterns[0].name, indexes: result.patterns[0].indexes }])
    setMessage(`🎉 BINGO! CARD ${pad(cardId)} · ${result.patterns.map(p => p.name).join(' + ')}`)
  }

  function newGame() {
    if (!window.confirm('Start a new game? Current selections and calls will be cleared.')) return
    setStarted(false); setPaused(false); setRemaining(makePool()); setCalled([]); setSelected(new Set()); setWinners([]); setMessage('')
    setGameNumber(n => n + 1)
  }

  function importFile(file: File) {
    if (window.prompt('Admin password required to replace the card set:') !== 'HappyBingo@2026') return setMessage('Incorrect admin password.')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const lines = String(reader.result).trim().split(/\r?\n/).filter(Boolean)
        if (lines.length !== 101) throw new Error()
        const imported = lines.slice(1).map(line => line.split(',').map(v => v.trim())).map(parts => ({ id: Number(parts[0]), values: parts.slice(1, 26).map(v => v.toUpperCase() === 'FREE' ? 0 : Number(v)) }))
        if (imported.length !== 100 || imported.some(c => !Number.isInteger(c.id) || c.id < 1 || c.id > 100)) throw new Error()
        setCards(imported.sort((a, b) => a.id - b.id)); setMessage('100 cartella imported successfully.')
      } catch { setMessage('Import failed. Use the official 100-card CSV template.') }
    }
    reader.readAsText(file)
  }

  if (!started) return <div className="app-shell"><header className="topbar"><div><div className="brand">HAPPY <span>BINGO</span></div><div className="subtitle">75-Ball Bingo · Cartella Selection</div></div><div className="status-pill"><span /> READY · OFFLINE</div></header><main className="selection-screen"><section className="selection-hero"><div><div className="eyebrow">STEP 1 · SELECT CARTELLA</div><h1>Choose the <span>100 cartella</span> for this game.</h1><p>Click each cartella sold to a player. Selected cartella turn blue. You can change the selection until the game starts.</p></div><div className="selection-summary"><strong>{players}</strong><span>SELECTED</span><b>{total} Br</b><small>Prize pool: {prizePool} Br</small></div></section><section className="selection-layout"><div className="cartella-panel"><div className="panel-heading"><div><h2>ALL 100 CARTELLA</h2><p>Click to select / click again to remove</p></div><span>{players} / 100</span></div><div className="cartella-grid">{Array.from({ length: 100 }, (_, i) => i + 1).map(id => <button key={id} className={`cartella ${selected.has(id) ? 'selected' : ''}`} onClick={() => toggleCard(id)}>{id}</button>)}</div></div><aside className="selection-side"><div className="side-card"><span className="side-label">GAME SETUP</span><label>ENTRY FEE (BIRR)<input type="number" min="1" value={entryFee} onChange={e => setEntryFee(Math.max(1, Math.floor(Number(e.target.value) || 1)))}/></label><div className="money-line"><span>Total</span><b>{total} Br</b></div><div className="money-line"><span>Manager 20%</span><b>{managerFee} Br</b></div><div className="money-line prize-line"><span>Prize 80%</span><b>{prizePool} Br</b></div></div><div className="side-card selected-preview"><span className="side-label">SELECTED CARTELLA</span>{players === 0 ? <p className="empty-copy">No cartella selected yet.</p> : <div className="selected-chips">{Array.from(selected).sort((a,b)=>a-b).map(id => <button key={id} onClick={() => toggleCard(id)}>{id}</button>)}</div>}<button className="start-button" onClick={startGame} disabled={!players}>▶ START GAME <small>{players ? `${players} PLAYER${players === 1 ? '' : 'S'}` : 'SELECT CARTELLA FIRST'}</small></button><label className="file-button">ADMIN · REPLACE 100 CARTELLA<input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && importFile(e.target.files[0])}/></label></div></aside></section>{message && <div className="message">{message}</div>}</main></div>

  return <div className="app-shell"><header className="topbar game-top"><div><div className="brand">HAPPY <span>BINGO</span></div><div className="subtitle">GAME #{String(gameNumber).padStart(4, '0')} · {players} CARTELLA · {players} PLAYERS</div></div><div className="game-top-actions"><div className="status-pill"><span /> GAME LIVE</div><button onClick={() => setPaused(p => !p)}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button><button onClick={callNext}>CALL NOW</button><button onClick={newGame}>NEW GAME</button></div></header><main className="game-screen"><section className="call-hero"><div className="call-ball"><span>{current?.letter || '•'}</span><strong>{current?.number ?? '—'}</strong></div><div className="call-main"><div className="eyebrow">NOW CALLING</div><div className="current-number">{current ? `${current.letter} ${current.number}` : 'READY'}</div><div className="amharic-call">{current ? `${AMHARIC_LETTERS[current.letter]} ${amharicNumber(current.number)}` : 'ጨዋታው ሊጀምር ነው'}</div><div className="call-status">{paused ? '⏸ PAUSED' : started && remaining.length ? '● AUTO CALLING EVERY 5 SECONDS' : 'GAME FINISHED'}</div></div><div className="game-stats"><div><b>{called.length}</b><span>CALLED</span></div><div><b>{remaining.length}</b><span>REMAINING</span></div><div><b>{prizePool}</b><span>PRIZE BIRR</span></div></div></section><section className="game-layout"><div className="board-panel panel"><div className="panel-heading"><div><h2>75-NUMBER BOARD</h2><p>Called numbers glow blue and white</p></div><span>{called.length} / 75</span></div><div className="bingo-board">{LETTERS.map((letter, col) => <div className="bingo-column" key={letter}><div className={`board-letter ${letter}`}>{letter}</div>{Array.from({length: 15}, (_, i) => i + 1 + col * 15).map(n => <div key={n} className={`number-box ${calledSet.has(n) ? 'called' : ''} ${current?.number === n ? 'latest' : ''}`}>{n}</div>)}</div>)}</div></div><aside className="game-side"><div className="panel called-panel"><div className="panel-heading"><div><h2>CALL HISTORY</h2><p>Latest calls first</p></div></div><div className="history-list">{called.length === 0 ? <div className="empty-copy">Waiting for the first number…</div> : called.slice(0, 10).map((item, i) => <div className={`history-item ${i === 0 ? 'latest' : ''}`} key={`${item.number}-${i}`}><b>{item.letter}</b><strong>{item.number}</strong><span>{i === 0 ? 'NOW' : `#${called.length - i}`}</span></div>)}</div></div><div className="panel active-panel"><div className="panel-heading"><div><h2>ACTIVE CARTELLA</h2><p>Click a cartella to verify BINGO</p></div><span>{players}</span></div><div className="active-grid">{selectedCards.map(card => <button key={card.id} className={winners.some(w => w.card === card.id) ? 'winner' : ''} onClick={() => verify(card.id)}>#{pad(card.id)}</button>)}</div></div></aside></section><section className="bottom-strip"><div><span>SELECTED CARTELLA</span><strong>{Array.from(selected).sort((a,b)=>a-b).join(' · ')}</strong></div><div><span>MANAGER 20%</span><strong>{managerFee} Br</strong></div><div><span>PRIZE 80%</span><strong>{prizePool} Br</strong></div>{winners.length > 0 && <div className="winner-strip"><span>🏆 WINNER</span><strong>{winners.map(w => `#${pad(w.card)}`).join(' · ')}</strong></div>}</section>{message && <div className={`message ${message.includes('BINGO') ? 'success' : ''}`}>{message}</div>}</main></div>
}

createRoot(document.getElementById('root')!).render(<App />)
