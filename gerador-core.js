/* FS ORÇAMENTOS — gerador.js
   Gerador focado em orçamento manual: cliente, itens, PDF, WhatsApp e salvamento. */

let perfilGeradorAtual = null;
let orcamentoSalvoAtualId = window.orcamentoAtualSalvoId || window.orcamentoSalvoAtualId || null;
let enviandoWhatsappFS = false;

function abrirModalLoginGerador() {
  const modal = document.getElementById('modal-login');
  const authArea = document.getElementById('auth-area');
  const authContainer = document.getElementById('auth-container');
  const form = document.getElementById('form-autenticacao');

  [authArea, authContainer, form].forEach(el => {
    if (!el) return;
    el.style.display = 'block';
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  });

  if (!modal) return;

  modal.style.display = 'flex';
  document.body.classList.add('login-modal-aberto');
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
  if (typeof podeSalvarOrcamentoNaNuvem === 'function') return podeSalvarOrcamentoNaNuvem();
  const plano = fsPlanoAtualNormalizado();
  return plano === 'basico' || plano === 'premium';
}

function fsPlanoPermiteRecursosPremiumGerador() {
  if (typeof podeUsarPremium === 'function') return podeUsarPremium();
  return fsPlanoAtualNormalizado() === 'premium';
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

function fsSetValorCampo(id, valor) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.value = valor || '';
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
    localStorage.setItem('usuario_nome', data.nome || data.nome_empresa || session.user.email?.split('@')[0] || '');
    localStorage.setItem('usuario_plano', data.plano || 'gratis');
    localStorage.setItem('nome_empresa', data.nome_empresa || '');
    localStorage.setItem('telefone_empresa', data.telefone_empresa || '');
    localStorage.setItem('endereco_empresa', data.endereco_empresa || '');
    localStorage.setItem('cnpj_empresa', data.cnpj_empresa || '');

    if (data.foto_url) localStorage.setItem('foto_url', data.foto_url);
    else localStorage.removeItem('foto_url');
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

function limparVinculosAntigosOrcamento() {
  fsSetValorCampo('cliente-id-cadastrado', '');
  fsSetValorCampo('orcamento-cliente-id', '');
  fsSetValorCampo('orcamento-veiculo-id', '');

  try {
    localStorage.removeItem('orcamento_cliente_id');
    localStorage.removeItem('orcamento_veiculo_id');
  } catch (error) {
    console.warn('Não foi possível limpar vínculos antigos:', error);
  }

  ['cliente-vinculado-card', 'veiculo-vinculado-card'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  document.querySelectorAll('.cliente-id-acoes, .veiculo-orcamento-card, .modal-busca-cliente-overlay').forEach(el => {
    el.style.display = 'none';
  });
}

function aplicarLimitesPlanoGerador() {
  limparVinculosAntigosOrcamento();
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
      setTimeout(abrirModalLoginGerador, 300);
      return;
    }

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session?.user?.id) {
      if (conteudo) conteudo.style.display = 'none';
      setTimeout(abrirModalLoginGerador, 300);
      return;
    }

    fecharModalLoginGerador();
    if (conteudo) conteudo.style.display = 'block';

    const perfilBanco = await fsBuscarPerfilUsuario(session);
    const perfil = perfilBanco || fsPerfilLocalFallback();

    fsPreencherTopoEmpresa(perfil);
    limparVinculosAntigosOrcamento();

    if (statusCard) {
      statusCard.style.display = fsPerfilCompleto(perfil) ? 'none' : 'block';
      statusCard.innerHTML = fsPerfilCompleto(perfil)
        ? ''
        : 'Complete os dados da empresa no Painel de Controle para deixar o PDF profissional.';
    }

    if (typeof carregarEstadoSalvo === 'function') carregarEstadoSalvo();

    setTimeout(() => {
      const linhas = document.querySelectorAll('#itens-lista .item-row:not(.header-labels)');
      if (!linhas.length && typeof adicionarLinha === 'function') adicionarLinha();
    }, 400);

    fsAtualizarAnunciosGratisGerador();
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    if (conteudo) conteudo.style.display = 'none';
    setTimeout(abrirModalLoginGerador, 300);
  }
}

