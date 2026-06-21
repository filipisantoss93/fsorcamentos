// ==================== ESTADO DO PAINEL ====================

let perfilAtual = null;
let responsaveisCache = [];
let painelCarregando = false;
let painelUsuarioInicializado = null;

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', iniciarPainel);

if (window._supabase?.auth) {
  _supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user?.id) {
      await inicializarPainel(session);
      return;
    }

    resetarEstadoPainel();
    mostrarAreaLoginPainel();
  });
}

async function iniciarPainel() {
  const session = await obterSessaoPainel();

  if (!session) {
    mostrarAreaLoginPainel();
    return;
  }

  await inicializarPainel(session);
}

async function inicializarPainel(session, opcoes = {}) {
  if (!session?.user?.id) return;

  const forcar = opcoes.forcar === true;

  if (!forcar && painelCarregando) return;
  if (!forcar && painelUsuarioInicializado === session.user.id) return;

  painelCarregando = true;

  try {
    mostrarConteudoProtegidoPainel();

    await carregarPerfil();
    await carregarResponsaveis();
    configurarUploadLogo();
    atualizarCardPlano(perfilAtual);

    await Promise.all([
      carregarResumoOrdensServicoPainel(),
      carregarIndicadoresPremiumPainel(),
      carregarResumoRelatoriosRecorrentesPainel(),
      carregarDashboardPainel(),
      carregarUltimosOrcamentosPainel()
    ]);

    painelUsuarioInicializado = session.user.id;
  } catch (error) {
    console.error('Erro ao inicializar painel:', error);
  } finally {
    painelCarregando = false;
  }
}

function resetarEstadoPainel() {
  perfilAtual = null;
  responsaveisCache = [];
  painelCarregando = false;
  painelUsuarioInicializado = null;
  window.perfilAtual = null;
}

// ==================== HELPERS ====================

function pegarElemento(id) {
  return document.getElementById(id);
}

function setValor(id, valor) {
  const el = pegarElemento(id);
  if (el) el.value = valor || '';
}

function getValor(id) {
  const el = pegarElemento(id);
  return el ? String(el.value || '').trim() : '';
}

function valorOuTraco(valor) {
  return valor && String(valor).trim() ? String(valor).trim() : '-';
}

