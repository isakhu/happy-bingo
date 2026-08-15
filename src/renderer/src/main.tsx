import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100
const CALL_INTERVAL_MS = 5000
const AMHARIC_ONES = ['', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ']
const AMHARIC_TENS: Record<number, string> = { 10: 'አስር', 20: 'ሃያ', 30: 'ሰላሳ', 40: 'አርባ', 50: 'ሃምሳ', 60: 'ስልሳ', 70: 'ሰባ' }
const AMHARIC_LETTERS: Record<string, string> = { B: 'ቢ', I: 'አይ', N: 'ኤን', G: 'ጂ', O: 'ኦ' }

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }
type Winner = { card: number; pattern: string; indexes: number[] }
type PlayerState = { called: Called[]; current: Called | null; players: number; prize: number; winners: Winner[]; gameNumber: number; started: boolean }

function getLetter(n: number) { return n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O' }
function makePool() { return Array.from({ length: 75 }, (_, i) => i + 1) }
function pad(n: number) { return String(n).padStart(3, '0') }
function amharicNumber(n: number) { if (n < 10) return AMHARIC_ONES[n]; if (n % 10 === 0) return AMHARIC_TENS[n]; return `${AMHARIC_TENS[Math.floor(n / 10) * 10]} ${AMHARIC_ONES[n % 10]}` }
function speakNumber(item: Called) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(`${AMHARIC_LETTERS[item.letter] ?? item.letter} ${amharicNumber(item.number)}`)
  u.lang = 'am-ET'
  u.rate = 0.92
  const voices = window.speechSynthesis.getVoices()
  const am = voices.find(v => v.lang.toLowerCase().startsWith('am') && /male|man|david/i.test(v.name)) || voices.find(v => v.lang.toLowerCase().startsWith('am'))
  if (am) u.voice = am
  window.speechSynthesis.speak(u)
}

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
    const values = Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columns[i % 5][Math.floor(i / 5)])
    cards.push({ id, values })
  }
  return cards
}

function checkCard(card: Card, called: Set<number>) {
  const marked = card.values.map((n, i) => i === 12 || called.has(n))
  const rows = [0,1,2,3,4].map(r => [0,1,2,3,4].map(c => r * 5 + c))
  const cols = [0,1,2,3,4].map(c => [0,1,2,3,4].map(r => r * 5 + c))
  const diagA = [0,6,12,18,24]
  const diagB = [4,8,12,16,20]
  const corners = [0,4,20,24]
  const hit = (indexes: number[]) => indexes.every(i => marked[i])
  const patterns: { name: string; indexes: number[] }[] = []
  rows.forEach((x, i) => hit(x) && patterns.push({ name: `ROW ${i + 1}`, indexes: x }))
  cols.forEach((x, i) => hit(x) && patterns.push({ name: `COLUMN ${LETTERS[i]}`, indexes: x }))
  if (hit(diagA)) patterns.push({ name: 'DIAGONAL', indexes: diagA })
  if (hit(diagB)) patterns.push({ name: 'DIAGONAL', indexes: diagB })
  if (hit(corners)) patterns.push({ name: 'FOUR CORNERS', indexes: corners })
  return { valid: patterns.length > 0, patterns }
}

function parseCsv(text: string): Card[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length !== 101) throw new Error('expected 100 cards plus header')
  const imported = lines.slice(1).map(line => line.split(',').map(v => v.trim())).map(parts => {
    if (parts.length < 26) throw new Error('wrong column count')
    const id = Number(parts[0])
    const raw = parts.slice(1, 26).map(v => v.toUpperCase() === 'FREE' ? 0 : Number(v))
    const values = Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : raw[i])
    return { id, values }
  })
  if (imported.some(c => !Number.isInteger(c.id) || c.id < 1 || c.id > 100)) throw new Error('invalid card id')
  if (new Set(imported.map(c => c.id)).size !== 100) throw new Error('duplicate card')
  for (const card of imported) {
    for (let i = 0; i < 25; i++) if (i !== 12 && (!Number.isInteger(card.values[i]) || card.values[i] < 1 || card.values[i] > 75)) throw new Error('invalid number')
    for (let col = 0; col < 5; col++) {
      const nums = [0,1,2,3,4].map(r => card.values[r * 5 + col]).filter(Boolean)
      if (new Set(nums).size !== 5) throw new Error('duplicate in column')
      const min = col * 15 + 1, max = min + 14
      if (nums.some(n => n < min || n > max)) throw new Error('wrong column range')
    }
  }
  return imported.sort((a,b) => a.id - b.id)
}

