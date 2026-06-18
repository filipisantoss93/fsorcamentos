/* =========================================================
   FS ORÇAMENTOS - fs-header-offset-fix.js

   Mantido temporariamente para compatibilidade com config.js.
   O espaçamento do header fixo foi centralizado em header-clean.css.
   Este arquivo não deve mais injetar padding dinâmico para evitar
   duplicidade de espaçamento entre páginas.
   ========================================================= */
(function () {
  'use strict';
  document.documentElement.style.removeProperty('--fs-header-offset-real');
})();
