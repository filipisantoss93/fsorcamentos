/* =========================================================
   FS ORÇAMENTOS - relatorios.js
   Relatórios Premium por período, com fallbacks para evitar travamento.
   ========================================================= */

let usuarioLogadoRelatorios = null;
let ordensRelatorioCache = [];
let itensRelatorioCache = [];
let fsRelatoriosInicializado = false;
let fsRelatoriosCarregando = false;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarRelatoriosPremium);
} else {
  iniciarRelatoriosPremium();
}

async function iniciarRelatoriosPremium() {
  if (fsRelatoriosInicializado) return;
  fsRelatoriosInicializado = true;
  await inicializarRelatoriosPremium();
}

async function inicializarRelatoriosPremium() {
  try {
    garantirSupabaseRelatorios();

    if (typeof bloquearPaginaSeNaoPremiumAsync === "function") {
      const bloqueado = await bloquearPaginaSeNaoPremiumAsync(
        "Relatórios mensais por serviço, faturamento, clientes e veículos fazem parte do Plano Premium."
      );
      if (bloqueado) return;
    }

    const session = await obterSessaoAtualRelatorios();

    if (!session) {
      redirecionarParaLoginRelatorios();
      return;
    }

    usuarioLogadoRelatorios = session.user;
    configurarEventosRelatorios();
    aplicarPeriodoMesAtualRelatorios();
    prepararRankingsVaziosRelatorios();

    await carregarRelatoriosPremium();
  } catch (erro) {
    console.error("Erro ao iniciar relatórios:", erro);
    mostrarMensagemRelatorios("Erro ao iniciar os relatórios Premium.", "erro");
    notificarAlturaRelatorios();
  }
}

function garantirSupabaseRelatorios() {
  if (window._supabase) return;

  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    window._supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    return;
  }

  throw new Error("Supabase não inicializado. Verifique config.js.");
}

async function obterSessaoAtualRelatorios() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data?.session || null;
}

function redirecionarParaLoginRelatorios() {
  const embed = new URLSearchParams(location.search).get("embed") === "1";
  const destino = encodeURIComponent(embed ? "gestao.html#relatorios" : "relatorios.html");
  window.top.location.href = "index.html?redirect=" + destino;
}

function configurarEventosRelatorios() {
  const btnAtualizar = document.getElementById("btn-atualizar-relatorios");

  if (btnAtualizar && btnAtualizar.dataset.configurado !== "sim") {
    btnAtualizar.dataset.configurado = "sim";
    btnAtualizar.addEventListener("click", carregarRelatoriosPremium);
  }
}

function aplicarPeriodoMesAtualRelatorios() {
  const inicio = document.getElementById("relatorio-data-inicio");
  const fim = document.getElementById("relatorio-data-fim");

  const hoje = new Date();
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  if (inicio && !inicio.value) inicio.value = dataParaInputRelatorios(primeiro);
  if (fim && !fim.value) fim.value = dataParaInputRelatorios(ultimo);
}

function prepararRankingsVaziosRelatorios() {
  [
    ["ranking-servicos", "Carregando serviços..."],
    ["ranking-produtos", "Carregando produtos..."],
    ["ranking-clientes", "Carregando clientes..."],
    ["ranking-veiculos", "Carregando veículos..."]
  ].forEach(([id, texto]) => {
    const el = document.getElementById(id);
    if (el && !el.innerHTML.trim()) el.innerHTML = `<div class="estado-vazio">${escaparHtmlRelatorios(texto)}</div>`;
  });
}

async function carregarRelatoriosPremium() {
  if (fsRelatoriosCarregando) return;
  fsRelatoriosCarregando = true;
  alterarEstadoBotaoRelatorios(true);

  try {
    limparMensagemRelatorios();

    if (!usuarioLogadoRelatorios?.id) {
      const session = await obterSessaoAtualRelatorios();
      if (!session) {
        redirecionarParaLoginRelatorios();
        return;
      }
      usuarioLogadoRelatorios = session.user;
    }

    const periodo = obterPeriodoRelatorios();

    if (periodo.inicio && periodo.fim && periodo.inicio > periodo.fim) {
      mostrarMensagemRelatorios("A data inicial não pode ser maior que a data final.", "erro");
      return;
    }

    await carregarOrdensRelatorio(periodo);
    await carregarItensRelatorio();

    renderizarResumoRelatorios();
    renderizarRankingsRelatorios();

    if (!ordensRelatorioCache.length) {
      mostrarMensagemRelatorios("Nenhuma ordem de serviço encontrada no período selecionado.", "info");
    }
  } catch (erro) {
    console.error("Erro ao carregar relatórios:", erro);
    mostrarMensagemRelatorios("Erro ao carregar relatórios Premium.", "erro");
    ordensRelatorioCache = [];
    itensRelatorioCache = [];
    renderizarResumoRelatorios();
    renderizarRankingsRelatorios();
  } finally {
    fsRelatoriosCarregando = false;
    alterarEstadoBotaoRelatorios(false);
    notificarAlturaRelatorios();
  }
}

