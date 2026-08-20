(() => {
  const BALANCE_KEY = 'happy-bingo-house-earned';
  const money = (value) => Math.max(0, Math.round(Number(value) || 0)).toLocaleString();

  function getBalance() {
    const earned = Number(localStorage.getItem(BALANCE_KEY) || '0');
    return Number.isFinite(earned) && earned >= 0 ? earned : 0;
  }

  function mount() {
    const settings = document.querySelector('.settings-main-real');
    if (!settings) return;

    let panel = document.getElementById('happy-bingo-settings-balance');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'happy-bingo-settings-balance';
      panel.innerHTML = '<span>HOUSE BALANCE</span><strong></strong>';
      const footer = settings.querySelector('.settings-footer-real');
      if (footer) settings.insertBefore(panel, footer);
      else settings.appendChild(panel);
    }

    const value = panel.querySelector('strong');
    if (value) value.textContent = `${money(getBalance())} BIRR`;
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(mount, 500);
  mount();
})();