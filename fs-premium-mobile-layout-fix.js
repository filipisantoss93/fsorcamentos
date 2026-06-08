/* =========================================================
   FS ORÇAMENTOS - Ajustes Premium Mobile/Layout
   - Agenda: Novo agendamento minimizável.
   - Clientes: Novo cliente minimizável e cards em 2 colunas.
   - Ordens: dashboard/resumo em grid 2 colunas.
   ========================================================= */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function numero(valor) {
    return Number(valor || 0) || 0;
  }

  function valorOS(os) {
    return numero(os?.valor_total ?? os?.total ?? os?.valor ?? os?.valor_final ?? os?.total_geral ?? 0);
  }

  function statusAberto(status) {
    return ['aberta', 'em_analise', 'analise', 'aguardando_aprovacao', 'aprovada', 'pendente'].includes(normalizar(status || 'aberta'));
  }

  function statusExecucao(status) {
    return ['em_execucao', 'execucao', 'em_andamento', 'aguardando_peca', 'aguardando_material'].includes(normalizar(status));
  }

  function statusConcluido(status) {
    return ['concluida', 'concluido', 'finalizada', 'finalizado'].includes(normalizar(status));
  }

  function statusPago(status) {
    return ['pago', 'quitado', 'recebido', 'concluido', 'concluida'].includes(normalizar(status));
  }

  function injetarEstilo() {
    if (document.getElementById('fs-premium-mobile-layout-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-premium-mobile-layout-fix-style';
    style.textContent = `
      .fs-form-card-collapsed .fs-collapsible-body,
      .fs-form-card-collapsed .agenda-card-body,
      .fs-form-card-collapsed .clientes-card-body,
      .fs-form-card-collapsed .corpo-form-mobile {
        display: none !important;
      }

      .fs-form-card-collapsed .agenda-card-header,
      .fs-form-card-collapsed .clientes-card-header {
        border-bottom: none !important;
      }

      .fs-card-header-toggle {
        display: flex !important;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .fs-card-header-toggle > div {
        min-width: 0;
      }

      .fs-btn-toggle-card {
        flex: 0 0 auto;
        border: 2px solid var(--fs-amarelo, #ffc400);
        background: var(--fs-amarelo, #ffc400);
        color: var(--fs-marrom, #3e2723);
        border-radius: 999px;
        padding: 8px 13px;
        min-height: 38px;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .fs-btn-toggle-card:hover {
        background: #ffffff;
        color: var(--fs-marrom, #3e2723);
      }

      .fs-ordens-dashboard {
        background: linear-gradient(135deg, #fffaf0, #ffffff);
        color: var(--fs-texto, #2f241f);
        border: 1px solid var(--fs-borda, #e8dccb);
        border-top: 6px solid var(--fs-amarelo, #ffc400);
        border-radius: 20px;
        box-shadow: var(--fs-shadow, 0 10px 26px rgba(62,39,35,.10));
        padding: 16px;
        margin: 0 0 18px;
      }

      .fs-ordens-dashboard-topo {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
      }

      .fs-ordens-dashboard-topo h2 {
        margin: 0 0 4px;
        color: var(--fs-marrom, #3e2723);
        font-size: 22px;
      }

      .fs-ordens-dashboard-topo p {
        margin: 0;
        color: var(--fs-texto-suave, #6d5b52);
        font-weight: 700;
        line-height: 1.45;
      }

      .fs-ordens-dashboard-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }

      .fs-ordens-dashboard-card {
        min-width: 0;
        min-height: 104px;
        background: #ffffff;
        border: 1px solid var(--fs-borda, #e8dccb);
        border-left: 6px solid var(--fs-amarelo, #ffc400);
        border-radius: 15px;
        padding: 12px;
        box-shadow: 0 8px 18px rgba(0,0,0,.08);
      }

      .fs-ordens-dashboard-card span {
        display: block;
        color: var(--fs-texto-suave, #6d5b52);
        font-size: 10px;
        font-weight: 950;
        text-transform: uppercase;
        line-height: 1.25;
        margin-bottom: 7px;
      }

      .fs-ordens-dashboard-card strong {
        display: block;
        color: var(--fs-marrom, #3e2723);
        font-size: 21px;
        line-height: 1.08;
        word-break: break-word;
      }

      .fs-ordens-dashboard-card small {
        display: block;
        color: var(--fs-texto-suave, #6d5b52);
        font-weight: 700;
        line-height: 1.35;
        margin-top: 5px;
      }

      .fs-ordens-dashboard-card.destaque {
        background: var(--fs-marrom, #3e2723);
        border-color: var(--fs-amarelo, #ffc400);
      }

      .fs-ordens-dashboard-card.destaque span,
      .fs-ordens-dashboard-card.destaque small {
        color: #fffaf0;
      }

      .fs-ordens-dashboard-card.destaque strong {
        color: var(--fs-amarelo, #ffc400);
      }

      @media (max-width: 680px) {
        .clientes-resumo {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 9px !important;
        }

        .clientes-resumo .card-resumo {
          min-width: 0 !important;
          min-height: 96px !important;
          padding: 11px !important;
          border-radius: 15px !important;
        }

        .clientes-resumo .card-resumo span {
          font-size: 10px !important;
          line-height: 1.25 !important;
        }

        .clientes-resumo .card-resumo strong {
          font-size: 21px !important;
          line-height: 1.1 !important;
        }

        .fs-ordens-dashboard {
          padding: 13px;
          border-radius: 18px;
        }

        .fs-ordens-dashboard-topo h2 {
          font-size: 20px;
        }

        .fs-ordens-dashboard-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 9px !important;
        }

        .fs-ordens-dashboard-card {
          min-height: 96px;
          padding: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function prepararHeaderCard(card, tituloBotaoAberto, tituloBotaoFechado) {
    if (!card || card.dataset.fsMinimizavel === '1') return;

    const header = card.querySelector('.agenda-card-header, .clientes-card-header, .ordens-card-header');
    const body = card.querySelector('.agenda-card-body, .clientes-card-body, .ordens-card-body, .corpo-form-mobile');
    if (!header || !body) return;

    card.dataset.fsMinimizavel = '1';
    body.classList.add('fs-collapsible-body');

    const conteudo = document.createElement('div');
    while (header.firstChild) conteudo.appendChild(header.firstChild);
    header.appendChild(conteudo);
    header.classList.add('fs-card-header-toggle');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fs-btn-toggle-card';
    btn.textContent = tituloBotaoAberto || 'Fechar';
    btn.setAttribute('aria-expanded', 'true');
    header.appendChild(btn);

    function atualizar() {
      const fechado = card.classList.contains('fs-form-card-collapsed');
      btn.textContent = fechado ? (tituloBotaoFechado || 'Abrir') : (tituloBotaoAberto || 'Fechar');
      btn.setAttribute('aria-expanded', fechado ? 'false' : 'true');
    }

    btn.addEventListener('click', () => {
      card.classList.toggle('fs-form-card-collapsed');
      atualizar();
    });

    // Mobile abre recolhido para economizar espaço. Desktop permanece aberto.
    if (window.innerWidth <= 700) {
      card.classList.add('fs-form-card-collapsed');
    }

    atualizar();
  }

  function instalarAgendaMinimizavel() {
    if (!path.endsWith('/agenda') && !path.endsWith('/agenda.html')) return;

    const cards = Array.from(document.querySelectorAll('.agenda-card'));
    const novoAgendamento = cards.find(card => /novo agendamento/i.test(card.textContent || '')) || cards[0];
    prepararHeaderCard(novoAgendamento, 'Fechar', 'Abrir');
  }

  function instalarClientesMinimizavel() {
    if (!path.endsWith('/clientes') && !path.endsWith('/clientes.html')) return;

    const cards = Array.from(document.querySelectorAll('.clientes-card'));
    const novoCliente = cards.find(card => /novo cliente|cadastrar cliente|dados do cliente/i.test(card.textContent || '')) || cards[0];
    prepararHeaderCard(novoCliente, 'Fechar', 'Abrir');
  }

  async function aguardarSupabase(tentativas = 20) {
    for (let i = 0; i < tentativas; i += 1) {
      if (window._supabase) return true;
      if (typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
        if (window._supabase) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  async function obterUserId() {
    try {
      const ok = await aguardarSupabase();
      if (!ok) return localStorage.getItem('id') || null;
      const { data } = await window._supabase.auth.getSession();
      return data?.session?.user?.id || localStorage.getItem('id') || null;
    } catch (_) {
      return localStorage.getItem('id') || null;
    }
  }

  async function buscarOrdens(userId) {
    if (!window._supabase || !userId) return [];

    for (const campo of ['user_id', 'usuario_id']) {
      const { data, error } = await window._supabase
        .from('ordens_servico')
        .select('*')
        .eq(campo, userId)
        .order('created_at', { ascending: false });

      if (!error) return Array.isArray(data) ? data : [];
    }

    return [];
  }

  function cardDashboard(rotulo, id, desc, destaque) {
    return `<article class="fs-ordens-dashboard-card${destaque ? ' destaque' : ''}"><span>${rotulo}</span><strong id="${id}">0</strong><small>${desc}</small></article>`;
  }

  function garantirDashboardOrdens() {
    if (!path.endsWith('/ordens') && !path.endsWith('/ordens.html')) return null;
    if (document.getElementById('fs-ordens-dashboard')) return document.getElementById('fs-ordens-dashboard');

    const destino = document.querySelector('.ordens-grid') || document.querySelector('.pagina-ordens main') || document.querySelector('.pagina-ordens');
    if (!destino) return null;

    const dashboard = document.createElement('section');
    dashboard.id = 'fs-ordens-dashboard';
    dashboard.className = 'fs-ordens-dashboard';
    dashboard.innerHTML = `
      <div class="fs-ordens-dashboard-topo">
        <div>
          <h2>Dashboard de ordens</h2>
          <p>Resumo rápido das OSs para acompanhar execução, conclusão e pagamentos.</p>
        </div>
      </div>
      <div class="fs-ordens-dashboard-grid">
        ${cardDashboard('Total de OS', 'fs-os-total', 'Ordens cadastradas')}
        ${cardDashboard('Abertas', 'fs-os-abertas', 'Aguardando início')}
        ${cardDashboard('Em execução', 'fs-os-execucao', 'Serviços ativos')}
        ${cardDashboard('Concluídas', 'fs-os-concluidas', 'Serviços finalizados')}
        ${cardDashboard('Faturamento', 'fs-os-faturamento', 'OS pagas/concluídas', true)}
        ${cardDashboard('A receber', 'fs-os-receber', 'Pagamentos pendentes')}
        ${cardDashboard('Ticket médio', 'fs-os-ticket', 'Média por OS')}
        ${cardDashboard('Pend. pagamento', 'fs-os-pend-pgto', 'OS sem baixa')}
      </div>
    `;

    destino.parentNode.insertBefore(dashboard, destino);
    return dashboard;
  }

  function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  async function preencherDashboardOrdens() {
    const dashboard = garantirDashboardOrdens();
    if (!dashboard) return;

    const userId = await obterUserId();
    const ordens = await buscarOrdens(userId);

    const abertas = ordens.filter(os => statusAberto(os.status)).length;
    const execucao = ordens.filter(os => statusExecucao(os.status)).length;
    const concluidas = ordens.filter(os => statusConcluido(os.status)).length;
    const pendPgto = ordens.filter(os => valorOS(os) > 0 && !statusPago(os.status_pagamento)).length;
    const faturamento = ordens.filter(os => statusPago(os.status_pagamento)).reduce((s, os) => s + valorOS(os), 0);
    const receber = ordens.filter(os => valorOS(os) > 0 && !statusPago(os.status_pagamento)).reduce((s, os) => s + valorOS(os), 0);
    const comValor = ordens.filter(os => valorOS(os) > 0);
    const ticket = comValor.length ? comValor.reduce((s, os) => s + valorOS(os), 0) / comValor.length : 0;

    setText('fs-os-total', ordens.length);
    setText('fs-os-abertas', abertas);
    setText('fs-os-execucao', execucao);
    setText('fs-os-concluidas', concluidas);
    setText('fs-os-faturamento', moeda(faturamento));
    setText('fs-os-receber', moeda(receber));
    setText('fs-os-ticket', moeda(ticket));
    setText('fs-os-pend-pgto', pendPgto);
  }

  function iniciar() {
    injetarEstilo();
    instalarAgendaMinimizavel();
    instalarClientesMinimizavel();
    preencherDashboardOrdens();

    setTimeout(() => {
      instalarAgendaMinimizavel();
      instalarClientesMinimizavel();
      preencherDashboardOrdens();
    }, 800);

    setTimeout(() => {
      instalarAgendaMinimizavel();
      instalarClientesMinimizavel();
      preencherDashboardOrdens();
    }, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
