/* =========================================================
   FS ORÇAMENTOS - agenda.js
   Agenda de serviços / Plano Premium
   ========================================================= */

let agendaCache = [];
let clientesAgendaCache = [];
let veiculosAgendaCache = [];
let ordensAgendaCache = [];
let usuarioLogadoAgenda = null;
let clienteSelecionadoAgenda = null;

let fsAgendaInicializada = false;

async function iniciarAgendaInicializada() {
  if (fsAgendaInicializada) return;
  fsAgendaInicializada = true;
  await inicializarAgendaServicos();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarAgendaInicializada);
} else {
  iniciarAgendaInicializada();
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarAgendaServicos() {
  try {
    garantirSupabaseAgenda();

    const session = await obterSessaoAtualAgenda();

    if (!session) {
      redirecionarParaLoginAgenda();
      return;
    }

    usuarioLogadoAgenda = session.user;

    configurarEventosAgenda();
    aplicarDatasPadraoAgenda();

    await carregarClientesAgenda();
    await carregarVeiculosAgenda();
    await carregarOrdensAgenda();
    await aplicarParametrosUrlAgenda();
    await carregarAgendaServicos();

  } catch (erro) {
    console.error("Erro ao inicializar agenda:", erro);
    mostrarMensagemAgenda("mensagem-agenda-lista", "Erro ao iniciar a agenda de serviços.", "erro");
  }
}

function garantirSupabaseAgenda() {
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

async function obterSessaoAtualAgenda() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data?.session || null;
}

function redirecionarParaLoginAgenda() {
  const destino = encodeURIComponent("agenda.html" + window.location.search);
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosAgenda() {
  const form = document.getElementById("form-agenda");
  const btnLimpar = document.getElementById("btn-limpar-agenda");
  const btnBuscarCliente = document.getElementById("btn-buscar-cliente-agenda");
  const btnLimparCliente = document.getElementById("btn-limpar-cliente-agenda");
  const btnAtualizar = document.getElementById("btn-atualizar-agenda");

  const busca = document.getElementById("busca-agenda");
  const filtroInicio = document.getElementById("filtro-agenda-inicio");
  const filtroFim = document.getElementById("filtro-agenda-fim");
  const filtroStatus = document.getElementById("filtro-agenda-status");
  const campoBuscaCliente = document.getElementById("campo-busca-cliente-agenda");

  if (form) form.addEventListener("submit", salvarAgendamento);

  if (btnLimpar) btnLimpar.addEventListener("click", limparFormularioAgenda);
  if (btnBuscarCliente) btnBuscarCliente.addEventListener("click", abrirModalClienteAgenda);
  if (btnLimparCliente) btnLimparCliente.addEventListener("click", limparClienteAgenda);
  if (btnAtualizar) btnAtualizar.addEventListener("click", carregarAgendaServicos);

  if (busca) busca.addEventListener("input", filtrarAgendaNaTela);
  if (filtroInicio) filtroInicio.addEventListener("change", carregarAgendaServicos);
  if (filtroFim) filtroFim.addEventListener("change", carregarAgendaServicos);
  if (filtroStatus) filtroStatus.addEventListener("change", filtrarAgendaNaTela);

  if (campoBuscaCliente) {
    campoBuscaCliente.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buscarClientesModalAgenda();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharModalClienteAgenda();
    }
  });

  document.addEventListener("click", (event) => {
    const modal = document.getElementById("modal-busca-cliente-agenda");
    if (event.target === modal) {
      fecharModalClienteAgenda();
    }
  });
}

/* =========================================================
   CARREGAMENTO DE BASES
   ========================================================= */

async function carregarClientesAgenda() {
  const { data, error } = await window._supabase
    .from("clientes")
    .select("id, numero_cliente, nome, whatsapp, email, endereco, cidade, estado, cep, status")
    .eq("user_id", usuarioLogadoAgenda.id)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar clientes:", error);
    clientesAgendaCache = [];
    return;
  }

  clientesAgendaCache = Array.isArray(data) ? data : [];
}

