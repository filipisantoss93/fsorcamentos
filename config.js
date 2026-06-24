/* =========================================================
   FS ORÇAMENTOS - config.js
   Configuração pública do frontend

   IMPORTANTE:
   - Aqui deve ficar SOMENTE a anon public key do Supabase.
   - Nunca coloque service_role key no frontend.
   ========================================================= */

const SUPABASE_URL = 'https://kvjvhoziqcevkzyszdke.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-tw2F85KsudYX92fevBIQQ_VaWLx6Pl';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

function fsConfigLimparDestinoAntigoNoIndex() {
  try {
    const path = String(window.location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
    const ehIndex = path === '/' || path === '/index' || path === '/index.html';
    if (!ehIndex) return;

    const params = new URLSearchParams(window.location.search || '');
    const destinoUrl = String(params.get('dest') || '').trim();

    if (!destinoUrl) {
      localStorage.removeItem('fs_destino_apos_login');
      return;
    }

    const destinoPath = destinoUrl.split('?')[0].split('#')[0].replace(/\/$/, '').toLowerCase();
    if (!destinoPath || destinoPath === '/' || destinoPath === '/index' || destinoPath === '/index.html') {
      localStorage.removeItem('fs_destino_apos_login');
    }
  } catch (_) {}
}

fsConfigLimparDestinoAntigoNoIndex();

function fsConfigBloquearZoomGlobal() {
  try {
    const conteudoViewport = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', conteudoViewport);

    if (!document.getElementById('fs-bloqueio-zoom-css')) {
      const style = document.createElement('style');
      style.id = 'fs-bloqueio-zoom-css';
      style.textContent = `
        html, body {
          touch-action: manipulation;
          -ms-touch-action: manipulation;
          overscroll-behavior-x: none;
        }
        input, select, textarea, button {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (window.__fsZoomBloqueado === true) return;
    window.__fsZoomBloqueado = true;

    let ultimoToque = 0;

    document.addEventListener('gesturestart', function(event) { event.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(event) { event.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', function(event) { event.preventDefault(); }, { passive: false });

    document.addEventListener('touchstart', function(event) {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
        return;
      }
      const agora = Date.now();
      if (agora - ultimoToque < 320) event.preventDefault();
      ultimoToque = agora;
    }, { passive: false });

    document.addEventListener('touchmove', function(event) {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });

    document.addEventListener('wheel', function(event) {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', function(event) {
      const tecla = String(event.key || '').toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(tecla)) event.preventDefault();
    }, { passive: false });
  } catch (erro) {
    console.warn('Não foi possível aplicar bloqueio de zoom:', erro);
  }
}

fsConfigBloquearZoomGlobal();

function fsConfigInstalarEstilo(id, css) {
  if (!id || !css || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function fsConfigNormalizarPaginaAtual() {
  const path = (window.location.pathname || '/').toLowerCase();
  return (path.split('/').pop() || 'index.html').replace('.html', '');
}

function fsConfigAplicarGestaoGridConsolidado() {
  fsConfigInstalarEstilo('fs-pr8-consolidado-gestao-css', `
    .clientes-hero,
    .veiculos-hero,
    .ordens-hero,
    .estoque-hero,
    .agenda-hero,
    .relatorios-hero,
    .recorrentes-hero {
      display: none !important;
    }

    .clientes-resumo,
    .veiculos-resumo,
    .ordens-resumo,
    .estoque-resumo,
    .agenda-resumo,
    .agenda-resumo-grid,
    .relatorios-resumo,
    .relatorios-dashboard,
    .dashboard-relatorios,
    .recorrentes-resumo,
    .recorrentes-dashboard,
    .fs-dashboard-gestao-bloco {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      margin: 0 0 18px !important;
      padding: 14px !important;
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      border-radius: 14px !important;
      box-shadow: 0 8px 22px rgba(15, 23, 42, .08) !important;
    }

    .fs-dashboard-gestao-cabecalho { grid-column: 1 / -1 !important; }
    .fs-dashboard-gestao-cabecalho h2 { margin: 0 !important; color: #111827 !important; font-size: 20px !important; font-weight: 950 !important; }
    .fs-dashboard-gestao-cabecalho p { margin: 5px 0 0 !important; color: #64748b !important; font-size: 13px !important; font-weight: 800 !important; }

    .card-resumo,
    .agenda-metrica {
      min-height: 82px !important;
      padding: 13px !important;
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      border-radius: 10px !important;
      box-shadow: 0 3px 10px rgba(15, 23, 42, .05) !important;
    }

    .card-resumo.destaque { background: #475569 !important; color: #ffffff !important; }
    .card-resumo span,
    .agenda-metrica span { color: #64748b !important; font-size: 11px !important; font-weight: 950 !important; text-transform: uppercase !important; }
    .card-resumo strong,
    .agenda-metrica strong { color: #1f2937 !important; font-size: 21px !important; font-weight: 950 !important; }
    .card-resumo.destaque,
    .card-resumo.destaque * { color: #ffffff !important; }

    @media (max-width: 420px) {
      .clientes-resumo,
      .veiculos-resumo,
      .ordens-resumo,
      .estoque-resumo,
      .agenda-resumo,
      .agenda-resumo-grid,
      .relatorios-resumo,
      .relatorios-dashboard,
      .dashboard-relatorios,
      .recorrentes-resumo,
      .recorrentes-dashboard,
      .fs-dashboard-gestao-bloco { gap: 8px !important; padding: 10px !important; }
      .card-resumo,
      .agenda-metrica { min-height: 76px !important; padding: 10px !important; }
      .card-resumo strong,
      .agenda-metrica strong { font-size: 18px !important; }
    }
  `);

  const pagina = fsConfigNormalizarPaginaAtual();
  const titulos = {
    clientes: ['.clientes-resumo', 'Dashboard de clientes', 'Resumo rápido da carteira de clientes para acompanhar relacionamento, status e recorrência.'],
    veiculos: ['.veiculos-resumo', 'Dashboard de veículos', 'Resumo rápido da frota cadastrada para acompanhar veículos ativos, vínculos e histórico.'],
    ordens: ['.ordens-resumo', 'Dashboard de ordens', 'Resumo rápido das OSs para acompanhar execução, conclusão e pagamentos.'],
    estoque: ['.estoque-resumo', 'Dashboard de estoque', 'Resumo rápido dos produtos para acompanhar disponibilidade, estoque mínimo e valor em venda.'],
    agenda: ['.agenda-resumo,.agenda-resumo-grid', 'Dashboard de agenda', 'Resumo rápido dos agendamentos para acompanhar serviços do dia, atrasos e próximos atendimentos.'],
    relatorios: ['.relatorios-resumo,.relatorios-dashboard,.dashboard-relatorios', 'Dashboard de relatórios', 'Resumo rápido dos indicadores para acompanhar desempenho, faturamento e produtividade.'],
    recorrentes: ['.recorrentes-resumo,.recorrentes-dashboard', 'Dashboard de recorrentes', 'Resumo rápido dos serviços recorrentes para acompanhar contratos, próximas cobranças e clientes ativos.']
  };

  function aplicarCabecalho() {
    const info = titulos[pagina];
    if (!info) return;
    const bloco = document.querySelector(info[0]);
    if (!bloco) return;
    bloco.classList.add('fs-dashboard-gestao-bloco');
    if (bloco.querySelector('.fs-dashboard-gestao-cabecalho')) return;
    const cabecalho = document.createElement('div');
    cabecalho.className = 'fs-dashboard-gestao-cabecalho';
    cabecalho.innerHTML = `<h2>${info[1]}</h2><p>${info[2]}</p>`;
    bloco.prepend(cabecalho);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicarCabecalho);
  else aplicarCabecalho();
  setTimeout(aplicarCabecalho, 300);
  setTimeout(aplicarCabecalho, 900);
}

function fsConfigEscaparHTML(valor) {
  return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function fsConfigNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  let texto = String(valor).replace(/[^\d.,-]/g, '');
  if (!texto) return 0;
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}
function fsConfigMoeda(valor) { return fsConfigNumero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fsConfigQtd(valor) {
  const numero = fsConfigNumero(valor);
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: numero % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

function fsConfigInstalarEstoqueTabelaConsolidada() {
  if (fsConfigNormalizarPaginaAtual() !== 'estoque') return;

  fsConfigInstalarEstilo('fs-pr8-consolidado-estoque-css', `
    #lista-produtos-estoque { display: block !important; width: 100% !important; overflow: visible !important; }
    .fs-tabela-lista-wrapper { width: 100% !important; overflow-x: auto !important; background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 10px !important; box-shadow: 0 6px 18px rgba(15, 23, 42, .06) !important; -webkit-overflow-scrolling: touch !important; }
    .fs-tabela-lista { width: 100% !important; min-width: 1040px !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 !important; background: #ffffff !important; }
    .fs-tabela-lista th,.fs-tabela-lista td { padding: 8px 9px !important; border-bottom: 1px solid #e5e7eb !important; text-align: left !important; color: #111827 !important; font-size: 12px !important; vertical-align: middle !important; word-break: break-word !important; }
    .fs-tabela-lista th { background: #f3f4f6 !important; color: #111827 !important; text-transform: uppercase !important; font-weight: 950 !important; font-size: 11px !important; }
    .fs-tabela-lista tr:nth-child(even) { background: #f9fafb !important; }
    .fs-tabela-lista tr:hover { background: #f3f4f6 !important; }
    .fs-tabela-lista small { display: block !important; color: #6b7280 !important; font-size: 10.5px !important; margin-top: 2px !important; }
    .fs-tabela-acoes { display: flex !important; flex-wrap: wrap !important; gap: 4px !important; justify-content: flex-end !important; }
    .fs-tabela-acoes button { min-height: 28px !important; padding: 5px 7px !important; border: 1px solid #d1d5db !important; background: #ffffff !important; color: #111827 !important; border-radius: 6px !important; font-size: 11px !important; font-weight: 900 !important; box-shadow: none !important; }
    .fs-tabela-acoes .verde { background: #ecfdf5 !important; color: #166534 !important; border-color: #bbf7d0 !important; }
    .fs-tabela-acoes .laranja { background: #fff7ed !important; color: #9a3412 !important; border-color: #fed7aa !important; }
    .fs-tabela-acoes .perigo { background: #fff5f5 !important; color: #b91c1c !important; border-color: #fecaca !important; }
    .fs-status-mini { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-height: 20px !important; padding: 2px 6px !important; border-radius: 999px !important; background: #f1f5f9 !important; border: 1px solid #cbd5e1 !important; color: #334155 !important; font-size: 10.5px !important; font-weight: 950 !important; margin: 1px !important; white-space: nowrap !important; }
    .fs-status-mini.ativo { background: #ecfdf5 !important; border-color: #bbf7d0 !important; color: #166534 !important; }
    .fs-status-mini.inativo { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #475569 !important; }
    .fs-status-mini.baixo { background: #fff7ed !important; border-color: #fed7aa !important; color: #9a3412 !important; }
  `);

  function nomeProduto(produto) { return String(produto?.nome || produto?.descricao || '').trim() || 'Produto sem descrição'; }
  function aplicacaoProduto(produto) {
    if (produto?.produto_universal === true) return 'Universal';
    const anos = [produto?.ano_inicial, produto?.ano_final].filter(Boolean).join(' a ');
    return [produto?.marca_veiculo, produto?.modelo_veiculo, produto?.versao_veiculo, produto?.motor_veiculo, anos || produto?.aplicacao].filter(Boolean).join(' • ') || '-';
  }
  function estoqueBaixo(produto) {
    if (produto?.ativo === false || produto?.controlar_estoque === false) return false;
    return fsConfigNumero(produto?.quantidade_atual) <= fsConfigNumero(produto?.estoque_minimo);
  }
  function renderTabela(lista) {
    const container = document.getElementById('lista-produtos-estoque');
    if (!container) return;
    const produtos = Array.isArray(lista) ? lista : [];
    window.produtosEstoqueCache = produtos;
    if (!produtos.length) {
      container.innerHTML = '<div class="estado-vazio"><strong>Nenhum produto encontrado</strong><p>Cadastre produtos ou ajuste os filtros.</p></div>';
      return;
    }
    const linhas = produtos.map((produto) => {
      const id = fsConfigEscaparHTML(produto.id || '');
      const nome = fsConfigEscaparHTML(nomeProduto(produto));
      const codigo = fsConfigEscaparHTML(produto.codigo || produto.codigo_original || produto.codigo_fabricante || '-');
      const fabricante = fsConfigEscaparHTML(produto.fabricante || produto.marca || '-');
      const categoria = fsConfigEscaparHTML(produto.categoria || 'Sem categoria');
      const subcategoria = fsConfigEscaparHTML(produto.subcategoria || 'Sem subcategoria');
      const aplicacao = fsConfigEscaparHTML(aplicacaoProduto(produto));
      const unidade = fsConfigEscaparHTML(produto.unidade || 'un');
      const quantidade = produto.controlar_estoque === false ? 'S/ctrl' : `${fsConfigQtd(produto.quantidade_atual)} ${unidade}`;
      const minimo = produto.controlar_estoque === false ? 'Sem controle' : `${fsConfigQtd(produto.estoque_minimo)} ${unidade}`;
      const venda = fsConfigMoeda(produto.valor_venda);
      const custo = fsConfigMoeda(produto.valor_custo);
      const status = [produto.ativo === false ? '<span class="fs-status-mini inativo">Inativo</span>' : '<span class="fs-status-mini ativo">Ativo</span>', produto.controlar_estoque === false ? '<span class="fs-status-mini inativo">Sem controle</span>' : '', estoqueBaixo(produto) ? '<span class="fs-status-mini baixo">Baixo</span>' : ''].filter(Boolean).join('');
      return `<tr><td><strong>${codigo}</strong><small>${categoria}</small></td><td><strong>${nome}</strong><small>${subcategoria}</small></td><td>${fabricante}<small>${aplicacao}</small></td><td style="text-align:right;"><strong>${quantidade}</strong><small>Mín: ${minimo}</small></td><td style="text-align:right;"><strong>${venda}</strong><small>Custo: ${custo}</small></td><td>${status}</td><td><div class="fs-tabela-acoes"><button type="button" onclick="editarProdutoEstoque('${id}')">Editar</button><button type="button" class="verde" onclick="abrirModalMovimentacaoEstoque('${id}', 'entrada')">Entrada</button><button type="button" class="laranja" onclick="abrirModalMovimentacaoEstoque('${id}', 'saida')">Saída</button><button type="button" onclick="abrirModalMovimentacaoEstoque('${id}', 'ajuste')">Ajuste</button><button type="button" class="perigo" onclick="excluirProdutoEstoque('${id}')">Excluir</button></div></td></tr>`;
    }).join('');
    container.innerHTML = `<div class="fs-tabela-lista-wrapper"><table class="fs-tabela-lista"><thead><tr><th style="width:120px;">Código</th><th style="width:210px;">Produto</th><th style="width:240px;">Aplicação</th><th style="width:120px;text-align:right;">Qtd</th><th style="width:130px;text-align:right;">Valor</th><th style="width:120px;">Status</th><th style="width:260px;text-align:right;">Ações</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }
  function instalarOverride() {
    if (window.__fsEstoqueTabelaConsolidada === true) return;
    if (typeof window.renderizarProdutosEstoque !== 'function') return;
    window.__fsEstoqueTabelaConsolidada = true;
    window.renderizarProdutosEstoqueOriginal = window.renderizarProdutosEstoque;
    window.renderizarProdutosEstoque = renderTabela;
    if (Array.isArray(window.produtosEstoqueCache) && window.produtosEstoqueCache.length) renderTabela(window.produtosEstoqueCache);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarOverride);
  else instalarOverride();
  [100, 300, 700, 1200, 2200, 4000].forEach((tempo) => setTimeout(instalarOverride, tempo));
}

function fsConfigAplicarCorrecoesPR8Consolidadas() {
  fsConfigAplicarGestaoGridConsolidado();
  fsConfigInstalarEstoqueTabelaConsolidada();
}

function fsConfigDecodificarPayloadJwt(token) {
  try {
    const partes = String(token || '').split('.');
    if (partes.length < 2) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (erro) { return null; }
}

function fsConfigValidarChaveSupabase() {
  const chave = String(SUPABASE_ANON_KEY || '').trim();
  if (!chave || chave.includes('COLE_AQUI')) {
    console.warn('SUPABASE_ANON_KEY não configurada. Cole a anon public key em config.js.');
    return false;
  }
  const payload = fsConfigDecodificarPayloadJwt(chave);
  if (payload?.role === 'service_role') {
    console.error('ERRO DE SEGURANÇA: config.js está usando service_role. Troque imediatamente pela anon public key e rotacione a service_role no Supabase.');
    return false;
  }
  if (payload?.role && payload.role !== 'anon') console.warn(`A chave Supabase informada tem role "${payload.role}". No frontend, o recomendado é role "anon".`);
  return true;
}

function inicializarSupabaseFS() {
  if (window._supabase) return window._supabase;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Biblioteca Supabase ainda não carregada. Verifique se o script @supabase/supabase-js vem antes do config.js.');
    return null;
  }
  if (!fsConfigValidarChaveSupabase()) return null;
  window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return window._supabase;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarSupabaseFS);
else inicializarSupabaseFS();

window.inicializarSupabaseFS = inicializarSupabaseFS;
window.fsConfigValidarChaveSupabase = fsConfigValidarChaveSupabase;
window.fsConfigBloquearZoomGlobal = fsConfigBloquearZoomGlobal;
window.fsConfigAplicarCorrecoesPR8Consolidadas = fsConfigAplicarCorrecoesPR8Consolidadas;

const FS_CONFIG_CSS_GLOBAIS = [
  ['fs-theme-cinza.css?v=20260622-limpeza-gerador-1', 'fs-theme-cinza-css']
];

const FS_CONFIG_SCRIPTS_GLOBAIS = [
  ['fs-auth-redirect-guard.js?v=20260624-index-sem-redirect-1', 'fs-auth-redirect-guard-js'],
  ['fs-pwa-register.js?v=20260622-limpeza-gerador-1', 'fs-pwa-register-js'],
  ['fs-session-cache.js?v=20260623-cache-dados-1', 'fs-session-cache-js'],
  ['fs-menu-close-outside.js?v=20260622-limpeza-gerador-1', 'fs-menu-close-outside-js'],
  ['fs-footer-legal.js?v=20260622-limpeza-gerador-1', 'fs-footer-legal-js']
];

const FS_CONFIG_CSS_POR_PAGINA = [
  { paginas: ['/gerador', '/gerador.html'], estilos: [['gerador.css?v=20260622-limpeza-gerador-1', 'fs-gerador-css']] },
  { paginas: ['/orcamentos', '/orcamentos.html'], estilos: [['orcamentos.css?v=20260622-limpeza-gerador-1', 'fs-orcamentos-css']] }
];

const FS_CONFIG_SCRIPTS_POR_PAGINA = [
  { paginas: ['/', '/index', '/index.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js'], ['fs-home-auth-fix.js?v=20260622-limpeza-gerador-1', 'fs-home-auth-fix-js'], ['fs-home-premium-dashboard.js?v=20260622-limpeza-gerador-1', 'fs-home-premium-dashboard-js']] },
  { paginas: ['/painel', '/painel.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js']] },
  { paginas: ['/ver', '/ver.html'], scripts: [['ver-cliente-fix.js?v=20260622-limpeza-gerador-1', 'fs-ver-cliente-fix-js']] },
  { paginas: ['/gerador', '/gerador.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js'], ['gerador-pdf-fix.js?v=20260622-limpeza-gerador-1', 'fs-gerador-pdf-fix-js']] },
  { paginas: ['/orcamentos', '/orcamentos.html'], scripts: [['orcamentos-pdf.js?v=20260622-limpeza-gerador-1', 'fs-orcamentos-pdf-js']] },
  { paginas: ['/ordens', '/ordens.html'], scripts: [['ordens-recorrente-prefill.js?v=20260622-limpeza-gerador-1', 'fs-ordens-recorrente-prefill-js']] },
  { paginas: ['/ordens', '/ordens.html', '/recorrentes', '/recorrentes.html', '/clientes', '/clientes.html'], scripts: [['fs-cliente-modal.js?v=20260622-limpeza-gerador-1', 'fs-cliente-modal-js']] },
  { paginas: ['/ordem', '/ordem.html'], scripts: [['ordem-extras.js?v=20260622-limpeza-gerador-1', 'fs-ordem-extras-js'], ['ordem-fotos-depois.js?v=20260622-limpeza-gerador-1', 'fs-ordem-fotos-depois-js'], ['ordem-pdf-fotos-depois.js?v=20260622-limpeza-gerador-1', 'fs-ordem-pdf-fotos-depois-js'], ['ordem-financeiro-nativo-fix.js?v=20260622-limpeza-gerador-1', 'fs-ordem-financeiro-nativo-fix-js'], ['ordem-garantia.js?v=20260622-limpeza-gerador-1', 'fs-ordem-garantia-js'], ['ordem-recibo.js?v=20260622-limpeza-gerador-1', 'fs-ordem-recibo-js']] }
];

function fsConfigNormalizarPathAtual() {
  const path = (window.location.pathname || '/').toLowerCase().replace(/\/$/, '');
  return path || '/';
}
function fsConfigPathCorresponde(pathAtual, pagina) {
  if (pagina === '/') return pathAtual === '/';
  return pathAtual === pagina || pathAtual.endsWith(pagina);
}
function fsConfigCarregarScriptUnico(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = src.startsWith('/') ? src : `/${src}`;
  script.async = false;
  script.onerror = () => console.warn(`Não foi possível carregar ${src}.`);
  document.head.appendChild(script);
}
function fsConfigCarregarCssUnico(href, id) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href.startsWith('/') ? href : `/${href}`;
  link.onerror = () => console.warn(`Não foi possível carregar ${href}.`);
  document.head.appendChild(link);
}
function fsConfigCarregarListaScripts(scripts) { scripts.forEach(([arquivo, id]) => fsConfigCarregarScriptUnico(arquivo, id)); }
function fsConfigCarregarListaCss(estilos) { estilos.forEach(([arquivo, id]) => fsConfigCarregarCssUnico(arquivo, id)); }
function fsConfigCarregarCssDaPagina(pathAtual) { FS_CONFIG_CSS_POR_PAGINA.forEach((grupo) => { if (grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina))) fsConfigCarregarListaCss(grupo.estilos); }); }
function fsConfigCarregarScriptsDaPagina(pathAtual) { FS_CONFIG_SCRIPTS_POR_PAGINA.forEach((grupo) => { if (grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina))) fsConfigCarregarListaScripts(grupo.scripts); }); }
function fsConfigModoEmbed() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('embed') === '1' || params.get('iframe') === '1' || document.documentElement.classList.contains('fs-embed');
  } catch (_) { return false; }
}
function fsConfigCarregarAjustesPagina() {
  const pathAtual = fsConfigNormalizarPathAtual();
  const modoEmbed = fsConfigModoEmbed();
  fsConfigBloquearZoomGlobal();
  fsConfigAplicarCorrecoesPR8Consolidadas();
  fsConfigCarregarListaCss(FS_CONFIG_CSS_GLOBAIS);
  fsConfigCarregarCssDaPagina(pathAtual);
  if (modoEmbed) return;
  fsConfigCarregarListaScripts(FS_CONFIG_SCRIPTS_GLOBAIS);
  fsConfigCarregarScriptsDaPagina(pathAtual);
}

fsConfigCarregarAjustesPagina();