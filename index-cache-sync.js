/* =========================================================
   FS ORÇAMENTOS - index-cache-sync.js
   Usa localStorage primeiro no index e confirma Supabase em segundo plano.
   ========================================================= */
(function () {
  'use strict';

  const CACHE_DASH = 'fs_index_dashboard_cache_v1';
  const CACHE_EMPRESA = 'fs_index_empresa_cache_v1';
  const METRIC_IDS = [
    'home-premium-os-total','home-premium-os-abertas','home-premium-os-execucao','home-premium-os-concluidas','home-premium-faturamento','home-premium-os-receber','home-premium-ticket-os','home-premium-os-pagamento-pendente',
    'home-premium-orc-total','home-premium-orc-pendentes','home-premium-orc-aprovados','home-premium-orc-recusados','home-premium-orc-valor-aprovado','home-premium-orc-valor-pendente','home-premium-taxa-aprovacao','home-premium-orc-convertidos',
    'home-premium-clientes','home-premium-veiculos','home-premium-media-veiculos','home-premium-clientes-sem-veiculo','home-premium-produtos','home-premium-estoque-baixo','home-premium-estoque-zerado','home-premium-valor-estoque'
  ];
  const HTML_IDS = ['home-grafico-os-status','home-grafico-orc-status','home-premium-ultimas-os','home-premium-ultimos-orcamentos','home-premium-insight'];

  function jsonGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
  function jsonSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function normalizar(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  function setText(id, v) { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.textContent = v; }
  function esc(v) { return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  function empresaLocal() {
    const c = jsonGet(CACHE_EMPRESA) || {};
    return {
      nome: c.nome || localStorage.getItem('usuario_nome') || '',
      nome_empresa: c.nome_empresa || localStorage.getItem('nome_empresa') || '',
      telefone_empresa: c.telefone_empresa || localStorage.getItem('telefone_empresa') || '',
      endereco_empresa: c.endereco_empresa || localStorage.getItem('endereco_empresa') || '',
      cnpj_empresa: c.cnpj_empresa || localStorage.getItem('cnpj_empresa') || '',
      foto_url: c.foto_url || localStorage.getItem('foto_url') || '',
      plano: c.plano || localStorage.getItem('usuario_plano') || 'gratis',
      plano_status: c.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo'
    };
  }

  function garantirEmpresaCard() {
    let card = document.getElementById('fs-index-empresa-card');
    if (card) return card;
    const main = document.querySelector('main') || document.body;
    const antes = document.querySelector('.home-visao-plano') || main.firstElementChild;
    card = document.createElement('section');
    card.id = 'fs-index-empresa-card';
    card.className = 'fs-index-empresa-card';
    card.innerHTML = '<div class="fs-index-empresa-logo" id="fs-index-empresa-logo">FS</div><div class="fs-index-empresa-info"><h2 id="fs-index-empresa-nome">FS Orçamentos</h2><div class="fs-index-empresa-dados" id="fs-index-empresa-dados"><span>Carregando dados...</span></div></div><div class="fs-index-empresa-plano gratis" id="fs-index-empresa-plano">Grátis</div>';
    if (antes && antes.parentNode) antes.parentNode.insertBefore(card, antes); else main.prepend(card);
    return card;
  }

  function preencherEmpresaLocal() {
    garantirEmpresaCard();
    const e = empresaLocal();
    const nome = e.nome_empresa || e.nome || 'FS Orçamentos';
    const plano = normalizar(e.plano || 'gratis');
    const status = normalizar(e.plano_status || 'ativo');
    const logo = document.getElementById('fs-index-empresa-logo');
    const dados = document.getElementById('fs-index-empresa-dados');
    const planoEl = document.getElementById('fs-index-empresa-plano');
    setText('fs-index-empresa-nome', nome);
    if (logo) logo.innerHTML = e.foto_url ? '<img src="' + esc(e.foto_url) + '" alt="Logo da empresa">' : esc((nome.slice(0,2).toUpperCase() || 'FS'));
    const tel = e.telefone_empresa ? (typeof window.fsFormatarTelefoneBR === 'function' ? window.fsFormatarTelefoneBR(e.telefone_empresa) : e.telefone_empresa) : '';
    const doc = e.cnpj_empresa ? (typeof window.fsFormatarCpfCnpjBR === 'function' ? window.fsFormatarCpfCnpjBR(e.cnpj_empresa) : e.cnpj_empresa) : '';
    const labelDoc = e.cnpj_empresa && typeof window.fsLabelDocumentoBR === 'function' ? window.fsLabelDocumentoBR(e.cnpj_empresa) : 'CPF/CNPJ';
    if (dados) dados.innerHTML = [tel ? '<span>WhatsApp: ' + esc(tel) + '</span>' : '', doc ? '<span>' + esc(labelDoc) + ': ' + esc(doc) + '</span>' : ''].filter(Boolean).join('<span>·</span>') || '<span>Complete WhatsApp e CPF/CNPJ no Painel</span>';
    if (planoEl) {
      planoEl.className = 'fs-index-empresa-plano ' + (plano === 'premium' ? 'premium' : plano === 'basico' ? 'basico' : 'gratis');
      planoEl.textContent = plano === 'premium' ? (status === 'teste_gratis' ? 'Premium em teste' : 'Premium') : plano === 'basico' ? 'Básico' : 'Grátis';
    }
  }

  function aplicarDashboardCache() {
    const cache = jsonGet(CACHE_DASH);
    if (!cache) return;
    if (normalizar(localStorage.getItem('usuario_plano')) === 'premium') {
      document.querySelectorAll('.home-visao-plano').forEach(s => { s.classList.remove('ativo'); s.style.display = 'none'; });
      const premium = document.getElementById('home-plano-premium');
      if (premium) { premium.classList.add('ativo'); premium.style.display = 'block'; }
    }
    Object.entries(cache.metricas || {}).forEach(([id, v]) => setText(id, v));
    Object.entries(cache.html || {}).forEach(([id, html]) => { const el = document.getElementById(id); if (el && html) el.innerHTML = html; });
  }

  function salvarCaches() {
    const empresa = empresaLocal();
    jsonSet(CACHE_EMPRESA, Object.assign({}, empresa, { atualizado_em: new Date().toISOString() }));
    if (normalizar(localStorage.getItem('usuario_plano')) !== 'premium') return;
    const metricas = {}; METRIC_IDS.forEach(id => { const el = document.getElementById(id); if (el) metricas[id] = el.textContent || '0'; });
    const html = {}; HTML_IDS.forEach(id => { const el = document.getElementById(id); if (el) html[id] = el.innerHTML || ''; });
    if (Object.keys(metricas).length) jsonSet(CACHE_DASH, { atualizado_em: new Date().toISOString(), plano: 'premium', metricas, html });
  }

  function confirmarSegundoPlano() {
    setTimeout(() => { if (typeof window.fsAtualizarEmpresaCardIndex === 'function') window.fsAtualizarEmpresaCardIndex(); if (typeof window.fsAtualizarDashboardPremiumIndex === 'function') window.fsAtualizarDashboardPremiumIndex(); }, 500);
    setTimeout(() => { if (typeof window.fsAtualizarEmpresaCardIndex === 'function') window.fsAtualizarEmpresaCardIndex(); if (typeof window.fsAtualizarDashboardPremiumIndex === 'function') window.fsAtualizarDashboardPremiumIndex(); }, 1800);
  }

  function observer() {
    if (window.__fsIndexCacheSyncObs || typeof MutationObserver === 'undefined') return;
    window.__fsIndexCacheSyncObs = true;
    let t = null;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(salvarCaches, 300); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  function iniciar() {
    preencherEmpresaLocal();
    aplicarDashboardCache();
    observer();
    confirmarSegundoPlano();
    setTimeout(() => { preencherEmpresaLocal(); aplicarDashboardCache(); salvarCaches(); }, 700);
    setTimeout(salvarCaches, 3000);
  }

  window.fsIndexCacheSync = iniciar;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
