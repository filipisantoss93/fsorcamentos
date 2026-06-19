/* =========================================================
   FS ORÇAMENTOS - orcamentos-resumo-grid-fix.js
   Renderiza orçamentos como tabela compacta e clicável.
   ========================================================= */
(function () {
  'use strict';

  function injetarEstilo() {
    if (document.getElementById('fs-orcamentos-resumo-grid-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-orcamentos-resumo-grid-fix-style';
    style.textContent = `
      body .resumo-financeiro .cards-resumo,
      body .cards-resumo {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        align-items: stretch !important;
      }

      body .resumo-financeiro .card-resumo,
      body .cards-resumo .card-resumo {
        min-width: 0 !important;
        min-height: 74px !important;
        box-sizing: border-box !important;
        border-radius: 6px !important;
        padding: 9px 10px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        box-shadow: none !important;
      }

      body .resumo-financeiro .card-resumo strong,
      body .cards-resumo .card-resumo strong {
        font-size: 11px !important;
        line-height: 1.2 !important;
        word-break: break-word !important;
      }

      body .resumo-financeiro .card-resumo .valor-resumo,
      body .cards-resumo .card-resumo .valor-resumo {
        font-size: 18px !important;
        line-height: 1.1 !important;
        word-break: break-word !important;
      }

      #lista-orcamentos .tabela-wrapper {
        width: 100% !important;
        overflow-x: auto !important;
        border-radius: 6px !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
        background: #ffffff !important;
      }

      #lista-orcamentos .tabela-orcamentos {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        background: #ffffff !important;
      }

      #lista-orcamentos .tabela-orcamentos th,
      #lista-orcamentos .tabela-orcamentos td {
        padding: 8px 9px !important;
        line-height: 1.2 !important;
        vertical-align: middle !important;
        white-space: normal !important;
        word-break: break-word !important;
        border-bottom: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      #lista-orcamentos .tabela-orcamentos th {
        background: #f8f4ee !important;
        color: var(--fs-marrom, #2f211d) !important;
        font-size: 11px !important;
        text-transform: uppercase !important;
        letter-spacing: .2px !important;
        font-weight: 950 !important;
      }

      #lista-orcamentos .tabela-orcamentos td {
        color: var(--fs-texto, #2b211d) !important;
        font-size: 12px !important;
      }

      #lista-orcamentos .tabela-orcamentos tr.linha-orcamento {
        min-height: 0 !important;
        cursor: pointer !important;
      }

      #lista-orcamentos .tabela-orcamentos tr.linha-orcamento:nth-child(even) {
        background: #fbf8f4 !important;
      }

      #lista-orcamentos .tabela-orcamentos tr.linha-orcamento:hover {
        background: #f8f4ee !important;
        filter: none !important;
      }

      #lista-orcamentos .status {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        max-width: 100% !important;
        min-height: 22px !important;
        padding: 3px 6px !important;
        border-radius: 3px !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        line-height: 1.1 !important;
        white-space: normal !important;
        border: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      #modal-visualizar-orcamento .botoes-modal,
      #modal-editar-orcamento .botoes-modal {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        width: 100% !important;
        margin-top: 12px !important;
        padding-top: 10px !important;
        border-top: 1px solid var(--fs-borda-suave, #ebe2d7) !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-pequeno,
      #modal-editar-orcamento .botoes-modal .btn-pequeno,
      #modal-visualizar-orcamento .botoes-modal button,
      #modal-editar-orcamento .botoes-modal button {
        width: auto !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 4px !important;
        padding: 7px 10px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        text-align: center !important;
        box-shadow: none !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-cancelar,
      #modal-editar-orcamento .botoes-modal .btn-cancelar {
        order: 99 !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-ver-link {
        background: #ffffff !important;
        color: var(--fs-marrom, #2f211d) !important;
        border: 1px solid var(--fs-borda, #ded3c5) !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-whatsapp-orcamento {
        background: #e9fbf0 !important;
        color: #166534 !important;
        border: 1px solid #bbf7d0 !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-editar,
      #modal-editar-orcamento .botoes-modal .btn-salvar-modal {
        background: var(--fs-marrom, #2f211d) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 1px solid var(--fs-marrom, #2f211d) !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-excluir {
        background: #fff5f5 !important;
        color: #b91c1c !important;
        border: 1px solid #fecaca !important;
      }

      @media (max-width: 760px) {
        #lista-orcamentos .tabela-orcamentos th,
        #lista-orcamentos .tabela-orcamentos td {
          padding: 7px 5px !important;
          font-size: 11px !important;
        }

        #lista-orcamentos .tabela-orcamentos th:nth-child(1),
        #lista-orcamentos .tabela-orcamentos td:nth-child(1) { width: 23% !important; }
        #lista-orcamentos .tabela-orcamentos th:nth-child(2),
        #lista-orcamentos .tabela-orcamentos td:nth-child(2) { width: 34% !important; }
        #lista-orcamentos .tabela-orcamentos th:nth-child(3),
        #lista-orcamentos .tabela-orcamentos td:nth-child(3) { width: 21% !important; text-align: right !important; }
        #lista-orcamentos .tabela-orcamentos th:nth-child(4),
        #lista-orcamentos .tabela-orcamentos td:nth-child(4) { width: 22% !important; text-align: center !important; }

        #modal-visualizar-orcamento .botoes-modal,
        #modal-editar-orcamento .botoes-modal {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function moeda(valor) {
    if (typeof window.formatarMoeda === 'function') return window.formatarMoeda(valor);
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function esc(valor) {
    if (typeof window.escaparHtml === 'function') return window.escaparHtml(valor);
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function numero(orcamento) {
    if (typeof window.numeroOrcamentoFormatado === 'function') return window.numeroOrcamentoFormatado(orcamento);
    const n = orcamento?.numero_orcamento || orcamento?.numero || '';
    return n ? `Nº ${String(n).padStart(6, '0')}` : '-';
  }

  function statusTexto(status) {
    if (typeof window.statusLabel === 'function') return window.statusLabel(status);
    const mapa = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado' };
    return mapa[status] || status || 'Pendente';
  }

  function statusClasse(status) {
    if (typeof window.classeStatus === 'function') return window.classeStatus(status);
    return String(status || 'pendente').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function linhaClasse(status) {
    if (typeof window.classeLinhaPorStatus === 'function') return window.classeLinhaPorStatus(status);
    return `status-${status || 'pendente'}`;
  }

  function renderizarTabelaCompacta(orcamentos) {
    const lista = document.getElementById('lista-orcamentos');
    if (!lista) return;

    if (!orcamentos || orcamentos.length === 0) {
      lista.innerHTML = '<div class="msg-vazia">Nenhum orçamento encontrado neste filtro.</div>';
      return;
    }

    let html = `
      <div class="tabela-wrapper tabela-orcamentos-compacta">
        <table class="tabela-orcamentos">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    orcamentos.forEach((orcamento) => {
      const id = orcamento.id;
      const clienteNome = orcamento.cliente_nome || 'Não informado';
      const total = orcamento.total || 0;
      const status = orcamento.status || 'pendente';

      html += `
        <tr class="linha-orcamento ${linhaClasse(status)}" onclick="abrirModalVisualizar('${esc(id)}')" title="Abrir orçamento">
          <td><strong>${esc(numero(orcamento))}</strong></td>
          <td>${esc(clienteNome)}</td>
          <td><strong>${moeda(total)}</strong></td>
          <td><span class="status status-${statusClasse(status)}">${esc(statusTexto(status))}</span></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    lista.innerHTML = html;
  }

  function instalarOverrideTabela() {
    window.renderizarTabelaOrcamentos = renderizarTabelaCompacta;

    if (Array.isArray(window.orcamentosCache) && window.orcamentosCache.length) {
      renderizarTabelaCompacta(window.orcamentosCache);
    }
  }

  function iniciar() {
    injetarEstilo();
    instalarOverrideTabela();
    setTimeout(instalarOverrideTabela, 300);
    setTimeout(instalarOverrideTabela, 900);
    setTimeout(instalarOverrideTabela, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();