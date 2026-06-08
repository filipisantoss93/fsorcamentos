/* =========================================================
   FS ORÇAMENTOS - recorrentes.js
   Serviços recorrentes / manutenção preventiva - Premium
   ========================================================= */

let recorrentesCache = [];
let clientesRecorrentesCache = [];
let veiculosRecorrentesCache = [];
let usuarioLogadoRecorrentes = null;

let fsRecorrentesInicializado = false;

async function iniciarRecorrentesPremium() {
  if (fsRecorrentesInicializado) return;
  fsRecorrentesInicializado = true;
  await inicializarRecorrentesPremium();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarRecorrentesPremium);
} else {
  iniciarRecorrentesPremium();
}

async function inicializarRecorrentesPremium() {
  try {
    garantirSupabaseRecorrentes();

    if (typeof bloquearPaginaSeNaoPremiumAsync === "function") {
      const bloqueado = await bloquearPaginaSeNaoPremiumAsync(
        "Serviços recorrentes e manutenção preventiva fazem parte do Plano Premium."
      );
      if (bloqueado) return;
    }

    const session = await obterSessaoAtualRecorrentes();

    if (!session) {
      redirecionarParaLoginRecorrentes();
      return;
    }

    usuarioLogadoRecorrentes = session.user;

    configurarEventosRecorrentes();

    await carregarClientesRecorrentes();
    await carregarVeiculosRecorrentes();
    await carregarRecorrentes();
  } catch (erro) {
    console.error("Erro ao iniciar recorrentes:", erro);
    mostrarMensagemRecorrentes("Erro ao iniciar serviços recorrentes.", "erro");
  }
}

function garantirSupabaseRecorrentes() {
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

async function obterSessaoAtualRecorrentes() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data?.session || null;
}

function redirecionarParaLoginRecorrentes() {
  const destino = encodeURIComponent("recorrentes.html");
  window.location.href = "index.html?redirect=" + destino;
}

function configurarEventosRecorrentes() {
  const form = document.getElementById("form-recorrente");
  const btnLimpar = document.getElementById("btn-limpar-recorrente");
  const btnAtualizar = document.getElementById("btn-atualizar-recorrentes");
  const selectCliente = document.getElementById("recorrente-cliente-id");
  const campoBuscaClienteModal = document.getElementById("campo-busca-cliente-recorrentes");
  const ultimoServico = document.getElementById("recorrente-ultimo-servico");
  const intervaloMeses = document.getElementById("recorrente-intervalo-meses");
  const kmAtual = document.getElementById("recorrente-km-atual");
  const intervaloKm = document.getElementById("recorrente-intervalo-km");

  const busca = document.getElementById("busca-recorrentes");
  const filtroStatus = document.getElementById("filtro-status-recorrentes");

  if (form) form.addEventListener("submit", salvarRecorrente);

  if (btnLimpar) btnLimpar.addEventListener("click", limparFormularioRecorrente);

  if (btnAtualizar) btnAtualizar.addEventListener("click", carregarRecorrentes);

  if (selectCliente) {
    selectCliente.addEventListener("change", () => {
      renderizarSelectVeiculosRecorrentes(selectCliente.value);
      atualizarClienteSelecionadoRecorrentes(selectCliente.value);
    });
  }

  if (campoBuscaClienteModal) {
    campoBuscaClienteModal.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buscarClientesModalRecorrentes();
      }
    });
  }

  if (ultimoServico) ultimoServico.addEventListener("change", calcularProximaDataRecorrente);
  if (intervaloMeses) intervaloMeses.addEventListener("input", calcularProximaDataRecorrente);
  if (kmAtual) kmAtual.addEventListener("input", calcularProximoKmRecorrente);
  if (intervaloKm) intervaloKm.addEventListener("input", calcularProximoKmRecorrente);

  if (busca) busca.addEventListener("input", filtrarRecorrentes);
  if (filtroStatus) filtroStatus.addEventListener("change", filtrarRecorrentes);
}

