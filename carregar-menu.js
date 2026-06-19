let headerJaCarregado = false;
let fsMenuInicializado = false;

function fsModoEmbedGestao() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('embed') === '1' || params.get('iframe') === '1';
  } catch (_) {
    return false;
  }
}

function aplicarModoEmbedGestao() {
  if (!fsModoEmbedGestao()) return false;
  document.documentElement.classList.add('modo-embed-gestao');
  document.body?.classList.add('modo-embed-gestao');
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.innerHTML = '';
    headerContainer.style.display = 'none';
  }
  document.querySelectorAll('footer, .footer, .site-footer, .forum-footer').forEach(el => {
    el.style.display = 'none';
  });
  return true;
}

function fsGarantirCss(id, href) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function garantirCssHeaderFS() {
  fsGarantirCss('fs-header-clean-css', '/header-clean.css?v=20260617-3');
  fsGarantirCss('fs-auth-clean-css', '/auth-clean.css?v=20260618-4');
  fsGarantirCss('fs-brand-contrast-css', '/brand-contrast-fix.css?v=20260618-1');
  fsGarantirCss('fs-login-modal-behavior-css', '/login-modal-behavior.css?v=20260618-1');
}

function fsNormalizarTextoMenu(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function fsPaginaAtual() {
  const path = window.location.pathname || '/';
  return path === '/' ? '/index.html' : path;
}

function fsEstaNaPaginaGerador() {
  const path = fsPaginaAtual();
  return path.endsWith('/gerador.html') || path.endsWith('gerador.html');
}

function fsEstaNaHome() {
  const path = fsPaginaAtual();
  return path === '/index.html' || path.endsWith('/index.html') || path.endsWith('index.html');
}

async function obterSessaoAtualMenu() {
  try {
    if (!window._supabase) return null;
    const { data, error } = await _supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch (_) {
    return null;
  }
}

async function carregarHeaderHtmlMenu() {
  const caminhos = ['/header.html', 'header.html', './header.html'];
  let ultimoErro = null;
  for (const caminho of caminhos) {
    try {
      const response = await fetch(caminho, { cache: 'no-cache' });
      if (response.ok) return await response.text();
      ultimoErro = new Error(`Falha ao carregar ${caminho}: ${response.status}`);
    } catch (error) {
      ultimoErro = error;
    }
  }
  throw ultimoErro || new Error('Não foi possível carregar header.html.');
}

function fecharMenuMobileSeAberto() {
  const menuLinha = document.querySelector('.header-menu-linha');
  const header = document.querySelector('.main-header');
  if (menuLinha) menuLinha.classList.remove('menu-aberto');
  if (header) header.classList.remove('menu-aberto');
}

function toggleMenuMobile() {
  const menuLinha = document.querySelector('.header-menu-linha');
  const header = document.querySelector('.main-header');
  if (menuLinha) menuLinha.classList.toggle('menu-aberto');
  if (header) header.classList.toggle('menu-aberto', menuLinha?.classList.contains('menu-aberto'));
}

function configurarLinksDoHeader() {
  document.querySelectorAll('.header-menu-linha a').forEach(link => link.addEventListener('click', fecharMenuMobileSeAberto));
}

function configurarDropdownsHeader() {
  return;
}

function marcarLinkAtivoHeader() {
  const paginaAtual = fsPaginaAtual();
  document.querySelectorAll('.header-menu-linha a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const hrefNormalizado = href === '/' ? '/index.html' : href;
    link.classList.remove('ativo');
    if (hrefNormalizado && (paginaAtual === hrefNormalizado || paginaAtual.endsWith(hrefNormalizado))) link.classList.add('ativo');
  });
}

function fsPlanoMenuAtual() {
  return fsNormalizarTextoMenu(localStorage.getItem('usuario_plano') || 'gratis');
}

function fsPlanoMenuOrdem(plano) {
  const p = fsNormalizarTextoMenu(plano);
  if (p === 'premium') return 2;
  if (p === 'basico') return 1;
  return 0;
}

function aplicarVisibilidadeMenuPorPlano() {
  const nivelAtual = fsPlanoMenuOrdem(fsPlanoMenuAtual());
  document.querySelectorAll('[data-plano-min]').forEach(link => {
    const minimo = link.getAttribute('data-plano-min') || 'gratis';
    const permitido = nivelAtual >= fsPlanoMenuOrdem(minimo);
    const li = link.closest('li');
    if (li) li.style.display = permitido ? '' : 'none';
    else link.style.display = permitido ? '' : 'none';
  });
}

async function verificarExpiracaoTestePremiumMenu() {
  try {
    if (!window._supabase) return null;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return null;
    const { data, error } = await _supabase.rpc('verificar_expiracao_teste_premium');
    if (error) return null;
    if (data?.plano) localStorage.setItem('usuario_plano', data.plano);
    if (data?.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
    else localStorage.removeItem('usuario_plano_status');
    if (data?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
    else if (data?.plano === 'basico') localStorage.removeItem('usuario_plano_expira_em');
    return data || null;
  } catch (_) {
    return null;
  }
}

async function atualizarHeaderUsuario(session) {
  const saudacao = document.getElementById('usuario-saudacao');
  const btnEntrarDesktop = document.getElementById('btn-header-entrar');
  const btnSairDesktop = document.getElementById('btn-header-sair');
  const btnEntrarMobile = document.getElementById('btn-menu-mobile-entrar');
  const btnSairMobile = document.getElementById('btn-menu-mobile-sair');
  const btnNotificacoes = document.getElementById('btn-notificacoes');
  const contadorNotificacoes = document.getElementById('contador-notificacoes');
  if (!saudacao) return;

  if (!session?.user?.id) {
    saudacao.innerText = 'Olá, Convidado';
    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'inline-flex';
    if (btnSairDesktop) btnSairDesktop.style.display = 'none';
    if (btnEntrarMobile) btnEntrarMobile.style.display = 'inline-flex';
    if (btnSairMobile) btnSairMobile.style.display = 'none';
    if (btnNotificacoes) btnNotificacoes.style.display = 'none';
    if (contadorNotificacoes) contadorNotificacoes.style.display = 'none';
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_email');
    localStorage.removeItem('usuario_plano');
    aplicarVisibilidadeMenuPorPlano();
    return;
  }

  let nomeFinal = localStorage.getItem('usuario_nome') || session.user.user_metadata?.nome || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Visitante';

  try {
    await verificarExpiracaoTestePremiumMenu();
    if (window._supabase) {
      const { data: perfil, error } = await _supabase.from('perfis').select('nome, nome_empresa, plano, plano_status, plano_expira_em').eq('id', session.user.id).maybeSingle();
      if (!error && perfil) {
        nomeFinal = perfil.nome || perfil.nome_empresa || nomeFinal;
        localStorage.setItem('usuario_nome', nomeFinal);
        localStorage.setItem('usuario_email', session.user.email || '');
        localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
        if (perfil.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
        else localStorage.removeItem('usuario_plano_status');
        if (perfil.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
        else localStorage.removeItem('usuario_plano_expira_em');
      }
    }
  } catch (_) {}

  saudacao.innerText = `Olá, ${nomeFinal}`;
  if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'none';
  if (btnSairDesktop) btnSairDesktop.style.display = 'inline-flex';
  if (btnEntrarMobile) btnEntrarMobile.style.display = 'none';
  if (btnSairMobile) btnSairMobile.style.display = 'inline-flex';
  if (btnNotificacoes) btnNotificacoes.style.display = 'inline-flex';
  aplicarVisibilidadeMenuPorPlano();
}

function irParaLogin() {
  fecharMenuMobileSeAberto();
  if (typeof abrirModalLogin === 'function') return abrirModalLogin();
  window.location.href = '/index.html?login=1';
}

async function deslogar() {
  try {
    fecharMenuMobileSeAberto();
    if (window._supabase) await _supabase.auth.signOut();
    ['id','usuario_nome','usuario_email','usuario_plano','usuario_plano_status','usuario_plano_expira_em','nome_empresa','telefone_empresa','endereco_empresa','cnpj_empresa','foto_url'].forEach(chave => localStorage.removeItem(chave));
    removerBotaoFlutuanteGeradorGlobal();
    await atualizarHeaderUsuario(null);
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Erro ao sair:', error);
    alert('Não foi possível sair da conta. Tente novamente.');
  }
}

async function controlarBotaoFlutuanteGeradorGlobal(sessionRecebida = undefined) {
  if (fsModoEmbedGestao()) return removerBotaoFlutuanteGeradorGlobal();
  let session = sessionRecebida;
  if (session === undefined) session = await obterSessaoAtualMenu();
  if (!session?.user?.id || fsEstaNaPaginaGerador()) return removerBotaoFlutuanteGeradorGlobal();
  criarBotaoFlutuanteGeradorGlobal();
}

function criarBotaoFlutuanteGeradorGlobal() {
  if (document.getElementById('btn-flutuante-gerador-global')) return;
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'btn-flutuante-gerador-global';
  botao.innerHTML = '🧾 <span>Gerar orçamento</span>';
  botao.title = 'Gerar orçamento';
  botao.setAttribute('aria-label', 'Gerar orçamento');
  botao.onclick = abrirGeradorGlobal;
  document.body.appendChild(botao);
}

function removerBotaoFlutuanteGeradorGlobal() {
  document.getElementById('btn-flutuante-gerador-global')?.remove();
  document.body.classList.remove('gerador-aberto');
}

async function abrirGeradorGlobal() {
  const session = await obterSessaoAtualMenu();
  if (!session?.user?.id) {
    removerBotaoFlutuanteGeradorGlobal();
    if (fsEstaNaHome() && typeof abrirModalLogin === 'function') return abrirModalLogin();
    window.location.href = '/index.html?login=1';
    return;
  }
  window.location.href = '/gerador.html';
}

function removerParametrosUrlMenu() {
  const novaUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, novaUrl);
}

function abrirLoginAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('login') !== '1') return;
  setTimeout(() => {
    if (typeof abrirModalLogin === 'function') abrirModalLogin();
    removerParametrosUrlMenu();
  }, 600);
}

async function abrirGeradorAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('abrirGerador') !== '1') return;
  const session = await obterSessaoAtualMenu();
  removerParametrosUrlMenu();
  if (!session?.user?.id) {
    if (typeof abrirModalLogin === 'function') abrirModalLogin();
    else window.location.href = '/index.html?login=1';
    return;
  }
  window.location.href = '/gerador.html';
}

