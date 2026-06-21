/* =========================================================
   FS ORÇAMENTOS — CLIENTES
   Cadastro, listagem, filtros e ações rápidas de clientes.
   ========================================================= */

let clientesCache = [];
let clientesCarregadosUmaVez = false;
let usuarioLogado = null;
let fsClientesInicializado = false;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarClientesUmaVez);
} else {
  iniciarClientesUmaVez();
}

async function iniciarClientesUmaVez() {
  if (fsClientesInicializado) return;
  fsClientesInicializado = true;
  await inicializarModuloClientes();
}

async function inicializarModuloClientes() {
  try {
    garantirSupabase();

    if (typeof bloquearPaginaSeNaoPremiumAsync === 'function') {
      const bloqueado = await bloquearPaginaSeNaoPremiumAsync('Clientes fazem parte do Plano Premium.');
      if (bloqueado) return;
    }

    const session = await obterSessaoAtual();

    if (!session) {
      redirecionarParaLogin();
      return;
    }

    usuarioLogado = session.user;

    configurarEventosClientes();
    configurarFormularioMobileClientes();
    prepararListaClientesVazia();
    atualizarResumoClientes([]);
  } catch (erro) {
    console.error('Erro ao inicializar clientes.js:', erro);
    mostrarMensagem(
      'mensagem-clientes-lista',
      'Erro ao iniciar o módulo de clientes. Verifique sua conexão e tente novamente.',
      'erro'
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

  throw new Error('Supabase não inicializado. Verifique config.js.');
}

async function obterSessaoAtual() {
  const { data, error } = await window._supabase.auth.getSession();

  if (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }

  return data?.session || null;
}

function redirecionarParaLogin() {
  const destino = encodeURIComponent('clientes.html');
  window.location.href = `index.html?redirect=${destino}`;
}

// ==================== EVENTOS ====================

function configurarEventosClientes() {
  const form = document.getElementById('form-cliente');
  const btnLimpar = document.getElementById('btn-limpar-cliente');
  const btnAtualizar = document.getElementById('btn-atualizar-clientes');
  const btnToggleLista = document.getElementById('btn-toggle-lista-clientes');
  const busca = document.getElementById('busca-clientes');
  const buscaIdCliente = document.getElementById('busca-id-cliente');
  const filtroStatus = document.getElementById('filtro-status-clientes');
  const filtroCategoria = document.getElementById('filtro-categoria-clientes');

  if (form && form.dataset.configurado !== 'sim') {
    form.dataset.configurado = 'sim';
    form.addEventListener('submit', salvarCliente);
  }

  if (btnLimpar && btnLimpar.dataset.configurado !== 'sim') {
    btnLimpar.dataset.configurado = 'sim';
    btnLimpar.addEventListener('click', limparFormularioCliente);
  }

  if (btnAtualizar && btnAtualizar.dataset.configurado !== 'sim') {
    btnAtualizar.dataset.configurado = 'sim';
    btnAtualizar.textContent = 'Buscar';
    btnAtualizar.addEventListener('click', carregarClientes);
  }

  if (btnToggleLista && btnToggleLista.dataset.configurado !== 'sim') {
    btnToggleLista.dataset.configurado = 'sim';
    btnToggleLista.addEventListener('click', alternarListaClientesMobile);
  }

  [busca, buscaIdCliente].forEach(input => {
    if (!input || input.dataset.configurado === 'sim') return;
    input.dataset.configurado = 'sim';
    input.addEventListener('input', filtrarClientes);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        carregarClientes();
      }
    });
  });

  if (filtroStatus && filtroStatus.dataset.configurado !== 'sim') {
    filtroStatus.dataset.configurado = 'sim';
    filtroStatus.addEventListener('change', filtrarClientes);
  }

  if (filtroCategoria && filtroCategoria.dataset.configurado !== 'sim') {
    filtroCategoria.dataset.configurado = 'sim';
    filtroCategoria.addEventListener('change', filtrarClientes);
  }
}