function escaparHtmlPainel(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizarTextoPainel(valor, padrao = '') {
  const texto = valor === null || valor === undefined || valor === '' ? padrao : valor;

  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizarStatusPainel(valor) {
  return normalizarTextoPainel(valor)
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function normalizarPlanoPainel(valor) {
  return normalizarTextoPainel(valor, 'gratis');
}

function converterNumeroPainel(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;

  let texto = String(valor).trim().replace(/[^\d.,-]/g, '');
  if (!texto) return 0;

  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarMoedaPainel(valor) {
  return converterNumeroPainel(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarDataPainel(dataValor) {
  if (!dataValor) return '-';

  const data = new Date(dataValor);
  if (Number.isNaN(data.getTime())) return '-';

  return data.toLocaleDateString('pt-BR');
}

function formatarDataHoraPainel(dataValor) {
  if (!dataValor) return '-';

  const data = new Date(dataValor);
  if (Number.isNaN(data.getTime())) return '-';

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function diasAteDataPainel(dataValor) {
  if (!dataValor) return null;

  const hoje = new Date();
  const data = new Date(String(dataValor).substring(0, 10) + 'T00:00:00');

  if (Number.isNaN(data.getTime())) return null;

  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);

  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function diasAteExpirar(dataValor) {
  return diasAteDataPainel(dataValor);
}

function estaNoMesAtualPainel(dataValor) {
  if (!dataValor) return false;

  const data = new Date(dataValor);
  const agora = new Date();

  if (Number.isNaN(data.getTime())) return false;

  return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
}

function atualizarTexto(id, valor) {
  const el = pegarElemento(id);
  if (el) el.innerText = String(valor ?? '');
}

function mostrarStatus(id, mensagem, tipo = 'sucesso') {
  const el = pegarElemento(id);
  if (!el) return;

  el.className = `status-msg ${tipo}`;
  el.innerText = mensagem || '';

  if (mensagem) {
    setTimeout(() => {
      el.className = 'status-msg';
      el.innerText = '';
    }, 4500);
  }
}

function planoLabel(plano) {
  const p = normalizarPlanoPainel(plano);
  if (p === 'premium') return 'Plano Premium';
  if (p === 'basico') return 'Plano Básico';
  return 'Plano Grátis';
}

function statusPlanoLabel(status) {
  const s = normalizarStatusPainel(status || 'ativo');

  const mapa = {
    ativo: 'Ativo',
    pago: 'Ativo',
    teste_gratis: 'Teste grátis',
    cancelado: 'Cancelado',
    expirado: 'Expirado',
    pendente: 'Pendente'
  };

  return mapa[s] || status || 'Ativo';
}

function statusOrcamentoLabel(status) {
  const s = normalizarStatusPainel(status || 'pendente');

  const mapa = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    em_servico: 'Em serviço',
    finalizado: 'Finalizado'
  };

  return mapa[s] || status || 'Pendente';
}

function formaPagamentoPainelLabel(valor) {
  const forma = normalizarStatusPainel(valor);

  const mapa = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    credito: 'Crédito',
    debito: 'Débito',
    cartao_credito: 'Cartão de crédito',
    cartao_debito: 'Cartão de débito',
    boleto: 'Boleto',
    transferencia: 'Transferência',
    outro: 'Outro'
  };

  return mapa[forma] || (valor ? String(valor) : '-');
}

async function obterSessaoPainel() {
  try {
    if (!window._supabase?.auth) return null;

    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) return null;

    return session;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

async function buscarTabelaDoUsuarioPainel(tabela, colunas = '*', opcoes = {}) {
  const session = await obterSessaoPainel();
  if (!session) return [];

  const camposUsuario = opcoes.camposUsuario || ['user_id', 'usuario_id', 'id_usuario'];
  const orderBy = opcoes.orderBy || null;
  const ascending = opcoes.ascending ?? false;
  const limit = opcoes.limit || null;

  for (const campo of camposUsuario) {
    let query = _supabase
      .from(tabela)
      .select(colunas)
      .eq(campo, session.user.id);

    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (!error) return Array.isArray(data) ? data : [];

    const textoErro = String(error.message || error.details || error.hint || '').toLowerCase();
    const erroDeColuna = textoErro.includes('column') || textoErro.includes('schema cache') || textoErro.includes('could not find');

    if (!erroDeColuna) {
      console.warn(`Erro ao buscar ${tabela}:`, error);
      return [];
    }
  }

  return [];
}

// ==================== CONTROLE DE TELA ====================

function mostrarAreaLoginPainel() {
  const authArea = pegarElemento('auth-area');
  const conteudo = pegarElemento('conteudo-protegido');

  if (authArea) authArea.style.display = 'block';
  if (conteudo) conteudo.style.display = 'none';
}

function mostrarConteudoProtegidoPainel() {
  const authArea = pegarElemento('auth-area');
  const conteudo = pegarElemento('conteudo-protegido');

  if (authArea) authArea.style.display = 'none';
  if (conteudo) conteudo.style.display = 'block';
}

// ==================== PLANO / ASSINATURA ====================

function usuarioJaTemPlanoPago(perfil) {
  const plano = normalizarPlanoPainel(perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis');
  const status = normalizarStatusPainel(perfil?.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo');

  if (plano === 'premium') return true;

  if (plano === 'basico' && !['cancelado', 'expirado'].includes(status)) {
    const dias = diasAteExpirar(perfil?.plano_expira_em || localStorage.getItem('usuario_plano_expira_em'));
    return dias === null || dias >= 0;
  }

  return false;
}

function montarTextoExpiracaoPlano(perfil) {
  const plano = normalizarPlanoPainel(perfil?.plano);
  const expiraEm = perfil?.plano_expira_em;

  if (plano === 'gratis') return 'Sem expiração';

  if (normalizarStatusPainel(perfil?.plano_status) === 'teste_gratis' && perfil?.teste_premium_fim) {
    const diasTeste = diasAteExpirar(perfil.teste_premium_fim);
    const dataTeste = formatarDataPainel(perfil.teste_premium_fim);

    if (diasTeste === 0) return `${dataTeste} · teste vence hoje`;
    if (diasTeste === 1) return `${dataTeste} · teste vence amanhã`;
    if (diasTeste !== null) return `${dataTeste} · teste Premium, faltam ${diasTeste} dias`;
    return `${dataTeste} · teste Premium`;
  }

  if (!expiraEm) return 'Não informado';

  const dias = diasAteExpirar(expiraEm);
  const dataFormatada = formatarDataPainel(expiraEm);

  if (dias === null) return dataFormatada;
  if (dias < 0) return `${dataFormatada} · expirado`;
  if (dias === 0) return `${dataFormatada} · vence hoje`;
  if (dias === 1) return `${dataFormatada} · vence amanhã`;

  return `${dataFormatada} · faltam ${dias} dias`;
}

function montarAvisoPlano(perfil) {
  const plano = normalizarPlanoPainel(perfil?.plano);
  const status = normalizarStatusPainel(perfil?.plano_status || 'ativo');
  const dias = diasAteExpirar(perfil?.plano_expira_em);

  if (plano === 'gratis') {
    return {
      tipo: 'gratis',
      texto: 'Você está no Plano Grátis. Ative o Plano Básico para salvar orçamentos na nuvem, usar histórico, WhatsApp com link, aprovação online, lembrete interno de orçamentos pendentes e resumo financeiro.'
    };
  }

  if (status === 'teste_gratis' && plano === 'premium') {
    const diasTeste = diasAteExpirar(perfil?.teste_premium_fim || perfil?.plano_expira_em);

    return {
      tipo: 'alerta',
      texto: diasTeste !== null
        ? `Teste grátis do Premium ativo. Ao vencer, sua conta volta automaticamente para o Plano Básico. Faltam ${diasTeste} dia(s).`
        : 'Teste grátis do Premium ativo. Ao vencer, sua conta volta automaticamente para o Plano Básico.'
    };
  }

  if (status === 'cancelado') {
    return { tipo: 'erro', texto: 'Seu plano está cancelado. Renove para continuar usando os recursos pagos.' };
  }

  if (status === 'expirado' || (dias !== null && dias < 0)) {
    return { tipo: 'erro', texto: 'Seu plano expirou. Renove o Plano Básico para continuar usando os recursos pagos.' };
  }

  if (dias !== null && dias <= 7) {
    return { tipo: 'alerta', texto: `Seu plano vence ${dias === 0 ? 'hoje' : `em ${dias} dia(s)`}. Renove para evitar bloqueio dos recursos pagos.` };
  }

  return { tipo: 'ok', texto: 'Seu plano está ativo.' };
}

function atualizarCardPlano(perfil) {
  const planoAtual = perfil?.plano || 'gratis';
  const planoNormalizado = normalizarPlanoPainel(planoAtual);
  const badge = pegarElemento('perfil-plano');
  const statusEl = pegarElemento('perfil-plano-status');
  const expiraEl = pegarElemento('perfil-plano-expira');
  const avisoEl = pegarElemento('perfil-plano-aviso');
  const limiteEl = pegarElemento('perfil-limite-responsaveis');

  if (badge) {
    badge.innerText = planoLabel(planoAtual);
    badge.classList.remove('plano-gratis', 'plano-basico', 'plano-premium');
    badge.classList.add(`plano-${planoNormalizado === 'premium' || planoNormalizado === 'basico' ? planoNormalizado : 'gratis'}`);
  }

  if (statusEl) statusEl.innerText = statusPlanoLabel(perfil?.plano_status || 'ativo');
  if (expiraEl) expiraEl.innerText = montarTextoExpiracaoPlano(perfil);
  if (limiteEl) limiteEl.innerText = String(limiteResponsaveisPorPlano());

  if (avisoEl) {
    const aviso = montarAvisoPlano(perfil);
    avisoEl.innerText = aviso.texto;
    avisoEl.className = `painel-plano-aviso plano-${aviso.tipo}`;
    avisoEl.style.display = 'block';
  }
}

// ==================== PERFIL ====================

async function carregarPerfil() {
  const session = await obterSessaoPainel();

  if (!session) {
    mostrarAreaLoginPainel();
    return;
  }

  if (typeof window.verificarExpiracaoTestePremium === 'function') {
    await window.verificarExpiracaoTestePremium(true);
  }

  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em, teste_premium_usado, teste_premium_inicio, teste_premium_fim')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar perfil:', error);
    mostrarStatus('status-perfil', 'Erro ao carregar os dados do perfil.', 'erro');
    return;
  }

  perfilAtual = data || {
    nome: '',
    nome_empresa: '',
    telefone_empresa: '',
    endereco_empresa: '',
    cnpj_empresa: '',
    foto_url: '',
    plano: 'gratis',
    plano_status: 'ativo',
    plano_expira_em: null
  };

  window.perfilAtual = perfilAtual;

  preencherCamposEstaticos(perfilAtual, session);
  preencherFormularioEdicao(perfilAtual);
  atualizarCardPlano(perfilAtual);
}

function preencherCamposEstaticos(data, session) {
  atualizarTexto('perfil-responsavel-selecionado', valorOuTraco(data?.nome));
  atualizarTexto('perfil-empresa', valorOuTraco(data?.nome_empresa));
  atualizarTexto('perfil-telefone', valorOuTraco(data?.telefone_empresa));
  atualizarTexto('perfil-cnpj', valorOuTraco(data?.cnpj_empresa));
  atualizarTexto('perfil-endereco', valorOuTraco(data?.endereco_empresa));

  atualizarLogoEstatica(data?.foto_url || '');

  const nomeLocal = data?.nome || data?.nome_empresa || session?.user?.email?.split('@')[0] || '';
  localStorage.setItem('usuario_nome', nomeLocal);
  localStorage.setItem('usuario_plano', data?.plano || 'gratis');
  localStorage.setItem('nome_empresa', data?.nome_empresa || '');
  localStorage.setItem('telefone_empresa', data?.telefone_empresa || '');
  localStorage.setItem('endereco_empresa', data?.endereco_empresa || '');
  localStorage.setItem('cnpj_empresa', data?.cnpj_empresa || '');

  if (data?.foto_url) localStorage.setItem('foto_url', data.foto_url);
  else localStorage.removeItem('foto_url');

  if (data?.plano_status) localStorage.setItem('usuario_plano_status', data.plano_status);
  else localStorage.removeItem('usuario_plano_status');

  if (data?.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
  else localStorage.removeItem('usuario_plano_expira_em');
}

function preencherFormularioEdicao(data) {
  setValor('nome_empresa', data?.nome_empresa);
  setValor('telefone_empresa', data?.telefone_empresa);
  setValor('endereco_empresa', data?.endereco_empresa);
  setValor('cnpj_empresa', data?.cnpj_empresa);
  setValor('foto_url', data?.foto_url);

  atualizarPreviewLogo(data?.foto_url || '');
  preencherSelectResponsaveis();
}

async function salvarPerfil(event) {
  event.preventDefault();

  const session = await obterSessaoPainel();
  if (!session) return;

  const responsavelSelecionado = getValor('responsavel_selecionado');

  const payload = {
    id: session.user.id,
    nome: responsavelSelecionado,
    nome_empresa: getValor('nome_empresa'),
    telefone_empresa: getValor('telefone_empresa'),
    endereco_empresa: getValor('endereco_empresa'),
    cnpj_empresa: getValor('cnpj_empresa'),
    foto_url: getValor('foto_url'),
    atualizado_em: new Date().toISOString()
  };

  if (!payload.nome || !payload.nome_empresa || !payload.telefone_empresa) {
    mostrarStatus('status-perfil', 'Selecione um responsável e preencha empresa e WhatsApp.', 'erro');
    return;
  }

  const { error } = await _supabase
    .from('perfis')
    .upsert([payload]);

  if (error) {
    console.error('Erro ao salvar perfil:', error);
    mostrarStatus('status-perfil', 'Erro ao salvar perfil.', 'erro');
    return;
  }

  perfilAtual = { ...perfilAtual, ...payload };
  window.perfilAtual = perfilAtual;

  preencherCamposEstaticos(perfilAtual, session);
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);

  if (typeof carregarMenu === 'function') {
    await carregarMenu(session);
  }

  mostrarStatus('status-perfil', 'Perfil atualizado com sucesso.', 'sucesso');
  setTimeout(fecharModalEditarPerfil, 700);
}

// ==================== LOGO ====================

function montarUrlLogoPainel(url) {
  if (!url) return '';
  return url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
}

function atualizarImagemComPlaceholder(imgId, placeholderId, url) {
  const img = pegarElemento(imgId);
  const placeholder = pegarElemento(placeholderId);
  if (!img || !placeholder) return;

  if (url) {
    img.src = montarUrlLogoPainel(url);
    img.style.display = 'block';
    placeholder.style.display = 'none';
    return;
  }

  img.src = '';
  img.style.display = 'none';
  placeholder.style.display = 'block';
}

function atualizarPreviewLogo(url) {
  atualizarImagemComPlaceholder('preview-logo', 'logo-placeholder', url);
}

function atualizarLogoEstatica(url) {
  atualizarImagemComPlaceholder('perfil-logo-img', 'perfil-logo-placeholder', url);
}

function configurarUploadLogo() {
  const input = pegarElemento('logo_file');
  if (!input || input.dataset.configurado === 'sim') return;

  input.dataset.configurado = 'sim';
  input.addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;

    await enviarLogoPerfil(file);
    event.target.value = '';
  });
}

async function enviarLogoPerfil(file) {
  const session = await obterSessaoPainel();
  if (!session) return;

  const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  if (!tiposPermitidos.includes(file.type)) {
    mostrarStatus('status-logo', 'Formato inválido. Use PNG, JPG, JPEG ou WEBP.', 'erro');
    return;
  }

  if (file.size > 700 * 1024) {
    mostrarStatus('status-logo', 'A imagem deve ter no máximo 700KB.', 'erro');
    return;
  }

  const extensao = file.name.split('.').pop().toLowerCase();
  const caminhoArquivo = `${session.user.id}/logo.${extensao}`;

  const { error: uploadError } = await _supabase.storage
    .from('logos')
    .upload(caminhoArquivo, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600'
    });

  if (uploadError) {
    console.error('Erro ao enviar logo:', uploadError);
    mostrarStatus('status-logo', 'Erro ao enviar logo: ' + uploadError.message, 'erro');
    return;
  }

  const { data: publicUrlData } = _supabase.storage
    .from('logos')
    .getPublicUrl(caminhoArquivo);

  const logoUrl = publicUrlData.publicUrl;

  setValor('foto_url', logoUrl);
  atualizarPreviewLogo(logoUrl);
  atualizarLogoEstatica(logoUrl);

  const { error: perfilError } = await _supabase
    .from('perfis')
    .update({ foto_url: logoUrl, atualizado_em: new Date().toISOString() })
    .eq('id', session.user.id);

  if (perfilError) {
    console.error('Erro ao salvar URL da logo:', perfilError);
    mostrarStatus('status-logo', 'Logo enviada, mas não foi possível salvar no perfil.', 'erro');
    return;
  }

  perfilAtual = { ...perfilAtual, foto_url: logoUrl };
  window.perfilAtual = perfilAtual;
  localStorage.setItem('foto_url', logoUrl);

  mostrarStatus('status-logo', 'Logo salva com sucesso.', 'sucesso');
}

async function removerLogoPerfil() {
  if (!confirm('Deseja remover a logo da empresa?')) return;

  const session = await obterSessaoPainel();
  if (!session) return;

  await _supabase.storage
    .from('logos')
    .remove([
      `${session.user.id}/logo.png`,
      `${session.user.id}/logo.jpg`,
      `${session.user.id}/logo.jpeg`,
      `${session.user.id}/logo.webp`
    ]);

  const { error } = await _supabase
    .from('perfis')
    .update({ foto_url: '', atualizado_em: new Date().toISOString() })
    .eq('id', session.user.id);

  if (error) {
    console.error('Erro ao remover logo:', error);
    mostrarStatus('status-logo', 'Erro ao remover logo.', 'erro');
    return;
  }

  setValor('foto_url', '');
  atualizarPreviewLogo('');
  atualizarLogoEstatica('');

  perfilAtual = { ...perfilAtual, foto_url: '' };
  window.perfilAtual = perfilAtual;
  localStorage.removeItem('foto_url');

  mostrarStatus('status-logo', 'Logo removida com sucesso.', 'sucesso');
}

// ==================== RESPONSÁVEIS / CONSULTORES ====================

function obterResponsavelSelecionadoNome() {
  return perfilAtual?.nome || '';
}

function limiteResponsaveisPorPlano() {
  const plano = normalizarPlanoPainel(perfilAtual?.plano || localStorage.getItem('usuario_plano') || 'gratis');

  if (plano === 'basico') return 5;
  if (plano === 'premium') return 999;

  return 2;
}

async function carregarResponsaveis() {
  const session = await obterSessaoPainel();
  if (!session) return;

  const container = pegarElemento('lista-responsaveis');

  const { data, error } = await _supabase
    .from('responsaveis_orcamento')
    .select('*')
    .eq('usuario_id', session.user.id)
    .eq('ativo', true)
    .order('criado_em', { ascending: true });

  if (error) {
    console.error('Erro ao carregar responsáveis:', error);
    if (container) container.innerHTML = 'Erro ao carregar responsáveis.';
    return;
  }

  responsaveisCache = data || [];
  await garantirResponsavelSelecionadoNaLista(session);

  preencherSelectResponsaveis();
  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);
}

async function garantirResponsavelSelecionadoNaLista(session) {
  const nomeSelecionado = String(perfilAtual?.nome || '').trim();
  const nomeNormalizado = normalizarTextoPainel(nomeSelecionado);

  if (!nomeSelecionado || nomeNormalizado === 'usuario') return;

  const jaExiste = responsaveisCache.some(resp =>
    String(resp.nome || '').trim().toLowerCase() === nomeSelecionado.toLowerCase()
  );

  if (jaExiste) return;
  if (responsaveisCache.length > 0) return;
  if (responsaveisCache.length >= limiteResponsaveisPorPlano()) return;

  const { data, error } = await _supabase
    .from('responsaveis_orcamento')
    .insert({ usuario_id: session.user.id, nome: nomeSelecionado, ativo: true })
    .select()
    .single();

  if (!error && data) responsaveisCache.push(data);
}

function preencherSelectResponsaveis() {
  const select = pegarElemento('responsavel_selecionado');
  if (!select) return;

  const selecionado = obterResponsavelSelecionadoNome();
  select.innerHTML = '';

  if (!responsaveisCache.length) {
    const option = document.createElement('option');
    option.value = selecionado || '';
    option.textContent = selecionado || 'Cadastre um responsável';
    select.appendChild(option);
    return;
  }

  responsaveisCache.forEach(resp => {
    const option = document.createElement('option');
    option.value = resp.nome;
    option.textContent = resp.nome;
    select.appendChild(option);
  });

  if (selecionado) select.value = selecionado;
  if (!select.value && responsaveisCache[0]) select.value = responsaveisCache[0].nome;
}

function renderizarListaResponsaveis() {
  const container = pegarElemento('lista-responsaveis');
  if (!container) return;

  const selecionado = obterResponsavelSelecionadoNome();
  const limite = limiteResponsaveisPorPlano();

  if (!responsaveisCache.length) {
    container.innerHTML = `
      <div class="responsavel-item">
        <div>
          <span>Nenhum responsável cadastrado</span>
          <small>Cadastre um responsável para selecionar no perfil. Limite atual: ${limite}.</small>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="painel-aviso painel-aviso-compacto">
      Você cadastrou ${responsaveisCache.length} de ${limite} responsável(is)/consultor(es) disponíveis no seu plano.
    </div>

    ${responsaveisCache.map(resp => {
      const ativo = String(resp.nome || '') === String(selecionado || '');

      return `
        <div class="responsavel-item ${ativo ? 'selecionado' : ''}">
          <div>
            <span>${escaparHtmlPainel(resp.nome)}</span>
            <small>${ativo ? 'Responsável selecionado' : 'Responsável cadastrado'}</small>
          </div>

          <button type="button" onclick="excluirResponsavel('${escaparHtmlPainel(resp.id)}')">Excluir</button>
        </div>
      `;
    }).join('')}
  `;
}

function abrirModalResponsavelInterno() {
  const limite = limiteResponsaveisPorPlano();

  if (responsaveisCache.length >= limite) {
    alert(`Seu plano permite no máximo ${limite} responsável(is)/consultor(es).`);
    return;
  }

  setValor('novo-responsavel-nome', '');
  mostrarStatus('status-responsavel', '');

  const modal = pegarElemento('modal-responsavel-interno');
  const input = pegarElemento('novo-responsavel-nome');

  if (modal) modal.style.display = 'flex';
  setTimeout(() => input?.focus(), 100);
}

function fecharModalResponsavelInterno() {
  const modal = pegarElemento('modal-responsavel-interno');
  if (modal) modal.style.display = 'none';
}

async function salvarResponsavel() {
  const session = await obterSessaoPainel();
  if (!session) return;

  const nome = getValor('novo-responsavel-nome');

  if (!nome) {
    mostrarStatus('status-responsavel', 'Informe o nome do responsável/consultor.', 'erro');
    return;
  }

  const limite = limiteResponsaveisPorPlano();

  if (responsaveisCache.length >= limite) {
    mostrarStatus('status-responsavel', `Seu plano permite no máximo ${limite} responsável(is)/consultor(es).`, 'erro');
    return;
  }

  const jaExiste = responsaveisCache.some(resp =>
    String(resp.nome || '').trim().toLowerCase() === nome.toLowerCase()
  );

  if (jaExiste) {
    mostrarStatus('status-responsavel', 'Este responsável/consultor já está cadastrado.', 'erro');
    return;
  }

  const { data, error } = await _supabase
    .from('responsaveis_orcamento')
    .insert({ usuario_id: session.user.id, nome, ativo: true })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar responsável:', error);
    mostrarStatus('status-responsavel', 'Erro ao salvar responsável/consultor.', 'erro');
    return;
  }

  if (data) responsaveisCache.push(data);

  fecharModalResponsavelInterno();
  preencherSelectResponsaveis();

  const select = pegarElemento('responsavel_selecionado');
  if (select) select.value = nome;

  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);
}

async function excluirResponsavel(id) {
  const responsavel = responsaveisCache.find(resp => String(resp.id) === String(id));

  if (responsavel && responsavel.nome === perfilAtual?.nome) {
    alert('Este responsável está selecionado. Selecione outro responsável antes de excluir.');
    return;
  }

  if (!confirm('Deseja excluir este responsável/consultor?')) return;

  const session = await obterSessaoPainel();
  if (!session) return;

  const { error } = await _supabase
    .from('responsaveis_orcamento')
    .delete()
    .eq('id', id)
    .eq('usuario_id', session.user.id);

  if (error) {
    console.error('Erro ao excluir responsável:', error);
    alert('Erro ao excluir responsável/consultor.');
    return;
  }

  responsaveisCache = responsaveisCache.filter(resp => String(resp.id) !== String(id));
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);
}

