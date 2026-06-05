// ==================== PAGAMENTOS.JS ====================
// FS Orçamentos - Pagamento Pix Plano Básico
// Centraliza as funções de pagamento usadas em index.html, planos.html,
// painel.html e orcamentos.html.

// IMPORTANTE:
// Este arquivo depende de:
// - Supabase carregado em config.js
// - window._supabase disponível
// - Modal Pix presente no HTML da página
// - Edge Function: criar-pix-basico

let pagamentoPixAtualId = null;

const FS_SUPABASE_FUNCTIONS_URL =
  window.FS_SUPABASE_FUNCTIONS_URL ||
  'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';

const FS_PLANOS_PIX = {
  mensal: {
    label: 'Plano Básico - 1 mês',
    valor: 19.90
  },
  semestral: {
    label: 'Plano Básico - 6 meses',
    valor: 109.90
  },
  anual: {
    label: 'Plano Básico - 12 meses',
    valor: 209.90
  }
};

// ==================== HELPERS ====================

function fsPagamentoEl(id) {
  return document.getElementById(id);
}

function fsFormatarMoedaPix(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function fsNormalizarPlanoPagamento(valor) {
  return String(valor || 'gratis')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fsPeriodoPixValido(periodo) {
  return Object.prototype.hasOwnProperty.call(FS_PLANOS_PIX, periodo);
}

function fsObterPlanoPix(periodo) {
  return FS_PLANOS_PIX[periodo] || FS_PLANOS_PIX.mensal;
}

async function fsObterSessaoPagamento() {
  try {
    if (!window._supabase) return null;

    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error || !session) return null;

    return session;
  } catch (error) {
    console.error('Erro ao obter sessão para pagamento:', error);
    return null;
  }
}

function fsUsuarioLogadoObrigatorioPagamento() {
  if (typeof abrirModalLogin === 'function') {
    abrirModalLogin();
    return;
  }

  window.location.href = '/index.html?login=1';
}

// ==================== MODAL PIX ====================

function abrirModalPixBasico() {
  const modal = fsPagamentoEl('modal-pix-basico');

  if (!modal) {
    console.warn('Modal Pix não encontrado na página.');
    return;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function fecharModalPixBasico() {
  const modal = fsPagamentoEl('modal-pix-basico');

  if (!modal) return;

  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function setEstadoModalPixCarregando(periodo = 'mensal') {
  abrirModalPixBasico();

  const plano = fsObterPlanoPix(periodo);

  const loading = fsPagamentoEl('pix-loading');
  const conteudo = fsPagamentoEl('pix-conteudo');
  const erro = fsPagamentoEl('pix-erro');

  const subtitulo = fsPagamentoEl('pix-modal-subtitulo');
  const planoLabel = fsPagamentoEl('pix-plano-label');
  const pixValor = fsPagamentoEl('pix-valor');
  const qrImg = fsPagamentoEl('pix-qrcode-img');
  const copiaCola = fsPagamentoEl('pix-copia-cola');

  pagamentoPixAtualId = null;
  window.pagamentoPixAtualId = null;

  if (loading) {
    loading.style.display = 'block';
    loading.innerText = 'Gerando Pix, aguarde...';
  }

  if (conteudo) {
    conteudo.style.display = 'none';
  }

  if (erro) {
    erro.style.display = 'none';
    erro.innerText = '';
  }

  if (subtitulo) {
    subtitulo.innerText = `${plano.label} - ${fsFormatarMoedaPix(plano.valor)}`;
  }

  if (planoLabel) {
    planoLabel.innerText = plano.label;
  }

  if (pixValor) {
    pixValor.innerText = fsFormatarMoedaPix(plano.valor);
  }

  if (qrImg) {
    qrImg.src = '';
    qrImg.style.display = 'none';
  }

  if (copiaCola) {
    copiaCola.value = '';
  }
}

function setEstadoModalPixErro(mensagem) {
  abrirModalPixBasico();

  const loading = fsPagamentoEl('pix-loading');
  const conteudo = fsPagamentoEl('pix-conteudo');
  const erro = fsPagamentoEl('pix-erro');

  if (loading) {
    loading.style.display = 'none';
  }

  if (conteudo) {
    conteudo.style.display = 'none';
  }

  if (erro) {
    erro.style.display = 'block';
    erro.innerText = mensagem || 'Não foi possível gerar o Pix.';
  }
}

function setEstadoModalPixConteudo(dados) {
  const loading = fsPagamentoEl('pix-loading');
  const conteudo = fsPagamentoEl('pix-conteudo');
  const erro = fsPagamentoEl('pix-erro');

  const subtitulo = fsPagamentoEl('pix-modal-subtitulo');
  const planoLabel = fsPagamentoEl('pix-plano-label');
  const pixValor = fsPagamentoEl('pix-valor');
  const qrImg = fsPagamentoEl('pix-qrcode-img');
  const copiaCola = fsPagamentoEl('pix-copia-cola');

  pagamentoPixAtualId =
    dados?.pagamento_id ||
    dados?.id ||
    null;

  window.pagamentoPixAtualId = pagamentoPixAtualId;

  if (loading) {
    loading.style.display = 'none';
  }

  if (conteudo) {
    conteudo.style.display = 'block';
  }

  if (erro) {
    erro.style.display = 'none';
    erro.innerText = '';
  }

  if (subtitulo) {
    subtitulo.innerText = `${dados?.label || 'Plano Básico'} - ${fsFormatarMoedaPix(dados?.valor)}`;
  }

  if (planoLabel) {
    planoLabel.innerText = dados?.label || 'Plano Básico';
  }

  if (pixValor) {
    pixValor.innerText = fsFormatarMoedaPix(dados?.valor);
  }

  if (qrImg) {
    const qrCode =
      dados?.qr_code ||
      dados?.qrcode ||
      dados?.qrCode ||
      dados?.imagem_qrcode ||
      '';

    if (qrCode) {
      qrImg.src = qrCode;
      qrImg.style.display = 'inline-block';
    } else {
      qrImg.src = '';
      qrImg.style.display = 'none';
    }
  }

  if (copiaCola) {
    copiaCola.value =
      dados?.pix_copia_cola ||
      dados?.copia_cola ||
      dados?.pixCopiaCola ||
      dados?.brcode ||
      '';
  }
}

// ==================== GERAR PIX ====================

async function gerarPixPlanoBasico(periodo) {
  try {
    const periodoFinal = fsPeriodoPixValido(periodo) ? periodo : 'mensal';

    if (!window._supabase) {
      alert('Supabase não carregou. Atualize a página e tente novamente.');
      return;
    }

    const session = await fsObterSessaoPagamento();

    if (!session) {
      fsUsuarioLogadoObrigatorioPagamento();
      return;
    }

    setEstadoModalPixCarregando(periodoFinal);

    const resposta = await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/criar-pix-basico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        periodo: periodoFinal
      })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      console.error('Erro ao gerar Pix:', dados);
      setEstadoModalPixErro(
        dados?.erro ||
        dados?.message ||
        'Erro ao gerar Pix. Verifique a configuração da função no Supabase.'
      );
      return;
    }

    setEstadoModalPixConteudo(dados);

  } catch (error) {
    console.error('Erro inesperado ao gerar Pix:', error);
    setEstadoModalPixErro('Erro inesperado ao gerar Pix.');
  }
}

// ==================== COPIAR PIX ====================

async function copiarPixCopiaCola() {
  const campo = fsPagamentoEl('pix-copia-cola');

  if (!campo || !campo.value) {
    alert('Pix copia e cola não disponível.');
    return;
  }

  try {
    await navigator.clipboard.writeText(campo.value);
    alert('Pix copia e cola copiado!');
  } catch (error) {
    try {
      campo.focus();
      campo.select();
      document.execCommand('copy');
      alert('Pix copia e cola copiado!');
    } catch (fallbackError) {
      console.error('Erro ao copiar Pix:', fallbackError);
      alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
    }
  }
}

// ==================== VERIFICAR PAGAMENTO ====================

async function verificarPagamentoPixAtual() {
  try {
    const idPagamento =
      pagamentoPixAtualId ||
      window.pagamentoPixAtualId ||
      null;

    if (!idPagamento) {
      alert('Nenhum pagamento Pix foi gerado nesta tela.');
      return;
    }

    if (!window._supabase) {
      alert('Supabase não carregou. Atualize a página.');
      return;
    }

    const session = await fsObterSessaoPagamento();

    if (!session) {
      alert('Faça login novamente para verificar o pagamento.');
      return;
    }

    const { data, error } = await _supabase
      .from('pagamentos_pix')
      .select('status, pago_em, periodo, valor')
      .eq('id', idPagamento)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar pagamento:', error);
      alert('Não foi possível verificar o pagamento agora.');
      return;
    }

    if (!data) {
      alert('Pagamento não encontrado.');
      return;
    }

    const status = String(data.status || '').toLowerCase();

    if (status === 'pago' || status === 'confirmado' || status === 'paid') {
      alert('Pagamento confirmado! Seu Plano Básico já foi liberado.');

      fecharModalPixBasico();

      await fsAtualizarDadosAposPagamentoConfirmado();

      return;
    }

    if (status === 'cancelado' || status === 'expirado') {
      alert('Este Pix não está mais ativo. Gere um novo Pix para continuar.');
      return;
    }

    alert('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.');

  } catch (error) {
    console.error('Erro inesperado ao verificar pagamento:', error);
    alert('Erro inesperado ao verificar pagamento.');
  }
}

