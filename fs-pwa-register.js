/* FS Orçamentos - Registro PWA e tema global claro */
(function(){
  'use strict';

  function aplicarTemaCinzaClaro(){
    if(document.getElementById('fs-tema-cinza-claro-runtime')) return;
    const style = document.createElement('style');
    style.id = 'fs-tema-cinza-claro-runtime';
    style.textContent = `
      :root{
        --fs-grafite:#94a3b8!important;
        --fs-grafite-2:#cbd5e1!important;
        --fs-grafite-3:#64748b!important;
        --fs-destaque:#e5e7eb!important;
        --fs-destaque-2:#cbd5e1!important;
        --fs-creme:#f8fafc!important;
        --fs-creme-2:#eef2f7!important;
        --fs-card:#ffffff!important;
        --fs-card-soft:#f8fafc!important;
        --fs-borda:#dbe3ee!important;
        --fs-borda-2:#cbd5e1!important;
        --fs-texto:#1f2937!important;
        --fs-muted:#64748b!important;
        --primary:#e5e7eb!important;
        --bg-dark:#f1f5f9!important;
        --body-gray:#ffffff!important;
        --text-dark:#1f2937!important;
        --accent-gray:#e5e7eb!important;
      }
      body{background:linear-gradient(180deg,#ffffff 0%,#f8fafc 42%,#eef2f7 100%)!important;color:#1f2937!important;}
      .main-header{background:linear-gradient(135deg,#ffffff,#e5e7eb)!important;color:#1f2937!important;border-bottom:1px solid #cbd5e1!important;box-shadow:0 4px 14px rgba(51,65,85,.10)!important;}
      .header-menu-linha{border-top-color:#dbe3ee!important;}
      .logo-nav,.logo-nav span,#usuario-saudacao,.nav-menu a,.nav-menu summary,.nav-menu-compacto a,.nav-menu-compacto summary{color:#1f2937!important;}
      .logo-nav span{color:#475569!important;}
      .nav-menu a:hover,.nav-menu summary:hover,.nav-menu a.ativo{background:#dbe3ee!important;color:#111827!important;}
      .btn-notificacoes-header,.btn-header-entrar,.btn-header-sair,.menu-mobile-btn,.btn-menu-mobile-entrar,.btn-menu-mobile-sair{background:#f8fafc!important;border-color:#cbd5e1!important;color:#1f2937!important;box-shadow:none!important;}
      .btn-primary,.btn-principal,.fs-btn-primary,.acao-principal,.premium-action{background:#e5e7eb!important;border-color:#cbd5e1!important;color:#1f2937!important;box-shadow:0 4px 12px rgba(51,65,85,.10)!important;}
      .card,.fs-card,.box,.painel-card,.clientes-card,.orcamentos-card,.estoque-card,.ordem-card,.premium-home-card,.premium-home-alertas,.premium-home-financeiro{background:#fff!important;border-color:#dbe3ee!important;color:#1f2937!important;box-shadow:0 4px 16px rgba(51,65,85,.08)!important;}
      .modal-pagamento-card,.fs-modal-cliente-box,.login-modal,.auth-card{background:#fff!important;color:#1f2937!important;border-color:#dbe3ee!important;}
      @media(max-width:860px){.nav-menu,.nav-menu-compacto{background:#fff!important;border-color:#dbe3ee!important;}}
    `;
    document.head.appendChild(style);
  }

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

  aplicarTemaCinzaClaro();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicarTemaCinzaClaro, { once:true });
  if(document.readyState === 'complete') registrarPWA();
  else window.addEventListener('load', registrarPWA, { once:true });
})();
