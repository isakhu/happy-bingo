function formatMoney(value){return Math.round(value).toLocaleString()}
function refreshSelectionSummary(){
  const sidebar=document.querySelector('.selection-sidebar')
  const selectedNode=document.querySelector('.selection-count b')
  if(!sidebar||!selectedNode)return
  const selected=Number(selectedNode.textContent||0)||0
  const betRaw=localStorage.getItem('happy-bingo-bet')||''
  const cutRaw=localStorage.getItem('happy-bingo-cut')||''
  const hasBet=betRaw.trim()!==''&&Number.isFinite(Number(betRaw))
  const total=hasBet?selected*Number(betRaw):null
  const cut=total!==null&&cutRaw.trim()!==''&&Number.isFinite(Number(cutRaw))?total*Number(cutRaw)/100:0
  const payout=total===null?null:Math.max(0,total-cut)
  const moneyCard=sidebar.querySelector('.money-info')
  if(moneyCard){
    const label=moneyCard.querySelector('span')
    const value=moneyCard.querySelector('strong')
    if(label)label.textContent='PAY OUT'
    if(value)value.textContent=payout===null?'—':`${formatMoney(payout)} BIRR`
  }
  let betCard=sidebar.querySelector('.bet-info')
  if(!betCard){
    betCard=document.createElement('div')
    betCard.className='selection-info-card bet-info'
    betCard.innerHTML='<span>BET AMOUNT</span><strong>—</strong>'
    const money=sidebar.querySelector('.money-info')
    sidebar.insertBefore(betCard,money||null)
  }
  const betValue=betCard.querySelector('strong')
  if(betValue)betValue.textContent=hasBet?`${formatMoney(Number(betRaw))} BIRR / PLAYER`:'—'
}
const observer=new MutationObserver(refreshSelectionSummary)
observer.observe(document.body,{childList:true,subtree:true,characterData:true})
window.addEventListener('storage',refreshSelectionSummary)
window.setInterval(refreshSelectionSummary,250)
refreshSelectionSummary()
