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

function indexEstaNaHome() {
  const path = String(window.location.pathname || '').toLowerCase().replace(/\/$/, '');
  return path === '' || path === '/' || path.endsWith('/index') || path.endsWith('/index.html');
}

async function redirecionarUsuarioLogadoParaDashboardIndex() {
  try {
    if (!window._supabase || !indexEstaNaHome()) return false;

    const params = new URLSearchParams(window.location.search);

    if (params.get('abrirGerador') === '1') return false;

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) return false;

    window.location.href = '/dashboard.html';
    return true;
  } catch (error) {
    console.warn('Não foi possível redirecionar para o Dashboard:', error);
    return false;
  }
}

function configurarRedirecionamentoAposLoginIndex() {
  if (!window._supabase || window.fsIndexRedirectLoginConfigurado === true) return;

  window.fsIndexRedirectLoginConfigurado = true;

  _supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.id && indexEstaNaHome()) {
      setTimeout(() => {
        window.location.href = '/dashboard.html';
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

function fsHomeVendedoraEscapar(texto) {
  return String(texto || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function fsHomeVendedoraInjetarCss() {
  if (document.getElementById('fs-home-vendedora-css')) return;
  const style = document.createElement('style');
  style.id = 'fs-home-vendedora-css';
  style.textContent = `
    .fs-home-venda-bloco {
      background: #ffffff !important;
      color: #2b211d !important;
      border: 1px solid #e3d7ca !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 14px rgba(47,33,29,.07) !important;
      padding: 12px !important;
      margin: 0 !important;
    }

    .fs-home-venda-head {
      border-bottom: 1px solid #ebe2d7 !important;
      padding-bottom: 9px !important;
      margin-bottom: 10px !important;
    }

    .fs-home-venda-tag {
      display: inline-flex !important;
      width: fit-content !important;
      min-height: 24px !important;
      align-items: center !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      background: #f8f4ee !important;
      border: 1px solid #e3d7ca !important;
      color: #3e2723 !important;
      font-size: 10.5px !important;
      line-height: 1 !important;
      font-weight: 950 !important;
      text-transform: uppercase !important;
      margin-bottom: 7px !important;
    }

    .fs-home-venda-head h2 {
      margin: 0 !important;
      color: #2f211d !important;
      font-size: 22px !important;
      line-height: 1.14 !important;
      font-weight: 950 !important;
    }

    .fs-home-venda-head p,
    .fs-home-venda-card p {
      margin: 5px 0 0 !important;
      color: #62554d !important;
      font-size: 13px !important;
      line-height: 1.42 !important;
      font-weight: 720 !important;
    }

    .fs-home-planos-grid,
    .fs-home-desejo-grid,
    .fs-home-forum-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .fs-home-venda-card {
      background: #ffffff !important;
      color: #2b211d !important;
      border: 1px solid #e3d7ca !important;
      border-radius: 7px !important;
      padding: 10px !important;
      box-shadow: none !important;
    }

    .fs-home-venda-card.destaque {
      border-color: #2f211d !important;
      box-shadow: inset 0 0 0 1px #2f211d !important;
    }

    .fs-home-venda-card strong {
      display: block !important;
      color: #2f211d !important;
      font-size: 16px !important;
      line-height: 1.15 !important;
      font-weight: 950 !important;
      margin-bottom: 4px !important;
    }

    .fs-home-preco {
      display: block !important;
      color: #2f211d !important;
      font-size: 22px !important;
      line-height: 1.05 !important;
      font-weight: 950 !important;
      margin: 6px 0 !important;
    }

    .fs-home-preco small {
      color: #62554d !important;
      font-size: 11px !important;
      font-weight: 800 !important;
    }

    .fs-home-lista {
      display: grid !important;
      gap: 5px !important;
      margin: 8px 0 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    .fs-home-lista li {
      display: grid !important;
      grid-template-columns: 18px minmax(0, 1fr) !important;
      gap: 5px !important;
      color: #2b211d !important;
      font-size: 12px !important;
      line-height: 1.3 !important;
      font-weight: 760 !important;
    }

    .fs-home-lista li::before {
      content: '✓';
      color: #166534;
      font-weight: 950;
    }

    .fs-home-cta-row {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 7px !important;
      margin-top: 10px !important;
    }

    .fs-home-btn-pago,
    .fs-home-btn-forum,
    .fs-home-btn-sec {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 34px !important;
      padding: 7px 10px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-weight: 950 !important;
      text-decoration: none !important;
      border: 1px solid #2f211d !important;
      box-shadow: none !important;
    }

    .fs-home-btn-pago { background: #2f211d !important; color: #ffc400 !important; }
    .fs-home-btn-forum { background: #ffc400 !important; color: #2f211d !important; border-color: #ffc400 !important; }
    .fs-home-btn-sec { background: #ffffff !important; color: #2f211d !important; border-color: #d7ccc8 !important; }

    .fs-home-social-preview {
      background: #2f211d !important;
      color: #fffaf0 !important;
      border-color: #2f211d !important;
    }

    .fs-home-social-preview strong,
    .fs-home-social-preview p {
      color: #fffaf0 !important;
    }

    .fs-home-social-preview .fs-home-preco {
      color: #ffc400 !important;
      font-size: 18px !important;
    }

    @media (max-width: 900px) {
      .fs-home-planos-grid,
      .fs-home-desejo-grid,
      .fs-home-forum-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}

function fsHomeVendedoraCriarCardPlano({ titulo, preco, descricao, itens, destaque }) {
  return `
    <article class="fs-home-venda-card${destaque ? ' destaque' : ''}">
      <strong>${fsHomeVendedoraEscapar(titulo)}</strong>
      <span class="fs-home-preco">${fsHomeVendedoraEscapar(preco)}</span>
      <p>${fsHomeVendedoraEscapar(descricao)}</p>
      <ul class="fs-home-lista">${itens.map(item => `<li>${fsHomeVendedoraEscapar(item)}</li>`).join('')}</ul>
    </article>`;
}

function fsHomeVendedoraAplicar() {
  if (!indexEstaNaHome()) return;
  const home = document.getElementById('home-plano-gratis');
  if (!home || document.getElementById('fs-home-planos-pagos-venda')) return;

  fsHomeVendedoraInjetarCss();

  const heroTitulo = document.querySelector('.home-plano-hero h1');
  const heroTexto = document.querySelector('.home-plano-hero p');
  const acoes = document.querySelector('.home-plano-acoes');
  const strip = document.querySelector('.home-professional-strip');

  if (heroTitulo) heroTitulo.textContent = 'Transforme orçamento informal em proposta profissional e acompanhe sua empresa em tempo real.';
  if (heroTexto) heroTexto.textContent = 'Comece grátis gerando PDF, mas evolua para os planos pagos quando quiser histórico, aprovação por link, clientes, ordens de serviço, estoque, agenda e Dashboard de saúde da empresa. O FS Orçamentos foi feito para o prestador parecer mais organizado, vender melhor e perder menos informação.';

  if (acoes && !document.getElementById('fs-home-cta-forum-topo')) {
    const forum = document.createElement('a');
    forum.id = 'fs-home-cta-forum-topo';
    forum.href = '/forum.html';
    forum.className = 'btn-home-atalho fs-home-btn-forum';
    forum.textContent = 'Entrar na comunidade';
    acoes.appendChild(forum);
  }

  if (strip) {
    strip.innerHTML = `
      <article><span>Grátis</span><strong>Teste o gerador</strong><small>Crie orçamentos em PDF e veja se a plataforma encaixa na sua rotina.</small></article>
      <article><span>Básico</span><strong>Venda com controle</strong><small>Histórico, status, aprovação por link e menos orçamento perdido no WhatsApp.</small></article>
      <article><span>Gestão</span><strong>Controle a operação</strong><small>Clientes, veículos, OS, estoque, agenda e Dashboard para acompanhar a empresa.</small></article>
      <article><span>Comunidade</span><strong>Rede de prestadores</strong><small>Publique dúvidas, responda tópicos e aprenda com outros profissionais.</small></article>
    `;
  }

  const blocoPlanos = document.createElement('section');
  blocoPlanos.id = 'fs-home-planos-pagos-venda';
  blocoPlanos.className = 'fs-home-venda-bloco';
  blocoPlanos.innerHTML = `
    <div class="fs-home-venda-head">
      <span class="fs-home-venda-tag">Planos pagos</span>
      <h2>O plano grátis mostra a ferramenta. Os planos pagos organizam a empresa.</h2>
      <p>O objetivo é simples: gerar desejo pela organização. O usuário começa com orçamento em PDF e percebe que precisa salvar histórico, acompanhar aprovação, transformar venda em serviço e enxergar o que está aberto.</p>
    </div>
    <div class="fs-home-planos-grid">
      ${fsHomeVendedoraCriarCardPlano({
        titulo: 'Grátis',
        preco: 'R$ 0',
        descricao: 'Para experimentar e gerar os primeiros orçamentos.',
        itens: ['PDF profissional com limitações', 'Ideal para conhecer a plataforma', 'Boa porta de entrada para novos usuários']
      })}
      ${fsHomeVendedoraCriarCardPlano({
        titulo: 'Básico',
        preco: 'R$ 19,90/mês',
        descricao: 'Para quem quer vender com histórico e acompanhamento.',
        itens: ['Histórico de orçamentos', 'Status pendente, aprovado e recusado', 'Link de aprovação para o cliente', 'Mais controle do que WhatsApp solto'],
        destaque: true
      })}
      ${fsHomeVendedoraCriarCardPlano({
        titulo: 'Gestão',
        preco: 'Premium',
        descricao: 'Para transformar orçamento aprovado em rotina operacional.',
        itens: ['Clientes, veículos e OS', 'Estoque e agenda', 'Dashboard de saúde da empresa', 'Mais aparência de sistema profissional']
      })}
    </div>
    <div class="fs-home-cta-row">
      <a href="/planos.html" class="fs-home-btn-pago">Ver planos e vantagens</a>
      <button type="button" class="fs-home-btn-sec" onclick="abrirGeradorHomeProtegido()">Começar grátis</button>
    </div>
  `;

  const blocoDesejo = document.createElement('section');
  blocoDesejo.id = 'fs-home-desejo-produto';
  blocoDesejo.className = 'fs-home-venda-bloco';
  blocoDesejo.innerHTML = `
    <div class="fs-home-venda-head">
      <span class="fs-home-venda-tag">Por que pagar</span>
      <h2>O cliente não compra só PDF. Ele compra sensação de empresa organizada.</h2>
      <p>O prestador quer parecer profissional, cobrar com mais segurança e não perder controle quando começa a ter mais clientes. É isso que os planos pagos precisam entregar.</p>
    </div>
    <div class="fs-home-desejo-grid">
      <article class="fs-home-venda-card"><strong>Mais confiança</strong><p>Orçamento padronizado, status claro e link de aprovação passam imagem de empresa séria.</p></article>
      <article class="fs-home-venda-card"><strong>Menos perda</strong><p>Orçamentos, clientes e serviços ficam registrados. Nada depende só de conversa antiga no WhatsApp.</p></article>
      <article class="fs-home-venda-card"><strong>Mais gestão</strong><p>Dashboard, OS, agenda e estoque ajudam a acompanhar o que está aberto e o que precisa de atenção.</p></article>
    </div>
  `;

  const blocoForum = document.createElement('section');
  blocoForum.id = 'fs-home-forum-social';
  blocoForum.className = 'fs-home-venda-bloco';
  blocoForum.innerHTML = `
    <div class="fs-home-venda-head">
      <span class="fs-home-venda-tag">Comunidade FS</span>
      <h2>O fórum deve ser a rede social dos prestadores de serviço.</h2>
      <p>Além do sistema, o usuário tem um lugar para interagir: perguntar quanto cobrar, mostrar dúvidas de orçamento, trocar experiência sobre clientes, peças, garantia, cobrança e rotina de oficina ou prestação de serviço.</p>
    </div>
    <div class="fs-home-forum-grid">
      <article class="fs-home-venda-card fs-home-social-preview"><strong>Feed de dúvidas</strong><span class="fs-home-preco">Interação diária</span><p>Usuários publicam perguntas, acompanham respostas e voltam para ver novidades.</p></article>
      <article class="fs-home-venda-card"><strong>Aprendizado prático</strong><p>A comunidade cria conteúdo que ajuda outros prestadores a vender melhor e errar menos.</p></article>
      <article class="fs-home-venda-card"><strong>Retenção</strong><p>O fórum aumenta o motivo para voltar à plataforma mesmo quando o usuário não está gerando orçamento.</p></article>
    </div>
    <div class="fs-home-cta-row">
      <a href="/forum.html" class="fs-home-btn-forum">Acessar comunidade</a>
      <a href="/planos.html" class="fs-home-btn-pago">Conhecer planos pagos</a>
    </div>
  `;

  const primeiraSecao = home.querySelector('.home-story-section');
  if (primeiraSecao) {
    home.insertBefore(blocoPlanos, primeiraSecao);
    home.insertBefore(blocoDesejo, primeiraSecao);
    home.insertBefore(blocoForum, primeiraSecao);
  } else {
    home.appendChild(blocoPlanos);
    home.appendChild(blocoDesejo);
    home.appendChild(blocoForum);
  }

  const comunidadeAntiga = Array.from(home.querySelectorAll('.home-story-section')).find(secao => secao.textContent.includes('Comunidade FS Orçamentos'));
  if (comunidadeAntiga) comunidadeAntiga.style.display = 'none';
}

async function homeIndexAplicarPlano() {
  try {
    if (!window._supabase) return;

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
    fsHomeVendedoraAplicar();
  }
}

async function inicializarIndexFS() {
  esconderSplashIndex();
  configurarRedirecionamentoAposLoginIndex();
  fsHomeVendedoraAplicar();

  const params = new URLSearchParams(window.location.search);

  if (await redirecionarUsuarioLogadoParaDashboardIndex()) {
    return;
  }

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