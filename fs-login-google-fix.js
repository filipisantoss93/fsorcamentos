/* FS Orçamentos — correção do login Google no Android */
(function () {
  'use strict';

  var URL_OFICIAL = 'https://fsorcamentos.com.br';

  function destinoSeguro(destino) {
    var valor = String(destino || '').trim();
    if (!valor || valor.indexOf('http://') === 0 || valor.indexOf('https://') === 0 || valor.indexOf('//') === 0) return '/index.html';
    return valor.charAt(0) === '/' ? valor : '/' + valor;
  }

  function instalarCss() {
    if (document.getElementById('fs-login-google-fix-css')) return;

    var style = document.createElement('style');
    style.id = 'fs-login-google-fix-css';
    style.textContent = '.login-social-box{width:100%!important;margin:0 0 18px!important}.login-social-btn.google{width:100%!important;min-height:52px!important;padding:10px 14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;overflow:hidden!important;line-height:1.1!important}.login-social-btn.google img,.login-social-btn.google svg{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;object-fit:contain!important;flex:0 0 22px!important;display:block!important;margin:0!important;padding:0!important}.login-social-btn.google span{display:inline-block!important;flex:0 1 auto!important;white-space:nowrap!important;font-size:16px!important;line-height:1.1!important}';
    document.head.appendChild(style);
  }

  async function loginGoogleCorrigido(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }

    try {
      if (!window._supabase) {
        alert('Supabase não carregou. Atualize a página e tente novamente.');
        return;
      }

      var destinoSalvo = '';
      try { destinoSalvo = localStorage.getItem('fs_destino_apos_login') || ''; } catch (_) {}

      var destino = destinoSeguro(destinoSalvo || window.location.pathname || '/index.html');
      var redirectTo = URL_OFICIAL + '/index.html?login=1&dest=' + encodeURIComponent(destino);

      var resultado = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (resultado && resultado.error) {
        console.error('Erro ao entrar com Google:', resultado.error);
        alert('Não foi possível iniciar o login com Google. Tente novamente.');
      }
    } catch (erro) {
      console.error('Erro inesperado no login Google:', erro);
      alert('Erro inesperado ao iniciar login com Google.');
    }
  }

  function instalar() {
    instalarCss();
    window.loginComGoogle = loginGoogleCorrigido;

    if (!window.__fsLoginGoogleFixClick) {
      window.__fsLoginGoogleFixClick = true;
      document.addEventListener('click', function (event) {
        var alvo = event.target;
        var botao = alvo && alvo.closest ? alvo.closest('.login-social-btn.google') : null;
        if (botao) loginGoogleCorrigido(event);
      }, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar);
  } else {
    instalar();
  }

  setTimeout(instalar, 300);
  setTimeout(instalar, 1000);
})();
