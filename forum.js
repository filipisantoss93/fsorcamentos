/* =========================================================
   FS ORÇAMENTOS - forum.js
   Comunidade / Fórum de Dúvidas Técnicas
   ========================================================= */

const FORUM_CATEGORIAS = [
  'Orçamentos',
  'Ordens de Serviço',
  'Clientes',
  'Oficina Mecânica',
  'Elétrica',
  'Ar-condicionado',
  'Construção/Reforma',
  'Cobrança e Pagamento',
  'Garantia',
  'Dicas de Atendimento',
  'Dúvidas da Plataforma',
  'Outros'
];

let forumSessaoAtual = null;
let forumPerfilAtual = null;
let forumTopicosCache = [];
let forumTopicoAtual = null;
let forumRespostasCache = [];

function forumNormalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function forumEscaparHtml(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function forumFormatarData(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function forumMostrarConteudo() {
  const conteudo = document.getElementById('forum-conteudo');
  if (conteudo) conteudo.style.display = 'block';
}

function forumMostrarAlerta(texto, tipo = 'info') {
  const alerta = document.getElementById('forum-alerta');
  if (!alerta) return;

  if (!texto) {
    alerta.style.display = 'none';
    alerta.textContent = '';
    return;
  }

  alerta.style.display = 'block';
  alerta.textContent = texto;
  alerta.style.borderLeftColor = tipo === 'erro' ? '#dc2626' : tipo === 'ok' ? '#16a34a' : '#ffc400';
}

function forumSetBotao(id, texto, disabled = false) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.textContent = texto;
  btn.disabled = disabled;
}

function forumAutorAtualPayload() {
  const nomePerfil = forumPerfilAtual?.nome || localStorage.getItem('usuario_nome') || '';
  const empresaPerfil = forumPerfilAtual?.nome_empresa || localStorage.getItem('nome_empresa') || '';
  const email = forumSessaoAtual?.user?.email || '';
  const nomeFallback = email ? email.split('@')[0] : 'Membro da comunidade';

  return {
    autor_nome: String(nomePerfil || nomeFallback).trim(),
    autor_empresa: String(empresaPerfil || '').trim()
  };
}

function forumNomeAutor(registro, opcoes = {}) {
  const usuarioId = typeof registro === 'string' ? registro : registro?.usuario_id;
  const autorNome = typeof registro === 'object' ? (registro?.autor_nome || '') : '';
  const autorEmpresa = typeof registro === 'object' ? (registro?.autor_empresa || '') : '';
  const ehAutorAtual = forumSessaoAtual?.user?.id && usuarioId === forumSessaoAtual.user.id;

  let nome = String(autorNome || '').trim();
  const empresa = String(autorEmpresa || '').trim();

  if (!nome) {
    nome = ehAutorAtual
      ? (forumPerfilAtual?.nome || localStorage.getItem('usuario_nome') || 'Você')
      : 'Membro da comunidade';
  }

  if (ehAutorAtual && opcoes.usarVoce !== false) {
    nome = 'Você';
  }

  return empresa ? `${nome} · ${empresa}` : nome;
}

function forumStatusClasse(status) {
  const normalizado = forumNormalizarTexto(status);
  if (normalizado === 'resolvido') return 'verde';
  if (normalizado === 'fechado') return 'vermelho';
  if (normalizado === 'respondido') return 'azul';
  return '';
}

function forumResumo(texto, limite = 180) {
  const valor = String(texto || '').replace(/\s+/g, ' ').trim();
  if (valor.length <= limite) return valor;
  return valor.slice(0, limite).trim() + '...';
}

function forumPreencherCategorias() {
  const selects = [
    document.getElementById('forum-topico-categoria'),
    document.getElementById('forum-filtro-categoria')
  ];

  selects.forEach(select => {
    if (!select) return;
    const ehFiltro = select.id === 'forum-filtro-categoria';
    select.innerHTML = `${ehFiltro ? '<option value="todos">Todas as categorias</option>' : ''}` +
      FORUM_CATEGORIAS.map(cat => `<option value="${forumEscaparHtml(cat)}">${forumEscaparHtml(cat)}</option>`).join('');
  });

  const lista = document.getElementById('forum-lista-categorias');
  if (lista) {
    lista.innerHTML = FORUM_CATEGORIAS.map(cat => `
      <button type="button" class="forum-mini-item" onclick="forumFiltrarCategoria('${forumEscaparHtml(cat)}')">
        ${forumEscaparHtml(cat)}
      </button>
    `).join('');
  }
}

function forumFiltrarCategoria(categoria) {
  const select = document.getElementById('forum-filtro-categoria');
  if (select) select.value = categoria;
  forumFiltrarTopicosLocal();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function forumObterSessao() {
  if (!window._supabase) return null;
  const { data: { session }, error } = await _supabase.auth.getSession();
  if (error) {
    console.warn('Erro ao obter sessão no fórum:', error);
    return null;
  }
  return session || null;
}

async function forumBuscarPerfil(userId) {
  if (!window._supabase || !userId) return null;

  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, plano')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Não foi possível carregar perfil no fórum:', error);
    return null;
  }

  return data || null;
}

