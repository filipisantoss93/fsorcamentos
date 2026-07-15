/* FS Orçamentos — login Google Android com navegador seguro e deep link */
(function () {
  'use strict';

  var URL_OFICIAL = 'https://fsorcamentos.com.br';
  var APP_DEEP_LINK = 'br.com.fsorcamentos.app://auth-callback';

  function isAppAndroid() {
    try {
      if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function') return window.Capacitor.isNativePlatform();
      if (window.Capacitor && window.Capacitor.platform && window.Capacitor.platform !== 'web') return true;
    } catch (_) {}
    return false;
  }

  function getPlugin(nome) {
    try {
      return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins[nome] : null;
    } catch (_) {
      return null;
    }
  }

  function destinoSeguro(destino) {
    var valor = String(destino || '').trim();
    if (!valor || valor.indexOf('http://') === 0 || valor.indexOf('https://') === 0 || valor.indexOf('//') === 0) return '/index.html';
    return valor.charAt(0) === '/' ? valor : '/' + valor;
  }

  function instalarCss() {
    if (document.getElementById('fs-login-google-fix-css')) return;
    var style = document.createElement('style');
    style.id = 'fs-login-google-fix-css';
    style.textContent = '.login-social-box{width:100%!important;margin:0 0 18px!important}.login-social-btn.google{width:100%!important;min-height:52px!important;padding:10px 14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;overflow:hidden!important;line-height:1.1!important}.login-social-btn.google img,.login-social-btn.google svg{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;object-fit:contain!important;flex:0 0 22px!important;display:block!important;margin:0!important;padding:0!important}.login-social-btn.google span{display:inline-block!important;flex:0 1 auto!important;white-space:nowrap!important;font-size:16px!important;line-height:1.1!important}.fs-esqueci-senha{display:block;margin:-2px 0 14px;text-align:right;color:#f6c443!important;font-size:13px;font-weight:700;text-decoration:none}.fs-esqueci-senha:hover,.fs-esqueci-senha:focus{text-decoration:underline}';
    document.head.appendChild(style);
  }

  function instalarLinkRecuperacaoSenha() {
    var senha = document.getElementById('auth-senha');
    if (!senha || document.getElementById('fs-esqueci-senha')) return;

    var grupoSenha = senha.closest ? senha.closest('.auth-campo-index') : null;
    if (!grupoSenha || !grupoSenha.parentNode) return;

    var link = document.createElement('a');
    link.id = 'fs-esqueci-senha';
    link.className = 'fs-esqueci-senha';
    link.href = '/recuperar-senha.html';
    link.textContent = 'Esqueci minha senha';
    link.setAttribute('aria-label', 'Recuperar minha senha');
    grupoSenha.insertAdjacentElement('afterend', link);

    var alternar = document.getElementById('link-alternar');
    if (alternar && !alternar.dataset.fsRecuperacaoListener) {
      alternar.dataset.fsRecuperacaoListener = 'sim';
      alternar.addEventListener('click', function () {
        window.setTimeout(function () {
          var titulo = document.getElementById('auth-titulo');
          var emLogin = !titulo || String(titulo.textContent || '').toLowerCase().indexOf('acesse') !== -1;
          link.style.display = emLogin ? 'block' : 'none';
        }, 0);
      });
    }
  }

  async function fecharBrowserSeguro() {
    try {
      var Browser = getPlugin('Browser');
      if (Browser && Browser.close) await Browser.close();
    } catch (_) {}
  }

  function paramsDoHash(urlParse) {
    var hash = String(urlParse.hash || '');
    if (hash.charAt(0) === '#') hash = hash.slice(1);
    return new URLSearchParams(hash);
  }

  async function finalizarSessaoComRetorno(texto) {
    var urlParse = new URL(texto);
    var hashParams = paramsDoHash(urlParse);

    var erro = urlParse.searchParams.get('error') || hashParams.get('error') || urlParse.searchParams.get('error_description') || hashParams.get('error_description');
    if (erro) {
      alert('Login Google cancelado ou recusado.');
      return false;
    }

    var code = urlParse.searchParams.get('code') || hashParams.get('code');
    var accessToken = urlParse.searchParams.get('access_token') || hashParams.get('access_token');
    var refreshToken = urlParse.searchParams.get('refresh_token') || hashParams.get('refresh_token');

    if (code && window._supabase.auth.exchangeCodeForSession) {
      var porCodigo = await window._supabase.auth.exchangeCodeForSession(code);
      if (porCodigo && porCodigo.error) throw porCodigo.error;
      return true;
    }

    if (accessToken && refreshToken && window._supabase.auth.setSession) {
      var porToken = await window._supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (porToken && porToken.error) throw porToken.error;
      return true;
    }

    console.warn('Retorno OAuth sem code/access_token:', texto);
    alert('O Google voltou para o app, mas sem token de acesso. Verifique se o redirect está liberado no Supabase.');
    return false;
  }

  async function tratarRetornoOAuth(url) {
    try {
      if (!url || !window._supabase) return;
      var texto = String(url);
      if (texto.indexOf(APP_DEEP_LINK) !== 0) return;

      await fecharBrowserSeguro();

      var ok = await finalizarSessaoComRetorno(texto);
      if (!ok) return;

      var destino = '/index.html';
      try { destino = destinoSeguro(localStorage.getItem('fs_destino_apos_login') || '/index.html'); } catch (_) {}
      try { localStorage.removeItem('fs_destino_apos_login'); } catch (_) {}
      window.location.href = destino;
    } catch (erroFinalizar) {
      console.error('Erro ao processar retorno OAuth:', erroFinalizar);
      alert('Erro ao finalizar login no app. Tente novamente.');
    }
  }

  function instalarDeepLinkListener() {
    if (window.__fsDeepLinkOAuthOk) return;
    var App = getPlugin('App');
    if (!App || !App.addListener) return;
    window.__fsDeepLinkOAuthOk = true;
    App.addListener('appUrlOpen', function (event) {
      tratarRetornoOAuth(event && event.url);
    });
    if (App.getLaunchUrl) {
      App.getLaunchUrl().then(function (event) {
        tratarRetornoOAuth(event && event.url);
      }).catch(function () {});
    }
  }

  async function abrirOAuthAndroid(url) {
    var Browser = getPlugin('Browser');
    if (Browser && Browser.open) {
      await Browser.open({ url: url, presentationStyle: 'fullscreen' });
      return;
    }
    window.location.href = url;
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
      try { localStorage.setItem('fs_destino_apos_login', destino); } catch (_) {}

      var redirectTo = isAppAndroid() ? APP_DEEP_LINK : URL_OFICIAL + '/index.html?login=1&dest=' + encodeURIComponent(destino);

      var resultado = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          skipBrowserRedirect: isAppAndroid(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (resultado && resultado.error) {
        console.error('Erro ao entrar com Google:', resultado.error);
        alert('Não foi possível iniciar o login com Google. Tente novamente.');
        return;
      }

      if (isAppAndroid()) {
        var authUrl = resultado && resultado.data && resultado.data.url;
        if (!authUrl) {
          alert('Não foi possível obter a URL segura do Google.');
          return;
        }
        await abrirOAuthAndroid(authUrl);
      }
    } catch (erro) {
      console.error('Erro inesperado no login Google:', erro);
      alert('Erro inesperado ao iniciar login Google.');
    }
  }

  function instalar() {
    instalarCss();
    instalarDeepLinkListener();
    instalarLinkRecuperacaoSenha();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  setTimeout(instalar, 300);
  setTimeout(instalar, 1000);
  setTimeout(instalar, 2000);
})();
