/* =========================================================
   FS ORÇAMENTOS - fs-session-cache.js
   Cache visual leve de sessão e dados.
   Não sobrescreve Storage.prototype e não bloqueia limpeza de localStorage.
   ========================================================= */
(function () {
  'use strict';

  const CHAVES_USUARIO = [
    'id',
    'usuario_email',
    'usuario_nome',
    'usuario_plano',
    'usuario_plano_status',
    'usuario_plano_expira_em',
    'nome_empresa',
    'telefone_empresa',
    'endereco_empresa',
    'cnpj_empresa',
    'foto_url'
  ];

  const PREFIXO_CACHE_DADOS_VISUAIS = 'fs_dados_visuais_cache:';
  const TEMPO_MAXIMO_CACHE_DADOS_MS = 1000 * 60 * 60 * 24 * 30;

  const CONFIG_CACHE_DADOS_VISUAIS = {
    painel: {
      caminhos: ['/painel', '/painel.html'],
      seletores: [
        ['#perfil-responsavel-selecionado', 'text'],
        ['#perfil-empresa', 'text'],
        ['#perfil-telefone', 'text'],
        ['#perfil-cnpj', 'text'],
        ['#perfil-endereco', 'text'],
        ['#perfil-plano', 'text'],
        ['#perfil-plano-status', 'text'],
        ['#perfil-plano-expira', 'text'],
        ['#perfil-plano-aviso', 'html'],
        ['#painel-recorrentes-vencidas', 'text'],
        ['#painel-recorrentes-7', 'text'],
        ['#painel-relatorio-faturado-mes', 'text'],
        ['#painel-relatorio-os-mes', 'text'],
        ['#painel-total-os', 'text'],
        ['#painel-os-abertas', 'text'],
        ['#painel-os-execucao', 'text'],
        ['#painel-os-concluidas', 'text'],
        ['#painel-total-valor-os', 'text'],
        ['#painel-faturamento-os-total', 'text'],
        ['#painel-recebido-mes-os', 'text'],
        ['#painel-os-pagas-mes', 'text'],
        ['#painel-ticket-medio-os', 'text'],
        ['#painel-orcamentos-aprovados', 'text'],
        ['#painel-orcamentos-convertidos-os', 'text'],
        ['#painel-os-pendentes-pagamento', 'text'],
        ['#painel-produtos-estoque-baixo', 'text'],
        ['#dash-total-orcamentos', 'text'],
        ['#dash-pendentes', 'text'],
        ['#dash-aprovados-mes', 'text'],
        ['#dash-valor-aprovado-mes', 'text'],
        ['#dash-taxa-aprovacao', 'text'],
        ['#dash-atualizado-em', 'text'],
        ['#lista-ultimas-os-finalizadas-painel', 'html'],
        ['#lista-ultimos-orcamentos-painel', 'html'],
        ['#lista-responsaveis', 'html'],
        ['#perfil-logo-img', 'attrs', ['src']]
      ]
    },
    ordens: {
      caminhos: ['/ordens', '/ordens.html'],
      seletores: [
        ['#lista-ordens', 'html'],
        ['#ordem-consultor-tecnico-visual', 'value'],
        ['#ordem-cliente-visual', 'text'],
        ['#ordem-cliente-detalhes', 'text']
      ]
    },
    clientes: {
      caminhos: ['/clientes', '/clientes.html'],
      seletores: [
        ['#lista-clientes', 'html'],
        ['#clientes-lista', 'html'],
        ['#resultado-clientes', 'html'],
        ['#total-clientes', 'text'],
        ['#clientes-total', 'text']
      ]
    },
    veiculos: {
      caminhos: ['/veiculos', '/veiculos.html'],
      seletores: [
        ['#lista-veiculos', 'html'],
        ['#veiculos-lista', 'html'],
        ['#resultado-veiculos', 'html'],
        ['#total-veiculos', 'text'],
        ['#veiculos-total', 'text']
      ]
    },
    estoque: {
      caminhos: ['/estoque', '/estoque.html'],
      seletores: [
        ['#lista-estoque', 'html'],
        ['#estoque-lista', 'html'],
        ['#resultado-estoque', 'html'],
        ['#total-produtos', 'text'],
        ['#estoque-total', 'text']
      ]
    },
    recorrentes: {
      caminhos: ['/recorrentes', '/recorrentes.html'],
      seletores: [
        ['#lista-recorrentes', 'html'],
        ['#recorrentes-lista', 'html'],
        ['#resultado-recorrentes', 'html']
      ]
    },
    relatorios: {
      caminhos: ['/relatorios', '/relatorios.html'],
      seletores: [
        ['#relatorio-conteudo', 'html'],
        ['#resultado-relatorios', 'html'],
        ['#lista-relatorios', 'html']
      ]
    }
  };

  let iniciado = false;
  let estiloInicialInstalado = false;
  let signOutInstalado = false;
  let cacheDadosVisualInstalado = false;
  let timerSalvarDadosVisual = null;

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function cacheTemUsuario() {
    const marcado = localStorage.getItem('fs_usuario_logado') === 'true';
    const temIdentidade = !!(localStorage.getItem('id') || localStorage.getItem('usuario_email'));
    const temPlano = !!localStorage.getItem('usuario_plano');
    return marcado || (temIdentidade && temPlano);
  }

  function planoCache() {
    return normalizar(localStorage.getItem('usuario_plano') || 'gratis');
  }

  function cachePremium() {
    return cacheTemUsuario() && planoCache() === 'premium';
  }

  function nomeCache() {
    return (
      localStorage.getItem('usuario_nome') ||
      localStorage.getItem('nome_empresa') ||
      localStorage.getItem('usuario_email')?.split('@')[0] ||
      'Usuário'
    );
  }

  function usuarioCacheId() {
    return (
      localStorage.getItem('id') ||
      localStorage.getItem('usuario_email') ||
      'usuario'
    );
  }

  function caminhoAtualNormalizado() {
    const path = (window.location.pathname || '/').toLowerCase().replace(/\/$/, '');
    return path || '/';
  }

  function pathCorresponde(pathAtual, pagina) {
    if (pagina === '/') return pathAtual === '/';
    return pathAtual === pagina || pathAtual.endsWith(pagina);
  }

  function obterConfigDadosVisuaisDaPagina() {
    const pathAtual = caminhoAtualNormalizado();
    return Object.entries(CONFIG_CACHE_DADOS_VISUAIS).find(([, config]) =>
      config.caminhos.some((pagina) => pathCorresponde(pathAtual, pagina))
    ) || null;
  }

  function aplicarClasseRaizCache() {
    const root = document.documentElement;
    if (!root) return;
    const logado = cacheTemUsuario();
    const plano = planoCache();
    root.classList.toggle('fs-cache-logado', logado);
    root.classList.toggle('fs-cache-premium', logado && plano === 'premium');
    root.classList.toggle('fs-cache-basico', logado && plano === 'basico');
    root.classList.toggle('fs-cache-gratis', !logado || plano === 'gratis');
  }

  function injetarEstiloInicial() {
    if (estiloInicialInstalado) return;
    estiloInicialInstalado = true;
    const style = document.createElement('style');
    style.id = 'fs-session-cache-style';
    style.textContent = `
      html.fs-cache-premium .teste-premium-card,
      html.fs-cache-premium .teste-premium-topo,
      html.fs-cache-premium .btn-teste-premium,
      html.fs-cache-premium .teste-gratis-premium,
      html.fs-cache-premium .fs-teste-premium,
      html.fs-cache-premium [data-teste-premium],
      html.fs-cache-premium [data-premium-trial],
      html.fs-cache-premium #teste-premium-topo,
      html.fs-cache-premium #bloco-teste-premium,
      html.fs-cache-premium #card-teste-premium,
      html.fs-cache-premium #teste-gratis-premium,
      html.fs-cache-premium #box-teste-gratis-premium {
        display: none !important;
        visibility: hidden !important;
      }
      html.fs-cache-premium #home-plano-gratis,
      html.fs-cache-premium #home-plano-basico {
        display: none !important;
      }
      html.fs-cache-premium #home-plano-premium {
        display: block;
      }
      html.fs-cache-logado.fs-cache-hidratando #conteudo-protegido {
        display: block;
      }
      html.fs-cache-logado.fs-cache-hidratando #auth-area {
        display: none;
      }
      .fs-cache-dados-restaurado::after {
        content: 'Atualizando em segundo plano...';
        display: inline-block;
        margin-left: 8px;
        font-size: 11px;
        font-weight: 600;
        opacity: .62;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function limparCacheDadosVisuaisUsuario() {
    Object.keys(localStorage).forEach((chave) => {
      if (chave.startsWith(PREFIXO_CACHE_DADOS_VISUAIS)) localStorage.removeItem(chave);
    });
  }

  function limparCacheUsuario() {
    CHAVES_USUARIO.forEach(chave => localStorage.removeItem(chave));
    localStorage.removeItem('fs_usuario_logado');
    localStorage.removeItem('fs_usuario_cache_atualizado_em');
    localStorage.removeItem('fs_logout_em_andamento');
    limparCacheDadosVisuaisUsuario();
    aplicarClasseRaizCache();
  }

  function marcarCacheLogado() {
    if (!localStorage.getItem('id') && !localStorage.getItem('usuario_email')) return;
    localStorage.setItem('fs_usuario_logado', 'true');
    localStorage.setItem('fs_usuario_cache_atualizado_em', new Date().toISOString());
    aplicarClasseRaizCache();
  }

  function aplicarHeaderCache() {
    if (!cacheTemUsuario()) return;
    const saudacao = document.getElementById('usuario-saudacao');
    const btnEntrarDesktop = document.getElementById('btn-header-entrar');
    const btnSairDesktop = document.getElementById('btn-header-sair');
    const btnEntrarMobile = document.getElementById('btn-menu-mobile-entrar');
    const btnSairMobile = document.getElementById('btn-menu-mobile-sair');
    const btnNotificacoes = document.getElementById('btn-notificacoes');

    if (saudacao) saudacao.innerText = `Olá, ${nomeCache()}`;
    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'none';
    if (btnSairDesktop) btnSairDesktop.style.display = 'inline-block';
    if (btnEntrarMobile) btnEntrarMobile.style.display = 'none';
    if (btnSairMobile) btnSairMobile.style.display = 'block';
    if (btnNotificacoes) btnNotificacoes.style.display = 'inline-flex';

    const nivel = planoCache() === 'premium' ? 2 : planoCache() === 'basico' ? 1 : 0;
    document.querySelectorAll('[data-plano-min]').forEach(link => {
      const min = normalizar(link.getAttribute('data-plano-min') || 'gratis');
      const minNivel = min === 'premium' ? 2 : min === 'basico' ? 1 : 0;
      const permitido = nivel >= minNivel;
      const li = link.closest('li');
      if (li) li.style.display = permitido ? '' : 'none';
      else link.style.display = permitido ? '' : 'none';
    });
  }

  function ocultarTestePremiumSeCachePremium() {
    if (!cachePremium()) return;
    const seletores = [
      '[data-teste-premium]',
      '[data-premium-trial]',
      '.teste-premium-card',
      '.teste-premium-topo',
      '.btn-teste-premium',
      '.teste-gratis-premium',
      '.fs-teste-premium',
      '#teste-premium-topo',
      '#bloco-teste-premium',
      '#card-teste-premium',
      '#teste-gratis-premium',
      '#box-teste-gratis-premium'
    ];
    seletores.forEach(seletor => {
      document.querySelectorAll(seletor).forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function aplicarHomeCache() {
    if (!cacheTemUsuario()) return;
    const plano = planoCache();
    const secoes = document.querySelectorAll('.home-visao-plano');
    if (!secoes.length) return;

    secoes.forEach(secao => {
      secao.classList.remove('ativo');
      secao.style.display = 'none';
    });

    const id = plano === 'premium'
      ? 'home-plano-premium'
      : plano === 'basico'
        ? 'home-plano-basico'
        : 'home-plano-gratis';

    const secao = document.getElementById(id);
    if (secao) {
      secao.classList.add('ativo');
      secao.style.display = 'block';
    }

    ocultarTestePremiumSeCachePremium();
  }

  function chaveCacheDadosVisuais(nomePagina) {
    return `${PREFIXO_CACHE_DADOS_VISUAIS}${usuarioCacheId()}:${nomePagina}`;
  }

  function lerCacheDadosVisuais(nomePagina) {
    try {
      const bruto = localStorage.getItem(chaveCacheDadosVisuais(nomePagina));
      if (!bruto) return null;
      const cache = JSON.parse(bruto);
      const atualizadoEm = new Date(cache?.atualizado_em || 0).getTime();
      if (!atualizadoEm || Date.now() - atualizadoEm > TEMPO_MAXIMO_CACHE_DADOS_MS) return null;
      return cache;
    } catch (erro) {
      console.warn('Cache visual de dados inválido:', erro);
      return null;
    }
  }

  function salvarCacheDadosVisuais(nomePagina, valoresNovos) {
    if (!cacheTemUsuario() || !nomePagina || !valoresNovos || !Object.keys(valoresNovos).length) return;

    try {
      const anterior = lerCacheDadosVisuais(nomePagina)?.valores || {};
      localStorage.setItem(chaveCacheDadosVisuais(nomePagina), JSON.stringify({
        atualizado_em: new Date().toISOString(),
        valores: { ...anterior, ...valoresNovos }
      }));
    } catch (erro) {
      console.warn('Não foi possível salvar cache visual de dados:', erro);
    }
  }

  function textoPareceCarregamento(valor) {
    const texto = normalizar(valor);
    if (!texto) return true;
    return [
      'carregando',
      'nenhuma os carregada',
      'use os filtros e clique em buscar',
      'nenhuma logo cadastrada',
      'nenhum orcamento criado ainda',
      'nenhuma os concluida',
      'erro ao carregar',
      'nao foi possivel carregar'
    ].some((trecho) => texto.includes(trecho));
  }

  function lerValorElemento(el, modo, attrs) {
    if (!el) return null;

    if (modo === 'text') {
      const valor = String(el.textContent || '').trim();
      return textoPareceCarregamento(valor) ? null : { modo, valor };
    }

    if (modo === 'value') {
      const valor = String(el.value || '').trim();
      return textoPareceCarregamento(valor) ? null : { modo, valor };
    }

    if (modo === 'attrs') {
      const valores = {};
      (attrs || []).forEach((attr) => {
        const valor = el.getAttribute(attr);
        if (valor) valores[attr] = valor;
      });
      return Object.keys(valores).length ? { modo, attrs: valores } : null;
    }

    const html = String(el.innerHTML || '').trim();
    return textoPareceCarregamento(html) ? null : { modo: 'html', valor: html };
  }

  function aplicarValorElemento(el, item) {
    if (!el || !item) return false;

    if (item.modo === 'text') {
      el.textContent = item.valor || '';
      return true;
    }

    if (item.modo === 'value') {
      el.value = item.valor || '';
      return true;
    }

    if (item.modo === 'attrs') {
      Object.entries(item.attrs || {}).forEach(([attr, valor]) => {
        if (valor) el.setAttribute(attr, valor);
      });
      if (el.tagName === 'IMG' && item.attrs?.src) el.style.display = 'block';
      return true;
    }

    el.innerHTML = item.valor || '';
    return true;
  }

  function aplicarFallbackPainelBasico() {
    if (!pathCorresponde(caminhoAtualNormalizado(), '/painel')) return;

    const mapa = {
      'perfil-responsavel-selecionado': localStorage.getItem('usuario_nome'),
      'perfil-empresa': localStorage.getItem('nome_empresa'),
      'perfil-telefone': localStorage.getItem('telefone_empresa'),
      'perfil-cnpj': localStorage.getItem('cnpj_empresa'),
      'perfil-endereco': localStorage.getItem('endereco_empresa'),
      'perfil-plano': localStorage.getItem('usuario_plano') ? `Plano ${localStorage.getItem('usuario_plano')}` : '',
      'perfil-plano-status': localStorage.getItem('usuario_plano_status'),
      'perfil-plano-expira': localStorage.getItem('usuario_plano_expira_em')
    };

    Object.entries(mapa).forEach(([id, valor]) => {
      const el = document.getElementById(id);
      if (el && valor && (!el.textContent || el.textContent.trim() === '-')) el.textContent = valor;
    });

    const logo = document.getElementById('perfil-logo-img');
    const foto = localStorage.getItem('foto_url');
    if (logo && foto && !logo.getAttribute('src')) {
      logo.setAttribute('src', foto);
      logo.style.display = 'block';
    }
  }

  function prepararTelaProtegidaComCache() {
    if (!cacheTemUsuario()) return;
    const conteudo = document.getElementById('conteudo-protegido');
    const authArea = document.getElementById('auth-area');
    if (conteudo) conteudo.style.display = 'block';
    if (authArea) authArea.style.display = 'none';
    document.documentElement.classList.add('fs-cache-hidratando');
  }

  function aplicarCacheDadosVisuais() {
    const encontrado = obterConfigDadosVisuaisDaPagina();
    if (!encontrado || !cacheTemUsuario()) return;

    const [nomePagina, config] = encontrado;
    const cache = lerCacheDadosVisuais(nomePagina);
    prepararTelaProtegidaComCache();
    aplicarFallbackPainelBasico();

    if (!cache?.valores) return;

    let aplicou = false;
    Object.entries(cache.valores).forEach(([selector, item]) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (aplicarValorElemento(el, item)) aplicou = true;
      });
    });

    if (aplicou) {
      document.documentElement.classList.add('fs-cache-dados-aplicado');
      const loadingOrdens = document.getElementById('loading-ordens');
      if (loadingOrdens) loadingOrdens.style.display = 'none';
      const listaOrdens = document.getElementById('lista-ordens');
      if (listaOrdens) listaOrdens.classList.add('fs-cache-dados-restaurado');
      const listaPainel = document.getElementById('lista-ultimos-orcamentos-painel');
      if (listaPainel) listaPainel.classList.add('fs-cache-dados-restaurado');
    }
  }

  function coletarCacheDadosVisuais() {
    const encontrado = obterConfigDadosVisuaisDaPagina();
    if (!encontrado || !cacheTemUsuario()) return;

    const [nomePagina, config] = encontrado;
    const valores = {};

    config.seletores.forEach(([selector, modo, attrs]) => {
      const el = document.querySelector(selector);
      const item = lerValorElemento(el, modo, attrs);
      if (item) valores[selector] = item;
    });

    salvarCacheDadosVisuais(nomePagina, valores);
  }

  function agendarSalvarCacheDadosVisuais() {
    if (timerSalvarDadosVisual) clearTimeout(timerSalvarDadosVisual);
    timerSalvarDadosVisual = setTimeout(coletarCacheDadosVisuais, 900);
  }

  function instalarCacheDadosVisuais() {
    if (cacheDadosVisualInstalado) return;
    if (!obterConfigDadosVisuaisDaPagina()) return;

    cacheDadosVisualInstalado = true;
    aplicarCacheDadosVisuais();
    setTimeout(aplicarCacheDadosVisuais, 80);
    setTimeout(aplicarCacheDadosVisuais, 300);
    setTimeout(aplicarCacheDadosVisuais, 900);

    const instalarObserver = () => {
      if (!document.body || !window.MutationObserver) return;
      const observer = new MutationObserver(agendarSalvarCacheDadosVisuais);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['src', 'style', 'class']
      });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarObserver, { once: true });
    else instalarObserver();

    setTimeout(coletarCacheDadosVisuais, 1800);
    setTimeout(coletarCacheDadosVisuais, 4500);
    setInterval(coletarCacheDadosVisuais, 15000);
    window.addEventListener('beforeunload', coletarCacheDadosVisuais);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') coletarCacheDadosVisuais();
    });
  }

  function aplicarCacheVisual() {
    aplicarClasseRaizCache();
    aplicarHeaderCache();
    aplicarHomeCache();
    aplicarCacheDadosVisuais();
  }

  async function aguardarSupabase(tentativas = 25) {
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

  async function salvarPerfilCache(session) {
    if (!session?.user?.id || !window._supabase) return;
    try {
      localStorage.setItem('id', session.user.id);
      localStorage.setItem('usuario_email', session.user.email || '');
      const { data: perfil, error } = await window._supabase
        .from('perfis')
        .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && perfil) {
        const nome = perfil.nome || perfil.nome_empresa || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
        localStorage.setItem('usuario_nome', nome);
        localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
        if (perfil.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
        else localStorage.removeItem('usuario_plano_status');
        if (perfil.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
        else localStorage.removeItem('usuario_plano_expira_em');
        if (perfil.nome_empresa) localStorage.setItem('nome_empresa', perfil.nome_empresa);
        if (perfil.telefone_empresa) localStorage.setItem('telefone_empresa', perfil.telefone_empresa);
        if (perfil.endereco_empresa) localStorage.setItem('endereco_empresa', perfil.endereco_empresa);
        if (perfil.cnpj_empresa) localStorage.setItem('cnpj_empresa', perfil.cnpj_empresa);
        if (perfil.foto_url) localStorage.setItem('foto_url', perfil.foto_url);
      }

      marcarCacheLogado();
      aplicarCacheVisual();
      instalarCacheDadosVisuais();
      if (typeof window.carregarMenu === 'function') window.carregarMenu(session);
      if (typeof window.fsAtualizarDashboardPremiumIndex === 'function') window.fsAtualizarDashboardPremiumIndex();
    } catch (error) {
      console.warn('Não foi possível atualizar cache de sessão:', error);
    }
  }

  function instalarPatchSignOut() {
    if (signOutInstalado || !window._supabase?.auth?.signOut) return;
    signOutInstalado = true;
    const originalSignOut = window._supabase.auth.signOut.bind(window._supabase.auth);
    window._supabase.auth.signOut = async function signOutFSCache(...args) {
      localStorage.setItem('fs_logout_em_andamento', '1');
      limparCacheUsuario();
      return originalSignOut(...args);
    };
  }

  async function confirmarSessaoEmSegundoPlano() {
    const ok = await aguardarSupabase();
    if (!ok) return;
    instalarPatchSignOut();
    try {
      const { data, error } = await window._supabase.auth.getSession();
      if (error) console.warn('Cache sessão: erro ao confirmar sessão:', error);
      const session = data?.session || null;
      if (session?.user?.id) {
        await salvarPerfilCache(session);
        return;
      }
      limparCacheUsuario();
      if (typeof window.carregarMenu === 'function') window.carregarMenu(null);
    } catch (error) {
      console.warn('Cache sessão: falha ao confirmar sessão:', error);
    }
  }

  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    aplicarClasseRaizCache();
    if (cacheTemUsuario()) marcarCacheLogado();
    aplicarCacheVisual();
    instalarCacheDadosVisuais();
    setTimeout(aplicarCacheVisual, 80);
    setTimeout(aplicarCacheVisual, 350);
    setTimeout(aplicarCacheVisual, 1000);
    confirmarSessaoEmSegundoPlano();
    setTimeout(confirmarSessaoEmSegundoPlano, 1200);
  }

  window.fsCacheSessaoTemUsuario = cacheTemUsuario;
  window.fsAplicarCacheSessaoVisual = aplicarCacheVisual;
  window.fsConfirmarSessaoEmSegundoPlano = confirmarSessaoEmSegundoPlano;
  window.fsLimparCacheSessao = limparCacheUsuario;
  window.fsAplicarCacheDadosVisuais = aplicarCacheDadosVisuais;
  window.fsSalvarCacheDadosVisuaisAgora = coletarCacheDadosVisuais;

  aplicarClasseRaizCache();
  injetarEstiloInicial();
  iniciar();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  }
})();