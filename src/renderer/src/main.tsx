import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const ADMIN_PASSWORD = 'HappyBingo@2026'
const CARD_COUNT = 100
const CALL_INTERVAL_MS = 5000

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }

function getLetter(n: number) { return n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O' }
function makePool() { return Array.from({ length: 75 }, (_, i) => i + 1) }

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

function isWinningCard(card: Card, called: Set<number>) {
  const marked = card.values.map((n, i) => i === 12 || called.has(n))
  const rowWin = [0,1,2,3,4].some(r => [0,1,2,3,4].every(c => marked[r * 5 + c]))
  const colWin = [0,1,2,3,4].some(c => [0,1,2,3,4].every(r => marked[r * 5 + c]))
  const diagonalWin = [0,1,2,3,4].every(i => marked[i * 5 + i]) || [0,1,2,3,4].every(i => marked[i * 5 + 4 - i])
  const cornersWin = [0,4,20,24].every(i => marked[i])
  return { valid: rowWin || colWin || diagonalWin || cornersWin, rowWin, colWin, diagonalWin, cornersWin }
}

function parseCsv(text: string): Card[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length !== 101) throw new Error('expected 100 cards plus header')
  const imported = lines.slice(1).map(line => line.split(',').map(v => v.trim())).map(parts => {
    const id = Number(parts[0]); const columnMajor = parts.slice(1, 26).map(v => v.toUpperCase() === 'FREE' ? 0 : Number(v))
    const values = Array.from({ length: 25 }, (_, i) => i === 12 ? 0 : columnMajor[Math.floor(i / 5) * 5 + (i % 5)])
    return { id, values }
  })
  if (imported.some(c => !Number.isInteger(c.id) || c.id < 1 || c.id > 100 || c.values.length !== 25)) throw new Error('invalid card')
  if (new Set(imported.map(c => c.id)).size !== 100) throw new Error('duplicate card')
  imported.forEach(c => c.values.forEach((n, i) => { if (i !== 12 && (!Number.isInteger(n) || n < 1 || n > 75)) throw new Error('invalid number') }))
  for (const card of imported) for (let col = 0; col < 5; col++) { const nums = [0,1,2,3,4].map(r => card.values[r * 5 + col]).filter(n => n !== 0); if (new Set(nums).size !== 5) throw new Error('duplicate in column'); const min = col * 15 + 1, max = col * 15 + 15; if (nums.some(n => n < min || n > max)) throw new Error('wrong column range') }
  return imported.sort((a,b) => a.id - b.id)
}

