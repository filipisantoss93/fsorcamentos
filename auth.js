window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== CONFIGURAÇÃO GLOBAL ====================

let modoAtual = 'login';

const PAGINAS_PROTEGIDAS = [
  'painel.html',
  'painel',
  'orcamentos.html',
  'orcamentos'
];

function paginaAtualProtegida() {
  const path = window.location.pathname
    .toLowerCase()
    .replace(/\/$/, '');

  return (
    path.endsWith('/painel') ||
    path.endsWith('/painel.html') ||
    path.endsWith('/orcamentos') ||
    path.endsWith('/orcamentos.html')
  );
}

function ehPaginaIndex() {
  const path = window.location.pathname
    .toLowerCase()
    .replace(/\/$/, '');

  return (
    path === '' ||
    path === '/' ||
    path.endsWith('/index') ||
    path.endsWith('/index.html')
  );
}

// ==================== CONTROLE DE TELA ====================

function atualizarTelaAutenticacao(session) {
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');

  const conteudoProtegido =
    document.getElementById('conteudo-protegido') ||
    document.getElementById('painel-conteudo') ||
    document.getElementById('orcamentos-conteudo');

  const homePublica = document.getElementById('home-publica');
  const formularioOrcamento = document.getElementById('formulario-orcamento');
  const modalGerador = document.getElementById('modal-gerador-orcamento');
  const modalLogin = document.getElementById('modal-login');

  const paginaProtegida = paginaAtualProtegida();

  // HEADER NUNCA É ESCONDIDO AQUI.
  // O header é controlado pelo carregar-menu.js.

  if (paginaProtegida) {
    if (session) {
      if (authArea) authArea.style.display = 'none';
      if (authContainer) authContainer.style.display = 'none';
      if (conteudoProtegido) conteudoProtegido.style.display = 'block';
    } else {
      if (authArea) authArea.style.display = 'block';
      if (authContainer) authContainer.style.display = 'block';
      if (conteudoProtegido) conteudoProtegido.style.display = 'none';
    }

    return;
  }

  // INDEX PÚBLICO
  if (ehPaginaIndex()) {
    if (homePublica) {
      homePublica.style.display = 'block';
    }

    if (formularioOrcamento) {
      formularioOrcamento.style.display = 'none';
    }

    if (modalGerador) {
      modalGerador.style.display = 'none';
    }

    if (modalLogin) {
      modalLogin.style.display = 'none';
    }

    // IMPORTANTE:
    // No index, o auth-area fica dentro do modal-login.
    // Então não escondemos authArea/authContainer aqui.
    if (authArea) authArea.style.display = 'block';
    if (authContainer) authContainer.style.display = 'block';

    return;
  }

  // OUTRAS PÁGINAS PÚBLICAS
  if (authArea) authArea.style.display = 'none';
  if (authContainer) authContainer.style.display = 'none';
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await _supabase.auth.getSession();

  console.log('Sessão inicial:', session);

  if (session) {
    await carregarPerfilLocal(session);
  }

  atualizarTelaAutenticacao(session);

  if (typeof carregarMenu === 'function') {
    await carregarMenu(session);
  }

  configurarEventosModais();

  _supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth mudou:', event, session);

    if (session) {
      await carregarPerfilLocal(session);
    }

    atualizarTelaAutenticacao(session);

    if (typeof carregarMenu === 'function') {
      await carregarMenu(session);
    }

    if (event === 'SIGNED_OUT') {
      localStorage.clear();

      atualizarTelaAutenticacao(null);

      if (typeof carregarMenu === 'function') {
        await carregarMenu(null);
      }

      if (paginaAtualProtegida()) {
        window.location.reload();
      }
    }
  });
});

// ==================== CARREGAR PERFIL LOCAL ====================

async function carregarPerfilLocal(session) {
  if (!session?.user?.id) return;

  try {
    localStorage.setItem('id', session.user.id);
    localStorage.setItem('usuario_email', session.user.email || '');

    const { data: perfil, error } = await _supabase
      .from('perfis')
      .select('plano, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perfil local:', error);
      return;
    }

    const nomeFinal =
      perfil?.nome ||
      perfil?.nome_empresa ||
      session.user.email?.split('@')[0] ||
      'Usuário';

    localStorage.setItem('usuario_nome', nomeFinal);
    localStorage.setItem('usuario_plano', perfil?.plano || 'gratis');

    if (perfil?.nome_empresa) {
      localStorage.setItem('nome_empresa', perfil.nome_empresa);
    }

    if (perfil?.telefone_empresa) {
      localStorage.setItem('telefone_empresa', perfil.telefone_empresa);
    }

    if (perfil?.endereco_empresa) {
      localStorage.setItem('endereco_empresa', perfil.endereco_empresa);
    }

    if (perfil?.cnpj_empresa) {
      localStorage.setItem('cnpj_empresa', perfil.cnpj_empresa);
    }

    if (perfil?.foto_url) {
      localStorage.setItem('foto_url', perfil.foto_url);
    }

  } catch (err) {
    console.error('Erro inesperado ao carregar perfil local:', err);
  }
}