async function carregarClientesRecorrentes() {
  const { data, error } = await window._supabase
    .from("clientes")
    .select("id, numero_cliente, nome, whatsapp, email, endereco, cidade, estado, cep")
    .eq("user_id", usuarioLogadoRecorrentes.id)
    .order("nome", { ascending: true });

  if (error) {
    console.warn("Erro ao carregar clientes:", error);
    clientesRecorrentesCache = [];
    renderizarSelectClientesRecorrentes();
    return;
  }

  clientesRecorrentesCache = Array.isArray(data) ? data : [];
  renderizarSelectClientesRecorrentes();
}

async function carregarVeiculosRecorrentes() {
  let { data, error } = await window._supabase
    .from("veiculos_com_clientes")
    .select("id, cliente_id, placa, marca, modelo, cor, ano, prisma, cliente_nome")
    .eq("user_id", usuarioLogadoRecorrentes.id)
    .eq("ativo", true)
    .order("placa", { ascending: true });

  if (error) {
    const fallback = await window._supabase
      .from("veiculos")
      .select("id, cliente_id, placa, marca, modelo, cor, ano, prisma")
      .eq("user_id", usuarioLogadoRecorrentes.id)
      .eq("ativo", true)
      .order("placa", { ascending: true });

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.warn("Erro ao carregar veículos:", error);
    veiculosRecorrentesCache = [];
    return;
  }

  veiculosRecorrentesCache = Array.isArray(data) ? data : [];
}

function renderizarSelectClientesRecorrentes() {
  atualizarClienteSelecionadoRecorrentes(valorInputRecorrentes("recorrente-cliente-id"));
}

function atualizarClienteSelecionadoRecorrentes(clienteId) {
  const card = document.getElementById("recorrente-cliente-selecionado");
  if (!card) return;

  const cliente = clientesRecorrentesCache.find((item) => String(item.id) === String(clienteId || ""));

  if (!cliente) {
    card.innerHTML = "Nenhum cliente selecionado";
    return;
  }

  const numero = formatarNumeroClienteRecorrentes(cliente.numero_cliente);
  const linhas = [
    numero ? `ID: ${numero}` : "",
    cliente.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : "",
    cliente.email ? `E-mail: ${cliente.email}` : ""
  ].filter(Boolean).join(" • ");

  card.innerHTML = `<strong>${escaparHtmlRecorrentes(cliente.nome || "Cliente sem nome")}</strong>${linhas ? `<br><span>${escaparHtmlRecorrentes(linhas)}</span>` : ""}`;
}

function abrirModalBuscaClienteRecorrentes() {
  const modal = document.getElementById("modal-busca-cliente-recorrentes");
  const campo = document.getElementById("campo-busca-cliente-recorrentes");
  const resultado = document.getElementById("resultado-busca-clientes-recorrentes");
  if (resultado) resultado.innerHTML = `<div class="estado-vazio" style="min-height:auto;">Digite pelo menos 2 caracteres e clique em Buscar.</div>`;
  if (campo) campo.value = "";
  if (modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => campo?.focus(), 80);
  }
}

function fecharModalBuscaClienteRecorrentes() {
  const modal = document.getElementById("modal-busca-cliente-recorrentes");
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
}

