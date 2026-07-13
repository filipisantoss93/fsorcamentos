(function(){
  'use strict';

  // Compatibilidade: a página orcamentos.html agora concentra toda a lógica de
  // tabela, modal, links públicos e pagamentos. Este arquivo não sobrescreve
  // mais funções globais nem dispara renderizações concorrentes.
  function instalarCompatibilidade(){
    if(typeof window.renovarLink !== 'function' || typeof window.revogarLink !== 'function'){
      setTimeout(instalarCompatibilidade,120);
      return;
    }
    window.fsRenovarLinkOrcamento = window.renovarLink;
    window.fsRevogarLinkOrcamento = window.revogarLink;
  }

  instalarCompatibilidade();
})();