async function carregarVeiculosAgenda() {
  const { data, error } = await window._supabase
    .from("veiculos")
    .select("id, cliente_id, placa, marca, modelo, cor, prisma, ano, ativo")
    .eq("user_id", usuarioLogadoAgenda.id)
    .eq("ativo", true)
    .order("placa", { ascending: true });

  if (error) {
    console.error("Erro ao carregar veículos:", error);
    veiculosAgendaCache = [];
    return;
  }

  veiculosAgendaCache = Array.isArray(data) ? data : [];
}

async function carregarOrdensAgenda() {
  const { data, error } = await window._supabase
    .from("ordens_servico")
    .select("id, numero_os, cliente_id, veiculo_id, titulo, status, data_abertura, data_prevista")
    .eq("user_id", usuarioLogadoAgenda.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar OS:", error);
    ordensAgendaCache = [];
    return;
  }

  ordensAgendaCache = Array.isArray(data) ? data : [];
}

async function carregarAgendaServicos() {
  try {
    limparMensagemAgenda("mensagem-agenda-lista");

    const inicio = valorInputAgenda("filtro-agenda-inicio");
    const fim = valorInputAgenda("filtro-agenda-fim");

    let query = window._supabase
      .from("agenda_servicos")
      .select(`
        *,
        clientes (
          id,
          numero_cliente,
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
        ),
        ordens_servico (
          id,
          numero_os,
          titulo,
          status
        )
      `)
      .eq("user_id", usuarioLogadoAgenda.id)
      .order("data_servico", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (inicio) query = query.gte("data_servico", inicio);
    if (fim) query = query.lte("data_servico", fim);

    let { data, error } = await query;

    if (error) {
      console.warn("Erro ao carregar agenda com relacionamentos. Tentando sem joins:", error);

      let fallback = window._supabase
        .from("agenda_servicos")
        .select("*")
        .eq("user_id", usuarioLogadoAgenda.id)
        .order("data_servico", { ascending: true })
        .order("hora_inicio", { ascending: true });

      if (inicio) fallback = fallback.gte("data_servico", inicio);
      if (fim) fallback = fallback.lte("data_servico", fim);

      const resultadoFallback = await fallback;
      data = resultadoFallback.data;
      error = resultadoFallback.error;
    }

    if (error) {
      console.error("Erro ao carregar agenda:", error);
      mostrarMensagemAgenda(
        "mensagem-agenda-lista",
        "Não foi possível carregar a agenda. Rode o SQL da tabela agenda_servicos no Supabase.",
        "erro"
      );
      return;
    }

    agendaCache = Array.isArray(data) ? data : [];
    atualizarResumoAgenda(agendaCache);
    filtrarAgendaNaTela();

  } catch (erro) {
    console.error("Erro inesperado ao carregar agenda:", erro);
    mostrarMensagemAgenda("mensagem-agenda-lista", "Erro inesperado ao carregar agenda.", "erro");
  }
}

/* =========================================================
   PARÂMETROS DA URL
   ========================================================= */

async function aplicarParametrosUrlAgenda() {
  const params = new URLSearchParams(window.location.search);

  const ordemId = params.get("ordem_id") || params.get("os_id") || "";
  const clienteId = params.get("cliente_id") || "";
  const veiculoId = params.get("veiculo_id") || "";
  const tituloUrl = params.get("titulo") || "";

  if (clienteId) {
    const cliente = clientesAgendaCache.find((item) => String(item.id) === String(clienteId));

    if (cliente) {
      selecionarClienteAgenda(cliente.id);
    }
  }

  if (veiculoId) {
    setValorAgenda("agenda-veiculo-id", veiculoId);
  }

  if (ordemId) {
    await preencherComOrdemAgenda(ordemId);
  }

  if (tituloUrl && !valorInputAgenda("agenda-titulo")) {
    setValorAgenda("agenda-titulo", tituloUrl);
  }
}

async function preencherComOrdemAgenda(ordemId) {
  let ordem = ordensAgendaCache.find((item) => String(item.id) === String(ordemId));

  if (!ordem) {
    const { data, error } = await window._supabase
      .from("ordens_servico")
      .select("id, numero_os, cliente_id, veiculo_id, titulo, descricao_servico, descricao_problema, responsavel, data_prevista, status")
      .eq("id", ordemId)
      .eq("user_id", usuarioLogadoAgenda.id)
      .maybeSingle();

    if (!error && data) {
      ordem = data;
      ordensAgendaCache.unshift(data);
    }
  }

  if (!ordem) return;

  if (ordem.cliente_id) {
    const cliente = clientesAgendaCache.find((item) => String(item.id) === String(ordem.cliente_id));
    if (cliente) selecionarClienteAgenda(cliente.id);
  }

  if (ordem.veiculo_id) {
    setValorAgenda("agenda-veiculo-id", ordem.veiculo_id);
  }

  setValorAgenda("agenda-ordem-id", ordem.id);

  if (!valorInputAgenda("agenda-titulo")) {
    const numero = ordem.numero_os ? `OS Nº ${String(ordem.numero_os).padStart(6, "0")}` : "OS";
    setValorAgenda("agenda-titulo", `${numero} - ${ordem.titulo || "Serviço agendado"}`);
  }

  if (!valorInputAgenda("agenda-descricao")) {
    setValorAgenda("agenda-descricao", ordem.descricao_servico || ordem.descricao_problema || "");
  }

  if (!valorInputAgenda("agenda-responsavel")) {
    setValorAgenda("agenda-responsavel", ordem.responsavel || obterResponsavelPadraoAgenda());
  }

  if (ordem.data_prevista) {
    setValorAgenda("agenda-data", String(ordem.data_prevista).substring(0, 10));
  }

  mostrarMensagemAgenda("mensagem-agenda-form", "OS carregada. Confira a data/horário e salve o agendamento.", "info");
}

/* =========================================================
   CLIENTE / VEÍCULO / OS
   ========================================================= */

function abrirModalClienteAgenda() {
  const modal = document.getElementById("modal-busca-cliente-agenda");
  const campo = document.getElementById("campo-busca-cliente-agenda");
  const resultado = document.getElementById("resultado-clientes-agenda");

  if (resultado) {
    resultado.innerHTML = `
      <div class="estado-vazio">
        <strong>Pesquise um cliente</strong>
        <p>Digite ID, nome, telefone, e-mail ou endereço.</p>
      </div>
    `;
  }

  if (campo) campo.value = "";

  if (modal) {
    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => campo?.focus(), 80);
  }
}

