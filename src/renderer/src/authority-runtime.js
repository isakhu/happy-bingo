(() => {
  // New company: house balance starts at zero and grows only from earned house revenue.
  const STARTING_BALANCE = 0;
  const HOUSE_EARNED_KEY = 'happy-bingo-house-earned';
  const CHARGED_GAMES_KEY = 'happy-bingo-house-charged-games';
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  function ensureState() {
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

  function balance() {
    ensureState();
    const earned = Number(localStorage.getItem(HOUSE_EARNED_KEY) || '0');
    const legacyCompanyRevenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0');
    const safeEarned = Number.isFinite(earned) && earned >= 0 ? earned : 0;
    const safeLegacy = Number.isFinite(legacyCompanyRevenue) && legacyCompanyRevenue >= 0 ? legacyCompanyRevenue : 0;
    // The dedicated house ledger is authoritative; legacy company revenue is used only
    // to recover amounts already earned before the dedicated ledger was visible in Settings.
    return STARTING_BALANCE + Math.max(safeEarned, safeLegacy);
  }

  function stableGameId() {
    const stored = Number(localStorage.getItem('happy-bingo-game-id') || '0');
    if (Number.isInteger(stored) && stored > 0) return `game-${stored}`;
    const text = Array.from(document.querySelectorAll('.game-metric strong')).map(el => el.textContent?.trim() || '');
    const id = text.find(v => /^#\d+$/.test(v));
    return id ? `game-${Number(id.slice(1))}` : null;
  }

  function addHouseRevenueForGame(button) {
    if (!button || button.dataset.houseCharged === '1') return;
    const bet = Number(localStorage.getItem('happy-bingo-bet') || '0');
    const cutRaw = localStorage.getItem('happy-bingo-cut');
    const cut = cutRaw === null ? 20 : Number(cutRaw);
    const players = document.querySelectorAll('.cartella.selected').length || Number(localStorage.getItem('happy-bingo-active-players') || '0');
    if (!Number.isFinite(bet) || bet <= 0 || !Number.isFinite(players) || players <= 0) return;

    const totalCollected = bet * players;
    const houseRevenue = Math.max(0, Math.round(totalCollected * Math.max(0, Math.min(100, cut)) / 100));
    if (houseRevenue <= 0) return;

    const gameId = stableGameId();
    if (!gameId) return;
    const charged = readChargedGames();
    if (charged.includes(gameId)) {
      button.dataset.houseCharged = '1';
      renderSettingsBalance();
      return;
    }

    const earned = Number(localStorage.getItem(HOUSE_EARNED_KEY) || '0');
    const safeEarned = Number.isFinite(earned) && earned >= 0 ? earned : 0;
    localStorage.setItem(HOUSE_EARNED_KEY, String(Math.round(safeEarned + houseRevenue)));
    localStorage.setItem(CHARGED_GAMES_KEY, JSON.stringify([...charged.slice(-199), gameId]));
    button.dataset.houseCharged = '1';
    renderSettingsBalance();
  }

  function renderSettingsBalance() {
    const existing = document.getElementById('happy-bingo-settings-balance');
    const settings = document.querySelector('.settings-redesigned .settings-main-real, .settings-main-real');
    if (!settings) return;
    let el = existing;
    if (!el || !settings.contains(el)) {
      el?.remove();
      el = document.createElement('div');
      el.id = 'happy-bingo-settings-balance';
      el.innerHTML = '<span>HOUSE BALANCE</span><strong></strong>';
      const footer = settings.querySelector('.settings-footer-real');
      if (footer) settings.insertBefore(el, footer);
      else settings.appendChild(el);
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

  function updateFullscreen(button) { button.textContent = document.fullscreenElement ? '⛶ EXIT FULL SCREEN' : '⛶ FULL SCREEN'; }

  // Revenue is earned when the manager ends the game, not when the game starts.
  // This avoids charging an abandoned game and prevents duplicate charging by game ID.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (target?.matches('.action.end')) setTimeout(() => addHouseRevenueForGame(target), 50);
  }, true);

  function install() {
    ensureState();
    renderSettingsBalance();
    renderFullscreen();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(install, 500);
  install();
})();