/* FS ORÇAMENTOS — carregador do gerador polido */
(function carregarGeradorPolido() {
  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  carregarScript('gerador-core.js?v=20260715-polimento-v3')
    .then(() => carregarScript('gerador-ui-polimento.js?v=20260715-polimento-v4'))
    .then(() => carregarScript('gerador-persistencia-polimento.js?v=20260715-polimento-v1'))
    .then(() => carregarScript('gerador-historico-polimento.js?v=20260715-polimento-v1'))
    .then(() => carregarScript('gerador-link-publico-polimento.js?v=20260715-polimento-v1'))
    .then(() => carregarScript('gerador-ux-final-polimento.js?v=20260715-polimento-v1'))
    .catch(error => console.error('Falha ao carregar o gerador:', error));
})();
