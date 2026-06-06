/* =========================================================
   FS ORÇAMENTOS - planos.js
   Regras de planos + página de assinatura Básico/Premium

   Regras oficiais:
   - Grátis: somente gerar/baixar PDF com anúncios. Sem nuvem, sem link, sem gestão.
   - Básico: PDF + link de orçamento via WhatsApp + gestão de orçamentos.
   - Premium: todos os recursos, incluindo clientes, veículos, OS e estoque.
   ========================================================= */

const FS_PLANOS = {
  gratis: {
    label: 'Plano Grátis',
    ordem: 0
  },
  basico: {
    label: 'Plano Básico',
    ordem: 1,
    precos: {
      mensal: { periodo: '1 mês', valor: 19.90, label: 'R$ 19,90' },
      semestral: { periodo: '6 meses', valor: 109.90, label: 'R$ 109,90' },
      anual: { periodo: '12 meses', valor: 209.90, label: 'R$ 209,90' }
    }
  },
  premium: {
    label: 'Plano Premium',
    ordem: 2,
    precos: {
      mensal: { periodo: '1 mês', valor: 69.90, label: 'R$ 69,90' },
      semestral: { periodo: '6 meses', valor: 399.90, label: 'R$ 399,90' },
      anual: { periodo: '12 meses', valor: 599.90, label: 'R$ 599,90' }
    }
  }
};

