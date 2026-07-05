/* =========================================================
   FS ORÇAMENTOS — auth.js
   Autenticação, proteção de páginas atuais e perfil básico.
   ========================================================= */

if (!window._supabase) {
  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let modoAtual = 'login';

function fsPathAtualLimpo() {
  return String(window.location.pathname || '/')
    .toLowerCase()
    .replace(/\/index\.html$/, '/')
    .replace(/\/$/, '') || '/';
}

function paginaAtualProtegida() {
  const path = fsPathAtualLimpo();
  const protegidas = [
    '/gerador',
    '/gerador.html',
    '/orcamentos',
    '/orcamentos.html',
    '/painel',
    '/painel.html',
    '/dashboard',
    '/dashboard.html',
    '/fluxo-caixa',
    '/fluxo-caixa.html',
    '/forum',
    '/forum.html',
    '/post',
    '/post.html',
    '/perfil',
    '/perfil.html'
  ];
  return protegidas.some(p => path === p || path.endsWith(p));
}

function ehPaginaGerador() {
  const path = fsPathAtualLimpo();
  return path === '/gerador' || path === '/gerador.html' || path.endsWith('/gerador') || path.endsWith('/gerador.html');
}

function ehPaginaIndex() {
  const path = fsPathAtualLimpo();
  return path === '/' || path === '/index';
}

function fsDestinoAtual() {
  return `${window.location.pathname || '/index.html'}${window.location.search || ''}`;
}

function fsDestinoSeguroAposLogin(destino) {
  const valor = String(destino || '').trim();
  if (!valor || valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('//')) return '/index.html';
  return valor.startsWith('/') ? valor : `/${valor}`;
}

function fsSalvarDestinoAposLogin(destino) {
  try {
    localStorage.setItem('fs_destino_apos_login', fsDestinoSeguroAposLogin(destino || fsDestinoAtual() || '/gerador.html'));
  } catch (error) {
    console.warn('Não foi possível salvar destino após login:', error);
  }
}

function fsLimparDestinoAposLogin() {
  try { localStorage.removeItem('fs_destino_apos_login'); } catch (_) {}
}

function fsRedirecionarAposLogin() {
  let destino = '/index.html';
  try {
    destino = fsDestinoSeguroAposLogin(localStorage.getItem('fs_destino_apos_login') || '/index.html');
  } catch (_) {}

  fsLimparDestinoAposLogin();
  const atual = fsDestinoSeguroAposLogin(fsDestinoAtual());
  if (atual !== destino) window.location.href = destino;
}

function fsIrParaLoginComDestino(destino) {
  const destinoSeguro = fsDestinoSeguroAposLogin(destino || fsDestinoAtual());
  fsSalvarDestinoAposLogin(destinoSeguro);
  window.location.href = `/index.html?login=1&dest=${encodeURIComponent(destinoSeguro)}`;
}

function fsNormalizarTextoAuth(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function fsEscaparHtmlAuth(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fsNomeUsuarioDaSessao(session) {
  const meta = session?.user?.user_metadata || {};
  return String(meta.nome || meta.full_name || meta.name || meta.user_name || '').trim();
}

function fsAvatarUsuarioDaSessao(session) {
  const meta = session?.user?.user_metadata || {};
  return meta.avatar_url || meta.picture || '';
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
  fsDefinirTextoBotao(modoAtual === 'login' ? 'Entrar' : 'Cadastrar', false);
}

function fsMostrarElementoAuth(id, mostrar) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = mostrar ? 'block' : 'none';
  el.classList.toggle('oculto', !mostrar);
}

function fsAplicarModoAuth(modo = 'login') {
  ocultarAreaConfirmacaoEmail();

  const cadastro = modo === 'cadastro';
  modoAtual = cadastro ? 'cadastro' : 'login';

  const titulo = document.getElementById('auth-titulo');
  if (titulo) titulo.innerText = cadastro ? 'Crie sua Conta' : 'Acesse sua Conta';

  const linkAlternar = document.getElementById('link-alternar') || document.querySelector('#auth-alternar a');
  if (linkAlternar) linkAlternar.innerText = cadastro ? 'Já é cadastrado? Clique aqui.' : 'Não tem cadastro? Clique aqui.';

  [
    'grupo-nome',
    'grupo-nome-empresa',
    'grupo-whatsapp-empresa',
    'grupo-confirmar-senha',
    'auth-nome',
    'reg-nome-empresa',
    'reg-telefone-empresa',
    'auth-confirmar-senha'
  ].forEach(id => fsMostrarElementoAuth(id, cadastro));

  fsResetarBotaoPrincipal();
}

function fsEmailRedirectTo() {
  return `${window.location.origin}/index.html?login=1`;
}

function exibirAreaConfirmacaoEmail(email) {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;

  let box = document.getElementById('box-confirmacao-email');
  if (!box) {
    box = document.createElement('div');
    box.id = 'box-confirmacao-email';
    box.className = 'box-confirmacao-email';
    authContainer.appendChild(box);
  }

  box.innerHTML = `
    <strong>📩 Confirme seu e-mail</strong>
    <span>Enviamos um link de confirmação para:<br><b>${fsEscaparHtmlAuth(email)}</b></span>
    <small>Verifique sua caixa de entrada e também a pasta de spam.</small>
    <button type="button" id="btn-reenviar-confirmacao" onclick="reenviarEmailConfirmacao()">Reenviar e-mail de confirmação</button>
  `;
}

function ocultarAreaConfirmacaoEmail() {
  document.getElementById('box-confirmacao-email')?.remove();
}

async function reenviarEmailConfirmacao() {
  const email = document.getElementById('auth-email')?.value?.trim();
  if (!email) return alert('Informe seu e-mail para reenviar a confirmação.');

  const botao = document.getElementById('btn-reenviar-confirmacao');
  if (botao) {
    botao.disabled = true;
    botao.innerText = 'Reenviando...';
  }

  try {
    const { error } = await _supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: fsEmailRedirectTo() } });
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('rate limit')) alert('Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.');
      else alert('Não foi possível reenviar o e-mail: ' + error.message);
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

