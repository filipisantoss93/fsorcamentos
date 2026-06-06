/* =========================================================
   FS ORÇAMENTOS - ordens.js
   Módulo de Ordens de Serviço / Premium em desenvolvimento

   Fluxo atualizado:
   - ordens.html cria apenas a OS básica
   - Consultor Técnico vem do painel/usuário logado
   - Valores, itens, estoque, pagamento e faturamento ficam em ordem.html
   ========================================================= */

let ordensCache = [];
let clientesCacheOS = [];
let veiculosCacheOS = [];
let usuarioLogadoOS = null;
let orcamentoOrigemOS = null;

document.addEventListener("DOMContentLoaded", async () => {
  await inicializarModuloOrdens();
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarModuloOrdens() {
  try {
    garantirSupabaseOS();

    const session = await obterSessaoAtualOS();

    if (!session) {
      redirecionarParaLoginOS();
      return;
    }

    usuarioLogadoOS = session.user;

    configurarEventosOrdens();
    definirDataAberturaPadrao();
    preencherConsultorTecnicoVisual();

    await carregarClientesSelectOS();
    await carregarVeiculosSelectOS();
    selecionarClientePelaURL();
    selecionarVeiculoPelaURL();
    await carregarOrcamentoOrigemPelaURL();
    await carregarOrdens();
    carregarEdicaoPelaURL();

  } catch (erro) {
    console.error("Erro ao inicializar ordens.js:", erro);
    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Erro ao iniciar o módulo de ordens de serviço. Verifique sua conexão e tente novamente.",
      "erro"
    );
  }
}

function garantirSupabaseOS() {
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

async function obterSessaoAtualOS() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data && data.session ? data.session : null;
}

function redirecionarParaLoginOS() {
  const destino = encodeURIComponent("ordens.html");
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosOrdens() {
  const form = document.getElementById("form-ordem");
  const btnLimpar = document.getElementById("btn-limpar-ordem");
  const btnAtualizar = document.getElementById("btn-atualizar-ordens");

  const busca = document.getElementById("busca-ordens");
  const filtroStatus = document.getElementById("filtro-status-ordens");
  const filtroPagamento = document.getElementById("filtro-pagamento-ordens");
  const filtroVeiculo = document.getElementById("filtro-veiculo-ordens");
  const selectCliente = document.getElementById("ordem-cliente-id");

  if (form) {
    form.addEventListener("submit", salvarOrdem);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFormularioOrdem);
  }

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", carregarOrdens);
  }

  if (busca) {
    busca.addEventListener("input", filtrarOrdens);
  }

  if (filtroStatus) {
    filtroStatus.addEventListener("change", filtrarOrdens);
  }

  if (filtroPagamento) {
    filtroPagamento.addEventListener("change", filtrarOrdens);
  }

  if (filtroVeiculo) {
    filtroVeiculo.addEventListener("input", filtrarOrdens);
  }

  if (selectCliente) {
    selectCliente.addEventListener("change", () => {
      atualizarSelectVeiculosPorClienteOS(selectCliente.value);
    });
  }

  configurarFormularioMobileOrdens();
}

function configurarFormularioMobileOrdens() {
  const card = document.getElementById("card-form-ordem");
  const botao = document.getElementById("btn-toggle-form-ordem");

  if (!card || !botao) return;

  function aplicarEstadoInicial() {
    if (window.innerWidth <= 700) {
      card.classList.add("form-fechado");
      botao.textContent = "Abrir";
    } else {
      card.classList.remove("form-fechado");
      botao.textContent = "Aberto";
    }
  }

  botao.addEventListener("click", () => {
    const fechado = card.classList.toggle("form-fechado");
    botao.textContent = fechado ? "Abrir" : "Fechar";
  });

  aplicarEstadoInicial();

  window.addEventListener("resize", aplicarEstadoInicial);
}

/* =========================================================
   CONSULTOR TÉCNICO
   ========================================================= */

function obterConsultorTecnicoOS() {
  const metadataNome = usuarioLogadoOS?.user_metadata?.nome;
  const emailNome = usuarioLogadoOS?.email
    ? usuarioLogadoOS.email.split("@")[0]
    : "";

  return (
    localStorage.getItem("consultor_tecnico_nome") ||
    localStorage.getItem("consultor_tecnico") ||
    localStorage.getItem("responsavel_selecionado_nome") ||
    localStorage.getItem("consultor_selecionado_nome") ||
    localStorage.getItem("usuario_nome") ||
    metadataNome ||
    emailNome ||
    "Consultor Técnico"
  );
}

function preencherConsultorTecnicoVisual() {
  const consultor = obterConsultorTecnicoOS();

  const campoInput = document.getElementById("ordem-consultor-tecnico");
  const campoInputVisual = document.getElementById("ordem-consultor-tecnico-visual");
  const campoTexto = document.getElementById("consultor-tecnico-os");

  if (campoInput) {
    campoInput.value = consultor;
  }

  if (campoInputVisual) {
    campoInputVisual.value = consultor;
  }

  if (campoTexto) {
    campoTexto.textContent = consultor;
  }
}

/* =========================================================
   CLIENTES NO SELECT
   ========================================================= */

