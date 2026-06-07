// ==================== AUTH.JS ====================
// FS Orçamentos - Autenticação completa
// E-mail/senha + Google + Facebook
// Proteção de páginas + criação automática de perfil
// Confirmação por e-mail com botão de reenvio após cadastro

// Este arquivo depende de:
// - supabase-js carregado antes
// - config.js carregado antes
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

// ==================== SUPABASE GLOBAL ====================

if (!window._supabase) {
  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==================== CONFIGURAÇÃO GLOBAL ====================

let modoAtual = 'login';

const FS_PAGINAS_PROTEGIDAS = [
  'gerador.html',
  'gerador',
  'painel.html',
  'painel',
  'orcamentos.html',
  'orcamentos',
  'clientes.html',
  'clientes',
  'veiculos.html',
  'veiculos',
  'ordens.html',
  'ordens',
  'ordem.html',
  'ordem',
  'estoque.html',
  'estoque'
];

function fsPathAtualLimpo() {
  return window.location.pathname
    .toLowerCase()
    .replace(/\/$/, '');
}

function paginaAtualProtegida() {
  const path = fsPathAtualLimpo();

  return (
    path.endsWith('/gerador') ||
    path.endsWith('/gerador.html') ||
    path.endsWith('/painel') ||
    path.endsWith('/painel.html') ||
    path.endsWith('/orcamentos') ||
    path.endsWith('/orcamentos.html') ||
    path.endsWith('/clientes') ||
    path.endsWith('/clientes.html') ||
    path.endsWith('/veiculos') ||
    path.endsWith('/veiculos.html') ||
    path.endsWith('/ordens') ||
    path.endsWith('/ordens.html') ||
    path.endsWith('/ordem') ||
    path.endsWith('/ordem.html') ||
    path.endsWith('/estoque') ||
    path.endsWith('/estoque.html')
  );
}

function ehPaginaGerador() {
  const path = fsPathAtualLimpo();

  return (
    path.endsWith('/gerador') ||
    path.endsWith('/gerador.html')
  );
}

function ehPaginaIndex() {
  const path = fsPathAtualLimpo();

  return (
    path === '' ||
    path === '/' ||
    path.endsWith('/index') ||
    path.endsWith('/index.html')
  );
}

function fsDestinoAtual() {
  const path = window.location.pathname || '/index.html';
  const search = window.location.search || '';

  return `${path}${search}`;
}

function fsSalvarDestinoAposLogin(destino) {
  try {
    localStorage.setItem(
      'fs_destino_apos_login',
      destino || fsDestinoAtual() || '/gerador.html'
    );
  } catch (error) {
    console.warn('Não foi possível salvar destino após login:', error);
  }
}

function fsObterDestinoAposLoginPadrao() {
  const destinoSalvo = localStorage.getItem('fs_destino_apos_login');

  if (destinoSalvo) return destinoSalvo;

  if (ehPaginaGerador()) return '/gerador.html';

  if (paginaAtualProtegida()) return fsDestinoAtual();

  return '/gerador.html';
}

function fsLimparDestinoAposLogin() {
  try {
    localStorage.removeItem('fs_destino_apos_login');
  } catch (error) {
    console.warn('Não foi possível limpar destino após login:', error);
  }
}

function fsRedirecionarAposLogin() {
  const destino = fsObterDestinoAposLoginPadrao();

  fsLimparDestinoAposLogin();

  if (!destino) return;

  const atual = fsDestinoAtual();

  if (destino !== atual) {
    window.location.href = destino;
  }
}

// ==================== HELPERS ====================

function fsNormalizarTextoAuth(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fsEscaparHtmlAuth(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fsPrimeiroNomeDoEmail(email) {
  return String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();
}

function fsNomeUsuarioDaSessao(session) {
  const meta = session?.user?.user_metadata || {};

  // Não use "Usuário" como fallback automático.
  // Se o Google/Supabase não entregar nome, deixamos em branco
  // para o usuário cadastrar o consultor manualmente no Painel.
  return String(
    meta.nome ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    ''
  ).trim();
}

function fsAvatarUsuarioDaSessao(session) {
  const meta = session?.user?.user_metadata || {};

  return (
    meta.avatar_url ||
    meta.picture ||
    ''
  );
}

function fsEmailUsuarioDaSessao(session) {
  return session?.user?.email || '';
}

function fsDefinirTextoBotao(texto, disabled = false) {
  const btn = document.getElementById('btn-principal');

  if (!btn) return;

  btn.innerText = texto;
  btn.disabled = disabled;
}

function fsResetarBotaoPrincipal() {
  if (modoAtual === 'login') {
    fsDefinirTextoBotao('Entrar', false);
  } else {
    fsDefinirTextoBotao('Cadastrar', false);
  }
}

function fsEmailRedirectTo() {
  return `${window.location.origin}/index.html?login=1`;
}

// ==================== CONFIRMAÇÃO DE E-MAIL ====================

function exibirAreaConfirmacaoEmail(email) {
  const authContainer = document.getElementById('auth-container');

  if (!authContainer) return;

  let box = document.getElementById('box-confirmacao-email');

  if (!box) {
    box = document.createElement('div');
    box.id = 'box-confirmacao-email';

    box.style.marginTop = '15px';
    box.style.padding = '14px';
    box.style.borderRadius = '12px';
    box.style.background = '#fff8e1';
    box.style.border = '1px solid #ffc400';
    box.style.color = '#3e2723';
    box.style.textAlign = 'center';
    box.style.fontWeight = '700';
    box.style.lineHeight = '1.45';

    authContainer.appendChild(box);
  }

  box.innerHTML = `
    <strong style="display:block; margin-bottom:6px;">
      📩 Confirme seu e-mail
    </strong>

    <span style="display:block; font-size:14px; margin-bottom:10px;">
      Enviamos um link de confirmação para:
      <br>
      <b>${fsEscaparHtmlAuth(email)}</b>
    </span>

    <small style="display:block; color:#6d4c41; margin-bottom:12px;">
      Verifique sua caixa de entrada e também a pasta de spam.
    </small>

    <button
      type="button"
      id="btn-reenviar-confirmacao"
      onclick="reenviarEmailConfirmacao()"
      style="
        width:100%;
        padding:10px;
        background:#3e2723;
        color:#ffc400;
        border:1px solid #ffc400;
        border-radius:8px;
        cursor:pointer;
        font-weight:900;
      ">
      Reenviar e-mail de confirmação
    </button>
  `;
}

function ocultarAreaConfirmacaoEmail() {
  const box = document.getElementById('box-confirmacao-email');

  if (box) {
    box.remove();
  }
}

async function reenviarEmailConfirmacao() {
  const email = document.getElementById('auth-email')?.value?.trim();

  if (!email) {
    alert('Informe seu e-mail para reenviar a confirmação.');
    return;
  }

  const botao = document.getElementById('btn-reenviar-confirmacao');

  if (botao) {
    botao.disabled = true;
    botao.innerText = 'Reenviando...';
  }

  try {
    const { error } = await _supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: fsEmailRedirectTo()
      }
    });

    if (error) {
      console.error('Erro ao reenviar confirmação:', error);

      const msg = String(error.message || '').toLowerCase();

      if (msg.includes('rate limit') || msg.includes('email rate limit')) {
        alert('Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.');
        return;
      }

      alert('Não foi possível reenviar o e-mail: ' + error.message);
      return;
    }

    alert('Novo e-mail de confirmação enviado. Verifique sua caixa de entrada e spam.');

  } catch (error) {
    console.error('Erro inesperado ao reenviar confirmação:', error);
    alert('Erro inesperado ao reenviar confirmação.');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.innerText = 'Reenviar e-mail de confirmação';
    }
  }
}

