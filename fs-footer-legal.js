/* =========================================================
   FS ORÇAMENTOS - fs-footer-legal.js
   Footer único + espaçamento automático abaixo do header fixo.
   ========================================================= */
(function () {
  'use strict';

  function headerVisivel() {
    return document.querySelector('#header-container header, .main-header, header.site-header, header');
  }

  function ajustarEspacoHeader() {
    const header = headerVisivel();
    if (!header) return;

    const rect = header.getBoundingClientRect();
    const altura = Math.ceil(rect.height || header.offsetHeight || 0);
    if (!altura) return;

    const cs = getComputedStyle(header);
    const fixo = cs.position === 'fixed';
    const sticky = cs.position === 'sticky';

    document.documentElement.style.setProperty('--fs-header-altura-real', `${altura}px`);
    document.body.classList.toggle('fs-header-fixed-space', fixo);
    document.body.classList.toggle('fs-header-sticky-space', sticky);

    const primeiroConteudo = document.querySelector('main, .container, .cx, #home-publica, .pagina-ver, .page, .conteudo, .dashboard-wrap');
    if (primeiroConteudo) primeiroConteudo.classList.add('fs-conteudo-apos-header');
  }

  function removerLinksLegaisDoHeader() {
    document.querySelectorAll('#header-container a, .main-header a, header a').forEach((link) => {
      const href = String(link.getAttribute('href') || '').toLowerCase();
      if (href.includes('privacidade.html') || href.includes('termos.html')) {
        const li = link.closest('li');
        if (li) li.remove();
        else link.remove();
      }
    });
  }

  function removerFootersDuplicados() {
    const todos = Array.from(document.querySelectorAll('footer, .sobre-footer'));
    if (todos.length <= 1) return todos[0] || null;

    let principal = todos.find(f => f.classList.contains('fs-footer-legal')) || todos[0];
    todos.forEach((f) => {
      if (f !== principal) f.remove();
    });
    return principal;
  }

  function obterFooterPrincipal() {
    let footer = removerFootersDuplicados();
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    footer.className = 'fs-footer-legal';
    return footer;
  }

  function renderFooterOficial(footer) {
    footer.innerHTML = `
      <div class="fs-footer-inner">
        <div class="fs-footer-copy">© 2026 FS Orçamentos</div>
        <nav class="fs-footer-legal-links" aria-label="Links legais">
          <a href="/privacidade.html">Privacidade</a>
          <a href="/termos.html">Termos</a>
          <a href="/contato.html">Contato</a>
        </nav>
      </div>
    `;
  }

  function garantirFooter() {
    const footer = obterFooterPrincipal();
    renderFooterOficial(footer);
  }

  function injetarEstilo() {
    const antigo = document.getElementById('fs-footer-legal-style');
    if (antigo) antigo.remove();

    const style = document.createElement('style');
    style.id = 'fs-footer-legal-style';
    style.textContent = `
      html { scroll-padding-top: calc(var(--fs-header-altura-real, 96px) + 12px) !important; }

      body.fs-header-fixed-space .fs-conteudo-apos-header,
      body.fs-header-fixed-space > main:first-of-type,
      body.fs-header-fixed-space #header-container + main,
      body.fs-header-fixed-space #header-container + .cx,
      body.fs-header-fixed-space #header-container + .container,
      body.fs-header-fixed-space #header-container + #home-publica {
        margin-top: calc(var(--fs-header-altura-real, 96px) + 10px) !important;
      }

      body.fs-header-sticky-space .fs-conteudo-apos-header,
      body:not(.fs-header-fixed-space) .fs-conteudo-apos-header {
        margin-top: max(10px, env(safe-area-inset-top, 0px)) !important;
      }

      .fs-footer-legal {
        width: min(1180px, calc(100% - 24px)) !important;
        margin: 24px auto max(24px, env(safe-area-inset-bottom, 0px)) !important;
        box-sizing: border-box !important;
        padding: 16px 14px !important;
        text-align: center !important;
        color: #fffaf0 !important;
        background: #2f211d !important;
        border: 1px solid #3e2723 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 24px rgba(47,33,29,.14) !important;
        overflow: hidden !important;
      }

      .fs-footer-legal * {
        box-sizing: border-box !important;
      }

      .fs-footer-inner {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        gap: 10px 18px !important;
      }

      .fs-footer-copy {
        color: #fffaf0 !important;
        opacity: .96 !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        line-height: 1.3 !important;
      }

      .fs-footer-legal-links {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        gap: 12px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        line-height: 1.3 !important;
      }

      .fs-footer-legal-links a {
        display: inline-flex !important;
        color: #ffc400 !important;
        text-decoration: none !important;
        font-weight: 950 !important;
        opacity: 1 !important;
      }

      .fs-footer-legal-links a + a::before {
        content: '•' !important;
        color: rgba(255,250,240,.55) !important;
        margin-right: 12px !important;
        font-weight: 900 !important;
      }

      .fs-footer-legal-links a:hover {
        color: #fff2a8 !important;
        text-decoration: underline !important;
      }

      @media (max-width: 640px) {
        .fs-footer-legal {
          width: min(100% - 20px, 1180px) !important;
          margin-top: 18px !important;
          padding: 15px 10px max(16px, env(safe-area-inset-bottom, 0px)) !important;
        }
        .fs-footer-inner,
        .fs-footer-legal-links {
          flex-direction: column !important;
          gap: 6px !important;
        }
        .fs-footer-legal-links a + a::before {
          content: '' !important;
          margin-right: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
    removerLinksLegaisDoHeader();
    garantirFooter();
    ajustarEspacoHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  let tentativas = 0;
  const timer = setInterval(() => {
    removerLinksLegaisDoHeader();
    garantirFooter();
    ajustarEspacoHeader();
    if (++tentativas > 30) clearInterval(timer);
  }, 400);

  window.addEventListener('resize', ajustarEspacoHeader);
  window.addEventListener('orientationchange', () => setTimeout(ajustarEspacoHeader, 300));
})();