async function carregarClientesSelectOS() {
  try {
    const { data, error } = await window._supabase
      .from("clientes")
      .select("id, nome, whatsapp, email, status")
      .eq("user_id", usuarioLogadoOS.id)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar clientes para OS:", error);
      mostrarMensagemOS(
        "mensagem-ordens-form",
        "Não foi possível carregar os clientes. Verifique se a tabela clientes existe.",
        "erro"
      );
      return;
    }

    clientesCacheOS = Array.isArray(data) ? data : [];
    renderizarSelectClientesOS();

  } catch (erro) {
    console.error("Erro inesperado ao carregar clientes:", erro);
  }
}

function renderizarSelectClientesOS() {
  const select = document.getElementById("ordem-cliente-id");

  if (!select) return;

  const opcoes = clientesCacheOS.map((cliente) => {
    return `
      <option value="${escaparHTMLOS(cliente.id)}">
        ${escaparHTMLOS(cliente.nome || "Cliente sem nome")}
      </option>
    `;
  }).join("");

  select.innerHTML = `
    <option value="">Selecione um cliente</option>
    ${opcoes}
  `;
}

function selecionarClientePelaURL() {
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get("cliente_id");

  if (!clienteId) return;

  const select = document.getElementById("ordem-cliente-id");

  if (select) {
    select.value = clienteId;
    atualizarSelectVeiculosPorClienteOS(clienteId, params.get("veiculo_id") || "");
  }
}


/* =========================================================
   VEÍCULOS NO SELECT
   ========================================================= */

async function carregarVeiculosSelectOS() {
  try {
    if (!usuarioLogadoOS?.id) return;

    const { data, error } = await window._supabase
      .from("veiculos_com_clientes")
      .select("id, user_id, cliente_id, placa, marca, modelo, cor, prisma, ano, ativo, cliente_nome")
      .eq("user_id", usuarioLogadoOS.id)
      .eq("ativo", true)
      .order("placa", { ascending: true });

    if (error) {
      console.error("Erro ao carregar veículos para OS:", error);

      const fallback = await window._supabase
        .from("veiculos")
        .select("id, user_id, cliente_id, placa, marca, modelo, cor, prisma, ano, ativo")
        .eq("user_id", usuarioLogadoOS.id)
        .eq("ativo", true)
        .order("placa", { ascending: true });

      if (fallback.error) {
        console.error("Erro ao carregar veículos:", fallback.error);
        mostrarMensagemOS(
          "mensagem-ordens-form",
          "Não foi possível carregar os veículos. Verifique se a tabela veiculos foi criada no Supabase.",
          "erro"
        );
        veiculosCacheOS = [];
        atualizarSelectVeiculosPorClienteOS(valorInputOS("ordem-cliente-id"));
        return;
      }

      veiculosCacheOS = Array.isArray(fallback.data) ? fallback.data : [];
      atualizarSelectVeiculosPorClienteOS(valorInputOS("ordem-cliente-id"));
      return;
    }

    veiculosCacheOS = Array.isArray(data) ? data : [];
    atualizarSelectVeiculosPorClienteOS(valorInputOS("ordem-cliente-id"));

  } catch (erro) {
    console.error("Erro inesperado ao carregar veículos:", erro);
  }
}

function atualizarSelectVeiculosPorClienteOS(clienteId, veiculoSelecionado = "") {
  const select = document.getElementById("ordem-veiculo-id");

  if (!select) return;

  if (!clienteId) {
    select.innerHTML = `<option value="">Selecione um cliente primeiro</option>`;
    select.disabled = true;
    return;
  }

  const veiculosCliente = veiculosCacheOS.filter((veiculo) => {
    return String(veiculo.cliente_id || "") === String(clienteId || "");
  });

  if (!veiculosCliente.length) {
    select.innerHTML = `<option value="">Nenhum veículo cadastrado para este cliente</option>`;
    select.disabled = false;
    return;
  }

  const opcoes = veiculosCliente.map((veiculo) => {
    const texto = formatarVeiculoOS(veiculo);
    return `<option value="${escaparHTMLOS(veiculo.id)}">${escaparHTMLOS(texto)}</option>`;
  }).join("");

  select.innerHTML = `<option value="">Selecione um veículo</option>${opcoes}`;
  select.disabled = false;

  if (veiculoSelecionado) {
    select.value = veiculoSelecionado;
  }
}

function selecionarVeiculoPelaURL() {
  const params = new URLSearchParams(window.location.search);
  const veiculoId = params.get("veiculo_id");

  if (!veiculoId) return;

  const veiculo = veiculosCacheOS.find((item) => String(item.id) === String(veiculoId));

  if (veiculo?.cliente_id) {
    setValorOS("ordem-cliente-id", veiculo.cliente_id);
    atualizarSelectVeiculosPorClienteOS(veiculo.cliente_id, veiculoId);
    return;
  }

  setValorOS("ordem-veiculo-id", veiculoId);
}

function obterVeiculoDaOrdem(ordem) {
  if (!ordem) return null;

  if (ordem.veiculos) return ordem.veiculos;

  if (ordem.veiculo_id) {
    return veiculosCacheOS.find((item) => String(item.id) === String(ordem.veiculo_id)) || null;
  }

  return null;
}

