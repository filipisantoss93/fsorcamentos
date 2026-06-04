let headerJaCarregado = false;

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

function irParaLogin() {
  if (typeof abrirModalLogin === 'function') {
    abrirModalLogin();
    return;
  }

  window.location.href = '/painel.html';
}

function toggleMenuMobile() {
  const menuLinha = document.querySelector('.header-menu-linha');

  if (menuLinha) {
    menuLinha.classList.toggle('menu-aberto');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarMenu();
});

function criarBotaoFlutuanteGeradorGlobal() {
  if (document.getElementById('btn-flutuante-gerador-global')) return;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'btn-flutuante-gerador-global';
  botao.innerHTML = '🧾 <span>Gerar orçamento</span>';
  botao.onclick = abrirGeradorGlobal;

  document.body.appendChild(botao);
}

function abrirGeradorGlobal() {
  const estaNaHome =
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname.endsWith('index.html');

  if (estaNaHome) {
    if (typeof abrirModalGerador === 'function') {
      abrirModalGerador();
      return;
    }

    const modal = document.getElementById('modal-gerador-orcamento');
    const formulario = document.getElementById('formulario-orcamento');

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('ativo');
      document.body.style.overflow = 'hidden';
    }

    if (formulario) {
      formulario.style.display = 'block';
    }

    return;
  }

  window.location.href = '/index.html?abrirGerador=1';
}

function abrirGeradorAutomaticamenteSeSolicitado() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('abrirGerador') !== '1') return;

  setTimeout(function() {
    if (typeof abrirModalGerador === 'function') {
      abrirModalGerador();
    } else {
      const modal = document.getElementById('modal-gerador-orcamento');
      const formulario = document.getElementById('formulario-orcamento');

      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('ativo');
        document.body.style.overflow = 'hidden';
      }

      if (formulario) {
        formulario.style.display = 'block';
      }
    }

    const novaUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, novaUrl);
  }, 700);
}

document.addEventListener('DOMContentLoaded', function() {
  criarBotaoFlutuanteGeradorGlobal();
  abrirGeradorAutomaticamenteSeSolicitado();
});