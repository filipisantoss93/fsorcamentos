/* =========================================================
   FS ORÇAMENTOS - fs-premium-mobile-layout-fix.js
   Funções essenciais das páginas de gestão:
   - mantém listas sempre visíveis;
   - remove botões antigos de ocultar lista;
   - cria dashboard compacto de ordens.
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
      body .clientes-lista-toggle-mobile,
      body .veiculos-lista-toggle-mobile,
      body .ordens-lista-toggle-mobile,
      body .estoque-lista-toggle-mobile,
      body #btn-toggle-lista-clientes,
      body #btn-toggle-lista-veiculos,
      body #btn-toggle-lista-ordens,
      body #btn-toggle-lista-produtos,
      body #btn-atualizar-clientes {
        display: none !important;
      }

      body #lista-clientes,
      body #lista-veiculos,
      body #lista-ordens,
      body #lista-produtos,
      body #lista-estoque,
      body #lista-clientes.lista-clientes-mobile-fechada,
      body #lista-veiculos.lista-veiculos-mobile-fechada,
      body #lista-ordens.lista-ordens-mobile-fechada,
      body #lista-estoque.lista-estoque-mobile-fechada {
        display: grid !important;
      }

      body #btn-buscar-cliente-modal-clientes {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 34px !important;
      }

      .fs-ordens-dashboard {
        background: #ffffff !important;
        color: var(--fs-texto, #2b211d) !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 7px !important;
        box-shadow: 0 3px 10px rgba(47, 33, 29, .07) !important;
        padding: 12px !important;
        margin: 0 0 10px !important;
      }

      .fs-ordens-dashboard-topo {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        gap: 10px !important;
        margin-bottom: 10px !important;
      }

      .fs-ordens-dashboard-topo h2 {
        margin: 0 0 3px !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 18px !important;
        line-height: 1.15 !important;
        font-weight: 950 !important;
      }

      .fs-ordens-dashboard-topo p {
        margin: 0 !important;
        color: var(--fs-texto-suave, #62554d) !important;
        font-weight: 700 !important;
        line-height: 1.35 !important;
        font-size: 12px !important;
      }

      .fs-ordens-dashboard-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }

      .fs-ordens-dashboard-card {
        min-width: 0 !important;
        min-height: 72px !important;
        background: #ffffff !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        border-radius: 6px !important;
        padding: 8px 9px !important;
        box-shadow: none !important;
      }

      .fs-ordens-dashboard-card:nth-child(even) {
        background: #fbf8f4 !important;
      }

      .fs-ordens-dashboard-card span {
        display: block !important;
        color: var(--fs-texto-suave, #62554d) !important;
        font-size: 10px !important;
        font-weight: 950 !important;
        text-transform: uppercase !important;
        line-height: 1.15 !important;
        margin-bottom: 4px !important;
      }

      .fs-ordens-dashboard-card strong {
        display: block !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 18px !important;
        line-height: 1.08 !important;
        word-break: break-word !important;
      }

      .fs-ordens-dashboard-card small {
        display: block !important;
        color: var(--fs-texto-suave, #62554d) !important;
        font-weight: 700 !important;
        line-height: 1.25 !important;
        margin-top: 3px !important;
        font-size: 10.5px !important;
      }

      .fs-ordens-dashboard-card.destaque {
        background: var(--fs-marrom, #2f211d) !important;
        border-color: var(--fs-marrom, #2f211d) !important;
      }

      .fs-ordens-dashboard-card.destaque span,
      .fs-ordens-dashboard-card.destaque small {
        color: #fffaf0 !important;
      }

      .fs-ordens-dashboard-card.destaque strong {
        color: var(--fs-amarelo, #ffc400) !important;
      }

      @media (max-width: 680px) {
        .fs-ordens-dashboard {
          padding: 10px !important;
          border-radius: 7px !important;
        }

        .fs-ordens-dashboard-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 7px !important;
        }

        .fs-ordens-dashboard-card {
          min-height: 68px !important;
          padding: 7px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function manterListasSempreVisiveis() {
    const ids = ['lista-clientes', 'lista-veiculos', 'lista-ordens', 'lista-produtos', 'lista-estoque'];
    ids.forEach((id) => {
      const lista = document.getElementById(id);
      if (!lista) return;
      lista.classList.remove('lista-clientes-mobile-fechada', 'lista-veiculos-mobile-fechada', 'lista-ordens-mobile-fechada', 'lista-estoque-mobile-fechada');
      lista.style.display = 'grid';
    });

    document.querySelectorAll('.clientes-lista-toggle-mobile, .veiculos-lista-toggle-mobile, .ordens-lista-toggle-mobile, .estoque-lista-toggle-mobile').forEach((el) => el.remove());
    ['btn-toggle-lista-clientes', 'btn-toggle-lista-veiculos', 'btn-toggle-lista-ordens', 'btn-toggle-lista-produtos'].forEach((id) => document.getElementById(id)?.remove());

    const btnBuscarAntigo = document.getElementById('btn-atualizar-clientes');
    if (btnBuscarAntigo) {
      btnBuscarAntigo.style.display = 'none';
      btnBuscarAntigo.setAttribute('aria-hidden', 'true');
    }

    const btnBuscarCliente = document.getElementById('btn-buscar-cliente-modal-clientes');
    if (btnBuscarCliente) {
      btnBuscarCliente.textContent = 'Buscar cliente';
      btnBuscarCliente.style.display = 'inline-flex';
    }
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
    manterListasSempreVisiveis();
    preencherDashboardOrdens();

    setTimeout(() => {
      manterListasSempreVisiveis();
      preencherDashboardOrdens();
    }, 800);

    setTimeout(() => {
      manterListasSempreVisiveis();
      preencherDashboardOrdens();
    }, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();