// Startup safety only.
// IMPORTANT: the object exposed by Electron contextBridge is immutable in the
// renderer. Do not monkey-patch window.happyBingo here; doing so can throw and
// prevent React from mounting, which leaves the native Electron background
// visible as a blank blue screen after authentication.

const legacyTotal = Number(localStorage.getItem('happy-bingo-total-money') || '0')
if (legacyTotal === 1000000) localStorage.setItem('happy-bingo-total-money', '0')

const legacyBalance = Number(localStorage.getItem('happy-bingo-money-balance') || '0')
if (legacyBalance === 1000000) {
  localStorage.setItem('happy-bingo-money-balance', '0')
  localStorage.removeItem('happy-bingo-money-last-game')
}

const cut = Number(localStorage.getItem('happy-bingo-cut') || '')
if (!Number.isFinite(cut) || cut < 0 || cut > 100) {
  localStorage.setItem('happy-bingo-cut', '20')
}

export {}