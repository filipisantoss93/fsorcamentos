/* =========================================================
   FS ORÇAMENTOS - fs-footer-legal.js
   Garante links legais no rodapé sem duplicar links existentes.
   ========================================================= */
(function () {
  'use strict';

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

  function hrefLegal(link) {
    const href = String(link.getAttribute('href') || '').toLowerCase();
    return href.includes('privacidade.html') || href.includes('termos.html');
  }

  function deduplicarLinksLegais() {
    const links = Array.from(document.querySelectorAll('footer a, .sobre-footer a')).filter(hrefLegal);
    const vistos = new Set();

    links.forEach((link) => {
      const chave = String(link.getAttribute('href') || '').toLowerCase().replace(/^\//, '');
      if (vistos.has(chave)) {
        const separadorAnterior = link.previousElementSibling;
        if (separadorAnterior && separadorAnterior.textContent?.trim() === '•') separadorAnterior.remove();
        const separadorProximo = link.nextElementSibling;
        if (separadorProximo && separadorProximo.textContent?.trim() === '•') separadorProximo.remove();
        link.remove();
      } else {
        vistos.add(chave);
      }
    });
  }

  function obterFooterPrincipal() {
    let footer = document.querySelector('footer.fs-footer-legal, footer, .sobre-footer');
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    footer.classList.add('fs-footer-legal');
    return footer;
  }

  function garantirLinksNoFooter() {
    deduplicarLinksLegais();

    const existePrivacidade = !!Array.from(document.querySelectorAll('footer a, .sobre-footer a')).find(a => String(a.getAttribute('href') || '').toLowerCase().includes('privacidade.html'));
    const existeTermos = !!Array.from(document.querySelectorAll('footer a, .sobre-footer a')).find(a => String(a.getAttribute('href') || '').toLowerCase().includes('termos.html'));
    if (existePrivacidade && existeTermos) return;

    const footer = obterFooterPrincipal();
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
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 18px 16px max(22px, env(safe-area-inset-bottom, 0px)) !important;
        text-align: center !important;
        color: var(--fs-texto-suave, #6d5b52) !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      .fs-footer-legal-links {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        opacity: .82 !important;
      }

      .fs-footer-legal-links a,
      .fs-footer-legal a[href*="privacidade.html"],
      .fs-footer-legal a[href*="termos.html"] {
        color: var(--fs-texto-suave, #6d5b52) !important;
        text-decoration: none !important;
        font-weight: 900 !important;
      }

      .fs-footer-legal-links a:hover,
      .fs-footer-legal a[href*="privacidade.html"]:hover,
      .fs-footer-legal a[href*="termos.html"]:hover {
        color: var(--fs-marrom, #3e2723) !important;
        text-decoration: underline !important;
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
    removerLinksLegaisDoHeader();
    garantirLinksNoFooter();
    setTimeout(() => { removerLinksLegaisDoHeader(); garantirLinksNoFooter(); }, 300);
    setTimeout(() => { removerLinksLegaisDoHeader(); garantirLinksNoFooter(); }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
