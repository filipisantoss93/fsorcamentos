/* =========================================================
   FS ORÇAMENTOS - agenda-grid-fix.js
   Ajusta os cards de resumo da agenda para 2 blocos por linha no mobile.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-agenda-grid-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-agenda-grid-fix-style';
    style.textContent = `
      .agenda-resumo-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
        align-items: stretch !important;
      }

      .agenda-resumo-grid .agenda-metrica {
        min-width: 0 !important;
        min-height: 104px !important;
        padding: 12px !important;
        border-radius: 15px !important;
      }

      .agenda-resumo-grid .agenda-metrica span {
        font-size: 10px !important;
        line-height: 1.25 !important;
        word-break: break-word !important;
      }

      .agenda-resumo-grid .agenda-metrica strong {
        font-size: 22px !important;
        line-height: 1.1 !important;
      }

      @media (max-width: 680px) {
        .agenda-resumo-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 9px !important;
        }

        .agenda-resumo-grid .agenda-metrica {
          padding: 11px !important;
          min-height: 96px !important;
        }
      }

      @media (max-width: 360px) {
        .agenda-resumo-grid .agenda-metrica {
          padding: 10px 9px !important;
        }

        .agenda-resumo-grid .agenda-metrica strong {
          font-size: 20px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injetarEstilo);
  } else {
    injetarEstilo();
  }
})();