function fecharModalClienteAgenda() {
  const modal = document.getElementById("modal-busca-cliente-agenda");

  if (modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
  }
}

function buscarClientesModalAgenda() {
  const campo = document.getElementById("campo-busca-cliente-agenda");
  const resultado = document.getElementById("resultado-clientes-agenda");

  if (!resultado) return;

  const termo = normalizarTextoAgenda(campo?.value || "");

  if (termo.length < 2) {
    resultado.innerHTML = `
      <div class="estado-vazio">
        <strong>Digite pelo menos 2 caracteres</strong>
        <p>Você pode pesquisar por CLI-000001, nome, telefone, cidade ou CEP.</p>
      </div>
    `;
    return;
  }

  const encontrados = clientesAgendaCache.filter((cliente) => {
    const texto = normalizarTextoAgenda([
      formatarClienteIdAgenda(cliente.numero_cliente),
      cliente.numero_cliente,
      cliente.nome,
      cliente.whatsapp,
      cliente.email,
      cliente.endereco,
      cliente.cidade,
      cliente.estado,
      cliente.cep
    ].filter(Boolean).join(" "));

    return texto.includes(termo);
  }).slice(0, 40);

  if (!encontrados.length) {
    resultado.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum cliente encontrado</strong>
        <p>Cadastre um novo cliente ou tente outro termo de busca.</p>
      </div>
    `;
    return;
  }

  resultado.innerHTML = encontrados.map((cliente) => {
    const id = escaparHTMLAtributoAgenda(cliente.id);
    const numero = formatarClienteIdAgenda(cliente.numero_cliente);
    const contato = [cliente.whatsapp, cliente.email].filter(Boolean).join(" • ");
    const local = [cliente.endereco, cliente.cidade, cliente.estado, cliente.cep].filter(Boolean).join(" • ");

    return `
      <button type="button" class="cliente-modal-item" onclick="selecionarClienteAgenda('${id}')">
        <strong>${escaparHTMLAgenda(numero)} - ${escaparHTMLAgenda(cliente.nome || "Cliente sem nome")}</strong>
        <span>${escaparHTMLAgenda(contato || "Sem contato cadastrado")}</span>
        <span>${escaparHTMLAgenda(local || "Sem endereço cadastrado")}</span>
      </button>
    `;
  }).join("");
}

function selecionarClienteAgenda(clienteId) {
  const cliente = clientesAgendaCache.find((item) => String(item.id) === String(clienteId));

  if (!cliente) return;

  clienteSelecionadoAgenda = cliente;
  setValorAgenda("agenda-cliente-id", cliente.id);

  atualizarClienteSelecionadoAgenda(cliente);
  atualizarSelectVeiculosAgenda(cliente.id);
  atualizarSelectOrdensAgenda(cliente.id);
  fecharModalClienteAgenda();
}

function limparClienteAgenda() {
  clienteSelecionadoAgenda = null;
  setValorAgenda("agenda-cliente-id", "");
  setValorAgenda("agenda-veiculo-id", "");
  setValorAgenda("agenda-ordem-id", "");
  atualizarClienteSelecionadoAgenda(null);
  atualizarSelectVeiculosAgenda("");
  atualizarSelectOrdensAgenda("");
}

function atualizarClienteSelecionadoAgenda(cliente) {
  const box = document.getElementById("agenda-cliente-selecionado");

  if (!box) return;

  if (!cliente) {
    box.innerHTML = `
      Nenhum cliente selecionado
      <span>Use o botão abaixo para buscar por ID, nome, telefone ou endereço.</span>
    `;
    return;
  }

  const numero = formatarClienteIdAgenda(cliente.numero_cliente);
  const contato = [cliente.whatsapp, cliente.email].filter(Boolean).join(" • ");

  box.innerHTML = `
    ${escaparHTMLAgenda(numero)} - ${escaparHTMLAgenda(cliente.nome || "Cliente sem nome")}
    <span>${escaparHTMLAgenda(contato || "Sem contato cadastrado")}</span>
  `;
}

function atualizarSelectVeiculosAgenda(clienteId) {
  const select = document.getElementById("agenda-veiculo-id");

  if (!select) return;

  if (!clienteId) {
    select.innerHTML = `<option value="">Selecione um cliente primeiro</option>`;
    return;
  }

  const veiculos = veiculosAgendaCache.filter((veiculo) => String(veiculo.cliente_id || "") === String(clienteId));

  if (!veiculos.length) {
    select.innerHTML = `<option value="">Nenhum veículo cadastrado</option>`;
    return;
  }

  select.innerHTML = `
    <option value="">Opcional</option>
    ${veiculos.map((veiculo) => `
      <option value="${escaparHTMLAtributoAgenda(veiculo.id)}">
        ${escaparHTMLAgenda(formatarVeiculoAgenda(veiculo))}
      </option>
    `).join("")}
  `;
}

function atualizarSelectOrdensAgenda(clienteId) {
  const select = document.getElementById("agenda-ordem-id");

  if (!select) return;

  const ordens = clienteId
    ? ordensAgendaCache.filter((ordem) => String(ordem.cliente_id || "") === String(clienteId))
    : ordensAgendaCache;

  select.innerHTML = `
    <option value="">Opcional</option>
    ${ordens.map((ordem) => `
      <option value="${escaparHTMLAtributoAgenda(ordem.id)}">
        ${escaparHTMLAgenda(formatarOrdemAgenda(ordem))}
      </option>
    `).join("")}
  `;
}

/* =========================================================
   CRUD
   ========================================================= */

async function salvarAgendamento(event) {
  event.preventDefault();

  try {
    limparMensagemAgenda("mensagem-agenda-form");

    if (!usuarioLogadoAgenda?.id) {
      const session = await obterSessaoAtualAgenda();
      if (!session) {
        redirecionarParaLoginAgenda();
        return;
      }
      usuarioLogadoAgenda = session.user;
    }

    const dados = montarObjetoAgenda();

    if (!dados.titulo) {
      mostrarMensagemAgenda("mensagem-agenda-form", "Informe o título do agendamento.", "erro");
      return;
    }

    if (!dados.data_servico) {
      mostrarMensagemAgenda("mensagem-agenda-form", "Informe a data do serviço.", "erro");
      return;
    }

    const id = valorInputAgenda("agenda-id");
    const btn = document.getElementById("btn-salvar-agenda");
    alterarEstadoBotaoAgenda(btn, true, id ? "Atualizando..." : "Salvando...");

    let resultado;

    if (id) {
      resultado = await window._supabase
        .from("agenda_servicos")
        .update(dados)
        .eq("id", id)
        .eq("user_id", usuarioLogadoAgenda.id)
        .select()
        .single();
    } else {
      resultado = await window._supabase
        .from("agenda_servicos")
        .insert({
          ...dados,
          user_id: usuarioLogadoAgenda.id
        })
        .select()
        .single();
    }

    if (resultado.error) {
      console.error("Erro ao salvar agendamento:", resultado.error);
      mostrarMensagemAgenda(
        "mensagem-agenda-form",
        "Não foi possível salvar o agendamento. Verifique se o SQL da agenda foi executado.",
        "erro"
      );
      return;
    }

    mostrarMensagemAgenda(
      "mensagem-agenda-form",
      id ? "Agendamento atualizado com sucesso." : "Agendamento criado com sucesso.",
      "sucesso"
    );

    limparFormularioAgenda();
    await carregarAgendaServicos();

  } catch (erro) {
    console.error("Erro inesperado ao salvar agendamento:", erro);
    mostrarMensagemAgenda("mensagem-agenda-form", "Erro inesperado ao salvar agendamento.", "erro");
  } finally {
    const btn = document.getElementById("btn-salvar-agenda");
    alterarEstadoBotaoAgenda(btn, false, valorInputAgenda("agenda-id") ? "Atualizar agendamento" : "Salvar agendamento");
  }
}

function montarObjetoAgenda() {
  return {
    cliente_id: valorInputAgenda("agenda-cliente-id") || null,
    veiculo_id: valorInputAgenda("agenda-veiculo-id") || null,
    ordem_id: valorInputAgenda("agenda-ordem-id") || null,
    titulo: valorInputAgenda("agenda-titulo"),
    descricao: valorInputAgenda("agenda-descricao"),
    data_servico: valorInputAgenda("agenda-data") || null,
    hora_inicio: valorInputAgenda("agenda-hora-inicio") || null,
    hora_fim: valorInputAgenda("agenda-hora-fim") || null,
    status: valorInputAgenda("agenda-status") || "agendado",
    responsavel: valorInputAgenda("agenda-responsavel"),
    observacoes: valorInputAgenda("agenda-observacoes")
  };
}

function editarAgendamento(id) {
  const item = agendaCache.find((agendamento) => String(agendamento.id) === String(id));

  if (!item) {
    mostrarMensagemAgenda("mensagem-agenda-lista", "Agendamento não encontrado.", "erro");
    return;
  }

  setValorAgenda("agenda-id", item.id);
  setValorAgenda("agenda-titulo", item.titulo);
  setValorAgenda("agenda-descricao", item.descricao);
  setValorAgenda("agenda-data", item.data_servico || "");
  setValorAgenda("agenda-hora-inicio", normalizarHoraAgenda(item.hora_inicio));
  setValorAgenda("agenda-hora-fim", normalizarHoraAgenda(item.hora_fim));
  setValorAgenda("agenda-status", item.status || "agendado");
  setValorAgenda("agenda-responsavel", item.responsavel);
  setValorAgenda("agenda-observacoes", item.observacoes);

  if (item.cliente_id) {
    const cliente = obterClienteAgenda(item);
    if (cliente) selecionarClienteAgenda(cliente.id);
    else setValorAgenda("agenda-cliente-id", item.cliente_id);
  } else {
    limparClienteAgenda();
  }

  setTimeout(() => {
    setValorAgenda("agenda-veiculo-id", item.veiculo_id || "");
    setValorAgenda("agenda-ordem-id", item.ordem_id || "");
  }, 80);

  const titulo = document.getElementById("titulo-form-agenda");
  const btn = document.getElementById("btn-salvar-agenda");

  if (titulo) titulo.textContent = "Editar agendamento";
  if (btn) btn.textContent = "Atualizar agendamento";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirAgendamento(id) {
  const item = agendaCache.find((agendamento) => String(agendamento.id) === String(id));
  const confirmar = confirm(`Deseja excluir o agendamento "${item?.titulo || "selecionado"}"?`);

  if (!confirmar) return;

  const { error } = await window._supabase
    .from("agenda_servicos")
    .delete()
    .eq("id", id)
    .eq("user_id", usuarioLogadoAgenda.id);

  if (error) {
    console.error("Erro ao excluir agendamento:", error);
    mostrarMensagemAgenda("mensagem-agenda-lista", "Não foi possível excluir o agendamento.", "erro");
    return;
  }

  mostrarMensagemAgenda("mensagem-agenda-lista", "Agendamento excluído com sucesso.", "sucesso");
  await carregarAgendaServicos();
}

function limparFormularioAgenda() {
  const form = document.getElementById("form-agenda");
  if (form) form.reset();

  setValorAgenda("agenda-id", "");
  setValorAgenda("agenda-status", "agendado");
  setValorAgenda("agenda-data", hojeISOAgenda());
  setValorAgenda("agenda-responsavel", obterResponsavelPadraoAgenda());
  limparClienteAgenda();
  limparMensagemAgenda("mensagem-agenda-form");

  const titulo = document.getElementById("titulo-form-agenda");
  const btn = document.getElementById("btn-salvar-agenda");

  if (titulo) titulo.textContent = "Novo agendamento";
  if (btn) btn.textContent = "Salvar agendamento";
}

/* =========================================================
   RENDERIZAÇÃO / FILTROS
   ========================================================= */

function filtrarAgendaNaTela() {
  const termo = normalizarTextoAgenda(valorInputAgenda("busca-agenda"));
  const status = valorInputAgenda("filtro-agenda-status");

  let lista = [...agendaCache];

  if (status) {
    lista = lista.filter((item) => item.status === status);
  }

  if (termo) {
    lista = lista.filter((item) => {
      const cliente = obterClienteAgenda(item);
      const veiculo = obterVeiculoAgenda(item);
      const ordem = obterOrdemAgenda(item);

      const texto = normalizarTextoAgenda([
        item.titulo,
        item.descricao,
        item.status,
        item.responsavel,
        item.observacoes,
        formatarClienteIdAgenda(cliente?.numero_cliente),
        cliente?.nome,
        cliente?.whatsapp,
        cliente?.email,
        veiculo?.placa,
        veiculo?.marca,
        veiculo?.modelo,
        veiculo?.cor,
        veiculo?.prisma,
        ordem?.numero_os,
        ordem?.titulo
      ].filter(Boolean).join(" "));

      return texto.includes(termo);
    });
  }

  renderizarAgenda(lista);
}

function renderizarAgenda(lista) {
  const container = document.getElementById("lista-agenda");

  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum serviço agendado</strong>
        <p>Crie um agendamento manualmente ou use o botão Agendar serviço dentro de uma OS.</p>
      </div>
    `;
    return;
  }

  const grupos = agruparAgendaPorData(lista);

  container.innerHTML = Object.keys(grupos).map((data) => {
    const itens = grupos[data];

    return `
      <section class="agenda-dia">
        <div class="agenda-dia-header">
          <span>${escaparHTMLAgenda(formatarDataVisualAgenda(data))}</span>
          <span>${itens.length} agendamento(s)</span>
        </div>

        ${itens.map(criarCardAgenda).join("")}
      </section>
    `;
  }).join("");
}

