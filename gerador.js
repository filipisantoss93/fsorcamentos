let perfilGeradorAtual = null;
let orcamentoSalvoAtualId = window.orcamentoAtualSalvoId || window.orcamentoSalvoAtualId || null;
let enviandoWhatsappFS = false;
let veiculosClienteOrcamentoCache = [];
let veiculoSelecionadoOrcamento = null;

function abrirModalLoginGerador() {
  const modal = document.getElementById('modal-login');
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');
  const form = document.getElementById('form-autenticacao');

  if (authArea) {
    authArea.style.display = 'block';
    authArea.style.visibility = 'visible';
    authArea.style.opacity = '1';
  }

  if (authContainer) {
    authContainer.style.display = 'block';
    authContainer.style.visibility = 'visible';
    authContainer.style.opacity = '1';
  }

  if (form) {
    form.style.display = 'block';
    form.style.visibility = 'visible';
    form.style.opacity = '1';
  }

  if (!modal) return;

  modal.style.display = 'flex';
  document.body.classList.add('login-modal-aberto');

  // Não travar o scroll do body aqui.
  // Em celular, o modal precisa rolar para mostrar o botão inferior
  // e o botão de reenviar e-mail de confirmação.
  document.body.style.overflow = '';

  setTimeout(() => {
    modal.scrollTop = 0;
    const email = document.getElementById('auth-email');
    if (email) email.focus({ preventScroll: true });
  }, 250);
}

function fecharModalLoginGerador() {
  const modal = document.getElementById('modal-login');

  if (!modal) return;

  modal.style.display = 'none';
  document.body.classList.remove('login-modal-aberto');
  document.body.style.overflow = '';
}

function abrirModalLogin() {
  abrirModalLoginGerador();
}

function fecharModalLogin() {
  fecharModalLoginGerador();
}

function fsNormalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fsPlanoAtualNormalizado() {
  return fsNormalizarTexto(localStorage.getItem('usuario_plano') || perfilGeradorAtual?.plano || 'gratis');
}

function fsPlanoPermiteSalvarOrcamento() {
  if (typeof podeSalvarOrcamentoNaNuvem === 'function') {
    return podeSalvarOrcamentoNaNuvem();
  }

  const plano = fsPlanoAtualNormalizado();
  return plano === 'basico' || plano === 'premium';
}

function fsPlanoPermiteRecursosPremiumGerador() {
  if (typeof podeUsarPremium === 'function') {
    return podeUsarPremium();
  }

  return fsPlanoAtualNormalizado() === 'premium';
}

function aplicarLimitesPlanoGerador() {
  const premium = fsPlanoPermiteRecursosPremiumGerador();

  const idsPremium = [
    'orcamento-cliente-id',
    'cliente-id-cadastrado',
    'orcamento-veiculo-id',
    'cliente-vinculado-card',
    'aviso-veiculo-orcamento'
  ];

  idsPremium.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const wrapper = el.closest('.cliente-id-acoes') || el.closest('.campo-form') || el.closest('.cliente-vinculado-card') || el;
    if (wrapper) wrapper.style.display = premium ? '' : 'none';
  });

  document.querySelectorAll('.btn-buscar-cliente-id, .btn-limpar-cliente-id, [data-fs-veiculo-orcamento="true"]').forEach(el => {
    el.style.display = premium ? '' : 'none';
  });
}

function fsPlanoLabel(plano) {
  const p = fsNormalizarTexto(plano);

  if (p === 'basico') return 'Plano Básico';
  if (p === 'premium') return 'Plano Premium';

  return 'Plano Grátis';
}

function fsValorOuTraco(valor) {
  return valor && String(valor).trim() ? String(valor).trim() : '-';
}


function fsObterParametroURL(nome) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}

function fsSetValorCampo(id, valor) {
  const campo = document.getElementById(id);

  if (!campo) return;

  campo.value = valor || '';
}

function fsAtualizarClienteVinculadoCard(cliente) {
  const card = document.getElementById('cliente-vinculado-card');
  const texto = document.getElementById('cliente-vinculado-texto');

  if (!card || !texto) return;

  if (!cliente) {
    card.classList.remove('ativo');
    texto.innerText = 'Nenhum cliente vinculado.';
    return;
  }

  const partes = [
    cliente.nome ? `Nome: ${cliente.nome}` : '',
    cliente.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : '',
    cliente.email ? `E-mail: ${cliente.email}` : '',
    cliente.cpf_cnpj ? `CPF/CNPJ: ${cliente.cpf_cnpj}` : '',
    cliente.id ? `ID: ${cliente.id}` : ''
  ].filter(Boolean);

  texto.innerText = partes.join(' • ');
  card.classList.add('ativo');
}


function fsMostrarCardVeiculoOrcamento(veiculo) {
  const card = document.getElementById('veiculo-vinculado-card');
  const texto = document.getElementById('veiculo-vinculado-texto');

  if (!card || !texto) return;

  if (!veiculo) {
    card.classList.remove('ativo');
    texto.innerText = 'Nenhum veículo selecionado.';
    return;
  }

  texto.innerText = fsFormatarVeiculoResumoOrcamento(veiculo);
  card.classList.add('ativo');
}

