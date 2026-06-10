/* FS Orçamentos - restaura anúncios AdSense na home pública simplificada. */
(function () {
  'use strict';

  function aplicar() {
    if (document.getElementById('fs-index-ads-restore-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-index-ads-restore-style';
    style.textContent = `
      body.fs-visitante-lite .bloco-anuncio,
      body.fs-visitante-lite .fs-adsense-zone,
      body.fs-visitante-lite ins.adsbygoogle {
        display: block !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
  else aplicar();
})();