// ==================== LOGIN / CADASTRO ====================

function alternarModo(event) {
  event.preventDefault();

  const titulo = document.getElementById('auth-titulo');
  const btnPrincipal = document.getElementById('btn-principal');
  const linkAlternar = document.getElementById('link-alternar');
  const grupoConfirmar = document.getElementById('grupo-confirmar-senha');
  const grupoNome = document.getElementById('grupo-nome');
  const grupoEmpresa = document.getElementById('grupo-nome-empresa');
  const grupoWhatsapp = document.getElementById('grupo-whatsapp-empresa');

  if (!titulo || !btnPrincipal || !linkAlternar) return;

  if (modoAtual === 'login') {
    modoAtual = 'cadastro';

    titulo.innerText = 'Crie sua Conta';
    btnPrincipal.innerText = 'Cadastrar';
    btnPrincipal.style.backgroundColor = '#28a745';
    linkAlternar.innerText = 'Já é cadastrado? Clique aqui.';

    if (grupoConfirmar) grupoConfirmar.style.display = 'block';
    if (grupoNome) grupoNome.style.display = 'block';
    if (grupoEmpresa) grupoEmpresa.style.display = 'block';
    if (grupoWhatsapp) grupoWhatsapp.style.display = 'block';

  } else {
    modoAtual = 'login';

    titulo.innerText = 'Acesse sua Conta';
    btnPrincipal.innerText = 'Entrar';
    btnPrincipal.style.backgroundColor = '#007bff';
    linkAlternar.innerText = 'Não tem cadastro? Clique aqui.';

    if (grupoConfirmar) grupoConfirmar.style.display = 'none';
    if (grupoNome) grupoNome.style.display = 'none';
    if (grupoEmpresa) grupoEmpresa.style.display = 'none';
    if (grupoWhatsapp) grupoWhatsapp.style.display = 'none';
  }
}

async function enviarFormulario() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const senha = document.getElementById('auth-senha')?.value;
  const btn = document.getElementById('btn-principal');

  if (!email || !senha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  if (btn) {
    btn.innerText = 'Aguarde...';
    btn.disabled = true;
  }

  if (modoAtual === 'login') {
    await logarUsuario(email, senha);
  } else {
    const confirmarSenha =
      document.getElementById('auth-confirmar-senha')?.value;

    if (senha !== confirmarSenha) {
      if (btn) {
        btn.innerText = 'Cadastrar';
        btn.disabled = false;
      }

      alert('As senhas não coincidem.');
      return;
    }

    await cadastrarUsuario(email, senha);
  }
}

async function logarUsuario(email, senha) {
  const btn = document.getElementById('btn-principal');

  const { error } = await _supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert('Usuário ou senha incorretos.');

    if (btn) {
      btn.innerText = 'Entrar';
      btn.disabled = false;
    }

    return;
  }

  if (btn) {
    btn.innerText = 'Entrar';
    btn.disabled = false;
  }

  const { data: { session } } = await _supabase.auth.getSession();

  if (session) {
    await carregarPerfilLocal(session);

    atualizarTelaAutenticacao(session);

    if (typeof carregarMenu === 'function') {
      await carregarMenu(session);
    }

    fecharModalLogin();
  }
}

