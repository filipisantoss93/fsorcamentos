/* =========================================================
   FS ORÇAMENTOS - index-ads-restore.js
   Restaura anúncios AdSense na home pública simplificada.

   Por que existe:
   - index-visitante-lite.js deixa a home de visitantes mais limpa;
   - a home antiga do plano grátis fica oculta em visitantes;
   - os blocos AdSense originais estão dentro dessa área oculta;
   - por isso, apenas trocar display:none por display:block não resolve.

   Esta correção move os blocos de anúncio existentes para dentro da
   landing simplificada somente quando o usuário é visitante.
   Usuários logados continuam seguindo o comportamento por plano.
   ========================================================= */
(function () {
  'use strict';

  const ADS_RESTAURADOS = [
    {
      id: 'adsense-gratis-topo',
      destino: '.fs-visitante-hero',
      posicao: 'afterend'
    },
    {
      id: 'adsense-gratis-rodape',
      destino: '.fs-visitante-comparativo-wrapper',
      posicao: 'afterend'
    }
  ];

  const placeholders = new Map();

  function visitanteLiteAtivo() {
    return document.body && document.body.classList.contains('fs-visitante-lite');
  }

  function injetarEstilo() {
    if (document.getElementById('fs-index-ads-restore-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-index-ads-restore-style';
    style.textContent = `
      body.fs-visitante-lite .bloco-anuncio.fs-adsense-zone.fs-index-ad-restored,
      body.fs-visitante-lite .fs-visitante-home-lite > .bloco-anuncio.fs-adsense-zone,
      body.fs-visitante-lite .fs-visitante-home-lite .bloco-anuncio.fs-adsense-zone {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 970px;
        width: 100%;
        min-height: 110px;
        margin: 18px auto !important;
      }

      body.fs-visitante-lite .bloco-anuncio.fs-adsense-zone.fs-index-ad-restored ins.adsbygoogle {
        display: block !important;
        visibility: visible !important;
        min-height: 90px;
      }
    `;
    document.head.appendChild(style);
  }

  function guardarLugarOriginal(zona) {
    if (!zona || placeholders.has(zona.id)) return;

    const marcador = document.createComment(`fs-ad-original-${zona.id}`);
    zona.parentNode?.insertBefore(marcador, zona);
    placeholders.set(zona.id, marcador);
  }

  function restaurarLugarOriginal(zona) {
    const marcador = placeholders.get(zona.id);
    if (!zona || !marcador || !marcador.parentNode) return;

    marcador.parentNode.insertBefore(zona, marcador.nextSibling);
    zona.classList.remove('fs-index-ad-restored');
    zona.style.removeProperty('display');
    zona.style.removeProperty('visibility');
    zona.style.removeProperty('opacity');
  }

  function prepararZona(zona) {
    zona.classList.add('fs-index-ad-restored');
    zona.style.setProperty('display', 'block', 'important');
    zona.style.setProperty('visibility', 'visible', 'important');
    zona.style.setProperty('opacity', '1', 'important');
  }

  function empurrarAdSenseQuandoNecessario(zona) {
    if (!window.adsbygoogle || !Array.isArray(window.adsbygoogle)) return;

    zona.querySelectorAll('ins.adsbygoogle').forEach((ins) => {
      if (ins.getAttribute('data-adsbygoogle-status')) return;

      try {
        window.adsbygoogle.push({});
      } catch (erro) {
        console.warn('FS Orçamentos: AdSense ainda não conseguiu renderizar este bloco.', erro);
      }
    });
  }

  function aplicar() {
    injetarEstilo();

    ADS_RESTAURADOS.forEach((item) => {
      const zona = document.getElementById(item.id);
      if (!zona) return;

      guardarLugarOriginal(zona);

      if (!visitanteLiteAtivo()) {
        restaurarLugarOriginal(zona);
        return;
      }

      const destino = document.querySelector(item.destino);
      const homeLite = document.getElementById('fs-visitante-home-lite');
      if (!destino || !homeLite) return;

      prepararZona(zona);
      destino.insertAdjacentElement(item.posicao, zona);
      empurrarAdSenseQuandoNecessario(zona);
    });
  }

  window.fsRestaurarAdsHomeVisitante = aplicar;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }

  setTimeout(aplicar, 300);
  setTimeout(aplicar, 900);
  setTimeout(aplicar, 1800);
})();
