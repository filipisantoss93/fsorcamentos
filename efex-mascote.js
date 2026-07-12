(() => {
  const VERSION = '20260712-4';
  const AVATAR = `/assets/images/avatar-fundotransparente.PNG?v=${VERSION}`;

  function removerElementosAntigos() {
    document.querySelectorAll('.fs-efex-contextual, .fs-efex-dica, [data-efex-dica-id]').forEach(elemento => elemento.remove());
  }

  function atualizarBotaoFlutuante() {
    const botao = document.getElementById('btn-flutuante-gerador-global');
    if (!botao) return;

    const avatarAtual = botao.querySelector('.fs-efex-avatar-btn');
    if (avatarAtual) {
      avatarAtual.src = AVATAR;
      return;
    }

    botao.dataset.efexAplicado = 'sim';
    botao.innerHTML = `<img class="fs-efex-avatar-btn" src="${AVATAR}" alt="" aria-hidden="true" style="display:block;width:38px!important;height:38px!important;max-width:38px!important;max-height:38px!important;object-fit:contain"><span>Gerar orçamento</span>`;
  }

  function desativarDicas() {
    window.mostrarDicaEfex = () => null;
  }

  function aplicar() {
    removerElementosAntigos();
    desativarDicas();
    atualizarBotaoFlutuante();
  }

  window.FS_EFEX_IMAGENS = Object.freeze({ avatar: AVATAR });

  const observar = new MutationObserver(() => {
    removerElementosAntigos();
    atualizarBotaoFlutuante();
  });

  function iniciar() {
    aplicar();
    observar.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();