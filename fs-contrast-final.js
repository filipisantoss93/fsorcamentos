/* =========================================================
   FS ORÇAMENTOS - fs-contrast-final.js
   Camada final de segurança visual.

   Objetivo:
   - Corrigir contraste texto/fundo sem reescrever páginas inteiras.
   - Ganhar prioridade sobre CSS inline antigo das páginas Premium.
   - Preservar funcionamento do dashboard, OS, clientes, estoque e PDF.
   ========================================================= */
(function () {
  'use strict';

  function injetarContrasteFinal() {
    if (document.getElementById('fs-contrast-final-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-contrast-final-style';
    style.textContent = `
      :root {
        --fs-marrom: #3e2723;
        --fs-marrom-2: #5d4037;
        --fs-amarelo: #ffc400;
        --fs-fundo: #f7f2ea;
        --fs-fundo-2: #efe3d2;
        --fs-card: #ffffff;
        --fs-creme: #fffaf0;
        --fs-borda: #e8dccb;
        --fs-texto: #2f241f;
        --fs-texto-suave: #6d5b52;
        --fs-verde: #25d366;
        --fs-verde-escuro: #083b2f;
        --fs-vermelho: #dc2626;
      }

      body:not(.gerando-pdf) {
        background:
          radial-gradient(circle at top left, rgba(255,196,0,0.14), transparent 32%),
          linear-gradient(180deg, var(--fs-fundo) 0%, var(--fs-fundo-2) 100%) !important;
        color: var(--fs-texto) !important;
      }

      /* Áreas claras: sempre texto escuro */
      body:not(.gerando-pdf) main,
      body:not(.gerando-pdf) section,
      body:not(.gerando-pdf) .container,
      body:not(.gerando-pdf) .card,
      body:not(.gerando-pdf) .card-body,
      body:not(.gerando-pdf) .clientes-card,
      body:not(.gerando-pdf) .clientes-card-body,
      body:not(.gerando-pdf) .veiculos-card,
      body:not(.gerando-pdf) .veiculos-card-body,
      body:not(.gerando-pdf) .ordens-card,
      body:not(.gerando-pdf) .ordens-card-body,
      body:not(.gerando-pdf) .estoque-card,
      body:not(.gerando-pdf) .estoque-card-body,
      body:not(.gerando-pdf) .info-item,
      body:not(.gerando-pdf) .texto-bloco,
      body:not(.gerando-pdf) .cliente-item,
      body:not(.gerando-pdf) .veiculo-item,
      body:not(.gerando-pdf) .ordem-item,
      body:not(.gerando-pdf) .estoque-item,
      body:not(.gerando-pdf) .plano-card,
      body:not(.gerando-pdf) .plano-pix-card,
      body:not(.gerando-pdf) .faq-card,
      body:not(.gerando-pdf) .manual-card,
      body:not(.gerando-pdf) .manual-section,
      body:not(.gerando-pdf) .manual-step,
      body:not(.gerando-pdf) .responsaveis-box,
      body:not(.gerando-pdf) .home-promo-card,
      body:not(.gerando-pdf) .home-metrica-card,
      body:not(.gerando-pdf) .home-relatorio-card,
      body:not(.gerando-pdf) .home-painel-card,
      body:not(.gerando-pdf) .fs-visitante-beneficio,
      body:not(.gerando-pdf) .fs-visitante-plano,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card:not(.destaque) {
        background-color: var(--fs-card) !important;
        color: var(--fs-texto) !important;
        border-color: var(--fs-borda) !important;
      }

      /* Heróis e seções de apresentação no tema claro */
      body:not(.gerando-pdf) .hero-publico,
      body:not(.gerando-pdf) .home-plano-hero,
      body:not(.gerando-pdf) .fs-visitante-hero,
      body:not(.gerando-pdf) .gerador-hero,
      body:not(.gerando-pdf) .planos-hero,
      body:not(.gerando-pdf) .clientes-hero,
      body:not(.gerando-pdf) .veiculos-hero,
      body:not(.gerando-pdf) .ordens-hero,
      body:not(.gerando-pdf) .ordem-hero,
      body:not(.gerando-pdf) .estoque-hero,
      body:not(.gerando-pdf) .sobre-hero,
      body:not(.gerando-pdf) .manual-hero,
      body:not(.gerando-pdf) .termos-hero,
      body:not(.gerando-pdf) .privacidade-hero,
      body:not(.gerando-pdf) .orcamentos-hero,
      body:not(.gerando-pdf) .painel-hero,
      body:not(.gerando-pdf) .secao-como-funciona,
      body:not(.gerando-pdf) .whatsapp-preview-home,
      body:not(.gerando-pdf) .cliente-aprovacao-home,
      body:not(.gerando-pdf) .comparativo-home,
      body:not(.gerando-pdf) .status-orcamentos-home,
      body:not(.gerando-pdf) .home-story-section,
      body:not(.gerando-pdf) .home-whatsapp-section,
      body:not(.gerando-pdf) .home-aprovacao-section,
      body:not(.gerando-pdf) .home-status-section,
      body:not(.gerando-pdf) .home-comparativo-section,
      body:not(.gerando-pdf) .home-premium-showcase,
      body:not(.gerando-pdf) .home-basico-showcase,
      body:not(.gerando-pdf) .planos-pix-section,
      body:not(.gerando-pdf) .comparativo-section,
      body:not(.gerando-pdf) .faq-section,
      body:not(.gerando-pdf) .container-sobre,
      body:not(.gerando-pdf) .container-termos,
      body:not(.gerando-pdf) .container-privacidade {
        background: linear-gradient(135deg, #ffffff 0%, var(--fs-creme) 100%) !important;
        color: var(--fs-texto) !important;
        border-top-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) h1,
      body:not(.gerando-pdf) h2,
      body:not(.gerando-pdf) h3,
      body:not(.gerando-pdf) h4,
      body:not(.gerando-pdf) label,
      body:not(.gerando-pdf) .campo label,
      body:not(.gerando-pdf) .subtitulo-form,
      body:not(.gerando-pdf) .info-item strong,
      body:not(.gerando-pdf) .card strong,
      body:not(.gerando-pdf) .cliente-item strong,
      body:not(.gerando-pdf) .veiculo-item strong,
      body:not(.gerando-pdf) .ordem-item strong,
      body:not(.gerando-pdf) .estoque-item strong,
      body:not(.gerando-pdf) .fs-visitante-beneficio strong,
      body:not(.gerando-pdf) .fs-visitante-plano strong {
        color: var(--fs-marrom) !important;
      }

      body:not(.gerando-pdf) p,
      body:not(.gerando-pdf) small,
      body:not(.gerando-pdf) .campo small,
      body:not(.gerando-pdf) .info-item span,
      body:not(.gerando-pdf) .texto-bloco,
      body:not(.gerando-pdf) .valor-linha span,
      body:not(.gerando-pdf) .card p,
      body:not(.gerando-pdf) .cliente-item span,
      body:not(.gerando-pdf) .veiculo-item span,
      body:not(.gerando-pdf) .ordem-item span,
      body:not(.gerando-pdf) .estoque-item span,
      body:not(.gerando-pdf) .fs-visitante-beneficio span,
      body:not(.gerando-pdf) .fs-visitante-plano span {
        color: var(--fs-texto-suave) !important;
      }

      /* Cabeçalhos escuros: nunca texto marrom em fundo marrom */
      body:not(.gerando-pdf) .card-header,
      body:not(.gerando-pdf) .clientes-card-header,
      body:not(.gerando-pdf) .veiculos-card-header,
      body:not(.gerando-pdf) .ordens-card-header,
      body:not(.gerando-pdf) .estoque-card-header,
      body:not(.gerando-pdf) .modal-busca-cliente-header,
      body:not(.gerando-pdf) .modal-busca-produto-header,
      body:not(.gerando-pdf) .modal-pix-topo,
      body:not(.gerando-pdf) .modal-notificacoes-topo,
      body:not(.gerando-pdf) .home-cliente-topo,
      body:not(.gerando-pdf) .mock-card-head,
      body:not(.gerando-pdf) .orcamento-whatsapp-header,
      body:not(.gerando-pdf) .home-orcamento-whatsapp-header,
      body:not(.gerando-pdf) .mini-dashboard,
      body:not(.gerando-pdf) .auth-logo-box,
      body:not(.gerando-pdf) .banner-topo,
      body:not(.gerando-pdf) th,
      body:not(.gerando-pdf) .tabela-comparativo th,
      body:not(.gerando-pdf) .home-tabela-comparativo th,
      body:not(.gerando-pdf) .manual-table th,
      body:not(.gerando-pdf) .comparativo th {
        background: var(--fs-marrom) !important;
        color: #fffaf0 !important;
        border-color: var(--fs-amarelo) !important;
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
      body:not(.gerando-pdf) .modal-busca-cliente-header h1,
      body:not(.gerando-pdf) .modal-busca-cliente-header h2,
      body:not(.gerando-pdf) .modal-busca-cliente-header h3,
      body:not(.gerando-pdf) .modal-busca-cliente-header strong,
      body:not(.gerando-pdf) .modal-busca-produto-header h1,
      body:not(.gerando-pdf) .modal-busca-produto-header h2,
      body:not(.gerando-pdf) .modal-busca-produto-header h3,
      body:not(.gerando-pdf) .modal-busca-produto-header strong,
      body:not(.gerando-pdf) .modal-pix-topo strong,
      body:not(.gerando-pdf) .modal-notificacoes-topo strong,
      body:not(.gerando-pdf) th,
      body:not(.gerando-pdf) .mini-dashboard h1,
      body:not(.gerando-pdf) .mini-dashboard h2,
      body:not(.gerando-pdf) .mini-dashboard h3 {
        color: var(--fs-amarelo) !important;
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
      body:not(.gerando-pdf) .modal-busca-cliente-header p,
      body:not(.gerando-pdf) .modal-busca-cliente-header span,
      body:not(.gerando-pdf) .modal-busca-cliente-header small,
      body:not(.gerando-pdf) .modal-busca-produto-header p,
      body:not(.gerando-pdf) .modal-busca-produto-header span,
      body:not(.gerando-pdf) .modal-busca-produto-header small,
      body:not(.gerando-pdf) .modal-pix-topo span,
      body:not(.gerando-pdf) .modal-pix-topo small,
      body:not(.gerando-pdf) .modal-notificacoes-topo span,
      body:not(.gerando-pdf) .modal-notificacoes-topo small,
      body:not(.gerando-pdf) .auth-logo-box p {
        color: #fffaf0 !important;
        opacity: 0.96 !important;
      }

      /* Totais e valores destacados */
      body:not(.gerando-pdf) .valor-total,
      body:not(.gerando-pdf) .total-container,
      body:not(.gerando-pdf) .total-itens-ordem-box,
      body:not(.gerando-pdf) .resumo-total-itens-ordem,
      body:not(.gerando-pdf) .os-total-box,
      body:not(.gerando-pdf) .card-total-os,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque {
        background: var(--fs-marrom) !important;
        color: var(--fs-amarelo) !important;
        border: 2px solid var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .valor-total *,
      body:not(.gerando-pdf) .total-container *,
      body:not(.gerando-pdf) .total-itens-ordem-box *,
      body:not(.gerando-pdf) .resumo-total-itens-ordem *,
      body:not(.gerando-pdf) .os-total-box *,
      body:not(.gerando-pdf) .card-total-os *,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque * {
        color: var(--fs-amarelo) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque span,
      body:not(.gerando-pdf) .fs-ordens-dashboard-card.destaque small {
        color: #fffaf0 !important;
      }

      /* Inputs sempre legíveis */
      body:not(.gerando-pdf) input,
      body:not(.gerando-pdf) select,
      body:not(.gerando-pdf) textarea {
        background: #ffffff !important;
        color: var(--fs-texto) !important;
        border-color: #d8c9b8 !important;
      }

      body:not(.gerando-pdf) input::placeholder,
      body:not(.gerando-pdf) textarea::placeholder {
        color: #8a7a70 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) input:focus,
      body:not(.gerando-pdf) select:focus,
      body:not(.gerando-pdf) textarea:focus {
        border-color: var(--fs-amarelo) !important;
        box-shadow: 0 0 0 4px rgba(255,196,0,0.20) !important;
        outline: none !important;
      }

      /* Botões principais padronizados */
      body:not(.gerando-pdf) .btn-primario:not(.btn-verde),
      body:not(.gerando-pdf) .btn-primary,
      body:not(.gerando-pdf) .btn-salvar,
      body:not(.gerando-pdf) .btn-add,
      body:not(.gerando-pdf) .btn-extra,
      body:not(.gerando-pdf) .btn-download,
      body:not(.gerando-pdf) .btn-acao-pdf,
      body:not(.gerando-pdf) .btn-gerar-orcamento-home,
      body:not(.gerando-pdf) .btn-home-grande,
      body:not(.gerando-pdf) .btn-home-medio,
      body:not(.gerando-pdf) .btn-secundario,
      body:not(.gerando-pdf) .btn-header-entrar,
      body:not(.gerando-pdf) .btn-menu-mobile-entrar,
      body:not(.gerando-pdf) .link-destaque-gerador,
      body:not(.gerando-pdf) .plano-pix-card button,
      body:not(.gerando-pdf) .fs-visitante-btn-principal {
        background: var(--fs-marrom) !important;
        color: var(--fs-amarelo) !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .btn-primario:not(.btn-verde):hover,
      body:not(.gerando-pdf) .btn-primary:hover,
      body:not(.gerando-pdf) .btn-salvar:hover,
      body:not(.gerando-pdf) .btn-add:hover,
      body:not(.gerando-pdf) .btn-extra:hover,
      body:not(.gerando-pdf) .btn-download:hover,
      body:not(.gerando-pdf) .btn-acao-pdf:hover,
      body:not(.gerando-pdf) .btn-gerar-orcamento-home:hover,
      body:not(.gerando-pdf) .btn-home-grande:hover,
      body:not(.gerando-pdf) .btn-home-medio:hover,
      body:not(.gerando-pdf) .btn-secundario:hover,
      body:not(.gerando-pdf) .btn-header-entrar:hover,
      body:not(.gerando-pdf) .btn-menu-mobile-entrar:hover,
      body:not(.gerando-pdf) .link-destaque-gerador:hover,
      body:not(.gerando-pdf) .plano-pix-card button:hover,
      body:not(.gerando-pdf) .fs-visitante-btn-principal:hover {
        background: var(--fs-amarelo) !important;
        color: var(--fs-marrom) !important;
        border-color: var(--fs-marrom) !important;
      }

      /* Botões verdes/WhatsApp */
      body:not(.gerando-pdf) .btn-whatsapp,
      body:not(.gerando-pdf) .btn-verde,
      body:not(.gerando-pdf) #btn-pdf-ordem {
        background: var(--fs-verde) !important;
        color: var(--fs-verde-escuro) !important;
        border-color: #128c4a !important;
      }

      body:not(.gerando-pdf) .btn-whatsapp:hover,
      body:not(.gerando-pdf) .btn-verde:hover,
      body:not(.gerando-pdf) #btn-pdf-ordem:hover {
        background: #20ba5a !important;
        color: #ffffff !important;
      }

      /* Botões perigosos */
      body:not(.gerando-pdf) .btn-perigo,
      body:not(.gerando-pdf) .btn-remove-logo {
        background: #fff1f1 !important;
        color: #991b1b !important;
        border: 2px solid var(--fs-vermelho) !important;
      }

      body:not(.gerando-pdf) .btn-perigo:hover,
      body:not(.gerando-pdf) .btn-remove-logo:hover {
        background: var(--fs-vermelho) !important;
        color: #ffffff !important;
      }

      /* Tags e status */
      body:not(.gerando-pdf) .tag,
      body:not(.gerando-pdf) .cliente-status,
      body:not(.gerando-pdf) .home-cliente-status,
      body:not(.gerando-pdf) .home-section-tag,
      body:not(.gerando-pdf) .home-plano-tag,
      body:not(.gerando-pdf) .tag-demo,
      body:not(.gerando-pdf) .tag-aprovacao,
      body:not(.gerando-pdf) .tag-status-home,
      body:not(.gerando-pdf) .tag-plano-pix,
      body:not(.gerando-pdf) .tag-premium-home,
      body:not(.gerando-pdf) .tag-basico-home {
        background: var(--fs-marrom) !important;
        color: var(--fs-amarelo) !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .tag.concluida,
      body:not(.gerando-pdf) .tag.pago,
      body:not(.gerando-pdf) .tag.aprovada {
        background: #dcfce7 !important;
        color: #166534 !important;
        border-color: #86efac !important;
      }

      body:not(.gerando-pdf) .tag.cancelada,
      body:not(.gerando-pdf) .tag.recusada {
        background: #fee2e2 !important;
        color: #991b1b !important;
        border-color: #fecaca !important;
      }

      body:not(.gerando-pdf) .tag.pendente,
      body:not(.gerando-pdf) .tag.aberta,
      body:not(.gerando-pdf) .tag.em_analise,
      body:not(.gerando-pdf) .tag.aguardando_aprovacao,
      body:not(.gerando-pdf) .tag.aguardando_material {
        background: #fff8e1 !important;
        color: #6b4200 !important;
        border-color: var(--fs-amarelo) !important;
      }

      /* Header/menu */
      body:not(.gerando-pdf) #header-container,
      body:not(.gerando-pdf) .main-header,
      body:not(.gerando-pdf) .header-topo,
      body:not(.gerando-pdf) .header-menu-linha,
      body:not(.gerando-pdf) .header-dropdown-menu {
        background: var(--fs-marrom) !important;
        color: #fffaf0 !important;
      }

      body:not(.gerando-pdf) .logo-nav,
      body:not(.gerando-pdf) .logo-nav span,
      body:not(.gerando-pdf) #usuario-saudacao,
      body:not(.gerando-pdf) .header-menu-linha a,
      body:not(.gerando-pdf) .nav-menu a,
      body:not(.gerando-pdf) .nav-dropdown summary,
      body:not(.gerando-pdf) .header-dropdown-toggle {
        color: #fffaf0 !important;
      }

      body:not(.gerando-pdf) .header-menu-linha a:hover,
      body:not(.gerando-pdf) .nav-menu a:hover,
      body:not(.gerando-pdf) .nav-dropdown summary:hover,
      body:not(.gerando-pdf) .nav-dropdown details[open] > summary,
      body:not(.gerando-pdf) .header-menu-linha a.ativo,
      body:not(.gerando-pdf) .nav-menu a.ativo {
        color: var(--fs-amarelo) !important;
      }

      /* Dropdown desktop claro */
      @media (min-width: 901px) {
        body:not(.gerando-pdf) .nav-dropdown-menu {
          background: #ffffff !important;
          color: var(--fs-marrom) !important;
          border-color: var(--fs-borda) !important;
          border-top-color: var(--fs-amarelo) !important;
        }

        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a {
          color: var(--fs-marrom) !important;
          background: transparent !important;
        }

        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a:hover,
        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a.ativo {
          background: #fff8e1 !important;
          color: var(--fs-marrom) !important;
        }
      }

      /* Dropdown mobile escuro */
      @media (max-width: 900px) {
        body:not(.gerando-pdf) .nav-dropdown-menu,
        body:not(.gerando-pdf) .nav-dropdown-menu-direita {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,196,0,0.35) !important;
        }

        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a {
          color: #fffaf0 !important;
          background: rgba(255,255,255,0.04) !important;
        }

        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a:hover,
        body:not(.gerando-pdf) .header-menu-linha .nav-dropdown-menu a.ativo {
          background: var(--fs-amarelo) !important;
          color: var(--fs-marrom) !important;
        }
      }

      /* Rodapé */
      body:not(.gerando-pdf) footer,
      body:not(.gerando-pdf) .sobre-footer {
        color: var(--fs-texto-suave) !important;
      }

      body:not(.gerando-pdf) footer a,
      body:not(.gerando-pdf) .sobre-footer a {
        color: var(--fs-marrom) !important;
        font-weight: 850 !important;
      }

      /* Splash: evita branco sobre fundo claro */
      body:not(.gerando-pdf) #splash-screen .fs-text,
      body:not(.gerando-pdf) #splash-screen p {
        color: var(--fs-marrom) !important;
      }

      body:not(.gerando-pdf) #splash-screen .fs-box {
        background: var(--fs-amarelo) !important;
        color: var(--fs-marrom) !important;
      }

      /* Não interferir no PDF renderizado */
      body.gerando-pdf,
      body.gerando-pdf * {
        color: inherit;
      }
    `;

    document.head.appendChild(style);
  }

  function aplicarClassesContextuais() {
    const path = (window.location.pathname || '').toLowerCase();

    if (path.endsWith('/ordem') || path.endsWith('/ordem.html')) {
      document.body.classList.add('pagina-ordem');
    }

    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) {
      document.body.classList.add('pagina-ordens');
    }

    if (path.endsWith('/clientes') || path.endsWith('/clientes.html')) {
      document.body.classList.add('pagina-clientes');
    }
  }

  function instalarRedirectSeguro() {
    if (window.__fsRedirectSeguroInstalado) return;

    const aplicar = () => {
      if (typeof window.fsRedirecionarAposLogin !== 'function') return false;

      window.fsRedirecionarAposLogin = function fsRedirecionarAposLoginSeguro() {
        let destino = '/index.html';

        try {
          destino = localStorage.getItem('fs_destino_apos_login') || '/index.html';
          localStorage.removeItem('fs_destino_apos_login');
        } catch (erro) {
          console.warn('Não foi possível ler destino após login:', erro);
        }

        if (!destino || typeof destino !== 'string') destino = '/index.html';

        // Segurança: evita redirects externos por manipulação de localStorage.
        if (!destino.startsWith('/')) destino = '/index.html';
        if (destino.startsWith('//')) destino = '/index.html';

        const atual = `${window.location.pathname || '/'}${window.location.search || ''}`;

        if (atual !== destino) {
          window.location.href = destino;
        }
      };

      window.__fsRedirectSeguroInstalado = true;
      return true;
    };

    if (aplicar()) return;

    let tentativas = 0;
    const timer = setInterval(() => {
      tentativas += 1;
      if (aplicar() || tentativas >= 80) {
        clearInterval(timer);
      }
    }, 50);
  }

  function aplicar() {
    injetarContrasteFinal();
    aplicarClassesContextuais();
    instalarRedirectSeguro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }

  setTimeout(aplicar, 300);
  setTimeout(aplicar, 1200);
})();
