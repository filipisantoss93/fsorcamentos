/* =========================================================
   FS ORÇAMENTOS - ordem.js
   Detalhes da Ordem de Serviço + Itens + Estoque + Financeiro
   Premium em desenvolvimento

   Fluxo:
   - OS básica criada em ordens.html
   - Dentro da OS: mão de obra, itens, pagamento e finalização
   - Ao concluir OS: trigger do Supabase deve baixar estoque e atualizar faturamento
   ========================================================= */

let ordemAtual = null;
let usuarioLogadoOrdem = null;
let produtosEstoqueOrdemCache = [];

const SUBCATEGORIAS_OFICINA_POR_CATEGORIA_ORDEM = {
  "Filtros": ["Filtro de ar", "Filtro de óleo", "Filtro de combustível", "Filtro de cabine"],
  "Suspensão": ["Amortecedor", "Mola", "Bandeja", "Bucha", "Pivô", "Terminal", "Coxim"],
  "Injeção": ["Bico injetor", "Sensor", "Corpo de borboleta", "Bomba de combustível", "Vela", "Cabo de vela"],
  "Correias": ["Correia dentada", "Correia auxiliar", "Tensor", "Polia", "Kit correia"],
  "Freios": ["Pastilha de freio", "Disco de freio", "Lona", "Tambor", "Cilindro", "Fluido de freio"],
  "Elétrica": ["Bateria", "Lâmpada", "Alternador", "Motor de partida", "Relé", "Fusível", "Chicote"],
  "Motor": ["Junta", "Retentor", "Coxim", "Bomba d'água", "Vela", "Óleo", "Aditivo"],
  "Fluidos": ["Óleo de motor", "Fluido de freio", "Fluido de direção", "Aditivo", "Limpa para-brisa"],
  "Lubrificantes": ["Óleo de motor", "Óleo de câmbio", "Graxa", "Aditivo"],
  "Acessórios": ["Palheta", "Lâmpada", "Tapete", "Calha", "Capa"],
  "Peças": ["Peça mecânica", "Peça elétrica", "Peça de acabamento", "Kit"],
  "Materiais": ["Material de consumo", "Parafuso", "Abraçadeira", "Cola", "Fita"],
  "Produtos": ["Limpeza", "Aditivo", "Químico automotivo", "Polimento"],
  "Ferramentas": ["Ferramenta manual", "Ferramenta elétrica", "Equipamento", "Acessório de ferramenta"],
  "Insumos": ["Descartável", "EPI", "Material de limpeza", "Material de oficina"],
  "Serviços": ["Mão de obra", "Diagnóstico", "Instalação", "Reparo", "Revisão"],
  "Outros": ["Geral"]
};

let itensOrdemCache = [];
let orcamentoVinculadoOrdem = null;
let veiculoVinculadoOrdem = null;

let fsOrdemDetalheInicializado = false;

async function iniciarOrdemDetalheInicializado() {
  if (fsOrdemDetalheInicializado) return;
  fsOrdemDetalheInicializado = true;
  await inicializarDetalheOrdem();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarOrdemDetalheInicializado);
} else {
  iniciarOrdemDetalheInicializado();
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarDetalheOrdem() {
  try {
    garantirSupabaseOrdem();

    const session = await obterSessaoAtualOrdem();

    if (!session) {
      redirecionarParaLoginOrdem();
      return;
    }

    usuarioLogadoOrdem = session.user;

    configurarEventosOrdem();

    const ordemId = obterIdOrdemAtual();

    if (!ordemId) {
      setLoadingOrdem(false);
      mostrarMensagemOrdem(
        "Nenhuma ordem de serviço foi informada. Volte para a lista de ordens e abra uma OS válida.",
        "erro"
      );
      return;
    }

    await carregarProdutosEstoqueOrdem();
    await carregarOrdemPorId(ordemId);
    await carregarOrcamentoVinculadoOrdem();
    await carregarVeiculoVinculadoOrdem();
    await carregarItensOrdem(ordemId);
    preencherFormularioFinanceiroOrdem();

  } catch (erro) {
    console.error("Erro ao inicializar ordem.js:", erro);
    setLoadingOrdem(false);
    mostrarMensagemOrdem(
      "Erro ao carregar os detalhes da ordem de serviço.",
      "erro"
    );
  }
}

function garantirSupabaseOrdem() {
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

async function obterSessaoAtualOrdem() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data && data.session ? data.session : null;
}

function redirecionarParaLoginOrdem() {
  const destino = encodeURIComponent("ordem.html" + window.location.search);
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosOrdem() {
  const btnEditar = document.getElementById("btn-editar-ordem");
  const btnPDF = document.getElementById("btn-pdf-ordem");
  const btnWhatsApp = document.getElementById("btn-whatsapp-cliente");
  const btnImportarItensOrcamento = document.getElementById("btn-importar-itens-orcamento");
  const btnVerOrcamentoVinculado = document.getElementById("btn-ver-orcamento-vinculado");

  const formItem = document.getElementById("form-item-ordem");
  const btnLimparItem = document.getElementById("btn-limpar-item-ordem");

  const selectProduto = document.getElementById("item-produto-estoque-id");
  const quantidade = document.getElementById("item-quantidade");
  const valorUnitario = document.getElementById("item-valor-unitario");
  const campoBuscaProdutoEstoque = document.getElementById("campo-busca-produto-estoque-ordem");
  const filtroCategoriaProdutoOrdem = document.getElementById("filtro-categoria-produto-ordem");
  const filtroSubcategoriaProdutoOrdem = document.getElementById("filtro-subcategoria-produto-ordem");

  const formFinanceiro = document.getElementById("form-financeiro-ordem");
  const btnFinalizar = document.getElementById("btn-finalizar-ordem");

  const financeiroMaoObra = document.getElementById("financeiro-valor-mao-obra");
  const financeiroDesconto = document.getElementById("financeiro-desconto");
  const financeiroStatusPagamento = document.getElementById("financeiro-status-pagamento");
  const financeiroValorPago = document.getElementById("financeiro-valor-pago");

  if (btnEditar) {
    btnEditar.addEventListener("click", editarOrdemAtual);
  }

  if (btnPDF) {
    btnPDF.addEventListener("click", gerarPDFOrdemAtual);
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", abrirWhatsAppClienteOrdem);
  }

  if (btnImportarItensOrcamento) {
    btnImportarItensOrcamento.addEventListener("click", importarItensDoOrcamentoVinculado);
  }

  if (btnVerOrcamentoVinculado) {
    btnVerOrcamentoVinculado.addEventListener("click", abrirOrcamentoVinculado);
  }

  if (formItem) {
    formItem.addEventListener("submit", salvarItemOrdem);
  }

  if (btnLimparItem) {
    btnLimparItem.addEventListener("click", limparFormularioItemOrdem);
  }

  if (selectProduto) {
    selectProduto.addEventListener("change", preencherItemComProdutoEstoque);
  }

  if (quantidade) {
    quantidade.addEventListener("input", calcularValorTotalItemOrdem);
  }

  if (valorUnitario) {
    valorUnitario.addEventListener("input", calcularValorTotalItemOrdem);
  }

  if (campoBuscaProdutoEstoque) {
    campoBuscaProdutoEstoque.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buscarProdutosModalOrdem();
      }
    });
  }

  if (filtroCategoriaProdutoOrdem) {
    filtroCategoriaProdutoOrdem.addEventListener("change", () => {
      atualizarSubcategoriasProdutoOrdem(true);
      buscarProdutosModalOrdem();
    });
  }

  if (filtroSubcategoriaProdutoOrdem) {
    filtroSubcategoriaProdutoOrdem.addEventListener("change", buscarProdutosModalOrdem);
  }

  [filtroCategoriaProdutoOrdem, filtroSubcategoriaProdutoOrdem].forEach((campoFiltroProduto) => {
    if (!campoFiltroProduto) return;
    campoFiltroProduto.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buscarProdutosModalOrdem();
      }
    });
  });

  atualizarSubcategoriasProdutoOrdem(false);

  if (formFinanceiro) {
    formFinanceiro.addEventListener("submit", salvarFinanceiroOrdem);
  }

  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", finalizarOrdemServico);
  }

  if (financeiroMaoObra) {
    financeiroMaoObra.addEventListener("input", calcularFinanceiroOrdemNaTela);
  }

  if (financeiroDesconto) {
    financeiroDesconto.addEventListener("input", calcularFinanceiroOrdemNaTela);
  }

  if (financeiroValorPago) {
    financeiroValorPago.addEventListener("input", calcularFinanceiroOrdemNaTela);
  }

  if (financeiroStatusPagamento) {
    financeiroStatusPagamento.addEventListener("change", ajustarPagamentoFinanceiroOrdem);
  }
}

/* =========================================================
   CARREGAR ORDEM
   ========================================================= */

