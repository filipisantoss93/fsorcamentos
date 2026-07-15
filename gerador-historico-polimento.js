/* FS ORÇAMENTOS — integração histórico -> gerador */
(function () {
  const CHAVE_ID_NUVEM = 'fs_gerador_orcamento_nuvem_id_v1';
  const CHAVE_ESTADO = 'fs_gerador_estado_v2';

  function obterModoDaUrl() {
    const params = new URLSearchParams(window.location.search);
    const editarId = params.get('orcamento_id');
    const duplicarId = params.get('duplicar_orcamento_id');

    if (editarId) return { modo: 'editar', id: editarId };
    if (duplicarId) return { modo: 'duplicar', id: duplicarId };
    return null;
  }

  function definirIdAtual(id) {
    const valor = id || null;
    window.orcamentoAtualSalvoId = valor;
    window.orcamentoSalvoAtualId = valor;

    if (valor) localStorage.setItem(CHAVE_ID_NUVEM, valor);
    else localStorage.removeItem(CHAVE_ID_NUVEM);

    if (typeof definirOrcamentoAtualSalvo === 'function') {
      definirOrcamentoAtualSalvo(valor);
    }
  }

  function valorCampo(id, valor) {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.value = valor == null ? '' : String(valor);
  }

  function normalizarData(valor) {
    if (!valor) return '';
    const texto = String(valor);
    const match = texto.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : '';
  }

  function normalizarValidade(orcamento) {
    const valor = String(orcamento.validade_texto || orcamento.validade_dias || orcamento.validade || '').trim();
    const opcoes = ['7 dias', '15 dias', '30 dias', '60 dias', '90 dias'];

    if (opcoes.includes(valor)) return valor;
    if (/^\d+$/.test(valor) && opcoes.includes(`${valor} dias`)) return `${valor} dias`;

    const dataValidade = normalizarData(valor);
    const dataBase = normalizarData(orcamento.data_orcamento || orcamento.criado_em || orcamento.created_at);
    if (dataValidade && dataBase) {
      const inicio = new Date(`${dataBase}T00:00:00`);
      const fim = new Date(`${dataValidade}T00:00:00`);
      const dias = Math.round((fim - inicio) / 86400000);
      const opcao = `${dias} dias`;
      if (opcoes.includes(opcao)) return opcao;
    }

    return '';
  }

  function normalizarItens(itens) {
    if (!Array.isArray(itens)) return [];
    return itens.map(item => {
      const qtd = Number(item.qtd ?? item.quantidade ?? 1) || 0;
      const valor = Number(item.valor ?? item.valor_unitario ?? 0) || 0;
      return {
        descricao: item.descricao || item.nome || '',
        qtd,
        valor,
        subtotal: Number(item.subtotal ?? item.total ?? (qtd * valor)) || 0
      };
    }).filter(item => item.descricao);
  }

  function aplicarItens(itens) {
    document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(row => row.remove());

    const normalizados = normalizarItens(itens);
    if (normalizados.length && typeof adicionarLinha === 'function') {
      normalizados.forEach(item => adicionarLinha(item));
    } else if (typeof adicionarLinha === 'function') {
      adicionarLinha();
    }

    if (typeof calcularTotal === 'function') calcularTotal();
  }

  function limparExtrasCliente() {
    const container = document.getElementById('extra-cliente-container');
    if (container) container.innerHTML = '';
  }

  function aplicarOrcamento(orcamento, modo) {
    const tituloBase = orcamento.titulo || orcamento.assunto || '';
    const titulo = modo === 'duplicar' && tituloBase ? `${tituloBase} (cópia)` : tituloBase;

    valorCampo('titulo', titulo);
    valorCampo('data-orcamento', normalizarData(orcamento.data_orcamento || orcamento.criado_em || orcamento.created_at));
    valorCampo('cliente', orcamento.cliente_nome || '');
    valorCampo('tel-cliente', orcamento.cliente_whatsapp || orcamento.cliente_telefone || '');
    valorCampo('observacoes', orcamento.observacoes || '');
    valorCampo('validade-orcamento', normalizarValidade(orcamento));
    valorCampo('forma-pagamento', orcamento.forma_pagamento_cliente || orcamento.forma_pagamento || '');

    if (typeof setTheme === 'function') {
      setTheme(orcamento.tema_pdf || orcamento.tema || 'original', false);
    }

    limparExtrasCliente();
    aplicarItens(orcamento.itens);

    if (modo === 'editar') {
      definirIdAtual(String(orcamento.id));
    } else {
      definirIdAtual(null);
    }

    /*
     * Salva o conteúdo carregado como novo estado local. No modo duplicar,
     * o ID fica explicitamente nulo para que o próximo salvamento faça INSERT.
     */
    if (typeof salvarEstadoCompleto === 'function') salvarEstadoCompleto();

    try {
      const estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || '{}');
      estado.orcamento_nuvem_id = modo === 'editar' ? String(orcamento.id) : null;
      localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
    } catch (error) {
      console.warn('Não foi possível atualizar o vínculo local do orçamento:', error);
    }

    if (typeof gerarPrevia === 'function') {
      try { gerarPrevia(false); } catch (_) {}
    }
  }

  async function aguardarSupabase(tentativas = 20) {
    for (let i = 0; i < tentativas; i += 1) {
      if (window._supabase) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  async function carregarOrcamentoDaUrl() {
    const contexto = obterModoDaUrl();
    if (!contexto?.id) return;

    const temSupabase = await aguardarSupabase();
    if (!temSupabase) {
      console.error('Supabase indisponível para carregar orçamento do histórico.');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
      if (sessionError || !session?.user?.id) return;

      const { data, error } = await _supabase
        .from('orcamentos')
        .select('*')
        .eq('id', contexto.id)
        .eq('usuario_id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        alert('Orçamento não encontrado ou você não possui acesso a ele.');
        return;
      }

      aplicarOrcamento(data, contexto.modo);

      /* Remove os parâmetros após carregar para evitar reaplicar o modo em refreshs internos. */
      const urlLimpa = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({ fsModoOrcamento: contexto.modo }, '', urlLimpa);
    } catch (error) {
      console.error('Erro ao carregar orçamento do histórico:', error);
      alert('Não foi possível carregar o orçamento selecionado.');
    }
  }

  /*
   * O core restaura o rascunho logo após validar a sessão. Aguardamos esse ciclo
   * e então aplicamos o orçamento solicitado pela URL, que deve ter prioridade.
   */
  setTimeout(carregarOrcamentoDaUrl, 550);
})();
