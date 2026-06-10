/* FS Orçamentos - correção visual específica da página planos */
(function () {
  'use strict';

  const STYLE_ID = 'fs-planos-visual-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo {
        background: linear-gradient(135deg, #3e2723, #2c1b17) !important;
        color: #fffaf0 !important;
        border: 2px solid #ffc400 !important;
      }

      body:not(.gerando-pdf) .pagina-planos .teste-premium-card h1,
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card h2,
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card h3,
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card strong,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo h1,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo h2,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo h3,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo strong {
        color: #ffc400 !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .pagina-planos .teste-premium-card p,
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card span,
      body:not(.gerando-pdf) .pagina-planos .teste-premium-card small,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo p,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo span,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo small {
        color: #fffaf0 !important;
        opacity: .98 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .pagina-planos .teste-premium-card small,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo small {
        color: #ffe58a !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-planos .btn-teste-premium,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo .btn-teste-premium {
        background: #ffc400 !important;
        color: #3e2723 !important;
        border: 2px solid #fffaf0 !important;
      }

      body:not(.gerando-pdf) .pagina-planos .btn-teste-premium *,
      body:not(.gerando-pdf) .teste-premium-card.teste-premium-topo .btn-teste-premium * {
        color: #3e2723 !important;
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