function criarCardAgenda(item) {
  const cliente = obterClienteAgenda(item);
  const veiculo = obterVeiculoAgenda(item);
  const ordem = obterOrdemAgenda(item);

  const hora = [normalizarHoraAgenda(item.hora_inicio), normalizarHoraAgenda(item.hora_fim)]
    .filter(Boolean)
    .join(" às ");

  const clienteTexto = cliente
    ? `${formatarClienteIdAgenda(cliente.numero_cliente)} - ${cliente.nome || "Cliente"}`
    : "Sem cliente vinculado";

  const detalhes = [
    hora ? `Horário: ${hora}` : "Sem horário definido",
    clienteTexto,
    veiculo ? `Veículo: ${formatarVeiculoAgenda(veiculo)}` : "",
    ordem ? `OS: ${formatarOrdemAgenda(ordem)}` : "",
    item.responsavel ? `Responsável: ${item.responsavel}` : ""
  ].filter(Boolean).join(" • ");

  return `
    <article class="agenda-item">
      <div class="agenda-item-topo">
        <div>
          <h3>${escaparHTMLAgenda(item.titulo || "Serviço agendado")}</h3>
          <p>${escaparHTMLAgenda(detalhes)}</p>
          ${
            item.descricao
              ? `<p style="margin-top:6px;">${escaparHTMLAgenda(item.descricao)}</p>`
              : ""
          }
        </div>

        <span class="tag ${escaparHTMLAtributoAgenda(item.status || "agendado")}">
          ${escaparHTMLAgenda(formatarStatusAgenda(item.status))}
        </span>
      </div>

      <div class="agenda-tags">
        ${cliente ? `<span class="tag">${escaparHTMLAgenda(cliente.nome || "Cliente")}</span>` : ""}
        ${veiculo ? `<span class="tag">${escaparHTMLAgenda(veiculo.placa || "Veículo")}</span>` : ""}
        ${ordem ? `<span class="tag">${escaparHTMLAgenda(formatarOrdemAgenda(ordem))}</span>` : ""}
      </div>

      <div class="acoes-linha">
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="editarAgendamento('${escaparHTMLAtributoAgenda(item.id)}')">
          Editar
        </button>

        ${
          ordem?.id
            ? `<button type="button" class="btn btn-primario btn-pequeno" onclick="abrirOrdemAgenda('${escaparHTMLAtributoAgenda(ordem.id)}')">Abrir OS</button>`
            : ""
        }

        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirAgendamento('${escaparHTMLAtributoAgenda(item.id)}')">
          Excluir
        </button>
      </div>
    </article>
  `;
}