async function forumCarregarTopicos() {
  const lista = document.getElementById('forum-lista-topicos');
  if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando tópicos...</div>';

  try {
    if (!window._supabase) throw new Error('Supabase não carregado.');

    const { data, error } = await _supabase
      .from('forum_topicos')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .limit(80);

    if (error) throw error;

    forumTopicosCache = Array.isArray(data) ? data : [];
    forumFiltrarTopicosLocal();
    forumMostrarAlerta('', 'info');
  } catch (error) {
    console.error('Erro ao carregar tópicos:', error);
    if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar os tópicos da Comunidade.</div>';
    forumMostrarAlerta('Não foi possível carregar os tópicos. Atualize a página e tente novamente.', 'erro');
  }
}

function forumFiltrarTopicosLocal() {
  const busca = forumNormalizarTexto(document.getElementById('forum-busca')?.value || '');
  const categoria = document.getElementById('forum-filtro-categoria')?.value || 'todos';
  const status = document.getElementById('forum-filtro-status')?.value || 'todos';

  let topicos = [...forumTopicosCache];

  if (categoria !== 'todos') {
    topicos = topicos.filter(t => t.categoria === categoria);
  }

  if (status !== 'todos') {
    topicos = topicos.filter(t => forumNormalizarTexto(t.status) === status);
  }

  if (busca) {
    topicos = topicos.filter(t => {
      const texto = forumNormalizarTexto(`${t.titulo} ${t.descricao} ${t.categoria} ${t.status} ${t.autor_nome} ${t.autor_empresa}`);
      return texto.includes(busca);
    });
  }

  forumRenderizarTopicos(topicos);
}

function forumRenderizarTopicos(topicos) {
  const lista = document.getElementById('forum-lista-topicos');
  if (!lista) return;

  if (!topicos.length) {
    lista.innerHTML = '<div class="forum-vazio">Nenhum tópico encontrado. Publique a primeira dúvida ou ajuste os filtros.</div>';
    return;
  }

  lista.innerHTML = topicos.map(topico => {
    const status = topico.resolvido ? 'resolvido' : (topico.status || 'aberto');
    const autor = forumNomeAutor(topico);
    return `
      <article class="forum-topico" onclick="forumAbrirTopico('${topico.id}')">
        <div class="forum-topico-topo">
          <div>
            <h3>${forumEscaparHtml(topico.titulo)}</h3>
            <p>${forumEscaparHtml(forumResumo(topico.descricao))}</p>
          </div>
          <span class="forum-badge ${forumStatusClasse(status)}">${forumEscaparHtml(status)}</span>
        </div>
        <div class="forum-badges">
          <span class="forum-badge azul">Por ${forumEscaparHtml(autor)}</span>
          <span class="forum-badge">${forumEscaparHtml(topico.categoria || 'Categoria')}</span>
          <span class="forum-badge azul">${Number(topico.total_respostas || 0)} respostas</span>
          <span class="forum-badge">${Number(topico.total_curtidas || 0)} curtidas</span>
          <span class="forum-badge">${forumFormatarData(topico.atualizado_em || topico.criado_em)}</span>
        </div>
      </article>
    `;
  }).join('');
}

