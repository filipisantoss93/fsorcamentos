/* =========================================================
   FS ORÇAMENTOS - gerador-cleanup-fix.js
   Correções finais da página gerador:
   - remove bloco redundante acima de "Dados da empresa";
   - remove opção amarela do seletor antigo;
   - garante opção rosa;
   - busca por Enter no modal de cliente;
   - inicializa blocos AdSense visíveis.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-gerador-cleanup-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-gerador-cleanup-fix-style';
    style.textContent = `
      #formulario-orcamento > .intro-form-gerador,
      .theme-dot.yellow {
        display: none !important;
      }

      .theme-dot.pink,
      .theme-dot.rosa {
        background: #db2777 !important;
        border-color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removerBlocoIntro() {
    document.querySelectorAll('#formulario-orcamento > .intro-form-gerador').forEach(el => el.remove());
  }

  function corrigirCoresPdf() {
    document.querySelectorAll('.theme-dot.yellow').forEach(el => el.remove());

    const container = document.querySelector('.theme-options');
    if (container && !container.querySelector('.theme-dot.pink, .theme-dot.rosa')) {
      const rosa = document.createElement('div');
      rosa.className = 'theme-dot pink';
      rosa.title = 'Rosa';
      rosa.setAttribute('role', 'button');
      rosa.setAttribute('aria-label', 'Tema rosa');
      rosa.addEventListener('click', () => {
        if (typeof window.setTheme === 'function') window.setTheme('pink');
        const hidden = document.getElementById('selected-theme');
        if (hidden) hidden.value = 'pink';
        try { localStorage.setItem('fs_tema_pdf', 'pink'); } catch (_) {}
        if (typeof window.autoUpdatePreview === 'function') window.autoUpdatePreview();
      });
      container.appendChild(rosa);
    }

    const hidden = document.getElementById('selected-theme');
    if (hidden && String(hidden.value || '').toLowerCase() === 'yellow') {
      hidden.value = 'original';
    }
  }

  function instalarEnterBuscaCliente() {
    const campo = document.getElementById('campo-busca-cliente-orcamento');
    if (!campo || campo.dataset.fsEnterBusca === '1') return;
    campo.dataset.fsEnterBusca = '1';
    campo.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (typeof window.buscarClientesNoModalOrcamento === 'function') {
        window.buscarClientesNoModalOrcamento();
      }
    });
  }

  function inicializarAdsense() {
    if (!window.adsbygoogle) return;

    document.querySelectorAll('ins.adsbygoogle').forEach((ad) => {
      if (ad.dataset.fsAdsPushed === '1') return;
      const style = window.getComputedStyle(ad);
      const parentStyle = window.getComputedStyle(ad.parentElement || ad);
      if (style.display === 'none' || parentStyle.display === 'none') return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        ad.dataset.fsAdsPushed = '1';
      } catch (error) {
        console.warn('AdSense não inicializado neste bloco:', error);
      }
    });
  }

  function iniciar() {
    injetarEstilo();
    removerBlocoIntro();
    corrigirCoresPdf();
    instalarEnterBuscaCliente();
    inicializarAdsense();

    setTimeout(() => {
      removerBlocoIntro();
      corrigirCoresPdf();
      instalarEnterBuscaCliente();
      inicializarAdsense();
    }, 500);

    setTimeout(() => {
      removerBlocoIntro();
      corrigirCoresPdf();
      instalarEnterBuscaCliente();
      inicializarAdsense();
    }, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
