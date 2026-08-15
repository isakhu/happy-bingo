import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const

type Called = { letter: string; number: number }

function makeNumberPool(): number[] {
  return Array.from({ length: 75 }, (_, i) => i + 1)
}

function getLetter(n: number) {
  if (n <= 15) return 'B'
  if (n <= 30) return 'I'
  if (n <= 45) return 'N'
  if (n <= 60) return 'G'
  return 'O'
}

function App() {
  const [players, setPlayers] = useState(5)
  const [entryFee, setEntryFee] = useState(10)
  const [managerPercent, setManagerPercent] = useState(20)
  const [remaining, setRemaining] = useState(makeNumberPool)
  const [called, setCalled] = useState<Called[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  const total = players * entryFee
  const managerFee = total * (managerPercent / 100)
  const prizePool = total - managerFee
  const current = called[0]

  const calledSet = useMemo(() => new Set(called.map((item) => item.number)), [called])

  function startGame() {
    setRemaining(makeNumberPool())
    setCalled([])
    setGameStarted(true)
  }

  function callNext() {
    if (!gameStarted || remaining.length === 0) return
    const index = Math.floor(Math.random() * remaining.length)
    const number = remaining[index]
    setRemaining((pool) => pool.filter((n) => n !== number))
    setCalled((items) => [{ letter: getLetter(number), number }, ...items])
  }

  function newGame() {
    setGameStarted(false)
    setRemaining(makeNumberPool())
    setCalled([])
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">HAPPY BINGO</div>
          <div className="subtitle">Offline Bingo Caller & Management</div>
        </div>
        <div className="status-pill"><span /> Offline Mode</div>
      </header>

      <main className="dashboard">
        <section className="hero-card">
          <div className="eyebrow">CURRENT GAME</div>
          <div className="current-number">{current ? `${current.letter} ${current.number}` : '—'}</div>
          <div className="called-count">{called.length} of 75 numbers called</div>
          <button className="call-button" onClick={callNext} disabled={!gameStarted || remaining.length === 0}>
            CALL NEXT NUMBER
          </button>
          {!gameStarted && <button className="secondary-button" onClick={startGame}>START NEW GAME</button>}
          {gameStarted && <button className="secondary-button" onClick={newGame}>END / RESET GAME</button>}
        </section>

        <section className="money-grid">
          <div className="stat-card"><span>PLAYERS</span><strong>{players}</strong></div>
          <div className="stat-card"><span>COLLECTED</span><strong>{total.toFixed(0)} <small>Birr</small></strong></div>
          <div className="stat-card"><span>MANAGER FEE</span><strong>{managerFee.toFixed(0)} <small>Birr</small></strong></div>
          <div className="stat-card prize"><span>PRIZE POOL</span><strong>{prizePool.toFixed(0)} <small>Birr</small></strong></div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading"><h2>Game Setup</h2><span>Manager</span></div>
            <label>Number of players<input type="number" min="1" max="1000" value={players} onChange={(e) => setPlayers(Math.max(1, Number(e.target.value)))} /></label>
            <label>Entry fee (Birr)<input type="number" min="0" value={entryFee} onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value)))} /></label>
            <label>Manager fee (%)<input type="number" min="0" max="100" value={managerPercent} onChange={(e) => setManagerPercent(Math.min(100, Math.max(0, Number(e.target.value))))} /></label>
            <div className="formula"><span>Total collected</span><b>{total.toFixed(2)} Birr</b><span>Manager cut</span><b>{managerFee.toFixed(2)} Birr</b><span>Prize pool</span><b>{prizePool.toFixed(2)} Birr</b></div>
          </div>

          <div className="panel called-panel">
            <div className="panel-heading"><h2>Called Numbers</h2><span>{remaining.length} remaining</span></div>
            <div className="letter-row">{LETTERS.map((letter) => <span key={letter}>{letter}</span>)}</div>
            <div className="number-list">{Array.from({ length: 75 }, (_, i) => i + 1).map((n) => <span className={calledSet.has(n) ? 'called' : ''} key={n}>{n}</span>)}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
