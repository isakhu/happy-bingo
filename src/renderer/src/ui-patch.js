(() => {
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  if (!localStorage.getItem('happy-bingo-total-money')) {
    localStorage.setItem('happy-bingo-total-money', '1000000');
  }

  function currentBalance() {
    const total = Number(localStorage.getItem('happy-bingo-total-money') || '1000000');
    const revenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0');
    return Math.max(0, total - revenue);
  }

  function ensureWindowControls() {
    let wrap = document.getElementById('happy-bingo-window-controls');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'happy-bingo-window-controls';
      wrap.innerHTML = '<div id="happy-bingo-balance">BALANCE <strong>1,000,000 BIRR</strong></div><button id="happy-bingo-fullscreen" type="button" title="Toggle full screen">⛶ FULL SCREEN</button>';
      document.body.appendChild(wrap);

      const button = wrap.querySelector('#happy-bingo-fullscreen');
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (error) {
          console.error('Fullscreen toggle failed:', error);
        }
      });

      document.addEventListener('fullscreenchange', updateFullscreenLabel);
      updateFullscreenLabel();
    }

    const balance = wrap.querySelector('#happy-bingo-balance strong');
    if (balance) balance.textContent = `${money(currentBalance())} BIRR`;
  }

  function updateFullscreenLabel() {
    const button = document.getElementById('happy-bingo-fullscreen');
    if (button) button.textContent = document.fullscreenElement ? '⛶ EXIT FULL SCREEN' : '⛶ FULL SCREEN';
  }

  function hideUnwantedSettingsNavigation() {
    const modal = document.querySelector('.settings-redesigned');
    if (!modal) return;
    modal.classList.add('settings-single-page');
    const label = modal.querySelector('.settings-section-label');
    if (label) label.dataset.fixedLabel = 'SETTINGS';
  }

  function refresh() {
    ensureWindowControls();
    hideUnwantedSettingsNavigation();
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(refresh, 500);
  refresh();
})();
