let headerJaCarregado = false;

/* =========================
   HELPERS GERAIS
========================= */

function fsNormalizarTextoMenu(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fsPaginaAtual() {
  const path = window.location.pathname || '/';

  if (path === '/') return '/index.html';

  return path;
}

function fsEstaNaPaginaGerador() {
  const path = fsPaginaAtual();

  return (
    path.endsWith('/gerador.html') ||
    path.endsWith('gerador.html')
  );
}

function fsEstaNaHome() {
  const path = fsPaginaAtual();

  return (
    path === '/index.html' ||
    path.endsWith('/index.html') ||
    path.endsWith('index.html')
  );
}

async function obterSessaoAtualMenu() {
  try {
    if (!window._supabase) return null;

    const { data, error } = await _supabase.auth.getSession();

    if (error) {
      console.warn('Erro ao buscar sessão no menu:', error);
      return null;
    }

    return data?.session || null;
  } catch (error) {
    console.warn('Não foi possível verificar sessão no menu:', error);
    return null;
  }
}

function fecharMenuMobileSeAberto() {
  const menuLinha = document.querySelector('.header-menu-linha');

  if (menuLinha) {
    menuLinha.classList.remove('menu-aberto');
  }
}

/* =========================
   CARREGAR HEADER / MENU
========================= */

async function carregarMenu(sessionRecebida = undefined) {
  const headerContainer = document.getElementById('header-container');

  if (!headerContainer) return;

  try {
    if (!headerJaCarregado) {
      const response = await fetch('/header.html');

      if (!response.ok) {
        console.error('Erro ao carregar header.html:', response.status);
        return;
      }

      const html = await response.text();

      headerContainer.innerHTML = html;
      headerContainer.style.display = 'block';
      headerJaCarregado = true;

      configurarLinksDoHeader();
      marcarLinkAtivoHeader();
    }

    let session = sessionRecebida;

    if (session === undefined) {
      session = await obterSessaoAtualMenu();
    }

    await atualizarHeaderUsuario(session || null);
    await controlarBotaoFlutuanteGeradorGlobal(session || null);

  } catch (error) {
    console.error('Erro ao carregar menu:', error);
  }
}

/* =========================
   HEADER USUÁRIO
========================= */

async function atualizarHeaderUsuario(session) {
  const saudacao = document.getElementById('usuario-saudacao');

  const btnEntrarDesktop = document.getElementById('btn-header-entrar');
  const btnSairDesktop = document.getElementById('btn-header-sair');

  const btnEntrarMobile = document.getElementById('btn-menu-mobile-entrar');
  const btnSairMobile = document.getElementById('btn-menu-mobile-sair');

  const btnNotificacoes = document.getElementById('btn-notificacoes');
  const contadorNotificacoes = document.getElementById('contador-notificacoes');

  if (!saudacao) return;

  function mostrarDeslogado() {
    saudacao.innerText = 'Olá, Convidado';

    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'inline-block';
    if (btnSairDesktop) btnSairDesktop.style.display = 'none';

    if (btnEntrarMobile) btnEntrarMobile.style.display = 'block';
    if (btnSairMobile) btnSairMobile.style.display = 'none';

    if (btnNotificacoes) btnNotificacoes.style.display = 'none';
    if (contadorNotificacoes) contadorNotificacoes.style.display = 'none';

    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_email');
    localStorage.removeItem('usuario_plano');
  }

  function mostrarLogado(nomeFinal) {
    saudacao.innerText = `Olá, ${nomeFinal}`;

    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'none';
    if (btnSairDesktop) btnSairDesktop.style.display = 'inline-block';

    if (btnEntrarMobile) btnEntrarMobile.style.display = 'none';
    if (btnSairMobile) btnSairMobile.style.display = 'block';

    if (btnNotificacoes) btnNotificacoes.style.display = 'inline-flex';
  }

  if (!session?.user?.id) {
    mostrarDeslogado();
    return;
  }

  let nomeFinal =
    localStorage.getItem('usuario_nome') ||
    session.user.user_metadata?.nome ||
    session.user.email?.split('@')[0] ||
    'Usuário';

  try {
    if (window._supabase) {
      const { data: perfil, error } = await _supabase
        .from('perfis')
        .select('nome, nome_empresa, plano')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && perfil) {
        nomeFinal =
          perfil.nome ||
          perfil.nome_empresa ||
          nomeFinal;

        localStorage.setItem('usuario_nome', nomeFinal);
        localStorage.setItem('usuario_email', session.user.email || '');
        localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
      } else {
        localStorage.setItem('usuario_nome', nomeFinal);
        localStorage.setItem('usuario_email', session.user.email || '');
      }
    }
  } catch (error) {
    console.warn('Não foi possível atualizar perfil no header:', error);
  }

  mostrarLogado(nomeFinal);
}

/* =========================
   LOGIN / LOGOUT / MENU MOBILE
========================= */

