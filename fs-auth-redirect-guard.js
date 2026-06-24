/* FS Orçamentos — guarda global de páginas protegidas
   Regra atual:
   - index.html nunca redireciona automaticamente para painel.
   - login feito pela home permanece na home.
   - só redireciona após login quando existe destino protegido explícito.
*/
(function(){
  'use strict';

  const CHAVE_DESTINO = 'fs_destino_apos_login';
  const PAGINAS_PROTEGIDAS = [
    '/gerador', '/gerador.html',
    '/painel', '/painel.html',
    '/orcamentos', '/orcamentos.html',
    '/clientes', '/clientes.html', '/cliente', '/cliente.html',
    '/veiculos', '/veiculos.html', '/veiculo', '/veiculo.html',
    '/ordens', '/ordens.html', '/ordem', '/ordem.html',
    '/estoque', '/estoque.html',
    '/agenda', '/agenda.html', '/agendamento', '/agendamento.html',
    '/recorrentes', '/recorrentes.html',
    '/relatorios', '/relatorios.html',
    '/fluxo-caixa', '/fluxo-caixa.html',
    '/dashboard', '/dashboard.html',
    '/gestao', '/gestao.html',
    '/forum', '/forum.html', '/social', '/social.html',
    '/perfil', '/perfil.html'
  ];

  let enviarFormularioOriginal = null;
  let timerOauthDiagnostico = null;

  function pathAtual(){
    const path = String(location.pathname || '/').toLowerCase().replace(/\/$/, '');
    return path || '/';
  }

  function ehIndex(){
    const path = pathAtual();
    return path === '/' || path === '/index' || path === '/index.html';
  }

  function ehIndexDestino(destino){
    const path = String(destino || '').split('?')[0].split('#')[0].replace(/\/$/, '').toLowerCase();
    return !path || path === '/' || path === '/index' || path === '/index.html';
  }

  function destinoAtual(){
    return `${location.pathname || '/index.html'}${location.search || ''}${location.hash || ''}`;
  }

  function destinoSeguro(destino){
    const valor = String(destino || '').trim();
    if (!valor || valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('//')) return '';
    return valor.startsWith('/') ? valor : `/${valor}`;
  }

  function ehProtegidaDestino(destino){
    const path = String(destino || '').split('?')[0].split('#')[0].replace(/\/$/, '').toLowerCase();
    return PAGINAS_PROTEGIDAS.some(p => path === p || path === p.replace(/\.html$/, ''));
  }

  function ehPaginaProtegidaAtual(){
    return ehProtegidaDestino(pathAtual());
  }

  function lerParametroDestino(){
    try {
      const params = new URLSearchParams(location.search || '');
      return destinoSeguro(params.get('dest') || '');
    } catch (_) {
      return '';
    }
  }

  function salvarDestino(destino){
    try {
      const final = destinoSeguro(destino);
      if (final && !ehIndexDestino(final) && ehProtegidaDestino(final)) localStorage.setItem(CHAVE_DESTINO, final);
    } catch (_) {}
  }

  function destinoSalvo(){
    try {
      const salvo = destinoSeguro(localStorage.getItem(CHAVE_DESTINO) || '');
      if (!salvo || ehIndexDestino(salvo) || !ehProtegidaDestino(salvo)) return '';
      return salvo;
    } catch (_) {
      return '';
    }
  }

  function limparDestino(){
    try { localStorage.removeItem(CHAVE_DESTINO); } catch (_) {}
  }

  function prepararDestinoAoEntrarNoIndex(){
    if (!ehIndex()) return;
    const destinoUrl = lerParametroDestino();
    if (destinoUrl && !ehIndexDestino(destinoUrl) && ehProtegidaDestino(destinoUrl)) {
      salvarDestino(destinoUrl);
      return;
    }
    limparDestino();
  }

  function removerParametrosLoginDaUrl(){
    if (!ehIndex()) return;
    try {
      const params = new URLSearchParams(location.search || '');
      if (!params.has('login') && !params.has('dest') && !params.has('error') && !params.has('error_description')) return;
      history.replaceState({}, document.title, `${location.pathname || '/index.html'}${location.hash || ''}`);
    } catch (_) {}
  }

  function urlLogin(destino){
    const seguro = destinoSeguro(destino);
    if (seguro && !ehIndexDestino(seguro) && ehProtegidaDestino(seguro)) return `/index.html?login=1&dest=${encodeURIComponent(seguro)}`;
    return '/index.html?login=1';
  }

  function redirecionarParaLogin(destino){
    const seguro = destinoSeguro(destino);
    if (seguro && !ehIndexDestino(seguro) && ehProtegidaDestino(seguro)) salvarDestino(seguro);
    if (!ehIndex()) location.replace(urlLogin(seguro));
    else setTimeout(() => { if (typeof window.abrirModalLogin === 'function') window.abrirModalLogin(seguro); }, 80);
  }

  async function sessaoAtual(){
    try {
      if (!window._supabase?.auth) return null;
      const { data } = await window._supabase.auth.getSession();
      return data?.session || null;
    } catch (_) {
      return null;
    }
  }

  function removerModalForaDoIndex(){
    if (ehIndex()) return;
    document.getElementById('modal-login')?.remove();
    const authArea = document.getElementById('auth-area');
    const authContainer = document.getElementById('auth-container');
    if (authArea) authArea.style.display = 'none';
    if (authContainer) authContainer.style.display = 'none';
    document.body?.classList.remove('login-modal-aberto');
  }

  async function protegerPagina(){
    removerModalForaDoIndex();
    if (!ehPaginaProtegidaAtual()) return;
    const session = await sessaoAtual();
    if (!session?.user?.id) redirecionarParaLogin(destinoAtual());
  }

  async function redirecionarDepoisLogin(){
    if (!ehIndex()) return;
    const session = await sessaoAtual();
    if (!session?.user?.id) return;

    const destino = destinoSalvo();
    limparDestino();

    if (destino && !ehIndexDestino(destino) && ehProtegidaDestino(destino)) {
      location.replace(destino);
      return;
    }

    if (typeof window.fecharModalLogin === 'function') window.fecharModalLogin();
    removerParametrosLoginDaUrl();
  }

  function mensagemErroAuth(error, provider){
    const bruto = String(error?.message || error?.error_description || error?.description || error || '').trim();
    const texto = bruto.toLowerCase();
    const codigo = String(error?.code || error?.error || '').toLowerCase();

    if (texto.includes('invalid login credentials') || codigo.includes('invalid_credentials')) {
      return 'E-mail ou senha não conferem. Se essa conta foi criada pelo Google, use o botão "Entrar com Google".';
    }
    if (texto.includes('email not confirmed') || texto.includes('confirm')) return 'Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada e o spam.';
    if (texto.includes('provider is not enabled') || texto.includes('unsupported provider') || texto.includes('provider not enabled')) return `Login com ${provider || 'Google'} não está habilitado no Supabase.`;
    if (texto.includes('redirect') || texto.includes('redirect_uri') || texto.includes('not allowed')) return 'O login social foi bloqueado por URL de redirecionamento não autorizada.';
    if (texto.includes('popup') || texto.includes('blocked')) return 'O navegador bloqueou a abertura do login. Permita pop-ups/redirecionamentos.';
    if (texto.includes('network') || texto.includes('failed to fetch')) return 'Falha de conexão com o Supabase. Verifique a internet e tente novamente.';
    if (texto.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';

    return bruto ? `Erro no login: ${bruto}` : 'Não foi possível concluir o login. Tente novamente.';
  }

  function mostrarFeedbackAuth(mensagem, tipo = 'erro'){
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) { alert(mensagem); return; }
    let box = document.getElementById('fs-auth-feedback');
    if (!box) {
      box = document.createElement('div');
      box.id = 'fs-auth-feedback';
      authContainer.insertAdjacentElement('afterbegin', box);
    }
    box.textContent = mensagem;
    box.style.cssText = [
      'display:block','margin:0 0 12px','padding:10px 12px','border-radius:8px','font-size:13px','font-weight:800','line-height:1.35',
      tipo === 'sucesso' ? 'background:#dcfce7' : 'background:#fff7ed',
      tipo === 'sucesso' ? 'border:1px solid #86efac' : 'border:1px solid #fed7aa',
      tipo === 'sucesso' ? 'color:#166534' : 'color:#9a3412'
    ].join(';');
  }

  function limparFeedbackAuth(){ document.getElementById('fs-auth-feedback')?.remove(); }

  function definirBotaoLogin(texto, disabled){
    const botao = document.getElementById('btn-principal');
    if (!botao) return;
    botao.textContent = texto;
    botao.disabled = !!disabled;
  }

  function modoCadastroAtivo(){
    const titulo = String(document.getElementById('auth-titulo')?.textContent || '').toLowerCase();
    if (titulo.includes('crie') || titulo.includes('cadastro')) return true;
    const grupoNome = document.getElementById('grupo-nome');
    return !!grupoNome && getComputedStyle(grupoNome).display !== 'none';
  }

  async function finalizarLoginComSessao(session){
    if (!session?.user?.id) return;
    try { if (typeof window.garantirPerfilAposLogin === 'function') await window.garantirPerfilAposLogin(session); } catch (_) {}
    try { if (typeof window.carregarPerfilLocal === 'function') await window.carregarPerfilLocal(session); } catch (_) {}
    try { if (typeof window.atualizarTelaAutenticacao === 'function') window.atualizarTelaAutenticacao(session); } catch (_) {}
    try { if (typeof window.carregarMenu === 'function') await window.carregarMenu(session); } catch (_) {}
    limparFeedbackAuth();
    setTimeout(redirecionarDepoisLogin, 220);
  }

  async function loginEmailSeguro(){
    limparFeedbackAuth();
    if (!window._supabase?.auth) return mostrarFeedbackAuth('Supabase ainda não carregou. Atualize a página e tente novamente.');

    const email = document.getElementById('auth-email')?.value?.trim() || '';
    const senha = document.getElementById('auth-senha')?.value || '';
    if (!email || !senha) return mostrarFeedbackAuth('Preencha e-mail e senha.');

    definirBotaoLogin('Entrando...', true);
    try {
      const { data, error } = await window._supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        console.error('Supabase login e-mail:', error);
        mostrarFeedbackAuth(mensagemErroAuth(error));
        return;
      }
      const session = data?.session || (await sessaoAtual());
      if (!session?.user?.id) return mostrarFeedbackAuth('Login recebido, mas a sessão não foi criada. Atualize a página e tente novamente.');
      mostrarFeedbackAuth('Login realizado.', 'sucesso');
      await finalizarLoginComSessao(session);
    } catch (error) {
      console.error('Erro inesperado no login por e-mail:', error);
      mostrarFeedbackAuth(mensagemErroAuth(error));
    } finally {
      definirBotaoLogin('Entrar', false);
    }
  }

  function destinoRedirectOAuth(){
    const destino = destinoSalvo();
    const query = destino ? `?login=1&dest=${encodeURIComponent(destino)}` : '?login=1';
    return `${window.location.origin}/index.html${query}`;
  }

  async function loginComProviderSeguro(provider){
    limparFeedbackAuth();
    if (!window._supabase?.auth) return mostrarFeedbackAuth('Supabase ainda não carregou. Atualize a página e tente novamente.');

    const provedor = String(provider || 'google').toLowerCase();
    if (!['google', 'facebook'].includes(provedor)) return mostrarFeedbackAuth('Provedor de login inválido.');

    mostrarFeedbackAuth(`Abrindo login com ${provedor === 'google' ? 'Google' : 'Facebook'}...`, 'sucesso');
    try {
      const { error } = await window._supabase.auth.signInWithOAuth({
        provider: provedor,
        options: {
          redirectTo: destinoRedirectOAuth(),
          skipBrowserRedirect: false,
          queryParams: provedor === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined
        }
      });
      if (error) mostrarFeedbackAuth(mensagemErroAuth(error, provedor === 'google' ? 'Google' : 'Facebook'));
    } catch (error) {
      console.error(`Erro inesperado no login ${provedor}:`, error);
      mostrarFeedbackAuth(mensagemErroAuth(error, provedor === 'google' ? 'Google' : 'Facebook'));
    }
  }

  async function enviarFormularioSeguro(){
    if (modoCadastroAtivo()) {
      if (typeof enviarFormularioOriginal === 'function' && enviarFormularioOriginal !== enviarFormularioSeguro) return enviarFormularioOriginal();
      return mostrarFeedbackAuth('Modo cadastro indisponível no momento. Atualize a página e tente novamente.');
    }
    return loginEmailSeguro();
  }

  function instalarSubmitModalLogin(){
    const form = document.getElementById('form-autenticacao');
    if (!form || form.dataset.fsSubmitSeguro === 'sim') return;
    form.dataset.fsSubmitSeguro = 'sim';
    form.addEventListener('submit', function(event){
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.enviarFormulario === 'function') window.enviarFormulario();
    }, true);
  }

  function instalarOverridesAuth(){
    if (typeof window.enviarFormulario === 'function' && window.enviarFormulario !== enviarFormularioSeguro) {
      enviarFormularioOriginal = window.enviarFormulario;
      window.enviarFormulario = enviarFormularioSeguro;
    }
    window.loginComGoogle = function(){ return loginComProviderSeguro('google'); };
    window.loginComFacebook = function(){ return loginComProviderSeguro('facebook'); };
  }

  function instalarOverrideLogin(){
    const abrir = function(destino){
      if (!ehIndex()) return redirecionarParaLogin(destino || destinoAtual());

      const seguro = destinoSeguro(destino);
      if (seguro && !ehIndexDestino(seguro) && ehProtegidaDestino(seguro)) salvarDestino(seguro);

      const modal = document.getElementById('modal-login');
      const authArea = document.getElementById('auth-area');
      const authContainer = document.getElementById('auth-container');
      if (!modal) return;
      if (typeof window.fsAplicarModoAuth === 'function') window.fsAplicarModoAuth('login');
      limparFeedbackAuth();
      if (authArea) authArea.style.display = 'block';
      if (authContainer) authContainer.style.display = 'block';
      modal.style.display = 'flex';
      modal.classList.add('ativo', 'active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('login-modal-aberto');
      document.body.style.overflow = 'hidden';
      instalarSubmitModalLogin();
      instalarOverridesAuth();
      setTimeout(() => document.getElementById('auth-email')?.focus(), 80);
    };

    const fechar = function(){
      const modal = document.getElementById('modal-login');
      if (!modal) return;
      modal.style.display = 'none';
      modal.classList.remove('ativo', 'active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('login-modal-aberto');
      document.body.style.overflow = '';
    };

    window.abrirModalLogin = abrir;
    window.fecharModalLogin = fechar;
    instalarSubmitModalLogin();
    instalarOverridesAuth();
  }

  function lerErroOauthDaUrl(){
    try {
      const search = new URLSearchParams(location.search || '');
      const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
      const erro = search.get('error_description') || hash.get('error_description') || search.get('error') || hash.get('error');
      return erro ? decodeURIComponent(String(erro).replace(/\+/g, ' ')) : '';
    } catch (_) { return ''; }
  }

  function diagnosticarRetornoOAuth(){
    if (!ehIndex()) return;
    const erro = lerErroOauthDaUrl();
    if (!erro) return;
    clearTimeout(timerOauthDiagnostico);
    timerOauthDiagnostico = setTimeout(() => {
      if (typeof window.abrirModalLogin === 'function') window.abrirModalLogin();
      mostrarFeedbackAuth(mensagemErroAuth(erro, 'Google'));
    }, 350);
  }

  function abrirLoginAutomaticoSeSolicitado(){
    if (!ehIndex()) return;
    try {
      const params = new URLSearchParams(location.search || '');
      if (params.get('login') !== '1') return;
      setTimeout(() => { if (typeof window.abrirModalLogin === 'function') window.abrirModalLogin(destinoSalvo()); }, 250);
    } catch (_) {}
  }

  function instalar(){
    prepararDestinoAoEntrarNoIndex();
    instalarOverrideLogin();
    removerModalForaDoIndex();
    protegerPagina();
    abrirLoginAutomaticoSeSolicitado();
    redirecionarDepoisLogin();
    diagnosticarRetornoOAuth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalarOverrideLogin();
    removerModalForaDoIndex();
    instalarOverridesAuth();
    if (++tentativas > 80) clearInterval(timer);
  }, 250);

  if (window._supabase?.auth) {
    try {
      window._supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.id) setTimeout(redirecionarDepoisLogin, 80);
        else setTimeout(protegerPagina, 80);
      });
    } catch (_) {}
  }

  window.fsRedirecionarParaLoginIndex = redirecionarParaLogin;
})();