function configurarFormularioMobileClientes() {
  aplicarEstadoFormularioMobile();

  const botao = document.getElementById('btn-toggle-form-cliente');

  if (botao && botao.dataset.configurado !== 'sim') {
    botao.dataset.configurado = 'sim';
    botao.addEventListener('click', alternarFormularioClienteMobile);
  }

  if (!window.__fsClientesResizeConfigurado) {
    window.__fsClientesResizeConfigurado = true;
    window.addEventListener('resize', aplicarEstadoFormularioMobile);
  }
}

function aplicarEstadoFormularioMobile() {
  const card = document.getElementById('card-form-cliente');
  const botao = document.getElementById('btn-toggle-form-cliente');

  if (!card || !botao) return;

  if (window.innerWidth <= 680) {
    card.classList.add('form-fechado');
    botao.textContent = 'Abrir';
    return;
  }

  card.classList.remove('form-fechado');
  botao.textContent = 'Aberto';
}

function alternarFormularioClienteMobile() {
  const card = document.getElementById('card-form-cliente');
  const botao = document.getElementById('btn-toggle-form-cliente');

  if (!card || !botao) return;

  const fechado = card.classList.toggle('form-fechado');
  botao.textContent = fechado ? 'Abrir' : 'Fechar';
}

function alternarListaClientesMobile() {
  const lista = document.getElementById('lista-clientes');
  const botao = document.getElementById('btn-toggle-lista-clientes');

  if (!lista || !botao) return;

  const fechada = lista.classList.toggle('lista-clientes-mobile-fechada');
  botao.textContent = fechada ? 'Ver clientes' : 'Ocultar clientes';
}

// ==================== NUMERAÇÃO ====================

function formatarNumeroCliente(clienteOuNumero) {
  const numero = typeof clienteOuNumero === 'object' ? clienteOuNumero?.numero_cliente : clienteOuNumero;
  const n = Number(numero);
  return Number.isFinite(n) && n > 0 ? String(Math.trunc(n)).padStart(6, '0') : '';
}

function obterCodigoClienteVisivel(cliente) {
  const numero = formatarNumeroCliente(cliente);
  return numero ? `CLI-${numero}` : 'Cliente sem número';
}

function normalizarBuscaCodigoCliente(valor) {
  const apenasNumeros = String(valor || '')
    .replace(/^cli[-\s]*/i, '')
    .replace(/\D/g, '');

  return apenasNumeros ? String(Number(apenasNumeros)) : '';
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
      .from('clientes')
      .select('numero_cliente')
      .eq('user_id', usuarioLogado.id)
      .not('numero_cliente', 'is', null)
      .order('numero_cliente', { ascending: false })
      .limit(1);

    if (error) return null;

    const ultimo = Array.isArray(data) && data[0]?.numero_cliente
      ? Number(data[0].numero_cliente)
      : 0;

    return ultimo + 1;
  } catch (_) {
    return null;
  }
}

// ==================== CRUD ====================

function prepararListaClientesVazia() {
  const container = document.getElementById('lista-clientes');
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
    limparMensagem('mensagem-clientes-lista');

    if (!usuarioLogado?.id) {
      const session = await obterSessaoAtual();
      if (!session) {
        redirecionarParaLogin();
        return;
      }
      usuarioLogado = session.user;
    }

    const { data, error } = await window._supabase
      .from('clientes')
      .select('*')
      .eq('user_id', usuarioLogado.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao carregar clientes:', error);
      mostrarMensagem(
        'mensagem-clientes-lista',
        'Não foi possível carregar os clientes. Verifique se a tabela clientes foi criada no Supabase.',
        'erro'
      );
      return;
    }

    clientesCache = Array.isArray(data) ? data : [];
    clientesCarregadosUmaVez = true;

    atualizarResumoClientes(clientesCache);
    renderizarClientes(clientesCache);
  } catch (erro) {
    console.error('Erro inesperado ao carregar clientes:', erro);
    mostrarMensagem('mensagem-clientes-lista', 'Erro inesperado ao carregar clientes.', 'erro');
  } finally {
    setLoadingClientes(false);
  }
}