function fsConteudoProtegidoPrincipal() {
  return document.getElementById('conteudo-protegido') ||
    document.getElementById('painel-conteudo') ||
    document.getElementById('orcamentos-conteudo') ||
    document.getElementById('dashboard-conteudo') ||
    document.getElementById('caixa-conteudo') ||
    document.getElementById('forum-conteudo') ||
    document.getElementById('perfil-conteudo');
}

async function atualizarTelaAutenticacao(session) {
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');
  const conteudoProtegido = fsConteudoProtegidoPrincipal();
  const conteudoGerador = document.getElementById('conteudo-gerador');
  const homePublica = document.getElementById('home-publica');
  const formularioOrcamento = document.getElementById('formulario-orcamento');
  const modalLogin = document.getElementById('modal-login');

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
      fsSalvarDestinoAposLogin('/gerador.html');
      if (modalLogin) {
        if (authArea) authArea.style.display = 'block';
        if (authContainer) authContainer.style.display = 'block';
        setTimeout(abrirModalLogin, 250);
      } else {
        setTimeout(() => fsIrParaLoginComDestino('/gerador.html'), 50);
      }
    }
    return;
  }

  if (paginaAtualProtegida()) {
    if (session) {
      if (authArea) authArea.style.display = 'none';
      if (authContainer) authContainer.style.display = 'none';
      if (conteudoProtegido) conteudoProtegido.style.display = 'block';
      fecharModalLogin();
    } else {
      if (conteudoProtegido) conteudoProtegido.style.display = 'none';
      fsSalvarDestinoAposLogin(fsDestinoAtual());
      if (modalLogin) {
        if (authArea) authArea.style.display = 'block';
        if (authContainer) authContainer.style.display = 'block';
        setTimeout(abrirModalLogin, 250);
      } else {
        setTimeout(() => fsIrParaLoginComDestino(fsDestinoAtual()), 50);
      }
    }
    return;
  }

  if (ehPaginaIndex()) {
    if (homePublica) homePublica.style.display = 'block';
    if (formularioOrcamento) formularioOrcamento.style.display = 'none';
    if (authArea) authArea.style.display = 'block';
    if (authContainer) authContainer.style.display = 'block';
    if (modalLogin && session) modalLogin.style.display = 'none';
    return;
  }

  if (authArea && !modalLogin) authArea.style.display = 'none';
  if (authContainer && !modalLogin) authContainer.style.display = 'none';
}

