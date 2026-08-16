import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './game-overrides.css'

const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const
const CARD_COUNT = 100

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

function playAudio(dataUrl: string): Promise<void> {
  return new Promise(resolve => {
    const audio = new Audio(dataUrl)
    audio.onended = () => resolve()
    audio.onerror = () => resolve()
    audio.play().catch(() => resolve())
  })
}

function App() {
  const [cards, setCards] = useState<Card[]>(() => { try { return JSON.parse(localStorage.getItem('happy-bingo-cards') || 'null') || generateCards() } catch { return generateCards() } })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [called, setCalled] = useState<Called[]>([])
  const [remaining, setRemaining] = useState(makePool)
  const [locked, setLocked] = useState<Set<number>>(new Set())
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('happy-bingo-voice') !== 'off')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cardSource, setCardSource] = useState<'printed' | 'pdf'>(() => (localStorage.getItem('happy-bingo-card-source') as 'printed' | 'pdf') || 'printed')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [message, setMessage] = useState('')
  const [checkOpen, setCheckOpen] = useState(false)
  const [verifyInput, setVerifyInput] = useState('')
  const [winner, setWinner] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [cutPercent, setCutPercent] = useState('')

  const current = called[0] || null
  const calledSet = useMemo(() => new Set(called.map(item => item.number)), [called])
  const calledHistory = called.slice(1, 8)
  const currentAmount = betAmount === '' ? null : selected.size * Number(betAmount || 0)
  const cutAmount = currentAmount === null ? null : currentAmount * Number(cutPercent || 0) / 100
  const prize = currentAmount === null ? null : Math.max(0, currentAmount - (cutAmount || 0))

  async function playVoice(file: string) {
    if (!voiceEnabled || !window.happyBingo?.playVoice) return
    setVoicePlaying(true)
    try {
      const dataUrl = await window.happyBingo.playVoice(file)
      await playAudio(dataUrl)
    } finally {
      setVoicePlaying(false)
    }
  }

  function toggleCard(id: number) {
    if (started) return
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function startGame() {
    if (!selected.size) return setMessage('Select at least one cartella.')
    setCalled([])
    setRemaining(makePool())
    setLocked(new Set())
    setPaused(false)
    setWinner(null)
    setVerifyInput('')
    setCheckOpen(false)
    setMessage('')
    setStarted(true)
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
    const delay = called.length === 0 ? 900 : 3000
    const timer = window.setTimeout(() => { void callNext() }, delay)
    return () => window.clearTimeout(timer)
  }, [started, paused, voicePlaying, remaining.length, called.length])

  function newGame() {
    if (!window.confirm('End this game and return to cartella selection?')) return
    setStarted(false)
    setPaused(false)
    setCalled([])
    setRemaining(makePool())
    setLocked(new Set())
    setWinner(null)
    setVerifyInput('')
    setCheckOpen(false)
    setMessage('')
  }

  async function checkWinner() {
    const id = Number(verifyInput)
    const card = cards.find(item => item.id === id)
    if (!Number.isInteger(id) || id < 1 || id > 100 || !card) return setMessage('Enter a valid card number from 001 to 100.')
    if (!selected.has(id)) return setMessage(`Cartella ${String(id).padStart(3, '0')} is not active.`)
    if (locked.has(id)) { await playVoice('cartellawu.mp3'); setCheckOpen(false); return setMessage(`CARTELLA ${String(id).padStart(3, '0')} IS LOCKED.`) }

    const marked = card.values.map((n, i) => i === 12 || calledSet.has(n))
    const rows = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c))
    const cols = Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c))
    const valid = [...rows, ...cols, [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]].some(line => line.every(index => marked[index]))

    setCheckOpen(false)
    if (!valid) {
      setLocked(prev => new Set(prev).add(id))
      await playVoice('cartellawu.mp3')
      return setMessage(`CARTELLA ${String(id).padStart(3, '0')} LOCKED — INVALID BINGO.`)
    }
    await playVoice('Goodbingo.mp3')
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
      setMessage('New cartella PDF created.')
    } catch { setMessage('Could not create the PDF.') } finally { setGeneratingPdf(false) }
  }

  function saveBet(value: string) { setBetAmount(value); value === '' ? localStorage.removeItem('happy-bingo-bet') : localStorage.setItem('happy-bingo-bet', value) }
  function saveCut(value: string) { setCutPercent(value); value === '' ? localStorage.removeItem('happy-bingo-cut') : localStorage.setItem('happy-bingo-cut', value) }

  const settings = <SettingsModal
    cardSource={cardSource}
    setCardSource={value => { setCardSource(value); localStorage.setItem('happy-bingo-card-source', value) }}
    voiceEnabled={voiceEnabled}
    setVoiceEnabled={value => { setVoiceEnabled(value); localStorage.setItem('happy-bingo-voice', value ? 'on' : 'off') }}
    betAmount={betAmount}
    setBetAmount={saveBet}
    cutPercent={cutPercent}
    setCutPercent={saveCut}
    generatingPdf={generatingPdf}
    createPdf={createPdf}
    onClose={() => setSettingsOpen(false)}
  />

  if (!started) return <div className="app-shell selection-mode">
    <header className="topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="ready-pill">● READY</span><button className="top-button" onClick={() => setSettingsOpen(true)}>SETTING</button></div></header>
    <main className="selection-screen"><div className="selection-title"><div><small>CARTELLA SELECTION</small><h1>Select cards for this game</h1></div><div className="selection-count"><b>{selected.size}</b><span>/ 100</span></div></div>
      <section className="selection-panel"><div className="selection-panel-head"><strong>001 — 100</strong><span>{cardSource === 'printed' ? 'PRINTED CARTELLA' : 'GENERATED CARTELLA'}</span></div><div className="cartella-grid">{Array.from({ length: 100 }, (_, i) => i + 1).map(id => <button key={id} className={`cartella ${selected.has(id) ? 'selected' : ''}`} onClick={() => toggleCard(id)}>{String(id).padStart(3, '0')}</button>)}</div></section>
      <button className="start-button" onClick={startGame} disabled={!selected.size || voicePlaying}>START GAME</button>{message && <div className="toast">{message}</div>}
    </main>{settingsOpen && settings}</div>

  return <div className="app-shell bingo-mode">
    <header className="topbar game-topbar"><div className="brand">HAPPY <span>BINGO</span></div><div className="top-actions"><span className="live-pill">● LIVE</span><span className={`pause-status ${paused ? 'is-paused' : ''}`}>{paused ? 'PAUSED' : 'AUTO CALL'}</span></div></header>

    <main className="bingo-main">
      <section className="live-header">
        <div className="current-wrap"><div className="marquee-ball"><span>{current?.letter || '—'}</span><strong>{current?.number ?? '—'}</strong></div><div className="fraction">{called.length}/75</div></div>
        <div className="recent-calls">{called.slice(0, 14).map((item, index) => <div key={`${item.number}-${index}`} className={`recent-ball ${item.letter.toLowerCase()} ${index === 0 ? 'latest' : ''}`}><span>{item.letter}</span>{item.number}</div>)}</div>
      </section>

      <section className="prize-banner">PRIZE {prize === null ? '—' : Math.round(prize).toLocaleString()}</section>

      <section className="board-shell"><div className="board-grid">{LETTERS.map((letter, row) => <div className="board-row" key={letter}><div className={`letter-badge ${letter.toLowerCase()}`}>{letter}</div>{Array.from({ length: 15 }, (_, i) => i + 1 + row * 15).map(n => { const calledNow = calledSet.has(n); return <div key={n} className={`number-cell ${calledNow ? `called ${getLetter(n).toLowerCase()}` : ''} ${current?.number === n ? 'latest' : ''}`}><span>{n}</span></div> })}</div>)}</div></section>

      <section className="bottom-bar">
        <div className="game-id">Game ID <strong>100029-YAXT</strong></div>
        <div className="bottom-actions"><button className="action setting" onClick={() => setSettingsOpen(true)}>SETTING</button><button className="action end" onClick={newGame}>END</button><button className="action check" onClick={() => { setVerifyInput(''); setCheckOpen(true) }}>CHECK</button><button className="action pause" onClick={() => setPaused(prev => !prev)}>{paused ? 'RESUME' : 'PAUSE'}</button></div>
      </section>

      {checkOpen && <div className="check-backdrop"><div className="check-modal"><div className="check-head"><strong>CHECK</strong><button onClick={() => setCheckOpen(false)}>×</button></div><div className="check-body"><label>Card Number</label><input autoFocus inputMode="numeric" value={verifyInput} onChange={e => setVerifyInput(e.target.value.replace(/\D/g, ''))} placeholder="001" onKeyDown={e => e.key === 'Enter' && void checkWinner()} /><button onClick={() => void checkWinner()}>Check Win</button></div></div></div>}
      {winner !== null && <div className="winner-overlay"><div className="winner-card"><div className="winner-star">★</div><h2>BINGO!</h2><p>Card {String(winner).padStart(3, '0')} is a valid winner.</p><button onClick={() => setWinner(null)}>CONFIRM WINNER</button></div></div>}
      {message && <div className="toast">{message}</div>}
    </main>{settingsOpen && settings}
  </div>
}

