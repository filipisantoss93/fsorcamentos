/* FS Orçamentos — Guarda global de páginas protegidas
   Regra: somente index.html exibe modal de login.
*/
(function(){
  'use strict';

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

  function pathAtual(){
    const path = String(location.pathname || '/').toLowerCase().replace(/\/$/, '');
    return path || '/';
  }

  function ehIndex(){
    const path = pathAtual();
    return path === '/' || path === '/index' || path === '/index.html';
  }

  function ehProtegida(){
    const path = pathAtual();
    return PAGINAS_PROTEGIDAS.some(p => path === p || path.endsWith(p));
  }

  function destinoAtual(){
    return `${location.pathname || '/index.html'}${location.search || ''}${location.hash || ''}`;
  }

  function salvarDestino(destino){
    try {
      const final = destino || destinoAtual() || '/gerador.html';
      if (!final.includes('/index.html') && final !== '/') localStorage.setItem('fs_destino_apos_login', final);
    } catch (_) {}
  }

  function destinoSalvo(){
    try { return localStorage.getItem('fs_destino_apos_login') || ''; } catch (_) { return ''; }
  }

  function limparDestino(){
    try { localStorage.removeItem('fs_destino_apos_login'); } catch (_) {}
  }

  function urlLogin(){
    return '/index.html?login=1';
  }

  function redirecionarParaLogin(destino){
    salvarDestino(destino);
    if (!ehIndex()) location.replace(urlLogin());
    else setTimeout(() => {
      if (typeof window.abrirModalLogin === 'function') window.abrirModalLogin();
    }, 80);
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

  async function sessaoAtual(){
    try {
      if (!window._supabase?.auth) return null;
      const { data } = await window._supabase.auth.getSession();
      return data?.session || null;
    } catch (_) { return null; }
  }

  async function protegerPagina(){
    removerModalForaDoIndex();
    if (!ehProtegida()) return;
    const session = await sessaoAtual();
    if (!session?.user?.id) redirecionarParaLogin(destinoAtual());
  }

  async function redirecionarDepoisLogin(){
    if (!ehIndex()) return;
    const destino = destinoSalvo();
    if (!destino || destino === '/' || destino.includes('/index.html')) return;
    const session = await sessaoAtual();
    if (!session?.user?.id) return;
    limparDestino();
    location.replace(destino);
  }

  function instalarOverrideLogin(){
    const abrir = function(){
      if (ehIndex()) {
        const modal = document.getElementById('modal-login');
        const authArea = document.getElementById('auth-area');
        const authContainer = document.getElementById('auth-container');
        if (!modal) return;
        if (typeof window.fsAplicarModoAuth === 'function') window.fsAplicarModoAuth('login');
        if (authArea) authArea.style.display = 'block';
        if (authContainer) authContainer.style.display = 'block';
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('login-modal-aberto');
        document.body.style.overflow = 'hidden';
        return;
      }
      redirecionarParaLogin(destinoAtual());
    };

    const fechar = function(){
      const modal = document.getElementById('modal-login');
      if (!modal) return;
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('login-modal-aberto');
      document.body.style.overflow = '';
    };

    window.abrirModalLogin = abrir;
    window.fecharModalLogin = fechar;
  }

  function instalar(){
    instalarOverrideLogin();
    removerModalForaDoIndex();
    protegerPagina();
    redirecionarDepoisLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalarOverrideLogin();
    removerModalForaDoIndex();
    if (++tentativas > 24) clearInterval(timer);
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