function fsFormatarVeiculoResumoOrcamento(veiculo) {
  if (!veiculo) return '';

  const partes = [
    veiculo.placa ? `Placa: ${veiculo.placa}` : '',
    veiculo.marca ? `Marca: ${veiculo.marca}` : '',
    veiculo.modelo ? `Modelo: ${veiculo.modelo}` : '',
    veiculo.cor ? `Cor: ${veiculo.cor}` : '',
    veiculo.prisma ? `Prisma: ${veiculo.prisma}` : '',
    veiculo.ano ? `Ano: ${veiculo.ano}` : '',
    veiculo.chassi ? `Chassi: ${veiculo.chassi}` : ''
  ].filter(Boolean);

  return partes.join(' • ') || 'Veículo sem dados detalhados.';
}

function fsRenderizarSelectVeiculosOrcamento(lista, selecionado = '') {
  const select = document.getElementById('orcamento-veiculo-id');
  const aviso = document.getElementById('aviso-veiculo-orcamento');

  if (!select) return;

  const veiculos = Array.isArray(lista) ? lista : [];

  if (!veiculos.length) {
    select.innerHTML = '<option value="">Nenhum veículo cadastrado para este cliente</option>';
    select.disabled = true;
    if (aviso) aviso.innerText = 'Cadastre veículos na página Veículos ou gere o orçamento sem vínculo de veículo.';
    veiculoSelecionadoOrcamento = null;
    fsMostrarCardVeiculoOrcamento(null);
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">Selecione o veículo do cliente</option>
    ${veiculos.map(veiculo => {
      const resumo = [veiculo.placa, veiculo.marca, veiculo.modelo, veiculo.cor].filter(Boolean).join(' - ');
      return `<option value="${fsEscapeHTML(veiculo.id)}">${fsEscapeHTML(resumo || 'Veículo sem identificação')}</option>`;
    }).join('')}
  `;

  if (selecionado) {
    select.value = selecionado;
  }

  const veiculoAtual = veiculos.find(v => v.id === select.value) || null;
  veiculoSelecionadoOrcamento = veiculoAtual;
  fsMostrarCardVeiculoOrcamento(veiculoAtual);

  if (aviso) {
    aviso.innerText = 'O veículo selecionado será salvo no orçamento e usado ao gerar a OS.';
  }
}

async function fsCarregarVeiculosDoClienteOrcamento(clienteId, veiculoPreSelecionado = '') {
  const id = String(clienteId || '').trim();

  veiculosClienteOrcamentoCache = [];
  veiculoSelecionadoOrcamento = null;
  fsRenderizarSelectVeiculosOrcamento([], '');

  if (!id || !window._supabase) return;

  const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

  if (sessionError || !session?.user?.id) return;

  const { data, error } = await _supabase
    .from('veiculos')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('cliente_id', id)
    .eq('ativo', true)
    .order('placa', { ascending: true });

  if (error) {
    console.error('Erro ao carregar veículos do cliente:', error);
    const aviso = document.getElementById('aviso-veiculo-orcamento');
    if (aviso) aviso.innerText = 'Não foi possível carregar os veículos deste cliente.';
    return;
  }

  veiculosClienteOrcamentoCache = Array.isArray(data) ? data : [];

  const veiculoURL = fsObterParametroURL('veiculo_id') || localStorage.getItem('orcamento_veiculo_id') || '';
  fsRenderizarSelectVeiculosOrcamento(veiculosClienteOrcamentoCache, veiculoPreSelecionado || veiculoURL);
}

function fsSelecionarVeiculoNoOrcamento() {
  const select = document.getElementById('orcamento-veiculo-id');
  const id = select?.value || '';

  veiculoSelecionadoOrcamento = veiculosClienteOrcamentoCache.find(v => v.id === id) || null;
  fsMostrarCardVeiculoOrcamento(veiculoSelecionadoOrcamento);

  try {
    if (id) localStorage.setItem('orcamento_veiculo_id', id);
    else localStorage.removeItem('orcamento_veiculo_id');
  } catch (error) {
    console.warn('Não foi possível salvar veiculo_id localmente:', error);
  }

  if (typeof salvarEstadoCompleto === 'function') salvarEstadoCompleto();
  if (typeof autoUpdatePreview === 'function') autoUpdatePreview();
}

function fsLimparVeiculoOrcamento() {
  const select = document.getElementById('orcamento-veiculo-id');
  if (select) {
    select.innerHTML = '<option value="">Selecione primeiro um cliente cadastrado</option>';
    select.disabled = true;
  }

  veiculosClienteOrcamentoCache = [];
  veiculoSelecionadoOrcamento = null;
  fsMostrarCardVeiculoOrcamento(null);

  const aviso = document.getElementById('aviso-veiculo-orcamento');
  if (aviso) aviso.innerText = 'Selecione um cliente cadastrado para carregar os veículos dele.';

  try {
    localStorage.removeItem('orcamento_veiculo_id');
  } catch (error) {
    console.warn('Não foi possível limpar veiculo_id localmente:', error);
  }
}

function fsInserirVeiculoNaPreviaOrcamento() {
  if (!veiculoSelecionadoOrcamento) return;

  const conteudo = document.getElementById('conteudo-pdf');
  if (!conteudo || !conteudo.innerHTML.trim()) return;

  if (conteudo.querySelector('[data-fs-veiculo-orcamento="true"]')) return;

  const caixa = document.createElement('div');
  caixa.setAttribute('data-fs-veiculo-orcamento', 'true');
  caixa.style.margin = '12px 0';
  caixa.style.padding = '10px 12px';
  caixa.style.border = '1px solid #d7ccc8';
  caixa.style.borderLeft = '5px solid #ffc400';
  caixa.style.borderRadius = '10px';
  caixa.style.background = '#fffaf0';
  caixa.style.color = '#3e2723';
  caixa.style.fontFamily = 'Arial, Helvetica, sans-serif';
  caixa.innerHTML = `
    <strong style="display:block; font-size:13px; margin-bottom:4px; color:#3e2723;">Veículo</strong>
    <span style="display:block; font-size:12px; line-height:1.45; color:#5d4037;">${fsEscapeHTML(fsFormatarVeiculoResumoOrcamento(veiculoSelecionadoOrcamento))}</span>
  `;

  const folha = conteudo.firstElementChild || conteudo;
  const referencia = folha.querySelector('table') || folha.firstElementChild;

  if (referencia && referencia.parentNode) {
    referencia.parentNode.insertBefore(caixa, referencia.nextSibling);
  } else {
    folha.insertBefore(caixa, folha.firstChild);
  }
}

function fsAplicarClienteNoOrcamento(cliente) {
  if (!cliente) return;

  fsSetValorCampo('cliente-id-cadastrado', cliente.id || '');
  fsSetValorCampo('orcamento-cliente-id', cliente.id || '');
  fsSetValorCampo('cliente', cliente.nome || '');
  fsSetValorCampo('tel-cliente', cliente.whatsapp || '');

  fsAtualizarClienteVinculadoCard(cliente);
  fsCarregarVeiculosDoClienteOrcamento(cliente.id || '');

  try {
    localStorage.setItem('orcamento_cliente_id', cliente.id || '');
  } catch (error) {
    console.warn('Não foi possível salvar cliente_id localmente:', error);
  }

  if (typeof salvarEstadoCompleto === 'function') {
    salvarEstadoCompleto();
  }

  if (typeof autoUpdatePreview === 'function') {
    autoUpdatePreview();
  }
}

async function fsBuscarClientePorId(clienteId) {
  const id = String(clienteId || '').trim();

  if (!id) {
    alert('Informe o ID do cliente cadastrado.');
    return null;
  }

  if (!window._supabase) {
    alert('Supabase não inicializado. Verifique o config.js.');
    return null;
  }

  const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    alert('Você precisa estar logado para buscar o cliente.');
    return null;
  }

  const { data, error } = await _supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar cliente por ID:', error);
    alert('Erro ao buscar cliente. Verifique o ID e tente novamente.');
    return null;
  }

  if (!data) {
    alert('Cliente não encontrado para este usuário.');
    return null;
  }

  return data;
}

async function buscarClientePorIdNoOrcamento() {
  const clienteId = document.getElementById('orcamento-cliente-id')?.value?.trim() || '';
  const cliente = await fsBuscarClientePorId(clienteId);

  if (!cliente) return;

  fsAplicarClienteNoOrcamento(cliente);
}

function abrirModalBuscaClienteOrcamento() {
  if (!fsPlanoPermiteRecursosPremiumGerador()) {
    alert('O cadastro/busca de clientes é exclusivo do Plano Premium. No Básico, preencha o nome e WhatsApp do cliente manualmente.');
    return;
  }
  const modal = document.getElementById('modal-busca-cliente-orcamento');
  const campo = document.getElementById('campo-busca-cliente-orcamento');
  const resultado = document.getElementById('resultado-busca-clientes-orcamento');

  if (!modal) return;

  modal.classList.add('ativo');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-busca-cliente-aberto');

  if (resultado) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Digite uma informação do cliente e clique em Buscar.
      </div>
    `;
  }

  setTimeout(() => {
    if (campo) {
      campo.focus();
      campo.select();
    }
  }, 120);
}