function buscarClientesModalRecorrentes() {
  const campo = document.getElementById("campo-busca-cliente-recorrentes");
  const resultado = document.getElementById("resultado-busca-clientes-recorrentes");
  if (!resultado) return;

  const termo = normalizarTextoRecorrentes(campo?.value || "");
  if (termo.length < 2) {
    resultado.innerHTML = `<div class="estado-vazio" style="min-height:auto;">Digite pelo menos 2 caracteres para buscar cliente.</div>`;
    return;
  }

  const encontrados = clientesRecorrentesCache.filter((cliente) => {
    const texto = normalizarTextoRecorrentes([
      cliente.nome,
      cliente.numero_cliente,
      cliente.whatsapp,
      cliente.email,
      cliente.endereco,
      cliente.cidade
    ].filter(Boolean).join(" "));
    return texto.includes(termo);
  }).slice(0, 30);

  if (!encontrados.length) {
    resultado.innerHTML = `<div class="estado-vazio" style="min-height:auto;">Nenhum cliente encontrado. Cadastre um novo cliente se necessário.</div>`;
    return;
  }

  resultado.innerHTML = encontrados.map((cliente) => {
    const id = escaparHtmlAtributoRecorrentes(cliente.id);
    const numero = formatarNumeroClienteRecorrentes(cliente.numero_cliente);
    const resumo = [numero ? `ID: ${numero}` : "", cliente.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : "", cliente.email ? `E-mail: ${cliente.email}` : ""].filter(Boolean).join(" • ");
    return `<button type="button" class="cliente-item" style="width:100%;text-align:left;margin-bottom:8px;cursor:pointer;" onclick="selecionarClienteModalRecorrentes('${id}')"><strong>${escaparHtmlRecorrentes(cliente.nome || "Cliente sem nome")}</strong><span>${escaparHtmlRecorrentes(resumo)}</span></button>`;
  }).join("");
}

function selecionarClienteModalRecorrentes(clienteId) {
  setValorRecorrentes("recorrente-cliente-id", clienteId || "");
  atualizarClienteSelecionadoRecorrentes(clienteId || "");
  renderizarSelectVeiculosRecorrentes(clienteId || "");
  fecharModalBuscaClienteRecorrentes();
}

function renderizarSelectVeiculosRecorrentes(clienteId, selecionado = "") {
  const select = document.getElementById("recorrente-veiculo-id");

  if (!select) return;

  if (!clienteId) {
    select.innerHTML = `<option value="">Selecione um cliente primeiro</option>`;
    return;
  }

  const veiculos = veiculosRecorrentesCache.filter((veiculo) => {
    return String(veiculo.cliente_id || "") === String(clienteId || "");
  });

  if (!veiculos.length) {
    select.innerHTML = `<option value="">Nenhum veículo deste cliente</option>`;
    return;
  }

  const opcoes = veiculos.map((veiculo) => {
    return `<option value="${escaparHtmlAtributoRecorrentes(veiculo.id)}">${escaparHtmlRecorrentes(formatarVeiculoRecorrentes(veiculo))}</option>`;
  }).join("");

  select.innerHTML = `<option value="">Selecione</option>${opcoes}`;

  if (selecionado) select.value = selecionado;
}