function atualizarResumoAgenda(lista) {
  const hoje = hojeISOAgenda();
  const inicioSemana = obterInicioSemanaAgenda(new Date());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const hojeQtd = lista.filter((item) => item.data_servico === hoje).length;
  const semanaQtd = lista.filter((item) => {
    const data = parseDataAgenda(item.data_servico);
    return data && data >= inicioSemana && data <= fimSemana;
  }).length;

  const confirmados = lista.filter((item) => item.status === "confirmado").length;
  const execucao = lista.filter((item) => item.status === "em_execucao").length;

  setTextoAgenda("agenda-resumo-hoje", hojeQtd);
  setTextoAgenda("agenda-resumo-semana", semanaQtd);
  setTextoAgenda("agenda-resumo-confirmados", confirmados);
  setTextoAgenda("agenda-resumo-execucao", execucao);
}

/* =========================================================
   HELPERS
   ========================================================= */

function aplicarDatasPadraoAgenda() {
  const hoje = hojeISOAgenda();
  const daqui30 = new Date();
  daqui30.setDate(daqui30.getDate() + 30);

  if (!valorInputAgenda("agenda-data")) setValorAgenda("agenda-data", hoje);
  if (!valorInputAgenda("filtro-agenda-inicio")) setValorAgenda("filtro-agenda-inicio", hoje);
  if (!valorInputAgenda("filtro-agenda-fim")) setValorAgenda("filtro-agenda-fim", dataParaISOAgenda(daqui30));
  if (!valorInputAgenda("agenda-responsavel")) setValorAgenda("agenda-responsavel", obterResponsavelPadraoAgenda());
}