async function carregarOrdemPorId(id) {
  try {
    setLoadingOrdem(true);
    limparMensagemOrdem();

    const { data, error } = await window._supabase
      .from("ordens_servico")
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo_cliente,
          cpf_cnpj,
          whatsapp,
          email,
          endereco,
          cidade,
          estado,
          cep,
          observacoes,
          status,
          categoria
        )
      `)
      .eq("id", id)
      .eq("user_id", usuarioLogadoOrdem.id)
      .single();

    if (error) {
      console.error("Erro ao carregar OS:", error);
      setLoadingOrdem(false);
      mostrarMensagemOrdem(
        "Ordem de serviço não encontrada ou você não tem permissão para visualizá-la.",
        "erro"
      );
      return;
    }

    ordemAtual = data;

    preencherDadosOrdem(ordemAtual);
    preencherFormularioFinanceiroOrdem();

    setLoadingOrdem(false);
    mostrarConteudoOrdem(true);

  } catch (erro) {
    console.error("Erro inesperado ao carregar OS:", erro);
    setLoadingOrdem(false);
    mostrarMensagemOrdem(
      "Erro inesperado ao carregar a ordem de serviço.",
      "erro"
    );
  }
}

/* =========================================================
   ORÇAMENTO VINCULADO
   ========================================================= */

async function carregarOrcamentoVinculadoOrdem() {
  try {
    orcamentoVinculadoOrdem = null;
    ocultarCardOrcamentoVinculado();

    if (!ordemAtual?.orcamento_id || !usuarioLogadoOrdem?.id) {
      return;
    }

    const { data, error } = await window._supabase
      .from("orcamentos")
      .select("*")
      .eq("id", ordemAtual.orcamento_id)
      .eq("usuario_id", usuarioLogadoOrdem.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar orçamento vinculado:", error);
      mostrarMensagemOrdem(
        "A OS possui orçamento vinculado, mas não foi possível carregar os dados do orçamento.",
        "erro"
      );
      return;
    }

    if (!data) {
      return;
    }

    orcamentoVinculadoOrdem = data;
    preencherCardOrcamentoVinculado(data);

  } catch (erro) {
    console.error("Erro inesperado ao carregar orçamento vinculado:", erro);
  }
}

function ocultarCardOrcamentoVinculado() {
  const card = document.getElementById("card-orcamento-vinculado");

  if (card) {
    card.classList.add("oculto");
  }
}

function preencherCardOrcamentoVinculado(orcamento) {
  const card = document.getElementById("card-orcamento-vinculado");

  if (card) {
    card.classList.remove("oculto");
  }

  setTextoOrdem("detalhe-orcamento-numero", formatarNumeroOrcamentoVinculado(orcamento));
  setTextoOrdem("detalhe-orcamento-status", formatarStatusOrcamentoVinculado(orcamento.status));
  setTextoOrdem("detalhe-orcamento-valor", formatarMoedaOrdem(orcamento.total));
  setTextoOrdem("detalhe-orcamento-forma-pagamento", formatarFormaPagamentoOrdemVinculado(orcamento.forma_pagamento_cliente));
  setTextoOrdem("detalhe-orcamento-aprovado-em", formatarDataHoraVisualOrdem(orcamento.resposta_cliente_em));
  setTextoOrdem("detalhe-orcamento-id", orcamento.id || "-");
}

async function importarItensDoOrcamentoVinculado() {
  try {
    limparMensagemItensOrdem();

    if (!ordemAtual?.id) {
      mostrarMensagemItensOrdem("OS não carregada.", "erro");
      return;
    }

    if (ordemAtual.status === "concluida") {
      mostrarMensagemItensOrdem(
        "Esta OS já foi finalizada. Não é possível importar itens.",
        "erro"
      );
      return;
    }

    if (!orcamentoVinculadoOrdem?.id) {
      mostrarMensagemItensOrdem(
        "Nenhum orçamento vinculado foi encontrado para importar itens.",
        "erro"
      );
      return;
    }

    const itensOriginais = Array.isArray(orcamentoVinculadoOrdem.itens)
      ? orcamentoVinculadoOrdem.itens
      : [];

    if (!itensOriginais.length) {
      mostrarMensagemItensOrdem(
        "Este orçamento não possui itens para importar.",
        "info"
      );
      return;
    }

    if (itensOrdemCache.length > 0) {
      const confirmar = confirm(
        "Esta OS já possui itens cadastrados. Deseja importar os itens do orçamento mesmo assim? Isso pode duplicar itens."
      );

      if (!confirmar) return;
    }

    const itensParaInserir = itensOriginais.map((item) => {
      const normalizado = normalizarItemOrcamentoVinculado(item);

      return {
        user_id: usuarioLogadoOrdem.id,
        ordem_servico_id: ordemAtual.id,
        produto_estoque_id: null,
        descricao: normalizado.descricao || "Item do orçamento",
        tipo: normalizado.tipo || "servico",
        quantidade: normalizado.qtd || 1,
        unidade: normalizado.unidade || "un",
        valor_unitario: normalizado.valor || 0,
        valor_total: normalizado.subtotal || ((normalizado.qtd || 1) * (normalizado.valor || 0)),
        baixar_estoque: false,
        estoque_baixado: false
      };
    });

    const btn = document.getElementById("btn-importar-itens-orcamento");
    alterarEstadoBotaoOrdem(btn, true, "Importando...");

    const { error } = await window._supabase
      .from("ordem_servico_itens")
      .insert(itensParaInserir);

    if (error) {
      console.error("Erro ao importar itens do orçamento:", error);
      mostrarMensagemItensOrdem(
        "Erro ao importar itens do orçamento. Verifique a tabela ordem_servico_itens.",
        "erro"
      );
      return;
    }

    mostrarMensagemItensOrdem(
      "Itens do orçamento importados com sucesso. Revise os itens e marque manualmente os que devem baixar estoque.",
      "sucesso"
    );

    await carregarItensOrdem(ordemAtual.id);
    await atualizarValoresOrdemAPartirDosItens();

  } catch (erro) {
    console.error("Erro inesperado ao importar itens do orçamento:", erro);
    mostrarMensagemItensOrdem(
      "Erro inesperado ao importar itens do orçamento.",
      "erro"
    );
  } finally {
    const btn = document.getElementById("btn-importar-itens-orcamento");
    alterarEstadoBotaoOrdem(btn, false, "Importar itens do orçamento");
  }
}

function abrirOrcamentoVinculado() {
  if (!orcamentoVinculadoOrdem?.id) {
    alert("Nenhum orçamento vinculado encontrado.");
    return;
  }

  const id = encodeURIComponent(orcamentoVinculadoOrdem.id);
  const usaHtml = (window.location.pathname || "").includes(".html");
  const destino = usaHtml
    ? `orcamentos.html?orcamento=${id}`
    : `/orcamentos?orcamento=${id}`;

  window.open(destino, "_blank");
}

function normalizarItemOrcamentoVinculado(item) {
  const descricao = item?.descricao || item?.desc || item?.item || item?.nome || "";

  const qtd = converterNumeroOrdem(
    item?.qtd ??
    item?.quantidade ??
    item?.qtde ??
    item?.qtd_item ??
    1
  );

  const valor = converterNumeroOrdem(
    item?.valor ??
    item?.valor_unitario ??
    item?.preco ??
    item?.unitario ??
    0
  );

  const subtotal = converterNumeroOrdem(
    item?.subtotal ??
    item?.total ??
    (qtd * valor)
  );

  const unidade = item?.unidade || item?.un || "un";
  const tipo = item?.tipo || "servico";

  return { descricao, qtd, valor, subtotal, unidade, tipo };
}

function formatarNumeroOrcamentoVinculado(orcamento) {
  const numero = orcamento?.numero_orcamento || orcamento?.numero || "";

  if (!numero) return "Orçamento sem número";

  return `Orçamento Nº ${String(numero).padStart(6, "0")}`;
}

function formatarStatusOrcamentoVinculado(status) {
  const mapa = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    recusado: "Recusado",
    em_servico: "Em serviço",
    finalizado: "Finalizado"
  };

  return mapa[status] || status || "Não informado";
}

function formatarFormaPagamentoOrdemVinculado(forma) {
  const mapa = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    credito: "Cartão de crédito",
    debito: "Cartão de débito",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto",
    transferencia: "Transferência",
    outro: "Outro"
  };

  return mapa[String(forma || "").toLowerCase()] || forma || "Não informado";
}

/* =========================================================
   PRODUTOS DO ESTOQUE
   ========================================================= */

async function carregarProdutosEstoqueOrdem() {
  try {
    if (!usuarioLogadoOrdem || !usuarioLogadoOrdem.id) return;

    const { data, error } = await window._supabase
      .from("produtos_estoque")
      .select("*")
      .eq("user_id", usuarioLogadoOrdem.id)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar produtos do estoque:", error);
      mostrarMensagemItensOrdem(
        "Não foi possível carregar produtos do estoque.",
        "erro"
      );
      return;
    }

    produtosEstoqueOrdemCache = Array.isArray(data) ? data : [];
    atualizarSubcategoriasProdutoOrdem(false);
    renderizarSelectProdutosEstoqueOrdem();
    atualizarProdutoEstoqueSelecionadoCard();

  } catch (erro) {
    console.error("Erro inesperado ao carregar produtos do estoque:", erro);
  }
}

function renderizarSelectProdutosEstoqueOrdem() {
  atualizarProdutoEstoqueSelecionadoCard();
}

function formatarProdutoEstoqueResumoOrdem(produto) {
  if (!produto) return "Item manual / sem vínculo com estoque";
  const quantidade = converterNumeroOrdem(produto.quantidade_atual);
  const unidade = produto.unidade || "un";
  const controla = produto.controlar_estoque !== false;
  const estoque = controla ? `Estoque: ${formatarQuantidadeOrdem(quantidade)} ${unidade}` : "Sem controle de estoque";
  return [produto.codigo ? `Código: ${produto.codigo}` : "", produto.categoria ? `Categoria: ${produto.categoria}` : "", produto.subcategoria ? `Subcategoria: ${produto.subcategoria}` : "", estoque, produto.valor_venda ? `Venda: ${formatarMoedaOrdem(produto.valor_venda)}` : ""].filter(Boolean).join(" • ");
}

function atualizarProdutoEstoqueSelecionadoCard() {
  const card = document.getElementById("produto-estoque-selecionado-card");
  const produtoId = valorInputOrdem("item-produto-estoque-id");
  const produto = produtosEstoqueOrdemCache.find((item) => item.id === produtoId);
  if (!card) return;
  if (!produto) {
    card.innerHTML = `<strong>Nenhum produto selecionado</strong><span>Item manual / sem vínculo com estoque</span>`;
    return;
  }
  card.innerHTML = `<strong>${escaparHTMLOrdem(produto.nome || "Produto sem nome")}</strong><span>${escaparHTMLOrdem(formatarProdutoEstoqueResumoOrdem(produto))}</span>`;
}

function obterSubcategoriasPermitidasProdutoOrdem(categoria) {
  const categoriaLimpa = String(categoria || "").trim();
  const base = [];

  if (categoriaLimpa && SUBCATEGORIAS_OFICINA_POR_CATEGORIA_ORDEM[categoriaLimpa]) {
    base.push(...SUBCATEGORIAS_OFICINA_POR_CATEGORIA_ORDEM[categoriaLimpa]);
  } else if (!categoriaLimpa) {
    Object.values(SUBCATEGORIAS_OFICINA_POR_CATEGORIA_ORDEM).forEach((lista) => base.push(...lista));
  }

  produtosEstoqueOrdemCache.forEach((produto) => {
    const mesmaCategoria = !categoriaLimpa || String(produto.categoria || "").trim() === categoriaLimpa;
    const sub = String(produto.subcategoria || "").trim();
    if (mesmaCategoria && sub) base.push(sub);
  });

  return Array.from(new Set(base.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function atualizarSubcategoriasProdutoOrdem(limparSelecao = false) {
  const select = document.getElementById("filtro-subcategoria-produto-ordem");
  if (!select) return;

  const categoria = document.getElementById("filtro-categoria-produto-ordem")?.value || "";
  const valorAnterior = limparSelecao ? "" : select.value;
  const subcategorias = obterSubcategoriasPermitidasProdutoOrdem(categoria);

  select.innerHTML = [
    `<option value="">Todas as subcategorias</option>`,
    ...subcategorias.map((sub) => `<option value="${escaparHTMLAtributo(sub)}">${escaparHTMLOrdem(sub)}</option>`),
    `<option value="Sem subcategoria">Sem subcategoria</option>`
  ].join("");

  if (valorAnterior && Array.from(select.options).some((opcao) => opcao.value === valorAnterior)) {
    select.value = valorAnterior;
  }
}

function abrirModalBuscaProdutoEstoqueOrdem() {
  const modal = document.getElementById("modal-busca-produto-estoque-ordem");
  const campo = document.getElementById("campo-busca-produto-estoque-ordem");
  const resultado = document.getElementById("resultado-busca-produtos-ordem");
  if (resultado) resultado.innerHTML = `<div class="estado-busca-produto-modal">Digite pelo menos 2 caracteres e clique em Buscar.</div>`;
  if (campo) campo.value = "";
  if (modal) { modal.classList.add("ativo"); modal.setAttribute("aria-hidden", "false"); setTimeout(() => campo?.focus(), 80); }
}

function fecharModalBuscaProdutoEstoqueOrdem() {
  const modal = document.getElementById("modal-busca-produto-estoque-ordem");
  if (modal) { modal.classList.remove("ativo"); modal.setAttribute("aria-hidden", "true"); }
}

function normalizarTextoOrdem(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function textoBuscaProdutoEstoqueOrdem(produto) {
  return normalizarTextoOrdem([produto.nome, produto.codigo, produto.sku, produto.categoria, produto.subcategoria, produto.descricao, produto.observacoes, produto.unidade, produto.aplicacao, produto.marca_veiculo, produto.modelo_veiculo].filter(Boolean).join(" "));
}

function buscarProdutosModalOrdem() {
  const campo = document.getElementById("campo-busca-produto-estoque-ordem");
  const resultado = document.getElementById("resultado-busca-produtos-ordem");
  if (!resultado) return;
  const termo = normalizarTextoOrdem(campo?.value || "");
  const categoria = document.getElementById("filtro-categoria-produto-ordem")?.value || "";
  const subcategoria = normalizarTextoOrdem(document.getElementById("filtro-subcategoria-produto-ordem")?.value || "");
  if (termo.length < 2 && !categoria && !subcategoria) { resultado.innerHTML = `<div class="estado-busca-produto-modal">Digite pelo menos 2 caracteres ou selecione uma categoria/subcategoria.</div>`; return; }
  const encontrados = produtosEstoqueOrdemCache.filter((produto) => {
    const okTermo = termo.length < 2 || textoBuscaProdutoEstoqueOrdem(produto).includes(termo);
    const okCategoria = !categoria || String(produto.categoria || "") === categoria;
    const okSubcategoria = !subcategoria || normalizarTextoOrdem(produto.subcategoria || "") === subcategoria;
    return okTermo && okCategoria && okSubcategoria;
  }).slice(0, 40);
  if (!encontrados.length) { resultado.innerHTML = `<div class="estado-busca-produto-modal">Nenhum produto encontrado. Cadastre o item em Estoque ou adicione como item manual.</div>`; return; }
  resultado.innerHTML = encontrados.map((produto) => {
    const id = escaparHTMLAtributo(produto.id);
    const nome = escaparHTMLOrdem(produto.nome || "Produto sem nome");
    const resumo = escaparHTMLOrdem(formatarProdutoEstoqueResumoOrdem(produto));
    return `<button type="button" class="produto-modal-item" onclick="selecionarProdutoEstoqueModalOrdem('${id}')"><strong>${nome}</strong><span>${resumo}</span></button>`;
  }).join("");
}

function selecionarProdutoEstoqueModalOrdem(produtoId) {
  setValorOrdem("item-produto-estoque-id", produtoId || "");
  preencherItemComProdutoEstoque();
  atualizarProdutoEstoqueSelecionadoCard();
  fecharModalBuscaProdutoEstoqueOrdem();
}

function limparProdutoEstoqueSelecionadoOrdem() {
  setValorOrdem("item-produto-estoque-id", "");
  atualizarProdutoEstoqueSelecionadoCard();
  atualizarProdutoEstoqueSelecionadoCard();
  const checkboxBaixarVazio = document.getElementById("item-baixar-estoque");
  if (checkboxBaixarVazio) checkboxBaixarVazio.checked = false;
}

function preencherItemComProdutoEstoque() {
  const produtoId = valorInputOrdem("item-produto-estoque-id");

  if (!produtoId) {
    const checkboxBaixarVazio = document.getElementById("item-baixar-estoque");
    if (checkboxBaixarVazio) checkboxBaixarVazio.checked = false;
    return;
  }

  const produto = produtosEstoqueOrdemCache.find((item) => item.id === produtoId);

  if (!produto) return;

  setValorOrdem("item-descricao", produto.nome || "");
  setValorOrdem("item-tipo", "produto");
  setValorOrdem("item-unidade", produto.unidade || "un");
  setValorOrdem("item-valor-unitario", numeroParaInputOrdem(produto.valor_venda || 0));

  const checkboxBaixar = document.getElementById("item-baixar-estoque");
  if (checkboxBaixar) {
    checkboxBaixar.checked = produto.controlar_estoque !== false;
  }

  calcularValorTotalItemOrdem();
  atualizarProdutoEstoqueSelecionadoCard();
}

/* =========================================================
   ITENS DA ORDEM
   ========================================================= */

async function carregarItensOrdem(ordemId) {
  try {
    if (!ordemId || !usuarioLogadoOrdem?.id) return;

    const { data, error } = await window._supabase
      .from("ordem_servico_itens")
      .select(`
        *,
        produtos_estoque (
          id,
          nome,
          codigo,
          unidade,
          quantidade_atual,
          controlar_estoque
        )
      `)
      .eq("ordem_servico_id", ordemId)
      .eq("user_id", usuarioLogadoOrdem.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar itens da OS:", error);
      mostrarMensagemItensOrdem(
        "Não foi possível carregar os itens da OS. Verifique a tabela ordem_servico_itens.",
        "erro"
      );
      return;
    }

    itensOrdemCache = Array.isArray(data) ? data : [];
    renderizarItensOrdem(itensOrdemCache);
    calcularFinanceiroOrdemNaTela();

  } catch (erro) {
    console.error("Erro inesperado ao carregar itens da OS:", erro);
    mostrarMensagemItensOrdem(
      "Erro inesperado ao carregar itens da OS.",
      "erro"
    );
  }
}

async function salvarItemOrdem(event) {
  event.preventDefault();

  try {
    limparMensagemItensOrdem();

    if (!ordemAtual || !ordemAtual.id) {
      mostrarMensagemItensOrdem(
        "A ordem de serviço ainda não foi carregada.",
        "erro"
      );
      return;
    }

    if (ordemAtual.status === "concluida") {
      mostrarMensagemItensOrdem(
        "Esta OS já foi finalizada. Não é possível alterar itens.",
        "erro"
      );
      return;
    }

    const session = await obterSessaoAtualOrdem();

    if (!session) {
      redirecionarParaLoginOrdem();
      return;
    }

    usuarioLogadoOrdem = session.user;

    calcularValorTotalItemOrdem();

    const item = montarObjetoItemOrdem();

    if (!item.descricao) {
      mostrarMensagemItensOrdem(
        "Informe a descrição do item.",
        "erro"
      );
      return;
    }

    if (item.quantidade <= 0) {
      mostrarMensagemItensOrdem(
        "A quantidade precisa ser maior que zero.",
        "erro"
      );
      return;
    }

    if (item.baixar_estoque && !item.produto_estoque_id) {
      mostrarMensagemItensOrdem(
        "Para baixar estoque, selecione um produto do estoque.",
        "erro"
      );
      return;
    }

    if (item.produto_estoque_id && item.baixar_estoque) {
      const produto = produtosEstoqueOrdemCache.find((p) => p.id === item.produto_estoque_id);

      if (produto && produto.controlar_estoque !== false) {
        const quantidadeAtual = converterNumeroOrdem(produto.quantidade_atual);

        if (item.quantidade > quantidadeAtual) {
          mostrarMensagemItensOrdem(
            `Estoque insuficiente. Disponível: ${formatarQuantidadeOrdem(quantidadeAtual)} ${produto.unidade || "un"}.`,
            "erro"
          );
          return;
        }
      }
    }

    const btn = document.getElementById("btn-salvar-item-ordem");
    alterarEstadoBotaoOrdem(btn, true, "Salvando item...");

    const itemId = valorInputOrdem("item-ordem-id");

    let resultado;

    if (itemId) {
      const itemExistente = itensOrdemCache.find((i) => i.id === itemId);

      if (itemExistente?.estoque_baixado) {
        mostrarMensagemItensOrdem(
          "Este item já teve estoque baixado e não pode ser editado.",
          "erro"
        );
        return;
      }

      resultado = await window._supabase
        .from("ordem_servico_itens")
        .update(item)
        .eq("id", itemId)
        .eq("user_id", usuarioLogadoOrdem.id)
        .select()
        .single();
    } else {
      resultado = await window._supabase
        .from("ordem_servico_itens")
        .insert({
          ...item,
          user_id: usuarioLogadoOrdem.id,
          ordem_servico_id: ordemAtual.id
        })
        .select()
        .single();
    }

    if (resultado.error) {
      console.error("Erro ao salvar item da OS:", resultado.error);
      mostrarMensagemItensOrdem(
        "Erro ao salvar item da OS. Verifique os dados e tente novamente.",
        "erro"
      );
      return;
    }

    mostrarMensagemItensOrdem(
      itemId ? "Item atualizado com sucesso." : "Item adicionado com sucesso.",
      "sucesso"
    );

    limparFormularioItemOrdem();

    await carregarItensOrdem(ordemAtual.id);
    await atualizarValoresOrdemAPartirDosItens();

  } catch (erro) {
    console.error("Erro inesperado ao salvar item:", erro);
    mostrarMensagemItensOrdem(
      "Erro inesperado ao salvar item da OS.",
      "erro"
    );
  } finally {
    const btn = document.getElementById("btn-salvar-item-ordem");
    const itemIdAtual = valorInputOrdem("item-ordem-id");

    alterarEstadoBotaoOrdem(
      btn,
      false,
      itemIdAtual ? "Atualizar item" : "Adicionar item"
    );
  }
}

function montarObjetoItemOrdem() {
  const produtoId = valorInputOrdem("item-produto-estoque-id");
  const quantidade = numeroCampoOrdem("item-quantidade");
  const valorUnitario = numeroCampoOrdem("item-valor-unitario");

  return {
    produto_estoque_id: produtoId || null,
    descricao: valorInputOrdem("item-descricao"),
    tipo: valorInputOrdem("item-tipo") || "servico",
    quantidade: quantidade,
    unidade: valorInputOrdem("item-unidade") || "un",
    valor_unitario: valorUnitario,
    valor_total: quantidade * valorUnitario,
    baixar_estoque: checkboxMarcadoOrdem("item-baixar-estoque"),
    estoque_baixado: false
  };
}

function renderizarItensOrdem(lista) {
  const container = document.getElementById("lista-itens-ordem");

  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum item adicionado</strong>
        <p>Adicione serviços, peças ou materiais usados nesta ordem de serviço.</p>
      </div>
    `;
    return;
  }

  const total = calcularTotalItensOrdem();

  container.innerHTML = `
    <div style="display:grid; gap:10px;">
      ${lista.map((item) => criarCardItemOrdem(item)).join("")}
    </div>

    <div class="total-itens-ordem-box" style="margin-top:14px; padding:14px; border-radius:14px; background:#3e2723 !important; border:2px solid #ffc400 !important; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; color:#ffc400 !important;">
      <strong style="color:#ffc400 !important;">Total dos itens</strong>
      <strong style="color:#ffc400 !important; font-size:18px;">${formatarMoedaOrdem(total)}</strong>
    </div>
  `;
}