// ==================== MODAIS PERFIL / SENHA / CONTA ====================

function abrirModalEditarPerfil() {
  preencherFormularioEdicao(perfilAtual || {});
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();

  const modal = pegarElemento('modal-editar-perfil');
  if (modal) modal.style.display = 'flex';
}

function fecharModalEditarPerfil() {
  const modal = pegarElemento('modal-editar-perfil');
  if (modal) modal.style.display = 'none';
}

function abrirModalSenha() {
  setValor('senha_atual', '');
  setValor('nova_senha', '');
  setValor('confirmar_senha', '');

  const modal = pegarElemento('modal-senha');
  if (modal) modal.style.display = 'flex';
}

function fecharModalSenha() {
  const modal = pegarElemento('modal-senha');
  if (modal) modal.style.display = 'none';
}

async function alterarSenhaSegura() {
  const session = await obterSessaoPainel();
  if (!session) return;

  const senhaAtual = getValor('senha_atual');
  const novaSenha = getValor('nova_senha');
  const confirmarSenha = getValor('confirmar_senha');

  if (!senhaAtual) {
    mostrarStatus('status-senha', 'Informe sua senha atual.', 'erro');
    return;
  }

  if (!novaSenha || novaSenha.length < 6) {
    mostrarStatus('status-senha', 'A nova senha deve ter pelo menos 6 caracteres.', 'erro');
    return;
  }

  if (novaSenha !== confirmarSenha) {
    mostrarStatus('status-senha', 'As senhas não coincidem.', 'erro');
    return;
  }

  const { error: loginError } = await _supabase.auth.signInWithPassword({
    email: session.user.email,
    password: senhaAtual
  });

  if (loginError) {
    console.error('Senha atual incorreta:', loginError);
    mostrarStatus('status-senha', 'Senha atual incorreta.', 'erro');
    return;
  }

  const { error: updateError } = await _supabase.auth.updateUser({ password: novaSenha });

  if (updateError) {
    console.error('Erro ao alterar senha:', updateError);
    mostrarStatus('status-senha', 'Erro ao alterar senha.', 'erro');
    return;
  }

  fecharModalSenha();
  alert('Senha alterada com sucesso.');
}

