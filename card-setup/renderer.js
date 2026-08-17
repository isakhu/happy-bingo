const cards=Array.from({length:100},(_,i)=>({id:i+1,values:Array(25).fill(0)}));let index=0
const ranges=[[1,15],[16,30],[31,45],[46,60],[61,75]]
const $=s=>document.querySelector(s)
function valid(card){if(card.values[12]!==0)return false;for(let c=0;c<5;c++){const [min,max]=ranges[c],seen=new Set();for(let r=0;r<5;r++){const i=r*5+c;if(i===12)continue;const n=Number(card.values[i]);if(!Number.isInteger(n)||n<min||n>max||seen.has(n))return false;seen.add(n)}}return true}
function validCount(){return cards.filter(valid).length}
function showMessage(t,ok=false){const m=$('#message');m.textContent=t;m.className=`message ${ok?'ok':'error'}`}
function render(){const c=cards[index];$('#cardNo').textContent=String(c.id).padStart(3,'0');$('#status').textContent=`${validCount()} / 100 VALID`;const g=$('#grid');g.innerHTML='';for(let i=0;i<25;i++){const input=document.createElement('input');input.inputMode='numeric';input.maxLength=2;input.value=i===12?'FREE':(c.values[i]||'');input.disabled=i===12;input.className=i===12?'free':'';input.addEventListener('input',e=>{c.values[i]=Number(e.target.value)||0;render()});g.appendChild(input)}}
$('#prev').onclick=()=>{if(index>0){index--;render()}}
$('#next').onclick=()=>{if(index<99){index++;render()}}
$('#clear').onclick=()=>{cards[index].values=Array(25).fill(0);render();showMessage(`Cartella ${String(index+1).padStart(3,'0')} cleared.`)}
$('#go').onclick=()=>{const n=Math.max(1,Math.min(100,Number($('#jump').value)||1));index=n-1;$('#jump').value=n;render()}
$('#open').onclick=async()=>{try{const r=await window.cardSetup.openHbc();if(r.canceled)return;for(let i=0;i<100;i++)cards[i]=r.cards[i];$('#setId').value=r.setId||'HB-001';index=0;render();showMessage(`Loaded ${r.setId||'HB-001'}.`,true)}catch(e){showMessage('Could not open this Cartella Set.')}}
$('#export').onclick=async()=>{if(validCount()!==100){showMessage(`Finish all 100 Cartellas first. ${validCount()} are valid.`);return}try{const r=await window.cardSetup.saveHbc({setId:$('#setId').value.trim()||'HB-001',cards});if(!r.canceled)showMessage(`Exported ${r.setId}. Give this .hbc file to the Happy Bingo installation process.`,true)}catch(e){showMessage(e?.message||'Could not export the set.')}}
render()
