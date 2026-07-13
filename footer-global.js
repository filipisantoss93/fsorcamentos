(() => {
  'use strict';

  const FOOTER_ID = 'fs-footer-global';
  const STYLE_ID = 'fs-footer-global-style';
  const COMPONENT_URL = '/footer.html?v=20260713-1';
  const PAGINAS_SEM_FOOTER_GLOBAL = new Set(['/ver.html', '/ver']);
  let instalando = false;
  let observer = null;

  function caminhoAtual() {
    return String(window.location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  }

  function modoEmbed() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('embed') === '1' || params.get('iframe') === '1';
    } catch (_) {
      return false;
    }
  }

  function paginaEspecial() {
    return PAGINAS_SEM_FOOTER_GLOBAL.has(caminhoAtual());
  }

  function deveIgnorar() {
    return !document.body || modoEmbed() || paginaEspecial();
  }

  function instalarEstilos() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html, body { min-height: 100%; }
      body { display: flex; flex-direction: column; }
      .fs-footer-global {
        width: 100%;
        margin-top: auto;
        border-top: 1px solid rgba(148, 163, 184, .22);
        background: #07111f;
        color: #aebbd0;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
      }
      .fs-footer-global, .fs-footer-global * { box-sizing: border-box; }
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
      .fs-footer-global__links a[aria-current="page"] { color: #f6b500; }
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
        .fs-footer-global__links { justify-content: flex-start; }
      }
      @media print { .fs-footer-global { display: none !important; } }
    `;
    document.head.appendChild(style);
  }

  function fallbackHtml() {
    return `
      <footer id="${FOOTER_ID}" class="fs-footer-global" aria-label="Rodapé do site">
        <div class="fs-footer-global__inner">
          <div class="fs-footer-global__brand">
            <span class="fs-footer-global__mark" aria-hidden="true">FS</span>
            <span><strong>FS Orçamentos</strong><small>© 2026 · Diagnóstico inteligente. Orçamentos profissionais.</small></span>
          </div>
          <nav class="fs-footer-global__links" aria-label="Links institucionais">
            <a href="/sobre.html">Sobre</a><a href="/contato.html">Contato</a><a href="/privacidade.html">Privacidade</a><a href="/termos.html">Termos</a>
          </nav>
        </div>
      </footer>`;
  }

  async function obterComponente() {
    try {
      const resposta = await fetch(COMPONENT_URL, { cache: 'no-cache' });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const html = await resposta.text();
      if (!html.includes(`id="${FOOTER_ID}"`)) throw new Error('Componente inválido');
      return html;
    } catch (erro) {
      console.warn('Footer global: usando fallback local.', erro);
      return fallbackHtml();
    }
  }

  function removerLegados() {
    const seletores = [
      'footer:not(#fs-footer-global)',
      '.footer:not(#fs-footer-global)',
      '.site-footer:not(#fs-footer-global)',
      '.forum-footer:not(#fs-footer-global)',
      '.home-footer:not(#fs-footer-global)',
      '.fs-inst-footer:not(#fs-footer-global)',
      '.sobre-footer:not(#fs-footer-global)',
      '.fs-footer-legal:not(#fs-footer-global)'
    ];
    document.querySelectorAll(seletores.join(',')).forEach(elemento => elemento.remove());
  }

  function marcarPaginaAtual(footer) {
    const atual = caminhoAtual();
    footer.querySelectorAll('a[href]').forEach(link => {
      try {
        const destino = new URL(link.getAttribute('href'), window.location.origin).pathname.toLowerCase().replace(/\/$/, '') || '/';
        if (destino === atual) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      } catch (_) {}
    });
  }

  function observarDuplicidades() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
      if (deveIgnorar() || instalando) return;
      removerLegados();
      const footers = document.querySelectorAll(`#${FOOTER_ID}`);
      footers.forEach((footer, indice) => { if (indice > 0) footer.remove(); });
      const oficial = document.getElementById(FOOTER_ID);
      if (oficial && oficial !== document.body.lastElementChild) document.body.appendChild(oficial);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function instalarFooter() {
    if (deveIgnorar() || instalando) return;
    instalando = true;
    instalarEstilos();
    removerLegados();

    let footer = document.getElementById(FOOTER_ID);
    if (!footer) {
      const template = document.createElement('template');
      template.innerHTML = (await obterComponente()).trim();
      footer = template.content.querySelector(`#${FOOTER_ID}`);
      if (!footer) {
        template.innerHTML = fallbackHtml().trim();
        footer = template.content.querySelector(`#${FOOTER_ID}`);
      }
    }

    if (footer) {
      marcarPaginaAtual(footer);
      document.body.appendChild(footer);
    }

    instalando = false;
    observarDuplicidades();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarFooter, { once: true });
  } else {
    instalarFooter();
  }

  window.fsInstalarFooterGlobal = instalarFooter;
})();
