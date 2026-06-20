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
    if (window.__fsHomeAuthFixSairInstalado) return;
    window.__fsHomeAuthFixSairInstalado = true;
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
      #home-publica .home-visao-plano.ativo { display: grid !important; visibility: visible !important; opacity: 1 !important; }
      #splash-screen.hide-splash { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    `;
    document.head.appendChild(s);
  }

  function elementoVisivel(el){
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;
  }

  function garantirSecaoHomeAtiva(){
    if (!ehHome()) return;
    const secoes = Array.from(document.querySelectorAll('#home-publica .home-visao-plano'));
    if (!secoes.length) return;

    const existeVisivel = secoes.some(elementoVisivel);
    if (existeVisivel) return;

    const gratis = document.getElementById('home-plano-gratis') || secoes[0];
    if (!gratis) return;

    secoes.forEach(secao => {
      secao.classList.remove('ativo');
      secao.style.setProperty('display', 'none', 'important');
    });

    gratis.classList.add('ativo');
    gratis.style.setProperty('display', 'grid', 'important');
    gratis.style.setProperty('visibility', 'visible', 'important');
    gratis.style.setProperty('opacity', '1', 'important');
  }

  function garantirHomeVisivel(){
    if (!ehHome()) return;
    instalarCssHomeSeguro();
    const params = new URLSearchParams(location.search || '');
    const modal = document.getElementById('modal-login');
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-publica');

    if (home) {
      home.style.setProperty('visibility', 'visible', 'important');
      home.style.setProperty('opacity', '1', 'important');
      if (getComputedStyle(home).display === 'none') home.style.setProperty('display', 'grid', 'important');
    }

    garantirSecaoHomeAtiva();

    if (splash) {
      setTimeout(() => splash.classList.add('hide-splash'), 900);
      setTimeout(() => {
        splash.style.display = 'none';
        splash.style.pointerEvents = 'none';
      }, 2200);
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
    if (++tentativas > 60) clearInterval(timer);
  }, 350);
})();
