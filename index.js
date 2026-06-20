/* =========================================================
   FS ORÇAMENTOS - index.js
   Comportamentos específicos da página inicial
   ========================================================= */

function esconderSplashIndex() {
  const esconder = () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide-splash');
      splash.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        splash.style.display = 'none';
        splash.style.pointerEvents = 'none';
        splash.style.visibility = 'hidden';
      }, 450);
    }
  };

  esconder();
  setTimeout(esconder, 250);
  setTimeout(esconder, 700);
  setTimeout(esconder, 1800);
  window.addEventListener('load', esconder, { once: true });
}

function fsNormalizarPlano(valor) {
  return String(valor || 'gratis')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function usuarioTemSessaoAtivaFS() {
  try {
    if (!window._supabase) return false;
    const { data: { session } } = await _supabase.auth.getSession();
    return !!session?.user?.id;
  } catch (error) {
    console.warn('Erro ao verificar sessão:', error);
    return false;
  }
}

function indexEstaNaHome() {
  const path = String(window.location.pathname || '').toLowerCase().replace(/\/$/, '');
  return path === '' || path === '/' || path.endsWith('/index') || path.endsWith('/index.html');
}

function fsIndexRemoverCssDuplicado() {
  document.getElementById('fs-home-vendas-limpa')?.remove();

  if (document.getElementById('fs-index-cinza-runtime')) return;

  const style = document.createElement('style');
  style.id = 'fs-index-cinza-runtime';
  style.textContent = `
    body:not(.gerando-pdf) {
      background: linear-gradient(180deg, var(--fs-cinza-100, #f3f4f6) 0%, var(--fs-cinza-200, #e5e7eb) 100%) !important;
      color: var(--fs-cinza-900, #111827) !important;
    }

    #splash-screen {
      background: var(--fs-cinza-950, #0f172a) !important;
      color: #ffffff !important;
    }

    #splash-screen.hide-splash {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    .fs-box,
    .splash-logo .fs-box {
      background: var(--fs-amarelo, #ffc400) !important;
      color: var(--fs-cinza-950, #0f172a) !important;
    }

    .fs-text,
    .splash-content p {
      color: #ffffff !important;
    }

    .home-publica {
      width: min(1120px, calc(100% - 18px)) !important;
      margin: 12px auto 26px !important;
      padding: 0 !important;
      display: grid !important;
      gap: 10px !important;
    }

    .home-visao-plano {
      display: grid !important;
      gap: 10px !important;
    }

    .home-visao-plano:not(.ativo) {
      display: none !important;
    }

    .home-hero-venda,
    .home-section-clean,
    .home-plan-mini,
    .home-flow-step,
    .home-final-cta {
      background: #ffffff !important;
      color: var(--fs-cinza-900, #111827) !important;
      border-color: var(--fs-cinza-200, #e5e7eb) !important;
      box-shadow: 0 6px 18px rgba(15, 23, 42, .08) !important;
    }

    .home-hero-proof {
      background: var(--fs-cinza-900, #111827) !important;
      color: #ffffff !important;
      border-color: var(--fs-amarelo, #ffc400) !important;
    }

    .home-kicker,
    .home-mini-tag,
    .home-plan-mini.destaque {
      background: var(--fs-cinza-100, #f3f4f6) !important;
      color: var(--fs-cinza-900, #111827) !important;
      border-color: var(--fs-cinza-300, #d1d5db) !important;
      box-shadow: none !important;
    }

    .home-hero-venda h1,
    .home-section-head h2,
    .home-plan-mini strong,
    .home-plan-mini b,
    .home-flow-step strong,
    .home-final-cta h2 {
      color: var(--fs-cinza-950, #0f172a) !important;
    }

    .home-lead,
    .home-section-head p,
    .home-plan-mini span,
    .home-plan-mini p,
    .home-flow-step span,
    .home-final-cta p,
    .home-text-list li {
      color: var(--fs-cinza-600, #4b5563) !important;
    }

    .home-hero-proof h2 {
      color: var(--fs-amarelo, #ffc400) !important;
    }

    .home-hero-proof p,
    .home-proof-list li {
      color: #f9fafb !important;
    }

    .home-btn-primary,
    .btn-home-grande {
      background: var(--fs-cinza-900, #111827) !important;
      color: var(--fs-amarelo, #ffc400) !important;
      border-color: var(--fs-amarelo, #ffc400) !important;
    }

    .home-btn-secondary,
    .btn-home-atalho {
      background: #ffffff !important;
      color: var(--fs-cinza-900, #111827) !important;
      border-color: var(--fs-cinza-300, #d1d5db) !important;
    }
  `;
  document.head.appendChild(style);
}

async function redirecionarUsuarioLogadoParaDashboardIndex() {
  return false;
}

function configurarRedirecionamentoAposLoginIndex() {
  if (!window._supabase || window.fsIndexRedirectLoginConfigurado === true) return;
  window.fsIndexRedirectLoginConfigurado = true;

  _supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.id && indexEstaNaHome()) {
      setTimeout(() => {
        const destino = localStorage.getItem('fs_destino_apos_login');
        if (destino && destino !== '/index.html') window.location.href = destino;
      }, 650);
    }
  });
}