// ==================== CONTROLE DE TELA ====================

function atualizarTelaAutenticacao(session) {
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');

  const conteudoProtegido =
    document.getElementById('conteudo-protegido') ||
    document.getElementById('painel-conteudo') ||
    document.getElementById('orcamentos-conteudo');

  const conteudoGerador = document.getElementById('conteudo-gerador');
  const homePublica = document.getElementById('home-publica');
  const formularioOrcamento = document.getElementById('formulario-orcamento');
  const modalGerador = document.getElementById('modal-gerador-orcamento');
  const modalLogin = document.getElementById('modal-login');

  const paginaProtegida = paginaAtualProtegida();

  if (ehPaginaGerador()) {
    if (session) {
      if (conteudoGerador) conteudoGerador.style.display = 'block';
      if (conteudoProtegido) conteudoProtegido.style.display = 'block';
      if (authArea && !modalLogin) authArea.style.display = 'none';
      if (authContainer && !modalLogin) authContainer.style.display = 'none';

      fecharModalLogin();
    } else {
      if (conteudoGerador) conteudoGerador.style.display = 'none';
      if (conteudoProtegido) conteudoProtegido.style.display = 'none';

      if (authArea && !modalLogin) authArea.style.display = 'block';
      if (authContainer && !modalLogin) authContainer.style.display = 'block';

      fsSalvarDestinoAposLogin('/gerador.html');

      setTimeout(() => {
        abrirModalLogin();
      }, 250);
    }

    return;
  }

  if (paginaProtegida) {
    if (session) {
      if (authArea) authArea.style.display = 'none';
      if (authContainer) authContainer.style.display = 'none';
      if (conteudoProtegido) conteudoProtegido.style.display = 'block';

      fecharModalLogin();
    } else {
      if (authArea) authArea.style.display = 'block';
      if (authContainer) authContainer.style.display = 'block';
      if (conteudoProtegido) conteudoProtegido.style.display = 'none';

      fsSalvarDestinoAposLogin(fsDestinoAtual());

      setTimeout(() => {
        abrirModalLogin();
      }, 250);
    }

    return;
  }

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

    if (authArea) authArea.style.display = 'block';
    if (authContainer) authContainer.style.display = 'block';

    if (modalLogin && session) {
      modalLogin.style.display = 'none';
    }

    return;
  }

  if (authArea && !modalLogin) authArea.style.display = 'none';
  if (authContainer && !modalLogin) authContainer.style.display = 'none';
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error) {
      console.warn('Erro ao obter sessão inicial:', error);
    }

    if (session) {
      await garantirPerfilAposLogin(session);
      await carregarPerfilLocal(session);
    }

    atualizarTelaAutenticacao(session);

    if (typeof carregarMenu === 'function') {
      await carregarMenu(session || null);
    }

    configurarEventosModais();

    if (session && localStorage.getItem('fs_destino_apos_login')) {
      setTimeout(fsRedirecionarAposLogin, 500);
    }

    _supabase.auth.onAuthStateChange(async (event, sessionAtual) => {
      console.log('Auth mudou:', event, sessionAtual);

      if (sessionAtual) {
        await garantirPerfilAposLogin(sessionAtual);
        await carregarPerfilLocal(sessionAtual);
      }

      atualizarTelaAutenticacao(sessionAtual || null);

      if (typeof carregarMenu === 'function') {
        await carregarMenu(sessionAtual || null);
      }

      if (event === 'SIGNED_IN' && sessionAtual) {
        ocultarAreaConfirmacaoEmail();

        setTimeout(() => {
          if (localStorage.getItem('fs_destino_apos_login')) {
            fsRedirecionarAposLogin();
          }
        }, 600);
      }

      if (event === 'SIGNED_OUT') {
        fsLimparLocalStorageAuth();

        atualizarTelaAutenticacao(null);

        if (typeof carregarMenu === 'function') {
          await carregarMenu(null);
        }

        if (paginaAtualProtegida()) {
          setTimeout(() => {
            abrirModalLogin();
          }, 300);
        }
      }
    });

  } catch (error) {
    console.error('Erro inesperado na inicialização do auth.js:', error);
    atualizarTelaAutenticacao(null);
  }
});

