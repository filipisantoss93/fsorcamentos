/* =========================================================
   FS ORÇAMENTOS - clientes.js
   Módulo de Clientes / Premium em desenvolvimento
   Atualizado: filtro por ID, copiar ID, Novo orçamento e Nova OS com cliente_id
   ========================================================= */

let clientesCache = [];
let clientesCarregadosUmaVez = false;
let usuarioLogado = null;

let fsClientesInicializado = false;

async function iniciarClientesInicializado() {
  if (fsClientesInicializado) return;
  fsClientesInicializado = true;
  await inicializarModuloClientes();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarClientesInicializado);
} else {
  iniciarClientesInicializado();
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarModuloClientes() {
  try {
    garantirSupabase();

    const session = await obterSessaoAtual();

    if (!session) {
      redirecionarParaLogin();
      return;
    }

    usuarioLogado = session.user;

    configurarEventosClientes();
    prepararListaClientesVazia();

  } catch (erro) {
    console.error("Erro ao inicializar clientes.js:", erro);
    mostrarMensagem(
      "mensagem-clientes-lista",
      "Erro ao iniciar o módulo de clientes. Verifique sua conexão e tente novamente.",
      "erro"
    );
  }
}

function garantirSupabase() {
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

async function obterSessaoAtual() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data && data.session ? data.session : null;
}

function redirecionarParaLogin() {
  const destino = encodeURIComponent("clientes.html");
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosClientes() {
  const form = document.getElementById("form-cliente");
  const btnLimpar = document.getElementById("btn-limpar-cliente");
  const btnAtualizar = document.getElementById("btn-atualizar-clientes");

  const busca = document.getElementById("busca-clientes");
  const buscaIdCliente = document.getElementById("busca-id-cliente");
  const filtroStatus = document.getElementById("filtro-status-clientes");
  const filtroCategoria = document.getElementById("filtro-categoria-clientes");

  if (form) {
    form.addEventListener("submit", salvarCliente);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFormularioCliente);
  }

  if (btnAtualizar) {
    btnAtualizar.textContent = "Buscar";
    btnAtualizar.addEventListener("click", carregarClientes);
  }

  if (busca) {
    busca.addEventListener("input", filtrarClientes);
    busca.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); carregarClientes(); } });
  }

  if (buscaIdCliente) {
    buscaIdCliente.addEventListener("input", filtrarClientes);
    buscaIdCliente.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); carregarClientes(); } });
  }

  if (filtroStatus) {
    filtroStatus.addEventListener("change", filtrarClientes);
  }

  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", filtrarClientes);
  }

  configurarFormularioMobileClientes();
}

