/* FS Orçamentos — compatibilidade global leve.
   Remove overrides inline antigos do gerador que ainda vinham em marrom. */
(function () {
  'use strict';

  function ehGerador() {
    const path = String(window.location.pathname || '').toLowerCase();
    return path.endsWith('/gerador.html') || path.endsWith('/gerador') || path === '/gerador.html';
  }

  function removerCssInlineAntigoGerador() {
    if (!ehGerador()) return;

    ['fs-formal-theme-overrides', 'fs-contrast-fix-final'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#07142f');

    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) statusBar.setAttribute('content', 'default');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removerCssInlineAntigoGerador);
  } else {
    removerCssInlineAntigoGerador();
  }
})();
