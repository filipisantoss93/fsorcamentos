(function(){
  'use strict';

  // Compatibilidade: orcamentos.html concentra tabela, modal, links e pagamentos.
  // Este arquivo não sobrescreve mais as implementações da página.
  let estavaCarregando = false;
  let instalado = false;

  function instalarCompatibilidade(){
    if(typeof window.renovarLink !== 'function' || typeof window.revogarLink !== 'function' || typeof renderizarTabelaOrcamentos !== 'function'){
      setTimeout(instalarCompatibilidade,120);
      return;
    }

    window.fsRenovarLinkOrcamento = window.renovarLink;
    window.fsRevogarLinkOrcamento = window.revogarLink;

    if(instalado) return;
    instalado = true;
    estavaCarregando = typeof carregandoOrcamentos !== 'undefined' && carregandoOrcamentos;

    // Garante a renderização após cada transição de carregamento, inclusive na
    // inicialização. Pode ser removido quando o estado for liberado antes do
    // render diretamente em orcamentos.html.
    if(!estavaCarregando) renderizarTabelaOrcamentos();
    setInterval(function(){
      const carregando = typeof carregandoOrcamentos !== 'undefined' && carregandoOrcamentos;
      if(estavaCarregando && !carregando) renderizarTabelaOrcamentos();
      estavaCarregando = carregando;
    },120);
  }

  instalarCompatibilidade();
})();