function PlayerView() {
  const [state, setState] = useState<PlayerState>({ called: [], current: null, players: 0, prize: 0, winners: [], gameNumber: 1, started: false })
  useEffect(() => { const ch = new BroadcastChannel('happy-bingo-live'); ch.onmessage = e => setState(e.data); return () => ch.close() }, [])
  const calledSet = useMemo(() => new Set(state.called.map(x => x.number)), [state.called])
  const winnerCards = state.winners
  return <div className="player-shell">
    <div className="player-brand">HAPPY BINGO</div>
    <div className="player-stats"><span>PLAYERS <b>{state.players}</b></span><span>PRIZE <b>{state.prize} BIRR</b></span></div>
    {winnerCards.length > 0 ? <div className="player-winners"><div className="player-good">🎉 GOOD BINGO! 🎉</div><div className="player-winner-grid">{winnerCards.map(w => <div className="winner-card" key={w.card}><h2>CARD {pad(w.card)}</h2><BingoCard card={null} called={calledSet} highlight={new Set(w.indexes)} /></div>)}</div></div> : <><div className="player-current">{state.current ? `${state.current.letter} ${state.current.number}` : '—'}</div><div className="player-board">{LETTERS.map((letter, col) => <div className="player-row" key={letter}><div className="player-letter">{letter}</div>{Array.from({length:15},(_,i)=>i+1+col*15).map(n => <div key={n} className={`player-number ${calledSet.has(n) ? 'called' : ''}`}>{n}</div>)}</div>)}</div></>}
  </div>
}

function BingoCard({ card, called, highlight }: { card: Card | null; called: Set<number>; highlight: Set<number> }) {
  const values = card?.values ?? Array(25).fill(0)
  return <div className="mini-card"><div className="mini-head">{LETTERS.map(l => <b key={l}>{l}</b>)}</div><div className="mini-grid">{values.map((n, i) => <span key={i} className={`${i === 12 ? 'free' : ''} ${highlight.has(i) ? 'winning' : ''} ${called.has(n) ? 'marked' : ''}`}>{i === 12 ? 'FREE' : n || '—'}</span>)}</div></div>
}