// ==================== PERFIL / LOCAL STORAGE ====================

function fsLimparLocalStorageAuth() {
  const chaves = [
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
    'foto_url',
    'responsavel_selecionado_nome',
    'consultor_selecionado_nome'
  ];

  chaves.forEach(chave => {
    localStorage.removeItem(chave);
  });
}

async function garantirResponsavelPrincipal(session, nomeResponsavel) {
  if (!session?.user?.id) return;

  const nomeFinal = String(nomeResponsavel || '').trim();
  const nomeNormalizado = fsNormalizarTextoAuth(nomeFinal);

  // Não cria responsável automático genérico.
  if (!nomeFinal || nomeNormalizado === 'usuario' || nomeNormalizado === 'usuário') {
    return;
  }

  try {
    // Se já existe qualquer responsável para este usuário, não cria outro.
    const { data: existentes, error: erroBusca } = await _supabase
      .from('responsaveis_orcamento')
      .select('id, nome')
      .eq('usuario_id', session.user.id)
      .limit(1);

    if (erroBusca) {
      console.warn('Erro ao buscar responsável principal:', erroBusca);
      return;
    }

    if (Array.isArray(existentes) && existentes.length > 0) return;

    const { error } = await _supabase
      .from('responsaveis_orcamento')
      .insert({
        usuario_id: session.user.id,
        nome: nomeFinal,
        ativo: true
      });

    if (error) {
      console.warn('Não foi possível criar responsável principal:', error);
    }
  } catch (error) {
    console.warn('Erro inesperado ao garantir responsável principal:', error);
  }
}

