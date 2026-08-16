import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100
const CALL_INTERVAL_MS = 5000
const DEFAULT_ENTRY_FEE = 10
const DEFAULT_MANAGER_PERCENT = 20
const DEFAULT_WORKING_MONEY = 1_000_000

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }
type Winner = { card: number; pattern: string; indexes: number[] }

function getLetter(n: number) { return n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O' }
function makePool() { return Array.from({ length: 75 }, (_, i) => i + 1) }
function money(n: number) { return new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(n))) }

function generateDemoCards(): Card[] {
  const cards: Card[] = []
  for (let id = 1; id <= CARD_COUNT; id++) {
    const columns: number[][] = []
    for (let col = 0; col < 5; col++) {
      const nums = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)
      let seed = id * 31 + col * 17
      for (let i = nums.length - 1; i > 0; i--) {
        seed = (seed * 1103515245 + 12345) >>> 0
        const j = seed % (i + 1)
        ;[nums[i], nums[j]] = [nums[j], nums[i]]
      }
      columns.push(nums.slice(0, 5))
    }
    cards.push({ id, values: Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columns[i % 5][Math.floor(i / 5)]) })
  }
  return cards
}

function checkCard(card: Card, called: Set<number>) {
  const marked = card.values.map((n, i) => i === 12 || called.has(n))
  const rows = [0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => r * 5 + c))
  const cols = [0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => r * 5 + c))
  const diagA = [0, 6, 12, 18, 24]
  const diagB = [4, 8, 12, 16, 20]
  const corners = [0, 4, 20, 24]
  const hit = (indexes: number[]) => indexes.every(i => marked[i])
  const patterns: { name: string; indexes: number[] }[] = []
  rows.forEach((x, i) => hit(x) && patterns.push({ name: `ROW ${i + 1}`, indexes: x }))
  cols.forEach((x, i) => hit(x) && patterns.push({ name: `COLUMN ${LETTERS[i]}`, indexes: x }))
  if (hit(diagA)) patterns.push({ name: 'DIAGONAL', indexes: diagA })
  if (hit(diagB)) patterns.push({ name: 'DIAGONAL', indexes: diagB })
  if (hit(corners)) patterns.push({ name: 'FOUR CORNERS', indexes: corners })
  return { valid: patterns.length > 0, patterns }
}

