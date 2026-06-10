/* =========================================================
   FS ORÇAMENTOS - fs-dark-text-grid-fix.js
   Correção final para:
   - textos marrom/escuro dentro de fundo marrom;
   - cards de resumo em linha cheia no mobile, usando 2 por linha.

   Mantém funcionamento porque só altera classe/CSS visual.
   ========================================================= */
(function () {
  'use strict';

  const STYLE_ID = 'fs-dark-text-grid-fix-style';
  const DARK_CLASS = 'fs-bg-escuro-auto';

  function injetarEstilo() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* =====================================================
         BLOCO ESCURO DETECTADO AUTOMATICAMENTE
         ===================================================== */
      body:not(.gerando-pdf) .${DARK_CLASS} {
        color: #fffaf0 !important;
      }

      body:not(.gerando-pdf) .${DARK_CLASS} h1,
      body:not(.gerando-pdf) .${DARK_CLASS} h2,
      body:not(.gerando-pdf) .${DARK_CLASS} h3,
      body:not(.gerando-pdf) .${DARK_CLASS} h4,
      body:not(.gerando-pdf) .${DARK_CLASS} strong,
      body:not(.gerando-pdf) .${DARK_CLASS} b,
      body:not(.gerando-pdf) .${DARK_CLASS} .titulo,
      body:not(.gerando-pdf) .${DARK_CLASS} .valor,
      body:not(.gerando-pdf) .${DARK_CLASS} .valor-resumo,
      body:not(.gerando-pdf) .${DARK_CLASS} .home-preco-destaque,
      body:not(.gerando-pdf) .${DARK_CLASS} .fs-visitante-preco {
        color: #ffc400 !important;
        opacity: 1 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .${DARK_CLASS} p,
      body:not(.gerando-pdf) .${DARK_CLASS} span,
      body:not(.gerando-pdf) .${DARK_CLASS} small,
      body:not(.gerando-pdf) .${DARK_CLASS} label,
      body:not(.gerando-pdf) .${DARK_CLASS} li,
      body:not(.gerando-pdf) .${DARK_CLASS} em,
      body:not(.gerando-pdf) .${DARK_CLASS} div:not(.card-resumo):not(.agenda-metrica):not(.fs-ordens-dashboard-card):not(.info-item):not(.card-body):not(.clientes-card-body):not(.ordens-card-body):not(.estoque-card-body),
      body:not(.gerando-pdf) .${DARK_CLASS} .resumo-periodo-texto,
      body:not(.gerando-pdf) .${DARK_CLASS} .descricao,
      body:not(.gerando-pdf) .${DARK_CLASS} .subtitulo {
        color: #fffaf0 !important;
        opacity: 0.96 !important;
        text-shadow: none !important;
      }

      body:not(.gerando-pdf) .${DARK_CLASS} a:not(.btn):not(button),
      body:not(.gerando-pdf) .${DARK_CLASS} a:not(.btn):not(button) * {
        color: #ffc400 !important;
      }

      /* Botões dentro de fundo escuro continuam destacados */
      body:not(.gerando-pdf) .${DARK_CLASS} button:not(.btn-verde):not(.btn-whatsapp):not(.btn-perigo),
      body:not(.gerando-pdf) .${DARK_CLASS} .btn:not(.btn-verde):not(.btn-whatsapp):not(.btn-perigo),
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-toggle-resumo,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-abrir,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-home-atalho {
        background: #ffc400 !important;
        color: #3e2723 !important;
        border-color: #ffc400 !important;
      }

      body:not(.gerando-pdf) .${DARK_CLASS} button:not(.btn-verde):not(.btn-whatsapp):not(.btn-perigo) *,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn:not(.btn-verde):not(.btn-whatsapp):not(.btn-perigo) *,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-toggle-resumo *,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-abrir *,
      body:not(.gerando-pdf) .${DARK_CLASS} .btn-home-atalho * {
        color: #3e2723 !important;
      }

      /* Campos dentro de blocos escuros não podem herdar texto claro */
      body:not(.gerando-pdf) .${DARK_CLASS} input,
      body:not(.gerando-pdf) .${DARK_CLASS} select,
      body:not(.gerando-pdf) .${DARK_CLASS} textarea {
        background: #ffffff !important;
        color: #2f241f !important;
        border-color: #d8c9b8 !important;
      }

      body:not(.gerando-pdf) .${DARK_CLASS} input::placeholder,
      body:not(.gerando-pdf) .${DARK_CLASS} textarea::placeholder {
        color: #8a7a70 !important;
        opacity: 1 !important;
      }

      /* =====================================================
         CASOS CONHECIDOS DE FUNDO MARROM
         ===================================================== */
      body:not(.gerando-pdf) .resumo-header,
      body:not(.gerando-pdf) .card-header,
      body:not(.gerando-pdf) .clientes-card-header,
      body:not(.gerando-pdf) .veiculos-card-header,
      body:not(.gerando-pdf) .ordens-card-header,
      body:not(.gerando-pdf) .estoque-card-header,
      body:not(.gerando-pdf) .modal-busca-cliente-header,
      body:not(.gerando-pdf) .modal-busca-produto-header,
      body:not(.gerando-pdf) .mini-dashboard,
      body:not(.gerando-pdf) .home-cliente-topo,
      body:not(.gerando-pdf) .mock-card-head,
      body:not(.gerando-pdf) .total-container,
      body:not(.gerando-pdf) .valor-total,
      body:not(.gerando-pdf) .total-itens-ordem-box,
      body:not(.gerando-pdf) .resumo-total-itens-ordem,
      body:not(.gerando-pdf) .os-total-box,
      body:not(.gerando-pdf) .card-total-os,
      body:not(.gerando-pdf) .home-orcamento-whatsapp-header,
      body:not(.gerando-pdf) .orcamento-whatsapp-header {
        background: #3e2723 !important;
        color: #fffaf0 !important;
        border-color: #ffc400 !important;
      }

      body:not(.gerando-pdf) .resumo-header h1,
      body:not(.gerando-pdf) .resumo-header h2,
      body:not(.gerando-pdf) .resumo-header h3,
      body:not(.gerando-pdf) .resumo-header strong,
      body:not(.gerando-pdf) .resumo-header b,
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
      body:not(.gerando-pdf) .estoque-card-header strong {
        color: #ffc400 !important;
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
      body:not(.gerando-pdf) .estoque-card-header small {
        color: #fffaf0 !important;
        opacity: 0.96 !important;
      }

      /* Valor no comparativo/planos da home */
      body:not(.gerando-pdf) .home-preco-destaque,
      body:not(.gerando-pdf) .fs-visitante-preco,
      body:not(.gerando-pdf) .preco,
      body:not(.gerando-pdf) .plano-preco,
      body:not(.gerando-pdf) .valor-plano {
        background: #3e2723 !important;
        color: #ffc400 !important;
        border: 1px solid #ffc400 !important;
      }

      body:not(.gerando-pdf) .home-preco-destaque *,
      body:not(.gerando-pdf) .fs-visitante-preco *,
      body:not(.gerando-pdf) .preco *,
      body:not(.gerando-pdf) .plano-preco *,
      body:not(.gerando-pdf) .valor-plano * {
        color: #ffc400 !important;
      }

      /* =====================================================
         GRIDS: CARDS EM 2 POR LINHA NO MOBILE
         ===================================================== */
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
        body:not(.gerando-pdf) .home-basico-recursos-grid > *,
        body:not(.gerando-pdf) .home-premium-mini-dashboard > *,
        body:not(.gerando-pdf) .home-basico-mini-dashboard > * {
          min-width: 0 !important;
          width: auto !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }

        body:not(.gerando-pdf) .card-resumo,
        body:not(.gerando-pdf) .agenda-metrica,
        body:not(.gerando-pdf) .fs-ordens-dashboard-card,
        body:not(.gerando-pdf) .home-metrica-card,
        body:not(.gerando-pdf) .home-relatorio-card,
        body:not(.gerando-pdf) .home-promo-card,
        body:not(.gerando-pdf) .status-card,
        body:not(.gerando-pdf) .home-premium-recurso-card,
        body:not(.gerando-pdf) .home-basico-recurso-card {
          min-height: 104px !important;
          padding: 13px !important;
          border-radius: 16px !important;
        }

        body:not(.gerando-pdf) .card-resumo span,
        body:not(.gerando-pdf) .agenda-metrica span,
        body:not(.gerando-pdf) .fs-ordens-dashboard-card span,
        body:not(.gerando-pdf) .home-metrica-card span,
        body:not(.gerando-pdf) .home-relatorio-card span,
        body:not(.gerando-pdf) .status-card span {
          font-size: 11px !important;
          line-height: 1.25 !important;
          word-break: break-word !important;
        }

        body:not(.gerando-pdf) .card-resumo strong,
        body:not(.gerando-pdf) .agenda-metrica strong,
        body:not(.gerando-pdf) .fs-ordens-dashboard-card strong,
        body:not(.gerando-pdf) .home-metrica-card strong,
        body:not(.gerando-pdf) .home-relatorio-card strong,
        body:not(.gerando-pdf) .status-card strong,
        body:not(.gerando-pdf) .card-resumo .valor-resumo {
          font-size: clamp(20px, 6vw, 28px) !important;
          line-height: 1.08 !important;
          word-break: break-word !important;
        }
      }

      @media (max-width: 390px) {
        body:not(.gerando-pdf) .estoque-resumo,
        body:not(.gerando-pdf) .clientes-resumo,
        body:not(.gerando-pdf) .cards-resumo,
        body:not(.gerando-pdf) .agenda-resumo-grid,
        body:not(.gerando-pdf) .fs-ordens-dashboard-grid,
        body:not(.gerando-pdf) .status-home-grid,
        body:not(.gerando-pdf) .home-metricas-grid,
        body:not(.gerando-pdf) .home-resumo-grid,
        body:not(.gerando-pdf) .home-dashboard-grid {
          gap: 8px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function parseRgb(cor) {
    const match = String(cor || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3])
    };
  }

  function fundoEhEscuroOuMarrom(cor) {
    const rgb = parseRgb(cor);
    if (!rgb) return false;

    const luminancia = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    const marromEscuro = rgb.r >= 35 && rgb.r <= 95 && rgb.g >= 20 && rgb.g <= 70 && rgb.b >= 15 && rgb.b <= 65;
    const muitoEscuro = luminancia < 0.26;

    return marromEscuro || muitoEscuro;
  }

  function elementoPodeReceberClasse(el) {
    if (!el || !el.classList) return false;
    if (el.closest('body.gerando-pdf')) return false;
    if (el.matches('html, body, script, style, link, meta, input, textarea, select, option, img, svg, canvas, video')) return false;
    if (el.closest('#conteudo-pdf, #fs-pdf-render-area, .pdf-folha, .pdf-documento-a4')) return false;
    return true;
  }

  function marcarFundosEscuros() {
    if (!document.body || document.body.classList.contains('gerando-pdf')) return;

    const seletores = [
      '.resumo-header',
      '.card-header',
      '.clientes-card-header',
      '.veiculos-card-header',
      '.ordens-card-header',
      '.estoque-card-header',
      '.modal-busca-cliente-header',
      '.modal-busca-produto-header',
      '.mini-dashboard',
      '.home-cliente-topo',
      '.mock-card-head',
      '.total-container',
      '.valor-total',
      '.total-itens-ordem-box',
      '.resumo-total-itens-ordem',
      '.os-total-box',
      '.card-total-os',
      '.home-orcamento-whatsapp-header',
      '.orcamento-whatsapp-header',
      '.home-preco-destaque',
      '.fs-visitante-preco',
      '[class*="header"]',
      '[class*="topo"]',
      '[class*="dashboard"]',
      '[class*="total"]',
      '[class*="preco"]'
    ].join(',');

    document.querySelectorAll(seletores).forEach((el) => {
      if (!elementoPodeReceberClasse(el)) return;
      const estilo = window.getComputedStyle(el);
      if (fundoEhEscuroOuMarrom(estilo.backgroundColor)) {
        el.classList.add(DARK_CLASS);
      }
    });
  }

  function aplicar() {
    injetarEstilo();
    marcarFundosEscuros();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }

  window.addEventListener('load', aplicar);
  window.addEventListener('resize', aplicar);
  window.addEventListener('orientationchange', aplicar);

  setTimeout(aplicar, 120);
  setTimeout(aplicar, 500);
  setTimeout(aplicar, 1200);
  setTimeout(aplicar, 2500);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__fsDarkGridFixTimer);
    window.__fsDarkGridFixTimer = setTimeout(marcarFundosEscuros, 80);
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
})();