async function garantirPerfilAposLogin(session) {
  if (!session?.user?.id) return null;

  try {
    const userId = session.user.id;
    const email = fsEmailUsuarioDaSessao(session);
    const meta = session.user.user_metadata || {};
    const nomeSessao = fsNomeUsuarioDaSessao(session);
    const avatar = fsAvatarUsuarioDaSessao(session);

    const nomeMetadata = String(meta.nome || nomeSessao || '').trim();
    const empresaMetadata = meta.nome_empresa || '';
    const telefoneMetadata = meta.telefone_empresa || '';

    const { data: perfilExistente, error: erroBusca } = await _supabase
      .from('perfis')
      .select('id, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em')
      .eq('id', userId)
      .maybeSingle();

    if (erroBusca) {
      console.warn('Erro ao buscar perfil após login:', erroBusca);
      return null;
    }

    const payload = {
      id: userId,
      nome: perfilExistente?.nome || nomeMetadata || '',
      nome_empresa: perfilExistente?.nome_empresa || empresaMetadata || '',
      telefone_empresa: perfilExistente?.telefone_empresa || telefoneMetadata || '',
      endereco_empresa: perfilExistente?.endereco_empresa || '',
      cnpj_empresa: perfilExistente?.cnpj_empresa || '',
      foto_url: perfilExistente?.foto_url || avatar || '',
      plano: perfilExistente?.plano || 'gratis',
      plano_status: perfilExistente?.plano_status || 'ativo',
      plano_expira_em: perfilExistente?.plano_expira_em || null,
      atualizado_em: new Date().toISOString()
    };

    const { data: perfilAtualizado, error: erroUpsert } = await _supabase
      .from('perfis')
      .upsert([payload], {
        onConflict: 'id'
      })
      .select()
      .maybeSingle();

    if (erroUpsert) {
      console.warn('Erro ao garantir perfil:', erroUpsert);
      return perfilExistente || null;
    }

    if (email) {
      localStorage.setItem('usuario_email', email);
    }

    await garantirResponsavelPrincipal(session, payload.nome);

    return perfilAtualizado || perfilExistente || payload;

  } catch (error) {
    console.warn('Erro inesperado ao garantir perfil:', error);
    return null;
  }
}