async function salvarCliente(event) {
  event.preventDefault();

  const btnSalvar = document.getElementById('btn-salvar-cliente');

  try {
    limparMensagem('mensagem-clientes-form');

    const session = await obterSessaoAtual();
    if (!session) {
      redirecionarParaLogin();
      return;
    }

    usuarioLogado = session.user;

    const cliente = montarObjetoCliente();

    if (!cliente.nome) {
      mostrarMensagem('mensagem-clientes-form', 'Informe o nome do cliente.', 'erro');
      return;
    }

    alterarEstadoBotao(btnSalvar, true, 'Salvando...');

    const clienteId = valorInput('cliente-id');
    let resultado;

    if (clienteId) {
      resultado = await window._supabase
        .from('clientes')
        .update(cliente)
        .eq('id', clienteId)
        .eq('user_id', usuarioLogado.id)
        .select()
        .single();
    } else {
      const payloadNovoCliente = {
        ...cliente,
        user_id: usuarioLogado.id
      };

      const proximoNumeroCliente = await obterProximoNumeroCliente();
      if (proximoNumeroCliente) payloadNovoCliente.numero_cliente = proximoNumeroCliente;

      resultado = await window._supabase
        .from('clientes')
        .insert(payloadNovoCliente)
        .select()
        .single();

      if (resultado.error && erroCitaColuna(resultado.error, 'numero_cliente')) {
        delete payloadNovoCliente.numero_cliente;
        resultado = await window._supabase
          .from('clientes')
          .insert(payloadNovoCliente)
          .select()
          .single();
      }
    }

    if (resultado.error) {
      console.error('Erro ao salvar cliente:', resultado.error);
      mostrarMensagem('mensagem-clientes-form', 'Erro ao salvar cliente. Verifique os dados e tente novamente.', 'erro');
      return;
    }

    mostrarMensagem(
      'mensagem-clientes-form',
      clienteId ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
      'sucesso'
    );

    limparFormularioCliente({ manterMensagem: true });
    await carregarClientes();
  } catch (erro) {
    console.error('Erro inesperado ao salvar cliente:', erro);
    mostrarMensagem('mensagem-clientes-form', 'Erro inesperado ao salvar cliente.', 'erro');
  } finally {
    alterarEstadoBotao(btnSalvar, false, 'Salvar cliente');
  }
}

function montarObjetoCliente() {
  return {
    nome: valorInput('cliente-nome'),
    tipo_cliente: valorInput('cliente-tipo') || 'pessoa_fisica',
    cpf_cnpj: limparTexto(valorInput('cliente-cpf-cnpj')),
    whatsapp: limparTelefone(valorInput('cliente-whatsapp')),
    email: valorInput('cliente-email'),
    endereco: valorInput('cliente-endereco'),
    cidade: valorInput('cliente-cidade'),
    estado: valorInput('cliente-estado').toUpperCase(),
    cep: valorInput('cliente-cep'),
    status: valorInput('cliente-status') || 'ativo',
    categoria: valorInput('cliente-categoria') || 'normal',
    observacoes: valorInput('cliente-observacoes')
  };
}

