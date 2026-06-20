/* =========================================================
   FS ORÇAMENTOS — compatibilidade de publicação no Fórum
   Mantém os inserts do fórum compatíveis com a tabela atual.
   ========================================================= */
(function () {
  'use strict';

  function limparPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const item = { ...payload };

    /* autor_plano causava erro quando a coluna ainda não existia no Supabase. */
    delete item.autor_plano;

    /* Campos opcionais de foto só são enviados quando realmente existem. */
    ['foto_1_url', 'foto_2_url'].forEach((campo) => {
      if (item[campo] === null || item[campo] === undefined || item[campo] === '') delete item[campo];
    });

    return item;
  }

  function prepararPayload(payload) {
    if (Array.isArray(payload)) return payload.map(limparPayload);
    return limparPayload(payload);
  }

  function instalarPatch() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarPatch);
  } else {
    instalarPatch();
  }

  setTimeout(instalarPatch, 300);
  setTimeout(instalarPatch, 1000);
  setTimeout(instalarPatch, 2000);
})();
