/* =========================================================
   FS ORÇAMENTOS - comportamento final de sistema
   Responsabilidades:
   - pré-carregar listas principais com 20 registros recentes;
   - aplicar tabela compacta profissional nas listas;
   - abrir Nova OS/Novo agendamento em modal;
   - manter ações dentro do modal do item.
   ========================================================= */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();
  window.fsListasCompactasCache = window.fsListasCompactasCache || {};

  function esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

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

      .fs-tabela-lista-wrapper {
        width: 100% !important;
        overflow-x: auto !important;
        background: #ffffff !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 7px !important;
        box-shadow: 0 3px 10px rgba(47,33,29,.07) !important;
      }

      .fs-tabela-lista {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        background: #ffffff !important;
      }

      .fs-tabela-lista th,
      .fs-tabela-lista td {
        padding: 8px 9px !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        text-align: left !important;
        vertical-align: middle !important;
        color: var(--fs-texto, #2b211d) !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
        overflow-wrap: anywhere !important;
      }

      .fs-tabela-lista th {
        background: #f8f4ee !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 11px !important;
        text-transform: uppercase !important;
        font-weight: 950 !important;
      }

      .fs-tabela-lista tbody tr {
        cursor: pointer !important;
        background: #ffffff !important;
      }

      .fs-tabela-lista tbody tr:nth-child(even) { background: #fbf8f4 !important; }
      .fs-tabela-lista tbody tr:hover { background: #f8f4ee !important; }

      .fs-tabela-lista small {
        display: block !important;
        color: var(--fs-texto-suave, #62554d) !important;
        font-size: 10.5px !important;
        font-weight: 700 !important;
        line-height: 1.15 !important;
        margin-top: 2px !important;
      }

      .fs-tag-lista {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 3px !important;
        padding: 3px 6px !important;
        background: #f3eee7 !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }

      .fs-tag-lista.ativo,
      .fs-tag-lista.pago,
      .fs-tag-lista.concluido,
      .fs-tag-lista.concluida,
      .fs-tag-lista.confirmado {
        background: #ecfdf5 !important;
        color: #166534 !important;
        border-color: #bbf7d0 !important;
      }

      .fs-tag-lista.inativo,
      .fs-tag-lista.cancelado,
      .fs-tag-lista.cancelada {
        background: #fff5f5 !important;
        color: #b91c1c !important;
        border-color: #fecaca !important;
      }

      .fs-tag-lista.em_execucao,
      .fs-tag-lista.baixo,
      .fs-tag-lista.pendente,
      .fs-tag-lista.agendado {
        background: #fff7ed !important;
        color: #9a3412 !important;
        border-color: #fed7aa !important;
      }

      body:not(.gerando-pdf) .cliente-item,
      body:not(.gerando-pdf) .veiculo-item,
      body:not(.gerando-pdf) .ordem-item,
      body:not(.gerando-pdf) .estoque-produto-bloco,
      body:not(.gerando-pdf) .estoque-item,
      body:not(.gerando-pdf) .agenda-item,
      body:not(.gerando-pdf) .forum-topico { cursor: pointer !important; }

      body:not(.gerando-pdf) .cliente-item .cliente-acoes,
      body:not(.gerando-pdf) .veiculo-item .veiculo-acoes,
      body:not(.gerando-pdf) .ordem-item .ordem-acoes,
      body:not(.gerando-pdf) .estoque-produto-bloco .estoque-produto-acoes,
      body:not(.gerando-pdf) .estoque-item .estoque-acoes,
      body:not(.gerando-pdf) .agenda-item .agenda-acoes,
      body:not(.gerando-pdf) .forum-topico .forum-topico-acoes { display: none !important; }

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

      .fs-item-modal-topo strong { display: block !important; color: var(--fs-marrom, #2f211d) !important; font-size: 16px !important; line-height: 1.2 !important; }
      .fs-item-modal-topo span { display: block !important; color: var(--fs-texto-suave, #62554d) !important; font-size: 12px !important; margin-top: 3px !important; }
      .fs-item-modal-corpo { padding: 12px 13px !important; }

      .fs-item-modal-corpo .cliente-acoes,
      .fs-item-modal-corpo .veiculo-acoes,
      .fs-item-modal-corpo .ordem-acoes,
      .fs-item-modal-corpo .estoque-produto-acoes,
      .fs-item-modal-corpo .estoque-acoes,
      .fs-item-modal-corpo .agenda-acoes,
      .fs-item-modal-corpo .forum-topico-acoes,
      .fs-modal-acoes-geradas {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin-top: 12px !important;
        padding-top: 10px !important;
        border-top: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      .fs-item-modal-corpo .btn,
      .fs-item-modal-corpo button,
      .fs-item-modal-corpo a[class*="btn"],
      .fs-modal-acoes-geradas button,
      .fs-modal-acoes-geradas a {
        min-height: 31px !important;
        padding: 7px 10px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        box-shadow: none !important;
      }

      @media (max-width: 760px) {
        .fs-tabela-lista-wrapper { overflow-x: hidden !important; }
        .fs-tabela-lista { min-width: 0 !important; }
        .fs-tabela-lista th,
        .fs-tabela-lista td { padding: 6px 4px !important; font-size: 10.5px !important; line-height: 1.15 !important; }
        .fs-tabela-lista small { font-size: 9px !important; max-height: 20px !important; overflow: hidden !important; }
        .fs-tag-lista { padding: 2px 3px !important; font-size: 8.5px !important; }
        .fs-item-modal-overlay { padding: 10px !important; }
        .fs-item-modal-card { margin-top: 8px !important; }
        .fs-modal-acoes-geradas,
        .fs-item-modal-corpo .cliente-acoes,
        .fs-item-modal-corpo .veiculo-acoes,
        .fs-item-modal-corpo .ordem-acoes,
        .fs-item-modal-corpo .estoque-produto-acoes,
        .fs-item-modal-corpo .agenda-acoes,
        .fs-item-modal-corpo .forum-topico-acoes { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `;

    document.head.appendChild(style);
  }

  function executarQuandoExistir(nomeFuncao, argumento, tentativas = 24) {
    let i = 0;
    const tentar = () => {
      i += 1;
      if (typeof window[nomeFuncao] === 'function') {
        try {
          if (argumento !== undefined) window[nomeFuncao](argumento);
          else window[nomeFuncao]();
        } catch (_) {
          try { window[nomeFuncao](); } catch (e) {}
        }
        return;
      }
      if (i < tentativas) setTimeout(tentar, 180);
    };
    tentar();
  }

  function precargarListasRecentes() {
    if (path.endsWith('/clientes') || path.endsWith('/clientes.html')) executarQuandoExistir('carregarClientes');
    if (path.endsWith('/veiculos') || path.endsWith('/veiculos.html')) executarQuandoExistir('carregarVeiculos');
    if (path.endsWith('/estoque') || path.endsWith('/estoque.html')) executarQuandoExistir('carregarProdutosEstoque', true);
    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) executarQuandoExistir('carregarOrdens', true);
    if (path.endsWith('/agenda') || path.endsWith('/agenda.html')) executarQuandoExistir('carregarAgendaServicos');
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
  }

  function instalarModaisRestantes() {
    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) {
      prepararModalPorCard({ cardId: 'card-form-ordem', headerSelector: '.ordens-card-header', bodySelector: '.ordens-card-body', toggleId: 'btn-toggle-form-ordem', botaoTexto: '+ Nova OS' });
    }
    if (path.endsWith('/agenda') || path.endsWith('/agenda.html')) {
      prepararModalPorCard({ cardId: 'card-form-agendamento', cardSelector: '.agenda-card', headerSelector: '.agenda-card-header', bodySelector: '.agenda-card-body', toggleId: 'btn-toggle-form-agendamento', botaoTexto: '+ Novo agendamento' });
    }
  }

  function td(conteudo) { return `<td>${conteudo}</td>`; }
  function tag(texto, classe) { return `<span class="fs-tag-lista ${esc(classe || normalizar(texto).replace(/\s+/g, '_'))}">${esc(texto || '-')}</span>`; }

  function abrirModalRegistro(tipo, id) {
    const lista = window.fsListasCompactasCache[tipo] || [];
    const item = lista.find(reg => String(reg.id) === String(id));
    if (!item) return;

    const titulo = item.nome || item.titulo || item.placa || item.numero_os || item.nome_cliente || item.cliente_nome || item.nome_produto || 'Detalhes';
    const subtitulo = [item.whatsapp, item.email, item.status, item.categoria, item.data_servico, item.hora_inicio].filter(Boolean).slice(0, 3).join(' • ') || 'Ações disponíveis abaixo.';

    const overlay = document.createElement('div');
    overlay.id = 'fs-item-modal-overlay';
    overlay.className = 'fs-item-modal-overlay';

    const detalhes = Object.entries(item)
      .filter(([chave, valor]) => valor !== null && valor !== undefined && typeof valor !== 'object')
      .slice(0, 18)
      .map(([chave, valor]) => `<div class="fs-modal-dado"><strong>${esc(chave.replace(/_/g, ' '))}</strong><span>${esc(valor)}</span></div>`)
      .join('');

    overlay.innerHTML = `
      <section class="fs-item-modal-card" role="dialog" aria-modal="true">
        <header class="fs-item-modal-topo">
          <div><strong>${esc(titulo)}</strong><span>${esc(subtitulo)}</span></div>
          <button type="button" class="fs-modal-fechar" aria-label="Fechar">×</button>
        </header>
        <div class="fs-item-modal-corpo">
          <div class="modal-resumo-grid">${detalhes}</div>
          <div class="fs-modal-acoes-geradas">${acoesModal(tipo, id, item)}</div>
        </div>
      </section>`;

    overlay.querySelector('.fs-modal-fechar').onclick = fecharModalItem;
    overlay.addEventListener('click', event => { if (event.target === overlay) fecharModalItem(); });
    document.body.appendChild(overlay);
    document.body.classList.add('fs-modal-form-lock');
  }

  function acoesModal(tipo, id, item) {
    const idEsc = esc(id);
    if (tipo === 'clientes') {
      return `
        <button type="button" onclick="editarCliente('${idEsc}')">Editar</button>
        <button type="button" onclick="copiarIdCliente('${idEsc}')">Copiar ID</button>
        <button type="button" onclick="abrirWhatsAppCliente('${idEsc}')">WhatsApp</button>
        <button type="button" onclick="criarOrcamentoCliente('${idEsc}')">Novo orçamento</button>
        <button type="button" onclick="criarOSCliente('${idEsc}')">Nova OS</button>
        <button type="button" onclick="excluirCliente('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'veiculos') {
      return `
        <button type="button" onclick="editarVeiculo('${idEsc}')">Editar</button>
        <button type="button" onclick="novoOrcamentoComVeiculo('${idEsc}')">Novo orçamento</button>
        <button type="button" onclick="novaOSComVeiculo('${idEsc}')">Nova OS</button>
        <button type="button" onclick="inativarVeiculo('${idEsc}')">${item.ativo === false ? 'Ativar' : 'Inativar'}</button>
        <button type="button" onclick="excluirVeiculo('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'estoque') {
      return `
        <button type="button" onclick="editarProdutoEstoque('${idEsc}')">Editar</button>
        <button type="button" onclick="abrirModalMovimentacaoEstoque('${idEsc}', 'entrada')">Entrada</button>
        <button type="button" onclick="abrirModalMovimentacaoEstoque('${idEsc}', 'saida')">Saída</button>
        <button type="button" onclick="excluirProdutoEstoque('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'agenda') {
      return `
        <button type="button" onclick="editarAgendamento('${idEsc}')">Editar</button>
        <button type="button" onclick="marcarAgendaComoConcluida('${idEsc}')">Concluir</button>
        <button type="button" onclick="cancelarAgendamento('${idEsc}')">Cancelar</button>
        <button type="button" onclick="excluirAgendamento('${idEsc}')">Excluir</button>`;
    }
    return `<button type="button" onclick="fecharModalItem()">Fechar</button>`;
  }

  function fecharModalItem() {
    document.getElementById('fs-item-modal-overlay')?.remove();
    document.body.classList.remove('fs-modal-form-lock');
  }

  function tabela(containerId, tipo, cabecalhos, linhas) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!linhas.length) {
      container.innerHTML = '<div class="estado-vazio"><strong>Nenhum registro encontrado</strong><p>A página carrega automaticamente os 20 registros mais recentes.</p></div>';
      return;
    }
    container.innerHTML = `<div class="fs-tabela-lista-wrapper"><table class="fs-tabela-lista"><thead><tr>${cabecalhos.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody></table></div>`;
  }

  function instalarRenderizadoresCompactos() {
    if (typeof window.renderizarClientes === 'function' && !window.renderizarClientes.__fsCompacta) {
      window.renderizarClientes = function (lista) {
        window.fsListasCompactasCache.clientes = Array.isArray(lista) ? lista : [];
        tabela('lista-clientes', 'clientes', ['ID', 'Cliente', 'Contato', 'Cidade', 'Status'], window.fsListasCompactasCache.clientes.map(c => `
          <tr onclick="fsAbrirModalRegistro('clientes','${esc(c.id)}')">
            ${td(`<strong>${esc(typeof obterCodigoClienteVisivel === 'function' ? obterCodigoClienteVisivel(c) : c.numero_cliente || '')}</strong>`)}
            ${td(`${esc(c.nome || 'Sem nome')}<small>${esc(c.tipo_cliente || '')}</small>`)}
            ${td(`${esc(c.whatsapp || '-')}<small>${esc(c.email || '')}</small>`)}
            ${td(`${esc([c.cidade, c.estado].filter(Boolean).join(' / ') || '-')}`)}
            ${td(`${tag(c.status || 'ativo', c.status || 'ativo')}`)}
          </tr>`));
      };
      window.renderizarClientes.__fsCompacta = true;
    }

    if (typeof window.renderizarVeiculos === 'function' && !window.renderizarVeiculos.__fsCompacta) {
      window.renderizarVeiculos = function (lista) {
        window.fsListasCompactasCache.veiculos = Array.isArray(lista) ? lista : [];
        tabela('lista-veiculos', 'veiculos', ['Placa', 'Veículo', 'Cliente', 'Ano', 'Status'], window.fsListasCompactasCache.veiculos.map(v => `
          <tr onclick="fsAbrirModalRegistro('veiculos','${esc(v.id)}')">
            ${td(`<strong>${esc(v.placa || '-')}</strong>`)}
            ${td(`${esc([v.marca, v.modelo].filter(Boolean).join(' ') || '-') }<small>${esc([v.cor, v.prisma].filter(Boolean).join(' • '))}</small>`)}
            ${td(`${esc(v.cliente_nome || 'Sem cliente')}<small>${esc(v.cliente_whatsapp || '')}</small>`)}
            ${td(esc(v.ano || '-'))}
            ${td(tag(v.ativo === false ? 'Inativo' : 'Ativo', v.ativo === false ? 'inativo' : 'ativo'))}
          </tr>`));
      };
      window.renderizarVeiculos.__fsCompacta = true;
    }

    if (typeof window.renderizarProdutosEstoque === 'function' && !window.renderizarProdutosEstoque.__fsCompacta) {
      window.renderizarProdutosEstoque = function (lista) {
        window.fsListasCompactasCache.estoque = Array.isArray(lista) ? lista : [];
        tabela('lista-produtos-estoque', 'estoque', ['Produto', 'Categoria', 'Aplicação', 'Qtd', 'Venda'], window.fsListasCompactasCache.estoque.map(p => `
          <tr onclick="fsAbrirModalRegistro('estoque','${esc(p.id)}')">
            ${td(`<strong>${esc(p.nome || 'Produto')}</strong><small>${esc(p.codigo || p.codigo_original || p.codigo_fabricante || '')}</small>`)}
            ${td(`${esc(p.categoria || '-')}<small>${esc(p.subcategoria || '')}</small>`)}
            ${td(`${esc([p.marca_veiculo, p.modelo_veiculo].filter(Boolean).join(' ') || (p.produto_universal ? 'Universal' : '-'))}<small>${esc(p.aplicacao || '')}</small>`)}
            ${td(`<strong>${esc(p.quantidade_atual ?? 0)}</strong><small>mín. ${esc(p.estoque_minimo ?? 0)}</small>`)}
            ${td(`<strong>${moeda(p.valor_venda || 0)}</strong>`)}
          </tr>`));
      };
      window.renderizarProdutosEstoque.__fsCompacta = true;
    }

    if (typeof window.renderizarAgenda === 'function' && !window.renderizarAgenda.__fsCompacta) {
      window.renderizarAgenda = function (lista) {
        window.fsListasCompactasCache.agenda = Array.isArray(lista) ? lista : [];
        tabela('lista-agenda', 'agenda', ['Data', 'Serviço', 'Cliente', 'Veículo', 'Status'], window.fsListasCompactasCache.agenda.map(a => `
          <tr onclick="fsAbrirModalRegistro('agenda','${esc(a.id)}')">
            ${td(`<strong>${esc(a.data_servico || '-')}</strong><small>${esc([a.hora_inicio, a.hora_fim].filter(Boolean).join(' - '))}</small>`)}
            ${td(`${esc(a.titulo || 'Agendamento')}<small>${esc(a.responsavel || '')}</small>`)}
            ${td(esc(a.clientes?.nome || a.cliente_nome || '-'))}
            ${td(esc([a.veiculos?.placa, a.veiculos?.marca, a.veiculos?.modelo].filter(Boolean).join(' ') || '-'))}
            ${td(tag(a.status || 'agendado', a.status || 'agendado'))}
          </tr>`));
      };
      window.renderizarAgenda.__fsCompacta = true;
    }
  }

  function tituloDoItem(item) { return item.querySelector('h3, h2, strong, .titulo, [data-titulo]')?.textContent?.trim() || 'Detalhes do registro'; }
  function subtituloDoItem(item) {
    const textos = Array.from(item.querySelectorAll('p, small, .tag, .status-badge')).map(el => el.textContent.trim()).filter(Boolean);
    return textos.slice(0, 2).join(' • ') || 'Clique em uma ação abaixo para continuar.';
  }

  function abrirModalItem(item) {
    if (!item || item.classList.contains('estado-vazio')) return;
    const clone = item.cloneNode(true);
    clone.removeAttribute('onclick');
    clone.classList.add('fs-item-modal-clone');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('button, a').forEach(el => el.addEventListener('click', () => setTimeout(fecharModalItem, 120)));

    const overlay = document.createElement('div');
    overlay.id = 'fs-item-modal-overlay';
    overlay.className = 'fs-item-modal-overlay';
    overlay.innerHTML = `<section class="fs-item-modal-card" role="dialog" aria-modal="true"><header class="fs-item-modal-topo"><div><strong>${esc(tituloDoItem(item))}</strong><span>${esc(subtituloDoItem(item))}</span></div><button type="button" class="fs-modal-fechar" aria-label="Fechar">×</button></header><div class="fs-item-modal-corpo"></div></section>`;
    overlay.querySelector('.fs-item-modal-corpo').appendChild(clone);
    overlay.querySelector('.fs-modal-fechar').onclick = fecharModalItem;
    overlay.addEventListener('click', event => { if (event.target === overlay) fecharModalItem(); });
    document.body.appendChild(overlay);
    document.body.classList.add('fs-modal-form-lock');
  }

  function instalarModalDeItensDaLista() {
    const seletor = ['.cliente-item', '.veiculo-item', '.ordem-item', '.estoque-produto-bloco', '.estoque-item', '.agenda-item', '.forum-topico'].join(',');
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
    instalarRenderizadoresCompactos();
    precargarListasRecentes();
    instalarModaisRestantes();
    instalarModalDeItensDaLista();
    setTimeout(() => { instalarRenderizadoresCompactos(); precargarListasRecentes(); instalarModaisRestantes(); instalarModalDeItensDaLista(); }, 600);
    setTimeout(() => { instalarRenderizadoresCompactos(); instalarModaisRestantes(); instalarModalDeItensDaLista(); }, 1600);
    setInterval(() => { instalarRenderizadoresCompactos(); instalarModalDeItensDaLista(); }, 2500);
  }

  window.fsAbrirModalRegistro = abrirModalRegistro;
  window.fecharModalItem = fecharModalItem;

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModalItem(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();