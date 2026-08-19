(() => {
  const BALANCE_KEY = 'happy-bingo-company-balance';
  const BINGO_MADE_KEY = 'happy-bingo-bingo-made';
  const STARTING_BALANCE = 10000000;

  if (localStorage.getItem(BALANCE_KEY) == null) {
    localStorage.setItem(BALANCE_KEY, String(STARTING_BALANCE));
  }

  let previousBingoMade = Number(localStorage.getItem(BINGO_MADE_KEY) || '0');
  const nativeSetItem = localStorage.setItem.bind(localStorage);
  let internalWrite = false;

  localStorage.setItem = function (key, value) {
    if (internalWrite || key !== BINGO_MADE_KEY) return nativeSetItem(key, value);
    const next = Math.max(0, Number(value) || 0);
    const delta = Math.max(0, next - previousBingoMade);
    previousBingoMade = next;
    if (delta > 0) {
      const balance = Math.max(0, Number(localStorage.getItem(BALANCE_KEY) || STARTING_BALANCE) - delta);
      internalWrite = true;
      try { nativeSetItem(BALANCE_KEY, String(balance)); } finally { internalWrite = false; }
    }
    return nativeSetItem(key, String(next));
  };

  const show = (text) => {
    let el = document.querySelector('[data-hb-settings-message]');
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-hb-settings-message', '');
      Object.assign(el.style, { position:'fixed', left:'50%', bottom:'24px', transform:'translateX(-50%)', zIndex:'100000', padding:'14px 24px', borderRadius:'12px', background:'#071a3a', color:'#fff', fontWeight:'900', fontSize:'20px', boxShadow:'0 5px 20px rgba(0,0,0,.55)', border:'2px solid #73d7c7' });
      document.body.appendChild(el);
    }
    el.textContent = text;
    clearTimeout(el._hbTimer);
    el._hbTimer = setTimeout(() => el.remove(), 2600);
  };

  const originalBridge = window.happyBingo;
  if (originalBridge?.playVoice && !originalBridge.__hbWrapped) {
    const originalPlay = originalBridge.playVoice.bind(originalBridge);
    originalBridge.playVoice = async (file) => {
      if (String(file).toLowerCase() === 'cartellawu.mp3') {
        const approved = window.confirm('FAILED BINGO\n\nThis Cartella did not win.\n\nPlay the failed-Bingo voice and lock this player?');
        if (!approved) return '';
      }
      return originalPlay(file);
    };
    originalBridge.__hbWrapped = true;
  }

  const balanceText = () => `${Number(localStorage.getItem(BALANCE_KEY) || STARTING_BALANCE).toLocaleString()} BIRR`;
  function updateBalanceDisplay() {
    const modal = document.querySelector('.settings-modal');
    if (!modal) return;
    let box = modal.querySelector('[data-company-balance]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-company-balance', '');
      box.innerHTML = '<span>COMPANY CURRENT BALANCE</span><strong></strong>';
      box.style.cssText = 'margin:18px 0;padding:16px 20px;border-radius:14px;background:#12324a;border:2px solid #73d7c7;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:20px;font-size:22px;font-weight:900;text-shadow:2px 2px 0 rgba(0,0,0,.65)';
      box.querySelector('strong').style.cssText = 'font-size:32px;font-weight:1000;color:#fff';
      modal.appendChild(box);
    }
    box.querySelector('strong').textContent = balanceText();
  }

  function enforcePausedCheck() {
    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.('button');
      if (!target) return;
      if (!(target.classList.contains('check') || /CHECK CARTELLA/i.test(target.textContent || ''))) return;
      const paused = /GAME PAUSED/i.test(document.body.innerText);
      if (!paused) {
        event.preventDefault();
        event.stopImmediatePropagation();
        show('PAUSE THE GAME BEFORE CHECKING A BINGO CLAIM.');
      }
    }, true);
  }

  new MutationObserver(updateBalanceDisplay).observe(document.documentElement, {subtree:true, childList:true});
  enforcePausedCheck();
  window.addEventListener('storage', updateBalanceDisplay);
})();
