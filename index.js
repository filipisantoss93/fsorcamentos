/* =========================================================
   FS ORÇAMENTOS - index.js
   Comportamentos específicos da página inicial
   ========================================================= */

function esconderSplashIndex() {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hide-splash');
  }, 900);
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

  const secao = document.getElementById(id);
  if (secao) {
    secao.classList.add('ativo');
    secao.style.display = 'block';
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

async function homeIndexAplicarPlano() {
  try {
    if (!window._supabase) return;

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) {
      homeIndexMostrarVisao('gratis');
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

    if (plano === 'basico') {
      const orcamentos = await homeIndexBuscarOrcamentos(session.user.id);
      homeIndexPreencherMetricasBasico(orcamentos);
    }
  } catch (error) {
    console.warn('Erro ao aplicar home por plano:', error);
  }
}

function inicializarIndexFS() {
  esconderSplashIndex();

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