function fecharModalBuscaClienteOrcamento() {
  const modal = document.getElementById('modal-busca-cliente-orcamento');

  if (!modal) return;

  modal.classList.remove('ativo');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-busca-cliente-aberto');
}

function fsEscaparBuscaSupabase(valor) {
  return String(valor || '')
    .replace(/[%_]/g, '')
    .replace(/[(),]/g, ' ')
    .trim();
}

function fsTextoClienteBusca(cliente) {
  return [
    cliente.nome,
    cliente.whatsapp,
    cliente.telefone,
    cliente.email,
    cliente.cpf_cnpj,
    cliente.endereco,
    cliente.cidade,
    cliente.estado,
    cliente.cep,
    cliente.observacoes
  ].filter(Boolean).join(' ');
}

async function buscarClientesNoModalOrcamento() {
  const campo = document.getElementById('campo-busca-cliente-orcamento');
  const resultado = document.getElementById('resultado-busca-clientes-orcamento');
  const termoOriginal = campo?.value?.trim() || '';
  const termo = fsEscaparBuscaSupabase(termoOriginal);

  if (!resultado) return;

  if (termo.length < 2) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Digite pelo menos 2 caracteres para buscar por nome, telefone, rua, cidade ou CEP.
      </div>
    `;
    return;
  }

  if (!window._supabase) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Supabase não inicializado. Verifique o config.js.
      </div>
    `;
    return;
  }

  resultado.innerHTML = `
    <div class="estado-busca-cliente">
      Buscando clientes...
    </div>
  `;

  const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Você precisa estar logado para buscar clientes.
      </div>
    `;
    return;
  }

  const termoNumerico = String(termoOriginal).replace(/\D/g, '');
  const filtros = [
    `nome.ilike.%${termo}%`,
    `whatsapp.ilike.%${termo}%`,
    `email.ilike.%${termo}%`,
    `cpf_cnpj.ilike.%${termo}%`,
    `endereco.ilike.%${termo}%`,
    `cidade.ilike.%${termo}%`,
    `estado.ilike.%${termo}%`,
    `cep.ilike.%${termo}%`
  ];

  if (termoNumerico.length >= 2) {
    filtros.push(`whatsapp.ilike.%${termoNumerico}%`);
    filtros.push(`cep.ilike.%${termoNumerico}%`);
    filtros.push(`cpf_cnpj.ilike.%${termoNumerico}%`);
  }

  const { data, error } = await _supabase
    .from('clientes')
    .select('id, nome, whatsapp, email, cpf_cnpj, endereco, cidade, estado, cep, status')
    .eq('user_id', session.user.id)
    .or(filtros.join(','))
    .order('nome', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Erro ao buscar clientes no modal:', error);
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Erro ao buscar clientes. Verifique se a tabela clientes possui os campos nome, whatsapp, endereco, cidade e cep.
      </div>
    `;
    return;
  }

  const termoNormalizado = fsNormalizarTexto(termoOriginal);
  const clientes = Array.isArray(data) ? data.filter((cliente) => {
    return fsNormalizarTexto(fsTextoClienteBusca(cliente)).includes(termoNormalizado) ||
      (termoNumerico && fsTextoClienteBusca(cliente).replace(/\D/g, '').includes(termoNumerico));
  }) : [];

  renderizarResultadoBuscaClientesOrcamento(clientes);
}