function ManagerView() {
  const [cards, setCards] = useState<Card[]>(() => { try { const saved = localStorage.getItem('happy-bingo-cards'); return saved ? JSON.parse(saved) : generateDemoCards() } catch { return generateDemoCards() } })
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set())
  const [entryFee, setEntryFee] = useState(() => Number(localStorage.getItem('happy-bingo-entry') || 10))
  const [remaining, setRemaining] = useState(makePool)
  const [called, setCalled] = useState<Called[]>([])
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [winners, setWinners] = useState<Winner[]>([])
  const [message, setMessage] = useState('')
  const [gameNumber, setGameNumber] = useState(() => Number(localStorage.getItem('happy-bingo-game') || 0) + 1)
  const [latestResult, setLatestResult] = useState<string | null>(null)
  const players = selectedCards.size
  const total = players * entryFee
  const managerFee = Math.floor(total * 0.2)
  const prizePool = Math.floor(total * 0.8)
  const current = called[0] ?? null
  const calledSet = useMemo(() => new Set(called.map(x => x.number)), [called])

  useEffect(() => { localStorage.setItem('happy-bingo-cards', JSON.stringify(cards)) }, [cards])
  useEffect(() => { localStorage.setItem('happy-bingo-entry', String(entryFee)) }, [entryFee])
  useEffect(() => { const ch = new BroadcastChannel('happy-bingo-live'); const state: PlayerState = { called, current, players, prize: prizePool, winners, gameNumber, started }; ch.postMessage(state); return () => ch.close() }, [called, current, players, prizePool, winners, gameNumber, started])
  useEffect(() => { if (!started || paused || remaining.length === 0) return; const timer = window.setInterval(callNext, CALL_INTERVAL_MS); return () => window.clearInterval(timer) }, [started, paused, remaining.length])

  function startGame() {
    if (!players) return setMessage('Select at least one card.')
    if (!window.confirm(`Start Game #${String(gameNumber).padStart(4,'0')}?\n\nPlayers: ${players}\nEntry: ${entryFee} Birr\nTotal: ${total} Birr\nManager: ${managerFee} Birr\nPrize: ${prizePool} Birr`)) return
    setRemaining(makePool()); setCalled([]); setWinners([]); setLatestResult(null); setPaused(false); setMessage(''); setStarted(true)
    localStorage.setItem('happy-bingo-game', String(gameNumber))
  }
  function callNext() {
    if (!started || paused || remaining.length === 0) return
    const number = remaining[Math.floor(Math.random() * remaining.length)]
    const item = { letter: getLetter(number), number }
    setRemaining(pool => pool.filter(n => n !== number)); setCalled(items => [item, ...items]); setTimeout(() => speakNumber(item), 20)
  }
  function endGame(result: string) {
    setStarted(false); setPaused(false); setLatestResult(result); localStorage.setItem('happy-bingo-game', String(gameNumber)); setGameNumber(n => n + 1)
  }
  function newGame() {
    if (!window.confirm('Start a new game? The current game will close and all 100 cards become available again.')) return
    setStarted(false); setPaused(false); setWinners([]); setLatestResult(null); setRemaining(makePool()); setCalled([]); setSelectedCards(new Set()); setMessage('')
  }
  function verify(cardId: number) {
    if (!started) return
    const card = cards.find(c => c.id === cardId)
    if (!card || !selectedCards.has(cardId)) return setMessage(`Card ${pad(cardId)} is not active in this game.`)
    const result = checkCard(card, calledSet)
    if (!result.valid) return setMessage(`NOT BINGO — Card ${pad(cardId)} has no valid pattern yet.`)
    const newWinners = result.patterns.map(p => ({ card: cardId, pattern: p.name, indexes: p.indexes }))
    setWinners(prev => prev.some(w => w.card === cardId) ? prev : [...prev, newWinners[0]])
    setMessage(`GOOD BINGO — Card ${pad(cardId)} · ${result.patterns.map(p => p.name).join(' + ')}`)
  }
  function importFile(file: File) {
    if (window.prompt('Admin password required to replace the card set:') !== 'HappyBingo@2026') return setMessage('Incorrect admin password.')
    const reader = new FileReader(); reader.onload = () => { try { setCards(parseCsv(String(reader.result))); setMessage('100 cards imported successfully.'); } catch { setMessage('Import failed. Use the official Happy Bingo CSV template with exactly 100 valid cards.') } }; reader.readAsText(file)
  }

  if (latestResult) return <div className="result-screen"><div className="result-box"><div className="player-good">{latestResult}</div><p>Game #{String(gameNumber - 1).padStart(4,'0')}</p><button onClick={newGame}>NEW GAME</button></div></div>
  return <div className="app-shell"><header className="topbar"><div><div className="brand">HAPPY BINGO</div><div className="subtitle">Manager · Game #{String(gameNumber).padStart(4,'0')}</div></div><div className="status-pill"><span /> Offline</div></header><main className="dashboard">
    {winners.length > 0 && <div className="winner-banner"><strong>🎉 GOOD BINGO!</strong><span>{winners.map(w => `Card ${pad(w.card)}`).join(' · ')} — TV is showing the winning card</span></div>}
    <section className="hero-card"><div className="eyebrow">CURRENT NUMBER</div><div className="current-number">{current ? `${current.letter} ${current.number}` : '—'}</div><div className="called-count">{called.length} of 75 numbers called · Automatic every 5 seconds</div><button className="call-button" onClick={() => setPaused(p => !p)} disabled={!started}>{paused ? 'RESUME' : 'PAUSE'}</button>{!started ? <button className="secondary-button" onClick={startGame}>CONFIRM & START GAME</button> : <button className="secondary-button" onClick={() => endGame(winners.length ? `WINNER: ${winners.map(w => `CARD ${pad(w.card)}`).join(', ')}` : 'ALL NUMBERS CALLED — NO BINGO')}>END GAME</button>}</section>
    <section className="money-grid"><div className="stat-card"><span>PLAYERS</span><strong>{players}</strong></div><div className="stat-card"><span>ENTRY</span><strong>{entryFee}<small> Birr</small></strong></div><div className="stat-card"><span>MANAGER</span><strong>{managerFee}<small> Birr</small></strong></div><div className="stat-card prize"><span>PRIZE</span><strong>{prizePool}<small> Birr</small></strong></div></section>
    <section className="caller-board panel"><div className="panel-heading"><h2>Called Number Board</h2><span>{remaining.length} remaining</span></div>{LETTERS.map((letter, col) => <div className="bingo-row" key={letter}><div className="row-letter">{letter}</div>{Array.from({length:15},(_,i)=>i+1+col*15).map(n => <div key={n} className={`number-box ${calledSet.has(n) ? 'called' : ''}`}>{n}{calledSet.has(n) && <b>✓</b>}</div>)}</div>)}</section>
    <section className="content-grid"><div className="panel"><div className="panel-heading"><h2>Game Setup</h2><span>Players = selected cards</span></div><label>Entry fee (Birr)<input type="number" min="1" step="1" value={entryFee} onChange={e=>!started&&setEntryFee(Math.max(1,Math.floor(Number(e.target.value) || 1)))} disabled={started}/></label><div className="formula"><span>Total collected</span><b>{total} Birr</b><span>Manager</span><b>{managerFee} Birr</b><span>Prize</span><b>{prizePool} Birr</b></div></div><div className="panel"><div className="panel-heading"><h2>Verify Bingo</h2><span>Click a selected card</span></div><p className="hint">Pause if needed, then click the claimed card below. A valid card is immediately shown on the TV.</p><div className="rules"><b>Winning rules</b><span>Row · Column · Diagonal · Four corners</span></div></div></section>
    <section className="panel card-manager"><div className="panel-heading"><h2>Card Manager / Bingo Verification</h2><span>{players} active / 100</span></div><div className="card-grid">{cards.map(card=><button key={card.id} className={`${selectedCards.has(card.id)?'card-tile selected':'card-tile'} ${winners.some(w=>w.card===card.id)?'winner-tile':''}`} onClick={()=>started ? verify(card.id) : setSelectedCards(prev=>{const n=new Set(prev);n.has(card.id)?n.delete(card.id):n.add(card.id);return n})}>{pad(card.id)}</button>)}</div><div className="tools"><label className="file-button">REPLACE CARD SET<input type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0])}/></label><button onClick={()=>window.print()}>PRINT / REPRINT CARDS</button><a href="data:text/csv;charset=utf-8,Card%20ID,B1,B2,B3,B4,B5,I1,I2,I3,I4,I5,N1,N2,N3,N4,N5,G1,G2,G3,G4,G5,O1,O2,O3,O4,O5%0A" download="happy-bingo-card-template.csv">DOWNLOAD CSV TEMPLATE</a></div></section>
    {winners.length > 0 && <section className="panel"><div className="panel-heading"><h2>Winning Cards</h2><span>{winners.length} valid claim(s)</span></div><div className="manager-winners">{winners.map(w => { const card = cards.find(c=>c.id===w.card)!; return <div key={`${w.card}-${w.pattern}`}><h3>Card {pad(w.card)} · {w.pattern}</h3><BingoCard card={card} called={calledSet} highlight={new Set(w.indexes)} /></div> })}</div></section>}
    {message && <div className={`message ${message.includes('GOOD') ? 'success' : ''}`}>{message}</div>}
    </main><section className="print-area">{cards.map(card=><article className="print-card" key={card.id}><h1>HAPPY BINGO</h1><div className="print-subtitle">BINGO CARD</div><div className="print-head">{LETTERS.map(l=><b key={l}>{l}</b>)}</div><div className="print-grid">{card.values.map((n,i)=><span key={i}>{i===12?'FREE':n}</span>)}</div><strong>CARD No. {pad(card.id)}</strong></article>)}</section></div>
}

const isPlayer = new URLSearchParams(window.location.search).get('player') === '1'
createRoot(document.getElementById('root')!).render(isPlayer ? <PlayerView /> : <ManagerView />)