function fsLimparLocalStorageAuth() {
  [
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
  ].forEach(chave => localStorage.removeItem(chave));
}

async function garantirResponsavelPrincipal(session, nomeResponsavel) {
  if (!session?.user?.id) return;

  const nomeFinal = String(nomeResponsavel || '').trim();
  if (!nomeFinal || fsNormalizarTextoAuth(nomeFinal) === 'usuario') return;

  try {
    const { data: existentes, error: erroBusca } = await _supabase
      .from('responsaveis_orcamento')
      .select('id')
      .eq('usuario_id', session.user.id)
      .limit(1);

    if (erroBusca || (Array.isArray(existentes) && existentes.length > 0)) return;

    await _supabase.from('responsaveis_orcamento').insert({ usuario_id: session.user.id, nome: nomeFinal, ativo: true });
  } catch (error) {
    console.warn('Erro ao garantir responsável principal:', error);
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

    const { data: perfilExistente, error: erroBusca } = await _supabase
      .from('perfis')
      .select('id, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em')
      .eq('id', userId)
      .maybeSingle();

    if (erroBusca) return null;

    const payload = {
      id: userId,
      nome: perfilExistente?.nome || String(meta.nome || nomeSessao || '').trim() || '',
      nome_empresa: perfilExistente?.nome_empresa || meta.nome_empresa || '',
      telefone_empresa: perfilExistente?.telefone_empresa || meta.telefone_empresa || '',
      endereco_empresa: perfilExistente?.endereco_empresa || '',
      cnpj_empresa: perfilExistente?.cnpj_empresa || '',
      foto_url: perfilExistente?.foto_url || avatar || '',
      plano: perfilExistente?.plano || 'gratis',
      plano_status: perfilExistente?.plano_status || 'ativo',
      plano_expira_em: perfilExistente?.plano_expira_em || null,
      atualizado_em: new Date().toISOString()
    };

    const { data: perfilAtualizado } = await _supabase
      .from('perfis')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (email) localStorage.setItem('usuario_email', email);
    await garantirResponsavelPrincipal(session, payload.nome);
    return perfilAtualizado || perfilExistente || payload;
  } catch (error) {
    console.warn('Erro inesperado ao garantir perfil:', error);
    return null;
  }
}

