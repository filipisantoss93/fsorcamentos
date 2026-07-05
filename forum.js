/* FS ORÇAMENTOS — forum.js
   Feed do Fórum. A visualização completa fica em /post.html?id=ID. */

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

  let sessaoAtual = null;
  let perfilAtual = null;
  let topicosCache = [];
  let curtidasTopicos = new Set();
  let modalPublicacaoPreparado = false;
  let previewObjectUrls = [];

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function esc(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escJs(valor) {
    return String(valor || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  function textoLimpo(valor) {
    return String(valor || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  }

  function formatarData(valor) {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function resumo(texto, limite = 180) {
    const valor = textoLimpo(texto).replace(/\s+/g, ' ').trim();
    return valor.length <= limite ? valor : valor.slice(0, limite).trim() + '...';
  }

  function mostrarConteudo() {
    const conteudo = document.getElementById('forum-conteudo');
    if (conteudo) conteudo.style.display = 'block';
  }

  function pintarAlerta(el, texto, tipo) {
    if (!el) return;
    if (!texto) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.style.display = 'block';
    el.textContent = texto;
    el.style.borderLeftColor = tipo === 'erro' ? '#dc2626' : tipo === 'ok' ? '#16a34a' : '#ffc400';
  }

  function mostrarAlerta(texto, tipo = 'info') {
    pintarAlerta(document.getElementById('forum-alerta'), texto, tipo);
  }

  function mostrarAlertaPublicacao(texto, tipo = 'info') {
    pintarAlerta(document.getElementById('forum-form-alerta'), texto, tipo);
  }

  function setBotao(id, texto, disabled) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = texto;
    btn.disabled = !!disabled;
  }

  function planoFinal(valor) {
    const plano = normalizar(valor || 'gratis');
    if (['premium', 'pro', 'profissional', 'gestao', 'gestão'].includes(plano)) return 'premium';
    if (['basico', 'básico'].includes(plano)) return 'basico';
    return 'gratis';
  }

  function planoLabel(valor) {
    const plano = planoFinal(valor);
    if (plano === 'premium') return 'Premium';
    if (plano === 'basico') return 'Básico';
    return 'Grátis';
  }

  function seloPlanoHtml(registro) {
    const plano = planoFinal(registro?.autor_plano || registro?.plano || 'gratis');
    return `<span class="forum-plano-selo ${plano}">${esc(planoLabel(plano))}</span>`;
  }

  function nomeAutor(registro, usarVoce) {
    const usuarioId = registro?.usuario_id || registro?.user_id || '';
    const ehAtual = sessaoAtual?.user?.id && usuarioId === sessaoAtual.user.id;
    let nome = String(registro?.autor_nome || '').trim();
    const empresa = String(registro?.autor_empresa || '').trim();
    if (!nome) nome = ehAtual ? (perfilAtual?.nome || localStorage.getItem('usuario_nome') || 'Você') : 'Membro da comunidade';
    if (ehAtual && usarVoce !== false) nome = 'Você';
    return empresa ? `${nome} - ${empresa}` : nome;
  }

  function iniciaisAutor(registro) {
    const nome = String(registro?.autor_nome || nomeAutor(registro, false) || 'FS').trim();
    return nome.split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'FS';
  }

  function avatarHtml(registro) {
    const foto = String(registro?.autor_foto_url || '').trim();
    if (foto) return `<span class="forum-avatar"><img src="${esc(foto)}" alt="Foto do autor" loading="lazy"></span>`;
    return `<span class="forum-avatar-placeholder">${esc(iniciaisAutor(registro))}</span>`;
  }

  function autorLinhaHtml(registro, subtitulo) {
    const usuarioId = registro?.usuario_id || registro?.user_id || '';
    return `
      <div class="forum-autor-linha" data-usuario-id="${esc(usuarioId)}" onclick="forumAbrirPerfilAutor('${escJs(usuarioId)}', event)" role="link" tabindex="0" title="Ver perfil">
        ${avatarHtml(registro)}
        <div class="forum-autor-texto">
          <strong>${esc(nomeAutor(registro, true))} ${seloPlanoHtml(registro)}</strong>
          ${subtitulo ? `<small>${esc(subtitulo)}</small>` : ''}
        </div>
      </div>
    `;
  }

  function statusTopico(topico) {
    return topico?.resolvido ? 'resolvido' : (topico?.status || 'aberto');
  }

  function statusClasse(status) {
    const s = normalizar(status);
    if (s === 'resolvido') return 'verde';
    if (s === 'fechado') return 'vermelho';
    if (s === 'respondido') return 'azul';
    return '';
  }

  function fotosHtml(topico) {
    const fotos = [topico?.foto_1_url, topico?.foto_2_url].filter(Boolean);
    if (!fotos.length) return '';
    return `<div class="forum-fotos-grid">${fotos.map(url => `
      <a href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
        <img class="forum-foto" src="${esc(url)}" alt="Foto anexada à publicação" loading="lazy">
      </a>
    `).join('')}</div>`;
  }

  function limparPreviewFotos() {
    previewObjectUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
    previewObjectUrls = [];
    const preview = document.getElementById('forum-preview-fotos');
    if (preview) preview.innerHTML = '';
  }

  function validarArquivoFotoUnica(arquivo) {
    if (!arquivo) throw new Error('Nenhuma imagem selecionada.');
    if (!MIMES_FOTO.includes(arquivo.type)) throw new Error('Use apenas imagens JPG, PNG ou WEBP.');
    if (arquivo.size > LIMITE_FOTO_BYTES) throw new Error('Cada foto deve ter no máximo 2 MB.');
  }

  function validarArquivosFotos(files) {
    const lista = Array.from(files || []);
    if (lista.length > LIMITE_FOTOS) throw new Error(`Selecione no máximo ${LIMITE_FOTOS} fotos por publicação.`);
    lista.forEach(validarArquivoFotoUnica);
    return lista;
  }

  function validarFotosSelecionadas() {
    const input = document.getElementById('forum-topico-fotos');
    const preview = document.getElementById('forum-preview-fotos');
    try {
      limparPreviewFotos();
      const arquivos = validarArquivosFotos(input?.files || []);
      if (preview) {
        preview.innerHTML = arquivos.map(arquivo => {
          const url = URL.createObjectURL(arquivo);
          previewObjectUrls.push(url);
          return `<img src="${url}" alt="Prévia da foto">`;
        }).join('');
      }
      mostrarAlertaPublicacao('', 'info');
    } catch (error) {
      limparPreviewFotos();
      if (input) input.value = '';
      mostrarAlertaPublicacao(error.message || 'Fotos inválidas.', 'erro');
    }
  }

  async function uploadArquivoFotoTopico(arquivo) {
    validarArquivoFotoUnica(arquivo);
    if (!sessaoAtual?.user?.id) throw new Error('Faça login para enviar fotos.');
    const extensao = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg';
    const caminho = `${sessaoAtual.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).upload(caminho, arquivo, { cacheControl: '3600', upsert: false, contentType: arquivo.type });
    if (error) throw error;
    const { data } = _supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho);
    if (!data?.publicUrl) throw new Error('Não foi possível gerar URL pública da foto.');
    return data.publicUrl;
  }

  async function uploadFotosTopico() {
    const input = document.getElementById('forum-topico-fotos');
    const arquivos = validarArquivosFotos(input?.files || []);
    const urls = [];
    for (const arquivo of arquivos) urls.push(await uploadArquivoFotoTopico(arquivo));
    return urls;
  }

  async function executarRPCNotificacao(nomeFuncao, parametros) {
    try {
      if (!window._supabase || !nomeFuncao) return;
      const { error } = await _supabase.rpc(nomeFuncao, parametros || {});
      if (error) console.warn(`Notificação do fórum não criada (${nomeFuncao}):`, error);
    } catch (error) {
      console.warn(`Erro ao criar notificação do fórum (${nomeFuncao}):`, error);
    }
  }

  async function obterSessao() {
    const { data, error } = await _supabase.auth.getSession();
    if (error) {
      console.warn('Erro ao obter sessão no Fórum:', error);
      return null;
    }
    return data?.session || null;
  }

  async function buscarPerfil(userId) {
    if (!userId) return null;
    const { data, error } = await _supabase.from('perfis').select('nome, nome_empresa, plano, foto_url').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('Não foi possível carregar perfil no Fórum:', error);
      return null;
    }
    return data || null;
  }

  async function enriquecerPlanosDosTopicos() {
    try {
      const ids = [...new Set(topicosCache.map(t => t?.usuario_id).filter(Boolean))];
      const faltando = ids.filter(id => !topicosCache.find(t => t.usuario_id === id && t.autor_plano));
      if (!faltando.length) return;
      const { data, error } = await _supabase.from('perfis').select('id, plano').in('id', faltando);
      if (error || !Array.isArray(data)) return;
      const mapa = new Map(data.map(p => [p.id, p.plano || 'gratis']));
      topicosCache.forEach(t => {
        if (t?.usuario_id && mapa.has(t.usuario_id)) t.autor_plano = mapa.get(t.usuario_id);
      });
    } catch (error) {
      console.warn('Não foi possível enriquecer planos no Fórum:', error);
    }
  }

  async function carregarCurtidasUsuario() {
    curtidasTopicos = new Set();
    if (!sessaoAtual?.user?.id) return;
    const { data, error } = await _supabase.from('forum_curtidas').select('topico_id').eq('usuario_id', sessaoAtual.user.id).limit(1000);
    if (error) {
      console.warn('Não foi possível carregar curtidas:', error);
      return;
    }
    (data || []).forEach(curtida => {
      if (curtida.topico_id) curtidasTopicos.add(curtida.topico_id);
    });
  }

  function preencherCategorias() {
    const select = document.getElementById('forum-topico-categoria');
    if (select) select.innerHTML = CATEGORIAS.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
  }

  function formularioTopicoHtml() {
    return `
      <form id="forum-form-topico" class="forum-form" novalidate>
        <label>Título da publicação<input id="forum-topico-titulo" type="text" maxlength="120" placeholder="Ex: Como cobrar diagnóstico antes do orçamento?" required></label>
        <label>Categoria<select id="forum-topico-categoria" required></select></label>
        <label>Conteúdo<textarea id="forum-topico-descricao" maxlength="4000" placeholder="Conte o contexto, o que aconteceu, o que você já tentou ou qual opinião precisa da comunidade." required></textarea></label>
        <label>Fotos da publicação<input id="forum-topico-fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>Opcional. Até 2 fotos, máximo 2 MB por foto. Formatos: JPG, PNG ou WEBP.</small></label>
        <div id="forum-preview-fotos" class="forum-preview-fotos"></div>
        <div id="forum-form-alerta" class="forum-alerta" style="display:none;"></div>
        <button id="forum-btn-criar" type="submit" class="forum-btn">Publicar no fórum</button>
      </form>
    `;
  }

  function vincularFormularioPublicacao(form) {
    if (!form || form.dataset.fsForumSubmitOk === '1') return;
    form.dataset.fsForumSubmitOk = '1';
    form.addEventListener('submit', criarTopico);
    const inputFoto = form.querySelector('#forum-topico-fotos');
    if (inputFoto) inputFoto.addEventListener('change', validarFotosSelecionadas);
  }

  function garantirFormularioTopico(card) {
    if (!card) return null;
    const painel = card.querySelector('.forum-publicacao-modal-painel') || card;
    let form = document.getElementById('forum-form-topico');
    if (form && !painel.contains(form)) painel.appendChild(form);
    if (!form) {
      painel.insertAdjacentHTML('beforeend', formularioTopicoHtml());
      form = document.getElementById('forum-form-topico');
    }
    preencherCategorias();
    vincularFormularioPublicacao(form);
    return form;
  }

  function prepararModalPublicacao() {
    const card = document.getElementById('forum-form-card');
    if (!card) return null;
    if (modalPublicacaoPreparado) {
      garantirFormularioTopico(card);
      return card;
    }
    const painel = document.createElement('div');
    painel.className = 'forum-publicacao-modal-painel';
    while (card.firstChild) painel.appendChild(card.firstChild);
    card.appendChild(painel);
    card.classList.add('forum-publicacao-modal');
    card.addEventListener('click', event => {
      if (event.target === card) ocultarFormularioNovoTopico();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && card.classList.contains('ativo')) ocultarFormularioNovoTopico();
    });
    modalPublicacaoPreparado = true;
    garantirFormularioTopico(card);
    return card;
  }

  function mostrarFormularioNovoTopico() {
    const card = prepararModalPublicacao();
    if (!card) return;
    if (!sessaoAtual?.user?.id) {
      mostrarAlerta('Faça login para publicar no Fórum.', 'erro');
      return;
    }
    garantirFormularioTopico(card);
    mostrarAlertaPublicacao('', 'info');
    card.classList.add('ativo');
    card.style.setProperty('display', 'flex', 'important');
    card.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('forum-topico-titulo')?.focus(), 100);
  }

  function ocultarFormularioNovoTopico() {
    const card = document.getElementById('forum-form-card');
    if (card) {
      card.classList.remove('ativo');
      card.style.setProperty('display', 'none', 'important');
      card.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  function botaoCurtirTopico(topico) {
    const curtido = curtidasTopicos.has(topico.id);
    const total = Number(topico.total_curtidas || topico.curtidas || 0);
    return `<button type="button" class="forum-like-btn ${curtido ? 'curtido' : ''}" onclick="forumCurtirTopico('${escJs(topico.id)}', event)" title="Curtir publicação">${total} 👍</button>`;
  }

  function renderizarTopicos(topicos) {
    const lista = document.getElementById('forum-lista-topicos');
    if (!lista) return;
    if (!topicos.length) {
      lista.innerHTML = '<div class="forum-vazio">Nenhuma publicação encontrada. Publique a primeira dúvida ou ajuste a busca.</div>';
      return;
    }
    lista.innerHTML = topicos.map(topico => {
      const status = statusTopico(topico);
      return `
        <article class="forum-topico" data-topico-id="${esc(topico.id)}" onclick="forumAbrirTopico('${escJs(topico.id)}')">
          <div class="forum-topico-topo">
            <div>
              ${autorLinhaHtml(topico, formatarData(topico.criado_em))}
              <h3 style="margin-top:10px;">${esc(topico.titulo)} - <small>${esc(status)}</small></h3>
              <p>${esc(resumo(topico.descricao))}</p>
            </div>
            ${botaoCurtirTopico(topico)}
          </div>
          ${fotosHtml(topico)}
          <div class="forum-badges"><span class="forum-badge">Categoria: ${esc(topico.categoria || 'Categoria')}</span><span class="forum-badge azul">${Number(topico.total_respostas || 0)} comentários</span><span class="forum-badge ${statusClasse(status)}">${esc(status)}</span></div>
        </article>`;
    }).join('');
  }

  function filtrarTopicosLocal() {
    const busca = normalizar(document.getElementById('forum-busca')?.value || '');
    let topicos = [...topicosCache];
    if (busca) topicos = topicos.filter(t => normalizar(`${t.titulo} ${t.descricao} ${t.categoria} ${statusTopico(t)} ${t.autor_nome} ${t.autor_empresa}`).includes(busca));
    renderizarTopicos(topicos);
  }

  async function carregarTopicos() {
    const lista = document.getElementById('forum-lista-topicos');
    if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando publicações...</div>';
    try {
      const { data, error } = await _supabase.from('forum_topicos').select('*').order('atualizado_em', { ascending: false }).limit(80);
      if (error) throw error;
      topicosCache = Array.isArray(data) ? data : [];
      await enriquecerPlanosDosTopicos();
      await carregarCurtidasUsuario();
      filtrarTopicosLocal();
      mostrarAlerta('', 'info');
    } catch (error) {
      console.error('Erro ao carregar Fórum:', error);
      if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar o Fórum.</div>';
      mostrarAlerta('Não foi possível carregar o Fórum. Atualize a página e tente novamente.', 'erro');
    }
  }

  async function criarTopico(event) {
    if (event) event.preventDefault();
    if (!sessaoAtual?.user?.id) {
      mostrarAlertaPublicacao('Faça login para publicar no Fórum.', 'erro');
      return;
    }

    const titulo = document.getElementById('forum-topico-titulo')?.value?.trim();
    const categoria = document.getElementById('forum-topico-categoria')?.value?.trim();
    const descricao = document.getElementById('forum-topico-descricao')?.value?.trim();

    if (!titulo || titulo.length < 8) return mostrarAlertaPublicacao('Informe um título com pelo menos 8 caracteres.', 'erro');
    if (!descricao || descricao.length < 20) return mostrarAlertaPublicacao('Descreva melhor sua publicação antes de enviar.', 'erro');

    setBotao('forum-btn-criar', 'Publicando...', true);
    mostrarAlertaPublicacao('Salvando publicação...', 'info');

    try {
      const email = sessaoAtual?.user?.email || '';
      const autor = {
        autor_nome: String(perfilAtual?.nome || localStorage.getItem('usuario_nome') || (email ? email.split('@')[0] : 'Membro da comunidade')).trim(),
        autor_empresa: String(perfilAtual?.nome_empresa || localStorage.getItem('nome_empresa') || '').trim(),
        autor_foto_url: String(perfilAtual?.foto_url || localStorage.getItem('usuario_foto_url') || '').trim()
      };

      const { data, error } = await _supabase.from('forum_topicos').insert({
        usuario_id: sessaoAtual.user.id,
        autor_nome: autor.autor_nome,
        autor_empresa: autor.autor_empresa,
        autor_foto_url: autor.autor_foto_url,
        titulo,
        categoria: categoria || 'Orçamentos',
        descricao,
        status: 'aberto',
        resolvido: false
      }).select('id').single();

      if (error) throw error;

      const novoTopicoId = data?.id || '';
      let avisoFoto = '';

      try {
        const fotos = await uploadFotosTopico();
        if (novoTopicoId && fotos.length) {
          const { error: erroFoto } = await _supabase
            .from('forum_topicos')
            .update({ foto_1_url: fotos[0] || null, foto_2_url: fotos[1] || null })
            .eq('id', novoTopicoId)
            .eq('usuario_id', sessaoAtual.user.id);
          if (erroFoto) throw erroFoto;
        }
      } catch (erroUpload) {
        console.warn('Publicação criada, mas a foto não foi anexada:', erroUpload);
        avisoFoto = ' Publicação criada, mas a foto não foi anexada.';
      }

      await executarRPCNotificacao('fs_forum_notificar_topico', { p_topico_id: novoTopicoId });
      document.getElementById('forum-form-topico')?.reset();
      limparPreviewFotos();
      mostrarAlertaPublicacao('Publicação criada com sucesso.' + avisoFoto, 'ok');
      setTimeout(() => {
        window.location.href = `/post.html?id=${encodeURIComponent(novoTopicoId)}`;
      }, 250);
    } catch (error) {
      console.error('Erro ao criar publicação:', error);
      mostrarAlertaPublicacao(error.message || 'Não foi possível publicar sua dúvida.', 'erro');
      mostrarAlerta(error.message || 'Não foi possível publicar sua dúvida.', 'erro');
    } finally {
      setBotao('forum-btn-criar', 'Publicar no fórum', false);
    }
  }

  function abrirTopico(topicoId) {
    if (!topicoId) return;
    window.location.href = `/post.html?id=${encodeURIComponent(topicoId)}`;
  }

  async function curtirTopico(topicoId, event) {
    if (event) event.stopPropagation();
    if (!sessaoAtual?.user?.id || !topicoId || curtidasTopicos.has(topicoId)) return;
    try {
      const { error } = await _supabase.from('forum_curtidas').insert({ usuario_id: sessaoAtual.user.id, topico_id: topicoId });
      if (error && error.code !== '23505') throw error;
      if (error?.code === '23505') return;
      await executarRPCNotificacao('fs_forum_notificar_curtida_topico', { p_topico_id: topicoId });
      curtidasTopicos.add(topicoId);
      const topico = topicosCache.find(t => t.id === topicoId);
      if (topico) topico.total_curtidas = Number(topico.total_curtidas || 0) + 1;
      filtrarTopicosLocal();
    } catch (error) {
      console.error('Erro ao curtir publicação:', error);
      alert('Não foi possível curtir.');
    }
  }

  function abrirPerfilAutor(usuarioId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (usuarioId) window.location.href = `/perfil.html?id=${encodeURIComponent(usuarioId)}`;
  }

  function abrirMeuPerfil() {
    const userId = sessaoAtual?.user?.id || localStorage.getItem('id') || '';
    if (userId) {
      window.location.href = `/perfil.html?id=${encodeURIComponent(userId)}`;
      return;
    }
    try { localStorage.setItem('fs_destino_apos_login', '/forum.html'); } catch (_) {}
    window.location.href = '/index.html?login=1&dest=' + encodeURIComponent('/forum.html');
  }

  async function inicializarForumFS() {
    mostrarConteudo();
    prepararModalPublicacao();
    try {
      if (!window._supabase) {
        mostrarAlerta('Supabase não carregou. Atualize a página e tente novamente.', 'erro');
        return;
      }
      sessaoAtual = await obterSessao();
      if (!sessaoAtual?.user?.id) {
        try { localStorage.setItem('fs_destino_apos_login', '/forum.html'); } catch (_) {}
        window.location.href = '/index.html?login=1';
        return;
      }
      perfilAtual = await buscarPerfil(sessaoAtual.user.id);
      if (perfilAtual?.nome) localStorage.setItem('usuario_nome', perfilAtual.nome);
      if (perfilAtual?.nome_empresa) localStorage.setItem('nome_empresa', perfilAtual.nome_empresa);
      if (perfilAtual?.foto_url) localStorage.setItem('usuario_foto_url', perfilAtual.foto_url);
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao inicializar Fórum:', error);
      mostrarAlerta('Não foi possível iniciar o Fórum.', 'erro');
    }
  }

  window.forumCarregarTopicos = carregarTopicos;
  window.forumFiltrarTopicosLocal = filtrarTopicosLocal;
  window.forumMostrarFormularioNovoTopico = mostrarFormularioNovoTopico;
  window.forumOcultarFormularioNovoTopico = ocultarFormularioNovoTopico;
  window.forumValidarFotosSelecionadas = validarFotosSelecionadas;
  window.forumCriarTopico = criarTopico;
  window.forumAbrirTopico = abrirTopico;
  window.forumCurtirTopico = curtirTopico;
  window.forumAbrirPerfilAutor = abrirPerfilAutor;
  window.forumAbrirMeuPerfil = abrirMeuPerfil;
  window.forumPreencherCategorias = preencherCategorias;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarForumFS);
  else inicializarForumFS();
})();
