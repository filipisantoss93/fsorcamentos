/* =========================================================
   FS ORÇAMENTOS - gerador-cleanup-fix.js
   Remove o bloco redundante acima de "Dados da empresa".
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-gerador-cleanup-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-gerador-cleanup-fix-style';
    style.textContent = `
      #formulario-orcamento > .intro-form-gerador {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removerBloco() {
    document.querySelectorAll('#formulario-orcamento > .intro-form-gerador').forEach(el => el.remove());
  }

  function iniciar() {
    injetarEstilo();
    removerBloco();
    setTimeout(removerBloco, 400);
    setTimeout(removerBloco, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
