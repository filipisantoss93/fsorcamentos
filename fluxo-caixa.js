(() => {
  'use strict';

  const OPCOES_POR_PAGINA = [10, 25, 50];
  const CHAVE_POR_PAGINA = 'fs_fluxo_caixa_itens_por_pagina';
  const CATEGORIAS = {
    entrada: ['Venda', 'Serviço', 'Peça/produto', 'Recebimento', 'Outros'],
    saida: ['Compra de peças', 'Fornecedor', 'Funcionários', 'Aluguel', 'Impostos', 'Assinatura', 'Ferramentas', 'Outros']
  };

  function itensPorPaginaInicial() {
    const salvo = Number(localStorage.getItem(CHAVE_POR_PAGINA));
    if (OPCOES_POR_PAGINA.includes(salvo)) return salvo;
    return window.matchMedia('(max-width: 620px)').matches ? 10 : 25;
  }

  const estado = {
    userId: null,
    lista: [],
    pagina: 1,
    total: 0,
    itensPorPagina: itensPorPaginaInicial(),
    editandoId: null,
    excluindoId: null,
    orcamentoOrigem: null,
    salvando: false,
    excluindo: false,
    ultimoFoco: null
  };

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const escaparHTML = valor => String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const normalizarPlano = valor => String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const dataISOLocal = (data = new Date()) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const dataBR = valor => {
    if (!valor) return '-';
    const data = new Date(`${valor}T00:00:00`);
    return Number.isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR');
  };
  const obterValor = id => $(id)?.value?.trim() || '';
  const definirValor = (id, valor) => { if ($(id)) $(id).value = valor ?? ''; };
  const definirTexto = (id, valor) => { if ($(id)) $(id).textContent = String(valor); };
  const parametro = nome => new URLSearchParams(location.search).get(nome) || '';

  function mostrarMensagem(texto, tipo = 'ok') {
    const e = $('cx-msg');
    if (!e) return;
    e.textContent = texto || '';
    e.className = texto ? `fluxo-caixa-msg ${tipo}` : 'fluxo-caixa-msg';
    e.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  }

  function mostrarErroFiltro(texto = '') {
    const e = $('cx-filtro-msg');
    if (!e) return;
    e.textContent = texto;
    e.classList.toggle('ativo', Boolean(texto));
  }

  function mostrarConteudoPremium(permitido, erro = false) {
    $('fluxo-caixa-conteudo').hidden = !permitido;
    $('fluxo-caixa-bloqueio').classList.toggle('ativo', !permitido);
    if (!permitido) {
      definirTexto('cx-bloqueio-titulo', erro ? 'Não foi possível verificar seu plano' : 'Controle financeiro da oficina');
      definirTexto('cx-bloqueio-texto', erro ? 'Confira sua conexão e tente novamente.' : 'O Fluxo de Caixa está disponível exclusivamente no plano Premium.');
      $('cx-bloqueio-upgrade').hidden = erro;
      $('cx-bloqueio-tentar').hidden = !erro;
    }
  }

  async function obterPlanoAtual() {
    const { data, error } = await _supabase.from('perfis').select('plano').eq('id', estado.userId).maybeSingle();
    if (error) throw error;
    const plano = normalizarPlano(data?.plano);
    if (plano) localStorage.setItem('usuario_plano', plano);
    return plano;
  }

  function configurarDatasIniciais() {
    const hoje = new Date();
    definirValor('cx-inicio', dataISOLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
    definirValor('cx-fim', dataISOLocal(hoje));
    definirValor('cx-data', dataISOLocal(hoje));
  }

  function preencherSelectCategorias(id, tipo, selecionada = '') {
    const select = $(id);
    if (!select) return;
    const categorias = CATEGORIAS[tipo] || CATEGORIAS.entrada;
    select.innerHTML = categorias.map(c => `<option value="${escaparHTML(c)}">${escaparHTML(c)}</option>`).join('');
    select.value = categorias.includes(selecionada) ? selecionada : categorias[0];
  }

  function preencherFiltroCategorias() {
    const categorias = [...new Set([...CATEGORIAS.entrada, ...CATEGORIAS.saida])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    $('cx-filtro-categoria').innerHTML = [
      '<option value="">Todas</option>',
      ...categorias.map(c => `<option value="${escaparHTML(c)}">${escaparHTML(c)}</option>`)
    ].join('');
  }

  function validarPeriodo() {
    const inicio = obterValor('cx-inicio');
    const fim = obterValor('cx-fim');
    if (inicio && fim && inicio > fim) {
      mostrarErroFiltro('A data inicial não pode ser posterior à data final.');
      return false;
    }
    mostrarErroFiltro('');
    return true;
  }

  function definirPeriodo(periodo) {
    const hoje = new Date();
    let inicio = new Date(hoje);
    let fim = new Date(hoje);
    if (periodo === 'semana') {
      const d = hoje.getDay();
      inicio.setDate(hoje.getDate() + (d === 0 ? -6 : 1 - d));
    } else if (periodo === 'mes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (periodo === 'mes-anterior') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    }
    definirValor('cx-inicio', dataISOLocal(inicio));
    definirValor('cx-fim', dataISOLocal(fim));
    document.querySelectorAll('[data-periodo]').forEach(b => b.classList.toggle('ativo', b.dataset.periodo === periodo));
    estado.pagina = 1;
    carregarFluxoCaixa();
  }

  function limparFiltros() {
    configurarDatasIniciais();
    definirValor('cx-filtro-tipo', '');
    definirValor('cx-filtro-categoria', '');
    definirValor('cx-filtro-forma', '');
    definirValor('cx-filtro-busca', '');
    document.querySelectorAll('[data-periodo]').forEach(b => b.classList.toggle('ativo', b.dataset.periodo === 'mes'));
    mostrarErroFiltro('');
    estado.pagina = 1;
    carregarFluxoCaixa();
  }

  function atualizarDescricaoPeriodo() {
    const i = obterValor('cx-inicio');
    const f = obterValor('cx-fim');
    const busca = obterValor('cx-filtro-busca');
    let texto = i && f ? `Movimentações de ${dataBR(i)} até ${dataBR(f)}.`
      : i ? `Movimentações a partir de ${dataBR(i)}.`
      : f ? `Movimentações até ${dataBR(f)}.`
      : 'Todas as movimentações disponíveis.';
    if (busca) texto += ` Pesquisa: “${busca}”.`;
    definirTexto('cx-periodo-descricao', texto);
  }

  function abrirModal(modal) {
    estado.ultimoFoco = document.activeElement;
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
    setTimeout(() => modal.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')?.focus(), 50);
  }

  function fecharModal(modal) {
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.fluxo-caixa-modal.ativo')) document.body.classList.remove('modal-aberto');
    if (estado.ultimoFoco instanceof HTMLElement) estado.ultimoFoco.focus();
  }

  function prenderFoco(evento, modal) {
    if (evento.key !== 'Tab' || !modal.classList.contains('ativo')) return;
    const focaveis = [...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  function abrirFormulario(lancamento = null) {
    estado.editandoId = lancamento?.id || null;
    estado.orcamentoOrigem = lancamento?.origem_tipo === 'orcamento' ? { id: lancamento.origem_id } : null;
    definirTexto('cx-modal-titulo', lancamento ? 'Editar lançamento' : 'Novo lançamento');
    definirTexto('cx-btn-salvar', lancamento ? 'Salvar alterações' : 'Salvar lançamento');
    $('form-caixa').reset();
    definirValor('cx-data', lancamento?.data_movimento || dataISOLocal());
    definirValor('cx-tipo', lancamento?.tipo || 'entrada');
    preencherSelectCategorias('cx-categoria', lancamento?.tipo || 'entrada', lancamento?.categoria || 'Venda');
    definirValor('cx-valor', lancamento ? Number(lancamento.valor || 0).toFixed(2) : '');
    definirValor('cx-forma', lancamento?.forma_pagamento || 'pix');
    definirValor('cx-descricao', lancamento?.descricao || '');
    definirValor('cx-observacoes', lancamento?.observacoes || '');
    mostrarMensagem('');
    abrirModal($('card-form-caixa'));
    setTimeout(() => $('cx-valor')?.focus(), 80);
  }

  function fecharFormulario() {
    if (estado.salvando) return;
    fecharModal($('card-form-caixa'));
    estado.editandoId = null;
    estado.orcamentoOrigem = null;
  }

  function obterPayload() {
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

  function validarPayload(p) {
    if (!['entrada', 'saida'].includes(p.tipo)) return 'Selecione um tipo válido.';
    if (!Number.isFinite(p.valor) || p.valor <= 0) return 'Informe um valor maior que zero.';
    if (!(CATEGORIAS[p.tipo] || []).includes(p.categoria)) return 'Selecione uma categoria compatível com o tipo.';
    return '';
  }

  async function salvarLancamento(evento) {
    evento.preventDefault();
    if (estado.salvando) return;
    const payload = obterPayload();
    const erro = validarPayload(payload);
    if (erro) return mostrarMensagem(erro, 'erro');
    const botao = $('cx-btn-salvar');
    estado.salvando = true;
    botao.disabled = true;
    botao.textContent = estado.editandoId ? 'Salvando alterações...' : 'Salvando...';
    try {
      let resposta;
      if (estado.editandoId) {
        const edicao = { ...payload };
        delete edicao.user_id;
        resposta = await _supabase.from('fluxo_caixa').update(edicao).eq('id', estado.editandoId).eq('user_id', estado.userId);
      } else {
        resposta = await _supabase.from('fluxo_caixa').insert(payload);
      }
      if (resposta.error) throw resposta.error;
      estado.salvando = false;
      fecharFormulario();
      await carregarFluxoCaixa();
    } catch (e) {
      console.error(e);
      mostrarMensagem('Não foi possível salvar o lançamento.', 'erro');
    } finally {
      estado.salvando = false;
      botao.disabled = false;
      botao.textContent = estado.editandoId ? 'Salvar alterações' : 'Salvar lançamento';
    }
  }

  function solicitarExclusao(id) {
    const item = estado.lista.find(x => String(x.id) === String(id));
    if (!item) return;
    estado.excluindoId = item.id;
    definirTexto('cx-excluir-descricao', `Excluir “${item.descricao || item.categoria}” no valor de ${moeda(item.valor)}?`);
    abrirModal($('modal-excluir-caixa'));
  }

  function fecharExclusao() {
    if (estado.excluindo) return;
    fecharModal($('modal-excluir-caixa'));
    estado.excluindoId = null;
  }

  async function confirmarExclusao() {
    if (!estado.excluindoId || estado.excluindo) return;
    const botao = $('btn-confirmar-exclusao');
    estado.excluindo = true;
    botao.disabled = true;
    botao.textContent = 'Excluindo...';
    try {
      const { error } = await _supabase.from('fluxo_caixa').delete().eq('id', estado.excluindoId).eq('user_id', estado.userId);
      if (error) throw error;
      estado.excluindo = false;
      fecharExclusao();
      await carregarFluxoCaixa();
    } catch (e) {
      console.error(e);
      definirTexto('cx-excluir-descricao', 'Não foi possível excluir. Tente novamente.');
    } finally {
      estado.excluindo = false;
      botao.disabled = false;
      botao.textContent = 'Excluir lançamento';
    }
  }

  async function preencherPorOrcamento() {
    const id = parametro('orcamento_id');
    if (!id) return;
    try {
      const { data, error } = await _supabase.from('orcamentos')
        .select('id,total,cliente_nome,titulo,numero_orcamento')
        .eq('id', id).eq('usuario_id', estado.userId).maybeSingle();
      if (error) throw error;
      if (!data) return;
      abrirFormulario();
      estado.orcamentoOrigem = data;
      definirValor('cx-valor', Number(data.total || 0).toFixed(2));
      definirValor('cx-descricao', `Orçamento - ${data.cliente_nome || data.titulo || id}`);
      definirValor('cx-observacoes', `Vinculado ao orçamento ${data.numero_orcamento || data.id}`);
      mostrarMensagem('Orçamento carregado. Confira os dados e salve a entrada.', 'ok');
    } catch (e) {
      console.error(e);
    }
  }

  function filtrosRPC() {
    return {
      p_inicio: obterValor('cx-inicio') || null,
      p_fim: obterValor('cx-fim') || null,
      p_tipo: obterValor('cx-filtro-tipo') || null,
      p_categoria: obterValor('cx-filtro-categoria') || null,
      p_forma: obterValor('cx-filtro-forma') || null,
      p_busca: obterValor('cx-filtro-busca') || null
    };
  }

  async function carregarResumo() {
    const { data, error } = await _supabase.rpc('resumo_fluxo_caixa', filtrosRPC());
    if (error) throw error;
    const r = Array.isArray(data) ? data[0] : data || {};
    const entradas = Number(r.entradas || 0);
    const saidas = Number(r.saidas || 0);
    const saldo = entradas - saidas;
    definirTexto('cx-entradas', moeda(entradas));
    definirTexto('cx-saidas', moeda(saidas));
    definirTexto('cx-saldo', moeda(saldo));
    definirTexto('cx-total', Number(r.total || 0));
    estado.total = Number(r.total || 0);
    $('cx-card-saldo').classList.toggle('saldo-positivo', saldo > 0);
    $('cx-card-saldo').classList.toggle('saldo-negativo', saldo < 0);
  }

  function paginasTotais() {
    return Math.max(1, Math.ceil(estado.total / estado.itensPorPagina));
  }

  function inserirControleQuantidade() {
    const paginacao = $('cx-paginacao');
    if (!paginacao || $('cx-itens-por-pagina')) return;

    const controle = document.createElement('label');
    controle.className = 'cx-controle-quantidade';
    controle.innerHTML = `
      <span>Linhas</span>
      <select id="cx-itens-por-pagina" aria-label="Quantidade de linhas por página">
        ${OPCOES_POR_PAGINA.map(valor => `<option value="${valor}"${valor === estado.itensPorPagina ? ' selected' : ''}>${valor}</option>`).join('')}
      </select>
    `;
    paginacao.prepend(controle);

    if (!document.querySelector('style[data-cx-paginacao]')) {
      const style = document.createElement('style');
      style.dataset.cxPaginacao = 'true';
      style.textContent = `
        .cx-controle-quantidade{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--fs-muted,#aebed2);font-weight:700}
        .cx-controle-quantidade select{min-height:42px;padding:7px 34px 7px 12px;border:1px solid var(--fs-border,#294e76);border-radius:10px;background:var(--fs-card-soft,#102b49);color:var(--fs-text,#fff);font:inherit;font-weight:800}
        .cx-registros-info{width:100%;text-align:center;color:var(--fs-muted,#aebed2);font-size:13px}
        @media(max-width:620px){#cx-paginacao{display:grid!important;grid-template-columns:1fr 1fr;gap:10px}.cx-controle-quantidade,.cx-registros-info,#cx-pagina-info{grid-column:1/-1}#cx-pagina-anterior,#cx-proxima-pagina{width:100%}}
      `;
      document.head.appendChild(style);
    }

    const info = document.createElement('div');
    info.id = 'cx-registros-info';
    info.className = 'cx-registros-info';
    info.setAttribute('aria-live', 'polite');
    paginacao.appendChild(info);

    $('cx-itens-por-pagina').addEventListener('change', event => {
      const novoValor = Number(event.target.value);
      if (!OPCOES_POR_PAGINA.includes(novoValor)) return;
      estado.itensPorPagina = novoValor;
      estado.pagina = 1;
      localStorage.setItem(CHAVE_POR_PAGINA, String(novoValor));
      carregarFluxoCaixa();
    });
  }

  async function carregarFluxoCaixa() {
    if (!estado.userId || !validarPeriodo()) return;
    const box = $('cx-lista');
    box.setAttribute('aria-busy', 'true');
    box.innerHTML = '<div class="fluxo-caixa-vazio">Carregando lançamentos...</div>';

    try {
      const inicio = (estado.pagina - 1) * estado.itensPorPagina;
      const fim = inicio + estado.itensPorPagina - 1;
      let q = _supabase.from('fluxo_caixa')
        .select('id,tipo,categoria,descricao,valor,data_movimento,forma_pagamento,origem_tipo,origem_id,observacoes,created_at', { count: 'exact' })
        .eq('user_id', estado.userId)
        .order('data_movimento', { ascending: false })
        .order('created_at', { ascending: false })
        .range(inicio, fim);

      const f = filtrosRPC();
      if (f.p_inicio) q = q.gte('data_movimento', f.p_inicio);
      if (f.p_fim) q = q.lte('data_movimento', f.p_fim);
      if (f.p_tipo) q = q.eq('tipo', f.p_tipo);
      if (f.p_categoria) q = q.eq('categoria', f.p_categoria);
      if (f.p_forma) q = q.eq('forma_pagamento', f.p_forma);
      if (f.p_busca) q = q.ilike('descricao', `%${f.p_busca.replace(/[%_]/g, '\\$&')}%`);

      const [{ data, error, count }] = await Promise.all([q, carregarResumo()]);
      if (error) throw error;
      estado.lista = data || [];
      estado.total = Number(count ?? estado.total);

      const paginas = paginasTotais();
      if (estado.pagina > paginas) {
        estado.pagina = paginas;
        return carregarFluxoCaixa();
      }

      renderizarLista();
      atualizarDescricaoPeriodo();
    } catch (e) {
      console.error(e);
      estado.lista = [];
      box.innerHTML = '<div class="fluxo-caixa-vazio">Não foi possível carregar o caixa.<br><button class="btn secondary" type="button" data-acao="tentar-novamente">Tentar novamente</button></div>';
    } finally {
      box.setAttribute('aria-busy', 'false');
    }
  }

  function renderizarLista() {
    const box = $('cx-lista');
    const paginacao = $('cx-paginacao');

    if (!estado.lista.length) {
      box.innerHTML = '<div class="fluxo-caixa-vazio">Nenhum lançamento encontrado no período.</div>';
      paginacao.hidden = true;
      return;
    }

    box.innerHTML = `<table class="fluxo-caixa-tabela"><caption class="sr-only">Extrato de entradas e saídas</caption><thead><tr><th scope="col">Data</th><th scope="col">Tipo</th><th scope="col">Categoria</th><th scope="col">Descrição</th><th scope="col">Forma</th><th scope="col" class="valor">Valor</th><th scope="col" class="acoes">Ações</th></tr></thead><tbody>${estado.lista.map(item => `<tr><td>${dataBR(item.data_movimento)}</td><td><span class="fluxo-caixa-badge ${escaparHTML(item.tipo)}">${escaparHTML(item.tipo)}</span></td><td>${escaparHTML(item.categoria || '-')}</td><td>${escaparHTML(item.descricao || '-')}${item.origem_tipo === 'orcamento' && item.origem_id ? `<span class="fluxo-caixa-origem"><a href="/ver.html?id=${encodeURIComponent(item.origem_id)}">Abrir orçamento vinculado</a></span>` : ''}</td><td>${escaparHTML(item.forma_pagamento || '-')}</td><td class="valor"><strong class="${item.tipo === 'entrada' ? 'fluxo-caixa-valor-entrada' : 'fluxo-caixa-valor-saida'}">${item.tipo === 'saida' ? '− ' : '+ '}${moeda(item.valor)}</strong></td><td class="acoes"><button class="fluxo-caixa-acao" type="button" data-acao="editar" data-id="${escaparHTML(item.id)}" aria-label="Editar lançamento">✎</button> <button class="fluxo-caixa-acao excluir" type="button" data-acao="excluir" data-id="${escaparHTML(item.id)}" aria-label="Excluir lançamento">×</button></td></tr>`).join('')}</tbody></table>`;

    inserirControleQuantidade();
    const paginas = paginasTotais();
    paginacao.hidden = false;

    const primeiro = (estado.pagina - 1) * estado.itensPorPagina + 1;
    const ultimo = Math.min(estado.pagina * estado.itensPorPagina, estado.total);
    definirTexto('cx-pagina-info', `Página ${estado.pagina} de ${paginas}`);
    definirTexto('cx-registros-info', `Exibindo ${primeiro}–${ultimo} de ${estado.total} lançamento${estado.total === 1 ? '' : 's'}`);
    $('cx-pagina-anterior').disabled = estado.pagina <= 1;
    $('cx-proxima-pagina').disabled = estado.pagina >= paginas;
  }

  function mudarPagina(direcao) {
    const paginas = paginasTotais();
    estado.pagina = Math.min(paginas, Math.max(1, estado.pagina + direcao));
    carregarFluxoCaixa();
    $('cx-lista')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function configurarEventos() {
    $('form-caixa').addEventListener('submit', salvarLancamento);
    $('form-filtros-caixa').addEventListener('submit', e => {
      e.preventDefault();
      document.querySelectorAll('[data-periodo]').forEach(b => b.classList.remove('ativo'));
      estado.pagina = 1;
      carregarFluxoCaixa();
    });
    $('cx-tipo').addEventListener('change', e => preencherSelectCategorias('cx-categoria', e.target.value));
    $('btn-novo-lancamento-topo').addEventListener('click', () => abrirFormulario());
    $('btn-novo-lancamento-lista').addEventListener('click', () => abrirFormulario());
    $('btn-fechar-modal-caixa').addEventListener('click', fecharFormulario);
    $('cx-btn-cancelar').addEventListener('click', fecharFormulario);
    $('btn-atualizar-caixa').addEventListener('click', carregarFluxoCaixa);
    $('btn-limpar-filtros').addEventListener('click', limparFiltros);
    $('cx-pagina-anterior').addEventListener('click', () => mudarPagina(-1));
    $('cx-proxima-pagina').addEventListener('click', () => mudarPagina(1));
    document.querySelectorAll('[data-periodo]').forEach(b => b.addEventListener('click', () => definirPeriodo(b.dataset.periodo)));
    $('card-form-caixa').addEventListener('click', e => { if (e.target.id === 'card-form-caixa') fecharFormulario(); });
    $('modal-excluir-caixa').addEventListener('click', e => { if (e.target.id === 'modal-excluir-caixa') fecharExclusao(); });
    $('btn-fechar-exclusao').addEventListener('click', fecharExclusao);
    $('btn-cancelar-exclusao').addEventListener('click', fecharExclusao);
    $('btn-confirmar-exclusao').addEventListener('click', confirmarExclusao);
    $('cx-lista').addEventListener('click', e => {
      const b = e.target.closest('[data-acao]');
      if (!b) return;
      if (b.dataset.acao === 'tentar-novamente') return carregarFluxoCaixa();
      const item = estado.lista.find(x => String(x.id) === String(b.dataset.id));
      if (b.dataset.acao === 'editar' && item) abrirFormulario(item);
      if (b.dataset.acao === 'excluir' && item) solicitarExclusao(item.id);
    });
    document.addEventListener('keydown', e => {
      const aberto = document.querySelector('.fluxo-caixa-modal.ativo');
      if (!aberto) return;
      if (e.key === 'Escape') {
        aberto.id === 'card-form-caixa' ? fecharFormulario() : fecharExclusao();
        return;
      }
      prenderFoco(e, aberto);
    });
  }

  async function iniciarFluxoCaixa() {
    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) {
        location.href = '/index.html?login=1';
        return;
      }
      estado.userId = session.user.id;
      const plano = await obterPlanoAtual();
      const permitido = plano === 'premium';
      mostrarConteudoPremium(permitido, false);
      if (!permitido) return;
      configurarDatasIniciais();
      preencherSelectCategorias('cx-categoria', 'entrada', 'Venda');
      preencherFiltroCategorias();
      configurarEventos();
      await carregarFluxoCaixa();
      await preencherPorOrcamento();
    } catch (e) {
      console.error(e);
      mostrarConteudoPremium(false, true);
    }
  }

  $('cx-bloqueio-tentar')?.addEventListener('click', () => location.reload());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarFluxoCaixa);
  else iniciarFluxoCaixa();
})();