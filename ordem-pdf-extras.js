/* FS Orçamentos — ordem-pdf-extras.js
   Arquivo legado neutralizado.
   O gerador atual da OS com fotos antes/depois fica em ordem-pdf-fotos-depois.js.
   Mantido apenas como compatibilidade para chamadas antigas.
*/
(function(){
  'use strict';

  function instalarCompatibilidade(){
    if(typeof window.gerarPDFOrdemFotosDepois === 'function'){
      window.gerarPDFOrdemComExtras = window.gerarPDFOrdemFotosDepois;
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', instalarCompatibilidade);
  }else{
    instalarCompatibilidade();
  }

  setTimeout(instalarCompatibilidade, 800);
  setTimeout(instalarCompatibilidade, 1800);
})();
