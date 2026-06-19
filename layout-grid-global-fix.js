/* =========================================================
   FS ORÇAMENTOS - layout-grid-global-fix.js
   Padroniza grids e formulários principais em modal.
   Visual neutro e compacto, sem bordas amarelas repetitivas.
   ========================================================= */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();

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
        gap: 8px !important;
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

      body.fs-modal-form-lock { overflow: hidden !important; }

      .clientes-grid,
      .veiculos-grid,
      .estoque-grid {
        grid-template-columns: 1fr !important;
      }

      #card-form-veiculo,
      #card-form-produto {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        margin: 0 0 8px !important;
      }

      #card-form-veiculo > .veiculos-card-header,
      #card-form-produto > .estoque-card-header {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 6px !important;
        background: transparent !important;
        border: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      #card-form-veiculo > .veiculos-card-header > div,
      #card-form-produto > .estoque-card-header > div,
      #card-form-veiculo .fs-modal-fechar,
      #card-form-produto .fs-modal-fechar {
        display: none !important;
      }

      #btn-toggle-form-veiculo,
      #btn-toggle-form-produto {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 122px !important;
        min-height: 34px !important;
        border-radius: 4px !important;
        border: 1px solid var(--fs-marrom, #2f211d) !important;
        background: var(--fs-marrom, #2f211d) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        box-shadow: none !important;
        padding: 7px 10px !important;
        cursor: pointer !important;
      }

      #btn-toggle-form-veiculo:hover,
      #btn-toggle-form-produto:hover {
        background: #ffffff !important;
        color: var(--fs-marrom, #2f211d) !important;
      }

      #card-form-veiculo:not(.fs-modal-form-aberto) .veiculos-card-body,
      #card-form-produto:not(.fs-modal-form-aberto) .estoque-card-body {
        display: none !important;
      }

      #card-form-veiculo.fs-modal-form-aberto,
      #card-form-produto.fs-modal-form-aberto,
      #forum-form-card.fs-modal-form-aberto {
        position: fixed !important;
        inset: 0 !important;
        z-index: 56000 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        padding: 14px !important;
        background: rgba(20, 13, 11, .62) !important;
        overflow-y: auto !important;
      }

      #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-header,
      #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-body,
      #card-form-produto.fs-modal-form-aberto > .estoque-card-header,
      #card-form-produto.fs-modal-form-aberto > .estoque-card-body,
      #forum-form-card.fs-modal-form-aberto > .forum-card-topo,
      #forum-form-card.fs-modal-form-aberto > .forum-form {
        width: min(780px, 100%) !important;
        margin-left: auto !important;
        margin-right: auto !important;
        background: #ffffff !important;
        color: var(--fs-texto, #2b211d) !important;
        border-left: 1px solid var(--fs-borda, #ded3c5) !important;
        border-right: 1px solid var(--fs-borda, #ded3c5) !important;
      }

      #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-header,
      #card-form-produto.fs-modal-form-aberto > .estoque-card-header,
      #forum-form-card.fs-modal-form-aberto > .forum-card-topo {
        margin-top: 18px !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 10px !important;
        padding: 11px 13px !important;
        background: #f8f4ee !important;
        border-top: 1px solid var(--fs-borda, #ded3c5) !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 7px 7px 0 0 !important;
        box-shadow: 0 12px 28px rgba(0,0,0,.16) !important;
      }

      #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-header > div,
      #card-form-produto.fs-modal-form-aberto > .estoque-card-header > div,
      #card-form-veiculo.fs-modal-form-aberto .fs-modal-fechar,
      #card-form-produto.fs-modal-form-aberto .fs-modal-fechar {
        display: block !important;
      }

      #card-form-veiculo.fs-modal-form-aberto #btn-toggle-form-veiculo,
      #card-form-produto.fs-modal-form-aberto #btn-toggle-form-produto {
        display: none !important;
      }

      #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-body,
      #card-form-produto.fs-modal-form-aberto > .estoque-card-body,
      #forum-form-card.fs-modal-form-aberto > .forum-form {
        display: grid !important;
        padding: 13px !important;
        border-bottom: 1px solid var(--fs-borda, #ded3c5) !important;
        border-radius: 0 0 7px 7px !important;
        box-shadow: 0 18px 38px rgba(0,0,0,.18) !important;
      }

      .fs-modal-fechar {
        width: 32px !important;
        height: 32px !important;
        border-radius: 4px !important;
        border: 1px solid #d6c8ba !important;
        background: #ffffff !important;
        color: #7f1d1d !important;
        font-size: 20px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        cursor: pointer !important;
      }

      #card-form-veiculo.fs-modal-form-aberto input,
      #card-form-veiculo.fs-modal-form-aberto select,
      #card-form-veiculo.fs-modal-form-aberto textarea,
      #card-form-produto.fs-modal-form-aberto input,
      #card-form-produto.fs-modal-form-aberto select,
      #card-form-produto.fs-modal-form-aberto textarea,
      #forum-form-card.fs-modal-form-aberto input,
      #forum-form-card.fs-modal-form-aberto select,
      #forum-form-card.fs-modal-form-aberto textarea {
        border-radius: 4px !important;
        padding: 8px 9px !important;
        font-size: 13px !important;
      }

      #forum-form-card:not(.fs-modal-form-aberto) {
        display: none !important;
      }

      @media (max-width: 680px) {
        #card-form-veiculo.fs-modal-form-aberto,
        #card-form-produto.fs-modal-form-aberto,
        #forum-form-card.fs-modal-form-aberto {
          padding: 10px !important;
        }

        #card-form-veiculo.fs-modal-form-aberto > .veiculos-card-header,
        #card-form-produto.fs-modal-form-aberto > .estoque-card-header,
        #forum-form-card.fs-modal-form-aberto > .forum-card-topo {
          margin-top: 8px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function modalConfigAtual() {
    if (path.endsWith('/veiculos') || path.endsWith('/veiculos.html')) {
      return {
        cardId: 'card-form-veiculo',
        headerSelector: '.veiculos-card-header',
        bodySelector: '.veiculos-card-body',
        toggleId: 'btn-toggle-form-veiculo',
        titleId: 'titulo-form-veiculo',
        saveId: 'btn-salvar-veiculo',
        editFn: 'editarVeiculo',
        clearFn: 'limparFormularioVeiculo',
        newText: '+ Novo veículo',
        titleNew: 'Novo veículo',
        saveNew: 'Salvar veículo'
      };
    }

    if (path.endsWith('/estoque') || path.endsWith('/estoque.html')) {
      return {
        cardId: 'card-form-produto',
        headerSelector: '.estoque-card-header',
        bodySelector: '.estoque-card-body',
        toggleId: 'btn-toggle-form-produto',
        titleId: 'titulo-form-produto',
        saveId: 'btn-salvar-produto',
        editFn: 'editarProdutoEstoque',
        clearFn: 'limparFormularioProdutoEstoque',
        newText: '+ Novo produto',
        titleNew: 'Novo produto',
        saveNew: 'Salvar produto'
      };
    }

    return null;
  }

  function abrirModalFormulario(cfg) {
    const card = document.getElementById(cfg.cardId);
    if (!card) return;
    card.classList.add('fs-modal-form-aberto');
    card.classList.remove('form-fechado', 'fs-form-card-collapsed');
    card.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fs-modal-form-lock');
    setTimeout(() => card.querySelector('input:not([type="hidden"]), select, textarea')?.focus(), 80);
  }

  function fecharModalFormulario(cfg) {
    const card = document.getElementById(cfg.cardId);
    if (!card) return;
    card.classList.remove('fs-modal-form-aberto');
    card.classList.add('form-fechado', 'fs-form-card-collapsed');
    card.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fs-modal-form-lock');
    const btn = document.getElementById(cfg.toggleId);
    if (btn) {
      btn.textContent = cfg.newText;
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function abrirNovoFormulario(cfg) {
    if (typeof window[cfg.clearFn] === 'function') window[cfg.clearFn]();
    const titulo = document.getElementById(cfg.titleId);
    const salvar = document.getElementById(cfg.saveId);
    if (titulo) titulo.textContent = cfg.titleNew;
    if (salvar) salvar.textContent = cfg.saveNew;
    abrirModalFormulario(cfg);
  }

  function configurarModalFormulario() {
    const cfg = modalConfigAtual();
    if (!cfg) return;

    const card = document.getElementById(cfg.cardId);
    const header = card?.querySelector(cfg.headerSelector);
    const body = card?.querySelector(cfg.bodySelector);
    if (!card || !header || !body) return;

    let btn = document.getElementById(cfg.toggleId);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = cfg.toggleId;
    }

    if (!header.querySelector('.fs-modal-fechar')) {
      const btnFechar = document.createElement('button');
      btnFechar.type = 'button';
      btnFechar.className = 'fs-modal-fechar';
      btnFechar.innerHTML = '×';
      btnFechar.setAttribute('aria-label', 'Fechar');
      btnFechar.onclick = () => fecharModalFormulario(cfg);
      header.appendChild(btnFechar);
    }

    if (!btn.parentNode) header.appendChild(btn);
    btn.textContent = cfg.newText;
    btn.setAttribute('aria-expanded', 'false');
    btn.onclick = () => abrirNovoFormulario(cfg);

    card.classList.add('form-fechado', 'fs-form-card-collapsed');
    card.setAttribute('aria-hidden', 'true');

    if (!card.dataset.fsModalEventos) {
      card.dataset.fsModalEventos = '1';
      card.addEventListener('click', (event) => {
        if (event.target === card) fecharModalFormulario(cfg);
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') fecharModalFormulario(cfg);
      });
    }

    if (typeof window[cfg.editFn] === 'function' && !window[cfg.editFn].__fsModalInterceptado) {
      const original = window[cfg.editFn];
      window[cfg.editFn] = function (...args) {
        original.apply(this, args);
        abrirModalFormulario(cfg);
      };
      window[cfg.editFn].__fsModalInterceptado = true;
    }
  }

  function configurarForumModal() {
    if (!path.endsWith('/forum') && !path.endsWith('/forum.html')) return;
    const card = document.getElementById('forum-form-card');
    if (!card) return;

    if (!card.querySelector('.fs-modal-fechar')) {
      const topo = card.querySelector('.forum-card-topo');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fs-modal-fechar';
      btn.innerHTML = '×';
      btn.setAttribute('aria-label', 'Fechar');
      btn.onclick = () => fecharForumModal();
      topo?.appendChild(btn);
    }

    function abrirForumModal() {
      card.classList.add('fs-modal-form-aberto');
      card.style.display = 'flex';
      card.setAttribute('aria-hidden', 'false');
      document.body.classList.add('fs-modal-form-lock');
      setTimeout(() => document.getElementById('forum-topico-titulo')?.focus(), 80);
    }

    function fecharForumModal() {
      card.classList.remove('fs-modal-form-aberto');
      card.style.display = 'none';
      card.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fs-modal-form-lock');
    }

    window.fsAbrirForumModal = abrirForumModal;
    window.fsFecharForumModal = fecharForumModal;
    window.forumMostrarFormularioNovoTopico = abrirForumModal;
    window.forumOcultarFormularioNovoTopico = fecharForumModal;
  }

  function iniciar() {
    injetarEstilo();
    configurarModalFormulario();
    configurarForumModal();
    setTimeout(() => { configurarModalFormulario(); configurarForumModal(); }, 300);
    setTimeout(() => { configurarModalFormulario(); configurarForumModal(); }, 1000);
    setTimeout(() => { configurarModalFormulario(); configurarForumModal(); }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();