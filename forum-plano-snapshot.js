/* =========================================================
   FS ORÇAMENTOS — compatibilidade de publicação no Fórum
   Mantém os inserts e o modal de publicação compatíveis.
   ========================================================= */
(function () {
  'use strict';

  function limparPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const item = { ...payload };

    delete item.autor_plano;

    ['foto_1_url', 'foto_2_url'].forEach((campo) => {
      if (item[campo] === null || item[campo] === undefined || item[campo] === '') delete item[campo];
    });

    return item;
  }

  function prepararPayload(payload) {
    if (Array.isArray(payload)) return payload.map(limparPayload);
    return limparPayload(payload);
  }

  function instalarPatchInsert() {
    if (!window._supabase || window._supabase.__fsForumPublicacaoPatch) return;

    const originalFrom = window._supabase.from.bind(window._supabase);

    window._supabase.from = function fsForumFromPatched(tableName) {
      const builder = originalFrom(tableName);
      const tabela = String(tableName || '');

      if (!['forum_topicos', 'forum_respostas'].includes(tabela)) return builder;

      const originalInsert = builder.insert?.bind(builder);
      if (typeof originalInsert === 'function') {
        builder.insert = function fsForumInsertPatched(payload, options) {
          return originalInsert(prepararPayload(payload), options);
        };
      }

      return builder;
    };

    window._supabase.__fsForumPublicacaoPatch = true;
  }

  function formularioHtml() {
    return `
      <form id="forum-form-topico" class="forum-form" onsubmit="forumCriarTopico(event)">
        <label>
          Título da publicação
          <input id="forum-topico-titulo" type="text" maxlength="120" placeholder="Ex: Como cobrar diagnóstico antes do orçamento?" required>
        </label>
        <label>
          Categoria
          <select id="forum-topico-categoria" required></select>
        </label>
        <label>
          Conteúdo
          <textarea id="forum-topico-descricao" maxlength="4000" placeholder="Conte o contexto, o que aconteceu, o que você já tentou ou qual opinião precisa da comunidade." required></textarea>
        </label>
        <label>
          Fotos da publicação
          <input id="forum-topico-fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple onchange="forumValidarFotosSelecionadas()">
          <small>Opcional. Até 2 fotos, máximo 2 MB por foto. Formatos: JPG, PNG ou WEBP.</small>
        </label>
        <div id="forum-preview-fotos" class="forum-preview-fotos"></div>
        <button id="forum-btn-criar" type="submit" class="forum-btn">Publicar na comunidade</button>
      </form>
    `;
  }

  function mostrarElemento(el, display) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute('hidden');
    el.style.setProperty('display', display, 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('max-height', 'none', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('position', 'static', 'important');
    el.style.setProperty('transform', 'none', 'important');
  }

  function corrigirModalPublicacao() {
    const card = document.getElementById('forum-form-card');
    if (!card) return;

    let painel = card.querySelector('.forum-publicacao-modal-painel');
    if (!painel) painel = card;

    let form = document.getElementById('forum-form-topico');
    if (!form) {
      painel.insertAdjacentHTML('beforeend', formularioHtml());
      form = document.getElementById('forum-form-topico');
    }

    if (form && !painel.contains(form)) painel.appendChild(form);

    const topo = painel.querySelector('.forum-card-topo');
    if (topo && form && topo.nextElementSibling !== form) topo.insertAdjacentElement('afterend', form);

    mostrarElemento(form, 'grid');
    form?.querySelectorAll('label,input,select,textarea,small,button,#forum-preview-fotos').forEach((el) => {
      mostrarElemento(el, el.tagName === 'LABEL' || el.id === 'forum-preview-fotos' ? 'grid' : el.tagName === 'BUTTON' ? 'inline-flex' : 'block');
    });

    try {
      if (typeof window.forumPreencherCategorias === 'function') window.forumPreencherCategorias();
    } catch (_) {}
  }

  function instalarObservadorModal() {
    if (window.__fsForumModalPublicacaoObserver) return;
    window.__fsForumModalPublicacaoObserver = true;

    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('.forum-btn, .forum-composer-card, #forum-form-card')) {
        setTimeout(corrigirModalPublicacao, 40);
        setTimeout(corrigirModalPublicacao, 180);
      }
    }, true);

    const observer = new MutationObserver(() => corrigirModalPublicacao());
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  }

  function iniciar() {
    instalarPatchInsert();
    corrigirModalPublicacao();
    instalarObservadorModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  [300, 700, 1200, 2000, 3500].forEach((tempo) => setTimeout(iniciar, tempo));
})();
