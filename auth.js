// ==================== SUPABASE CLIENT ====================

window._supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let modoAtual = 'login';

// ==================== CONTROLE DE TELA ====================

function atualizarTela(session) {
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');
  const formulario = document.getElementById('formulario-orcamento');
  const headerContainer = document.getElementById('header-container');

  if (session) {
    if (authArea) authArea.style.display = 'none';
    if (authContainer) authContainer.style.display = 'none';
    if (formulario) formulario.style.display = 'block';
    if (headerContainer) headerContainer.style.display = 'block';
  } else {
    if (authArea) authArea.style.display = 'block';
    if (authContainer) authContainer.style.display = 'block';
    if (formulario) formulario.style.display = 'none';
    if (headerContainer) {
      headerContainer.innerHTML = '';
      headerContainer.style.display = 'none';
    }
  }
}

// ==================== PERFIL LOCAL ====================

async function carregarPerfilLocal(session) {
  if (!session) return null;

  try {
    const { data: perfil, error } = await _supabase
      .from('perfis')
      .select(`
        plano,
        nome,
        nome_empresa,
        telefone_empresa,
        endereco_empresa,
        cnpj_empresa,
        foto_url
      `)
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar perfil:', error);
      return null;
    }

    const nomeFinal =
      perfil?.nome ||
      perfil?.nome_empresa ||
      session.user.email.split('@')[0];

    const planoFinal =
      perfil?.plano || 'gratis';

    localStorage.setItem('id', session.user.id);
    localStorage.setItem('usuario_id', session.user.id);
    localStorage.setItem('usuario_email', session.user.email);
    localStorage.setItem('usuario_nome', nomeFinal);
    localStorage.setItem('usuario_plano', planoFinal);

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

    return perfil;

  } catch (err) {
    console.error('Erro ao carregar perfil local:', err);
    return null;
  }
}

function usuarioPodeSalvarOrcamento() {
  const plano = localStorage.getItem('usuario_plano') || 'gratis';
  return plano === 'basico' || plano === 'premium';
}

window.usuarioPodeSalvarOrcamento = usuarioPodeSalvarOrcamento;

function atualizarAnunciosPorPlano() {
  const plano = localStorage.getItem('usuario_plano') || 'gratis';
  const blocosAnuncio = document.querySelectorAll('.bloco-anuncio');

  blocosAnuncio.forEach(bloco => {
    if (plano === 'gratis') {
      bloco.style.display = 'block';
    } else {
      bloco.style.display = 'none';
    }
  });
}

window.atualizarAnunciosPorPlano = atualizarAnunciosPorPlano;
// ==================== INICIALIZAÇÃO AUTH ====================

async function iniciarAuth() {
  try {
    const { data: { session }, error } =
      await _supabase.auth.getSession();
      

    if (error) {
      console.error('Erro ao obter sessão:', error);
    }

    console.log('Sessão inicial:', session);

if (session) {
  await carregarPerfilLocal(session);
}

atualizarTela(session);
atualizarAnunciosPorPlano();

if (session && typeof carregarMenu === 'function') {
  await carregarMenu(session);
}

    protegerPaginas(session);

    _supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth mudou:', event, session);

      if (event === 'SIGNED_OUT') {
        localStorage.clear();
        atualizarTela(null);

        if (paginaProtegida()) {
          window.location.href = '/index.html';
        }

        return;
      }

      if (session) {
  await carregarPerfilLocal(session);
  atualizarTela(session);
  atualizarAnunciosPorPlano();

  if (typeof carregarMenu === 'function') {
    await carregarMenu(session);
  }

} else {
  atualizarTela(null);
  atualizarAnunciosPorPlano();
}

      protegerPaginas(session);
    });

  } catch (err) {
    console.error('Erro geral no iniciarAuth:', err);

    // Segurança: se der erro, mostra o login em vez de deixar a tela vazia.
    atualizarTela(null);
  }
}

document.addEventListener('DOMContentLoaded', iniciarAuth);

// ==================== PROTEÇÃO DE PÁGINAS ====================

function paginaProtegida() {
  const path = window.location.pathname;

  return (
    path.includes('painel.html') ||
    path.includes('orcamentos.html')
  );
}

function protegerPaginas(session) {
  if (!session && paginaProtegida()) {
    window.location.href = '/index.html';
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
    alert('Preencha todos os campos.');
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

  const { data, error } = await _supabase.auth.signInWithPassword({
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

  await carregarPerfilLocal(data.session);
  atualizarTela(data.session);

  if (typeof carregarMenu === 'function') {
    await carregarMenu(data.session);
  }

  if (btn) {
    btn.innerText = 'Entrar';
    btn.disabled = false;
  }
}

async function cadastrarUsuario(email, senha) {
  const nome = document.getElementById('auth-nome')?.value?.trim() || '';
  const nomeEmpresa = document.getElementById('reg-nome-empresa')?.value?.trim() || '';
  const telefone = document.getElementById('reg-telefone-empresa')?.value?.trim() || '';
  const btn = document.getElementById('btn-principal');

  const { data: authData, error: authError } =
    await _supabase.auth.signUp({
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

  if (!authData.user) {
    alert('Cadastro iniciado. Verifique seu e-mail para confirmar a conta.');

    if (btn) {
      btn.innerText = 'Cadastrar';
      btn.disabled = false;
    }

    return;
  }

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

    if (btn) {
      btn.innerText = 'Cadastrar';
      btn.disabled = false;
    }

    return;
  }

  alert('Cadastro realizado com sucesso!');

  const { data: { session } } =
    await _supabase.auth.getSession();

  if (session) {
    await carregarPerfilLocal(session);
    atualizarTela(session);

    if (typeof carregarMenu === 'function') {
      await carregarMenu(session);
    }
  } else {
    modoAtual = 'login';
    alternarModo({ preventDefault: () => {} });
  }

  if (btn) {
    btn.innerText = 'Entrar';
    btn.disabled = false;
  }
}

// ==================== LOGOUT ====================

async function deslogar() {
  const { error } = await _supabase.auth.signOut();

  if (error) {
    console.error(error);
    alert('Erro ao sair.');
  }
}