function configurarFormularioMobileClientes() {
  const card = document.getElementById("card-form-cliente");
  const botao = document.getElementById("btn-toggle-form-cliente");

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


function formatarNumeroCliente(clienteOuNumero) {
  const numero = typeof clienteOuNumero === "object" ? clienteOuNumero?.numero_cliente : clienteOuNumero;
  const n = Number(numero);
  return Number.isFinite(n) && n > 0 ? String(Math.trunc(n)).padStart(6, "0") : "";
}

function obterCodigoClienteVisivel(cliente) {
  const numero = formatarNumeroCliente(cliente);
  return numero ? `CLI-${numero}` : "Cliente sem número";
}

function normalizarBuscaCodigoCliente(valor) {
  const apenasNumeros = String(valor || "").replace(/^cli[-\s]*/i, "").replace(/\D/g, "");
  return apenasNumeros ? String(Number(apenasNumeros)) : "";
}

function clienteCombinaComCodigo(cliente, termo) {
  const busca = normalizarBuscaCodigoCliente(termo);
  if (!busca) return false;
  const numero = Number(cliente?.numero_cliente || 0);
  return Number.isFinite(numero) && String(numero) === busca;
}

async function obterProximoNumeroCliente() {
  if (!usuarioLogado?.id || !window._supabase) return null;
  try {
    const { data, error } = await window._supabase
      .from("clientes")
      .select("numero_cliente")
      .eq("user_id", usuarioLogado.id)
      .not("numero_cliente", "is", null)
      .order("numero_cliente", { ascending: false })
      .limit(1);
    if (error) return null;
    const ultimo = Array.isArray(data) && data[0]?.numero_cliente ? Number(data[0].numero_cliente) : 0;
    return ultimo + 1;
  } catch (_) {
    return null;
  }
}

/* =========================================================
   CRUD - CLIENTES
   ========================================================= */


function prepararListaClientesVazia() {
  const container = document.getElementById("lista-clientes");
  if (!container) return;
  container.innerHTML = `
    <div class="estado-vazio">
      <strong>Nenhum cliente carregado</strong>
      <p>Use os filtros e clique em Buscar. A página carrega no máximo 20 clientes por vez.</p>
    </div>
  `;
}

async function carregarClientes() {
  try {
    setLoadingClientes(true);
    limparMensagem("mensagem-clientes-lista");

    if (!usuarioLogado || !usuarioLogado.id) {
      const session = await obterSessaoAtual();

      if (!session) {
        redirecionarParaLogin();
        return;
      }

      usuarioLogado = session.user;
    }

    const { data, error } = await window._supabase
      .from("clientes")
      .select("*")
      .eq("user_id", usuarioLogado.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      mostrarMensagem(
        "mensagem-clientes-lista",
        "Não foi possível carregar os clientes. Verifique se a tabela clientes foi criada no Supabase.",
        "erro"
      );
      return;
    }

    clientesCache = Array.isArray(data) ? data : [];
    clientesCarregadosUmaVez = true;

    atualizarResumoClientes(clientesCache);
    renderizarClientes(clientesCache);

  } catch (erro) {
    console.error("Erro inesperado ao carregar clientes:", erro);
    mostrarMensagem(
      "mensagem-clientes-lista",
      "Erro inesperado ao carregar clientes.",
      "erro"
    );
  } finally {
    setLoadingClientes(false);
  }
}

async function salvarCliente(event) {
  event.preventDefault();

  try {
    limparMensagem("mensagem-clientes-form");

    const session = await obterSessaoAtual();

    if (!session) {
      redirecionarParaLogin();
      return;
    }

    usuarioLogado = session.user;

    const cliente = montarObjetoCliente();

    if (!cliente.nome) {
      mostrarMensagem(
        "mensagem-clientes-form",
        "Informe o nome do cliente.",
        "erro"
      );
      return;
    }

    const btnSalvar = document.getElementById("btn-salvar-cliente");
    alterarEstadoBotao(btnSalvar, true, "Salvando...");

    const clienteId = document.getElementById("cliente-id")?.value || "";

    let resultado;

    if (clienteId) {
      resultado = await window._supabase
        .from("clientes")
        .update(cliente)
        .eq("id", clienteId)
        .eq("user_id", usuarioLogado.id)
        .select()
        .single();
    } else {
      const proximoNumeroCliente = await obterProximoNumeroCliente();
      const payloadNovoCliente = {
        ...cliente,
        user_id: usuarioLogado.id
      };

      if (proximoNumeroCliente) payloadNovoCliente.numero_cliente = proximoNumeroCliente;

      resultado = await window._supabase
        .from("clientes")
        .insert(payloadNovoCliente)
        .select()
        .single();

      if (resultado.error && String(resultado.error.message || resultado.error.details || '').toLowerCase().includes('numero_cliente')) {
        delete payloadNovoCliente.numero_cliente;
        resultado = await window._supabase
          .from("clientes")
          .insert(payloadNovoCliente)
          .select()
          .single();
      }
    }

    if (resultado.error) {
      console.error("Erro ao salvar cliente:", resultado.error);
      mostrarMensagem(
        "mensagem-clientes-form",
        "Erro ao salvar cliente. Verifique os dados e tente novamente.",
        "erro"
      );
      return;
    }

    mostrarMensagem(
      "mensagem-clientes-form",
      clienteId ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.",
      "sucesso"
    );

    limparFormularioCliente();
    await carregarClientes();

  } catch (erro) {
    console.error("Erro inesperado ao salvar cliente:", erro);
    mostrarMensagem(
      "mensagem-clientes-form",
      "Erro inesperado ao salvar cliente.",
      "erro"
    );
  } finally {
    const btnSalvar = document.getElementById("btn-salvar-cliente");
    alterarEstadoBotao(btnSalvar, false, "Salvar cliente");
  }
}

function montarObjetoCliente() {
  return {
    nome: valorInput("cliente-nome"),
    tipo_cliente: valorInput("cliente-tipo") || "pessoa_fisica",
    cpf_cnpj: limparTexto(valorInput("cliente-cpf-cnpj")),
    whatsapp: limparTelefone(valorInput("cliente-whatsapp")),
    email: valorInput("cliente-email"),
    endereco: valorInput("cliente-endereco"),
    cidade: valorInput("cliente-cidade"),
    estado: valorInput("cliente-estado").toUpperCase(),
    cep: valorInput("cliente-cep"),
    status: valorInput("cliente-status") || "ativo",
    categoria: valorInput("cliente-categoria") || "normal",
    observacoes: valorInput("cliente-observacoes")
  };
}

function editarCliente(id) {
  const cliente = clientesCache.find((item) => item.id === id);

  if (!cliente) {
    mostrarMensagem(
      "mensagem-clientes-lista",
      "Cliente não encontrado para edição.",
      "erro"
    );
    return;
  }

  setValor("cliente-id", cliente.id);
  setValor("cliente-nome", cliente.nome);
  setValor("cliente-tipo", cliente.tipo_cliente || "pessoa_fisica");
  setValor("cliente-cpf-cnpj", cliente.cpf_cnpj);
  setValor("cliente-whatsapp", cliente.whatsapp);
  setValor("cliente-email", cliente.email);
  setValor("cliente-endereco", cliente.endereco);
  setValor("cliente-cidade", cliente.cidade);
  setValor("cliente-estado", cliente.estado);
  setValor("cliente-cep", cliente.cep);
  setValor("cliente-status", cliente.status || "ativo");
  setValor("cliente-categoria", cliente.categoria || "normal");
  setValor("cliente-observacoes", cliente.observacoes);

  const titulo = document.getElementById("titulo-form-cliente");
  const btnSalvar = document.getElementById("btn-salvar-cliente");

  if (titulo) titulo.textContent = "Editar cliente";
  if (btnSalvar) btnSalvar.textContent = "Atualizar cliente";

  abrirFormularioMobileCliente();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function abrirFormularioMobileCliente() {
  const card = document.getElementById("card-form-cliente");
  const botao = document.getElementById("btn-toggle-form-cliente");

  if (!card || !botao) return;

  card.classList.remove("form-fechado");

  if (window.innerWidth <= 680) {
    botao.textContent = "Fechar";
  }
}

async function excluirCliente(id) {
  try {
    const cliente = clientesCache.find((item) => item.id === id);
    const nomeCliente = cliente?.nome || "este cliente";

    const confirmar = confirm(
      `Deseja realmente excluir ${nomeCliente}? Essa ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    const session = await obterSessaoAtual();

    if (!session) {
      redirecionarParaLogin();
      return;
    }

    usuarioLogado = session.user;

    const { error } = await window._supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioLogado.id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      mostrarMensagem(
        "mensagem-clientes-lista",
        "Não foi possível excluir o cliente. Verifique se ele não está vinculado a uma ordem de serviço.",
        "erro"
      );
      return;
    }

    mostrarMensagem(
      "mensagem-clientes-lista",
      "Cliente excluído com sucesso.",
      "sucesso"
    );

    await carregarClientes();

  } catch (erro) {
    console.error("Erro inesperado ao excluir cliente:", erro);
    mostrarMensagem(
      "mensagem-clientes-lista",
      "Erro inesperado ao excluir cliente.",
      "erro"
    );
  }
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizarClientes(lista) {
  const container = document.getElementById("lista-clientes");

  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum cliente encontrado</strong>
        <p>Cadastre seu primeiro cliente usando o formulário ao lado.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map((cliente) => criarCardCliente(cliente)).join("");
}

function criarCardCliente(cliente) {
  const idSeguro = escaparHTML(cliente.id || "");
  const codigoCliente = escaparHTML(obterCodigoClienteVisivel(cliente));
  const nome = escaparHTML(cliente.nome || "Cliente sem nome");
  const whatsapp = escaparHTML(formatarTelefoneVisual(cliente.whatsapp));
  const email = escaparHTML(cliente.email || "");
  const cidadeEstado = montarCidadeEstado(cliente);
  const cpfCnpj = escaparHTML(cliente.cpf_cnpj || "");
  const status = cliente.status || "ativo";
  const categoria = cliente.categoria || "normal";

  const textoContato = [
    whatsapp ? `WhatsApp: ${whatsapp}` : "",
    email ? `E-mail: ${email}` : "",
    cpfCnpj ? `CPF/CNPJ: ${cpfCnpj}` : ""
  ].filter(Boolean).join(" • ");

  return `
    <article class="cliente-item" data-cliente-id="${idSeguro}">
      <div class="cliente-linha-topo">
        <div class="cliente-info">
          <h3>${nome}</h3>
          <p>${textoContato || "Sem contato cadastrado"}</p>
          ${cidadeEstado ? `<p>${escaparHTML(cidadeEstado)}</p>` : ""}
          <p class="cliente-id-linha">
            <strong>ID:</strong> ${codigoCliente}
          </p>
        </div>
      </div>

      <div class="cliente-tags">
        <span class="tag ${escaparHTML(status)}">${formatarStatus(status)}</span>
        <span class="tag ${escaparHTML(categoria)}">${formatarCategoria(categoria)}</span>
        <span class="tag">${formatarTipoCliente(cliente.tipo_cliente)}</span>
      </div>

      ${
        cliente.observacoes
          ? `<p style="margin: 8px 0 0; color:#6d4c41; font-size:13px; line-height:1.5;">${escaparHTML(cliente.observacoes)}</p>`
          : ""
      }

      <div class="cliente-acoes">
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="editarCliente('${idSeguro}')">
          Editar
        </button>

        <button type="button" class="btn btn-secundario btn-pequeno" onclick="copiarIdCliente('${idSeguro}')">
          Copiar ID
        </button>

        <button type="button" class="btn btn-verde btn-pequeno" onclick="abrirWhatsAppCliente('${idSeguro}')">
          WhatsApp
        </button>

        <button type="button" class="btn btn-primario btn-pequeno" onclick="criarOrcamentoCliente('${idSeguro}')">
          Novo orçamento
        </button>

        <button type="button" class="btn btn-secundario btn-pequeno" onclick="criarOSCliente('${idSeguro}')">
          Nova OS
        </button>

        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirCliente('${idSeguro}')">
          Excluir
        </button>
      </div>
    </article>
  `;
}

/* =========================================================
   FILTROS E RESUMO
   ========================================================= */

function filtrarClientes() {
  const termo = normalizarTexto(valorInput("busca-clientes"));
  const termoId = normalizarTexto(valorInput("busca-id-cliente"));
  const status = valorInput("filtro-status-clientes");
  const categoria = valorInput("filtro-categoria-clientes");

  let listaFiltrada = [...clientesCache];

  if (termo) {
    listaFiltrada = listaFiltrada.filter((cliente) => {
      const textoBusca = normalizarTexto([
        obterCodigoClienteVisivel(cliente),
        cliente.nome,
        cliente.whatsapp,
        cliente.email,
        cliente.cpf_cnpj,
        cliente.cidade,
        cliente.estado,
        cliente.observacoes
      ].filter(Boolean).join(" "));

      return textoBusca.includes(termo);
    });
  }

  if (termoId) {
    listaFiltrada = listaFiltrada.filter((cliente) => {
      return clienteCombinaComCodigo(cliente, termoId) || normalizarTexto(cliente.id).includes(termoId);
    });
  }

  if (status) {
    listaFiltrada = listaFiltrada.filter((cliente) => cliente.status === status);
  }

  if (categoria) {
    listaFiltrada = listaFiltrada.filter((cliente) => cliente.categoria === categoria);
  }

  renderizarClientes(listaFiltrada);
}

function atualizarResumoClientes(lista) {
  const total = lista.length;
  const ativos = lista.filter((cliente) => cliente.status === "ativo").length;
  const preferenciais = lista.filter((cliente) => cliente.categoria === "preferencial").length;
  const inativos = lista.filter((cliente) => cliente.status === "inativo").length;

  setTexto("resumo-total-clientes", total);
  setTexto("resumo-clientes-ativos", ativos);
  setTexto("resumo-clientes-preferenciais", preferenciais);
  setTexto("resumo-clientes-inativos", inativos);
}

/* =========================================================
   AÇÕES: WHATSAPP / ORÇAMENTO / OS / COPIAR ID
   ========================================================= */

function abrirWhatsAppCliente(id) {
  const cliente = clientesCache.find((item) => item.id === id);

  if (!cliente) {
    alert("Cliente não encontrado.");
    return;
  }

  const telefone = limparTelefone(cliente.whatsapp);

  if (!telefone) {
    alert("Este cliente não possui WhatsApp cadastrado.");
    return;
  }

  const mensagem = `Olá, ${cliente.nome || "cliente"}! Tudo bem? Aqui é da FS Orçamentos.`;
  const numeroBrasil = telefone.startsWith("55") ? telefone : "55" + telefone;
  const url = `https://wa.me/${numeroBrasil}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

function criarOrcamentoCliente(id) {
  const cliente = clientesCache.find((item) => item.id === id);

  if (!cliente) {
    alert("Cliente não encontrado.");
    return;
  }

  window.location.href = `gerador.html?cliente_id=${encodeURIComponent(id)}`;
}

function criarOSCliente(id) {
  const cliente = clientesCache.find((item) => item.id === id);

  if (!cliente) {
    alert("Cliente não encontrado.");
    return;
  }

  window.location.href = `ordens.html?cliente_id=${encodeURIComponent(id)}`;
}

async function copiarIdCliente(id) {
  const cliente = clientesCache.find((item) => item.id === id);
  const codigo = cliente ? obterCodigoClienteVisivel(cliente) : id;

  if (!codigo) {
    alert("ID do cliente não encontrado.");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(codigo);
    } else {
      copiarTextoFallback(codigo);
    }

    mostrarMensagem(
      "mensagem-clientes-lista",
      "ID do cliente copiado com sucesso.",
      "sucesso"
    );
  } catch (erro) {
    console.error("Erro ao copiar ID:", erro);
    copiarTextoFallback(codigo);
    mostrarMensagem(
      "mensagem-clientes-lista",
      "ID do cliente copiado.",
      "sucesso"
    );
  }
}

function copiarTextoFallback(texto) {
  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

/* =========================================================
   FORMULÁRIO
   ========================================================= */

function limparFormularioCliente() {
  const form = document.getElementById("form-cliente");

  if (form) form.reset();

  setValor("cliente-id", "");
  setValor("cliente-tipo", "pessoa_fisica");
  setValor("cliente-status", "ativo");
  setValor("cliente-categoria", "normal");

  const titulo = document.getElementById("titulo-form-cliente");
  const btnSalvar = document.getElementById("btn-salvar-cliente");

  if (titulo) titulo.textContent = "Novo cliente";
  if (btnSalvar) btnSalvar.textContent = "Salvar cliente";

  limparMensagem("mensagem-clientes-form");
}

/* =========================================================
   HELPERS DE DOM
   ========================================================= */

function valorInput(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValor(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.value = valor || "";
}

function setTexto(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = valor;
}

function mostrarMensagem(id, texto, tipo = "info") {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = `mensagem-clientes ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagem(id);
    }, 4000);
  }
}

function limparMensagem(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = "mensagem-clientes";
  el.textContent = "";
}

function setLoadingClientes(ativo) {
  const loading = document.getElementById("loading-clientes");

  if (!loading) return;

  if (ativo) {
    loading.classList.add("ativo");
  } else {
    loading.classList.remove("ativo");
  }
}

function alterarEstadoBotao(botao, carregando, texto) {
  if (!botao) return;

  botao.disabled = carregando;
  botao.textContent = texto;
}

/* =========================================================
   HELPERS DE TEXTO
   ========================================================= */

function limparTexto(valor) {
  return String(valor || "").trim();
}

function limparTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHTML(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   FORMATADORES
   ========================================================= */

function formatarStatus(status) {
  const mapa = {
    ativo: "Ativo",
    inativo: "Inativo",
    inadimplente: "Inadimplente"
  };

  return mapa[status] || "Ativo";
}

function formatarCategoria(categoria) {
  const mapa = {
    normal: "Normal",
    preferencial: "Preferencial",
    empresa: "Empresa",
    recorrente: "Recorrente"
  };

  return mapa[categoria] || "Normal";
}

function formatarTipoCliente(tipo) {
  const mapa = {
    pessoa_fisica: "Pessoa física",
    pessoa_juridica: "Pessoa jurídica"
  };

  return mapa[tipo] || "Pessoa física";
}

function formatarTelefoneVisual(telefone) {
  const numero = limparTelefone(telefone);

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

function montarCidadeEstado(cliente) {
  const cidade = cliente.cidade || "";
  const estado = cliente.estado || "";

  if (cidade && estado) return `${cidade}/${estado}`;
  if (cidade) return cidade;
  if (estado) return estado;

  return "";
}

function alternarListaClientesMobile() {
  const lista = document.getElementById("lista-clientes");
  const botao = document.getElementById("btn-toggle-lista-clientes");

  if (!lista || !botao) return;

  const fechada = lista.classList.toggle("lista-clientes-mobile-fechada");

  botao.textContent = fechada ? "Ver clientes" : "Ocultar clientes";
}

window.alternarListaClientesMobile = alternarListaClientesMobile;

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   Necessário porque os botões são criados via innerHTML.
   ========================================================= */

window.carregarClientes = carregarClientes;
window.salvarCliente = salvarCliente;
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.filtrarClientes = filtrarClientes;
window.abrirWhatsAppCliente = abrirWhatsAppCliente;
window.criarOrcamentoCliente = criarOrcamentoCliente;
window.criarOSCliente = criarOSCliente;
window.copiarIdCliente = copiarIdCliente;
window.limparFormularioCliente = limparFormularioCliente;