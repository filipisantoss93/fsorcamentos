/* =========================================================
   FS ORÇAMENTOS — rascunhos do gerador no Supabase.

   Fluxo:
   - /gerador.html?orcamento_id=<uuid> carrega o registro da nuvem;
   - alterações são salvas no mesmo registro com debounce;
   - sem UUID, o comportamento local existente continua intacto.
   ========================================================= */

(function fsIntegracaoRascunhosSupabase() {
  'use strict';

  const CHAVE_ESTADO_LOCAL = 'fs_gerador_estado_v2';
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const TEMPO_AUTOSAVE_MS = 900;

  let rascunhoId = '';
  let usuarioId = '';
  let statusAtual = 'rascunho';
  let carregandoRascunho = false;
  let autosaveTimer = null;
  let salvarEstadoLocalOriginal = null;
  let limparFormularioOriginal = null;

  function obterIdDaUrl() {
    const params = new URLSearchParams(window.location.search || '');
    const valor = String(params.get('orcamento_id') || '').trim();
    return UUID_REGEX.test(valor) ? valor : '';
  }

  function definirValorCampo(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor ?? '';
  }

  function numeroSeguro(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    const texto = String(valor ?? '')
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function normalizarItens(itens) {
    if (!Array.isArray(itens)) return [];

    return itens
      .map(item => {
        const descricao = String(item?.descricao || '').trim().slice(0, 300);
        const qtd = Math.max(numeroSeguro(item?.qtd) || 1, 0.01);
        const valor = Math.max(numeroSeguro(item?.valor), 0);
        return {
          descricao,
          qtd,
          valor,
          subtotal: qtd * valor
        };
      })
      .filter(item => item.descricao);
  }

  function criarIndicadorNuvem() {
    let indicador = document.getElementById('fs-status-rascunho-nuvem');
    if (indicador) return indicador;

    indicador = document.createElement('div');
    indicador.id = 'fs-status-rascunho-nuvem';
    indicador.setAttribute('role', 'status');
    indicador.setAttribute('aria-live', 'polite');
    indicador.style.cssText = [
      'display:none',
      'margin:0 0 14px',
      'padding:10px 12px',
      'border:1px solid #d1d5db',
      'border-radius:10px',
      'background:#f8fafc',
      'color:#374151',
      'font-size:13px',
      'font-weight:600'
    ].join(';');

    const formulario = document.getElementById('formulario-orcamento');
    formulario?.parentNode?.insertBefore(indicador, formulario);
    return indicador;
  }

  function mostrarStatus(texto, tipo = 'normal', esconderDepois = false) {
    const indicador = criarIndicadorNuvem();
    if (!indicador) return;

    indicador.textContent = texto;
    indicador.style.display = 'block';
    indicador.style.borderColor = tipo === 'erro' ? '#fecaca' : '#d1d5db';
    indicador.style.background = tipo === 'erro' ? '#fef2f2' : '#f8fafc';
    indicador.style.color = tipo === 'erro' ? '#991b1b' : '#374151';

    if (esconderDepois) {
      window.setTimeout(() => {
        if (indicador.textContent === texto) indicador.style.display = 'none';
      }, 2200);
    }
  }

  function limparLinhasDoGerador() {
    document
      .querySelectorAll('#itens-lista .item-row:not(.header-labels)')
      .forEach(row => row.remove());
  }

  function preencherGerador(orcamento) {
    carregandoRascunho = true;

    try {
      definirValorCampo('titulo', orcamento.assunto || 'Orçamento automotivo');
      definirValorCampo('cliente', orcamento.cliente_nome || '');
      definirValorCampo('tel-cliente', orcamento.cliente_whatsapp || '');
      definirValorCampo('observacoes', orcamento.observacoes || '');
      definirValorCampo('forma-pagamento', orcamento.forma_pagamento || '');

      const dataBase = orcamento.criado_em ? new Date(orcamento.criado_em) : new Date();
      const dataValida = Number.isNaN(dataBase.getTime()) ? new Date() : dataBase;
      definirValorCampo('data-orcamento', dataValida.toISOString().slice(0, 10));

      if (typeof window.setTheme === 'function') {
        window.setTheme(orcamento.tema_pdf || 'original', false);
      }

      const extrasContainer = document.getElementById('extra-cliente-container');
      if (extrasContainer) extrasContainer.innerHTML = '';

      limparLinhasDoGerador();
      const itens = normalizarItens(orcamento.itens);

      if (typeof window.adicionarLinha === 'function') {
        if (itens.length) itens.forEach(item => window.adicionarLinha(item));
        else window.adicionarLinha();
      }

      if (typeof window.calcularTotal === 'function') window.calcularTotal();
      if (typeof window.gerarPrevia === 'function' && itens.length) window.gerarPrevia(false);

      statusAtual = String(orcamento.status || 'rascunho');
      window.orcamentoAtualSalvoId = orcamento.id;
      window.orcamentoSalvoAtualId = orcamento.id;

      try {
        if (typeof orcamentoSalvoAtualId !== 'undefined') orcamentoSalvoAtualId = orcamento.id;
      } catch (_) {}

      if (typeof window.definirOrcamentoAtualSalvo === 'function') {
        window.definirOrcamentoAtualSalvo(orcamento.id);
      }

      try { localStorage.removeItem(CHAVE_ESTADO_LOCAL); } catch (_) {}
    } finally {
      carregandoRascunho = false;
    }
  }

  function coletarItensAtuais() {
    if (typeof window.coletarItensTela === 'function') {
      return normalizarItens(window.coletarItensTela());
    }

    const itens = [];
    document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(row => {
      const descricao = row.querySelector('.desc-cell')?.value?.trim() || '';
      const qtd = Math.max(numeroSeguro(row.querySelector('.qtd')?.value) || 1, 0.01);
      const valor = Math.max(numeroSeguro(row.querySelector('.valor')?.value), 0);
      if (descricao) itens.push({ descricao, qtd, valor, subtotal: qtd * valor });
    });
    return itens;
  }

  function coletarPayloadAtual() {
    const itens = coletarItensAtuais();
    const total = itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0);

    return {
      assunto: document.getElementById('titulo')?.value?.trim() || 'Orçamento automotivo',
      cliente_nome: document.getElementById('cliente')?.value?.trim() || '',
      cliente_whatsapp: document.getElementById('tel-cliente')?.value?.trim() || '',
      observacoes: document.getElementById('observacoes')?.value?.trim() || '',
      forma_pagamento: document.getElementById('forma-pagamento')?.value?.trim() || null,
      tema_pdf: document.getElementById('selected-theme')?.value || 'original',
      itens,
      total,
      origem_salvamento: statusAtual === 'rascunho' ? 'edicao_rascunho' : 'edicao_gerador'
    };
  }

  async function salvarRascunhoNaNuvem() {
    if (!rascunhoId || !usuarioId || carregandoRascunho || !window._supabase) return;

    const payload = coletarPayloadAtual();
    mostrarStatus('☁️ Salvando rascunho na nuvem...');

    const { error } = await window._supabase
      .from('orcamentos')
      .update(payload)
      .eq('id', rascunhoId)
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('Erro ao salvar rascunho na nuvem:', error);
      mostrarStatus('Não foi possível salvar o rascunho na nuvem.', 'erro');
      return;
    }

    mostrarStatus('✓ Rascunho salvo na nuvem', 'normal', true);
  }

  function agendarAutosave() {
    if (!rascunhoId || carregandoRascunho) return;
    window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(salvarRascunhoNaNuvem, TEMPO_AUTOSAVE_MS);
  }

  function instalarInterceptadores() {
    if (!salvarEstadoLocalOriginal && typeof window.salvarEstadoCompleto === 'function') {
      salvarEstadoLocalOriginal = window.salvarEstadoCompleto;
    }

    window.salvarEstadoCompleto = function fsSalvarEstadoGerador() {
      if (!rascunhoId) {
        if (typeof salvarEstadoLocalOriginal === 'function') return salvarEstadoLocalOriginal();
        return;
      }
      agendarAutosave();
    };

    if (!limparFormularioOriginal && typeof window.limparFormulario === 'function') {
      limparFormularioOriginal = window.limparFormulario;
    }

    if (typeof limparFormularioOriginal === 'function') {
      window.limparFormulario = function fsNovoOrcamentoSemVinculo() {
        window.clearTimeout(autosaveTimer);
        const resultado = limparFormularioOriginal();

        if (rascunhoId) {
          rascunhoId = '';
          usuarioId = '';
          statusAtual = 'rascunho';

          const url = new URL(window.location.href);
          url.searchParams.delete('orcamento_id');
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

          const indicador = document.getElementById('fs-status-rascunho-nuvem');
          if (indicador) indicador.style.display = 'none';
        }

        return resultado;
      };
    }
  }

  async function aguardarGeradorPronto() {
    for (let tentativa = 0; tentativa < 80; tentativa += 1) {
      const pronto = window._supabase
        && document.getElementById('formulario-orcamento')
        && typeof window.adicionarLinha === 'function'
        && typeof window.calcularTotal === 'function';

      if (pronto) return true;
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
    return false;
  }

  async function aguardarPerfilGerador() {
    for (let tentativa = 0; tentativa < 60; tentativa += 1) {
      try {
        if (typeof perfilGeradorAtual !== 'undefined' && perfilGeradorAtual !== null) return;
      } catch (_) {}
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
  }

  async function carregarRascunho() {
    const pronto = await aguardarGeradorPronto();
    if (!pronto) return;

    rascunhoId = obterIdDaUrl();
    if (!rascunhoId) return;

    instalarInterceptadores();
    mostrarStatus('☁️ Carregando rascunho da nuvem...');

    const { data: { session }, error: sessionError } = await window._supabase.auth.getSession();
    if (sessionError || !session?.user?.id) {
      mostrarStatus('Entre na sua conta para abrir este rascunho.', 'erro');
      return;
    }

    usuarioId = session.user.id;
    await aguardarPerfilGerador();
    await new Promise(resolve => window.setTimeout(resolve, 120));

    const { data: orcamento, error } = await window._supabase
      .from('orcamentos')
      .select('id,usuario_id,assunto,cliente_nome,cliente_whatsapp,itens,total,status,observacoes,tema_pdf,forma_pagamento,origem,origem_salvamento,criado_em,atualizado_em')
      .eq('id', rascunhoId)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error || !orcamento) {
      console.error('Erro ao carregar rascunho:', error);
      rascunhoId = '';
      mostrarStatus('Rascunho não encontrado ou sem permissão de acesso.', 'erro');
      return;
    }

    preencherGerador(orcamento);
    mostrarStatus('✓ Rascunho carregado da nuvem', 'normal', true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarRascunho, { once: true });
  } else {
    carregarRascunho();
  }
})();
