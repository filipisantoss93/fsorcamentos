/* FS Orçamentos - contraste do card da empresa no index */
(function () {
  'use strict';

  const STYLE_ID = 'fs-index-empresa-contrast-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body:not(.gerando-pdf) #fs-index-empresa-card,
      body:not(.gerando-pdf) .fs-index-empresa-card {
        background: linear-gradient(135deg, #3e2723, #2c1b17) !important;
        color: #fffaf0 !important;
        border-color: rgba(255, 196, 0, .35) !important;
      }

      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-info h1,
      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-info h2,
      body:not(.gerando-pdf) #fs-index-empresa-card #fs-index-empresa-nome,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-info h1,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-info h2,
      body:not(.gerando-pdf) .fs-index-empresa-card #fs-index-empresa-nome {
        color: #ffc400 !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-dados,
      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-dados span,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-dados,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-dados span {
        color: #fffaf0 !important;
        opacity: .96 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-logo,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-logo {
        background: #ffffff !important;
        color: #3e2723 !important;
        border-color: #ffc400 !important;
      }

      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-plano.premium,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-plano.premium {
        background: #18b26b !important;
        color: #ffffff !important;
        border-color: rgba(255,255,255,.35) !important;
      }

      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-plano.basico,
      body:not(.gerando-pdf) #fs-index-empresa-card .fs-index-empresa-plano.gratis,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-plano.basico,
      body:not(.gerando-pdf) .fs-index-empresa-card .fs-index-empresa-plano.gratis {
        background: #ffc400 !important;
        color: #3e2723 !important;
        border-color: #ffc400 !important;
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addStyle);
  else addStyle();

  window.addEventListener('load', addStyle);
  setTimeout(addStyle, 300);
  setTimeout(addStyle, 1200);
})();