function normalizarPlanoPlanos(valor) {
  return String(valor || 'gratis')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatarDataPlano(valor) {
  if (!valor) return '';

  const data = new Date(valor);

  if (isNaN(data.getTime())) return '';

  return data.toLocaleDateString('pt-BR');
}

function diasAteExpirarPlano(valor) {
  if (!valor) return null;

  const hoje = new Date();
  const expira = new Date(valor);

  if (isNaN(expira.getTime())) return null;

  hoje.setHours(0, 0, 0, 0);
  expira.setHours(0, 0, 0, 0);

  const diff = expira.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function planoLabelPlanos(plano) {
  const p = normalizarPlanoPlanos(plano);

  if (p === 'premium') return 'Plano Premium';
  if (p === 'basico') return 'Plano Básico';

  return 'Plano Grátis';
}

function statusPlanoLabelPlanos(status) {
  const s = normalizarPlanoPlanos(status || 'ativo');

  if (s === 'ativo') return 'Ativo';
  if (s === 'pago') return 'Ativo';
  if (s === 'pendente') return 'Pendente';
  if (s === 'cancelado') return 'Cancelado';
  if (s === 'expirado') return 'Expirado';

  return status || 'Ativo';
}

function planoAtivoPlanos(data) {
  const plano = normalizarPlanoPlanos(data?.plano || 'gratis');
  const status = normalizarPlanoPlanos(data?.plano_status || 'ativo');
  const dias = diasAteExpirarPlano(data?.plano_expira_em);

  if ((plano === 'basico' || plano === 'premium') && status !== 'cancelado' && status !== 'expirado') {
    if (dias === null) return true;
    return dias >= 0;
  }

  return false;
}

function obterPlanoLocal() {
  return normalizarPlanoPlanos(localStorage.getItem('usuario_plano') || 'gratis');
}

function usuarioEhGratis() {
  return obterPlanoLocal() === 'gratis';
}

function usuarioEhBasico() {
  return obterPlanoLocal() === 'basico';
}

function usuarioEhPremium() {
  return obterPlanoLocal() === 'premium';
}

function podeUsarOrcamentos() {
  const plano = obterPlanoLocal();
  return plano === 'basico' || plano === 'premium';
}

function podeUsarPremium() {
  return obterPlanoLocal() === 'premium';
}

function podeSalvarOrcamentoNaNuvem() {
  return podeUsarOrcamentos();
}

function podeUsarLinkWhatsappOrcamento() {
  return podeUsarOrcamentos();
}

function podeUsarClientes() {
  return podeUsarPremium();
}

function podeUsarVeiculos() {
  return podeUsarPremium();
}

function podeUsarOrdensServico() {
  return podeUsarPremium();
}

function podeUsarEstoque() {
  return podeUsarPremium();
}

function bloquearPaginaSeGratis(mensagem) {
  if (!usuarioEhGratis()) return false;

  alert(mensagem || 'Este recurso está disponível nos planos Básico e Premium.');
  window.location.href = '/planos.html';
  return true;
}

function bloquearPaginaSeNaoPremium(mensagem) {
  if (usuarioEhPremium()) return false;

  alert(mensagem || 'Este recurso está disponível somente no Plano Premium.');
  window.location.href = '/planos.html#assinar-plano-premium';
  return true;
}

function planosAbrirLogin() {
  if (typeof abrirModalLogin === 'function') {
    abrirModalLogin();
    return;
  }

  const modal = document.getElementById('modal-login');

  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    return;
  }

  window.location.href = '/index.html?login=1';
}

function atualizarTextoAreaAssinatura(planoAtivo, planoAtual) {
  const tituloBasico = document.getElementById('titulo-assinatura-basico');
  const textoBasico = document.getElementById('texto-assinatura-basico');
  const tituloPremium = document.getElementById('titulo-assinatura-premium');
  const textoPremium = document.getElementById('texto-assinatura-premium');

  const plano = normalizarPlanoPlanos(planoAtual || 'gratis');

  if (tituloBasico && textoBasico) {
    if (planoAtivo && plano === 'basico') {
      tituloBasico.innerText = 'Renove seu Plano Básico';
      textoBasico.innerText = 'Seu plano está ativo. Você pode gerar um novo Pix para renovar ou ampliar o período de uso.';
    } else if (planoAtivo && plano === 'premium') {
      tituloBasico.innerText = 'Você já está no Premium';
      textoBasico.innerText = 'O Premium já inclui todos os recursos do Plano Básico. Use esta área apenas se quiser voltar ou renovar o Básico futuramente.';
    } else {
      tituloBasico.innerText = 'Ative o Plano Básico via Pix';
      textoBasico.innerText = 'Escolha o período desejado, gere o Pix e libere PDF sem anúncios, nuvem, link via WhatsApp e gestão de orçamentos.';
    }
  }

  if (tituloPremium && textoPremium) {
    if (planoAtivo && plano === 'premium') {
      tituloPremium.innerText = 'Renove seu Plano Premium';
      textoPremium.innerText = 'Seu plano Premium está ativo. Você pode renovar agora para continuar usando clientes, veículos, OS e estoque sem interrupção.';
    } else {
      tituloPremium.innerText = 'Ative o Plano Premium via Pix';
      textoPremium.innerText = 'Libere o sistema completo para oficina e prestadores: clientes, veículos, ordens de serviço, estoque e PDF profissional da OS.';
    }
  }
}

function atualizarBotoesPixPlanos(planoAtivo, logado, planoAtual) {
  const botoes = document.querySelectorAll('[data-botao-pix]');
  const planoNormalizado = normalizarPlanoPlanos(planoAtual || 'gratis');

  botoes.forEach(botao => {
    const periodo = botao.dataset.periodo || '';
    const plano = normalizarPlanoPlanos(botao.dataset.plano || 'basico');

    if (!logado) {
      botao.disabled = false;
      botao.innerText = 'Entrar para assinar';
      botao.onclick = planosAbrirLogin;
      return;
    }

    botao.disabled = false;

    if (planoAtivo && planoNormalizado === plano) {
      botao.innerText = 'Renovar Pix';
    } else if (planoAtivo && planoNormalizado === 'premium' && plano === 'basico') {
      botao.innerText = 'Premium ativo';
      botao.disabled = true;
    } else {
      botao.innerText = 'Gerar Pix';
    }

    botao.onclick = function() {
      if (plano === 'premium') {
        gerarPixPlanoPremium(periodo);
        return;
      }

      if (typeof gerarPixPlanoBasico === 'function') {
        gerarPixPlanoBasico(periodo);
        return;
      }

      alert('Sistema de pagamento ainda não carregou. Atualize a página e tente novamente.');
    };
  });
}

function setStatusBox(tipo, html) {
  const box = document.getElementById('status-plano-box');

  if (!box) return;

  box.style.display = 'block';
  box.className = `status-plano-box ${tipo || ''}`;
  box.innerHTML = html;
}

async function atualizarStatusPlanoPlanos() {
  const box = document.getElementById('status-plano-box');

  if (!box) return;

  try {
    if (!window._supabase) {
      box.style.display = 'none';
      atualizarTextoAreaAssinatura(false, 'gratis');
      atualizarBotoesPixPlanos(false, false, 'gratis');
      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) {
      setStatusBox('status-alerta', `
        Você ainda não está logado. Entre na sua conta para assinar ou verificar seu plano atual.
        <br>
        <button type="button" class="btn-login-status-plano" onclick="planosAbrirLogin()">
          Entrar ou criar conta
        </button>
      `);

      atualizarTextoAreaAssinatura(false, 'gratis');
      atualizarBotoesPixPlanos(false, false, 'gratis');
      return;
    }

    const { data, error } = await _supabase
      .from('perfis')
      .select('plano, plano_status, plano_expira_em')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('Não foi possível verificar o plano:', error);
      box.style.display = 'none';
      atualizarTextoAreaAssinatura(false, 'gratis');
      atualizarBotoesPixPlanos(false, true, 'gratis');
      return;
    }

    const plano = normalizarPlanoPlanos(data?.plano || 'gratis');
    const status = normalizarPlanoPlanos(data?.plano_status || 'ativo');
    const expiraEm = data?.plano_expira_em || '';
    const dias = diasAteExpirarPlano(expiraEm);
    const dataFormatada = formatarDataPlano(expiraEm);
    const ativo = planoAtivoPlanos(data);

    localStorage.setItem('usuario_plano', plano);

    if (data?.plano_status) {
      localStorage.setItem('usuario_plano_status', data.plano_status);
    } else {
      localStorage.removeItem('usuario_plano_status');
    }

    if (data?.plano_expira_em) {
      localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
    } else {
      localStorage.removeItem('usuario_plano_expira_em');
    }

    atualizarTextoAreaAssinatura(ativo, plano);
    atualizarBotoesPixPlanos(ativo, true, plano);

    if (plano === 'basico' || plano === 'premium') {
      if (!ativo || status === 'expirado' || status === 'cancelado' || (dias !== null && dias < 0)) {
        setStatusBox('status-erro', `
          Seu <strong>${planoLabelPlanos(plano)}</strong> está ${status === 'cancelado' ? 'cancelado' : 'expirado'}.
          Renove abaixo para continuar usando os recursos pagos.
        `);
        return;
      }

      let textoExpiracao = '';

      if (dataFormatada) {
        if (dias === 0) {
          textoExpiracao = ` Vence hoje (${dataFormatada}).`;
        } else if (dias === 1) {
          textoExpiracao = ` Vence amanhã (${dataFormatada}).`;
        } else if (dias !== null) {
          textoExpiracao = ` Expira em ${dataFormatada}, faltam ${dias} dias.`;
        } else {
          textoExpiracao = ` Expira em ${dataFormatada}.`;
        }
      }

      setStatusBox('status-ok', `
        Você está no <strong>${planoLabelPlanos(plano)}</strong>.
        Status: <strong>${statusPlanoLabelPlanos(status)}</strong>.${textoExpiracao}
      `);
      return;
    }

    setStatusBox('status-alerta', `
      Você está no <strong>Plano Grátis</strong>. Ative o Básico para liberar gestão de orçamentos
      ou o Premium para liberar clientes, veículos, OS e estoque.
    `);

  } catch (error) {
    console.warn('Erro ao atualizar status do plano:', error);
    box.style.display = 'none';
    atualizarTextoAreaAssinatura(false, 'gratis');
    atualizarBotoesPixPlanos(false, false, 'gratis');
  }
}

