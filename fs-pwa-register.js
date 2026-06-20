/* FS Orçamentos - Registro PWA */
(function(){
  'use strict';

  function podeRegistrar(){
    return 'serviceWorker' in navigator && location.protocol === 'https:';
  }

  async function registrarPWA(){
    if(!podeRegistrar()) return;
    try{
      const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      window.fsServiceWorkerRegistration = reg;

      try { await reg.update(); } catch(_) {}

      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        if(!novo) return;
        novo.addEventListener('statechange', () => {
          if(novo.state === 'installed' && navigator.serviceWorker.controller){
            console.info('Nova versão do FS Orçamentos disponível. Feche e abra o app para aplicar.');
          }
        });
      });
    }catch(error){
      console.warn('Não foi possível registrar o PWA:', error);
    }
  }

  if(document.readyState === 'complete') registrarPWA();
  else window.addEventListener('load', registrarPWA, { once:true });
})();
