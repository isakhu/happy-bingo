(() => {
  function updateInspector(root) {
    const card = root.querySelector('.card-inspector');
    if (!card) return;

    const small = card.querySelector('.inspector-head small');
    const h2 = card.querySelector('.inspector-head h2');
    if (small) small.textContent = card.querySelector('.failed-check') ? '1 - Failed claim' : '1 - Late winner';

    let accumulated = card.querySelector('.cartella-reference-accumulated');
    if (!accumulated && h2) {
      accumulated = document.createElement('div');
      accumulated.className = 'cartella-reference-accumulated';
      h2.insertAdjacentElement('afterend', accumulated);
    }
    const totalRevenue = Math.max(0, Number(localStorage.getItem('happy-bingo-bingo-made') || '0'));
    if (accumulated) accumulated.textContent = `House Accumulated ${totalRevenue.toFixed(2)} BIRR`;

    let stats = card.querySelector('.cartella-reference-stats');
    if (!stats && h2) {
      stats = document.createElement('div');
      stats.className = 'cartella-reference-stats';
      const grid = card.querySelector('.inspector-grid');
      if (grid) grid.insertAdjacentElement('beforebegin', stats);
    }
    const called = root.querySelectorAll('.number-cell.called').length;
    const marked = card.querySelectorAll('.inspector-cell.marked').length;
    if (stats) stats.innerHTML = `<span>Numbers Called: <strong>${called}</strong></span><span>Card Marked: <strong>${marked} / 25</strong></span>`;

    let footer = card.querySelector('.cartella-reference-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'cartella-reference-footer';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'ref-close';
      close.textContent = '✕ CLOSE';
      close.onclick = () => card.querySelector('.inspector-close')?.click();
      const block = document.createElement('button');
      block.type = 'button';
      block.className = 'ref-block';
      block.textContent = '⊘ BLOCK';
      block.onclick = () => {
        const lock = card.querySelector('.lock-failed-button');
        if (lock) lock.click();
        else card.querySelector('.inspector-close')?.click();
      };
      footer.append(close, block);
      card.appendChild(footer);
    }
  }

  const run = () => updateInspector(document.body);
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(run, 400);
  run();
})();
