(() => {
  'use strict';

  const DASH = {
    userId: null,
    orcamentos: [],
    caixa: [],
    anterior: { orcamentos: [], caixa: [] },
    carregando: false
  };

  const $ = id => document.getElementById(id);
  const PAGINA = 1000;
  const STATUS_APROVADOS = new Set(['aprovado', 'aprovada']);
  const STATUS_RECUSADOS = new Set(['recusado', 'recusada']);
  const STATUS_PENDENTES = new Set(['pendente', 'enviado', 'enviada', 'visualizado', 'visualizada', 'aguardando', 'em analise']);

  function normalizar(valor, padrao = '') {
    return String(valor ?? padrao)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapar(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function dataLocalISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function dataBR(valor) {
    if (!valor) return '—';
    const texto = String(valor);
    const data = new Date(texto.includes('T') ? texto : `${texto}T00:00:00`);
    return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
  }

  function numero(valor) {
    const n = Number(valor || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function status(valor) {
    return normalizar(valor, 'pendente');
  }

  function tipoStatus(valor) {
    const s = status(valor);
    if (STATUS_APROVADOS.has(s)) return 'aprovado';
    if (STATUS_RECUSADOS.has(s)) return 'recusado';
    if (STATUS_PENDENTES.has(s)) return 'pendente';
    return 'outro';
  }

  function parseItens(itens) {
    if (Array.isArray(itens)) return itens;
    if (typeof itens === 'string') {
      try {
        const convertido = JSON.parse(itens);
        return Array.isArray(convertido) ? convertido : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  function subtotalItem(item) {
    return numero(item.subtotal ?? item.total) || numero(item.valor ?? item.valor_unitario) * numero(item.qtd ?? item.quantidade ?? 1);
  }

  function planoAtivo(plano, situacao, expiraEm) {
    if (normalizar(plano) !== 'premium') return false;
    if (['cancelado', 'expirado', 'inativo', 'inadimplente'].includes(normalizar(situacao))) return false;
    if (!expiraEm) return true;
    const expira = new Date(expiraEm);
    return !Number.isNaN(expira.getTime()) && expira.getTime() >= Date.now();
  }

  async function validarPremium(uid) {
    const [perfilResp, assinaturaResp] = await Promise.all([
      _supabase.from('perfis').select('plano,plano_status,plano_expira_em').eq('id', uid).maybeSingle(),
      _supabase.from('assinaturas').select('plano,status,expira_em,nivel').eq('usuario_id', uid).maybeSingle()
    ]);

    if (perfilResp.error && perfilResp.error.code !== 'PGRST116') throw perfilResp.error;
    if (assinaturaResp.error && assinaturaResp.error.code !== 'PGRST116') throw assinaturaResp.error;

    const perfil = perfilResp.data || {};
    const assinatura = assinaturaResp.data || {};
    const plano = assinatura.plano || perfil.plano || 'gratis';
    const situacao = assinatura.status || perfil.plano_status || 'ativo';
    const expira = assinatura.expira_em || perfil.plano_expira_em || null;
    return planoAtivo(plano, situacao, expira);
  }

  function mostrarBloqueioPremium() {
    $('relatorios-conteudo')?.setAttribute('hidden', '');
    $('relatorios-bloqueio')?.removeAttribute('hidden');
  }

  function mostrarConteudo() {
    $('relatorios-bloqueio')?.setAttribute('hidden', '');
    $('relatorios-conteudo')?.removeAttribute('hidden');
  }

  function setTexto(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.textContent = String(valor);
  }

  function setHTML(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.innerHTML = valor;
  }

  function intervaloAtual() {
    return { inicio: $('dash-inicio')?.value || '', fim: $('dash-fim')?.value || '' };
  }

  function validarIntervalo(inicio, fim) {
    if (!inicio || !fim) throw new Error('Informe a data inicial e a data final.');
    if (inicio > fim) throw new Error('A data inicial não pode ser posterior à data final.');
    const dias = Math.floor((new Date(`${fim}T00:00:00`) - new Date(`${inicio}T00:00:00`)) / 86400000) + 1;
    if (dias > 730) throw new Error('Selecione um período de até 730 dias.');
    return dias;
  }

  function intervaloAnterior(inicio, fim) {
    const inicial = new Date(`${inicio}T00:00:00`);
    const final = new Date(`${fim}T00:00:00`);
    const duracao = Math.floor((final - inicial) / 86400000) + 1;
    const fimAnterior = new Date(inicial);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
    const inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - duracao + 1);
    return { inicio: dataLocalISO(inicioAnterior), fim: dataLocalISO(fimAnterior) };
  }

  function definirCarregando(ativo) {
    DASH.carregando = ativo;
    document.body.classList.toggle('relatorios-carregando', ativo);
    document.querySelectorAll('[data-acao-relatorio]').forEach(botao => {
      botao.disabled = ativo;
      botao.setAttribute('aria-busy', ativo ? 'true' : 'false');
    });
    setTexto('status-relatorio', ativo ? 'Atualizando dados…' : 'Dados atualizados');
  }

  function mostrarErro(mensagem) {
    const caixa = $('erro-relatorio');
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.hidden = false;
  }

  function limparErro() {
    const caixa = $('erro-relatorio');
    if (caixa) caixa.hidden = true;
  }

  async function buscarPaginado(tabela, colunas, filtros, ordem) {
    const resultado = [];
    for (let inicio = 0; ; inicio += PAGINA) {
      let consulta = _supabase.from(tabela).select(colunas);
      filtros.forEach(({ metodo, coluna, valor }) => { consulta = consulta[metodo](coluna, valor); });
      consulta = consulta.order(ordem.coluna, { ascending: ordem.ascending }).range(inicio, inicio + PAGINA - 1);
      const { data, error } = await consulta;
      if (error) throw error;
      resultado.push(...(data || []));
      if (!data || data.length < PAGINA) break;
    }
    return resultado;
  }

  function buscarOrcamentos(inicio, fim) {
    return buscarPaginado(
      'orcamentos',
      'cliente_nome,status,total,criado_em,itens',
      [
        { metodo: 'eq', coluna: 'usuario_id', valor: DASH.userId },
        { metodo: 'gte', coluna: 'criado_em', valor: `${inicio}T00:00:00` },
        { metodo: 'lte', coluna: 'criado_em', valor: `${fim}T23:59:59` }
      ],
      { coluna: 'criado_em', ascending: false }
    );
  }

  function buscarCaixa(inicio, fim) {
    return buscarPaginado(
      'fluxo_caixa',
      'tipo,descricao,valor,data_movimento',
      [
        { metodo: 'eq', coluna: 'user_id', valor: DASH.userId },
        { metodo: 'gte', coluna: 'data_movimento', valor: inicio },
        { metodo: 'lte', coluna: 'data_movimento', valor: fim }
      ],
      { coluna: 'data_movimento', ascending: false }
    );
  }

  function resumoDados(orcamentos = DASH.orcamentos, caixa = DASH.caixa) {
    const aprovados = orcamentos.filter(item => tipoStatus(item.status) === 'aprovado');
    const recusados = orcamentos.filter(item => tipoStatus(item.status) === 'recusado');
    const pendentes = orcamentos.filter(item => tipoStatus(item.status) === 'pendente');
    const outros = orcamentos.filter(item => tipoStatus(item.status) === 'outro');
    const entradas = caixa.filter(item => normalizar(item.tipo) === 'entrada').reduce((soma, item) => soma + numero(item.valor), 0);
    const saidas = caixa.filter(item => normalizar(item.tipo) === 'saida').reduce((soma, item) => soma + numero(item.valor), 0);
    const valorAprovado = aprovados.reduce((soma, item) => soma + numero(item.total), 0);
    const decididos = aprovados.length + recusados.length;
    return {
      total: orcamentos.length,
      aprovados,
      recusados,
      pendentes,
      outros,
      entradas,
      saidas,
      saldo: entradas - saidas,
      valorAprovado,
      ticket: aprovados.length ? valorAprovado / aprovados.length : 0,
      taxaDecididos: decididos ? (aprovados.length / decididos) * 100 : 0,
      taxaTotal: orcamentos.length ? (aprovados.length / orcamentos.length) * 100 : 0
    };
  }

  function variacao(atual, anterior) {
    if (!anterior) return atual ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  }

  function textoVariacao(valor) {
    const arredondado = Math.round(valor);
    if (!arredondado) return 'sem variação';
    return `${arredondado > 0 ? '+' : ''}${arredondado}%`;
  }

  function renderMetricas() {
    const atual = resumoDados();
    const anterior = resumoDados(DASH.anterior.orcamentos, DASH.anterior.caixa);
    const valores = {
      'm-orcamentos': atual.total,
      'm-pendentes': atual.pendentes.length,
      'm-aprovados': atual.aprovados.length,
      'm-recusados': atual.recusados.length,
      'm-taxa': `${Math.round(atual.taxaDecididos)}%`,
      'm-taxa-total': `${Math.round(atual.taxaTotal)}%`,
      'm-total-aprovado': moeda(atual.valorAprovado),
      'm-ticket': moeda(atual.ticket),
      'm-entradas': moeda(atual.entradas),
      'm-saidas': moeda(atual.saidas),
      'm-saldo': moeda(atual.saldo)
    };
    Object.entries(valores).forEach(([id, valor]) => setTexto(id, valor));
    setTexto('v-orcamentos', textoVariacao(variacao(atual.total, anterior.total)));
    setTexto('v-aprovado', textoVariacao(variacao(atual.valorAprovado, anterior.valorAprovado)));
    setTexto('v-entradas', textoVariacao(variacao(atual.entradas, anterior.entradas)));
    setTexto('v-saldo', textoVariacao(variacao(atual.saldo, anterior.saldo)));
  }

  function chaveMes(valor) {
    const data = new Date(String(valor || '').includes('T') ? valor : `${valor}T00:00:00`);
    if (Number.isNaN(data.getTime())) return '';
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  }

  function labelMes(chave) {
    const [ano, mes] = chave.split('-');
    return `${mes}/${ano.slice(2)}`;
  }

  function renderGraficoMensal() {
    const aprovados = DASH.orcamentos.filter(item => tipoStatus(item.status) === 'aprovado');
    const mapa = {};
    aprovados.forEach(item => {
      const chave = chaveMes(item.criado_em);
      if (chave) mapa[chave] = (mapa[chave] || 0) + numero(item.total);
    });
    const lista = Object.entries(mapa).sort((a, b) => a[0].localeCompare(b[0]));
    if (!lista.length) {
      setHTML('grafico-mensal', '<div class="empty">Nenhum orçamento aprovado no período.</div>');
      return;
    }
    const maximo = Math.max(...lista.map(([, valor]) => valor), 1);
    setHTML('grafico-mensal', lista.map(([chave, valor]) => {
      const largura = Math.max(3, Math.round((valor / maximo) * 100));
      return `<div class="bar-row"><div class="bar-label">${escapar(labelMes(chave))}</div><div class="bar-track" role="img" aria-label="${escapar(labelMes(chave))}: ${escapar(moeda(valor))}"><div class="bar-fill" style="width:${largura}%"></div></div><div class="bar-value">${escapar(moeda(valor))}</div></div>`;
    }).join(''));
  }

  function agruparItens(tipo) {
    const mapa = {};
    DASH.orcamentos
      .filter(orcamento => tipoStatus(orcamento.status) === 'aprovado')
      .forEach(orcamento => {
        parseItens(orcamento.itens).forEach(item => {
          const tipoItem = normalizar(item.tipo);
          const ehMaoObra = ['mao_obra', 'mao de obra', 'servico', 'serviço'].includes(tipoItem);
          if ((tipo === 'mao_obra' && !ehMaoObra) || (tipo === 'produto' && ehMaoObra)) return;
          const descricao = String(item.descricao || item.nome || 'Item sem descrição').trim();
          const chave = normalizar(descricao);
          if (!mapa[chave]) mapa[chave] = { descricao, qtd: 0, valor: 0, usos: 0 };
          mapa[chave].qtd += numero(item.qtd ?? item.quantidade ?? 1);
          mapa[chave].valor += subtotalItem(item);
          mapa[chave].usos += 1;
        });
      });
    return Object.values(mapa).sort((a, b) => b.valor - a.valor || b.usos - a.usos).slice(0, 8);
  }

  function renderRanking(id, itens) {
    if (!itens.length) {
      setHTML(id, '<div class="empty">Sem itens aprovados suficientes no período.</div>');
      return;
    }
    setHTML(id, itens.map((item, indice) => `<div class="rank-item"><div><strong>${indice + 1}. ${escapar(item.descricao)}</strong><small>${item.usos} orçamento(s) aprovado(s) · qtd. ${numero(item.qtd).toLocaleString('pt-BR')}</small></div><strong>${escapar(moeda(item.valor))}</strong></div>`).join(''));
  }

  function renderFunil() {
    const resumo = resumoDados();
    const base = Math.max(resumo.total, 1);
    const etapas = [
      ['Criados', resumo.total],
      ['Pendentes', resumo.pendentes.length],
      ['Aprovados', resumo.aprovados.length],
      ['Recusados', resumo.recusados.length]
    ];
    setHTML('funil-orcamentos', etapas.map(([label, valor]) => `<div class="funil-item"><div><span>${escapar(label)}</span><strong>${valor}</strong></div><div class="funil-track"><div class="funil-fill" style="width:${Math.round((valor / base) * 100)}%"></div></div></div>`).join(''));
  }

  function renderResumoTexto() {
    const resumo = resumoDados();
    let texto;
    if (!resumo.total && !DASH.caixa.length) {
      texto = 'Ainda não há dados neste período. Crie orçamentos e registre movimentações no caixa para alimentar os relatórios.';
    } else if (resumo.aprovados.length) {
      texto = `${resumo.aprovados.length} orçamento(s) aprovado(s), somando ${moeda(resumo.valorAprovado)} em propostas aprovadas. Esse valor não representa necessariamente dinheiro recebido. As entradas efetivas do caixa foram ${moeda(resumo.entradas)}.`;
    } else {
      texto = `Foram encontrados ${resumo.total} orçamento(s), mas nenhum aprovado. Há ${resumo.pendentes.length} proposta(s) pendente(s) para acompanhamento comercial.`;
    }
    if (resumo.outros.length) texto += ` ${resumo.outros.length} orçamento(s) possuem status não classificado e ficaram fora do funil principal.`;
    setTexto('resumo-relatorio', texto);
  }

  function classeStatus(valor) {
    return `status status-${tipoStatus(valor)}`;
  }

  function renderTabelas() {
    if (!DASH.orcamentos.length) {
      setHTML('lista-orcamentos-relatorio', '<div class="empty">Nenhum orçamento no período.</div>');
    } else {
      setHTML('lista-orcamentos-relatorio', `<table class="table"><thead><tr><th>Data</th><th>Cliente</th><th>Status</th><th>Total</th></tr></thead><tbody>${DASH.orcamentos.slice(0, 20).map(item => `<tr><td data-label="Data">${dataBR(item.criado_em)}</td><td data-label="Cliente">${escapar(item.cliente_nome || '—')}</td><td data-label="Status"><span class="${classeStatus(item.status)}">${escapar(item.status || 'pendente')}</span></td><td data-label="Total">${escapar(moeda(item.total))}</td></tr>`).join('')}</tbody></table>`);
    }

    if (!DASH.caixa.length) {
      setHTML('lista-caixa-relatorio', '<div class="empty">Nenhum lançamento no período.</div>');
    } else {
      setHTML('lista-caixa-relatorio', `<table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>${DASH.caixa.slice(0, 20).map(item => `<tr><td data-label="Data">${dataBR(item.data_movimento)}</td><td data-label="Tipo">${escapar(item.tipo || '—')}</td><td data-label="Descrição">${escapar(item.descricao || '—')}</td><td data-label="Valor">${escapar(moeda(item.valor))}</td></tr>`).join('')}</tbody></table>`);
    }
  }

  function renderTudo() {
    renderMetricas();
    renderGraficoMensal();
    renderRanking('ranking-mao-obra', agruparItens('mao_obra'));
    renderRanking('ranking-produtos', agruparItens('produto'));
    renderFunil();
    renderResumoTexto();
    renderTabelas();
  }

  async function carregarDashboardFS() {
    if (DASH.carregando) return;
    limparErro();
    try {
      const { inicio, fim } = intervaloAtual();
      validarIntervalo(inicio, fim);
      const anterior = intervaloAnterior(inicio, fim);
      definirCarregando(true);
      const [orcamentos, caixa, orcamentosAnteriores, caixaAnterior] = await Promise.all([
        buscarOrcamentos(inicio, fim),
        buscarCaixa(inicio, fim),
        buscarOrcamentos(anterior.inicio, anterior.fim),
        buscarCaixa(anterior.inicio, anterior.fim)
      ]);
      DASH.orcamentos = orcamentos;
      DASH.caixa = caixa;
      DASH.anterior = { orcamentos: orcamentosAnteriores, caixa: caixaAnterior };
      renderTudo();
      setTexto('periodo-comparacao', `Comparado com ${dataBR(anterior.inicio)} a ${dataBR(anterior.fim)}`);
    } catch (erro) {
      console.error('Falha ao carregar relatórios:', erro);
      mostrarErro(erro?.message || 'Não foi possível carregar os relatórios. Tente novamente.');
      setTexto('status-relatorio', 'Falha na atualização');
    } finally {
      definirCarregando(false);
    }
  }

  function aplicarPeriodo(dias) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - dias + 1);
    $('dash-inicio').value = dataLocalISO(inicio);
    $('dash-fim').value = dataLocalISO(fim);
    carregarDashboardFS();
  }

  function aplicarMesAtual() {
    const hoje = new Date();
    $('dash-inicio').value = dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    $('dash-fim').value = dataLocalISO(hoje);
    carregarDashboardFS();
  }

  function csvValor(valor) {
    return `"${String(valor ?? '').replace(/"/g, '""')}"`;
  }

  function baixarCSV() {
    if (!DASH.orcamentos.length && !DASH.caixa.length) {
      mostrarErro('Não há dados para exportar no período selecionado.');
      return;
    }
    const linhas = [['TIPO', 'DATA', 'DESCRIÇÃO/CLIENTE', 'STATUS', 'VALOR']];
    DASH.orcamentos.forEach(item => linhas.push(['Orçamento', dataBR(item.criado_em), item.cliente_nome || '', item.status || 'pendente', numero(item.total).toFixed(2).replace('.', ',')]));
    DASH.caixa.forEach(item => linhas.push(['Caixa', dataBR(item.data_movimento), item.descricao || '', item.tipo || '', numero(item.valor).toFixed(2).replace('.', ',')]));
    const conteudo = '\ufeff' + linhas.map(linha => linha.map(csvValor).join(';')).join('\n');
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-fs-${$('dash-inicio').value}-a-${$('dash-fim').value}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function registrarEventos() {
    $('btn-buscar')?.addEventListener('click', carregarDashboardFS);
    $('btn-atualizar')?.addEventListener('click', carregarDashboardFS);
    $('btn-exportar')?.addEventListener('click', baixarCSV);
    document.querySelectorAll('[data-periodo]').forEach(botao => {
      botao.addEventListener('click', () => {
        const periodo = botao.dataset.periodo;
        if (periodo === 'mes') aplicarMesAtual();
        else aplicarPeriodo(Number(periodo));
      });
    });
  }

  async function iniciarDashboardFS() {
    registrarEventos();
    try {
      if (!window._supabase) throw new Error('Serviço de dados indisponível.');
      const { data: { session }, error } = await _supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user?.id) {
        location.href = '/index.html?login=1';
        return;
      }
      DASH.userId = session.user.id;
      const premium = await validarPremium(DASH.userId);
      if (!premium) {
        mostrarBloqueioPremium();
        return;
      }
      mostrarConteudo();
      aplicarPeriodo(90);
    } catch (erro) {
      console.error('Falha ao iniciar relatórios:', erro);
      mostrarConteudo();
      mostrarErro(erro?.message || 'Não foi possível iniciar os relatórios.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarDashboardFS);
  else iniciarDashboardFS();

  window.carregarDashboardFS = carregarDashboardFS;
})();