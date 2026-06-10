/* =========================================================
   FS ORÇAMENTOS - fs-header-offset-fix.js
   Corrige sobreposição do header fixo no topo das páginas.

   - Mede a altura real do #header-container.
   - Aplica padding-top global no body.
   - Respeita o modo de geração de PDF.
   - Recalcula em resize, mudança de menu e carregamento tardio.
   ========================================================= */
(function () {
  'use strict';

  const STYLE_ID = 'fs-header-offset-fix-style';
  const DEFAULT_OFFSET = 124;
  const EXTRA_GAP = 18;

  function paginaGerandoPdf() {
    return document.body && document.body.classList.contains('gerando-pdf');
  }

  function obterAlturaHeader() {
    const header = document.getElementById('header-container');

    if (!header) return DEFAULT_OFFSET;

    const rect = header.getBoundingClientRect();
    const altura = Math.ceil(rect.height || header.offsetHeight || DEFAULT_OFFSET);

    if (!Number.isFinite(altura) || altura < 50) return DEFAULT_OFFSET;

    return altura;
  }

  function injetarEstilo() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --fs-header-offset-real: ${DEFAULT_OFFSET}px;
        --fs-header-extra-gap: ${EXTRA_GAP}px;
      }

      body:not(.gerando-pdf) {
        padding-top: calc(var(--fs-header-offset-real, ${DEFAULT_OFFSET}px) + var(--fs-header-extra-gap, ${EXTRA_GAP}px)) !important;
      }

      html {
        scroll-padding-top: calc(var(--fs-header-offset-real, ${DEFAULT_OFFSET}px) + 24px) !important;
      }

      body.gerando-pdf {
        padding-top: 0 !important;
      }

      body:not(.gerando-pdf) .pagina-ordem,
      body:not(.gerando-pdf) .pagina-ordens,
      body:not(.gerando-pdf) .pagina-clientes,
      body:not(.gerando-pdf) .pagina-veiculos,
      body:not(.gerando-pdf) .pagina-estoque,
      body:not(.gerando-pdf) .pagina-agenda,
      body:not(.gerando-pdf) .home-publica,
      body:not(.gerando-pdf) .gerador-page,
      body:not(.gerando-pdf) .painel-container,
      body:not(.gerando-pdf) .orcamentos-container,
      body:not(.gerando-pdf) main.container,
      body:not(.gerando-pdf) .container:first-of-type {
        margin-top: 0 !important;
      }

      @media (max-width: 900px) {
        :root {
          --fs-header-extra-gap: 14px;
        }
      }

      @media (max-width: 520px) {
        :root {
          --fs-header-extra-gap: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function aplicarOffset() {
    if (!document.documentElement || !document.body) return;

    if (paginaGerandoPdf()) {
      document.documentElement.style.setProperty('--fs-header-offset-real', '0px');
      return;
    }

    const altura = obterAlturaHeader();
    document.documentElement.style.setProperty('--fs-header-offset-real', `${altura}px`);
  }

  function observarHeader() {
    const header = document.getElementById('header-container');
    if (!header || header.__fsHeaderOffsetObserver) return;

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => aplicarOffset());
      observer.observe(header);
      header.__fsHeaderOffsetObserver = observer;
    }

    const mutationObserver = new MutationObserver(() => aplicarOffset());
    mutationObserver.observe(header, {
      attributes: true,
      childList: true,
      subtree: true
    });
    header.__fsHeaderOffsetMutationObserver = mutationObserver;
  }

  function aplicar() {
    injetarEstilo();
    aplicarOffset();
    observarHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }

  window.addEventListener('load', aplicar);
  window.addEventListener('resize', aplicar);
  window.addEventListener('orientationchange', aplicar);

  setTimeout(aplicar, 100);
  setTimeout(aplicar, 400);
  setTimeout(aplicar, 1000);
  setTimeout(aplicar, 2000);
})();
