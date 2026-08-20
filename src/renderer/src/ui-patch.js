(() => {
  const HOUSE_STARTING_BALANCE = 1000000;
  const money = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString();

  // House balance is fixed at 1,000,000 BIRR. Each ended game's company revenue
  // is accumulated in happy-bingo-bingo-made and deducted from this balance.
  localStorage.setItem('happy-bingo-total-money', String(HOUSE_STARTING_BALANCE));

  function currentBalance() {
    const revenue = Number(localStorage.getItem('happy-bingo-bingo-made') || '0');
    return Math.max(0, HOUSE_STARTING_BALANCE - revenue);
  }

  function ensureWindowControls() {
    let wrap = document.getElementById('happy-bingo-window-controls');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'happy-bingo-window-controls';
      wrap.innerHTML = '<div id="happy-bingo-balance">HOUSE BALANCE <strong>1,000,000 BIRR</strong></div><button id="happy-bingo-fullscreen" type="button" title="Toggle full screen">⛶ FULL SCREEN</button>';
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
      /* Checked Cartella: clean centered 75% presentation with no side scrolling. */
      .card-inspector {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
        transform: translate(-50%, -50%) !important;
        width: 75vw !important;
        max-width: 1100px !important;
        height: auto !important;
        max-height: 84vh !important;
        overflow: hidden !important;
        padding: 22px !important;
        border-radius: 20px !important;
        box-sizing: border-box !important;
        z-index: 120 !important;
      }
      .card-inspector .inspector-head {
        margin-bottom: 14px !important;
      }
      .card-inspector .inspector-head h2 {
        font-size: clamp(20px, 2.2vw, 30px) !important;
        margin: 3px 0 7px !important;
      }
      .card-inspector .inspector-head small {
        font-size: 10px !important;
      }
      .card-inspector .inspector-grid {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto !important;
        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        gap: 12px !important;
        overflow: hidden !important;
      }
      .card-inspector .inspector-cell {
        width: 100% !important;
        min-width: 0 !important;
        aspect-ratio: 1 !important;
        font-size: clamp(18px, 2.4vw, 34px) !important;
      }
      .card-inspector .winning-line-label {
        max-width: none !important;
        margin: 14px auto 0 !important;
        font-size: 12px !important;
      }
      .card-inspector .inspector-close,
      .card-inspector .lock-failed-button {
        display: block !important;
        width: 100% !important;
        margin: 11px auto 0 !important;
        box-sizing: border-box !important;
      }

      /* Winner result: same clean 75% centered presentation. */
      .winner-overlay {
        overflow: hidden !important;
      }
      .winner-card-with-grid {
        width: 75vw !important;
        max-width: 1100px !important;
        max-height: 84vh !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 24px !important;
      }
      .winner-grid {
        width: 100% !important;
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        gap: 12px !important;
        margin: 16px auto !important;
      }
      .winner-grid-cell {
        min-width: 0 !important;
        font-size: clamp(18px, 2.4vw, 34px) !important;
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
        .winner-card-with-grid {
          width: 90vw !important;
          max-height: 88vh !important;
          padding: 16px !important;
        }
        .card-inspector .inspector-grid,
        .winner-grid {
          gap: 7px !important;
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