function formatarVeiculoOS(veiculo) {
  if (!veiculo) return "";

  const placa = veiculo.placa ? String(veiculo.placa).toUpperCase() : "Sem placa";
  const modelo = [veiculo.marca, veiculo.modelo].filter(Boolean).join(" ");
  const cor = veiculo.cor ? ` - ${veiculo.cor}` : "";
  const prisma = veiculo.prisma ? ` - Prisma: ${veiculo.prisma}` : "";

  return `${placa}${modelo ? ` - ${modelo}` : ""}${cor}${prisma}`;
}

/* =========================================================
   ORÇAMENTO DE ORIGEM
   ========================================================= */

function obterOrcamentoIdDaURL() {
  const params = new URLSearchParams(window.location.search);

  return (
    params.get("orcamento_id") ||
    params.get("orcamento") ||
    params.get("budget_id") ||
    ""
  );
}

async function carregarOrcamentoOrigemPelaURL() {
  const orcamentoId = obterOrcamentoIdDaURL();

  if (!orcamentoId) return;

  try {
    const { data, error } = await window._supabase
      .from("orcamentos")
      .select("*")
      .eq("id", orcamentoId)
      .eq("usuario_id", usuarioLogadoOS.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar orçamento de origem:", error);
      mostrarMensagemOS(
        "mensagem-ordens-form",
        "Não foi possível carregar o orçamento aprovado para gerar a OS.",
        "erro"
      );
      return;
    }

    if (!data) {
      mostrarMensagemOS(
        "mensagem-ordens-form",
        "Orçamento de origem não encontrado ou sem permissão de acesso.",
        "erro"
      );
      return;
    }

    orcamentoOrigemOS = data;
    preencherOSComOrcamentoOrigem(data);

  } catch (erro) {
    console.error("Erro inesperado ao carregar orçamento de origem:", erro);
  }
}

function preencherOSComOrcamentoOrigem(orcamento) {
  if (!orcamento) return;

  const params = new URLSearchParams(window.location.search);
  const clienteIdURL = params.get("cliente_id");
  const veiculoIdURL = params.get("veiculo_id");

  const clienteId = clienteIdURL || orcamento.cliente_id || orcamento.cliente_id_cadastrado || "";
  const veiculoId = veiculoIdURL || orcamento.veiculo_id || "";

  if (clienteId) {
    setValorOS("ordem-cliente-id", clienteId);
    atualizarSelectVeiculosPorClienteOS(clienteId, veiculoId);
  }

  if (veiculoId) {
    setValorOS("ordem-veiculo-id", veiculoId);
  }

  const numero = formatarNumeroOrcamentoOrigem(orcamento);
  const assunto = orcamento.assunto || orcamento.titulo || "Orçamento aprovado";

  if (!valorInputOS("ordem-titulo")) {
    setValorOS("ordem-titulo", `${assunto}`);
  }

  if (!valorInputOS("ordem-status")) {
    setValorOS("ordem-status", "aberta");
  }

  if (!valorInputOS("ordem-descricao-problema")) {
    setValorOS(
      "ordem-descricao-problema",
      `OS gerada a partir do orçamento aprovado ${numero}.\nCliente: ${orcamento.cliente_nome || "Não informado"}.\nWhatsApp: ${orcamento.cliente_whatsapp || "Não informado"}.`
    );
  }

  if (!valorInputOS("ordem-descricao-servico")) {
    setValorOS("ordem-descricao-servico", montarDescricaoServicoDoOrcamento(orcamento));
  }

  const observacoes = [
    `Vinculada ao orçamento ${numero}.`,
    orcamento.forma_pagamento_cliente ? `Forma de pagamento escolhida no orçamento: ${formatarFormaPagamentoOrigem(orcamento.forma_pagamento_cliente)}.` : "",
    orcamento.total ? `Valor aprovado no orçamento: ${formatarMoedaOS(orcamento.total)}.` : "",
    orcamento.resposta_cliente_em ? `Aprovado em: ${formatarDataVisualOS(orcamento.resposta_cliente_em)}.` : ""
  ].filter(Boolean).join("\n");

  if (!valorInputOS("ordem-observacoes-internas")) {
    setValorOS("ordem-observacoes-internas", observacoes);
  }

  mostrarMensagemOS(
    "mensagem-ordens-form",
    `Orçamento aprovado ${numero} carregado. Confira os dados e clique em Salvar OS.`,
    "info"
  );
}

function montarDescricaoServicoDoOrcamento(orcamento) {
  const itens = Array.isArray(orcamento.itens) ? orcamento.itens : [];

  if (!itens.length) {
    return `Serviço referente ao orçamento aprovado ${formatarNumeroOrcamentoOrigem(orcamento)}.`;
  }

  const linhas = itens.map((item, index) => {
    const normalizado = normalizarItemOrcamentoOrigem(item);
    const qtd = normalizado.qtd || 1;
    const valor = normalizado.valor ? ` - ${formatarMoedaOS(normalizado.valor)}` : "";

    return `${index + 1}. ${normalizado.descricao || "Item do orçamento"} | Qtd: ${qtd}${valor}`;
  });

  return `Itens aprovados no orçamento ${formatarNumeroOrcamentoOrigem(orcamento)}:\n${linhas.join("\n")}`;
}

