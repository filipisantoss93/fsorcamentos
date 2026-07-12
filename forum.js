/* FS ORÇAMENTOS — Fórum consolidado */
(function () {
  'use strict';

  const CATEGORIAS = [
    'Orçamentos',
    'Cobrança e Pagamento',
    'Garantia',
    'Atendimento ao Cliente',
    'Vendas e Negociação',
    'Dúvidas da Plataforma',
    'Rotina Profissional',
    'Outros'
  ];

  const BUCKET_IMAGENS = 'forum-imagens';
  const LIMITE_FOTOS = 2;
  const LIMITE_FOTO_BYTES = 2 * 1024 * 1024;
  const MIMES_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
  const CAMPOS_TOPICOS = [
    'id', 'usuario_id', 'autor_nome', 'autor_empresa', 'autor_foto_url',
    'titulo', 'descricao', 'categoria', 'status', 'resolvido',
    'foto_1_url', 'foto_2_url', 'total_curtidas', 'total_respostas',
    'criado_em', 'atualizado_em'
  ].join(',');

  let sessaoAtual = null;
  let perfilAtual = null;
  let topicosCache = [];
  let curtidasTopicos = new Set();
  let modalPreparado = false;
  let ultimoFoco = null;
  let buscaTimer = null;
  let previewUrls = [];

  const esc = valor => String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const normalizar = valor => String(valor ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function resumo(texto, limite = 210) {
    const valor = String(texto ?? '').replace(/\\r\\n|\\n|\r\n/g, ' ').replace(/\s+/g, ' ').trim();
    return valor.length <= limite ? valor : `${valor.slice(0, limite).trim()}…`;
  }

  function formatarData(valor) {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function statusTopico(topico) {
    return topico?.resolvido ? 'resolvido' : String(topico?.status || 'aberto');
  }

  function statusClasse(status) {
    const valor = normalizar(status);
    if (valor === 'resolvido') return 'verde';
    if (valor === 'fechado') return 'vermelho';
    if (valor === 'respondido') return 'azul';
    return '';
  }

  function mostrarAlerta(texto, tipo = 'info', id = 'forum-alerta') {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    if (!texto) {
      elemento.style.display = 'none';
      elemento.textContent = '';
      return;
    }
    elemento.style.display = 'block';
    elemento.textContent = texto;
    elemento.style.borderLeftColor = tipo === 'erro' ? '#dc2626' : tipo === 'ok' ? '#16a34a' : '#f6b500';
  }

  function planoFinal(valor) {
    const plano = normalizar(valor || 'gratis');
    if (['premium', 'pro', 'profissional', 'gestao'].includes(plano)) return 'premium';
    if (plano === 'basico') return 'basico';
    return 'gratis';
  }

  function seloPlanoHtml(registro) {
    const plano = planoFinal(registro?.autor_plano || registro?.plano);
    const label = plano === 'premium' ? 'Premium' : plano === 'basico' ? 'Básico' : 'Grátis';
    return `<span class="forum-plano-selo ${plano}">${label}</span>`;
  }

  function nomeAutor(registro) {
    const proprio = sessaoAtual?.user?.id && registro?.usuario_id === sessaoAtual.user.id;
    let nome = String(registro?.autor_nome || '').trim();
    const empresa = String(registro?.autor_empresa || '').trim();
    if (!nome) nome = proprio ? (perfilAtual?.nome || 'Você') : 'Membro da comunidade';
    if (proprio) nome = 'Você';
    return empresa ? `${nome} · ${empresa}` : nome;
  }

  function avatarHtml(registro) {
    const foto = String(registro?.autor_foto_url || '').trim();
    if (foto) return `<span class="forum-avatar"><img src="${esc(foto)}" alt="Foto do autor" loading="lazy"></span>`;
    const base = String(registro?.autor_nome || nomeAutor(registro) || 'FS').trim();
    const iniciais = base.split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'FS';
    return `<span class="forum-avatar-placeholder">${esc(iniciais)}</span>`;
  }

  function autorHtml(topico) {
    const usuarioId = String(topico?.usuario_id || '');
    const href = usuarioId ? `/perfil.html?id=${encodeURIComponent(usuarioId)}` : '#';
    return `<a class="forum-autor-linha" href="${href}" data-acao="perfil">
      ${avatarHtml(topico)}
      <span class="forum-autor-texto">
        <strong>${esc(nomeAutor(topico))} ${seloPlanoHtml(topico)}</strong>
        <small>${esc(formatarData(topico.criado_em))}</small>
      </span>
    </a>`;
  }

  function fotosHtml(topico) {
    const fotos = [topico?.foto_1_url, topico?.foto_2_url].filter(Boolean);
    if (!fotos.length) return '';
    return `<div class="forum-fotos-grid">${fotos.map(url => `<a href="${esc(url)}" target="_blank" rel="noopener" data-acao="foto"><img class="forum-foto" src="${esc(url)}" alt="Foto anexada à publicação" loading="lazy"></a>`).join('')}</div>`;
  }

  function renderizarTopicos(topicos) {
    const lista = document.getElementById('forum-lista-topicos');
    if (!lista) return;
    if (!topicos.length) {
      lista.innerHTML = '<div class="forum-vazio">Nenhuma publicação encontrada.</div>';
      return;
    }

    lista.innerHTML = topicos.map(topico => {
      const curtido = curtidasTopicos.has(topico.id);
      const totalCurtidas = Math.max(0, Number(topico.total_curtidas || 0));
      const totalRespostas = Math.max(0, Number(topico.total_respostas || 0));
      const status = statusTopico(topico);
      return `<article class="forum-topico" data-topico-id="${esc(topico.id)}" tabindex="0" role="link" aria-label="Abrir publicação: ${esc(topico.titulo)}">
        <div class="forum-topico-cabecalho">
          ${autorHtml(topico)}
          ${status !== 'aberto' ? `<span class="forum-status ${statusClasse(status)}">${esc(status)}</span>` : ''}
        </div>
        <h3>${esc(topico.titulo)}</h3>
        <p>${esc(resumo(topico.descricao))}</p>
        ${fotosHtml(topico)}
        <div class="forum-meta-linha">
          <span>🏷️ ${esc(topico.categoria || 'Outros')}</span>
          <span>💬 ${totalRespostas} ${totalRespostas === 1 ? 'comentário' : 'comentários'}</span>
        </div>
        <div class="forum-acoes-linha">
          <button type="button" class="forum-like-btn ${curtido ? 'curtido' : ''}" data-acao="curtir" data-topico-id="${esc(topico.id)}" aria-pressed="${curtido}">👍 ${totalCurtidas}</button>
          <button type="button" class="forum-comentar-btn" data-acao="abrir" data-topico-id="${esc(topico.id)}">💬 Comentar</button>
        </div>
      </article>`;
    }).join('');
  }

  function filtrarTopicos() {
    const busca = normalizar(document.getElementById('forum-busca')?.value || '');
    const filtrados = busca
      ? topicosCache.filter(t => normalizar(`${t.titulo} ${t.descricao} ${t.categoria} ${t.autor_nome} ${t.autor_empresa}`).includes(busca))
      : [...topicosCache];
    renderizarTopicos(filtrados);
  }

  async function enriquecerPlanos() {
    const ids = [...new Set(topicosCache.map(t => t.usuario_id).filter(Boolean))];
    if (!ids.length) return;
    const { data, error } = await _supabase.from('perfis').select('id,plano').in('id', ids);
    if (error || !Array.isArray(data)) return;
    const mapa = new Map(data.map(p => [p.id, p.plano || 'gratis']));
    topicosCache.forEach(t => { if (mapa.has(t.usuario_id)) t.autor_plano = mapa.get(t.usuario_id); });
  }

  async function carregarCurtidas() {
    curtidasTopicos = new Set();
    if (!sessaoAtual?.user?.id || !topicosCache.length) return;
    const ids = topicosCache.map(t => t.id).filter(Boolean);
    const { data, error } = await _supabase.from('forum_curtidas').select('topico_id').eq('usuario_id', sessaoAtual.user.id).in('topico_id', ids);
    if (error) return console.warn('Erro ao carregar curtidas:', error);
    (data || []).forEach(item => item.topico_id && curtidasTopicos.add(item.topico_id));
  }

  async function carregarTopicos() {
    const lista = document.getElementById('forum-lista-topicos');
    if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando publicações...</div>';
    try {
      const { data, error } = await _supabase
        .from('forum_topicos')
        .select(CAMPOS_TOPICOS)
        .order('atualizado_em', { ascending: false })
        .limit(30);
      if (error) throw error;
      topicosCache = Array.isArray(data) ? data : [];
      await Promise.all([enriquecerPlanos(), carregarCurtidas()]);
      filtrarTopicos();
      mostrarAlerta('');
    } catch (error) {
      console.error('Erro ao carregar Fórum:', error);
      if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar as publicações.</div>';
      mostrarAlerta('Não foi possível carregar as publicações. Atualize a página e tente novamente.', 'erro');
    }
  }

  async function alternarCurtida(topicoId) {
    if (!sessaoAtual?.user?.id || !topicoId) return;
    const jaCurtido = curtidasTopicos.has(topicoId);
    const topico = topicosCache.find(t => t.id === topicoId);
    try {
      if (jaCurtido) {
        const { error } = await _supabase.from('forum_curtidas').delete().eq('usuario_id', sessaoAtual.user.id).eq('topico_id', topicoId);
        if (error) throw error;
        curtidasTopicos.delete(topicoId);
        if (topico) topico.total_curtidas = Math.max(0, Number(topico.total_curtidas || 0) - 1);
      } else {
        const { error } = await _supabase.from('forum_curtidas').insert({ usuario_id: sessaoAtual.user.id, topico_id: topicoId });
        if (error && error.code !== '23505') throw error;
        curtidasTopicos.add(topicoId);
        if (topico) topico.total_curtidas = Number(topico.total_curtidas || 0) + 1;
      }
      filtrarTopicos();
    } catch (error) {
      console.error('Erro ao atualizar curtida:', error);
      mostrarAlerta('Não foi possível atualizar a curtida.', 'erro');
    }
  }

  function abrirTopico(id) {
    if (id) window.location.href = `/post.html?id=${encodeURIComponent(id)}`;
  }

  function prepararEventosFeed() {
    const lista = document.getElementById('forum-lista-topicos');
    lista?.addEventListener('click', event => {
      const acao = event.target.closest('[data-acao]');
      if (acao) {
        const tipo = acao.dataset.acao;
        if (tipo === 'perfil' || tipo === 'foto') return;
        event.preventDefault();
        event.stopPropagation();
        const id = acao.dataset.topicoId;
        if (tipo === 'curtir') return void alternarCurtida(id);
        if (tipo === 'abrir') return abrirTopico(id);
      }
      const card = event.target.closest('.forum-topico[data-topico-id]');
      if (card) abrirTopico(card.dataset.topicoId);
    });

    lista?.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      if (event.target.closest('button,a,input,select,textarea')) return;
      const card = event.target.closest('.forum-topico[data-topico-id]');
      if (!card) return;
      event.preventDefault();
      abrirTopico(card.dataset.topicoId);
    });
  }

  function limparPreview() {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
    const preview = document.getElementById('forum-preview-fotos');
    if (preview) preview.innerHTML = '';
  }

  function validarFotos(files) {
    const lista = Array.from(files || []);
    if (lista.length > LIMITE_FOTOS) throw new Error('Selecione no máximo 2 fotos.');
    lista.forEach(file => {
      if (!MIMES_FOTO.includes(file.type)) throw new Error('Use imagens JPG, PNG ou WEBP.');
      if (file.size > LIMITE_FOTO_BYTES) throw new Error('Cada foto deve ter no máximo 2 MB.');
    });
    return lista;
  }

  function formularioHtml() {
    return `<form id="forum-form-topico" class="forum-form" novalidate>
      <label for="forum-topico-titulo">Título da publicação</label>
      <input id="forum-topico-titulo" type="text" minlength="8" maxlength="120" required>
      <label for="forum-topico-categoria">Categoria</label>
      <select id="forum-topico-categoria" required>${CATEGORIAS.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
      <label for="forum-topico-descricao">Conteúdo</label>
      <textarea id="forum-topico-descricao" minlength="20" maxlength="4000" required></textarea>
      <label for="forum-topico-fotos">Fotos</label>
      <input id="forum-topico-fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple>
      <small>Até 2 fotos, máximo 2 MB por foto.</small>
      <div id="forum-preview-fotos" class="forum-preview-fotos"></div>
      <div id="forum-form-alerta" class="forum-alerta" role="status" aria-live="polite"></div>
      <button id="forum-btn-criar" type="submit" class="forum-btn">Publicar no fórum</button>
    </form>`;
  }

  function prepararModal() {
    const card = document.getElementById('forum-form-card');
    if (!card || modalPreparado) return card;
    const painel = document.createElement('div');
    painel.className = 'forum-publicacao-modal-painel';
    while (card.firstChild) painel.appendChild(card.firstChild);
    painel.insertAdjacentHTML('beforeend', formularioHtml());
    card.appendChild(painel);
    card.classList.add('forum-publicacao-modal');
    card.addEventListener('click', event => { if (event.target === card) fecharModal(); });
    card.querySelector('#forum-form-topico')?.addEventListener('submit', criarTopico);
    card.querySelector('#forum-topico-fotos')?.addEventListener('change', event => {
      try {
        limparPreview();
        const fotos = validarFotos(event.target.files);
        const preview = document.getElementById('forum-preview-fotos');
        if (preview) preview.innerHTML = fotos.map(file => {
          const url = URL.createObjectURL(file); previewUrls.push(url);
          return `<img src="${url}" alt="Prévia da foto">`;
        }).join('');
        mostrarAlerta('', 'info', 'forum-form-alerta');
      } catch (error) {
        event.target.value = '';
        mostrarAlerta(error.message, 'erro', 'forum-form-alerta');
      }
    });
    modalPreparado = true;
    return card;
  }

  function abrirModal() {
    const card = prepararModal();
    if (!card) return;
    ultimoFoco = document.activeElement;
    card.classList.add('ativo');
    card.style.display = 'flex';
    card.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('forum-topico-titulo')?.focus(), 50);
  }

  function fecharModal() {
    const card = document.getElementById('forum-form-card');
    if (!card) return;
    card.classList.remove('ativo');
    card.style.display = 'none';
    card.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (ultimoFoco instanceof HTMLElement) ultimoFoco.focus();
  }

  async function uploadFoto(file) {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const caminho = `${sessaoAtual.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).upload(caminho, file, { contentType: file.type, cacheControl: '3600', upsert: false });
    if (error) throw error;
    return _supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
  }

  async function criarTopico(event) {
    event.preventDefault();
    const titulo = document.getElementById('forum-topico-titulo')?.value.trim();
    const categoria = document.getElementById('forum-topico-categoria')?.value;
    const descricao = document.getElementById('forum-topico-descricao')?.value.trim();
    if (!titulo || titulo.length < 8) return mostrarAlerta('Informe um título com pelo menos 8 caracteres.', 'erro', 'forum-form-alerta');
    if (!descricao || descricao.length < 20) return mostrarAlerta('Descreva melhor a publicação.', 'erro', 'forum-form-alerta');

    const botao = document.getElementById('forum-btn-criar');
    if (botao) { botao.disabled = true; botao.textContent = 'Publicando…'; }
    try {
      const email = sessaoAtual.user.email || '';
      const { data, error } = await _supabase.from('forum_topicos').insert({
        usuario_id: sessaoAtual.user.id,
        autor_nome: perfilAtual?.nome || localStorage.getItem('usuario_nome') || email.split('@')[0] || 'Membro',
        autor_empresa: perfilAtual?.nome_empresa || localStorage.getItem('nome_empresa') || '',
        autor_foto_url: perfilAtual?.foto_url || localStorage.getItem('usuario_foto_url') || '',
        titulo, categoria: categoria || 'Outros', descricao, status: 'aberto', resolvido: false
      }).select('id').single();
      if (error) throw error;

      const files = validarFotos(document.getElementById('forum-topico-fotos')?.files || []);
      if (files.length) {
        const urls = [];
        for (const file of files) urls.push(await uploadFoto(file));
        const { error: erroFoto } = await _supabase.from('forum_topicos').update({ foto_1_url: urls[0] || null, foto_2_url: urls[1] || null }).eq('id', data.id).eq('usuario_id', sessaoAtual.user.id);
        if (erroFoto) console.warn('Erro ao salvar fotos:', erroFoto);
      }
      window.location.href = `/post.html?id=${encodeURIComponent(data.id)}`;
    } catch (error) {
      console.error('Erro ao publicar:', error);
      mostrarAlerta(error.message || 'Não foi possível publicar.', 'erro', 'forum-form-alerta');
    } finally {
      if (botao) { botao.disabled = false; botao.textContent = 'Publicar no fórum'; }
    }
  }

  function prepararEventosGerais() {
    document.getElementById('forum-publicar-btn')?.addEventListener('click', abrirModal);
    document.getElementById('forum-fechar-publicacao-btn')?.addEventListener('click', fecharModal);
    document.getElementById('forum-meu-perfil-btn')?.addEventListener('click', () => {
      const id = sessaoAtual?.user?.id || localStorage.getItem('id');
      if (id) window.location.href = `/perfil.html?id=${encodeURIComponent(id)}`;
    });
    document.getElementById('forum-busca')?.addEventListener('input', () => {
      clearTimeout(buscaTimer);
      buscaTimer = setTimeout(filtrarTopicos, 250);
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') fecharModal(); });
  }

  async function inicializar() {
    const conteudo = document.getElementById('forum-conteudo');
    if (conteudo) conteudo.style.display = 'block';
    if (!window._supabase) return mostrarAlerta('Supabase não carregou.', 'erro');

    const { data, error } = await _supabase.auth.getSession();
    if (error || !data?.session?.user?.id) {
      localStorage.setItem('fs_destino_apos_login', '/forum.html');
      window.location.href = '/index.html?login=1';
      return;
    }
    sessaoAtual = data.session;
    const perfil = await _supabase.from('perfis').select('nome,nome_empresa,plano,foto_url').eq('id', sessaoAtual.user.id).maybeSingle();
    perfilAtual = perfil.data || null;

    prepararEventosGerais();
    prepararEventosFeed();
    prepararModal();
    await carregarTopicos();
  }

  window.forumCarregarTopicos = carregarTopicos;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();
})();