function renderizarResultadoBuscaClientesOrcamento(clientes) {
  const resultado = document.getElementById('resultado-busca-clientes-orcamento');

  if (!resultado) return;

  if (!clientes || clientes.length === 0) {
    resultado.innerHTML = `
      <div class="estado-busca-cliente">
        Nenhum cliente encontrado. Tente buscar por outro nome, telefone, rua, cidade ou CEP.
      </div>
    `;
    return;
  }

  resultado.innerHTML = clientes.map((cliente) => criarItemClienteBuscaOrcamento(cliente)).join('');
}

function criarItemClienteBuscaOrcamento(cliente) {
  const id = fsEscapeHTML(cliente.id || '');
  const nome = fsEscapeHTML(cliente.nome || 'Cliente sem nome');
  const telefone = fsEscapeHTML(cliente.whatsapp || '');
  const endereco = fsEscapeHTML([
    cliente.endereco,
    cliente.cidade,
    cliente.estado,
    cliente.cep ? `CEP: ${cliente.cep}` : ''
  ].filter(Boolean).join(' - '));

  const contato = [
    telefone ? `Telefone: ${telefone}` : '',
    cliente.email ? `E-mail: ${fsEscapeHTML(cliente.email)}` : '',
    cliente.cpf_cnpj ? `CPF/CNPJ: ${fsEscapeHTML(cliente.cpf_cnpj)}` : ''
  ].filter(Boolean).join(' • ');

  return `
    <button type="button" class="cliente-busca-item" onclick="selecionarClienteBuscaOrcamento('${id}')">
      <strong>${nome}</strong>
      <span>${contato || 'Sem telefone cadastrado'}</span>
      <span>${endereco || 'Sem endereço cadastrado'}</span>
      <span>ID: ${id}</span>
    </button>
  `;
}

async function selecionarClienteBuscaOrcamento(clienteId) {
  const cliente = await fsBuscarClientePorId(clienteId);

  if (!cliente) return;

  fsAplicarClienteNoOrcamento(cliente);
  fecharModalBuscaClienteOrcamento();
}