function speakEnglish(item: Called) {
  if (!('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(`${item.letter}, ${item.number}`)
  utterance.lang = 'en-US'
  utterance.rate = 0.86
  utterance.pitch = 1
  const voices = synth.getVoices()
  const preferred = voices.find(v => v.lang.toLowerCase() === 'en-us') || voices.find(v => v.lang.toLowerCase().startsWith('en'))
  if (preferred) utterance.voice = preferred
  synth.speak(utterance)
}

function BingoCard({ card, called, highlight }: { card: Card; called: Set<number>; highlight?: Set<number> }) {
  return <div className="bingo-card"><div className="card-head">{LETTERS.map(l => <b key={l}>{l}</b>)}</div><div className="card-grid">{card.values.map((n, i) => <span key={i} className={`${i === 12 ? 'free' : ''} ${called.has(n) ? 'marked' : ''} ${highlight?.has(i) ? 'winning' : ''}`}>{i === 12 ? 'FREE' : n}</span>)}</div></div>
}

function App() {
  const [cards, setCards] = useState<Card[]>(() => { try { const saved = localStorage.getItem('happy-bingo-cards'); return saved ? JSON.parse(saved) : generateDemoCards() } catch { return generateDemoCards() } })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [entryFee, setEntryFee] = useState(() => Number(localStorage.getItem('happy-bingo-entry') || DEFAULT_ENTRY_FEE))
  const [managerPercent, setManagerPercent] = useState(() => Number(localStorage.getItem('happy-bingo-manager-percent') || DEFAULT_MANAGER_PERCENT))
  const [workingMoney, setWorkingMoney] = useState(() => Number(localStorage.getItem('happy-bingo-working-money') ?? DEFAULT_WORKING_MONEY))
  const [workedTotal, setWorkedTotal] = useState(() => Number(localStorage.getItem('happy-bingo-worked-total') || 0))
  const [remaining, setRemaining] = useState(makePool)
  const [called, setCalled] = useState<Called[]>([])
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('happy-bingo-english-voice') !== 'off')
  const [winners, setWinners] = useState<Winner[]>([])
  const [message, setMessage] = useState('')
  const [gameNumber, setGameNumber] = useState(() => Number(localStorage.getItem('happy-bingo-game') || 0) + 1)

  const players = selected.size
  const totalCollected = players * entryFee
  const calculatedCut = Math.floor(totalCollected * Math.min(100, Math.max(0, managerPercent)) / 100)
  const managerCut = Math.min(calculatedCut, Math.max(0, workingMoney))
  const prizePool = Math.max(0, totalCollected - managerCut)
  const current = called[0] ?? null
  const calledSet = useMemo(() => new Set(called.map(x => x.number)), [called])
  const selectedCards = useMemo(() => Array.from(selected).sort((a, b) => a - b).map(id => cards.find(c => c.id === id)!).filter(Boolean), [selected, cards])

  useEffect(() => { localStorage.setItem('happy-bingo-cards', JSON.stringify(cards)) }, [cards])
  useEffect(() => { localStorage.setItem('happy-bingo-entry', String(entryFee)) }, [entryFee])
  useEffect(() => { localStorage.setItem('happy-bingo-manager-percent', String(managerPercent)) }, [managerPercent])
  useEffect(() => { localStorage.setItem('happy-bingo-working-money', String(workingMoney)) }, [workingMoney])
  useEffect(() => { localStorage.setItem('happy-bingo-worked-total', String(workedTotal)) }, [workedTotal])
  useEffect(() => { localStorage.setItem('happy-bingo-english-voice', voiceEnabled ? 'on' : 'off') }, [voiceEnabled])
  useEffect(() => { if (!started || paused || remaining.length === 0) return; const timer = window.setInterval(callNext, CALL_INTERVAL_MS); return () => window.clearInterval(timer) }, [started, paused, remaining.length])

  function toggleCard(id: number) {
    if (started) return
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function startGame() {
    if (!players) return setMessage('Select at least one cartella before starting the game.')
    if (managerCut > workingMoney) return setMessage('Manager cut is larger than the available working balance.')
    setRemaining(makePool()); setCalled([]); setWinners([]); setPaused(false); setMessage(''); setStarted(true)
    setWorkedTotal(v => v + totalCollected)
    setWorkingMoney(v => Math.max(0, v - managerCut))
    localStorage.setItem('happy-bingo-game', String(gameNumber))
  }

  function callNext() {
    if (!started || paused || remaining.length === 0) return
    const number = remaining[Math.floor(Math.random() * remaining.length)]
    const item = { letter: getLetter(number), number }
    setRemaining(pool => pool.filter(n => n !== number))
    setCalled(items => [item, ...items])
    if (voiceEnabled) window.setTimeout(() => speakEnglish(item), 60)
  }

  function testVoice() { speakEnglish({ letter: 'B', number: 12 }) }

  function verify(cardId: number) {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const result = checkCard(card, calledSet)
    if (!result.valid) return setMessage(`CARD ${String(cardId).padStart(2, '0')} — NOT BINGO YET.`)
    if (!winners.some(w => w.card === cardId)) setWinners(prev => [...prev, { card: cardId, pattern: result.patterns[0].name, indexes: result.patterns[0].indexes }])
    setMessage(`🎉 BINGO! CARD ${String(cardId).padStart(2, '0')} · ${result.patterns.map(p => p.name).join(' + ')}`)
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

  if (!started) return <div className="app-shell"><header className="topbar"><div><div className="brand">HAPPY <span>BINGO</span></div><div className="subtitle">75-BALL BINGO · ONE-SCREEN GAME CONTROL</div></div><div className="status-pill"><span /> READY · OFFLINE</div></header><main className="selection-screen"><section className="selection-hero"><div><div className="eyebrow">STEP 1 · SELECT CARTELLA</div><h1>Choose the <span>100 cartella</span> for this game.</h1><p>Click each cartella sold to a player. Selected cartella turn blue. Money and voice controls stay visible for the manager.</p></div><div className="selection-summary"><strong>{players}</strong><span>SELECTED</span><b>{money(totalCollected)} Br</b><small>Current game total</small></div></section><section className="selection-layout"><div className="cartella-panel"><div className="panel-heading"><div><h2>ALL 100 CARTELLA</h2><p>Click to select · click again to remove</p></div><span>{players} / 100</span></div><div className="cartella-grid">{Array.from({ length: 100 }, (_, i) => i + 1).map(id => <button key={id} className={`cartella ${selected.has(id) ? 'selected' : ''}`} onClick={() => toggleCard(id)}>{id}</button>)}</div></div><aside className="selection-side"><div className="side-card money-card"><span className="side-label">OWNER MONEY CONTROL</span><label>WORKING BALANCE (BIRR)<input type="number" min="0" value={workingMoney} onChange={e => setWorkingMoney(Math.max(0, Math.floor(Number(e.target.value) || 0)))}/></label><label>MANAGER CUT (%)<input type="number" min="0" max="100" value={managerPercent} onChange={e => setManagerPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}/></label><div className="money-line"><span>Starting default</span><b>{money(DEFAULT_WORKING_MONEY)} Br</b></div><div className="money-line"><span>Total money worked</span><b>{money(workedTotal)} Br</b></div><div className="money-line"><span>Current game</span><b>{money(totalCollected)} Br</b></div><div className="money-line cut-line"><span>Manager cut · {managerPercent}%</span><b>{money(managerCut)} Br</b></div><div className="money-line prize-line"><span>Prize money</span><b>{money(prizePool)} Br</b></div><div className="money-line balance-line"><span>Balance after this cut</span><b>{money(Math.max(0, workingMoney - managerCut))} Br</b></div></div><div className="side-card"><span className="side-label">GAME SETUP</span><label>ENTRY FEE (BIRR)<input type="number" min="1" value={entryFee} onChange={e => setEntryFee(Math.max(1, Math.floor(Number(e.target.value) || 1)))}/></label><div className="voice-control"><div><b>🔊 ENGLISH CALLING</b><small>{voiceEnabled ? 'Voice is ON' : 'Voice is OFF'}</small></div><button onClick={() => setVoiceEnabled(v => !v)}>{voiceEnabled ? 'ON' : 'OFF'}</button><button onClick={testVoice}>TEST</button></div><p className="money-note">The working balance is permanently reduced by the manager cut when a game starts.</p><button className="start-button" onClick={startGame} disabled={!players}>▶ START GAME <small>{players ? `${players} PLAYER${players === 1 ? '' : 'S'} · ${money(totalCollected)} BR` : 'SELECT CARTELLA FIRST'}</small></button><label className="file-button">ADMIN · REPLACE 100 CARTELLA<input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && importFile(e.target.files[0])}/></label></div></aside></section>{message && <div className="message">{message}</div>}</main></div>

  return <div className="app-shell"><header className="topbar game-top"><div><div className="brand">HAPPY <span>BINGO</span></div><div className="subtitle">GAME #{String(gameNumber).padStart(4, '0')} · {players} CARTELLA · ENGLISH CALLING</div></div><div className="game-top-actions"><div className="status-pill"><span /> GAME LIVE</div><button onClick={() => setPaused(p => !p)}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button><button onClick={callNext}>CALL NOW</button><button onClick={testVoice}>🔊 TEST</button><button onClick={newGame}>NEW GAME</button></div></header><main className="game-screen"><section className="call-hero"><div className="call-ball"><span>{current?.letter || '•'}</span><strong>{current?.number ?? '—'}</strong></div><div className="call-main"><div className="eyebrow">NOW CALLING · ENGLISH</div><div className="current-number">{current ? `${current.letter} ${current.number}` : 'READY'}</div><div className="amharic-call">{current ? `BINGO CALL · ${current.letter} ${current.number}` : 'GAME READY'}</div><div className="call-status">{paused ? '⏸ PAUSED' : started && remaining.length ? '● AUTO CALLING EVERY 5 SECONDS' : 'GAME FINISHED'}</div></div><div className="game-stats"><div><b>{called.length}</b><span>CALLED</span></div><div><b>{remaining.length}</b><span>REMAINING</span></div><div><b>{money(totalCollected)}</b><span>GAME TOTAL BR</span></div></div></section><section className="finance-strip"><div><span>TOTAL MONEY WORKED</span><strong>{money(workedTotal)}</strong><small>Br · accumulated games</small></div><div><span>CURRENT GAME</span><strong>{money(totalCollected)}</strong><small>Br · {players} × {money(entryFee)}</small></div><div><span>MANAGER CUT</span><strong>{money(managerCut)}</strong><small>Br · {managerPercent}%</small></div><div><span>PRIZE MONEY</span><strong>{money(prizePool)}</strong><small>Br · after manager cut</small></div><div><span>WORKING BALANCE</span><strong>{money(workingMoney)}</strong><small>Br · permanently reduced</small></div></section><section className="game-layout"><div className="board-panel panel"><div className="panel-heading"><div><h2>75-NUMBER BOARD</h2><p>Called numbers glow blue · latest call shines white</p></div><span>{called.length} / 75</span></div><div className="bingo-board">{LETTERS.map((letter, col) => <div className="bingo-column" key={letter}><div className="board-letter">{letter}</div>{Array.from({ length: 15 }, (_, i) => i + 1 + col * 15).map(n => <span key={n} className={`number-cell ${calledSet.has(n) ? 'called' : ''} ${current?.number === n ? 'latest' : ''}`}>{n}</span>)}</div>)}</div></div><aside className="game-side"><div className="panel money-live"><div className="panel-heading"><div><h2>OWNER MONEY VIEW</h2><p>Exact figures remain visible during play</p></div></div><div className="live-money-main"><span>TOTAL MONEY WORKED</span><strong>{money(workedTotal)}</strong><b>BR</b></div><div className="money-line"><span>Current game</span><b>{money(totalCollected)} Br</b></div><div className="money-line cut-line"><span>Manager · {managerPercent}%</span><b>{money(managerCut)} Br</b></div><div className="money-line prize-line"><span>Prize</span><b>{money(prizePool)} Br</b></div><div className="money-line balance-line"><span>Working balance</span><b>{money(workingMoney)} Br</b></div><div className="voice-control"><div><b>🔊 ENGLISH VOICE</b><small>{voiceEnabled ? 'Automatic calling enabled' : 'Muted'}</small></div><button onClick={() => setVoiceEnabled(v => !v)}>{voiceEnabled ? 'ON' : 'OFF'}</button></div></div><div className="panel called-panel"><div className="panel-heading"><div><h2>CALL HISTORY</h2><p>Newest number first</p></div></div><div className="history">{called.slice(0, 12).map((x, i) => <span key={`${x.number}-${i}`} className={i === 0 ? 'latest-history' : ''}>{x.letter}-{x.number}</span>)}</div></div></aside></section><section className="selected-game-cards"><div className="panel-heading"><div><h2>SELECTED CARTELLA · VERIFY BINGO</h2><p>Only cartella selected before the game are shown.</p></div><span>{players} ACTIVE</span></div><div className="selected-card-list">{selectedCards.map(card => { const winner = winners.find(w => w.card === card.id); return <div className={`selected-card-wrap ${winner ? 'winner-card' : ''}`} key={card.id}><div className="card-toolbar"><strong>CARTELLA {card.id}</strong><button onClick={() => verify(card.id)}>VERIFY BINGO</button></div><BingoCard card={card} called={calledSet} highlight={winner ? new Set(winner.indexes) : undefined}/></div> })}</div></section>{message && <div className="message">{message}</div>}</main></div>
}

createRoot(document.getElementById('root')!).render(<App />)