function obterPeriodoRelatorios() {
  const inicio = valorInputRelatorios("relatorio-data-inicio");
  const fim = valorInputRelatorios("relatorio-data-fim");

  return {
    inicio,
    fim,
    inicioISO: inicio ? `${inicio}T00:00:00` : "",
    fimISO: fim ? `${fim}T23:59:59` : ""
  };
}

async function carregarOrdensRelatorio(periodo) {
  ordensRelatorioCache = [];

  let query = criarQueryOrdensRelatorios(true)
    .eq("user_id", usuarioLogadoRelatorios.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (periodo.inicioISO) query = query.gte("data_conclusao", periodo.inicioISO);
  if (periodo.fimISO) query = query.lte("data_conclusao", periodo.fimISO);

  let { data, error } = await query;

  if (error) {
    console.warn("Consulta com relações/data_conclusao falhou. Tentando fallback simples:", error);
    let fallback = criarQueryOrdensRelatorios(false)
      .eq("user_id", usuarioLogadoRelatorios.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (periodo.inicioISO) fallback = fallback.gte("created_at", periodo.inicioISO);
    if (periodo.fimISO) fallback = fallback.lte("created_at", periodo.fimISO);

    const fb = await fallback;
    data = fb.data;
    error = fb.error;
  }

  if (error) {
    console.error("Erro ao carregar OS para relatório:", error);
    mostrarMensagemRelatorios("Não foi possível carregar as ordens de serviço para o relatório.", "erro");
    ordensRelatorioCache = [];
    return;
  }

  ordensRelatorioCache = Array.isArray(data) ? data : [];
  await enriquecerOrdensRelatorioComClientesEVeiculos();
}

function criarQueryOrdensRelatorios(comRelacoes) {
  if (!comRelacoes) return window._supabase.from("ordens_servico").select("*");

  return window._supabase
    .from("ordens_servico")
    .select(`
      *,
      clientes (
        id,
        nome,
        numero_cliente,
        whatsapp,
        email
      ),
      veiculos (
        id,
        placa,
        marca,
        modelo,
        cor,
        prisma,
        ano
      )
    `);
}

async function enriquecerOrdensRelatorioComClientesEVeiculos() {
  if (!ordensRelatorioCache.length) return;

  const idsClientes = [...new Set(ordensRelatorioCache.map(ordem => ordem.cliente_id).filter(Boolean))];
  const idsVeiculos = [...new Set(ordensRelatorioCache.map(ordem => ordem.veiculo_id).filter(Boolean))];

  const mapaClientes = new Map();
  const mapaVeiculos = new Map();

  if (idsClientes.length) {
    try {
      const { data, error } = await window._supabase
        .from("clientes")
        .select("id, nome, numero_cliente, whatsapp, email")
        .eq("user_id", usuarioLogadoRelatorios.id)
        .in("id", idsClientes);

      if (!error && Array.isArray(data)) data.forEach(cliente => mapaClientes.set(cliente.id, cliente));
    } catch (erro) {
      console.warn("Não foi possível enriquecer clientes do relatório:", erro);
    }
  }

  if (idsVeiculos.length) {
    try {
      const { data, error } = await window._supabase
        .from("veiculos")
        .select("id, placa, marca, modelo, cor, prisma, ano")
        .eq("user_id", usuarioLogadoRelatorios.id)
        .in("id", idsVeiculos);

      if (!error && Array.isArray(data)) data.forEach(veiculo => mapaVeiculos.set(veiculo.id, veiculo));
    } catch (erro) {
      console.warn("Não foi possível enriquecer veículos do relatório:", erro);
    }
  }

  ordensRelatorioCache = ordensRelatorioCache.map(ordem => ({
    ...ordem,
    clientes: ordem.clientes || mapaClientes.get(ordem.cliente_id) || null,
    veiculos: ordem.veiculos || mapaVeiculos.get(ordem.veiculo_id) || null
  }));
}

async function carregarItensRelatorio() {
  itensRelatorioCache = [];

  const ids = ordensRelatorioCache.map((ordem) => ordem.id).filter(Boolean);
  if (!ids.length) return;

  let { data, error } = await window._supabase
    .from("ordem_servico_itens")
    .select(`
      *,
      produtos_estoque (
        id,
        nome,
        codigo,
        categoria,
        unidade
      )
    `)
    .eq("user_id", usuarioLogadoRelatorios.id)
    .in("ordem_servico_id", ids)
    .limit(1000);

  if (error) {
    console.warn("Consulta de itens com produto relacionado falhou. Tentando fallback simples:", error);
    const fb = await window._supabase
      .from("ordem_servico_itens")
      .select("*")
      .eq("user_id", usuarioLogadoRelatorios.id)
      .in("ordem_servico_id", ids)
      .limit(1000);
    data = fb.data;
    error = fb.error;
  }

  if (error) {
    console.warn("Não foi possível carregar itens para relatório:", error);
    itensRelatorioCache = [];
    return;
  }

  itensRelatorioCache = Array.isArray(data) ? data : [];
  await enriquecerItensRelatorioComProdutos();
}

async function enriquecerItensRelatorioComProdutos() {
  const idsProdutos = [...new Set(itensRelatorioCache.map(item => item.produto_estoque_id).filter(Boolean))];
  if (!idsProdutos.length) return;

  const jaTemProduto = itensRelatorioCache.some(item => item.produtos_estoque);
  if (jaTemProduto) return;

  try {
    const { data, error } = await window._supabase
      .from("produtos_estoque")
      .select("id, nome, codigo, categoria, unidade")
      .eq("user_id", usuarioLogadoRelatorios.id)
      .in("id", idsProdutos);

    if (error || !Array.isArray(data)) return;
    const mapa = new Map(data.map(produto => [produto.id, produto]));
    itensRelatorioCache = itensRelatorioCache.map(item => ({
      ...item,
      produtos_estoque: mapa.get(item.produto_estoque_id) || null
    }));
  } catch (erro) {
    console.warn("Não foi possível enriquecer produtos do relatório:", erro);
  }
}

function renderizarResumoRelatorios() {
  const concluidas = ordensRelatorioCache.filter((ordem) => {
    return normalizarTextoRelatorios(ordem.status) === "concluida";
  });

  const base = concluidas.length ? concluidas : ordensRelatorioCache;

  const faturamento = base.reduce((soma, ordem) => soma + converterNumeroRelatorios(ordem.valor_total), 0);
  const saldoPendente = base.reduce((soma, ordem) => soma + converterNumeroRelatorios(ordem.saldo_restante), 0);
  const ticketMedio = base.length ? faturamento / base.length : 0;

  setTextoRelatorios("relatorio-faturamento", formatarMoedaRelatorios(faturamento));
  setTextoRelatorios("relatorio-os-concluidas", concluidas.length);
  setTextoRelatorios("relatorio-ticket-medio", formatarMoedaRelatorios(ticketMedio));
  setTextoRelatorios("relatorio-pendente", formatarMoedaRelatorios(saldoPendente));
}

function renderizarRankingsRelatorios() {
  renderizarRankingGenerico("ranking-servicos", agruparItensPorServicoRelatorios(), "Nenhum serviço encontrado no período.");
  renderizarRankingGenerico("ranking-produtos", agruparProdutosUsadosRelatorios(), "Nenhum produto de estoque encontrado no período.");
  renderizarRankingGenerico("ranking-clientes", agruparOrdensPorClienteRelatorios(), "Nenhum cliente encontrado no período.");
  renderizarRankingGenerico("ranking-veiculos", agruparOrdensPorVeiculoRelatorios(), "Nenhum veículo encontrado no período.");
}

function agruparItensPorServicoRelatorios() {
  const mapa = new Map();

  itensRelatorioCache.forEach((item) => {
    const tipo = normalizarTextoRelatorios(item.tipo || "");
    const ehProduto = item.produto_estoque_id || tipo === "produto";
    if (ehProduto) return;

    const nome = item.descricao || "Serviço sem descrição";
    const chave = normalizarTextoRelatorios(nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, { titulo: nome, quantidade: 0, valor: 0 });
    }

    const atual = mapa.get(chave);
    atual.quantidade += converterNumeroRelatorios(item.quantidade) || 1;
    atual.valor += converterNumeroRelatorios(item.valor_total || item.subtotal || item.valor_unitario);
  });

  return ordenarRankingRelatorios([...mapa.values()]);
}

function agruparProdutosUsadosRelatorios() {
  const mapa = new Map();

  itensRelatorioCache.forEach((item) => {
    const produto = item.produtos_estoque;
    const ehProduto = item.produto_estoque_id || normalizarTextoRelatorios(item.tipo) === "produto";
    if (!ehProduto) return;

    const nome = produto?.nome || item.descricao || "Produto sem nome";
    const chave = item.produto_estoque_id || normalizarTextoRelatorios(nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        titulo: nome,
        quantidade: 0,
        valor: 0,
        detalhe: produto?.codigo ? `Código: ${produto.codigo}` : ""
      });
    }

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
    const nome = cliente?.nome || ordem.cliente_nome || "Cliente sem cadastro";
    const numero = formatarNumeroClienteRelatorios(cliente?.numero_cliente);
    const chave = ordem.cliente_id || normalizarTextoRelatorios(nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        titulo: nome,
        quantidade: 0,
        valor: 0,
        detalhe: numero ? `ID: ${numero}` : ""
      });
    }

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

    const titulo = veiculo ? formatarVeiculoRelatorios(veiculo) : "Veículo sem dados carregados";
    const chave = ordem.veiculo_id || normalizarTextoRelatorios(titulo);

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        titulo,
        quantidade: 0,
        valor: 0,
        detalhe: veiculo?.placa ? `Placa: ${String(veiculo.placa).toUpperCase()}` : ""
      });
    }

    const atual = mapa.get(chave);
    atual.quantidade += 1;
    atual.valor += converterNumeroRelatorios(ordem.valor_total);
  });

  return ordenarRankingRelatorios([...mapa.values()]);
}

