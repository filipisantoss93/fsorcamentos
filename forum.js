/* FS ORÇAMENTOS — Comunidade profissional */
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
    'id', 'usuario_id', 'autor_nome', 'autor_empresa', 'autor_foto_url', 'autor_plano',
    'titulo', 'descricao', 'categoria', 'status', 'resolvido',
    'foto_1_url', 'foto_2_url', 'total_curtidas', 'total_respostas',
    'criado_em', 'atualizado_em'
  ].join(',');

  let sessaoAtual = null;
  let perfilAtual = null;
  let topicosCache = [];
  let curtidasTopicos = new Set();
  let curtidasEmProcessamento = new Set();
  let modalPreparado = false;
  let ultimoFoco = null;
  let buscaTimer = null;
  let previewUrls = [];
  let categoriaAtiva = '';
  let ordenacaoAtiva = 'recentes';

  const esc = valor => String(valor ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const normalizar = valor => String(valor ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function resumo(texto, limite = 260) {
    const valor = String(texto ?? '').replace(/\\r\\n|\\n|\r\n/g, ' ').replace(/\s+/g, ' ').trim();
    return valor.length <= limite ? valor : `${valor.slice(0, limite).trim()}…`;
  }

  function formatarTempoRelativo(valor) {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
    if (segundos < 60) return 'agora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function statusTopico(topico) {
    return topico?.resolvido ? 'resolvido' : String(topico?.status || 'aberto');
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
    const label = plano === 'premium' ? 'Plano Premium' : plano === 'basico' ? 'Plano Básico' : 'Plano Grátis';
    return `<span class="forum-plano-selo ${plano}">◇ ${label}</span>`;
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
    const href = usuarioId ? `/perfil.html?id=${encodeURIComponent(usuarioId)}` : '/perfil.html';
    return `<a class="forum-autor-linha" href="${href}" data-acao="perfil">
      ${avatarHtml(topico)}
      <span class="forum-autor-texto">
        <strong>${esc(nomeAutor(topico))}</strong>
        ${seloPlanoHtml(topico)}
      </span>
    </a>`;
  }

  function fotosHtml(topico) {
    const fotos = [topico?.foto_1_url, topico?.foto_2_url].filter(Boolean);
    if (!fotos.length) return '';
    return `<div class="forum-fotos-grid ${fotos.length === 1 ? 'uma-foto' : ''}">${fotos.map((url, index) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-acao="foto"><img class="forum-foto" src="${esc(url)}" alt="Foto ${index + 1} anexada à publicação" loading="lazy"></a>`).join('')}</div>`;
  }

  function topicosFiltradosOrdenados() {
    const busca = normalizar(document.getElementById('forum-busca')?.value || '');
    const categoria = normalizar(categoriaAtiva);
    const filtrados = topicosCache.filter(topico => {
      const atendeBusca = !busca || normalizar(`${topico.titulo} ${topico.descricao} ${topico.categoria} ${topico.autor_nome} ${topico.autor_empresa}`).includes(busca);
      const atendeCategoria = !categoria || normalizar(topico.categoria) === categoria;
      const atendeResolvido = ordenacaoAtiva !== 'resolvidos' || Boolean(topico.resolvido) || normalizar(topico.status) === 'resolvido';
      return atendeBusca && atendeCategoria && atendeResolvido;
    });

    return filtrados.sort((a, b) => {
      if (ordenacaoAtiva === 'comentados') {
        const diferenca = Number(b.total_respostas || 0) - Number(a.total_respostas || 0);
        if (diferenca) return diferenca;
      }
      return new Date(b.atualizado_em || b.criado_em).getTime() - new Date(a.atualizado_em || a.criado_em).getTime();
    });
  }

  function renderizarTopicos(topicos) {
    const lista = document.getElementById('forum-lista-topicos');
    if (!lista) return;
    if (!topicos.length) {
      lista.innerHTML = '<div class="forum-vazio">Nenhuma publicação encontrada com esses filtros.</div>';
      return;
    }

    lista.innerHTML = topicos.map(topico => {
      const curtido = curtidasTopicos.has(topico.id);
      const processando = curtidasEmProcessamento.has(topico.id);
      const totalCurtidas = Math.max(0, Number(topico.total_curtidas || 0));
      const totalRespostas = Math.max(0, Number(topico.total_respostas || 0));
      const status = statusTopico(topico);
      const href = `/post.html?id=${encodeURIComponent(topico.id)}`;
      return `<article class="forum-topico" data-topico-id="${esc(topico.id)}">
        <div class="forum-topico-cabecalho">
          ${autorHtml(topico)}
          <div class="forum-topico-contexto">
            <time datetime="${esc(topico.criado_em || '')}">${esc(formatarTempoRelativo(topico.criado_em))}</time>
            <span class="forum-menu-icone" aria-hidden="true">⋮</span>
          </div>
        </div>
        <div class="forum-topico-tags">
          <span class="forum-categoria-tag">${esc(topico.categoria || 'Outros')}</span>
          <span>${totalRespostas} ${totalRespostas === 1 ? 'comentário' : 'comentários'}</span>
          ${status === 'resolvido' ? '<span class="forum-status verde">Resolvido</span>' : ''}
        </div>
        <h3><a class="forum-topico-link" href="${href}" data-acao="abrir" data-topico-id="${esc(topico.id)}">${esc(topico.titulo)}</a></h3>
        <p>${esc(resumo(topico.descricao))}</p>
        ${fotosHtml(topico)}
        <div class="forum-acoes-linha">
          <button type="button" class="forum-like-btn ${curtido ? 'curtido' : ''}" data-acao="curtir" data-topico-id="${esc(topico.id)}" aria-pressed="${curtido}" ${processando ? 'disabled' : ''}><span aria-hidden="true">♡</span> Curtir <strong>${totalCurtidas || ''}</strong></button>
          <a class="forum-comentar-btn" href="${href}" data-acao="abrir" data-topico-id="${esc(topico.id)}"><span aria-hidden="true">◯</span> Comentar <strong>${totalRespostas || ''}</strong></a>
        </div>
      </article>`;
    }).join('');
  }

  function filtrarTopicos() {
    renderizarTopicos(topicosFiltradosOrdenados());
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
        .limit(50);
      if (error) throw error;
      topicosCache = Array.isArray(data) ? data : [];
      await carregarCurtidas();
      filtrarTopicos();
      mostrarAlerta('');
    } catch (error) {
      console.error('Erro ao carregar Fórum:', error);
      if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar as publicações.</div>';
      mostrarAlerta('Não foi possível carregar as publicações. Atualize a página e tente novamente.', 'erro');
    }
  }

  async function alternarCurtida(topicoId) {
    if (!sessaoAtual?.user?.id || !topicoId || curtidasEmProcessamento.has(topicoId)) return;
    const jaCurtido = curtidasTopicos.has(topicoId);
    const topico = topicosCache.find(t => t.id === topicoId);
    curtidasEmProcessamento.add(topicoId);
    filtrarTopicos();
    try {
      if (jaCurtido) {
        const { error } = await _supabase.from('forum_curtidas').delete().eq('usuario_id', sessaoAtual.user.id).eq('topico_id', topicoId);
        if (error) throw error;
        curtidasTopicos.delete(topicoId);
      } else {
        const { error } = await _supabase.from('forum_curtidas').insert({ usuario_id: sessaoAtual.user.id, topico_id: topicoId });
        if (error && error.code !== '23505') throw error;
        curtidasTopicos.add(topicoId);
      }
      const { data } = await _supabase.from('forum_topicos').select('total_curtidas').eq('id', topicoId).maybeSingle();
      if (topico && data) topico.total_curtidas = Number(data.total_curtidas || 0);
    } catch (error) {
      console.error('Erro ao atualizar curtida:', error);
      mostrarAlerta('Não foi possível atualizar a curtida.', 'erro');
      await carregarCurtidas();
    } finally {
      curtidasEmProcessamento.delete(topicoId);
      filtrarTopicos();
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
        if (tipo === 'perfil' || tipo === 'foto' || tipo === 'abrir') return;
        if (tipo === 'curtir') {
          event.preventDefault();
          event.stopPropagation();
          return void alternarCurtida(acao.dataset.topicoId);
        }
      }
      if (event.target.closest('a,button,input,select,textarea')) return;
      const card = event.target.closest('.forum-topico[data-topico-id]');
      if (card) abrirTopico(card.dataset.topicoId);
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
      <input id="forum-topico-titulo" type="text" minlength="8" maxlength="120" required autocomplete="off">
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

  function elementosFocaveis(container) {
    return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hidden && el.offsetParent !== null);
  }

  function controlarFocoModal(event) {
    const card = document.getElementById('forum-form-card');
    if (!card?.classList.contains('ativo') || event.key !== 'Tab') return;
    const focaveis = elementosFocaveis(card);
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primeiro.focus();
    }
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
          const url = URL.createObjectURL(file);
          previewUrls.push(url);
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
    if (!card?.classList.contains('ativo')) return;
    card.classList.remove('ativo');
    card.style.display = 'none';
    card.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    limparPreview();
    if (ultimoFoco instanceof HTMLElement) ultimoFoco.focus();
  }

  async function uploadFoto(file) {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const caminho = `${sessaoAtual.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).upload(caminho, file, { contentType: file.type, cacheControl: '3600', upsert: false });
    if (error) throw error;
    const publicUrl = _supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
    return { caminho, publicUrl };
  }

  async function removerUploads(caminhos) {
    const validos = caminhos.filter(Boolean);
    if (!validos.length) return;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).remove(validos);
    if (error) console.warn('Não foi possível remover uploads incompletos:', error);
  }

  async function criarTopico(event) {
    event.preventDefault();
    const titulo = document.getElementById('forum-topico-titulo')?.value.trim();
    const categoria = document.getElementById('forum-topico-categoria')?.value;
    const descricao = document.getElementById('forum-topico-descricao')?.value.trim();
    if (!titulo || titulo.length < 8) return mostrarAlerta('Informe um título com pelo menos 8 caracteres.', 'erro', 'forum-form-alerta');
    if (!descricao || descricao.length < 20) return mostrarAlerta('Descreva melhor a publicação.', 'erro', 'forum-form-alerta');
    if (!CATEGORIAS.includes(categoria)) return mostrarAlerta('Selecione uma categoria válida.', 'erro', 'forum-form-alerta');

    const botao = document.getElementById('forum-btn-criar');
    const uploads = [];
    if (botao) { botao.disabled = true; botao.textContent = 'Publicando…'; }
    try {
      const files = validarFotos(document.getElementById('forum-topico-fotos')?.files || []);
      for (const file of files) uploads.push(await uploadFoto(file));
      const { data, error } = await _supabase.from('forum_topicos').insert({
        titulo,
        categoria,
        descricao,
        foto_1_url: uploads[0]?.publicUrl || null,
        foto_2_url: uploads[1]?.publicUrl || null
      }).select('id').single();
      if (error) throw error;
      window.location.href = `/post.html?id=${encodeURIComponent(data.id)}`;
    } catch (error) {
      await removerUploads(uploads.map(item => item.caminho));
      console.error('Erro ao publicar:', error);
      mostrarAlerta(error.message || 'Não foi possível publicar.', 'erro', 'forum-form-alerta');
    } finally {
      if (botao) { botao.disabled = false; botao.textContent = 'Publicar no fórum'; }
    }
  }

  function atualizarPerfilSidebar() {
    const avatar = document.getElementById('forum-perfil-avatar');
    const saudacao = document.getElementById('forum-perfil-saudacao');
    const plano = document.getElementById('forum-perfil-plano');
    const nome = String(perfilAtual?.nome || sessaoAtual?.user?.email?.split('@')[0] || 'profissional').trim();
    const foto = String(perfilAtual?.foto_url || '').trim();
    if (saudacao) saudacao.textContent = `Olá, ${nome.split(/\s+/)[0]}`;
    if (plano) {
      const final = planoFinal(perfilAtual?.plano);
      plano.textContent = final === 'premium' ? '◇ Plano Premium' : final === 'basico' ? '◇ Plano Básico' : '◇ Plano Grátis';
      plano.className = `comunidade-perfil-plano ${final}`;
    }
    if (avatar) {
      if (foto) avatar.innerHTML = `<img src="${esc(foto)}" alt="Sua foto de perfil">`;
      else avatar.textContent = nome.split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'FS';
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
    document.querySelector('.forum-topic-links')?.addEventListener('click', event => {
      const botao = event.target.closest('[data-categoria]');
      if (!botao) return;
      categoriaAtiva = botao.dataset.categoria || '';
      document.querySelectorAll('[data-categoria]').forEach(item => item.setAttribute('aria-pressed', String(item === botao)));
      filtrarTopicos();
    });
    document.getElementById('forum-ver-categorias-btn')?.addEventListener('click', () => {
      const card = document.querySelector('.comunidade-assuntos-card');
      card?.classList.toggle('expandido');
    });
    document.querySelector('.forum-feed-tabs')?.addEventListener('click', event => {
      const botao = event.target.closest('[data-ordenacao]');
      if (!botao) return;
      ordenacaoAtiva = botao.dataset.ordenacao || 'recentes';
      document.querySelectorAll('[data-ordenacao]').forEach(item => item.setAttribute('aria-pressed', String(item === botao)));
      filtrarTopicos();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') fecharModal();
      controlarFocoModal(event);
    });
  }

  async function inicializar() {
    const conteudo = document.getElementById('forum-conteudo');
    const rodape = document.querySelector('.forum-footer');
    if (!window._supabase) {
      if (conteudo) conteudo.style.display = 'block';
      return mostrarAlerta('Supabase não carregou.', 'erro');
    }

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
    atualizarPerfilSidebar();
    if (conteudo) conteudo.style.display = 'block';
    if (rodape) rodape.style.display = 'flex';
    await carregarTopicos();
  }

  window.forumCarregarTopicos = carregarTopicos;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();
})();
