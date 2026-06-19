/* =========================================================
   FS ORÇAMENTOS - gerador-cleanup-fix.js
   Correções finais da página gerador:
   - remove bloco redundante acima de "Dados da empresa";
   - remove opção amarela do seletor antigo;
   - garante opção rosa circular;
   - esconde campo visual de ID do cliente;
   - busca por Enter no modal de cliente;
   - inicializa blocos AdSense visíveis;
   - corrige layout quebrado no celular/tablet;
   - padroniza o JSON de itens salvo em orçamentos.itens;
   - aplica imagem visual de ferramenta profissional.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-gerador-cleanup-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-gerador-cleanup-fix-style';
    style.textContent = `
      #formulario-orcamento > .intro-form-gerador,
      .theme-dot.yellow {
        display: none !important;
      }

      .theme-dot.pink,
      .theme-dot.rosa {
        display: inline-flex !important;
        width: 24px !important;
        min-width: 24px !important;
        max-width: 24px !important;
        height: 24px !important;
        min-height: 24px !important;
        max-height: 24px !important;
        aspect-ratio: 1 / 1 !important;
        padding: 0 !important;
        background: #db2777 !important;
        border-color: #ffffff !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        line-height: 0 !important;
        font-size: 0 !important;
      }

      .cliente-id-acoes .campo-form:has(#orcamento-cliente-id),
      label[for="orcamento-cliente-id"],
      #orcamento-cliente-id {
        display: none !important;
      }

      .cliente-id-acoes {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
        align-items: stretch !important;
      }

      .cliente-id-acoes .btn-buscar-cliente-id,
      .cliente-id-acoes .btn-limpar-cliente-id {
        min-height: 34px !important;
        border-radius: 4px !important;
        padding: 7px 10px !important;
        box-shadow: none !important;
        font-size: 12px !important;
        font-weight: 950 !important;
      }

      .cliente-id-acoes .btn-buscar-cliente-id {
        background: #2f211d !important;
        color: #ffc400 !important;
        border: 1px solid #2f211d !important;
      }

      .cliente-id-acoes .btn-limpar-cliente-id {
        background: #ffffff !important;
        color: #2f211d !important;
        border: 1px solid #d7ccc8 !important;
      }

      html,
      body {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }

      body:not(.gerando-pdf) {
        background: linear-gradient(180deg, #f6f1ea 0%, #eee4d8 100%) !important;
        color: #2b211d !important;
      }

      #conteudo-gerador,
      .pagina-gerador,
      .gerador-layout,
      .gerador-card-principal,
      #formulario-orcamento,
      .emissor-readonly-card,
      .grid-duplo-gerador,
      #itens-lista,
      .calc-expansivel,
      .color-selector,
      #area-previa {
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      .pagina-gerador {
        max-width: 1180px !important;
        padding: 10px 10px 28px !important;
      }

      .gerador-hero {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 12px !important;
        align-items: center !important;
        background: #ffffff !important;
        color: #2b211d !important;
        border: 1px solid #e3d7ca !important;
        border-radius: 8px !important;
        border-top: 0 !important;
        padding: 12px 14px !important;
        margin: 0 0 10px !important;
        box-shadow: 0 4px 14px rgba(47,33,29,.07) !important;
        overflow: hidden !important;
      }

      .gerador-hero::before {
        display: none !important;
      }

      .gerador-hero-conteudo {
        max-width: none !important;
      }

      .gerador-tag {
        min-height: 24px !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        background: #f8f4ee !important;
        color: #3e2723 !important;
        border: 1px solid #e3d7ca !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        margin-bottom: 7px !important;
      }

      .gerador-hero h1 {
        color: #2f211d !important;
        margin: 0 !important;
        font-size: clamp(22px, 3vw, 30px) !important;
        line-height: 1.1 !important;
        font-weight: 950 !important;
        letter-spacing: -.01em !important;
      }

      .gerador-hero p {
        color: #62554d !important;
        margin: 5px 0 0 !important;
        font-size: 13px !important;
        line-height: 1.38 !important;
        font-weight: 720 !important;
        max-width: 760px !important;
      }

      .gerador-layout {
        gap: 10px !important;
        grid-template-columns: minmax(0, 1fr) 286px !important;
      }

      .gerador-card-principal,
      .sidebar-card,
      .emissor-readonly-card,
      .calc-expansivel,
      .color-selector,
      #itens-lista {
        background: #ffffff !important;
        color: #2b211d !important;
        border: 1px solid #e3d7ca !important;
        border-radius: 7px !important;
        border-left: 0 !important;
        border-top: 0 !important;
        box-shadow: 0 3px 10px rgba(47,33,29,.07) !important;
      }

      .gerador-card-principal {
        padding: 12px !important;
      }

      .sidebar-card {
        padding: 10px !important;
      }

      .sidebar-card h3 {
        margin: 0 0 5px !important;
        color: #2f211d !important;
        font-size: 14px !important;
        font-weight: 950 !important;
      }

      .sidebar-card p,
      .sidebar-lista li {
        color: #62554d !important;
        font-size: 11.5px !important;
        line-height: 1.32 !important;
        font-weight: 700 !important;
      }

      .sidebar-lista {
        gap: 5px !important;
        margin-top: 7px !important;
      }

      .sidebar-lista li {
        border-left: 0 !important;
        border: 1px solid #ebe2d7 !important;
        border-radius: 5px !important;
        padding: 7px !important;
        background: #fbf8f4 !important;
      }

      .emissor-readonly-card {
        padding: 10px !important;
        margin-bottom: 10px !important;
      }

      .emissor-readonly-topo {
        grid-template-columns: 76px minmax(0, 1fr) !important;
        gap: 10px !important;
        margin-bottom: 9px !important;
      }

      .emissor-logo-mini {
        width: 76px !important;
        height: 60px !important;
        border: 1px solid #d7ccc8 !important;
        border-radius: 5px !important;
        background: #f8f4ee !important;
      }

      .emissor-info-principal strong {
        color: #2f211d !important;
        font-size: 17px !important;
        line-height: 1.15 !important;
      }

      .emissor-info-principal span,
      .emissor-readonly-grid span,
      .campo-form label,
      .color-selector label,
      .header-labels {
        color: #62554d !important;
        font-size: 10.5px !important;
        line-height: 1.1 !important;
        font-weight: 950 !important;
        letter-spacing: .01em !important;
      }

      .emissor-info-principal small {
        color: #62554d !important;
        font-size: 11px !important;
      }

      .emissor-readonly-grid {
        gap: 7px !important;
      }

      .emissor-readonly-grid div {
        background: #fbf8f4 !important;
        border: 1px solid #ebe2d7 !important;
        border-left: 0 !important;
        border-radius: 5px !important;
        padding: 7px !important;
      }

      .emissor-readonly-grid strong {
        color: #2f211d !important;
        font-size: 12px !important;
      }

      .btn-editar-dados-empresa,
      .btn-add,
      .btn-extra,
      .btn-previa-profissional,
      .btn-novo-profissional,
      .btn-acao-orcamento,
      .btn-executar-busca-cliente {
        border-radius: 4px !important;
        box-shadow: none !important;
        text-transform: none !important;
        letter-spacing: 0 !important;
      }

      .btn-editar-dados-empresa,
      .btn-add,
      .btn-extra {
        min-height: 31px !important;
        padding: 7px 10px !important;
        background: #2f211d !important;
        color: #ffc400 !important;
        border: 1px solid #2f211d !important;
        font-size: 11.5px !important;
      }

      .dadositens {
        text-align: left !important;
        background: #f8f4ee !important;
        color: #2f211d !important;
        border: 1px solid #e3d7ca !important;
        border-left: 0 !important;
        border-bottom: 1px solid #e3d7ca !important;
        border-radius: 5px !important;
        box-shadow: none !important;
        padding: 8px 10px !important;
        margin: 12px 0 8px !important;
        font-size: 13px !important;
        font-weight: 950 !important;
      }

      .grid-duplo-gerador {
        gap: 7px !important;
      }

      .campo-form input,
      .campo-form textarea,
      .campo-form select,
      .item-row input,
      .extra-field input,
      .busca-cliente-linha input {
        min-height: 34px !important;
        padding: 7px 8px !important;
        border-radius: 4px !important;
        background: #ffffff !important;
        color: #2b211d !important;
        border: 1px solid #d7ccc8 !important;
        font-size: 12.5px !important;
        box-shadow: none !important;
      }

      .campo-form textarea {
        min-height: 78px !important;
      }

      #itens-lista {
        padding: 8px !important;
      }

      .item-row {
        gap: 6px !important;
        margin-bottom: 6px !important;
        align-items: end !important;
      }

      .btn-remove {
        min-height: 34px !important;
        border-radius: 4px !important;
        padding: 7px 9px !important;
        box-shadow: none !important;
      }

      .total-container {
        background: #2f211d !important;
        color: #ffc400 !important;
        border: 1px solid #2f211d !important;
        border-radius: 5px !important;
        padding: 10px 12px !important;
        margin-top: 10px !important;
        font-size: 18px !important;
        box-shadow: none !important;
      }

      .calc-header {
        background: #f8f4ee !important;
        color: #2f211d !important;
        padding: 9px 10px !important;
        font-size: 12px !important;
      }

      .calc-content {
        padding: 10px !important;
      }

      .color-selector {
        margin: 10px 0 !important;
        padding: 10px !important;
      }

      .theme-options {
        gap: 8px !important;
        align-items: center !important;
      }

      .theme-dot {
        display: inline-flex !important;
        width: 24px !important;
        min-width: 24px !important;
        max-width: 24px !important;
        height: 24px !important;
        min-height: 24px !important;
        max-height: 24px !important;
        aspect-ratio: 1 / 1 !important;
        padding: 0 !important;
        border-radius: 999px !important;
        border-width: 2px !important;
        box-shadow: none !important;
        overflow: hidden !important;
      }

      .acoes-gerador-principal {
        margin: 12px auto 10px !important;
        gap: 8px !important;
      }

      .btn-previa-profissional,
      .btn-novo-profissional {
        min-height: 38px !important;
        padding: 9px 10px !important;
        font-size: 13px !important;
        border-width: 1px !important;
      }

      .btn-previa-profissional {
        background: #2f211d !important;
        color: #ffc400 !important;
        border-color: #2f211d !important;
      }

      .btn-novo-profissional {
        background: #ffffff !important;
        color: #2f211d !important;
        border-color: #d7ccc8 !important;
      }

      #area-previa {
        background: #ffffff !important;
        border: 1px solid #e3d7ca !important;
        border-radius: 7px !important;
        padding: 10px !important;
        margin-top: 10px !important;
      }

      .acoes-profissionais-orcamento {
        background: #ffffff !important;
        color: #2b211d !important;
        border: 1px solid #e3d7ca !important;
        border-radius: 7px !important;
        box-shadow: 0 3px 10px rgba(47,33,29,.07) !important;
        padding: 10px !important;
      }

      .acoes-profissionais-orcamento-topo strong {
        color: #2f211d !important;
        font-size: 15px !important;
      }

      .acoes-profissionais-orcamento-topo span {
        color: #62554d !important;
        font-size: 12px !important;
      }

      .btn-acao-orcamento {
        min-height: 38px !important;
        padding: 9px 10px !important;
        font-size: 12px !important;
      }

      .modal-busca-cliente-box,
      .modal-content,
      .modal-login-box {
        border-radius: 7px !important;
        border-top: 0 !important;
        background: #ffffff !important;
      }

      .modal-busca-cliente-header,
      .modal-header {
        background: #f8f4ee !important;
        color: #2f211d !important;
        border-bottom: 1px solid #e3d7ca !important;
      }

      .modal-busca-cliente-header h3,
      .modal-busca-cliente-header p {
        color: #2f211d !important;
      }

      .cliente-busca-item {
        border-left: 0 !important;
        border-radius: 5px !important;
        padding: 9px !important;
        box-shadow: none !important;
      }

      @media (max-width: 1180px) {
        .pagina-gerador {
          width: 100% !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          overflow-x: hidden !important;
        }

        .gerador-layout {
          display: block !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
          overflow: visible !important;
        }

        .gerador-card-principal {
          width: 100% !important;
          margin: 0 !important;
          padding: 12px !important;
          overflow: visible !important;
        }

        .gerador-sidebar {
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin-top: 10px !important;
          display: grid !important;
          grid-template-columns: 1fr !important;
          overflow: visible !important;
        }

        .emissor-readonly-topo,
        .emissor-readonly-grid,
        .grid-duplo-gerador,
        .acoes-gerador-principal,
        .acoes-profissionais-botoes {
          display: grid !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
        }

        .cliente-id-acoes {
          display: grid !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
        }

        .item-row {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          width: 100% !important;
        }

        .item-row .desc-cell,
        .item-row .desc {
          grid-column: 1 / -1 !important;
        }

        .emissor-logo-mini {
          width: 100% !important;
        }
      }

      @media (max-width: 760px) {
        .pagina-gerador {
          padding: 8px 6px 22px !important;
        }

        .gerador-sidebar {
          display: none !important;
        }

        .gerador-hero {
          grid-template-columns: 1fr !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding: 10px !important;
        }

        .gerador-hero h1 {
          font-size: 22px !important;
        }

        .gerador-hero p {
          font-size: 12.5px !important;
        }

        #conteudo-pdf {
          width: 794px !important;
          max-width: 794px !important;
          transform-origin: top left !important;
        }

        #area-previa {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removerBlocoIntro() {
    document.querySelectorAll('#formulario-orcamento > .intro-form-gerador').forEach(el => el.remove());
  }

  function ocultarCampoIdClienteVisual() {
    const input = document.getElementById('orcamento-cliente-id');
    if (!input) return;
    const campo = input.closest('.campo-form');
    if (campo) campo.style.display = 'none';
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');

    const btnBuscar = document.querySelector('.btn-buscar-cliente-id');
    if (btnBuscar) btnBuscar.textContent = 'Buscar cliente';
  }

  function corrigirCoresPdf() {
    document.querySelectorAll('.theme-dot.yellow').forEach(el => el.remove());

    const container = document.querySelector('.theme-options');
    if (container && !container.querySelector('.theme-dot.pink, .theme-dot.rosa')) {
      const rosa = document.createElement('div');
      rosa.className = 'theme-dot pink';
      rosa.title = 'Rosa';
      rosa.setAttribute('role', 'button');
      rosa.setAttribute('aria-label', 'Tema rosa');
      rosa.addEventListener('click', () => {
        if (typeof window.setTheme === 'function') window.setTheme('pink');
        const hidden = document.getElementById('selected-theme');
        if (hidden) hidden.value = 'pink';
        try { localStorage.setItem('fs_tema_pdf', 'pink'); } catch (_) {}
        if (typeof window.autoUpdatePreview === 'function') window.autoUpdatePreview();
      });
      container.appendChild(rosa);
    }

    document.querySelectorAll('.theme-dot.pink, .theme-dot.rosa').forEach((el) => {
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.minWidth = '24px';
      el.style.maxWidth = '24px';
      el.style.minHeight = '24px';
      el.style.maxHeight = '24px';
      el.style.aspectRatio = '1 / 1';
      el.style.padding = '0';
      el.style.borderRadius = '999px';
      el.style.overflow = 'hidden';
      el.style.display = 'inline-flex';
    });

    const hidden = document.getElementById('selected-theme');
    if (hidden && String(hidden.value || '').toLowerCase() === 'yellow') {
      hidden.value = 'original';
    }
  }

  function instalarEnterBuscaCliente() {
    const campo = document.getElementById('campo-busca-cliente-orcamento');
    if (!campo || campo.dataset.fsEnterBusca === '1') return;
    campo.dataset.fsEnterBusca = '1';
    campo.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (typeof window.buscarClientesNoModalOrcamento === 'function') {
        window.buscarClientesNoModalOrcamento();
      }
    });
  }

  function inicializarAdsense() {
    if (!window.adsbygoogle) return;

    document.querySelectorAll('ins.adsbygoogle').forEach((ad) => {
      if (ad.dataset.fsAdsPushed === '1') return;
      const style = window.getComputedStyle(ad);
      const parentStyle = window.getComputedStyle(ad.parentElement || ad);
      if (style.display === 'none' || parentStyle.display === 'none') return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        ad.dataset.fsAdsPushed = '1';
      } catch (error) {
        console.warn('AdSense não inicializado neste bloco:', error);
      }
    });
  }

  function fsNumeroItem(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    const texto = String(valor || '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function instalarPadraoItensOrcamento() {
    if (window.__fsGeradorItensSchemaReal) return;

    window.fsColetarItensParaSalvar = function fsColetarItensParaSalvarSchemaReal() {
      const itens = [];

      document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach((row) => {
        const inputs = Array.from(row.querySelectorAll('input'));
        const descricao = String(row.querySelector('.desc-cell')?.value || row.querySelector('.desc')?.value || inputs[0]?.value || '').trim();
        const qtd = fsNumeroItem((row.querySelector('.qtd') || inputs[1])?.value || 0);
        const valor = fsNumeroItem((row.querySelector('.valor') || inputs[2])?.value || 0);
        const subtotalInformado = fsNumeroItem((row.querySelector('.subtotal') || inputs[3])?.value || 0);
        const subtotal = subtotalInformado || (qtd * valor);

        if (!descricao || qtd <= 0) return;

        itens.push({
          descricao,
          nome: descricao,
          qtd,
          quantidade: qtd,
          valor,
          valor_unitario: valor,
          subtotal,
          total: subtotal
        });
      });

      return itens;
    };

    window.__fsGeradorItensSchemaReal = true;
  }

  function iniciar() {
    injetarEstilo();
    removerBlocoIntro();
    ocultarCampoIdClienteVisual();
    corrigirCoresPdf();
    instalarEnterBuscaCliente();
    inicializarAdsense();
    instalarPadraoItensOrcamento();

    setTimeout(() => {
      removerBlocoIntro();
      ocultarCampoIdClienteVisual();
      corrigirCoresPdf();
      instalarEnterBuscaCliente();
      inicializarAdsense();
      instalarPadraoItensOrcamento();
    }, 500);

    setTimeout(() => {
      removerBlocoIntro();
      ocultarCampoIdClienteVisual();
      corrigirCoresPdf();
      instalarEnterBuscaCliente();
      inicializarAdsense();
      instalarPadraoItensOrcamento();
    }, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();