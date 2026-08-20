(() => {
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  if (!localStorage.getItem('happy-bingo-total-money')) {
    localStorage.setItem('happy-bingo-total-money', '1000000');
  }

  function currentBalance() {
    const total = Number(localStorage.getItem('happy-bingo-total-money') || '1000000');
    const revenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0');
    return Math.max(0, total - revenue);
  }

  function ensureWindowControls() {
    let wrap = document.getElementById('happy-bingo-window-controls');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'happy-bingo-window-controls';
      wrap.innerHTML = '<div id="happy-bingo-balance">BALANCE <strong>1,000,000 BIRR</strong></div><button id="happy-bingo-fullscreen" type="button" title="Toggle full screen">⛶ FULL SCREEN</button>';
      document.body.appendChild(wrap);

      const button = wrap.querySelector('#happy-bingo-fullscreen');
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (error) {
          console.error('Fullscreen toggle failed:', error);
        }
      });

      document.addEventListener('fullscreenchange', updateFullscreenLabel);
      updateFullscreenLabel();
    }

    const balance = wrap.querySelector('#happy-bingo-balance strong');
    if (balance) balance.textContent = `${money(currentBalance())} BIRR`;
  }

  function updateFullscreenLabel() {
    const button = document.getElementById('happy-bingo-fullscreen');
    if (button) button.textContent = document.fullscreenElement ? '⛶ EXIT FULL SCREEN' : '⛶ FULL SCREEN';
  }

  function hideUnwantedSettingsNavigation() {
    const modal = document.querySelector('.settings-redesigned');
    if (!modal) return;
    modal.classList.add('settings-single-page');
    const label = modal.querySelector('.settings-section-label');
    if (label) label.dataset.fixedLabel = 'SETTINGS';
  }

  function installCardCheckLayout() {
    if (document.getElementById('happy-bingo-card-check-layout')) return;
    const style = document.createElement('style');
    style.id = 'happy-bingo-card-check-layout';
    style.textContent = `
      /* Bingo claim card: compact centered presentation, about 60% of the screen. */
      .card-inspector {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        right: auto !important;
        transform: translate(-50%, -50%) !important;
        width: min(60vw, 760px) !important;
        height: auto !important;
        max-height: 72vh !important;
        overflow: auto !important;
        padding: 20px !important;
        border-radius: 18px !important;
        z-index: 120 !important;
      }
      .card-inspector .inspector-head {
        margin-bottom: 12px !important;
      }
      .card-inspector .inspector-head h2 {
        font-size: clamp(18px, 2vw, 26px) !important;
        margin: 3px 0 6px !important;
      }
      .card-inspector .inspector-head small {
        font-size: 10px !important;
      }
      .card-inspector .inspector-grid {
        width: 100% !important;
        max-width: 620px !important;
        margin: 0 auto !important;
        grid-template-columns: repeat(5, 1fr) !important;
        gap: 9px !important;
      }
      .card-inspector .inspector-cell {
        width: 100% !important;
        aspect-ratio: 1 !important;
        font-size: clamp(16px, 2.3vw, 30px) !important;
      }
      .card-inspector .winning-line-label {
        max-width: 620px !important;
        margin: 12px auto 0 !important;
        font-size: 11px !important;
      }
      .card-inspector .inspector-close,
      .card-inspector .lock-failed-button {
        display: block !important;
        width: min(620px, 100%) !important;
        margin: 10px auto 0 !important;
      }
      .check-modal {
        width: min(60vw, 620px) !important;
        max-height: 60vh !important;
      }
      .check-body {
        max-width: 520px !important;
        margin: 0 auto !important;
      }
      @media (max-width: 800px) {
        .card-inspector,
        .check-modal {
          width: 88vw !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function refresh() {
    ensureWindowControls();
    hideUnwantedSettingsNavigation();
    installCardCheckLayout();
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(refresh, 500);
  refresh();
})();