function fsEscapeHTML(valor) {
  return String(valor || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function limparClienteVinculadoNoOrcamento() {
  fsSetValorCampo('cliente-id-cadastrado', '');
  fsSetValorCampo('orcamento-cliente-id', '');
  fsAtualizarClienteVinculadoCard(null);
  fsLimparVeiculoOrcamento();

  try {
    localStorage.removeItem('orcamento_cliente_id');
    localStorage.removeItem('orcamento_veiculo_id');
  } catch (error) {
    console.warn('Não foi possível remover cliente_id local:', error);
  }

  if (typeof salvarEstadoCompleto === 'function') {
    salvarEstadoCompleto();
  }
}

async function fsCarregarClienteDaURL() {
  const clienteIdURL = fsObterParametroURL('cliente_id');

  if (!clienteIdURL) {
    const clienteIdCampo = document.getElementById('orcamento-cliente-id')?.value?.trim();
    const clienteIdHidden = document.getElementById('cliente-id-cadastrado')?.value?.trim();
    const clienteIdLocal = localStorage.getItem('orcamento_cliente_id') || '';
    const idExistente = clienteIdCampo || clienteIdHidden || clienteIdLocal;

    if (idExistente) {
      fsSetValorCampo('orcamento-cliente-id', idExistente);
      fsSetValorCampo('cliente-id-cadastrado', idExistente);
    }

    return;
  }

  fsSetValorCampo('orcamento-cliente-id', clienteIdURL);
  fsSetValorCampo('cliente-id-cadastrado', clienteIdURL);

  const cliente = await fsBuscarClientePorId(clienteIdURL);

  if (cliente) {
    fsAplicarClienteNoOrcamento(cliente);
  }
}

function fsAtualizarTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.innerText = fsValorOuTraco(valor);
}

function fsAtualizarLogo(url) {
  const img = document.getElementById('emissor-logo-visual');
  const placeholder = document.getElementById('emissor-logo-placeholder');

  if (!img || !placeholder) return;

  if (url) {
    img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  }
}

function fsPerfilCompleto(perfil) {
  return !!(perfil?.nome_empresa && perfil?.telefone_empresa);
}

function fsAtualizarAvisoPerfil(perfil) {
  const aviso = document.getElementById('aviso-perfil-incompleto');

  if (!aviso) return;

  aviso.style.display = fsPerfilCompleto(perfil) ? 'none' : 'block';
}

function fsPreencherTopoEmpresa(perfil) {
  perfilGeradorAtual = perfil || {};

  fsAtualizarTexto('emissor-consultor-visual', perfilGeradorAtual.nome);
  fsAtualizarTexto('emissor-empresa-visual', perfilGeradorAtual.nome_empresa);
  fsAtualizarTexto('emissor-whatsapp-visual', perfilGeradorAtual.telefone_empresa);
  fsAtualizarTexto('emissor-cnpj-visual', perfilGeradorAtual.cnpj_empresa);
  fsAtualizarTexto('emissor-endereco-visual', perfilGeradorAtual.endereco_empresa);
  fsAtualizarTexto('emissor-plano-visual', fsPlanoLabel(perfilGeradorAtual.plano));
  fsAtualizarLogo(perfilGeradorAtual.foto_url);

  fsAtualizarAvisoPerfil(perfilGeradorAtual);
}

async function fsBuscarPerfilUsuario(session) {
  if (!window._supabase || !session?.user?.id) return null;

  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }

  if (data) {
    localStorage.setItem('usuario_nome', data.nome || data.nome_empresa || session.user.email?.split('@')[0] || 'Usuário');
    localStorage.setItem('usuario_plano', data.plano || 'gratis');
    localStorage.setItem('nome_empresa', data.nome_empresa || '');
    localStorage.setItem('telefone_empresa', data.telefone_empresa || '');
    localStorage.setItem('endereco_empresa', data.endereco_empresa || '');
    localStorage.setItem('cnpj_empresa', data.cnpj_empresa || '');

    if (data.foto_url) {
      localStorage.setItem('foto_url', data.foto_url);
    } else {
      localStorage.removeItem('foto_url');
    }
  }

  return data;
}

function fsPerfilLocalFallback() {
  return {
    nome: localStorage.getItem('usuario_nome') || '',
    nome_empresa: localStorage.getItem('nome_empresa') || '',
    telefone_empresa: localStorage.getItem('telefone_empresa') || '',
    endereco_empresa: localStorage.getItem('endereco_empresa') || '',
    cnpj_empresa: localStorage.getItem('cnpj_empresa') || '',
    foto_url: localStorage.getItem('foto_url') || '',
    plano: localStorage.getItem('usuario_plano') || 'gratis'
  };
}

async function fsVerificarSessaoGerador() {
  const conteudo = document.getElementById('conteudo-gerador');
  const statusCard = document.getElementById('status-sessao-card');

  if (statusCard) {
    statusCard.style.display = 'block';
    statusCard.innerText = 'Carregando seus dados...';
  }

  try {
    if (!window._supabase) {
      if (conteudo) conteudo.style.display = 'none';

      setTimeout(() => {
        abrirModalLoginGerador();
      }, 300);

      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) {
      if (conteudo) conteudo.style.display = 'none';

      setTimeout(() => {
        abrirModalLoginGerador();
      }, 300);

      return;
    }

    fecharModalLoginGerador();

    if (conteudo) conteudo.style.display = 'block';

    const perfilBanco = await fsBuscarPerfilUsuario(session);
    const perfil = perfilBanco || fsPerfilLocalFallback();

    fsPreencherTopoEmpresa(perfil);

    if (statusCard) {
      statusCard.style.display = fsPerfilCompleto(perfil) ? 'none' : 'block';
      statusCard.innerHTML = fsPerfilCompleto(perfil)
        ? ''
        : 'Complete os dados da empresa no Painel de Controle para deixar o PDF profissional.';
    }

    if (typeof carregarEstadoSalvo === 'function') {
      carregarEstadoSalvo();
    }

    await fsCarregarClienteDaURL();

    setTimeout(() => {
      const linhas = document.querySelectorAll('#itens-lista .item-row:not(.header-labels)');

      if (!linhas.length && typeof adicionarLinha === 'function') {
        adicionarLinha();
      }
    }, 400);

    fsAtualizarAnunciosGratisGerador();

  } catch (error) {
    console.error('Erro ao verificar sessão:', error);

    if (conteudo) conteudo.style.display = 'none';

    setTimeout(() => {
      abrirModalLoginGerador();
    }, 300);
  }
}

function fsLimparTelefoneWhatsapp(valor) {
  let telefone = String(valor || '').replace(/\D/g, '');

  if (!telefone) return '';

  if (telefone.startsWith('00')) {
    telefone = telefone.substring(2);
  }

  if (telefone.length === 10 || telefone.length === 11) {
    telefone = '55' + telefone;
  }

  return telefone;
}