async function carregarRecorrentes() {
  try {
    limparMensagemRecorrentes();

    const { data, error } = await window._supabase
      .from("servicos_recorrentes")
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
          ano,
          prisma
        )
      `)
      .eq("user_id", usuarioLogadoRecorrentes.id)
      .order("proxima_data", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar recorrentes:", error);
      mostrarMensagemRecorrentes("Não foi possível carregar serviços recorrentes. Rode o SQL da etapa 4 no Supabase.", "erro");
      recorrentesCache = [];
      renderizarRecorrentes([]);
      atualizarResumoRecorrentes([]);
      return;
    }

    recorrentesCache = Array.isArray(data) ? data : [];
    atualizarResumoRecorrentes(recorrentesCache);
    renderizarRecorrentes(recorrentesCache);
  } catch (erro) {
    console.error("Erro inesperado ao carregar recorrentes:", erro);
    mostrarMensagemRecorrentes("Erro inesperado ao carregar serviços recorrentes.", "erro");
  }
}

async function salvarRecorrente(event) {
  event.preventDefault();

  try {
    limparMensagemRecorrentes();

    const dados = montarObjetoRecorrente();

    if (!dados.titulo) {
      mostrarMensagemRecorrentes("Informe o título do serviço recorrente.", "erro");
      return;
    }

    const id = valorInputRecorrentes("recorrente-id");
    const btn = document.getElementById("btn-salvar-recorrente");

    alterarBotaoRecorrentes(btn, true, id ? "Atualizando..." : "Salvando...");

    let resultado;

    if (id) {
      resultado = await window._supabase
        .from("servicos_recorrentes")
        .update(dados)
        .eq("id", id)
        .eq("user_id", usuarioLogadoRecorrentes.id)
        .select()
        .single();
    } else {
      resultado = await window._supabase
        .from("servicos_recorrentes")
        .insert({
          ...dados,
          user_id: usuarioLogadoRecorrentes.id
        })
        .select()
        .single();
    }

    if (resultado.error) {
      console.error("Erro ao salvar recorrente:", resultado.error);
      mostrarMensagemRecorrentes("Erro ao salvar serviço recorrente. Confira se o SQL foi executado.", "erro");
      return;
    }

    mostrarMensagemRecorrentes(id ? "Serviço recorrente atualizado com sucesso." : "Serviço recorrente cadastrado com sucesso.", "sucesso");

    limparFormularioRecorrente();
    await carregarRecorrentes();
  } catch (erro) {
    console.error("Erro inesperado ao salvar recorrente:", erro);
    mostrarMensagemRecorrentes("Erro inesperado ao salvar serviço recorrente.", "erro");
  } finally {
    const btn = document.getElementById("btn-salvar-recorrente");
    alterarBotaoRecorrentes(btn, false, valorInputRecorrentes("recorrente-id") ? "Atualizar recorrência" : "Salvar recorrência");
  }
}

function montarObjetoRecorrente() {
  const clienteId = valorInputRecorrentes("recorrente-cliente-id");
  const veiculoId = valorInputRecorrentes("recorrente-veiculo-id");

  const intervaloMeses = inteiroRecorrentes("recorrente-intervalo-meses");
  const intervaloKm = inteiroRecorrentes("recorrente-intervalo-km");
  const kmAtual = inteiroRecorrentes("recorrente-km-atual");

  return {
    cliente_id: clienteId || null,
    veiculo_id: veiculoId || null,
    titulo: valorInputRecorrentes("recorrente-titulo"),
    tipo_servico: valorInputRecorrentes("recorrente-tipo-servico"),
    status: valorInputRecorrentes("recorrente-status") || "ativo",
    data_ultimo_servico: valorInputRecorrentes("recorrente-ultimo-servico") || null,
    proxima_data: valorInputRecorrentes("recorrente-proxima-data") || null,
    intervalo_meses: intervaloMeses || null,
    intervalo_km: intervaloKm || null,
    km_atual: kmAtual || null,
    proximo_km: inteiroRecorrentes("recorrente-proximo-km") || null,
    observacoes: valorInputRecorrentes("recorrente-observacoes")
  };
}

function editarRecorrente(id) {
  const item = recorrentesCache.find((recorrente) => recorrente.id === id);

  if (!item) {
    mostrarMensagemRecorrentes("Serviço recorrente não encontrado.", "erro");
    return;
  }

  setValorRecorrentes("recorrente-id", item.id);
  setValorRecorrentes("recorrente-titulo", item.titulo);
  setValorRecorrentes("recorrente-cliente-id", item.cliente_id || "");
  atualizarClienteSelecionadoRecorrentes(item.cliente_id || "");
  renderizarSelectVeiculosRecorrentes(item.cliente_id || "", item.veiculo_id || "");
  setValorRecorrentes("recorrente-veiculo-id", item.veiculo_id || "");
  setValorRecorrentes("recorrente-tipo-servico", item.tipo_servico);
  setValorRecorrentes("recorrente-status", item.status || "ativo");
  setValorRecorrentes("recorrente-ultimo-servico", dataInputRecorrentes(item.data_ultimo_servico));
  setValorRecorrentes("recorrente-proxima-data", dataInputRecorrentes(item.proxima_data));
  setValorRecorrentes("recorrente-intervalo-meses", item.intervalo_meses || "");
  setValorRecorrentes("recorrente-intervalo-km", item.intervalo_km || "");
  setValorRecorrentes("recorrente-km-atual", item.km_atual || "");
  setValorRecorrentes("recorrente-proximo-km", item.proximo_km || "");
  setValorRecorrentes("recorrente-observacoes", item.observacoes);

  setTextoRecorrentes("titulo-form-recorrente", "Editar serviço recorrente");

  const btn = document.getElementById("btn-salvar-recorrente");
  if (btn) btn.textContent = "Atualizar recorrência";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirRecorrente(id) {
  const item = recorrentesCache.find((recorrente) => recorrente.id === id);

  if (!item) return;

  const confirmar = confirm(`Deseja excluir "${item.titulo}"?`);

  if (!confirmar) return;

  const { error } = await window._supabase
    .from("servicos_recorrentes")
    .delete()
    .eq("id", id)
    .eq("user_id", usuarioLogadoRecorrentes.id);

  if (error) {
    console.error("Erro ao excluir recorrente:", error);
    mostrarMensagemRecorrentes("Erro ao excluir serviço recorrente.", "erro");
    return;
  }

  mostrarMensagemRecorrentes("Serviço recorrente excluído com sucesso.", "sucesso");
  await carregarRecorrentes();
}

function limparFormularioRecorrente() {
  const form = document.getElementById("form-recorrente");
  if (form) form.reset();

  setValorRecorrentes("recorrente-id", "");
  setValorRecorrentes("recorrente-status", "ativo");
  atualizarClienteSelecionadoRecorrentes("");
  renderizarSelectVeiculosRecorrentes("");
  setTextoRecorrentes("titulo-form-recorrente", "Novo serviço recorrente");

  const btn = document.getElementById("btn-salvar-recorrente");
  if (btn) btn.textContent = "Salvar recorrência";
}

function calcularProximaDataRecorrente() {
  const dataUltimo = valorInputRecorrentes("recorrente-ultimo-servico");
  const meses = inteiroRecorrentes("recorrente-intervalo-meses");

  if (!dataUltimo || !meses) return;

  const data = new Date(`${dataUltimo}T00:00:00`);

  if (isNaN(data.getTime())) return;

  data.setMonth(data.getMonth() + meses);

  setValorRecorrentes("recorrente-proxima-data", dataInputRecorrentes(data));
}

function calcularProximoKmRecorrente() {
  const kmAtual = inteiroRecorrentes("recorrente-km-atual");
  const intervalo = inteiroRecorrentes("recorrente-intervalo-km");

  if (!kmAtual || !intervalo) return;

  setValorRecorrentes("recorrente-proximo-km", kmAtual + intervalo);
}

function filtrarRecorrentes() {
  const termo = normalizarTextoRecorrentes(valorInputRecorrentes("busca-recorrentes"));
  const status = valorInputRecorrentes("filtro-status-recorrentes");

  let lista = [...recorrentesCache];

  if (termo) {
    lista = lista.filter((item) => {
      const texto = normalizarTextoRecorrentes([
        item.titulo,
        item.tipo_servico,
        item.status,
        item.observacoes,
        item.clientes?.nome,
        formatarNumeroClienteRecorrentes(item.clientes?.numero_cliente),
        item.clientes?.whatsapp,
        item.veiculos?.placa,
        item.veiculos?.marca,
        item.veiculos?.modelo,
        item.veiculos?.cor,
        item.veiculos?.prisma
      ].filter(Boolean).join(" "));

      return texto.includes(termo);
    });
  }

  if (status) {
    if (status === "vencido") {
      lista = lista.filter((item) => classificarRecorrente(item).classe === "vencido");
    } else if (status === "proximo") {
      lista = lista.filter((item) => {
        const info = classificarRecorrente(item);
        return ["hoje", "proximo"].includes(info.classe);
      });
    } else {
      lista = lista.filter((item) => item.status === status);
    }
  }

  atualizarResumoRecorrentes(lista);
  renderizarRecorrentes(lista);
}

function atualizarResumoRecorrentes(lista) {
  const vencidos = lista.filter((item) => classificarRecorrente(item).classe === "vencido").length;
  const hoje = lista.filter((item) => classificarRecorrente(item).classe === "hoje").length;
  const proximos7 = lista.filter((item) => {
    const dias = diasAteDataRecorrentes(item.proxima_data);
    return dias !== null && dias >= 0 && dias <= 7;
  }).length;
  const proximos30 = lista.filter((item) => {
    const dias = diasAteDataRecorrentes(item.proxima_data);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;

  setTextoRecorrentes("resumo-recorrentes-vencidos", vencidos);
  setTextoRecorrentes("resumo-recorrentes-hoje", hoje);
  setTextoRecorrentes("resumo-recorrentes-7", proximos7);
  setTextoRecorrentes("resumo-recorrentes-30", proximos30);
}

function renderizarRecorrentes(lista) {
  const container = document.getElementById("lista-recorrentes");

  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `
      <div class="estado-vazio">
        Nenhum serviço recorrente encontrado.
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map(criarCardRecorrente).join("");
}

