/* FS ORÇAMENTOS — persistência polida do gerador */
(function () {
  const CHAVE_ID_NUVEM = 'fs_gerador_orcamento_nuvem_id_v1';
  const CHAVE_ESTADO = 'fs_gerador_estado_v2';

  function obterIdNuvem() {
    return window.orcamentoAtualSalvoId || window.orcamentoSalvoAtualId || localStorage.getItem(CHAVE_ID_NUVEM) || null;
  }

  function definirIdNuvem(id) {
    const valor = id || null;
    window.orcamentoAtualSalvoId = valor;
    window.orcamentoSalvoAtualId = valor;
    if (valor) localStorage.setItem(CHAVE_ID_NUVEM, valor);
    else localStorage.removeItem(CHAVE_ID_NUVEM);
    if (typeof definirOrcamentoAtualSalvo === 'function') definirOrcamentoAtualSalvo(valor);
  }

  function coletarDadosPolidos() {
    const base = typeof window.fsColetarDadosOrcamentoAtual === 'function'
      ? window.fsColetarDadosOrcamentoAtual()
      : {};

    return {
      ...base,
      titulo: document.getElementById('titulo')?.value?.trim() || base.titulo || 'Sem título',
      clienteNome: document.getElementById('cliente')?.value?.trim() || base.clienteNome || '',
      clienteWhatsapp: document.getElementById('tel-cliente')?.value?.trim() || base.clienteWhatsapp || '',
      observacoes: document.getElementById('observacoes')?.value?.trim() || base.observacoes || '',
      tema: document.getElementById('selected-theme')?.value || base.tema || 'original',
      validade: document.getElementById('validade-orcamento')?.value || '',
      formaPagamento: document.getElementById('forma-pagamento')?.value?.trim() || '',
      dataOrcamento: document.getElementById('data-orcamento')?.value || '',
      extrasCliente: typeof coletarExtrasCliente === 'function' ? coletarExtrasCliente() : []
    };
  }

  function salvarMetadadosNoRascunho() {
    try {
      const atual = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || '{}');
      const dados = coletarDadosPolidos();
      const idNuvem = obterIdNuvem();
      localStorage.setItem(CHAVE_ESTADO, JSON.stringify({
        ...atual,
        validade: dados.validade,
        pagamento: dados.formaPagamento,
        data: dados.dataOrcamento || atual.data || '',
        orcamento_nuvem_id: idNuvem || atual.orcamento_nuvem_id || null
      }));
    } catch (error) {
      console.warn('Não foi possível complementar o rascunho local:', error);
    }
  }

  const salvarEstadoOriginal = window.salvarEstadoCompleto;
  if (typeof salvarEstadoOriginal === 'function') {
    window.salvarEstadoCompleto = function salvarEstadoCompletoPolido() {
      const retorno = salvarEstadoOriginal.apply(this, arguments);
      salvarMetadadosNoRascunho();
      return retorno;
    };
  }

  const carregarEstadoOriginal = window.carregarEstadoSalvo;
  if (typeof carregarEstadoOriginal === 'function') {
    window.carregarEstadoSalvo = function carregarEstadoSalvoPersistente() {
      const retorno = carregarEstadoOriginal.apply(this, arguments);
      try {
        const estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || 'null');
        const id = estado?.orcamento_nuvem_id || localStorage.getItem(CHAVE_ID_NUVEM);
        if (id) definirIdNuvem(id);
      } catch (_) {}
      return retorno;
    };
  }

  const salvarNuvemOriginal = window.fsSalvarOrcamentoSePlanoPermitido;
  if (typeof salvarNuvemOriginal === 'function') {
    window.fsSalvarOrcamentoSePlanoPermitido = async function fsSalvarOrcamentoPersistente(origem = 'acao') {
      const idExistente = obterIdNuvem();
      const dados = coletarDadosPolidos();

      if (idExistente && window._supabase) {
        try {
          const { data: { session } } = await _supabase.auth.getSession();
          if (session?.user?.id) {
            const payloadCompleto = {
              assunto: dados.titulo,
              cliente_nome: dados.clienteNome,
              cliente_whatsapp: dados.clienteWhatsapp,
              observacoes: dados.observacoes,
              itens: dados.itens || [],
              total: Number(dados.total || 0),
              tema_pdf: dados.tema,
              origem_salvamento: origem,
              validade: dados.validade,
              forma_pagamento: dados.formaPagamento,
              data_orcamento: dados.dataOrcamento
            };

            let resposta = await _supabase
              .from('orcamentos')
              .update(payloadCompleto)
              .eq('id', idExistente)
              .eq('usuario_id', session.user.id)
              .select()
              .maybeSingle();

            if (resposta.error) {
              const payloadCompat = {
                assunto: dados.titulo,
                cliente_nome: dados.clienteNome,
                cliente_whatsapp: dados.clienteWhatsapp,
                observacoes: dados.observacoes,
                itens: dados.itens || [],
                total: Number(dados.total || 0),
                status: 'pendente'
              };
              resposta = await _supabase
                .from('orcamentos')
                .update(payloadCompat)
                .eq('id', idExistente)
                .eq('usuario_id', session.user.id)
                .select()
                .maybeSingle();
            }

            if (!resposta.error && resposta.data?.id) {
              definirIdNuvem(resposta.data.id);
              salvarMetadadosNoRascunho();
              return resposta.data;
            }
          }
        } catch (error) {
          console.warn('Falha ao atualizar orçamento existente; tentando fluxo padrão:', error);
        }
      }

      const salvo = await salvarNuvemOriginal(origem);
      if (salvo?.id) {
        definirIdNuvem(salvo.id);

        if (window._supabase) {
          try {
            const { data: { session } } = await _supabase.auth.getSession();
            if (session?.user?.id) {
              await _supabase
                .from('orcamentos')
                .update({
                  validade: dados.validade,
                  forma_pagamento: dados.formaPagamento,
                  data_orcamento: dados.dataOrcamento
                })
                .eq('id', salvo.id)
                .eq('usuario_id', session.user.id);
            }
          } catch (_) {
            // Banco antigo pode ainda não ter essas colunas; o orçamento principal já foi salvo.
          }
        }

        salvarMetadadosNoRascunho();
      }
      return salvo;
    };
  }

  const limparOriginal = window.limparFormulario;
  if (typeof limparOriginal === 'function') {
    window.limparFormulario = function limparFormularioPersistente() {
      const retorno = limparOriginal.apply(this, arguments);
      if (retorno === undefined) {
        const formulario = document.getElementById('formulario-orcamento');
        const semConteudo = !document.getElementById('titulo')?.value && !document.getElementById('cliente')?.value;
        if (formulario && semConteudo) definirIdNuvem(null);
      }
      return retorno;
    };
  }

  try {
    const estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || 'null');
    const idInicial = estado?.orcamento_nuvem_id || localStorage.getItem(CHAVE_ID_NUVEM);
    if (idInicial) definirIdNuvem(idInicial);
  } catch (_) {}

  document.addEventListener('input', salvarMetadadosNoRascunho, { passive: true });
  document.addEventListener('change', salvarMetadadosNoRascunho, { passive: true });
})();