(() => {
  function updateInspector(root) {
    const card = root.querySelector('.card-inspector');
    if (!card) return;

    const failed = !!card.querySelector('.failed-check');
    const small = card.querySelector('.inspector-head small');
    const h2 = card.querySelector('.inspector-head h2');
    if (small) small.textContent = failed ? 'NOT A WIN' : 'BINGO WINNER';

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
      /* Delegate to the existing authoritative lock action. This preserves the
         existing player-lock + cartellawu behavior instead of creating a second sound path. */
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