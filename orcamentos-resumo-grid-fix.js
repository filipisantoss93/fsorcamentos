/* =========================================================
   FS ORÇAMENTOS - orcamentos-resumo-grid-fix.js
   Runtime da página de orçamentos: sessão, plano, consulta e tabela.
   ========================================================= */
(function () {
  'use strict';

  const estado = {
    session: null,
    perfil: null,
    plano: 'gratis',
    orcamentos: [],
    filtrados: [],
    filtroStatus: 'todos',
    filtroPeriodo: 'total',
    busca: ''
  };

  function $(id) { return document.getElementById(id); }
  function esc(valor) { return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function normalizar(valor) { return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  function moeda(valor) { return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function totalOrcamento(o) { return Number(o?.total ?? o?.valor_total ?? o?.total_geral ?? o?.valor ?? 0) || 0; }
  function clienteNome(o) { return String(o?.cliente_nome || o?.nome_cliente || o?.cliente || o?.nome || 'Não informado'); }
  function assuntoOrcamento(o) { return String(o?.assunto || o?.titulo || o?.descricao || o?.observacoes || '-'); }
  function numeroOrcamento(o) { const numero = o?.numero_orcamento || o?.numero || o?.codigo || ''; return numero ? `Nº ${String(numero).padStart(6, '0')}` : (o?.id ? `ID ${String(o.id).slice(0, 8)}` : '-'); }
  function dataOrcamento(o) { const valor = o?.created_at || o?.data_criacao || o?.data || o?.updated_at; if (!valor) return '-'; const data = new Date(valor); return Number.isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR'); }
  function statusClasse(status) { const st = normalizar(status || 'pendente').replace(/[^a-z0-9_-]/g, '_'); return st === 'emservico' ? 'em_servico' : (st || 'pendente'); }
  function statusLabel(status) { const mapa = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado', finalizada: 'Finalizado' }; return mapa[statusClasse(status)] || String(status || 'Pendente'); }
  function planoPago(plano) { return ['basico', 'premium', 'gestao', 'pago'].includes(normalizar(plano)); }

  function injetarEstilo() {
    if ($('fs-orcamentos-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-orcamentos-runtime-style';
    style.textContent = `
      .conteudo-protegido-orcamentos { width: min(1120px, calc(100% - 20px)); margin: 14px auto 28px; }
      .orcamentos-header, .filtro-flutuante, .resumo-financeiro, .lista-orcamentos-card { background:#fff; border:1px solid #ebe2d7; border-radius:7px; box-shadow:0 3px 10px rgba(47,33,29,.07); margin-bottom:10px; }
      .orcamentos-header { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 14px; }
      .orcamentos-header h1 { margin:0; color:#2f211d; font-size:22px; line-height:1.15; }
      .orcamentos-header small, .lista-orcamentos-header small, .resumo-header small { color:#62554d !important; font-weight:700; }
      .btn-novo-orcamento-topo, .btn-primario-modal { display:inline-flex; align-items:center; justify-content:center; min-height:34px; padding:8px 11px; border-radius:4px; background:#2f211d; color:#ffc400; border:1px solid #2f211d; text-decoration:none; font-size:12px; font-weight:950; cursor:pointer; box-shadow:none; }
      .filtro-flutuante { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:10px; }
      .filtro-grupo label { display:block; margin-bottom:4px; color:#2f211d; font-size:11px; font-weight:900; text-transform:uppercase; }
      .filtro-grupo input, .filtro-grupo select { width:100%; min-height:34px; border:1px solid #d7ccc8; border-radius:4px; padding:7px 9px; background:#fff; color:#2b211d; box-sizing:border-box; font-size:12px; }
      .resumo-financeiro, .lista-orcamentos-card { overflow:hidden; }
      .resumo-header, .lista-orcamentos-header { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:11px 13px; background:#f8f4ee; border-bottom:1px solid #ebe2d7; color:#2f211d; }
      .resumo-header h2, .lista-orcamentos-header h2 { margin:0; color:#2f211d; font-size:17px; line-height:1.15; }
      .btn-toggle-resumo { min-height:30px; border-radius:4px; border:1px solid #d7ccc8; background:#fff; color:#2f211d; font-size:11px; font-weight:900; padding:6px 9px; cursor:pointer; }
      .resumo-conteudo { padding:10px; }
      .cards-resumo { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:8px !important; }
      .card-resumo { border:1px solid #ebe2d7 !important; border-radius:6px !important; padding:9px 10px !important; background:#fff !important; min-width:0 !important; box-shadow:none !important; }
      .card-resumo:nth-child(even) { background:#fbf8f4 !important; }
      .card-resumo strong { display:block; color:#62554d; font-size:10px; text-transform:uppercase; line-height:1.15; margin-bottom:5px; }
      .card-resumo .valor-resumo { display:block; color:#2f211d; font-size:18px; font-weight:950; line-height:1.1; word-break:break-word; }
      .card-resumo small { color:#62554d; font-size:11px; font-weight:700; }
      .tabela-wrapper { overflow-x:auto; }
      .tabela-orcamentos { width:100%; border-collapse:collapse; background:#fff; }
      .tabela-orcamentos th, .tabela-orcamentos td { padding:8px 9px; border-bottom:1px solid #ebe2d7; font-size:12px; line-height:1.25; text-align:left; vertical-align:middle; }
      .tabela-orcamentos th { background:#f8f4ee; color:#2f211d; font-size:11px; text-transform:uppercase; font-weight:950; }
      .linha-orcamento { cursor:pointer; } .linha-orcamento:nth-child(even){background:#fbf8f4;} .linha-orcamento:hover{background:#f8f4ee;}
      .status { display:inline-flex; align-items:center; justify-content:center; border:1px solid #ebe2d7; border-radius:3px; padding:3px 6px; background:#f3eee7; color:#2f211d; font-size:10px; font-weight:900; }
      .status-aprovado{background:#ecfdf5;color:#166534;border-color:#bbf7d0;} .status-recusado{background:#fff5f5;color:#b91c1c;border-color:#fecaca;} .status-finalizado{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;} .status-em_servico{background:#fff7ed;color:#9a3412;border-color:#fed7aa;}
      .msg-vazia,.msg-carregando,.msg-erro { padding:18px 14px; color:#62554d; font-size:13px; font-weight:800; text-align:center; }
      .msg-erro { color:#b91c1c; background:#fff5f5; }
      .modal-orcamento-overlay { display:none; position:fixed; inset:0; z-index:59000; align-items:flex-start; justify-content:center; padding:16px; background:rgba(20,13,11,.62); overflow-y:auto; }
      .modal-orcamento-overlay.ativo { display:flex; }
      .modal-orcamento-box { width:min(820px,100%); margin-top:16px; background:#fff; border:1px solid #ded3c5; border-radius:7px; box-shadow:0 18px 42px rgba(0,0,0,.22); overflow:hidden; }
      .modal-orcamento-header { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:11px 13px; background:#f8f4ee; border-bottom:1px solid #ebe2d7; }
      .modal-orcamento-header h2 { margin:0; color:#2f211d; font-size:18px; }
      .modal-orcamento-body { padding:13px; color:#2b211d; }
      .modal-orcamento-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:10px; }
      .modal-info-card { border:1px solid #ebe2d7; background:#fff; border-radius:6px; padding:8px 9px; min-width:0; }
      .modal-info-card strong { display:block; color:#62554d; font-size:10px; text-transform:uppercase; margin-bottom:4px; }
      .modal-info-card span { color:#2f211d; font-size:13px; font-weight:800; overflow-wrap:anywhere; }
      .botoes-modal { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding-top:10px; border-top:1px solid #ebe2d7; }
      .botoes-modal a { min-height:32px; border-radius:4px; padding:7px 10px; border:1px solid #d7ccc8; background:#fff; color:#2f211d; font-size:12px; font-weight:900; text-decoration:none; cursor:pointer; }
      .btn-fechar-modal { width:32px; height:32px; border-radius:4px; border:1px solid #d6c8ba; background:#fff; color:#7f1d1d; font-size:20px; font-weight:900; cursor:pointer; }
      @media (max-width:760px){ .conteudo-protegido-orcamentos{width:min(100% - 10px,1120px);margin-top:10px;} .orcamentos-header{align-items:stretch;flex-direction:column;} .filtro-flutuante,.modal-orcamento-grid{grid-template-columns:1fr;} .cards-resumo{grid-template-columns:repeat(2,minmax(0,1fr)) !important;} .tabela-orcamentos th,.tabela-orcamentos td{padding:7px 5px;font-size:11px;} }
    `;
    document.head.appendChild(style);
  }

  function garantirEstrutura() {
    const area = $('area-orcamentos-funcoes');
    if (!area || area.dataset.fsOrcamentosRuntime === '1') return;
    area.dataset.fsOrcamentosRuntime = '1';
    area.innerHTML = `
      <div class="orcamentos-header"><div><h1>Meus Orçamentos</h1><small id="orcamentos-status-label">Carregando dados...</small></div><a href="/gerador.html" class="btn-novo-orcamento-topo">🧾 Novo orçamento</a></div>
      <div class="filtro-flutuante">
        <div class="filtro-grupo"><label>Status exibido</label><select id="filtro-status"><option value="todos">Todos</option><option value="pendente">Pendentes</option><option value="aprovado">Aprovados</option><option value="recusado">Recusados</option><option value="em_servico">Em serviço</option><option value="finalizado">Finalizados</option></select></div>
        <div class="filtro-grupo"><label>Período do resumo</label><select id="filtro-periodo"><option value="15">Últimos 15 dias</option><option value="30">Últimos 30 dias</option><option value="60">Últimos 60 dias</option><option value="total" selected>Total</option></select></div>
        <div class="filtro-grupo"><label>Buscar</label><input type="search" id="filtro-busca" placeholder="Cliente, assunto, número..."></div>
      </div>
      <div id="resumo-financeiro" class="resumo-financeiro"><div class="resumo-header"><div><h2>Resumo financeiro</h2><small id="resumo-periodo-label">Período: Total</small></div><button type="button" id="btn-toggle-resumo" class="btn-toggle-resumo">Minimizar ▲</button></div><div class="resumo-conteudo" id="resumo-conteudo"><div class="cards-resumo"><div class="card-resumo"><strong>Pendentes</strong><span class="valor-resumo" id="resumo-pendente">R$ 0,00</span><small><span id="qtd-pendente">0</span> orçamento(s)</small></div><div class="card-resumo"><strong>Aprovados</strong><span class="valor-resumo" id="resumo-aprovado">R$ 0,00</span><small><span id="qtd-aprovado">0</span> orçamento(s)</small></div><div class="card-resumo"><strong>Finalizados</strong><span class="valor-resumo" id="resumo-finalizado">R$ 0,00</span><small><span id="qtd-finalizado">0</span> orçamento(s)</small></div><div class="card-resumo"><strong>Total geral</strong><span class="valor-resumo" id="resumo-total">R$ 0,00</span><small><span id="qtd-total">0</span> orçamento(s)</small></div></div></div></div>
      <section class="lista-orcamentos-card"><div class="lista-orcamentos-header"><div><h2>Lista de orçamentos</h2><small id="lista-orcamentos-label">Carregando...</small></div></div><div id="lista-orcamentos"><div class="msg-carregando">Carregando orçamentos...</div></div></section>
    `;

    $('filtro-status')?.addEventListener('change', (e) => window.trocarAbaOrcamentos(e.target.value));
    $('filtro-periodo')?.addEventListener('change', (e) => window.trocarPeriodoResumo(e.target.value));
    $('filtro-busca')?.addEventListener('input', () => window.filtrarTabelaLocal());
    $('btn-toggle-resumo')?.addEventListener('click', window.toggleResumoFinanceiro);

    if (!$('modal-visualizar-orcamento')) {
      const modal = document.createElement('div');
      modal.id = 'modal-visualizar-orcamento';
      modal.className = 'modal-orcamento-overlay';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `<div class="modal-orcamento-box" role="dialog" aria-modal="true"><div class="modal-orcamento-header"><div><h2 id="modal-orcamento-titulo">Detalhes do orçamento</h2><small id="modal-orcamento-subtitulo">Selecione um orçamento.</small></div><button type="button" class="btn-fechar-modal">×</button></div><div class="modal-orcamento-body" id="modal-orcamento-body"></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.btn-fechar-modal').addEventListener('click', fecharModalVisualizar);
      modal.addEventListener('click', (event) => { if (event.target === modal) fecharModalVisualizar(); });
    }
  }

  async function aguardarSupabase() {
    for (let i = 0; i < 30; i += 1) {
      if (window._supabase) return window._supabase;
      if (typeof window.inicializarSupabaseFS === 'function') window.inicializarSupabaseFS();
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return null;
  }

  async function obterPerfil(userId) {
    try {
      const { data } = await window._supabase.from('perfis').select('id,nome,nome_empresa,plano,plano_status').eq('id', userId).maybeSingle();
      return data || null;
    } catch (_) {
      return null;
    }
  }

  async function buscarOrcamentos(userId) {
    let ultimoErro = null;
    for (const campo of ['user_id', 'usuario_id', 'id_usuario', 'perfil_id']) {
      try {
        const { data, error } = await window._supabase.from('orcamentos').select('*').eq(campo, userId).order('created_at', { ascending: false });
        if (!error) return Array.isArray(data) ? data : [];
        ultimoErro = error;
      } catch (erro) {
        ultimoErro = erro;
      }
    }
    throw ultimoErro || new Error('Consulta de orçamentos falhou.');
  }

  function mostrarAuth() { if ($('auth-area')) $('auth-area').style.display = 'block'; if ($('conteudo-protegido')) $('conteudo-protegido').style.display = 'none'; }
  function mostrarGratis() { if ($('auth-area')) $('auth-area').style.display = 'none'; $('conteudo-protegido').style.display = 'block'; $('bloqueio-plano-gratis').style.display = 'block'; $('area-orcamentos-funcoes').style.display = 'none'; }
  function mostrarApp() { if ($('auth-area')) $('auth-area').style.display = 'none'; $('conteudo-protegido').style.display = 'block'; $('bloqueio-plano-gratis').style.display = 'none'; $('area-orcamentos-funcoes').style.display = 'block'; }

  function dentroPeriodo(o) {
    if (estado.filtroPeriodo === 'total') return true;
    const dias = Number(estado.filtroPeriodo || 0);
    const valor = o.created_at || o.data_criacao || o.data || o.updated_at;
    if (!dias || !valor) return true;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return true;
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return data >= limite;
  }

  function aplicarFiltros() {
    const busca = normalizar(estado.busca);
    estado.filtrados = estado.orcamentos.filter((o) => {
      const statusOk = estado.filtroStatus === 'todos' || statusClasse(o.status) === estado.filtroStatus;
      const buscaTxt = normalizar([numeroOrcamento(o), clienteNome(o), assuntoOrcamento(o), o.id, o.cliente_telefone, o.telefone_cliente].join(' '));
      return statusOk && dentroPeriodo(o) && (!busca || buscaTxt.includes(busca));
    });
  }

  function atualizarResumo() {
    const resumo = { pendente: [0, 0], aprovado: [0, 0], finalizado: [0, 0], total: [0, 0] };
    estado.orcamentos.filter(dentroPeriodo).forEach((o) => {
      const st = statusClasse(o.status);
      const valor = totalOrcamento(o);
      resumo.total[0] += 1; resumo.total[1] += valor;
      if (resumo[st]) { resumo[st][0] += 1; resumo[st][1] += valor; }
    });
    $('resumo-pendente').textContent = moeda(resumo.pendente[1]); $('qtd-pendente').textContent = resumo.pendente[0];
    $('resumo-aprovado').textContent = moeda(resumo.aprovado[1]); $('qtd-aprovado').textContent = resumo.aprovado[0];
    $('resumo-finalizado').textContent = moeda(resumo.finalizado[1]); $('qtd-finalizado').textContent = resumo.finalizado[0];
    $('resumo-total').textContent = moeda(resumo.total[1]); $('qtd-total').textContent = resumo.total[0];
    $('resumo-periodo-label').textContent = estado.filtroPeriodo === 'total' ? 'Período: Total' : `Período: Últimos ${estado.filtroPeriodo} dias`;
  }

  function renderizarTabela() {
    aplicarFiltros(); atualizarResumo();
    $('lista-orcamentos-label').textContent = `${estado.filtrados.length} orçamento(s) encontrado(s)`;
    $('orcamentos-status-label').textContent = `${estado.orcamentos.length} orçamento(s) carregado(s)`;
    if (!estado.filtrados.length) { $('lista-orcamentos').innerHTML = '<div class="msg-vazia">Nenhum orçamento encontrado.</div>'; return; }
    const linhas = estado.filtrados.map((o) => `<tr class="linha-orcamento" onclick="abrirModalVisualizar('${esc(o.id || '')}')"><td><strong>${esc(numeroOrcamento(o))}</strong><br><small>${esc(dataOrcamento(o))}</small></td><td>${esc(clienteNome(o))}<br><small>${esc(assuntoOrcamento(o))}</small></td><td><strong>${esc(moeda(totalOrcamento(o)))}</strong></td><td><span class="status status-${esc(statusClasse(o.status))}">${esc(statusLabel(o.status))}</span></td></tr>`).join('');
    $('lista-orcamentos').innerHTML = `<div class="tabela-wrapper"><table class="tabela-orcamentos"><thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }

  async function carregarOrcamentos() {
    garantirEstrutura();
    $('lista-orcamentos').innerHTML = '<div class="msg-carregando">Carregando orçamentos...</div>';
    try {
      estado.orcamentos = await buscarOrcamentos(estado.session.user.id);
      window.orcamentosCache = estado.orcamentos;
      renderizarTabela();
    } catch (erro) {
      console.error('Erro ao carregar orçamentos:', erro);
      $('lista-orcamentos').innerHTML = '<div class="msg-erro">Não foi possível carregar os orçamentos. Verifique tabela, vínculo do usuário e políticas RLS.</div>';
      $('orcamentos-status-label').textContent = 'Erro ao carregar dados';
    }
  }

  function encontrar(id) { return estado.orcamentos.find((o) => String(o.id) === String(id)); }

  function abrirModalVisualizar(id) {
    const o = encontrar(id); if (!o) return;
    $('modal-orcamento-titulo').textContent = numeroOrcamento(o);
    $('modal-orcamento-subtitulo').textContent = `${clienteNome(o)} • ${statusLabel(o.status)}`;
    $('modal-orcamento-body').innerHTML = `<div class="modal-orcamento-grid"><div class="modal-info-card"><strong>Cliente</strong><span>${esc(clienteNome(o))}</span></div><div class="modal-info-card"><strong>Telefone</strong><span>${esc(o.cliente_telefone || o.telefone_cliente || o.telefone || '-')}</span></div><div class="modal-info-card"><strong>Total</strong><span>${esc(moeda(totalOrcamento(o)))}</span></div><div class="modal-info-card"><strong>Status</strong><span>${esc(statusLabel(o.status))}</span></div><div class="modal-info-card"><strong>Data</strong><span>${esc(dataOrcamento(o))}</span></div><div class="modal-info-card"><strong>Pagamento</strong><span>${esc(o.forma_pagamento || o.pagamento || '-')}</span></div><div class="modal-info-card" style="grid-column:1/-1"><strong>Assunto/observações</strong><span>${esc(assuntoOrcamento(o))}</span></div></div><div class="botoes-modal"><a class="btn-primario-modal" href="/gerador.html?orcamento=${encodeURIComponent(o.id || '')}">Editar/usar como base</a></div>`;
    $('modal-visualizar-orcamento').classList.add('ativo');
    $('modal-visualizar-orcamento').setAttribute('aria-hidden', 'false');
    document.body.classList.add('fs-modal-form-lock');
  }

  function fecharModalVisualizar() { const modal = $('modal-visualizar-orcamento'); if (!modal) return; modal.classList.remove('ativo'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('fs-modal-form-lock'); }
  function trocarAbaOrcamentos(status) { estado.filtroStatus = status || 'todos'; renderizarTabela(); }
  function trocarPeriodoResumo(periodo) { estado.filtroPeriodo = periodo || 'total'; renderizarTabela(); }
  function filtrarTabelaLocal() { estado.busca = $('filtro-busca')?.value || ''; renderizarTabela(); }
  function toggleResumoFinanceiro() { const conteudo = $('resumo-conteudo'); const btn = $('btn-toggle-resumo'); const fechado = conteudo.style.display === 'none'; conteudo.style.display = fechado ? 'block' : 'none'; btn.textContent = fechado ? 'Minimizar ▲' : 'Expandir ▼'; }

  async function iniciar() {
    injetarEstilo();
    const supabase = await aguardarSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    estado.session = data?.session || null;
    if (!estado.session?.user?.id) { mostrarAuth(); return; }
    estado.perfil = await obterPerfil(estado.session.user.id);
    estado.plano = estado.perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';
    localStorage.setItem('usuario_plano', estado.plano);
    if (!planoPago(estado.plano)) { mostrarGratis(); return; }
    mostrarApp(); garantirEstrutura(); await carregarOrcamentos();
  }

  window.abrirModalVisualizar = abrirModalVisualizar;
  window.fecharModalVisualizar = fecharModalVisualizar;
  window.trocarAbaOrcamentos = trocarAbaOrcamentos;
  window.trocarPeriodoResumo = trocarPeriodoResumo;
  window.filtrarTabelaLocal = filtrarTabelaLocal;
  window.toggleResumoFinanceiro = toggleResumoFinanceiro;
  window.carregarOrcamentos = carregarOrcamentos;
  window.renderizarTabelaOrcamentos = function (lista) { estado.orcamentos = Array.isArray(lista) ? lista : estado.orcamentos; renderizarTabela(); };

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModalVisualizar(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();