function abrirModalExcluirConta() {
  setValor('confirmar_excluir_conta', '');
  mostrarStatus('status-excluir-conta', '');

  const modal = pegarElemento('modal-excluir-conta');
  if (modal) modal.style.display = 'flex';
}

function fecharModalExcluirConta() {
  const modal = pegarElemento('modal-excluir-conta');
  if (modal) modal.style.display = 'none';
}

async function excluirMinhaConta() {
  try {
    const confirmacao = getValor('confirmar_excluir_conta');

    if (confirmacao !== 'EXCLUIR') {
      mostrarStatus('status-excluir-conta', 'Digite EXCLUIR para confirmar.', 'erro');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir sua conta definitivamente? Esta ação não poderá ser desfeita.')) return;

    const session = await obterSessaoPainel();

    if (!session) {
      mostrarStatus('status-excluir-conta', 'Sessão expirada. Faça login novamente.', 'erro');
      return;
    }

    mostrarStatus('status-excluir-conta', 'Excluindo conta, aguarde...', 'sucesso');

    const { data, error } = await _supabase.functions.invoke('excluir-conta', {
      body: { confirmar: 'EXCLUIR' }
    });

    if (error) {
      console.error('Erro ao chamar função excluir-conta:', error);
      mostrarStatus('status-excluir-conta', error.message || 'Erro ao excluir conta.', 'erro');
      return;
    }

    if (!data?.ok) {
      mostrarStatus('status-excluir-conta', data?.error || 'Não foi possível excluir a conta.', 'erro');
      return;
    }

    localStorage.clear();

    try {
      await _supabase.auth.signOut();
    } catch (errorSignOut) {
      console.warn('Conta excluída, mas houve erro ao encerrar sessão:', errorSignOut);
    }

    alert('Conta excluída com sucesso.');
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Erro inesperado ao excluir conta:', error);
    mostrarStatus('status-excluir-conta', 'Erro inesperado ao excluir conta.', 'erro');
  }
}

// ==================== ORDENS DE SERVIÇO / INDICADORES ====================

function normalizarStatusOrdemServicoPainel(status) {
  return normalizarStatusPainel(status);
}

function statusPagamentoEhPagoPainel(status) {
  const s = normalizarStatusOrdemServicoPainel(status);
  return ['pago', 'quitado', 'recebido', 'concluido'].includes(s);
}

function obterDataConclusaoOSPainel(os) {
  return os?.data_conclusao || os?.concluido_em || os?.finalizado_em || os?.updated_at || os?.created_at || os?.criado_em || null;
}

function obterValorTotalOrdemServicoPainel(os) {
  const camposPossiveis = [
    os?.valor_total,
    os?.total,
    os?.valor,
    os?.valor_os,
    os?.total_os,
    os?.valor_servico,
    os?.valor_mao_obra
  ];

  for (const campo of camposPossiveis) {
    const numero = converterNumeroPainel(campo);
    if (numero > 0) return numero;
  }

  return 0;
}

function statusOrdemEhAberta(statusNormalizado) {
  return ['aberta', 'aberto', 'em_aberto', 'nova', 'novo', 'pendente'].includes(statusNormalizado);
}

function statusOrdemEhEmExecucao(statusNormalizado) {
  return ['em_execucao', 'execucao', 'em_andamento', 'andamento', 'executando', 'em_servico', 'servico'].includes(statusNormalizado);
}

function statusOrdemEhConcluida(statusNormalizado) {
  return ['concluida', 'concluido', 'finalizada', 'finalizado', 'fechada', 'fechado'].includes(statusNormalizado);
}

async function carregarResumoOrdensServicoPainel() {
  const possuiCardsOS =
    pegarElemento('painel-total-os') ||
    pegarElemento('painel-os-abertas') ||
    pegarElemento('painel-os-execucao') ||
    pegarElemento('painel-os-concluidas') ||
    pegarElemento('painel-total-valor-os');

  if (!possuiCardsOS) return;

  try {
    const ordens = await buscarTabelaDoUsuarioPainel('ordens_servico', '*', {
      camposUsuario: ['user_id', 'usuario_id'],
      orderBy: 'created_at',
      ascending: false
    });

    const abertas = ordens.filter(os => statusOrdemEhAberta(normalizarStatusOrdemServicoPainel(os.status))).length;
    const emExecucao = ordens.filter(os => statusOrdemEhEmExecucao(normalizarStatusOrdemServicoPainel(os.status))).length;
    const concluidas = ordens.filter(os => statusOrdemEhConcluida(normalizarStatusOrdemServicoPainel(os.status))).length;
    const totalValorOS = ordens.reduce((soma, os) => soma + obterValorTotalOrdemServicoPainel(os), 0);

    atualizarTexto('painel-total-os', ordens.length);
    atualizarTexto('painel-os-abertas', abertas);
    atualizarTexto('painel-os-execucao', emExecucao);
    atualizarTexto('painel-os-concluidas', concluidas);
    atualizarTexto('painel-total-valor-os', formatarMoedaPainel(totalValorOS));
  } catch (error) {
    console.warn('Erro inesperado ao carregar resumo de ordens de serviço:', error);
    atualizarTexto('painel-total-os', '0');
    atualizarTexto('painel-os-abertas', '0');
    atualizarTexto('painel-os-execucao', '0');
    atualizarTexto('painel-os-concluidas', '0');
    atualizarTexto('painel-total-valor-os', formatarMoedaPainel(0));
  }
}

async function carregarIndicadoresPremiumPainel() {
  const precisaCarregar =
    pegarElemento('painel-faturamento-os-total') ||
    pegarElemento('painel-recebido-mes-os') ||
    pegarElemento('painel-os-pagas-mes') ||
    pegarElemento('painel-ticket-medio-os') ||
    pegarElemento('painel-orcamentos-aprovados') ||
    pegarElemento('painel-orcamentos-convertidos-os') ||
    pegarElemento('painel-os-pendentes-pagamento') ||
    pegarElemento('painel-produtos-estoque-baixo') ||
    pegarElemento('lista-ultimas-os-finalizadas-painel');

  if (!precisaCarregar) return;

  const [ordens, orcamentos, produtos] = await Promise.all([
    buscarTabelaDoUsuarioPainel('ordens_servico', '*', {
      camposUsuario: ['user_id', 'usuario_id'],
      orderBy: 'created_at',
      ascending: false
    }),
    buscarTabelaDoUsuarioPainel('orcamentos', 'id, status, total, ordem_servico_id, criado_em, resposta_cliente_em', {
      camposUsuario: ['usuario_id', 'user_id'],
      orderBy: 'criado_em',
      ascending: false
    }),
    buscarTabelaDoUsuarioPainel('produtos_estoque', '*', {
      camposUsuario: ['user_id', 'usuario_id'],
      orderBy: 'nome',
      ascending: true
    })
  ]);

  const osConcluidasPagas = ordens.filter(os =>
    statusOrdemEhConcluida(normalizarStatusOrdemServicoPainel(os.status)) &&
    statusPagamentoEhPagoPainel(os.status_pagamento)
  );

  const faturamentoTotalOS = osConcluidasPagas.reduce((soma, os) => soma + obterValorTotalOrdemServicoPainel(os), 0);
  const osPagasMes = osConcluidasPagas.filter(os => estaNoMesAtualPainel(obterDataConclusaoOSPainel(os)));
  const recebidoMesOS = osPagasMes.reduce((soma, os) => soma + obterValorTotalOrdemServicoPainel(os), 0);
  const ticketMedioOS = osConcluidasPagas.length ? faturamentoTotalOS / osConcluidasPagas.length : 0;

  const orcamentosAprovados = orcamentos.filter(o => ['aprovado', 'em_servico', 'finalizado'].includes(normalizarStatusOrdemServicoPainel(o.status)));
  const orcamentosConvertidosOS = orcamentos.filter(o => !!o.ordem_servico_id || ['em_servico', 'finalizado'].includes(normalizarStatusOrdemServicoPainel(o.status)));

  const osPendentesPagamento = ordens.filter(os => {
    const status = normalizarStatusOrdemServicoPainel(os.status);
    const pagamento = normalizarStatusOrdemServicoPainel(os.status_pagamento);
    return !['cancelada', 'cancelado'].includes(status) && pagamento !== 'pago';
  });

  const produtosEstoqueBaixo = produtos.filter(produto => {
    if (produto.ativo === false) return false;
    if (produto.controlar_estoque === false) return false;

    const atual = converterNumeroPainel(produto.quantidade_atual);
    const minimo = converterNumeroPainel(produto.estoque_minimo);

    return minimo > 0 && atual <= minimo;
  });

  atualizarTexto('painel-faturamento-os-total', formatarMoedaPainel(faturamentoTotalOS));
  atualizarTexto('painel-recebido-mes-os', formatarMoedaPainel(recebidoMesOS));
  atualizarTexto('painel-os-pagas-mes', osPagasMes.length);
  atualizarTexto('painel-ticket-medio-os', formatarMoedaPainel(ticketMedioOS));
  atualizarTexto('painel-orcamentos-aprovados', orcamentosAprovados.length);
  atualizarTexto('painel-orcamentos-convertidos-os', orcamentosConvertidosOS.length);
  atualizarTexto('painel-os-pendentes-pagamento', osPendentesPagamento.length);
  atualizarTexto('painel-produtos-estoque-baixo', produtosEstoqueBaixo.length);

  renderizarUltimasOSFinalizadasPainel(osConcluidasPagas);
}

function montarTabelaPainel({ colunas, linhas, vazio, minWidth = 720 }) {
  if (!linhas.length) return `<div class="painel-aviso">${escaparHtmlPainel(vazio)}</div>`;

  return `
    <div class="painel-tabela-wrapper">
      <table class="painel-tabela" style="min-width:${minWidth}px;">
        <thead>
          <tr>
            ${colunas.map(coluna => `<th class="${coluna.classe || ''}">${escaparHtmlPainel(coluna.titulo)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${linhas.join('')}
        </tbody>
      </table>
    </div>
  `;
}

function montarLinhaTabelaPainel(celulas, href = '') {
  return `
    <tr ${href ? `data-href="${escaparHtmlPainel(href)}"` : ''}>
      ${celulas.map(celula => `
        <td class="${celula.classe || ''}">
          ${celula.html === true ? celula.valor : escaparHtmlPainel(celula.valor)}
        </td>
      `).join('')}
    </tr>
  `;
}

function renderizarUltimasOSFinalizadasPainel(ordens) {
  const container = pegarElemento('lista-ultimas-os-finalizadas-painel');
  if (!container) return;

  const ultimas = [...ordens]
    .sort((a, b) => new Date(obterDataConclusaoOSPainel(b) || 0) - new Date(obterDataConclusaoOSPainel(a) || 0))
    .slice(0, 5);

  const linhas = ultimas.map(os => {
    const numero = os.numero_os ? String(os.numero_os).padStart(6, '0') : '-';
    const href = `/ordem.html?id=${encodeURIComponent(os.id || '')}`;

    return montarLinhaTabelaPainel([
      { valor: numero, classe: 'texto-forte' },
      { valor: os.titulo || '-' },
      { valor: formaPagamentoPainelLabel(os.forma_pagamento) },
      { valor: formatarDataPainel(obterDataConclusaoOSPainel(os)) },
      { valor: formatarMoedaPainel(obterValorTotalOrdemServicoPainel(os)), classe: 'texto-direita texto-forte' }
    ], href);
  });

  container.innerHTML = montarTabelaPainel({
    colunas: [
      { titulo: 'OS' },
      { titulo: 'Título' },
      { titulo: 'Pagamento' },
      { titulo: 'Conclusão' },
      { titulo: 'Total', classe: 'texto-direita' }
    ],
    linhas,
    vazio: 'Nenhuma OS concluída e paga ainda.',
    minWidth: 720
  });
}

async function carregarResumoRelatoriosRecorrentesPainel() {
  const precisaCarregar =
    pegarElemento('painel-recorrentes-vencidas') ||
    pegarElemento('painel-recorrentes-7') ||
    pegarElemento('painel-relatorio-faturado-mes') ||
    pegarElemento('painel-relatorio-os-mes');

  if (!precisaCarregar) return;

  try {
    const plano = normalizarPlanoPainel(localStorage.getItem('usuario_plano') || perfilAtual?.plano || 'gratis');
    const bloco = pegarElemento('painel-premium-gestao-avancada');

    if (plano !== 'premium') {
      if (bloco) bloco.style.display = 'none';
      return;
    }

    if (bloco) bloco.style.display = 'block';

    const [ordens, recorrentes] = await Promise.all([
      buscarTabelaDoUsuarioPainel('ordens_servico', '*', {
        camposUsuario: ['user_id', 'usuario_id'],
        orderBy: 'created_at',
        ascending: false
      }),
      buscarTabelaDoUsuarioPainel('servicos_recorrentes', '*', {
        camposUsuario: ['user_id', 'usuario_id'],
        orderBy: 'proxima_data',
        ascending: true
      })
    ]);

    const osMes = ordens.filter(os =>
      statusOrdemEhConcluida(normalizarStatusOrdemServicoPainel(os.status)) &&
      estaNoMesAtualPainel(obterDataConclusaoOSPainel(os) || os.updated_at || os.created_at)
    );

    const faturadoMes = osMes.reduce((soma, os) => soma + obterValorTotalOrdemServicoPainel(os), 0);

    const vencidas = recorrentes.filter(item => {
      const dias = diasAteDataPainel(item.proxima_data);
      return normalizarStatusOrdemServicoPainel(item.status || 'ativo') === 'ativo' && dias !== null && dias < 0;
    }).length;

    const proximos7 = recorrentes.filter(item => {
      const dias = diasAteDataPainel(item.proxima_data);
      return normalizarStatusOrdemServicoPainel(item.status || 'ativo') === 'ativo' && dias !== null && dias >= 0 && dias <= 7;
    }).length;

    atualizarTexto('painel-recorrentes-vencidas', vencidas);
    atualizarTexto('painel-recorrentes-7', proximos7);
    atualizarTexto('painel-relatorio-faturado-mes', formatarMoedaPainel(faturadoMes));
    atualizarTexto('painel-relatorio-os-mes', osMes.length);
  } catch (erro) {
    console.warn('Não foi possível carregar resumo Premium avançado:', erro);
    atualizarTexto('painel-recorrentes-vencidas', '-');
    atualizarTexto('painel-recorrentes-7', '-');
    atualizarTexto('painel-relatorio-faturado-mes', '-');
    atualizarTexto('painel-relatorio-os-mes', '-');
  }
}

// ==================== DASHBOARD DE ORÇAMENTOS ====================

async function carregarDashboardPainel() {
  atualizarCardPlano(perfilAtual);

  const session = await obterSessaoPainel();
  if (!session) return;

  const { data, error } = await _supabase
    .from('orcamentos')
    .select('id, status, total, criado_em')
    .eq('usuario_id', session.user.id);

  if (error) {
    console.warn('Não foi possível carregar dashboard:', error);
    return;
  }

  const orcamentos = data || [];
  const total = orcamentos.length;
  const pendentes = orcamentos.filter(o => normalizarStatusPainel(o.status || 'pendente') === 'pendente').length;
  const aprovados = orcamentos.filter(o => normalizarStatusPainel(o.status) === 'aprovado');
  const aprovadosMes = aprovados.filter(o => estaNoMesAtualPainel(o.criado_em));
  const valorAprovadoMes = aprovadosMes.reduce((soma, o) => soma + converterNumeroPainel(o.total), 0);
  const taxaAprovacao = total > 0 ? Math.round((aprovados.length / total) * 100) : 0;

  atualizarTexto('dash-total-orcamentos', total);
  atualizarTexto('dash-pendentes', pendentes);
  atualizarTexto('dash-aprovados-mes', aprovadosMes.length);
  atualizarTexto('dash-valor-aprovado-mes', formatarMoedaPainel(valorAprovadoMes));
  atualizarTexto('dash-taxa-aprovacao', `${taxaAprovacao}%`);
  atualizarTexto('dash-atualizado-em', formatarDataHoraPainel(new Date().toISOString()));
}

async function carregarUltimosOrcamentosPainel() {
  const container = pegarElemento('lista-ultimos-orcamentos-painel');
  if (!container) return;

  const session = await obterSessaoPainel();
  if (!session) return;

  container.innerHTML = '<div class="painel-aviso">Carregando últimos orçamentos...</div>';

  const { data, error } = await _supabase
    .from('orcamentos')
    .select('id, numero_orcamento, assunto, cliente_nome, total, status, forma_pagamento_cliente, criado_em')
    .eq('usuario_id', session.user.id)
    .order('criado_em', { ascending: false })
    .limit(5);

  if (error) {
    console.warn('Erro ao buscar últimos orçamentos:', error);
    container.innerHTML = `
      <div class="painel-aviso">
        Não foi possível carregar os últimos orçamentos.
        <br>
        <small>${escaparHtmlPainel(error.message || '')}</small>
      </div>
    `;
    return;
  }

  const orcamentos = data || [];

  const linhas = orcamentos.map(o => {
    const numero = o.numero_orcamento ? String(o.numero_orcamento).padStart(6, '0') : '-';
    const href = `/orcamentos.html?orcamento=${encodeURIComponent(o.id || '')}`;

    return montarLinhaTabelaPainel([
      { valor: numero, classe: 'texto-forte' },
      { valor: o.cliente_nome || '-' },
      { valor: o.assunto || '-' },
      { valor: statusOrcamentoLabel(o.status) },
      { valor: formaPagamentoPainelLabel(o.forma_pagamento_cliente) },
      { valor: formatarMoedaPainel(o.total), classe: 'texto-direita texto-forte' }
    ], href);
  });

  container.innerHTML = montarTabelaPainel({
    colunas: [
      { titulo: 'Nº' },
      { titulo: 'Cliente' },
      { titulo: 'Assunto' },
      { titulo: 'Status' },
      { titulo: 'Pagamento' },
      { titulo: 'Total', classe: 'texto-direita' }
    ],
    linhas,
    vazio: 'Nenhum orçamento criado ainda.',
    minWidth: 760
  });
}

// ==================== GERADOR GLOBAL E EVENTOS ====================

function abrirGeradorGlobal() {
  window.location.href = '/gerador.html';
}

document.addEventListener('click', event => {
  const linhaTabela = event.target.closest?.('tr[data-href]');
  if (linhaTabela?.dataset?.href) {
    window.location.href = linhaTabela.dataset.href;
    return;
  }

  const modalPerfil = pegarElemento('modal-editar-perfil');
  const modalSenha = pegarElemento('modal-senha');
  const modalResponsavel = pegarElemento('modal-responsavel-interno');
  const modalExcluirConta = pegarElemento('modal-excluir-conta');

  if (event.target === modalPerfil) fecharModalEditarPerfil();
  if (event.target === modalSenha) fecharModalSenha();
  if (event.target === modalResponsavel) fecharModalResponsavelInterno();
  if (event.target === modalExcluirConta) fecharModalExcluirConta();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  fecharModalResponsavelInterno();
  fecharModalEditarPerfil();
  fecharModalSenha();
  fecharModalExcluirConta();
});

// ==================== EXPORTAÇÕES GLOBAIS ====================

Object.assign(window, {
  carregarPerfil,
  salvarPerfil,
  configurarUploadLogo,
  enviarLogoPerfil,
  removerLogoPerfil,
  abrirModalEditarPerfil,
  fecharModalEditarPerfil,
  abrirModalSenha,
  fecharModalSenha,
  alterarSenhaSegura,
  abrirModalExcluirConta,
  fecharModalExcluirConta,
  excluirMinhaConta,
  abrirModalResponsavelInterno,
  fecharModalResponsavelInterno,
  salvarResponsavel,
  excluirResponsavel,
  carregarResumoOrdensServicoPainel,
  carregarIndicadoresPremiumPainel,
  carregarResumoRelatoriosRecorrentesPainel,
  carregarDashboardPainel,
  carregarUltimosOrcamentosPainel,
  abrirGeradorGlobal,
  usuarioJaTemPlanoPago
});
