/* =========================================================
   FS ORÇAMENTOS - index-ads-restore.js
   Restaura anúncios AdSense na home.

   Regras:
   - visitante: move os anúncios para dentro da home simplificada;
   - usuário logado no Plano Grátis: mantém dois blocos de publicidade;
   - se o segundo bloco foi removido do index.html, recria o bloco no DOM.
   ========================================================= */
(function () {
  'use strict';

  const AD_CLIENT = 'ca-pub-5628949951885077';
  const AD_SLOT_PADRAO = '1739813454';

  const ADS_RESTAURADOS = [
    {
      id: 'adsense-gratis-topo',
      destinoVisitante: '.fs-visitante-hero',
      destinoGratis: '#home-plano-gratis .home-plano-hero',
      posicao: 'afterend'
    },
    {
      id: 'adsense-gratis-rodape',
      destinoVisitante: '.fs-visitante-comparativo-wrapper',
      destinoGratis: '#home-plano-gratis .home-story-section',
      posicao: 'afterend'
    }
  ];

  const placeholders = new Map();

  function visitanteLiteAtivo() {
    return document.body && document.body.classList.contains('fs-visitante-lite');
  }

  function homeGratisAtiva() {
    const homeGratis = document.getElementById('home-plano-gratis');
    if (!homeGratis || visitanteLiteAtivo()) return false;
    return homeGratis.classList.contains('ativo') || getComputedStyle(homeGratis).display !== 'none';
  }

  function injetarEstilo() {
    if (document.getElementById('fs-index-ads-restore-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-index-ads-restore-style';
    style.textContent = `
      body.fs-visitante-lite .bloco-anuncio.fs-adsense-zone.fs-index-ad-restored,
      body.fs-visitante-lite .fs-visitante-home-lite > .bloco-anuncio.fs-adsense-zone,
      body.fs-visitante-lite .fs-visitante-home-lite .bloco-anuncio.fs-adsense-zone,
      body:not(.fs-visitante-lite) #home-plano-gratis.ativo .bloco-anuncio.fs-adsense-zone,
      body:not(.fs-visitante-lite) #home-plano-gratis .bloco-anuncio.fs-adsense-zone.fs-index-ad-restored {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 970px;
        width: 100%;
        min-height: 110px;
        margin: 18px auto !important;
      }

      .bloco-anuncio.fs-adsense-zone.fs-index-ad-restored ins.adsbygoogle,
      #home-plano-gratis .bloco-anuncio.fs-adsense-zone ins.adsbygoogle {
        display: block !important;
        visibility: visible !important;
        min-height: 90px;
      }
    `;
    document.head.appendChild(style);
  }

  function criarZonaAnuncio(id) {
    const zona = document.createElement('div');
    zona.id = id;
    zona.className = 'bloco-anuncio fs-adsense-zone fs-anuncio-gratis';
    zona.setAttribute('aria-label', 'Publicidade');
    zona.innerHTML = `
      <span class="adsense-label">Publicidade</span>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${AD_CLIENT}"
           data-ad-slot="${AD_SLOT_PADRAO}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    return zona;
  }

  function obterOuCriarZona(id) {
    let zona = document.getElementById(id);
    if (zona) return zona;

    const homeGratis = document.getElementById('home-plano-gratis');
    const homeLite = document.getElementById('fs-visitante-home-lite');
    const destinoInicial = homeGratis || homeLite || document.querySelector('main');
    if (!destinoInicial) return null;

    zona = criarZonaAnuncio(id);
    destinoInicial.appendChild(zona);
    return zona;
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

  function moverParaDestino(zona, seletorDestino, posicao) {
    const destino = document.querySelector(seletorDestino);
    if (!destino) return false;

    prepararZona(zona);
    destino.insertAdjacentElement(posicao, zona);
    empurrarAdSenseQuandoNecessario(zona);
    return true;
  }

  function aplicar() {
    injetarEstilo();

    ADS_RESTAURADOS.forEach((item) => {
      const zona = obterOuCriarZona(item.id);
      if (!zona) return;

      guardarLugarOriginal(zona);

      if (visitanteLiteAtivo()) {
        moverParaDestino(zona, item.destinoVisitante, item.posicao);
        return;
      }

      if (homeGratisAtiva()) {
        moverParaDestino(zona, item.destinoGratis, item.posicao);
        return;
      }

      restaurarLugarOriginal(zona);
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
  setTimeout(aplicar, 3000);
})();
