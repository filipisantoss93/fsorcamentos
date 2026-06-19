/* FS Orçamentos - comportamento final estável de sistema */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();

  function injetarEstilo() {
    if (document.getElementById('fs-stable-visual-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-stable-visual-fix-style';
    style.textContent = `
      body:not(.gerando-pdf) .fs-sem-borda-amarela,
      body:not(.gerando-pdf) .card,
      body:not(.gerando-pdf) .clientes-card,
      body:not(.gerando-pdf) .veiculos-card,
      body:not(.gerando-pdf) .ordens-card,
      body:not(.gerando-pdf) .estoque-card,
      body:not(.gerando-pdf) .agenda-card,
      body:not(.gerando-pdf) .forum-card {
        border-top-color: var(--fs-borda, #ded3c5) !important;
      }

      body:not(.gerando-pdf) #card-form-ordem,
      body:not(.gerando-pdf) #card-form-agendamento,
      body:not(.gerando-pdf) .card-form-agendamento {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        margin: 0 0 10px !important;
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
        background: transparent !important;
        border: 0 !important;
        padding: 0 !important;
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
        margin-top: 18px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        padding: 12px 14px !important;
        border-top: 1px solid var(--fs-borda, #ded3c5) !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 7px 7px 0 0 !important;
        box-shadow: 0 12px 28px rgba(0,0,0,.16) !important;
      }

      body:not(.gerando-pdf) #card-form-ordem.fs-modal-form-aberto > .ordens-card-body,
      body:not(.gerando-pdf) #card-form-agendamento.fs-modal-form-aberto > .agenda-card-body,
      body:not(.gerando-pdf) .card-form-agendamento.fs-modal-form-aberto > .agenda-card-body {
        display: block !important;
        padding: 14px !important;
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

  function iniciar() {
    injetarEstilo();
    precargarListasRecentes();
    instalarModaisRestantes();
    setTimeout(() => { precargarListasRecentes(); instalarModaisRestantes(); }, 600);
    setTimeout(() => { instalarModaisRestantes(); }, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
