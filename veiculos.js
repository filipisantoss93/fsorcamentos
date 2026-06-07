/* =========================================================
   FS ORÇAMENTOS - veiculos.js
   Cadastro de veículos para gestão de oficina

   Fluxo:
   - veículo pode ser vinculado a um cliente
   - ordens_servico e orcamentos já possuem veiculo_id no SQL
   - próximas etapas: integrar veiculo_id em ordens.js, ordem.js e PDF da OS
   ========================================================= */

let veiculosCache = [];
let clientesVeiculosCache = [];
let usuarioLogadoVeiculos = null;
let listaVeiculosMobileAberta = false;

let fsVeiculosInicializado = false;

async function iniciarVeiculosInicializado() {
  if (fsVeiculosInicializado) return;
  fsVeiculosInicializado = true;
  await inicializarModuloVeiculos();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarVeiculosInicializado);
} else {
  iniciarVeiculosInicializado();
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarModuloVeiculos() {
  try {
    garantirSupabaseVeiculos();

    const session = await obterSessaoAtualVeiculos();

    if (!session) {
      redirecionarParaLoginVeiculos();
      return;
    }

    usuarioLogadoVeiculos = session.user;

    configurarEventosVeiculos();
    await carregarClientesParaVeiculos();
    await carregarVeiculos();
    aplicarParametrosUrlVeiculos();

  } catch (erro) {
    console.error("Erro ao inicializar veiculos.js:", erro);
    mostrarMensagemVeiculos(
      "mensagem-veiculos-lista",
      "Erro ao iniciar o cadastro de veículos. Verifique sua conexão e tente novamente.",
      "erro"
    );
  }
}

function garantirSupabaseVeiculos() {
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

async function obterSessaoAtualVeiculos() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data && data.session ? data.session : null;
}

function redirecionarParaLoginVeiculos() {
  const destino = encodeURIComponent("veiculos.html" + window.location.search);
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosVeiculos() {
  const form = document.getElementById("form-veiculo");
  const btnLimpar = document.getElementById("btn-limpar-veiculo");
  const btnAtualizar = document.getElementById("btn-atualizar-veiculos");
  const busca = document.getElementById("busca-veiculos");
  const filtroStatus = document.getElementById("filtro-status-veiculos");
  const filtroCliente = document.getElementById("filtro-cliente-veiculos");
  const btnToggleLista = document.getElementById("btn-toggle-lista-veiculos");
  const campoBuscaClienteModal = document.getElementById("campo-busca-cliente-veiculo");

  const inputPlaca = document.getElementById("veiculo-placa");
  const inputChassi = document.getElementById("veiculo-chassi");
  const inputEstadoAno = document.getElementById("veiculo-ano");

  if (form) {
    form.addEventListener("submit", salvarVeiculo);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFormularioVeiculo);
  }

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", carregarVeiculos);
  }

  if (busca) {
    busca.addEventListener("input", filtrarVeiculos);
  }

  if (filtroStatus) {
    filtroStatus.addEventListener("change", filtrarVeiculos);
  }

  if (filtroCliente) {
    filtroCliente.addEventListener("change", filtrarVeiculos);
  }

  if (btnToggleLista) {
    btnToggleLista.addEventListener("click", alternarListaVeiculosMobile);
  }

  if (campoBuscaClienteModal) {
    campoBuscaClienteModal.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buscarClientesModalVeiculo();
      }
    });
  }

  if (inputPlaca) {
    inputPlaca.addEventListener("input", () => {
      inputPlaca.value = normalizarPlacaVeiculo(inputPlaca.value);
    });
  }

  if (inputChassi) {
    inputChassi.addEventListener("input", () => {
      inputChassi.value = normalizarChassiVeiculo(inputChassi.value);
    });
  }

  if (inputEstadoAno) {
    inputEstadoAno.addEventListener("input", () => {
      inputEstadoAno.value = inputEstadoAno.value.replace(/[^0-9/]/g, "").slice(0, 9);
    });
  }

  configurarFormularioMobileVeiculos();
}

/* =========================================================
   FORMULÁRIO MOBILE / LISTA MOBILE
   ========================================================= */

