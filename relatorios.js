/* =========================================================
   FS ORÇAMENTOS - relatorios.js
   Relatórios Premium leve e seguro para iframe.
   A página abre sem consulta automática pesada.
   ========================================================= */

let usuarioLogadoRelatorios = null;
let ordensRelatorioCache = [];
let itensRelatorioCache = [];
let fsRelatoriosInicializado = false;
let fsRelatoriosCarregando = false;

const FS_RELATORIOS_TIMEOUT_MS = 8000;
const FS_RELATORIOS_TIMEOUT_SESSAO_MS = 3500;
const FS_RELATORIOS_LIMITE_ORDENS = 120;
const FS_RELATORIOS_LIMITE_ITENS = 350;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarRelatoriosPremium);
} else {
  iniciarRelatoriosPremium();
}

function iniciarRelatoriosPremium() {
  if (fsRelatoriosInicializado) return;
  fsRelatoriosInicializado = true;

  try {
    garantirSupabaseRelatorios();
    configurarEventosRelatorios();
    aplicarPeriodoMesAtualRelatorios();
    limparCachesRelatorios();
    renderizarResumoRelatorios();
    renderizarRankingsRelatorios();
    mostrarMensagemRelatorios('Relatório pronto. Clique em Atualizar relatório para carregar os dados do período.', 'info');
    notificarAlturaRelatorios();
    setTimeout(verificarSessaoInicialRelatorios, 100);
  } catch (erro) {
    console.error('Erro ao iniciar relatórios:', erro);
    mostrarMensagemRelatorios('Erro ao iniciar os relatórios. Atualize a página e tente novamente.', 'erro');
    notificarAlturaRelatorios();
  }
}

function garantirSupabaseRelatorios() {
  if (window._supabase) return true;

  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    window._supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return true;
  }

  throw new Error('Supabase não inicializado. Verifique config.js.');
}

async function verificarSessaoInicialRelatorios() {
  try {
    const session = await obterSessaoAtualRelatorios(false);
    if (!session?.user?.id) {
      usuarioLogadoRelatorios = null;
      mostrarMensagemRelatorios('Faça login para carregar seus relatórios. Se você já está logado, toque em Atualizar relatório.', 'info');
      notificarAlturaRelatorios();
      return;
    }

    usuarioLogadoRelatorios = session.user;
    mostrarMensagemRelatorios('Relatório pronto para consulta. Toque em Atualizar relatório para buscar os dados.', 'info');
    notificarAlturaRelatorios();
  } catch (erro) {
    console.warn('Falha ao verificar sessão dos relatórios:', erro);
    notificarAlturaRelatorios();
  }
}

function configurarEventosRelatorios() {
  const btnAtualizar = document.getElementById('btn-atualizar-relatorios');
  if (btnAtualizar && btnAtualizar.dataset.configurado !== 'sim') {
    btnAtualizar.dataset.configurado = 'sim';
    btnAtualizar.addEventListener('click', carregarRelatoriosPremium);
  }
}

function aplicarPeriodoMesAtualRelatorios() {
  const inicio = document.getElementById('relatorio-data-inicio');
  const fim = document.getElementById('relatorio-data-fim');
  const hoje = new Date();
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  if (inicio && !inicio.value) inicio.value = dataParaInputRelatorios(primeiro);
  if (fim && !fim.value) fim.value = dataParaInputRelatorios(ultimo);
}