function criarCardItemOrdem(item) {
  const id = escaparHTMLAtributo(item.id);
  const descricao = escaparHTMLOrdem(item.descricao || "Item sem descrição");
  const tipo = formatarTipoItemOrdem(item.tipo);
  const quantidade = formatarQuantidadeOrdem(item.quantidade);
  const unidade = escaparHTMLOrdem(item.unidade || "un");
  const unitario = formatarMoedaOrdem(item.valor_unitario);
  const total = formatarMoedaOrdem(item.valor_total);

  const produtoNome = item.produtos_estoque?.nome || "";
  const baixar = item.baixar_estoque === true;
  const baixado = item.estoque_baixado === true;
  const osConcluida = ordemAtual?.status === "concluida";

  const tags = [
    `<span class="tag">${escaparHTMLOrdem(tipo)}</span>`,
    item.produto_estoque_id
      ? `<span class="tag">Vinculado ao estoque</span>`
      : `<span class="tag">Manual</span>`,
    baixar
      ? `<span class="tag pendente">Baixar estoque</span>`
      : "",
    baixado
      ? `<span class="tag pago">Estoque baixado</span>`
      : ""
  ].filter(Boolean).join("");

  return `
    <div style="border:1px solid var(--fs-borda); border-radius:14px; padding:14px; background:#fff;">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <strong style="display:block; color:var(--fs-marrom); font-size:15px; margin-bottom:4px;">
            ${descricao}
          </strong>
          <span style="display:block; color:var(--fs-texto-suave); font-size:13px; line-height:1.5;">
            ${quantidade} ${unidade} x ${unitario}
            ${produtoNome ? ` • Estoque: ${escaparHTMLOrdem(produtoNome)}` : ""}
          </span>
        </div>

        <strong style="color:var(--fs-marrom); font-size:16px;">
          ${total}
        </strong>
      </div>

      <div class="tags-linha" style="margin-top:10px;">
        ${tags}
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
        ${
          baixado || osConcluida
            ? ""
            : `<button type="button" class="btn btn-secundario btn-pequeno" onclick="editarItemOrdem('${id}')">Editar</button>`
        }

        ${
          baixado || osConcluida
            ? ""
            : `<button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirItemOrdem('${id}')">Excluir</button>`
        }
      </div>
    </div>
  `;
}

function editarItemOrdem(id) {
  const item = itensOrdemCache.find((i) => i.id === id);

  if (!item) {
    mostrarMensagemItensOrdem("Item não encontrado.", "erro");
    return;
  }

  if (item.estoque_baixado || ordemAtual?.status === "concluida") {
    mostrarMensagemItensOrdem(
      "Este item não pode ser editado porque a OS já foi finalizada ou o estoque já foi baixado.",
      "erro"
    );
    return;
  }

  setValorOrdem("item-ordem-id", item.id);
  setValorOrdem("item-produto-estoque-id", item.produto_estoque_id || "");
  atualizarProdutoEstoqueSelecionadoCard();
  setValorOrdem("item-tipo", item.tipo || "servico");
  setValorOrdem("item-descricao", item.descricao || "");
  setValorOrdem("item-quantidade", numeroParaInputOrdem(item.quantidade || 1));
  setValorOrdem("item-unidade", item.unidade || "un");
  setValorOrdem("item-valor-unitario", numeroParaInputOrdem(item.valor_unitario || 0));
  setValorOrdem("item-valor-total", numeroParaInputOrdem(item.valor_total || 0));

  const checkbox = document.getElementById("item-baixar-estoque");
  if (checkbox) {
    checkbox.checked = item.baixar_estoque === true;
  }

  const btn = document.getElementById("btn-salvar-item-ordem");
  if (btn) btn.textContent = "Atualizar item";

  mostrarMensagemItensOrdem(
    "Item carregado para edição.",
    "info"
  );
}

async function excluirItemOrdem(id) {
  try {
    const item = itensOrdemCache.find((i) => i.id === id);

    if (!item) {
      mostrarMensagemItensOrdem("Item não encontrado.", "erro");
      return;
    }

    if (item.estoque_baixado || ordemAtual?.status === "concluida") {
      mostrarMensagemItensOrdem(
        "Este item não pode ser excluído porque a OS já foi finalizada ou o estoque já foi baixado.",
        "erro"
      );
      return;
    }

    const confirmar = confirm(`Deseja excluir o item "${item.descricao}"?`);

    if (!confirmar) return;

    const { error } = await window._supabase
      .from("ordem_servico_itens")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioLogadoOrdem.id);

    if (error) {
      console.error("Erro ao excluir item:", error);
      mostrarMensagemItensOrdem(
        "Erro ao excluir item da OS.",
        "erro"
      );
      return;
    }

    mostrarMensagemItensOrdem(
      "Item excluído com sucesso.",
      "sucesso"
    );

    await carregarItensOrdem(ordemAtual.id);
    await atualizarValoresOrdemAPartirDosItens();

  } catch (erro) {
    console.error("Erro inesperado ao excluir item:", erro);
    mostrarMensagemItensOrdem(
      "Erro inesperado ao excluir item.",
      "erro"
    );
  }
}

function limparFormularioItemOrdem() {
  const form = document.getElementById("form-item-ordem");

  if (form) form.reset();

  setValorOrdem("item-ordem-id", "");
  setValorOrdem("item-produto-estoque-id", "");
  atualizarProdutoEstoqueSelecionadoCard();
  setValorOrdem("item-tipo", "servico");
  setValorOrdem("item-quantidade", "1");
  setValorOrdem("item-unidade", "un");
  setValorOrdem("item-valor-unitario", "");
  setValorOrdem("item-valor-total", "");

  const checkbox = document.getElementById("item-baixar-estoque");
  if (checkbox) checkbox.checked = false;

  const btn = document.getElementById("btn-salvar-item-ordem");
  if (btn) btn.textContent = "Adicionar item";

  limparMensagemItensOrdem();
}

function calcularValorTotalItemOrdem() {
  const quantidade = numeroCampoOrdem("item-quantidade");
  const valorUnitario = numeroCampoOrdem("item-valor-unitario");
  const total = quantidade * valorUnitario;

  setValorOrdem("item-valor-total", numeroParaInputOrdem(total));

  return total;
}

function calcularTotalItensOrdem() {
  return itensOrdemCache.reduce((soma, item) => {
    return soma + converterNumeroOrdem(item.valor_total);
  }, 0);
}

/* =========================================================
   FINANCEIRO DA ORDEM
   ========================================================= */

function preencherFormularioFinanceiroOrdem() {
  if (!ordemAtual) return;

  setValorOrdem("financeiro-valor-mao-obra", numeroParaInputOrdem(ordemAtual.valor_mao_obra || 0));
  setValorOrdem("financeiro-desconto", numeroParaInputOrdem(ordemAtual.desconto || 0));
  setValorOrdem("financeiro-forma-pagamento", ordemAtual.forma_pagamento || "");
  setValorOrdem("financeiro-status-pagamento", ordemAtual.status_pagamento || "pendente");
  setValorOrdem("financeiro-valor-pago", numeroParaInputOrdem(ordemAtual.valor_pago || 0));

  calcularFinanceiroOrdemNaTela();
}

function calcularFinanceiroOrdemNaTela() {
  const totalItens = calcularTotalItensOrdem();
  const maoObra = numeroCampoOrdem("financeiro-valor-mao-obra");
  const desconto = numeroCampoOrdem("financeiro-desconto");
  const valorPago = numeroCampoOrdem("financeiro-valor-pago");

  const total = Math.max((totalItens + maoObra) - desconto, 0);
  const saldo = Math.max(total - valorPago, 0);

  setValorOrdem("financeiro-valor-total", numeroParaInputOrdem(total));
  setValorOrdem("financeiro-saldo-restante", numeroParaInputOrdem(saldo));

  return {
    totalItens,
    maoObra,
    desconto,
    valorPago,
    total,
    saldo
  };
}

function ajustarPagamentoFinanceiroOrdem() {
  const statusPagamento = valorInputOrdem("financeiro-status-pagamento");

  const financeiro = calcularFinanceiroOrdemNaTela();

  if (statusPagamento === "pago") {
    setValorOrdem("financeiro-valor-pago", numeroParaInputOrdem(financeiro.total));
    setValorOrdem("financeiro-saldo-restante", "0.00");
  }

  if (statusPagamento === "pendente") {
    setValorOrdem("financeiro-valor-pago", "0.00");
    setValorOrdem("financeiro-saldo-restante", numeroParaInputOrdem(financeiro.total));
  }

  if (statusPagamento === "parcial") {
    calcularFinanceiroOrdemNaTela();
  }
}

async function salvarFinanceiroOrdem(event) {
  event.preventDefault();

  try {
    limparMensagemFinanceiroOrdem();

    if (!ordemAtual?.id) {
      mostrarMensagemFinanceiroOrdem("OS não carregada.", "erro");
      return;
    }

    if (ordemAtual.status === "concluida") {
      mostrarMensagemFinanceiroOrdem(
        "Esta OS já foi finalizada. Não é possível alterar o pagamento.",
        "erro"
      );
      return;
    }

    const session = await obterSessaoAtualOrdem();

    if (!session) {
      redirecionarParaLoginOrdem();
      return;
    }

    usuarioLogadoOrdem = session.user;

    const dados = montarObjetoFinanceiroOrdem();

    const btn = document.getElementById("btn-salvar-financeiro");
    alterarEstadoBotaoOrdem(btn, true, "Salvando...");

    const { data, error } = await window._supabase
      .from("ordens_servico")
      .update(dados)
      .eq("id", ordemAtual.id)
      .eq("user_id", usuarioLogadoOrdem.id)
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo_cliente,
          cpf_cnpj,
          whatsapp,
          email,
          endereco,
          cidade,
          estado,
          cep,
          observacoes,
          status,
          categoria
        )
      `)
      .single();

    if (error) {
      console.error("Erro ao salvar financeiro da OS:", error);
      mostrarMensagemFinanceiroOrdem(
        "Erro ao salvar pagamento. Verifique os dados e tente novamente.",
        "erro"
      );
      return;
    }

    ordemAtual = data;
    preencherDadosOrdem(ordemAtual);
    preencherFormularioFinanceiroOrdem();

    mostrarMensagemFinanceiroOrdem(
      "Pagamento salvo com sucesso.",
      "sucesso"
    );

  } catch (erro) {
    console.error("Erro inesperado ao salvar financeiro:", erro);
    mostrarMensagemFinanceiroOrdem(
      "Erro inesperado ao salvar pagamento.",
      "erro"
    );
  } finally {
    const btn = document.getElementById("btn-salvar-financeiro");
    alterarEstadoBotaoOrdem(btn, false, "Salvar pagamento");
  }
}