function editarCliente(id) {
  const cliente = clientesCache.find(item => item.id === id);

  if (!cliente) {
    mostrarMensagem('mensagem-clientes-lista', 'Cliente não encontrado para edição.', 'erro');
    return;
  }

  preencherFormularioCliente(cliente);

  const titulo = document.getElementById('titulo-form-cliente');
  const btnSalvar = document.getElementById('btn-salvar-cliente');
  const formCard = document.getElementById('card-form-cliente');

  if (titulo) titulo.textContent = 'Editar cliente';
  if (btnSalvar) btnSalvar.textContent = 'Atualizar cliente';
  if (formCard) formCard.classList.remove('form-fechado');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function preencherFormularioCliente(cliente) {
  setValor('cliente-id', cliente.id);
  setValor('cliente-nome', cliente.nome);
  setValor('cliente-tipo', cliente.tipo_cliente || 'pessoa_fisica');
  setValor('cliente-cpf-cnpj', cliente.cpf_cnpj);
  setValor('cliente-whatsapp', cliente.whatsapp);
  setValor('cliente-email', cliente.email);
  setValor('cliente-endereco', cliente.endereco);
  setValor('cliente-cidade', cliente.cidade);
  setValor('cliente-estado', cliente.estado);
  setValor('cliente-cep', cliente.cep);
  setValor('cliente-status', cliente.status || 'ativo');
  setValor('cliente-categoria', cliente.categoria || 'normal');
  setValor('cliente-observacoes', cliente.observacoes);
}

async function excluirCliente(id) {
  const cliente = clientesCache.find(item => item.id === id);

  if (!cliente) {
    alert('Cliente não encontrado.');
    return;
  }

  if (!confirm(`Deseja realmente excluir o cliente ${cliente.nome || 'selecionado'}?`)) return;

  try {
    const { error } = await window._supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('user_id', usuarioLogado.id);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      mostrarMensagem(
        'mensagem-clientes-lista',
        'Não foi possível excluir o cliente. Verifique se ele possui registros vinculados.',
        'erro'
      );
      return;
    }

    mostrarMensagem('mensagem-clientes-lista', 'Cliente excluído com sucesso.', 'sucesso');
    await carregarClientes();
  } catch (erro) {
    console.error('Erro inesperado ao excluir cliente:', erro);
    mostrarMensagem('mensagem-clientes-lista', 'Erro inesperado ao excluir cliente.', 'erro');
  }
}

// ==================== RENDERIZAÇÃO ====================

