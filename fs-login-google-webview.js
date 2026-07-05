/* FS Orçamentos — Google OAuth via domínio oficial */
(function () {
  'use strict';

  var URL_OFICIAL = 'https://fsorcamentos.com.br';

  function destinoSeguro(valor) {
    valor = String(valor || '').trim();
    if (!valor || valor.indexOf('http://') === 0 || valor.indexOf('https://') === 0 || valor.indexOf('//') === 0) return '/index.html';
    return valor.charAt(0) === '/' ? valor : '/' + valor;
  }

  async function loginGoogleWebview(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }

    if (!window._supabase) {
      alert('Supabase não carregou. Atualize a página e tente novamente.');
      return;
    }

    var destino = '/index.html';
    try { destino = destinoSeguro(localStorage.getItem('fs_destino_apos_login') || window.location.pathname || '/index.html'); } catch (_) {}
    try { localStorage.setItem('fs_destino_apos_login', destino); } catch (_) {}

    var redirectTo = URL_OFICIAL + '/index.html?login=1&dest=' + encodeURIComponent(destino);

    var retorno = await window._supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (retorno && retorno.error) {
      console.error('Erro no login Google:', retorno.error);
      alert('Não foi possível iniciar o login com Google.');
    }
  }

  function instalar() {
    window.loginComGoogle = loginGoogleWebview;

    if (!window.__fsLoginGoogleWebviewClick) {
      window.__fsLoginGoogleWebviewClick = true;
      document.addEventListener('click', function (event) {
        var botao = event.target && event.target.closest ? event.target.closest('.login-social-btn.google') : null;
        if (botao) loginGoogleWebview(event);
      }, true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  setTimeout(instalar, 500);
  setTimeout(instalar, 1500);
})();