async function carregarRelatoriosPremium() {
  if (fsRelatoriosCarregando) return;
  fsRelatoriosCarregando = true;
  alterarEstadoBotaoRelatorios(true);

  try {
    limparMensagemRelatorios();
    garantirSupabaseRelatorios();

    const session = usuarioLogadoRelatorios?.id
      ? { user: usuarioLogadoRelatorios }
      : await obterSessaoAtualRelatorios(true);

    if (!session?.user?.id) {
      mostrarMensagemRelatorios('Você precisa estar logado para carregar os relatórios.', 'erro');
      return;
    }

    usuarioLogadoRelatorios = session.user;

    const periodo = obterPeriodoRelatorios();
    if (periodo.inicio && periodo.fim && periodo.inicio > periodo.fim) {
      mostrarMensagemRelatorios('A data inicial não pode ser maior que a data final.', 'erro');
      return;
    }

    mostrarMensagemRelatorios('Carregando dados do período...', 'info');
    notificarAlturaRelatorios();

    await carregarOrdensRelatorio(periodo);
    await carregarItensRelatorio();
    renderizarResumoRelatorios();
    renderizarRankingsRelatorios();

    if (!ordensRelatorioCache.length) {
      mostrarMensagemRelatorios('Nenhuma ordem de serviço encontrada no período selecionado.', 'info');
    } else {
      limparMensagemRelatorios();
    }
  } catch (erro) {
    console.error('Erro ao carregar relatórios:', erro);
    mostrarMensagemRelatorios('Erro ao carregar relatórios. Tente reduzir o período consultado.', 'erro');
    limparCachesRelatorios();
    renderizarResumoRelatorios();
    renderizarRankingsRelatorios();
  } finally {
    fsRelatoriosCarregando = false;
    alterarEstadoBotaoRelatorios(false);
    notificarAlturaRelatorios();
  }
}

async function obterSessaoAtualRelatorios(mostrarErro = false) {
  if (!window._supabase?.auth?.getSession) return null;

  const resposta = await executarComTimeoutRelatorios(
    window._supabase.auth.getSession(),
    FS_RELATORIOS_TIMEOUT_SESSAO_MS,
    { data: { session: null }, error: new Error('Tempo excedido ao obter sessão') }
  );

  const { data, error } = resposta || {};
  if (error && mostrarErro) console.warn('Erro ao obter sessão:', error);
  return data?.session || null;
}

function executarComTimeoutRelatorios(promessa, tempoMs = FS_RELATORIOS_TIMEOUT_MS, retornoTimeout = null) {
  let timer;
  return Promise.race([
    Promise.resolve(promessa),
    new Promise((resolve) => { timer = setTimeout(() => resolve(retornoTimeout), tempoMs); })
  ]).finally(() => clearTimeout(timer));
}

function obterPeriodoRelatorios() {
  const inicio = valorInputRelatorios('relatorio-data-inicio');
  const fim = valorInputRelatorios('relatorio-data-fim');
  return {
    inicio,
    fim,
    inicioISO: inicio ? `${inicio}T00:00:00` : '',
    fimISO: fim ? `${fim}T23:59:59` : ''
  };
}

async function carregarOrdensRelatorio(periodo) {
  ordensRelatorioCache = [];

  let query = window._supabase
    .from('ordens_servico')
    .select('*')
    .eq('user_id', usuarioLogadoRelatorios.id)
    .order('created_at', { ascending: false })
    .limit(FS_RELATORIOS_LIMITE_ORDENS);

  if (periodo.inicioISO) query = query.gte('created_at', periodo.inicioISO);
  if (periodo.fimISO) query = query.lte('created_at', periodo.fimISO);

  const resposta = await executarComTimeoutRelatorios(query, FS_RELATORIOS_TIMEOUT_MS, {
    data: [],
    error: new Error('Tempo excedido na consulta de OS')
  });

  if (resposta?.error) {
    console.warn('Erro ao carregar OS para relatório:', resposta.error);
    mostrarMensagemRelatorios('Não foi possível carregar as ordens de serviço para o relatório.', 'erro');
    ordensRelatorioCache = [];
    return;
  }

  ordensRelatorioCache = Array.isArray(resposta?.data) ? resposta.data : [];
  await enriquecerOrdensRelatorioComClientesEVeiculos();
}

