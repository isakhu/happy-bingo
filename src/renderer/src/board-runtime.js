(() => {
  const BOARD = '.bingo-mode .board-grid';
  const CELLS = '.bingo-mode .number-cell';
  const CALL_BUTTON_ID = 'hb-call-next-runtime';
  let lastVisible = '';

  function numberFromCell(el) {
    const n = Number((el.textContent || '').trim());
    return Number.isInteger(n) && n >= 1 && n <= 75 ? n : null;
  }

  function syncBoard() {
    const board = document.querySelector(BOARD);
    if (!board) return;
    const ball = document.querySelector('.bingo-mode .latest-call .marquee-ball strong');
    const current = ball ? Number((ball.textContent || '').trim()) : null;
    if (!current || current === lastVisible) return;
    lastVisible = String(current);
    document.querySelectorAll(CELLS).forEach(cell => {
      const n = numberFromCell(cell);
      if (n === current) {
        cell.classList.add('called', 'latest');
        cell.scrollIntoView?.({block:'nearest', inline:'nearest'});
      }
    });
  }

  function installCallButton() {
    const bar = document.querySelector('.bingo-mode .bottom-actions');
    if (!bar || document.getElementById(CALL_BUTTON_ID)) return;
    const btn = document.createElement('button');
    btn.id = CALL_BUTTON_ID;
    btn.className = 'action call-next-runtime';
    btn.type = 'button';
    btn.textContent = 'CALL NEXT NUMBER';
    btn.title = 'The game normally calls automatically; this button is a visible manual fallback.';
    btn.addEventListener('click', () => {
      const buttons = Array.from(bar.querySelectorAll('button'));
      const pause = buttons.find(b => /pause|resume/i.test(b.textContent || ''));
      if (pause && /resume/i.test(pause.textContent || '')) return;
      const latest = document.querySelector('.bingo-mode .latest-call .marquee-ball strong');
      const current = latest ? Number((latest.textContent || '').trim()) : 0;
      const cells = Array.from(document.querySelectorAll(CELLS));
      const uncalled = cells.filter(c => {
        const n = numberFromCell(c);
        return n !== null && !c.classList.contains('called');
      });
      if (!uncalled.length) return;
      // Keep this fallback deterministic and visually safe: trigger the app's own
      // automatic cycle by toggling pause/resume when no number is currently moving.
      const pauseBtn = buttons.find(b => /pause/i.test(b.textContent || ''));
      if (pauseBtn && current) pauseBtn.click();
      setTimeout(() => { if (pauseBtn && /resume/i.test(pauseBtn.textContent || '')) pauseBtn.click(); }, 120);
    });
    bar.prepend(btn);
  }

  function observe() {
    syncBoard();
    installCallButton();
  }
  const observer = new MutationObserver(observe);
  observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  setInterval(observe, 500);
})();
