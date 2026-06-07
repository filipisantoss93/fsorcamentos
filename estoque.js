/* =========================================================
   FS ORÇAMENTOS - estoque.js
   Controle de Estoque / Premium em desenvolvimento
   Corrigido: números + funções auxiliares + formulário mobile
   ========================================================= */

let produtosEstoqueCache = [];
let usuarioLogadoEstoque = null;
let catalogoMarcasEstoqueCache = [];
let catalogoModelosEstoqueCache = [];
let catalogoMarcaSelecionadaEstoqueId = null;

let paginaProdutosEstoque = 0;
let limiteProdutosEstoque = 20;
let temMaisProdutosEstoque = false;
let filtrosAtuaisEstoque = {
  termo: "",
  status: "",
  estoque: "",
  categoria: "",
  subcategoria: ""
};

let fsEstoqueInicializado = false;

const SUBCATEGORIAS_OFICINA_POR_CATEGORIA = {
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


async function iniciarEstoqueInicializado() {
  if (fsEstoqueInicializado) return;
  fsEstoqueInicializado = true;
  await inicializarModuloEstoque();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarEstoqueInicializado);
} else {
  iniciarEstoqueInicializado();
}
/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarModuloEstoque() {
  try {
    garantirSupabaseEstoque();

    const session = await obterSessaoAtualEstoque();

    if (!session) {
      redirecionarParaLoginEstoque();
      return;
    }

    usuarioLogadoEstoque = session.user;

    configurarEventosEstoque();
    prepararListaProdutosEstoqueVazia();

    
  } catch (erro) {
    console.error("Erro ao inicializar estoque.js:", erro);
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Erro ao iniciar o controle de estoque. Verifique sua conexão e tente novamente.",
      "erro"
    );
  }
}

function garantirSupabaseEstoque() {
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

async function obterSessaoAtualEstoque() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }

  return data && data.session ? data.session : null;
}

function redirecionarParaLoginEstoque() {
  const destino = encodeURIComponent("estoque.html");
  window.location.href = "index.html?redirect=" + destino;
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventosEstoque() {
  const formProduto = document.getElementById("form-produto-estoque");
  const btnLimpar = document.getElementById("btn-limpar-produto");
  const btnAtualizar = document.getElementById("btn-atualizar-estoque");
  const btnCarregarMais = document.getElementById("btn-carregar-mais-produtos");

  const busca = document.getElementById("busca-produtos");
  const filtroStatus = document.getElementById("filtro-status-produtos");
  const filtroEstoque = document.getElementById("filtro-estoque-produtos");
  const filtroCategoria = document.getElementById("filtro-categoria-produtos");
  const filtroSubcategoria = document.getElementById("filtro-subcategoria-produtos");
  const categoriaProduto = document.getElementById("produto-categoria");
  const categoriaOutra = document.getElementById("produto-categoria-outra");
  const campoBuscaMarcaModal = document.getElementById("campo-busca-marca-estoque");
  const campoBuscaModeloModal = document.getElementById("campo-busca-modelo-estoque");
  const inputMarcaVeiculo = document.getElementById("produto-marca-veiculo");

  const formMovimentacao = document.getElementById("form-movimentacao-estoque");
  const btnFecharModal = document.getElementById("btn-fechar-modal-estoque");
  const btnCancelarModal = document.getElementById("btn-cancelar-modal-estoque");

  if (formProduto) {
    formProduto.addEventListener("submit", salvarProdutoEstoque);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFormularioProdutoEstoque);
  }

if (btnAtualizar) {
  btnAtualizar.textContent = "Buscar";
  btnAtualizar.addEventListener("click", () => carregarProdutosEstoque(true));
}

if (btnCarregarMais) {
  btnCarregarMais.addEventListener("click", carregarMaisProdutosEstoque);
}

  if (busca) {
    busca.addEventListener("input", filtrarProdutosEstoque);
    busca.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); carregarProdutosEstoque(true); } });
  }

  if (filtroStatus) {
    filtroStatus.addEventListener("change", filtrarProdutosEstoque);
  }

  if (filtroEstoque) {
    filtroEstoque.addEventListener("change", filtrarProdutosEstoque);
  }

if (filtroCategoria) {
  filtroCategoria.addEventListener("change", () => {
    atualizarSubcategoriasFiltroEstoque(true);
    filtrarProdutosEstoque();
  });
}

if (filtroSubcategoria) {
  filtroSubcategoria.addEventListener("change", filtrarProdutosEstoque);
}

atualizarSubcategoriasFiltroEstoque(false);

if (categoriaProduto) {
  categoriaProduto.addEventListener("change", controlarCampoOutraCategoriaEstoque);
}

if (categoriaOutra) {
  categoriaOutra.addEventListener("input", () => {
    if (valorInputEstoque("produto-categoria") === "__outra__") {
      // Apenas mantém o campo ativo para salvar a categoria digitada
    }
  });
}

if (campoBuscaMarcaModal) {
  campoBuscaMarcaModal.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      buscarCatalogoMarcasEstoque();
    }
  });
}

if (campoBuscaModeloModal) {
  campoBuscaModeloModal.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      buscarCatalogoModelosEstoque();
    }
  });
}

if (inputMarcaVeiculo) {
  inputMarcaVeiculo.addEventListener("input", () => {
    catalogoMarcaSelecionadaEstoqueId = null;
    setValorEstoque("produto-modelo-veiculo", "");
  });
}

  if (formMovimentacao) {
    formMovimentacao.addEventListener("submit", confirmarMovimentacaoEstoque);
  }

  if (btnFecharModal) {
    btnFecharModal.addEventListener("click", fecharModalMovimentacaoEstoque);
  }

  if (btnCancelarModal) {
    btnCancelarModal.addEventListener("click", fecharModalMovimentacaoEstoque);
  }

  const modal = document.getElementById("modal-movimentacao-estoque");

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        fecharModalMovimentacaoEstoque();
      }
    });
  }

  configurarFormularioMobileEstoque();
}

/* =========================================================
   FORMULÁRIO MOBILE MINIMIZÁVEL
   ========================================================= */

