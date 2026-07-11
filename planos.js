/* FS ORÇAMENTOS - planos oficiais
   Grátis: gera PDF.
   Premium lançamento: salva orçamentos, envia WhatsApp com aprovação/recusa, recorrentes, caixa e relatórios.
   Compatibilidade: plano antigo "basico" passa a ser tratado como Premium.
 */

const FS_PLANOS = {
  gratis: { label: 'Plano Grátis', ordem: 0 },
  premium: {
    label: 'Plano Premium',
    ordem: 1,
    precos: {
      mensal: { periodo: '1 mês', valor: 29.90, label: 'R$ 29,90' },
      semestral: { periodo: '6 meses', valor: 149.90, label: 'R$ 149,90' },
      anual: { periodo: '12 meses', valor: 299.90, label: 'R$ 299,90' }
    }
  }
};

function normalizarPlanoPlanos(valor) {
  const plano = String(valor || 'gratis').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return ['premium', 'basico', 'gestao'].includes(plano) ? 'premium' : 'gratis';
}

function formatarDataPlano(valor) {
  const data = valor ? new Date(valor) : null;
  return data && !Number.isNaN(data.getTime()) ? data.toLocaleDateString('pt-BR') : '';
}

function diasAteExpirarPlano(valor) {
  const expira = valor ? new Date(valor) : null;
  if (!expira || Number.isNaN(expira.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  expira.setHours(0, 0, 0, 0);
  return Math.ceil((expira.getTime() - hoje.getTime()) / 86400000);
}

function planoLabelPlanos(plano) {
  return normalizarPlanoPlanos(plano) === 'premium' ? 'Plano Premium' : 'Plano Grátis';
}

function planoAtivoPlanos(data = {}) {
  const plano = normalizarPlanoPlanos(data.plano || 'gratis');
  const status = String(data.plano_status || 'ativo').toLowerCase();
  const dias = diasAteExpirarPlano(data.plano_expira_em);
  return plano === 'premium' && !['cancelado', 'expirado'].includes(status) && (dias === null || dias >= 0);
}

function obterPlanoLocal() { return normalizarPlanoPlanos(localStorage.getItem('usuario_plano') || 'gratis'); }
function usuarioEhGratis() { return obterPlanoLocal() === 'gratis'; }
function usuarioEhBasico() { return false; }
function usuarioEhPremium() { return obterPlanoLocal() === 'premium'; }
function podeUsarOrcamentos() { return usuarioEhPremium(); }
function podeUsarPremium() { return usuarioEhPremium(); }
function podeSalvarOrcamentoNaNuvem() { return usuarioEhPremium(); }
function podeUsarLinkWhatsappOrcamento() { return usuarioEhPremium(); }
function podeUsarClientes() { return false; }
function podeUsarVeiculos() { return false; }
function podeUsarOrdensServico() { return false; }
function podeUsarEstoque() { return false; }

function bloquearPaginaSeGratis(mensagem) {
  if (usuarioEhPremium()) return false;
  alert(mensagem || 'Este recurso faz parte do Plano Premium. O Plano Grátis continua liberado para gerar PDF.');
  window.location.href = '/planos.html#assinar-plano-premium';
  return true;
}

function bloquearPaginaSeNaoPremium(mensagem) {
  if (usuarioEhPremium()) return false;
  alert(mensagem || 'Este recurso está disponível somente no Plano Premium.');
  window.location.href = '/planos.html#assinar-plano-premium';
  return true;
}

function planosAbrirLogin() {
  if (typeof abrirModalLogin === 'function') abrirModalLogin();
  else window.location.href = '/index.html?login=1&dest=' + encodeURIComponent('/planos.html');
}

function atualizarStatusPlanoBox(perfil) {
  const box = document.getElementById('status-plano-box');
  if (!box) return;
  if (!perfil?.logado) {
    box.textContent = 'Entre na sua conta para consultar ou assinar o Premium.';
    return;
  }
  const ativo = planoAtivoPlanos(perfil);
  const expira = perfil.plano_expira_em ? ' • expira em ' + formatarDataPlano(perfil.plano_expira_em) : '';
  box.textContent = ativo ? `Plano Premium ativo${expira}.` : `Plano atual: ${planoLabelPlanos(perfil.plano)}.`;
}

function atualizarBotoesPixPlanos(perfil = {}) {
  document.querySelectorAll('[data-botao-pix]').forEach(botao => {
    const periodo = botao.dataset.periodo || 'mensal';
    botao.dataset.plano = 'premium';
    botao.disabled = false;
    if (!perfil.logado) {
      botao.innerText = 'Entrar para assinar';
      botao.onclick = planosAbrirLogin;
    } else {
      botao.innerText = planoAtivoPlanos(perfil) ? 'Renovar Premium' : 'Assinar Premium';
      botao.onclick = () => window.gerarPixPlano ? window.gerarPixPlano('premium', periodo) : alert('Atualize a página e tente novamente.');
    }
  });
}

function atualizarBotaoTestePremium(perfil) {
  const botao = document.getElementById('btn-teste-premium');
  const texto = document.getElementById('texto-status-teste-premium');
  if (!botao && !texto) return;
  if (!perfil?.logado) {
    if (botao) { botao.disabled = false; botao.innerText = 'Entrar para testar'; }
    if (texto) texto.innerText = 'Entre ou crie sua conta para testar o Premium.';
    return;
  }
  if (planoAtivoPlanos(perfil)) {
    if (botao) { botao.disabled = true; botao.innerText = 'Premium ativo'; }
    if (texto) texto.innerText = 'Sua conta já possui os recursos Premium.';
    return;
  }
  if (perfil.teste_premium_usado) {
    if (botao) { botao.disabled = true; botao.innerText = 'Teste já usado'; }
    if (texto) texto.innerText = 'O teste grátis já foi usado nesta conta.';
    return;
  }
  if (botao) { botao.disabled = false; botao.innerText = 'Ativar teste grátis'; }
  if (texto) texto.innerText = 'Teste aprovação online, recorrentes, caixa e relatórios.';
}

async function obterPerfilPlanoAtual() {
  const perfil = { logado: false, plano: 'gratis', plano_status: 'ativo' };
  try {
    if (!window._supabase) return perfil;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return perfil;
    perfil.logado = true;
    const { data } = await _supabase.from('perfis').select('plano,plano_status,plano_expira_em,teste_premium_usado,teste_premium_fim').eq('id', session.user.id).maybeSingle();
    if (data) Object.assign(perfil, data, { plano: normalizarPlanoPlanos(data.plano) });
    localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
    if (perfil.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status); else localStorage.removeItem('usuario_plano_status');
    if (perfil.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em); else localStorage.removeItem('usuario_plano_expira_em');
  } catch (error) {
    console.warn('Não foi possível obter plano:', error);
  }
  return perfil;
}

async function carregarStatusPlanoPagina() {
  const perfil = await obterPerfilPlanoAtual();
  atualizarStatusPlanoBox(perfil);
  atualizarBotoesPixPlanos(perfil);
  atualizarBotaoTestePremium(perfil);
}

async function ativarTesteGratisPremium() {
  try {
    if (!window._supabase) return alert('Atualize a página e tente novamente.');
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return planosAbrirLogin();
    const { data, error } = await _supabase.rpc('ativar_teste_premium');
    if (error) throw error;
    if (data?.plano) localStorage.setItem('usuario_plano', normalizarPlanoPlanos(data.plano));
    alert(data?.mensagem || 'Teste Premium ativado.');
    window.location.reload();
  } catch (error) {
    console.warn('Teste Premium indisponível:', error);
    alert('Não foi possível ativar o teste Premium agora.');
  }
}

function adicionarEfexNaHomePublica() {
  const home = document.getElementById('home-publica');
  const hero = home?.querySelector('.home-hero');
  if (!home || !hero || document.getElementById('home-efex-destaque')) return;

  const estilo = document.createElement('style');
  estilo.id = 'home-efex-estilo';
  estilo.textContent = `
    #home-efex-destaque{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:28px;align-items:center;margin:0 0 28px;padding:28px;border-radius:26px;background:linear-gradient(135deg,#07142f,#0b1f46);border:1px solid rgba(245,182,37,.55);box-shadow:0 22px 48px rgba(7,20,47,.24);overflow:hidden;color:#fff}
    #home-efex-destaque .home-efex-imagem{position:relative;min-width:0}
    #home-efex-destaque img{display:block;width:100%;height:auto;max-width:520px;margin:auto;border-radius:22px;box-shadow:0 22px 42px rgba(0,0,0,.28);animation:homeEfexEntrada .65s ease both}
    #home-efex-destaque .home-efex-conteudo{display:grid;gap:18px;align-content:center}
    #home-efex-destaque .home-efex-selo{display:inline-flex;width:fit-content;padding:8px 13px;border-radius:999px;background:rgba(245,182,37,.14);border:1px solid rgba(245,182,37,.55);color:#ffd76a;font-size:12px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
    #home-efex-destaque h2{margin:0;color:#fff;font-size:clamp(30px,4.7vw,54px);line-height:1.02;letter-spacing:-.045em}
    #home-efex-destaque h2 span{color:#f5b625}
    #home-efex-destaque p{margin:0;color:#dbe7ff;font-size:clamp(16px,2vw,21px);line-height:1.5;font-weight:700}
    #home-efex-destaque .home-efex-lista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #home-efex-destaque .home-efex-item{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;font-weight:850}
    #home-efex-destaque .home-efex-acoes{display:flex;gap:12px;flex-wrap:wrap}
    #home-efex-destaque .home-efex-btn{display:inline-flex;align-items:center;justify-content:center;min-height:54px;padding:13px 18px;border-radius:13px;text-decoration:none;font-weight:950}
    #home-efex-destaque .home-efex-btn.primary{background:#f5b625;color:#07142f;border:1px solid #ffd76a}
    #home-efex-destaque .home-efex-btn.secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.2)}
    @keyframes homeEfexEntrada{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
    @media(max-width:880px){#home-efex-destaque{grid-template-columns:1fr;padding:18px;gap:20px}#home-efex-destaque .home-efex-imagem{order:-1}#home-efex-destaque img{max-width:620px}#home-efex-destaque .home-efex-conteudo{text-align:center}#home-efex-destaque .home-efex-selo{margin:auto}#home-efex-destaque .home-efex-acoes{justify-content:center}}
    @media(max-width:520px){#home-efex-destaque{padding:12px;border-radius:20px}#home-efex-destaque img{border-radius:16px}#home-efex-destaque .home-efex-lista{grid-template-columns:1fr}#home-efex-destaque .home-efex-acoes{display:grid}#home-efex-destaque .home-efex-btn{width:100%}}
  `;
  document.head.appendChild(estilo);

  const secao = document.createElement('section');
  secao.id = 'home-efex-destaque';
  secao.setAttribute('aria-labelledby', 'home-efex-titulo');
  secao.innerHTML = `
    <div class="home-efex-imagem">
      <img src="/efex-img.JPG?v=64fa986" alt="EfeX, auxiliar de diagnóstico mecânico com inteligência artificial do FS Orçamentos" width="450" height="450" loading="eager" fetchpriority="high">
    </div>
    <div class="home-efex-conteudo">
      <span class="home-efex-selo">Novo no FS Orçamentos</span>
      <h2 id="home-efex-titulo">Conheça o <span>EfeX</span></h2>
      <p>Seu auxiliar de diagnóstico mecânico com inteligência artificial. Analisa sintomas, sugere testes, orienta o diagnóstico e ajuda a criar um rascunho de orçamento.</p>
      <div class="home-efex-lista" aria-label="Recursos do EfeX">
        <div class="home-efex-item">🔍 Analisa sintomas</div>
        <div class="home-efex-item">🩺 Sugere testes</div>
        <div class="home-efex-item">📋 Orienta o diagnóstico</div>
        <div class="home-efex-item">🧾 Gera rascunho</div>
      </div>
      <div class="home-efex-acoes">
        <a class="home-efex-btn primary" href="/efex.html">Experimentar o EfeX</a>
        <a class="home-efex-btn secondary" href="/planos.html">Conhecer os planos</a>
      </div>
    </div>`;

  home.insertBefore(secao, hero);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    carregarStatusPlanoPagina();
    adicionarEfexNaHomePublica();
  });
} else {
  carregarStatusPlanoPagina();
  adicionarEfexNaHomePublica();
}

window.FS_PLANOS = FS_PLANOS;
window.normalizarPlanoPlanos = normalizarPlanoPlanos;
window.obterPlanoLocal = obterPlanoLocal;
window.usuarioEhGratis = usuarioEhGratis;
window.usuarioEhBasico = usuarioEhBasico;
window.usuarioEhPremium = usuarioEhPremium;
window.podeUsarOrcamentos = podeUsarOrcamentos;
window.podeUsarPremium = podeUsarPremium;
window.podeSalvarOrcamentoNaNuvem = podeSalvarOrcamentoNaNuvem;
window.podeUsarLinkWhatsappOrcamento = podeUsarLinkWhatsappOrcamento;
window.podeUsarClientes = podeUsarClientes;
window.podeUsarVeiculos = podeUsarVeiculos;
window.podeUsarOrdensServico = podeUsarOrdensServico;
window.podeUsarEstoque = podeUsarEstoque;
window.bloquearPaginaSeGratis = bloquearPaginaSeGratis;
window.bloquearPaginaSeNaoPremium = bloquearPaginaSeNaoPremium;
window.ativarTesteGratisPremium = ativarTesteGratisPremium;
window.carregarStatusPlanoPagina = carregarStatusPlanoPagina;
