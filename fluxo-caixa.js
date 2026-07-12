(() => {
  'use strict';

  const ITENS_POR_PAGINA = 25;

  const CATEGORIAS = {
    entrada: ['Venda', 'Serviço', 'Peça/produto', 'Recebimento', 'Outros'],
    saida: ['Compra de peças', 'Fornecedor', 'Funcionários', 'Aluguel', 'Impostos', 'Assinatura', 'Ferramentas', 'Outros']
  };

  const estado = {
    userId: null,
    lista: [],
    pagina: 1,
    editandoId: null,
    orcamentoOrigem: null,
    salvando: false,
    ultimoFoco: null
  };

  const $ = (id) => document.getElementById(id);

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function escaparHTML(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizarPlano(valor) {
    const plano = String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    return ['premium', 'basico', 'gestao'].includes(plano) ? 'premium' : plano;
  }

  function dataISOLocal(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function dataBR(valor) {
    if (!valor) return '-';

    const data = new Date(`${String(valor)}T00:00:00`);
    return Number.isNaN(data.getTime())
      ? '-'
      : data.toLocaleDateString('pt-BR');
  }

  function obterValor(id) {
    return $(id)?.value?.trim() || '';
  }

  function definirValor(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.value = valor ?? '';
  }

  function definirTexto(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.textContent = String(valor);
  }

  function parametro(nome) {
    return new URLSearchParams(window.location.search).get(nome) || '';
  }

  function mostrarMensagem(texto, tipo = 'ok') {
    const elemento = $('cx-msg');
    if (!elemento) return;

    elemento.textContent = texto || '';
    elemento.className = texto
      ? `fluxo-caixa-msg ${tipo}`
      : 'fluxo-caixa-msg';
    elemento.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  }

  function mostrarConteudoPremium(permitido) {
    const conteudo = $('fluxo-caixa-conteudo');
    const bloqueio = $('fluxo-caixa-bloqueio');

    if (conteudo) conteudo.hidden = !permitido;
    if (bloqueio) bloqueio.classList.toggle('ativo', !permitido);
  }

  async function obterPlanoAtual() {
    const { data, error } = await _supabase
      .from('perfis')
      .select('plano')
      .eq('id', estado.userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao consultar plano do perfil:', error);
      return '';
    }

    const plano = normalizarPlano(data?.plano);
    if (plano) localStorage.setItem('usuario_plano', plano);
    return plano;
  }

  function configurarDatasIniciais() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    definirValor('cx-inicio', dataISOLocal(inicioMes));
    definirValor('cx-fim', dataISOLocal(hoje));
    definirValor('cx-data', dataISOLocal(hoje));
  }

  function preencherSelectCategorias(selectId, tipo, valorSelecionado = '') {
    const select = $(selectId);
    if (!select) return;

    const categorias = CATEGORIAS[tipo] || CATEGORIAS.entrada;
    select.innerHTML = categorias
      .map((categoria) => `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`)
      .join('');

    select.value = categorias.includes(valorSelecionado)
      ? valorSelecionado
      : categorias[0];
  }

  function preencherFiltroCategorias() {
    const select = $('cx-filtro-categoria');
    if (!select) return;

    const categorias = [...new Set([...CATEGORIAS.entrada, ...CATEGORIAS.saida])]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    select.innerHTML = [
      '<option value="">Todas</option>',
      ...categorias.map((categoria) => `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`)
    ].join('');
  }

  function definirPeriodo(periodo) {
    const hoje = new Date();
    let inicio = new Date(hoje);
    let fim = new Date(hoje);

    if (periodo === 'semana') {
      const diaSemana = hoje.getDay();
      const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
      inicio.setDate(hoje.getDate() + deslocamento);
    } else if (periodo === 'mes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (periodo === 'mes-anterior') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    }

    definirValor('cx-inicio', dataISOLocal(inicio));
    definirValor('cx-fim', dataISOLocal(fim));

    document.querySelectorAll('[data-periodo]').forEach((botao) => {
      botao.classList.toggle('ativo', botao.dataset.periodo === periodo);
    });

    estado.pagina = 1;
    carregarFluxoCaixa();
  }

  function atualizarDescricaoPeriodo() {
    const inicio = obterValor('cx-inicio');
    const fim = obterValor('cx-fim');

    if (!inicio && !fim) {
      definirTexto('cx-periodo-descricao', 'Todas as movimentações disponíveis.');
      return;
    }

    if (inicio && fim) {
      definirTexto('cx-periodo-descricao', `Movimentações de ${dataBR(inicio)} até ${dataBR(fim)}.`);
      return;
    }

    definirTexto(
      'cx-periodo-descricao',
      inicio ? `Movimentações a partir de ${dataBR(inicio)}.` : `Movimentações até ${dataBR(fim)}.`
    );
  }

  function abrirFormulario(lancamento = null) {
    const modal = $('card-form-caixa');
    if (!modal) return;

    estado.ultimoFoco = document.activeElement;
    estado.editandoId = lancamento?.id || null;
    estado.orcamentoOrigem = lancamento?.origem_tipo === 'orcamento'
      ? { id: lancamento.origem_id }
      : estado.orcamentoOrigem;

    definirTexto('cx-modal-titulo', lancamento ? 'Editar lançamento' : 'Novo lançamento');
    definirTexto('cx-btn-salvar', lancamento ? 'Salvar alterações' : 'Salvar lançamento');

    if (lancamento) {
      definirValor('cx-data', lancamento.data_movimento || dataISOLocal());
      definirValor('cx-tipo', lancamento.tipo || 'entrada');
      preencherSelectCategorias('cx-categoria', lancamento.tipo || 'entrada', lancamento.categoria || '');
      definirValor('cx-valor', Number(lancamento.valor || 0).toFixed(2));
      definirValor('cx-forma', lancamento.forma_pagamento || 'outro');
      definirValor('cx-descricao', lancamento.descricao || '');
      definirValor('cx-observacoes', lancamento.observacoes || '');
    } else {
      const form = $('form-caixa');
      form?.reset();
      definirValor('cx-data', dataISOLocal());
      definirValor('cx-tipo', 'entrada');
      definirValor('cx-forma', 'pix');
      preencherSelectCategorias('cx-categoria', 'entrada', 'Venda');
    }

    mostrarMensagem('');
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');

    window.setTimeout(() => $('cx-valor')?.focus(), 80);
  }

  function fecharFormulario() {
    const modal = $('card-form-caixa');
    if (!modal || estado.salvando) return;

    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');

    $('form-caixa')?.reset();
    estado.editandoId = null;
    estado.orcamentoOrigem = null;

    definirTexto('cx-modal-titulo', 'Novo lançamento');
    definirTexto('cx-btn-salvar', 'Salvar lançamento');
    definirValor('cx-data', dataISOLocal());
    definirValor('cx-tipo', 'entrada');
    definirValor('cx-forma', 'pix');
    preencherSelectCategorias('cx-categoria', 'entrada', 'Venda');
    mostrarMensagem('');

    if (estado.ultimoFoco instanceof HTMLElement) {
      estado.ultimoFoco.focus();
    }
  }

  function obterPayloadFormulario() {
    return {
      user_id: estado.userId,
      tipo: obterValor('cx-tipo') || 'entrada',
      categoria: obterValor('cx-categoria') || 'Outros',
      descricao: obterValor('cx-descricao') || 'Lançamento manual',
      valor: Number(obterValor('cx-valor') || 0),
      data_movimento: obterValor('cx-data') || dataISOLocal(),
      forma_pagamento: obterValor('cx-forma') || 'outro',
      origem_tipo: estado.orcamentoOrigem ? 'orcamento' : 'manual',
      origem_id: estado.orcamentoOrigem?.id || null,
      observacoes: obterValor('cx-observacoes') || null
    };
  }

  function validarPayload(payload) {
    if (!['entrada', 'saida'].includes(payload.tipo)) {
      return 'Selecione um tipo válido.';
    }

    if (!Number.isFinite(payload.valor) || payload.valor <= 0) {
      return 'Informe um valor maior que zero.';
    }

    if (!payload.data_movimento) {
      return 'Informe a data do lançamento.';
    }

    if (!(CATEGORIAS[payload.tipo] || []).includes(payload.categoria)) {
      return 'Selecione uma categoria compatível com o tipo do lançamento.';
    }

    return '';
  }

  async function salvarLancamento(evento) {
    evento.preventDefault();
    if (estado.salvando) return;

    const payload = obterPayloadFormulario();
    const erroValidacao = validarPayload(payload);

    if (erroValidacao) {
      mostrarMensagem(erroValidacao, 'erro');
      return;
    }

    const botao = $('cx-btn-salvar');
    estado.salvando = true;
    if (botao) {
      botao.disabled = true;
      botao.textContent = estado.editandoId ? 'Salvando alterações...' : 'Salvando...';
    }

    try {
      let resposta;

      if (estado.editandoId) {
        const payloadEdicao = { ...payload };
        delete payloadEdicao.user_id;

        resposta = await _supabase
          .from('fluxo_caixa')
          .update(payloadEdicao)
          .eq('id', estado.editandoId)
          .eq('user_id', estado.userId);
      } else {
        resposta = await _supabase
          .from('fluxo_caixa')
          .insert(payload);
      }

      if (resposta.error) throw resposta.error;

      estado.salvando = false;
      fecharFormulario();
      await carregarFluxoCaixa();
    } catch (erro) {
      console.error('Erro ao salvar lançamento:', erro);
      mostrarMensagem('Não foi possível salvar o lançamento. Verifique os dados e tente novamente.', 'erro');
    } finally {
      estado.salvando = false;
      if (botao) {
        botao.disabled = false;
        botao.textContent = estado.editandoId ? 'Salvar alterações' : 'Salvar lançamento';
      }
    }
  }

  async function excluirLancamento(id) {
    const lancamento = estado.lista.find((item) => String(item.id) === String(id));
    if (!lancamento) return;

    const descricao = lancamento.descricao || lancamento.categoria || 'este lançamento';
    const confirmou = window.confirm(`Excluir "${descricao}" no valor de ${moeda(lancamento.valor)}?`);
    if (!confirmou) return;

    const { error } = await _supabase
      .from('fluxo_caixa')
      .delete()
      .eq('id', lancamento.id)
      .eq('user_id', estado.userId);

    if (error) {
      console.error('Erro ao excluir lançamento:', error);
      window.alert('Não foi possível excluir o lançamento.');
      return;
    }

    await carregarFluxoCaixa();
  }

  async function preencherPorOrcamento() {
    const id = parametro('orcamento_id');
    if (!id) return;

    try {
      const { data, error } = await _supabase
        .from('orcamentos')
        .select('id,total,cliente_nome,titulo,numero_orcamento')
        .eq('id', id)
        .eq('usuario_id', estado.userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      estado.orcamentoOrigem = data;
      abrirFormulario();

      definirValor('cx-tipo', 'entrada');
      preencherSelectCategorias('cx-categoria', 'entrada', 'Venda');
      definirValor('cx-valor', Number(data.total || 0).toFixed(2));
      definirValor('cx-descricao', `Orçamento - ${data.cliente_nome || data.titulo || id}`);
      definirValor('cx-observacoes', `Vinculado ao orçamento ${data.numero_orcamento || data.id}`);

      mostrarMensagem('Orçamento carregado. Confira os dados e salve a entrada no caixa.', 'ok');
    } catch (erro) {
      console.error('Erro ao carregar orçamento:', erro);
      mostrarMensagem('Não foi possível carregar o orçamento vinculado.', 'erro');
    }
  }

  function aplicarFiltrosLocais(lista) {
    const busca = obterValor('cx-filtro-busca').toLocaleLowerCase('pt-BR');

    if (!busca) return lista;

    return lista.filter((item) => {
      const texto = [
        item.descricao,
        item.categoria,
        item.forma_pagamento,
        item.observacoes
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      return texto.includes(busca);
    });
  }

  async function carregarFluxoCaixa() {
    const listaElemento = $('cx-lista');
    if (!listaElemento || !estado.userId) return;

    listaElemento.setAttribute('aria-busy', 'true');
    listaElemento.innerHTML = '<div class="fluxo-caixa-vazio">Carregando lançamentos...</div>';

    try {
      let consulta = _supabase
        .from('fluxo_caixa')
        .select('id,user_id,tipo,categoria,descricao,valor,data_movimento,forma_pagamento,origem_tipo,origem_id,observacoes,created_at')
        .eq('user_id', estado.userId)
        .order('data_movimento', { ascending: false })
        .order('created_at', { ascending: false });

      const inicio = obterValor('cx-inicio');
      const fim = obterValor('cx-fim');
      const tipo = obterValor('cx-filtro-tipo');
      const categoria = obterValor('cx-filtro-categoria');
      const forma = obterValor('cx-filtro-forma');

      if (inicio) consulta = consulta.gte('data_movimento', inicio);
      if (fim) consulta = consulta.lte('data_movimento', fim);
      if (tipo) consulta = consulta.eq('tipo', tipo);
      if (categoria) consulta = consulta.eq('categoria', categoria);
      if (forma) consulta = consulta.eq('forma_pagamento', forma);

      const { data, error } = await consulta;
      if (error) throw error;

      estado.lista = aplicarFiltrosLocais(data || []);

      const totalPaginas = Math.max(1, Math.ceil(estado.lista.length / ITENS_POR_PAGINA));
      if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;

      renderizarResumo();
      renderizarLista();
      atualizarDescricaoPeriodo();
    } catch (erro) {
      console.error('Erro ao carregar fluxo de caixa:', erro);
      estado.lista = [];
      renderizarResumo();
      listaElemento.innerHTML = `
        <div class="fluxo-caixa-vazio">
          Não foi possível carregar o caixa.
          <br><button class="btn secondary" type="button" data-acao="tentar-novamente">Tentar novamente</button>
        </div>
      `;
    } finally {
      listaElemento.setAttribute('aria-busy', 'false');
    }
  }

  function renderizarResumo() {
    const entradas = estado.lista.filter((item) => item.tipo === 'entrada');
    const saidas = estado.lista.filter((item) => item.tipo === 'saida');

    const valorEntradas = entradas.reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const valorSaidas = saidas.reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saldo = valorEntradas - valorSaidas;

    definirTexto('cx-entradas', moeda(valorEntradas));
    definirTexto('cx-saidas', moeda(valorSaidas));
    definirTexto('cx-saldo', moeda(saldo));
    definirTexto('cx-total', estado.lista.length);

    const cardSaldo = $('cx-card-saldo');
    if (cardSaldo) {
      cardSaldo.classList.toggle('saldo-positivo', saldo > 0);
      cardSaldo.classList.toggle('saldo-negativo', saldo < 0);
    }
  }

  function renderizarLista() {
    const box = $('cx-lista');
    const paginacao = $('cx-paginacao');
    if (!box || !paginacao) return;

    if (!estado.lista.length) {
      box.innerHTML = '<div class="fluxo-caixa-vazio">Nenhum lançamento encontrado no período.</div>';
      paginacao.hidden = true;
      return;
    }

    const inicio = (estado.pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const itens = estado.lista.slice(inicio, fim);
    const totalPaginas = Math.ceil(estado.lista.length / ITENS_POR_PAGINA);

    box.innerHTML = `
      <table class="fluxo-caixa-tabela">
        <caption class="sr-only">Extrato de entradas e saídas da oficina</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Tipo</th>
            <th scope="col">Categoria</th>
            <th scope="col">Descrição</th>
            <th scope="col">Forma</th>
            <th scope="col" class="valor">Valor</th>
            <th scope="col" class="acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${itens.map((item) => `
            <tr>
              <td>${dataBR(item.data_movimento)}</td>
              <td>
                <span class="fluxo-caixa-badge ${escaparHTML(item.tipo)}">
                  ${escaparHTML(item.tipo)}
                </span>
              </td>
              <td>${escaparHTML(item.categoria || '-')}</td>
              <td>
                ${escaparHTML(item.descricao || '-')}
                ${item.origem_tipo === 'orcamento'
                  ? '<span class="fluxo-caixa-origem">Vinculado a orçamento</span>'
                  : ''}
              </td>
              <td>${escaparHTML(item.forma_pagamento || '-')}</td>
              <td class="valor">
                <strong class="${item.tipo === 'entrada' ? 'fluxo-caixa-valor-entrada' : 'fluxo-caixa-valor-saida'}">
                  ${item.tipo === 'saida' ? '− ' : '+ '}${moeda(item.valor)}
                </strong>
              </td>
              <td class="acoes">
                <button
                  class="fluxo-caixa-acao"
                  type="button"
                  data-acao="editar"
                  data-id="${escaparHTML(item.id)}"
                  aria-label="Editar lançamento"
                  title="Editar"
                >✎</button>
                <button
                  class="fluxo-caixa-acao excluir"
                  type="button"
                  data-acao="excluir"
                  data-id="${escaparHTML(item.id)}"
                  aria-label="Excluir lançamento"
                  title="Excluir"
                >×</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    paginacao.hidden = totalPaginas <= 1;
    definirTexto('cx-pagina-info', `Página ${estado.pagina} de ${totalPaginas}`);

    const anterior = $('cx-pagina-anterior');
    const proxima = $('cx-proxima-pagina');
    if (anterior) anterior.disabled = estado.pagina <= 1;
    if (proxima) proxima.disabled = estado.pagina >= totalPaginas;
  }

  function mudarPagina(direcao) {
    const totalPaginas = Math.max(1, Math.ceil(estado.lista.length / ITENS_POR_PAGINA));
    estado.pagina = Math.min(totalPaginas, Math.max(1, estado.pagina + direcao));
    renderizarLista();
    $('cx-lista')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function configurarEventos() {
    $('form-caixa')?.addEventListener('submit', salvarLancamento);

    $('form-filtros-caixa')?.addEventListener('submit', (evento) => {
      evento.preventDefault();
      estado.pagina = 1;
      document.querySelectorAll('[data-periodo]').forEach((botao) => botao.classList.remove('ativo'));
      carregarFluxoCaixa();
    });

    $('cx-tipo')?.addEventListener('change', (evento) => {
      preencherSelectCategorias('cx-categoria', evento.target.value);
    });

    $('btn-novo-lancamento-topo')?.addEventListener('click', () => abrirFormulario());
    $('btn-novo-lancamento-lista')?.addEventListener('click', () => abrirFormulario());
    $('btn-fechar-modal-caixa')?.addEventListener('click', fecharFormulario);
    $('cx-btn-cancelar')?.addEventListener('click', fecharFormulario);
    $('btn-atualizar-caixa')?.addEventListener('click', carregarFluxoCaixa);
    $('cx-pagina-anterior')?.addEventListener('click', () => mudarPagina(-1));
    $('cx-proxima-pagina')?.addEventListener('click', () => mudarPagina(1));

    document.querySelectorAll('[data-periodo]').forEach((botao) => {
      botao.addEventListener('click', () => definirPeriodo(botao.dataset.periodo));
    });

    $('card-form-caixa')?.addEventListener('click', (evento) => {
      if (evento.target?.id === 'card-form-caixa') fecharFormulario();
    });

    $('cx-lista')?.addEventListener('click', (evento) => {
      const botao = evento.target.closest('[data-acao]');
      if (!botao) return;

      const acao = botao.dataset.acao;
      const id = botao.dataset.id;

      if (acao === 'tentar-novamente') {
        carregarFluxoCaixa();
        return;
      }

      const lancamento = estado.lista.find((item) => String(item.id) === String(id));
      if (acao === 'editar' && lancamento) abrirFormulario(lancamento);
      if (acao === 'excluir' && lancamento) excluirLancamento(id);
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') fecharFormulario();
    });
  }

  async function iniciarFluxoCaixa() {
    try {
      const { data: { session } } = await _supabase.auth.getSession();

      if (!session?.user?.id) {
        window.location.href = '/index.html?login=1';
        return;
      }

      estado.userId = session.user.id;

      const plano = await obterPlanoAtual();
      const permitido = plano === 'premium';
      mostrarConteudoPremium(permitido);

      if (!permitido) return;

      configurarDatasIniciais();
      preencherSelectCategorias('cx-categoria', 'entrada', 'Venda');
      preencherFiltroCategorias();
      configurarEventos();

      await carregarFluxoCaixa();
      await preencherPorOrcamento();
    } catch (erro) {
      console.error('Erro ao iniciar fluxo de caixa:', erro);
      mostrarConteudoPremium(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarFluxoCaixa);
  } else {
    iniciarFluxoCaixa();
  }
})();
