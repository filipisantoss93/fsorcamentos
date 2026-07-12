(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const postId = params.get('id') || params.get('topico') || '';
  const state = {
    session: null,
    profile: null,
    topic: null,
    replies: [],
    likedTopics: new Set(),
    likedReplies: new Set(),
    action: null,
    lastFocus: null
  };

  const TOPIC_FIELDS = 'id,usuario_id,titulo,descricao,categoria,status,resolvido,foto_1_url,foto_2_url,autor_nome,autor_empresa,autor_foto_url,autor_plano,total_curtidas,total_respostas,criado_em';
  const REPLY_FIELDS = 'id,topico_id,usuario_id,resposta,marcada_como_solucao,autor_nome,autor_empresa,autor_foto_url,autor_plano,total_curtidas,criado_em';
  const BUCKET_IMAGENS = 'forum-imagens';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const plainText = value => String(value ?? '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  const richText = value => {
    const text = plainText(value).trim();
    return text ? text.split(/\n{2,}/).map(block => `<p>${block.split('\n').map(escapeHtml).join('<br>')}</p>`).join('') : '';
  };
  const safeUrl = value => {
    try {
      const url = new URL(value, location.origin);
      return url.protocol === 'https:' || url.origin === location.origin ? url.href : '';
    } catch { return ''; }
  };
  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };
  const status = () => state.topic?.resolvido ? 'resolvido' : state.topic?.status || 'aberto';
  const isOwner = () => state.topic?.usuario_id === state.session?.user?.id;
  const isClosed = () => ['fechado', 'resolvido'].includes(normalize(status()));

  function showAlert(message = '', type = 'info') {
    const box = $('post-alerta');
    if (!box) return;
    box.hidden = !message;
    box.textContent = message;
    box.className = `forum-alerta post-alerta-${type}`;
  }

  function authorName(record) {
    const own = (record.usuario_id || record.user_id) === state.session?.user?.id;
    const fallback = own ? (state.profile?.nome || localStorage.usuario_nome || 'Você') : 'Membro da comunidade';
    const name = record.autor_nome || fallback;
    const company = record.autor_empresa || '';
    return `${own ? 'Você' : name}${company ? ` · ${company}` : ''}`;
  }

  function initials(record) {
    return String(record.autor_nome || authorName(record) || 'FS').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'FS';
  }

  function author(record, subtitle = '') {
    const id = record.usuario_id || record.user_id || '';
    const photo = safeUrl(record.autor_foto_url);
    const avatar = photo
      ? `<span class="forum-avatar"><img src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(record.autor_nome || 'usuário')}" loading="lazy"></span>`
      : `<span class="forum-avatar-placeholder">${escapeHtml(initials(record))}</span>`;
    const content = `${avatar}<span class="forum-autor-texto"><strong>${escapeHtml(authorName(record))}</strong>${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ''}</span>`;
    return id ? `<a class="forum-autor-linha" href="/perfil.html?id=${encodeURIComponent(id)}">${content}</a>` : `<div class="forum-autor-linha">${content}</div>`;
  }

  function photos() {
    const items = [state.topic.foto_1_url, state.topic.foto_2_url].map(safeUrl).filter(Boolean);
    return items.length ? `<div class="forum-fotos-grid">${items.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img class="forum-foto" src="${escapeHtml(url)}" alt="Imagem ${index + 1} anexada à publicação" loading="lazy"></a>`).join('')}</div>` : '';
  }

  function likeButton(type, record) {
    const liked = type === 'topico' ? state.likedTopics.has(record.id) : state.likedReplies.has(record.id);
    return `<button class="forum-like-btn ${liked ? 'curtido' : ''}" type="button" data-action="like-${type}" data-id="${escapeHtml(record.id)}" aria-pressed="${liked}">👍 ${Math.max(0, Number(record.total_curtidas || 0))}</button>`;
  }

  function actionMenu(type, id, owner) {
    return `<details class="menu-acoes"><summary aria-label="Mais ações">•••</summary><div class="menu-lista">${owner ? `<button type="button" data-action="editar-${type}" data-id="${escapeHtml(id)}">Editar</button><button class="perigo" type="button" data-action="excluir-${type}" data-id="${escapeHtml(id)}">Excluir</button>` : ''}<button type="button" data-action="denunciar-${type}" data-id="${escapeHtml(id)}">Denunciar</button></div></details>`;
  }

  function renderTopic() {
    const topic = state.topic;
    if (!topic) return;
    const total = Number(topic.total_respostas ?? state.replies.length);
    const currentStatus = status();
    const badgeClass = normalize(currentStatus) === 'resolvido' ? 'verde' : normalize(currentStatus) === 'fechado' ? 'vermelho' : '';
    $('post-card').innerHTML = `<div class="post-topo">${author(topic, formatDate(topic.criado_em))}<div class="post-badges"><span class="forum-badge">${escapeHtml(topic.categoria || 'Geral')}</span><span class="forum-badge ${badgeClass}">${escapeHtml(currentStatus)}</span><span class="forum-badge azul">${total} comentário${total === 1 ? '' : 's'}</span></div></div><h1 class="post-titulo">${escapeHtml(topic.titulo || 'Publicação')}</h1><div class="post-texto">${richText(topic.descricao)}</div>${photos()}<div class="post-acoes">${likeButton('topico', topic)}${isOwner() && !isClosed() ? '<button class="forum-link-btn solucao-btn" type="button" data-action="resolver">✓ Marcar como resolvido</button>' : ''}${actionMenu('topico', topic.id, isOwner())}</div>`;
    updateFormState();
  }

  function renderReplies() {
    const box = $('post-respostas');
    box.innerHTML = state.replies.length ? state.replies.map(reply => {
      const owner = reply.usuario_id === state.session?.user?.id;
      return `<article class="resposta ${reply.marcada_como_solucao ? 'solucao' : ''}"><div class="resposta-topo"><span>${reply.marcada_como_solucao ? '✓ Solução marcada' : 'Comentário'}</span><span>${escapeHtml(formatDate(reply.criado_em))}</span></div>${author(reply)}<div class="resposta-texto">${richText(reply.resposta)}</div><div class="resposta-acoes">${likeButton('resposta', reply)}${isOwner() && !reply.marcada_como_solucao && !isClosed() ? `<button class="forum-link-btn solucao-btn" type="button" data-action="solucao" data-id="${escapeHtml(reply.id)}">✓ Marcar solução</button>` : ''}${actionMenu('resposta', reply.id, owner)}</div></article>`;
    }).join('') : '<div class="forum-vazio">Ainda não há comentários. Seja o primeiro a contribuir.</div>';
    renderTopic();
  }

  function updateFormState() {
    const textarea = $('texto-resposta');
    const button = $('btn-responder');
    if (!textarea || !button) return;
    const closed = isClosed();
    textarea.disabled = closed;
    button.disabled = closed;
    textarea.placeholder = closed ? 'Esta publicação não aceita novos comentários.' : 'Descreva sua orientação, experiência ou solução com clareza.';
    button.textContent = closed ? 'Comentários encerrados' : 'Enviar comentário';
  }

  async function loadContent() {
    const [topicResult, repliesResult, likesResult] = await Promise.all([
      _supabase.from('forum_topicos').select(TOPIC_FIELDS).eq('id', postId).maybeSingle(),
      _supabase.from('forum_respostas').select(REPLY_FIELDS).eq('topico_id', postId).order('marcada_como_solucao', { ascending: false }).order('criado_em', { ascending: true }).limit(200),
      _supabase.from('forum_curtidas').select('topico_id,resposta_id').eq('usuario_id', state.session.user.id).limit(1000)
    ]);
    if (topicResult.error) throw topicResult.error;
    if (!topicResult.data) throw new Error('Publicação não encontrada.');
    if (repliesResult.error) throw repliesResult.error;
    state.topic = topicResult.data;
    state.replies = repliesResult.data || [];
    state.likedTopics.clear();
    state.likedReplies.clear();
    (likesResult.data || []).forEach(item => {
      if (item.topico_id) state.likedTopics.add(item.topico_id);
      if (item.resposta_id) state.likedReplies.add(item.resposta_id);
    });
    document.title = `${state.topic.titulo} | Comunidade FS`;
    renderReplies();
  }

  async function toggleLike(type, id, button) {
    const topicLike = type === 'topico';
    const set = topicLike ? state.likedTopics : state.likedReplies;
    const record = topicLike ? state.topic : state.replies.find(item => item.id === id);
    if (!record || button.disabled) return;
    button.disabled = true;
    const liked = set.has(id);
    try {
      if (liked) {
        let query = _supabase.from('forum_curtidas').delete().eq('usuario_id', state.session.user.id);
        query = topicLike ? query.eq('topico_id', id) : query.eq('resposta_id', id);
        const { error } = await query;
        if (error) throw error;
        set.delete(id);
      } else {
        const payload = { usuario_id: state.session.user.id, [topicLike ? 'topico_id' : 'resposta_id']: id };
        const { error } = await _supabase.from('forum_curtidas').insert(payload);
        if (error && error.code !== '23505') throw error;
        set.add(id);
      }
      const table = topicLike ? 'forum_topicos' : 'forum_respostas';
      const { data } = await _supabase.from(table).select('total_curtidas').eq('id', id).maybeSingle();
      if (data) record.total_curtidas = Number(data.total_curtidas || 0);
      topicLike ? renderTopic() : renderReplies();
    } catch (error) {
      console.error(error);
      showAlert('Não foi possível atualizar a curtida.', 'erro');
    } finally {
      button.disabled = false;
    }
  }

  function focusableElements() {
    return [...$('modal').querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden && element.offsetParent !== null);
  }

  function openModal(options) {
    state.action = options.action;
    state.lastFocus = document.activeElement;
    $('modal-label').textContent = options.label || 'AÇÃO';
    $('modal-titulo').textContent = options.title;
    $('modal-campos').innerHTML = options.fields || '';
    $('modal-confirmar').textContent = options.confirm || 'Confirmar';
    $('modal-confirmar').classList.toggle('perigo', Boolean(options.danger));
    $('modal').hidden = false;
    document.body.classList.add('modal-aberto');
    setTimeout(() => focusableElements()[0]?.focus() || $('modal').querySelector('.modal-painel')?.focus(), 0);
  }

  function closeModal() {
    state.action = null;
    $('modal').hidden = true;
    document.body.classList.remove('modal-aberto');
    state.lastFocus?.focus?.();
  }

  function editItem(type, id) {
    const topic = type === 'topico';
    const record = topic ? state.topic : state.replies.find(item => item.id === id);
    if (!record) return;
    openModal({
      label: 'EDITAR',
      title: topic ? 'Atualizar publicação' : 'Atualizar comentário',
      confirm: 'Salvar alterações',
      fields: topic
        ? `<label for="m-titulo">Título</label><input id="m-titulo" minlength="8" maxlength="120" value="${escapeHtml(record.titulo)}" required><label for="m-texto">Descrição</label><textarea id="m-texto" minlength="20" maxlength="4000" required>${escapeHtml(plainText(record.descricao))}</textarea>`
        : `<label for="m-texto">Comentário</label><textarea id="m-texto" minlength="8" maxlength="4000" required>${escapeHtml(plainText(record.resposta))}</textarea>`,
      action: async () => {
        const text = $('m-texto').value.trim();
        const title = topic ? $('m-titulo').value.trim() : '';
        if ((topic && (title.length < 8 || title.length > 120)) || (topic ? text.length < 20 : text.length < 8)) throw new Error('Revise o conteúdo antes de salvar.');
        const payload = topic ? { titulo: title, descricao: text } : { resposta: text };
        const { error } = await _supabase.from(topic ? 'forum_topicos' : 'forum_respostas').update(payload).eq('id', record.id).eq('usuario_id', state.session.user.id);
        if (error) throw error;
        Object.assign(record, payload);
        renderReplies();
        showAlert('Alterações salvas.', 'ok');
      }
    });
  }

  function storagePathFromUrl(value) {
    try {
      const url = new URL(value);
      const marker = `/storage/v1/object/public/${BUCKET_IMAGENS}/`;
      const index = url.pathname.indexOf(marker);
      return index >= 0 ? decodeURIComponent(url.pathname.slice(index + marker.length)) : '';
    } catch { return ''; }
  }

  async function cleanupTopicImages() {
    const paths = [state.topic?.foto_1_url, state.topic?.foto_2_url].map(storagePathFromUrl).filter(Boolean);
    if (!paths.length) return;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).remove(paths);
    if (error) console.warn('Não foi possível remover uma ou mais imagens da publicação:', error);
  }

  function deleteItem(type, id) {
    const topic = type === 'topico';
    openModal({
      label: 'EXCLUSÃO',
      title: topic ? 'Excluir publicação?' : 'Excluir comentário?',
      confirm: 'Excluir definitivamente',
      danger: true,
      fields: `<p>${topic ? 'A publicação e os comentários vinculados serão removidos.' : 'Este comentário será removido.'} Esta ação não pode ser desfeita.</p>`,
      action: async () => {
        const { error } = await _supabase.from(topic ? 'forum_topicos' : 'forum_respostas').delete().eq('id', id).eq('usuario_id', state.session.user.id);
        if (error) throw error;
        if (topic) {
          await cleanupTopicImages();
          location.href = '/forum.html';
          return;
        }
        state.replies = state.replies.filter(item => item.id !== id);
        const { data } = await _supabase.from('forum_topicos').select('total_respostas').eq('id', state.topic.id).maybeSingle();
        state.topic.total_respostas = Number(data?.total_respostas ?? state.replies.length);
        renderReplies();
        showAlert('Comentário excluído.', 'ok');
      }
    });
  }

  function markSolved(replyId = null) {
    openModal({
      label: 'SOLUÇÃO',
      title: replyId ? 'Marcar comentário como solução?' : 'Marcar publicação como resolvida?',
      confirm: 'Confirmar',
      fields: '<p>A publicação será identificada como resolvida e não aceitará novos comentários.</p>',
      action: async () => {
        const { error } = await _supabase.rpc('fs_forum_marcar_solucao', { p_topico_id: state.topic.id, p_resposta_id: replyId });
        if (error) throw error;
        state.topic.resolvido = true;
        state.topic.status = 'resolvido';
        state.replies.forEach(item => { item.marcada_como_solucao = item.id === replyId; });
        renderReplies();
        showAlert('Publicação marcada como resolvida.', 'ok');
      }
    });
  }

  function reportItem(type, id) {
    openModal({
      label: 'DENÚNCIA',
      title: 'Registrar denúncia',
      confirm: 'Enviar denúncia',
      fields: '<label for="m-motivo">Motivo</label><select id="m-motivo" required><option value="">Selecione</option><option>Spam ou propaganda</option><option>Conteúdo ofensivo</option><option>Informação perigosa ou enganosa</option><option>Exposição de dados pessoais</option><option>Conteúdo fora do tema</option><option>Outro</option></select><label for="m-detalhes">Detalhes opcionais</label><textarea id="m-detalhes" maxlength="500"></textarea>',
      action: async () => {
        const reason = $('m-motivo').value;
        const details = $('m-detalhes').value.trim();
        if (!reason) throw new Error('Selecione o motivo.');
        const payload = { usuario_id: state.session.user.id, motivo: details ? `${reason}: ${details}` : reason, [type === 'topico' ? 'topico_id' : 'resposta_id']: id };
        const { error } = await _supabase.from('forum_denuncias').insert(payload);
        if (error) throw error;
        showAlert('Denúncia registrada para análise.', 'ok');
      }
    });
  }

  async function submitReply(event) {
    event.preventDefault();
    if (isClosed()) return;
    const textarea = $('texto-resposta');
    const text = textarea.value.trim();
    if (text.length < 8) return showAlert('Escreva pelo menos 8 caracteres.', 'erro');
    const button = $('btn-responder');
    button.disabled = true;
    try {
      const { data, error } = await _supabase.from('forum_respostas').insert({ topico_id: state.topic.id, resposta: text }).select(REPLY_FIELDS).single();
      if (error) throw error;
      state.replies.push(data);
      const { data: topicData } = await _supabase.from('forum_topicos').select('total_respostas,status').eq('id', state.topic.id).maybeSingle();
      state.topic.total_respostas = Number(topicData?.total_respostas ?? state.replies.length);
      if (topicData?.status) state.topic.status = topicData.status;
      textarea.value = '';
      $('contador').textContent = '0/4000';
      renderReplies();
      showAlert('Comentário enviado com sucesso.', 'ok');
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'Não foi possível enviar o comentário.', 'erro');
    } finally {
      updateFormState();
    }
  }

  function bindEvents() {
    $('form-resposta').addEventListener('submit', submitReply);
    $('texto-resposta').addEventListener('input', event => { $('contador').textContent = `${event.target.value.length}/4000`; });
    $('post-page').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button || !state.topic) return;
      const action = button.dataset.action;
      const id = button.dataset.id || state.topic.id;
      if (action === 'like-topico') toggleLike('topico', id, button);
      else if (action === 'like-resposta') toggleLike('resposta', id, button);
      else if (action.startsWith('editar-')) editItem(action.endsWith('topico') ? 'topico' : 'resposta', id);
      else if (action.startsWith('excluir-')) deleteItem(action.endsWith('topico') ? 'topico' : 'resposta', id);
      else if (action === 'resolver') markSolved();
      else if (action === 'solucao') markSolved(id);
      else if (action.startsWith('denunciar-')) reportItem(action.endsWith('topico') ? 'topico' : 'resposta', id);
    });
    document.querySelectorAll('[data-fechar]').forEach(element => element.addEventListener('click', closeModal));
    $('modal-form').addEventListener('submit', async event => {
      event.preventDefault();
      if (!state.action) return;
      const button = $('modal-confirmar');
      button.disabled = true;
      try {
        await state.action();
        closeModal();
      } catch (error) {
        console.error(error);
        showAlert(error.message || 'Não foi possível concluir a ação.', 'erro');
      } finally {
        button.disabled = false;
      }
    });
    document.addEventListener('keydown', event => {
      if ($('modal').hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableElements();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function revealPage() {
    $('post-page').hidden = false;
    $('post-footer').hidden = false;
  }

  async function init() {
    try {
      if (!postId) throw new Error('Publicação inválida.');
      if (!window._supabase) throw new Error('Supabase não carregado.');
      const { data, error } = await _supabase.auth.getSession();
      if (error) throw error;
      state.session = data.session;
      if (!state.session) {
        const destination = `/post.html?id=${encodeURIComponent(postId)}`;
        localStorage.fs_destino_apos_login = destination;
        location.href = '/index.html?login=1&dest=' + encodeURIComponent(destination);
        return;
      }
      bindEvents();
      revealPage();
      const profileResult = await _supabase.from('perfis').select('nome,nome_empresa,foto_url').eq('id', state.session.user.id).maybeSingle();
      state.profile = profileResult.data || null;
      await loadContent();
    } catch (error) {
      console.error(error);
      revealPage();
      $('post-card').innerHTML = `<div class="forum-vazio">${escapeHtml(error.message || 'Não foi possível carregar a publicação.')}</div>`;
      showAlert(error.message || 'Não foi possível carregar a publicação.', 'erro');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();