function forumMostrarFormularioNovoTopico() {
  const card = document.getElementById('forum-form-card');
  if (card) card.style.display = 'block';
  setTimeout(() => card?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

function forumOcultarFormularioNovoTopico() {
  const card = document.getElementById('forum-form-card');
  if (card) card.style.display = 'none';
}

async function forumCriarTopico(event) {
  event.preventDefault();

  if (!forumSessaoAtual?.user?.id) {
    forumMostrarAlerta('Faça login para publicar na Comunidade.', 'erro');
    return;
  }

  const titulo = document.getElementById('forum-topico-titulo')?.value?.trim();
  const categoria = document.getElementById('forum-topico-categoria')?.value?.trim();
  const descricao = document.getElementById('forum-topico-descricao')?.value?.trim();

  if (!titulo || titulo.length < 8) {
    forumMostrarAlerta('Informe um título mais claro para sua dúvida.', 'erro');
    return;
  }

  if (!descricao || descricao.length < 20) {
    forumMostrarAlerta('Descreva melhor sua dúvida antes de publicar.', 'erro');
    return;
  }

  forumSetBotao('forum-btn-criar', 'Publicando...', true);

  try {
    const autor = forumAutorAtualPayload();
    const { error } = await _supabase
      .from('forum_topicos')
      .insert({
        usuario_id: forumSessaoAtual.user.id,
        autor_nome: autor.autor_nome,
        autor_empresa: autor.autor_empresa,
        titulo,
        categoria: categoria || 'Dúvidas da Plataforma',
        descricao,
        status: 'aberto',
        resolvido: false
      });

    if (error) throw error;

    document.getElementById('forum-form-topico')?.reset();
    forumOcultarFormularioNovoTopico();
    forumMostrarAlerta('Dúvida publicada com sucesso.', 'ok');
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    forumMostrarAlerta('Não foi possível publicar sua dúvida.', 'erro');
  } finally {
    forumSetBotao('forum-btn-criar', 'Publicar dúvida', false);
  }
}

async function forumAbrirTopico(topicoId) {
  const topico = forumTopicosCache.find(t => t.id === topicoId);
  if (!topico) return;

  forumTopicoAtual = topico;

  document.getElementById('forum-detalhe-titulo').textContent = topico.titulo || 'Tópico';
  document.getElementById('forum-detalhe-descricao').textContent = topico.descricao || '';

  forumRenderizarBadgesDetalhe(topico);
  forumRenderizarAcoesTopico(topico);
  forumAbrirModalDetalhe();
  await forumCarregarRespostas(topico.id);
}

function forumAbrirModalDetalhe() {
  const modal = document.getElementById('forum-detalhe');
  if (!modal) return;
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function forumFecharTopico() {
  const modal = document.getElementById('forum-detalhe');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  forumTopicoAtual = null;
  forumRespostasCache = [];
}

function forumRenderizarBadgesDetalhe(topico) {
  const box = document.getElementById('forum-detalhe-badges');
  if (!box) return;

  const status = topico.resolvido ? 'resolvido' : (topico.status || 'aberto');
  const autor = forumNomeAutor(topico);

  box.innerHTML = `
    <span class="forum-badge azul">Por ${forumEscaparHtml(autor)}</span>
    <span class="forum-badge ${forumStatusClasse(status)}">${forumEscaparHtml(status)}</span>
    <span class="forum-badge">${forumEscaparHtml(topico.categoria || 'Categoria')}</span>
    <span class="forum-badge azul">${Number(topico.total_respostas || 0)} respostas</span>
    <span class="forum-badge">${Number(topico.total_curtidas || 0)} curtidas</span>
    <span class="forum-badge">${forumFormatarData(topico.criado_em)}</span>
  `;
}

function forumRenderizarAcoesTopico(topico) {
  const box = document.getElementById('forum-topico-acoes');
  if (!box) return;

  const dono = forumSessaoAtual?.user?.id === topico.usuario_id;
  const resolvido = !!topico.resolvido || forumNormalizarTexto(topico.status) === 'resolvido';

  box.innerHTML = `
    <button type="button" class="forum-link-btn" onclick="forumCurtirTopico('${topico.id}')">Curtir tópico</button>
    ${dono && !resolvido ? '<button type="button" class="forum-link-btn" onclick="forumMarcarTopicoResolvido()">Marcar como resolvido</button>' : ''}
    ${dono ? '<button type="button" class="forum-link-btn" onclick="forumExcluirTopico()">Excluir tópico</button>' : ''}
    <button type="button" class="forum-link-btn" onclick="forumDenunciarTopico('${topico.id}')">Denunciar</button>
  `;
}

async function forumCarregarRespostas(topicoId) {
  const lista = document.getElementById('forum-lista-respostas');
  if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando respostas...</div>';

  try {
    const { data, error } = await _supabase
      .from('forum_respostas')
      .select('*')
      .eq('topico_id', topicoId)
      .order('marcada_como_solucao', { ascending: false })
      .order('criado_em', { ascending: true });

    if (error) throw error;

    forumRespostasCache = Array.isArray(data) ? data : [];
    forumRenderizarRespostas();
  } catch (error) {
    console.error('Erro ao carregar respostas:', error);
    if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar respostas.</div>';
  }
}

function forumRenderizarRespostas() {
  const lista = document.getElementById('forum-lista-respostas');
  if (!lista) return;

  if (!forumRespostasCache.length) {
    lista.innerHTML = '<div class="forum-vazio">Ainda não há respostas. Seja o primeiro a ajudar.</div>';
    return;
  }

  const donoTopico = forumTopicoAtual && forumSessaoAtual?.user?.id === forumTopicoAtual.usuario_id;

  lista.innerHTML = forumRespostasCache.map(resposta => {
    const donoResposta = forumSessaoAtual?.user?.id === resposta.usuario_id;
    const autor = forumNomeAutor(resposta);

    return `
      <article class="forum-resposta ${resposta.marcada_como_solucao ? 'solucao' : ''}">
        <div class="forum-resposta-topo">
          <span>${resposta.marcada_como_solucao ? `✓ Solução marcada · ${forumEscaparHtml(autor)}` : forumEscaparHtml(autor)}</span>
          <span>${forumFormatarData(resposta.criado_em)}</span>
        </div>
        <div>${forumEscaparHtml(resposta.resposta)}</div>
        <div class="forum-resposta-acoes">
          <button type="button" class="forum-link-btn" onclick="forumCurtirResposta('${resposta.id}')">Curtir (${Number(resposta.total_curtidas || 0)})</button>
          ${donoTopico && !resposta.marcada_como_solucao ? `<button type="button" class="forum-link-btn" onclick="forumMarcarRespostaSolucao('${resposta.id}')">Marcar solução</button>` : ''}
          ${donoResposta ? `<button type="button" class="forum-link-btn" onclick="forumExcluirResposta('${resposta.id}')">Excluir</button>` : ''}
          <button type="button" class="forum-link-btn" onclick="forumDenunciarResposta('${resposta.id}')">Denunciar</button>
        </div>
      </article>
    `;
  }).join('');
}

async function forumCriarResposta(event) {
  event.preventDefault();

  if (!forumSessaoAtual?.user?.id || !forumTopicoAtual?.id) return;

  const texto = document.getElementById('forum-resposta-texto')?.value?.trim();
  if (!texto || texto.length < 8) {
    alert('Escreva uma resposta mais completa.');
    return;
  }

  forumSetBotao('forum-btn-responder', 'Enviando...', true);

  try {
    const autor = forumAutorAtualPayload();
    const { error } = await _supabase
      .from('forum_respostas')
      .insert({
        topico_id: forumTopicoAtual.id,
        usuario_id: forumSessaoAtual.user.id,
        autor_nome: autor.autor_nome,
        autor_empresa: autor.autor_empresa,
        resposta: texto
      });

    if (error) throw error;

    document.getElementById('forum-resposta-texto').value = '';
    await forumCarregarRespostas(forumTopicoAtual.id);
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao responder:', error);
    alert('Não foi possível enviar a resposta.');
  } finally {
    forumSetBotao('forum-btn-responder', 'Enviar resposta', false);
  }
}

async function forumMarcarTopicoResolvido() {
  if (!forumTopicoAtual?.id) return;
  if (!confirm('Marcar este tópico como resolvido?')) return;

  try {
    const { error } = await _supabase
      .from('forum_topicos')
      .update({ resolvido: true, status: 'resolvido' })
      .eq('id', forumTopicoAtual.id)
      .eq('usuario_id', forumSessaoAtual.user.id);

    if (error) throw error;

    forumTopicoAtual.resolvido = true;
    forumTopicoAtual.status = 'resolvido';
    forumRenderizarBadgesDetalhe(forumTopicoAtual);
    forumRenderizarAcoesTopico(forumTopicoAtual);
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao marcar resolvido:', error);
    alert('Não foi possível marcar como resolvido.');
  }
}

async function forumMarcarRespostaSolucao(respostaId) {
  if (!forumTopicoAtual?.id || !respostaId) return;
  if (!confirm('Marcar esta resposta como solução?')) return;

  try {
    await _supabase
      .from('forum_respostas')
      .update({ marcada_como_solucao: false })
      .eq('topico_id', forumTopicoAtual.id);

    const { error } = await _supabase
      .from('forum_respostas')
      .update({ marcada_como_solucao: true })
      .eq('id', respostaId);

    if (error) throw error;

    await _supabase
      .from('forum_topicos')
      .update({ resolvido: true, status: 'resolvido' })
      .eq('id', forumTopicoAtual.id)
      .eq('usuario_id', forumSessaoAtual.user.id);

    forumTopicoAtual.resolvido = true;
    forumTopicoAtual.status = 'resolvido';
    forumRenderizarBadgesDetalhe(forumTopicoAtual);
    forumRenderizarAcoesTopico(forumTopicoAtual);
    await forumCarregarRespostas(forumTopicoAtual.id);
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao marcar solução:', error);
    alert('Não foi possível marcar a solução.');
  }
}

async function forumCurtirTopico(topicoId) {
  if (!forumSessaoAtual?.user?.id) return;

  try {
    const { error } = await _supabase
      .from('forum_curtidas')
      .insert({ usuario_id: forumSessaoAtual.user.id, topico_id: topicoId });

    if (error) {
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        alert('Você já curtiu este tópico.');
        return;
      }
      throw error;
    }

    await forumCarregarTopicos();
    if (forumTopicoAtual?.id === topicoId) {
      const atualizado = forumTopicosCache.find(t => t.id === topicoId);
      if (atualizado) {
        forumTopicoAtual = atualizado;
        forumRenderizarBadgesDetalhe(atualizado);
        forumRenderizarAcoesTopico(atualizado);
      }
    }
  } catch (error) {
    console.error('Erro ao curtir tópico:', error);
    alert('Não foi possível curtir.');
  }
}

async function forumCurtirResposta(respostaId) {
  if (!forumSessaoAtual?.user?.id) return;

  try {
    const { error } = await _supabase
      .from('forum_curtidas')
      .insert({ usuario_id: forumSessaoAtual.user.id, resposta_id: respostaId });

    if (error) {
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        alert('Você já curtiu esta resposta.');
        return;
      }
      throw error;
    }

    await forumCarregarRespostas(forumTopicoAtual.id);
  } catch (error) {
    console.error('Erro ao curtir resposta:', error);
    alert('Não foi possível curtir.');
  }
}

async function forumDenunciarTopico(topicoId) {
  const motivo = prompt('Informe o motivo da denúncia:');
  if (!motivo?.trim()) return;

  try {
    const { error } = await _supabase
      .from('forum_denuncias')
      .insert({ usuario_id: forumSessaoAtual.user.id, topico_id: topicoId, motivo: motivo.trim() });

    if (error) throw error;
    alert('Denúncia registrada para análise.');
  } catch (error) {
    console.error('Erro ao denunciar tópico:', error);
    alert('Não foi possível registrar a denúncia.');
  }
}

async function forumDenunciarResposta(respostaId) {
  const motivo = prompt('Informe o motivo da denúncia:');
  if (!motivo?.trim()) return;

  try {
    const { error } = await _supabase
      .from('forum_denuncias')
      .insert({ usuario_id: forumSessaoAtual.user.id, resposta_id: respostaId, motivo: motivo.trim() });

    if (error) throw error;
    alert('Denúncia registrada para análise.');
  } catch (error) {
    console.error('Erro ao denunciar resposta:', error);
    alert('Não foi possível registrar a denúncia.');
  }
}

async function forumExcluirTopico() {
  if (!forumTopicoAtual?.id) return;
  if (!confirm('Excluir este tópico e todas as respostas?')) return;

  try {
    const { error } = await _supabase
      .from('forum_topicos')
      .delete()
      .eq('id', forumTopicoAtual.id)
      .eq('usuario_id', forumSessaoAtual.user.id);

    if (error) throw error;

    forumFecharTopico();
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao excluir tópico:', error);
    alert('Não foi possível excluir o tópico.');
  }
}

async function forumExcluirResposta(respostaId) {
  if (!respostaId) return;
  if (!confirm('Excluir esta resposta?')) return;

  try {
    const { error } = await _supabase
      .from('forum_respostas')
      .delete()
      .eq('id', respostaId)
      .eq('usuario_id', forumSessaoAtual.user.id);

    if (error) throw error;

    await forumCarregarRespostas(forumTopicoAtual.id);
    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao excluir resposta:', error);
    alert('Não foi possível excluir a resposta.');
  }
}

async function inicializarForumFS() {
  forumMostrarConteudo();
  forumPreencherCategorias();

  try {
    if (!window._supabase) {
      forumMostrarAlerta('Supabase não carregou. Atualize a página e tente novamente.', 'erro');
      return;
    }

    forumSessaoAtual = await forumObterSessao();

    if (!forumSessaoAtual?.user?.id) {
      try { localStorage.setItem('fs_destino_apos_login', '/forum.html'); } catch (_) {}
      window.location.href = '/index.html?login=1';
      return;
    }

    forumPerfilAtual = await forumBuscarPerfil(forumSessaoAtual.user.id);
    if (forumPerfilAtual?.nome) localStorage.setItem('usuario_nome', forumPerfilAtual.nome);
    if (forumPerfilAtual?.nome_empresa) localStorage.setItem('nome_empresa', forumPerfilAtual.nome_empresa);

    await forumCarregarTopicos();
  } catch (error) {
    console.error('Erro ao inicializar fórum:', error);
    forumMostrarAlerta('Não foi possível iniciar a Comunidade.', 'erro');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarForumFS);
} else {
  inicializarForumFS();
}

window.forumCarregarTopicos = forumCarregarTopicos;
window.forumFiltrarTopicosLocal = forumFiltrarTopicosLocal;
window.forumFiltrarCategoria = forumFiltrarCategoria;
window.forumMostrarFormularioNovoTopico = forumMostrarFormularioNovoTopico;
window.forumOcultarFormularioNovoTopico = forumOcultarFormularioNovoTopico;
window.forumCriarTopico = forumCriarTopico;
window.forumAbrirTopico = forumAbrirTopico;
window.forumFecharTopico = forumFecharTopico;
window.forumCriarResposta = forumCriarResposta;
window.forumMarcarTopicoResolvido = forumMarcarTopicoResolvido;
window.forumMarcarRespostaSolucao = forumMarcarRespostaSolucao;
window.forumCurtirTopico = forumCurtirTopico;
window.forumCurtirResposta = forumCurtirResposta;
window.forumDenunciarTopico = forumDenunciarTopico;
window.forumDenunciarResposta = forumDenunciarResposta;
window.forumExcluirTopico = forumExcluirTopico;
window.forumExcluirResposta = forumExcluirResposta;