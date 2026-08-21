// Static presentation-only patch for the Cartella checking/winner UI.
// Intentionally runs once. No MutationObserver, timers, DOM rewriting loops,
// or event interception are used, so React controls remain fully clickable.
const style = document.createElement('style')
style.id = 'happy-bingo-card-check-layout'
style.textContent = `
.card-inspector {
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: min(60vw, 760px) !important;
  height: auto !important;
  max-height: 78vh !important;
  overflow: hidden !important;
  padding: 20px !important;
  border-radius: 18px !important;
  z-index: 120 !important;
  background: #07152b !important;
  border: 2px solid #0066ff !important;
  box-shadow: 0 24px 70px #000b, 0 0 0 1px #18365c !important;
  color: #fff !important;
}
.card-inspector .inspector-head {
  margin-bottom: 12px !important;
  text-align: center !important;
}
.card-inspector .inspector-head h2 {
  font-size: clamp(20px, 2vw, 28px) !important;
  margin: 3px 0 6px !important;
  color: #fff !important;
}
.card-inspector .inspector-head small {
  font-size: 10px !important;
  color: #66b7ff !important;
  font-weight: 1000 !important;
}
.card-inspector .inspector-grid {
  width: 100% !important;
  max-width: 620px !important;
  margin: 0 auto !important;
  display: grid !important;
  grid-template-columns: repeat(5, 1fr) !important;
  gap: 9px !important;
}
.card-inspector .inspector-cell {
  width: 100% !important;
  aspect-ratio: 1 !important;
  display: grid !important;
  place-items: center !important;
  border-radius: 10px !important;
  font-size: clamp(16px, 2.3vw, 30px) !important;
  font-weight: 1000 !important;
  background: #0b1e37 !important;
  color: #fff !important;
  border: 2px solid #24496b !important;
}
.card-inspector .inspector-cell.called,
.card-inspector .inspector-cell.marked {
  background: #0066ff !important;
  border-color: #66b7ff !important;
  color: #fff !important;
}
.card-inspector .inspector-cell.winning {
  background: #0b9b43 !important;
  border-color: #8bffb7 !important;
  color: #fff !important;
  box-shadow: 0 0 18px #2cff7e !important;
  transform: scale(1.04) !important;
}
.card-inspector .winning-line-label {
  max-width: 620px !important;
  margin: 12px auto 0 !important;
  padding: 10px 12px !important;
  border-radius: 9px !important;
  background: #083f20 !important;
  color: #8bffb7 !important;
  font-size: 11px !important;
  font-weight: 1000 !important;
  text-align: center !important;
}
.card-inspector .inspector-close,
.card-inspector .lock-failed-button {
  display: block !important;
  width: min(620px, 100%) !important;
  margin: 10px auto 0 !important;
  min-height: 44px !important;
  border-radius: 10px !important;
  font-weight: 1000 !important;
  font-size: 13px !important;
}
.card-inspector .inspector-close {
  background: #0066ff !important;
  color: #fff !important;
  border: 1px solid #66b7ff !important;
}
.card-inspector .lock-failed-button {
  background: #ef233c !important;
  color: #fff !important;
  border: 0 !important;
  box-shadow: 0 0 20px #ef233c55 !important;
}
.check-backdrop {
  position: fixed !important;
  inset: 0 !important;
  display: grid !important;
  place-items: center !important;
  background: #02070dcc !important;
  z-index: 110 !important;
}
.check-modal {
  width: min(60vw, 620px) !important;
  max-height: 60vh !important;
  overflow: hidden !important;
  border-radius: 18px !important;
  background: #07152b !important;
  border: 2px solid #0066ff !important;
  box-shadow: 0 24px 70px #000b !important;
  color: #fff !important;
}
.check-head {
  min-height: 58px !important;
  padding: 12px 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: #0b1e37 !important;
  border-bottom: 1px solid #18365c !important;
}
.check-head strong { color: #fff !important; font-size: 18px !important; }
.check-head button { color: #fff !important; background: transparent !important; border: 0 !important; font-size: 28px !important; cursor: pointer !important; }
.check-body {
  max-width: 520px !important;
  margin: 0 auto !important;
  padding: 22px !important;
  display: grid !important;
  gap: 12px !important;
}
.check-body label { color: #66b7ff !important; font-weight: 1000 !important; font-size: 12px !important; }
.check-body input {
  width: 100% !important;
  box-sizing: border-box !important;
  background: #040d1a !important;
  color: #fff !important;
  border: 2px solid #24496b !important;
  border-radius: 10px !important;
  padding: 13px 14px !important;
  font-size: 22px !important;
  font-weight: 1000 !important;
  outline: none !important;
}
.check-body input:focus { border-color: #0066ff !important; box-shadow: 0 0 0 2px #0066ff44 !important; }
.check-body > button {
  min-height: 46px !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: #0066ff !important;
  color: #fff !important;
  font-weight: 1000 !important;
  font-size: 14px !important;
  cursor: pointer !important;
}
@media (max-width: 800px) {
  .card-inspector, .check-modal { width: 88vw !important; }
}
`
if (!document.getElementById(style.id)) document.head.appendChild(style)

export {}