async function cadastrarUsuario(email, senha) {
  const nome = document.getElementById('auth-nome')?.value?.trim() || '';
  const nomeEmpresa = document.getElementById('reg-nome-empresa')?.value?.trim() || '';
  const telefone = document.getElementById('reg-telefone-empresa')?.value?.trim() || '';
  const btn = document.getElementById('btn-principal');

  if (!nome || !nomeEmpresa || !telefone) {
    alert('Preencha nome, empresa e WhatsApp.');

    if (btn) {
      btn.innerText = 'Cadastrar';
      btn.disabled = false;
    }

    return;
  }

  if (btn) {
    btn.innerText = 'Cadastrando...';
    btn.disabled = true;
  }

  const { data: authData, error: authError } = await _supabase.auth.signUp({
    email,
    password: senha
  });

  if (authError) {
    alert('Erro: ' + authError.message);

    if (btn) {
      btn.innerText = 'Cadastrar';
      btn.disabled = false;
    }

    return;
  }

  if (authData.user) {
    const payload = {
      id: authData.user.id,
      nome,
      nome_empresa: nomeEmpresa,
      telefone_empresa: telefone,
      plano: 'gratis'
    };

    const { error: perfilError } = await _supabase
      .from('perfis')
      .upsert([payload]);

    if (perfilError) {
      console.error('Erro ao salvar perfil:', perfilError);
      alert('Conta criada, mas houve erro ao salvar o perfil.');
    } else {
      alert('Cadastro realizado com sucesso!');
    }
  }

  if (btn) {
    btn.innerText = 'Cadastrar';
    btn.disabled = false;
  }

  const { data: { session } } = await _supabase.auth.getSession();

  if (session) {
    await carregarPerfilLocal(session);

    atualizarTelaAutenticacao(session);

    if (typeof carregarMenu === 'function') {
      await carregarMenu(session);
    }

    fecharModalLogin();
  }
}

// ==================== LOGOUT ====================

async function deslogar() {
  const { error } = await _supabase.auth.signOut();

  if (error) {
    console.error(error);
    alert('Erro ao sair.');
    return;
  }

  localStorage.clear();

  if (typeof carregarMenu === 'function') {
    await carregarMenu(null);
  }

  window.location.href = '/index.html';
}

// ==================== HELPERS DE PLANO ====================

function usuarioPodeSalvarOrcamento() {
  const plano = localStorage.getItem('usuario_plano') || 'gratis';

  return plano === 'basico' || plano === 'premium';
}

function usuarioPodeSalvarOrcamentoLocal() {
  return usuarioPodeSalvarOrcamento();
}

function usuarioPremium() {
  const plano = localStorage.getItem('usuario_plano') || 'gratis';

  return plano === 'premium';
}

// ==================== MODAL DE LOGIN ====================

function abrirModalLogin() {
  const modal = document.getElementById('modal-login');
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');

  if (!modal) {
    window.location.href = '/painel.html';
    return;
  }

  if (authArea) authArea.style.display = 'block';
  if (authContainer) authContainer.style.display = 'block';

  modal.style.display = 'flex';
  document.body.classList.add('login-modal-aberto');
}

function fecharModalLogin() {
  const modal = document.getElementById('modal-login');

  if (!modal) return;

  modal.style.display = 'none';
  document.body.classList.remove('login-modal-aberto');
}

// ==================== MODAL DO GERADOR ====================

async function abrirModalGerador() {
  const { data: { session } } = await _supabase.auth.getSession();

  if (!session) {
    abrirModalLogin();
    return;
  }

  const modal = document.getElementById('modal-gerador-orcamento');
  const formulario = document.getElementById('formulario-orcamento');

  if (formulario) {
    formulario.style.display = 'block';
  }

  if (modal) {
    modal.style.display = 'flex';
  }

  document.body.style.overflow = 'hidden';

  if (typeof atualizarBotoesPorPlano === 'function') {
    atualizarBotoesPorPlano();
  }
}

function fecharModalGerador() {
  const modal = document.getElementById('modal-gerador-orcamento');
  const formulario = document.getElementById('formulario-orcamento');

  if (modal) {
    modal.style.display = 'none';
  }

  if (formulario) {
    formulario.style.display = 'none';
  }

  document.body.style.overflow = '';
}

// ==================== EVENTOS DOS MODAIS ====================

function configurarEventosModais() {
  const modalLogin = document.getElementById('modal-login');
  const modalGerador = document.getElementById('modal-gerador-orcamento');

  if (modalLogin) {
    modalLogin.addEventListener('click', event => {
      if (event.target === modalLogin) {
        fecharModalLogin();
      }
    });
  }

  if (modalGerador) {
    modalGerador.addEventListener('click', event => {
      if (event.target === modalGerador) {
        fecharModalGerador();
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      fecharModalLogin();
      fecharModalGerador();
    }
  });
}

// ==================== EXPORTA FUNÇÕES GLOBAIS ====================

window.usuarioPodeSalvarOrcamento = usuarioPodeSalvarOrcamento;
window.usuarioPodeSalvarOrcamentoLocal = usuarioPodeSalvarOrcamentoLocal;
window.usuarioPremium = usuarioPremium;

window.alternarModo = alternarModo;
window.enviarFormulario = enviarFormulario;
window.deslogar = deslogar;

window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;

window.abrirModalGerador = abrirModalGerador;
window.fecharModalGerador = fecharModalGerador;