async function fsAtualizarDadosAposPagamentoConfirmado() {
  try {
    if (typeof carregarPerfil === 'function') {
      await carregarPerfil();
    }

    if (typeof atualizarPainelAssinaturaBasico === 'function') {
      atualizarPainelAssinaturaBasico(window.perfilAtual || null);
    }

    if (typeof atualizarBotaoPlanosHome === 'function') {
      await atualizarBotaoPlanosHome();
    }

    if (typeof atualizarPainelPlanoBasicoHome === 'function') {
      await atualizarPainelPlanoBasicoHome();
    }

    if (typeof atualizarAnunciosGratisHome === 'function') {
      await atualizarAnunciosGratisHome();
    }

    if (typeof fsAtualizarAnunciosGratisGerador === 'function') {
      await fsAtualizarAnunciosGratisGerador();
    }

    if (typeof carregarDashboardPainel === 'function') {
      await carregarDashboardPainel();
    }

    if (typeof carregarUltimosOrcamentosPainel === 'function') {
      await carregarUltimosOrcamentosPainel();
    }

    if (typeof carregarMenu === 'function') {
      const session = await fsObterSessaoPagamento();
      await carregarMenu(session);
    }

    setTimeout(() => {
      window.location.reload();
    }, 800);

  } catch (error) {
    console.warn('Pagamento confirmado, mas não foi possível atualizar toda a interface:', error);

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }
}

