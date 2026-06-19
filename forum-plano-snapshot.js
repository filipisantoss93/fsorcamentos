/* =========================================================
   FS ORÇAMENTOS — snapshot do plano na Comunidade
   Adiciona autor_plano automaticamente em inserts de tópicos/respostas.
   ========================================================= */
(function () {
  'use strict';

  function normalizarPlano(valor) {
    const plano = String(valor || 'gratis')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (plano === 'premium' || plano === 'gestao') return 'premium';
    if (plano === 'basico') return 'basico';
    return 'gratis';
  }

  function planoAtualUsuario() {
    try {
      if (typeof forumPerfilAtual !== 'undefined' && forumPerfilAtual?.plano) {
        return normalizarPlano(forumPerfilAtual.plano);
      }
    } catch (_) {}

    return normalizarPlano(
      localStorage.getItem('usuario_plano') ||
      localStorage.getItem('plano') ||
      'gratis'
    );
  }

  function incluirPlano(payload) {
    const plano = planoAtualUsuario();

    if (Array.isArray(payload)) {
      return payload.map(item => item && typeof item === 'object'
        ? { autor_plano: item.autor_plano || plano, ...item, autor_plano: item.autor_plano || plano }
        : item
      );
    }

    if (payload && typeof payload === 'object') {
      return { autor_plano: payload.autor_plano || plano, ...payload, autor_plano: payload.autor_plano || plano };
    }

    return payload;
  }

  function instalarPatch() {
    if (!window._supabase || window._supabase.__fsForumPlanoSnapshotPatch) return;

    const originalFrom = window._supabase.from.bind(window._supabase);

    window._supabase.from = function fsForumFromPatched(tableName) {
      const builder = originalFrom(tableName);
      const tabela = String(tableName || '');

      if (!['forum_topicos', 'forum_respostas'].includes(tabela)) {
        return builder;
      }

      const originalInsert = builder.insert?.bind(builder);
      if (typeof originalInsert === 'function') {
        builder.insert = function fsForumInsertPatched(payload, options) {
          return originalInsert(incluirPlano(payload), options);
        };
      }

      return builder;
    };

    window._supabase.__fsForumPlanoSnapshotPatch = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarPatch);
  } else {
    instalarPatch();
  }

  setTimeout(instalarPatch, 500);
  setTimeout(instalarPatch, 1500);
})();