function normalizarItemOrcamentoOrigem(item) {
  const descricao = item?.descricao || item?.desc || item?.item || item?.nome || "";
  const qtd = converterNumeroOS(item?.qtd ?? item?.quantidade ?? item?.qtde ?? 1);
  const valor = converterNumeroOS(item?.valor ?? item?.valor_unitario ?? item?.preco ?? item?.unitario ?? 0);
  const subtotal = converterNumeroOS(item?.subtotal ?? item?.total ?? (qtd * valor));

  return { descricao, qtd, valor, subtotal };
}

function formatarNumeroOrcamentoOrigem(orcamento) {
  const numero = orcamento?.numero_orcamento || orcamento?.numero || "";

  if (!numero) return `ID ${orcamento?.id || ""}`.trim();

  return `Nº ${String(numero).padStart(6, "0")}`;
}

function formatarFormaPagamentoOrigem(valor) {
  const mapa = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    credito: "Cartão de crédito",
    debito: "Cartão de débito",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito"
  };

  return mapa[normalizarTextoOS(valor)] || valor || "Não informado";
}

function carregarEdicaoPelaURL() {
  const params = new URLSearchParams(window.location.search);
  const editarId = params.get("editar");

  if (!editarId) return;

  const ordem = ordensCache.find((item) => item.id === editarId);

  if (!ordem) {
    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Não foi possível carregar esta OS para edição. Talvez ela tenha sido excluída ou você não tenha permissão.",
      "erro"
    );
    return;
  }

  editarOrdem(editarId);
  abrirFormularioMobileOrdem();

  mostrarMensagemOS(
    "mensagem-ordens-form",
    "OS carregada para edição. Faça as alterações básicas e clique em Atualizar OS.",
    "info"
  );
}

/* =========================================================
   CRUD - ORDENS
   ========================================================= */

async function carregarOrdens() {
  try {
    setLoadingOrdens(true);
    limparMensagemOS("mensagem-ordens-lista");

    if (!usuarioLogadoOS || !usuarioLogadoOS.id) {
      const session = await obterSessaoAtualOS();

      if (!session) {
        redirecionarParaLoginOS();
        return;
      }

      usuarioLogadoOS = session.user;
    }

    let consulta = await window._supabase
      .from("ordens_servico")
      .select(`
        *,
        clientes (
          id,
          nome,
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
      `)
      .eq("user_id", usuarioLogadoOS.id)
      .order("created_at", { ascending: false });

    if (consulta.error && erroColunaInexistenteOS(consulta.error)) {
      console.warn(
        "Não foi possível carregar o relacionamento direto com veículos. Tentando carregar OS sem join de veículos.",
        consulta.error
      );

      consulta = await window._supabase
        .from("ordens_servico")
        .select(`
          *,
          clientes (
            id,
            nome,
            whatsapp,
            email
          )
        `)
        .eq("user_id", usuarioLogadoOS.id)
        .order("created_at", { ascending: false });
    }

    if (consulta.error) {
      console.error("Erro ao carregar ordens:", consulta.error);
      mostrarMensagemOS(
        "mensagem-ordens-lista",
        "Não foi possível carregar as ordens. Verifique se a tabela ordens_servico foi criada no Supabase.",
        "erro"
      );
      return;
    }

    ordensCache = Array.isArray(consulta.data) ? consulta.data : [];

    atualizarResumoOrdens(ordensCache);
    renderizarOrdens(ordensCache);

  } catch (erro) {
    console.error("Erro inesperado ao carregar ordens:", erro);
    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Erro inesperado ao carregar ordens de serviço.",
      "erro"
    );
  } finally {
    setLoadingOrdens(false);
  }
}

async function salvarOrdem(event) {
  event.preventDefault();

  try {
    limparMensagemOS("mensagem-ordens-form");

    const session = await obterSessaoAtualOS();

    if (!session) {
      redirecionarParaLoginOS();
      return;
    }

    usuarioLogadoOS = session.user;
    preencherConsultorTecnicoVisual();

    const ordemId = document.getElementById("ordem-id")?.value || "";
    const ordem = montarObjetoOrdemBasica(!ordemId);

    if (!ordem.titulo) {
      mostrarMensagemOS(
        "mensagem-ordens-form",
        "Informe o título da ordem de serviço.",
        "erro"
      );
      return;
    }

    const btnSalvar = document.getElementById("btn-salvar-ordem");
    alterarEstadoBotaoOS(btnSalvar, true, ordemId ? "Atualizando..." : "Criando OS...");

    const resultado = await executarSalvarOrdemSupabase(ordemId, ordem);

    if (resultado.error) {
      console.error("Erro ao salvar OS:", resultado.error);
      mostrarMensagemOS(
        "mensagem-ordens-form",
        "Erro ao salvar a ordem de serviço. Verifique os dados e tente novamente.",
        "erro"
      );
      return;
    }

    const osSalva = resultado.data;

    if (!ordemId && osSalva?.id && orcamentoOrigemOS?.id) {
      await atualizarOrcamentoOrigemParaEmServico(osSalva.id);
    }

    mostrarMensagemOS(
      "mensagem-ordens-form",
      ordemId ? "Ordem de serviço atualizada com sucesso." : "Ordem de serviço criada com sucesso.",
      "sucesso"
    );

    await carregarOrdens();

    if (!ordemId && osSalva?.id) {
      const abrirAgora = confirm(
        "OS criada com sucesso. Deseja abrir a OS agora para adicionar mão de obra, itens do estoque e pagamento?"
      );

      if (abrirAgora) {
        abrirDetalhesOrdem(osSalva.id);
        return;
      }
    }

    limparFormularioOrdem();

  } catch (erro) {
    console.error("Erro inesperado ao salvar OS:", erro);
    mostrarMensagemOS(
      "mensagem-ordens-form",
      "Erro inesperado ao salvar a ordem de serviço.",
      "erro"
    );
  } finally {
    const btnSalvar = document.getElementById("btn-salvar-ordem");
    const ordemId = document.getElementById("ordem-id")?.value || "";

    alterarEstadoBotaoOS(
      btnSalvar,
      false,
      ordemId ? "Atualizar OS" : "Salvar OS"
    );
  }
}

