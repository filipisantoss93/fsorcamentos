/* FS Orcamentos - correcao visual estavel sem detector automatico */
(function () {
  'use strict';

  const STYLE_ID = 'fs-stable-visual-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --fs-marrom: #3e2723;
        --fs-amarelo: #ffc400;
        --fs-card: #ffffff;
        --fs-borda: #e8dccb;
        --fs-texto: #2f241f;
        --fs-texto-suave: #6d5b52;
      }

      body:not(.gerando-pdf) .fs-bg-escuro-auto {
        color: inherit !important;
      }

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
      }

      body:not(.gerando-pdf) .card-resumo h1,
      body:not(.gerando-pdf) .card-resumo h2,
      body:not(.gerando-pdf) .card-resumo h3,
      body:not(.gerando-pdf) .card-resumo strong,
      body:not(.gerando-pdf) .card-resumo b,
      body:not(.gerando-pdf) .card-resumo .valor-resumo,
      body:not(.gerando-pdf) .agenda-metrica h1,
      body:not(.gerando-pdf) .agenda-metrica h2,
      body:not(.gerando-pdf) .agenda-metrica h3,
      body:not(.gerando-pdf) .agenda-metrica strong,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) h1,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) h2,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) h3,
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
      body:not(.gerando-pdf) .home-premium-recurso-card strong,
      body:not(.gerando-pdf) .home-basico-recurso-card strong,
      body:not(.gerando-pdf) .home-premium-mini-linha strong,
      body:not(.gerando-pdf) .home-basico-mini-linha strong {
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
      body:not(.gerando-pdf) .home-metrica-card p,
      body:not(.gerando-pdf) .home-metrica-card span,
      body:not(.gerando-pdf) .home-metrica-card small,
      body:not(.gerando-pdf) .home-relatorio-card p,
      body:not(.gerando-pdf) .home-relatorio-card span,
      body:not(.gerando-pdf) .home-relatorio-card small,
      body:not(.gerando-pdf) .home-promo-card p,
      body:not(.gerando-pdf) .home-promo-card span,
      body:not(.gerando-pdf) .home-promo-card small,
      body:not(.gerando-pdf) .home-painel-card p,
      body:not(.gerando-pdf) .home-painel-card span,
      body:not(.gerando-pdf) .home-painel-card small,
      body:not(.gerando-pdf) .status-card p,
      body:not(.gerando-pdf) .status-card span,
      body:not(.gerando-pdf) .status-card small,
      body:not(.gerando-pdf) .cliente-item span,
      body:not(.gerando-pdf) .veiculo-item span,
      body:not(.gerando-pdf) .ordem-item span,
      body:not(.gerando-pdf) .estoque-item span,
      body:not(.gerando-pdf) .info-item span,
      body:not(.gerando-pdf) .texto-bloco,
      body:not(.gerando-pdf) .home-premium-recurso-card span,
      body:not(.gerando-pdf) .home-basico-recurso-card span,
      body:not(.gerando-pdf) .home-premium-mini-linha span,
      body:not(.gerando-pdf) .home-basico-mini-linha span {
        color: var(--fs-texto-suave) !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .resumo-header,
      body:not(.gerando-pdf) .card-header,
      body:not(.gerando-pdf) .clientes-card-header,
      body:not(.gerando-pdf) .veiculos-card-header,
      body:not(.gerando-pdf) .ordens-card-header,
      body:not(.gerando-pdf) .estoque-card-header,
      body:not(.gerando-pdf) .modal-busca-cliente-header,
      body:not(.gerando-pdf) .modal-busca-produto-header,
      body:not(.gerando-pdf) .modal-pix-topo,
      body:not(.gerando-pdf) .modal-notificacoes-topo,
      body:not(.gerando-pdf) .mini-dashboard,
      body:not(.gerando-pdf) .home-cliente-topo,
      body:not(.gerando-pdf) .mock-card-head,
      body:not(.gerando-pdf) .total-container,
      body:not(.gerando-pdf) .valor-total,
      body:not(.gerando-pdf) .total-itens-ordem-box,
      body:not(.gerando-pdf) .resumo-total-itens-ordem,
      body:not(.gerando-pdf) .os-total-box,
      body:not(.gerando-pdf) .card-total-os,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque,
      body:not(.gerando-pdf) .home-orcamento-whatsapp-header,
      body:not(.gerando-pdf) .orcamento-whatsapp-header,
      body:not(.gerando-pdf) .plano-pix-beneficios,
      body:not(.gerando-pdf) .home-preco-destaque,
      body:not(.gerando-pdf) .fs-visitante-preco {
        background: var(--fs-marrom) !important;
        color: #fffaf0 !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .resumo-header h1,
      body:not(.gerando-pdf) .resumo-header h2,
      body:not(.gerando-pdf) .resumo-header h3,
      body:not(.gerando-pdf) .resumo-header strong,
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

      body:not(.gerando-pdf) .resumo-header p,
      body:not(.gerando-pdf) .resumo-header span,
      body:not(.gerando-pdf) .resumo-header small,
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
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque span,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque small,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque p,
      body:not(.gerando-pdf) .plano-pix-beneficios span,
      body:not(.gerando-pdf) .plano-pix-beneficios p,
      body:not(.gerando-pdf) .plano-pix-beneficios small {
        color: #fffaf0 !important;
        opacity: 0.98 !important;
      }

      @media (max-width: 760px) {
        body:not(.gerando-pdf) .estoque-resumo,
        body:not(.gerando-pdf) .clientes-resumo,
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