function abrirModalPixPlano(plano, periodo, aviso) {
  const modal = document.getElementById('modal-pix-basico');
  const loading = document.getElementById('pix-loading');
  const conteudo = document.getElementById('pix-conteudo');
  const erro = document.getElementById('pix-erro');
  const subtitulo = document.getElementById('pix-modal-subtitulo');
  const planoLabel = document.getElementById('pix-plano-label');
  const valorEl = document.getElementById('pix-valor');

  const planoConfig = FS_PLANOS[plano] || FS_PLANOS.basico;
  const preco = planoConfig.precos?.[periodo];

  if (modal) modal.style.display = 'flex';
  if (loading) loading.style.display = 'none';
  if (conteudo) conteudo.style.display = 'none';

  if (subtitulo) subtitulo.innerText = planoConfig.label;
  if (planoLabel) planoLabel.innerText = `${planoConfig.label} - ${preco?.periodo || periodo}`;
  if (valorEl) valorEl.innerText = preco?.label || '';

  if (erro) {
    erro.style.display = 'block';
    erro.innerHTML = aviso || 'Não foi possível iniciar o pagamento deste plano.';
  }
}

function gerarPixPlanoPremium(periodo) {
  if (typeof window.gerarPixPremium === 'function') {
    window.gerarPixPremium(periodo);
    return;
  }

  if (typeof window.gerarPixPlano === 'function') {
    window.gerarPixPlano('premium', periodo);
    return;
  }

  abrirModalPixPlano(
    'premium',
    periodo,
    'O painel do Plano Premium já está pronto. Agora falta conectar o Premium no <strong>pagamentos.js</strong> / função Pix para gerar cobranças de R$ 69,90, R$ 399,90 e R$ 599,90.'
  );
}