function criarCardRecorrente(item) {
  const info = classificarRecorrente(item);
  const cliente = item.clientes?.nome || "Sem cliente vinculado";
  const clienteNumero = formatarNumeroClienteRecorrentes(item.clientes?.numero_cliente);
  const veiculo = item.veiculos ? formatarVeiculoRecorrentes(item.veiculos) : "Sem veículo vinculado";

  return `
    <article class="recorrente-item">
      <div class="recorrente-topo">
        <div>
          <h3>${escaparHtmlRecorrentes(item.titulo || "Serviço recorrente")}</h3>
          <p>${escaparHtmlRecorrentes([clienteNumero, cliente, veiculo].filter(Boolean).join(" • "))}</p>
        </div>
        <span class="tag ${escaparHtmlAtributoRecorrentes(info.classe)}">${escaparHtmlRecorrentes(info.label)}</span>
      </div>

      <div class="recorrente-detalhes">
        <div>
          <small>Tipo</small>
          <strong>${escaparHtmlRecorrentes(item.tipo_servico || "-")}</strong>
        </div>
        <div>
          <small>Último serviço</small>
          <strong>${formatarDataRecorrentes(item.data_ultimo_servico)}</strong>
        </div>
        <div>
          <small>Próxima data</small>
          <strong>${formatarDataRecorrentes(item.proxima_data)}</strong>
        </div>
        <div>
          <small>Km atual</small>
          <strong>${item.km_atual ? formatarNumeroRecorrentes(item.km_atual) + " km" : "-"}</strong>
        </div>
        <div>
          <small>Próximo km</small>
          <strong>${item.proximo_km ? formatarNumeroRecorrentes(item.proximo_km) + " km" : "-"}</strong>
        </div>
        <div>
          <small>Status</small>
          <strong>${formatarStatusRecorrentes(item.status)}</strong>
        </div>
      </div>

      ${
        item.observacoes
          ? `<p style="margin:8px 0 0;color:#6d5b52;font-size:13px;line-height:1.45;font-weight:700;">${escaparHtmlRecorrentes(item.observacoes)}</p>`
          : ""
      }

      <div class="item-acoes">
        <button type="button" class="btn btn-secundario" onclick="editarRecorrente('${escaparHtmlAtributoRecorrentes(item.id)}')">Editar</button>
        <button type="button" class="btn btn-perigo" onclick="excluirRecorrente('${escaparHtmlAtributoRecorrentes(item.id)}')">Excluir</button>
      </div>
    </article>
  `;
}

