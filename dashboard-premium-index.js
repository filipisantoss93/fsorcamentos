// FS Orçamentos - Dashboard Premium da página inicial
// Regra: Premium vê dashboard operacional; Grátis/Básico continuam com a home normal.
(function () {
  'use strict';

  const FS_DASHBOARD_VERSION = '2026-06-08-premium-dashboard-v3-grid-2';
  let observerInstalado = false;
  let atualizando = false;

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_')
      .trim();
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function numero(valor) {
    return Number(valor || 0) || 0;
  }

  function valorOS(os) {
    return numero(os?.valor_total ?? os?.total ?? os?.valor ?? os?.total_geral ?? os?.valor_final ?? 0);
  }

  function quantidadeProduto(produto) {
    return numero(produto?.quantidade_atual ?? produto?.quantidade ?? produto?.estoque ?? produto?.saldo ?? 0);
  }

  function valorProduto(produto) {
    return numero(produto?.valor_custo ?? produto?.preco_custo ?? produto?.custo ?? produto?.valor_venda ?? produto?.preco_venda ?? produto?.valor ?? produto?.preco ?? 0);
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

  function dataItem(item) {
    return item?.updated_at || item?.criado_em || item?.created_at || item?.data_abertura || item?.data || '';
  }

  async function aguardarSupabase(tentativas = 35) {
    for (let i = 0; i < tentativas; i++) {
      if (window._supabase) return true;
      if (typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
        if (window._supabase) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  async function obterContexto() {
    try {
      const ok = await aguardarSupabase();
      if (!ok) return { premium: false, plano: 'gratis', userId: null, perfil: null, status: 'ativo' };

      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) return { premium: false, plano: 'gratis', userId: null, perfil: null, status: 'ativo' };

      try { await _supabase.rpc('verificar_expiracao_teste_premium'); } catch (_) {}

      const { data: perfil, error } = await _supabase
        .from('perfis')
        .select('id, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em, teste_premium_fim')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) console.warn('Dashboard Premium: erro ao carregar perfil:', error);

      const plano = normalizar(perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis');
      const status = normalizar(perfil?.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo');
      const premium = plano === 'premium' && !['cancelado', 'expirado'].includes(status);

      localStorage.setItem('usuario_plano', plano);
      if (perfil?.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
      if (perfil?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
      else localStorage.removeItem('usuario_plano_expira_em');
      if (perfil?.nome_empresa) localStorage.setItem('nome_empresa', perfil.nome_empresa);
      if (perfil?.telefone_empresa) localStorage.setItem('telefone_empresa', perfil.telefone_empresa);
      if (perfil?.endereco_empresa) localStorage.setItem('endereco_empresa', perfil.endereco_empresa);
      if (perfil?.cnpj_empresa) localStorage.setItem('cnpj_empresa', perfil.cnpj_empresa);
      if (perfil?.foto_url) localStorage.setItem('foto_url', perfil.foto_url);

      return { premium, plano, status, userId: session.user.id, perfil: perfil || null };
    } catch (error) {
      console.warn('Dashboard Premium: erro ao obter contexto:', error);
      return { premium: false, plano: 'gratis', userId: null, perfil: null, status: 'ativo' };
    }
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

      const textoErro = String(error.message || error.details || error.hint || '').toLowerCase();
      const erroEstrutura = textoErro.includes('column') || textoErro.includes('schema cache') || textoErro.includes('could not find') || textoErro.includes('relation') || textoErro.includes('does not exist');
      if (!erroEstrutura) {
        console.warn(`Dashboard Premium: erro ao buscar ${tabela}:`, error);
        return [];
      }
    }

    return [];
  }

  function esconderTesteGratisParaPremium() {
    const seletores = [
      '#teste-premium-topo', '#bloco-teste-premium', '#card-teste-premium', '#teste-gratis-premium', '#box-teste-gratis-premium',
      '.teste-premium-topo', '.bloco-teste-premium', '.card-teste-premium', '.teste-gratis-premium', '.fs-teste-premium',
      '[data-teste-premium]', '[data-premium-trial]'
    ];

    seletores.forEach(seletor => {
      document.querySelectorAll(seletor).forEach(el => {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      });
    });

    document.querySelectorAll('a, button').forEach(el => {
      const texto = (el.textContent || '').toLowerCase();
      if (texto.includes('teste premium') || texto.includes('testar premium') || texto.includes('teste grátis premium') || texto.includes('teste gratis premium')) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function injetarEstilo() {
    if (document.getElementById('fs-dashboard-premium-index-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-dashboard-premium-index-style';
    style.textContent = `
      .home-visao-plano:not(.ativo){display:none!important;}
      .home-visao-plano.ativo{display:block!important;}
      #home-plano-premium.fs-dashboard-premium-pronto{max-width:1180px;margin:0 auto;padding:24px 12px 52px;box-sizing:border-box;}
      .premium-dashboard-oficina{display:grid;gap:18px;}
      .premium-empresa-topo{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;background:linear-gradient(135deg,var(--fs-marrom,#3e2723),var(--fs-marrom-2,#2c1b17));color:#fff;border-radius:24px;padding:20px;box-shadow:0 14px 38px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12);}
      .premium-empresa-logo{width:74px;height:74px;border-radius:20px;background:#fff;color:var(--fs-marrom,#3e2723);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:26px;font-weight:950;border:3px solid var(--fs-amarelo,#ffc400);flex-shrink:0;}
      .premium-empresa-logo img{width:100%;height:100%;object-fit:contain;padding:5px;box-sizing:border-box;}
      .premium-empresa-info h2{margin:0 0 6px;color:#fff;font-size:25px;line-height:1.15;}
      .premium-empresa-info p{margin:0;color:rgba(255,255,255,.84);font-weight:700;line-height:1.5;}
      .premium-empresa-status{background:var(--fs-amarelo,#ffc400);color:var(--fs-marrom,#3e2723);border-radius:18px;padding:12px 14px;min-width:150px;text-align:center;font-weight:950;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12);}
      .premium-dashboard-secao{background:linear-gradient(135deg,#fffaf0,#fff);border-radius:24px;padding:20px;border:1px solid rgba(62,39,35,.12);box-shadow:0 12px 28px rgba(0,0,0,.14);color:var(--fs-marrom,#3e2723);}
      .premium-secao-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:16px;}
      .premium-secao-topo h3{margin:0 0 5px;font-size:22px;color:var(--fs-marrom,#3e2723);}
      .premium-secao-topo p{margin:0;color:#6d4c41;font-weight:650;line-height:1.45;}
      .premium-metricas-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:stretch;}
      .premium-metrica-card{background:#fff;border-radius:18px;padding:15px;border:1px solid #eadfce;border-left:6px solid var(--fs-amarelo,#ffc400);min-height:108px;display:flex;flex-direction:column;gap:5px;box-sizing:border-box;min-width:0;}
      .premium-metrica-card span{font-size:11px;color:#6d4c41;font-weight:900;text-transform:uppercase;letter-spacing:.25px;line-height:1.25;}
      .premium-metrica-card strong{color:var(--fs-marrom,#3e2723);font-size:24px;line-height:1.08;word-break:break-word;}
      .premium-metrica-card small{color:#7a6258;font-weight:650;line-height:1.35;}
      .premium-metrica-card.destaque{background:linear-gradient(135deg,var(--fs-marrom,#3e2723),var(--fs-marrom-2,#2c1b17));border-left-color:var(--fs-amarelo,#ffc400);}
      .premium-metrica-card.destaque span,.premium-metrica-card.destaque small{color:rgba(255,255,255,.82);}
      .premium-metrica-card.destaque strong{color:var(--fs-amarelo,#ffc400);}
      .premium-graficos-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
      .premium-listas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
      .premium-grafico-card,.premium-lista-card{background:#fff;border-radius:20px;padding:18px;border:1px solid #eadfce;box-shadow:0 8px 18px rgba(0,0,0,.08);min-width:0;}
      .premium-grafico-card h4,.premium-lista-card h4{margin:0 0 12px;color:var(--fs-marrom,#3e2723);font-size:17px;}
      .premium-chart-bar{display:grid;grid-template-columns:115px 1fr 46px;align-items:center;gap:10px;margin:10px 0;font-size:13px;font-weight:800;color:#5d4037;}
      .premium-chart-track{height:12px;background:#efe7dc;border-radius:999px;overflow:hidden;}
      .premium-chart-fill{height:100%;min-width:4px;background:linear-gradient(90deg,var(--fs-marrom,#3e2723),var(--fs-amarelo,#ffc400));border-radius:999px;}
      .premium-atalhos-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px;}
      .premium-atalho{display:flex;align-items:center;justify-content:center;text-align:center;min-height:46px;border-radius:14px;padding:10px 12px;background:var(--fs-marrom,#3e2723);color:var(--fs-amarelo,#ffc400)!important;border:1px solid var(--fs-amarelo,#ffc400);font-weight:950;text-decoration:none;box-shadow:0 8px 18px rgba(0,0,0,.12);box-sizing:border-box;}
      .premium-atalho.secundario{background:#fff;color:var(--fs-marrom,#3e2723)!important;border-color:#d8c9b8;}
      .premium-lista-card{min-height:180px;}
      .premium-lista-item{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #f0e7dc;padding:10px 0;color:#4e342e;font-weight:750;}
      .premium-lista-item:last-child{border-bottom:0;}
      .premium-lista-item span{display:block;font-size:12px;color:#7a6258;font-weight:650;margin-top:3px;}
      .premium-lista-item strong{white-space:nowrap;color:var(--fs-marrom,#3e2723);}
      .premium-insight-box{background:#fff7df;border-left:7px solid var(--fs-amarelo,#ffc400);border-radius:18px;padding:16px;color:var(--fs-marrom,#3e2723);font-weight:800;line-height:1.55;}
      .premium-msg-vazia{color:#7a6258;font-weight:750;padding:12px;background:#fffaf0;border-radius:12px;border:1px dashed #e0d6c8;}
      @media(max-width:920px){.premium-empresa-topo,.premium-graficos-grid,.premium-listas-grid{grid-template-columns:1fr;}.premium-atalhos-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.premium-metricas-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}
      @media(max-width:560px){#home-plano-premium.fs-dashboard-premium-pronto{padding-left:8px;padding-right:8px;}.premium-dashboard-secao{padding:14px;border-radius:20px;}.premium-empresa-topo{grid-template-columns:1fr;padding:16px;}.premium-metricas-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}.premium-metrica-card{padding:11px;min-height:104px;border-radius:15px;border-left-width:5px;}.premium-metrica-card span{font-size:10px;}.premium-metrica-card strong{font-size:19px;}.premium-metrica-card small{font-size:11px;}.premium-atalhos-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.premium-chart-bar{grid-template-columns:82px 1fr 34px;gap:7px;font-size:12px;}}
    `;
    document.head.appendChild(style);
  }

  function card(rotulo, id, descricao, destaque = false) {
    return `<div class="premium-metrica-card${destaque ? ' destaque' : ''}"><span>${rotulo}</span><strong id="${id}">0</strong><small>${descricao}</small></div>`;
  }

  function secao(titulo, descricao, link, textoLink, cards, atalhos) {
    return `
      <section class="premium-dashboard-secao">
        <div class="premium-secao-topo">
          <div><h3>${titulo}</h3><p>${descricao}</p></div>
          ${link ? `<a href="${link}" class="premium-atalho secundario">${textoLink}</a>` : ''}
        </div>
        <div class="premium-metricas-grid">${cards.join('')}</div>
        ${atalhos?.length ? `<div class="premium-atalhos-grid">${atalhos.map(a => `<a href="${a.href}" class="premium-atalho${a.secundario ? ' secundario' : ''}">${a.texto}</a>`).join('')}</div>` : ''}
      </section>`;
  }

  function montarDashboardHtml() {
    return `
      <div class="premium-dashboard-oficina" data-dashboard-version="${FS_DASHBOARD_VERSION}">
        <section class="premium-empresa-topo" aria-label="Dados da empresa">
          <div class="premium-empresa-logo" id="home-premium-logo">FS</div>
          <div class="premium-empresa-info"><h2 id="home-premium-empresa-nome">Carregando empresa...</h2><p id="home-premium-empresa-dados">WhatsApp, endereço e documento aparecem aqui quando cadastrados no painel.</p></div>
          <div class="premium-empresa-status" id="home-premium-plano-status">Premium ativo</div>
        </section>

        <div class="home-plano-hero">
          <span class="home-plano-tag">Plano Premium ativo</span>
          <h1>Dashboard da oficina</h1>
          <p>Acompanhe a saúde da operação em uma única página: OSs, orçamentos, clientes, veículos, estoque e faturamento.</p>
          <div class="home-plano-acoes"><button type="button" class="btn-home-medio" onclick="abrirGeradorHomeProtegido()">🧾 Novo orçamento</button><a href="/ordens.html" class="btn-home-atalho">🛠️ Nova OS</a><a href="/clientes.html" class="btn-home-atalho">👤 Novo cliente</a><a href="/estoque.html" class="btn-home-atalho">📦 Estoque</a></div>
        </div>

        ${secao('🛠️ Ordens de serviço', 'Status operacional para saber o que está parado, em execução ou pronto para faturar.', '/ordens.html', 'Abrir OSs', [
          card('Total de OS', 'home-premium-os-total', 'Todas as ordens registradas'),
          card('Abertas', 'home-premium-os-abertas', 'Aguardando análise ou aprovação'),
          card('Em execução', 'home-premium-os-execucao', 'Serviços em andamento'),
          card('Concluídas', 'home-premium-os-concluidas', 'Serviços finalizados'),
          card('Faturamento em OS', 'home-premium-faturamento', 'OS concluídas/pagas', true),
          card('A receber', 'home-premium-os-receber', 'OS sem pagamento'),
          card('Ticket médio', 'home-premium-ticket-os', 'Média das OS com valor'),
          card('Pagamentos pendentes', 'home-premium-os-pagamento-pendente', 'OS sem baixa de pagamento')
        ], [
          { href: '/ordens.html?status=aberta', texto: 'OS abertas' }, { href: '/ordens.html?status=em_execucao', texto: 'Em execução' }, { href: '/ordens.html?status=concluida', texto: 'Concluídas' }, { href: '/relatorios.html', texto: 'Relatórios', secundario: true }
        ])}

        ${secao('🧾 Orçamentos', 'Acompanhe oportunidades, pendências e aprovação para transformar venda em execução.', '/orcamentos.html', 'Abrir orçamentos', [
          card('Total', 'home-premium-orc-total', 'Orçamentos salvos'),
          card('Pendentes', 'home-premium-orc-pendentes', 'Aguardando cliente'),
          card('Aprovados', 'home-premium-orc-aprovados', 'Vendidos ou em serviço'),
          card('Recusados', 'home-premium-orc-recusados', 'Propostas perdidas'),
          card('Valor aprovado', 'home-premium-orc-valor-aprovado', 'Potencial convertido', true),
          card('Valor pendente', 'home-premium-orc-valor-pendente', 'Follow-up necessário'),
          card('Taxa de aprovação', 'home-premium-taxa-aprovacao', 'Aprovados sobre respondidos'),
          card('Convertidos em OS', 'home-premium-orc-convertidos', 'Orçamentos operacionalizados')
        ], [
          { href: '/gerador.html', texto: 'Novo orçamento' }, { href: '/orcamentos.html?status=pendente', texto: 'Pendentes' }, { href: '/orcamentos.html?status=aprovado', texto: 'Aprovados' }, { href: '/orcamentos.html?periodo=30', texto: 'Últimos 30 dias', secundario: true }
        ])}

        ${secao('👤 Clientes e veículos', 'Base comercial e histórico para atendimento mais rápido e profissional.', '/clientes.html', 'Abrir clientes', [
          card('Clientes', 'home-premium-clientes', 'Cadastros ativos'),
          card('Veículos', 'home-premium-veiculos', 'Veículos vinculados'),
          card('Média veículos/cliente', 'home-premium-media-veiculos', 'Indicador de carteira'),
          card('Clientes sem veículo', 'home-premium-clientes-sem-veiculo', 'Cadastros para completar')
        ], [
          { href: '/clientes.html', texto: 'Cadastrar cliente' }, { href: '/veiculos.html', texto: 'Cadastrar veículo' }, { href: '/clientes.html?filtro=sem_veiculo', texto: 'Completar cadastros', secundario: true }, { href: '/agenda.html', texto: 'Agendar serviço', secundario: true }
        ])}

        ${secao('📦 Estoque', 'Controle peças e materiais para evitar parar serviço por falta de item.', '/estoque.html', 'Abrir estoque', [
          card('Produtos/peças', 'home-premium-produtos', 'Itens cadastrados'),
          card('Estoque baixo', 'home-premium-estoque-baixo', 'Comprar ou repor'),
          card('Zerados', 'home-premium-estoque-zerado', 'Itens sem saldo'),
          card('Valor estimado', 'home-premium-valor-estoque', 'Quantidade x valor', true)
        ], [
          { href: '/estoque.html', texto: 'Ver estoque' }, { href: '/estoque.html?filtro=baixo', texto: 'Estoque baixo' }, { href: '/estoque.html?acao=novo', texto: 'Novo item', secundario: true }, { href: '/ordens.html', texto: 'Usar em OS', secundario: true }
        ])}

        <section class="premium-dashboard-secao">
          <div class="premium-secao-topo"><div><h3>📊 Gráficos da operação</h3><p>Distribuição rápida para identificar gargalos e prioridades.</p></div><a href="/relatorios.html" class="premium-atalho secundario">Ver relatórios</a></div>
          <div class="premium-graficos-grid"><div class="premium-grafico-card"><h4>OS por status</h4><div id="home-grafico-os-status">Carregando gráfico...</div></div><div class="premium-grafico-card"><h4>Orçamentos por status</h4><div id="home-grafico-orc-status">Carregando gráfico...</div></div></div>
        </section>

        <section class="premium-dashboard-secao">
          <div class="premium-secao-topo"><div><h3>🧭 Últimos movimentos</h3><p>Atalhos para continuar de onde parou, limitado aos 5 registros mais recentes.</p></div><a href="/painel.html" class="premium-atalho secundario">Painel completo</a></div>
          <div class="premium-listas-grid"><div class="premium-lista-card"><h4>Últimas OSs</h4><div id="home-premium-ultimas-os">Carregando...</div></div><div class="premium-lista-card"><h4>Últimos orçamentos</h4><div id="home-premium-ultimos-orcamentos">Carregando...</div></div></div>
        </section>

        <section class="premium-insight-box" id="home-premium-insight">Carregando indicadores do Premium...</section>
      </div>`;
  }

  function limparDashboardAntigoDoIndex() {
    const secao = document.getElementById('home-plano-premium');
    if (!secao) return null;

    const jaNovo = secao.querySelector(`[data-dashboard-version="${FS_DASHBOARD_VERSION}"]`);
    if (!jaNovo) {
      secao.innerHTML = montarDashboardHtml();
      secao.dataset.dashboardPremiumCompleto = FS_DASHBOARD_VERSION;
      secao.classList.add('fs-dashboard-premium-pronto');
    }

    return secao;
  }

  function mostrarVisaoPorPlano(plano) {
    document.querySelectorAll('.home-visao-plano').forEach(secao => {
      secao.classList.remove('ativo');
      secao.style.display = 'none';
    });

    const id = plano === 'premium' ? 'home-plano-premium' : plano === 'basico' ? 'home-plano-basico' : 'home-plano-gratis';
    const secao = document.getElementById(id);
    if (secao) {
      secao.classList.add('ativo');
      secao.style.display = 'block';
    }
  }

  function renderGrafico(id, dados) {
    const el = document.getElementById(id);
    if (!el) return;

    const entradas = Object.entries(dados || {});
    const total = entradas.reduce((soma, [, valor]) => soma + numero(valor), 0);
    if (!total) {
      el.innerHTML = '<div class="premium-msg-vazia">Sem dados suficientes para montar o gráfico.</div>';
      return;
    }

    el.innerHTML = entradas.map(([label, valor]) => {
      const qtd = numero(valor);
      const pct = total ? Math.max(3, Math.round((qtd / total) * 100)) : 0;
      return `<div class="premium-chart-bar"><span>${escapar(label)}</span><div class="premium-chart-track"><div class="premium-chart-fill" style="width:${pct}%"></div></div><strong>${qtd}</strong></div>`;
    }).join('');
  }

  function renderLista(id, itens, tipo) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!Array.isArray(itens) || !itens.length) {
      el.innerHTML = '<div class="premium-msg-vazia">Nenhum registro recente encontrado.</div>';
      return;
    }

    el.innerHTML = itens.slice(0, 5).map(item => {
      if (tipo === 'os') {
        const numeroOS = item.numero_os || item.numero_ordem || item.numero || '-';
        const cliente = item.cliente_nome || item.nome_cliente || item.cliente || 'Cliente não informado';
        const veiculo = [item.marca, item.modelo, item.placa].filter(Boolean).join(' · ');
        return `<div class="premium-lista-item"><div>OS ${escapar(numeroOS)}<span>${escapar(cliente)}${veiculo ? ' · ' + escapar(veiculo) : ''} · ${escapar(statusLabel(item.status || 'aberta'))}</span></div><strong>${moeda(valorOS(item))}</strong></div>`;
      }

      const numeroOrc = item.numero_orcamento || item.numero || '-';
      return `<div class="premium-lista-item"><div>Nº ${escapar(numeroOrc)}<span>${escapar(item.assunto || 'Orçamento')} · ${escapar(item.cliente_nome || 'Cliente não informado')} · ${escapar(statusLabel(item.status || 'pendente'))}</span></div><strong>${moeda(numero(item.total || 0))}</strong></div>`;
    }).join('');
  }

  function preencherEmpresa(perfil, status) {
    const nome = perfil?.nome_empresa || localStorage.getItem('nome_empresa') || perfil?.nome || 'Sua oficina';
    const partes = [perfil?.telefone_empresa || localStorage.getItem('telefone_empresa'), perfil?.endereco_empresa || localStorage.getItem('endereco_empresa'), perfil?.cnpj_empresa || localStorage.getItem('cnpj_empresa')].filter(Boolean);

    setTexto('home-premium-empresa-nome', nome);
    setTexto('home-premium-empresa-dados', partes.length ? partes.join(' · ') : 'Complete WhatsApp, endereço e CNPJ/CPF no Painel.');
    setTexto('home-premium-plano-status', status === 'teste_gratis' ? 'Premium em teste' : 'Premium ativo');

    const logo = document.getElementById('home-premium-logo');
    const foto = perfil?.foto_url || localStorage.getItem('foto_url') || '';
    if (logo) logo.innerHTML = foto ? `<img src="${escapar(foto)}" alt="Logo da empresa">` : escapar((nome.trim().slice(0, 2).toUpperCase() || 'FS'));
  }

  async function preencherDashboardPremium(contexto, orcamentosRecebidos = null) {
    limparDashboardAntigoDoIndex();
    mostrarVisaoPorPlano('premium');
    esconderTesteGratisParaPremium();
    preencherEmpresa(contexto.perfil, contexto.status);

    const userId = contexto.userId;
    const [ordens, produtos, clientes, veiculos, orcamentos] = await Promise.all([
      buscarTabela('ordens_servico', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false }),
      buscarTabela('produtos_estoque', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'nome', ascending: true }),
      buscarTabela('clientes', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false }),
      buscarTabela('veiculos', '*', userId, { camposUsuario: ['user_id', 'usuario_id'], orderBy: 'created_at', ascending: false }),
      Array.isArray(orcamentosRecebidos) ? Promise.resolve(orcamentosRecebidos) : buscarTabela('orcamentos', '*', userId, { camposUsuario: ['usuario_id', 'user_id'], orderBy: 'criado_em', ascending: false })
    ]);

    const orcPendentes = orcamentos.filter(o => normalizar(o.status || 'pendente') === 'pendente').length;
    const orcAprovados = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(normalizar(o.status))).length;
    const orcRecusados = orcamentos.filter(o => normalizar(o.status) === 'recusado').length;
    const orcValorAprovado = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(normalizar(o.status))).reduce((s, o) => s + numero(o.total), 0);
    const orcValorPendente = orcamentos.filter(o => normalizar(o.status || 'pendente') === 'pendente').reduce((s, o) => s + numero(o.total), 0);
    const respondidos = orcAprovados + orcRecusados;
    const taxa = respondidos ? Math.round((orcAprovados / respondidos) * 100) : 0;
    const convertidos = orcamentos.filter(o => !!o.ordem_servico_id || ['em_servico', 'finalizado'].includes(normalizar(o.status))).length;

    setTexto('home-premium-orc-total', orcamentos.length);
    setTexto('home-premium-orc-pendentes', orcPendentes);
    setTexto('home-premium-orc-aprovados', orcAprovados);
    setTexto('home-premium-orc-recusados', orcRecusados);
    setTexto('home-premium-orc-valor-aprovado', moeda(orcValorAprovado));
    setTexto('home-premium-orc-valor-pendente', moeda(orcValorPendente));
    setTexto('home-premium-taxa-aprovacao', `${taxa}%`);
    setTexto('home-premium-orc-convertidos', convertidos);

    const abertas = ordens.filter(os => statusAberto(os.status)).length;
    const execucao = ordens.filter(os => statusExecucao(os.status)).length;
    const concluidas = ordens.filter(os => statusConcluido(os.status)).length;
    const pendPgto = ordens.filter(os => valorOS(os) > 0 && !pagamentoPago(os.status_pagamento)).length;
    const faturamento = ordens.filter(os => pagamentoPago(os.status_pagamento)).reduce((s, os) => s + valorOS(os), 0);
    const receber = ordens.filter(os => valorOS(os) > 0 && !pagamentoPago(os.status_pagamento)).reduce((s, os) => s + valorOS(os), 0);
    const comValor = ordens.filter(os => valorOS(os) > 0);
    const ticket = comValor.length ? comValor.reduce((s, os) => s + valorOS(os), 0) / comValor.length : 0;

    setTexto('home-premium-os-total', ordens.length);
    setTexto('home-premium-os-abertas', abertas);
    setTexto('home-premium-os-execucao', execucao);
    setTexto('home-premium-os-concluidas', concluidas);
    setTexto('home-premium-faturamento', moeda(faturamento));
    setTexto('home-premium-os-receber', moeda(receber));
    setTexto('home-premium-ticket-os', moeda(ticket));
    setTexto('home-premium-os-pagamento-pendente', pendPgto);

    const clientesComVeiculo = new Set(veiculos.map(v => v.cliente_id || v.id_cliente || v.cliente_cadastrado_id).filter(Boolean));
    setTexto('home-premium-clientes', clientes.length);
    setTexto('home-premium-veiculos', veiculos.length);
    setTexto('home-premium-media-veiculos', clientes.length ? (veiculos.length / clientes.length).toFixed(1).replace('.', ',') : '0');
    setTexto('home-premium-clientes-sem-veiculo', Math.max(0, clientes.length - clientesComVeiculo.size));

    const ativos = produtos.filter(p => p.ativo !== false);
    const baixo = ativos.filter(p => {
      const minimo = numero(p.estoque_minimo ?? p.minimo ?? 0);
      return p.controlar_estoque !== false && minimo > 0 && quantidadeProduto(p) <= minimo;
    }).length;
    const zerado = ativos.filter(p => p.controlar_estoque !== false && quantidadeProduto(p) <= 0).length;
    const valorEstoque = ativos.reduce((s, p) => s + (quantidadeProduto(p) * valorProduto(p)), 0);

    setTexto('home-premium-produtos', ativos.length);
    setTexto('home-premium-estoque-baixo', baixo);
    setTexto('home-premium-estoque-zerado', zerado);
    setTexto('home-premium-valor-estoque', moeda(valorEstoque));

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

  async function preencherBasicoSeNecessario(userId) {
    if (typeof window.homeIndexBuscarOrcamentos === 'function' && typeof window.homeIndexPreencherMetricasBasico === 'function') {
      const orcamentos = await window.homeIndexBuscarOrcamentos(userId);
      window.homeIndexPreencherMetricasBasico(orcamentos);
    }
  }

  async function atualizarHomePremiumSeguro() {
    if (atualizando) return;
    atualizando = true;

    try {
      injetarEstilo();
      const contexto = await obterContexto();

      if (contexto.premium) {
        await preencherDashboardPremium(contexto);
        return;
      }

      mostrarVisaoPorPlano(contexto.plano === 'basico' ? 'basico' : 'gratis');
      if (contexto.userId && contexto.plano === 'basico') await preencherBasicoSeNecessario(contexto.userId);
    } finally {
      atualizando = false;
    }
  }

  function instalarOverrideHome() {
    window.fsAtualizarDashboardPremiumIndex = atualizarHomePremiumSeguro;

    const originalAtualizar = window.atualizarHomePorPlanoIndex;
    window.atualizarHomePorPlanoIndex = async function atualizarHomePorPlanoIndexCorrigido() {
      const contexto = await obterContexto();
      if (contexto.premium) {
        await preencherDashboardPremium(contexto);
        return;
      }

      if (typeof originalAtualizar === 'function' && originalAtualizar !== window.atualizarHomePorPlanoIndex) {
        try { await originalAtualizar(); return; } catch (error) { console.warn('Dashboard Premium: fallback da home original falhou:', error); }
      }

      mostrarVisaoPorPlano(contexto.plano === 'basico' ? 'basico' : 'gratis');
    };

    window.homeIndexPreencherPremium = async function homeIndexPreencherPremiumCorrigido(userId, orcamentos) {
      const contexto = await obterContexto();
      if (!contexto.premium) return;
      contexto.userId = contexto.userId || userId;
      await preencherDashboardPremium(contexto, orcamentos);
    };
  }

  function instalarObserverAntiDashboardAntigo() {
    if (observerInstalado) return;
    observerInstalado = true;

    const secao = document.getElementById('home-plano-premium');
    if (!secao || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(() => {
      const contextoPremium = normalizar(localStorage.getItem('usuario_plano')) === 'premium';
      const temDashboardNovo = !!secao.querySelector(`[data-dashboard-version="${FS_DASHBOARD_VERSION}"]`);
      if (contextoPremium && !temDashboardNovo) {
        limparDashboardAntigoDoIndex();
        esconderTesteGratisParaPremium();
      }
    });

    observer.observe(secao, { childList: true, subtree: false });
  }

  function iniciar() {
    injetarEstilo();
    instalarOverrideHome();
    instalarObserverAntiDashboardAntigo();
    atualizarHomePremiumSeguro();
    setTimeout(() => { instalarOverrideHome(); instalarObserverAntiDashboardAntigo(); atualizarHomePremiumSeguro(); }, 600);
    setTimeout(() => { instalarOverrideHome(); atualizarHomePremiumSeguro(); }, 1600);
    setTimeout(() => { instalarOverrideHome(); atualizarHomePremiumSeguro(); }, 3200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  window.addEventListener('load', () => { instalarOverrideHome(); instalarObserverAntiDashboardAntigo(); atualizarHomePremiumSeguro(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizarHomePremiumSeguro(); });

  const authListener = setInterval(() => {
    if (!window._supabase) return;
    clearInterval(authListener);
    _supabase.auth.onAuthStateChange(() => {
      setTimeout(() => { instalarOverrideHome(); atualizarHomePremiumSeguro(); }, 500);
      setTimeout(() => { instalarOverrideHome(); atualizarHomePremiumSeguro(); }, 1500);
    });
  }, 200);
})();