async function enriquecerOrdensRelatorioComClientesEVeiculos() {
  if (!ordensRelatorioCache.length) return;

  const idsClientes = [...new Set(ordensRelatorioCache.map(ordem => ordem.cliente_id).filter(Boolean))].slice(0, FS_RELATORIOS_LIMITE_ORDENS);
  const idsVeiculos = [...new Set(ordensRelatorioCache.map(ordem => ordem.veiculo_id).filter(Boolean))].slice(0, FS_RELATORIOS_LIMITE_ORDENS);
  const mapaClientes = new Map();
  const mapaVeiculos = new Map();

  if (idsClientes.length) {
    const respostaClientes = await executarComTimeoutRelatorios(
      window._supabase.from('clientes').select('id, nome, numero_cliente, whatsapp, email').eq('user_id', usuarioLogadoRelatorios.id).in('id', idsClientes),
      FS_RELATORIOS_TIMEOUT_MS,
      { data: [], error: null }
    );
    if (!respostaClientes?.error && Array.isArray(respostaClientes?.data)) {
      respostaClientes.data.forEach(cliente => mapaClientes.set(cliente.id, cliente));
    }
  }

  if (idsVeiculos.length) {
    const respostaVeiculos = await executarComTimeoutRelatorios(
      window._supabase.from('veiculos').select('id, placa, marca, modelo, cor, prisma, ano').eq('user_id', usuarioLogadoRelatorios.id).in('id', idsVeiculos),
      FS_RELATORIOS_TIMEOUT_MS,
      { data: [], error: null }
    );
    if (!respostaVeiculos?.error && Array.isArray(respostaVeiculos?.data)) {
      respostaVeiculos.data.forEach(veiculo => mapaVeiculos.set(veiculo.id, veiculo));
    }
  }

  ordensRelatorioCache = ordensRelatorioCache.map(ordem => ({
    ...ordem,
    clientes: mapaClientes.get(ordem.cliente_id) || null,
    veiculos: mapaVeiculos.get(ordem.veiculo_id) || null
  }));
}

async function carregarItensRelatorio() {
  itensRelatorioCache = [];
  const ids = ordensRelatorioCache.map((ordem) => ordem.id).filter(Boolean);
  if (!ids.length) return;

  const resposta = await executarComTimeoutRelatorios(
    window._supabase.from('ordem_servico_itens').select('*').eq('user_id', usuarioLogadoRelatorios.id).in('ordem_servico_id', ids).limit(FS_RELATORIOS_LIMITE_ITENS),
    FS_RELATORIOS_TIMEOUT_MS,
    { data: [], error: null }
  );

  if (resposta?.error) {
    console.warn('Não foi possível carregar itens para relatório:', resposta.error);
    itensRelatorioCache = [];
    return;
  }

  itensRelatorioCache = Array.isArray(resposta?.data) ? resposta.data : [];
  await enriquecerItensRelatorioComProdutos();
}

async function enriquecerItensRelatorioComProdutos() {
  const idsProdutos = [...new Set(itensRelatorioCache.map(item => item.produto_estoque_id).filter(Boolean))].slice(0, FS_RELATORIOS_LIMITE_ITENS);
  if (!idsProdutos.length) return;

  const resposta = await executarComTimeoutRelatorios(
    window._supabase.from('produtos_estoque').select('id, nome, codigo, categoria, unidade').eq('user_id', usuarioLogadoRelatorios.id).in('id', idsProdutos),
    FS_RELATORIOS_TIMEOUT_MS,
    { data: [], error: null }
  );

  if (resposta?.error || !Array.isArray(resposta?.data)) return;
  const mapa = new Map(resposta.data.map(produto => [produto.id, produto]));
  itensRelatorioCache = itensRelatorioCache.map(item => ({ ...item, produtos_estoque: mapa.get(item.produto_estoque_id) || null }));
}

function limparCachesRelatorios() {
  ordensRelatorioCache = [];
  itensRelatorioCache = [];
}