function classificarRecorrente(item) {
  if (item.status && item.status !== "ativo") {
    return {
      classe: "ok",
      label: formatarStatusRecorrentes(item.status)
    };
  }

  const dias = diasAteDataRecorrentes(item.proxima_data);

  if (dias === null) {
    return { classe: "ok", label: "Sem data" };
  }

  if (dias < 0) {
    return { classe: "vencido", label: `Vencido há ${Math.abs(dias)} dia(s)` };
  }

  if (dias === 0) {
    return { classe: "hoje", label: "Vence hoje" };
  }

  if (dias <= 30) {
    return { classe: "proximo", label: `Faltam ${dias} dia(s)` };
  }

  return { classe: "ok", label: `Em ${dias} dia(s)` };
}

function diasAteDataRecorrentes(valor) {
  if (!valor) return null;

  const hoje = new Date();
  const data = new Date(`${String(valor).substring(0, 10)}T00:00:00`);

  if (isNaN(data.getTime())) return null;

  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);

  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function formatarStatusRecorrentes(status) {
  const mapa = {
    ativo: "Ativo",
    pausado: "Pausado",
    concluido: "Concluído",
    cancelado: "Cancelado"
  };

  return mapa[status] || status || "Ativo";
}

function formatarVeiculoRecorrentes(veiculo) {
  if (!veiculo) return "";

  const placa = veiculo.placa ? String(veiculo.placa).toUpperCase() : "Sem placa";
  const modelo = [veiculo.marca, veiculo.modelo].filter(Boolean).join(" ");
  const cor = veiculo.cor ? ` - ${veiculo.cor}` : "";
  const ano = veiculo.ano ? ` - ${veiculo.ano}` : "";

  return `${placa}${modelo ? ` - ${modelo}` : ""}${cor}${ano}`;
}