function montarObjetoFinanceiroOrdem() {
  const financeiro = calcularFinanceiroOrdemNaTela();
  const statusPagamento = valorInputOrdem("financeiro-status-pagamento") || "pendente";

  let valorPago = financeiro.valorPago;
  let saldo = financeiro.saldo;

  if (statusPagamento === "pago") {
    valorPago = financeiro.total;
    saldo = 0;
  }

  if (statusPagamento === "pendente") {
    valorPago = 0;
    saldo = financeiro.total;
  }

  if (statusPagamento === "parcial") {
    saldo = Math.max(financeiro.total - valorPago, 0);
  }

  return {
    valor_mao_obra: financeiro.maoObra,
    valor_materiais: financeiro.totalItens,
    desconto: financeiro.desconto,
    valor_total: financeiro.total,
    forma_pagamento: valorInputOrdem("financeiro-forma-pagamento") || null,
    status_pagamento: statusPagamento,
    valor_pago: valorPago,
    saldo_restante: saldo
  };
}

async function atualizarValoresOrdemAPartirDosItens() {
  try {
    if (!ordemAtual?.id || !usuarioLogadoOrdem?.id) return;

    const dadosFinanceiros = montarObjetoFinanceiroOrdem();

    const { data, error } = await window._supabase
      .from("ordens_servico")
      .update(dadosFinanceiros)
      .eq("id", ordemAtual.id)
      .eq("user_id", usuarioLogadoOrdem.id)
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo_cliente,
          cpf_cnpj,
          whatsapp,
          email,
          endereco,
          cidade,
          estado,
          cep,
          observacoes,
          status,
          categoria
        )
      `)
      .single();

    if (error) {
      console.error("Erro ao atualizar valores da OS:", error);
      return;
    }

    ordemAtual = data;
    preencherDadosOrdem(ordemAtual);
    preencherFormularioFinanceiroOrdem();

  } catch (erro) {
    console.error("Erro inesperado ao atualizar valores da OS:", erro);
  }
}

async function finalizarOrdemServico() {
  try {
    limparMensagemFinanceiroOrdem();

    if (!ordemAtual?.id) {
      mostrarMensagemFinanceiroOrdem("OS não carregada.", "erro");
      return;
    }

    if (ordemAtual.status === "concluida") {
      mostrarMensagemFinanceiroOrdem("Esta OS já está finalizada.", "info");
      return;
    }

    const dadosFinanceiros = montarObjetoFinanceiroOrdem();

    if (!dadosFinanceiros.forma_pagamento) {
      mostrarMensagemFinanceiroOrdem(
        "Selecione a forma de pagamento antes de finalizar a OS.",
        "erro"
      );
      return;
    }

    if (dadosFinanceiros.status_pagamento !== "pago") {
      mostrarMensagemFinanceiroOrdem(
        "Para finalizar a OS, o status do pagamento precisa estar como Pago.",
        "erro"
      );
      return;
    }

    if (dadosFinanceiros.valor_total <= 0) {
      const confirmarSemValor = confirm(
        "O valor total da OS está zerado. Deseja finalizar mesmo assim?"
      );

      if (!confirmarSemValor) return;
    }

    const itensComBaixa = itensOrdemCache.filter((item) => {
      return item.baixar_estoque === true && item.estoque_baixado !== true;
    });

    if (itensComBaixa.length > 0) {
      const confirmarBaixa = confirm(
        "Ao finalizar a OS, os itens marcados serão baixados do estoque. Deseja continuar?"
      );

      if (!confirmarBaixa) return;
    } else {
      const confirmar = confirm("Deseja finalizar esta OS?");
      if (!confirmar) return;
    }

    const btn = document.getElementById("btn-finalizar-ordem");
    alterarEstadoBotaoOrdem(btn, true, "Finalizando...");

    const { data, error } = await window._supabase
      .from("ordens_servico")
      .update({
        ...dadosFinanceiros,
        status: "concluida",
        status_pagamento: "pago",
        valor_pago: dadosFinanceiros.valor_total,
        saldo_restante: 0,
        data_conclusao: hojeISO()
      })
      .eq("id", ordemAtual.id)
      .eq("user_id", usuarioLogadoOrdem.id)
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo_cliente,
          cpf_cnpj,
          whatsapp,
          email,
          endereco,
          cidade,
          estado,
          cep,
          observacoes,
          status,
          categoria
        )
      `)
      .single();

    if (error) {
      console.error("Erro ao finalizar OS:", error);
      mostrarMensagemFinanceiroOrdem(
        "Erro ao finalizar OS. Verifique se as funções/triggers de estoque foram criadas no Supabase.",
        "erro"
      );
      return;
    }

    ordemAtual = data;

    await carregarProdutosEstoqueOrdem();
    await carregarItensOrdem(ordemAtual.id);
    await carregarOrdemPorId(ordemAtual.id);
    await carregarOrcamentoVinculadoOrdem();
    await carregarVeiculoVinculadoOrdem();

    mostrarMensagemFinanceiroOrdem(
      "OS finalizada com sucesso. Se a trigger de estoque estiver ativa, os produtos marcados foram baixados automaticamente.",
      "sucesso"
    );

  } catch (erro) {
    console.error("Erro inesperado ao finalizar OS:", erro);
    mostrarMensagemFinanceiroOrdem(
      "Erro inesperado ao finalizar OS.",
      "erro"
    );
  } finally {
    const btn = document.getElementById("btn-finalizar-ordem");
    alterarEstadoBotaoOrdem(btn, false, "Finalizar OS");
  }
}

