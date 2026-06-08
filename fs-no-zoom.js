/* =========================================================
   FS ORÇAMENTOS - fs-no-zoom.js
   Bloqueia zoom manual e corrige área segura do topo.
   - Ajusta meta viewport.
   - Bloqueia pinch/gesture no iOS.
   - Bloqueia duplo toque para zoom.
   - Bloqueia Ctrl/Command + roda/teclas de zoom em desktop.
   - Garante que o header não fique embaixo do relógio/status bar.
   ========================================================= */
(function () {
  'use strict';

  function aplicarMetaViewport() {
    let meta = document.querySelector('meta[name="viewport"]');

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }

    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }

  function bloquearEventosZoom() {
    let ultimoToque = 0;

    document.addEventListener('touchstart', function (event) {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
        return false;
      }

      const agora = Date.now();
      if (agora - ultimoToque <= 320) {
        event.preventDefault();
        return false;
      }
      ultimoToque = agora;
    }, { passive: false });

    document.addEventListener('touchmove', function (event) {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
        return false;
      }
    }, { passive: false });

    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (nomeEvento) {
      document.addEventListener(nomeEvento, function (event) {
        event.preventDefault();
        return false;
      }, { passive: false });
    });

    document.addEventListener('wheel', function (event) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        return false;
      }
    }, { passive: false });

    document.addEventListener('keydown', function (event) {
      const tecla = String(event.key || '').toLowerCase();
      const comandoZoom = event.ctrlKey || event.metaKey;

      if (comandoZoom && ['+', '-', '=', '0'].includes(tecla)) {
        event.preventDefault();
        return false;
      }
    }, { passive: false });
  }

  function injetarEstilo() {
    if (document.getElementById('fs-no-zoom-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-no-zoom-style';
    style.textContent = `
      :root {
        --fs-safe-top: env(safe-area-inset-top, 0px);
        --fs-safe-left: env(safe-area-inset-left, 0px);
        --fs-safe-right: env(safe-area-inset-right, 0px);
        --fs-header-safe-extra: max(0px, env(safe-area-inset-top, 0px));
      }

      html, body {
        touch-action: manipulation;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }

      body {
        padding-left: max(10px, env(safe-area-inset-left, 0px)) !important;
        padding-right: max(10px, env(safe-area-inset-right, 0px)) !important;
      }

      input, select, textarea, button {
        font-size: 16px;
      }

      #header-container,
      .main-header {
        box-sizing: border-box;
        width: 100%;
        max-width: 100%;
      }

      .main-header {
        padding-top: max(10px, env(safe-area-inset-top, 0px)) !important;
        padding-left: max(10px, env(safe-area-inset-left, 0px)) !important;
        padding-right: max(10px, env(safe-area-inset-right, 0px)) !important;
        z-index: 9999 !important;
      }

      .main-header.is-fixed,
      .main-header.fixed,
      .main-header.sticky,
      header.main-header[style*="fixed"],
      header.main-header[style*="sticky"] {
        top: 0 !important;
      }

      .header-topo {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .header-usuario {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        min-width: 0;
      }

      .menu-mobile-btn,
      .btn-notificacoes-header {
        flex: 0 0 auto;
        min-width: 48px;
        min-height: 48px;
      }

      @media (max-width: 768px) {
        .main-header {
          padding-top: max(14px, env(safe-area-inset-top, 0px)) !important;
        }

        .header-topo {
          min-height: 68px;
        }

        .logo-nav {
          max-width: 44vw;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        #usuario-saudacao {
          max-width: 34vw;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function corrigirHeaderInline() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    header.style.paddingTop = 'max(14px, env(safe-area-inset-top, 0px))';
    header.style.paddingLeft = 'max(10px, env(safe-area-inset-left, 0px))';
    header.style.paddingRight = 'max(10px, env(safe-area-inset-right, 0px))';
    header.style.boxSizing = 'border-box';
    header.style.zIndex = '9999';
  }

  function iniciar() {
    aplicarMetaViewport();
    injetarEstilo();
    bloquearEventosZoom();
    corrigirHeaderInline();
    setTimeout(corrigirHeaderInline, 250);
    setTimeout(corrigirHeaderInline, 800);
    setTimeout(corrigirHeaderInline, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