function ordenarRankingRelatorios(lista) {
  return lista.sort((a, b) => {
    if (b.valor !== a.valor) return b.valor - a.valor;
    return b.quantidade - a.quantidade;
  }).slice(0, 8);
}

function renderizarRankingGenerico(id, lista, vazio) {
  const container = document.getElementById(id);
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `<div class="estado-vazio">${escaparHtmlRelatorios(vazio)}</div>`;
    return;
  }

  container.innerHTML = lista.map((item, index) => {
    const detalhe = [item.detalhe || "", `Qtd: ${formatarQuantidadeRelatorios(item.quantidade)}`]
      .filter(Boolean)
      .join(" • ");

    return `
      <div class="ranking-item">
        <div>
          <strong>${index + 1}. ${escaparHtmlRelatorios(item.titulo)}</strong>
          <span>${escaparHtmlRelatorios(detalhe)}</span>
        </div>
        <div class="ranking-valor">${formatarMoedaRelatorios(item.valor)}</div>
      </div>
    `;
  }).join("");
}

function formatarVeiculoRelatorios(veiculo) {
  if (!veiculo) return "";
  const placa = veiculo.placa ? String(veiculo.placa).toUpperCase() : "Sem placa";
  const modelo = [veiculo.marca, veiculo.modelo].filter(Boolean).join(" ");
  const cor = veiculo.cor ? ` - ${veiculo.cor}` : "";
  const ano = veiculo.ano ? ` - ${veiculo.ano}` : "";
  return `${placa}${modelo ? ` - ${modelo}` : ""}${cor}${ano}`;
}

