(() => {
  'use strict';

  const state = {
    userId: null,
    viewerId: null,
    painel: {},
    social: {},
    posts: [],
    respostas: [],
    postsOffset: 0,
    respostasOffset: 0,
    seguindo: false
  };

  const PAGE_SIZE = 10;
  const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
  const MAX_COVER_BYTES = 700 * 1024;
  const $ = id => document.getElementById(id);
  const isOwner = () => Boolean(state.viewerId && state.viewerId === state.userId);
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = String(value ?? '');
  }

  function showAlert(message = '', type = 'info') {
    const element = $('perfil-alerta');
    if (!element) return;
    element.style.display = message ? 'block' : 'none';
    element.textContent = message;
    element.style.borderLeftColor = type === 'erro' ? '#dc2626' : type === 'ok' ? '#16a34a' : '#1565c0';
  }

  function formatDate(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '';
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function initials(name) {
    return String(name || 'FS').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'FS';
  }

  async function loadPublicProfile() {
    const { data, error } = await _supabase
      .from('forum_perfis_publicos')
      .select('user_id,nome_publico,empresa_publica,foto_url,bio,capa_url,criado_em,atualizado_em')
      .eq('user_id', state.userId)
      .maybeSingle();
    if (error) throw new Error('Não foi possível carregar o perfil público.');
    state.social = data || {};
  }

  async function loadOwnPanel() {
    if (!isOwner()) return;
    const { data, error } = await _supabase
      .from('perfis')
      .select('id,nome,nome_empresa,foto_url,plano')
      .eq('id', state.userId)
      .maybeSingle();
    if (error) throw new Error('Não foi possível carregar os dados do Painel.');
    state.painel = data || {};
  }

  async function savePublicProfile(changes = {}) {
    if (!isOwner()) return;
    const panel = state.painel || {};
    const payload = {
      user_id: state.userId,
      nome_publico: panel.nome || state.social.nome_publico || '',
      empresa_publica: panel.nome_empresa || state.social.empresa_publica || '',
      foto_url: panel.foto_url || state.social.foto_url || '',
      bio: changes.bio ?? state.social.bio ?? '',
      capa_url: changes.capa_url ?? state.social.capa_url ?? '',
      atualizado_em: new Date().toISOString()
    };
    const { error } = await _supabase
      .from('forum_perfis_publicos')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    state.social = { ...state.social, ...payload };
  }

  function applyProfile() {
    const panel = state.painel || {};
    const social = state.social || {};
    const fallback = state.posts[0] || state.respostas[0] || {};
    const name = String(panel.nome || social.nome_publico || fallback.autor_nome || 'Usuário da comunidade').trim();
    const company = String(panel.nome_empresa || social.empresa_publica || fallback.autor_empresa || 'Prestador de serviço').trim();
    const photo = panel.foto_url || social.foto_url || fallback.autor_foto_url || '';
    const cover = social.capa_url || '';

    setText('perfil-nome', name);
    setText('perfil-subtitulo', company);
    setText('perfil-bio', social.bio || 'Este usuário ainda não escreveu uma bio.');
    document.title = `${name} | Comunidade FS`;

    const avatar = $('perfil-avatar');
    if (avatar) {
      avatar.innerHTML = photo
        ? `<img src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(name)}">`
        : initials(name);
    }

    const coverElement = $('perfil-capa');
    if (coverElement) {
      coverElement.style.backgroundImage = cover
        ? `linear-gradient(90deg,rgba(7,17,31,.5),rgba(7,17,31,.08)),url("${escapeHtml(cover)}")`
        : '';
    }

    const plan = String(panel.plano || fallback.autor_plano || 'gratis').toLowerCase();
    const planType = ['premium', 'pro', 'profissional', 'gestao'].includes(plan)
      ? 'premium'
      : plan === 'basico' ? 'basico' : 'gratis';
    const badge = $('perfil-plano');
    if (badge) {
      badge.hidden = false;
      badge.className = `perfil-plano-selo ${planType}`;
      badge.textContent = planType === 'premium' ? 'Premium' : planType === 'basico' ? 'Básico' : 'Grátis';
    }

    $('btn-seguir').hidden = isOwner();
    $('btn-editar-social').hidden = !isOwner();
    $('btn-alterar-capa').hidden = !isOwner();
  }

  async function loadMetrics() {
    const [posts, replies, followers, postLikes, replyLikes] = await Promise.all([
      _supabase.from('forum_topicos').select('*', { count: 'exact', head: true }).eq('usuario_id', state.userId),
      _supabase.from('forum_respostas').select('*', { count: 'exact', head: true }).eq('usuario_id', state.userId),
      _supabase.from('forum_seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', state.userId),
      _supabase.from('forum_topicos').select('total_curtidas').eq('usuario_id', state.userId),
      _supabase.from('forum_respostas').select('total_curtidas').eq('usuario_id', state.userId)
    ]);

    const errors = [posts.error, replies.error, followers.error, postLikes.error, replyLikes.error].filter(Boolean);
    if (errors.length) throw new Error('Não foi possível carregar todas as métricas do perfil.');

    const likes = [...(postLikes.data || []), ...(replyLikes.data || [])]
      .reduce((sum, item) => sum + Number(item.total_curtidas || 0), 0);
    setText('perfil-total-posts', posts.count || 0);
    setText('perfil-total-respostas', replies.count || 0);
    setText('perfil-total-seguidores', followers.count || 0);
    setText('perfil-total-curtidas', likes);
  }

  function renderPosts() {
    const container = $('perfil-lista-posts');
    if (!state.posts.length) {
      container.innerHTML = '<div class="perfil-vazio">Nenhuma publicação encontrada.</div>';
      return;
    }
    container.innerHTML = state.posts.map(post => `
      <a class="perfil-post" href="/post.html?id=${encodeURIComponent(post.id)}">
        <strong>${escapeHtml(post.titulo || 'Publicação')}</strong>
        <p>${escapeHtml(String(post.descricao || '').slice(0, 240))}</p>
        <div class="perfil-post-meta">
          <span class="perfil-tag">${escapeHtml(post.categoria || 'Geral')}</span>
          <span class="perfil-tag">${post.resolvido ? 'Resolvido' : escapeHtml(post.status || 'Aberto')}</span>
          <span class="perfil-tag">${Number(post.total_respostas || 0)} comentários</span>
          <span class="perfil-tag">${Number(post.total_curtidas || 0)} curtidas</span>
          <span class="perfil-tag">${escapeHtml(formatDate(post.criado_em))}</span>
        </div>
      </a>`).join('');
  }

  function renderReplies() {
    const container = $('perfil-lista-respostas');
    if (!state.respostas.length) {
      container.innerHTML = '<div class="perfil-vazio">Nenhuma resposta encontrada.</div>';
      return;
    }
    container.innerHTML = state.respostas.map(reply => `
      <a class="perfil-post" href="/post.html?id=${encodeURIComponent(reply.topico_id)}">
        <strong>Resposta na comunidade</strong>
        <p>${escapeHtml(String(reply.resposta || '').slice(0, 240))}</p>
        <div class="perfil-post-meta">
          ${reply.marcada_como_solucao ? '<span class="perfil-tag">Solução aceita</span>' : ''}
          <span class="perfil-tag">${Number(reply.total_curtidas || 0)} curtidas</span>
          <span class="perfil-tag">${escapeHtml(formatDate(reply.criado_em))}</span>
        </div>
      </a>`).join('');
  }

  async function loadPosts(reset = false) {
    if (reset) { state.posts = []; state.postsOffset = 0; }
    const from = state.postsOffset;
    const { data, error } = await _supabase.from('forum_topicos')
      .select('id,titulo,descricao,categoria,status,resolvido,total_respostas,total_curtidas,criado_em,autor_nome,autor_empresa,autor_foto_url,autor_plano')
      .eq('usuario_id', state.userId)
      .order('criado_em', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error('Não foi possível carregar as publicações.');
    state.posts.push(...(data || []));
    state.postsOffset += (data || []).length;
    renderPosts();
    $('btn-mais-posts').hidden = (data || []).length < PAGE_SIZE;
  }

  async function loadReplies(reset = false) {
    if (reset) { state.respostas = []; state.respostasOffset = 0; }
    const from = state.respostasOffset;
    const { data, error } = await _supabase.from('forum_respostas')
      .select('id,topico_id,resposta,marcada_como_solucao,total_curtidas,criado_em,autor_nome,autor_empresa,autor_foto_url,autor_plano')
      .eq('usuario_id', state.userId)
      .order('criado_em', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error('Não foi possível carregar as respostas.');
    state.respostas.push(...(data || []));
    state.respostasOffset += (data || []).length;
    renderReplies();
    $('btn-mais-respostas').hidden = (data || []).length < PAGE_SIZE;
  }

  async function loadFollowState() {
    if (!state.viewerId || isOwner()) return;
    const { data, error } = await _supabase.from('forum_seguidores')
      .select('id')
      .eq('seguidor_id', state.viewerId)
      .eq('seguido_id', state.userId)
      .maybeSingle();
    if (error) throw new Error('Não foi possível carregar o vínculo de seguir.');
    state.seguindo = Boolean(data);
    $('btn-seguir').textContent = state.seguindo ? 'Seguindo' : 'Seguir';
  }

  async function toggleFollow() {
    if (!state.viewerId) {
      location.href = '/index.html?login=1&dest=' + encodeURIComponent(location.pathname + location.search);
      return;
    }
    if (isOwner()) return;
    const button = $('btn-seguir');
    button.disabled = true;
    button.textContent = 'Aguarde...';
    try {
      const query = _supabase.from('forum_seguidores');
      const result = state.seguindo
        ? await query.delete().eq('seguidor_id', state.viewerId).eq('seguido_id', state.userId)
        : await query.insert({ seguidor_id: state.viewerId, seguido_id: state.userId });
      if (result.error) throw result.error;
      state.seguindo = !state.seguindo;
      button.textContent = state.seguindo ? 'Seguindo' : 'Seguir';
      await loadMetrics();
    } catch (error) {
      console.error(error);
      button.textContent = state.seguindo ? 'Seguindo' : 'Seguir';
      showAlert('Não foi possível atualizar o vínculo de seguir.', 'erro');
    } finally {
      button.disabled = false;
    }
  }

  function updateBioCounter() {
    setText('perfil-bio-contador', `${$('perfil-bio-texto').value.length}/280`);
  }

  async function saveBio() {
    const button = $('btn-salvar-bio');
    button.disabled = true;
    try {
      await savePublicProfile({ bio: $('perfil-bio-texto').value.trim() });
      $('perfil-editor-social').hidden = true;
      applyProfile();
      showAlert('Perfil atualizado com sucesso.', 'ok');
    } catch (error) {
      console.error(error);
      showAlert('Não foi possível salvar o perfil.', 'erro');
    } finally {
      button.disabled = false;
    }
  }

  async function shareProfile() {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text: 'Veja este perfil na Comunidade FS', url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        showAlert('Link do perfil copiado.', 'ok');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showAlert('Não foi possível compartilhar o perfil.', 'erro');
    }
  }

  function setupTabs() {
    const activate = posts => {
      $('tab-publicacoes').classList.toggle('ativo', posts);
      $('tab-respostas').classList.toggle('ativo', !posts);
      $('tab-publicacoes').setAttribute('aria-selected', String(posts));
      $('tab-respostas').setAttribute('aria-selected', String(!posts));
      $('painel-publicacoes').hidden = !posts;
      $('painel-respostas').hidden = posts;
    };
    $('tab-publicacoes').addEventListener('click', () => activate(true));
    $('tab-respostas').addEventListener('click', () => activate(false));
  }

  function canvasToBlob(canvas, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  async function buildCoverBlob(file) {
    const bitmap = await createImageBitmap(file);
    let width = 1400;
    let height = 420;
    let quality = 0.84;
    let blob = null;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#07111f';
      context.fillRect(0, 0, width, height);
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_COVER_BYTES) return blob;
      if (quality > 0.58) quality -= 0.08;
      else {
        width = Math.round(width * 0.88);
        height = Math.round(height * 0.88);
        quality = 0.72;
      }
    }
    throw new Error('Não foi possível reduzir a capa para menos de 700 KB.');
  }

  function setupCoverUpload() {
    const input = $('perfil-capa-file');
    const choose = () => { if (isOwner()) input.click(); };
    $('btn-alterar-capa').addEventListener('click', choose);
    $('btn-editor-capa').addEventListener('click', choose);
    input.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_SOURCE_BYTES) {
        showAlert('Use uma imagem JPG, PNG ou WEBP de até 10 MB.', 'erro');
        input.value = '';
        return;
      }
      try {
        showAlert('Processando e enviando a capa...', 'info');
        const blob = await buildCoverBlob(file);
        const path = `${state.userId}/capa.jpg`;
        const { error } = await _supabase.storage
          .from('forum-capas')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' });
        if (error) throw error;
        const { data } = _supabase.storage.from('forum-capas').getPublicUrl(path);
        if (!data?.publicUrl) throw new Error('URL pública da capa não retornada.');
        await savePublicProfile({ capa_url: `${data.publicUrl}?v=${Date.now()}` });
        applyProfile();
        showAlert(`Capa atualizada com sucesso (${Math.round(blob.size / 1024)} KB).`, 'ok');
      } catch (error) {
        console.error(error);
        showAlert(error.message || 'Não foi possível enviar a capa.', 'erro');
      } finally {
        input.value = '';
      }
    });
  }

  function bindEvents() {
    $('btn-seguir').addEventListener('click', toggleFollow);
    $('btn-editar-social').addEventListener('click', () => {
      $('perfil-editor-social').hidden = false;
      $('perfil-bio-texto').value = state.social.bio || '';
      updateBioCounter();
      $('perfil-bio-texto').focus();
    });
    $('btn-compartilhar').addEventListener('click', shareProfile);
    $('btn-cancelar-editor').addEventListener('click', () => { $('perfil-editor-social').hidden = true; });
    $('btn-salvar-bio').addEventListener('click', saveBio);
    $('perfil-bio-texto').addEventListener('input', updateBioCounter);
    $('btn-mais-posts').addEventListener('click', () => loadPosts());
    $('btn-mais-respostas').addEventListener('click', () => loadReplies());
    setupTabs();
    setupCoverUpload();
  }

  async function init() {
    try {
      if (!window._supabase) throw new Error('Supabase não carregou.');
      bindEvents();
      const { data, error } = await _supabase.auth.getSession();
      if (error) throw error;
      state.viewerId = data?.session?.user?.id || null;
      const params = new URLSearchParams(location.search);
      state.userId = params.get('id') || params.get('user_id') || params.get('usuario_id') || state.viewerId;
      if (!state.userId) {
        location.href = '/index.html?login=1&dest=' + encodeURIComponent('/perfil.html');
        return;
      }

      await Promise.all([loadPublicProfile(), loadOwnPanel()]);
      if (isOwner()) await savePublicProfile();
      await Promise.all([loadPosts(true), loadReplies(true), loadMetrics(), loadFollowState()]);
      applyProfile();
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      showAlert(error.message || 'Não foi possível carregar este perfil.', 'erro');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();