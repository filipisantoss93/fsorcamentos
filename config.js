/* =========================================================
   FS ORÇAMENTOS — config.js
   Configuração pública e helpers globais mínimos.

   Importante:
   - Este arquivo deve conter somente chave pública anon/publishable.
   - Nunca colocar service_role key no frontend.
   ========================================================= */

const SUPABASE_URL = 'https://kvjvhoziqcevkzyszdke.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-tw2F85KsudYX92fevBIQQ_VaWLx6Pl';
const FS_URL_OFICIAL = 'https://fsorcamentos.com.br';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.FS_URL_OFICIAL = FS_URL_OFICIAL;

(function fsConfigBase() {
  'use strict';

  function caminhoAtualLimpo() {
    return String(window.location.pathname || '/')
      .toLowerCase()
      .replace(/\/index\.html$/, '/')
      .replace(/\/$/, '') || '/';
  }

  function instalarCssGlobal() {
    const href = '/fs-theme-cinza.css?v=20260705-clean';
    const jaExiste = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(link => String(link.getAttribute('href') || '').includes('fs-theme-cinza.css'));

    if (jaExiste) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function carregarScriptUnico(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  function carregarCorrecaoLoginGoogle() {
    carregarScriptUnico('fs-login-google-fix-js', '/fs-login-google-fix.js?v=20260705-android-deeplink');
  }

  function limparDestinoAntigoNoIndex() {
    try {
      const path = caminhoAtualLimpo();
      const ehIndex = path === '/' || path === '/index';
      if (!ehIndex) return;

      const params = new URLSearchParams(window.location.search || '');
      const destinoUrl = String(params.get('dest') || '').trim();

      if (!destinoUrl) {
        localStorage.removeItem('fs_destino_apos_login');
        return;
      }

      const destinoPath = destinoUrl
        .split('?')[0]
        .split('#')[0]
        .replace(/\/$/, '')
        .toLowerCase();

      if (!destinoPath || destinoPath === '/' || destinoPath === '/index' || destinoPath === '/index.html') {
        localStorage.removeItem('fs_destino_apos_login');
      }
    } catch (_) {}
  }

  function bloquearZoomMobile() {
    try {
      const conteudoViewport = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';
      let viewport = document.querySelector('meta[name="viewport"]');

      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }

      viewport.setAttribute('content', conteudoViewport);

      if (!document.getElementById('fs-bloqueio-zoom-css')) {
        const style = document.createElement('style');
        style.id = 'fs-bloqueio-zoom-css';
        style.textContent = `
          html, body {
            touch-action: manipulation;
            -ms-touch-action: manipulation;
            overscroll-behavior-x: none;
          }
          input, select, textarea, button {
            font-size: 16px !important;
          }
        `;
        document.head.appendChild(style);
      }

      if (window.__fsZoomBloqueado === true) return;
      window.__fsZoomBloqueado = true;

      let ultimoToque = 0;

      document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
      document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
      document.addEventListener('gestureend', event => event.preventDefault(), { passive: false });

      document.addEventListener('touchstart', event => {
        if (event.touches && event.touches.length > 1) {
          event.preventDefault();
          return;
        }

        const agora = Date.now();
        if (agora - ultimoToque < 320) event.preventDefault();
        ultimoToque = agora;
      }, { passive: false });

      document.addEventListener('touchmove', event => {
        if (event.touches && event.touches.length > 1) event.preventDefault();
      }, { passive: false });

      document.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) event.preventDefault();
      }, { passive: false });

      document.addEventListener('keydown', event => {
        const tecla = String(event.key || '').toLowerCase();
        if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(tecla)) event.preventDefault();
      }, { passive: false });
    } catch (erro) {
      console.warn('Não foi possível aplicar bloqueio de zoom:', erro);
    }
  }

  function inicializar() {
    instalarCssGlobal();
    carregarCorrecaoLoginGoogle();
    limparDestinoAntigoNoIndex();
    bloquearZoomMobile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