function mostrarAvisoLoginIndex() {
  const aviso = document.getElementById('index-aviso-login');
  if (!aviso) return;

  aviso.style.display = 'block';
  setTimeout(() => {
    aviso.style.display = 'none';
  }, 5500);
}

function salvarDestinoAposLoginFS(destino) {
  try {
    localStorage.setItem('fs_destino_apos_login', destino || '/gerador.html');
  } catch (error) {
    console.warn('Não foi possível salvar destino após login:', error);
  }
}

async function abrirGeradorHomeProtegido() {
  try {
    if (!window._supabase) {
      alert('Sistema ainda carregando. Aguarde alguns segundos e tente novamente.');
      return;
    }

    const logado = await usuarioTemSessaoAtivaFS();
    if (!logado) {
      salvarDestinoAposLoginFS('/gerador.html');
      mostrarAvisoLoginIndex();
      if (typeof abrirModalLogin === 'function') abrirModalLogin();
      else window.location.href = '/index.html?login=1';
      return;
    }

    window.location.href = '/gerador.html';
  } catch (error) {
    console.error('Erro ao abrir gerador:', error);
    alert('Não foi possível verificar seu login. Atualize a página e tente novamente.');
  }
}

async function abrirGeradorGlobal() {
  return abrirGeradorHomeProtegido();
}

function homeIndexMostrarVisao(plano) {
  document.querySelectorAll('.home-visao-plano').forEach(secao => {
    secao.classList.remove('ativo');
    secao.style.display = 'none';
  });

  const id = plano === 'premium'
    ? 'home-plano-premium'
    : plano === 'basico'
      ? 'home-plano-basico'
      : 'home-plano-gratis';

  const secao = document.getElementById(id) || document.getElementById('home-plano-gratis');
  if (secao) {
    secao.classList.add('ativo');
    secao.style.display = 'grid';
  }
}

function homeIndexSetTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function homeIndexFormatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

async function homeIndexBuscarOrcamentos(userId) {
  if (!userId || !window._supabase) return [];

  const campos = ['usuario_id', 'user_id'];
  for (const campo of campos) {
    const { data, error } = await _supabase
      .from('orcamentos')
      .select('*')
      .eq(campo, userId);

    if (!error) return Array.isArray(data) ? data : [];
  }

  return [];
}

function homeIndexPreencherMetricasBasico(orcamentos) {
  const total = orcamentos.length;
  const pendentes = orcamentos.filter(o => fsNormalizarPlano(o.status || 'pendente') === 'pendente').length;
  const aprovados = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(fsNormalizarPlano(o.status))).length;
  const valorAprovado = orcamentos
    .filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(fsNormalizarPlano(o.status)))
    .reduce((soma, o) => soma + Number(o.total || 0), 0);

  homeIndexSetTexto('home-basico-total', total);
  homeIndexSetTexto('home-basico-pendentes', pendentes);
  homeIndexSetTexto('home-basico-aprovados', aprovados);
  homeIndexSetTexto('home-basico-valor', homeIndexFormatarMoeda(valorAprovado));
}