function configurarFormularioMobileEstoque() {
  const card = document.getElementById("card-form-produto");
  const botao = document.getElementById("btn-toggle-form-produto");

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

function abrirFormularioMobileProduto() {
  const card = document.getElementById("card-form-produto");
  const botao = document.getElementById("btn-toggle-form-produto");

  if (!card || !botao) return;

  card.classList.remove("form-fechado");

  if (window.innerWidth <= 700) {
    botao.textContent = "Fechar";
  }
}

/* =========================================================
   CRUD PRODUTOS
   ========================================================= */


function prepararListaProdutosEstoqueVazia() {
  const container = document.getElementById("lista-produtos-estoque") || document.getElementById("lista-estoque") || document.getElementById("tabela-produtos-estoque");
  if (!container) return;
  container.innerHTML = `
    <div class="estado-vazio">
      <strong>Nenhum produto carregado</strong>
      <p>Use os filtros e clique em Buscar. A página carrega no máximo 20 produtos por vez.</p>
    </div>
  `;
  atualizarBotaoCarregarMaisProdutos();
}

async function carregarProdutosEstoque(resetar = true) {
  try {
    setLoadingEstoque(true);
    limparMensagemEstoque("mensagem-estoque-lista");

    if (resetar) {
      paginaProdutosEstoque = 0;
      produtosEstoqueCache = [];
    }

    if (!usuarioLogadoEstoque || !usuarioLogadoEstoque.id) {
      const session = await obterSessaoAtualEstoque();

      if (!session) {
        redirecionarParaLoginEstoque();
        return;
      }

      usuarioLogadoEstoque = session.user;
    }

    atualizarFiltrosAtuaisEstoque();

    const inicio = paginaProdutosEstoque * limiteProdutosEstoque;
    const fim = inicio + limiteProdutosEstoque - 1;

    let query = window._supabase
      .from("produtos_estoque")
      .select("*")
      .eq("user_id", usuarioLogadoEstoque.id)
      .order("categoria", { ascending: true })
      .order("nome", { ascending: true })
      .range(inicio, fim);

    if (filtrosAtuaisEstoque.termo) {
      const termo = `%${filtrosAtuaisEstoque.termo}%`;

      query = query.or(
        `nome.ilike.${termo},codigo.ilike.${termo},categoria.ilike.${termo},subcategoria.ilike.${termo},marca_veiculo.ilike.${termo},modelo_veiculo.ilike.${termo},versao_veiculo.ilike.${termo},motor_veiculo.ilike.${termo},codigo_original.ilike.${termo},codigo_fabricante.ilike.${termo},aplicacao.ilike.${termo},descricao.ilike.${termo},observacoes.ilike.${termo},unidade.ilike.${termo}`
      );
    }

    if (filtrosAtuaisEstoque.status === "ativo") {
      query = query.eq("ativo", true);
    }

if (filtrosAtuaisEstoque.status === "inativo") {
  query = query.eq("ativo", false);
}

if (filtrosAtuaisEstoque.categoria) {
  if (filtrosAtuaisEstoque.categoria === "Sem categoria") {
    query = query.or("categoria.is.null,categoria.eq.");
  } else {
    query = query.eq("categoria", filtrosAtuaisEstoque.categoria);
  }
}

if (filtrosAtuaisEstoque.subcategoria) {
  if (filtrosAtuaisEstoque.subcategoria === "Sem subcategoria") {
    query = query.or("subcategoria.is.null,subcategoria.eq.");
  } else {
    query = query.eq("subcategoria", filtrosAtuaisEstoque.subcategoria);
  }
}

if (filtrosAtuaisEstoque.estoque === "sem_controle") {
  query = query.eq("controlar_estoque", false);
}

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      mostrarMensagemEstoque(
        "mensagem-estoque-lista",
        "Não foi possível carregar os produtos. Verifique se a tabela produtos_estoque foi criada e se as colunas categoria/subcategoria existem no Supabase.",
        "erro"
      );
      return;
    }

    let novosProdutos = Array.isArray(data) ? data : [];

    if (filtrosAtuaisEstoque.estoque === "baixo") {
      novosProdutos = novosProdutos.filter((produto) => produtoEstoqueBaixo(produto));
    }

    if (filtrosAtuaisEstoque.estoque === "normal") {
      novosProdutos = novosProdutos.filter((produto) => {
        return produto.controlar_estoque !== false && !produtoEstoqueBaixo(produto);
      });
    }

    if (resetar) {
      produtosEstoqueCache = novosProdutos;
    } else {
      produtosEstoqueCache = [...produtosEstoqueCache, ...novosProdutos];
    }

    temMaisProdutosEstoque = Array.isArray(data) && data.length === limiteProdutosEstoque;

    atualizarResumoEstoque(produtosEstoqueCache);
    renderizarProdutosEstoque(produtosEstoqueCache);
    atualizarBotaoCarregarMaisProdutos();

  } catch (erro) {
    console.error("Erro inesperado ao carregar estoque:", erro);
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Erro inesperado ao carregar produtos do estoque.",
      "erro"
    );
  } finally {
    setLoadingEstoque(false);
  }
}

async function salvarProdutoEstoque(event) {
  event.preventDefault();

  try {
    limparMensagemEstoque("mensagem-estoque-form");

    const session = await obterSessaoAtualEstoque();

    if (!session) {
      redirecionarParaLoginEstoque();
      return;
    }

    usuarioLogadoEstoque = session.user;

    const produto = montarObjetoProdutoEstoque();

    if (!produto.nome) {
      mostrarMensagemEstoque(
        "mensagem-estoque-form",
        "Informe o nome do produto.",
        "erro"
      );
      return;
    }

    const btnSalvar = document.getElementById("btn-salvar-produto");
    alterarEstadoBotaoEstoque(btnSalvar, true, "Salvando...");

    const produtoId = valorInputEstoque("produto-id");

    let resultado;

    if (produtoId) {
      resultado = await window._supabase
        .from("produtos_estoque")
        .update(produto)
        .eq("id", produtoId)
        .eq("user_id", usuarioLogadoEstoque.id)
        .select()
        .single();
    } else {
      resultado = await window._supabase
        .from("produtos_estoque")
        .insert({
          ...produto,
          user_id: usuarioLogadoEstoque.id
        })
        .select()
        .single();
    }

    if (resultado.error) {
      console.error("Erro ao salvar produto:", resultado.error);
      mostrarMensagemEstoque(
        "mensagem-estoque-form",
        "Erro ao salvar produto. Verifique os dados e tente novamente.",
        "erro"
      );
      return;
    }

    mostrarMensagemEstoque(
      "mensagem-estoque-form",
      produtoId ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.",
      "sucesso"
    );

    limparFormularioProdutoEstoque();
    await carregarProdutosEstoque();

  } catch (erro) {
    console.error("Erro inesperado ao salvar produto:", erro);
    mostrarMensagemEstoque(
      "mensagem-estoque-form",
      "Erro inesperado ao salvar produto.",
      "erro"
    );
  } finally {
    const btnSalvar = document.getElementById("btn-salvar-produto");
    alterarEstadoBotaoEstoque(btnSalvar, false, "Salvar produto");
  }
}

