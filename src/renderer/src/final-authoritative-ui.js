/* FINAL CUSTOMER UI RUNTIME
   Presentation only. Game actions stay delegated to the existing React handlers.
*/
(() => {
  const COLORS = {
    b: { bg:'#EF233C', border:'#FF7B8A', text:'#fff', shadow:'0 0 22px #EF233C,0 0 46px #EF233C88' },
    i: { bg:'#0066FF', border:'#66B7FF', text:'#fff', shadow:'0 0 22px #0066FF,0 0 46px #0066FF88' },
    n: { bg:'#F1D42E', border:'#FFF3A0', text:'#111', shadow:'0 0 22px #F1D42E,0 0 46px #F1D42E88' },
    g: { bg:'#8B3DFF', border:'#D7B8FF', text:'#fff', shadow:'0 0 22px #8B3DFF,0 0 46px #8B3DFF88' },
    o: { bg:'#20C96B', border:'#9DFFD0', text:'#fff', shadow:'0 0 22px #20C96B,0 0 46px #20C96B88' }
  };
  const rangeLetter = (n) => {
    const v = Number(n);
    if (!Number.isInteger(v) || v < 1 || v > 75) return '';
    return v <= 15 ? 'b' : v <= 30 ? 'i' : v <= 45 ? 'n' : v <= 60 ? 'g' : 'o';
  };
  const numberFromText = (text) => {
    const matches = String(text || '').match(/\d{1,3}/g) || [];
    for (const raw of matches) {
      const n = Number(raw);
      if (n >= 1 && n <= 75) return n;
    }
    return null;
  };
  const paint = (el, n) => {
    const key = rangeLetter(n);
    if (!el || !key) return;
    const c = COLORS[key];
    el.style.setProperty('background', c.bg, 'important');
    el.style.setProperty('border-color', c.border, 'important');
    el.style.setProperty('color', c.text, 'important');
    el.style.setProperty('box-shadow', c.shadow, 'important');
  };

  let lastCartellaId = null;
  const captureCartellaId = () => {
    const input = document.querySelector('.bingo-mode .check-body input, .bingo-mode input[placeholder="001"]');
    if (input && /^\d{1,3}$/.test(input.value || '')) lastCartellaId = Number(input.value);
  };

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el instanceof HTMLInputElement && (el.placeholder === '001' || el.closest('.check-body'))) captureCartellaId();
  }, true);
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (target?.matches('.check-body button')) captureCartellaId();
  }, true);

  const applyCurrent = () => {
    const el = document.querySelector('.bingo-mode .marquee-ball');
    if (el) paint(el, numberFromText(el.textContent));
  };
  const applyRecent = () => {
    document.querySelectorAll('.bingo-mode .recent-calls .recent-ball').forEach(el => paint(el, numberFromText(el.textContent)));
  };
  const labelTopMetric = () => {
    const span = document.querySelector('.bingo-mode .prize-metric > span');
    if (span) {
      span.textContent = 'TOTAL PAY OUT';
      span.style.setProperty('color', '#fff', 'important');
    }
  };

  const setCartellaNumber = () => {
    const card = document.querySelector('.bingo-mode .card-inspector');
    if (!card || !lastCartellaId) return;
    let badge = card.querySelector('.hb-cartella-number-final');
    const head = card.querySelector('.inspector-head');
    if (!head) return;
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'hb-cartella-number-final';
      head.appendChild(badge);
    }
    badge.textContent = `CARTELLA ${String(lastCartellaId).padStart(3,'0')}`;
    badge.style.cssText = 'position:absolute;left:16px;top:50%;transform:translateY(-50%);z-index:5;color:#fff;font:1000 14px Arial,Helvetica,sans-serif;letter-spacing:1px;text-shadow:2px 2px 0 #000;white-space:nowrap;';
  };

  const balanceValue = () => {
    const balance = Number(localStorage.getItem('happy-bingo-money-balance'));
    if (Number.isFinite(balance) && balance >= 0) return Math.round(balance).toLocaleString();
    return '10,000,000';
  };

  const settingsVisible = (el) => {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  const repairInteractiveLayers = () => {
    document.documentElement.style.background = '#040D1A';
    document.body.style.background = '#040D1A';
    const root = document.querySelector('#root');
    if (root) root.style.background = '#040D1A';

    document.querySelectorAll('.app-shell').forEach(el => {
      el.style.setProperty('background', '#040D1A', 'important');
    });
    document.querySelectorAll('.app-shell:before,.app-shell:after').forEach(() => {});

    const sidebar = document.querySelector('.settings-redesigned .settings-sidebar-real');
    if (sidebar) {
      sidebar.style.setProperty('display', 'flex', 'important');
      sidebar.style.setProperty('pointer-events', 'auto', 'important');
      sidebar.style.setProperty('z-index', '3', 'important');
    }
    document.querySelectorAll('button,input,select,textarea').forEach(el => {
      el.style.setProperty('pointer-events', 'auto', 'important');
    });
    document.querySelectorAll('.topbar,.selection-screen,.bingo-main,.bottom-bar,.call-stage').forEach(el => {
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('position', 'relative', 'important');
      el.style.setProperty('z-index', '2', 'important');
    });
    document.querySelectorAll('.modal-backdrop,.check-backdrop').forEach(el => {
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('z-index', '1000', 'important');
    });
  };

  const ensureSettingsBalance = () => {
    const settings = document.querySelector('.settings-redesigned .settings-main-real, .settings-main-real');
    if (!settings || !settingsVisible(settings)) return;
    let panel = document.getElementById('happy-bingo-settings-balance-final');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'happy-bingo-settings-balance-final';
      panel.innerHTML = '<span>Total Money (Birr)</span><strong></strong>';
      const footer = settings.querySelector('.settings-footer-real');
      if (footer) settings.insertBefore(panel, footer);
      else settings.appendChild(panel);
      panel.style.cssText = 'margin:18px 0;padding:15px 18px;background:#0A1C38;border:1px solid #0066FF;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:18px;color:#fff;font:900 12px Arial,Helvetica,sans-serif;';
      const span = panel.querySelector('span');
      const strong = panel.querySelector('strong');
      if (span) span.style.cssText = 'font-weight:1000;letter-spacing:1px;color:#fff;';
      if (strong) strong.style.cssText = 'font-size:20px;color:#FFD83D;text-shadow:2px 2px 0 #000;';
    }
    const value = panel.querySelector('strong');
    if (value) value.textContent = `${balanceValue()} BIRR`;
  };

  const run = () => {
    applyCurrent();
    applyRecent();
    labelTopMetric();
    setCartellaNumber();
    repairInteractiveLayers();
    ensureSettingsBalance();
  };

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true });
  run();
  window.setInterval(run, 350);
})();
