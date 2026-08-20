/* Final visual helper: keep six stable recent-call positions before any calls. */
(() => {
  const ensure = () => {
    const row = document.querySelector('.bingo-mode .recent-calls');
    if (!row) return;
    const real = row.querySelectorAll('.recent-ball:not(.hb-empty-recent)').length;
    row.querySelectorAll('.hb-empty-recent').forEach(el => el.remove());
    if (real >= 6) return;
    for (let i = real; i < 6; i++) {
      const cell = document.createElement('div');
      cell.className = 'recent-ball hb-empty-recent';
      cell.setAttribute('aria-hidden', 'true');
      row.appendChild(cell);
    }
  };
  const observer = new MutationObserver(ensure);
  const boot = () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    ensure();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();