/* FS Orçamentos — correções defensivas da home e do botão Sair */
(function(){
  'use strict';

  function pathLimpo(){
    return String(location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  }

  function ehHome(){
    const p = pathLimpo();
    return p === '/' || p === '/index' || p === '/index.html';
  }

  function limparDadosLocais(){
    [
      'id','usuario_email','usuario_nome','usuario_plano','usuario_plano_status','usuario_plano_expira_em',
      'nome_empresa','telefone_empresa','endereco_empresa','cnpj_empresa','foto_url',
      'responsavel_selecionado_nome','consultor_selecionado_nome','fs_destino_apos_login'
    ].forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });
  }

  async function sairSeguro(){
    try { if (typeof fecharMenuMobileSeAberto === 'function') fecharMenuMobileSeAberto(); } catch(_) {}
    try { if (window._supabase?.auth) await window._supabase.auth.signOut(); } catch(e) { console.warn('Sessão já encerrada ou indisponível:', e); }
    limparDadosLocais();
    try { document.getElementById('btn-flutuante-gerador-global')?.remove(); } catch(_) {}
    try { if (typeof atualizarHeaderUsuario === 'function') await atualizarHeaderUsuario(null); } catch(_) {}
    location.href = '/index.html?logout=1';
  }

  function instalarSairSeguro(){
    window.deslogar = sairSeguro;
    document.addEventListener('click', function(ev){
      const alvo = ev.target?.closest?.('#btn-header-sair,#btn-menu-mobile-sair,.btn-header-sair,.btn-menu-mobile-sair,[data-acao="sair"]');
      if (!alvo) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      sairSeguro();
    }, true);
  }

  function instalarCssHomeSeguro(){
    if (!ehHome() || document.getElementById('fs-home-auth-fix-style')) return;
    const s = document.createElement('style');
    s.id = 'fs-home-auth-fix-style';
    s.textContent = `
      #modal-login.modal-login-overlay { display: none; }
      #modal-login.modal-login-overlay.ativo,
      #modal-login.modal-login-overlay.active,
      body.login-modal-aberto #modal-login.modal-login-overlay { display: flex; }
      body:not(.login-modal-aberto) #modal-login:not(.ativo):not(.active) { display: none !important; }
      #home-publica { visibility: visible !important; opacity: 1 !important; }
      #splash-screen.hide-splash { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    `;
    document.head.appendChild(s);
  }

  function garantirHomeVisivel(){
    if (!ehHome()) return;
    instalarCssHomeSeguro();
    const params = new URLSearchParams(location.search || '');
    const modal = document.getElementById('modal-login');
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-publica');

    if (home) {
      home.style.visibility = 'visible';
      home.style.opacity = '1';
      if (home.style.display === 'none') home.style.display = 'grid';
    }

    if (splash) {
      setTimeout(() => splash.classList.add('hide-splash'), 1200);
      setTimeout(() => {
        splash.style.display = 'none';
        splash.style.pointerEvents = 'none';
      }, 2600);
    }

    if (modal && params.get('login') !== '1' && !document.body.classList.contains('login-modal-aberto')) {
      modal.classList.remove('ativo','active');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function bloquearRedirectAutomaticoHome(){
    if (!ehHome()) return;
    window.redirecionarUsuarioLogadoParaDashboardIndex = async function(){ return false; };
  }

  instalarSairSeguro();
  instalarCssHomeSeguro();
  bloquearRedirectAutomaticoHome();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', garantirHomeVisivel);
  } else {
    garantirHomeVisivel();
  }

  let tentativas = 0;
  const timer = setInterval(() => {
    instalarSairSeguro();
    bloquearRedirectAutomaticoHome();
    garantirHomeVisivel();
    if (++tentativas > 50) clearInterval(timer);
  }, 400);
})();
