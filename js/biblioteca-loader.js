/* FS Orçamentos — carregamento seguro da Biblioteca Técnica */
(async function carregarBibliotecaComSeguranca() {
  'use strict';

  const CHAVES_PLANO = ['usuario_plano', 'usuario_plano_status', 'usuario_plano_expira_em'];

  // Nunca autorize conteúdo pago com dados antigos ou manipuláveis do navegador.
  CHAVES_PLANO.forEach(chave => localStorage.removeItem(chave));

  try {
    if (window._supabase) {
      const { data, error } = await window._supabase.auth.getSession();
      if (error || !data?.session?.user?.id) {
        CHAVES_PLANO.forEach(chave => localStorage.removeItem(chave));
      }
    }
  } catch (erro) {
    console.warn('Biblioteca carregada em modo seguro:', erro);
    CHAVES_PLANO.forEach(chave => localStorage.removeItem(chave));
  }

  await carregarScript('/js/biblioteca.js?v=20260712-2');
  await carregarScript('/js/biblioteca-enhancements.js?v=20260712-1');

  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.body.appendChild(script);
    });
  }
})().catch(erro => {
  console.error('Não foi possível inicializar a Biblioteca Técnica:', erro);
  const grid = document.getElementById('biblioteca-conteudos');
  if (grid) {
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = '<div class="biblioteca-vazio">Não foi possível carregar a biblioteca agora. Atualize a página e tente novamente.</div>';
  }
});