/* =========================================================
   PREENCHER TELA
   ========================================================= */

function preencherDadosOrdem(ordem) {
  if (!ordem) return;

  const numeroOS = formatarNumeroOSDetalhe(ordem.numero_os);
  const tituloOS = ordem.titulo || "Ordem de Serviço";

  setTextoOrdem("titulo-pagina-ordem", `${numeroOS}`);
  setTextoOrdem("subtitulo-pagina-ordem", tituloOS);

  setTextoOrdem("detalhe-numero-os", numeroOS);
  setTextoOrdem("detalhe-titulo-os", tituloOS);
  setTextoOrdem("detalhe-responsavel-os", ordem.responsavel || "Consultor Técnico");

  setTextoOrdem("detalhe-data-abertura-os", formatarDataVisualOrdem(ordem.data_abertura) || "-");
  setTextoOrdem("detalhe-data-prevista-os", formatarDataVisualOrdem(ordem.data_prevista) || "-");
  setTextoOrdem("detalhe-data-conclusao-os", formatarDataVisualOrdem(ordem.data_conclusao) || "-");

  setTextoOrdem("detalhe-descricao-problema", ordem.descricao_problema || "Não informado.");
  setTextoOrdem("detalhe-descricao-servico", ordem.descricao_servico || "Não informado.");

  setTextoOrdem("detalhe-observacoes-cliente", ordem.observacoes_cliente || "Nenhuma observação para o cliente.");
  setTextoOrdem("detalhe-observacoes-internas", ordem.observacoes_internas || "Nenhuma observação interna.");

  preencherStatusOrdem(ordem);
  preencherClienteOrdem(ordem.clientes);
  preencherVeiculoOrdem(veiculoVinculadoOrdem);
  preencherValoresOrdem(ordem);
  preencherGarantiaOrdem(ordem);
  controlarTelaPorStatusOrdem(ordem);

  if (orcamentoVinculadoOrdem) {
    preencherCardOrcamentoVinculado(orcamentoVinculadoOrdem);
  }
}

function preencherStatusOrdem(ordem) {
  const statusEl = document.getElementById("detalhe-status-os");
  const pagamentoEl = document.getElementById("detalhe-status-pagamento-os");

  const status = ordem.status || "aberta";
  const statusPagamento = ordem.status_pagamento || "pendente";

  if (statusEl) {
    statusEl.className = `tag ${escaparHTMLClasse(status)}`;
    statusEl.textContent = formatarStatusOrdem(status);
  }

  if (pagamentoEl) {
    pagamentoEl.className = `tag ${escaparHTMLClasse(statusPagamento)}`;
    pagamentoEl.textContent = formatarStatusPagamentoOrdem(statusPagamento);
  }
}

function preencherClienteOrdem(cliente) {
  if (!cliente) {
    setTextoOrdem("detalhe-cliente-nome", "Sem cliente vinculado");
    setTextoOrdem("detalhe-cliente-whatsapp", "-");
    setTextoOrdem("detalhe-cliente-email", "-");
    setTextoOrdem("detalhe-cliente-documento", "-");
    setTextoOrdem("detalhe-cliente-cidade", "-");
    setTextoOrdem("detalhe-cliente-endereco", "-");
    return;
  }

  setTextoOrdem("detalhe-cliente-nome", cliente.nome || "-");
  setTextoOrdem("detalhe-cliente-whatsapp", formatarTelefoneVisualOrdem(cliente.whatsapp) || "-");
  setTextoOrdem("detalhe-cliente-email", cliente.email || "-");
  setTextoOrdem("detalhe-cliente-documento", cliente.cpf_cnpj || "-");

  const cidadeEstado = montarCidadeEstadoOrdem(cliente);
  setTextoOrdem("detalhe-cliente-cidade", cidadeEstado || "-");

  const enderecoCompleto = montarEnderecoOrdem(cliente);
  setTextoOrdem("detalhe-cliente-endereco", enderecoCompleto || "-");
}


/* =========================================================
   VEÍCULO VINCULADO À OS
   ========================================================= */

async function carregarVeiculoVinculadoOrdem() {
  try {
    veiculoVinculadoOrdem = null;

    if (!ordemAtual?.veiculo_id || !usuarioLogadoOrdem?.id) {
      preencherVeiculoOrdem(null);
      return;
    }

    const { data, error } = await window._supabase
      .from("veiculos")
      .select("id, cliente_id, placa, chassi, marca, modelo, cor, prisma, ano, observacoes, ativo")
      .eq("id", ordemAtual.veiculo_id)
      .eq("user_id", usuarioLogadoOrdem.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar veículo vinculado:", error);
      preencherVeiculoOrdem(null);
      return;
    }

    veiculoVinculadoOrdem = data || null;
    preencherVeiculoOrdem(veiculoVinculadoOrdem);
  } catch (erro) {
    console.error("Erro inesperado ao carregar veículo vinculado:", erro);
    preencherVeiculoOrdem(null);
  }
}

function preencherVeiculoOrdem(veiculo) {
  const card = document.getElementById("card-veiculo-ordem");

  if (!veiculo) {
    if (card) card.classList.add("oculto");

    setTextoOrdem("detalhe-veiculo-placa", "-");
    setTextoOrdem("detalhe-veiculo-marca", "-");
    setTextoOrdem("detalhe-veiculo-modelo", "-");
    setTextoOrdem("detalhe-veiculo-cor", "-");
    setTextoOrdem("detalhe-veiculo-prisma", "-");
    setTextoOrdem("detalhe-veiculo-ano", "-");
    setTextoOrdem("detalhe-veiculo-chassi", "-");
    setTextoOrdem("detalhe-veiculo-id", "-");
    setTextoOrdem("detalhe-veiculo-observacoes", "Nenhum veículo vinculado a esta OS.");
    return;
  }

  if (card) card.classList.remove("oculto");

  setTextoOrdem("detalhe-veiculo-placa", veiculo.placa || "-");
  setTextoOrdem("detalhe-veiculo-marca", veiculo.marca || "-");
  setTextoOrdem("detalhe-veiculo-modelo", veiculo.modelo || "-");
  setTextoOrdem("detalhe-veiculo-cor", veiculo.cor || "-");
  setTextoOrdem("detalhe-veiculo-prisma", veiculo.prisma || "-");
  setTextoOrdem("detalhe-veiculo-ano", veiculo.ano || "-");
  setTextoOrdem("detalhe-veiculo-chassi", veiculo.chassi || "-");
  setTextoOrdem("detalhe-veiculo-id", veiculo.id || "-");
  setTextoOrdem("detalhe-veiculo-observacoes", veiculo.observacoes || "Nenhuma observação do veículo.");
}

