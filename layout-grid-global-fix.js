/* =========================================================
   FS ORÇAMENTOS - layout-grid-global-fix.js
   Padroniza blocos de resumo/métricas em grid 2 por linha.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-layout-grid-global-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-layout-grid-global-fix-style';
    style.textContent = `
      .cards-resumo,
      .clientes-resumo,
      .veiculos-resumo,
      .agenda-resumo-grid,
      .fs-ordens-dashboard-grid,
      .premium-metricas-grid,
      .painel-resumo-grid,
      .painel-metricas-grid,
      .dashboard-grid,
      .metricas-grid,
      .resumo-grid,
      .indicadores-grid,
      .financeiro-grid,
      .ordens-resumo-grid,
      .estoque-resumo-grid,
      .recorrentes-resumo-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
        align-items: stretch !important;
      }

      .cards-resumo > *,
      .clientes-resumo > *,
      .veiculos-resumo > *,
      .agenda-resumo-grid > *,
      .fs-ordens-dashboard-grid > *,
      .premium-metricas-grid > *,
      .painel-resumo-grid > *,
      .painel-metricas-grid > *,
      .dashboard-grid > *,
      .metricas-grid > *,
      .resumo-grid > *,
      .indicadores-grid > *,
      .financeiro-grid > *,
      .ordens-resumo-grid > *,
      .estoque-resumo-grid > *,
      .recorrentes-resumo-grid > * {
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      @media (max-width: 360px) {
        .cards-resumo,
        .clientes-resumo,
        .veiculos-resumo,
        .agenda-resumo-grid,
        .fs-ordens-dashboard-grid,
        .premium-metricas-grid,
        .painel-resumo-grid,
        .painel-metricas-grid,
        .dashboard-grid,
        .metricas-grid,
        .resumo-grid,
        .indicadores-grid,
        .financeiro-grid,
        .ordens-resumo-grid,
        .estoque-resumo-grid,
        .recorrentes-resumo-grid {
          gap: 8px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injetarEstilo);
  else injetarEstilo();
})();
