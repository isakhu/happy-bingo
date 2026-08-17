// Cartella Builder is directly accessible from Settings.
// No in-app password prompt is used.
(()=>{
  const wire=()=>{
    document.querySelectorAll('.settings-action.lock').forEach(btn=>{
      if(btn.dataset.passwordless==='1')return;
      btn.dataset.passwordless='1';
      btn.textContent='BUILD / EDIT 100 CARTELLAS';
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        const direct=document.querySelector('#set-builder');
        if(direct){direct.click();return}
        window.dispatchEvent(new CustomEvent('happy-bingo-open-builder'));
      },true);
    });
  };
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(wire,500);
  wire();
})();
