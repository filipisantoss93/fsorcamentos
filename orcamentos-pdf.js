// FS Orçamentos - runtime da página orcamentos.html + PDF do orçamento salvo
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
    busca: '',
    visualizadoId: null
  };

  function $(id) { return document.getElementById(id); }

  function escapar(valor) {
    if (typeof window.escaparHtml === 'function') return window.escaparHtml(valor);
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function moeda(valor) {
    if (typeof window.formatarMoeda === 'function') return window.formatarMoeda(valor);
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function itemNormalizado(item = {}) {
    if (typeof window.normalizarItem === 'function') return window.normalizarItem(item);
    const qtd = Number(item.qtd ?? item.quantidade ?? 1) || 0;
    const valor = Number(item.valor ?? item.valor_unitario ?? item.preco ?? 0) || 0;
    const subtotal = Number(item.subtotal ?? item.total ?? (qtd * valor)) || 0;
    return { descricao: item.descricao || item.nome || item.item || '', qtd, valor, subtotal };
  }

  function numeroOrcamento(orcamento) {
    const numero = orcamento?.numero_orcamento || orcamento?.numero || orcamento?.codigo || '';
    if (numero) return String(numero).padStart(6, '0');
    return orcamento?.id ? String(orcamento.id).slice(0, 8) : 'PREVIA';
  }

  function numeroLista(orcamento) {
    const numero = numeroOrcamento(orcamento);
    return numero === 'PREVIA' ? '-' : `Nº ${numero}`;
  }

  function dataOrcamento(orcamento) {
    const valor = orcamento?.created_at || orcamento?.data_criacao || orcamento?.criado_em || orcamento?.data || orcamento?.updated_at;
    if (!valor) return '-';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR');
  }

  function statusClasse(status) {
    const s = normalizar(status || 'pendente').replace(/[^a-z0-9_-]/g, '_');
    return s === 'emservico' ? 'em_servico' : (s || 'pendente');
  }

  function statusOrcamento(status) {
    if (typeof window.statusLabel === 'function') return window.statusLabel(status);
    const mapa = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado', finalizada: 'Finalizado' };
    return mapa[statusClasse(status)] || status || 'Pendente';
  }

  function totalOrcamento(orcamento) {
    return Number(orcamento?.total ?? orcamento?.valor_total ?? orcamento?.total_geral ?? orcamento?.valor ?? 0) || 0;
  }

  function clienteNome(orcamento) {
    return orcamento?.cliente_nome || orcamento?.nome_cliente || orcamento?.cliente || orcamento?.nome || 'Não informado';
  }

  function clienteTelefone(orcamento) {
    return orcamento?.cliente_whatsapp || orcamento?.cliente_telefone || orcamento?.telefone_cliente || orcamento?.telefone || '';
  }

  function assuntoOrcamento(orcamento) {
    return orcamento?.assunto || orcamento?.titulo || orcamento?.descricao || orcamento?.observacoes || '-';
  }

  function planoPago(plano) {
    return ['basico', 'premium', 'gestao', 'pago'].includes(normalizar(plano));
  }

  function donoDoOrcamento(orcamento) {
    return orcamento?.usuario_id || orcamento?.user_id || orcamento?.id_usuario || orcamento?.perfil_id || '';
  }

  function linkPublicoOrcamento(orcamento) {
    if (orcamento?.link_publico || orcamento?.link_cliente || orcamento?.url_publica) {
      return orcamento.link_publico || orcamento.link_cliente || orcamento.url_publica;
    }
    if (!orcamento?.id) return window.location.origin + '/ver.html';
    return `${window.location.origin}/ver.html?id=${encodeURIComponent(orcamento.id)}`;
  }

  function injetarEstilo() {
    if ($('fs-orcamentos-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-orcamentos-runtime-style';
    style.textContent = `
      body { background: linear-gradient(180deg, #f8f5f0 0%, #f4efe8 100%) !important; color: #2b211d !important; }
      #conteudo-protegido.conteudo-protegido-orcamentos { width: min(1120px, calc(100% - 20px)); margin: 14px auto 28px; }
      #area-orcamentos-funcoes .container { width: 100% !important; max-width: 1120px !important; margin: 0 auto !important; padding: 0 !important; }
      .orcamentos-header, .filtro-flutuante, .resumo-financeiro, .orcamentos-lista-card { background:#fff !important; border:1px solid #ebe2d7 !important; border-radius:7px !important; box-shadow:0 3px 10px rgba(47,33,29,.07) !important; margin-bottom:10px !important; }
      .orcamentos-header { display:flex !important; justify-content:space-between !important; align-items:center !important; gap:10px !important; padding:12px 14px !important; }
      .orcamentos-header h1 { margin:0 !important; color:#2f211d !important; font-size:22px !important; line-height:1.15 !important; }
      .orcamentos-header small, .orcamentos-lista-topo p, .resumo-header small { color:#62554d !important; font-weight:700 !important; }
      .btn-novo-orcamento-topo, .btn-primario-modal, .btn-pdf-orcamento, .btn-whatsapp-orcamento { display:inline-flex !important; align-items:center !important; justify-content:center !important; min-height:34px !important; padding:8px 11px !important; border-radius:4px !important; background:#2f211d !important; color:#ffc400 !important; border:1px solid #2f211d !important; text-decoration:none !important; font-size:12px !important; font-weight:950 !important; cursor:pointer !important; box-shadow:none !important; }
      .filtro-flutuante { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:8px !important; padding:10px !important; }
      .filtro-grupo label { display:block !important; margin-bottom:4px !important; color:#2f211d !important; font-size:11px !important; font-weight:900 !important; text-transform:uppercase !important; }
      .filtro-grupo input, .filtro-grupo select { width:100% !important; min-height:34px !important; border:1px solid #d7ccc8 !important; border-radius:4px !important; padding:7px 9px !important; background:#fff !important; color:#2b211d !important; box-sizing:border-box !important; font-size:12px !important; }
      .resumo-financeiro, .orcamentos-lista-card { overflow:hidden !important; }
      .resumo-header, .orcamentos-lista-topo { display:flex !important; justify-content:space-between !important; align-items:flex-start !important; gap:10px !important; padding:11px 13px !important; background:#f8f4ee !important; border-bottom:1px solid #ebe2d7 !important; color:#2f211d !important; }
      .resumo-header h2, .orcamentos-lista-topo h2 { margin:0 !important; color:#2f211d !important; font-size:17px !important; line-height:1.15 !important; }
      .btn-toggle-resumo { min-height:30px !important; border-radius:4px !important; border:1px solid #d7ccc8 !important; background:#fff !important; color:#2f211d !important; font-size:11px !important; font-weight:900 !important; padding:6px 9px !important; cursor:pointer !important; }
      .resumo-conteudo { padding:10px !important; }
      .cards-resumo { display:grid !important; grid-template-columns:repeat(5,minmax(0,1fr)) !important; gap:8px !important; }
      .card-resumo { border:1px solid #ebe2d7 !important; border-radius:6px !important; padding:9px 10px !important; background:#fff !important; min-width:0 !important; box-shadow:none !important; }
      .card-resumo:nth-child(even) { background:#fbf8f4 !important; }
      .card-resumo strong { display:block !important; color:#62554d !important; font-size:10px !important; text-transform:uppercase !important; line-height:1.15 !important; margin-bottom:5px !important; }
      .card-resumo .valor-resumo { display:block !important; color:#2f211d !important; font-size:18px !important; font-weight:950 !important; line-height:1.1 !important; word-break:break-word !important; }
      .card-resumo small { color:#62554d !important; font-size:11px !important; font-weight:700 !important; }
      .lista-orcamentos { padding:0 !important; }
      .tabela-wrapper { overflow-x:auto !important; }
      .tabela-orcamentos { width:100% !important; border-collapse:collapse !important; background:#fff !important; table-layout:fixed !important; }
      .tabela-orcamentos th, .tabela-orcamentos td { padding:8px 9px !important; border-bottom:1px solid #ebe2d7 !important; font-size:12px !important; line-height:1.25 !important; text-align:left !important; vertical-align:middle !important; white-space:normal !important; word-break:break-word !important; }
      .tabela-orcamentos th { background:#f8f4ee !important; color:#2f211d !important; font-size:11px !important; text-transform:uppercase !important; font-weight:950 !important; }
      .linha-orcamento { cursor:pointer !important; } .linha-orcamento:nth-child(even){background:#fbf8f4 !important;} .linha-orcamento:hover{background:#f8f4ee !important;}
      .status { display:inline-flex !important; align-items:center !important; justify-content:center !important; border:1px solid #ebe2d7 !important; border-radius:3px !important; padding:3px 6px !important; background:#f3eee7 !important; color:#2f211d !important; font-size:10px !important; font-weight:900 !important; }
      .status-aprovado{background:#ecfdf5 !important;color:#166534 !important;border-color:#bbf7d0 !important;} .status-recusado{background:#fff5f5 !important;color:#b91c1c !important;border-color:#fecaca !important;} .status-finalizado{background:#eff6ff !important;color:#1d4ed8 !important;border-color:#bfdbfe !important;} .status-em_servico{background:#fff7ed !important;color:#9a3412 !important;border-color:#fed7aa !important;}
      .msg-vazia,.msg-carregando,.msg-erro { padding:18px 14px !important; color:#62554d !important; font-size:13px !important; font-weight:800 !important; text-align:center !important; }
      .msg-erro { color:#b91c1c !important; background:#fff5f5 !important; }
      .fs-orc-modal-overlay { display:none; position:fixed; inset:0; z-index:59000; align-items:flex-start; justify-content:center; padding:16px; background:rgba(20,13,11,.62); overflow-y:auto; }
      .fs-orc-modal-overlay.ativo { display:flex; }
      .fs-orc-modal-box { width:min(860px,100%); margin-top:16px; background:#fff; border:1px solid #ded3c5; border-radius:7px; box-shadow:0 18px 42px rgba(0,0,0,.22); overflow:hidden; }
      .fs-orc-modal-header { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:11px 13px; background:#f8f4ee; border-bottom:1px solid #ebe2d7; }
      .fs-orc-modal-header h2 { margin:0; color:#2f211d; font-size:18px; }
      .fs-orc-modal-body { padding:13px; color:#2b211d; }
      .fs-orc-modal-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:10px; }
      .fs-orc-info-card { border:1px solid #ebe2d7; background:#fff; border-radius:6px; padding:8px 9px; min-width:0; }
      .fs-orc-info-card strong { display:block; color:#62554d; font-size:10px; text-transform:uppercase; margin-bottom:4px; }
      .fs-orc-info-card span { color:#2f211d; font-size:13px; font-weight:800; overflow-wrap:anywhere; }
      .botoes-modal { display:flex !important; flex-wrap:wrap !important; gap:6px !important; margin-top:12px !important; padding-top:10px !important; border-top:1px solid #ebe2d7 !important; }
      .botoes-modal button,.botoes-modal a { min-height:32px !important; border-radius:4px !important; padding:7px 10px !important; border:1px solid #d7ccc8 !important; background:#fff !important; color:#2f211d !important; font-size:12px !important; font-weight:900 !important; text-decoration:none !important; cursor:pointer !important; }
      .btn-fechar-modal { width:32px; height:32px; border-radius:4px; border:1px solid #d6c8ba; background:#fff; color:#7f1d1d; font-size:20px; font-weight:900; cursor:pointer; }
      @media (max-width:760px){ #conteudo-protegido.conteudo-protegido-orcamentos{width:min(100% - 10px,1120px);margin-top:10px;} .orcamentos-header{align-items:stretch !important;flex-direction:column !important;} .filtro-flutuante,.fs-orc-modal-grid{grid-template-columns:1fr !important;} .cards-resumo{grid-template-columns:repeat(2,minmax(0,1fr)) !important;} .tabela-orcamentos th,.tabela-orcamentos td{padding:7px 5px !important;font-size:11px !important;} }
    `;
    document.head.appendChild(style);
  }

  function garantirModal() {
    if ($('modal-visualizar-orcamento')) return $('modal-visualizar-orcamento');
    const modal = document.createElement('div');
    modal.id = 'modal-visualizar-orcamento';
    modal.className = 'fs-orc-modal-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `<div class="fs-orc-modal-box" role="dialog" aria-modal="true"><div class="fs-orc-modal-header"><div><h2 id="modal-orcamento-titulo">Detalhes do orçamento</h2><small id="modal-orcamento-subtitulo">Selecione um orçamento.</small></div><button type="button" class="btn-fechar-modal">×</button></div><div class="fs-orc-modal-body" id="modal-orcamento-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.btn-fechar-modal').addEventListener('click', fecharModalVisualizar);
    modal.addEventListener('click', (event) => { if (event.target === modal) fecharModalVisualizar(); });
    return modal;
  }

  function prepararHtmlExistente() {
    injetarEstilo();
    garantirModal();

    const area = $('area-orcamentos-funcoes');
    if (!area) return;

    if (!$('orcamentos-status-label')) {
      const h = area.querySelector('.orcamentos-header h1');
      if (h && !h.parentElement.querySelector('#orcamentos-status-label')) {
        const small = document.createElement('small');
        small.id = 'orcamentos-status-label';
        small.textContent = 'Carregando dados...';
        h.insertAdjacentElement('afterend', small);
      }
    }

    if (!$('lista-orcamentos-label')) {
      const topo = area.querySelector('.orcamentos-lista-topo');
      if (topo) {
        const label = document.createElement('small');
        label.id = 'lista-orcamentos-label';
        label.textContent = 'Carregando...';
        topo.appendChild(label);
      }
    }

    $('filtro-status')?.addEventListener('change', (e) => trocarAbaOrcamentos(e.target.value));
    $('filtro-periodo')?.addEventListener('change', (e) => trocarPeriodoResumo(e.target.value));
    $('filtro-busca')?.addEventListener('input', filtrarTabelaLocal);
    $('btn-toggle-resumo')?.addEventListener('click', (event) => { event.stopPropagation(); toggleResumoFinanceiro(); });
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
      const { data } = await window._supabase
        .from('perfis')
        .select('id,nome,nome_empresa,plano,plano_status,telefone_empresa,endereco_empresa,cnpj_empresa,foto_url')
        .eq('id', userId)
        .maybeSingle();
      return data || null;
    } catch (_) {
      return null;
    }
  }

  async function obterEmpresa() {
    try {
      if (estado.perfil) return estado.perfil;
      if (!window._supabase) throw new Error('Supabase ausente.');
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sem sessão.');
      const perfil = await obterPerfil(session.user.id);
      if (perfil) return perfil;
    } catch (erro) {
      console.warn('Empresa para PDF usando localStorage:', erro);
    }
    return {
      nome: localStorage.getItem('usuario_nome') || '',
      nome_empresa: localStorage.getItem('nome_empresa') || 'Empresa',
      telefone_empresa: localStorage.getItem('telefone_empresa') || '',
      endereco_empresa: localStorage.getItem('endereco_empresa') || '',
      cnpj_empresa: localStorage.getItem('cnpj_empresa') || '',
      foto_url: localStorage.getItem('foto_url') || ''
    };
  }

  async function buscarOrcamentos(userId) {
    let ultimoErro = null;
    for (const campo of ['usuario_id', 'user_id', 'id_usuario', 'perfil_id']) {
      try {
        const { data, error } = await window._supabase
          .from('orcamentos')
          .select('*')
          .eq(campo, userId)
          .order('created_at', { ascending: false });
        if (!error) return Array.isArray(data) ? data : [];
        ultimoErro = error;
      } catch (erro) {
        ultimoErro = erro;
      }
    }
    throw ultimoErro || new Error('Consulta de orçamentos falhou.');
  }

  function mostrarAuth() {
    if ($('auth-area')) $('auth-area').style.display = 'block';
    if ($('conteudo-protegido')) $('conteudo-protegido').style.display = 'none';
  }

  function mostrarGratis() {
    if ($('auth-area')) $('auth-area').style.display = 'none';
    if ($('conteudo-protegido')) $('conteudo-protegido').style.display = 'block';
    if ($('bloqueio-plano-gratis')) $('bloqueio-plano-gratis').style.display = 'block';
    if ($('area-orcamentos-funcoes')) $('area-orcamentos-funcoes').style.display = 'none';
  }

  function mostrarApp() {
    if ($('auth-area')) $('auth-area').style.display = 'none';
    if ($('conteudo-protegido')) $('conteudo-protegido').style.display = 'block';
    if ($('bloqueio-plano-gratis')) $('bloqueio-plano-gratis').style.display = 'none';
    if ($('area-orcamentos-funcoes')) $('area-orcamentos-funcoes').style.display = 'block';
  }

  function dentroPeriodo(orcamento) {
    if (estado.filtroPeriodo === 'total') return true;
    const dias = Number(estado.filtroPeriodo || 0);
    const valor = orcamento.created_at || orcamento.data_criacao || orcamento.criado_em || orcamento.data || orcamento.updated_at;
    if (!dias || !valor) return true;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return true;
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return data >= limite;
  }

  function aplicarFiltros() {
    const busca = normalizar(estado.busca);
    estado.filtrados = estado.orcamentos.filter((orcamento) => {
      const statusOk = estado.filtroStatus === 'todos' || statusClasse(orcamento.status) === estado.filtroStatus;
      const buscaTxt = normalizar([numeroLista(orcamento), clienteNome(orcamento), assuntoOrcamento(orcamento), clienteTelefone(orcamento), orcamento.id].join(' '));
      return statusOk && dentroPeriodo(orcamento) && (!busca || buscaTxt.includes(busca));
    });
  }

  function setTexto(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.textContent = valor;
  }

  function atualizarResumo() {
    const resumo = {
      pendente: [0, 0], aprovado: [0, 0], recusado: [0, 0], em_servico: [0, 0], finalizado: [0, 0]
    };
    estado.orcamentos.filter(dentroPeriodo).forEach((orcamento) => {
      const st = statusClasse(orcamento.status);
      if (!resumo[st]) resumo[st] = [0, 0];
      resumo[st][0] += 1;
      resumo[st][1] += totalOrcamento(orcamento);
    });
    Object.keys(resumo).forEach((status) => {
      setTexto(`resumo-${status}`, moeda(resumo[status][1]));
      setTexto(`qtd-${status}`, resumo[status][0]);
    });
    setTexto('resumo-periodo-label', estado.filtroPeriodo === 'total' ? 'Período: Total' : `Período: Últimos ${estado.filtroPeriodo} dias`);
  }

  function renderizarTabelaOrcamentos(lista) {
    if (Array.isArray(lista)) estado.orcamentos = lista;
    aplicarFiltros();
    atualizarResumo();

    const listaEl = $('lista-orcamentos');
    if (!listaEl) return;

    setTexto('lista-orcamentos-label', `${estado.filtrados.length} orçamento(s) encontrado(s)`);
    setTexto('orcamentos-status-label', `${estado.orcamentos.length} orçamento(s) carregado(s)`);

    if (!estado.filtrados.length) {
      listaEl.innerHTML = '<div class="msg-vazia">Nenhum orçamento encontrado neste filtro.</div>';
      return;
    }

    const linhas = estado.filtrados.map((orcamento) => {
      const id = escapar(orcamento.id || '');
      const status = statusClasse(orcamento.status || 'pendente');
      return `
        <tr class="linha-orcamento" onclick="abrirModalVisualizar('${id}')" title="Abrir orçamento">
          <td><strong>${escapar(numeroLista(orcamento))}</strong><br><small>${escapar(dataOrcamento(orcamento))}</small></td>
          <td>${escapar(clienteNome(orcamento))}<br><small>${escapar(assuntoOrcamento(orcamento))}</small></td>
          <td><strong>${moeda(totalOrcamento(orcamento))}</strong></td>
          <td><span class="status status-${escapar(status)}">${escapar(statusOrcamento(status))}</span></td>
        </tr>`;
    }).join('');

    listaEl.innerHTML = `<div class="tabela-wrapper"><table class="tabela-orcamentos"><thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }

  async function carregarOrcamentos() {
    prepararHtmlExistente();
    const listaEl = $('lista-orcamentos');
    if (listaEl) listaEl.innerHTML = '<div class="msg-carregando">Carregando orçamentos...</div>';
    try {
      estado.orcamentos = await buscarOrcamentos(estado.session.user.id);
      window.orcamentosCache = estado.orcamentos;
      window.orcamentosCacheOriginal = estado.orcamentos;
      renderizarTabelaOrcamentos(estado.orcamentos);
    } catch (erro) {
      console.error('Erro ao carregar orçamentos:', erro);
      if (listaEl) listaEl.innerHTML = '<div class="msg-erro">Não foi possível carregar os orçamentos. Verifique a tabela `orcamentos`, o campo de vínculo do usuário e as políticas RLS.</div>';
      setTexto('orcamentos-status-label', 'Erro ao carregar dados');
    }
  }

  function encontrarOrcamentoVisualizado() {
    return estado.orcamentos.find(o => String(o.id) === String(estado.visualizadoId));
  }

  function abrirModalVisualizar(id) {
    const orcamento = estado.orcamentos.find((o) => String(o.id) === String(id));
    if (!orcamento) return;
    estado.visualizadoId = orcamento.id;
    window.orcamentoVisualizadoId = orcamento.id;
    garantirModal();

    setTexto('modal-orcamento-titulo', numeroLista(orcamento));
    setTexto('modal-orcamento-subtitulo', `${clienteNome(orcamento)} • ${statusOrcamento(orcamento.status)}`);

    const link = linkPublicoOrcamento(orcamento);
    const body = $('modal-orcamento-body');
    if (body) {
      body.innerHTML = `
        <div class="fs-orc-modal-grid">
          <div class="fs-orc-info-card"><strong>Cliente</strong><span>${escapar(clienteNome(orcamento))}</span></div>
          <div class="fs-orc-info-card"><strong>Telefone</strong><span>${escapar(clienteTelefone(orcamento) || '-')}</span></div>
          <div class="fs-orc-info-card"><strong>Total</strong><span>${moeda(totalOrcamento(orcamento))}</span></div>
          <div class="fs-orc-info-card"><strong>Status</strong><span>${escapar(statusOrcamento(orcamento.status))}</span></div>
          <div class="fs-orc-info-card"><strong>Data</strong><span>${escapar(dataOrcamento(orcamento))}</span></div>
          <div class="fs-orc-info-card"><strong>Pagamento</strong><span>${escapar(orcamento.forma_pagamento_cliente || orcamento.forma_pagamento || orcamento.pagamento || '-')}</span></div>
          <div class="fs-orc-info-card" style="grid-column:1/-1"><strong>Link do cliente</strong><span>${escapar(link)}</span></div>
          <div class="fs-orc-info-card" style="grid-column:1/-1"><strong>Assunto/observações</strong><span>${escapar(assuntoOrcamento(orcamento))}</span></div>
        </div>
        <div class="botoes-modal">
          <a class="btn-primario-modal" href="${escapar(link)}" target="_blank" rel="noopener">Abrir link</a>
          <button type="button" class="btn-whatsapp-orcamento" onclick="enviarWhatsAppOrcamentoVisualizado()">Enviar WhatsApp</button>
          <button type="button" id="btn-pdf-orcamento-visualizado" class="btn-pdf-orcamento" onclick="baixarPdfOrcamentoVisualizado()">Baixar PDF</button>
          <a href="/gerador.html?orcamento=${encodeURIComponent(orcamento.id || '')}">Editar/usar como base</a>
        </div>`;
    }

    const modal = $('modal-visualizar-orcamento');
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fs-modal-form-lock');
  }

  function fecharModalVisualizar() {
    const modal = $('modal-visualizar-orcamento');
    if (!modal) return;
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fs-modal-form-lock');
  }

  function enviarWhatsAppOrcamentoVisualizado() {
    const orcamento = encontrarOrcamentoVisualizado();
    if (!orcamento) return alert('Abra um orçamento primeiro.');
    const telefone = String(clienteTelefone(orcamento) || '').replace(/\D/g, '');
    const telefoneFinal = telefone ? (telefone.startsWith('55') ? telefone : `55${telefone}`) : '';
    const link = linkPublicoOrcamento(orcamento);
    const mensagem = `Olá, ${clienteNome(orcamento)}! Segue seu orçamento ${numeroLista(orcamento)} no valor de ${moeda(totalOrcamento(orcamento))}: ${link}`;
    const url = telefoneFinal
      ? `https://wa.me/${telefoneFinal}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener');
  }

  function trocarAbaOrcamentos(status) { estado.filtroStatus = status || 'todos'; renderizarTabelaOrcamentos(); }
  function trocarPeriodoResumo(periodo) { estado.filtroPeriodo = periodo || 'total'; renderizarTabelaOrcamentos(); }
  function filtrarTabelaLocal() { estado.busca = $('filtro-busca')?.value || ''; renderizarTabelaOrcamentos(); }
  function toggleResumoFinanceiro() {
    const conteudo = document.querySelector('.resumo-conteudo');
    const btn = $('btn-toggle-resumo');
    if (!conteudo || !btn) return;
    const fechado = conteudo.style.display === 'none';
    conteudo.style.display = fechado ? 'block' : 'none';
    btn.textContent = fechado ? 'Minimizar ▲' : 'Expandir ▼';
  }

  function carregarHtml2Pdf() {
    return new Promise((resolve, reject) => {
      if (typeof window.html2pdf === 'function') return resolve();
      if ($('fs-html2pdf-orcamentos')) {
        const checar = setInterval(() => {
          if (typeof window.html2pdf === 'function') { clearInterval(checar); resolve(); }
        }, 120);
        setTimeout(() => { clearInterval(checar); typeof window.html2pdf === 'function' ? resolve() : reject(new Error('html2pdf não carregou.')); }, 8000);
        return;
      }
      const script = document.createElement('script');
      script.id = 'fs-html2pdf-orcamentos';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar html2pdf.'));
      document.head.appendChild(script);
    });
  }

  function linhasItens(itens) {
    const lista = Array.isArray(itens) ? itens.map(itemNormalizado) : [];
    if (!lista.length) return '<tr><td colspan="4" style="padding:12px;text-align:center;color:#777;">Nenhum item detalhado salvo.</td></tr>';
    return lista.map((item, indice) => `
      <tr style="background:${indice % 2 === 0 ? '#fff' : '#f8f8f8'};border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px;font-size:12px;color:#222;">${escapar(item.descricao)}</td>
        <td style="padding:10px;text-align:center;font-size:12px;color:#222;">${escapar(item.qtd)}</td>
        <td style="padding:10px;font-size:12px;color:#222;">${moeda(item.valor)}</td>
        <td style="padding:10px;text-align:right;font-size:12px;font-weight:bold;color:#222;">${moeda(item.subtotal)}</td>
      </tr>`).join('');
  }

  function montarHtml(orcamento, empresa) {
    const corPrimaria = getComputedStyle(document.documentElement).getPropertyValue('--fs-marrom')?.trim() || '#3e2723';
    const corDestaque = getComputedStyle(document.documentElement).getPropertyValue('--fs-amarelo')?.trim() || '#ffc400';
    const nomeEmpresa = empresa?.nome_empresa || empresa?.nome || localStorage.getItem('nome_empresa') || 'Empresa';
    const titulo = orcamento?.assunto || 'ORÇAMENTO';
    const numero = numeroOrcamento(orcamento);
    const logoHtml = empresa?.foto_url
      ? `<img src="${escapar(empresa.foto_url)}" crossorigin="anonymous" style="max-width:128px;max-height:58px;object-fit:contain;">`
      : `<strong style="font-size:22px;color:${corPrimaria};">FS</strong>`;

    return `
      <div style="width:794px;min-height:1123px;box-sizing:border-box;padding:30px;background:#fff;font-family:Arial,sans-serif;color:#222;">
        <div style="margin:-30px -30px 18px -30px;padding:18px 24px;background:${corPrimaria};color:#fff;border-bottom:4px solid ${corDestaque};display:flex;align-items:center;justify-content:space-between;gap:18px;">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;"><div style="width:82px;height:62px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${logoHtml}</div><div><h1 style="margin:0;font-size:24px;line-height:1.15;color:#fff;">${escapar(nomeEmpresa)}</h1><div style="font-size:11px;line-height:1.45;opacity:.92;">${empresa?.telefone_empresa ? `WhatsApp: ${escapar(empresa.telefone_empresa)}<br>` : ''}${empresa?.cnpj_empresa ? `CNPJ/CPF: ${escapar(empresa.cnpj_empresa)}` : ''}</div></div></div>
          <div style="text-align:right;font-size:11px;line-height:1.45;white-space:nowrap;">Gerado em<br><b>${new Date().toLocaleDateString('pt-BR')}</b><br>Nº ${escapar(numero)}</div>
        </div>
        <div style="background:#f7f2ea;border-left:6px solid ${corDestaque};border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;"><div style="width:55%;"><h2 style="margin:0 0 8px;color:${corPrimaria};font-size:22px;line-height:1.15;">${escapar(titulo)}</h2><div style="font-size:11px;line-height:1.5;color:#333;"><b>EMISSOR</b><br>${escapar(nomeEmpresa)}<br>${empresa?.telefone_empresa ? `WhatsApp: ${escapar(empresa.telefone_empresa)}<br>` : ''}${empresa?.endereco_empresa ? `Endereço: ${escapar(empresa.endereco_empresa)}<br>` : ''}${empresa?.cnpj_empresa ? `CNPJ/CPF: ${escapar(empresa.cnpj_empresa)}` : ''}</div></div><div style="width:45%;text-align:right;font-size:12px;line-height:1.5;color:#333;"><b>CLIENTE</b><br>${escapar(clienteNome(orcamento))}<br>${escapar(clienteTelefone(orcamento))}<br><b>Status:</b> ${escapar(statusOrcamento(orcamento?.status || 'pendente'))}</div></div>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;"><thead><tr style="background:${corPrimaria};color:#fff;"><th style="padding:10px;text-align:left;font-size:12px;">Item</th><th style="padding:10px;text-align:center;font-size:12px;">Qtd</th><th style="padding:10px;text-align:left;font-size:12px;">Unit.</th><th style="padding:10px;text-align:right;font-size:12px;">Subtotal</th></tr></thead><tbody>${linhasItens(orcamento?.itens)}</tbody></table>
        <div style="margin-top:22px;text-align:right;"><div style="display:inline-block;min-width:190px;background:#f7f2ea;border:1px solid #e0d6c8;border-radius:10px;padding:14px;"><span style="font-size:10px;color:#666;font-weight:bold;">VALOR TOTAL</span><br><strong style="font-size:22px;color:${corPrimaria};">${moeda(totalOrcamento(orcamento))}</strong></div></div>
        <div style="margin-top:44px;display:flex;justify-content:space-between;gap:30px;align-items:flex-end;"><div style="font-size:10px;color:#777;line-height:1.45;"><b>${escapar(nomeEmpresa)}</b><br>Orçamento Nº ${escapar(numero)}</div><div style="width:240px;text-align:center;font-size:10px;color:#777;"><div style="border-top:1px solid #999;padding-top:6px;">Assinatura / Aprovação</div></div></div>
      </div>`;
  }

  async function baixarPdfOrcamentoVisualizado() {
    const orcamento = encontrarOrcamentoVisualizado();
    if (!orcamento) { alert('Orçamento não encontrado para gerar PDF. Abra um orçamento novamente.'); return; }
    try {
      await carregarHtml2Pdf();
      const empresa = await obterEmpresa();
      const area = document.createElement('div');
      area.style.position = 'fixed'; area.style.left = '0'; area.style.top = '0'; area.style.width = '794px'; area.style.opacity = '0.01'; area.style.zIndex = '-1'; area.style.background = '#ffffff';
      area.innerHTML = montarHtml(orcamento, empresa);
      document.body.classList.add('gerando-pdf');
      document.body.appendChild(area);
      await html2pdf().set({ margin: 0, filename: `orcamento-${numeroOrcamento(orcamento)}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 }, jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } }).from(area.firstElementChild).save();
      area.remove();
      document.body.classList.remove('gerando-pdf');
    } catch (erro) {
      console.error('Erro ao gerar PDF do orçamento salvo:', erro);
      document.body.classList.remove('gerando-pdf');
      alert('Não foi possível gerar o PDF deste orçamento.');
    }
  }

  async function iniciar() {
    prepararHtmlExistente();
    const supabase = await aguardarSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    estado.session = data?.session || null;
    if (!estado.session?.user?.id) { mostrarAuth(); return; }
    estado.perfil = await obterPerfil(estado.session.user.id);
    estado.plano = estado.perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';
    localStorage.setItem('usuario_plano', estado.plano);
    if (!planoPago(estado.plano)) { mostrarGratis(); return; }
    mostrarApp();
    await carregarOrcamentos();
  }

  window.abrirModalVisualizar = abrirModalVisualizar;
  window.fecharModalVisualizar = fecharModalVisualizar;
  window.enviarWhatsAppOrcamentoVisualizado = enviarWhatsAppOrcamentoVisualizado;
  window.baixarPdfOrcamentoVisualizado = baixarPdfOrcamentoVisualizado;
  window.trocarAbaOrcamentos = trocarAbaOrcamentos;
  window.trocarPeriodoResumo = trocarPeriodoResumo;
  window.filtrarTabelaLocal = filtrarTabelaLocal;
  window.toggleResumoFinanceiro = toggleResumoFinanceiro;
  window.carregarOrcamentos = carregarOrcamentos;
  window.renderizarTabelaOrcamentos = renderizarTabelaOrcamentos;

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModalVisualizar(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();