/* FS Orçamentos - Dashboard financeiro profissional */
(function () {
  'use strict';

  const estado = { userId: '', orcamentos: [], ordens: [], clientes: [] };

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function html(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  function numero(valor) {
    const n = Number(valor || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function valorOS(os) {
    return numero(os.valor_total || os.total || os.valor_final || os.valor || 0);
  }

  function valorOrcamento(orcamento) {
    return numero(orcamento.total || orcamento.valor_total || orcamento.valor_final || orcamento.valor || 0);
  }

  function statusPago(status) {
    return ['pago', 'quitado', 'recebido', 'concluido', 'concluida', 'finalizado'].includes(normalizar(status));
  }

  function statusConcluido(status) {
    return ['concluido', 'concluida', 'finalizado', 'finalizada', 'fechado', 'fechada'].includes(normalizar(status));
  }

  function statusAberto(status) {
    return !['concluido', 'concluida', 'finalizado', 'finalizada', 'cancelado', 'cancelada', 'fechado', 'fechada'].includes(normalizar(status));
  }

  function statusAprovado(status) {
    return ['aprovado', 'aprovada', 'em_servico', 'concluido', 'concluida', 'finalizado', 'finalizada'].includes(normalizar(status));
  }

  function statusPendente(status) {
    return ['pendente', 'enviado', 'aguardando', 'aguardando_aprovacao', 'aberto', 'aberta', ''].includes(normalizar(status));
  }

  function dataBase(registro) {
    return registro.data_pagamento || registro.data_conclusao || registro.data_abertura || registro.created_at || registro.criado_em || '';
  }

  function dataObj(valor) {
    if (!valor) return null;
    const d = new Date(String(valor).includes('T') ? valor : String(valor) + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function hojeISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function inicioSemana() {
    const d = new Date();
    const dia = d.getDay() || 7;
    d.setDate(d.getDate() - dia + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function inicioMes() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function inicioAno() {
    const d = new Date();
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async function buscarTabela(tabela, campo) {
    const { data, error } = await window._supabase.from(tabela).select('*').eq(campo, estado.userId).limit(900);
    if (error) {
      console.warn('Dashboard financeiro:', tabela, error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  function inserirCss() {
    if (document.getElementById('fs-dashboard-financeiro-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-dashboard-financeiro-css';
    style.textContent = `
      .dash-fin-section{background:#fff;border:1px solid #e4d8cc;border-radius:7px;box-shadow:0 3px 10px rgba(47,33,29,.07);overflow:hidden;margin-bottom:10px}.dash-fin-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;background:#2f211d;padding:10px 12px}.dash-fin-head h2{margin:0;color:#ffc400;font-size:17px;font-weight:950}.dash-fin-head p{margin:3px 0 0;color:#fffaf0;font-size:12px;font-weight:700;line-height:1.3}.dash-fin-body{padding:10px}.dash-fin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dash-fin-card{background:#fff;border:1px solid #e4d8cc;border-left:4px solid #ffc400;border-radius:6px;padding:8px 9px}.dash-fin-card.ok{background:#f0fdf4;border-left-color:#16a34a}.dash-fin-card.alerta{background:#fff7f7;border-left-color:#dc2626}.dash-fin-card span{display:block;color:#62554d;font-size:10px;font-weight:950;text-transform:uppercase;margin-bottom:4px}.dash-fin-card strong{display:block;color:#2f211d;font-size:20px;font-weight:950;line-height:1.08}.dash-fin-card small{display:block;color:#62554d;font-size:11px;font-weight:700;margin-top:3px}.dash-fin-main{display:grid;grid-template-columns:1.15fr .85fr;gap:10px;margin-top:10px}.dash-fin-table-wrap{overflow:auto;border:1px solid #e4d8cc;border-radius:6px}.dash-fin-table{width:100%;border-collapse:collapse;min-width:620px}.dash-fin-table th{background:#f8f4ee;color:#2f211d;font-size:10px;text-transform:uppercase;text-align:left;padding:7px;font-weight:950}.dash-fin-table td{padding:7px;border-bottom:1px solid #ebe2d7;color:#2b211d;font-size:11.5px;line-height:1.22}.dash-fin-table tbody tr:nth-child(even){background:#fbf8f4}.dash-fin-table tbody tr:hover{background:#fff4ce;cursor:pointer}.dash-fin-status{display:inline-flex;padding:2px 5px;border-radius:4px;border:1px solid #e4d8cc;background:#f8f4ee;color:#2f211d;font-size:9px;font-weight:950;text-transform:uppercase}.dash-fin-list{display:grid;gap:7px}.dash-fin-item{border:1px solid #e4d8cc;border-radius:6px;padding:8px;background:#fff}.dash-fin-item strong{display:block;color:#2f211d;font-size:12.5px;font-weight:950}.dash-fin-item span{display:block;color:#62554d;font-size:11px;line-height:1.3;font-weight:700;margin-top:2px}.dash-fin-empty{padding:10px;color:#62554d;font-size:12px;font-weight:750;text-align:center}@media(max-width:920px){.dash-fin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dash-fin-main{grid-template-columns:1fr}}@media(max-width:580px){.dash-fin-grid{grid-template-columns:1fr}.dash-fin-head{display:grid}.dash-fin-card strong{font-size:18px}}
    `;
    document.head.appendChild(style);
  }

  function criarEstrutura() {
    if (document.getElementById('dashboard-financeiro-pro')) return;
    const header = document.querySelector('.dash-header');
    if (!header) return;
    const section = document.createElement('section');
    section.id = 'dashboard-financeiro-pro';
    section.className = 'dash-fin-section';
    section.innerHTML = `
      <div class="dash-fin-head"><div><h2>Financeiro e saúde da empresa</h2><p>Faturamento por período, valores a receber e gargalos operacionais.</p></div></div>
      <div class="dash-fin-body">
        <div class="dash-fin-grid">
          <div class="dash-fin-card ok"><span>Faturamento hoje</span><strong id="fin-hoje">R$ 0,00</strong><small>OS recebidas/concluídas hoje</small></div>
          <div class="dash-fin-card ok"><span>Faturamento semana</span><strong id="fin-semana">R$ 0,00</strong><small>Desde segunda-feira</small></div>
          <div class="dash-fin-card ok"><span>Faturamento mês</span><strong id="fin-mes">R$ 0,00</strong><small>Mês atual</small></div>
          <div class="dash-fin-card"><span>Faturamento ano</span><strong id="fin-ano">R$ 0,00</strong><small>Ano atual</small></div>
          <div class="dash-fin-card alerta"><span>A receber</span><strong id="fin-receber">R$ 0,00</strong><small>OS com valor sem pagamento</small></div>
          <div class="dash-fin-card alerta"><span>OS aguardando pagamento</span><strong id="fin-os-pagamento">0</strong><small>Precisa cobrar/finalizar</small></div>
          <div class="dash-fin-card"><span>Ticket médio OS</span><strong id="fin-ticket">R$ 0,00</strong><small>Média das OS com valor</small></div>
          <div class="dash-fin-card"><span>Clientes recorrentes</span><strong id="fin-recorrentes">0</strong><small>Clientes com 2+ OS</small></div>
        </div>
        <div class="dash-fin-main"><div id="fin-lista-receber"><div class="dash-fin-empty">Carregando valores a receber...</div></div><div id="fin-alertas" class="dash-fin-list"><div class="dash-fin-empty">Carregando alertas...</div></div></div>
      </div>`;
    header.insertAdjacentElement('afterend', section);
  }

  function set(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function dentroPeriodo(registro, inicio) {
    const d = dataObj(dataBase(registro));
    return !!d && d >= inicio;
  }

  function mesmoDiaHoje(registro) {
    return String(dataBase(registro)).slice(0, 10) === hojeISO();
  }

  function calcular() {
    const pagas = estado.ordens.filter(o => valorOS(o) > 0 && (statusPago(o.status_pagamento) || statusConcluido(o.status)));
    const receber = estado.ordens.filter(o => valorOS(o) > 0 && !statusPago(o.status_pagamento) && !['cancelado', 'cancelada'].includes(normalizar(o.status)));
    const comValor = estado.ordens.filter(o => valorOS(o) > 0);
    const porCliente = {};
    estado.ordens.forEach(o => { if (o.cliente_id) porCliente[o.cliente_id] = (porCliente[o.cliente_id] || 0) + 1; });
    const aprovados = estado.orcamentos.filter(o => statusAprovado(o.status));
    const pendentes = estado.orcamentos.filter(o => statusPendente(o.status));
    const taxa = estado.orcamentos.length ? Math.round((aprovados.length / estado.orcamentos.length) * 100) : 0;
    return {
      hoje: pagas.filter(mesmoDiaHoje).reduce((s, o) => s + valorOS(o), 0),
      semana: pagas.filter(o => dentroPeriodo(o, inicioSemana())).reduce((s, o) => s + valorOS(o), 0),
      mes: pagas.filter(o => dentroPeriodo(o, inicioMes())).reduce((s, o) => s + valorOS(o), 0),
      ano: pagas.filter(o => dentroPeriodo(o, inicioAno())).reduce((s, o) => s + valorOS(o), 0),
      receber,
      receberValor: receber.reduce((s, o) => s + valorOS(o), 0),
      ticket: comValor.length ? comValor.reduce((s, o) => s + valorOS(o), 0) / comValor.length : 0,
      recorrentes: Object.values(porCliente).filter(v => v >= 2).length,
      abertas: estado.ordens.filter(o => statusAberto(o.status)).length,
      pendentes: pendentes.length,
      taxa
    };
  }

  function dataBR(valor) {
    const d = dataObj(valor);
    return d ? d.toLocaleDateString('pt-BR') : '-';
  }

  function renderReceber(lista) {
    const box = document.getElementById('fin-lista-receber');
    if (!box) return;
    const top = [...lista].sort((a, b) => valorOS(b) - valorOS(a)).slice(0, 10);
    if (!top.length) {
      box.innerHTML = '<div class="dash-fin-empty">Nenhuma OS aguardando recebimento.</div>';
      return;
    }
    box.innerHTML = `<div class="dash-fin-table-wrap"><table class="dash-fin-table"><thead><tr><th>OS</th><th>Cliente</th><th>Status</th><th>Valor</th></tr></thead><tbody>${top.map(o => `<tr data-id="${html(o.id)}"><td><strong>${html(o.numero_os ? String(o.numero_os).padStart(6, '0') : 'OS')}</strong><small>${html(dataBR(dataBase(o)))}</small></td><td>${html(o.cliente_nome || o.nome_cliente || 'Cliente')}</td><td><span class="dash-fin-status">${html(o.status_pagamento || o.status || 'aberta')}</span></td><td><strong>${html(moeda(valorOS(o)))}</strong></td></tr>`).join('')}</tbody></table></div>`;
    box.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('click', () => { location.href = '/ordem.html?id=' + encodeURIComponent(tr.dataset.id); }));
  }

  function renderAlertas(c) {
    const box = document.getElementById('fin-alertas');
    if (!box) return;
    const itens = [
      [`${c.abertas} OS em aberto`, 'Serviços precisam ser executados, finalizados ou cobrados.'],
      [`${c.pendentes} orçamentos pendentes`, 'Oportunidades aguardando retorno do cliente.'],
      [`${c.taxa}% de aprovação`, 'Conversão comercial dos orçamentos.'],
      [`${c.recorrentes} clientes recorrentes`, 'Clientes com duas ou mais OS registradas.']
    ];
    box.innerHTML = itens.map(i => `<div class="dash-fin-item"><strong>${html(i[0])}</strong><span>${html(i[1])}</span></div>`).join('');
  }

  function aplicar() {
    criarEstrutura();
    const c = calcular();
    set('fin-hoje', moeda(c.hoje));
    set('fin-semana', moeda(c.semana));
    set('fin-mes', moeda(c.mes));
    set('fin-ano', moeda(c.ano));
    set('fin-receber', moeda(c.receberValor));
    set('fin-os-pagamento', String(c.receber.length));
    set('fin-ticket', moeda(c.ticket));
    set('fin-recorrentes', String(c.recorrentes));
    renderReceber(c.receber);
    renderAlertas(c);
  }

  async function iniciar() {
    try {
      inserirCss();
      if (!window._supabase) return;
      const { data: { session } } = await window._supabase.auth.getSession();
      if (!session?.user?.id) return;
      estado.userId = session.user.id;
      const [orcamentos, ordens, clientes] = await Promise.all([
        buscarTabela('orcamentos', 'usuario_id'),
        buscarTabela('ordens_servico', 'user_id'),
        buscarTabela('clientes', 'user_id')
      ]);
      estado.orcamentos = orcamentos;
      estado.ordens = ordens;
      estado.clientes = clientes;
      aplicar();
    } catch (erro) {
      console.warn('Dashboard financeiro profissional falhou:', erro);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, 600));
  else setTimeout(iniciar, 600);
})();