function fecharModalPixBasico() {
  const modal = document.getElementById('modal-pix-basico');
  if (modal) modal.style.display = 'none';
}

function copiarPixCopiaCola() {
  const textarea = document.getElementById('pix-copia-cola');
  if (!textarea) return;

  textarea.select();
  document.execCommand('copy');
  alert('Pix copia e cola copiado.');
}

function verificarPagamentoPixAtual() {
  if (typeof window.verificarPagamentoPixAtualOriginal === 'function') {
    window.verificarPagamentoPixAtualOriginal();
    return;
  }

  alert('A verificação automática depende da integração Pix ativa no pagamentos.js.');
}



/* =========================================================
   REGRAS CENTRAIS DE ACESSO POR PLANO
   Use em qualquer página do sistema.
   ========================================================= */

function planoTemNivel(planoAtual, planoMinimo) {
  const atual = FS_PLANOS[normalizarPlanoPlanos(planoAtual)]?.ordem ?? 0;
  const minimo = FS_PLANOS[normalizarPlanoPlanos(planoMinimo)]?.ordem ?? 0;
  return atual >= minimo;
}

async function buscarPlanoUsuarioAtualizado() {
  let planoLocal = normalizarPlanoPlanos(localStorage.getItem('usuario_plano') || 'gratis');

  try {
    if (!window._supabase) return planoLocal;

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return 'gratis';

    const { data, error } = await _supabase
      .from('perfis')
      .select('plano, plano_status, plano_expira_em')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !data) return planoLocal;

    const plano = planoAtivoPlanos(data)
      ? normalizarPlanoPlanos(data.plano || 'gratis')
      : 'gratis';

    localStorage.setItem('usuario_plano', plano);

    if (data.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
    else localStorage.removeItem('usuario_plano_status');

    if (data.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
    else localStorage.removeItem('usuario_plano_expira_em');

    return plano;
  } catch (error) {
    console.warn('Não foi possível atualizar plano do usuário:', error);
    return planoLocal;
  }
}

function montarAvisoBloqueioPlano(titulo, texto, planoDestino = 'premium') {
  const destino = planoDestino === 'premium' ? '/planos.html#assinar-plano-premium' : '/planos.html#assinar-plano-basico';

  return `
    <main style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:28px 14px;background:#2c2c2c;color:#3e2723;">
      <section style="width:min(100%,760px);background:#f4ece1;border-radius:22px;border-top:7px solid #ffc400;box-shadow:0 18px 46px rgba(0,0,0,.3);padding:26px;text-align:center;">
        <div style="display:inline-flex;background:#3e2723;color:#ffc400;border:1px solid #ffc400;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:14px;">Recurso do ${planoDestino === 'premium' ? 'Plano Premium' : 'Plano Básico'}</div>
        <h1 style="margin:0 0 10px;color:#3e2723;font-size:30px;">${titulo}</h1>
        <p style="margin:0 auto 18px;color:#6d4c41;line-height:1.55;max-width:620px;font-size:16px;">${texto}</p>
        <a href="${destino}" style="display:inline-flex;align-items:center;justify-content:center;background:#ffc400;color:#3e2723;border:2px solid #3e2723;border-radius:999px;padding:13px 20px;font-weight:900;text-decoration:none;">Ver planos</a>
        <a href="/gerador.html" style="display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#3e2723;border:2px solid #d7ccc8;border-radius:999px;padding:13px 20px;font-weight:900;text-decoration:none;margin-left:8px;">Voltar ao gerador</a>
      </section>
    </main>
  `;
}

async function bloquearPaginaPorPlano(planoMinimo, opcoes = {}) {
  const plano = await buscarPlanoUsuarioAtualizado();

  if (planoTemNivel(plano, planoMinimo)) return false;

  const titulo = opcoes.titulo || (planoMinimo === 'premium' ? 'Função exclusiva do Plano Premium' : 'Função disponível a partir do Plano Básico');
  const texto = opcoes.texto || (planoMinimo === 'premium'
    ? 'Clientes, veículos, ordens de serviço, estoque e gestão de oficina fazem parte do Plano Premium.'
    : 'Gestão de orçamentos, link para WhatsApp e aprovação online fazem parte do Plano Básico.');

  document.body.innerHTML = montarAvisoBloqueioPlano(titulo, texto, planoMinimo);
  return true;
}

async function bloquearPaginaSeNaoPremiumAsync(mensagem) {
  return bloquearPaginaPorPlano('premium', {
    titulo: 'Função exclusiva do Plano Premium',
    texto: mensagem || 'Este módulo faz parte do Plano Premium: clientes, veículos, ordens de serviço, estoque e gestão completa.'
  });
}

async function bloquearPaginaSeGratisAsync(mensagem) {
  return bloquearPaginaPorPlano('basico', {
    titulo: 'Função disponível a partir do Plano Básico',
    texto: mensagem || 'Esta página é liberada para Básico e Premium. O Plano Grátis permite gerar e baixar PDF com anúncios.'
  });
}


document.addEventListener('DOMContentLoaded', function() {
  atualizarStatusPlanoPlanos();

  setTimeout(atualizarStatusPlanoPlanos, 900);
  setTimeout(atualizarStatusPlanoPlanos, 1800);
});

if (window._supabase) {
  _supabase.auth.onAuthStateChange(() => {
    setTimeout(atualizarStatusPlanoPlanos, 500);
    setTimeout(atualizarStatusPlanoPlanos, 1400);
  });
}

window.FS_PLANOS = FS_PLANOS;
window.normalizarPlanoPlanos = normalizarPlanoPlanos;
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
window.planosAbrirLogin = planosAbrirLogin;
window.atualizarStatusPlanoPlanos = atualizarStatusPlanoPlanos;
window.gerarPixPlanoPremium = gerarPixPlanoPremium;
window.fecharModalPixBasico = window.fecharModalPixBasico || fecharModalPixBasico;
window.copiarPixCopiaCola = window.copiarPixCopiaCola || copiarPixCopiaCola;
window.verificarPagamentoPixAtual = window.verificarPagamentoPixAtual || verificarPagamentoPixAtual;


window.planoTemNivel = planoTemNivel;
window.buscarPlanoUsuarioAtualizado = buscarPlanoUsuarioAtualizado;
window.bloquearPaginaPorPlano = bloquearPaginaPorPlano;
window.bloquearPaginaSeNaoPremiumAsync = bloquearPaginaSeNaoPremiumAsync;
window.bloquearPaginaSeGratisAsync = bloquearPaginaSeGratisAsync;