function obterResponsavelPadraoAgenda() {
  return (
    localStorage.getItem("consultor_tecnico_nome") ||
    localStorage.getItem("consultor_tecnico") ||
    localStorage.getItem("usuario_nome") ||
    usuarioLogadoAgenda?.user_metadata?.full_name ||
    usuarioLogadoAgenda?.user_metadata?.name ||
    usuarioLogadoAgenda?.email?.split("@")[0] ||
    ""
  );
}

function obterClienteAgenda(item) {
  if (!item) return null;
  if (item.clientes) return item.clientes;
  if (item.cliente_id) return clientesAgendaCache.find((cliente) => String(cliente.id) === String(item.cliente_id)) || null;
  return null;
}

function obterVeiculoAgenda(item) {
  if (!item) return null;
  if (item.veiculos) return item.veiculos;
  if (item.veiculo_id) return veiculosAgendaCache.find((veiculo) => String(veiculo.id) === String(item.veiculo_id)) || null;
  return null;
}

function obterOrdemAgenda(item) {
  if (!item) return null;
  if (item.ordens_servico) return item.ordens_servico;
  if (item.ordem_id) return ordensAgendaCache.find((ordem) => String(ordem.id) === String(item.ordem_id)) || null;
  return null;
}

function formatarClienteIdAgenda(numero) {
  if (!numero && numero !== 0) return "CLI-000000";
  const n = Number(numero);
  if (Number.isFinite(n)) return `CLI-${String(n).padStart(6, "0")}`;
  const texto = String(numero).replace(/^CLI-/i, "");
  return `CLI-${texto.padStart(6, "0")}`;
}