function App() {
  const [cards, setCards] = useState<Card[]>(() => { try { const saved = localStorage.getItem('happy-bingo-cards'); return saved ? JSON.parse(saved) : generateDemoCards() } catch { return generateDemoCards() } })
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set())
  const [players, setPlayers] = useState(5)
  const [entryFee, setEntryFee] = useState(10)
  const [remaining, setRemaining] = useState(makePool)
  const [called, setCalled] = useState<Called[]>([])
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [winner, setWinner] = useState<{ card: number; reason: string } | null>(null)
  const [verifyCard, setVerifyCard] = useState('')
  const [message, setMessage] = useState('')

  const total = players * entryFee, managerFee = total * 0.2, prizePool = total * 0.8
  const current = called[0]
  const calledSet = useMemo(() => new Set(called.map(x => x.number)), [called])
  useEffect(() => { localStorage.setItem('happy-bingo-cards', JSON.stringify(cards)) }, [cards])
  useEffect(() => { if (!started || paused || winner || remaining.length === 0) return; const timer = window.setInterval(callNext, CALL_INTERVAL_MS); return () => window.clearInterval(timer) }, [started, paused, winner, remaining.length])

  function startGame() { if (selectedCards.size === 0) { setMessage('Select at least one card before starting.'); return } setRemaining(makePool()); setCalled([]); setWinner(null); setPaused(false); setVerifyCard(''); setMessage(''); setStarted(true) }
  function callNext() { if (!started || paused || winner || remaining.length === 0) return; const index = Math.floor(Math.random() * remaining.length), number = remaining[index]; setRemaining(pool => pool.filter(n => n !== number)); setCalled(items => [{ letter: getLetter(number), number }, ...items]) }
  function resetGame() { setStarted(false); setPaused(false); setWinner(null); setRemaining(makePool()); setCalled([]); setSelectedCards(new Set()); setMessage('') }
  function verify() { const id = Number(verifyCard), card = cards.find(c => c.id === id); if (!card) return setMessage('Enter a valid card number from 001 to 100.'); if (!selectedCards.has(id)) return setMessage(`Card ${String(id).padStart(3,'0')} is not active in this game.`); const result = isWinningCard(card, calledSet); if (!result.valid) return setMessage('NOT BINGO — this card does not have a valid pattern yet.'); const reasons = [result.rowWin && 'row', result.colWin && 'column', result.diagonalWin && 'diagonal', result.cornersWin && 'four corners'].filter(Boolean).join(' + '); setWinner({ card: id, reason: reasons }); setPaused(true); setMessage('GOOD BINGO!') }
  function importFile(file: File, protect: boolean) { if (protect && window.prompt('Admin password required to replace the card set:') !== ADMIN_PASSWORD) return setMessage('Incorrect admin password.'); const reader = new FileReader(); reader.onload = () => { try { setCards(parseCsv(String(reader.result))); setMessage('100 cards imported successfully.'); } catch { setMessage('Import failed. Use the official Happy Bingo CSV template with exactly 100 valid cards.'); } }; reader.readAsText(file) }

  return <div className="app-shell">
    <header className="topbar"><div><div className="brand">HAPPY BINGO</div><div className="subtitle">Offline Bingo Caller & Management</div></div><div className="status-pill"><span /> Offline</div></header>
    <main className="dashboard">
      {winner && <div className="winner-banner"><strong>🎉 GOOD BINGO!</strong><span>Card {String(winner.card).padStart(3,'0')} · {winner.reason} · Prize {prizePool.toFixed(0)} Birr</span></div>}
      <section className="hero-card"><div className="eyebrow">CURRENT NUMBER</div><div className="current-number">{current ? `${current.letter} ${current.number}` : '—'}</div><div className="called-count">{called.length} of 75 numbers called · Automatic every 5 seconds</div><button className="call-button" onClick={() => setPaused(p => !p)} disabled={!started || !!winner}>{paused ? 'RESUME' : 'PAUSE'}</button>{!started && <button className="secondary-button" onClick={startGame}>START GAME</button>}{started && <button className="secondary-button" onClick={resetGame}>NEW GAME</button>}</section>
      <section className="money-grid"><div className="stat-card"><span>PLAYERS</span><strong>{players}</strong></div><div className="stat-card"><span>ENTRY</span><strong>{entryFee}<small> Birr</small></strong></div><div className="stat-card"><span>MANAGER 20%</span><strong>{managerFee.toFixed(0)}<small> Birr</small></strong></div><div className="stat-card prize"><span>PRIZE 80%</span><strong>{prizePool.toFixed(0)}<small> Birr</small></strong></div></section>
      <section className="caller-board panel"><div className="panel-heading"><h2>Called Number Board</h2><span>{remaining.length} remaining</span></div>{LETTERS.map((letter, col) => <div className="bingo-row" key={letter}><div className="row-letter">{letter}</div>{Array.from({length:15},(_,i)=>i+1+col*15).map(n => <div key={n} className={`number-box ${calledSet.has(n) ? 'called' : ''}`}>{n}{calledSet.has(n) && <b>✓</b>}</div>)}</div>)}</section>
      <section className="content-grid">
        <div className="panel"><div className="panel-heading"><h2>Game Setup</h2><span>Manager</span></div><label>Players (active cards)<input type="number" min="1" max="100" value={players} onChange={e=>!started&&setPlayers(Math.min(100,Math.max(1,Number(e.target.value))))} disabled={started}/></label><label>Entry fee (Birr)<input type="number" min="0" value={entryFee} onChange={e=>!started&&setEntryFee(Math.max(0,Number(e.target.value)))} disabled={started}/></label><div className="formula"><span>Total collected</span><b>{total.toFixed(0)} Birr</b><span>Manager 20%</span><b>{managerFee.toFixed(0)} Birr</b><span>Prize 80%</span><b>{prizePool.toFixed(0)} Birr</b></div></div>
        <div className="panel"><div className="panel-heading"><h2>Verify Bingo</h2><span>Manager only</span></div><p className="hint">Pause the game, enter the paper card number, then verify.</p><div className="verify-row"><input placeholder="Card 001–100" value={verifyCard} onChange={e=>setVerifyCard(e.target.value.replace(/\D/g,'').slice(0,3))}/><button onClick={verify} disabled={!started}>VERIFY</button></div><div className="rules"><b>Winning rules</b><span>Row · Column · Diagonal · Four corners</span></div></div>
      </section>
      <section className="panel card-manager"><div className="panel-heading"><h2>Card Manager</h2><span>{selectedCards.size} active / 100</span></div><div className="card-grid">{cards.map(card=><button key={card.id} className={selectedCards.has(card.id)?'card-tile selected':'card-tile'} onClick={()=>!started&&setSelectedCards(prev=>{const n=new Set(prev);n.has(card.id)?n.delete(card.id):n.add(card.id);return n})} disabled={started}>{String(card.id).padStart(3,'0')}</button>)}</div><div className="tools"><label className="file-button">REPLACE CARD SET<input type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0],true)}/></label><button onClick={()=>window.print()}>PRINT / REPRINT CARDS</button><a href="data:text/csv;charset=utf-8,Card%20ID,B1,B2,B3,B4,B5,I1,I2,I3,I4,I5,N1,N2,N3,N4,N5,G1,G2,G3,G4,G5,O1,O2,O3,O4,O5%0A" download="happy-bingo-card-template.csv">DOWNLOAD CSV TEMPLATE</a></div></section>
      {message && <div className={`message ${message.includes('GOOD') ? 'success' : ''}`}>{message}</div>}
      <section className="print-area">{cards.map(card=><article className="print-card" key={card.id}><h1>HAPPY BINGO</h1><div className="print-subtitle">BINGO CARD</div><div className="print-head">{LETTERS.map(l=><b key={l}>{l}</b>)}</div><div className="print-grid">{card.values.map((n,i)=><span key={i}>{i===12?'FREE':n}</span>)}</div><strong>CARD No. {String(card.id).padStart(3,'0')}</strong></article>)}</section>
    </main>
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
