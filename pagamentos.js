// FS Orçamentos — pagamento do Plano Premium via Pix
(function () {
  'use strict';

  const FS_SUPABASE_FUNCTIONS_URL = window.FS_SUPABASE_FUNCTIONS_URL || 'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';

  const FS_PLANOS_PIX = {
    premium: {
      mensal: { label: 'Plano Premium - 1 mês', valor: 29.90, dias: 30 },
      semestral: { label: 'Plano Premium - 6 meses', valor: 149.90, dias: 180 },
      anual: { label: 'Plano Premium - 12 meses', valor: 299.90, dias: 365 }
    }
  };

  let pagamentoPixAtualIdInterno = null;

  const el = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const periodoValido = periodo => Object.prototype.hasOwnProperty.call(FS_PLANOS_PIX.premium, periodo);
  const planoPix = periodo => FS_PLANOS_PIX.premium[periodoValido(periodo) ? periodo : 'mensal'];

  function abrirModalPixBasico() {
    const modal = el('modal-pix-basico');
    if (!modal) return false;
    modal.style.setProperty('display', 'flex', 'important');
    document.body.style.overflow = 'hidden';
    return true;
  }

  function fecharModalPixBasico() {
    const modal = el('modal-pix-basico');
    if (!modal) return;
    modal.style.setProperty('display', 'none', 'important');
    document.body.style.overflow = '';
  }

  function salvarDestinoPlanos() {
    try {
      localStorage.setItem('fs_destino_apos_login', `${location.pathname || '/planos.html'}${location.search || ''}${location.hash || ''}`);
    } catch (_) {}
  }

  async function obterSessaoPix() {
    try {
      if (!window._supabase) return null;
      const { data, error } = await _supabase.auth.getSession();
      return error ? null : data?.session || null;
    } catch (_) {
      return null;
    }
  }

  function obrigarLoginPix() {
    salvarDestinoPlanos();
    if (typeof window.abrirModalLogin === 'function') window.abrirModalLogin();
    else location.href = '/index.html?login=1&dest=' + encodeURIComponent('/planos.html#assinar-plano-premium');
  }

  function definirPagamentoAtual(id) {
    pagamentoPixAtualIdInterno = id || null;
    window.pagamentoPixAtualId = pagamentoPixAtualIdInterno;
  }

  function obterPagamentoAtual() {
    return pagamentoPixAtualIdInterno || window.pagamentoPixAtualId || null;
  }

  function qrCodeSrc(valor) {
    const codigo = String(valor || '').trim();
    if (!codigo) return '';
    if (codigo.startsWith('data:image') || codigo.startsWith('http://') || codigo.startsWith('https://')) return codigo;
    return `data:image/png;base64,${codigo}`;
  }

  function extrairQrCode(dados) {
    return dados?.qr_code || dados?.qrcode || dados?.qrCode || dados?.imagem_qrcode || dados?.base64 || dados?.qrcode_base64 || '';
  }

  function extrairPixCopiaCola(dados) {
    return dados?.pix_copia_cola || dados?.copia_cola || dados?.pixCopiaCola || dados?.brcode || dados?.copiaECola || dados?.pix || '';
  }

  function extrairPagamentoId(dados) {
    return dados?.pagamento_id || dados?.pagamentoId || dados?.id_pagamento || dados?.id || null;
  }

  function estadoCarregando(periodo) {
    if (!abrirModalPixBasico()) return;

    const plano = planoPix(periodo);
    definirPagamentoAtual(null);

    if (el('pix-loading')) {
      el('pix-loading').style.display = 'block';
      el('pix-loading').innerText = 'Gerando Pix, aguarde...';
    }
    if (el('pix-conteudo')) el('pix-conteudo').style.display = 'none';
    if (el('pix-erro')) {
      el('pix-erro').style.display = 'none';
      el('pix-erro').innerText = '';
    }
    if (el('pix-modal-subtitulo')) el('pix-modal-subtitulo').innerText = `${plano.label} - ${moeda(plano.valor)}`;
    if (el('pix-plano-label')) el('pix-plano-label').innerText = plano.label;
    if (el('pix-valor')) el('pix-valor').innerText = moeda(plano.valor);
    if (el('pix-qrcode-img')) {
      el('pix-qrcode-img').removeAttribute('src');
      el('pix-qrcode-img').style.display = 'none';
    }
    if (el('pix-copia-cola')) el('pix-copia-cola').value = '';
  }

  function estadoErroPix(mensagem) {
    if (!abrirModalPixBasico()) {
      alert(mensagem || 'Não foi possível gerar o Pix.');
      return;
    }
    if (el('pix-loading')) el('pix-loading').style.display = 'none';
    if (el('pix-conteudo')) el('pix-conteudo').style.display = 'none';
    if (el('pix-erro')) {
      el('pix-erro').style.display = 'block';
      el('pix-erro').innerText = mensagem || 'Não foi possível gerar o Pix.';
    }
  }

  function estadoConteudoPix(dados) {
    const loading = el('pix-loading');
    const conteudo = el('pix-conteudo');
    const erro = el('pix-erro');
    const qr = el('pix-qrcode-img');

    definirPagamentoAtual(extrairPagamentoId(dados));

    if (loading) loading.style.display = 'none';
    if (conteudo) conteudo.style.display = 'block';
    if (erro) {
      erro.style.display = 'none';
      erro.innerText = '';
    }
    if (el('pix-modal-subtitulo')) el('pix-modal-subtitulo').innerText = `${dados?.label || 'Plano Premium'} - ${moeda(dados?.valor)}`;
    if (el('pix-plano-label')) el('pix-plano-label').innerText = dados?.label || 'Plano Premium';
    if (el('pix-valor')) el('pix-valor').innerText = moeda(dados?.valor);

    if (qr) {
      const src = qrCodeSrc(extrairQrCode(dados));
      if (src) {
        qr.src = src;
        qr.style.display = 'inline-block';
      } else {
        qr.removeAttribute('src');
        qr.style.display = 'none';
      }
    }

    if (el('pix-copia-cola')) el('pix-copia-cola').value = extrairPixCopiaCola(dados) || '';
  }

  async function gerarPixPlano(planoSelecionado = 'premium', periodo = 'mensal') {
    try {
      const periodoFinal = periodoValido(periodo) ? periodo : 'mensal';
      const plano = planoPix(periodoFinal);

      if (!window._supabase) {
        alert('Atualize a página e tente novamente.');
        return;
      }

      if (!el('modal-pix-basico')) {
        location.href = `/planos.html?plano=premium&periodo=${encodeURIComponent(periodoFinal)}#assinar-plano-premium`;
        return;
      }

      const sessao = await obterSessaoPix();
      if (!sessao) {
        obrigarLoginPix();
        return;
      }

      estadoCarregando(periodoFinal);

      const resposta = await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/criar-pix-basico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessao.access_token}`
        },
        body: JSON.stringify({
          plano: 'premium',
          periodo: periodoFinal,
          valor: plano.valor,
          dias: plano.dias,
          label: plano.label
        })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        estadoErroPix(dados?.erro || dados?.message || 'Erro ao gerar Pix.');
        return;
      }

      estadoConteudoPix({
        ...dados,
        plano: 'premium',
        periodo: periodoFinal,
        label: dados?.label || plano.label,
        valor: dados?.valor ?? plano.valor,
        dias: dados?.dias ?? plano.dias
      });
    } catch (error) {
      console.error(error);
      estadoErroPix('Erro inesperado ao gerar Pix.');
    }
  }

  async function verificarPagamentoPixAtual() {
    try {
      const pagamentoId = obterPagamentoAtual();
      if (!pagamentoId) return alert('Gere um Pix primeiro.');

      const sessao = await obterSessaoPix();
      if (!sessao) return obrigarLoginPix();

      const resposta = await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/verificar-pix-basico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessao.access_token}`
        },
        body: JSON.stringify({ pagamento_id: pagamentoId })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        alert(dados?.erro || dados?.message || 'Pagamento ainda não confirmado.');
        return;
      }

      if (dados?.status === 'approved' || dados?.status === 'pago' || dados?.plano_liberado) {
        localStorage.setItem('usuario_plano', 'premium');
        if (dados?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', dados.plano_expira_em);
        alert('Premium liberado.');
        location.reload();
        return;
      }

      alert(dados?.mensagem || 'Pagamento ainda não confirmado.');
    } catch (error) {
      console.error(error);
      alert('Não foi possível verificar o pagamento agora.');
    }
  }

  async function copiarPixCopiaCola() {
    const textarea = el('pix-copia-cola');
    if (!textarea?.value) return;
    await navigator.clipboard.writeText(textarea.value);
    alert('Pix copiado.');
  }

  function iniciarPixPorUrl() {
    const params = new URLSearchParams(location.search || '');
    if ((params.get('plano') || '') === 'premium' && params.get('periodo')) {
      setTimeout(() => gerarPixPlano('premium', params.get('periodo')), 600);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarPixPorUrl);
  else iniciarPixPorUrl();

  window.gerarPixPlano = gerarPixPlano;
  window.gerarPixPlanoPremium = periodo => gerarPixPlano('premium', periodo);
  window.gerarPixPlanoBasico = periodo => gerarPixPlano('premium', periodo);
  window.fecharModalPixBasico = fecharModalPixBasico;
  window.verificarPagamentoPixAtual = verificarPagamentoPixAtual;
  window.copiarPixCopiaCola = copiarPixCopiaCola;
})();