function montarObjetoProdutoEstoque() {
  return {
    nome: valorInputEstoque("produto-nome"),
    descricao: valorInputEstoque("produto-descricao"),
    categoria: obterCategoriaProdutoEstoque(),
    subcategoria: valorInputEstoque("produto-subcategoria"),
    marca_veiculo: valorInputEstoque("produto-marca-veiculo"),
    modelo_veiculo: valorInputEstoque("produto-modelo-veiculo"),
    ano_inicial: numeroInteiroCampoEstoque("produto-ano-inicial"),
    ano_final: numeroInteiroCampoEstoque("produto-ano-final"),
    versao_veiculo: valorInputEstoque("produto-versao-veiculo"),
    motor_veiculo: valorInputEstoque("produto-motor-veiculo"),
    codigo_original: valorInputEstoque("produto-codigo-original"),
    codigo_fabricante: valorInputEstoque("produto-codigo-fabricante"),
    aplicacao: valorInputEstoque("produto-aplicacao"),
    produto_universal: checkboxMarcadoEstoque("produto-universal"),
    codigo: valorInputEstoque("produto-codigo"),
    unidade: valorInputEstoque("produto-unidade") || "un",

    quantidade_atual: numeroCampoEstoque("produto-quantidade-atual"),
    estoque_minimo: numeroCampoEstoque("produto-estoque-minimo"),

    valor_custo: numeroCampoEstoque("produto-valor-custo"),
    valor_venda: numeroCampoEstoque("produto-valor-venda"),

    controlar_estoque: checkboxMarcadoEstoque("produto-controlar-estoque"),
    ativo: valorInputEstoque("produto-ativo") !== "false",

    observacoes: valorInputEstoque("produto-observacoes")
  };
}

