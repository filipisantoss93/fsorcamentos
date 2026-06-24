/* FS Orçamentos — Home Premium operacional */
(function(){
  'use strict';

  const OWNER_KEYS = ['user_id', 'usuario_id'];
  const STATUS_ABERTA = new Set(['', 'aberta', 'aberto', 'em_execucao', 'em_andamento', 'aprovada', 'aprovado', 'aguardando_peca', 'aguardando_pagamento']);
  const STATUS_FINAL = new Set(['concluida', 'concluido', 'finalizada', 'finalizado', 'fechada', 'fechado', 'cancelada', 'cancelado']);
  const STATUS_PAGO = new Set(['pago', 'quitado', 'recebido', 'liquidado', 'finalizado']);

  let cacheDados = null;

  function pathLimpo(){ return String(location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/'; }
  function ehHome(){ const p = pathLimpo(); return p === '/' || p === '/index' || p === '/index.html'; }
  function norm(v){ return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_').trim(); }
  function html(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function moeda(v){ return Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
  function hojeISO(){ return new Date().toISOString().slice(0,10); }
  function inicioMesISO(){ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); }
  function dataCurta(v){ if(!v) return '-'; const d = new Date(String(v).includes('T') ? v : String(v) + 'T00:00:00'); return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }); }
  function horaCurta(v){ return String(v || '').slice(0,5) || '--:--'; }
  function set(id, valor){ const el = document.getElementById(id); if(el) el.textContent = String(valor); }
  function valorOS(o){ return Number(o?.valor_total || o?.total || o?.valor_final || 0); }
  function saldoOS(o){ return Math.max(0, valorOS(o) - Number(o?.valor_entrada || o?.entrada || o?.valor_pago || 0)); }
  function osAberta(o){ return !STATUS_FINAL.has(norm(o?.status)); }
  function pagamentoPago(o){ return STATUS_PAGO.has(norm(o?.status_pagamento)); }
  function orcPendente(o){ return ['pendente','enviado','aguardando','aguardando_aprovacao',''].includes(norm(o?.status)); }
  function orcAprovado(o){ return ['aprovado','aprovada'].includes(norm(o?.status)); }
  function antigo24h(v){ const d = new Date(v || 0); if(Number.isNaN(d.getTime())) return false; return (Date.now() - d.getTime()) > 86400000; }
  function produtoBaixo(p){ return p?.ativo !== false && p?.controlar_estoque !== false && p?.estoque_minimo !== null && Number(p?.quantidade_atual || 0) <= Number(p?.estoque_minimo || 0); }

  function instalarCss(){
    if(document.getElementById('fs-home-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-home-premium-style';
    style.textContent = `
      #home-plano-premium.home-visao-plano{display:none;gap:10px;width:100%;}
      #home-plano-premium.home-visao-plano.ativo{display:grid!important;}
      .premium-home-hero,.premium-home-card,.premium-home-alertas,.premium-home-financeiro{background:#ffffff!important;border:1px solid #dbe3ee!important;border-radius:12px!important;box-shadow:0 6px 18px rgba(51,65,85,.08)!important;color:#111827!important;overflow:hidden!important;}
      .premium-home-hero{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;padding:14px!important;background:linear-gradient(135deg,#ffffff 0%,#f8fafc 72%,#dcfce7 100%)!important;color:#111827!important;border-color:#cbd5e1!important;border-top:4px solid #22c55e!important;}
      .premium-tag{display:inline-flex!important;width:fit-content!important;padding:4px 8px!important;border-radius:6px!important;background:#dcfce7!important;color:#166534!important;border:1px solid #86efac!important;font-size:10px!important;font-weight:950!important;text-transform:uppercase!important;margin-bottom:7px!important;}
      .premium-home-hero h1{margin:0!important;color:#111827!important;font-size:clamp(26px,4vw,40px)!important;line-height:1.05!important;font-weight:950!important;}
      .premium-home-hero p{margin:6px 0 0!important;color:#475569!important;font-size:13px!important;line-height:1.4!important;font-weight:780!important;}
      .premium-status-pill{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:32px!important;border-radius:999px!important;padding:7px 11px!important;background:#ffffff!important;color:#166534!important;border:1px solid #86efac!important;font-size:11px!important;font-weight:950!important;white-space:nowrap!important;text-decoration:none!important;}
      .premium-status-pill:hover{background:#dcfce7!important;color:#14532d!important;}
      .premium-acoes-grid,.premium-atalhos-grid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important;}
      .premium-metricas-grid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important;}
      .premium-metrica{background:#ffffff!important;border:1px solid #dbe3ee!important;border-left:4px solid #22c55e!important;border-radius:10px!important;padding:10px!important;min-width:0!important;box-shadow:0 3px 10px rgba(15,23,42,.05)!important;}
      .premium-metrica span{display:block!important;color:#475569!important;font-size:10px!important;font-weight:950!important;text-transform:uppercase!important;margin-bottom:5px!important;letter-spacing:.01em!important;}
      .premium-metrica strong{display:block!important;color:#111827!important;font-size:clamp(18px,2.2vw,26px)!important;line-height:1!important;font-weight:950!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      .premium-card-head{display:flex!important;justify-content:space-between!important;gap:10px!important;align-items:end!important;padding:12px!important;background:#f8fafc!important;border-bottom:1px solid #e5e7eb!important;}
      .premium-card-head h2{margin:0!important;color:#111827!important;font-size:18px!important;font-weight:950!important;}
      .premium-card-head p{margin:4px 0 0!important;color:#475569!important;font-size:12px!important;font-weight:800!important;}
      .premium-card-body{padding:10px!important;}
      .premium-action,.premium-atalho{display:grid!important;gap:4px!important;align-content:center!important;min-height:72px!important;padding:10px!important;border-radius:10px!important;text-decoration:none!important;border:1px solid #cbd5e1!important;background:#ffffff!important;color:#111827!important;box-sizing:border-box!important;box-shadow:0 3px 10px rgba(15,23,42,.05)!important;position:relative!important;overflow:hidden!important;}
      .premium-action::before,.premium-atalho::before{content:""!important;position:absolute!important;left:0!important;top:0!important;bottom:0!important;width:4px!important;background:#22c55e!important;}
      .premium-action strong,.premium-atalho strong{font-size:13px!important;font-weight:950!important;color:#111827!important;line-height:1.15!important;padding-left:3px!important;}
      .premium-action span,.premium-atalho span{font-size:11px!important;font-weight:820!important;color:#475569!important;opacity:1!important;line-height:1.25!important;padding-left:3px!important;}
      .premium-action:hover,.premium-atalho:hover{background:#f8fafc!important;transform:translateY(-1px);box-shadow:0 6px 16px rgba(51,65,85,.12)!important;border-color:#94a3b8!important;}
      .premium-action:nth-child(2)::before{background:#facc15!important;}
      .premium-action:nth-child(3)::before{background:#2563eb!important;}
      .premium-action:nth-child(4)::before{background:#6366f1!important;}
      .premium-action:nth-child(5)::before{background:#334155!important;}
      .premium-action:nth-child(6)::before{background:#f97316!important;}
      .premium-layout-2{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr)!important;gap:10px!important;}
      .premium-alert-list,.premium-agenda-list,.premium-fin-list{display:grid!important;gap:7px!important;}
      .premium-alert-item,.premium-agenda-item,.premium-fin-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;background:#ffffff!important;border:1px solid #dbe3ee!important;border-left:4px solid #22c55e!important;border-radius:9px!important;padding:9px!important;color:#111827!important;text-decoration:none!important;}
      .premium-alert-item strong,.premium-agenda-item strong,.premium-fin-row strong{color:#111827!important;font-size:12.5px!important;font-weight:950!important;}
      .premium-alert-item span,.premium-agenda-item span,.premium-fin-row span{color:#475569!important;font-size:11.5px!important;font-weight:800!important;}
      .premium-alert-badge{display:inline-flex!important;border-radius:999px!important;padding:3px 7px!important;background:#eef2f7!important;color:#334155!important;border:1px solid #cbd5e1!important;font-size:10px!important;font-weight:950!important;text-transform:uppercase!important;white-space:nowrap!important;}
      .premium-alert-badge.ok{background:#dcfce7!important;color:#166534!important;border-color:#86efac!important;}
      .premium-fin-row.entrada{border-left-color:#22c55e!important;}
      .premium-fin-row.saida{border-left-color:#dc2626!important;}
      .premium-fin-row.saldo{border-left-color:#2563eb!important;}
      @media(max-width:1050px){.premium-metricas-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.premium-acoes-grid,.premium-atalhos-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.premium-layout-2{grid-template-columns:1fr!important}.premium-home-hero{grid-template-columns:1fr!important}}
      @media(max-width:620px){.premium-metricas-grid,.premium-acoes-grid,.premium-atalhos-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.premium-home-hero,.premium-card-body{padding:10px!important}.premium-status-pill{width:100%!important}.premium-action,.premium-atalho{min-height:82px!important;padding:10px 8px 10px 10px!important}.premium-action strong,.premium-atalho strong{font-size:12.5px!important}.premium-action span,.premium-atalho span{font-size:10.5px!important}.premium-alert-item,.premium-agenda-item,.premium-fin-row{grid-template-columns:1fr!important}.premium-metrica{min-height:78px!important}.premium-metrica strong{font-size:19px!important}.premium-metrica span{font-size:9.5px!important}}
    `;
    document.head.appendChild(style);
  }

  function secaoPremiumHtml(){
    return `
      <section class="premium-home-hero">
        <div><span class="premium-tag">Central Premium</span><h1>Visão operacional da sua empresa</h1><p>Alertas, ações rápidas, atalhos principais, métricas e financeiro em um só lugar.</p></div>
        <a class="premium-status-pill" href="/dashboard.html">Abrir dashboard completo</a>
      </section>

      <section class="premium-metricas-grid" aria-label="Cards de métricas">
        <article class="premium-metrica"><span>OS abertas</span><strong id="ph-os-abertas">—</strong></article>
        <article class="premium-metrica"><span>Orçamentos pendentes</span><strong id="ph-orc-pendentes">—</strong></article>
        <article class="premium-metrica"><span>Clientes</span><strong id="ph-clientes">—</strong></article>
        <article class="premium-metrica"><span>Veículos</span><strong id="ph-veiculos">—</strong></article>
        <article class="premium-metrica"><span>Estoque baixo</span><strong id="ph-estoque-baixo">—</strong></article>
        <article class="premium-metrica"><span>A receber</span><strong id="ph-a-receber">—</strong></article>
      </section>

      <section class="premium-home-card">
        <div class="premium-card-head"><div><h2>Ações rápidas</h2><p>Comece as tarefas principais sem procurar no menu.</p></div></div>
        <div class="premium-card-body"><div class="premium-acoes-grid">
          <a class="premium-action" href="/ordens.html?novo=1"><strong>+ Nova OS</strong><span>Abrir atendimento</span></a>
          <a class="premium-action" href="/gerador.html"><strong>+ Orçamento</strong><span>Criar proposta</span></a>
          <a class="premium-action" href="/clientes.html?novo=1"><strong>+ Cliente</strong><span>Cadastrar contato</span></a>
          <a class="premium-action" href="/veiculos.html?novo=1"><strong>+ Veículo</strong><span>Vincular cliente</span></a>
          <a class="premium-action" href="/fluxo-caixa.html"><strong>+ Caixa</strong><span>Lançar entrada/saída</span></a>
          <a class="premium-action" href="/agenda.html?novo=1"><strong>+ Agenda</strong><span>Marcar serviço</span></a>
        </div></div>
      </section>

      <section class="premium-layout-2">
        <article class="premium-home-alertas">
          <div class="premium-card-head"><div><h2>Alertas</h2><p>Pontos que merecem atenção agora.</p></div></div>
          <div class="premium-card-body"><div id="ph-alertas" class="premium-alert-list"><div class="premium-alert-item"><strong>Carregando alertas...</strong><span class="premium-alert-badge">Aguarde</span></div></div></div>
        </article>
        <article class="premium-home-financeiro">
          <div class="premium-card-head"><div><h2>Resumo financeiro</h2><p>Movimento do mês no fluxo de caixa.</p></div><a href="/fluxo-caixa.html" class="premium-status-pill">Ver caixa</a></div>
          <div class="premium-card-body"><div class="premium-fin-list">
            <div class="premium-fin-row entrada"><span>Entradas no mês</span><strong id="ph-fin-entradas">—</strong></div>
            <div class="premium-fin-row saida"><span>Saídas no mês</span><strong id="ph-fin-saidas">—</strong></div>
            <div class="premium-fin-row saldo"><span>Saldo do mês</span><strong id="ph-fin-saldo">—</strong></div>
          </div></div>
        </article>
      </section>

      <section class="premium-layout-2">
        <article class="premium-home-card">
          <div class="premium-card-head"><div><h2>Serviços de hoje</h2><p>Próximos compromissos da agenda.</p></div><a href="/agenda.html" class="premium-status-pill">Agenda</a></div>
          <div class="premium-card-body"><div id="ph-agenda" class="premium-agenda-list"><div class="premium-agenda-item"><strong>Carregando agenda...</strong><span>Aguarde</span></div></div></div>
        </article>
        <article class="premium-home-card">
          <div class="premium-card-head"><div><h2>Atalhos principais</h2><p>Áreas mais usadas da gestão Premium.</p></div></div>
          <div class="premium-card-body"><div class="premium-atalhos-grid">
            <a class="premium-atalho" href="/dashboard.html"><strong>Dashboard</strong><span>Indicadores</span></a>
            <a class="premium-atalho" href="/ordens.html"><strong>OS</strong><span>Execução</span></a>
            <a class="premium-atalho" href="/clientes.html"><strong>Clientes</strong><span>Histórico</span></a>
            <a class="premium-atalho" href="/veiculos.html"><strong>Veículos</strong><span>Fichas</span></a>
            <a class="premium-atalho" href="/estoque.html"><strong>Estoque</strong><span>Peças</span></a>
            <a class="premium-atalho" href="/relatorios.html"><strong>Relatórios</strong><span>Análise</span></a>
          </div></div>
        </article>
      </section>
    `;
  }

  function garantirSecaoPremium(){
    const home = document.getElementById('home-publica');
    if(!home) return null;
    let secao = document.getElementById('home-plano-premium');
    if(!secao){
      secao = document.createElement('section');
      secao.id = 'home-plano-premium';
      secao.className = 'home-visao-plano fs-home-premium';
      secao.innerHTML = secaoPremiumHtml();
      home.prepend(secao);
    }
    return secao;
  }

  function mostrarPremium(){
    const secao = garantirSecaoPremium();
    if(!secao) return;
    document.querySelectorAll('#home-publica .home-visao-plano').forEach(el => {
      el.classList.remove('ativo');
      el.style.setProperty('display', 'none', 'important');
    });
    secao.classList.add('ativo');
    secao.style.setProperty('display', 'grid', 'important');
    secao.style.setProperty('visibility', 'visible', 'important');
    secao.style.setProperty('opacity', '1', 'important');
  }

  async function perfilPremium(session){
    const planoLocal = norm(localStorage.getItem('usuario_plano'));
    const statusLocal = norm(localStorage.getItem('usuario_plano_status') || 'ativo');
    if(planoLocal === 'premium' && !['cancelado','expirado'].includes(statusLocal)) return true;
    if(!session?.user?.id || !window._supabase) return false;
    try{
      const { data, error } = await window._supabase.from('perfis').select('plano, plano_status, plano_expira_em').eq('id', session.user.id).maybeSingle();
      if(error) return false;
      const plano = norm(data?.plano);
      const status = norm(data?.plano_status || 'ativo');
      if(data?.plano) localStorage.setItem('usuario_plano', data.plano);
      if(data?.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
      return plano === 'premium' && !['cancelado','expirado'].includes(status);
    }catch(_){ return false; }
  }

  async function linhasTabela(tabela, colunas, userId, limite = 500){
    if(!window._supabase || !userId) return [];
    for(const chave of OWNER_KEYS){
      try{
        const { data, error } = await window._supabase.from(tabela).select(colunas || '*').eq(chave, userId).limit(limite);
        if(!error) return Array.isArray(data) ? data : [];
      }catch(_){ }
    }
    return [];
  }

  async function carregarDados(userId){
    const iniMes = inicioMesISO();
    const hoje = hojeISO();
    const [orcamentos, ordens, clientes, veiculos, estoque, caixa, agenda] = await Promise.all([
      linhasTabela('orcamentos', '*', userId, 500),
      linhasTabela('ordens_servico', '*', userId, 500),
      linhasTabela('clientes', 'id, nome, created_at', userId, 500),
      linhasTabela('veiculos', 'id, placa, marca, modelo, ativo', userId, 500),
      linhasTabela('produtos_estoque', '*', userId, 500),
      linhasTabela('fluxo_caixa', '*', userId, 500),
      linhasTabela('agenda_servicos', '*', userId, 300)
    ]);

    const caixaMes = caixa.filter(x => String(x.data_movimento || x.created_at || '').slice(0,10) >= iniMes && String(x.data_movimento || x.created_at || '').slice(0,10) <= hoje);
    const entradas = caixaMes.filter(x => norm(x.tipo) === 'entrada').reduce((s,x) => s + Number(x.valor || 0), 0);
    const saidas = caixaMes.filter(x => norm(x.tipo) === 'saida').reduce((s,x) => s + Number(x.valor || 0), 0);
    const orcPendentes = orcamentos.filter(orcPendente);
    const orcPendentes24 = orcPendentes.filter(o => antigo24h(o.criado_em || o.created_at));
    const ordensAbertas = ordens.filter(osAberta);
    const estoqueBaixo = estoque.filter(produtoBaixo);
    const aReceberOS = ordens.filter(o => !pagamentoPago(o) && saldoOS(o) > 0).reduce((s,o) => s + saldoOS(o), 0);
    const aReceberOrc = orcamentos.filter(orcAprovado).reduce((s,o) => s + Number(o.total || 0), 0);
    const agendaHoje = agenda.filter(a => String(a.data_servico || '').slice(0,10) === hoje && !STATUS_FINAL.has(norm(a.status))).sort((a,b) => String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''))).slice(0,4);

    return { orcamentos, ordens, clientes, veiculos, estoque, caixa, agenda, entradas, saidas, orcPendentes, orcPendentes24, ordensAbertas, estoqueBaixo, aReceber: aReceberOS + aReceberOrc, agendaHoje };
  }

  function renderAlertas(d){
    const alertas = [];
    if(d.estoqueBaixo.length) alertas.push(['Estoque baixo', `${d.estoqueBaixo.length} item(ns) abaixo do mínimo`, 'Atenção']);
    if(d.orcPendentes24.length) alertas.push(['Orçamentos parados', `${d.orcPendentes24.length} pendente(s) há mais de 24h`, 'Cobrar']);
    const osReceber = d.ordens.filter(o => !pagamentoPago(o) && saldoOS(o) > 0).length;
    if(osReceber) alertas.push(['Pagamentos pendentes', `${osReceber} OS aguardando recebimento`, 'Caixa']);
    if(d.ordensAbertas.length) alertas.push(['OS em aberto', `${d.ordensAbertas.length} serviço(s) em andamento`, 'Operação']);

    const box = document.getElementById('ph-alertas');
    if(!box) return;
    if(!alertas.length){
      box.innerHTML = '<div class="premium-alert-item"><strong>Nenhum alerta crítico agora</strong><span class="premium-alert-badge ok">OK</span></div>';
      return;
    }
    box.innerHTML = alertas.slice(0,5).map(a => `<div class="premium-alert-item"><div><strong>${html(a[0])}</strong><br><span>${html(a[1])}</span></div><span class="premium-alert-badge">${html(a[2])}</span></div>`).join('');
  }

  function renderAgenda(d){
    const box = document.getElementById('ph-agenda');
    if(!box) return;
    if(!d.agendaHoje.length){
      box.innerHTML = '<div class="premium-agenda-item"><strong>Nenhum serviço agendado para hoje</strong><span>Use a agenda para programar próximos atendimentos.</span></div>';
      return;
    }
    box.innerHTML = d.agendaHoje.map(a => `<a class="premium-agenda-item" href="/agenda.html?id=${encodeURIComponent(a.id || '')}"><div><strong>${html(a.titulo || 'Serviço agendado')}</strong><br><span>${dataCurta(a.data_servico)} às ${horaCurta(a.hora_inicio)} ${a.responsavel ? '• ' + html(a.responsavel) : ''}</span></div><span class="premium-alert-badge ok">Hoje</span></a>`).join('');
  }

  function renderDados(d){
    set('ph-os-abertas', d.ordensAbertas.length);
    set('ph-orc-pendentes', d.orcPendentes.length);
    set('ph-clientes', d.clientes.length);
    set('ph-veiculos', d.veiculos.length);
    set('ph-estoque-baixo', d.estoqueBaixo.length);
    set('ph-a-receber', moeda(d.aReceber));
    set('ph-fin-entradas', moeda(d.entradas));
    set('ph-fin-saidas', moeda(d.saidas));
    set('ph-fin-saldo', moeda(d.entradas - d.saidas));
    renderAlertas(d);
    renderAgenda(d);
  }

  async function iniciarPremiumHome(){
    if(!ehHome()) return;
    instalarCss();
    if(!window._supabase?.auth) return;
    const { data:{ session } } = await window._supabase.auth.getSession();
    if(!session?.user?.id) return;
    const premium = await perfilPremium(session);
    if(!premium) return;
    mostrarPremium();
    if(!cacheDados) cacheDados = await carregarDados(session.user.id);
    renderDados(cacheDados);
    mostrarPremium();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarPremiumHome, 500));
  else setTimeout(iniciarPremiumHome, 500);

  let tentativas = 0;
  const timer = setInterval(() => {
    iniciarPremiumHome();
    if(++tentativas > 12) clearInterval(timer);
  }, 1200);

  window.fsIniciarHomePremium = iniciarPremiumHome;
})();