function fsValorNumerico(valor) {
  if (typeof valor === 'number') return valor;

  let texto = String(valor || '').trim();

  if (!texto) return 0;

  texto = texto
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function fsColetarItensParaSalvar() {
  const itens = [];

  document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(row => {
    const inputs = Array.from(row.querySelectorAll('input'));

    if (!inputs.length) return;

    const descricao =
      row.querySelector('.desc-cell')?.value?.trim() ||
      row.querySelector('.desc')?.value?.trim() ||
      inputs[0]?.value?.trim() ||
      '';

    const inputQtd = row.querySelector('.qtd') || inputs[1];
    const inputValor = row.querySelector('.valor') || inputs[2];
    const inputSubtotal = row.querySelector('.subtotal') || inputs[3];

    const qtd = fsValorNumerico(inputQtd?.value ?? 1);
    const valor = fsValorNumerico(inputValor?.value ?? 0);

    let subtotal = fsValorNumerico(inputSubtotal?.value);

    if (!subtotal) {
      subtotal = qtd * valor;
    }

    if (descricao) {
      itens.push({
        descricao,
        qtd,
        valor,
        subtotal
      });
    }
  });

  return itens;
}

function fsColetarDadosOrcamentoAtual() {
  const titulo = document.getElementById('titulo')?.value?.trim() || 'Sem título';
  const premium = fsPlanoPermiteRecursosPremiumGerador();
  const clienteId = premium
    ? (document.getElementById('cliente-id-cadastrado')?.value?.trim() ||
      document.getElementById('orcamento-cliente-id')?.value?.trim() || '')
    : '';
  const clienteNome = document.getElementById('cliente')?.value?.trim() || '';
  const clienteWhatsapp = document.getElementById('tel-cliente')?.value?.trim() || '';
  const veiculoId = premium ? (document.getElementById('orcamento-veiculo-id')?.value?.trim() || '') : '';
  const observacoes = document.getElementById('observacoes')?.value?.trim() || '';
  const tema = document.getElementById('selected-theme')?.value || 'original';

  const itens = fsColetarItensParaSalvar();
  const total = itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0);

  return {
    titulo,
    clienteId,
    clienteNome,
    clienteWhatsapp,
    veiculoId,
    veiculo: veiculoSelecionadoOrcamento,
    observacoes,
    tema,
    itens,
    total
  };
}

async function fsSalvarOrcamentoSePlanoPermitido(origem = 'acao') {
  if (!fsPlanoPermiteSalvarOrcamento()) {
    console.log('Plano grátis: orçamento não salvo na nuvem.');
    return null;
  }

  if (!window._supabase) {
    console.warn('Supabase não disponível. Orçamento não salvo.');
    return null;
  }

  const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    console.warn('Usuário não logado. Orçamento não salvo.');
    return null;
  }

  const dados = fsColetarDadosOrcamentoAtual();

  if (!dados.clienteNome) {
    console.warn('Cliente não informado. Orçamento não salvo.');
    return null;
  }

  if (!dados.itens.length) {
    console.warn('Nenhum item informado. Orçamento não salvo.');
    return null;
  }

  const consultor =
    localStorage.getItem('responsavel_selecionado_nome') ||
    localStorage.getItem('consultor_selecionado_nome') ||
    perfilGeradorAtual?.nome ||
    localStorage.getItem('usuario_nome') ||
    'Consultor';

  const payloadBase = {
    usuario_id: session.user.id,
    cliente_id: dados.clienteId || null,
    veiculo_id: dados.veiculoId || null,
    assunto: dados.titulo,
    cliente_nome: dados.clienteNome,
    cliente_whatsapp: dados.clienteWhatsapp,
    observacoes: dados.observacoes,
    itens: dados.itens,
    total: dados.total,
    status: 'pendente',
    consultor
  };

  const payloadCompleto = {
    ...payloadBase,
    origem_salvamento: origem,
    tema_pdf: dados.tema
  };

  let resposta;

  if (orcamentoSalvoAtualId) {
    resposta = await _supabase
      .from('orcamentos')
      .update(payloadCompleto)
      .eq('id', orcamentoSalvoAtualId)
      .eq('usuario_id', session.user.id)
      .select()
      .single();
  } else {
    resposta = await _supabase
      .from('orcamentos')
      .insert(payloadCompleto)
      .select()
      .single();
  }

  if (resposta.error) {
    const mensagemErro = String(resposta.error.message || '');

    if (
      mensagemErro.includes('veiculo_id') ||
      mensagemErro.includes('cliente_id') ||
      mensagemErro.includes('origem_salvamento') ||
      mensagemErro.includes('tema_pdf') ||
      mensagemErro.includes('observacoes') ||
      mensagemErro.includes('consultor')
    ) {
      const payloadMinimo = {
        usuario_id: session.user.id,
        assunto: dados.titulo,
        cliente_nome: dados.clienteNome,
        cliente_whatsapp: dados.clienteWhatsapp,
        itens: dados.itens,
        total: dados.total,
        status: 'pendente'
      };

      if (orcamentoSalvoAtualId) {
        resposta = await _supabase
          .from('orcamentos')
          .update(payloadMinimo)
          .eq('id', orcamentoSalvoAtualId)
          .eq('usuario_id', session.user.id)
          .select()
          .single();
      } else {
        resposta = await _supabase
          .from('orcamentos')
          .insert(payloadMinimo)
          .select()
          .single();
      }
    }
  }

  if (resposta.error) {
    console.error('Erro ao salvar orçamento:', resposta.error);
    alert('Não foi possível salvar o orçamento na nuvem. O PDF continuará funcionando.');
    return null;
  }

  orcamentoSalvoAtualId = resposta.data.id;
  window.orcamentoAtualSalvoId = resposta.data.id;
  window.orcamentoSalvoAtualId = resposta.data.id;

  if (typeof definirOrcamentoAtualSalvo === 'function') {
    definirOrcamentoAtualSalvo(resposta.data.id);
  }

  return resposta.data;
}

