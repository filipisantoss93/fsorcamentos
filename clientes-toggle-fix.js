/* =========================================================
   FS ORÇAMENTOS - clientes-toggle-fix.js
   Corrige botão duplicado Abrir/Fechar no card Novo cliente.
   Mantém apenas o botão original do clientes.html.
   ========================================================= */
(function () {
  'use strict';

  function corrigirToggleNovoCliente() {
    const card = document.getElementById('card-form-cliente');
    const header = card?.querySelector('.clientes-card-header');
    const body = document.getElementById('corpo-form-cliente') || card?.querySelector('.clientes-card-body');

    if (!card || !header || !body) return;

    const h2 = header.querySelector('#titulo-form-cliente') || header.querySelector('h2');
    const p = header.querySelector('p');
    let botaoOriginal = document.getElementById('btn-toggle-form-cliente');

    if (!botaoOriginal) {
      botaoOriginal = document.createElement('button');
      botaoOriginal.type = 'button';
      botaoOriginal.id = 'btn-toggle-form-cliente';
      botaoOriginal.className = 'btn-toggle-form-mobile';
    }

    // Remove botões criados por patches antigos para evitar duplicidade.
    header.querySelectorAll('.fs-btn-toggle-card').forEach((btn) => btn.remove());

    const titulo = h2?.textContent?.trim() || 'Novo cliente';
    const descricao = p?.textContent?.trim() || 'Preencha os dados principais do cliente para usar depois em orçamentos, ordens de serviço e histórico.';

    header.innerHTML = `
      <div class="clientes-header-texto">
        <h2 id="titulo-form-cliente">${titulo}</h2>
        <p>${descricao}</p>
      </div>
    `;

    botaoOriginal.textContent = card.classList.contains('fs-form-card-collapsed') ? 'Abrir' : 'Fechar';
    botaoOriginal.setAttribute('aria-expanded', card.classList.contains('fs-form-card-collapsed') ? 'false' : 'true');
    header.appendChild(botaoOriginal);

    header.classList.add('fs-card-header-toggle');
    body.classList.add('fs-collapsible-body');
    card.dataset.fsMinimizavel = '1';

    if (window.innerWidth <= 700 && !card.dataset.fsClienteToggleIniciado) {
      card.classList.add('fs-form-card-collapsed');
      card.dataset.fsClienteToggleIniciado = '1';
    }

    function atualizar() {
      const fechado = card.classList.contains('fs-form-card-collapsed');
      botaoOriginal.textContent = fechado ? 'Abrir' : 'Fechar';
      botaoOriginal.setAttribute('aria-expanded', fechado ? 'false' : 'true');
    }

    botaoOriginal.onclick = function () {
      card.classList.toggle('fs-form-card-collapsed');
      atualizar();
    };

    atualizar();
  }

  function injetarEstilo() {
    if (document.getElementById('fs-clientes-toggle-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-clientes-toggle-fix-style';
    style.textContent = `
      #card-form-cliente .clientes-card-header {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 12px !important;
      }

      #card-form-cliente .clientes-header-texto {
        min-width: 0 !important;
        flex: 1 1 auto !important;
      }

      #card-form-cliente #btn-toggle-form-cliente {
        flex: 0 0 auto !important;
        align-self: flex-start !important;
        margin: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 92px !important;
        min-height: 44px !important;
        border-radius: 999px !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
        background: var(--fs-amarelo, #ffc400) !important;
        color: var(--fs-marrom, #3e2723) !important;
        font-weight: 950 !important;
        text-transform: uppercase !important;
      }

      #card-form-cliente .fs-btn-toggle-card {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
    corrigirToggleNovoCliente();
    setTimeout(corrigirToggleNovoCliente, 250);
    setTimeout(corrigirToggleNovoCliente, 900);
    setTimeout(corrigirToggleNovoCliente, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
