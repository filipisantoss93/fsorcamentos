/* FS Orçamentos - remove blocos antigos duplicados da home grátis no DOM
   Mantém somente o bloco novo #fs-planos-gratis-simples para Básico/Premium. */
(function () {
  'use strict';

  const BLOCO_NOVO_ID = 'fs-planos-gratis-simples';

  function homeGratisAtiva() {
    const homeGratis = document.getElementById('home-plano-gratis');
    if (!homeGratis) return false;
    if (document.body.classList.contains('fs-visitante-lite')) return false;
    return homeGratis.classList.contains('ativo') || getComputedStyle(homeGratis).display !== 'none';
  }

  function removerBlocosAntigos() {
    if (!homeGratisAtiva()) return;

    const homeGratis = document.getElementById('home-plano-gratis');
    if (!homeGratis) return;

    const seletoresAntigos = [
      '.home-premium-showcase',
      '.home-basico-showcase',
      '.home-whatsapp-section',
      '.home-aprovacao-section',
      '.home-status-section',
      '.home-comparativo-section',
      '.whatsapp-preview-home',
      '.cliente-aprovacao-home',
      '.status-orcamentos-home',
      '.comparativo-home:not(.fs-visitante-comparativo-wrapper)'
    ];

    seletoresAntigos.forEach((seletor) => {
      homeGratis.querySelectorAll(seletor).forEach((el) => {
        if (!el || el.id === BLOCO_NOVO_ID || el.closest(`#${BLOCO_NOVO_ID}`)) return;
        el.remove();
      });
    });

    // Garante que só exista um bloco novo.
    const novos = Array.from(document.querySelectorAll(`#${BLOCO_NOVO_ID}`));
    novos.slice(1).forEach((el) => el.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removerBlocosAntigos);
  } else {
    removerBlocosAntigos();
  }

  window.addEventListener('load', removerBlocosAntigos);
  window.addEventListener('storage', removerBlocosAntigos);
  setTimeout(removerBlocosAntigos, 120);
  setTimeout(removerBlocosAntigos, 500);
  setTimeout(removerBlocosAntigos, 1200);
  setTimeout(removerBlocosAntigos, 2800);
})();
