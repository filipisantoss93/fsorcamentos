/* =========================================================
   FS ORÇAMENTOS — perfil social no fórum
   Liga autor/avatar ao perfil.html?id=usuario_id, exibe selo do plano
   e abre tópico automaticamente quando vier de /forum.html#topico=ID.
   ========================================================= */
(function () {
  'use strict';

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function planoFinal(valor) {
    const plano = normalizar(valor || 'gratis');
    if (plano === 'premium' || plano === 'gestao' || plano === 'gestão') return 'premium';
    if (plano === 'basico' || plano === 'básico') return 'basico';
    return 'gratis';
  }

  function planoLabel(valor) {
    const plano = planoFinal(valor);
    if (plano === 'premium') return 'Premium / Gestão';
    if (plano === 'basico') return 'Básico';
    return 'Grátis';
  }

  function inserirCss() {
    if (document.getElementById('fs-forum-social-planos-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-forum-social-planos-css';
    style.textContent = `
      .forum-autor-linha {
        cursor: pointer !important;
        border-radius: 6px !important;
        padding: 3px !important;
        transition: background .15s ease, box-shadow .15s ease !important;
      }
      .forum-autor-linha:hover {
        background: rgba(15, 23, 42, .06) !important;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .10) !important;
      }
      .forum-autor-texto strong {
        display: inline-flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 5px !important;
      }
      .forum-plano-selo {
        display: inline-flex !important;
        width: fit-content !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 18px !important;
        padding: 3px 6px !important;
        border-radius: 4px !important;
        border: 1px solid #d1d5db !important;
        background: #f3f4f6 !important;
        color: #1f2937 !important;
        font-size: 9.5px !important;
        line-height: 1 !important;
        font-weight: 950 !important;
        text-transform: uppercase !important;
        letter-spacing: .02em !important;
        vertical-align: middle !important;
      }
      .forum-plano-selo.basico {
        background: #e0f2fe !important;
        color: #075985 !important;
        border-color: #bae6fd !important;
      }
      .forum-plano-selo.premium {
        background: #ffc400 !important;
        color: #111827 !important;
        border-color: #111827 !important;
        box-shadow: 0 0 0 1px rgba(15, 23, 42, .08) !important;
      }
      .forum-topico:has(.forum-plano-selo.premium) {
        border-color: #d6a900 !important;
        box-shadow: 0 5px 16px rgba(15, 23, 42, .09) !important;
      }
      .forum-social-perfil-link {
        text-decoration: none !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);
  }

  function obterTopicosCache() {
    try {
      if (typeof forumTopicosCache !== 'undefined' && Array.isArray(forumTopicosCache)) return forumTopicosCache;
    } catch (_) {}
    return [];
  }

  function obterTopicoAtual() {
    try {
      if (typeof forumTopicoAtual !== 'undefined' && forumTopicoAtual) return forumTopicoAtual;
    } catch (_) {}
    return null;
  }

  function obterPerfilAtual() {
    try {
      if (typeof forumPerfilAtual !== 'undefined' && forumPerfilAtual) return forumPerfilAtual;
    } catch (_) {}
    return null;
  }

  function acharTopicoDoCard(card) {
    if (!card) return null;
    const id = card.dataset.topicoId || card.getAttribute('data-topico-id') || '';
    const topicos = obterTopicosCache();
    if (id) return topicos.find(t => String(t.id) === String(id)) || null;

    const tituloTexto = card.querySelector('h3, .forum-topico-titulo')?.textContent || '';
    const tituloLimpo = tituloTexto.split(' - ')[0].trim();
    return topicos.find(t => tituloLimpo && String(t.titulo || '').trim() === tituloLimpo) || null;
  }

  function obterRegistroPorAutorLinha(autorLinha) {
    const card = autorLinha?.closest?.('.forum-topico');
    if (card) return acharTopicoDoCard(card);
    const atual = obterTopicoAtual();
    if (autorLinha?.closest?.('#forum-detalhe') && atual) return atual;
    return null;
  }

  function obterIdAutor(registro, autorLinha) {
    return registro?.usuario_id || registro?.user_id || autorLinha?.dataset?.usuarioId || autorLinha?.getAttribute?.('data-usuario-id') || '';
  }

  function obterPlanoAutor(registro) {
    if (registro?.autor_plano) return registro.autor_plano;
    const userId = registro?.usuario_id || registro?.user_id || '';
    const perfilAtual = obterPerfilAtual();
    try {
      if (typeof forumSessaoAtual !== 'undefined' && forumSessaoAtual?.user?.id === userId && perfilAtual?.plano) return perfilAtual.plano;
    } catch (_) {}
    return registro?.plano || 'gratis';
  }

  function aplicarSelo(autorLinha, registro) {
    if (!autorLinha || !registro) return;
    const texto = autorLinha.querySelector('.forum-autor-texto');
    const strong = texto?.querySelector('strong');
    if (!strong || strong.querySelector('.forum-plano-selo')) return;

    const plano = planoFinal(obterPlanoAutor(registro));
    const selo = document.createElement('span');
    selo.className = `forum-plano-selo ${plano}`;
    selo.textContent = planoLabel(plano);
    strong.appendChild(selo);
  }

  function aplicarLinkPerfil(autorLinha, registro) {
    const userId = obterIdAutor(registro, autorLinha);
    if (!autorLinha || !userId || autorLinha.dataset.fsPerfilSocial === '1') return;

    autorLinha.dataset.fsPerfilSocial = '1';
    autorLinha.dataset.usuarioId = userId;
    autorLinha.setAttribute('role', 'link');
    autorLinha.setAttribute('tabindex', '0');
    autorLinha.setAttribute('title', 'Ver perfil do usuário');

    function abrirPerfil(event) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = `/perfil.html?id=${encodeURIComponent(userId)}`;
    }

    autorLinha.addEventListener('click', abrirPerfil);
    autorLinha.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') abrirPerfil(event);
    });
  }

  async function enriquecerPlanosDoCache() {
    try {
      if (!window._supabase) return;
      const topicos = obterTopicosCache();
      const ids = [...new Set(topicos.map(t => t?.usuario_id).filter(Boolean))];
      const faltando = ids.filter(id => {
        const t = topicos.find(item => item.usuario_id === id);
        return !t?.autor_plano;
      });
      if (!faltando.length) return;

      const { data, error } = await _supabase
        .from('perfis')
        .select('id, plano')
        .in('id', faltando);

      if (error || !Array.isArray(data)) return;
      const mapa = new Map(data.map(p => [p.id, p.plano || 'gratis']));
      topicos.forEach(t => {
        if (t?.usuario_id && mapa.has(t.usuario_id)) t.autor_plano = mapa.get(t.usuario_id);
      });
    } catch (error) {
      console.warn('Não foi possível enriquecer planos no social:', error);
    }
  }

  function obterTopicoHash() {
    const hash = String(window.location.hash || '');
    const match = hash.match(/^#topico=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function tentarAbrirTopicoDoHash() {
    const topicoId = obterTopicoHash();
    if (!topicoId || tentarAbrirTopicoDoHash.aberto === topicoId) return;
    if (typeof window.forumAbrirTopico !== 'function') return;

    const existeCard = !!document.querySelector(`.forum-topico[data-topico-id="${CSS.escape(topicoId)}"]`);
    const existeCache = obterTopicosCache().some(t => String(t.id) === String(topicoId));
    if (!existeCard && !existeCache) return;

    tentarAbrirTopicoDoHash.aberto = topicoId;
    setTimeout(() => window.forumAbrirTopico(topicoId), 120);
  }

  async function aplicar() {
    inserirCss();
    await enriquecerPlanosDoCache();

    document.querySelectorAll('.forum-topico').forEach(card => {
      const registro = acharTopicoDoCard(card);
      if (registro?.id) card.dataset.topicoId = registro.id;
      const autorLinha = card.querySelector('.forum-autor-linha, .forum-autor, .autor-topico, .topico-autor');
      if (!autorLinha || !registro) return;
      aplicarSelo(autorLinha, registro);
      aplicarLinkPerfil(autorLinha, registro);
    });

    document.querySelectorAll('#forum-detalhe .forum-autor-linha').forEach(autorLinha => {
      const registro = obterRegistroPorAutorLinha(autorLinha);
      if (!registro) return;
      aplicarSelo(autorLinha, registro);
      aplicarLinkPerfil(autorLinha, registro);
    });

    tentarAbrirTopicoDoHash();
  }

  const aplicarComAtraso = () => setTimeout(aplicar, 80);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicarComAtraso);
  else aplicarComAtraso();

  const observer = new MutationObserver(() => aplicarComAtraso());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('hashchange', () => {
    tentarAbrirTopicoDoHash.aberto = '';
    aplicarComAtraso();
  });
})();
