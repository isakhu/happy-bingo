(() => {
  function updateInspector(root) {
    const card = root.querySelector('.card-inspector');
    if (!card) return;

    const failed = !!card.querySelector('.failed-check');
    const head = card.querySelector('.inspector-head');
    const h2 = card.querySelector('.inspector-head h2');
    if (!head || !h2) return;

    const idMatch = (h2.textContent || '').match(/#\s*(\d+)/);
    const cartellaNumber = idMatch ? String(Number(idMatch[1])).padStart(3, '0') : '---';

    let numberBadge = head.querySelector('.cartella-number-badge');
    if (!numberBadge) {
      numberBadge = document.createElement('div');
      numberBadge.className = 'cartella-number-badge';
      head.appendChild(numberBadge);
    }
    numberBadge.textContent = `CARTELLA ${cartellaNumber}`;

    card.querySelector('.cartella-reference-accumulated')?.remove();
    card.querySelector('.cartella-reference-stats')?.remove();

    let footer = card.querySelector('.cartella-reference-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'cartella-reference-footer';
      card.appendChild(footer);
    }

    const close = footer.querySelector('.ref-close') || document.createElement('button');
    close.type = 'button';
    close.className = 'ref-close';
    close.textContent = 'CLOSE';
    close.onclick = () => card.querySelector('.inspector-close')?.click();

    const block = footer.querySelector('.ref-block') || document.createElement('button');
    block.type = 'button';
    block.className = 'ref-block';
    block.textContent = 'BLOCK';
    block.disabled = !failed;
    block.title = failed ? 'Manager authority: block this failed claim' : 'Only available for a failed claim';
    block.onclick = () => {
      if (!failed) return;
      card.querySelector('.lock-failed-button')?.click();
    };

    footer.replaceChildren(close, block);
  }

  const run = () => updateInspector(document.body);
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(run, 400);
  run();
})();