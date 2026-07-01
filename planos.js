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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregarStatusPlanoPagina);
else carregarStatusPlanoPagina();

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
