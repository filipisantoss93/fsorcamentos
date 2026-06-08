/* =========================================================
   FS ORÇAMENTOS - fs-no-zoom.js
   Bloqueia zoom manual em todas as páginas.
   - Ajusta meta viewport.
   - Bloqueia pinch/gesture no iOS.
   - Bloqueia duplo toque para zoom.
   - Bloqueia Ctrl/Command + roda/teclas de zoom em desktop.
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
      html, body {
        touch-action: manipulation;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }

      input, select, textarea, button {
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    aplicarMetaViewport();
    injetarEstilo();
    bloquearEventosZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