function montarObjetoOrdemBasica(incluirDefaultsFinanceiros = false) {
  const clienteId = valorInputOS("ordem-cliente-id");
  const consultorTecnico = obterConsultorTecnicoOS();
  const orcamentoId = obterOrcamentoIdDaURL() || orcamentoOrigemOS?.id || "";

  const ordem = {
    cliente_id: clienteId || null,
    veiculo_id: valorInputOS("ordem-veiculo-id") || null,
    orcamento_id: orcamentoId || null,

    titulo: valorInputOS("ordem-titulo"),
    descricao_problema: valorInputOS("ordem-descricao-problema"),
    descricao_servico: valorInputOS("ordem-descricao-servico"),

    // No banco pode continuar como "responsavel".
    // Na interface e na regra do sistema, o nome correto é "Consultor Técnico".
    responsavel: consultorTecnico,

    status: valorInputOS("ordem-status") || "aberta",

    data_abertura: valorInputOS("ordem-data-abertura") || hojeISO(),
    data_prevista: valorInputOS("ordem-data-prevista") || null,

    garantia_dias: inteiroCampoOS("ordem-garantia-dias"),
    garantia_observacoes: valorInputOS("ordem-garantia-observacoes"),

    observacoes_cliente: valorInputOS("ordem-observacoes-cliente"),
    observacoes_internas: valorInputOS("ordem-observacoes-internas")
  };

  if (incluirDefaultsFinanceiros) {
    ordem.valor_mao_obra = 0;
    ordem.valor_materiais = 0;
    ordem.desconto = 0;
    ordem.valor_total = 0;
    ordem.forma_pagamento = null;
    ordem.status_pagamento = "pendente";
    ordem.valor_pago = 0;
    ordem.saldo_restante = 0;
    ordem.data_conclusao = null;
  }

  return ordem;
}

async function executarSalvarOrdemSupabase(ordemId, ordem) {
  let payload = { ...ordem };

  let resultado = await salvarOrdemNoSupabase(ordemId, payload);

  if (resultado.error && erroColunaInexistenteOS(resultado.error) && payload.veiculo_id) {
    console.warn(
      "A coluna veiculo_id não existe em ordens_servico. A OS será salva sem vínculo de veículo. Rode o SQL de veículos para manter o relacionamento.",
      resultado.error
    );

    payload = { ...payload };
    delete payload.veiculo_id;

    resultado = await salvarOrdemNoSupabase(ordemId, payload);
  }

  if (resultado.error && erroColunaInexistenteOS(resultado.error) && payload.orcamento_id) {
    console.warn(
      "A coluna orcamento_id não existe em ordens_servico. A OS será salva sem vínculo direto. Crie a coluna para manter o relacionamento.",
      resultado.error
    );

    payload = { ...payload };
    delete payload.orcamento_id;

    resultado = await salvarOrdemNoSupabase(ordemId, payload);
  }

  return resultado;
}

async function salvarOrdemNoSupabase(ordemId, payload) {
  if (ordemId) {
    return await window._supabase
      .from("ordens_servico")
      .update(payload)
      .eq("id", ordemId)
      .eq("user_id", usuarioLogadoOS.id)
      .select()
      .single();
  }

  return await window._supabase
    .from("ordens_servico")
    .insert({
      ...payload,
      user_id: usuarioLogadoOS.id
    })
    .select()
    .single();
}

function erroColunaInexistenteOS(error) {
  const texto = String(error?.message || error?.details || error?.hint || "").toLowerCase();

  return (
    texto.includes("column") ||
    texto.includes("coluna") ||
    texto.includes("schema cache") ||
    texto.includes("could not find")
  );
}

