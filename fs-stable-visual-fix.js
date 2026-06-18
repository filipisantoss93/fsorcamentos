/* FS Orcamentos - camada visual final estavel e mais profissional */
(function () {
  'use strict';

  const STYLE_ID = 'fs-stable-visual-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --fs-marrom: #2f211d;
        --fs-marrom-2: #3e2723;
        --fs-amarelo: #ffc400;
        --fs-card: #ffffff;
        --fs-card-soft: #fffaf0;
        --fs-page-bg: #f5efe6;
        --fs-borda: #e3d6c6;
        --fs-borda-2: #d7c8b8;
        --fs-texto: #2b211d;
        --fs-texto-suave: #65554c;
        --fs-radius-sm: 5px;
        --fs-radius: 8px;
        --fs-shadow-soft: 0 4px 14px rgba(62,39,35,.08);
      }

      body:not(.gerando-pdf) {
        background: linear-gradient(180deg, #f8f4ee 0%, #f1e7da 100%) !important;
        color: var(--fs-texto) !important;
      }

      body:not(.gerando-pdf) .fs-bg-escuro-auto {
        color: inherit !important;
      }

      body:not(.gerando-pdf) .container,
      body:not(.gerando-pdf) .card,
      body:not(.gerando-pdf) .clientes-card,
      body:not(.gerando-pdf) .veiculos-card,
      body:not(.gerando-pdf) .ordens-card,
      body:not(.gerando-pdf) .estoque-card,
      body:not(.gerando-pdf) .painel-card,
      body:not(.gerando-pdf) .forum-card,
      body:not(.gerando-pdf) .card-resumo,
      body:not(.gerando-pdf) .agenda-metrica,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque),
      body:not(.gerando-pdf) .home-metrica-card,
      body:not(.gerando-pdf) .home-relatorio-card,
      body:not(.gerando-pdf) .home-promo-card,
      body:not(.gerando-pdf) .home-painel-card,
      body:not(.gerando-pdf) .status-card,
      body:not(.gerando-pdf) .cliente-item,
      body:not(.gerando-pdf) .veiculo-item,
      body:not(.gerando-pdf) .ordem-item,
      body:not(.gerando-pdf) .estoque-item,
      body:not(.gerando-pdf) .info-item,
      body:not(.gerando-pdf) .texto-bloco,
      body:not(.gerando-pdf) .home-premium-recurso-card,
      body:not(.gerando-pdf) .home-basico-recurso-card,
      body:not(.gerando-pdf) .home-premium-mini-linha,
      body:not(.gerando-pdf) .home-basico-mini-linha {
        background: #ffffff !important;
        color: var(--fs-texto) !important;
        border-color: var(--fs-borda) !important;
        box-shadow: var(--fs-shadow-soft) !important;
      }

      body:not(.gerando-pdf) .card-resumo,
      body:not(.gerando-pdf) .agenda-metrica,
      body:not(.gerando-pdf) .info-item,
      body:not(.gerando-pdf) .painel-os-card,
      body:not(.gerando-pdf) .cliente-item,
      body:not(.gerando-pdf) .veiculo-item,
      body:not(.gerando-pdf) .estoque-produto-bloco,
      body:not(.gerando-pdf) .forum-topico,
      body:not(.gerando-pdf) .forum-resposta {
        border-radius: 7px !important;
      }

      body:not(.gerando-pdf) .card-resumo h1,
      body:not(.gerando-pdf) .card-resumo h2,
      body:not(.gerando-pdf) .card-resumo h3,
      body:not(.gerando-pdf) .card-resumo strong,
      body:not(.gerando-pdf) .agenda-metrica strong,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) strong,
      body:not(.gerando-pdf) .home-metrica-card strong,
      body:not(.gerando-pdf) .home-relatorio-card strong,
      body:not(.gerando-pdf) .home-promo-card strong,
      body:not(.gerando-pdf) .home-painel-card strong,
      body:not(.gerando-pdf) .status-card strong,
      body:not(.gerando-pdf) .cliente-item strong,
      body:not(.gerando-pdf) .veiculo-item strong,
      body:not(.gerando-pdf) .ordem-item strong,
      body:not(.gerando-pdf) .estoque-item strong,
      body:not(.gerando-pdf) .info-item strong,
      body:not(.gerando-pdf) .forum-topico h3,
      body:not(.gerando-pdf) .forum-card h2,
      body:not(.gerando-pdf) .forum-card h3 {
        color: var(--fs-marrom) !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .card-resumo p,
      body:not(.gerando-pdf) .card-resumo span,
      body:not(.gerando-pdf) .card-resumo small,
      body:not(.gerando-pdf) .agenda-metrica p,
      body:not(.gerando-pdf) .agenda-metrica span,
      body:not(.gerando-pdf) .agenda-metrica small,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) p,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) span,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) small,
      body:not(.gerando-pdf) .cliente-item span,
      body:not(.gerando-pdf) .veiculo-item span,
      body:not(.gerando-pdf) .ordem-item span,
      body:not(.gerando-pdf) .estoque-item span,
      body:not(.gerando-pdf) .info-item span,
      body:not(.gerando-pdf) .texto-bloco,
      body:not(.gerando-pdf) .forum-card p,
      body:not(.gerando-pdf) .forum-topico p,
      body:not(.gerando-pdf) .forum-detalhe-info,
      body:not(.gerando-pdf) .forum-mini-item {
        color: var(--fs-texto-suave) !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      /* Cabeçalhos internos claros: mais cara de sistema, menos bloco pesado. */
      body:not(.gerando-pdf) .card-header,
      body:not(.gerando-pdf) .clientes-card-header,
      body:not(.gerando-pdf) .veiculos-card-header,
      body:not(.gerando-pdf) .ordens-card-header,
      body:not(.gerando-pdf) .estoque-card-header,
      body:not(.gerando-pdf) .forum-card-topo,
      body:not(.gerando-pdf) .modal-busca-cliente-header,
      body:not(.gerando-pdf) .modal-busca-produto-header,
      body:not(.gerando-pdf) .modal-notificacoes-topo {
        background: #fffaf0 !important;
        color: var(--fs-marrom) !important;
        border-color: var(--fs-borda) !important;
        border-top: 3px solid var(--fs-amarelo) !important;
        box-shadow: none !important;
      }

      body:not(.gerando-pdf) .card-header h1,
      body:not(.gerando-pdf) .card-header h2,
      body:not(.gerando-pdf) .card-header h3,
      body:not(.gerando-pdf) .card-header strong,
      body:not(.gerando-pdf) .clientes-card-header h1,
      body:not(.gerando-pdf) .clientes-card-header h2,
      body:not(.gerando-pdf) .clientes-card-header h3,
      body:not(.gerando-pdf) .clientes-card-header strong,
      body:not(.gerando-pdf) .veiculos-card-header h1,
      body:not(.gerando-pdf) .veiculos-card-header h2,
      body:not(.gerando-pdf) .veiculos-card-header h3,
      body:not(.gerando-pdf) .veiculos-card-header strong,
      body:not(.gerando-pdf) .ordens-card-header h1,
      body:not(.gerando-pdf) .ordens-card-header h2,
      body:not(.gerando-pdf) .ordens-card-header h3,
      body:not(.gerando-pdf) .ordens-card-header strong,
      body:not(.gerando-pdf) .estoque-card-header h1,
      body:not(.gerando-pdf) .estoque-card-header h2,
      body:not(.gerando-pdf) .estoque-card-header h3,
      body:not(.gerando-pdf) .estoque-card-header strong,
      body:not(.gerando-pdf) .forum-card-topo h2,
      body:not(.gerando-pdf) .forum-card-topo h3,
      body:not(.gerando-pdf) .modal-busca-cliente-header h3,
      body:not(.gerando-pdf) .modal-busca-produto-header h3 {
        color: var(--fs-marrom) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .card-header p,
      body:not(.gerando-pdf) .card-header span,
      body:not(.gerando-pdf) .card-header small,
      body:not(.gerando-pdf) .clientes-card-header p,
      body:not(.gerando-pdf) .clientes-card-header span,
      body:not(.gerando-pdf) .clientes-card-header small,
      body:not(.gerando-pdf) .veiculos-card-header p,
      body:not(.gerando-pdf) .veiculos-card-header span,
      body:not(.gerando-pdf) .veiculos-card-header small,
      body:not(.gerando-pdf) .ordens-card-header p,
      body:not(.gerando-pdf) .ordens-card-header span,
      body:not(.gerando-pdf) .ordens-card-header small,
      body:not(.gerando-pdf) .estoque-card-header p,
      body:not(.gerando-pdf) .estoque-card-header span,
      body:not(.gerando-pdf) .estoque-card-header small,
      body:not(.gerando-pdf) .forum-card-topo p,
      body:not(.gerando-pdf) .modal-busca-cliente-header p,
      body:not(.gerando-pdf) .modal-busca-produto-header p {
        color: var(--fs-texto-suave) !important;
        opacity: 1 !important;
      }

      /* Elementos que devem continuar escuros para destaque financeiro/status. */
      body:not(.gerando-pdf) .resumo-header,
      body:not(.gerando-pdf) .mini-dashboard,
      body:not(.gerando-pdf) .total-container,
      body:not(.gerando-pdf) .valor-total,
      body:not(.gerando-pdf) .total-itens-ordem-box,
      body:not(.gerando-pdf) .resumo-total-itens-ordem,
      body:not(.gerando-pdf) .os-total-box,
      body:not(.gerando-pdf) .card-total-os,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque,
      body:not(.gerando-pdf) .home-preco-destaque,
      body:not(.gerando-pdf) .fs-visitante-preco {
        background: var(--fs-marrom) !important;
        color: #fffaf0 !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .resumo-header strong,
      body:not(.gerando-pdf) .total-container strong,
      body:not(.gerando-pdf) .valor-total strong,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque strong,
      body:not(.gerando-pdf) .home-preco-destaque,
      body:not(.gerando-pdf) .home-preco-destaque *,
      body:not(.gerando-pdf) .fs-visitante-preco,
      body:not(.gerando-pdf) .fs-visitante-preco * {
        color: var(--fs-amarelo) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) input,
      body:not(.gerando-pdf) select,
      body:not(.gerando-pdf) textarea {
        border-radius: 5px !important;
        border-color: var(--fs-borda-2) !important;
        background: #ffffff !important;
        color: var(--fs-texto) !important;
      }

      body:not(.gerando-pdf) button,
      body:not(.gerando-pdf) .btn,
      body:not(.gerando-pdf) a[class*="btn"] {
        border-radius: 6px !important;
      }

      body:not(.gerando-pdf) .tag,
      body:not(.gerando-pdf) .forum-badge,
      body:not(.gerando-pdf) .plano-badge {
        border-radius: 5px !important;
      }

      @media (max-width: 760px) {
        body:not(.gerando-pdf) .estoque-resumo,
        body:not(.gerando-pdf) .clientes-resumo,
        body:not(.gerando-pdf) .veiculos-resumo,
        body:not(.gerando-pdf) .cards-resumo,
        body:not(.gerando-pdf) .agenda-resumo-grid,
        body:not(.gerando-pdf) .fs-ordens-dashboard-grid,
        body:not(.gerando-pdf) .status-home-grid,
        body:not(.gerando-pdf) .home-metricas-grid,
        body:not(.gerando-pdf) .home-resumo-grid,
        body:not(.gerando-pdf) .home-dashboard-grid,
        body:not(.gerando-pdf) .home-premium-recursos-grid,
        body:not(.gerando-pdf) .home-basico-recursos-grid,
        body:not(.gerando-pdf) .home-premium-mini-dashboard,
        body:not(.gerando-pdf) .home-basico-mini-dashboard {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
          align-items: stretch !important;
        }

        body:not(.gerando-pdf) .estoque-resumo > *,
        body:not(.gerando-pdf) .clientes-resumo > *,
        body:not(.gerando-pdf) .veiculos-resumo > *,
        body:not(.gerando-pdf) .cards-resumo > *,
        body:not(.gerando-pdf) .agenda-resumo-grid > *,
        body:not(.gerando-pdf) .fs-ordens-dashboard-grid > *,
        body:not(.gerando-pdf) .status-home-grid > *,
        body:not(.gerando-pdf) .home-metricas-grid > *,
        body:not(.gerando-pdf) .home-resumo-grid > *,
        body:not(.gerando-pdf) .home-dashboard-grid > *,
        body:not(.gerando-pdf) .home-premium-recursos-grid > *,
        body:not(.gerando-pdf) .home-basico-recursos-grid > * {
          min-width: 0 !important;
          width: auto !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function cleanupOldClass() {
    document.querySelectorAll('.fs-bg-escuro-auto').forEach((el) => el.classList.remove('fs-bg-escuro-auto'));
  }

  function apply() {
    cleanupOldClass();
    addStyle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();

  window.addEventListener('load', apply);
  setTimeout(apply, 200);
  setTimeout(apply, 1000);
})();