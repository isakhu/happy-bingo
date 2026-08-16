import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100

type Card = { id: number; values: number[] }
type Called = { letter: string; number: number }

declare global {
  interface Window {
    happyBingo?: { generateCardsPdf?: () => Promise<{ cards: Card[]; path: string }> }
  }
}

const getLetter = (n: number) => n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O'
const makePool = () => Array.from({ length: 75 }, (_, i) => i + 1)

function generateCards(): Card[] {
  return Array.from({ length: CARD_COUNT }, (_, id) => {
    const cols = Array.from({ length: 5 }, (_, col) => {
      const values = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)
      let seed = (id + 1) * 97 + col * 31
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

function App() {
  const [cards, setCards] = useState<Card[]>(() => {
    try { return JSON.parse(localStorage.getItem('happy-bingo-cards') || 'null') || generateCards() } catch { return generateCards() }
  })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [called, setCalled] = useState<Called[]>([])
  const [remaining, setRemaining] = useState(makePool)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('happy-bingo-voice') !== 'off')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('happy-bingo-theme') as 'light' | 'dark') || 'light')
  const [cardSource, setCardSource] = useState<'printed' | 'pdf'>(() => (localStorage.getItem('happy-bingo-card-source') as 'printed' | 'pdf') || 'printed')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [message, setMessage] = useState('')
  const [verifyInput, setVerifyInput] = useState('')
  const [winner, setWinner] = useState<number | null>(null)

  const current = called[0] || null
  const calledSet = useMemo(() => new Set(called.map(item => item.number)), [called])
  const calledHistory = called.slice(1, 6)

  function toggleCard(id: number) {
    if (started) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startGame() {
    if (!selected.size) return setMessage('Select at least one cartella before starting the game.')
    setCalled([])
    setRemaining(makePool())
    setPaused(false)
    setWinner(null)
    setVerifyInput('')
    setMessage('')
    setStarted(true)
  }

  function callNext() {
    if (!started || paused || !remaining.length) return
    const number = remaining[Math.floor(Math.random() * remaining.length)]
    setRemaining(prev => prev.filter(value => value !== number))
    setCalled(prev => [{ letter: getLetter(number), number }, ...prev])
  }

  function newGame() {
    if (!window.confirm('Start a new game? The current calls will be cleared.')) return
    setStarted(false)
    setPaused(false)
    setCalled([])
    setRemaining(makePool())
    setWinner(null)
    setVerifyInput('')
    setMessage('')
  }

  function checkWinner() {
    if (!paused) return setMessage('Pause the game first, then check the Bingo claim.')
    const id = Number(verifyInput)
    const card = cards.find(item => item.id === id)
    if (!Number.isInteger(id) || id < 1 || id > 100 || !card) return setMessage('Enter a valid cartella number from 001 to 100.')
    if (!selected.has(id)) return setMessage(`Cartella ${String(id).padStart(3, '0')} is not active in this game.`)
    const marked = card.values.map((n, i) => i === 12 || calledSet.has(n))
    const rows = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c))
    const cols = Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c))
    const diagonalA = [0, 6, 12, 18, 24]
    const diagonalB = [4, 8, 12, 16, 20]
    const valid = [...rows, ...cols, diagonalA, diagonalB].some(line => line.every(index => marked[index]))
    if (!valid) return setMessage(`Cartella ${String(id).padStart(3, '0')} does not have Bingo yet.`)
    setWinner(id)
  }

  async function createPdf() {
    if (!window.happyBingo?.generateCardsPdf) return setMessage('PDF generation is available in the Windows desktop build.')
    setGeneratingPdf(true)
    try {
      const result = await window.happyBingo.generateCardsPdf()
      setCards(result.cards)
      setCardSource('pdf')
      localStorage.setItem('happy-bingo-card-source', 'pdf')
      setSelected(new Set())
      setMessage('New cartella PDF created. The new cards are now loaded.')
    } catch {
      setMessage('Could not create the PDF. Please try again.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  function saveTheme(value: 'light' | 'dark') {
    setTheme(value)
    localStorage.setItem('happy-bingo-theme', value)
  }

  if (!started) return (
    <div className={`app-shell fixed-app ${theme}`}>
      <header className="topbar">
        <div>
          <div className="brand">HAPPY <span>BINGO</span></div>
          <div className="subtitle">75-BALL BINGO · CARTELLA SELECTION</div>
        </div>
        <div className="header-actions">
          <div className="status-pill"><span /> READY · OFFLINE</div>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Settings">⚙</button>
        </div>
      </header>

      <main className="selection-screen fixed-content">
        <section className="selection-head">
          <div>
            <div className="eyebrow">BEFORE THE GAME</div>
            <h1>Select <span>cartella</span> for this game.</h1>
            <p>Choose the printed cartella numbers customers received. Selected cards stay blue until you deselect them.</p>
          </div>
          <div className="selection-summary"><strong>{selected.size}</strong><span>SELECTED</span><small>100 CARTELLA TOTAL</small></div>
        </section>

        <section className="cartella-panel selection-card-panel">
          <div className="panel-heading">
            <div><h2>ALL 100 CARTELLA</h2><p>{cardSource === 'printed' ? 'Existing printed cards' : 'Generated PDF card set'}</p></div>
            <span>{selected.size} / 100</span>
          </div>
          <div className="cartella-grid">{Array.from({ length: 100 }, (_, i) => i + 1).map(id => (
            <button key={id} className={`cartella ${selected.has(id) ? 'selected' : ''}`} onClick={() => toggleCard(id)}>
              {String(id).padStart(3, '0')}
              {selected.has(id) && <b>✓</b>}
            </button>
          ))}</div>
        </section>

        <div className="selection-bottom">
          <div className="selection-note">🃏 Physical cartella stay with players · ⚙ Source & PDF tools are in Settings</div>
          <button className="start-button" onClick={startGame} disabled={!selected.size}>▶ START GAME</button>
        </div>
        {message && <div className="toast">{message}</div>}
      </main>

      {settingsOpen && <SettingsModal
        cardSource={cardSource}
        setCardSource={value => { setCardSource(value); localStorage.setItem('happy-bingo-card-source', value) }}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={value => { setVoiceEnabled(value); localStorage.setItem('happy-bingo-voice', value ? 'on' : 'off') }}
        theme={theme}
        setTheme={saveTheme}
        generatingPdf={generatingPdf}
        createPdf={createPdf}
        onClose={() => setSettingsOpen(false)}
      />}
    </div>
  )

  return (
    <div className={`app-shell fixed-app ${theme}`}>
      <header className="topbar">
        <div><div className="brand">HAPPY <span>BINGO</span></div><div className="subtitle">GAME · MANAGER CONTROL</div></div>
        <div className="header-actions"><div className="status-pill live"><span /> GAME LIVE</div><button className="small-control" onClick={() => setPaused(prev => !prev)}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button><button className="small-control" onClick={callNext}>CALL NUMBER</button><button className="small-control danger" onClick={newGame}>NEW GAME</button></div>
      </header>

      <main className="game-screen fixed-content">
        <section className="dashboard-grid">
          <div className="call-panel panel">
            <div className="eyebrow">NOW CALLING</div>
            <div className="call-ball"><span>{current?.letter || '•'}</span><strong>{current?.number ?? '—'}</strong></div>
            <div className="current-number">{current ? `${current.letter} ${current.number}` : 'READY'}</div>
            <div className="voice-status">🎙 OFFLINE VOICE · {voiceEnabled ? 'ON' : 'OFF'}</div>
            <div className="call-stats"><div><b>{called.length}</b><span>CALLED</span></div><div><b>{selected.size}</b><span>ACTIVE</span></div></div>
          </div>

          <div className="board-panel panel">
            <div className="panel-heading"><div><h2>75-NUMBER BOARD</h2><p>Called numbers are highlighted yellow.</p></div><span>{called.length} / 75</span></div>
            <div className="bingo-board">{LETTERS.map((letter, row) => <div className="board-row" key={letter}><div className="board-letter">{letter}</div>{Array.from({ length: 15 }, (_, i) => i + 1 + row * 15).map(n => <span key={n} className={`number-cell ${calledSet.has(n) ? 'called' : ''} ${current?.number === n ? 'latest' : ''}`}>{n}</span>)}</div>)}</div>
          </div>

          <aside className="right-column">
            <div className="panel history-panel">
              <div className="panel-heading"><div><h2>CALL HISTORY</h2><p>Last 5 calls</p></div><span>{called.length}</span></div>
              <div className="history-list">{calledHistory.length ? calledHistory.map(item => <div className="history-item" key={`${item.letter}-${item.number}`}><b>{item.letter}</b><strong>{item.number}</strong></div>) : <div className="empty-state">No previous calls</div>}</div>
              <button className="view-button">VIEW ALL</button>
            </div>
            <div className="panel players-panel"><div className="panel-heading"><div><h2>ACTIVE PLAYERS</h2><p>Selected cartella</p></div><span>{selected.size}</span></div><div className="active-list">{Array.from(selected).sort((a, b) => a - b).slice(0, 8).map(id => <span key={id}>👤 {String(id).padStart(3, '0')}</span>)}</div>{selected.size > 8 && <button className="view-button">VIEW ALL</button>}</div>
            <div className="panel verify-panel"><div className="panel-heading"><div><h2>🏆 BINGO CHECK</h2><p>Pause before checking</p></div></div><div className={`pause-badge ${paused ? 'ready' : ''}`}>{paused ? '✓ READY TO CHECK' : '⏸ PAUSE GAME'}</div><div className="verify-row"><input inputMode="numeric" value={verifyInput} onChange={e => setVerifyInput(e.target.value.replace(/\D/g, ''))} placeholder="001–100"/><button onClick={checkWinner}>CHECK</button></div></div>
          </aside>
        </section>

        <section className="game-controls"><div className="control-info"><b>{remaining.length}</b><span>NUMBERS REMAINING</span></div><button className="call-button" onClick={callNext} disabled={paused || !remaining.length}>🎱 CALL NUMBER</button><button className="pause-button" onClick={() => setPaused(prev => !prev)}>{paused ? '▶ RESUME GAME' : 'Ⅱ PAUSE'}</button><button className="voice-button" onClick={() => setVoiceEnabled(prev => { const next = !prev; localStorage.setItem('happy-bingo-voice', next ? 'on' : 'off'); return next })}>🔊 VOICE {voiceEnabled ? 'ON' : 'OFF'}</button></section>

        {paused && <div className="pause-overlay"><div><div className="pause-icon">Ⅱ</div><h2>GAME PAUSED</h2><p>{current ? `Current number: ${current.letter} ${current.number}` : 'No number called yet'}</p><button onClick={() => setPaused(false)}>▶ RESUME GAME</button></div></div>}
        {winner !== null && <div className="winner-overlay"><div><div className="winner-icon">🏆</div><h2>BINGO!</h2><p>Cartella <strong>{String(winner).padStart(3, '0')}</strong> has a valid Bingo.</p><button onClick={() => setWinner(null)}>✓ CONFIRM WINNER</button></div></div>}
        {message && <div className="toast">{message}</div>}
      </main>
    </div>
  )
}

function SettingsModal(props: {
  cardSource: 'printed' | 'pdf'
  setCardSource: (value: 'printed' | 'pdf') => void
  voiceEnabled: boolean
  setVoiceEnabled: (value: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (value: 'light' | 'dark') => void
  generatingPdf: boolean
  createPdf: () => Promise<void>
  onClose: () => void
}) {
  return <div className="modal-backdrop"><div className="settings-modal"><div className="modal-head"><div><div className="eyebrow">MANAGER SETTINGS</div><h2>Happy Bingo Control Center</h2></div><button className="close-button" onClick={props.onClose}>×</button></div><div className="settings-grid"><section><h3>🃏 CARTELLA MANAGEMENT</h3><button className={`setting-choice ${props.cardSource === 'printed' ? 'active' : ''}`} onClick={() => props.setCardSource('printed')}>Use existing 001–100 printed cartella</button><button className={`setting-choice ${props.cardSource === 'pdf' ? 'active' : ''}`} onClick={() => props.setCardSource('pdf')}>Use generated PDF cartella set</button><button className="pdf-action" onClick={props.createPdf} disabled={props.generatingPdf}>{props.generatingPdf ? 'CREATING PDF…' : '✨ GENERATE NEW CARTELLA PDF'}</button></section><section><h3>🔊 VOICE</h3><div className="setting-row"><span>Offline calling voice</span><button className="toggle" onClick={() => props.setVoiceEnabled(!props.voiceEnabled)}>{props.voiceEnabled ? 'ON' : 'OFF'}</button></div><p className="settings-help">Your custom Amharic recordings will be connected here as the voice set is completed.</p></section><section><h3>🎱 GAME</h3><p className="settings-help">75-ball Bingo · one fixed desktop screen · manual Pause, Call Number and New Game controls.</p></section><section><h3>🎨 APPEARANCE</h3><div className="theme-buttons"><button className={props.theme === 'light' ? 'active' : ''} onClick={() => props.setTheme('light')}>☀ LIGHT</button><button className={props.theme === 'dark' ? 'active' : ''} onClick={() => props.setTheme('dark')}>◐ DARK</button></div></section><section><h3>📄 PDF GENERATOR</h3><p className="settings-help">Cartella generation tools stay here so the main game screen remains clean.</p></section><section><h3>ℹ ABOUT HAPPY BINGO</h3><p className="settings-help">Offline Windows Bingo application · 75 balls · 100-cartella system.</p></section></div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)
