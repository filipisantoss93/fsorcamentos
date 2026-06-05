// ==================== VARIÁVEIS GLOBAIS ====================

let perfilAtual = null;
let painelJaCarregado = false;
let responsaveisCache = [];

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  const session = await obterSessaoPainel();

  if (!session) {
    mostrarAreaLoginPainel();
    return;
  }

  await inicializarPainel(session);
});

if (window._supabase) {
  _supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      await inicializarPainel(session);
      return;
    }

    painelJaCarregado = false;
    perfilAtual = null;
    window.perfilAtual = null;
    responsaveisCache = [];

    mostrarAreaLoginPainel();
  });
}

async function inicializarPainel(session) {
  mostrarConteudoProtegidoPainel();

  limparCardsPlanoDuplicados();

  await carregarPerfil();
  await carregarResponsaveis();
  configurarUploadLogo();

  atualizarCardPlano(perfilAtual);

  await carregarDashboardPainel();
  await carregarUltimosOrcamentosPainel();

  painelJaCarregado = true;
}

// ==================== HELPERS BÁSICOS ====================

function pegarElemento(id) {
  return document.getElementById(id);
}

function setValor(id, valor) {
  const el = pegarElemento(id);
  if (el) el.value = valor || '';
}

function getValor(id) {
  const el = pegarElemento(id);
  return el ? el.value.trim() : '';
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

function normalizarPlanoPainel(valor) {
  return String(valor || 'gratis')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatarMoedaPainel(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarDataPainel(dataValor) {
  if (!dataValor) return '-';

  const data = new Date(dataValor);

  if (isNaN(data.getTime())) return '-';

  return data.toLocaleDateString('pt-BR');
}

function formatarDataHoraPainel(dataValor) {
  if (!dataValor) return '-';

  const data = new Date(dataValor);

  if (isNaN(data.getTime())) return '-';

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function diasAteExpirar(dataValor) {
  if (!dataValor) return null;

  const hoje = new Date();
  const expira = new Date(dataValor);

  if (isNaN(expira.getTime())) return null;

  hoje.setHours(0, 0, 0, 0);
  expira.setHours(0, 0, 0, 0);

  const diff = expira.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function planoLabel(plano) {
  const p = normalizarPlanoPainel(plano);

  if (p === 'premium') return 'Plano Premium';
  if (p === 'basico') return 'Plano Básico';

  return 'Plano Grátis';
}

function statusPlanoLabel(status) {
  const s = normalizarPlanoPainel(status || 'ativo');

  if (s === 'ativo') return 'Ativo';
  if (s === 'pago') return 'Ativo';
  if (s === 'cancelado') return 'Cancelado';
  if (s === 'expirado') return 'Expirado';
  if (s === 'pendente') return 'Pendente';

  return status || 'Ativo';
}

function statusOrcamentoLabel(status) {
  const mapa = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    em_servico: 'Em serviço',
    finalizado: 'Finalizado'
  };

  return mapa[status] || status || 'Pendente';
}

function mostrarStatus(id, mensagem, tipo = 'sucesso') {
  const el = document.getElementById(id);
  if (!el) return;

  el.className = `status-msg ${tipo}`;
  el.innerText = mensagem;

  if (mensagem) {
    setTimeout(() => {
      el.className = 'status-msg';
      el.innerText = '';
    }, 4500);
  }
}

function atualizarTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.innerText = valor;
}

// ==================== CONTROLE DE TELA ====================

function mostrarAreaLoginPainel() {
  const authArea = document.getElementById('auth-area');
  const conteudo = document.getElementById('conteudo-protegido');

  if (authArea) authArea.style.display = 'block';
  if (conteudo) conteudo.style.display = 'none';
}

function mostrarConteudoProtegidoPainel() {
  const authArea = document.getElementById('auth-area');
  const conteudo = document.getElementById('conteudo-protegido');

  if (authArea) authArea.style.display = 'none';
  if (conteudo) conteudo.style.display = 'block';
}

async function obterSessaoPainel() {
  try {
    if (!window._supabase) return null;

    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error || !session) return null;

    return session;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

// ==================== LIMPEZA DE DUPLICAÇÕES ====================

function limparCardsPlanoDuplicados() {
  const cardsPorId = document.querySelectorAll('#card-plano-painel');

  cardsPorId.forEach(card => {
    card.remove();
  });

  const cardsPainel = document.querySelectorAll('.painel-card');

  cardsPainel.forEach(card => {
    const titulo = card.querySelector('h2');

    if (
      titulo &&
      titulo.innerText &&
      titulo.innerText.trim().toLowerCase() === 'dados do plano'
    ) {
      card.remove();
    }
  });
}

// ==================== PLANO / ASSINATURA ====================

function usuarioJaTemPlanoPago(perfil) {
  const plano = normalizarPlanoPainel(
    perfil?.plano ||
    localStorage.getItem('usuario_plano') ||
    'gratis'
  );

  const status = normalizarPlanoPainel(
    perfil?.plano_status ||
    localStorage.getItem('usuario_plano_status') ||
    'ativo'
  );

  if (plano === 'premium') return true;

  if (plano === 'basico' && status !== 'cancelado' && status !== 'expirado') {
    const dias = diasAteExpirar(
      perfil?.plano_expira_em ||
      localStorage.getItem('usuario_plano_expira_em')
    );

    if (dias === null) return true;

    return dias >= 0;
  }

  return false;
}

function montarTextoExpiracaoPlano(perfil) {
  const plano = normalizarPlanoPainel(perfil?.plano);
  const expiraEm = perfil?.plano_expira_em;

  if (plano === 'gratis') return 'Sem expiração';
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
  const status = normalizarPlanoPainel(perfil?.plano_status || 'ativo');
  const dias = diasAteExpirar(perfil?.plano_expira_em);

  if (plano === 'gratis') {
    return {
      tipo: 'gratis',
      texto: 'Você está no Plano Grátis. Ative o Plano Básico para salvar orçamentos na nuvem, usar histórico, WhatsApp com link, aprovação online e resumo financeiro.'
    };
  }

  if (status === 'cancelado') {
    return {
      tipo: 'erro',
      texto: 'Seu plano está cancelado. Renove para continuar usando os recursos pagos.'
    };
  }

  if (status === 'expirado' || (dias !== null && dias < 0)) {
    return {
      tipo: 'erro',
      texto: 'Seu plano expirou. Renove o Plano Básico para continuar usando os recursos pagos.'
    };
  }

  if (dias !== null && dias <= 7) {
    return {
      tipo: 'alerta',
      texto: `Seu plano vence ${dias === 0 ? 'hoje' : `em ${dias} dia(s)`}. Renove para evitar bloqueio dos recursos pagos.`
    };
  }

  return {
    tipo: 'ok',
    texto: 'Seu plano está ativo.'
  };
}

function atualizarCardPlano(perfil) {
  const planoAtual = perfil?.plano || 'gratis';
  const planoNormalizado = normalizarPlanoPainel(planoAtual);

  const badge = document.getElementById('perfil-plano');
  const planoTexto = document.getElementById('perfil-plano-texto');
  const statusEl = document.getElementById('perfil-plano-status');
  const expiraEl = document.getElementById('perfil-plano-expira');
  const avisoEl = document.getElementById('perfil-plano-aviso');
  const limiteEl = document.getElementById('perfil-limite-responsaveis');

  if (badge) {
    badge.innerText = planoLabel(planoAtual);

    badge.classList.remove('plano-gratis', 'plano-basico', 'plano-premium');

    if (planoNormalizado === 'basico') {
      badge.classList.add('plano-basico');
    } else if (planoNormalizado === 'premium') {
      badge.classList.add('plano-premium');
    } else {
      badge.classList.add('plano-gratis');
    }
  }

  if (planoTexto) {
    planoTexto.innerText = planoLabel(planoAtual);

    planoTexto.removeAttribute('class');
    planoTexto.style.background = 'transparent';
    planoTexto.style.color = '#3e2723';
    planoTexto.style.border = 'none';
    planoTexto.style.boxShadow = 'none';
    planoTexto.style.padding = '0';
    planoTexto.style.borderRadius = '0';
    planoTexto.style.fontSize = '24px';
    planoTexto.style.fontWeight = '900';
    planoTexto.style.lineHeight = '1.25';
  }

  if (statusEl) {
    statusEl.innerText = statusPlanoLabel(perfil?.plano_status || 'ativo');
  }

  if (expiraEl) {
    expiraEl.innerText = montarTextoExpiracaoPlano(perfil);
  }

  if (limiteEl) {
    limiteEl.innerText = String(limiteResponsaveisPorPlano());
  }

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

  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em')
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
  const responsavelEl = document.getElementById('perfil-responsavel-selecionado');
  const empresaEl = document.getElementById('perfil-empresa');
  const telefoneEl = document.getElementById('perfil-telefone');
  const cnpjEl = document.getElementById('perfil-cnpj');
  const enderecoEl = document.getElementById('perfil-endereco');

  if (responsavelEl) responsavelEl.innerText = valorOuTraco(data?.nome);
  if (empresaEl) empresaEl.innerText = valorOuTraco(data?.nome_empresa);
  if (telefoneEl) telefoneEl.innerText = valorOuTraco(data?.telefone_empresa);
  if (cnpjEl) cnpjEl.innerText = valorOuTraco(data?.cnpj_empresa);
  if (enderecoEl) enderecoEl.innerText = valorOuTraco(data?.endereco_empresa);

  atualizarLogoEstatica(data?.foto_url || '');

  const nomeLocal =
    data?.nome ||
    data?.nome_empresa ||
    session?.user?.email?.split('@')[0] ||
    'Usuário';

  localStorage.setItem('usuario_nome', nomeLocal);
  localStorage.setItem('usuario_plano', data?.plano || 'gratis');
  localStorage.setItem('nome_empresa', data?.nome_empresa || '');
  localStorage.setItem('telefone_empresa', data?.telefone_empresa || '');
  localStorage.setItem('endereco_empresa', data?.endereco_empresa || '');
  localStorage.setItem('cnpj_empresa', data?.cnpj_empresa || '');

  if (data?.foto_url) {
    localStorage.setItem('foto_url', data.foto_url);
  } else {
    localStorage.removeItem('foto_url');
  }

  if (data?.plano_status) {
    localStorage.setItem('usuario_plano_status', data.plano_status);
  } else {
    localStorage.removeItem('usuario_plano_status');
  }

  if (data?.plano_expira_em) {
    localStorage.setItem('usuario_plano_expira_em', data.plano_expira_em);
  } else {
    localStorage.removeItem('usuario_plano_expira_em');
  }
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

  perfilAtual = {
    ...perfilAtual,
    ...payload
  };

  window.perfilAtual = perfilAtual;

  preencherCamposEstaticos(perfilAtual, session);
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);

  if (typeof carregarMenu === 'function') {
    await carregarMenu(session);
  }

  mostrarStatus('status-perfil', 'Perfil atualizado com sucesso.', 'sucesso');

  setTimeout(() => {
    fecharModalEditarPerfil();
  }, 700);
}

// ==================== LOGO ====================

function atualizarPreviewLogo(url) {
  const img = document.getElementById('preview-logo');
  const placeholder = document.getElementById('logo-placeholder');

  if (!img || !placeholder) return;

  if (url) {
    img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'block';
  }
}

function atualizarLogoEstatica(url) {
  const img = document.getElementById('perfil-logo-img');
  const placeholder = document.getElementById('perfil-logo-placeholder');

  if (!img || !placeholder) return;

  if (url) {
    img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'block';
  }
}

function configurarUploadLogo() {
  const input = document.getElementById('logo_file');

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
    .update({
      foto_url: logoUrl,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', session.user.id);

  if (perfilError) {
    console.error('Erro ao salvar URL da logo:', perfilError);
    mostrarStatus('status-logo', 'Logo enviada, mas não foi possível salvar no perfil.', 'erro');
    return;
  }

  perfilAtual = {
    ...perfilAtual,
    foto_url: logoUrl
  };

  window.perfilAtual = perfilAtual;

  localStorage.setItem('foto_url', logoUrl);

  mostrarStatus('status-logo', 'Logo salva com sucesso.', 'sucesso');
}

async function removerLogoPerfil() {
  const confirmar = confirm('Deseja remover a logo da empresa?');

  if (!confirmar) return;

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
    .update({
      foto_url: '',
      atualizado_em: new Date().toISOString()
    })
    .eq('id', session.user.id);

  if (error) {
    console.error('Erro ao remover logo:', error);
    mostrarStatus('status-logo', 'Erro ao remover logo.', 'erro');
    return;
  }

  setValor('foto_url', '');
  atualizarPreviewLogo('');
  atualizarLogoEstatica('');

  perfilAtual = {
    ...perfilAtual,
    foto_url: ''
  };

  window.perfilAtual = perfilAtual;

  localStorage.removeItem('foto_url');

  mostrarStatus('status-logo', 'Logo removida com sucesso.', 'sucesso');
}

// ==================== RESPONSÁVEIS ====================

function obterResponsavelSelecionadoNome() {
  return perfilAtual?.nome || '';
}

function limiteResponsaveisPorPlano() {
  const plano = normalizarPlanoPainel(
    perfilAtual?.plano ||
    localStorage.getItem('usuario_plano') ||
    'gratis'
  );

  if (plano === 'premium') return 10;
  if (plano === 'basico') return 2;

  return 1;
}

async function carregarResponsaveis() {
  const session = await obterSessaoPainel();
  if (!session) return;

  const container = document.getElementById('lista-responsaveis');

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
  const nomeSelecionado = perfilAtual?.nome?.trim();

  if (!nomeSelecionado) return;

  const jaExiste = responsaveisCache.some(resp =>
    String(resp.nome || '').trim().toLowerCase() === nomeSelecionado.toLowerCase()
  );

  if (jaExiste) return;

  if (responsaveisCache.length >= limiteResponsaveisPorPlano()) return;

  const { data, error } = await _supabase
    .from('responsaveis_orcamento')
    .insert({
      usuario_id: session.user.id,
      nome: nomeSelecionado,
      ativo: true
    })
    .select()
    .single();

  if (!error && data) {
    responsaveisCache.push(data);
  }
}

function preencherSelectResponsaveis() {
  const select = document.getElementById('responsavel_selecionado');

  if (!select) return;

  const selecionado = obterResponsavelSelecionadoNome();

  select.innerHTML = '';

  if (!responsaveisCache.length && selecionado) {
    const option = document.createElement('option');
    option.value = selecionado;
    option.textContent = selecionado;
    select.appendChild(option);
    return;
  }

  if (!responsaveisCache.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Cadastre um responsável';
    select.appendChild(option);
    return;
  }

  responsaveisCache.forEach(resp => {
    const option = document.createElement('option');
    option.value = resp.nome;
    option.textContent = resp.nome;
    select.appendChild(option);
  });

  if (selecionado) {
    select.value = selecionado;
  }

  if (!select.value && responsaveisCache[0]) {
    select.value = responsaveisCache[0].nome;
  }
}

function renderizarListaResponsaveis() {
  const container = document.getElementById('lista-responsaveis');

  if (!container) return;

  const selecionado = obterResponsavelSelecionadoNome();

  if (!responsaveisCache.length) {
    container.innerHTML = `
      <div class="responsavel-item">
        <div>
          <span>Nenhum responsável cadastrado</span>
          <small>Cadastre um responsável para selecionar no perfil.</small>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = responsaveisCache.map(resp => {
    const ativo = String(resp.nome || '') === String(selecionado || '');

    return `
      <div class="responsavel-item ${ativo ? 'selecionado' : ''}">
        <div>
          <span>${escaparHtmlPainel(resp.nome)}</span>
          <small>${ativo ? 'Responsável selecionado' : 'Responsável cadastrado'}</small>
        </div>

        <button type="button" onclick="excluirResponsavel('${resp.id}')">
          Excluir
        </button>
      </div>
    `;
  }).join('');
}

function abrirModalResponsavelInterno() {
  const limite = limiteResponsaveisPorPlano();

  if (responsaveisCache.length >= limite) {
    alert(`Seu plano permite no máximo ${limite} responsável(is).`);
    return;
  }

  const input = document.getElementById('novo-responsavel-nome');
  if (input) input.value = '';

  const status = document.getElementById('status-responsavel');

  if (status) {
    status.className = 'status-msg';
    status.innerText = '';
  }

  const modal = document.getElementById('modal-responsavel-interno');

  if (modal) modal.style.display = 'flex';

  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}

function fecharModalResponsavelInterno() {
  const modal = document.getElementById('modal-responsavel-interno');
  if (modal) modal.style.display = 'none';
}

async function salvarResponsavel() {
  const session = await obterSessaoPainel();
  if (!session) return;

  const input = document.getElementById('novo-responsavel-nome');
  const nome = input?.value?.trim() || '';

  if (!nome) {
    mostrarStatus('status-responsavel', 'Informe o nome do responsável.', 'erro');
    return;
  }

  const limite = limiteResponsaveisPorPlano();

  if (responsaveisCache.length >= limite) {
    mostrarStatus('status-responsavel', `Seu plano permite no máximo ${limite} responsável(is).`, 'erro');
    return;
  }

  const jaExiste = responsaveisCache.some(resp =>
    String(resp.nome || '').trim().toLowerCase() === nome.toLowerCase()
  );

  if (jaExiste) {
    mostrarStatus('status-responsavel', 'Este responsável já está cadastrado.', 'erro');
    return;
  }

  const { data, error } = await _supabase
    .from('responsaveis_orcamento')
    .insert({
      usuario_id: session.user.id,
      nome,
      ativo: true
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar responsável:', error);
    mostrarStatus('status-responsavel', 'Erro ao salvar responsável.', 'erro');
    return;
  }

  if (data) {
    responsaveisCache.push(data);
  }

  fecharModalResponsavelInterno();

  preencherSelectResponsaveis();

  const select = document.getElementById('responsavel_selecionado');
  if (select) select.value = nome;

  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);
}

async function excluirResponsavel(id) {
  const responsavel = responsaveisCache.find(resp => resp.id === id);

  if (responsavel && responsavel.nome === perfilAtual?.nome) {
    alert('Este responsável está selecionado. Selecione outro responsável antes de excluir.');
    return;
  }

  const confirmar = confirm('Deseja excluir este responsável?');

  if (!confirmar) return;

  const session = await obterSessaoPainel();
  if (!session) return;

  const { error } = await _supabase
    .from('responsaveis_orcamento')
    .delete()
    .eq('id', id)
    .eq('usuario_id', session.user.id);

  if (error) {
    console.error('Erro ao excluir responsável:', error);
    alert('Erro ao excluir responsável.');
    return;
  }

  responsaveisCache = responsaveisCache.filter(resp => resp.id !== id);
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();
  atualizarCardPlano(perfilAtual);
}

// ==================== MODAIS PERFIL / SENHA ====================

function abrirModalEditarPerfil() {
  preencherFormularioEdicao(perfilAtual || {});
  preencherSelectResponsaveis();
  renderizarListaResponsaveis();

  const modal = document.getElementById('modal-editar-perfil');
  if (modal) modal.style.display = 'flex';
}

function fecharModalEditarPerfil() {
  const modal = document.getElementById('modal-editar-perfil');
  if (modal) modal.style.display = 'none';
}

function abrirModalSenha() {
  setValor('senha_atual', '');
  setValor('nova_senha', '');
  setValor('confirmar_senha', '');

  const modal = document.getElementById('modal-senha');
  if (modal) modal.style.display = 'flex';
}

function fecharModalSenha() {
  const modal = document.getElementById('modal-senha');
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

  const { error: updateError } = await _supabase.auth.updateUser({
    password: novaSenha
  });

  if (updateError) {
    console.error('Erro ao alterar senha:', updateError);
    mostrarStatus('status-senha', 'Erro ao alterar senha.', 'erro');
    return;
  }

  fecharModalSenha();
  alert('Senha alterada com sucesso.');
}

// ==================== DASHBOARD ====================

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

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const total = orcamentos.length;
  const pendentes = orcamentos.filter(o => (o.status || 'pendente') === 'pendente').length;
  const aprovados = orcamentos.filter(o => (o.status || '') === 'aprovado');

  const aprovadosMes = aprovados.filter(o => {
    const d = new Date(o.criado_em);
    return !isNaN(d.getTime()) && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const valorAprovadoMes = aprovadosMes.reduce((soma, o) => soma + Number(o.total || 0), 0);
  const taxaAprovacao = total > 0 ? Math.round((aprovados.length / total) * 100) : 0;

  atualizarTexto('dash-total-orcamentos', total);
  atualizarTexto('dash-pendentes', pendentes);
  atualizarTexto('dash-aprovados-mes', aprovadosMes.length);
  atualizarTexto('dash-valor-aprovado-mes', formatarMoedaPainel(valorAprovadoMes));
  atualizarTexto('dash-taxa-aprovacao', `${taxaAprovacao}%`);
  atualizarTexto('dash-atualizado-em', formatarDataHoraPainel(new Date().toISOString()));
}

async function carregarUltimosOrcamentosPainel() {
  garantirEstruturaPainel();

  const container = document.getElementById('lista-ultimos-orcamentos-painel');
  if (!container) return;

  const session = await obterSessaoPainel();
  if (!session) return;

  container.innerHTML = `
    <div class="painel-aviso">
      Carregando últimos orçamentos...
    </div>
  `;

  const { data, error } = await _supabase
    .from('orcamentos')
    .select('id, numero_orcamento, assunto, cliente_nome, total, status, forma_pagamento_cliente, criado_em')
    .eq('usuario_id', session.user.id)
    .order('criado_em', { ascending: false })
    .limit(6);

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

  if (!orcamentos.length) {
    container.innerHTML = `
      <div class="painel-aviso">
        Nenhum orçamento criado ainda.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="width:100%; overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; min-width:760px; background:#fff; border-radius:12px; overflow:hidden;">
        <thead>
          <tr style="background:#3e2723; color:#ffc400;">
            <th style="padding:10px; text-align:left;">Nº</th>
            <th style="padding:10px; text-align:left;">Cliente</th>
            <th style="padding:10px; text-align:left;">Assunto</th>
            <th style="padding:10px; text-align:left;">Status</th>
            <th style="padding:10px; text-align:left;">Pagamento</th>
            <th style="padding:10px; text-align:right;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${orcamentos.map(o => `
            <tr onclick="window.location.href='/orcamentos.html?orcamento=${encodeURIComponent(o.id)}'" style="cursor:pointer;">
              <td style="padding:10px; border-bottom:1px solid #eee; font-weight:800;">
                ${o.numero_orcamento ? String(o.numero_orcamento).padStart(6, '0') : '-'}
              </td>

              <td style="padding:10px; border-bottom:1px solid #eee;">
                ${escaparHtmlPainel(o.cliente_nome || '-')}
              </td>

              <td style="padding:10px; border-bottom:1px solid #eee;">
                ${escaparHtmlPainel(o.assunto || '-')}
              </td>

              <td style="padding:10px; border-bottom:1px solid #eee;">
                ${escaparHtmlPainel(statusOrcamentoLabel(o.status))}
              </td>

              <td style="padding:10px; border-bottom:1px solid #eee;">
                ${escaparHtmlPainel(formaPagamentoPainelLabel(o.forma_pagamento_cliente))}
              </td>

              <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:800;">
                ${formatarMoedaPainel(o.total)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function formaPagamentoPainelLabel(valor) {
  const forma = normalizarPlanoPainel(valor);

  const mapa = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    credito: 'Crédito',
    debito: 'Débito',
    cartao_credito: 'Cartão de crédito',
    cartao_debito: 'Cartão de débito'
  };

  return mapa[forma] || (valor ? String(valor) : '-');
}

// ==================== GERADOR GLOBAL ====================

function abrirGeradorGlobal() {
  window.location.href = '/gerador.html';
}

// ==================== EVENTOS GLOBAIS ====================

document.addEventListener('click', event => {
  const modalPerfil = document.getElementById('modal-editar-perfil');
  const modalSenha = document.getElementById('modal-senha');
  const modalResponsavel = document.getElementById('modal-responsavel-interno');

  if (event.target === modalPerfil) fecharModalEditarPerfil();
  if (event.target === modalSenha) fecharModalSenha();
  if (event.target === modalResponsavel) fecharModalResponsavelInterno();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    fecharModalResponsavelInterno();
    fecharModalEditarPerfil();
    fecharModalSenha();
  }
});

// ==================== EXPORTAÇÕES GLOBAIS ====================

window.carregarPerfil = carregarPerfil;
window.salvarPerfil = salvarPerfil;
window.configurarUploadLogo = configurarUploadLogo;
window.enviarLogoPerfil = enviarLogoPerfil;
window.removerLogoPerfil = removerLogoPerfil;

window.abrirModalEditarPerfil = abrirModalEditarPerfil;
window.fecharModalEditarPerfil = fecharModalEditarPerfil;

window.abrirModalSenha = abrirModalSenha;
window.fecharModalSenha = fecharModalSenha;
window.alterarSenhaSegura = alterarSenhaSegura;

window.abrirModalResponsavelInterno = abrirModalResponsavelInterno;
window.fecharModalResponsavelInterno = fecharModalResponsavelInterno;
window.salvarResponsavel = salvarResponsavel;
window.excluirResponsavel = excluirResponsavel;

window.abrirGeradorGlobal = abrirGeradorGlobal;