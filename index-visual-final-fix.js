/* FS Orçamentos - correção final visual do index */
(function () {
  'use strict';

  const STYLE_ID = 'fs-index-visual-final-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Splash screen: fundo marrom com textos legíveis */
      body:not(.gerando-pdf) #splash-screen {
        background: #2c1b17 !important;
        color: #fffaf0 !important;
      }

      body:not(.gerando-pdf) #splash-screen .splash-content,
      body:not(.gerando-pdf) #splash-screen .splash-logo,
      body:not(.gerando-pdf) #splash-screen .fs-text,
      body:not(.gerando-pdf) #splash-screen p,
      body:not(.gerando-pdf) #splash-screen span:not(.fs-box) {
        color: #fffaf0 !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) #splash-screen .fs-box {
        background: #ffc400 !important;
        color: #3e2723 !important;
        border-color: #ffc400 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) #splash-screen .loader-bar {
        background: rgba(255,255,255,.24) !important;
      }

      body:not(.gerando-pdf) #splash-screen .loader-bar::after {
        background: #ffc400 !important;
      }

      /* Valores dos planos na home visitante */
      body:not(.gerando-pdf) .fs-visitante-home-lite .fs-visitante-preco,
      body:not(.gerando-pdf) .fs-visitante-comparativo-wrapper .fs-visitante-preco,
      body:not(.gerando-pdf) .fs-visitante-plano .fs-visitante-preco {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: fit-content !important;
        max-width: 100% !important;
        background: #3e2723 !important;
        color: #ffc400 !important;
        border: 1px solid #ffc400 !important;
        border-radius: 999px !important;
        padding: 6px 12px !important;
        font-weight: 950 !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .fs-visitante-home-lite .fs-visitante-preco *,
      body:not(.gerando-pdf) .fs-visitante-comparativo-wrapper .fs-visitante-preco *,
      body:not(.gerando-pdf) .fs-visitante-plano .fs-visitante-preco * {
        color: #ffc400 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .fs-visitante-plano strong {
        color: #3e2723 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .fs-visitante-plano > span:not(.fs-visitante-preco) {
        color: #6d5b52 !important;
        opacity: 1 !important;
      }

      /* Footer do index: mesmo padrão claro das demais páginas */
      body:not(.gerando-pdf) footer.fs-footer-index,
      body:not(.gerando-pdf) footer,
      body:not(.gerando-pdf) .sobre-footer {
        background: transparent !important;
        color: #6d5b52 !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      body:not(.gerando-pdf) footer.fs-footer-index {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px 10px !important;
        padding: 24px 14px 34px !important;
        text-align: center !important;
        font-weight: 800 !important;
      }

      body:not(.gerando-pdf) footer.fs-footer-index span,
      body:not(.gerando-pdf) footer.fs-footer-index .footer-separador {
        color: #6d5b52 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) footer.fs-footer-index a,
      body:not(.gerando-pdf) footer a,
      body:not(.gerando-pdf) .sobre-footer a {
        color: #3e2723 !important;
        opacity: 1 !important;
        text-decoration: none !important;
        font-weight: 950 !important;
      }

      body:not(.gerando-pdf) footer.fs-footer-index a:hover,
      body:not(.gerando-pdf) footer a:hover {
        text-decoration: underline !important;
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addStyle);
  else addStyle();

  window.addEventListener('load', addStyle);
  setTimeout(addStyle, 200);
  setTimeout(addStyle, 1000);
})();