function formatarVeiculoAgenda(veiculo) {
  if (!veiculo) return "";
  const placa = veiculo.placa ? String(veiculo.placa).toUpperCase() : "Sem placa";
  const modelo = [veiculo.marca, veiculo.modelo].filter(Boolean).join(" ");
  const cor = veiculo.cor ? ` - ${veiculo.cor}` : "";
  const prisma = veiculo.prisma ? ` - Prisma: ${veiculo.prisma}` : "";
  return `${placa}${modelo ? ` - ${modelo}` : ""}${cor}${prisma}`;
}

function formatarOrdemAgenda(ordem) {
  if (!ordem) return "";
  const numero = ordem.numero_os ? `OS Nº ${String(ordem.numero_os).padStart(6, "0")}` : "OS";
  return `${numero}${ordem.titulo ? ` - ${ordem.titulo}` : ""}`;
}

function formatarStatusAgenda(status) {
  const mapa = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    em_execucao: "Em execução",
    concluido: "Concluído",
    cancelado: "Cancelado"
  };

  return mapa[status] || "Agendado";
}

function abrirOrdemAgenda(ordemId) {
  if (!ordemId) return;
  window.location.href = `ordem.html?id=${encodeURIComponent(ordemId)}`;
}

function agruparAgendaPorData(lista) {
  return lista.reduce((grupos, item) => {
    const data = item.data_servico || "Sem data";
    if (!grupos[data]) grupos[data] = [];
    grupos[data].push(item);
    return grupos;
  }, {});
}

