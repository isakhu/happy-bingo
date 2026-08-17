(()=>{
function clean(){
  const modal=document.querySelector('.colorful-settings');
  if(!modal)return;
  const selectors=['.settings-card.blue','.settings-action.lock','.settings-action.pdf','#sets-panel','#fb-modal'];
  selectors.forEach(s=>modal.querySelectorAll(s).forEach(el=>el.remove()));
  modal.querySelectorAll('.setting-row').forEach(row=>{if(row.querySelector('select'))row.remove()});
  if(!modal.querySelector('#customer-cartella-readonly')){
    const current=localStorage.getItem('happy-bingo-current-set')||'';
    const panel=document.createElement('section');
    panel.id='customer-cartella-readonly';
    panel.innerHTML=current?`<strong>CARTELLA SET: ${current}</strong><small>100 saved Cartellas installed for this machine.</small>`:'<strong>CARTELLA SET</strong><small>No Cartella Set is installed. Contact the seller.</small>';
    modal.querySelector('.settings-grid')?.appendChild(panel);
  }
}
new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
})();