/* =========================================================
   FS ORÇAMENTOS - fs-footer-legal.js
   Garante links legais somente no footer, fora do header.
   ========================================================= */
(function () {
  'use strict';

  function criarFooterSeNaoExistir() {
    let footer = document.querySelector('footer.fs-footer-legal, footer');

    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'fs-footer-legal';
      document.body.appendChild(footer);
      return footer;
    }

    footer.classList.add('fs-footer-legal');
    return footer;
  }

  function removerLinksLegaisDoHeader() {
    document.querySelectorAll('#header-container a, .main-header a').forEach((link) => {
      const href = String(link.getAttribute('href') || '').toLowerCase();
      if (href.includes('privacidade.html') || href.includes('termos.html')) {
        const li = link.closest('li');
        if (li) li.remove();
        else link.remove();
      }
    });
  }

  function garantirLinksNoFooter() {
    const footer = criarFooterSeNaoExistir();
    if (!footer) return;

    let legal = footer.querySelector('.fs-footer-legal-links');
    if (!legal) {
      legal = document.createElement('div');
      legal.className = 'fs-footer-legal-links';
      footer.appendChild(legal);
    }

    legal.innerHTML = `
      <a href="/privacidade.html">Privacidade</a>
      <span aria-hidden="true">•</span>
      <a href="/termos.html">Termos</a>
    `;
  }

  function injetarEstilo() {
    if (document.getElementById('fs-footer-legal-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-footer-legal-style';
    style.textContent = `
      .fs-footer-legal {
        width: 100%;
        box-sizing: border-box;
        padding: 26px 16px max(26px, env(safe-area-inset-bottom, 0px));
        text-align: center;
        color: var(--fs-texto-suave, #6d5b52);
      }

      .fs-footer-legal-links {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 14px;
        font-weight: 800;
      }

      .fs-footer-legal-links a {
        color: var(--fs-marrom, #3e2723) !important;
        text-decoration: none;
        font-weight: 900;
      }

      .fs-footer-legal-links a:hover {
        color: var(--fs-amarelo, #ffc400) !important;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
    removerLinksLegaisDoHeader();
    garantirLinksNoFooter();

    setTimeout(() => {
      removerLinksLegaisDoHeader();
      garantirLinksNoFooter();
    }, 300);

    setTimeout(() => {
      removerLinksLegaisDoHeader();
      garantirLinksNoFooter();
    }, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
