/* =========================================================
   FS Orçamentos - ver-cliente-fix.js
   Mantido apenas para compatibilidade de links antigos.
   Não injeta CSS e não altera tema visual.
   ========================================================= */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search || '');
  const linkToken = (params.get('token') || params.get('public_token') || '').trim();

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function normalizarForma(forma) {
    const f = normalizar(forma);
    if (f === 'cartao_credito' || f === 'cartao credito' || f === 'credito') return 'credito';
    if (f === 'cartao_debito' || f === 'cartao debito' || f === 'debito') return 'debito';
    if (f === 'pix') return 'pix';
    if (f === 'dinheiro') return 'dinheiro';
    return '';
  }

  const FORMAS_VALIDAS = {
    credito: 'Crédito',
    debito: 'Débito',
    pix: 'Pix',
    dinheiro: 'Dinheiro'
  };

  function corrigirBotoesPagamento() {
    document.querySelectorAll('.formas-pagamento-grid button').forEach((botao) => {
      const match = (botao.getAttribute('onclick') || '').match(/selecionarFormaPagamento\(['"]([^'"]+)['"]\)/);
      const forma = normalizarForma(match?.[1] || botao.dataset.forma || botao.textContent);
      if (!forma || !FORMAS_VALIDAS[forma]) {
        botao.style.display = 'none';
        return;
      }
      botao.textContent = FORMAS_VALIDAS[forma];
      botao.onclick = () => window.selecionarFormaPagamento(forma);
    });
  }

  async function responderToken(status, forma) {
    if (!linkToken || !window._supabase) return false;

    if (typeof window.setBotoesRespostaDesabilitados === 'function') {
      window.setBotoesRespostaDesabilitados(true);
    }

    const resposta = await window._supabase.rpc('responder_orcamento_publico_v2', {
      p_token: linkToken,
      p_resposta: status,
      p_forma_pagamento: forma || null
    });

    if (resposta.error) {
      console.error(resposta.error);
      alert('Não foi possível registrar a resposta.');
      if (typeof window.setBotoesRespostaDesabilitados === 'function') {
        window.setBotoesRespostaDesabilitados(false);
      }
      return false;
    }

    const retorno = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data;
    if (retorno && retorno.sucesso === false) {
      alert(retorno.mensagem || 'Resposta não registrada.');
      return false;
    }

    if (typeof window.fecharModalFormaPagamento === 'function') window.fecharModalFormaPagamento();
    if (typeof window.carregarOrcamento === 'function') await window.carregarOrcamento();
    return true;
  }

  function instalarCompatibilidadeToken() {
    if (!linkToken) return;

    window.aprovarOrcamento = function () {
      if (!window.orcamentoAtual) return alert('Orçamento não carregado.');
      if (window.orcamentoAtual.status !== 'pendente') return alert('Este orçamento já foi respondido.');
      if (typeof window.abrirModalFormaPagamento === 'function') window.abrirModalFormaPagamento();
    };

    window.selecionarFormaPagamento = async function (forma) {
      if (!confirm('Confirmar aprovação do orçamento?')) return;
      await responderToken('aprovado', forma);
    };

    window.recusarOrcamento = async function () {
      if (!confirm('Deseja realmente recusar este orçamento?')) return;
      await responderToken('recusado', null);
    };
  }

  function iniciar() {
    corrigirBotoesPagamento();
    instalarCompatibilidadeToken();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