async function atualizarOrcamentoOrigemParaEmServico(ordemId) {
  if (!orcamentoOrigemOS?.id || !usuarioLogadoOS?.id) return;

  const payloadCompleto = {
    status: "em_servico",
    ordem_servico_id: ordemId
  };

  const veiculoId = valorInputOS("ordem-veiculo-id") || orcamentoOrigemOS.veiculo_id || "";

  if (veiculoId) {
    payloadCompleto.veiculo_id = veiculoId;
  }

  let resultado = await window._supabase
    .from("orcamentos")
    .update(payloadCompleto)
    .eq("id", orcamentoOrigemOS.id)
    .eq("usuario_id", usuarioLogadoOS.id);

  if (resultado.error && erroColunaInexistenteOS(resultado.error)) {
    resultado = await window._supabase
      .from("orcamentos")
      .update({ status: "em_servico" })
      .eq("id", orcamentoOrigemOS.id)
      .eq("usuario_id", usuarioLogadoOS.id);
  }

  if (resultado.error) {
    console.error("Erro ao atualizar orçamento para em serviço:", resultado.error);
  }
}

function editarOrdem(id) {
  const ordem = ordensCache.find((item) => item.id === id);

  if (!ordem) {
    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Ordem de serviço não encontrada para edição.",
      "erro"
    );
    return;
  }

  setValorOS("ordem-id", ordem.id);
  setValorOS("ordem-cliente-id", ordem.cliente_id);
  atualizarSelectVeiculosPorClienteOS(ordem.cliente_id, ordem.veiculo_id || "");
  setValorOS("ordem-veiculo-id", ordem.veiculo_id || "");
  setValorOS("ordem-titulo", ordem.titulo);
  setValorOS("ordem-descricao-problema", ordem.descricao_problema);
  setValorOS("ordem-descricao-servico", ordem.descricao_servico);
  setValorOS("ordem-status", ordem.status || "aberta");

  setValorOS("ordem-data-abertura", formatarDataInputOS(ordem.data_abertura));
  setValorOS("ordem-data-prevista", formatarDataInputOS(ordem.data_prevista));

  setValorOS("ordem-garantia-dias", ordem.garantia_dias || "");
  setValorOS("ordem-garantia-observacoes", ordem.garantia_observacoes);
  setValorOS("ordem-observacoes-cliente", ordem.observacoes_cliente);
  setValorOS("ordem-observacoes-internas", ordem.observacoes_internas);

  const campoConsultor = document.getElementById("ordem-consultor-tecnico");
  if (campoConsultor) {
    campoConsultor.value = ordem.responsavel || obterConsultorTecnicoOS();
  }

  const textoConsultor = document.getElementById("consultor-tecnico-os");
  if (textoConsultor) {
    textoConsultor.textContent = ordem.responsavel || obterConsultorTecnicoOS();
  }

  const titulo = document.getElementById("titulo-form-ordem");
  const btnSalvar = document.getElementById("btn-salvar-ordem");

  if (titulo) titulo.textContent = "Editar ordem de serviço";
  if (btnSalvar) btnSalvar.textContent = "Atualizar OS";

  abrirFormularioMobileOrdem();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function abrirFormularioMobileOrdem() {
  const card = document.getElementById("card-form-ordem");
  const botao = document.getElementById("btn-toggle-form-ordem");

  if (!card || !botao) return;

  card.classList.remove("form-fechado");

  if (window.innerWidth <= 700) {
    botao.textContent = "Fechar";
  }
}