async function carregarPerfilLocal(session) {
  if (!session?.user?.id) return;

  try {
    localStorage.setItem('id', session.user.id);
    localStorage.setItem('usuario_email', session.user.email || '');

    const { data: perfil, error } = await _supabase
      .from('perfis')
      .select('plano, plano_status, plano_expira_em, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perfil local:', error);
      return;
    }

    const nomeFinal =
      perfil?.nome ||
      perfil?.nome_empresa ||
      fsNomeUsuarioDaSessao(session) ||
      '';

    localStorage.setItem('usuario_nome', nomeFinal);
    localStorage.setItem('usuario_plano', perfil?.plano || 'gratis');

    if (perfil?.plano_status) {
      localStorage.setItem('usuario_plano_status', perfil.plano_status);
    } else {
      localStorage.removeItem('usuario_plano_status');
    }

    if (perfil?.plano_expira_em) {
      localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
    } else {
      localStorage.removeItem('usuario_plano_expira_em');
    }

    if (perfil?.nome_empresa) {
      localStorage.setItem('nome_empresa', perfil.nome_empresa);
    } else {
      localStorage.removeItem('nome_empresa');
    }

    if (perfil?.telefone_empresa) {
      localStorage.setItem('telefone_empresa', perfil.telefone_empresa);
    } else {
      localStorage.removeItem('telefone_empresa');
    }

    if (perfil?.endereco_empresa) {
      localStorage.setItem('endereco_empresa', perfil.endereco_empresa);
    } else {
      localStorage.removeItem('endereco_empresa');
    }

    if (perfil?.cnpj_empresa) {
      localStorage.setItem('cnpj_empresa', perfil.cnpj_empresa);
    } else {
      localStorage.removeItem('cnpj_empresa');
    }

    if (perfil?.foto_url) {
      localStorage.setItem('foto_url', perfil.foto_url);
    } else {
      localStorage.removeItem('foto_url');
    }

  } catch (err) {
    console.error('Erro inesperado ao carregar perfil local:', err);
  }
}

// ==================== LOGIN / CADASTRO E-MAIL ====================

function alternarModo(event) {
  if (event) event.preventDefault();

  ocultarAreaConfirmacaoEmail();

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

  fsResetarBotaoPrincipal();
}

async function enviarFormulario() {
  ocultarAreaConfirmacaoEmail();

  const email = document.getElementById('auth-email')?.value?.trim();
  const senha = document.getElementById('auth-senha')?.value;

  if (!email || !senha) {
    alert('Por favor, preencha e-mail e senha.');
    return;
  }

  if (modoAtual === 'login') {
    fsDefinirTextoBotao('Entrando...', true);
    await logarUsuario(email, senha);
  } else {
    const confirmarSenha =
      document.getElementById('auth-confirmar-senha')?.value;

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem.');
      fsResetarBotaoPrincipal();
      return;
    }

    fsDefinirTextoBotao('Cadastrando...', true);
    await cadastrarUsuario(email, senha);
  }
}