function irParaLogin() {
  fecharMenuMobileSeAberto();

  if (typeof abrirModalLogin === 'function') {
    abrirModalLogin();
    return;
  }

  window.location.href = '/index.html?login=1';
}

function toggleMenuMobile() {
  const menuLinha = document.querySelector('.header-menu-linha');

  if (menuLinha) {
    menuLinha.classList.toggle('menu-aberto');
  }
}

async function deslogar() {
  try {
    fecharMenuMobileSeAberto();

    if (window._supabase) {
      await _supabase.auth.signOut();
    }

    localStorage.removeItem('id');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_email');
    localStorage.removeItem('usuario_plano');
    localStorage.removeItem('usuario_plano_status');
    localStorage.removeItem('usuario_plano_expira_em');

    removerBotaoFlutuanteGeradorGlobal();

    await atualizarHeaderUsuario(null);

    window.location.href = '/index.html';
  } catch (error) {
    console.error('Erro ao sair:', error);
    alert('Não foi possível sair da conta. Tente novamente.');
  }
}

/* =========================
   LINKS DO HEADER
========================= */

function configurarLinksDoHeader() {
  const links = document.querySelectorAll('.header-menu-linha a');

  links.forEach(link => {
    link.addEventListener('click', () => {
      fecharMenuMobileSeAberto();
    });
  });
}

function marcarLinkAtivoHeader() {
  const paginaAtual = fsPaginaAtual();
  const links = document.querySelectorAll('.header-menu-linha a');

  links.forEach(link => {
    const href = link.getAttribute('href') || '';

    link.classList.remove('ativo');

    if (!href) return;

    const hrefNormalizado = href === '/' ? '/index.html' : href;

    if (
      paginaAtual === hrefNormalizado ||
      paginaAtual.endsWith(hrefNormalizado)
    ) {
      link.classList.add('ativo');
    }
  });
}

/* =========================
   BOTÃO FLUTUANTE GLOBAL
========================= */

async function controlarBotaoFlutuanteGeradorGlobal(sessionRecebida = undefined) {
  let session = sessionRecebida;

  if (session === undefined) {
    session = await obterSessaoAtualMenu();
  }

  if (!session?.user?.id) {
    removerBotaoFlutuanteGeradorGlobal();
    return;
  }

  if (fsEstaNaPaginaGerador()) {
    removerBotaoFlutuanteGeradorGlobal();
    return;
  }

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
  const botao = document.getElementById('btn-flutuante-gerador-global');

  if (botao) {
    botao.remove();
  }

  document.body.classList.remove('gerador-aberto');
}

async function abrirGeradorGlobal() {
  const session = await obterSessaoAtualMenu();

  if (!session?.user?.id) {
    removerBotaoFlutuanteGeradorGlobal();

    if (fsEstaNaHome() && typeof abrirModalLogin === 'function') {
      abrirModalLogin();
      return;
    }

    window.location.href = '/index.html?login=1';
    return;
  }

  window.location.href = '/gerador.html';
}

/* =========================
   PARÂMETROS DA URL
========================= */

function removerParametrosUrlMenu() {
  const novaUrl = window.location.origin + window.location.pathname;

  window.history.replaceState({}, document.title, novaUrl);
}

function abrirLoginAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('login') !== '1') return;

  setTimeout(function() {
    if (typeof abrirModalLogin === 'function') {
      abrirModalLogin();
    }

    removerParametrosUrlMenu();
  }, 600);
}

async function abrirGeradorAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('abrirGerador') !== '1') return;

  const session = await obterSessaoAtualMenu();

  if (!session?.user?.id) {
    removerParametrosUrlMenu();

    if (typeof abrirModalLogin === 'function') {
      abrirModalLogin();
    } else {
      window.location.href = '/index.html?login=1';
    }

    return;
  }

  removerParametrosUrlMenu();
  window.location.href = '/gerador.html';
}

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener('DOMContentLoaded', async () => {
  await carregarMenu();

  abrirLoginAutomaticamenteSeSolicitado();
  await abrirGeradorAutomaticamenteSeSolicitado();

  if (window._supabase) {
    _supabase.auth.onAuthStateChange(async (event, session) => {
      await atualizarHeaderUsuario(session || null);
      await controlarBotaoFlutuanteGeradorGlobal(session || null);

      if (!session) {
        removerBotaoFlutuanteGeradorGlobal();
      }
    });
  }
});

/* =========================
   EXPORTAR FUNÇÕES GLOBAIS
========================= */

window.carregarMenu = carregarMenu;
window.atualizarHeaderUsuario = atualizarHeaderUsuario;
window.irParaLogin = irParaLogin;
window.toggleMenuMobile = toggleMenuMobile;
window.deslogar = deslogar;
window.abrirGeradorGlobal = abrirGeradorGlobal;
window.controlarBotaoFlutuanteGeradorGlobal = controlarBotaoFlutuanteGeradorGlobal;