function valorInputAgenda(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorAgenda(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = valor ?? "";
}

function setTextoAgenda(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = valor;
}

function mostrarMensagemAgenda(id, texto, tipo = "info") {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `mensagem-agenda ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => limparMensagemAgenda(id), 4500);
  }
}

function limparMensagemAgenda(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "mensagem-agenda";
  el.textContent = "";
}

function alterarEstadoBotaoAgenda(botao, carregando, texto) {
  if (!botao) return;
  botao.disabled = carregando;
  botao.textContent = texto;
}

function normalizarTextoAgenda(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHTMLAgenda(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparHTMLAtributoAgenda(valor) {
  return escaparHTMLAgenda(valor);
}

function hojeISOAgenda() {
  return dataParaISOAgenda(new Date());
}

function dataParaISOAgenda(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function parseDataAgenda(valor) {
  if (!valor || valor === "Sem data") return null;
  const partes = String(valor).split("-");
  if (partes.length !== 3) return null;
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function formatarDataVisualAgenda(valor) {
  if (valor === "Sem data") return "Sem data";
  const data = parseDataAgenda(valor);
  if (!data) return valor || "-";
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function obterInicioSemanaAgenda(data) {
  const inicio = new Date(data);
  const dia = inicio.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  inicio.setDate(inicio.getDate() + diff);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function normalizarHoraAgenda(valor) {
  if (!valor) return "";
  return String(valor).substring(0, 5);
}

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   ========================================================= */

window.carregarAgendaServicos = carregarAgendaServicos;
window.buscarClientesModalAgenda = buscarClientesModalAgenda;
window.selecionarClienteAgenda = selecionarClienteAgenda;
window.fecharModalClienteAgenda = fecharModalClienteAgenda;
window.editarAgendamento = editarAgendamento;
window.excluirAgendamento = excluirAgendamento;
window.abrirOrdemAgenda = abrirOrdemAgenda;