async function excluirOrdem(id) {
  try {
    const ordem = ordensCache.find((item) => item.id === id);
    const numero = ordem?.numero_os ? formatarNumeroOS(ordem.numero_os) : "esta OS";

    const confirmar = confirm(
      `Deseja realmente excluir ${numero}? Essa ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    const session = await obterSessaoAtualOS();

    if (!session) {
      redirecionarParaLoginOS();
      return;
    }

    usuarioLogadoOS = session.user;

    const { error } = await window._supabase
      .from("ordens_servico")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioLogadoOS.id);

    if (error) {
      console.error("Erro ao excluir OS:", error);
      mostrarMensagemOS(
        "mensagem-ordens-lista",
        "Não foi possível excluir a ordem de serviço.",
        "erro"
      );
      return;
    }

    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Ordem de serviço excluída com sucesso.",
      "sucesso"
    );

    await carregarOrdens();

  } catch (erro) {
    console.error("Erro inesperado ao excluir OS:", erro);
    mostrarMensagemOS(
      "mensagem-ordens-lista",
      "Erro inesperado ao excluir a ordem de serviço.",
      "erro"
    );
  }
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizarOrdens(lista) {
  const container = document.getElementById("lista-ordens");

  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhuma ordem de serviço encontrada</strong>
        <p>Cadastre a primeira OS usando o formulário ao lado.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map((ordem) => criarCardOrdem(ordem)).join("");
}

function criarCardOrdem(ordem) {
  const numero = formatarNumeroOS(ordem.numero_os);
  const titulo = escaparHTMLOS(ordem.titulo || "Ordem de serviço sem título");
  const clienteNome = escaparHTMLOS(obterNomeClienteDaOrdem(ordem));
  const consultorTecnico = escaparHTMLOS(ordem.responsavel || "");
  const veiculo = obterVeiculoDaOrdem(ordem);
  const veiculoTexto = veiculo ? formatarVeiculoOS(veiculo) : "";
  const status = ordem.status || "aberta";
  const pagamento = ordem.status_pagamento || "pendente";
  const valorTotal = formatarMoedaOS(ordem.valor_total || 0);

  const dataAbertura = formatarDataVisualOS(ordem.data_abertura);
  const dataPrevista = formatarDataVisualOS(ordem.data_prevista);
  const dataConclusao = formatarDataVisualOS(ordem.data_conclusao);

  const detalhes = [
    clienteNome ? `Cliente: ${clienteNome}` : "Sem cliente vinculado",
    consultorTecnico ? `Consultor Técnico: ${consultorTecnico}` : "",
    veiculoTexto ? `Veículo: ${veiculoTexto}` : "",
    dataAbertura ? `Abertura: ${dataAbertura}` : "",
    dataPrevista ? `Prevista: ${dataPrevista}` : "",
    dataConclusao ? `Conclusão: ${dataConclusao}` : "",
    ordem.orcamento_id ? `Orçamento vinculado: ${ordem.orcamento_id}` : ""
  ].filter(Boolean).join(" • ");

  return `
    <article class="ordem-item" data-ordem-id="${escaparHTMLOS(ordem.id)}">
      <div class="ordem-linha-topo">
        <div class="ordem-info">
          <h3>${numero} - ${titulo}</h3>
          <p>${escaparHTMLOS(detalhes)}</p>
        </div>

        <div class="ordem-valor">
          <span>Total atual</span>
          <strong>${valorTotal}</strong>
        </div>
      </div>

      <div class="ordem-tags">
        <span class="tag ${escaparHTMLOS(status)}">${formatarStatusOS(status)}</span>
        <span class="tag ${escaparHTMLOS(pagamento)}">${formatarStatusPagamentoOS(pagamento)}</span>
      </div>

      ${
        ordem.descricao_problema
          ? `<p style="margin: 8px 0 0; color:#475569; font-size:13px; line-height:1.5;">${escaparHTMLOS(ordem.descricao_problema)}</p>`
          : ""
      }

      <div class="ordem-acoes">
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="editarOrdem('${ordem.id}')">
          Editar dados básicos
        </button>

        <button type="button" class="btn btn-primario btn-pequeno" onclick="abrirDetalhesOrdem('${ordem.id}')">
          Abrir OS
        </button>

        <button type="button" class="btn btn-verde btn-pequeno" onclick="gerarPDFOrdem('${ordem.id}')">
          PDF
        </button>

        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirOrdem('${ordem.id}')">
          Excluir
        </button>
      </div>
    </article>
  `;
}

/* =========================================================
   FILTROS E RESUMO
   ========================================================= */

function filtrarOrdens() {
  const termo = normalizarTextoOS(valorInputOS("busca-ordens"));
  const status = valorInputOS("filtro-status-ordens");
  const pagamento = valorInputOS("filtro-pagamento-ordens");
  const veiculoFiltro = normalizarTextoOS(valorInputOS("filtro-veiculo-ordens"));

  let listaFiltrada = [...ordensCache];

  if (termo) {
    listaFiltrada = listaFiltrada.filter((ordem) => {
      const textoBusca = normalizarTextoOS([
        ordem.numero_os,
        ordem.titulo,
        ordem.responsavel,
        ordem.status,
        ordem.status_pagamento,
        ordem.descricao_problema,
        ordem.descricao_servico,
        ordem.orcamento_id,
        ordem.veiculos?.placa,
        ordem.veiculos?.marca,
        ordem.veiculos?.modelo,
        ordem.veiculos?.cor,
        ordem.veiculos?.prisma,
        obterVeiculoDaOrdem(ordem)?.placa,
        obterVeiculoDaOrdem(ordem)?.marca,
        obterVeiculoDaOrdem(ordem)?.modelo,
        ordem.clientes?.nome,
        ordem.clientes?.whatsapp,
        ordem.clientes?.email
      ].filter(Boolean).join(" "));

      return textoBusca.includes(termo);
    });
  }

  if (status) {
    listaFiltrada = listaFiltrada.filter((ordem) => ordem.status === status);
  }

  if (pagamento) {
    listaFiltrada = listaFiltrada.filter((ordem) => ordem.status_pagamento === pagamento);
  }

  if (veiculoFiltro) {
    listaFiltrada = listaFiltrada.filter((ordem) => {
      const veiculo = obterVeiculoDaOrdem(ordem);
      const textoVeiculo = normalizarTextoOS([
        veiculo?.placa,
        veiculo?.marca,
        veiculo?.modelo,
        veiculo?.cor,
        veiculo?.prisma,
        veiculo?.ano
      ].filter(Boolean).join(" "));

      return textoVeiculo.includes(veiculoFiltro);
    });
  }

  renderizarOrdens(listaFiltrada);
}

function atualizarResumoOrdens(lista) {
  const total = lista.length;
  const abertas = lista.filter((ordem) => ordem.status === "aberta").length;
  const execucao = lista.filter((ordem) => ordem.status === "em_execucao").length;
  const concluidas = lista.filter((ordem) => ordem.status === "concluida").length;

  const valorTotal = lista.reduce((soma, ordem) => {
    return soma + converterNumeroOS(ordem.valor_total);
  }, 0);

  setTextoOS("resumo-total-ordens", total);
  setTextoOS("resumo-ordens-abertas", abertas);
  setTextoOS("resumo-ordens-execucao", execucao);
  setTextoOS("resumo-ordens-concluidas", concluidas);
  setTextoOS("resumo-valor-total-ordens", formatarMoedaOS(valorTotal));
}

/* =========================================================
   AÇÕES
   ========================================================= */

function abrirDetalhesOrdem(id) {
  if (!id) {
    alert("ID da ordem de serviço não encontrado.");
    return;
  }

  localStorage.setItem("ultima_os_aberta_id", id);

  const caminhoAtual = window.location.pathname || "";
  const usaHtml = caminhoAtual.includes(".html");

  const destino = usaHtml
    ? `ordem.html?id=${encodeURIComponent(id)}`
    : `/ordem?id=${encodeURIComponent(id)}`;

  window.location.href = destino;
}

function gerarPDFOrdem(id) {
  const ordem = ordensCache.find((item) => item.id === id);

  if (!ordem) {
    alert("Ordem de serviço não encontrada.");
    return;
  }

  abrirDetalhesOrdem(id);
}

/* =========================================================
   FORMULÁRIO
   ========================================================= */

function limparFormularioOrdem() {
  const form = document.getElementById("form-ordem");

  if (form) form.reset();

  setValorOS("ordem-id", "");
  setValorOS("ordem-status", "aberta");
  setValorOS("ordem-garantia-dias", "");

  definirDataAberturaPadrao();
  selecionarClientePelaURL();
  atualizarSelectVeiculosPorClienteOS(valorInputOS("ordem-cliente-id"));
  selecionarVeiculoPelaURL();
  preencherConsultorTecnicoVisual();

  const titulo = document.getElementById("titulo-form-ordem");
  const btnSalvar = document.getElementById("btn-salvar-ordem");

  if (titulo) titulo.textContent = "Nova ordem de serviço";
  if (btnSalvar) btnSalvar.textContent = "Salvar OS";

  limparMensagemOS("mensagem-ordens-form");
}

function definirDataAberturaPadrao() {
  const campo = document.getElementById("ordem-data-abertura");

  if (campo && !campo.value) {
    campo.value = hojeISO();
  }
}

/* =========================================================
   HELPERS DE DOM
   ========================================================= */

function valorInputOS(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorOS(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.value = valor ?? "";
}

function setTextoOS(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = valor;
}

function mostrarMensagemOS(id, texto, tipo = "info") {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = `mensagem-ordens ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagemOS(id);
    }, 4000);
  }
}