function renderizarClientes(lista) {
  const container = document.getElementById('lista-clientes');
  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <strong>Nenhum cliente encontrado</strong>
        <p>${clientesCarregadosUmaVez ? 'Ajuste os filtros ou cadastre um novo cliente.' : 'Cadastre seu primeiro cliente usando o formulário ao lado.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map(criarCardCliente).join('');
}

function criarCardCliente(cliente) {
  const idSeguro = escaparHTML(cliente.id || '');
  const codigoCliente = escaparHTML(obterCodigoClienteVisivel(cliente));
  const nome = escaparHTML(cliente.nome || 'Cliente sem nome');
  const whatsapp = escaparHTML(formatarTelefoneVisual(cliente.whatsapp));
  const email = escaparHTML(cliente.email || '');
  const cidadeEstado = escaparHTML(montarCidadeEstado(cliente));
  const cpfCnpj = escaparHTML(cliente.cpf_cnpj || '');
  const status = cliente.status || 'ativo';
  const categoria = cliente.categoria || 'normal';
  const contato = [
    whatsapp ? `WhatsApp: ${whatsapp}` : '',
    email ? `E-mail: ${email}` : '',
    cpfCnpj ? `CPF/CNPJ: ${cpfCnpj}` : ''
  ].filter(Boolean).join(' • ');

  return `
    <article class="cliente-item" data-cliente-id="${idSeguro}">
      <div class="cliente-linha-topo cliente-card-abre-ficha" onclick="abrirFichaCliente('${idSeguro}')" title="Abrir histórico completo do cliente">
        <div class="cliente-info">
          <h3>${nome}</h3>
          <p>${contato || 'Sem contato cadastrado'}</p>
          ${cidadeEstado ? `<p>${cidadeEstado}</p>` : ''}
          <p class="cliente-id-linha"><strong>ID:</strong> ${codigoCliente}</p>
        </div>
      </div>

      <div class="cliente-tags">
        <span class="tag ${escaparHTML(status)}">${formatarStatus(status)}</span>
        <span class="tag ${escaparHTML(categoria)}">${formatarCategoria(categoria)}</span>
        <span class="tag">${formatarTipoCliente(cliente.tipo_cliente)}</span>
      </div>

      ${cliente.observacoes ? `<p class="cliente-observacoes">${escaparHTML(cliente.observacoes)}</p>` : ''}

      <div class="cliente-acoes">
        <button type="button" class="btn btn-primario btn-pequeno" onclick="abrirFichaCliente('${idSeguro}')">Ver histórico</button>
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="editarCliente('${idSeguro}')">Editar</button>
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="copiarIdCliente('${idSeguro}')">Copiar ID</button>
        <button type="button" class="btn btn-verde btn-pequeno" onclick="abrirWhatsAppCliente('${idSeguro}')">WhatsApp</button>
        <button type="button" class="btn btn-primario btn-pequeno" onclick="criarOrcamentoCliente('${idSeguro}')">Novo orçamento</button>
        <button type="button" class="btn btn-secundario btn-pequeno" onclick="criarOSCliente('${idSeguro}')">Nova OS</button>
        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirCliente('${idSeguro}')">Excluir</button>
      </div>
    </article>
  `;
}

// ==================== FILTROS E RESUMO ====================

function filtrarClientes() {
  const termo = normalizarTexto(valorInput('busca-clientes'));
  const termoId = normalizarTexto(valorInput('busca-id-cliente'));
  const status = valorInput('filtro-status-clientes');
  const categoria = valorInput('filtro-categoria-clientes');

  let listaFiltrada = [...clientesCache];

  if (termo) {
    listaFiltrada = listaFiltrada.filter(cliente => {
      const conteudo = [
        obterCodigoClienteVisivel(cliente),
        cliente.nome,
        cliente.whatsapp,
        cliente.email,
        cliente.cpf_cnpj,
        cliente.cidade,
        cliente.estado,
        cliente.observacoes
      ].filter(Boolean).join(' ');

      return normalizarTexto(conteudo).includes(termo);
    });
  }

  if (termoId) {
    listaFiltrada = listaFiltrada.filter(cliente =>
      clienteCombinaComCodigo(cliente, termoId) || normalizarTexto(cliente.id).includes(termoId)
    );
  }

  if (status) listaFiltrada = listaFiltrada.filter(cliente => cliente.status === status);
  if (categoria) listaFiltrada = listaFiltrada.filter(cliente => cliente.categoria === categoria);

  renderizarClientes(listaFiltrada);
}

function atualizarResumoClientes(lista) {
  const clientes = Array.isArray(lista) ? lista : [];

  setTexto('resumo-total-clientes', clientes.length);
  setTexto('resumo-clientes-ativos', clientes.filter(cliente => cliente.status === 'ativo').length);
  setTexto('resumo-clientes-preferenciais', clientes.filter(cliente => cliente.categoria === 'preferencial').length);
  setTexto('resumo-clientes-inativos', clientes.filter(cliente => cliente.status === 'inativo').length);
}

// ==================== AÇÕES ====================

function abrirFichaCliente(id) {
  if (!id) return;
  window.location.href = `cliente.html?id=${encodeURIComponent(id)}`;
}

function abrirWhatsAppCliente(id) {
  const cliente = clientesCache.find(item => item.id === id);

  if (!cliente) {
    alert('Cliente não encontrado.');
    return;
  }

  const telefone = limparTelefone(cliente.whatsapp);

  if (!telefone) {
    alert('Este cliente não possui WhatsApp cadastrado.');
    return;
  }

  const mensagem = `Olá, ${cliente.nome || 'cliente'}! Tudo bem? Aqui é da FS Orçamentos.`;
  const numeroBrasil = telefone.startsWith('55') ? telefone : `55${telefone}`;

  window.open(`https://wa.me/${numeroBrasil}?text=${encodeURIComponent(mensagem)}`, '_blank');
}

function criarOrcamentoCliente(id) {
  if (!clientesCache.find(item => item.id === id)) {
    alert('Cliente não encontrado.');
    return;
  }

  window.location.href = `gerador.html?cliente_id=${encodeURIComponent(id)}`;
}

function criarOSCliente(id) {
  if (!clientesCache.find(item => item.id === id)) {
    alert('Cliente não encontrado.');
    return;
  }

  window.location.href = `ordens.html?cliente_id=${encodeURIComponent(id)}`;
}

async function copiarIdCliente(id) {
  const cliente = clientesCache.find(item => item.id === id);
  const codigo = cliente ? obterCodigoClienteVisivel(cliente) : id;

  if (!codigo) {
    alert('ID do cliente não encontrado.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(codigo);
    } else {
      copiarTextoFallback(codigo);
    }

    mostrarMensagem('mensagem-clientes-lista', 'ID do cliente copiado com sucesso.', 'sucesso');
  } catch (_) {
    copiarTextoFallback(codigo);
    mostrarMensagem('mensagem-clientes-lista', 'ID do cliente copiado.', 'sucesso');
  }
}

function copiarTextoFallback(texto) {
  const textarea = document.createElement('textarea');
  textarea.value = texto;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// ==================== FORMULÁRIO ====================

function limparFormularioCliente(opcoes = {}) {
  const form = document.getElementById('form-cliente');
  if (form) form.reset();

  setValor('cliente-id', '');
  setValor('cliente-tipo', 'pessoa_fisica');
  setValor('cliente-status', 'ativo');
  setValor('cliente-categoria', 'normal');

  const titulo = document.getElementById('titulo-form-cliente');
  const btnSalvar = document.getElementById('btn-salvar-cliente');

  if (titulo) titulo.textContent = 'Novo cliente';
  if (btnSalvar) btnSalvar.textContent = 'Salvar cliente';

  if (!opcoes.manterMensagem) limparMensagem('mensagem-clientes-form');
}

// ==================== HELPERS ====================

function valorInput(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function setValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || '';
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(valor ?? '0');
}

function limparTexto(valor) {
  return String(valor || '').trim();
}

function limparTelefone(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function normalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function escaparHTML(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mostrarMensagem(id, mensagem, tipo = 'info') {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = mensagem || '';
  el.className = mensagem ? `mensagem-clientes ${tipo || 'info'}` : 'mensagem-clientes';
}

function limparMensagem(id) {
  mostrarMensagem(id, '', 'info');
}

function alterarEstadoBotao(btn, desabilitado, texto) {
  if (!btn) return;

  btn.disabled = !!desabilitado;
  if (texto) btn.textContent = texto;
}

function setLoadingClientes(carregando) {
  const btn = document.getElementById('btn-atualizar-clientes');
  const loading = document.getElementById('loading-clientes');

  if (btn) {
    btn.disabled = carregando;
    btn.textContent = carregando ? 'Buscando...' : 'Buscar';
  }

  if (loading) loading.classList.toggle('ativo', !!carregando);
}

function erroCitaColuna(error, coluna) {
  const texto = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  return texto.includes(String(coluna).toLowerCase());
}

function formatarTelefoneVisual(valor) {
  const telefone = limparTelefone(valor);

  if (!telefone) return '';
  if (telefone.length === 11) return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`;
  if (telefone.length === 10) return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 6)}-${telefone.slice(6)}`;

  return valor || '';
}

function montarCidadeEstado(cliente) {
  return [cliente.cidade, cliente.estado].filter(Boolean).join(' / ');
}

function formatarStatus(status) {
  const mapa = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    bloqueado: 'Bloqueado',
    inadimplente: 'Inadimplente'
  };

  return mapa[status] || status || 'Ativo';
}

function formatarCategoria(categoria) {
  const mapa = {
    normal: 'Normal',
    preferencial: 'Preferencial',
    vip: 'VIP',
    empresa: 'Empresa',
    recorrente: 'Recorrente'
  };

  return mapa[categoria] || categoria || 'Normal';
}

function formatarTipoCliente(tipo) {
  const mapa = {
    pessoa_fisica: 'Pessoa física',
    pessoa_juridica: 'Pessoa jurídica'
  };

  return mapa[tipo] || tipo || 'Pessoa física';
}

// ==================== EXPORTAÇÕES GLOBAIS ====================

Object.assign(window, {
  alternarListaClientesMobile,
  abrirFichaCliente,
  editarCliente,
  excluirCliente,
  abrirWhatsAppCliente,
  criarOrcamentoCliente,
  criarOSCliente,
  copiarIdCliente,
  carregarClientes
});