function renderizarResumoRelatorios() {
  const concluidas = ordensRelatorioCache.filter((ordem) => {
    const status = normalizarTextoRelatorios(ordem.status);
    return status === 'concluida' || status === 'concluido' || status === 'finalizada' || status === 'finalizado';
  });
  const base = concluidas.length ? concluidas : ordensRelatorioCache;
  const faturamento = base.reduce((soma, ordem) => soma + converterNumeroRelatorios(ordem.valor_total), 0);
  const saldoPendente = base.reduce((soma, ordem) => soma + converterNumeroRelatorios(ordem.saldo_restante), 0);
  const ticketMedio = base.length ? faturamento / base.length : 0;

  setTextoRelatorios('relatorio-faturamento', formatarMoedaRelatorios(faturamento));
  setTextoRelatorios('relatorio-os-concluidas', String(concluidas.length));
  setTextoRelatorios('relatorio-ticket-medio', formatarMoedaRelatorios(ticketMedio));
  setTextoRelatorios('relatorio-pendente', formatarMoedaRelatorios(saldoPendente));
}

function renderizarRankingsRelatorios() {
  renderizarRankingGenerico('ranking-servicos', agruparItensRelatorios('servico'), 'Nenhum serviço encontrado no período.');
  renderizarRankingGenerico('ranking-produtos', agruparItensRelatorios('produto'), 'Nenhum produto encontrado no período.');
  renderizarRankingGenerico('ranking-clientes', agruparOrdensPorClienteRelatorios(), 'Nenhum cliente encontrado no período.');
  renderizarRankingGenerico('ranking-veiculos', agruparOrdensPorVeiculoRelatorios(), 'Nenhum veículo encontrado no período.');
}

function agruparItensRelatorios(tipoDesejado) {
  const mapa = new Map();
  itensRelatorioCache.forEach((item) => {
    const tipo = normalizarTextoRelatorios(item.tipo || item.categoria || '');
    const ehProduto = tipo.includes('produto') || tipo.includes('peca') || item.produto_estoque_id;
    if (tipoDesejado === 'produto' && !ehProduto) return;
    if (tipoDesejado === 'servico' && ehProduto) return;

    const produto = item.produtos_estoque;
    const titulo = produto?.nome || item.descricao || item.nome || item.titulo || (tipoDesejado === 'produto' ? 'Produto sem descrição' : 'Serviço sem descrição');
    const chave = normalizarTextoRelatorios(titulo);
    if (!mapa.has(chave)) mapa.set(chave, { titulo, quantidade: 0, valor: 0, detalhe: produto?.codigo ? `Código: ${produto.codigo}` : '' });
    const atual = mapa.get(chave);
    atual.quantidade += converterNumeroRelatorios(item.quantidade) || 1;
    atual.valor += converterNumeroRelatorios(item.valor_total || item.subtotal || item.valor_unitario);
  });
  return ordenarRankingRelatorios([...mapa.values()]);
}

function agruparOrdensPorClienteRelatorios() {
  const mapa = new Map();
  ordensRelatorioCache.forEach((ordem) => {
    const cliente = ordem.clientes;
    const nome = cliente?.nome || ordem.cliente_nome || 'Cliente sem cadastro';
    const numero = formatarNumeroClienteRelatorios(cliente?.numero_cliente);
    const chave = ordem.cliente_id || normalizarTextoRelatorios(nome);
    if (!mapa.has(chave)) mapa.set(chave, { titulo: nome, quantidade: 0, valor: 0, detalhe: numero ? `ID: ${numero}` : '' });
    const atual = mapa.get(chave);
    atual.quantidade += 1;
    atual.valor += converterNumeroRelatorios(ordem.valor_total);
  });
  return ordenarRankingRelatorios([...mapa.values()]);
}

function agruparOrdensPorVeiculoRelatorios() {
  const mapa = new Map();
  ordensRelatorioCache.forEach((ordem) => {
    const veiculo = ordem.veiculos;
    if (!veiculo && !ordem.veiculo_id) return;
    const titulo = veiculo ? formatarVeiculoRelatorios(veiculo) : 'Veículo sem dados carregados';
    const chave = ordem.veiculo_id || normalizarTextoRelatorios(titulo);
    if (!mapa.has(chave)) mapa.set(chave, { titulo, quantidade: 0, valor: 0, detalhe: veiculo?.placa ? `Placa: ${String(veiculo.placa).toUpperCase()}` : '' });
    const atual = mapa.get(chave);
    atual.quantidade += 1;
    atual.valor += converterNumeroRelatorios(ordem.valor_total);
  });
  return ordenarRankingRelatorios([...mapa.values()]);
}