function formatarNumeroClienteRelatorios(numero) {
  if (!numero && numero !== 0) return "";
  const valor = Number(numero);
  if (Number.isFinite(valor)) return `CLI-${String(valor).padStart(6, "0")}`;
  return String(numero);
}

function valorInputRelatorios(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setTextoRelatorios(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function mostrarMensagemRelatorios(texto, tipo = "info") {
  const el = document.getElementById("mensagem-relatorios");
  if (!el) return;
  el.className = `mensagem ${tipo}`;
  el.textContent = texto;
}

function limparMensagemRelatorios() {
  const el = document.getElementById("mensagem-relatorios");
  if (!el) return;
  el.className = "mensagem";
  el.textContent = "";
}

function dataParaInputRelatorios(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function converterNumeroRelatorios(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  let texto = String(valor).trim().replace(/[^\d.,-]/g, "");
  if (!texto) return 0;
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarMoedaRelatorios(valor) {
  return converterNumeroRelatorios(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarQuantidadeRelatorios(valor) {
  const numero = converterNumeroRelatorios(valor);
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(numero) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function normalizarTextoRelatorios(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHtmlRelatorios(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function alterarEstadoBotaoRelatorios(carregando) {
  const btn = document.getElementById("btn-atualizar-relatorios");
  if (!btn) return;
  btn.disabled = !!carregando;
  btn.textContent = carregando ? "Carregando..." : "Atualizar relatório";
}

function notificarAlturaRelatorios() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ tipo: "fs-ajustar-iframe", origem: "relatorios" }, window.location.origin);
    }
  } catch (_) {}
}

window.carregarRelatoriosPremium = carregarRelatoriosPremium;