async function verificarExpiracaoTestePremiumAuth() {
  try {
    if (!window._supabase) return null;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const { data, error } = await _supabase.rpc('verificar_expiracao_teste_premium');
    if (error) return null;

    if (data?.plano) localStorage.setItem('usuario_plano', data.plano);
    if (data?.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
    if (data?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
    else if (data?.plano === 'basico') localStorage.removeItem('usuario_plano_expira_em');

    return data || null;
  } catch (_) {
    return null;
  }
}

async function carregarPerfilLocal(session) {
  if (!session?.user?.id) return;

  try {
    await verificarExpiracaoTestePremiumAuth();

    localStorage.setItem('id', session.user.id);
    localStorage.setItem('usuario_email', session.user.email || '');

    const { data: perfil, error } = await _supabase
      .from('perfis')
      .select('plano, plano_status, plano_expira_em, nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) return;

    localStorage.setItem('usuario_nome', perfil?.nome || perfil?.nome_empresa || fsNomeUsuarioDaSessao(session) || '');
    localStorage.setItem('usuario_plano', perfil?.plano || 'gratis');

    if (perfil?.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
    else localStorage.removeItem('usuario_plano_status');

    if (perfil?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
    else localStorage.removeItem('usuario_plano_expira_em');

    ['nome_empresa', 'telefone_empresa', 'endereco_empresa', 'cnpj_empresa', 'foto_url'].forEach(campo => {
      if (perfil?.[campo] !== undefined && perfil?.[campo] !== null) localStorage.setItem(campo, perfil[campo]);
    });
  } catch (error) {
    console.error('Erro inesperado ao carregar perfil local:', error);
  }
}

function alternarModo(event) {
  if (event) event.preventDefault();
  fsAplicarModoAuth(modoAtual === 'login' ? 'cadastro' : 'login');
}

async function enviarFormulario() {
  ocultarAreaConfirmacaoEmail();

  const email = document.getElementById('auth-email')?.value?.trim();
  const senha = document.getElementById('auth-senha')?.value;

  if (!email || !senha) return alert('Por favor, preencha e-mail e senha.');

  if (modoAtual === 'login') {
    fsDefinirTextoBotao('Entrando...', true);
    await logarUsuario(email, senha);
  } else {
    fsDefinirTextoBotao('Cadastrando...', true);
    await cadastrarUsuario();
  }
}

async function logarUsuario(email, senha) {
  try {
    const { error } = await _supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('confirm')) {
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
      if (typeof carregarMenu === 'function') await carregarMenu(session);
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

async function cadastrarUsuario() {
  try {
    const nome = document.getElementById('auth-nome')?.value?.trim() || '';
    const email = document.getElementById('auth-email')?.value?.trim() || '';
    const senha = document.getElementById('auth-senha')?.value || '';
    const confirmarSenha = document.getElementById('auth-confirmar-senha')?.value || '';
    const nomeEmpresa = document.getElementById('reg-nome-empresa')?.value?.trim() || '';
    const telefoneEmpresa = document.getElementById('reg-telefone-empresa')?.value?.trim() || '';

    if (!nome) return alert('Informe seu nome.');
    if (!email) return alert('Informe seu e-mail.');
    if (!nomeEmpresa) return alert('Informe o nome da empresa.');
    if (!telefoneEmpresa) return alert('Informe o WhatsApp da empresa.');
    if (!senha || senha.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');
    if (senha !== confirmarSenha) return alert('As senhas não coincidem.');

    const dadosCadastro = { nome, nomeEmpresa, telefoneEmpresa };

    const { data, error } = await _supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, nome_empresa: nomeEmpresa, telefone_empresa: telefoneEmpresa },
        emailRedirectTo: fsEmailRedirectTo()
      }
    });

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('already')) return alert('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
      if (msg.includes('rate limit')) {
        alert('Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.');
        exibirAreaConfirmacaoEmail(email);
        return;
      }
      return alert(error.message || 'Erro ao cadastrar usuário.');
    }

    await tentarSalvarPerfilAposCadastro(data, dadosCadastro);
    alert('Cadastro realizado! Confirme seu e-mail para acessar sua conta.');
    exibirAreaConfirmacaoEmail(email);
  } catch (error) {
    console.error('Erro inesperado ao cadastrar:', error);
    alert('Erro inesperado ao cadastrar. Verifique o console.');
  } finally {
    fsResetarBotaoPrincipal();
  }
}

async function tentarSalvarPerfilAposCadastro(data, dadosCadastro) {
  const userId = data?.user?.id;
  if (!userId) return;

  try {
    await _supabase.from('perfis').upsert([{
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
    }], { onConflict: 'id' });

    await garantirResponsavelPrincipal({ user: { id: userId } }, dadosCadastro.nome);
  } catch (error) {
    console.warn('Erro ao tentar salvar perfil após cadastro:', error);
  }
}

async function loginComProvider(provider) {
  try {
    if (!window._supabase) return alert('Supabase não carregou. Atualize a página e tente novamente.');

    const providerNormalizado = fsNormalizarTextoAuth(provider);
    if (!['google', 'facebook'].includes(providerNormalizado)) return alert('Provedor de login inválido.');

    const destinoSalvo = localStorage.getItem('fs_destino_apos_login') || '';
    const destinoQuery = destinoSalvo ? `&dest=${encodeURIComponent(fsDestinoSeguroAposLogin(destinoSalvo))}` : '';

    const { error } = await _supabase.auth.signInWithOAuth({
      provider: providerNormalizado,
      options: {
        redirectTo: `${window.location.origin}/index.html?login=1${destinoQuery}`,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
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

async function loginComGoogle() { await loginComProvider('google'); }
async function loginComFacebook() { await loginComProvider('facebook'); }

async function deslogar() {
  try {
    const { error } = await _supabase.auth.signOut();
    if (error) return alert('Erro ao sair.');

    fsLimparLocalStorageAuth();
    fsLimparDestinoAposLogin();
    if (typeof carregarMenu === 'function') await carregarMenu(null);
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Erro inesperado ao sair:', error);
    alert('Erro inesperado ao sair.');
  }
}

function usuarioPodeSalvarOrcamento() {
  const plano = fsNormalizarTextoAuth(localStorage.getItem('usuario_plano') || 'gratis');
  return plano === 'basico' || plano === 'premium';
}

function usuarioPodeSalvarOrcamentoLocal() {
  return usuarioPodeSalvarOrcamento();
}

function usuarioPremium() {
  return fsNormalizarTextoAuth(localStorage.getItem('usuario_plano') || 'gratis') === 'premium';
}

function abrirModalLogin() {
  const modal = document.getElementById('modal-login');
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');

  if (!modal) {
    if (paginaAtualProtegida()) return fsIrParaLoginComDestino(fsDestinoAtual());
    window.location.href = '/index.html?login=1';
    return;
  }

  fsAplicarModoAuth('login');

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

async function abrirModalGerador() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) {
    fsSalvarDestinoAposLogin('/gerador.html');
    abrirModalLogin();
    return;
  }
  window.location.href = '/gerador.html';
}

function fecharModalGerador() {
  document.body.style.overflow = '';
}

function inserirBotoesSociaisLogin() {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer || document.getElementById('login-social-box')) return;

  const box = document.createElement('div');
  box.id = 'login-social-box';
  box.className = 'login-social-box';
  box.innerHTML = `
    <button type="button" class="login-social-btn google" onclick="loginComGoogle()">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">
      <span>Entrar com Google</span>
    </button>
    <div class="separador-login"><span>ou entre com e-mail</span></div>
  `;

  authContainer.insertAdjacentElement('afterbegin', box);
}

function configurarEventosModais() {
  const modalLogin = document.getElementById('modal-login');

  inserirBotoesSociaisLogin();
  fsAplicarModoAuth('login');

  if (modalLogin && modalLogin.dataset.eventosConfigurados !== 'sim') {
    modalLogin.dataset.eventosConfigurados = 'sim';
    modalLogin.addEventListener('click', event => {
      if (event.target === modalLogin && !paginaAtualProtegida()) fecharModalLogin();
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error) console.warn('Erro ao obter sessão inicial:', error);

    if (session) {
      await garantirPerfilAposLogin(session);
      await carregarPerfilLocal(session);
    }

    atualizarTelaAutenticacao(session || null);
    if (typeof carregarMenu === 'function') await carregarMenu(session || null);
    configurarEventosModais();

    if (session && localStorage.getItem('fs_destino_apos_login')) {
      setTimeout(fsRedirecionarAposLogin, 500);
    }

    _supabase.auth.onAuthStateChange(async (event, sessionAtual) => {
      if (sessionAtual) {
        await garantirPerfilAposLogin(sessionAtual);
        await carregarPerfilLocal(sessionAtual);
      }

      atualizarTelaAutenticacao(sessionAtual || null);
      if (typeof carregarMenu === 'function') await carregarMenu(sessionAtual || null);

      if (event === 'SIGNED_IN' && sessionAtual) {
        ocultarAreaConfirmacaoEmail();
        setTimeout(() => {
          if (localStorage.getItem('fs_destino_apos_login')) fsRedirecionarAposLogin();
        }, 600);
      }

      if (event === 'SIGNED_OUT') {
        fsLimparLocalStorageAuth();
        atualizarTelaAutenticacao(null);
        if (typeof carregarMenu === 'function') await carregarMenu(null);
        if (paginaAtualProtegida()) setTimeout(abrirModalLogin, 300);
      }
    });
  } catch (error) {
    console.error('Erro inesperado na inicialização do auth.js:', error);
    atualizarTelaAutenticacao(null);
  }
});

window.alternarModo = alternarModo;
window.enviarFormulario = enviarFormulario;
window.loginComGoogle = loginComGoogle;
window.loginComFacebook = loginComFacebook;
window.abrirModalLogin = abrirModalLogin;
window.fecharModalLogin = fecharModalLogin;
window.abrirModalGerador = abrirModalGerador;
window.fecharModalGerador = fecharModalGerador;
window.deslogar = deslogar;
window.usuarioPodeSalvarOrcamento = usuarioPodeSalvarOrcamento;
window.usuarioPodeSalvarOrcamentoLocal = usuarioPodeSalvarOrcamentoLocal;
window.usuarioPremium = usuarioPremium;
window.reenviarEmailConfirmacao = reenviarEmailConfirmacao;
window.fsAplicarModoAuth = fsAplicarModoAuth;
window.fsSalvarDestinoAposLogin = fsSalvarDestinoAposLogin;
