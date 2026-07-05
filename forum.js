/* =========================================================
   FS ORÇAMENTOS — forum.js
   Fórum/comunidade em arquivo único.
   Foco: orçamentos, cobrança, garantia, atendimento e rotina profissional.
   ========================================================= */

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
  let respostasCache = [];
  let topicoAtual = null;
  let curtidasTopicos = new Set();
  let curtidasRespostas = new Set();
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

  function textoHtml(valor) {
    const texto = textoLimpo(valor).trim();
    if (!texto) return '';
    return texto.split(/\n{2,}/).map(bloco => {
      const linhas = bloco.split('\n').map(linha => esc(linha)).join('<br>');
      return `<p>${linhas}</p>`;
    }).join('');
  }

  function formatarData(valor) {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function mostrarConteudo() {
    const conteudo = document.getElementById('forum-conteudo');
    if (conteudo) conteudo.style.display = 'block';
  }

  function mostrarAlerta(texto, tipo = 'info') {
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

  function setBotao(id, texto, disabled = false) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = texto;
    btn.disabled = disabled;
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

  function instalarCssPlanos() {
    if (document.getElementById('fs-forum-js-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-forum-js-css';
    style.textContent = `
      .forum-autor-linha{cursor:pointer!important;border-radius:8px!important;padding:3px!important;transition:background .15s ease,box-shadow .15s ease!important}
      .forum-autor-linha:hover{background:rgba(15,23,42,.06)!important;box-shadow:inset 0 0 0 1px rgba(15,23,42,.10)!important}
      .forum-autor-texto strong{display:inline-flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important}
      .forum-plano-selo{display:inline-flex!important;width:fit-content!important;align-items:center!important;justify-content:center!important;min-height:18px!important;padding:3px 6px!important;border-radius:4px!important;border:1px solid #d1d5db!important;background:#f3f4f6!important;color:#1f2937!important;font-size:9.5px!important;line-height:1!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.02em!important}
      .forum-plano-selo.basico{background:#e0f2fe!important;color:#075985!important;border-color:#bae6fd!important}
      .forum-plano-selo.premium{background:#ffc400!important;color:#111827!important;border-color:#111827!important;box-shadow:0 0 0 1px rgba(15,23,42,.08)!important}
    `;
    document.head.appendChild(style);
  }

  function instalarPatchInsertForum() {
    if (!window._supabase || window._supabase.__fsForumPublicacaoPatch) return;
    const originalFrom = window._supabase.from.bind(window._supabase);
    window._supabase.from = function fsForumFromPatched(tableName) {
      const builder = originalFrom(tableName);
      const tabela = String(tableName || '');
      if (!['forum_topicos', 'forum_respostas'].includes(tabela)) return builder;
      const originalInsert = builder.insert?.bind(builder);
      if (typeof originalInsert === 'function') {
        builder.insert = function fsForumInsertPatched(payload, options) {
          const limpar = item => {
            if (!item || typeof item !== 'object') return item;
            const novo = { ...item };
            delete novo.autor_plano;
            ['foto_1_url', 'foto_2_url'].forEach(campo => {
              if (novo[campo] === null || novo[campo] === undefined || novo[campo] === '') delete novo[campo];
            });
            return novo;
          };
          return originalInsert(Array.isArray(payload) ? payload.map(limpar) : limpar(payload), options);
        };
      }
      return builder;
    };
    window._supabase.__fsForumPublicacaoPatch = true;
  }

  function ehDonoTopico(topico = topicoAtual) {
    return !!(topico?.usuario_id && sessaoAtual?.user?.id === topico.usuario_id);
  }

  function autorAtualPayload() {
    const email = sessaoAtual?.user?.email || '';
    const nomeFallback = email ? email.split('@')[0] : 'Membro da comunidade';
    return {
      autor_nome: String(perfilAtual?.nome || localStorage.getItem('usuario_nome') || nomeFallback).trim(),
      autor_empresa: String(perfilAtual?.nome_empresa || localStorage.getItem('nome_empresa') || '').trim(),
      autor_foto_url: String(perfilAtual?.foto_url || localStorage.getItem('usuario_foto_url') || '').trim()
    };
  }

  function nomeAutor(registro, opcoes = {}) {
    const usuarioId = typeof registro === 'string' ? registro : registro?.usuario_id;
    const ehAtual = sessaoAtual?.user?.id && usuarioId === sessaoAtual.user.id;
    let nome = String(registro?.autor_nome || '').trim();
    const empresa = String(registro?.autor_empresa || '').trim();
    if (!nome) nome = ehAtual ? (perfilAtual?.nome || localStorage.getItem('usuario_nome') || 'Você') : 'Membro da comunidade';
    if (ehAtual && opcoes.usarVoce !== false) nome = 'Você';
    return empresa ? `${nome} - ${empresa}` : nome;
  }

  function iniciaisAutor(registro) {
    const nome = String(registro?.autor_nome || nomeAutor(registro, { usarVoce: false }) || 'FS').trim();
    return nome.split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'FS';
  }

  function avatarHtml(registro) {
    const foto = String(registro?.autor_foto_url || '').trim();
    if (foto) return `<span class="forum-avatar"><img src="${esc(foto)}" alt="Foto do autor" loading="lazy"></span>`;
    return `<span class="forum-avatar-placeholder">${esc(iniciaisAutor(registro))}</span>`;
  }

  function seloPlanoHtml(registro) {
    const plano = planoFinal(registro?.autor_plano || registro?.plano || 'gratis');
    return `<span class="forum-plano-selo ${plano}">${esc(planoLabel(plano))}</span>`;
  }

  function autorLinhaHtml(registro, subtitulo = '') {
    const usuarioId = registro?.usuario_id || registro?.user_id || '';
    return `
      <div class="forum-autor-linha" data-usuario-id="${esc(usuarioId)}" onclick="forumAbrirPerfilAutor('${escJs(usuarioId)}', event)" role="link" tabindex="0" title="Ver perfil">
        ${avatarHtml(registro)}
        <div class="forum-autor-texto">
          <strong>${esc(nomeAutor(registro))} ${seloPlanoHtml(registro)}</strong>
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

  function resumo(texto, limite = 180) {
    const valor = textoLimpo(texto).replace(/\s+/g, ' ').trim();
    return valor.length <= limite ? valor : valor.slice(0, limite).trim() + '...';
  }

  function fotosTopico(topico) {
    return [topico?.foto_1_url, topico?.foto_2_url].filter(Boolean);
  }

  function fotosHtml(topico) {
    const fotos = fotosTopico(topico);
    if (!fotos.length) return '';
    return `<div class="forum-fotos-grid">${fotos.map(url => `
      <a href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
        <img class="forum-foto" src="${esc(url)}" alt="Foto anexada ao tópico" loading="lazy">
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
    } catch (error) {
      limparPreviewFotos();
      if (input) input.value = '';
      alert(error.message || 'Fotos inválidas.');
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
    try {
      for (const arquivo of arquivos) urls.push(await uploadArquivoFotoTopico(arquivo));
      return urls;
    } catch (error) {
      await Promise.allSettled(urls.map(url => removerArquivoStorageSeForDoUsuario(url)));
      throw error;
    }
  }

  function selecionarUmaFoto() {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = MIMES_FOTO.join(',');
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });
  }

  function campoFoto(posicao) {
    return Number(posicao) === 2 ? 'foto_2_url' : 'foto_1_url';
  }

  function caminhoStorageDaUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const marcador = `/object/public/${BUCKET_IMAGENS}/`;
      const idx = parsed.pathname.indexOf(marcador);
      if (idx >= 0) return decodeURIComponent(parsed.pathname.slice(idx + marcador.length));
    } catch (_) {}
    const marcadorSimples = `${BUCKET_IMAGENS}/`;
    const idx = String(url).indexOf(marcadorSimples);
    return idx >= 0 ? String(url).slice(idx + marcadorSimples.length) : '';
  }

  async function removerArquivoStorageSeForDoUsuario(url) {
    const caminho = caminhoStorageDaUrl(url);
    const userId = sessaoAtual?.user?.id;
    if (!caminho || !userId || !caminho.startsWith(`${userId}/`)) return;
    const { error } = await _supabase.storage.from(BUCKET_IMAGENS).remove([caminho]);
    if (error) console.warn('Não foi possível remover imagem antiga do fórum:', error);
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

  function preencherCategorias() {
    const selects = [document.getElementById('forum-topico-categoria'), document.getElementById('forum-filtro-categoria')];
    selects.forEach(select => {
      if (!select) return;
      const ehFiltro = select.id === 'forum-filtro-categoria';
      select.innerHTML = `${ehFiltro ? '<option value="todos">Todas as categorias</option>' : ''}` + CATEGORIAS.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
    });
  }

  function filtrarCategoria(categoria) {
    const select = document.getElementById('forum-filtro-categoria');
    if (select) select.value = categoria;
    filtrarTopicosLocal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function obterSessao() {
    if (!window._supabase) return null;
    const { data, error } = await _supabase.auth.getSession();
    if (error) {
      console.warn('Erro ao obter sessão no fórum:', error);
      return null;
    }
    return data?.session || null;
  }

  async function buscarPerfil(userId) {
    if (!window._supabase || !userId) return null;
    const { data, error } = await _supabase.from('perfis').select('nome, nome_empresa, plano, foto_url').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('Não foi possível carregar perfil no fórum:', error);
      return null;
    }
    return data || null;
  }

  async function enriquecerPlanosDosTopicos() {
    try {
      const ids = [...new Set(topicosCache.map(t => t?.usuario_id).filter(Boolean))];
      const faltando = ids.filter(id => !topicosCache.find(t => t.usuario_id === id && t.autor_plano));
      if (!faltando.length || !window._supabase) return;
      const { data, error } = await _supabase.from('perfis').select('id, plano').in('id', faltando);
      if (error || !Array.isArray(data)) return;
      const mapa = new Map(data.map(p => [p.id, p.plano || 'gratis']));
      topicosCache.forEach(t => {
        if (t?.usuario_id && mapa.has(t.usuario_id)) t.autor_plano = mapa.get(t.usuario_id);
      });
    } catch (error) {
      console.warn('Não foi possível enriquecer planos no fórum:', error);
    }
  }

  function formularioTopicoHtml() {
    return `
      <form id="forum-form-topico" class="forum-form" onsubmit="forumCriarTopico(event)">
        <label>Título da publicação<input id="forum-topico-titulo" type="text" maxlength="120" placeholder="Ex: Como cobrar diagnóstico antes do orçamento?" required></label>
        <label>Categoria<select id="forum-topico-categoria" required></select></label>
        <label>Conteúdo<textarea id="forum-topico-descricao" maxlength="4000" placeholder="Conte o contexto, o que aconteceu, o que você já tentou ou qual opinião precisa da comunidade." required></textarea></label>
        <label>Fotos da publicação<input id="forum-topico-fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple onchange="forumValidarFotosSelecionadas()"><small>Opcional. Até 2 fotos, máximo 2 MB por foto. Formatos: JPG, PNG ou WEBP.</small></label>
        <div id="forum-preview-fotos" class="forum-preview-fotos"></div>
        <button id="forum-btn-criar" type="submit" class="forum-btn">Publicar no fórum</button>
      </form>
    `;
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

  async function carregarCurtidasUsuario() {
    curtidasTopicos = new Set();
    curtidasRespostas = new Set();
    if (!sessaoAtual?.user?.id || !window._supabase) return;
    const { data, error } = await _supabase.from('forum_curtidas').select('topico_id, resposta_id').eq('usuario_id', sessaoAtual.user.id).limit(1000);
    if (error) {
      console.warn('Não foi possível carregar curtidas do usuário:', error);
      return;
    }
    (data || []).forEach(curtida => {
      if (curtida.topico_id) curtidasTopicos.add(curtida.topico_id);
      if (curtida.resposta_id) curtidasRespostas.add(curtida.resposta_id);
    });
  }

  async function carregarTopicos() {
    const lista = document.getElementById('forum-lista-topicos');
    if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando publicações...</div>';
    try {
      if (!window._supabase) throw new Error('Supabase não carregado.');
      const { data, error } = await _supabase.from('forum_topicos').select('*').order('atualizado_em', { ascending: false }).limit(80);
      if (error) throw error;
      topicosCache = Array.isArray(data) ? data : [];
      await enriquecerPlanosDosTopicos();
      await carregarCurtidasUsuario();
      filtrarTopicosLocal();
      abrirTopicoDoHash();
      mostrarAlerta('', 'info');
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar o Fórum.</div>';
      mostrarAlerta('Não foi possível carregar o Fórum. Atualize a página e tente novamente.', 'erro');
    }
  }

  function filtrarTopicosLocal() {
    const busca = normalizar(document.getElementById('forum-busca')?.value || '');
    const categoria = document.getElementById('forum-filtro-categoria')?.value || 'todos';
    const status = document.getElementById('forum-filtro-status')?.value || 'todos';
    let topicos = [...topicosCache];
    if (categoria !== 'todos') topicos = topicos.filter(t => t.categoria === categoria);
    if (status !== 'todos') topicos = topicos.filter(t => normalizar(statusTopico(t)) === status);
    if (busca) topicos = topicos.filter(t => normalizar(`${t.titulo} ${t.descricao} ${t.categoria} ${statusTopico(t)} ${t.autor_nome} ${t.autor_empresa}`).includes(busca));
    renderizarTopicos(topicos);
  }

  function botaoCurtirTopico(topico) {
    const curtido = curtidasTopicos.has(topico.id);
    const total = Number(topico.total_curtidas || topico.curtidas || 0);
    return `<button type="button" class="forum-like-btn ${curtido ? 'curtido' : ''}" onclick="forumCurtirTopico('${escJs(topico.id)}', event)" title="Curtir publicação">${total} 👍</button>`;
  }

  function botaoCurtirResposta(resposta) {
    const curtido = curtidasRespostas.has(resposta.id);
    const total = Number(resposta.total_curtidas || 0);
    return `<button type="button" class="forum-like-btn ${curtido ? 'curtido' : ''}" onclick="forumCurtirResposta('${escJs(resposta.id)}')" title="Curtir comentário">${total} 👍</button>`;
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

  async function criarTopico(event) {
    event.preventDefault();
    if (!sessaoAtual?.user?.id) return mostrarAlerta('Faça login para publicar no Fórum.', 'erro');
    const titulo = document.getElementById('forum-topico-titulo')?.value?.trim();
    const categoria = document.getElementById('forum-topico-categoria')?.value?.trim();
    const descricao = document.getElementById('forum-topico-descricao')?.value?.trim();
    if (!titulo || titulo.length < 8) return mostrarAlerta('Informe um título mais claro para sua dúvida.', 'erro');
    if (!descricao || descricao.length < 20) return mostrarAlerta('Descreva melhor sua dúvida antes de publicar.', 'erro');
    setBotao('forum-btn-criar', 'Publicando...', true);
    let fotos = [];
    try {
      fotos = await uploadFotosTopico();
      const autor = autorAtualPayload();
      const { data, error } = await _supabase.from('forum_topicos').insert({
        usuario_id: sessaoAtual.user.id,
        autor_nome: autor.autor_nome,
        autor_empresa: autor.autor_empresa,
        autor_foto_url: autor.autor_foto_url,
        foto_1_url: fotos[0] || null,
        foto_2_url: fotos[1] || null,
        titulo,
        categoria: categoria || 'Orçamentos',
        descricao,
        status: 'aberto',
        resolvido: false
      }).select('id').single();
      if (error) throw error;
      await executarRPCNotificacao('fs_forum_notificar_topico', { p_topico_id: data?.id });
      document.getElementById('forum-form-topico')?.reset();
      limparPreviewFotos();
      ocultarFormularioNovoTopico();
      mostrarAlerta('Publicação criada com sucesso.', 'ok');
      await carregarTopicos();
    } catch (error) {
      await Promise.allSettled(fotos.map(url => removerArquivoStorageSeForDoUsuario(url)));
      console.error('Erro ao criar publicação:', error);
      mostrarAlerta(error.message || 'Não foi possível publicar sua dúvida.', 'erro');
    } finally {
      setBotao('forum-btn-criar', 'Publicar no fórum', false);
    }
  }

  async function abrirTopico(topicoId) {
    const topico = topicosCache.find(t => String(t.id) === String(topicoId));
    if (!topico) return;
    topicoAtual = topico;
    renderizarDetalheTopico(topico);
    abrirModalDetalhe();
    await carregarRespostas(topico.id);
  }

  function renderizarDetalheTopico(topico) {
    const status = statusTopico(topico);
    const titulo = document.getElementById('forum-detalhe-titulo');
    const descricao = document.getElementById('forum-detalhe-descricao');
    const fotos = document.getElementById('forum-detalhe-fotos');
    const info = document.getElementById('forum-detalhe-info');
    if (titulo) titulo.textContent = `${topico.titulo || 'Publicação'} - ${status}`;
    if (descricao) descricao.innerHTML = textoHtml(topico.descricao || '');
    if (fotos) fotos.innerHTML = fotosHtml(topico).replace('forum-fotos-grid', 'forum-fotos-grid detalhe');
    if (info) info.innerHTML = `<div class="forum-info-linha"><strong>Autor:</strong><span>${autorLinhaHtml(topico)}</span></div><div class="forum-info-linha"><strong>Categoria:</strong><span>${esc(topico.categoria || 'Categoria')}</span></div><div class="forum-info-linha"><strong>Data:</strong><span>${esc(formatarData(topico.criado_em))}</span></div><div class="forum-info-linha"><strong>Comentários:</strong><span>${Number(topico.total_respostas || 0)} comentários</span></div>`;
    renderizarAcoesTopico(topico);
  }

  function abrirModalDetalhe() {
    const modal = document.getElementById('forum-detalhe');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function fecharTopico() {
    const modal = document.getElementById('forum-detalhe');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    topicoAtual = null;
    respostasCache = [];
  }

  function fecharMenusAcoes() {
    document.querySelectorAll('.forum-acoes-menu-wrap.aberto').forEach(menu => menu.classList.remove('aberto'));
  }

  function toggleMenuAcoes(event) {
    if (event) event.stopPropagation();
    const wrap = event?.currentTarget?.closest('.forum-acoes-menu-wrap');
    const aberto = wrap?.classList.contains('aberto');
    fecharMenusAcoes();
    if (wrap && !aberto) wrap.classList.add('aberto');
  }

  function executarAcaoMenuTopico(nomeAcao, argumento) {
    fecharMenusAcoes();
    const acoes = {
      resolver: () => marcarTopicoResolvido(),
      foto: () => trocarFotoTopico(Number(argumento || 1)),
      editar: () => editarTopico(),
      excluir: () => excluirTopico(),
      denunciar: () => topicoAtual?.id && denunciarTopico(topicoAtual.id)
    };
    if (acoes[nomeAcao]) acoes[nomeAcao]();
  }

  function renderizarAcoesTopico(topico) {
    const box = document.getElementById('forum-topico-acoes');
    if (!box || !topico) return;
    const dono = ehDonoTopico(topico);
    const resolvido = statusTopico(topico) === 'resolvido';
    const itens = [];
    if (topico.usuario_id) itens.push(`<button type="button" class="forum-menu-item destaque" onclick="forumAbrirPerfilAutor('${escJs(topico.usuario_id)}', event)">👤 Ver perfil</button>`);
    if (dono && !resolvido) itens.push('<button type="button" class="forum-menu-item destaque" onclick="forumExecutarAcaoMenuTopico(\'resolver\')">✅ Marcar como resolvido</button>');
    if (dono) {
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'foto\', 1)">📷 Adicionar/trocar foto 1</button>');
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'foto\', 2)">📷 Adicionar/trocar foto 2</button>');
      itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'editar\')">✏️ Editar publicação</button>');
      itens.push('<button type="button" class="forum-menu-item perigo" onclick="forumExecutarAcaoMenuTopico(\'excluir\')">🗑️ Excluir publicação</button>');
    }
    itens.push('<button type="button" class="forum-menu-item" onclick="forumExecutarAcaoMenuTopico(\'denunciar\')">🚩 Denunciar</button>');
    box.innerHTML = `<div class="forum-acoes-compactas"><div class="forum-curtir-slot">${botaoCurtirTopico(topico)}</div><div class="forum-acoes-menu-wrap"><button type="button" class="forum-menu-trigger" onclick="forumToggleMenuAcoes(event)" aria-label="Mais ações da publicação">⋮</button><div class="forum-acoes-menu">${itens.join('')}</div></div></div>`;
  }

  function atualizarTopicoLocal(patch) {
    if (!topicoAtual?.id) return;
    topicoAtual = { ...topicoAtual, ...patch };
    const idx = topicosCache.findIndex(t => t.id === topicoAtual.id);
    if (idx >= 0) topicosCache[idx] = { ...topicosCache[idx], ...patch };
    renderizarDetalheTopico(topicoAtual);
    filtrarTopicosLocal();
  }

  async function editarTopico() {
    if (!topicoAtual?.id || !ehDonoTopico()) return;
    const novoTitulo = prompt('Editar título da publicação:', topicoAtual.titulo || '');
    if (novoTitulo === null) return;
    const novaCategoria = prompt(`Editar categoria:\n\nCategorias disponíveis:\n${CATEGORIAS.join('\n')}`, topicoAtual.categoria || 'Orçamentos');
    if (novaCategoria === null) return;
    const novaDescricao = prompt('Editar descrição da publicação:', textoLimpo(topicoAtual.descricao || ''));
    if (novaDescricao === null) return;
    const titulo = novoTitulo.trim();
    const categoria = novaCategoria.trim() || topicoAtual.categoria || 'Orçamentos';
    const descricao = novaDescricao.trim();
    if (titulo.length < 8) return alert('O título precisa ter pelo menos 8 caracteres.');
    if (descricao.length < 20) return alert('A descrição precisa ter pelo menos 20 caracteres.');
    if (!CATEGORIAS.includes(categoria)) return alert('Categoria inválida. Escolha uma categoria disponível.');
    try {
      const { error } = await _supabase.from('forum_topicos').update({ titulo, categoria, descricao }).eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      atualizarTopicoLocal({ titulo, categoria, descricao });
      mostrarAlerta('Publicação atualizada com sucesso.', 'ok');
    } catch (error) {
      console.error('Erro ao editar publicação:', error);
      alert('Não foi possível editar a publicação.');
    }
  }

  async function trocarFotoTopico(posicao) {
    if (!topicoAtual?.id || !ehDonoTopico()) return;
    const campo = campoFoto(posicao);
    const fotoAntiga = topicoAtual[campo] || '';
    const arquivo = await selecionarUmaFoto();
    if (!arquivo) return;
    try {
      const novaUrl = await uploadArquivoFotoTopico(arquivo);
      const { error } = await _supabase.from('forum_topicos').update({ [campo]: novaUrl }).eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      if (fotoAntiga) await removerArquivoStorageSeForDoUsuario(fotoAntiga);
      atualizarTopicoLocal({ [campo]: novaUrl });
      mostrarAlerta(`Foto ${posicao} atualizada com sucesso.`, 'ok');
    } catch (error) {
      console.error('Erro ao trocar foto:', error);
      alert(error.message || 'Não foi possível trocar a foto.');
    }
  }

  async function removerFotoTopico(posicao) {
    if (!topicoAtual?.id || !ehDonoTopico()) return;
    const campo = campoFoto(posicao);
    const fotoAntiga = topicoAtual[campo] || '';
    if (!fotoAntiga) return;
    if (!confirm(`Remover a foto ${posicao} desta publicação?`)) return;
    try {
      const { error } = await _supabase.from('forum_topicos').update({ [campo]: null }).eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      await removerArquivoStorageSeForDoUsuario(fotoAntiga);
      atualizarTopicoLocal({ [campo]: null });
      mostrarAlerta(`Foto ${posicao} removida com sucesso.`, 'ok');
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert(error.message || 'Não foi possível remover a foto.');
    }
  }

  async function carregarRespostas(topicoId) {
    const lista = document.getElementById('forum-lista-respostas');
    if (lista) lista.innerHTML = '<div class="forum-vazio">Carregando comentários...</div>';
    try {
      const { data, error } = await _supabase.from('forum_respostas').select('*').eq('topico_id', topicoId).order('marcada_como_solucao', { ascending: false }).order('criado_em', { ascending: true });
      if (error) throw error;
      respostasCache = Array.isArray(data) ? data : [];
      await carregarCurtidasUsuario();
      renderizarRespostas();
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      if (lista) lista.innerHTML = '<div class="forum-vazio">Não foi possível carregar comentários.</div>';
    }
  }

  function renderizarRespostas() {
    const lista = document.getElementById('forum-lista-respostas');
    if (!lista) return;
    if (!respostasCache.length) {
      lista.innerHTML = '<div class="forum-vazio">Ainda não há comentários. Seja o primeiro a ajudar.</div>';
      return;
    }
    const donoTopico = topicoAtual && sessaoAtual?.user?.id === topicoAtual.usuario_id;
    lista.innerHTML = respostasCache.map(resposta => {
      const donoResposta = sessaoAtual?.user?.id === resposta.usuario_id;
      return `<article class="forum-resposta ${resposta.marcada_como_solucao ? 'solucao' : ''}"><div class="forum-resposta-topo"><span>${resposta.marcada_como_solucao ? '✓ Solução marcada' : 'Comentário'}</span><span>${formatarData(resposta.criado_em)}</span></div>${autorLinhaHtml(resposta)}<div style="margin-top:12px;">${textoHtml(resposta.resposta)}</div><div class="forum-resposta-acoes">${botaoCurtirResposta(resposta)}${donoTopico && !resposta.marcada_como_solucao ? `<button type="button" class="forum-link-btn" onclick="forumMarcarRespostaSolucao('${escJs(resposta.id)}')">Marcar solução</button>` : ''}${donoResposta ? `<button type="button" class="forum-link-btn" onclick="forumEditarResposta('${escJs(resposta.id)}')">Editar</button><button type="button" class="forum-link-btn" onclick="forumExcluirResposta('${escJs(resposta.id)}')">Excluir</button>` : ''}<button type="button" class="forum-link-btn" onclick="forumDenunciarResposta('${escJs(resposta.id)}')">Denunciar</button></div></article>`;
    }).join('');
  }

  async function editarResposta(respostaId) {
    const resposta = respostasCache.find(r => r.id === respostaId);
    if (!resposta || sessaoAtual?.user?.id !== resposta.usuario_id) return;
    const novoTexto = prompt('Editar comentário:', textoLimpo(resposta.resposta || ''));
    if (novoTexto === null) return;
    const texto = novoTexto.trim();
    if (texto.length < 8) return alert('O comentário precisa ter pelo menos 8 caracteres.');
    try {
      const { error } = await _supabase.from('forum_respostas').update({ resposta: texto }).eq('id', respostaId).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      resposta.resposta = texto;
      renderizarRespostas();
      mostrarAlerta('Comentário atualizado com sucesso.', 'ok');
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Não foi possível editar o comentário.');
    }
  }

  async function criarResposta(event) {
    event.preventDefault();
    if (!sessaoAtual?.user?.id || !topicoAtual?.id) return;
    const texto = document.getElementById('forum-resposta-texto')?.value?.trim();
    if (!texto || texto.length < 8) return alert('Escreva um comentário mais completo.');
    setBotao('forum-btn-responder', 'Enviando...', true);
    try {
      const autor = autorAtualPayload();
      const { data, error } = await _supabase.from('forum_respostas').insert({ topico_id: topicoAtual.id, usuario_id: sessaoAtual.user.id, autor_nome: autor.autor_nome, autor_empresa: autor.autor_empresa, autor_foto_url: autor.autor_foto_url, resposta: texto }).select('id').single();
      if (error) throw error;
      await executarRPCNotificacao('fs_forum_notificar_resposta', { p_topico_id: topicoAtual.id, p_resposta_id: data?.id });
      document.getElementById('forum-resposta-texto').value = '';
      await carregarRespostas(topicoAtual.id);
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao comentar:', error);
      alert('Não foi possível enviar o comentário.');
    } finally {
      setBotao('forum-btn-responder', 'Enviar comentário', false);
    }
  }

  async function marcarTopicoResolvido() {
    if (!topicoAtual?.id) return;
    if (!confirm('Marcar esta publicação como resolvida?')) return;
    try {
      const { error } = await _supabase.from('forum_topicos').update({ resolvido: true, status: 'resolvido' }).eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      atualizarTopicoLocal({ resolvido: true, status: 'resolvido' });
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao marcar resolvido:', error);
      alert('Não foi possível marcar como resolvido.');
    }
  }

  async function marcarRespostaSolucao(respostaId) {
    if (!topicoAtual?.id || !respostaId) return;
    if (!ehDonoTopico()) return alert('Apenas o autor da publicação pode marcar uma solução.');
    if (!confirm('Marcar este comentário como solução?')) return;
    try {
      await _supabase.from('forum_respostas').update({ marcada_como_solucao: false }).eq('topico_id', topicoAtual.id);
      const { error } = await _supabase.from('forum_respostas').update({ marcada_como_solucao: true }).eq('id', respostaId).eq('topico_id', topicoAtual.id);
      if (error) throw error;
      await _supabase.from('forum_topicos').update({ resolvido: true, status: 'resolvido' }).eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      atualizarTopicoLocal({ resolvido: true, status: 'resolvido' });
      await carregarRespostas(topicoAtual.id);
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao marcar solução:', error);
      alert('Não foi possível marcar a solução.');
    }
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
      if (topicoAtual?.id === topicoId && topico) atualizarTopicoLocal({ total_curtidas: topico.total_curtidas });
      filtrarTopicosLocal();
    } catch (error) {
      console.error('Erro ao curtir publicação:', error);
      alert('Não foi possível curtir.');
    }
  }

  async function curtirResposta(respostaId) {
    if (!sessaoAtual?.user?.id || !respostaId || curtidasRespostas.has(respostaId)) return;
    try {
      const { error } = await _supabase.from('forum_curtidas').insert({ usuario_id: sessaoAtual.user.id, resposta_id: respostaId });
      if (error && error.code !== '23505') throw error;
      if (error?.code === '23505') return;
      await executarRPCNotificacao('fs_forum_notificar_curtida_resposta', { p_resposta_id: respostaId });
      curtidasRespostas.add(respostaId);
      const resposta = respostasCache.find(r => r.id === respostaId);
      if (resposta) resposta.total_curtidas = Number(resposta.total_curtidas || 0) + 1;
      renderizarRespostas();
    } catch (error) {
      console.error('Erro ao curtir comentário:', error);
      alert('Não foi possível curtir.');
    }
  }

  async function denunciarTopico(topicoId) {
    const motivo = prompt('Informe o motivo da denúncia:');
    if (!motivo?.trim()) return;
    try {
      const { error } = await _supabase.from('forum_denuncias').insert({ usuario_id: sessaoAtual?.user?.id || null, topico_id: topicoId, motivo: motivo.trim() });
      if (error) throw error;
      alert('Denúncia registrada para análise.');
    } catch (error) {
      console.error('Erro ao denunciar publicação:', error);
      alert('Não foi possível registrar a denúncia.');
    }
  }

  async function denunciarResposta(respostaId) {
    const motivo = prompt('Informe o motivo da denúncia:');
    if (!motivo?.trim()) return;
    try {
      const { error } = await _supabase.from('forum_denuncias').insert({ usuario_id: sessaoAtual?.user?.id || null, resposta_id: respostaId, motivo: motivo.trim() });
      if (error) throw error;
      alert('Denúncia registrada para análise.');
    } catch (error) {
      console.error('Erro ao denunciar comentário:', error);
      alert('Não foi possível registrar a denúncia.');
    }
  }

  async function excluirTopico() {
    if (!topicoAtual?.id) return;
    if (!confirm('Excluir esta publicação e todos os comentários?')) return;
    const fotos = fotosTopico(topicoAtual);
    try {
      const { error } = await _supabase.from('forum_topicos').delete().eq('id', topicoAtual.id).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      await Promise.allSettled(fotos.map(url => removerArquivoStorageSeForDoUsuario(url)));
      fecharTopico();
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      alert('Não foi possível excluir a publicação.');
    }
  }

  async function excluirResposta(respostaId) {
    if (!respostaId) return;
    if (!confirm('Excluir este comentário?')) return;
    try {
      const { error } = await _supabase.from('forum_respostas').delete().eq('id', respostaId).eq('usuario_id', sessaoAtual.user.id);
      if (error) throw error;
      await carregarRespostas(topicoAtual.id);
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Não foi possível excluir o comentário.');
    }
  }

  function abrirPerfilAutor(usuarioId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!usuarioId) return;
    window.location.href = `/perfil.html?id=${encodeURIComponent(usuarioId)}`;
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

  function obterTopicoHash() {
    const hash = String(window.location.hash || '');
    const match = hash.match(/^#topico=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function abrirTopicoDoHash() {
    const id = obterTopicoHash();
    if (!id || abrirTopicoDoHash.aberto === id) return;
    const existe = topicosCache.some(t => String(t.id) === String(id));
    if (!existe) return;
    abrirTopicoDoHash.aberto = id;
    setTimeout(() => abrirTopico(id), 120);
  }

  async function inicializarForumFS() {
    instalarCssPlanos();
    instalarPatchInsertForum();
    mostrarConteudo();
    preencherCategorias();
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

  document.addEventListener('click', event => {
    if (!event.target.closest('.forum-acoes-menu-wrap')) fecharMenusAcoes();
  });

  window.addEventListener('hashchange', () => {
    abrirTopicoDoHash.aberto = '';
    abrirTopicoDoHash();
  });

  window.forumCarregarTopicos = carregarTopicos;
  window.forumFiltrarTopicosLocal = filtrarTopicosLocal;
  window.forumFiltrarCategoria = filtrarCategoria;
  window.forumMostrarFormularioNovoTopico = mostrarFormularioNovoTopico;
  window.forumOcultarFormularioNovoTopico = ocultarFormularioNovoTopico;
  window.forumValidarFotosSelecionadas = validarFotosSelecionadas;
  window.forumCriarTopico = criarTopico;
  window.forumAbrirTopico = abrirTopico;
  window.forumFecharTopico = fecharTopico;
  window.forumEditarTopico = editarTopico;
  window.forumTrocarFotoTopico = trocarFotoTopico;
  window.forumRemoverFotoTopico = removerFotoTopico;
  window.forumCriarResposta = criarResposta;
  window.forumEditarResposta = editarResposta;
  window.forumMarcarTopicoResolvido = marcarTopicoResolvido;
  window.forumMarcarRespostaSolucao = marcarRespostaSolucao;
  window.forumCurtirTopico = curtirTopico;
  window.forumCurtirResposta = curtirResposta;
  window.forumDenunciarTopico = denunciarTopico;
  window.forumDenunciarResposta = denunciarResposta;
  window.forumExcluirTopico = excluirTopico;
  window.forumExcluirResposta = excluirResposta;
  window.forumPreencherCategorias = preencherCategorias;
  window.forumAbrirPerfilAutor = abrirPerfilAutor;
  window.forumAbrirMeuPerfil = abrirMeuPerfil;
  window.forumToggleMenuAcoes = toggleMenuAcoes;
  window.forumExecutarAcaoMenuTopico = executarAcaoMenuTopico;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarForumFS);
  else inicializarForumFS();
})();
