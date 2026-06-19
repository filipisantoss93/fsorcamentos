/* =========================================================
   FS ORÇAMENTOS — perfil social no fórum
   Liga autor/avatar ao perfil.html?id=usuario_id sem alterar schema.
   ========================================================= */
(function () {
  'use strict';

  function obterIdAutorDoCard(card) {
    if (!card) return '';
    const direto = card.dataset.usuarioId || card.dataset.userId || card.dataset.autorId || card.getAttribute('data-usuario-id') || card.getAttribute('data-user-id') || card.getAttribute('data-autor-id');
    if (direto) return direto;

    const link = card.querySelector('a[href*="perfil.html?id="]');
    if (link) {
      try { return new URL(link.href).searchParams.get('id') || ''; } catch (_) {}
    }

    const onclick = card.getAttribute('onclick') || '';
    const match = onclick.match(/usuario_id['"]?\s*[:=]\s*['"]([^'"]+)/i) || onclick.match(/user_id['"]?\s*[:=]\s*['"]([^'"]+)/i);
    return match?.[1] || '';
  }

  function normalizarAutorCard(card) {
    if (!card || card.dataset.fsPerfilSocial === '1') return;

    const autorLinha = card.querySelector('.forum-autor-linha, .forum-autor, .autor-topico, .topico-autor');
    if (!autorLinha) return;

    let userId = obterIdAutorDoCard(card) || autorLinha.dataset.usuarioId || autorLinha.dataset.userId || autorLinha.getAttribute('data-usuario-id') || autorLinha.getAttribute('data-user-id') || '';

    if (!userId && window.forumTopicosCache instanceof Array) {
      const titulo = card.querySelector('h3, .forum-topico-titulo')?.textContent?.trim();
      const topico = window.forumTopicosCache.find(t => titulo && String(t.titulo || '').trim() === titulo);
      userId = topico?.usuario_id || topico?.user_id || '';
      if (topico?.id) card.dataset.topicoId = topico.id;
    }

    if (!userId) return;

    card.dataset.fsPerfilSocial = '1';
    card.dataset.usuarioId = userId;
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

  function aplicar() {
    document.querySelectorAll('.forum-topico').forEach(normalizarAutorCard);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
  else aplicar();

  setInterval(aplicar, 1800);
})();