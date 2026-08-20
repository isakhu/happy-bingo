/* FINAL CUSTOMER UI RUNTIME
   Applies only presentation changes; delegates all actions to existing React handlers.
*/
(() => {
  const rangeClass = (n) => {
    const v = Number(n);
    if (!Number.isInteger(v) || v < 1 || v > 75) return '';
    if (v <= 15) return 'hb-b-final';
    if (v <= 30) return 'hb-i-final';
    if (v <= 45) return 'hb-n-final';
    if (v <= 60) return 'hb-g-final';
    return 'hb-o-final';
  };

  const clean = (el) => {
    el?.classList.remove('hb-b-final','hb-i-final','hb-n-final','hb-g-final','hb-o-final');
  };

  const applyCurrent = () => {
    const el = document.querySelector('.bingo-mode .marquee-ball');
    if (!el) return;
    clean(el);
    const m = (el.textContent || '').match(/(?:^|\D)([1-9]|[1-6][0-9]|7[0-5])(?:\D|$)/);
    const cls = rangeClass(m ? m[1] : '');
    if (cls) el.classList.add(cls);
  };

  const applyRecent = () => {
    document.querySelectorAll('.bingo-mode .recent-calls .recent-ball').forEach(el => {
      clean(el);
      const m = (el.textContent || '').match(/(?:^|\D)([1-9]|[1-6][0-9]|7[0-5])(?:\D|$)/);
      const cls = rangeClass(m ? m[1] : '');
      if (cls) el.classList.add(cls);
    });
  };

  const labelTopMetric = () => {
    const span = document.querySelector('.bingo-mode .prize-metric > span');
    if (span) span.textContent = 'TOTAL PAY OUT';
  };

  const setCartellaNumber = () => {
    const card = document.querySelector('.bingo-mode .card-inspector');
    if (!card) return;
    const id = card.querySelector('.inspector-head h2')?.getAttribute('data-cartella-id');
    if (!id) return;
    let badge = card.querySelector('.hb-cartella-number');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'hb-cartella-number';
      card.querySelector('.inspector-head')?.appendChild(badge);
    }
    badge.textContent = `CARTELLA ${id}`;
  };

  const hideGameplayDiagnostics = () => {
    document.querySelectorAll('.bingo-mode > .toast, .bingo-mode .bingo-main > .toast, .bingo-mode .toast').forEach(el => {
      el.style.display = 'none';
    });
  };

  const run = () => {
    applyCurrent();
    applyRecent();
    labelTopMetric();
    setCartellaNumber();
    hideGameplayDiagnostics();
  };

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  run();
})();
