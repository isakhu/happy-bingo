(() => {
  function updateInspector(root) {
    const card = root.querySelector('.card-inspector');
    if (!card) return;

    const failed = !!card.querySelector('.failed-check');
    const small = card.querySelector('.inspector-head small');
    const h2 = card.querySelector('.inspector-head h2');
    if (small) small.textContent = failed ? 'NOT A WIN' : 'BINGO WINNER';

    /* User selected: no House Accumulated line and no statistics. */
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
    close.textContent = '✕ CLOSE';
    close.onclick = () => card.querySelector('.inspector-close')?.click();

    const existingBlock = footer.querySelector('.ref-block');
    if (failed) {
      const block = existingBlock || document.createElement('button');
      block.type = 'button';
      block.className = 'ref-block';
      block.textContent = '⊘ BLOCK';
      block.onclick = () => card.querySelector('.lock-failed-button')?.click();
      footer.replaceChildren(close, block);
    } else {
      footer.replaceChildren(close);
    }
  }

  const run = () => updateInspector(document.body);
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(run, 400);
  run();
})();