function editarProdutoEstoque(id) {
  const produto = produtosEstoqueCache.find((item) => item.id === id);

  if (!produto) {
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Produto não encontrado para edição.",
      "erro"
    );
    return;
  }

  setValorEstoque("produto-id", produto.id);
  setValorEstoque("produto-nome", produto.nome);
  setValorEstoque("produto-descricao", produto.descricao);
  preencherCategoriaProdutoParaEdicao(produto.categoria);
  setValorEstoque("produto-subcategoria", produto.subcategoria || "");
  setValorEstoque("produto-marca-veiculo", produto.marca_veiculo || "");
  setValorEstoque("produto-modelo-veiculo", produto.modelo_veiculo || "");
  setValorEstoque("produto-ano-inicial", produto.ano_inicial || "");
  setValorEstoque("produto-ano-final", produto.ano_final || "");
  setValorEstoque("produto-versao-veiculo", produto.versao_veiculo || "");
  setValorEstoque("produto-motor-veiculo", produto.motor_veiculo || "");
  setValorEstoque("produto-codigo-original", produto.codigo_original || "");
  setValorEstoque("produto-codigo-fabricante", produto.codigo_fabricante || "");
  setValorEstoque("produto-aplicacao", produto.aplicacao || "");
  setCheckboxEstoque("produto-universal", produto.produto_universal === true);
  setValorEstoque("produto-codigo", produto.codigo);
  setValorEstoque("produto-unidade", produto.unidade || "un");
  setValorEstoque("produto-ativo", produto.ativo === false ? "false" : "true");

  setCheckboxEstoque("produto-controlar-estoque", produto.controlar_estoque !== false);

  setValorEstoque("produto-quantidade-atual", numeroParaInputEstoque(produto.quantidade_atual));
  setValorEstoque("produto-estoque-minimo", numeroParaInputEstoque(produto.estoque_minimo));
  setValorEstoque("produto-valor-custo", numeroParaInputEstoque(produto.valor_custo));
  setValorEstoque("produto-valor-venda", numeroParaInputEstoque(produto.valor_venda));
  setValorEstoque("produto-observacoes", produto.observacoes);

  const titulo = document.getElementById("titulo-form-produto");
  const btnSalvar = document.getElementById("btn-salvar-produto");

  if (titulo) titulo.textContent = "Editar produto";
  if (btnSalvar) btnSalvar.textContent = "Atualizar produto";

  abrirFormularioMobileProduto();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function excluirProdutoEstoque(id) {
  try {
    const produto = produtosEstoqueCache.find((item) => item.id === id);
    const nomeProduto = produto?.nome || "este produto";

    const confirmar = confirm(
      `Deseja realmente excluir ${nomeProduto}? Se ele tiver movimentações ou itens de OS vinculados, talvez seja melhor marcar como inativo.`
    );

    if (!confirmar) return;

    const session = await obterSessaoAtualEstoque();

    if (!session) {
      redirecionarParaLoginEstoque();
      return;
    }

    usuarioLogadoEstoque = session.user;

    const { error } = await window._supabase
      .from("produtos_estoque")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioLogadoEstoque.id);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      mostrarMensagemEstoque(
        "mensagem-estoque-lista",
        "Não foi possível excluir o produto. Se houver histórico, marque como inativo em vez de excluir.",
        "erro"
      );
      return;
    }

    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Produto excluído com sucesso.",
      "sucesso"
    );

    await carregarProdutosEstoque();

  } catch (erro) {
    console.error("Erro inesperado ao excluir produto:", erro);
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Erro inesperado ao excluir produto.",
      "erro"
    );
  }
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizarProdutosEstoque(lista) {
  const container = document.getElementById("lista-produtos-estoque");

  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum produto encontrado</strong>
        <p>Cadastre seu primeiro produto, peça ou material usando o formulário ao lado.</p>
      </div>
    `;
    return;
  }

  const grupos = agruparProdutosPorCategoriaAplicacaoEstoque(lista);

  container.innerHTML = grupos.map((grupo) => {
    const totalGrupo = grupo.subcategorias.reduce((soma, sub) => soma + sub.aplicacoes.reduce((s, ap) => s + ap.produtos.length, 0), 0);

    return `
      <section class="estoque-categoria-grupo">
        <div class="estoque-categoria-titulo">
          <span>${escaparHTMLEstoque(grupo.categoria)}</span>
          <small>${totalGrupo} item${totalGrupo === 1 ? "" : "s"}</small>
        </div>

        ${grupo.subcategorias.map((subgrupo) => {
          const totalSubgrupo = subgrupo.aplicacoes.reduce((soma, aplicacao) => soma + aplicacao.produtos.length, 0);

          return `
            <div class="estoque-subcategoria-grupo">
              <div class="estoque-subcategoria-titulo">
                <span>${escaparHTMLEstoque(subgrupo.subcategoria)}</span>
                <small>${totalSubgrupo} item${totalSubgrupo === 1 ? "" : "s"}</small>
              </div>

              ${subgrupo.aplicacoes.map((aplicacao) => `
                <div class="estoque-aplicacao-grupo">
                  <div class="estoque-aplicacao-titulo">
                    <span>${escaparHTMLEstoque(aplicacao.aplicacao)}</span>
                    <small>${aplicacao.produtos.length} item${aplicacao.produtos.length === 1 ? "" : "s"}</small>
                  </div>

                  <div class="estoque-grade-cabecalho">
                    <div>Produto</div>
                    <div style="text-align:right;">Qtd</div>
                    <div style="text-align:right;">Venda</div>
                    <div></div>
                  </div>

                  <div>
                    ${aplicacao.produtos.map((produto) => criarLinhaProdutoEstoque(produto)).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          `;
        }).join("")}
      </section>
    `;
  }).join("");
}

function agruparProdutosPorCategoriaAplicacaoEstoque(lista) {
  const mapaCategorias = new Map();

  lista.forEach((produto) => {
    const categoria = String(produto.categoria || "").trim() || "Sem categoria";
    const subcategoria = String(produto.subcategoria || "").trim() || "Sem subcategoria";
    const aplicacao = montarAplicacaoProdutoEstoque(produto);

    if (!mapaCategorias.has(categoria)) mapaCategorias.set(categoria, new Map());
    const mapaSub = mapaCategorias.get(categoria);

    if (!mapaSub.has(subcategoria)) mapaSub.set(subcategoria, new Map());
    const mapaAplicacao = mapaSub.get(subcategoria);

    if (!mapaAplicacao.has(aplicacao)) mapaAplicacao.set(aplicacao, []);
    mapaAplicacao.get(aplicacao).push(produto);
  });

  return Array.from(mapaCategorias.entries())
    .map(([categoria, mapaSub]) => ({
      categoria,
      subcategorias: Array.from(mapaSub.entries())
        .map(([subcategoria, mapaAplicacao]) => ({
          subcategoria,
          aplicacoes: Array.from(mapaAplicacao.entries())
            .map(([aplicacao, produtos]) => ({
              aplicacao,
              produtos: [...produtos].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"))
            }))
            .sort((a, b) => a.aplicacao.localeCompare(b.aplicacao, "pt-BR"))
        }))
        .sort((a, b) => a.subcategoria.localeCompare(b.subcategoria, "pt-BR"))
    }))
    .sort((a, b) => {
      if (a.categoria === "Sem categoria") return 1;
      if (b.categoria === "Sem categoria") return -1;
      return a.categoria.localeCompare(b.categoria, "pt-BR");
    });
}

function montarAplicacaoProdutoEstoque(produto) {
  if (produto?.produto_universal === true) return "Universal / serve para vários veículos";

  const marca = String(produto?.marca_veiculo || "").trim();
  const modelo = String(produto?.modelo_veiculo || "").trim();
  const versao = String(produto?.versao_veiculo || "").trim();
  const motor = String(produto?.motor_veiculo || "").trim();
  const anos = formatarAnosAplicacaoEstoque(produto);
  const aplicacao = String(produto?.aplicacao || "").trim();

  const principal = [marca, modelo, versao, motor, anos].filter(Boolean).join(" • ");
  return principal || aplicacao || "Aplicação não informada";
}

function formatarAnosAplicacaoEstoque(produto) {
  const inicial = produto?.ano_inicial;
  const final = produto?.ano_final;

  if (inicial && final) return `${inicial} a ${final}`;
  if (inicial) return `A partir de ${inicial}`;
  if (final) return `Até ${final}`;

  return "";
}

function resumirAplicacaoProdutoEstoque(produto) {
  const partes = [
    produto?.subcategoria ? `Tipo: ${produto.subcategoria}` : "",
    produto?.produto_universal === true ? "Universal" : montarAplicacaoProdutoEstoque(produto),
    produto?.codigo_original ? `Original: ${produto.codigo_original}` : "",
    produto?.codigo_fabricante ? `Fabricante: ${produto.codigo_fabricante}` : ""
  ].filter(Boolean);

  return partes.join(" • ");
}

function criarLinhaProdutoEstoque(produto) {
  const id = escaparHTMLEstoque(produto.id);
  const nome = escaparHTMLEstoque(produto.nome || "Produto sem nome");
  const codigo = escaparHTMLEstoque(produto.codigo || "");
  const descricao = escaparHTMLEstoque(produto.descricao || "");
  const categoria = escaparHTMLEstoque(produto.categoria || "Sem categoria");
  const subcategoria = escaparHTMLEstoque(produto.subcategoria || "");
  const aplicacao = escaparHTMLEstoque(resumirAplicacaoProdutoEstoque(produto));
  const unidade = escaparHTMLEstoque(produto.unidade || "un");

  const ativo = produto.ativo !== false;
  const controla = produto.controlar_estoque !== false;
  const baixo = produtoEstoqueBaixo(produto);

  const quantidade = converterNumeroEstoque(produto.quantidade_atual);
  const minimo = converterNumeroEstoque(produto.estoque_minimo);

  const valorVenda = formatarMoedaEstoque(produto.valor_venda);
  const valorCusto = formatarMoedaEstoque(produto.valor_custo);

  const classeBloco = baixo
    ? "estoque-produto-bloco estoque-baixo"
    : "estoque-produto-bloco";

  const classeQtd = baixo
    ? "estoque-produto-qtd baixo"
    : "estoque-produto-qtd";

  const textoQuantidade = controla
    ? `${formatarQuantidadeEstoque(quantidade)} ${unidade}`
    : "S/ctrl";

  const detalhesLinha = [
    codigo ? `Cód: ${codigo}` : "",
    produto.subcategoria ? produto.subcategoria : "",
    produto.produto_universal ? "Universal" : [produto.marca_veiculo, produto.modelo_veiculo, formatarAnosAplicacaoEstoque(produto)].filter(Boolean).join(" "),
    controla ? `Mín: ${formatarQuantidadeEstoque(minimo)} ${unidade}` : "Sem controle",
    baixo ? "Estoque baixo" : "",
    ativo ? "" : "Inativo"
  ].filter(Boolean).join(" • ");

  return `
    <article class="${classeBloco}" data-produto-id="${id}">
      <div class="estoque-produto-linha" onclick="alternarLinhaProdutoEstoque('${id}')">
        <div class="estoque-produto-nome" title="${nome}">
          <strong>${nome}</strong>
          <small>${escaparHTMLEstoque(detalhesLinha || descricao || "Sem detalhes")}</small>
        </div>

        <div class="${classeQtd}">
          ${textoQuantidade}
        </div>

        <div class="estoque-produto-valor">
          ${valorVenda}
        </div>

        <div class="estoque-produto-seta">
          ▾
        </div>
      </div>

      <div class="estoque-produto-detalhes">
        <div class="estoque-produto-meta">
          <span>Categoria: ${categoria}</span>
          ${subcategoria ? `<span>Subcategoria: ${subcategoria}</span>` : ""}
          ${aplicacao ? `<span>Aplicação: ${aplicacao}</span>` : ""}
          ${codigo ? `<span>Código: ${codigo}</span>` : ""}
          ${produto.codigo_original ? `<span>Código original: ${escaparHTMLEstoque(produto.codigo_original)}</span>` : ""}
          ${produto.codigo_fabricante ? `<span>Código fabricante: ${escaparHTMLEstoque(produto.codigo_fabricante)}</span>` : ""}
          <span>Quantidade: ${textoQuantidade}</span>
          ${controla ? `<span>Mínimo: ${formatarQuantidadeEstoque(minimo)} ${unidade}</span>` : `<span>Sem controle de estoque</span>`}
          <span>Custo: ${valorCusto}</span>
          <span>Venda: ${valorVenda}</span>
          ${descricao ? `<span>${descricao}</span>` : ""}
          ${ativo ? `<span class="estoque-status-mini ativo">Ativo</span>` : `<span class="estoque-status-mini inativo">Inativo</span>`}
          ${baixo ? `<span class="estoque-status-mini baixo">Baixo</span>` : ""}
        </div>

        <div class="estoque-produto-botoes">
          <button type="button" onclick="event.stopPropagation(); editarProdutoEstoque('${id}')">
            Editar
          </button>

          <button type="button" class="verde" onclick="event.stopPropagation(); abrirModalMovimentacaoEstoque('${id}', 'entrada')">
            Entrada
          </button>

          <button type="button" class="laranja" onclick="event.stopPropagation(); abrirModalMovimentacaoEstoque('${id}', 'saida')">
            Saída
          </button>

          <button type="button" onclick="event.stopPropagation(); abrirModalMovimentacaoEstoque('${id}', 'ajuste')">
            Ajuste
          </button>

          <button type="button" class="perigo" onclick="event.stopPropagation(); excluirProdutoEstoque('${id}')">
            Excluir
          </button>
        </div>
      </div>
    </article>
  `;
}

function criarStatusProdutoCompactoEstoque(produto) {
  const ativo = produto.ativo !== false;
  const controla = produto.controlar_estoque !== false;
  const baixo = produtoEstoqueBaixo(produto);

  const status = [];

  if (ativo) {
    status.push(`<span class="estoque-status-mini ativo">Ativo</span>`);
  } else {
    status.push(`<span class="estoque-status-mini inativo">Inativo</span>`);
  }

  if (!controla) {
    status.push(`<span class="estoque-status-mini inativo">Sem controle</span>`);
  }

  if (baixo) {
    status.push(`<span class="estoque-status-mini baixo">Baixo</span>`);
  }

  return `
    <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:5px;">
      ${status.join("")}
    </div>
  `;
}

/* =========================================================
   FILTROS E RESUMO
   ========================================================= */

function atualizarFiltrosAtuaisEstoque() {
  filtrosAtuaisEstoque = {
    termo: valorInputEstoque("busca-produtos"),
    status: valorInputEstoque("filtro-status-produtos"),
    estoque: valorInputEstoque("filtro-estoque-produtos"),
    categoria: valorInputEstoque("filtro-categoria-produtos"),
    subcategoria: valorInputEstoque("filtro-subcategoria-produtos")
  };
}

async function carregarMaisProdutosEstoque() {
  if (!temMaisProdutosEstoque) return;

  paginaProdutosEstoque += 1;

  await carregarProdutosEstoque(false);
}

function atualizarBotaoCarregarMaisProdutos() {
  const botao = document.getElementById("btn-carregar-mais-produtos");

  if (!botao) return;

  if (temMaisProdutosEstoque) {
    botao.classList.remove("oculto");
    botao.textContent = `Carregar mais ${limiteProdutosEstoque} produtos`;
  } else {
    botao.classList.add("oculto");
  }
}

function filtrarProdutosEstoque() {
  carregarProdutosEstoque(true);
}

function atualizarResumoEstoque(lista) {
  const total = lista.length;
  const ativos = lista.filter((produto) => produto.ativo !== false).length;
  const baixo = lista.filter((produto) => produtoEstoqueBaixo(produto)).length;

  const valorCusto = lista.reduce((soma, produto) => {
    if (produto.controlar_estoque === false) return soma;

    return soma + (
      converterNumeroEstoque(produto.quantidade_atual) *
      converterNumeroEstoque(produto.valor_custo)
    );
  }, 0);

  const valorVenda = lista.reduce((soma, produto) => {
    if (produto.controlar_estoque === false) return soma;

    return soma + (
      converterNumeroEstoque(produto.quantidade_atual) *
      converterNumeroEstoque(produto.valor_venda)
    );
  }, 0);

  setTextoEstoque("resumo-total-produtos", total);
  setTextoEstoque("resumo-produtos-ativos", ativos);
  setTextoEstoque("resumo-produtos-baixo", baixo);
  setTextoEstoque("resumo-valor-custo", formatarMoedaEstoque(valorCusto));
  setTextoEstoque("resumo-valor-venda", formatarMoedaEstoque(valorVenda));
}

function produtoEstoqueBaixo(produto) {
  if (!produto) return false;
  if (produto.ativo === false) return false;
  if (produto.controlar_estoque === false) return false;

  const quantidade = converterNumeroEstoque(produto.quantidade_atual);
  const minimo = converterNumeroEstoque(produto.estoque_minimo);

  return quantidade <= minimo;
}

/* =========================================================
   MOVIMENTAÇÃO DE ESTOQUE
   ========================================================= */

function abrirModalMovimentacaoEstoque(id, tipo) {
  const produto = produtosEstoqueCache.find((item) => item.id === id);

  if (!produto) {
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Produto não encontrado.",
      "erro"
    );
    return;
  }

  if (produto.controlar_estoque === false && tipo !== "ajuste") {
    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Este produto está marcado como sem controle de estoque.",
      "erro"
    );
    return;
  }

  limparMensagemEstoque("mensagem-estoque-modal");

  setValorEstoque("movimentacao-produto-id", produto.id);
  setValorEstoque("movimentacao-tipo", tipo);
  setValorEstoque("movimentacao-produto-nome", produto.nome || "");
  setValorEstoque("movimentacao-quantidade", "");

  const valorPadrao = tipo === "saida"
    ? produto.valor_venda
    : produto.valor_custo;

  setValorEstoque("movimentacao-valor-unitario", numeroParaInputEstoque(valorPadrao || 0));
  setValorEstoque("movimentacao-observacao", "");

  const titulo = document.getElementById("titulo-modal-movimentacao");
  const btnConfirmar = document.getElementById("btn-confirmar-movimentacao");

  if (titulo) {
    titulo.textContent = tituloMovimentacaoEstoque(tipo);
  }

  if (btnConfirmar) {
    btnConfirmar.textContent = textoBotaoMovimentacaoEstoque(tipo);
  }

  const modal = document.getElementById("modal-movimentacao-estoque");

  if (modal) {
    modal.classList.add("ativo");
  }
}

