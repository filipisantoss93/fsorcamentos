/* =========================================================
   FS ORÇAMENTOS - gerador-acoes-fix.js
   Corrige contraste do bloco "Orçamento pronto" abaixo da prévia.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-gerador-acoes-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-gerador-acoes-fix-style';
    style.textContent = `
      #botoes-acao,
      .acoes-profissionais-orcamento {
        background: linear-gradient(135deg, #fffaf0 0%, #ffffff 100%) !important;
        border: 1px solid var(--fs-borda, #e8dccb) !important;
        border-top: 4px solid var(--fs-amarelo, #ffc400) !important;
        color: var(--fs-marrom, #3e2723) !important;
        box-shadow: 0 10px 28px rgba(62, 39, 35, 0.16) !important;
      }

      #botoes-acao .acoes-profissionais-orcamento-topo,
      .acoes-profissionais-orcamento .acoes-profissionais-orcamento-topo {
        color: var(--fs-marrom, #3e2723) !important;
      }

      #botoes-acao .acoes-profissionais-orcamento-topo strong,
      .acoes-profissionais-orcamento .acoes-profissionais-orcamento-topo strong {
        color: var(--fs-marrom, #3e2723) !important;
        text-shadow: none !important;
      }

      #botoes-acao .acoes-profissionais-orcamento-topo span,
      #botoes-acao .acoes-profissionais-orcamento-topo p,
      .acoes-profissionais-orcamento .acoes-profissionais-orcamento-topo span,
      .acoes-profissionais-orcamento .acoes-profissionais-orcamento-topo p {
        color: #5d4037 !important;
        opacity: 1 !important;
        visibility: visible !important;
        background: transparent !important;
        text-shadow: none !important;
        font-weight: 800 !important;
      }

      #botoes-acao .acoes-profissionais-botoes,
      .acoes-profissionais-orcamento .acoes-profissionais-botoes {
        background: transparent !important;
      }

      #botoes-acao .btn-acao-pdf,
      .acoes-profissionais-orcamento .btn-acao-pdf {
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      #botoes-acao .btn-acao-whatsapp,
      .acoes-profissionais-orcamento .btn-acao-whatsapp {
        background: #25d366 !important;
        color: #063b1c !important;
        border: 2px solid #1fb957 !important;
      }

      @media (max-width: 760px) {
        #botoes-acao,
        .acoes-profissionais-orcamento {
          padding: 16px !important;
          border-radius: 18px !important;
        }

        #botoes-acao .acoes-profissionais-botoes,
        .acoes-profissionais-orcamento .acoes-profissionais-botoes {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function corrigirTextoInline() {
    document.querySelectorAll('.acoes-profissionais-orcamento-topo span, .acoes-profissionais-orcamento-topo p').forEach((el) => {
      el.style.color = '#5d4037';
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });

    document.querySelectorAll('.acoes-profissionais-orcamento-topo strong').forEach((el) => {
      el.style.color = 'var(--fs-marrom, #3e2723)';
    });
  }

  function iniciar() {
    injetarEstilo();
    corrigirTextoInline();
    setTimeout(corrigirTextoInline, 300);
    setTimeout(corrigirTextoInline, 900);
    setTimeout(corrigirTextoInline, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