function fsHomeGratisAplicarEscopoPDF() {
  const homeGratis = document.getElementById('home-plano-gratis');
  if (!homeGratis) return;

  const lead = homeGratis.querySelector('.home-lead');
  if (lead) {
    lead.textContent = 'No plano grátis, você usa o gerador para criar orçamento profissional em PDF. Histórico, aprovação por link, dashboard e gestão ficam para os planos pagos.';
  }

  const proofTitulo = homeGratis.querySelector('.home-hero-proof h2');
  if (proofTitulo) proofTitulo.textContent = 'Plano grátis focado no essencial: gerar PDF.';

  const proofTexto = homeGratis.querySelector('.home-hero-proof p');
  if (proofTexto) proofTexto.textContent = 'A versão grátis serve para criar e baixar orçamentos profissionais com limitações e anúncios.';

  const proofList = homeGratis.querySelector('.home-proof-list');
  if (proofList) {
    proofList.innerHTML = `
      <li>Gerador de orçamento profissional.</li>
      <li>PDF com aparência organizada.</li>
      <li>Uso com limitações e anúncios.</li>
      <li>Dashboard, OS, estoque e gestão ficam no plano Premium.</li>
    `;
  }

  const evolucaoTexto = homeGratis.querySelector('.home-section-head p');
  if (evolucaoTexto) {
    evolucaoTexto.textContent = 'O plano grátis é somente para gerar PDF. O Básico libera histórico/status/aprovação, e o Premium libera gestão completa com dashboard.';
  }

  const fluxoTitulo = [...homeGratis.querySelectorAll('.home-section-head h2')].find(el => el.textContent.includes('Da proposta'));
  if (fluxoTitulo) fluxoTitulo.textContent = 'O plano grátis começa e termina no PDF.';

  const fluxoTexto = [...homeGratis.querySelectorAll('.home-section-head p')].find(el => el.textContent.includes('reduzir informação'));
  if (fluxoTexto) fluxoTexto.textContent = 'Para o grátis, o foco é gerar uma proposta apresentável. O acompanhamento do processo é liberado nos planos pagos.';

  const steps = homeGratis.querySelectorAll('.home-flow-step');
  const novosSteps = [
    ['Dados', 'Cliente e serviço.'],
    ['Itens', 'Produtos e mão de obra.'],
    ['PDF', 'Orçamento profissional.'],
    ['Anúncios', 'Modelo grátis.'],
    ['Upgrade', 'Gestão nos planos pagos.']
  ];
  steps.forEach((step, idx) => {
    const novo = novosSteps[idx];
    if (!novo) return;
    const strong = step.querySelector('strong');
    const span = step.querySelector('span');
    if (strong) strong.textContent = novo[0];
    if (span) span.textContent = novo[1];
  });
}

function fsHomeVendedoraAplicar() {
  if (!indexEstaNaHome()) return;

  fsIndexRemoverCssDuplicado();

  document.querySelectorAll('#fs-home-planos-pagos-venda, #fs-home-desejo-produto, #fs-home-forum-social').forEach(el => el.remove());

  const linksForum = document.querySelectorAll('a[href="/social.html"]');
  linksForum.forEach(link => {
    link.href = '/forum.html';
  });

  fsHomeGratisAplicarEscopoPDF();
}

async function homeIndexAplicarPlano() {
  try {
    fsIndexRemoverCssDuplicado();

    if (!window._supabase) {
      homeIndexMostrarVisao('gratis');
      fsHomeVendedoraAplicar();
      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) {
      homeIndexMostrarVisao('gratis');
      fsHomeVendedoraAplicar();
      return;
    }

    const { data } = await _supabase
      .from('perfis')
      .select('plano, plano_status, plano_expira_em')
      .eq('id', session.user.id)
      .maybeSingle();

    let plano = fsNormalizarPlano(data?.plano || localStorage.getItem('usuario_plano') || 'gratis');
    const status = fsNormalizarPlano(data?.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo');

    if (status === 'cancelado' || status === 'expirado') plano = 'gratis';

    localStorage.setItem('usuario_plano', plano);
    if (data?.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
    if (data?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);

    homeIndexMostrarVisao(plano);
    fsHomeVendedoraAplicar();

    if (plano === 'basico') {
      const orcamentos = await homeIndexBuscarOrcamentos(session.user.id);
      homeIndexPreencherMetricasBasico(orcamentos);
    }
  } catch (error) {
    console.warn('Erro ao aplicar home por plano:', error);
    homeIndexMostrarVisao('gratis');
    fsHomeVendedoraAplicar();
  }
}

async function inicializarIndexFS() {
  fsIndexRemoverCssDuplicado();
  esconderSplashIndex();
  configurarRedirecionamentoAposLoginIndex();
  fsHomeVendedoraAplicar();
  homeIndexMostrarVisao('gratis');

  const params = new URLSearchParams(window.location.search);

  if (params.get('login') === '1') {
    setTimeout(() => {
      if (typeof abrirModalLogin === 'function') abrirModalLogin();
    }, 600);
  }

  if (params.get('abrirGerador') === '1') {
    setTimeout(() => {
      abrirGeradorGlobal();
    }, 700);
  }

  setTimeout(homeIndexAplicarPlano, 500);
  setTimeout(homeIndexAplicarPlano, 1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarIndexFS);
} else {
  inicializarIndexFS();
}

window.addEventListener('storage', homeIndexAplicarPlano);

window.abrirGeradorGlobal = abrirGeradorGlobal;
window.abrirGeradorHomeProtegido = abrirGeradorHomeProtegido;
window.homeIndexAplicarPlano = homeIndexAplicarPlano;
window.redirecionarUsuarioLogadoParaDashboardIndex = redirecionarUsuarioLogadoParaDashboardIndex;
window.configurarRedirecionamentoAposLoginIndex = configurarRedirecionamentoAposLoginIndex;
window.fsIndexRemoverCssDuplicado = fsIndexRemoverCssDuplicado;
