/* =========================================================
   FS ORÇAMENTOS - orcamentos-modal-buttons-fix.js
   Correção forte dos botões dos modais de orçamentos.
   Motivo: havia estilos globais de .btn-pequeno/.botoes-modal
   mantendo botões lado a lado. Este arquivo força linha cheia.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-orcamentos-modal-buttons-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-orcamentos-modal-buttons-fix-style';
    style.textContent = `
      body #conteudo-protegido .modal-overlay-orcamento .botoes-modal,
      body .modal-overlay-orcamento .botoes-modal,
      body #modal-visualizar-orcamento .botoes-modal,
      body #modal-editar-orcamento .botoes-modal {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        flex-wrap: nowrap !important;
        width: 100% !important;
        max-width: 100% !important;
        gap: 10px !important;
        margin-top: 18px !important;
        padding: 0 !important;
      }

      body #conteudo-protegido .modal-overlay-orcamento .botoes-modal > button,
      body .modal-overlay-orcamento .botoes-modal > button,
      body #modal-visualizar-orcamento .botoes-modal > button,
      body #modal-editar-orcamento .botoes-modal > button,
      body #modal-visualizar-orcamento .botoes-modal > .btn-pequeno,
      body #modal-editar-orcamento .botoes-modal > .btn-pequeno {
        display: flex !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: 0 0 auto !important;
        align-self: stretch !important;
        min-height: 52px !important;
        box-sizing: border-box !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        padding: 14px 16px !important;
        margin: 0 !important;
        border-radius: 16px !important;
        font-size: 15px !important;
        line-height: 1.15 !important;
        font-weight: 950 !important;
        white-space: normal !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-cancelar,
      body #modal-editar-orcamento .botoes-modal .btn-cancelar {
        order: 99 !important;
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border: 2px solid #d8c9b8 !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-ver-link {
        order: 1 !important;
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-whatsapp-orcamento {
        order: 2 !important;
        background: #25d366 !important;
        color: #063b1c !important;
        border: 2px solid #1fb957 !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-gerar-os {
        order: 3 !important;
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-editar,
      body #modal-editar-orcamento .botoes-modal .btn-salvar-modal {
        order: 4 !important;
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      body #modal-visualizar-orcamento .botoes-modal .btn-excluir {
        order: 90 !important;
        background: #dc2626 !important;
        color: #ffffff !important;
        border: 2px solid #b91c1c !important;
      }
    `;

    document.head.appendChild(style);
  }

  function aplicarInline() {
    document.querySelectorAll('.modal-overlay-orcamento .botoes-modal').forEach((box) => {
      box.style.setProperty('display', 'flex', 'important');
      box.style.setProperty('flex-direction', 'column', 'important');
      box.style.setProperty('align-items', 'stretch', 'important');
      box.style.setProperty('justify-content', 'flex-start', 'important');
      box.style.setProperty('flex-wrap', 'nowrap', 'important');
      box.style.setProperty('width', '100%', 'important');
      box.style.setProperty('gap', '10px', 'important');
      box.style.setProperty('margin-top', '18px', 'important');

      box.querySelectorAll('button, .btn-pequeno').forEach((btn) => {
        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('width', '100%', 'important');
        btn.style.setProperty('max-width', '100%', 'important');
        btn.style.setProperty('min-width', '0', 'important');
        btn.style.setProperty('flex', '0 0 auto', 'important');
        btn.style.setProperty('align-self', 'stretch', 'important');
        btn.style.setProperty('min-height', '52px', 'important');
        btn.style.setProperty('box-sizing', 'border-box', 'important');
        btn.style.setProperty('align-items', 'center', 'important');
        btn.style.setProperty('justify-content', 'center', 'important');
        btn.style.setProperty('text-align', 'center', 'important');
        btn.style.setProperty('margin', '0', 'important');
        btn.style.setProperty('border-radius', '16px', 'important');
      });
    });
  }

  function iniciar() {
    injetarEstilo();
    aplicarInline();
    setTimeout(aplicarInline, 300);
    setTimeout(aplicarInline, 900);
    setTimeout(aplicarInline, 1800);
  }

  document.addEventListener('click', () => setTimeout(aplicarInline, 60), true);

  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => aplicarInline());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