function veiculoTemDadosOrdem(veiculo) {
  return !!(
    veiculo &&
    (veiculo.id || veiculo.placa || veiculo.marca || veiculo.modelo || veiculo.cor || veiculo.prisma || veiculo.chassi || veiculo.ano)
  );
}

function preencherValoresOrdem(ordem) {
  setTextoOrdem("detalhe-valor-mao-obra", formatarMoedaOrdem(ordem.valor_mao_obra));
  setTextoOrdem("detalhe-valor-materiais", formatarMoedaOrdem(ordem.valor_materiais));
  setTextoOrdem("detalhe-desconto", formatarMoedaOrdem(ordem.desconto));
  setTextoOrdem("detalhe-valor-pago", formatarMoedaOrdem(ordem.valor_pago));
  setTextoOrdem("detalhe-saldo-restante", formatarMoedaOrdem(ordem.saldo_restante));
  setTextoOrdem("detalhe-valor-total", formatarMoedaOrdem(ordem.valor_total));
  setTextoOrdem("detalhe-forma-pagamento", formatarFormaPagamentoOrdem(ordem.forma_pagamento));
}

function preencherGarantiaOrdem(ordem) {
  const dias = converterNumeroOrdem(ordem.garantia_dias);

  if (dias > 0) {
    setTextoOrdem("detalhe-garantia-dias", `${dias} dias`);
  } else {
    setTextoOrdem("detalhe-garantia-dias", "Sem garantia informada");
  }

  const validade = calcularValidadeGarantia(ordem.data_conclusao, dias);

  setTextoOrdem("detalhe-garantia-validade", validade || "-");
  setTextoOrdem(
    "detalhe-garantia-observacoes",
    ordem.garantia_observacoes || "Nenhuma observação de garantia."
  );
}

function controlarTelaPorStatusOrdem(ordem) {
  const concluida = ordem?.status === "concluida";

  const btnSalvarFinanceiro = document.getElementById("btn-salvar-financeiro");
  const btnFinalizar = document.getElementById("btn-finalizar-ordem");
  const btnSalvarItem = document.getElementById("btn-salvar-item-ordem");
  const btnImportarItens = document.getElementById("btn-importar-itens-orcamento");

  if (btnSalvarFinanceiro) btnSalvarFinanceiro.disabled = concluida;
  if (btnFinalizar) {
    btnFinalizar.disabled = concluida;
    btnFinalizar.textContent = concluida ? "OS finalizada" : "Finalizar OS";
  }
  if (btnSalvarItem) btnSalvarItem.disabled = concluida;
  if (btnImportarItens) btnImportarItens.disabled = concluida;
}

/* =========================================================
   AÇÕES DA TELA
   ========================================================= */

function editarOrdemAtual() {
  if (!ordemAtual || !ordemAtual.id) {
    alert("Ordem de serviço não carregada.");
    return;
  }

  window.location.href = `ordens.html?editar=${encodeURIComponent(ordemAtual.id)}`;
}

async function gerarPDFOrdemAtual() {
  if (!ordemAtual || !ordemAtual.id) {
    alert("Ordem de serviço não carregada.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Biblioteca jsPDF não carregada. Verifique se o script do jsPDF foi adicionado antes do ordem.js no ordem.html.");
    return;
  }

  const btn = document.getElementById("btn-pdf-ordem");
  alterarEstadoBotaoOrdem(btn, true, "Gerando PDF...");

  try {
    await gerarPDFProfissionalOrdemServico();
  } catch (erro) {
    console.error("Erro ao gerar PDF da OS:", erro);
    alert("Não foi possível gerar o PDF da OS. Verifique o console para detalhes.");
  } finally {
    alterarEstadoBotaoOrdem(btn, false, "Gerar PDF");
  }
}

/* =========================================================
   PDF PROFISSIONAL DA ORDEM DE SERVIÇO
   ========================================================= */

