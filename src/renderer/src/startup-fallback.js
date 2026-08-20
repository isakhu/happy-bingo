// Startup safety only: keep the new-company house balance at zero.
// This runs before App() initializes its React state, so the legacy 1,000,000
// BIRR default cannot reappear in Settings after a fresh launch.
const storedTotal = localStorage.getItem('happy-bingo-total-money')
if (storedTotal === null || storedTotal === '1000000') {
  localStorage.setItem('happy-bingo-total-money', '0')
}

export {}