// ==================== FECHAR MODAL POR CLIQUE / ESC ====================

function configurarEventosModalPix() {
  if (window.fsEventosModalPixConfigurados === true) return;

  window.fsEventosModalPixConfigurados = true;

  document.addEventListener('click', function(event) {
    const modalPix = fsPagamentoEl('modal-pix-basico');

    if (event.target === modalPix) {
      fecharModalPixBasico();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      fecharModalPixBasico();
    }
  });
}

document.addEventListener('DOMContentLoaded', configurarEventosModalPix);

// ==================== EXPORTAÇÕES GLOBAIS ====================

window.gerarPixPlanoBasico = gerarPixPlanoBasico;

window.abrirModalPixBasico = abrirModalPixBasico;
window.fecharModalPixBasico = fecharModalPixBasico;

window.setEstadoModalPixCarregando = setEstadoModalPixCarregando;
window.setEstadoModalPixErro = setEstadoModalPixErro;
window.setEstadoModalPixConteudo = setEstadoModalPixConteudo;

window.copiarPixCopiaCola = copiarPixCopiaCola;
window.verificarPagamentoPixAtual = verificarPagamentoPixAtual;

window.formatarMoedaPix = fsFormatarMoedaPix;
window.fsFormatarMoedaPix = fsFormatarMoedaPix;
window.fsAtualizarDadosAposPagamentoConfirmado = fsAtualizarDadosAposPagamentoConfirmado;