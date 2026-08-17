(()=>{
  const neutralize=()=>{
    const api=window.happyBingo;
    if(api){
      api.getLicenseInfo=async()=>({active:true});
      api.activateLicense=async()=>({ok:true});
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',neutralize,{once:false});
  neutralize();
  setInterval(neutralize,500);
})();
