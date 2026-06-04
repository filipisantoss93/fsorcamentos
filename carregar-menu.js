let headerJaCarregado = false;
let observadorModalGeradorGlobal = null;

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
    }

    let session = sessionRecebida;

    if (session === undefined && window._supabase) {
      const { data } = await _supabase.auth.getSession();
      session = data.session;
    }

    await atualizarHeaderUsuario(session || null);
    await controlarBotaoFlutuanteGeradorGlobal(session || null);

  } catch (error) {
    console.error('Erro ao carregar menu:', error);
  }
}

async function atualizarHeaderUsuario(session) {
  const saudacao = document.getElementById('usuario-saudacao');

  const btnEntrarDesktop = document.getElementById('btn-header-entrar');
  const btnSairDesktop = document.getElementById('btn-header-sair');

  const btnEntrarMobile = document.getElementById('btn-menu-mobile-entrar');
  const btnSairMobile = document.getElementById('btn-menu-mobile-sair');

  if (!saudacao) return;

  function mostrarDeslogado() {
    saudacao.innerText = 'Olá, Convidado';

    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'inline-block';
    if (btnSairDesktop) btnSairDesktop.style.display = 'none';

    if (btnEntrarMobile) btnEntrarMobile.style.display = 'block';
    if (btnSairMobile) btnSairMobile.style.display = 'none';
  }

  function mostrarLogado(nomeFinal) {
    saudacao.innerText = `Olá, ${nomeFinal}`;

    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'none';
    if (btnSairDesktop) btnSairDesktop.style.display = 'inline-block';

    if (btnEntrarMobile) btnEntrarMobile.style.display = 'none';
    if (btnSairMobile) btnSairMobile.style.display = 'block';
  }

  if (!session) {
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
        localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
      }
    }
  } catch (error) {
    console.warn('Não foi possível atualizar perfil no header:', error);
  }

  mostrarLogado(nomeFinal);
}

/* =========================
   LOGIN / MENU MOBILE
========================= */

function irParaLogin() {
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

/* =========================
   BOTÃO FLUTUANTE GLOBAL
========================= */

async function obterSessaoAtualGeradorGlobal() {
  try {
    if (!window._supabase) return null;

    const { data: { session } } = await _supabase.auth.getSession();

    return session || null;
  } catch (error) {
    console.warn('Não foi possível verificar sessão do gerador global:', error);
    return null;
  }
}

function estaNaHomeGeradorGlobal() {
  const path = window.location.pathname;

  return (
    path === '/' ||
    path.endsWith('/index.html') ||
    path.endsWith('index.html')
  );
}

async function controlarBotaoFlutuanteGeradorGlobal(sessionRecebida = undefined) {
  let session = sessionRecebida;

  if (session === undefined) {
    session = await obterSessaoAtualGeradorGlobal();
  }

  if (!session?.user?.id) {
    removerBotaoFlutuanteGeradorGlobal();
    return;
  }

  criarBotaoFlutuanteGeradorGlobal();
}

function criarBotaoFlutuanteGeradorGlobal() {
  if (document.getElementById('btn-flutuante-gerador-global')) {
    observarEstadoModalGeradorGlobal();
    return;
  }

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'btn-flutuante-gerador-global';
  botao.innerHTML = '🧾 <span>Gerar orçamento</span>';
  botao.onclick = abrirGeradorGlobal;

  document.body.appendChild(botao);

  observarEstadoModalGeradorGlobal();
}

function removerBotaoFlutuanteGeradorGlobal() {
  const botao = document.getElementById('btn-flutuante-gerador-global');

  if (botao) {
    botao.remove();
  }

  document.body.classList.remove('gerador-aberto');
}

async function abrirGeradorGlobal() {
  const session = await obterSessaoAtualGeradorGlobal();

  if (!session?.user?.id) {
    removerBotaoFlutuanteGeradorGlobal();

    if (estaNaHomeGeradorGlobal() && typeof abrirModalLogin === 'function') {
      abrirModalLogin();
      return;
    }

    window.location.href = '/index.html?login=1';
    return;
  }

  if (!estaNaHomeGeradorGlobal()) {
    window.location.href = '/index.html?abrirGerador=1';
    return;
  }

  if (typeof abrirModalGerador === 'function') {
    abrirModalGerador();
    document.body.classList.add('gerador-aberto');
    return;
  }

  const modal = document.getElementById('modal-gerador-orcamento');
  const formulario = document.getElementById('formulario-orcamento');

  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('ativo');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('gerador-aberto');
  }

  if (formulario) {
    formulario.style.display = 'block';
  }
}

async function abrirGeradorAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('abrirGerador') !== '1') return;

  const session = await obterSessaoAtualGeradorGlobal();

  if (!session?.user?.id) {
    removerParametroUrlGeradorGlobal();

    if (typeof abrirModalLogin === 'function') {
      abrirModalLogin();
    } else {
      window.location.href = '/index.html?login=1';
    }

    return;
  }

  setTimeout(async function() {
    await abrirGeradorGlobal();
    removerParametroUrlGeradorGlobal();
  }, 700);
}

function abrirLoginAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('login') !== '1') return;

  setTimeout(function() {
    if (typeof abrirModalLogin === 'function') {
      abrirModalLogin();
    }

    removerParametroUrlGeradorGlobal();
  }, 600);
}

function removerParametroUrlGeradorGlobal() {
  const novaUrl = window.location.origin + window.location.pathname;

  window.history.replaceState({}, document.title, novaUrl);
}

function observarEstadoModalGeradorGlobal() {
  const modal = document.getElementById('modal-gerador-orcamento');

  if (!modal) return;

  if (observadorModalGeradorGlobal) {
    observadorModalGeradorGlobal.disconnect();
    observadorModalGeradorGlobal = null;
  }

  const atualizarEstado = () => {
    const aberto =
      modal.style.display === 'flex' ||
      modal.classList.contains('ativo') ||
      modal.classList.contains('active');

    if (aberto) {
      document.body.classList.add('gerador-aberto');
    } else {
      document.body.classList.remove('gerador-aberto');
    }
  };

  atualizarEstado();

  observadorModalGeradorGlobal = new MutationObserver(atualizarEstado);

  observadorModalGeradorGlobal.observe(modal, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
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
        document.body.classList.remove('gerador-aberto');
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
window.abrirGeradorGlobal = abrirGeradorGlobal;
window.controlarBotaoFlutuanteGeradorGlobal = controlarBotaoFlutuanteGeradorGlobal;