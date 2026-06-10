/* FS Orçamentos - correção específica da agenda */
(function () {
  'use strict';

  const STYLE_ID = 'agenda-visual-fix-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --fs-marrom: #3e2723;
        --fs-amarelo: #ffc400;
        --fs-card: #ffffff;
        --fs-creme: #fffaf0;
        --fs-borda: #e8dccb;
        --fs-texto: #2f241f;
        --fs-texto-suave: #6d5b52;
      }

      body:not(.gerando-pdf) .pagina-agenda {
        color: var(--fs-texto) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-hero,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card-body,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia,
      body:not(.gerando-pdf) .pagina-agenda .agenda-item,
      body:not(.gerando-pdf) .pagina-agenda .agenda-filtros,
      body:not(.gerando-pdf) .pagina-agenda .estado-vazio,
      body:not(.gerando-pdf) .pagina-agenda .cliente-selecionado-agenda,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-box,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-body,
      body:not(.gerando-pdf) .pagina-agenda .cliente-modal-item {
        background: #ffffff !important;
        color: var(--fs-texto) !important;
        border-color: var(--fs-borda) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-hero {
        background: linear-gradient(135deg, #ffffff 0%, #fffaf0 100%) !important;
        border-top: 7px solid var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-hero h1,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card h1,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card h2,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card h3,
      body:not(.gerando-pdf) .pagina-agenda .agenda-item h3,
      body:not(.gerando-pdf) .pagina-agenda .estado-vazio strong,
      body:not(.gerando-pdf) .pagina-agenda .cliente-selecionado-agenda strong,
      body:not(.gerando-pdf) .pagina-agenda .cliente-modal-item strong {
        color: var(--fs-marrom) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-hero p,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card p,
      body:not(.gerando-pdf) .pagina-agenda .agenda-item p,
      body:not(.gerando-pdf) .pagina-agenda .estado-vazio,
      body:not(.gerando-pdf) .pagina-agenda .cliente-selecionado-agenda span,
      body:not(.gerando-pdf) .pagina-agenda .cliente-modal-item span,
      body:not(.gerando-pdf) .pagina-agenda small,
      body:not(.gerando-pdf) .pagina-agenda .campo small {
        color: var(--fs-texto-suave) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-metrica {
        background: #ffffff !important;
        color: var(--fs-texto) !important;
        border: 1px solid var(--fs-borda) !important;
        border-left: 6px solid var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-metrica span {
        color: var(--fs-texto-suave) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-metrica strong {
        color: var(--fs-marrom) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header {
        background: var(--fs-marrom) !important;
        color: #fffaf0 !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header h1,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header h2,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header h3,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header strong,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header b,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header h1,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header h2,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header h3 {
        color: var(--fs-amarelo) !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header p,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header span,
      body:not(.gerando-pdf) .pagina-agenda .agenda-card-header small,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header span,
      body:not(.gerando-pdf) .pagina-agenda .agenda-dia-header small,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header p,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header span,
      body:not(.gerando-pdf) .pagina-agenda .modal-cliente-header small {
        color: #fffaf0 !important;
        opacity: .98 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .agenda-tag,
      body:not(.gerando-pdf) .pagina-agenda .tag {
        background: var(--fs-marrom) !important;
        color: var(--fs-amarelo) !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .tag.confirmado {
        background:#dbeafe !important;
        color:#1e40af !important;
        border-color:#bfdbfe !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .tag.em_execucao,
      body:not(.gerando-pdf) .pagina-agenda .tag.concluido {
        background:#dcfce7 !important;
        color:#166534 !important;
        border-color:#bbf7d0 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .tag.cancelado {
        background:#fee2e2 !important;
        color:#991b1b !important;
        border-color:#fecaca !important;
      }

      body:not(.gerando-pdf) .pagina-agenda input,
      body:not(.gerando-pdf) .pagina-agenda select,
      body:not(.gerando-pdf) .pagina-agenda textarea {
        background: #ffffff !important;
        color: var(--fs-texto) !important;
        border-color: #d8c9b8 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda input::placeholder,
      body:not(.gerando-pdf) .pagina-agenda textarea::placeholder {
        color: #8a7a70 !important;
        opacity: 1 !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .btn-primario {
        background: var(--fs-marrom) !important;
        color: var(--fs-amarelo) !important;
        border-color: var(--fs-amarelo) !important;
      }

      body:not(.gerando-pdf) .pagina-agenda .btn-secundario {
        background: #ffffff !important;
        color: var(--fs-marrom) !important;
        border-color: #d8c9b8 !important;
      }

      @media (max-width: 680px) {
        body:not(.gerando-pdf) .pagina-agenda .agenda-resumo-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        body:not(.gerando-pdf) .pagina-agenda .agenda-filtros,
        body:not(.gerando-pdf) .pagina-agenda .busca-modal-linha,
        body:not(.gerando-pdf) .pagina-agenda .form-linha {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function apply() {
    addStyle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();

  window.addEventListener('load', apply);
  setTimeout(apply, 300);
  setTimeout(apply, 1000);
})();
