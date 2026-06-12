/* =========================================================
   FS ORÇAMENTOS - gerador-cleanup-fix.js
   Correções finais da página gerador:
   - remove bloco redundante acima de "Dados da empresa";
   - remove opção amarela do seletor antigo;
   - garante opção rosa;
   - busca por Enter no modal de cliente;
   - inicializa blocos AdSense visíveis;
   - corrige layout quebrado no celular/tablet.
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

      html,
      body {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }

      #conteudo-gerador,
      .pagina-gerador,
      .gerador-layout,
      .gerador-card-principal,
      #formulario-orcamento,
      .emissor-readonly-card,
      .grid-duplo-gerador,
      #itens-lista,
      .calc-expansivel,
      .color-selector,
      #area-previa {
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      @media (max-width: 1180px) {
        .pagina-gerador {
          width: 100% !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          overflow-x: hidden !important;
        }

        .gerador-layout {
          display: block !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
          overflow: visible !important;
        }

        .gerador-card-principal {
          width: 100% !important;
          margin: 0 !important;
          padding: 14px !important;
          overflow: visible !important;
        }

        .gerador-sidebar {
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin-top: 18px !important;
          display: grid !important;
          grid-template-columns: 1fr !important;
          overflow: visible !important;
        }

        .emissor-readonly-topo,
        .emissor-readonly-grid,
        .grid-duplo-gerador,
        .acoes-gerador-principal,
        .acoes-profissionais-botoes {
          display: grid !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
        }

        .cliente-id-acoes {
          display: grid !important;
          grid-template-columns: 1fr !important;
          width: 100% !important;
        }

        .item-row {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          width: 100% !important;
        }

        .item-row .desc-cell,
        .item-row .desc {
          grid-column: 1 / -1 !important;
        }

        .emissor-logo-mini {
          width: 100% !important;
        }
      }

      @media (max-width: 760px) {
        .gerador-sidebar {
          display: none !important;
        }

        .gerador-hero {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        #conteudo-pdf {
          width: 794px !important;
          max-width: 794px !important;
          transform-origin: top left !important;
        }

        #area-previa {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
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