function configurarFormularioMobileVeiculos() {
  const card = document.getElementById("card-form-veiculo");
  const botao = document.getElementById("btn-toggle-form-veiculo");

  if (!card || !botao) return;

  function aplicarEstadoInicial() {
    if (window.innerWidth <= 680) {
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

function abrirFormularioMobileVeiculo() {
  const card = document.getElementById("card-form-veiculo");
  const botao = document.getElementById("btn-toggle-form-veiculo");

  if (!card || !botao) return;

  card.classList.remove("form-fechado");

  if (window.innerWidth <= 680) {
    botao.textContent = "Fechar";
  }
}

function alternarListaVeiculosMobile() {
  const lista = document.getElementById("lista-veiculos");
  const botao = document.getElementById("btn-toggle-lista-veiculos");

  if (!lista || !botao) return;

  const fechada = lista.classList.toggle("lista-veiculos-mobile-fechada");
  listaVeiculosMobileAberta = !fechada;
  botao.textContent = fechada ? "Ver veículos" : "Ocultar veículos";
}

function abrirListaVeiculosMobile() {
  const lista = document.getElementById("lista-veiculos");
  const botao = document.getElementById("btn-toggle-lista-veiculos");

  if (!lista || !botao) return;

  lista.classList.remove("lista-veiculos-mobile-fechada");
  listaVeiculosMobileAberta = true;
  botao.textContent = "Ocultar veículos";
}

/* =========================================================
   CLIENTES
   ========================================================= */

async function carregarClientesParaVeiculos() {
  try {
    if (!usuarioLogadoVeiculos?.id) return;

    const { data, error } = await window._supabase
      .from("clientes")
      .select("id, numero_cliente, nome, whatsapp, email, endereco, cidade, estado, cep, status")
      .eq("user_id", usuarioLogadoVeiculos.id)
      .order("nome", { ascending: true });

    if (error) {
      console.warn("Erro ao carregar clientes pelo campo user_id, tentando usuario_id:", error);

      const fallback = await window._supabase
        .from("clientes")
        .select("id, numero_cliente, nome, whatsapp, email, endereco, cidade, estado, cep, status")
        .eq("usuario_id", usuarioLogadoVeiculos.id)
        .order("nome", { ascending: true });

      if (fallback.error) {
        console.error("Erro ao carregar clientes:", fallback.error);
        clientesVeiculosCache = [];
      } else {
        clientesVeiculosCache = Array.isArray(fallback.data) ? fallback.data : [];
      }
    } else {
      clientesVeiculosCache = Array.isArray(data) ? data : [];
    }

    preencherSelectClientesVeiculos();

  } catch (erro) {
    console.error("Erro inesperado ao carregar clientes:", erro);
    clientesVeiculosCache = [];
    preencherSelectClientesVeiculos();
  }
}

function preencherSelectClientesVeiculos() {
  const selectFiltro = document.getElementById("filtro-cliente-veiculos");

  const opcoesClientes = clientesVeiculosCache.map((cliente) => {
    const textoExtra = cliente.whatsapp ? ` - ${formatarTelefoneVeiculo(cliente.whatsapp)}` : "";
    return `<option value="${escaparHTMLAtributoVeiculo(cliente.id)}">${escaparHTMLVeiculo(cliente.nome || "Cliente sem nome")}${textoExtra}</option>`;
  }).join("");

  if (selectFiltro) {
    const valorAtual = selectFiltro.value;
    selectFiltro.innerHTML = `
      <option value="">Todos</option>
      <option value="sem_cliente">Sem cliente</option>
      ${opcoesClientes}
    `;

    if (valorAtual) selectFiltro.value = valorAtual;
  }

  atualizarClienteVisualVeiculo(valorInputVeiculo("veiculo-cliente-id"));
}

function obterClientePorIdVeiculo(clienteId) {
  if (!clienteId) return null;
  return clientesVeiculosCache.find((cliente) => String(cliente.id) === String(clienteId)) || null;
}

/* =========================================================
   CRUD VEÍCULOS
   ========================================================= */

async function carregarVeiculos() {
  try {
    setLoadingVeiculos(true);
    limparMensagemVeiculos("mensagem-veiculos-lista");

    if (!usuarioLogadoVeiculos?.id) {
      const session = await obterSessaoAtualVeiculos();

      if (!session) {
        redirecionarParaLoginVeiculos();
        return;
      }

      usuarioLogadoVeiculos = session.user;
    }

    const { data, error } = await window._supabase
      .from("veiculos_com_clientes")
      .select("*")
      .eq("user_id", usuarioLogadoVeiculos.id)
      .order("placa", { ascending: true });

    if (error) {
      console.warn("Erro ao carregar view veiculos_com_clientes, tentando tabela veiculos:", error);

      const fallback = await window._supabase
        .from("veiculos")
        .select("*")
        .eq("user_id", usuarioLogadoVeiculos.id)
        .order("placa", { ascending: true });

      if (fallback.error) {
        console.error("Erro ao carregar veículos:", fallback.error);
        mostrarMensagemVeiculos(
          "mensagem-veiculos-lista",
          "Não foi possível carregar os veículos. Verifique se o SQL da tabela veiculos foi executado no Supabase.",
          "erro"
        );
        return;
      }

      veiculosCache = enriquecerVeiculosComCliente(fallback.data || []);
    } else {
      veiculosCache = Array.isArray(data) ? data : [];
    }

    atualizarResumoVeiculos(veiculosCache);
    renderizarVeiculos(veiculosCache);

  } catch (erro) {
    console.error("Erro inesperado ao carregar veículos:", erro);
    mostrarMensagemVeiculos(
      "mensagem-veiculos-lista",
      "Erro inesperado ao carregar veículos.",
      "erro"
    );
  } finally {
    setLoadingVeiculos(false);
  }
}

function enriquecerVeiculosComCliente(lista) {
  return (Array.isArray(lista) ? lista : []).map((veiculo) => {
    const cliente = obterClientePorIdVeiculo(veiculo.cliente_id);

    return {
      ...veiculo,
      cliente_nome: cliente?.nome || null,
      cliente_whatsapp: cliente?.whatsapp || null,
      cliente_cidade: cliente?.cidade || null,
      cliente_estado: cliente?.estado || null
    };
  });
}

async function salvarVeiculo(event) {
  event.preventDefault();

  try {
    limparMensagemVeiculos("mensagem-veiculos-form");

    const session = await obterSessaoAtualVeiculos();

    if (!session) {
      redirecionarParaLoginVeiculos();
      return;
    }

    usuarioLogadoVeiculos = session.user;

    const veiculo = montarObjetoVeiculo();

    if (!veiculo.placa || veiculo.placa.length < 7) {
      mostrarMensagemVeiculos(
        "mensagem-veiculos-form",
        "Informe uma placa válida com pelo menos 7 caracteres.",
        "erro"
      );
      return;
    }

    const btnSalvar = document.getElementById("btn-salvar-veiculo");
    alterarEstadoBotaoVeiculos(btnSalvar, true, "Salvando...");

    const veiculoId = valorInputVeiculo("veiculo-id");

    let resultado;

    if (veiculoId) {
      resultado = await window._supabase
        .from("veiculos")
        .update(veiculo)
        .eq("id", veiculoId)
        .eq("user_id", usuarioLogadoVeiculos.id)
        .select()
        .single();
    } else {
      resultado = await window._supabase
        .from("veiculos")
        .insert({
          ...veiculo,
          user_id: usuarioLogadoVeiculos.id
        })
        .select()
        .single();
    }

    if (resultado.error) {
      console.error("Erro ao salvar veículo:", resultado.error);
      mostrarMensagemVeiculos(
        "mensagem-veiculos-form",
        traduzirErroVeiculo(resultado.error.message),
        "erro"
      );
      return;
    }

    mostrarMensagemVeiculos(
      "mensagem-veiculos-form",
      veiculoId ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.",
      "sucesso"
    );

    limparFormularioVeiculo();
    await carregarVeiculos();
    abrirListaVeiculosMobile();

  } catch (erro) {
    console.error("Erro inesperado ao salvar veículo:", erro);
    mostrarMensagemVeiculos(
      "mensagem-veiculos-form",
      "Erro inesperado ao salvar veículo.",
      "erro"
    );
  } finally {
    const btnSalvar = document.getElementById("btn-salvar-veiculo");
    alterarEstadoBotaoVeiculos(btnSalvar, false, "Salvar veículo");
  }
}

function montarObjetoVeiculo() {
  return {
    cliente_id: valorInputVeiculo("veiculo-cliente-id") || null,
    placa: normalizarPlacaVeiculo(valorInputVeiculo("veiculo-placa")),
    chassi: normalizarChassiVeiculo(valorInputVeiculo("veiculo-chassi")) || null,
    marca: valorInputVeiculo("veiculo-marca"),
    modelo: valorInputVeiculo("veiculo-modelo"),
    cor: valorInputVeiculo("veiculo-cor"),
    prisma: valorInputVeiculo("veiculo-prisma"),
    ano: valorInputVeiculo("veiculo-ano"),
    observacoes: valorInputVeiculo("veiculo-observacoes"),
    ativo: valorInputVeiculo("veiculo-ativo") !== "false"
  };
}

function editarVeiculo(id) {
  const veiculo = veiculosCache.find((item) => String(item.id) === String(id));

  if (!veiculo) {
    mostrarMensagemVeiculos(
      "mensagem-veiculos-lista",
      "Veículo não encontrado para edição.",
      "erro"
    );
    return;
  }

  setValorVeiculo("veiculo-id", veiculo.id);
  setValorVeiculo("veiculo-cliente-id", veiculo.cliente_id || "");
  atualizarClienteVisualVeiculo(veiculo.cliente_id || "");
  setValorVeiculo("veiculo-placa", veiculo.placa || "");
  setValorVeiculo("veiculo-chassi", veiculo.chassi || "");
  setValorVeiculo("veiculo-marca", veiculo.marca || "");
  setValorVeiculo("veiculo-modelo", veiculo.modelo || "");
  setValorVeiculo("veiculo-cor", veiculo.cor || "");
  setValorVeiculo("veiculo-prisma", veiculo.prisma || "");
  setValorVeiculo("veiculo-ano", veiculo.ano || "");
  setValorVeiculo("veiculo-observacoes", veiculo.observacoes || "");
  setValorVeiculo("veiculo-ativo", veiculo.ativo === false ? "false" : "true");

  const titulo = document.getElementById("titulo-form-veiculo");
  const btnSalvar = document.getElementById("btn-salvar-veiculo");

  if (titulo) titulo.textContent = "Editar veículo";
  if (btnSalvar) btnSalvar.textContent = "Atualizar veículo";

  abrirFormularioMobileVeiculo();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function excluirVeiculo(id) {
  try {
    const veiculo = veiculosCache.find((item) => String(item.id) === String(id));
    const nomeVeiculo = montarTituloVeiculo(veiculo);

    const confirmar = confirm(
      `Deseja realmente excluir ${nomeVeiculo}? Se o veículo já estiver vinculado a uma OS, talvez seja melhor marcar como inativo.`
    );

    if (!confirmar) return;

    const session = await obterSessaoAtualVeiculos();

    if (!session) {
      redirecionarParaLoginVeiculos();
      return;
    }

    usuarioLogadoVeiculos = session.user;

    const { error } = await window._supabase
      .from("veiculos")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioLogadoVeiculos.id);

    if (error) {
      console.error("Erro ao excluir veículo:", error);
      mostrarMensagemVeiculos(
        "mensagem-veiculos-lista",
        "Não foi possível excluir o veículo. Se houver histórico, marque como inativo em vez de excluir.",
        "erro"
      );
      return;
    }

    mostrarMensagemVeiculos(
      "mensagem-veiculos-lista",
      "Veículo excluído com sucesso.",
      "sucesso"
    );

    await carregarVeiculos();

  } catch (erro) {
    console.error("Erro inesperado ao excluir veículo:", erro);
    mostrarMensagemVeiculos(
      "mensagem-veiculos-lista",
      "Erro inesperado ao excluir veículo.",
      "erro"
    );
  }
}

async function inativarVeiculo(id) {
  try {
    const veiculo = veiculosCache.find((item) => String(item.id) === String(id));

    if (!veiculo) return;

    const novoStatus = veiculo.ativo === false;
    const texto = novoStatus ? "reativar" : "inativar";

    const confirmar = confirm(`Deseja ${texto} este veículo?`);
    if (!confirmar) return;

    const { error } = await window._supabase
      .from("veiculos")
      .update({ ativo: novoStatus })
      .eq("id", id)
      .eq("user_id", usuarioLogadoVeiculos.id);

    if (error) {
      console.error("Erro ao alterar status do veículo:", error);
      mostrarMensagemVeiculos("mensagem-veiculos-lista", "Erro ao alterar status do veículo.", "erro");
      return;
    }

    await carregarVeiculos();
  } catch (erro) {
    console.error("Erro inesperado ao alterar status:", erro);
  }
}

/* =========================================================
   FILTRO / RESUMO
   ========================================================= */

function filtrarVeiculos() {
  const termo = normalizarTextoVeiculo(valorInputVeiculo("busca-veiculos"));
  const status = valorInputVeiculo("filtro-status-veiculos");
  const clienteFiltro = valorInputVeiculo("filtro-cliente-veiculos");

  let lista = [...veiculosCache];

  if (termo) {
    lista = lista.filter((veiculo) => {
      const textoBusca = normalizarTextoVeiculo([
        veiculo.placa,
        veiculo.chassi,
        veiculo.marca,
        veiculo.modelo,
        veiculo.cor,
        veiculo.prisma,
        veiculo.ano,
        veiculo.observacoes,
        veiculo.cliente_nome,
        veiculo.cliente_whatsapp
      ].filter(Boolean).join(" "));

      return textoBusca.includes(termo);
    });
  }

  if (status === "ativo") {
    lista = lista.filter((veiculo) => veiculo.ativo !== false);
  }

  if (status === "inativo") {
    lista = lista.filter((veiculo) => veiculo.ativo === false);
  }

  if (clienteFiltro === "sem_cliente") {
    lista = lista.filter((veiculo) => !veiculo.cliente_id);
  }

  if (clienteFiltro && clienteFiltro !== "sem_cliente") {
    lista = lista.filter((veiculo) => String(veiculo.cliente_id || "") === String(clienteFiltro));
  }

  renderizarVeiculos(lista);
}

function atualizarResumoVeiculos(lista) {
  const total = lista.length;
  const ativos = lista.filter((veiculo) => veiculo.ativo !== false).length;
  const clientesUnicos = new Set(lista.filter((veiculo) => veiculo.cliente_id).map((veiculo) => veiculo.cliente_id));
  const semCliente = lista.filter((veiculo) => !veiculo.cliente_id).length;

  setTextoVeiculo("resumo-total-veiculos", total);
  setTextoVeiculo("resumo-veiculos-ativos", ativos);
  setTextoVeiculo("resumo-clientes-vinculados", clientesUnicos.size);
  setTextoVeiculo("resumo-veiculos-sem-cliente", semCliente);
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizarVeiculos(lista) {
  const container = document.getElementById("lista-veiculos");

  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum veículo encontrado</strong>
        <p>Cadastre seu primeiro veículo ou ajuste os filtros de busca.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map((veiculo) => criarCardVeiculo(veiculo)).join("");
}

function criarCardVeiculo(veiculo) {
  const id = escaparHTMLAtributoVeiculo(veiculo.id);
  const placa = escaparHTMLVeiculo(formatarPlacaVeiculo(veiculo.placa));
  const titulo = escaparHTMLVeiculo(montarTituloVeiculo(veiculo));
  const descricao = escaparHTMLVeiculo(montarDescricaoVeiculo(veiculo));
  const cliente = escaparHTMLVeiculo(veiculo.cliente_nome || "Sem cliente vinculado");
  const telefone = veiculo.cliente_whatsapp ? ` • ${formatarTelefoneVeiculo(veiculo.cliente_whatsapp)}` : "";
  const statusClasse = veiculo.ativo === false ? "inativo" : "ativo";
  const statusTexto = veiculo.ativo === false ? "Inativo" : "Ativo";

  const chassi = veiculo.chassi ? `<span>Chassi: ${escaparHTMLVeiculo(veiculo.chassi)}</span>` : "";
  const cor = veiculo.cor ? `<span>Cor: ${escaparHTMLVeiculo(veiculo.cor)}</span>` : "";
  const ano = veiculo.ano ? `<span>Ano: ${escaparHTMLVeiculo(veiculo.ano)}</span>` : "";
  const prisma = veiculo.prisma ? `<span>Prisma: ${escaparHTMLVeiculo(veiculo.prisma)}</span>` : "";

  return `
    <article class="veiculo-item">
      <div class="veiculo-linha-topo">
        <div class="veiculo-info">
          <h3>${titulo}</h3>
          <p>${descricao}</p>
          <p><strong>Cliente:</strong> ${cliente}${telefone}</p>
        </div>

        <div class="placa-badge">${placa}</div>
      </div>

      <div class="veiculo-tags">
        <span class="tag ${statusClasse}">${statusTexto}</span>
        ${chassi}
        ${cor}
        ${ano}
        ${prisma}
      </div>

      <div class="veiculo-acoes">
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="editarVeiculo('${id}')">
          Editar
        </button>

        <button type="button" class="btn btn-verde btn-pequeno" onclick="novoOrcamentoComVeiculo('${id}')">
          Novo orçamento
        </button>

        <button type="button" class="btn btn-primario btn-pequeno" onclick="novaOSComVeiculo('${id}')">
          Nova OS
        </button>

        <button type="button" class="btn btn-secundario btn-pequeno" onclick="inativarVeiculo('${id}')">
          ${statusTexto === "Ativo" ? "Inativar" : "Ativar"}
        </button>

        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirVeiculo('${id}')">
          Excluir
        </button>
      </div>
    </article>
  `;
}

/* =========================================================
   ATALHOS PARA OUTROS MÓDULOS
   ========================================================= */

function novoOrcamentoComVeiculo(id) {
  const veiculo = veiculosCache.find((item) => String(item.id) === String(id));

  if (!veiculo) {
    alert("Veículo não encontrado.");
    return;
  }

  const params = new URLSearchParams();

  params.set("veiculo_id", veiculo.id);
  params.set("veiculo_placa", veiculo.placa || "");

  if (veiculo.cliente_id) params.set("cliente_id", veiculo.cliente_id);
  if (veiculo.cliente_nome) params.set("cliente_nome", veiculo.cliente_nome);
  if (veiculo.cliente_whatsapp) params.set("cliente_whatsapp", veiculo.cliente_whatsapp);

  window.location.href = `gerador.html?${params.toString()}`;
}

function novaOSComVeiculo(id) {
  const veiculo = veiculosCache.find((item) => String(item.id) === String(id));

  if (!veiculo) {
    alert("Veículo não encontrado.");
    return;
  }

  const params = new URLSearchParams();

  params.set("veiculo_id", veiculo.id);
  params.set("veiculo_placa", veiculo.placa || "");

  if (veiculo.cliente_id) params.set("cliente_id", veiculo.cliente_id);
  if (veiculo.cliente_nome) params.set("cliente_nome", veiculo.cliente_nome);

  window.location.href = `ordens.html?${params.toString()}`;
}

function aplicarParametrosUrlVeiculos() {
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get("cliente_id");
  const abrirNovo = params.get("novo") === "1";

  if (clienteId) {
    setValorVeiculo("veiculo-cliente-id", clienteId);
    atualizarClienteVisualVeiculo(clienteId);
    setValorVeiculo("filtro-cliente-veiculos", clienteId);
    filtrarVeiculos();
  }

  if (abrirNovo || clienteId) {
    abrirFormularioMobileVeiculo();
  }
}

/* =========================================================
   FORMULÁRIO
   ========================================================= */

function limparFormularioVeiculo() {
  const form = document.getElementById("form-veiculo");

  if (form) form.reset();

  setValorVeiculo("veiculo-id", "");
  setValorVeiculo("veiculo-cliente-id", "");
  atualizarClienteVisualVeiculo("");
  setValorVeiculo("veiculo-placa", "");
  setValorVeiculo("veiculo-chassi", "");
  setValorVeiculo("veiculo-marca", "");
  setValorVeiculo("veiculo-modelo", "");
  setValorVeiculo("veiculo-cor", "");
  setValorVeiculo("veiculo-prisma", "");
  setValorVeiculo("veiculo-ano", "");
  setValorVeiculo("veiculo-observacoes", "");
  setValorVeiculo("veiculo-ativo", "true");

  const titulo = document.getElementById("titulo-form-veiculo");
  const btnSalvar = document.getElementById("btn-salvar-veiculo");

  if (titulo) titulo.textContent = "Novo veículo";
  if (btnSalvar) btnSalvar.textContent = "Salvar veículo";

  limparMensagemVeiculos("mensagem-veiculos-form");
}

/* =========================================================
   HELPERS DOM
   ========================================================= */

function valorInputVeiculo(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorVeiculo(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.value = valor ?? "";
}

function setTextoVeiculo(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = valor ?? "";
}

function mostrarMensagemVeiculos(id, texto, tipo = "info") {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = `mensagem-veiculos ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagemVeiculos(id);
    }, 4000);
  }
}

function limparMensagemVeiculos(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = "mensagem-veiculos";
  el.textContent = "";
}

function setLoadingVeiculos(ativo) {
  const loading = document.getElementById("loading-veiculos");

  if (!loading) return;

  if (ativo) {
    loading.classList.add("ativo");
  } else {
    loading.classList.remove("ativo");
  }
}

function alterarEstadoBotaoVeiculos(botao, carregando, texto) {
  if (!botao) return;

  botao.disabled = carregando;
  botao.textContent = texto;
}

/* =========================================================
   HELPERS TEXTO / FORMATADORES
   ========================================================= */

function normalizarPlacaVeiculo(valor) {
  return String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function normalizarChassiVeiculo(valor) {
  return String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 30);
}

function formatarPlacaVeiculo(valor) {
  const placa = normalizarPlacaVeiculo(valor);
  return placa || "SEM PLACA";
}

function montarTituloVeiculo(veiculo) {
  if (!veiculo) return "Veículo";

  const partes = [
    veiculo.marca,
    veiculo.modelo
  ].filter(Boolean);

  return partes.length ? partes.join(" ") : "Veículo sem modelo";
}

function montarDescricaoVeiculo(veiculo) {
  if (!veiculo) return "-";

  const partes = [
    veiculo.cor ? `Cor: ${veiculo.cor}` : "",
    veiculo.ano ? `Ano: ${veiculo.ano}` : "",
    veiculo.prisma ? `Prisma: ${veiculo.prisma}` : ""
  ].filter(Boolean);

  return partes.length ? partes.join(" • ") : "Sem detalhes adicionais";
}

function formatarTelefoneVeiculo(telefone) {
  const numero = String(telefone || "").replace(/\D/g, "");

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

function normalizarTextoVeiculo(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function traduzirErroVeiculo(mensagem) {
  const texto = String(mensagem || "").toLowerCase();

  if (texto.includes("duplicate") || texto.includes("idx_veiculos_user_placa_unica")) {
    return "Já existe um veículo cadastrado com esta placa.";
  }

  if (texto.includes("veiculos_placa_obrigatoria") || texto.includes("check")) {
    return "Informe uma placa válida com pelo menos 7 caracteres.";
  }

  if (texto.includes("violates row-level security")) {
    return "Você não tem permissão para salvar este veículo. Faça login novamente.";
  }

  return "Erro ao salvar veículo. Verifique os dados e tente novamente.";
}

function escaparHTMLVeiculo(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparHTMLAtributoVeiculo(valor) {
  return escaparHTMLVeiculo(valor);
}



/* =========================================================
   MODAL DE BUSCA DE CLIENTE
   ========================================================= */

function textoBuscaClienteVeiculo(cliente) {
  return normalizarTextoVeiculo([
    codigoClienteVeiculo(cliente),
    cliente?.numero_cliente,
    cliente?.nome,
    cliente?.whatsapp,
    cliente?.email,
    cliente?.endereco,
    cliente?.cidade,
    cliente?.estado,
    cliente?.cep
  ].filter(Boolean).join(" "));
}


function formatarNumeroClienteVeiculo(clienteOuNumero) {
  const numero = typeof clienteOuNumero === "object" ? clienteOuNumero?.numero_cliente : clienteOuNumero;
  const n = Number(numero);
  return Number.isFinite(n) && n > 0 ? String(Math.trunc(n)).padStart(6, "0") : "";
}
function codigoClienteVeiculo(cliente) {
  const numero = formatarNumeroClienteVeiculo(cliente);
  return numero ? `CLI-${numero}` : "";
}

function detalhesClienteVeiculo(cliente) {
  if (!cliente) return "";

  return [
    codigoClienteVeiculo(cliente) ? `ID: ${codigoClienteVeiculo(cliente)}` : "",
    cliente.whatsapp ? `WhatsApp: ${formatarTelefoneVeiculo(cliente.whatsapp)}` : "",
    cliente.email ? `E-mail: ${cliente.email}` : "",
    cliente.endereco ? `Endereço: ${cliente.endereco}` : "",
    [cliente.cidade, cliente.estado].filter(Boolean).join("/") || "",
    cliente.cep ? `CEP: ${cliente.cep}` : ""
  ].filter(Boolean).join(" • ");
}

function atualizarClienteVisualVeiculo(clienteId) {
  const nomeEl = document.getElementById("veiculo-cliente-visual");
  const detalhesEl = document.getElementById("veiculo-cliente-detalhes");

  if (!nomeEl || !detalhesEl) return;

  const cliente = obterClientePorIdVeiculo(clienteId);

  if (!cliente) {
    nomeEl.textContent = "Nenhum cliente selecionado";
    detalhesEl.textContent = "Você pode salvar o veículo sem cliente ou buscar um cliente cadastrado.";
    return;
  }

  nomeEl.textContent = cliente.nome || "Cliente sem nome";
  detalhesEl.textContent = detalhesClienteVeiculo(cliente) || "Cliente vinculado ao veículo.";
}

function abrirModalBuscaClienteVeiculo() {
  const modal = document.getElementById("modal-busca-cliente-veiculo");
  const resultado = document.getElementById("resultado-busca-clientes-veiculo");
  const campo = document.getElementById("campo-busca-cliente-veiculo");

  if (resultado) {
    resultado.innerHTML = `<div class="estado-busca-cliente-modal">Digite pelo menos 2 caracteres e clique em Buscar.</div>`;
  }

  if (campo) campo.value = "";

  if (modal) {
    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => campo?.focus(), 80);
  }
}

function fecharModalBuscaClienteVeiculo() {
  const modal = document.getElementById("modal-busca-cliente-veiculo");

  if (modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
  }
}

function buscarClientesModalVeiculo() {
  const campo = document.getElementById("campo-busca-cliente-veiculo");
  const resultado = document.getElementById("resultado-busca-clientes-veiculo");

  if (!resultado) return;

  const termo = normalizarTextoVeiculo(campo?.value || "");

  const termoNumerico = String(campo?.value || "").replace(/\D/g, "");

  if (termo.length < 2 && termoNumerico.length < 1) {
    resultado.innerHTML = `<div class="estado-busca-cliente-modal">Digite o ID do cliente ou pelo menos 2 caracteres para buscar cliente.</div>`;
    return;
  }

  const encontrados = clientesVeiculosCache.filter((cliente) => {
    const texto = textoBuscaClienteVeiculo(cliente);
    return texto.includes(termo) || (termoNumerico && String(Number(cliente?.numero_cliente || 0)) === String(Number(termoNumerico)));
  }).slice(0, 30);

  if (!encontrados.length) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente-modal">
        Nenhum cliente encontrado.
        <br><br>
        <a href="clientes.html?novo=1" class="btn btn-primario">Cadastrar novo cliente</a>
      </div>
    `;
    return;
  }

  resultado.innerHTML = encontrados.map((cliente) => `
    <button type="button" class="cliente-modal-item" onclick="selecionarClienteModalVeiculo('${escaparHTMLAtributoVeiculo(cliente.id)}')">
      <strong>${escaparHTMLVeiculo(codigoClienteVeiculo(cliente) ? codigoClienteVeiculo(cliente) + ' - ' : '')}${escaparHTMLVeiculo(cliente.nome || "Cliente sem nome")}</strong>
      <span>${escaparHTMLVeiculo(detalhesClienteVeiculo(cliente) || "Sem detalhes adicionais")}</span>
    </button>
  `).join("");
}

function selecionarClienteModalVeiculo(clienteId) {
  setValorVeiculo("veiculo-cliente-id", clienteId || "");
  atualizarClienteVisualVeiculo(clienteId || "");
  fecharModalBuscaClienteVeiculo();
}

function limparClienteSelecionadoVeiculo() {
  setValorVeiculo("veiculo-cliente-id", "");
  atualizarClienteVisualVeiculo("");
}

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   Necessário porque botões são criados via innerHTML.
   ========================================================= */

window.carregarVeiculos = carregarVeiculos;
window.salvarVeiculo = salvarVeiculo;
window.editarVeiculo = editarVeiculo;
window.excluirVeiculo = excluirVeiculo;
window.inativarVeiculo = inativarVeiculo;
window.filtrarVeiculos = filtrarVeiculos;
window.limparFormularioVeiculo = limparFormularioVeiculo;
window.alternarListaVeiculosMobile = alternarListaVeiculosMobile;
window.novoOrcamentoComVeiculo = novoOrcamentoComVeiculo;
window.novaOSComVeiculo = novaOSComVeiculo;

window.abrirModalBuscaClienteVeiculo = abrirModalBuscaClienteVeiculo;
window.fecharModalBuscaClienteVeiculo = fecharModalBuscaClienteVeiculo;
window.buscarClientesModalVeiculo = buscarClientesModalVeiculo;
window.selecionarClienteModalVeiculo = selecionarClienteModalVeiculo;
window.limparClienteSelecionadoVeiculo = limparClienteSelecionadoVeiculo;
