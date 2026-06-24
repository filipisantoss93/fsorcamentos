// ==================== PAGAMENTOS.JS ====================
// FS Orçamentos - Pagamento Pix dos planos Básico e Premium
// Arquivo central do pagamento via Pix.

(function () {
  'use strict';

  const FS_SUPABASE_FUNCTIONS_URL =
    window.FS_SUPABASE_FUNCTIONS_URL ||
    'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';

  const FS_PLANOS_PIX = {
    basico: {
      mensal: { label: 'Plano Básico - 1 mês', valor: 29.90, dias: 30 },
      semestral: { label: 'Plano Básico - 6 meses', valor: 159.90, dias: 180 },
      anual: { label: 'Plano Básico - 12 meses', valor: 299.90, dias: 365 }
    },
    premium: {
      mensal: { label: 'Plano Premium - 1 mês', valor: 89.90, dias: 30 },
      semestral: { label: 'Plano Premium - 6 meses', valor: 499.90, dias: 180 },
      anual: { label: 'Plano Premium - 12 meses', valor: 999.90, dias: 365 }
    }
  };

  const FS_MAPA_VALORES_ANTIGOS = {
    'R$ 19,90': 'R$ 29,90',
    'R$ 109,90': 'R$ 159,90',
    'R$ 209,90': 'R$ 299,90',
    'R$ 69,90': 'R$ 89,90',
    'R$ 399,90': 'R$ 499,90',
    'R$ 599,90': 'R$ 999,90'
  };

  let pagamentoPixAtualIdInterno = null;

  function fsPagamentoEl(id) {
    return document.getElementById(id);
  }

  function fsFormatarMoedaPix(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function fsAtualizarTextosValoresPlanos(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textos = [];
    while (walker.nextNode()) textos.push(walker.currentNode);

    textos.forEach((node) => {
      let valor = node.nodeValue || '';
      let alterou = false;

      Object.entries(FS_MAPA_VALORES_ANTIGOS).forEach(([antigo, novo]) => {
        if (valor.includes(antigo)) {
          valor = valor.split(antigo).join(novo);
          alterou = true;
        }
      });

      if (alterou) node.nodeValue = valor;
    });
  }

  function fsNormalizarTextoPagamento(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function fsNormalizarPlanoPix(plano) {
    const normalizado = fsNormalizarTextoPagamento(plano || 'basico');
    return normalizado === 'premium' ? 'premium' : 'basico';
  }

  function fsPeriodoPixValido(periodo) {
    return Object.prototype.hasOwnProperty.call(FS_PLANOS_PIX.basico, periodo);
  }

  function fsObterPlanoPix(periodo, plano = 'basico') {
    const planoFinal = fsNormalizarPlanoPix(plano);
    const periodoFinal = fsPeriodoPixValido(periodo) ? periodo : 'mensal';
    return FS_PLANOS_PIX[planoFinal][periodoFinal] || FS_PLANOS_PIX[planoFinal].mensal;
  }

  function fsPlanoLabelPix(plano) {
    return fsNormalizarPlanoPix(plano) === 'premium' ? 'Plano Premium' : 'Plano Básico';
  }

  function fsExisteModalPixNaPagina() {
    return !!fsPagamentoEl('modal-pix-basico');
  }

  function fsSalvarDestinoAposLogin() {
    try {
      const destino = `${window.location.pathname || '/planos.html'}${window.location.search || ''}${window.location.hash || ''}`;
      localStorage.setItem('fs_destino_apos_login', destino || '/planos.html');
    } catch (error) {
      console.warn('Não foi possível salvar destino após login:', error);
    }
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
    fsSalvarDestinoAposLogin();

    if (typeof window.abrirModalLogin === 'function') {
      window.abrirModalLogin();
      return;
    }

    window.location.href = '/index.html?login=1';
  }

  function fsMontarQrCodeSrc(valor) {
    const qr = String(valor || '').trim();
    if (!qr) return '';
    if (qr.startsWith('data:image') || qr.startsWith('http://') || qr.startsWith('https://')) return qr;
    return `data:image/png;base64,${qr}`;
  }

  function fsExtrairQrCode(dados) {
    return dados?.qr_code || dados?.qrcode || dados?.qrCode || dados?.imagem_qrcode || dados?.imagemQrcode || dados?.base64 || dados?.qrcode_base64 || '';
  }

  function fsExtrairPixCopiaCola(dados) {
    return dados?.pix_copia_cola || dados?.copia_cola || dados?.pixCopiaCola || dados?.brcode || dados?.copiaECola || dados?.pix || '';
  }

  function fsExtrairPagamentoId(dados) {
    return dados?.pagamento_id || dados?.pagamentoId || dados?.id_pagamento || dados?.id || null;
  }

  function fsSetPagamentoAtual(id) {
    pagamentoPixAtualIdInterno = id || null;
    window.pagamentoPixAtualId = pagamentoPixAtualIdInterno;
  }

  function fsGetPagamentoAtual() {
    return pagamentoPixAtualIdInterno || window.pagamentoPixAtualId || null;
  }

  function abrirModalPixBasico() {
    const modal = fsPagamentoEl('modal-pix-basico');
    if (!modal) {
      console.warn('Modal Pix não encontrado nesta página.');
      return false;
    }

    modal.style.setProperty('display', 'flex', 'important');
    document.body.style.overflow = 'hidden';
    return true;
  }

  function fecharModalPixBasico() {
    const modal = fsPagamentoEl('modal-pix-basico');
    if (!modal) return;
    modal.style.setProperty('display', 'none', 'important');
    document.body.style.overflow = '';
  }

  function setEstadoModalPixCarregando(periodo = 'mensal', planoSelecionado = 'basico') {
    if (!abrirModalPixBasico()) return;

    const plano = fsObterPlanoPix(periodo, planoSelecionado);
    const loading = fsPagamentoEl('pix-loading');
    const conteudo = fsPagamentoEl('pix-conteudo');
    const erro = fsPagamentoEl('pix-erro');
    const subtitulo = fsPagamentoEl('pix-modal-subtitulo');
    const planoLabel = fsPagamentoEl('pix-plano-label');
    const pixValor = fsPagamentoEl('pix-valor');
    const qrImg = fsPagamentoEl('pix-qrcode-img');
    const copiaCola = fsPagamentoEl('pix-copia-cola');

    fsSetPagamentoAtual(null);

    if (loading) {
      loading.style.display = 'block';
      loading.innerText = 'Gerando Pix, aguarde...';
    }
    if (conteudo) conteudo.style.display = 'none';
    if (erro) {
      erro.style.display = 'none';
      erro.innerText = '';
    }
    if (subtitulo) subtitulo.innerText = `${plano.label} - ${fsFormatarMoedaPix(plano.valor)}`;
    if (planoLabel) planoLabel.innerText = plano.label;
    if (pixValor) pixValor.innerText = fsFormatarMoedaPix(plano.valor);
    if (qrImg) {
      qrImg.removeAttribute('src');
      qrImg.style.display = 'none';
    }
    if (copiaCola) copiaCola.value = '';
  }

  function setEstadoModalPixErro(mensagem) {
    if (!abrirModalPixBasico()) {
      alert(mensagem || 'Não foi possível gerar o Pix.');
      return;
    }

    const loading = fsPagamentoEl('pix-loading');
    const conteudo = fsPagamentoEl('pix-conteudo');
    const erro = fsPagamentoEl('pix-erro');

    if (loading) loading.style.display = 'none';
    if (conteudo) conteudo.style.display = 'none';
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

    const pagamentoId = fsExtrairPagamentoId(dados);
    const qrCode = fsExtrairQrCode(dados);
    const pixCopiaCola = fsExtrairPixCopiaCola(dados);

    fsSetPagamentoAtual(pagamentoId);

    if (loading) loading.style.display = 'none';
    if (conteudo) conteudo.style.display = 'block';
    if (erro) {
      erro.style.display = 'none';
      erro.innerText = '';
    }
    if (subtitulo) subtitulo.innerText = `${dados?.label || 'Plano'} - ${fsFormatarMoedaPix(dados?.valor)}`;
    if (planoLabel) planoLabel.innerText = dados?.label || 'Plano';
    if (pixValor) pixValor.innerText = fsFormatarMoedaPix(dados?.valor);
    if (qrImg) {
      const src = fsMontarQrCodeSrc(qrCode);
      if (src) {
        qrImg.src = src;
        qrImg.style.display = 'inline-block';
      } else {
        qrImg.removeAttribute('src');
        qrImg.style.display = 'none';
      }
    }
    if (copiaCola) copiaCola.value = pixCopiaCola || '';
  }

  async function gerarPixPlano(planoSelecionado = 'basico', periodo = 'mensal') {
    try {
      const planoFinal = fsNormalizarPlanoPix(planoSelecionado);
      const periodoFinal = fsPeriodoPixValido(periodo) ? periodo : 'mensal';
      const plano = fsObterPlanoPix(periodoFinal, planoFinal);

      if (!window._supabase) {
        alert('Supabase não carregou. Atualize a página e tente novamente.');
        return;
      }

      if (!fsExisteModalPixNaPagina()) {
        window.location.href = `/planos.html?plano=${encodeURIComponent(planoFinal)}&periodo=${encodeURIComponent(periodoFinal)}#assinar-plano-${planoFinal}`;
        return;
      }

      const session = await fsObterSessaoPagamento();
      if (!session) {
        fsUsuarioLogadoObrigatorioPagamento();
        return;
      }

      setEstadoModalPixCarregando(periodoFinal, planoFinal);

      const resposta = await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/criar-pix-basico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plano: planoFinal,
          periodo: periodoFinal,
          valor: plano.valor,
          dias: plano.dias,
          label: plano.label
        })
      });

      const dadosResposta = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        console.error('Erro ao gerar Pix:', dadosResposta);
        setEstadoModalPixErro(dadosResposta?.erro || dadosResposta?.message || 'Erro ao gerar Pix. Verifique a configuração da função no Supabase.');
        return;
      }

      setEstadoModalPixConteudo({
        ...dadosResposta,
        plano: dadosResposta?.plano || planoFinal,
        periodo: dadosResposta?.periodo || periodoFinal,
        label: dadosResposta?.label || plano.label,
        valor: dadosResposta?.valor ?? plano.valor,
        dias: dadosResposta?.dias ?? plano.dias
      });
    } catch (error) {
      console.error('Erro inesperado ao gerar Pix:', error);
      setEstadoModalPixErro('Erro inesperado ao gerar Pix.');
    }
  }

  async function gerarPixPlanoBasico(periodo) {
    return gerarPixPlano('basico', periodo);
  }

  async function gerarPixPlanoPremium(periodo) {
    return gerarPixPlano('premium', periodo);
  }

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

  async function verificarPagamentoPixAtual() {
    try {
      const idPagamento = fsGetPagamentoAtual();
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
        .select('id, plano, status, pago_em, periodo, valor')
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

      const status = fsNormalizarTextoPagamento(data.status);

      if (['pago', 'confirmado', 'paid'].includes(status)) {
        alert(`Pagamento confirmado! Seu ${fsPlanoLabelPix(data.plano)} já foi liberado ou renovado.`);
        fecharModalPixBasico();
        await fsAtualizarDadosAposPagamentoConfirmado();
        return;
      }

      if (['cancelado', 'expirado', 'expired', 'canceled'].includes(status)) {
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
      if (typeof window.atualizarStatusPlanoPlanos === 'function') await window.atualizarStatusPlanoPlanos();
      if (typeof window.carregarPerfil === 'function') await window.carregarPerfil();
      if (typeof window.atualizarPainelAssinaturaBasico === 'function') window.atualizarPainelAssinaturaBasico(window.perfilAtual || null);
      if (typeof window.atualizarBotaoPlanosHome === 'function') await window.atualizarBotaoPlanosHome();
      if (typeof window.atualizarPainelPlanoBasicoHome === 'function') await window.atualizarPainelPlanoBasicoHome();
      if (typeof window.atualizarAnunciosGratisHome === 'function') await window.atualizarAnunciosGratisHome();
      if (typeof window.fsAtualizarAnunciosGratisGerador === 'function') await window.fsAtualizarAnunciosGratisGerador();
      if (typeof window.carregarMenu === 'function') {
        const session = await fsObterSessaoPagamento();
        if (session) await window.carregarMenu(session);
      }

      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      console.warn('Pagamento confirmado, mas não foi possível atualizar toda a interface:', error);
      setTimeout(() => window.location.reload(), 800);
    }
  }

  async function fsAbrirPixPorParametroUrl() {
    const params = new URLSearchParams(window.location.search);
    const periodo = params.get('periodo');
    const plano = fsNormalizarPlanoPix(params.get('plano') || 'basico');
    if (!periodo || !fsPeriodoPixValido(periodo)) return;
    if (!fsExisteModalPixNaPagina()) return;
    setTimeout(() => gerarPixPlano(plano, periodo), 700);
  }

  function configurarEventosModalPix() {
    if (window.fsEventosModalPixConfigurados === true) return;
    window.fsEventosModalPixConfigurados = true;

    document.addEventListener('click', function (event) {
      const modalPix = fsPagamentoEl('modal-pix-basico');
      if (event.target === modalPix) fecharModalPixBasico();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') fecharModalPixBasico();
    });
  }

  function configurarCliqueDiretoBotoesPix() {
    if (window.fsCliqueDiretoBotoesPixConfigurado === true) return;
    window.fsCliqueDiretoBotoesPixConfigurado = true;

    document.addEventListener('click', function (event) {
      const botao = event.target?.closest?.('[data-botao-pix]');
      if (!botao) return;
      if (botao.disabled) return;

      event.preventDefault();
      event.stopPropagation();

      const plano = fsNormalizarPlanoPix(botao.dataset.plano || 'basico');
      const periodo = fsPeriodoPixValido(botao.dataset.periodo) ? botao.dataset.periodo : 'mensal';
      gerarPixPlano(plano, periodo);
    }, true);
  }

  function exporFuncoesPagamento() {
    window.FS_PLANOS_PIX = FS_PLANOS_PIX;
    window.gerarPixPlano = gerarPixPlano;
    window.gerarPixPlanoBasico = gerarPixPlanoBasico;
    window.gerarPixPlanoPremium = gerarPixPlanoPremium;
    window.gerarPixPremium = gerarPixPlanoPremium;
    window.abrirModalPixBasico = abrirModalPixBasico;
    window.fecharModalPixBasico = fecharModalPixBasico;
    window.setEstadoModalPixCarregando = setEstadoModalPixCarregando;
    window.setEstadoModalPixErro = setEstadoModalPixErro;
    window.setEstadoModalPixConteudo = setEstadoModalPixConteudo;
    window.copiarPixCopiaCola = copiarPixCopiaCola;
    window.copiarPixCopiaColaOriginal = copiarPixCopiaCola;
    window.verificarPagamentoPixAtual = verificarPagamentoPixAtual;
    window.verificarPagamentoPixAtualOriginal = verificarPagamentoPixAtual;
    window.formatarMoedaPix = fsFormatarMoedaPix;
    window.fsFormatarMoedaPix = fsFormatarMoedaPix;
    window.fsAtualizarTextosValoresPlanos = fsAtualizarTextosValoresPlanos;
    window.fsAtualizarDadosAposPagamentoConfirmado = fsAtualizarDadosAposPagamentoConfirmado;
  }

  document.addEventListener('DOMContentLoaded', function () {
    configurarEventosModalPix();
    configurarCliqueDiretoBotoesPix();
    exporFuncoesPagamento();
    fsAtualizarTextosValoresPlanos();
    setTimeout(exporFuncoesPagamento, 300);
    setTimeout(exporFuncoesPagamento, 1200);
    setTimeout(fsAtualizarTextosValoresPlanos, 300);
    setTimeout(fsAtualizarTextosValoresPlanos, 1200);
    fsAbrirPixPorParametroUrl();
  });

  configurarCliqueDiretoBotoesPix();
  exporFuncoesPagamento();
})();