function fecharModalMovimentacaoEstoque() {
  const modal = document.getElementById("modal-movimentacao-estoque");

  if (modal) {
    modal.classList.remove("ativo");
  }

  limparMensagemEstoque("mensagem-estoque-modal");

  const form = document.getElementById("form-movimentacao-estoque");

  if (form) form.reset();
}

async function confirmarMovimentacaoEstoque(event) {
  event.preventDefault();

  try {
    limparMensagemEstoque("mensagem-estoque-modal");

    const session = await obterSessaoAtualEstoque();

    if (!session) {
      redirecionarParaLoginEstoque();
      return;
    }

    usuarioLogadoEstoque = session.user;

    const produtoId = valorInputEstoque("movimentacao-produto-id");
    const tipo = valorInputEstoque("movimentacao-tipo");
    const quantidade = numeroCampoEstoque("movimentacao-quantidade");
    const valorUnitario = numeroCampoEstoque("movimentacao-valor-unitario");
    const observacao = valorInputEstoque("movimentacao-observacao");

    if (!produtoId) {
      mostrarMensagemEstoque(
        "mensagem-estoque-modal",
        "Produto não informado.",
        "erro"
      );
      return;
    }

    if (!tipo) {
      mostrarMensagemEstoque(
        "mensagem-estoque-modal",
        "Tipo de movimentação não informado.",
        "erro"
      );
      return;
    }

    if (quantidade <= 0) {
      mostrarMensagemEstoque(
        "mensagem-estoque-modal",
        "Informe uma quantidade maior que zero.",
        "erro"
      );
      return;
    }

    const produto = produtosEstoqueCache.find((item) => item.id === produtoId);

    if (!produto) {
      mostrarMensagemEstoque(
        "mensagem-estoque-modal",
        "Produto não encontrado.",
        "erro"
      );
      return;
    }

    if (tipo === "saida") {
      const atual = converterNumeroEstoque(produto.quantidade_atual);

      if (quantidade > atual) {
        mostrarMensagemEstoque(
          "mensagem-estoque-modal",
          `Estoque insuficiente. Quantidade atual: ${formatarQuantidadeEstoque(atual)}.`,
          "erro"
        );
        return;
      }
    }

    const btnConfirmar = document.getElementById("btn-confirmar-movimentacao");
    alterarEstadoBotaoEstoque(btnConfirmar, true, "Confirmando...");

    const { error } = await window._supabase.rpc(
      "registrar_movimentacao_estoque",
      {
        p_user_id: usuarioLogadoEstoque.id,
        p_produto_id: produtoId,
        p_tipo_movimentacao: tipo,
        p_quantidade: quantidade,
        p_ordem_servico_id: null,
        p_ordem_servico_item_id: null,
        p_valor_unitario: valorUnitario,
        p_observacao: observacao || descricaoPadraoMovimentacaoEstoque(tipo)
      }
    );

    if (error) {
      console.error("Erro ao registrar movimentação:", error);
      mostrarMensagemEstoque(
        "mensagem-estoque-modal",
        traduzirErroMovimentacaoEstoque(error.message),
        "erro"
      );
      return;
    }

    fecharModalMovimentacaoEstoque();

    mostrarMensagemEstoque(
      "mensagem-estoque-lista",
      "Movimentação registrada com sucesso.",
      "sucesso"
    );

    await carregarProdutosEstoque();

  } catch (erro) {
    console.error("Erro inesperado na movimentação:", erro);
    mostrarMensagemEstoque(
      "mensagem-estoque-modal",
      "Erro inesperado ao registrar movimentação.",
      "erro"
    );
  } finally {
    const btnConfirmar = document.getElementById("btn-confirmar-movimentacao");
    alterarEstadoBotaoEstoque(
      btnConfirmar,
      false,
      textoBotaoMovimentacaoEstoque(valorInputEstoque("movimentacao-tipo"))
    );
  }
}

