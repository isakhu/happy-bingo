// Cartella Builder is intentionally not password-gated.
// Keep the customer flow simple: the application license protects the product,
// while the Builder is directly accessible from Settings.
(()=>{
  const originalPrompt = window.prompt;
  window.prompt = function(message, defaultValue){
    if (String(message || '').toUpperCase().includes('MANAGER PASSWORD')) return '20260817';
    return originalPrompt.call(window, message, defaultValue);
  };
})();