async function logarUsuario(email, senha) {
  try {
    const { error } = await _supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      console.error('Erro de login:', error);

      const msg = String(error.message || '').toLowerCase();

      if (
        msg.includes('email not confirmed') ||
        msg.includes('email not confirm') ||
        msg.includes('confirm')
      ) {
        alert('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
        exibirAreaConfirmacaoEmail(email);
      } else {
        alert('Usuário ou senha incorretos.');
      }

      fsResetarBotaoPrincipal();
      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (session) {
      await garantirPerfilAposLogin(session);
      await carregarPerfilLocal(session);

      atualizarTelaAutenticacao(session);

      if (typeof carregarMenu === 'function') {
        await carregarMenu(session);
      }

      fecharModalLogin();
      ocultarAreaConfirmacaoEmail();

      setTimeout(fsRedirecionarAposLogin, 400);
    }

    fsResetarBotaoPrincipal();

  } catch (error) {
    console.error('Erro inesperado ao logar:', error);
    alert('Erro inesperado ao entrar. Tente novamente.');
    fsResetarBotaoPrincipal();
  }
}

async function tentarSalvarPerfilAposCadastro(data, dadosCadastro) {
  const userId = data?.user?.id;

  if (!userId) return;

  try {
    const payloadPerfil = {
      id: userId,
      nome: dadosCadastro.nome,
      nome_empresa: dadosCadastro.nomeEmpresa,
      telefone_empresa: dadosCadastro.telefoneEmpresa,
      endereco_empresa: '',
      cnpj_empresa: '',
      foto_url: '',
      plano: 'gratis',
      plano_status: 'ativo',
      atualizado_em: new Date().toISOString()
    };

    const { error: erroPerfil } = await _supabase
      .from('perfis')
      .upsert([payloadPerfil], {
        onConflict: 'id'
      });

    if (erroPerfil) {
      console.warn(
        'Perfil não foi salvo no cadastro. Será preenchido após confirmação/login:',
        erroPerfil
      );
    }

    const nomeResponsavelCadastro = String(dadosCadastro.nome || '').trim();

    if (nomeResponsavelCadastro && fsNormalizarTextoAuth(nomeResponsavelCadastro) !== 'usuario') {
      const { data: responsaveisExistentes } = await _supabase
        .from('responsaveis_orcamento')
        .select('id')
        .eq('usuario_id', userId)
        .limit(1);

      if (!responsaveisExistentes || responsaveisExistentes.length === 0) {
        const { error: erroResponsavel } = await _supabase
          .from('responsaveis_orcamento')
          .insert({
            usuario_id: userId,
            nome: nomeResponsavelCadastro,
            ativo: true
          });

        if (erroResponsavel) {
          console.warn(
            'Responsável não foi salvo no cadastro. Será criado após confirmação/login:',
            erroResponsavel
          );
        }
      }
    }

  } catch (error) {
    console.warn('Erro ao tentar salvar perfil após cadastro:', error);
  }
}

async function cadastrarUsuario() {
  try {
    const nome = document.getElementById('auth-nome')?.value?.trim() || '';
    const email = document.getElementById('auth-email')?.value?.trim() || '';
    const senha = document.getElementById('auth-senha')?.value || '';
    const confirmarSenha = document.getElementById('auth-confirmar-senha')?.value || '';

    const nomeEmpresa = document.getElementById('reg-nome-empresa')?.value?.trim() || '';
    const telefoneEmpresa = document.getElementById('reg-telefone-empresa')?.value?.trim() || '';

    if (!nome) {
      alert('Informe seu nome.');
      return;
    }

    if (!email) {
      alert('Informe seu e-mail.');
      return;
    }

    if (!nomeEmpresa) {
      alert('Informe o nome da empresa.');
      return;
    }

    if (!telefoneEmpresa) {
      alert('Informe o WhatsApp da empresa.');
      return;
    }

    if (!senha || senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    if (!window._supabase) {
      alert('Supabase não carregou. Atualize a página e tente novamente.');
      return;
    }

    const dadosCadastro = {
      nome,
      nomeEmpresa,
      telefoneEmpresa
    };

    const { data, error } = await _supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          nome_empresa: nomeEmpresa,
          telefone_empresa: telefoneEmpresa
        },
        emailRedirectTo: fsEmailRedirectTo()
      }
    });

    if (error) {
      console.error('Erro ao cadastrar:', error);

      const msg = String(error.message || '').toLowerCase();

      if (
        msg.includes('already registered') ||
        msg.includes('user already registered') ||
        msg.includes('already been registered')
      ) {
        alert('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
        return;
      }

      if (msg.includes('rate limit') || msg.includes('email rate limit')) {
        alert('Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.');
        exibirAreaConfirmacaoEmail(email);
        return;
      }

      alert(error.message || 'Erro ao cadastrar usuário.');
      return;
    }

    await tentarSalvarPerfilAposCadastro(data, dadosCadastro);

    alert('Cadastro realizado! Confirme seu e-mail para acessar sua conta.');
    exibirAreaConfirmacaoEmail(email);

    // Mantém o modal aberto e não atualiza a página.
    // Também não alterna automaticamente para login para o botão de reenvio continuar visível.

  } catch (error) {
    console.error('Erro inesperado ao cadastrar:', error);
    alert('Erro inesperado ao cadastrar. Verifique o console.');
  } finally {
    fsResetarBotaoPrincipal();
  }
}