function tituloMovimentacaoEstoque(tipo) {
  const mapa = {
    entrada: "Entrada de estoque",
    saida: "Saída de estoque",
    ajuste: "Ajuste de estoque"
  };

  return mapa[tipo] || "Movimentar estoque";
}

function textoBotaoMovimentacaoEstoque(tipo) {
  const mapa = {
    entrada: "Confirmar entrada",
    saida: "Confirmar saída",
    ajuste: "Confirmar ajuste"
  };

  return mapa[tipo] || "Confirmar";
}

function descricaoPadraoMovimentacaoEstoque(tipo) {
  const mapa = {
    entrada: "Entrada manual de estoque",
    saida: "Saída manual de estoque",
    ajuste: "Ajuste manual de estoque"
  };

  return mapa[tipo] || "Movimentação manual de estoque";
}

function traduzirErroMovimentacaoEstoque(mensagem) {
  const texto = String(mensagem || "").toLowerCase();

  if (texto.includes("estoque insuficiente")) {
    return "Estoque insuficiente para realizar esta saída.";
  }

  if (texto.includes("produto não encontrado")) {
    return "Produto não encontrado para este usuário.";
  }

  if (texto.includes("quantidade da movimentação")) {
    return "A quantidade da movimentação precisa ser maior que zero.";
  }

  if (texto.includes("tipo de movimentação inválido")) {
    return "Tipo de movimentação inválido.";
  }

  return "Erro ao registrar movimentação. Verifique os dados e tente novamente.";
}

/* =========================================================
   FORMULÁRIO
   ========================================================= */

function limparFormularioProdutoEstoque() {
  const form = document.getElementById("form-produto-estoque");

  if (form) form.reset();

  setValorEstoque("produto-id", "");
  setValorEstoque("produto-unidade", "un");
  setValorEstoque("produto-ativo", "true");
  setValorEstoque("produto-quantidade-atual", "");
  setValorEstoque("produto-estoque-minimo", "");
  setValorEstoque("produto-valor-custo", "");
  setValorEstoque("produto-valor-venda", "");
  setCheckboxEstoque("produto-controlar-estoque", true);
  setValorEstoque("produto-categoria", "");
  setValorEstoque("produto-categoria-outra", "");
  controlarCampoOutraCategoriaEstoque();

  const titulo = document.getElementById("titulo-form-produto");
  const btnSalvar = document.getElementById("btn-salvar-produto");

  if (titulo) titulo.textContent = "Novo produto";
  if (btnSalvar) btnSalvar.textContent = "Salvar produto";

  limparMensagemEstoque("mensagem-estoque-form");
}

/* =========================================================
   HELPERS DOM
   ========================================================= */

function valorInputEstoque(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function setValorEstoque(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.value = valor ?? "";
}

function setTextoEstoque(id, valor) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = valor ?? "";
}

function checkboxMarcadoEstoque(id) {
  const el = document.getElementById(id);
  return !!(el && el.checked);
}

function setCheckboxEstoque(id, marcado) {
  const el = document.getElementById(id);

  if (!el) return;

  el.checked = !!marcado;
}

function mostrarMensagemEstoque(id, texto, tipo = "info") {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = `mensagem-estoque ${tipo}`;
  el.textContent = texto;

  if (tipo === "sucesso") {
    setTimeout(() => {
      limparMensagemEstoque(id);
    }, 4000);
  }
}

function limparMensagemEstoque(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.className = "mensagem-estoque";
  el.textContent = "";
}

function setLoadingEstoque(ativo) {
  const loading = document.getElementById("loading-estoque");

  if (!loading) return;

  if (ativo) {
    loading.classList.add("ativo");
  } else {
    loading.classList.remove("ativo");
  }
}

function alterarEstadoBotaoEstoque(botao, carregando, texto) {
  if (!botao) return;

  botao.disabled = carregando;
  botao.textContent = texto;
}

/* =========================================================
   HELPERS NÚMEROS / TEXTO
   CORRIGIDO: 1.00 não vira 100
   ========================================================= */