function fsLimparTelefoneWhatsapp(valor) {
  let telefone = String(valor || '').replace(/\D/g, '');
  if (!telefone) return '';
  if (telefone.startsWith('00')) telefone = telefone.substring(2);
  if (telefone.length === 10 || telefone.length === 11) telefone = '55' + telefone;
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

    if (!subtotal) subtotal = qtd * valor;

    if (descricao) {
      itens.push({ descricao, qtd, valor, subtotal });
    }
  });

  return itens;
}

function fsColetarDadosOrcamentoAtual() {
  const titulo = document.getElementById('titulo')?.value?.trim() || 'Sem título';
  const clienteNome = document.getElementById('cliente')?.value?.trim() || '';
  const clienteWhatsapp = document.getElementById('tel-cliente')?.value?.trim() || '';
  const observacoes = document.getElementById('observacoes')?.value?.trim() || '';
  const tema = document.getElementById('selected-theme')?.value || 'original';
  const itens = fsColetarItensParaSalvar();
  const total = itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0);

  return {
    titulo,
    clienteId: '',
    clienteNome,
    clienteWhatsapp,
    veiculoId: '',
    veiculo: null,
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

  const payloadCompleto = {
    usuario_id: session.user.id,
    assunto: dados.titulo,
    cliente_nome: dados.clienteNome,
    cliente_whatsapp: dados.clienteWhatsapp,
    observacoes: dados.observacoes,
    itens: dados.itens,
    total: dados.total,
    status: 'pendente',
    consultor,
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

  if (typeof definirOrcamentoAtualSalvo === 'function') definirOrcamentoAtualSalvo(resposta.data.id);

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
      if (finalizadas >= imagens.length) requestAnimationFrame(() => setTimeout(resolve, 500));
    }

    imagens.forEach(img => {
      if (img.complete) finalizar();
      else {
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

  if (!conteudoPdf.innerHTML.trim() && typeof gerarPrevia === 'function') await gerarPrevia();

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
    image: { type: 'jpeg', quality: 0.98 },
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
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(folha).save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Não foi possível gerar o PDF.');
  } finally {
    document.body.classList.remove('gerando-pdf');
  }
}

function montarMensagemWhatsappCliente(clienteNome, linkOrcamento) {
  const nome = clienteNome && String(clienteNome).trim() ? String(clienteNome).trim() : 'cliente';

  return `Olá, ${nome}! Tudo bem?

Seu orçamento está pronto para visualização.

Acesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:

${linkOrcamento}

Qualquer dúvida, estou à disposição.`;
}

async function enviarPorWhatsApp() {
  if (enviandoWhatsappFS) return;

  enviandoWhatsappFS = true;
  const botoesWhatsapp = document.querySelectorAll('.btn-whatsapp, .btn-acao-whatsapp, .btn-float-whatsapp');
  botoesWhatsapp.forEach(btn => { btn.disabled = true; });

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
    const linkOrcamento = orcamentoSalvo?.id ? `${window.location.origin}/ver.html?id=${orcamentoSalvo.id}` : '';

    if (!linkOrcamento) {
      alert('Não foi possível gerar o link do orçamento. O orçamento precisa ser salvo na nuvem.');
      return;
    }

    const mensagem = montarMensagemWhatsappCliente(dados.clienteNome, linkOrcamento);
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
    botoesWhatsapp.forEach(btn => { btn.disabled = false; });
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

  if (deveExibir) setTimeout(fsInicializarAdsenseVisivel, 300);
}

function toggleAjuda() {
  const modal = document.getElementById('modal-ajuda');
  if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function fsDesativarFuncoesAntigasClienteVeiculo() {
  const noOp = function () {
    limparVinculosAntigosOrcamento();
    return null;
  };

  window.buscarClientePorIdNoOrcamento = noOp;
  window.abrirModalBuscaClienteOrcamento = noOp;
  window.fecharModalBuscaClienteOrcamento = noOp;
  window.buscarClientesNoModalOrcamento = noOp;
  window.renderizarResultadoBuscaClientesOrcamento = noOp;
  window.criarItemClienteBuscaOrcamento = function () { return ''; };
  window.selecionarClienteBuscaOrcamento = noOp;
  window.limparClienteVinculadoNoOrcamento = noOp;
  window.fsSelecionarVeiculoNoOrcamento = noOp;
}

window.fsColetarDadosOrcamentoAtual = fsColetarDadosOrcamentoAtual;
window.fsSalvarOrcamentoSePlanoPermitido = fsSalvarOrcamentoSePlanoPermitido;
window.enviarPorWhatsApp = enviarPorWhatsApp;
window.baixarPDF = fsBaixarPDFCorrigido;
window.aplicarLimitesPlanoGerador = aplicarLimitesPlanoGerador;

fsDesativarFuncoesAntigasClienteVeiculo();

document.addEventListener('DOMContentLoaded', function () {
  fsDesativarFuncoesAntigasClienteVeiculo();
  fsVerificarSessaoGerador();
  limparVinculosAntigosOrcamento();

  window.baixarPDF = fsBaixarPDFCorrigido;

  const previaOriginal = window.gerarPrevia;

  if (typeof previaOriginal === 'function' && !window.gerarPreviaComAcoesProfissionais) {
    window.gerarPrevia = async function () {
      const resultado = await previaOriginal.apply(this, arguments);

      setTimeout(() => {
        const conteudo = document.getElementById('conteudo-pdf');
        if (conteudo && conteudo.innerHTML.trim()) exibirAcoesProfissionaisOrcamento();
      }, 250);

      return resultado;
    };

    window.gerarPreviaComAcoesProfissionais = true;
  }

  const limparOriginal = window.limparFormulario;

  if (typeof limparOriginal === 'function' && !window.limparFormularioComResetOrcamento) {
    window.limparFormulario = function () {
      orcamentoSalvoAtualId = null;
      window.orcamentoAtualSalvoId = null;
      window.orcamentoSalvoAtualId = null;

      const retorno = limparOriginal.apply(this, arguments);

      const botoesAcao = document.getElementById('botoes-acao');
      const btnFloatBaixar = document.getElementById('btn-float-baixar');
      const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');
      const floatingActions = document.querySelector('.floating-actions');

      limparVinculosAntigosOrcamento();

      if (botoesAcao) botoesAcao.style.display = 'none';
      if (btnFloatBaixar) btnFloatBaixar.style.display = 'none';
      if (btnFloatWhatsapp) btnFloatWhatsapp.style.display = 'none';
      if (floatingActions) floatingActions.classList.remove('show');

      return retorno;
    };

    window.limparFormularioComResetOrcamento = true;
  }

  setTimeout(aplicarLimitesPlanoGerador, 300);
  setTimeout(fsAtualizarAnunciosGratisGerador, 1000);
  setTimeout(fsAtualizarAnunciosGratisGerador, 2000);
});

if (window._supabase) {
  _supabase.auth.onAuthStateChange(() => {
    setTimeout(fsVerificarSessaoGerador, 500);
    setTimeout(fsAtualizarAnunciosGratisGerador, 1200);
  });
}

document.addEventListener('click', function (event) {
  const modalLogin = document.getElementById('modal-login');
  const modalAjuda = document.getElementById('modal-ajuda');

  if (event.target === modalLogin) fecharModalLoginGerador();
  if (event.target === modalAjuda) toggleAjuda();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const modalAjuda = document.getElementById('modal-ajuda');
    if (modalAjuda && modalAjuda.style.display === 'flex') toggleAjuda();
    fecharModalLoginGerador();
  }
});
