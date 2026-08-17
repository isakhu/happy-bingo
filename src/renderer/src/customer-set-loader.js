(()=>{
if(sessionStorage.getItem('happy-bingo-set-check-done')==='1')return;
const blank=Array.from({length:100},(_,i)=>({id:i+1,values:Array(25).fill(0)}));
try{localStorage.setItem('happy-bingo-cards',JSON.stringify(blank));}catch{}
const load=async()=>{try{const api=window.happyBingo;if(!api?.getInstalledSet){sessionStorage.setItem('happy-bingo-set-check-done','1');return}const data=await api.getInstalledSet();if(data?.cards?.length===100){localStorage.setItem('happy-bingo-card-sets',JSON.stringify({[data.setId]:{id:data.setId,cards:data.cards,createdAt:data.createdAt||new Date().toISOString()}}));localStorage.setItem('happy-bingo-current-set',data.setId);localStorage.setItem('happy-bingo-cards',JSON.stringify(data.cards));sessionStorage.setItem('happy-bingo-set-check-done','1');location.reload();}else{sessionStorage.setItem('happy-bingo-set-check-done','1');}}catch(e){console.error('Cartella set load failed',e);sessionStorage.setItem('happy-bingo-set-check-done','1')}};
load();
})();