function converterNumeroEstoque(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor).trim();

  if (!texto) return 0;

  texto = texto.replace(/[^\d.,-]/g, "");

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  // Formato brasileiro: 1.234,56
  if (temVirgula) {
    texto = texto.replace(/\./g, "").replace(",", ".");
    const numeroBR = Number(texto);
    return Number.isFinite(numeroBR) ? numeroBR : 0;
  }

  // Formato de input type="number": 1234.56
  if (temPonto) {
    const numeroUS = Number(texto);
    return Number.isFinite(numeroUS) ? numeroUS : 0;
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function numeroInteiroCampoEstoque(id) {
  const valor = valorInputEstoque(id);
  if (valor === "") return null;
  const numero = parseInt(String(valor).replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(numero) ? numero : null;
}

function numeroCampoEstoque(id) {
  return converterNumeroEstoque(valorInputEstoque(id));
}

function numeroParaInputEstoque(valor) {
  const numero = converterNumeroEstoque(valor);
  return numero.toFixed(2);
}

function formatarQuantidadeEstoque(valor) {
  const numero = converterNumeroEstoque(valor);

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: numero % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function formatarMoedaEstoque(valor) {
  const numero = converterNumeroEstoque(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarTextoEstoque(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHTMLAtributoEstoque(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escaparHTMLEstoque(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function alternarLinhaProdutoEstoque(id) {
  const bloco = document.querySelector(`.estoque-produto-bloco[data-produto-id="${CSS.escape(id)}"]`);

  if (!bloco) return;

  const estavaAberto = bloco.classList.contains("expandido");

  document.querySelectorAll(".estoque-produto-bloco.expandido").forEach((item) => {
    item.classList.remove("expandido");
  });

  if (!estavaAberto) {
    bloco.classList.add("expandido");
  }
}

function controlarCampoOutraCategoriaEstoque() {
  const select = document.getElementById("produto-categoria");
  const grupoOutra = document.getElementById("grupo-produto-categoria-outra");
  const inputOutra = document.getElementById("produto-categoria-outra");

  if (!select || !grupoOutra) return;

  if (select.value === "__outra__") {
    grupoOutra.classList.remove("oculto");

    setTimeout(() => {
      if (inputOutra) inputOutra.focus();
    }, 80);
  } else {
    grupoOutra.classList.add("oculto");

    if (inputOutra) {
      inputOutra.value = "";
    }
  }
}

function obterSubcategoriasPermitidasEstoque(categoria) {
  const categoriaLimpa = String(categoria || "").trim();
  const base = [];

  if (categoriaLimpa && SUBCATEGORIAS_OFICINA_POR_CATEGORIA[categoriaLimpa]) {
    base.push(...SUBCATEGORIAS_OFICINA_POR_CATEGORIA[categoriaLimpa]);
  } else if (!categoriaLimpa) {
    Object.values(SUBCATEGORIAS_OFICINA_POR_CATEGORIA).forEach((lista) => base.push(...lista));
  }

  produtosEstoqueCache.forEach((produto) => {
    const mesmaCategoria = !categoriaLimpa || String(produto.categoria || "").trim() === categoriaLimpa;
    const sub = String(produto.subcategoria || "").trim();
    if (mesmaCategoria && sub) base.push(sub);
  });

  return Array.from(new Set(base.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function atualizarSubcategoriasFiltroEstoque(limparSelecao = false) {
  const select = document.getElementById("filtro-subcategoria-produtos");
  if (!select) return;

  const categoria = valorInputEstoque("filtro-categoria-produtos");
  const valorAnterior = limparSelecao ? "" : select.value;
  const subcategorias = obterSubcategoriasPermitidasEstoque(categoria);

  select.innerHTML = [
    `<option value="">Todas</option>`,
    ...subcategorias.map((sub) => `<option value="${escaparHTMLAtributoEstoque(sub)}">${escaparHTMLEstoque(sub)}</option>`),
    `<option value="Sem subcategoria">Sem subcategoria</option>`
  ].join("");

  if (valorAnterior && Array.from(select.options).some((opcao) => opcao.value === valorAnterior)) {
    select.value = valorAnterior;
  }
}

function obterCategoriaProdutoEstoque() {
  const categoriaSelecionada = valorInputEstoque("produto-categoria");

  if (categoriaSelecionada === "__outra__") {
    return valorInputEstoque("produto-categoria-outra") || "Outros";
  }

  return categoriaSelecionada || "";
}

function preencherCategoriaProdutoParaEdicao(categoria) {
  const categoriasPadrao = [
    "Peças",
    "Materiais",
    "Produtos",
    "Ferramentas",
    "Insumos",
    "Serviços",
    "Outros"
  ];

  const categoriaFinal = String(categoria || "").trim();

  if (!categoriaFinal) {
    setValorEstoque("produto-categoria", "");
    setValorEstoque("produto-categoria-outra", "");
    controlarCampoOutraCategoriaEstoque();
    return;
  }

  if (categoriasPadrao.includes(categoriaFinal)) {
    setValorEstoque("produto-categoria", categoriaFinal);
    setValorEstoque("produto-categoria-outra", "");
  } else {
    setValorEstoque("produto-categoria", "__outra__");
    setValorEstoque("produto-categoria-outra", categoriaFinal);
  }

  controlarCampoOutraCategoriaEstoque();
}


/* =========================================================
   CATÁLOGO NACIONAL DE MARCAS E MODELOS PARA APLICAÇÃO
   ========================================================= */

function abrirModalCatalogoMarcaEstoque() {
  const modal = document.getElementById("modal-catalogo-marca-estoque");
  const campo = document.getElementById("campo-busca-marca-estoque");
  const resultado = document.getElementById("resultado-catalogo-marcas-estoque");

  if (campo) campo.value = valorInputEstoque("produto-marca-veiculo") || "";
  if (resultado) resultado.innerHTML = `<div class="estado-vazio">Digite a marca e clique em Buscar.</div>`;

  if (modal) {
    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => campo?.focus(), 80);
  }
}

function fecharModalCatalogoMarcaEstoque() {
  const modal = document.getElementById("modal-catalogo-marca-estoque");
  if (modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
  }
}

function abrirModalCatalogoModeloEstoque() {
  const modal = document.getElementById("modal-catalogo-modelo-estoque");
  const campo = document.getElementById("campo-busca-modelo-estoque");
  const resultado = document.getElementById("resultado-catalogo-modelos-estoque");

  if (campo) campo.value = valorInputEstoque("produto-modelo-veiculo") || "";
  if (resultado) resultado.innerHTML = `<div class="estado-vazio">Carregando modelos da marca selecionada...</div>`;

  if (modal) {
    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => campo?.focus(), 80);
  }

  resolverMarcaCatalogoEstoque().then(() => buscarCatalogoModelosEstoque()).catch((erro) => {
    console.error("Erro ao abrir busca de modelos:", erro);
    if (resultado) resultado.innerHTML = `<div class="estado-vazio">Selecione uma marca válida primeiro.</div>`;
  });
}

function fecharModalCatalogoModeloEstoque() {
  const modal = document.getElementById("modal-catalogo-modelo-estoque");
  if (modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
  }
}

async function buscarCatalogoMarcasEstoque() {
  const campo = document.getElementById("campo-busca-marca-estoque");
  const resultado = document.getElementById("resultado-catalogo-marcas-estoque");
  if (!resultado) return;

  const termo = String(campo?.value || "").trim();
  resultado.innerHTML = `<div class="estado-vazio">Buscando marcas...</div>`;

  try {
    let query = window._supabase
      .from("veiculo_marcas_catalogo")
      .select("id, nome")
      .order("nome", { ascending: true })
      .limit(60);

    if (termo) query = query.ilike("nome", `%${termo}%`);

    const { data, error } = await query;
    if (error) throw error;

    catalogoMarcasEstoqueCache = Array.isArray(data) ? data : [];

    if (!catalogoMarcasEstoqueCache.length) {
      resultado.innerHTML = `<div class="estado-vazio">Nenhuma marca encontrada. Você pode digitar manualmente.</div>`;
      return;
    }

    resultado.innerHTML = catalogoMarcasEstoqueCache.map((marca) => `
      <button type="button" class="catalogo-modal-item" onclick="selecionarCatalogoMarcaEstoque('${escaparHTMLAtributoEstoque(marca.id)}')">
        <strong>${escaparHTMLEstoque(marca.nome)}</strong>
        <span>Selecionar marca para aplicação da peça</span>
      </button>
    `).join("");
  } catch (erro) {
    console.error("Erro ao buscar marcas do catálogo:", erro);
    resultado.innerHTML = `<div class="estado-vazio">Não foi possível buscar o catálogo. Rode o SQL do catálogo no Supabase ou digite manualmente.</div>`;
  }
}

function selecionarCatalogoMarcaEstoque(marcaId) {
  const marca = catalogoMarcasEstoqueCache.find((item) => String(item.id) === String(marcaId));
  if (!marca) return;

  catalogoMarcaSelecionadaEstoqueId = marca.id;
  setValorEstoque("produto-marca-veiculo", marca.nome || "");
  setValorEstoque("produto-modelo-veiculo", "");
  fecharModalCatalogoMarcaEstoque();
  abrirModalCatalogoModeloEstoque();
}

async function resolverMarcaCatalogoEstoque() {
  if (catalogoMarcaSelecionadaEstoqueId) return catalogoMarcaSelecionadaEstoqueId;

  const marcaDigitada = valorInputEstoque("produto-marca-veiculo");
  if (!marcaDigitada) return null;

  const { data, error } = await window._supabase
    .from("veiculo_marcas_catalogo")
    .select("id, nome")
    .ilike("nome", marcaDigitada)
    .limit(1);

  if (error) {
    console.warn("Erro ao resolver marca do catálogo:", error);
    return null;
  }

  const marca = Array.isArray(data) ? data[0] : null;
  if (marca?.id) {
    catalogoMarcaSelecionadaEstoqueId = marca.id;
    setValorEstoque("produto-marca-veiculo", marca.nome || marcaDigitada);
    return marca.id;
  }

  return null;
}

async function buscarCatalogoModelosEstoque() {
  const campo = document.getElementById("campo-busca-modelo-estoque");
  const resultado = document.getElementById("resultado-catalogo-modelos-estoque");
  if (!resultado) return;

  const marcaId = await resolverMarcaCatalogoEstoque();
  if (!marcaId) {
    resultado.innerHTML = `<div class="estado-vazio">Selecione uma marca do catálogo primeiro ou digite uma marca válida.</div>`;
    return;
  }

  const termo = String(campo?.value || "").trim();
  resultado.innerHTML = `<div class="estado-vazio">Buscando modelos...</div>`;

  try {
    let query = window._supabase
      .from("veiculo_modelos_catalogo")
      .select("id, nome, tipo")
      .eq("marca_id", marcaId)
      .order("nome", { ascending: true })
      .limit(80);

    if (termo) query = query.ilike("nome", `%${termo}%`);

    const { data, error } = await query;
    if (error) throw error;

    catalogoModelosEstoqueCache = Array.isArray(data) ? data : [];

    if (!catalogoModelosEstoqueCache.length) {
      resultado.innerHTML = `<div class="estado-vazio">Nenhum modelo encontrado para esta marca. Você pode digitar manualmente.</div>`;
      return;
    }

    resultado.innerHTML = catalogoModelosEstoqueCache.map((modelo) => `
      <button type="button" class="catalogo-modal-item" onclick="selecionarCatalogoModeloEstoque('${escaparHTMLAtributoEstoque(modelo.id)}')">
        <strong>${escaparHTMLEstoque(modelo.nome)}</strong>
        <span>${escaparHTMLEstoque(modelo.tipo || "Modelo do catálogo")}</span>
      </button>
    `).join("");
  } catch (erro) {
    console.error("Erro ao buscar modelos do catálogo:", erro);
    resultado.innerHTML = `<div class="estado-vazio">Não foi possível buscar modelos. Confira se a tabela veiculo_modelos_catalogo existe no Supabase.</div>`;
  }
}

function selecionarCatalogoModeloEstoque(modeloId) {
  const modelo = catalogoModelosEstoqueCache.find((item) => String(item.id) === String(modeloId));
  if (!modelo) return;

  setValorEstoque("produto-modelo-veiculo", modelo.nome || "");
  fecharModalCatalogoModeloEstoque();
}

/* =========================================================
   EXPORTAÇÕES GLOBAIS
   Necessário porque os botões são criados via innerHTML.
   ========================================================= */

window.carregarProdutosEstoque = carregarProdutosEstoque;
window.salvarProdutoEstoque = salvarProdutoEstoque;
window.editarProdutoEstoque = editarProdutoEstoque;
window.excluirProdutoEstoque = excluirProdutoEstoque;
window.filtrarProdutosEstoque = filtrarProdutosEstoque;
window.abrirModalMovimentacaoEstoque = abrirModalMovimentacaoEstoque;
window.fecharModalMovimentacaoEstoque = fecharModalMovimentacaoEstoque;
window.confirmarMovimentacaoEstoque = confirmarMovimentacaoEstoque;
window.limparFormularioProdutoEstoque = limparFormularioProdutoEstoque;
window.alternarLinhaProdutoEstoque = alternarLinhaProdutoEstoque;
window.abrirModalCatalogoMarcaEstoque = abrirModalCatalogoMarcaEstoque;
window.fecharModalCatalogoMarcaEstoque = fecharModalCatalogoMarcaEstoque;
window.buscarCatalogoMarcasEstoque = buscarCatalogoMarcasEstoque;
window.selecionarCatalogoMarcaEstoque = selecionarCatalogoMarcaEstoque;
window.abrirModalCatalogoModeloEstoque = abrirModalCatalogoModeloEstoque;
window.fecharModalCatalogoModeloEstoque = fecharModalCatalogoModeloEstoque;
window.buscarCatalogoModelosEstoque = buscarCatalogoModelosEstoque;
window.selecionarCatalogoModeloEstoque = selecionarCatalogoModeloEstoque;
window.controlarCampoOutraCategoriaEstoque = controlarCampoOutraCategoriaEstoque;