async function gerarPDFProfissionalOrdemServico() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const perfil = await buscarPerfilEmpresaPDFOrdem();
  const cliente = ordemAtual.clientes || {};
  const veiculo = veiculoVinculadoOrdem || {};
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();

  const margem = 12;
  const larguraUtil = larguraPagina - (margem * 2);
  let y = margem;

  const corMarrom = [0, 0, 0];
  const corAmarelo = [255, 255, 255];
  const corTexto = [0, 0, 0];
  const corTextoSuave = [70, 70, 70];
  const corBorda = [120, 120, 120];
  const corBege = [245, 245, 245];

  function setTexto(cor = corTexto) {
    doc.setTextColor(cor[0], cor[1], cor[2]);
  }

  function setFill(cor) {
    doc.setFillColor(cor[0], cor[1], cor[2]);
  }

  function setDraw(cor = corBorda) {
    doc.setDrawColor(cor[0], cor[1], cor[2]);
  }

  function texto(valor, fallback = "-") {
    const final = valor === null || valor === undefined || String(valor).trim() === ""
      ? fallback
      : String(valor).trim();
    return final;
  }

  function adicionarPaginaSePreciso(alturaNecessaria = 18) {
    if (y + alturaNecessaria <= alturaPagina - 16) return;
    desenharRodapePDFOrdem(doc, margem, larguraPagina, alturaPagina, corTextoSuave);
    doc.addPage();
    y = margem;
    desenharCabecalhoSimplesPDF();
  }

  function linhaHorizontal(posY = y) {
    setDraw(corBorda);
    doc.setLineWidth(0.25);
    doc.line(margem, posY, larguraPagina - margem, posY);
  }

  function textoQuebra(valor, x, posY, largura, tamanho = 9, estilo = "normal", cor = corTexto, alturaLinha = 4.6) {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamanho);
    setTexto(cor);

    const linhas = doc.splitTextToSize(texto(valor), largura);
    doc.text(linhas, x, posY);
    return linhas.length * alturaLinha;
  }

  function secao(titulo) {
    adicionarPaginaSePreciso(16);
    setFill(corMarrom);
    doc.roundedRect(margem, y, larguraUtil, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTexto(corAmarelo);
    doc.text(titulo, margem + 3, y + 5.5);
    y += 11;
  }

  function infoLinha(rotulo, valor, x, largura, posY) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setTexto(corTextoSuave);
    doc.text(rotulo, x, posY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTexto(corTexto);
    const linhas = doc.splitTextToSize(texto(valor), largura);
    doc.text(linhas, x, posY + 4.2);
    return 5 + (linhas.length * 4.2);
  }

  function caixaInfo(colunas) {
    adicionarPaginaSePreciso(22);
    const gap = 3;
    const larguraColuna = (larguraUtil - (gap * (colunas.length - 1))) / colunas.length;
    const alturas = colunas.map((item, index) => {
      const x = margem + (index * (larguraColuna + gap));
      const linhas = doc.splitTextToSize(texto(item.valor), larguraColuna - 6);
      return 12 + (linhas.length * 4.1);
    });
    const altura = Math.max(17, ...alturas);

    colunas.forEach((item, index) => {
      const x = margem + (index * (larguraColuna + gap));
      setFill([255, 255, 255]);
      setDraw(corBorda);
      doc.roundedRect(x, y, larguraColuna, altura, 2, 2, "FD");
      infoLinha(item.rotulo, item.valor, x + 3, larguraColuna - 6, y + 5);
    });

    y += altura + 4;
  }

  function blocoTexto(titulo, valor) {
    adicionarPaginaSePreciso(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTexto(corMarrom);
    doc.text(titulo, margem, y);
    y += 4.5;

    const linhas = doc.splitTextToSize(texto(valor, "Não informado."), larguraUtil - 6);
    const altura = Math.max(14, linhas.length * 4.5 + 8);
    adicionarPaginaSePreciso(altura + 8);

    setFill([255, 255, 255]);
    setDraw(corBorda);
    doc.roundedRect(margem, y, larguraUtil, altura, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTexto(corTexto);
    doc.text(linhas, margem + 3, y + 6);
    y += altura + 5;
  }

  function tabelaItens() {
    secao("ITENS / SERVIÇOS / PEÇAS");

    const itens = Array.isArray(itensOrdemCache) ? itensOrdemCache : [];

    if (!itens.length) {
      blocoTexto("Itens da OS", "Nenhum item adicionado nesta ordem de serviço.");
      return;
    }

    const col = {
      desc: margem,
      qtd: margem + 96,
      unit: margem + 124,
      total: margem + 158
    };

    function cabecalhoTabela() {
      adicionarPaginaSePreciso(14);
      setFill(corAmarelo);
      setDraw(corMarrom);
      doc.rect(margem, y, larguraUtil, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setTexto(corMarrom);
      doc.text("Descrição", col.desc + 2, y + 5.2);
      doc.text("Qtd", col.qtd, y + 5.2);
      doc.text("Unit.", col.unit, y + 5.2);
      doc.text("Total", col.total, y + 5.2);
      y += 8;
    }

    cabecalhoTabela();

    itens.forEach((item, index) => {
      const descricao = texto(item.descricao, "Item sem descrição");
      const tipo = formatarTipoItemOrdem(item.tipo);
      const produtoNome = item.produtos_estoque?.nome ? `Estoque: ${item.produtos_estoque.nome}` : "Item manual";
      const detalhe = `${tipo} • ${produtoNome}${item.baixar_estoque ? " • baixar estoque" : ""}${item.estoque_baixado ? " • estoque baixado" : ""}`;
      const linhasDesc = doc.splitTextToSize(descricao, 90);
      const linhasDetalhe = doc.splitTextToSize(detalhe, 90);
      const alturaLinha = Math.max(12, (linhasDesc.length * 4.1) + (linhasDetalhe.length * 3.4) + 5);

      if (y + alturaLinha > alturaPagina - 22) {
        desenharRodapePDFOrdem(doc, margem, larguraPagina, alturaPagina, corTextoSuave);
        doc.addPage();
        y = margem;
        desenharCabecalhoSimplesPDF();
        cabecalhoTabela();
      }

      if (index % 2 === 0) {
        setFill([255, 255, 255]);
      } else {
        setFill(corBege);
      }
      setDraw([235, 225, 215]);
      doc.rect(margem, y, larguraUtil, alturaLinha, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setTexto(corTexto);
      doc.text(linhasDesc, col.desc + 2, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      setTexto(corTextoSuave);
      doc.text(linhasDetalhe, col.desc + 2, y + 4.5 + (linhasDesc.length * 4.1));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setTexto(corTexto);
      doc.text(`${formatarQuantidadeOrdem(item.quantidade)} ${item.unidade || "un"}`, col.qtd, y + 5);
      doc.text(formatarMoedaOrdem(item.valor_unitario), col.unit, y + 5);
      doc.text(formatarMoedaOrdem(item.valor_total), col.total, y + 5);

      y += alturaLinha;
    });

    y += 5;
  }

  function resumoFinanceiro() {
    secao("VALORES E PAGAMENTO");

    const totalItens = calcularTotalItensOrdem();
    const maoObra = converterNumeroOrdem(ordemAtual.valor_mao_obra);
    const materiais = converterNumeroOrdem(ordemAtual.valor_materiais || totalItens);
    const desconto = converterNumeroOrdem(ordemAtual.desconto);
    const total = converterNumeroOrdem(ordemAtual.valor_total || ((totalItens + maoObra) - desconto));
    const valorPago = converterNumeroOrdem(ordemAtual.valor_pago);
    const saldo = converterNumeroOrdem(ordemAtual.saldo_restante || Math.max(total - valorPago, 0));

    caixaInfo([
      { rotulo: "Mão de obra", valor: formatarMoedaOrdem(maoObra) },
      { rotulo: "Materiais / peças", valor: formatarMoedaOrdem(materiais) },
      { rotulo: "Desconto", valor: formatarMoedaOrdem(desconto) }
    ]);

    caixaInfo([
      { rotulo: "Forma de pagamento", valor: formatarFormaPagamentoOrdem(ordemAtual.forma_pagamento) },
      { rotulo: "Status do pagamento", valor: formatarStatusPagamentoOrdem(ordemAtual.status_pagamento) },
      { rotulo: "Valor pago", valor: formatarMoedaOrdem(valorPago) }
    ]);

    adicionarPaginaSePreciso(22);
    setFill(corMarrom);
    setDraw(corAmarelo);
    doc.roundedRect(margem, y, larguraUtil, 18, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTexto(corAmarelo);
    doc.text("TOTAL DA OS", margem + 4, y + 7);
    doc.setFontSize(17);
    doc.text(formatarMoedaOrdem(total), larguraPagina - margem - 4, y + 12, { align: "right" });
    doc.setFontSize(8);
    doc.text(`Saldo restante: ${formatarMoedaOrdem(saldo)}`, larguraPagina - margem - 4, y + 16, { align: "right" });
    y += 24;
  }

  function assinatura() {
    adicionarPaginaSePreciso(42);
    y += 5;
    const larguraAss = (larguraUtil - 12) / 2;
    const yLinha = y + 18;

    setDraw(corTextoSuave);
    doc.setLineWidth(0.35);
    doc.line(margem, yLinha, margem + larguraAss, yLinha);
    doc.line(margem + larguraAss + 12, yLinha, margem + (larguraAss * 2) + 12, yLinha);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTexto(corTexto);
    doc.text("Assinatura do cliente", margem + larguraAss / 2, yLinha + 5, { align: "center" });
    doc.text("Assinatura do consultor técnico", margem + larguraAss + 12 + larguraAss / 2, yLinha + 5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTexto(corTextoSuave);
    doc.text(texto(cliente.nome, "Cliente"), margem + larguraAss / 2, yLinha + 9, { align: "center" });
    doc.text(texto(ordemAtual.responsavel, perfil?.nome || "Consultor Técnico"), margem + larguraAss + 12 + larguraAss / 2, yLinha + 9, { align: "center" });

    y = yLinha + 16;
  }

  function desenharCabecalhoSimplesPDF() {
    setFill(corMarrom);
    doc.rect(0, 0, larguraPagina, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTexto(corAmarelo);
    doc.text("FS Orçamentos • Ordem de Serviço", margem, 5.5);
    y = 14;
  }

  async function desenharCabecalhoPrincipal() {
    setFill(corMarrom);
    doc.roundedRect(margem, y, larguraUtil, 28, 3, 3, "F");

    const logoUrl = perfil?.foto_url || localStorage.getItem("foto_url") || "";
    let logoInserida = false;

    if (logoUrl) {
      try {
        const logoBase64 = await converterImagemUrlParaBase64PDFOrdem(logoUrl);
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", margem + 4, y + 4, 20, 20);
          logoInserida = true;
        }
      } catch (erroLogo) {
        console.warn("Não foi possível inserir logo no PDF da OS:", erroLogo);
      }
    }

    if (!logoInserida) {
      setFill(corAmarelo);
      doc.roundedRect(margem + 4, y + 4, 20, 20, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      setTexto(corMarrom);
      doc.text("FS", margem + 14, y + 16, { align: "center" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setTexto(corAmarelo);
    doc.text(texto(perfil?.nome_empresa || localStorage.getItem("nome_empresa"), "FS Orçamentos"), margem + 28, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTexto([255, 250, 240]);
    const empresaLinha = [
      perfil?.telefone_empresa || localStorage.getItem("telefone_empresa"),
      perfil?.cnpj_empresa || localStorage.getItem("cnpj_empresa"),
      perfil?.endereco_empresa || localStorage.getItem("endereco_empresa")
    ].filter(Boolean).join(" • ");
    doc.text(texto(empresaLinha, "Documento gerado pelo FS Orçamentos"), margem + 28, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setTexto([255, 255, 255]);
    doc.text("ORDEM DE SERVIÇO", larguraPagina - margem - 4, y + 10, { align: "right" });

    doc.setFontSize(10);
    setTexto(corAmarelo);
    doc.text(formatarNumeroOSDetalhe(ordemAtual.numero_os), larguraPagina - margem - 4, y + 17, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTexto([255, 250, 240]);
    doc.text(`Emitido em ${formatarDataHoraVisualOrdem(new Date().toISOString())}`, larguraPagina - margem - 4, y + 22, { align: "right" });

    y += 34;
  }

  await desenharCabecalhoPrincipal();

  secao("DADOS PRINCIPAIS");
  caixaInfo([
    { rotulo: "Número da OS", valor: formatarNumeroOSDetalhe(ordemAtual.numero_os) },
    { rotulo: "Status", valor: formatarStatusOrdem(ordemAtual.status) },
    { rotulo: "Consultor Técnico", valor: ordemAtual.responsavel || perfil?.nome || "-" }
  ]);
  caixaInfo([
    { rotulo: "Título", valor: ordemAtual.titulo || "Ordem de Serviço" },
    { rotulo: "Data de abertura", valor: formatarDataVisualOrdem(ordemAtual.data_abertura) || "-" },
    { rotulo: "Data prevista", valor: formatarDataVisualOrdem(ordemAtual.data_prevista) || "-" }
  ]);

  secao("CLIENTE");
  caixaInfo([
    { rotulo: "Nome", valor: cliente.nome || "Sem cliente vinculado" },
    { rotulo: "WhatsApp", valor: formatarTelefoneVisualOrdem(cliente.whatsapp) || "-" },
    { rotulo: "E-mail", valor: cliente.email || "-" }
  ]);
  caixaInfo([
    { rotulo: "CPF/CNPJ", valor: cliente.cpf_cnpj || "-" },
    { rotulo: "Cidade/UF", valor: montarCidadeEstadoOrdem(cliente) || "-" },
    { rotulo: "Endereço", valor: montarEnderecoOrdem(cliente) || "-" }
  ]);

  if (veiculoTemDadosOrdem(veiculo)) {
    secao("VEÍCULO");
    caixaInfo([
      { rotulo: "Placa", valor: veiculo.placa || "-" },
      { rotulo: "Marca", valor: veiculo.marca || "-" },
      { rotulo: "Modelo", valor: veiculo.modelo || "-" }
    ]);
    caixaInfo([
      { rotulo: "Cor", valor: veiculo.cor || "-" },
      { rotulo: "Prisma", valor: veiculo.prisma || "-" },
      { rotulo: "Ano", valor: veiculo.ano || "-" }
    ]);
    caixaInfo([
      { rotulo: "Chassi", valor: veiculo.chassi || "-" },
      { rotulo: "ID do veículo", valor: veiculo.id || "-" },
      { rotulo: "Cliente vinculado", valor: cliente.nome || "-" }
    ]);
    if (veiculo.observacoes) {
      blocoTexto("Observações do veículo", veiculo.observacoes);
    }
  }

  if (orcamentoVinculadoOrdem?.id) {
    secao("ORÇAMENTO VINCULADO");
    caixaInfo([
      { rotulo: "Orçamento", valor: formatarNumeroOrcamentoVinculado(orcamentoVinculadoOrdem) },
      { rotulo: "Status", valor: formatarStatusOrcamentoVinculado(orcamentoVinculadoOrdem.status) },
      { rotulo: "Valor aprovado", valor: formatarMoedaOrdem(orcamentoVinculadoOrdem.total) }
    ]);
  }

  secao("SOLICITAÇÃO E SERVIÇO");
  blocoTexto("Solicitação / problema informado", ordemAtual.descricao_problema);
  blocoTexto("Serviço a executar", ordemAtual.descricao_servico);

  tabelaItens();
  resumoFinanceiro();

  secao("GARANTIA E OBSERVAÇÕES");
  const diasGarantia = converterNumeroOrdem(ordemAtual.garantia_dias);
  const validadeGarantia = calcularValidadeGarantia(ordemAtual.data_conclusao, diasGarantia);
  caixaInfo([
    { rotulo: "Garantia", valor: diasGarantia > 0 ? `${diasGarantia} dias` : "Sem garantia informada" },
    { rotulo: "Validade da garantia", valor: validadeGarantia || "-" },
    { rotulo: "Data de conclusão", valor: formatarDataVisualOrdem(ordemAtual.data_conclusao) || "-" }
  ]);
  blocoTexto("Observações para o cliente", ordemAtual.observacoes_cliente || "Nenhuma observação para o cliente.");
  blocoTexto("Observações da garantia", ordemAtual.garantia_observacoes || "Nenhuma observação de garantia.");

  assinatura();
  desenharRodapePDFOrdem(doc, margem, larguraPagina, alturaPagina, corTextoSuave);

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTexto(corTextoSuave);
    doc.text(`Página ${i} de ${totalPaginas}`, larguraPagina - margem, alturaPagina - 5, { align: "right" });
  }

  const nomeArquivo = `OS-${String(ordemAtual.numero_os || ordemAtual.id || "servico").replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
  doc.save(nomeArquivo);
}

async function buscarPerfilEmpresaPDFOrdem() {
  try {
    if (!window._supabase || !usuarioLogadoOrdem?.id) {
      return null;
    }

    const { data, error } = await window._supabase
      .from("perfis")
      .select("nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url")
      .eq("id", usuarioLogadoOrdem.id)
      .maybeSingle();

    if (error) {
      console.warn("Não foi possível buscar perfil para o PDF:", error);
      return null;
    }

    return data || null;
  } catch (erro) {
    console.warn("Erro inesperado ao buscar perfil para PDF:", erro);
    return null;
  }
}

function desenharRodapePDFOrdem(doc, margem, larguraPagina, alturaPagina, corTextoSuave) {
  doc.setDrawColor(215, 204, 200);
  doc.setLineWidth(0.25);
  doc.line(margem, alturaPagina - 10, larguraPagina - margem, alturaPagina - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(corTextoSuave[0], corTextoSuave[1], corTextoSuave[2]);
  doc.text("Documento gerado pelo FS Orçamentos", margem, alturaPagina - 5);
}

async function converterImagemUrlParaBase64PDFOrdem(url) {
  if (!url) return "";

  const resposta = await fetch(url, { mode: "cors" });
  if (!resposta.ok) return "";

  const blob = await resposta.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function abrirWhatsAppClienteOrdem() {
  if (!ordemAtual) {
    alert("Ordem de serviço não carregada.");
    return;
  }

  const cliente = ordemAtual.clientes;

  if (!cliente) {
    alert("Esta OS não possui cliente vinculado.");
    return;
  }

  const telefone = limparTelefoneOrdem(cliente.whatsapp);

  if (!telefone) {
    alert("Este cliente não possui WhatsApp cadastrado.");
    return;
  }

  const numeroBrasil = telefone.startsWith("55") ? telefone : "55" + telefone;

  const mensagem = montarMensagemWhatsAppOrdem(ordemAtual, cliente);

  const url = `https://wa.me/${numeroBrasil}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

function montarMensagemWhatsAppOrdem(ordem, cliente) {
  const numero = formatarNumeroOSDetalhe(ordem.numero_os);
  const status = formatarStatusOrdem(ordem.status || "aberta");
  const valor = formatarMoedaOrdem(ordem.valor_total || 0);

  const veiculo = veiculoVinculadoOrdem;
  const linhaVeiculo = veiculoTemDadosOrdem(veiculo)
    ? `
Veículo: ${[veiculo.placa, veiculo.marca, veiculo.modelo, veiculo.cor].filter(Boolean).join(" - ")}`
    : "";

  return `Olá, ${cliente.nome || "cliente"}! Tudo bem?

Segue atualização da sua ordem de serviço:

${numero}
Serviço: ${ordem.titulo || "Serviço"}${linhaVeiculo}
Status: ${status}
Valor total: ${valor}

Qualquer dúvida, fico à disposição.`;
}

/* =========================================================
   ESTADOS VISUAIS
   ========================================================= */

function setLoadingOrdem(ativo) {
  const loading = document.getElementById("loading-ordem");

  if (!loading) return;

  if (ativo) {
    loading.classList.add("ativo");
  } else {
    loading.classList.remove("ativo");
  }
}

function mostrarConteudoOrdem(mostrar) {
  const conteudo = document.getElementById("conteudo-ordem");

  if (!conteudo) return;

  if (mostrar) {
    conteudo.classList.remove("oculto");
  } else {
    conteudo.classList.add("oculto");
  }
}

function mostrarMensagemOrdem(texto, tipo = "info") {
  const el = document.getElementById("mensagem-ordem");

  if (!el) return;

  el.className = `mensagem-ordem ${tipo}`;
  el.textContent = texto;
}

function limparMensagemOrdem() {
  const el = document.getElementById("mensagem-ordem");

  if (!el) return;

  el.className = "mensagem-ordem";
  el.textContent = "";
}

function mostrarMensagemItensOrdem(texto, tipo = "info") {
  const el = document.getElementById("mensagem-itens-ordem");

  if (!el) return;

  el.className = `mensagem-ordem ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagemItensOrdem();
    }, 4000);
  }
}

function limparMensagemItensOrdem() {
  const el = document.getElementById("mensagem-itens-ordem");

  if (!el) return;

  el.className = "mensagem-ordem";
  el.textContent = "";
}

function mostrarMensagemFinanceiroOrdem(texto, tipo = "info") {
  const el = document.getElementById("mensagem-financeiro-ordem");

  if (!el) return;

  el.className = `mensagem-ordem ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagemFinanceiroOrdem();
    }, 5000);
  }
}

function limparMensagemFinanceiroOrdem() {
  const el = document.getElementById("mensagem-financeiro-ordem");

  if (!el) return;

  el.className = "mensagem-ordem";
  el.textContent = "";
}

/* =========================================================
   HELPERS DOM
   ========================================================= */

function setTextoOrdem(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = valor ?? "-";
}

function valorInputOrdem(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorOrdem(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  if (el.type === "checkbox") {
    el.checked = !!valor;
    return;
  }

  el.value = valor ?? "";
}

function checkboxMarcadoOrdem(id) {
  const el = document.getElementById(id);
  return !!(el && el.checked);
}

function numeroCampoOrdem(id) {
  return converterNumeroOrdem(valorInputOrdem(id));
}

function alterarEstadoBotaoOrdem(botao, carregando, texto) {
  if (!botao) return;

  botao.disabled = carregando;
  botao.textContent = texto;
}

function obterParametroURL(nome) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}

function obterIdOrdemAtual() {
  const params = new URLSearchParams(window.location.search);

  const idDaURL =
    params.get("id") ||
    params.get("ordem_id") ||
    params.get("os_id");

  if (idDaURL) {
    localStorage.setItem("ultima_os_aberta_id", idDaURL);
    return idDaURL;
  }

  return "";
}

/* =========================================================
   FORMATADORES
   ========================================================= */

function converterNumeroOrdem(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor).trim();

  if (!texto) return 0;

  texto = texto.replace(/[^\d.,-]/g, "");

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  if (temVirgula) {
    texto = texto.replace(/\./g, "").replace(",", ".");
    const numeroBR = Number(texto);
    return Number.isFinite(numeroBR) ? numeroBR : 0;
  }

  if (temPonto) {
    const numeroUS = Number(texto);
    return Number.isFinite(numeroUS) ? numeroUS : 0;
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function numeroParaInputOrdem(valor) {
  const numero = converterNumeroOrdem(valor);
  return numero.toFixed(2);
}

function formatarQuantidadeOrdem(valor) {
  const numero = converterNumeroOrdem(valor);

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: numero % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function formatarMoedaOrdem(valor) {
  const numero = converterNumeroOrdem(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumeroOSDetalhe(numero) {
  if (!numero) return "OS Nº 000000";

  return `OS Nº ${String(numero).padStart(6, "0")}`;
}

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataVisualOrdem(data) {
  if (!data) return "";

  const partes = String(data).substring(0, 10).split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHoraVisualOrdem(dataValor) {
  if (!dataValor) return "-";

  const data = new Date(dataValor);

  if (Number.isNaN(data.getTime())) {
    return formatarDataVisualOrdem(dataValor) || "-";
  }

  return data.toLocaleString("pt-BR");
}

function formatarStatusOrdem(status) {
  const mapa = {
    aberta: "Aberta",
    em_analise: "Em análise",
    aguardando_aprovacao: "Aguardando aprovação",
    aprovada: "Aprovada",
    em_execucao: "Em execução",
    aguardando_material: "Aguardando peça/material",
    concluida: "Concluída",
    cancelada: "Cancelada"
  };

  return mapa[status] || "Aberta";
}

function formatarStatusPagamentoOrdem(status) {
  const mapa = {
    pendente: "Pagamento pendente",
    parcial: "Pagamento parcial",
    pago: "Pago"
  };

  return mapa[status] || "Pagamento pendente";
}

function formatarFormaPagamentoOrdem(forma) {
  const mapa = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto",
    transferencia: "Transferência",
    outro: "Outro"
  };

  return mapa[forma] || "Não informado";
}

function formatarTipoItemOrdem(tipo) {
  const mapa = {
    servico: "Serviço",
    produto: "Produto",
    peca: "Peça",
    material: "Material",
    mao_obra: "Mão de obra",
    deslocamento: "Deslocamento",
    outro: "Outro"
  };

  return mapa[tipo] || "Serviço";
}

function formatarTelefoneVisualOrdem(telefone) {
  const numero = limparTelefoneOrdem(telefone);

  if (!numero) return "";

  let n = numero;

  if (n.startsWith("55") && n.length > 11) {
    n = n.substring(2);
  }

  if (n.length === 11) {
    return `(${n.substring(0, 2)}) ${n.substring(2, 7)}-${n.substring(7)}`;
  }

  if (n.length === 10) {
    return `(${n.substring(0, 2)}) ${n.substring(2, 6)}-${n.substring(6)}`;
  }

  return numero;
}

function montarCidadeEstadoOrdem(cliente) {
  if (!cliente) return "";

  const cidade = cliente.cidade || "";
  const estado = cliente.estado || "";

  if (cidade && estado) return `${cidade}/${estado}`;
  if (cidade) return cidade;
  if (estado) return estado;

  return "";
}

function montarEnderecoOrdem(cliente) {
  if (!cliente) return "";

  const partes = [
    cliente.endereco,
    cliente.cep ? `CEP: ${cliente.cep}` : ""
  ].filter(Boolean);

  return partes.join(" - ");
}

function calcularValidadeGarantia(dataConclusao, dias) {
  if (!dataConclusao || !dias || dias <= 0) return "";

  const partes = String(dataConclusao).substring(0, 10).split("-");

  if (partes.length !== 3) return "";

  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);

  const data = new Date(ano, mes, dia);
  data.setDate(data.getDate() + dias);

  const diaFormatado = String(data.getDate()).padStart(2, "0");
  const mesFormatado = String(data.getMonth() + 1).padStart(2, "0");
  const anoFormatado = data.getFullYear();

  return `${diaFormatado}/${mesFormatado}/${anoFormatado}`;
}

/* =========================================================
   HELPERS TEXTO
   ========================================================= */

function limparTelefoneOrdem(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function escaparHTMLClasse(valor) {
  return String(valor || "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function escaparHTMLAtributo(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escaparHTMLOrdem(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   ========================================================= */

window.carregarOrdemPorId = carregarOrdemPorId;
window.editarOrdemAtual = editarOrdemAtual;
window.gerarPDFOrdemAtual = gerarPDFOrdemAtual;
window.abrirWhatsAppClienteOrdem = abrirWhatsAppClienteOrdem;

window.salvarItemOrdem = salvarItemOrdem;
window.editarItemOrdem = editarItemOrdem;
window.excluirItemOrdem = excluirItemOrdem;
window.limparFormularioItemOrdem = limparFormularioItemOrdem;
window.carregarItensOrdem = carregarItensOrdem;

window.salvarFinanceiroOrdem = salvarFinanceiroOrdem;
window.finalizarOrdemServico = finalizarOrdemServico;
window.calcularFinanceiroOrdemNaTela = calcularFinanceiroOrdemNaTela;
window.carregarOrcamentoVinculadoOrdem = carregarOrcamentoVinculadoOrdem;
window.importarItensDoOrcamentoVinculado = importarItensDoOrcamentoVinculado;
window.abrirOrcamentoVinculado = abrirOrcamentoVinculado;
window.carregarVeiculoVinculadoOrdem = carregarVeiculoVinculadoOrdem;
window.abrirModalBuscaProdutoEstoqueOrdem = abrirModalBuscaProdutoEstoqueOrdem;
window.fecharModalBuscaProdutoEstoqueOrdem = fecharModalBuscaProdutoEstoqueOrdem;
window.buscarProdutosModalOrdem = buscarProdutosModalOrdem;
window.selecionarProdutoEstoqueModalOrdem = selecionarProdutoEstoqueModalOrdem;
window.limparProdutoEstoqueSelecionadoOrdem = limparProdutoEstoqueSelecionadoOrdem;
