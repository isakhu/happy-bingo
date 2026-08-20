/* Final visual helper: keep six stable recent-call positions and color every call by B/I/N/G/O. */
(() => {
  const colorClass = (n) => {
    const value = Number(n);
    if (!Number.isInteger(value) || value < 1 || value > 75) return '';
    if (value <= 15) return 'hb-b-call';
    if (value <= 30) return 'hb-i-call';
    if (value <= 45) return 'hb-n-call';
    if (value <= 60) return 'hb-g-call';
    return 'hb-o-call';
  };

  const applyCallColor = (el) => {
    if (!el || el.classList.contains('hb-empty-recent')) return;
    const match = (el.textContent || '').match(/\b([1-9]|[1-6][0-9]|7[0-5])\b/);
    const cls = colorClass(match ? match[1] : '');
    el.classList.remove('hb-b-call','hb-i-call','hb-n-call','hb-g-call','hb-o-call');
    if (cls) el.classList.add(cls);
  };

  const ensure = () => {
    const row = document.querySelector('.bingo-mode .recent-calls');
    if (row) {
      row.querySelectorAll('.recent-ball:not(.hb-empty-recent)').forEach(applyCallColor);
      const real = row.querySelectorAll('.recent-ball:not(.hb-empty-recent)').length;
      row.querySelectorAll('.hb-empty-recent').forEach(el => el.remove());
      for (let i = real; i < 6; i++) {
        const cell = document.createElement('div');
        cell.className = 'recent-ball hb-empty-recent';
        cell.setAttribute('aria-hidden', 'true');
        row.appendChild(cell);
      }
    }

    const current = document.querySelector('.bingo-mode .marquee-ball');
    if (current) applyCallColor(current);
  };

  const observer = new MutationObserver(ensure);
  const boot = () => {
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    ensure();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();