function configurarHeaderInteligente() {
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;
  headerContainer.classList.remove('header-oculto');
  headerContainer.classList.add('header-visivel');
}

function controlarHeaderInteligente() {
  configurarHeaderInteligente();
}

async function carregarMenu(sessionRecebida = undefined) {
  if (aplicarModoEmbedGestao()) return;
  garantirCssHeaderFS();
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;

  try {
    if (!headerJaCarregado) {
      headerContainer.innerHTML = await carregarHeaderHtmlMenu();
      headerContainer.style.display = 'block';
      headerJaCarregado = true;
      configurarLinksDoHeader();
      configurarDropdownsHeader();
      marcarLinkAtivoHeader();
      configurarHeaderInteligente();
    }

    const session = sessionRecebida === undefined ? await obterSessaoAtualMenu() : sessionRecebida;
    await atualizarHeaderUsuario(session || null);
    aplicarVisibilidadeMenuPorPlano();
    await controlarBotaoFlutuanteGeradorGlobal(session || null);
    configurarHeaderInteligente();
  } catch (error) {
    console.error('Erro ao carregar menu:', error);
  }
}

async function inicializarMenuFS() {
  if (fsMenuInicializado) return;
  fsMenuInicializado = true;
  if (aplicarModoEmbedGestao()) return;
  garantirCssHeaderFS();
  await carregarMenu();
  abrirLoginAutomaticamenteSeSolicitado();
  await abrirGeradorAutomaticamenteSeSolicitado();

  if (window._supabase) {
    _supabase.auth.onAuthStateChange(async (event, session) => {
      await atualizarHeaderUsuario(session || null);
      aplicarVisibilidadeMenuPorPlano();
      await controlarBotaoFlutuanteGeradorGlobal(session || null);
      if (!session) removerBotaoFlutuanteGeradorGlobal();
      configurarHeaderInteligente();
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarMenuFS);
else inicializarMenuFS();

window.carregarMenu = carregarMenu;
window.verificarExpiracaoTestePremiumMenu = verificarExpiracaoTestePremiumMenu;
window.atualizarHeaderUsuario = atualizarHeaderUsuario;
window.irParaLogin = irParaLogin;
window.toggleMenuMobile = toggleMenuMobile;
window.deslogar = deslogar;
window.abrirGeradorGlobal = abrirGeradorGlobal;
window.controlarBotaoFlutuanteGeradorGlobal = controlarBotaoFlutuanteGeradorGlobal;
window.configurarHeaderInteligente = configurarHeaderInteligente;
window.controlarHeaderInteligente = controlarHeaderInteligente;
window.aplicarVisibilidadeMenuPorPlano = aplicarVisibilidadeMenuPorPlano;
window.inicializarMenuFS = inicializarMenuFS;