function SettingsModal(props: { cardSource: 'printed' | 'pdf'; setCardSource: (value: 'printed' | 'pdf') => void; voiceEnabled: boolean; setVoiceEnabled: (value: boolean) => void; betAmount: string; setBetAmount: (value: string) => void; cutPercent: string; setCutPercent: (value: string) => void; generatingPdf: boolean; createPdf: () => Promise<void>; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="settings-modal"><div className="modal-head"><div><small>MANAGER SETTINGS</small><h2>Settings</h2></div><button className="close-button" onClick={props.onClose}>×</button></div><div className="settings-grid">
    <section><h3>CARTELLA</h3><button className={`setting-choice ${props.cardSource === 'printed' ? 'active' : ''}`} onClick={() => props.setCardSource('printed')}>Existing printed 001–100</button><button className={`setting-choice ${props.cardSource === 'pdf' ? 'active' : ''}`} onClick={() => props.setCardSource('pdf')}>Generated PDF set</button><button className="pdf-action" onClick={props.createPdf} disabled={props.generatingPdf}>{props.generatingPdf ? 'CREATING…' : 'GENERATE 100 CARTELLA PDF'}</button></section>
    <section><h3>VOICE</h3><div className="setting-row"><span>Recorded Bingo voices</span><button className="toggle" onClick={() => props.setVoiceEnabled(!props.voiceEnabled)}>{props.voiceEnabled ? 'ON' : 'OFF'}</button></div></section>
    <section><h3>BET AMOUNT</h3><input className="money-input" type="number" min="0" placeholder="" value={props.betAmount} onChange={e => props.setBetAmount(e.target.value)} /></section>
    <section><h3>CUT PERCENT</h3><input className="money-input" type="number" min="0" max="100" placeholder="" value={props.cutPercent} onChange={e => props.setCutPercent(e.target.value)} /></section>
  </div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)
