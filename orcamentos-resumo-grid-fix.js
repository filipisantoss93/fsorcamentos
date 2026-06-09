/* =========================================================
   FS ORÇAMENTOS - orcamentos-resumo-grid-fix.js
   Página orçamentos: resumo financeiro em grid 2 blocos por linha.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-orcamentos-resumo-grid-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-orcamentos-resumo-grid-fix-style';
    style.textContent = `
      body .resumo-financeiro .cards-resumo,
      body .cards-resumo {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 12px !important;
        align-items: stretch !important;
      }

      body .resumo-financeiro .card-resumo,
      body .cards-resumo .card-resumo {
        min-width: 0 !important;
        min-height: 108px !important;
        box-sizing: border-box !important;
        border-radius: 16px !important;
        padding: 14px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
      }

      body .resumo-financeiro .card-resumo strong,
      body .cards-resumo .card-resumo strong {
        font-size: 11px !important;
        line-height: 1.25 !important;
        word-break: break-word !important;
      }

      body .resumo-financeiro .card-resumo .valor-resumo,
      body .cards-resumo .card-resumo .valor-resumo {
        font-size: 20px !important;
        line-height: 1.12 !important;
        word-break: break-word !important;
      }

      body .resumo-financeiro .card-resumo small,
      body .cards-resumo .card-resumo small {
        line-height: 1.25 !important;
      }

      @media (max-width: 420px) {
        body .resumo-financeiro .cards-resumo,
        body .cards-resumo {
          gap: 9px !important;
        }

        body .resumo-financeiro .card-resumo,
        body .cards-resumo .card-resumo {
          min-height: 100px !important;
          padding: 12px 10px !important;
        }

        body .resumo-financeiro .card-resumo .valor-resumo,
        body .cards-resumo .card-resumo .valor-resumo {
          font-size: 18px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
