(() => {
  const css = `
    /* Root interaction repair: restore normal hit-testing and fix stacking. */
    .selection-mode .topbar,
    .bingo-mode .topbar.game-topbar {
      position: relative !important;
      z-index: 50 !important;
      pointer-events: auto !important;
    }

    .selection-mode .selection-screen,
    .bingo-mode .bingo-main {
      position: relative !important;
      z-index: 1 !important;
      pointer-events: auto !important;
    }

    .selection-mode .top-actions,
    .selection-mode .top-button,
    .selection-mode .selection-sidebar,
    .selection-mode .cartella-grid,
    .selection-mode .cartella,
    .selection-mode .clear-selection-button,
    .selection-mode .start-button {
      position: relative !important;
      z-index: 60 !important;
      pointer-events: auto !important;
    }

    .bingo-mode .top-actions,
    .bingo-mode .top-button,
    .bingo-mode .bottom-bar,
    .bingo-mode .bottom-actions,
    .bingo-mode .bottom-actions .action {
      position: relative !important;
      z-index: 60 !important;
      pointer-events: auto !important;
    }

    .selection-mode .selection-sidebar,
    .selection-mode .selection-sidebar * {
      pointer-events: auto !important;
    }

    .bingo-mode .top-actions,
    .bingo-mode .top-actions * ,
    .bingo-mode .bottom-actions,
    .bingo-mode .bottom-actions * {
      pointer-events: auto !important;
    }

    .bingo-mode .board-shell,
    .bingo-mode .board-grid,
    .bingo-mode .call-stage,
    .bingo-mode .recent-panel,
    .bingo-mode .game-metrics,
    .bingo-mode .game-metric,
    .bingo-mode .brand,
    .bingo-mode .brand::before,
    .bingo-mode .brand::after,
    .bingo-mode .total-amount-ball {
      pointer-events: none !important;
    }

    .modal-backdrop,
    .check-backdrop,
    .card-inspector,
    .winner-overlay {
      z-index: 1000 !important;
    }

    .modal-backdrop button,
    .modal-backdrop input,
    .modal-backdrop select,
    .modal-backdrop textarea,
    .check-backdrop button,
    .check-backdrop input,
    .check-backdrop select,
    .check-backdrop textarea,
    .card-inspector button,
    .winner-overlay button {
      pointer-events: auto !important;
    }
  `

  const install = () => {
    if (document.getElementById('happy-bingo-root-interaction-repair')) return
    const style = document.createElement('style')
    style.id = 'happy-bingo-root-interaction-repair'
    style.textContent = css
    document.head.appendChild(style)
  }

  // Load after the renderer's CSS has settled so this is the final interaction layer.
  window.setTimeout(install, 250)
  window.setTimeout(install, 1000)
})()