function fsNomeArquivoSeguro(valor) {
  return String(valor || 'orcamento')
    .trim()
    .replace(/[^\wÀ-ÿ\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase() || 'orcamento';
}

async function fsAguardarRenderizacaoPDF(container) {
  return new Promise(resolve => {
    const imagens = Array.from(container.querySelectorAll('img'));

    if (!imagens.length) {
      requestAnimationFrame(() => setTimeout(resolve, 500));
      return;
    }

    let finalizadas = 0;

    function finalizar() {
      finalizadas += 1;

      if (finalizadas >= imagens.length) {
        requestAnimationFrame(() => setTimeout(resolve, 500));
      }
    }

    imagens.forEach(img => {
      if (img.complete) {
        finalizar();
      } else {
        img.onload = finalizar;
        img.onerror = finalizar;
      }
    });
  });
}

async function fsBaixarPDFCorrigido() {
  const conteudoPdf = document.getElementById('conteudo-pdf');

  if (!conteudoPdf) {
    alert('Área do PDF não encontrada.');
    return;
  }

  if (!conteudoPdf.innerHTML.trim()) {
    if (typeof gerarPrevia === 'function') {
      await gerarPrevia();
    }
  }

  if (!conteudoPdf.innerHTML.trim()) {
    alert('Gere a pré-visualização antes de baixar o PDF.');
    return;
  }

  await fsSalvarOrcamentoSePlanoPermitido('download_pdf');

  const folha = conteudoPdf.firstElementChild || conteudoPdf;
  const nomeArquivo = fsNomeArquivoSeguro(document.getElementById('titulo')?.value || 'orcamento');

  document.body.classList.add('gerando-pdf');

  await fsAguardarRenderizacaoPDF(folha);

  const opt = {
    margin: 0,
    filename: `${nomeArquivo}.pdf`,
    image: {
      type: 'jpeg',
      quality: 0.98
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: 1123
    },
    jsPDF: {
      unit: 'px',
      format: [794, 1123],
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  };

  try {
    await html2pdf()
      .set(opt)
      .from(folha)
      .save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Não foi possível gerar o PDF.');
  } finally {
    document.body.classList.remove('gerando-pdf');
  }
}

function montarMensagemWhatsappCliente(clienteNome, linkOrcamento, veiculo = null) {
  const nome = clienteNome && String(clienteNome).trim()
    ? String(clienteNome).trim()
    : 'cliente';

  const textoVeiculo = veiculo ? `\n\nVeículo: ${fsFormatarVeiculoResumoOrcamento(veiculo)}` : '';

  return `Olá, ${nome}! Tudo bem?

Seu orçamento está pronto para visualização.

Acesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:

${linkOrcamento}${textoVeiculo}

Qualquer dúvida, estou à disposição.`;
}

async function enviarPorWhatsApp() {
  if (enviandoWhatsappFS) return;

  enviandoWhatsappFS = true;

  const botoesWhatsapp = document.querySelectorAll('.btn-whatsapp, .btn-acao-whatsapp, .btn-float-whatsapp');

  botoesWhatsapp.forEach(btn => {
    btn.disabled = true;
  });

  try {
    if (!fsPlanoPermiteSalvarOrcamento()) {
      alert('O envio por WhatsApp com link está disponível no Plano Básico.');
      return;
    }

    const dados = fsColetarDadosOrcamentoAtual();
    const telefoneLimpo = fsLimparTelefoneWhatsapp(dados.clienteWhatsapp);

    if (!dados.clienteNome) {
      alert('Informe o nome do cliente.');
      return;
    }

    if (!telefoneLimpo) {
      alert('Informe o WhatsApp do cliente.');
      return;
    }

    if (!dados.itens.length) {
      alert('Adicione pelo menos um item ao orçamento.');
      return;
    }

    const orcamentoSalvo = await fsSalvarOrcamentoSePlanoPermitido('whatsapp_manual');

    const linkOrcamento = orcamentoSalvo?.id
      ? `${window.location.origin}/ver.html?id=${orcamentoSalvo.id}`
      : '';

    if (!linkOrcamento) {
      alert('Não foi possível gerar o link do orçamento. O orçamento precisa ser salvo na nuvem.');
      return;
    }

    const mensagem = montarMensagemWhatsappCliente(dados.clienteNome, linkOrcamento, dados.veiculo);
    const urlWhatsapp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    const janela = window.open(urlWhatsapp, 'fsorcamentos_whatsapp');

    if (!janela) {
      alert('O navegador bloqueou a abertura do WhatsApp. Permita pop-ups para este site.');
      return;
    }

    janela.focus();
  } catch (error) {
    console.error('Erro ao enviar por WhatsApp:', error);
    alert('Não foi possível abrir o WhatsApp.');
  } finally {
    enviandoWhatsappFS = false;

    botoesWhatsapp.forEach(btn => {
      btn.disabled = false;
    });
  }
}

function exibirAcoesProfissionaisOrcamento() {
  const botoesAcao = document.getElementById('botoes-acao');
  const btnFloatBaixar = document.getElementById('btn-float-baixar');
  const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');
  const floatingActions = document.querySelector('.floating-actions');

  if (botoesAcao) botoesAcao.style.display = 'block';
  if (btnFloatBaixar) btnFloatBaixar.style.display = 'flex';
  if (btnFloatWhatsapp) btnFloatWhatsapp.style.display = 'flex';
  if (floatingActions) floatingActions.classList.add('show');
}

function fsSlotAdsenseValido(slot) {
  const valor = String(slot || '').trim();
  return /^\d{6,}$/.test(valor);
}

function fsInicializarAdsenseVisivel() {
  const blocos = document.querySelectorAll('.fs-anuncio-gratis');

  blocos.forEach(bloco => {
    if (bloco.style.display === 'none') return;

    const ins = bloco.querySelector('ins.adsbygoogle');

    if (!ins) return;

    const slot = ins.getAttribute('data-ad-slot');

    if (!fsSlotAdsenseValido(slot)) return;
    if (ins.dataset.adsenseInicializado === 'true') return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      ins.dataset.adsenseInicializado = 'true';
    } catch (error) {
      console.warn('AdSense ainda não inicializado:', error);
    }
  });
}

async function fsAtualizarAnunciosGratisGerador() {
  const blocos = document.querySelectorAll('.fs-anuncio-gratis');

  if (!blocos.length) return;

  let deveExibir = true;

  try {
    const plano = fsPlanoAtualNormalizado();
    deveExibir = !(plano === 'basico' || plano === 'premium');
  } catch (error) {
    deveExibir = true;
  }

  blocos.forEach(bloco => {
    bloco.style.display = deveExibir ? 'block' : 'none';
  });

  if (deveExibir) {
    setTimeout(fsInicializarAdsenseVisivel, 300);
  }
}

window.buscarClientePorIdNoOrcamento = buscarClientePorIdNoOrcamento;
window.limparClienteVinculadoNoOrcamento = limparClienteVinculadoNoOrcamento;
window.fsSelecionarVeiculoNoOrcamento = fsSelecionarVeiculoNoOrcamento;

function toggleAjuda() {
  const modal = document.getElementById('modal-ajuda');

  if (modal) {
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  fsVerificarSessaoGerador();

  const selectVeiculoOrcamento = document.getElementById('orcamento-veiculo-id');
  if (selectVeiculoOrcamento) {
    selectVeiculoOrcamento.addEventListener('change', fsSelecionarVeiculoNoOrcamento);
  }

  window.baixarPDF = fsBaixarPDFCorrigido;

  const previaOriginal = window.gerarPrevia;

  if (typeof previaOriginal === 'function' && !window.gerarPreviaComAcoesProfissionais) {
    window.gerarPrevia = async function() {
      const resultado = await previaOriginal.apply(this, arguments);

      setTimeout(() => {
        const conteudo = document.getElementById('conteudo-pdf');

        if (conteudo && conteudo.innerHTML.trim()) {
          fsInserirVeiculoNaPreviaOrcamento();
          exibirAcoesProfissionaisOrcamento();
        }
      }, 250);

      return resultado;
    };

    window.gerarPreviaComAcoesProfissionais = true;
  }

  const limparOriginal = window.limparFormulario;

  if (typeof limparOriginal === 'function' && !window.limparFormularioComResetOrcamento) {
    window.limparFormulario = function() {
      orcamentoSalvoAtualId = null;
      window.orcamentoAtualSalvoId = null;
      window.orcamentoSalvoAtualId = null;

      const retorno = limparOriginal.apply(this, arguments);

      const botoesAcao = document.getElementById('botoes-acao');
      const btnFloatBaixar = document.getElementById('btn-float-baixar');
      const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');
      const floatingActions = document.querySelector('.floating-actions');

      limparClienteVinculadoNoOrcamento();

      if (botoesAcao) botoesAcao.style.display = 'none';
      if (btnFloatBaixar) btnFloatBaixar.style.display = 'none';
      if (btnFloatWhatsapp) btnFloatWhatsapp.style.display = 'none';
      if (floatingActions) floatingActions.classList.remove('show');

      return retorno;
    };

    window.limparFormularioComResetOrcamento = true;
  }

  setTimeout(fsAtualizarAnunciosGratisGerador, 1000);
  setTimeout(fsAtualizarAnunciosGratisGerador, 2000);
});

if (window._supabase) {
  _supabase.auth.onAuthStateChange(() => {
    setTimeout(fsVerificarSessaoGerador, 500);
    setTimeout(fsAtualizarAnunciosGratisGerador, 1200);
  });
}

document.addEventListener('click', function(event) {
  const modalLogin = document.getElementById('modal-login');
  const modalAjuda = document.getElementById('modal-ajuda');

  if (event.target === modalLogin) {
    fecharModalLoginGerador();
  }

  if (event.target === modalAjuda) {
    toggleAjuda();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && document.activeElement?.id === 'campo-busca-cliente-orcamento') {
    event.preventDefault();
    buscarClientesNoModalOrcamento();
    return;
  }

  if (event.key === 'Escape') {
    const modalAjuda = document.getElementById('modal-ajuda');

    if (modalAjuda && modalAjuda.style.display === 'flex') {
      toggleAjuda();
    }

    fecharModalBuscaClienteOrcamento();
    fecharModalLoginGerador();
  }
});


document.addEventListener('DOMContentLoaded', function() {
  setTimeout(aplicarLimitesPlanoGerador, 300);
  setTimeout(aplicarLimitesPlanoGerador, 1200);
});

window.aplicarLimitesPlanoGerador = aplicarLimitesPlanoGerador;