function ordenarRankingRelatorios(lista) {
  return lista.sort((a, b) => b.valor !== a.valor ? b.valor - a.valor : b.quantidade - a.quantidade).slice(0, 8);
}

function renderizarRankingGenerico(id, lista, vazio) {
  const container = document.getElementById(id);
  if (!container) return;
  if (!lista.length) {
    container.innerHTML = `<div class="estado-vazio">${escaparHtmlRelatorios(vazio)}</div>`;
    return;
  }
  container.innerHTML = lista.map((item, index) => {
    const detalhe = [item.detalhe || '', `Qtd: ${formatarQuantidadeRelatorios(item.quantidade)}`].filter(Boolean).join(' • ');
    return `<div class="ranking-item"><div><strong>${index + 1}. ${escaparHtmlRelatorios(item.titulo)}</strong><span>${escaparHtmlRelatorios(detalhe)}</span></div><div class="ranking-valor">${formatarMoedaRelatorios(item.valor)}</div></div>`;
  }).join('');
}

function alterarEstadoBotaoRelatorios(carregando) {
  const btn = document.getElementById('btn-atualizar-relatorios');
  if (!btn) return;
  btn.disabled = Boolean(carregando);
  btn.textContent = carregando ? 'Carregando...' : 'Atualizar relatório';
}

function notificarAlturaRelatorios() {
  requestAnimationFrame(() => {
    try {
      const altura = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0, 700);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ tipo: 'fs-ajustar-iframe', altura }, window.location.origin);
        window.parent.postMessage({ tipo: 'fs-modulo-pronto', altura }, window.location.origin);
      }
    } catch (_) {}
  });
}

function formatarVeiculoRelatorios(veiculo) {
  if (!veiculo) return '';
  const placa = veiculo.placa ? String(veiculo.placa).toUpperCase() : 'Sem placa';
  const modelo = [veiculo.marca, veiculo.modelo].filter(Boolean).join(' ');
  const cor = veiculo.cor ? ` - ${veiculo.cor}` : '';
  const ano = veiculo.ano ? ` - ${veiculo.ano}` : '';
  return `${placa}${modelo ? ` - ${modelo}` : ''}${cor}${ano}`;
}

function formatarNumeroClienteRelatorios(numero) {
  if (!numero && numero !== 0) return '';
  const valor = Number(numero);
  if (Number.isFinite(valor)) return `CLI-${String(valor).padStart(6, '0')}`;
  return String(numero);
}

function valorInputRelatorios(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === 'string' ? el.value.trim() : '';
}

function setTextoRelatorios(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function mostrarMensagemRelatorios(texto, tipo = 'info') {
  const el = document.getElementById('mensagem-relatorios');
  if (!el) return;
  el.className = `mensagem ${tipo}`;
  el.textContent = texto;
}

function limparMensagemRelatorios() {
  const el = document.getElementById('mensagem-relatorios');
  if (!el) return;
  el.className = 'mensagem';
  el.textContent = '';
}

function dataParaInputRelatorios(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function converterNumeroRelatorios(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  let texto = String(valor).trim().replace(/[^\d.,-]/g, '');
  if (!texto) return 0;
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarMoedaRelatorios(valor) {
  return converterNumeroRelatorios(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarQuantidadeRelatorios(valor) {
  const numero = converterNumeroRelatorios(valor);
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace('.', ',');
}

function normalizarTextoRelatorios(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escaparHtmlRelatorios(valor) {
  return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

window.addEventListener('load', notificarAlturaRelatorios);
window.addEventListener('resize', notificarAlturaRelatorios);
