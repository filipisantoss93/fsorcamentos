/* =========================================================
   FS ORÇAMENTOS - orcamentos-resumo-grid-fix.js
   Página orçamentos:
   - resumo financeiro em grid 2 blocos por linha;
   - lista compacta com Número, Cliente, Total e Status;
   - linha clicável, sem botões de ação na tabela;
   - botões do modal em linha cheia.
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
        gap: 12px !important;
        align-items: stretch !important;
      }

      body .resumo-financeiro .card-resumo,
      body .cards-resumo .card-resumo {
        min-width: 0 !important;
        min-height: 108px !important;
        box-sizing: border-box !important;
        border-radius: 16px !important;
        padding: 14px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
      }

      body .resumo-financeiro .card-resumo strong,
      body .cards-resumo .card-resumo strong {
        font-size: 11px !important;
        line-height: 1.25 !important;
        word-break: break-word !important;
      }

      body .resumo-financeiro .card-resumo .valor-resumo,
      body .cards-resumo .card-resumo .valor-resumo {
        font-size: 20px !important;
        line-height: 1.12 !important;
        word-break: break-word !important;
      }

      body .resumo-financeiro .card-resumo small,
      body .cards-resumo .card-resumo small {
        line-height: 1.25 !important;
      }

      #lista-orcamentos .tabela-wrapper {
        width: 100% !important;
        overflow-x: visible !important;
        border-radius: 16px !important;
      }

      #lista-orcamentos .tabela-orcamentos {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
      }

      #lista-orcamentos .tabela-orcamentos th,
      #lista-orcamentos .tabela-orcamentos td {
        padding: 10px 8px !important;
        line-height: 1.2 !important;
        vertical-align: middle !important;
        white-space: normal !important;
        word-break: break-word !important;
      }

      #lista-orcamentos .tabela-orcamentos th {
        font-size: 12px !important;
        text-transform: uppercase !important;
        letter-spacing: .2px !important;
      }

      #lista-orcamentos .tabela-orcamentos td {
        font-size: 13px !important;
      }

      #lista-orcamentos .tabela-orcamentos tr.linha-orcamento {
        min-height: 0 !important;
        cursor: pointer !important;
      }

      #lista-orcamentos .tabela-orcamentos tr.linha-orcamento:hover {
        filter: brightness(.98) !important;
      }

      #lista-orcamentos .status {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        max-width: 100% !important;
        min-height: 26px !important;
        padding: 5px 8px !important;
        border-radius: 999px !important;
        font-size: 11px !important;
        font-weight: 900 !important;
        line-height: 1.1 !important;
        white-space: normal !important;
      }

      #modal-visualizar-orcamento .botoes-modal,
      #modal-editar-orcamento .botoes-modal {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 10px !important;
        width: 100% !important;
        margin-top: 18px !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-pequeno,
      #modal-editar-orcamento .botoes-modal .btn-pequeno,
      #modal-visualizar-orcamento .botoes-modal button,
      #modal-editar-orcamento .botoes-modal button {
        width: 100% !important;
        min-height: 50px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 16px !important;
        padding: 13px 16px !important;
        font-size: 15px !important;
        font-weight: 950 !important;
        text-align: center !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-cancelar,
      #modal-editar-orcamento .botoes-modal .btn-cancelar {
        order: 99 !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-ver-link {
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-whatsapp-orcamento {
        background: #25d366 !important;
        color: #063b1c !important;
        border: 2px solid #1fb957 !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-editar,
      #modal-editar-orcamento .botoes-modal .btn-salvar-modal {
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 2px solid var(--fs-amarelo, #ffc400) !important;
      }

      #modal-visualizar-orcamento .botoes-modal .btn-excluir {
        background: #dc2626 !important;
        color: #ffffff !important;
        border: 2px solid #b91c1c !important;
      }

      @media (max-width: 760px) {
        #lista-orcamentos .tabela-orcamentos th,
        #lista-orcamentos .tabela-orcamentos td {
          padding: 8px 6px !important;
          font-size: 12px !important;
        }

        #lista-orcamentos .tabela-orcamentos th:nth-child(1),
        #lista-orcamentos .tabela-orcamentos td:nth-child(1) {
          width: 23% !important;
        }

        #lista-orcamentos .tabela-orcamentos th:nth-child(2),
        #lista-orcamentos .tabela-orcamentos td:nth-child(2) {
          width: 34% !important;
        }

        #lista-orcamentos .tabela-orcamentos th:nth-child(3),
        #lista-orcamentos .tabela-orcamentos td:nth-child(3) {
          width: 21% !important;
          text-align: right !important;
        }

        #lista-orcamentos .tabela-orcamentos th:nth-child(4),
        #lista-orcamentos .tabela-orcamentos td:nth-child(4) {
          width: 22% !important;
          text-align: center !important;
        }
      }

      @media (max-width: 420px) {
        body .resumo-financeiro .cards-resumo,
        body .cards-resumo {
          gap: 9px !important;
        }

        body .resumo-financeiro .card-resumo,
        body .cards-resumo .card-resumo {
          min-height: 100px !important;
          padding: 12px 10px !important;
        }

        body .resumo-financeiro .card-resumo .valor-resumo,
        body .cards-resumo .card-resumo .valor-resumo {
          font-size: 18px !important;
        }

        #lista-orcamentos .tabela-orcamentos th,
        #lista-orcamentos .tabela-orcamentos td {
          padding: 7px 5px !important;
          font-size: 11px !important;
        }

        #lista-orcamentos .status {
          padding: 4px 6px !important;
          font-size: 10px !important;
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
        <tr class="linha-orcamento ${linhaClasse(status)}" onclick="abrirModalVisualizar('${esc(id)}')" title="Toque para abrir o orçamento">
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
