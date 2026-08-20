(() => {
  // New company: house balance starts at zero and grows only from earned house revenue.
  const STARTING_BALANCE = 0;
  const HOUSE_EARNED_KEY = 'happy-bingo-house-earned';
  const CHARGED_GAMES_KEY = 'happy-bingo-house-charged-games';
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  function ensureState() {
    // Migrate the old 1,000,000-BIRR baseline if this installation was previously initialized.
    const existingTotal = localStorage.getItem('happy-bingo-total-money');
    if (existingTotal === '1000000') localStorage.setItem('happy-bingo-total-money', '0');
    if (localStorage.getItem(HOUSE_EARNED_KEY) === null) localStorage.setItem(HOUSE_EARNED_KEY, '0');
    if (localStorage.getItem('happy-bingo-total-money') === null) localStorage.setItem('happy-bingo-total-money', '0');
    if (localStorage.getItem(CHARGED_GAMES_KEY) === null) localStorage.setItem(CHARGED_GAMES_KEY, '[]');
  }

  function readChargedGames() {
    try {
      const value = JSON.parse(localStorage.getItem(CHARGED_GAMES_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function addHouseRevenueForGame(button) {
    if (!button || button.dataset.houseCharged === '1') return;
    button.dataset.houseCharged = '1';

    const bet = Number(localStorage.getItem('happy-bingo-bet') || '0');
    const cutRaw = localStorage.getItem('happy-bingo-cut');
    const cut = cutRaw === null ? 20 : Number(cutRaw);
    const players = document.querySelectorAll('.cartella.selected').length || Number(localStorage.getItem('happy-bingo-active-players') || '0');
    if (!Number.isFinite(bet) || bet <= 0 || !Number.isFinite(players) || players <= 0) return;

    const totalCollected = bet * players;
    const houseRevenue = Math.max(0, Math.round(totalCollected * Math.max(0, Math.min(100, cut)) / 100));
    if (houseRevenue <= 0) return;

    const gameId = (document.querySelector('.game-id strong,.game-id,.game-id-value,[data-game-id]')?.textContent || '').trim() || `game-${Date.now()}`;
    const charged = readChargedGames();
    if (charged.includes(gameId)) return;

    const earned = Number(localStorage.getItem(HOUSE_EARNED_KEY) || '0');
    localStorage.setItem(HOUSE_EARNED_KEY, String(Math.max(0, Math.round(earned)) + houseRevenue));
    localStorage.setItem(CHARGED_GAMES_KEY, JSON.stringify([...charged.slice(-199), gameId]));
    renderBalance();
  }

  function balance() {
    ensureState();
    const earned = Number(localStorage.getItem(HOUSE_EARNED_KEY) || '0');
    return STARTING_BALANCE + Math.max(0, Number.isFinite(earned) ? earned : 0);
  }

  function renderBalance() {
    ensureState();
    let el = document.getElementById('happy-bingo-authoritative-balance');
    if (!el) {
      el = document.createElement('div');
      el.id = 'happy-bingo-authoritative-balance';
      el.innerHTML = '<span>HOUSE BALANCE</span><strong></strong>';
      document.body.appendChild(el);
    }
    const value = el.querySelector('strong');
    if (value) value.textContent = `${money(balance())} BIRR`;
  }

  function renderFullscreen() {
    let button = document.getElementById('happy-bingo-authoritative-fullscreen');
    if (!button) {
      button = document.createElement('button');
      button.id = 'happy-bingo-authoritative-fullscreen';
      button.type = 'button';
      button.title = 'Toggle full screen';
      document.body.appendChild(button);
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        } catch (error) { console.error(error); }
      });
      document.addEventListener('fullscreenchange', () => updateFullscreen(button));
    }
    updateFullscreen(button);
  }

  function updateFullscreen(button) {
    button.textContent = document.fullscreenElement ? '⛶ EXIT FULL SCREEN' : '⛶ FULL SCREEN';
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (target?.matches('.start-button')) setTimeout(() => addHouseRevenueForGame(target), 50);
  }, true);

  function install() {
    ensureState();
    renderBalance();
    renderFullscreen();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(install, 1000);
  install();
})();