function formatarNumeroClienteRecorrentes(numero) {
  if (!numero && numero !== 0) return "";
  const valor = Number(numero);
  if (Number.isFinite(valor)) return `CLI-${String(valor).padStart(6, "0")}`;
  return String(numero);
}

function valorInputRecorrentes(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorRecorrentes(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor ?? "";
}

function setTextoRecorrentes(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function inteiroRecorrentes(id) {
  const valor = parseInt(valorInputRecorrentes(id), 10);
  return Number.isFinite(valor) ? valor : 0;
}

function mostrarMensagemRecorrentes(texto, tipo = "info") {
  const el = document.getElementById("mensagem-recorrentes");
  if (!el) return;
  el.className = `mensagem ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => limparMensagemRecorrentes(), 4000);
  }
}

function limparMensagemRecorrentes() {
  const el = document.getElementById("mensagem-recorrentes");
  if (!el) return;
  el.className = "mensagem";
  el.textContent = "";
}

function alterarBotaoRecorrentes(botao, carregando, texto) {
  if (!botao) return;
  botao.disabled = carregando;
  botao.textContent = texto;
}

function dataInputRecorrentes(valor) {
  if (!valor) return "";

  if (valor instanceof Date) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  return String(valor).substring(0, 10);
}

function formatarDataRecorrentes(valor) {
  if (!valor) return "-";

  const partes = String(valor).substring(0, 10).split("-");

  if (partes.length !== 3) return "-";

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarNumeroRecorrentes(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}

function normalizarTextoRecorrentes(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHtmlRecorrentes(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparHtmlAtributoRecorrentes(valor) {
  return escaparHtmlRecorrentes(valor).replaceAll("`", "&#096;");
}

window.carregarRecorrentes = carregarRecorrentes;
window.editarRecorrente = editarRecorrente;
window.excluirRecorrente = excluirRecorrente;

window.abrirModalBuscaClienteRecorrentes = abrirModalBuscaClienteRecorrentes;
window.fecharModalBuscaClienteRecorrentes = fecharModalBuscaClienteRecorrentes;
window.buscarClientesModalRecorrentes = buscarClientesModalRecorrentes;
window.selecionarClienteModalRecorrentes = selecionarClienteModalRecorrentes;
