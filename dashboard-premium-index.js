// FS Orçamentos - Dashboard Premium da página inicial
(function () {
  'use strict';

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_').trim();
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function valorOS(os) {
    return Number(os?.valor_total ?? os?.total ?? os?.valor ?? os?.total_geral ?? os?.valor_final ?? 0) || 0;
  }

  function valorProduto(produto) {
    return Number(produto?.valor_custo ?? produto?.preco_custo ?? produto?.custo ?? produto?.valor_venda ?? produto?.preco_venda ?? produto?.valor ?? produto?.preco ?? 0) || 0;
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

  function pagamentoPago(status) {
    return ['pago', 'quitado', 'recebido', 'concluido', 'concluida'].includes(normalizar(status));
  }

  function statusLabel(status) {
    const mapa = {
      pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado',
      aberta: 'Aberta', em_analise: 'Em análise', aguardando_aprovacao: 'Aguardando aprovação', em_execucao: 'Em execução',
      aguardando_material: 'Aguardando material', aguardando_peca: 'Aguardando peça', concluida: 'Concluída', cancelada: 'Cancelada'
    };
    const chave = normalizar(status || 'pendente');
    return mapa[chave] || status || 'Pendente';
  }

  function dataItem(item) {
    return item?.updated_at || item?.criado_em || item?.created_at || item?.data_abertura || item?.data || '';
  }

  async function buscarTabela(tabela, colunas, userId, opcoes = {}) {
    if (!window._supabase || !userId) return [];
    const camposUsuario = opcoes.camposUsuario || ['user_id', 'usuario_id', 'id_usuario'];

    for (const campo of camposUsuario) {
      let query = _supabase.from(tabela).select(colunas || '*').eq(campo, userId);
      if (opcoes.orderBy) query = query.order(opcoes.orderBy, { ascending: opcoes.ascending ?? false });
      if (opcoes.limit) query = query.limit(opcoes.limit);

      const { data, error } = await query;
      if (!error) return Array.isArray(data) ? data : [];

      const texto = String(error.message || error.details || error.hint || '').toLowerCase();
      const erroColuna = texto.includes('column') || texto.includes('schema cache') || texto.includes('could not find');
      if (!erroColuna) {
        console.warn(`Erro ao buscar ${tabela} no dashboard Premium:`, error);
        return [];
      }
    }
    return [];
  }

  function injetarEstilo() {
    if (document.getElementById('fs-dashboard-premium-index-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-dashboard-premium-index-style';
    style.textContent = `
      .premium-dashboard-oficina{display:grid;gap:18px}.premium-empresa-topo{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;background:linear-gradient(135deg,var(--fs-marrom,#3e2723),var(--fs-marrom-2,#2c1b17));color:#fff;border-radius:24px;padding:22px;box-shadow:0 14px 38px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12)}
      .premium-empresa-logo{width:74px;height:74px;border-radius:20px;background:#fff;color:var(--fs-marrom,#3e2723);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:26px;font-weight:950;border:3px solid var(--fs-amarelo,#ffc400);flex-shrink:0}.premium-empresa-logo img{width:100%;height:100%;object-fit:contain;padding:5px;box-sizing:border-box}.premium-empresa-info h2{margin:0 0 6px;color:#fff;font-size:26px;line-height:1.15}.premium-empresa-info p{margin:0;color:rgba(255,255,255,.82);font-weight:700;line-height:1.5}.premium-empresa-status{background:var(--fs-amarelo,#ffc400);color:var(--fs-marrom,#3e2723);border-radius:18px;padding:12px 14px;min-width:150px;text-align:center;font-weight:950;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
      .premium-dashboard-secao{background:linear-gradient(135deg,#fffaf0,#fff);border-radius:24px;padding:22px;border:1px solid rgba(62,39,35,.12);box-shadow:0 12px 28px rgba(0,0,0,.14);color:var(--fs-marrom,#3e2723)}.premium-secao-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:16px}.premium-secao-topo h3{margin:0 0 5px;font-size:22px;color:var(--fs-marrom,#3e2723)}.premium-secao-topo p{margin:0;color:#6d4c41;font-weight:650;line-height:1.45}
      .premium-metricas-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.premium-metrica-card{background:#fff;border-radius:18px;padding:16px;border:1px solid #eadfce;border-left:6px solid var(--fs-amarelo,#ffc400);min-height:112px;display:flex;flex-direction:column;gap:5px}.premium-metrica-card span{font-size:12px;color:#6d4c41;font-weight:900;text-transform:uppercase;letter-spacing:.25px}.premium-metrica-card strong{color:var(--fs-marrom,#3e2723);font-size:25px;line-height:1.1}.premium-metrica-card small{color:#7a6258;font-weight:650;line-height:1.35}.premium-metrica-card.destaque{background:linear-gradient(135deg,var(--fs-marrom,#3e2723),var(--fs-marrom-2,#2c1b17));border-left-color:var(--fs-amarelo,#ffc400)}.premium-metrica-card.destaque span,.premium-metrica-card.destaque small{color:rgba(255,255,255,.82)}.premium-metrica-card.destaque strong{color:var(--fs-amarelo,#ffc400)}
      .premium-graficos-grid,.premium-listas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.premium-grafico-card,.premium-lista-card{background:#fff;border-radius:20px;padding:18px;border:1px solid #eadfce;box-shadow:0 8px 18px rgba(0,0,0,.08)}.premium-grafico-card h4,.premium-lista-card h4{margin:0 0 12px;color:var(--fs-marrom,#3e2723);font-size:17px}.premium-chart-bar{display:grid;grid-template-columns:115px 1fr 46px;align-items:center;gap:10px;margin:10px 0;font-size:13px;font-weight:800;color:#5d4037}.premium-chart-track{height:12px;background:#efe7dc;border-radius:999px;overflow:hidden}.premium-chart-fill{height:100%;min-width:4px;background:linear-gradient(90deg,var(--fs-marrom,#3e2723),var(--fs-amarelo,#ffc400));border-radius:999px}
      .premium-atalhos-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.premium-atalho{display:flex;align-items:center;justify-content:center;text-align:center;min-height:46px;border-radius:14px;padding:10px 12px;background:var(--fs-marrom,#3e2723);color:var(--fs-amarelo,#ffc400)!important;border:1px solid var(--fs-amarelo,#ffc400);font-weight:950;text-decoration:none;box-shadow:0 8px 18px rgba(0,0,0,.12)}.premium-atalho.secundario{background:#fff;color:var(--fs-marrom,#3e2723)!important;border-color:#d8c8b5}.premium-lista-card{min-height:180px}.premium-lista-item{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #f0e7dc;padding:10px 0;color:#4e342e;font-weight:750}.premium-lista-item:last-child{border-bottom:0}.premium-lista-item span{display:block;font-size:12px;color:#7a6258;font-weight:650;margin-top:3px}.premium-lista-item strong{white-space:nowrap;color:var(--fs-marrom,#3e2723)}.premium-insight-box{background:#fff7df;border-left:7px solid var(--fs-amarelo,#ffc400);border-radius:18px;padding:16px;color:var(--fs-marrom,#3e2723);font-weight:800;line-height:1.55}
      @media(max-width:920px){.premium-empresa-topo,.premium-graficos-grid,.premium-listas-grid{grid-template-columns:1fr}.premium-metricas-grid,.premium-atalhos-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.premium-metricas-grid,.premium-atalhos-grid{grid-template-columns:1fr}.premium-chart-bar{grid-template-columns:88px 1fr 38px;gap:7px}.premium-empresa-topo{padding:16px}}
    `;
    document.head.appendChild(style);
  }

  function secaoOS() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>🛠️ Ordens de serviço</h3><p>Status operacional para saber o que está parado, em execução ou pronto para faturar.</p></div><a href="/ordens.html" class="premium-atalho secundario">Abrir OSs</a></div><div class="premium-metricas-grid"><div class="premium-metrica-card"><span>Total de OS</span><strong id="home-premium-os-total">0</strong><small>Todas as ordens registradas</small></div><div class="premium-metrica-card"><span>Abertas</span><strong id="home-premium-os-abertas">0</strong><small>Aguardando análise ou aprovação</small></div><div class="premium-metrica-card"><span>Em execução</span><strong id="home-premium-os-execucao">0</strong><small>Serviços em andamento</small></div><div class="premium-metrica-card"><span>Concluídas</span><strong id="home-premium-os-concluidas">0</strong><small>Serviços finalizados</small></div><div class="premium-metrica-card destaque"><span>Faturamento em OS</span><strong id="home-premium-faturamento">R$ 0,00</strong><small>OS concluídas/pagas</small></div><div class="premium-metrica-card"><span>A receber</span><strong id="home-premium-os-receber">R$ 0,00</strong><small>OS sem pagamento</small></div><div class="premium-metrica-card"><span>Ticket médio</span><strong id="home-premium-ticket-os">R$ 0,00</strong><small>Média das OS com valor</small></div><div class="premium-metrica-card"><span>Pagamentos pendentes</span><strong id="home-premium-os-pagamento-pendente">0</strong><small>OS sem baixa de pagamento</small></div></div><div class="premium-atalhos-grid"><a href="/ordens.html?status=aberta" class="premium-atalho">OS abertas</a><a href="/ordens.html?status=em_execucao" class="premium-atalho">Em execução</a><a href="/ordens.html?status=concluida" class="premium-atalho">Concluídas</a><a href="/relatorios.html" class="premium-atalho secundario">Relatórios</a></div></section>`; }
  function secaoOrcamentos() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>🧾 Orçamentos</h3><p>Acompanhe oportunidades, pendências e aprovação para transformar venda em execução.</p></div><a href="/orcamentos.html" class="premium-atalho secundario">Abrir orçamentos</a></div><div class="premium-metricas-grid"><div class="premium-metrica-card"><span>Total</span><strong id="home-premium-orc-total">0</strong><small>Orçamentos salvos</small></div><div class="premium-metrica-card"><span>Pendentes</span><strong id="home-premium-orc-pendentes">0</strong><small>Aguardando cliente</small></div><div class="premium-metrica-card"><span>Aprovados</span><strong id="home-premium-orc-aprovados">0</strong><small>Vendidos ou em serviço</small></div><div class="premium-metrica-card"><span>Recusados</span><strong id="home-premium-orc-recusados">0</strong><small>Propostas perdidas</small></div><div class="premium-metrica-card destaque"><span>Valor aprovado</span><strong id="home-premium-orc-valor-aprovado">R$ 0,00</strong><small>Potencial convertido</small></div><div class="premium-metrica-card"><span>Valor pendente</span><strong id="home-premium-orc-valor-pendente">R$ 0,00</strong><small>Follow-up necessário</small></div><div class="premium-metrica-card"><span>Taxa de aprovação</span><strong id="home-premium-taxa-aprovacao">0%</strong><small>Aprovados sobre respondidos</small></div><div class="premium-metrica-card"><span>Convertidos em OS</span><strong id="home-premium-orc-convertidos">0</strong><small>Orçamentos operacionalizados</small></div></div><div class="premium-atalhos-grid"><a href="/gerador.html" class="premium-atalho">Novo orçamento</a><a href="/orcamentos.html?status=pendente" class="premium-atalho">Pendentes</a><a href="/orcamentos.html?status=aprovado" class="premium-atalho">Aprovados</a><a href="/orcamentos.html?periodo=30" class="premium-atalho secundario">Últimos 30 dias</a></div></section>`; }
  function secaoClientes() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>👤 Clientes e veículos</h3><p>Base comercial e histórico para atendimento mais rápido e profissional.</p></div><a href="/clientes.html" class="premium-atalho secundario">Abrir clientes</a></div><div class="premium-metricas-grid"><div class="premium-metrica-card"><span>Clientes</span><strong id="home-premium-clientes">0</strong><small>Cadastros ativos</small></div><div class="premium-metrica-card"><span>Veículos</span><strong id="home-premium-veiculos">0</strong><small>Veículos vinculados</small></div><div class="premium-metrica-card"><span>Média veículos/cliente</span><strong id="home-premium-media-veiculos">0</strong><small>Indicador de carteira</small></div><div class="premium-metrica-card"><span>Clientes sem veículo</span><strong id="home-premium-clientes-sem-veiculo">0</strong><small>Cadastros para completar</small></div></div><div class="premium-atalhos-grid"><a href="/clientes.html" class="premium-atalho">Cadastrar cliente</a><a href="/veiculos.html" class="premium-atalho">Cadastrar veículo</a><a href="/clientes.html?filtro=sem_veiculo" class="premium-atalho secundario">Completar cadastros</a><a href="/agenda.html" class="premium-atalho secundario">Agendar serviço</a></div></section>`; }
  function secaoEstoque() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>📦 Estoque</h3><p>Controle peças e materiais para evitar parar serviço por falta de item.</p></div><a href="/estoque.html" class="premium-atalho secundario">Abrir estoque</a></div><div class="premium-metricas-grid"><div class="premium-metrica-card"><span>Produtos/peças</span><strong id="home-premium-produtos">0</strong><small>Itens cadastrados</small></div><div class="premium-metrica-card"><span>Estoque baixo</span><strong id="home-premium-estoque-baixo">0</strong><small>Comprar ou repor</small></div><div class="premium-metrica-card"><span>Zerados</span><strong id="home-premium-estoque-zerado">0</strong><small>Itens sem saldo</small></div><div class="premium-metrica-card destaque"><span>Valor estimado</span><strong id="home-premium-valor-estoque">R$ 0,00</strong><small>Quantidade x valor</small></div></div><div class="premium-atalhos-grid"><a href="/estoque.html" class="premium-atalho">Ver estoque</a><a href="/estoque.html?filtro=baixo" class="premium-atalho">Estoque baixo</a><a href="/estoque.html?acao=novo" class="premium-atalho secundario">Novo item</a><a href="/ordens.html" class="premium-atalho secundario">Usar em OS</a></div></section>`; }
  function secaoGraficos() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>📊 Gráficos da operação</h3><p>Distribuição rápida para identificar gargalos e prioridades.</p></div><a href="/relatorios.html" class="premium-atalho secundario">Ver relatórios</a></div><div class="premium-graficos-grid"><div class="premium-grafico-card"><h4>OS por status</h4><div id="home-grafico-os-status">Carregando gráfico...</div></div><div class="premium-grafico-card"><h4>Orçamentos por status</h4><div id="home-grafico-orc-status">Carregando gráfico...</div></div></div></section>`; }
  function secaoListas() { return `<section class="premium-dashboard-secao"><div class="premium-secao-topo"><div><h3>🧭 Últimos movimentos</h3><p>Atalhos para continuar de onde parou, limitado aos 5 registros mais recentes.</p></div><a href="/painel.html" class="premium-atalho secundario">Painel completo</a></div><div class="premium-listas-grid"><div class="premium-lista-card"><h4>Últimas OSs</h4><div id="home-premium-ultimas-os">Carregando...</div></div><div class="premium-lista-card"><h4>Últimos orçamentos</h4><div id="home-premium-ultimos-orcamentos">Carregando...</div></div></div></section>`; }

  function substituirHtmlPremium() {
    const secao = document.getElementById('home-plano-premium');
    if (!secao || secao.dataset.dashboardPremiumCompleto === 'true') return;
    secao.dataset.dashboardPremiumCompleto = 'true';
    secao.innerHTML = `<div class="premium-dashboard-oficina"><section class="premium-empresa-topo" aria-label="Dados da empresa"><div class="premium-empresa-logo" id="home-premium-logo">FS</div><div class="premium-empresa-info"><h2 id="home-premium-empresa-nome">Carregando empresa...</h2><p id="home-premium-empresa-dados">WhatsApp, endereço e documento aparecem aqui quando cadastrados no painel.</p></div><div class="premium-empresa-status" id="home-premium-plano-status">Premium ativo</div></section><div class="home-plano-hero"><span class="home-plano-tag">Plano Premium ativo</span><h1>Dashboard da oficina</h1><p>Acompanhe a saúde da operação em uma única página: OSs, orçamentos, clientes, veículos, estoque e faturamento.</p><div class="home-plano-acoes"><button type="button" class="btn-home-medio" onclick="abrirGeradorHomeProtegido()">🧾 Novo orçamento</button><a href="/ordens.html" class="btn-home-atalho">🛠️ Nova OS</a><a href="/clientes.html" class="btn-home-atalho">👤 Novo cliente</a><a href="/estoque.html" class="btn-home-atalho">📦 Estoque</a></div></div>${secaoOS()}${secaoOrcamentos()}${secaoClientes()}${secaoEstoque()}${secaoGraficos()}${secaoListas()}<section class="premium-insight-box" id="home-premium-insight">Carregando indicadores do Premium...</section></div>`;
  }

  function renderGrafico(id, dados) {
    const el = document.getElementById(id);
    if (!el) return;
    const entradas = Object.entries(dados || {});
    const total = entradas.reduce((soma, [, valor]) => soma + Number(valor || 0), 0);
    if (!total) {
      el.innerHTML = '<div class="msg-vazia">Sem dados suficientes para montar o gráfico.</div>';
      return;
    }
    el.innerHTML = entradas.map(([label, valor]) => {
      const qtd = Number(valor || 0);
      const pct = total ? Math.max(3, Math.round((qtd / total) * 100)) : 0;
      return `<div class="premium-chart-bar"><span>${label}</span><div class="premium-chart-track"><div class="premium-chart-fill" style="width:${pct}%"></div></div><strong>${qtd}</strong></div>`;
    }).join('');
  }

  function renderLista(id, itens, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!Array.isArray(itens) || !itens.length) {
      el.innerHTML = '<div class="msg-vazia">Nenhum registro recente encontrado.</div>';
      return;
    }
    el.innerHTML = itens.slice(0, 5).map(item => {
      if (tipo === 'os') {
        const numero = item.numero_os || item.numero_ordem || item.numero || '-';
        const cliente = item.cliente_nome || item.nome_cliente || item.cliente || 'Cliente não informado';
        const veiculo = [item.marca, item.modelo, item.placa].filter(Boolean).join(' · ');
        return `<div class="premium-lista-item"><div>OS ${numero}<span>${cliente}${veiculo ? ' · ' + veiculo : ''} · ${statusLabel(item.status || 'aberta')}</span></div><strong>${moeda(valorOS(item))}</strong></div>`;
      }
      const numero = item.numero_orcamento || item.numero || '-';
      return `<div class="premium-lista-item"><div>Nº ${numero}<span>${item.assunto || 'Orçamento'} · ${item.cliente_nome || 'Cliente não informado'} · ${statusLabel(item.status || 'pendente')}</span></div><strong>${moeda(Number(item.total || 0))}</strong></div>`;
    }).join('');
  }

  async function preencherEmpresa(userId) {
    const perfis = await buscarTabela('perfis', '*', userId, { camposUsuario: ['id'], limit: 1 });
    const perfil = perfis[0] || {};
    const nome = perfil.nome_empresa || localStorage.getItem('nome_empresa') || perfil.nome || 'Sua oficina';
    const partes = [perfil.telefone_empresa || localStorage.getItem('telefone_empresa'), perfil.endereco_empresa || localStorage.getItem('endereco_empresa'), perfil.cnpj_empresa || localStorage.getItem('cnpj_empresa')].filter(Boolean);
    setTexto('home-premium-empresa-nome', nome);
    setTexto('home-premium-empresa-dados', partes.length ? partes.join(' · ') : 'Complete WhatsApp, endereço e CNPJ/CPF no Painel.');
    setTexto('home-premium-plano-status', perfil.plano_status === 'teste_gratis' ? 'Premium em teste' : 'Premium ativo');
    const logo = document.getElementById('home-premium-logo');
    const foto = perfil.foto_url || localStorage.getItem('foto_url') || '';
    if (logo) logo.innerHTML = foto ? `<img src="${foto}" alt="Logo da empresa">` : (nome.trim().slice(0, 2).toUpperCase() || 'FS');
  }

  async function preencherDashboardPremium(userId, orcamentos = []) {
    substituirHtmlPremium();
    await preencherEmpresa(userId);

    const [ordens, produtos, clientes, veiculos] = await Promise.all([
      buscarTabela('ordens_servico', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false }),
      buscarTabela('produtos_estoque', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'nome', ascending: true }),
      buscarTabela('clientes', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false }),
      buscarTabela('veiculos', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false })
    ]);

    const orcTotal = orcamentos.length;
    const orcPendentes = orcamentos.filter(o => normalizar(o.status || 'pendente') === 'pendente').length;
    const orcAprovados = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(normalizar(o.status))).length;
    const orcRecusados = orcamentos.filter(o => normalizar(o.status) === 'recusado').length;
    const orcValorAprovado = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(normalizar(o.status))).reduce((s, o) => s + Number(o.total || 0), 0);
    const orcValorPendente = orcamentos.filter(o => normalizar(o.status || 'pendente') === 'pendente').reduce((s, o) => s + Number(o.total || 0), 0);
    const respondidos = orcAprovados + orcRecusados;
    const taxa = respondidos ? Math.round((orcAprovados / respondidos) * 100) : 0;
    const convertidos = orcamentos.filter(o => !!o.ordem_servico_id || ['em_servico', 'finalizado'].includes(normalizar(o.status))).length;

    setTexto('home-premium-orc-total', orcTotal); setTexto('home-premium-orc-pendentes', orcPendentes); setTexto('home-premium-orc-aprovados', orcAprovados); setTexto('home-premium-orc-recusados', orcRecusados); setTexto('home-premium-orc-valor-aprovado', moeda(orcValorAprovado)); setTexto('home-premium-orc-valor-pendente', moeda(orcValorPendente)); setTexto('home-premium-taxa-aprovacao', `${taxa}%`); setTexto('home-premium-orc-convertidos', convertidos);

    const osTotal = ordens.length;
    const abertas = ordens.filter(os => statusAberto(os.status)).length;
    const execucao = ordens.filter(os => statusExecucao(os.status)).length;
    const concluidas = ordens.filter(os => statusConcluido(os.status)).length;
    const pagas = ordens.filter(os => pagamentoPago(os.status_pagamento));
    const faturamento = pagas.reduce((s, os) => s + valorOS(os), 0);
    const pendPgto = ordens.filter(os => valorOS(os) > 0 && !pagamentoPago(os.status_pagamento)).length;
    const receber = ordens.filter(os => valorOS(os) > 0 && !pagamentoPago(os.status_pagamento)).reduce((s, os) => s + valorOS(os), 0);
    const comValor = ordens.filter(os => valorOS(os) > 0);
    const ticket = comValor.length ? comValor.reduce((s, os) => s + valorOS(os), 0) / comValor.length : 0;

    setTexto('home-premium-os-total', osTotal); setTexto('home-premium-os-abertas', abertas); setTexto('home-premium-os-execucao', execucao); setTexto('home-premium-os-concluidas', concluidas); setTexto('home-premium-faturamento', moeda(faturamento)); setTexto('home-premium-os-receber', moeda(receber)); setTexto('home-premium-ticket-os', moeda(ticket)); setTexto('home-premium-os-pagamento-pendente', pendPgto);

    const clientesComVeiculo = new Set(veiculos.map(v => v.cliente_id || v.id_cliente || v.cliente_cadastrado_id).filter(Boolean));
    setTexto('home-premium-clientes', clientes.length); setTexto('home-premium-veiculos', veiculos.length); setTexto('home-premium-media-veiculos', clientes.length ? (veiculos.length / clientes.length).toFixed(1).replace('.', ',') : '0'); setTexto('home-premium-clientes-sem-veiculo', Math.max(0, clientes.length - clientesComVeiculo.size));

    const ativos = produtos.filter(p => p.ativo !== false);
    const baixo = ativos.filter(p => p.controlar_estoque !== false && Number(p.estoque_minimo ?? p.minimo ?? 0) > 0 && Number(p.quantidade_atual ?? p.quantidade ?? p.estoque ?? 0) <= Number(p.estoque_minimo ?? p.minimo ?? 0)).length;
    const zerado = ativos.filter(p => p.controlar_estoque !== false && Number(p.quantidade_atual ?? p.quantidade ?? p.estoque ?? 0) <= 0).length;
    const valorEstoque = ativos.reduce((s, p) => s + (Number(p.quantidade_atual ?? p.quantidade ?? p.estoque ?? 0) * valorProduto(p)), 0);
    setTexto('home-premium-produtos', ativos.length); setTexto('home-premium-estoque-baixo', baixo); setTexto('home-premium-estoque-zerado', zerado); setTexto('home-premium-valor-estoque', moeda(valorEstoque));

    renderGrafico('home-grafico-os-status', { Abertas: abertas, Execução: execucao, Concluídas: concluidas, 'Pend. pgto': pendPgto });
    renderGrafico('home-grafico-orc-status', { Pendentes: orcPendentes, Aprovados: orcAprovados, Recusados: orcRecusados, Convertidos: convertidos });
    renderLista('home-premium-ultimas-os', [...ordens].sort((a, b) => new Date(dataItem(b)) - new Date(dataItem(a))).slice(0, 5), 'os');
    renderLista('home-premium-ultimos-orcamentos', [...orcamentos].sort((a, b) => new Date(dataItem(b)) - new Date(dataItem(a))).slice(0, 5), 'orcamento');

    let insight = `Hoje sua oficina tem ${abertas} OS aberta(s), ${execucao} em execução, ${orcPendentes} orçamento(s) pendente(s) e ${baixo} item(ns) com estoque baixo.`;
    if (baixo > 0 || zerado > 0) insight += ' Prioridade: revisar o estoque antes de iniciar novas OSs que dependam de peças.';
    else if (pendPgto > 0) insight += ' Prioridade: cobrar ou registrar pagamento das OSs pendentes para melhorar o caixa.';
    else if (orcPendentes > 0) insight += ' Prioridade: fazer follow-up dos orçamentos pendentes para aumentar a taxa de aprovação.';
    else if (execucao > 0) insight += ' Prioridade: finalizar OSs em execução para liberar faturamento e histórico.';
    else insight += ' Operação organizada. Aproveite para cadastrar novos clientes, veículos e oportunidades.';
    setTexto('home-premium-insight', insight);
  }

  function iniciar() {
    injetarEstilo();
    substituirHtmlPremium();
    window.homeIndexPreencherPremium = preencherDashboardPremium;
    if (typeof window.atualizarHomePorPlanoIndex === 'function') {
      window.atualizarHomePorPlanoIndex();
      setTimeout(window.atualizarHomePorPlanoIndex, 900);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
