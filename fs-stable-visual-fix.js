/* =========================================================
   FS ORÇAMENTOS - comportamento final de sistema
   Responsabilidades:
   - pré-carregar listas principais;
   - abrir Nova OS/Novo agendamento em modal;
   - transformar linhas de listas em detalhe clicável.
   ========================================================= */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();

  function injetarEstilo() {
    if (document.getElementById('fs-stable-visual-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-stable-visual-fix-style';
    style.textContent = `
      body.fs-modal-form-lock { overflow: hidden !important; }

      body:not(.gerando-pdf) #card-form-ordem,
      body:not(.gerando-pdf) #card-form-agendamento,
      body:not(.gerando-pdf) .card-form-agendamento {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        margin: 0 0 8px !important;
      }

      body:not(.gerando-pdf) #card-form-ordem:not(.fs-modal-form-aberto) .ordens-card-body,
      body:not(.gerando-pdf) #card-form-agendamento:not(.fs-modal-form-aberto) .agenda-card-body,
      body:not(.gerando-pdf) .card-form-agendamento:not(.fs-modal-form-aberto) .agenda-card-body {
        display: none !important;
      }

      body:not(.gerando-pdf) #card-form-ordem > .ordens-card-header,
      body:not(.gerando-pdf) #card-form-agendamento > .agenda-card-header,
      body:not(.gerando-pdf) .card-form-agendamento > .agenda-card-header {
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 6px !important;
        background: transparent !important;
        border: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      body:not(.gerando-pdf) #card-form-ordem:not(.fs-modal-form-aberto) > .ordens-card-header > div,
      body:not(.gerando-pdf) #card-form-agendamento:not(.fs-modal-form-aberto) > .agenda-card-header > div,
      body:not(.gerando-pdf) .card-form-agendamento:not(.fs-modal-form-aberto) > .agenda-card-header > div,
      body:not(.gerando-pdf) #card-form-ordem:not(.fs-modal-form-aberto) .fs-modal-fechar,
      body:not(.gerando-pdf) #card-form-agendamento:not(.fs-modal-form-aberto) .fs-modal-fechar,
      body:not(.gerando-pdf) .card-form-agendamento:not(.fs-modal-form-aberto) .fs-modal-fechar {
        display: none !important;
      }

      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto {
        position: fixed !important;
        inset: 0 !important;
        z-index: 57000 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        padding: 14px !important;
        background: rgba(20, 13, 11, .62) !important;
        overflow-y: auto !important;
      }

      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto > .ordens-card-header,
      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto > .ordens-card-body,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto > .agenda-card-header,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto > .agenda-card-body,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto > .agenda-card-header,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto > .agenda-card-body {
        width: min(820px, 100%) !important;
        background: #ffffff !important;
        border-left: 1px solid var(--fs-borda, #ded3c5) !important;
        border-right: 1px solid var(--fs-borda, #ded3c5) !important;
      }

      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto > .ordens-card-header,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto > .agenda-card-header,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto > .agenda-card-header {
        margin-top: 16px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        padding: 11px 13px !important;
        background: #f8f4ee !important;
        border-top: 1px solid var(--fs-borda, #ded3c5) !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 7px 7px 0 0 !important;
        box-shadow: 0 12px 28px rgba(0,0,0,.16) !important;
      }

      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto > .ordens-card-body,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto > .agenda-card-body,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto > .agenda-card-body {
        display: block !important;
        padding: 13px !important;
        border-bottom: 1px solid var(--fs-borda, #ded3c5) !important;
        border-radius: 0 0 7px 7px !important;
        box-shadow: 0 18px 38px rgba(0,0,0,.18) !important;
      }

      body:not(.gerando-pdf) .fs-modal-fechar {
        width: 32px !important;
        height: 32px !important;
        border-radius: 4px !important;
        border: 1px solid #d6c8ba !important;
        background: #ffffff !important;
        color: #7f1d1d !important;
        font-size: 20px !important;
        font-weight: 900 !important;
        cursor: pointer !important;
      }

      body:not(.gerando-pdf) .cliente-item,
      body:not(.gerando-pdf) .veiculo-item,
      body:not(.gerando-pdf) .ordem-item,
      body:not(.gerando-pdf) .estoque-produto-bloco,
      body:not(.gerando-pdf) .estoque-item,
      body:not(.gerando-pdf) .agenda-item,
      body:not(.gerando-pdf) .forum-topico {
        cursor: pointer !important;
      }

      body:not(.gerando-pdf) .cliente-item .cliente-acoes,
      body:not(.gerando-pdf) .veiculo-item .veiculo-acoes,
      body:not(.gerando-pdf) .ordem-item .ordem-acoes,
      body:not(.gerando-pdf) .estoque-produto-bloco .estoque-produto-acoes,
      body:not(.gerando-pdf) .estoque-item .estoque-acoes,
      body:not(.gerando-pdf) .agenda-item .agenda-acoes,
      body:not(.gerando-pdf) .forum-topico .forum-topico-acoes {
        display: none !important;
      }

      .fs-item-modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 59000 !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: center !important;
        padding: 16px !important;
        background: rgba(20, 13, 11, .62) !important;
        overflow-y: auto !important;
      }

      .fs-item-modal-card {
        width: min(820px, 100%) !important;
        margin-top: 16px !important;
        background: #ffffff !important;
        color: var(--fs-texto, #2b211d) !important;
        border: 1px solid var(--fs-borda, #ded3c5) !important;
        border-radius: 7px !important;
        box-shadow: 0 18px 42px rgba(0,0,0,.22) !important;
        overflow: hidden !important;
      }

      .fs-item-modal-topo {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        gap: 10px !important;
        padding: 11px 13px !important;
        background: #f8f4ee !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      .fs-item-modal-topo strong {
        display: block !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 16px !important;
        line-height: 1.2 !important;
      }

      .fs-item-modal-topo span {
        display: block !important;
        color: var(--fs-texto-suave, #62554d) !important;
        font-size: 12px !important;
        margin-top: 3px !important;
      }

      .fs-item-modal-corpo {
        padding: 12px 13px !important;
      }

      .fs-item-modal-corpo .cliente-acoes,
      .fs-item-modal-corpo .veiculo-acoes,
      .fs-item-modal-corpo .ordem-acoes,
      .fs-item-modal-corpo .estoque-produto-acoes,
      .fs-item-modal-corpo .estoque-acoes,
      .fs-item-modal-corpo .agenda-acoes,
      .fs-item-modal-corpo .forum-topico-acoes {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin-top: 12px !important;
        padding-top: 10px !important;
        border-top: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      .fs-item-modal-corpo .btn,
      .fs-item-modal-corpo button,
      .fs-item-modal-corpo a[class*="btn"] {
        min-height: 31px !important;
        padding: 7px 10px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        box-shadow: none !important;
      }

      @media (max-width: 520px) {
        .fs-item-modal-overlay { padding: 10px !important; }
        .fs-item-modal-card { margin-top: 8px !important; }
        .fs-item-modal-corpo .cliente-acoes,
        .fs-item-modal-corpo .veiculo-acoes,
        .fs-item-modal-corpo .ordem-acoes,
        .fs-item-modal-corpo .estoque-produto-acoes,
        .fs-item-modal-corpo .agenda-acoes,
        .fs-item-modal-corpo .forum-topico-acoes {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function executarQuandoExistir(nomeFuncao, tentativas = 16) {
    let i = 0;
    const tentar = () => {
      i += 1;
      if (typeof window[nomeFuncao] === 'function') {
        try { window[nomeFuncao](true); } catch (_) { try { window[nomeFuncao](); } catch (e) {} }
        return;
      }
      if (i < tentativas) setTimeout(tentar, 180);
    };
    tentar();
  }

  function precargarListasRecentes() {
    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) executarQuandoExistir('carregarOrdens');
    if (path.endsWith('/veiculos') || path.endsWith('/veiculos.html')) executarQuandoExistir('carregarVeiculos');
    if (path.endsWith('/estoque') || path.endsWith('/estoque.html')) executarQuandoExistir('carregarProdutosEstoque');
  }

  function prepararModalPorCard(cfg) {
    const card = document.getElementById(cfg.cardId) || document.querySelector(cfg.cardSelector || '');
    if (!card || card.dataset.fsModalPadrao === '1') return;

    const header = card.querySelector(cfg.headerSelector);
    const body = card.querySelector(cfg.bodySelector);
    if (!header || !body) return;

    card.dataset.fsModalPadrao = '1';
    card.classList.add('fs-form-card-collapsed', 'form-fechado');
    card.setAttribute('aria-hidden', 'true');

    let botao = document.getElementById(cfg.toggleId);
    if (!botao) {
      botao = document.createElement('button');
      botao.type = 'button';
      botao.id = cfg.toggleId;
      header.appendChild(botao);
    }

    botao.textContent = cfg.botaoTexto;
    botao.setAttribute('aria-expanded', 'false');

    let fechar = header.querySelector('.fs-modal-fechar');
    if (!fechar) {
      fechar = document.createElement('button');
      fechar.type = 'button';
      fechar.className = 'fs-modal-fechar';
      fechar.innerHTML = '×';
      fechar.setAttribute('aria-label', 'Fechar');
      header.appendChild(fechar);
    }

    function abrir() {
      card.classList.add('fs-modal-form-aberto');
      card.classList.remove('fs-form-card-collapsed', 'form-fechado');
      card.setAttribute('aria-hidden', 'false');
      document.body.classList.add('fs-modal-form-lock');
      setTimeout(() => card.querySelector('input:not([type="hidden"]), select, textarea')?.focus(), 80);
    }

    function fecharModal() {
      card.classList.remove('fs-modal-form-aberto');
      card.classList.add('fs-form-card-collapsed', 'form-fechado');
      card.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fs-modal-form-lock');
      botao.setAttribute('aria-expanded', 'false');
    }

    botao.onclick = abrir;
    fechar.onclick = fecharModal;
    card.addEventListener('click', (event) => { if (event.target === card) fecharModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModal(); });

    const form = card.querySelector('form');
    if (form) {
      form.addEventListener('submit', () => {
        let tentativas = 0;
        const checar = () => {
          tentativas += 1;
          const msgErro = card.querySelector('.erro, .mensagem.erro, [class*="erro"]');
          const btnSalvar = card.querySelector('button[type="submit"], .btn-salvar, .btn-primary');
          const processando = !!btnSalvar?.disabled || normalizar(btnSalvar?.textContent).includes('salvando');
          const idPreenchido = !!card.querySelector('input[type="hidden"]')?.value;
          if (!processando && !msgErro && !idPreenchido) fecharModal();
          else if (tentativas < 14) setTimeout(checar, 250);
        };
        setTimeout(checar, 400);
      });
    }
  }

  function instalarModaisRestantes() {
    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) {
      prepararModalPorCard({
        cardId: 'card-form-ordem',
        headerSelector: '.ordens-card-header',
        bodySelector: '.ordens-card-body',
        toggleId: 'btn-toggle-form-ordem',
        botaoTexto: '+ Nova OS'
      });
    }

    if (path.endsWith('/agenda') || path.endsWith('/agenda.html')) {
      prepararModalPorCard({
        cardId: 'card-form-agendamento',
        cardSelector: '.agenda-card',
        headerSelector: '.agenda-card-header',
        bodySelector: '.agenda-card-body',
        toggleId: 'btn-toggle-form-agendamento',
        botaoTexto: '+ Novo agendamento'
      });
    }
  }

  function tituloDoItem(item) {
    return item.querySelector('h3, h2, strong, .titulo, [data-titulo]')?.textContent?.trim() || 'Detalhes do registro';
  }

  function subtituloDoItem(item) {
    const textos = Array.from(item.querySelectorAll('p, small, .tag, .status-badge'))
      .map(el => el.textContent.trim())
      .filter(Boolean);
    return textos.slice(0, 2).join(' • ') || 'Clique em uma ação abaixo para continuar.';
  }

  function fecharModalItem() {
    document.getElementById('fs-item-modal-overlay')?.remove();
    document.body.classList.remove('fs-modal-form-lock');
  }

  function abrirModalItem(item) {
    if (!item || item.classList.contains('estado-vazio')) return;

    const clone = item.cloneNode(true);
    clone.removeAttribute('onclick');
    clone.classList.add('fs-item-modal-clone');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('button, a').forEach(el => {
      el.addEventListener('click', () => setTimeout(fecharModalItem, 120));
    });

    const overlay = document.createElement('div');
    overlay.id = 'fs-item-modal-overlay';
    overlay.className = 'fs-item-modal-overlay';
    overlay.innerHTML = `
      <section class="fs-item-modal-card" role="dialog" aria-modal="true">
        <header class="fs-item-modal-topo">
          <div>
            <strong>${tituloDoItem(item)}</strong>
            <span>${subtituloDoItem(item)}</span>
          </div>
          <button type="button" class="fs-modal-fechar" aria-label="Fechar">×</button>
        </header>
        <div class="fs-item-modal-corpo"></div>
      </section>
    `;

    overlay.querySelector('.fs-item-modal-corpo').appendChild(clone);
    overlay.querySelector('.fs-modal-fechar').onclick = fecharModalItem;
    overlay.addEventListener('click', (event) => { if (event.target === overlay) fecharModalItem(); });
    document.body.appendChild(overlay);
    document.body.classList.add('fs-modal-form-lock');
  }

  function instalarModalDeItensDaLista() {
    const seletor = [
      '.cliente-item',
      '.veiculo-item',
      '.ordem-item',
      '.estoque-produto-bloco',
      '.estoque-item',
      '.agenda-item',
      '.forum-topico'
    ].join(',');

    document.querySelectorAll(seletor).forEach((item) => {
      if (item.dataset.fsLinhaClicavel === '1') return;
      if (item.closest('.fs-item-modal-corpo')) return;
      item.dataset.fsLinhaClicavel = '1';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('click', (event) => {
        if (event.target.closest('button, a, input, select, textarea, label')) return;
        abrirModalItem(item);
      });
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          abrirModalItem(item);
        }
      });
    });
  }

  function iniciar() {
    injetarEstilo();
    precargarListasRecentes();
    instalarModaisRestantes();
    instalarModalDeItensDaLista();
    setTimeout(() => { precargarListasRecentes(); instalarModaisRestantes(); instalarModalDeItensDaLista(); }, 600);
    setTimeout(() => { instalarModaisRestantes(); instalarModalDeItensDaLista(); }, 1600);
    setInterval(instalarModalDeItensDaLista, 2500);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fecharModalItem();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