// ==================== LOGIN SOCIAL GOOGLE / FACEBOOK ====================

async function loginComProvider(provider) {
  try {
    if (!window._supabase) {
      alert('Supabase não carregou. Atualize a página e tente novamente.');
      return;
    }

    const providerNormalizado = fsNormalizarTextoAuth(provider);

    if (!['google', 'facebook'].includes(providerNormalizado)) {
      alert('Provedor de login inválido.');
      return;
    }

    const destino = fsObterDestinoAposLoginPadrao();

    fsSalvarDestinoAposLogin(destino);

    const redirectTo = `${window.location.origin}${destino || '/gerador.html'}`;

    const { error } = await _supabase.auth.signInWithOAuth({
      provider: providerNormalizado,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error(`Erro ao entrar com ${providerNormalizado}:`, error);
      alert('Não foi possível iniciar o login. Tente novamente.');
    }

  } catch (error) {
    console.error('Erro inesperado no login social:', error);
    alert('Erro inesperado ao iniciar login social.');
  }
}

async function loginComGoogle() {
  await loginComProvider('google');
}

async function loginComFacebook() {
  await loginComProvider('facebook');
}

// ==================== LOGOUT ====================

async function deslogar() {
  try {
    const { error } = await _supabase.auth.signOut();

    if (error) {
      console.error(error);
      alert('Erro ao sair.');
      return;
    }

    fsLimparLocalStorageAuth();
    fsLimparDestinoAposLogin();

    if (typeof carregarMenu === 'function') {
      await carregarMenu(null);
    }

    window.location.href = '/index.html';

  } catch (error) {
    console.error('Erro inesperado ao sair:', error);
    alert('Erro inesperado ao sair.');
  }
}

// ==================== HELPERS DE PLANO ====================

function usuarioPodeSalvarOrcamento() {
  const plano = fsNormalizarTextoAuth(localStorage.getItem('usuario_plano') || 'gratis');

  return plano === 'basico' || plano === 'premium';
}

function usuarioPodeSalvarOrcamentoLocal() {
  return usuarioPodeSalvarOrcamento();
}

function usuarioPremium() {
  const plano = fsNormalizarTextoAuth(localStorage.getItem('usuario_plano') || 'gratis');

  return plano === 'premium';
}

// ==================== MODAL DE LOGIN ====================

function abrirModalLogin() {
  const modal = document.getElementById('modal-login');
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');

  if (!modal) {
    if (paginaAtualProtegida()) {
      return;
    }

    window.location.href = '/index.html?login=1';
    return;
  }

  if (authArea) authArea.style.display = 'block';
  if (authContainer) authContainer.style.display = 'block';

  modal.style.display = 'flex';
  document.body.classList.add('login-modal-aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalLogin() {
  const modal = document.getElementById('modal-login');

  if (!modal) return;

  modal.style.display = 'none';
  document.body.classList.remove('login-modal-aberto');
  document.body.style.overflow = '';
}

// ==================== MODAL DO GERADOR ====================

async function abrirModalGerador() {
  const { data: { session } } = await _supabase.auth.getSession();

  if (!session) {
    fsSalvarDestinoAposLogin('/gerador.html');
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

  if (formulario && !ehPaginaGerador()) {
    formulario.style.display = 'none';
  }

  document.body.style.overflow = '';
}

// ==================== BOTÕES SOCIAIS NO MODAL ====================

function inserirBotoesSociaisLogin() {
  const authContainer = document.getElementById('auth-container');

  if (!authContainer) return;

  if (document.getElementById('login-social-box')) return;

  const box = document.createElement('div');
  box.id = 'login-social-box';
  box.className = 'login-social-box';

  box.innerHTML = `
    <style>
      .login-social-box {
        display: grid;
        gap: 10px;
        margin-bottom: 16px;
      }

      .btn-social-login {
        width: 100%;
        border: 1px solid #d7ccc8;
        background: #ffffff;
        color: #3e2723;
        border-radius: 10px;
        padding: 11px 12px;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        transition: .2s ease;
      }

      .btn-social-login:hover {
        background: #fff8e1;
        border-color: #ffc400;
        transform: translateY(-1px);
      }

      .btn-social-login span {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        flex-shrink: 0;
      }

      .btn-google span {
        background: #ffffff;
        color: #4285f4;
        border: 1px solid #ddd;
      }

      .btn-facebook span {
        background: #1877f2;
        color: #ffffff;
      }

      .separador-login {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 12px 0 16px;
        color: #8d6e63;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .separador-login::before,
      .separador-login::after {
        content: "";
        height: 1px;
        background: #e0d6c8;
        flex: 1;
      }
    </style>

<button type="button" class="btn-google" onclick="loginComGoogle()">
  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
  <span>Entrar com Google</span>
</button>

<!-- Facebook oculto temporariamente
    <button type="button" class="btn-social-login btn-facebook" onclick="loginComFacebook()">
      <span>f</span>
      Continuar com Facebook
    </button>
-->

<div class="separador-login">
  <span>ou entre com E-mail</span>
</div>
  `;

  authContainer.insertAdjacentElement('afterbegin', box);
}

// ==================== EVENTOS DOS MODAIS ====================

function configurarEventosModais() {
  const modalLogin = document.getElementById('modal-login');
  const modalGerador = document.getElementById('modal-gerador-orcamento');

  inserirBotoesSociaisLogin();

  if (modalLogin && modalLogin.dataset.eventosConfigurados !== 'sim') {
    modalLogin.dataset.eventosConfigurados = 'sim';

    modalLogin.addEventListener('click', event => {
      if (event.target === modalLogin) {
        if (paginaAtualProtegida()) {
          return;
        }

        fecharModalLogin();
      }
    });
  }

  if (modalGerador && modalGerador.dataset.eventosConfigurados !== 'sim') {
    modalGerador.dataset.eventosConfigurados = 'sim';

    modalGerador.addEventListener('click', event => {
      if (event.target === modalGerador) {
        fecharModalGerador();
      }
    });
  }

  if (window.fsEventosAuthConfigurados !== true) {
    window.fsEventosAuthConfigurados = true;

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (!paginaAtualProtegida()) {
          fecharModalLogin();
        }

        fecharModalGerador();
      }
    });
  }
}

// ==================== EXPORTA FUNÇÕES GLOBAIS ====================

window.usuarioPodeSalvarOrcamento = usuarioPodeSalvarOrcamento;
window.usuarioPodeSalvarOrcamentoLocal = usuarioPodeSalvarOrcamentoLocal;
window.usuarioPremium = usuarioPremium;

window.alternarModo = alternarModo;
window.enviarFormulario = enviarFormulario;
window.logarUsuario = logarUsuario;
window.cadastrarUsuario = cadastrarUsuario;
window.deslogar = deslogar;

window.loginComProvider = loginComProvider;
window.loginComGoogle = loginComGoogle;
window.loginComFacebook = loginComFacebook;

window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;

window.abrirModalGerador = abrirModalGerador;
window.fecharModalGerador = fecharModalGerador;

window.carregarPerfilLocal = carregarPerfilLocal;
window.garantirPerfilAposLogin = garantirPerfilAposLogin;
window.atualizarTelaAutenticacao = atualizarTelaAutenticacao;

window.reenviarEmailConfirmacao = reenviarEmailConfirmacao;
window.exibirAreaConfirmacaoEmail = exibirAreaConfirmacaoEmail;
window.ocultarAreaConfirmacaoEmail = ocultarAreaConfirmacaoEmail;