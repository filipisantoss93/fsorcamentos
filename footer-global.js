(() => {
  'use strict';

  const FOOTER_ID = 'fs-footer-global';
  const STYLE_ID = 'fs-footer-global-style';

  function modoEmbed() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('embed') === '1' || params.get('iframe') === '1';
    } catch (_) {
      return false;
    }
  }

  function instalarEstilos() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fs-footer-global {
        width: 100%;
        margin-top: auto;
        border-top: 1px solid rgba(148, 163, 184, .22);
        background: #07111f;
        color: #aebbd0;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
      }
      .fs-footer-global__inner {
        width: min(1160px, calc(100% - 32px));
        min-height: 82px;
        margin: 0 auto;
        padding: 20px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }
      .fs-footer-global__brand {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 0;
      }
      .fs-footer-global__mark {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        border: 1px solid rgba(246, 181, 0, .45);
        border-radius: 10px;
        background: #0d1d32;
        color: #f6b500;
        font-size: 14px;
        font-weight: 950;
        letter-spacing: -.02em;
      }
      .fs-footer-global__brand strong {
        display: block;
        color: #fff;
        font-size: 14px;
        line-height: 1.25;
      }
      .fs-footer-global__brand small {
        display: block;
        margin-top: 3px;
        color: #8392aa;
        font-size: 11px;
        line-height: 1.35;
      }
      .fs-footer-global__links {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 6px 16px;
      }
      .fs-footer-global__links a {
        color: #c9d4e5;
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
      }
      .fs-footer-global__links a:hover,
      .fs-footer-global__links a:focus-visible {
        color: #f6b500;
        text-decoration: underline;
        text-underline-offset: 4px;
      }
      @media (max-width: 700px) {
        .fs-footer-global__inner {
          width: min(100% - 24px, 1160px);
          min-height: 0;
          padding: 20px 0 24px;
          align-items: flex-start;
          flex-direction: column;
        }
        .fs-footer-global__links {
          justify-content: flex-start;
        }
      }
      @media print {
        .fs-footer-global { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function criarFooter() {
    const footer = document.createElement('footer');
    footer.id = FOOTER_ID;
    footer.className = 'fs-footer-global';
    footer.setAttribute('aria-label', 'Rodapé do site');
    footer.innerHTML = `
      <div class="fs-footer-global__inner">
        <div class="fs-footer-global__brand">
          <span class="fs-footer-global__mark" aria-hidden="true">FS</span>
          <span>
            <strong>FS Orçamentos</strong>
            <small>© 2026 · Diagnóstico inteligente. Orçamentos profissionais.</small>
          </span>
        </div>
        <nav class="fs-footer-global__links" aria-label="Links institucionais">
          <a href="/sobre.html">Sobre</a>
          <a href="/contato.html">Contato</a>
          <a href="/privacidade.html">Privacidade</a>
          <a href="/termos.html">Termos</a>
        </nav>
      </div>
    `;
    return footer;
  }

  function instalarFooter() {
    if (!document.body || modoEmbed()) return;

    instalarEstilos();

    document.querySelectorAll('footer, .footer, .site-footer, .forum-footer, .home-footer, .rodape').forEach(elemento => {
      if (elemento.id !== FOOTER_ID) elemento.remove();
    });

    let footer = document.getElementById(FOOTER_ID);
    if (!footer) footer = criarFooter();
    document.body.appendChild(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarFooter, { once: true });
  } else {
    instalarFooter();
  }

  window.fsInstalarFooterGlobal = instalarFooter;
})();
