(() => {
  const STARTING_BALANCE = 1000000;
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  function ensureStartingBalance() {
    localStorage.setItem('happy-bingo-total-money', String(STARTING_BALANCE));
  }

  function balance() {
    ensureStartingBalance();
    const revenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0');
    return Math.max(0, STARTING_BALANCE - revenue);
  }

  function renderBalance() {
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

  function install() {
    renderBalance();
    renderFullscreen();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(install, 1000);
  install();
})();