function limparMensagemOS(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = "mensagem-ordens";
  el.textContent = "";
}

function setLoadingOrdens(ativo) {
  const loading = document.getElementById("loading-ordens");

  if (!loading) return;

  if (ativo) {
    loading.classList.add("ativo");
  } else {
    loading.classList.remove("ativo");
  }
}

function alterarEstadoBotaoOS(botao, carregando, texto) {
  if (!botao) return;

  botao.disabled = carregando;
  botao.textContent = texto;
}

/* =========================================================
   HELPERS DE VALOR / TEXTO
   ========================================================= */

function converterNumeroOS(valor) {
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

function inteiroCampoOS(id) {
  const numero = parseInt(valorInputOS(id), 10);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTextoOS(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHTMLOS(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   DATAS
   ========================================================= */

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataInputOS(data) {
  if (!data) return "";

  return String(data).substring(0, 10);
}

function formatarDataVisualOS(data) {
  if (!data) return "";

  const partes = String(data).substring(0, 10).split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* =========================================================
   FORMATADORES
   ========================================================= */

function formatarMoedaOS(valor) {
  const numero = converterNumeroOS(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumeroOS(numero) {
  if (!numero) return "OS Nº 000000";

  return `OS Nº ${String(numero).padStart(6, "0")}`;
}

function obterNomeClienteDaOrdem(ordem) {
  if (ordem?.clientes?.nome) return ordem.clientes.nome;

  if (ordem?.cliente_id) {
    const cliente = clientesCacheOS.find((item) => item.id === ordem.cliente_id);
    return cliente?.nome || "";
  }

  return "";
}

function formatarStatusOS(status) {
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

function formatarStatusPagamentoOS(status) {
  const mapa = {
    pendente: "Pagamento pendente",
    parcial: "Pagamento parcial",
    pago: "Pago"
  };

  return mapa[status] || "Pagamento pendente";
}

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   Necessário porque os botões são criados via innerHTML.
   ========================================================= */

window.carregarOrdens = carregarOrdens;
window.salvarOrdem = salvarOrdem;
window.editarOrdem = editarOrdem;
window.excluirOrdem = excluirOrdem;
window.filtrarOrdens = filtrarOrdens;
window.abrirDetalhesOrdem = abrirDetalhesOrdem;
window.gerarPDFOrdem = gerarPDFOrdem;
window.limparFormularioOrdem = limparFormularioOrdem;
window.carregarOrcamentoOrigemPelaURL = carregarOrcamentoOrigemPelaURL;
window.carregarVeiculosSelectOS = carregarVeiculosSelectOS;
window.atualizarSelectVeiculosPorClienteOS = atualizarSelectVeiculosPorClienteOS;
window.selecionarVeiculoPelaURL = selecionarVeiculoPelaURL;
