/* FS Orçamentos — compatibilidade global leve.
   Remove overrides inline antigos do gerador e desativa blocos fora do escopo atual. */
(function () {
  'use strict';

  function ehGerador() {
    const path = String(window.location.pathname || '').toLowerCase();
    return path.endsWith('/gerador.html') || path.endsWith('/gerador') || path === '/gerador.html';
  }

  function removerCssInlineAntigoGerador() {
    if (!ehGerador()) return;

    ['fs-formal-theme-overrides', 'fs-contrast-fix-final'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#07142f');

    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) statusBar.setAttribute('content', 'default');
  }

  function ocultarElemento(el) {
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('display', 'none', 'important');
  }

  function removerElemento(el) {
    if (!el) return;
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  function limparValor(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if ('value' in el) el.value = '';
    if (el.tagName === 'SELECT') el.innerHTML = '<option value="">Não utilizado</option>';
  }

  function ocultarCampoPorInput(id) {
    const input = document.getElementById(id);
    if (!input) return;
    const campo = input.closest('.campo-form') || input.closest('.cliente-id-acoes') || input.parentElement;
    ocultarElemento(campo);
    limparValor(id);
  }

  function desativarFuncoesAntigasGerador() {
    if (!ehGerador()) return;

    const noOp = function () { return null; };
    const limparVinculos = function () {
      limparValor('cliente-id-cadastrado');
      limparValor('orcamento-cliente-id');
      limparValor('orcamento-veiculo-id');
      try {
        window.veiculoSelecionadoOrcamento = null;
        window.veiculosClienteOrcamentoCache = [];
      } catch (_) {}
      return null;
    };

    window.abrirModalBuscaClienteOrcamento = noOp;
    window.fecharModalBuscaClienteOrcamento = noOp;
    window.buscarClientesParaOrcamento = noOp;
    window.renderizarResultadosBuscaClienteOrcamento = noOp;
    window.selecionarClienteOrcamento = noOp;
    window.carregarVeiculosDoClienteParaOrcamento = noOp;
    window.preencherSelectVeiculosOrcamento = noOp;
    window.selecionarVeiculoOrcamento = noOp;
    window.atualizarVeiculoVinculadoOrcamento = noOp;
    window.limparClienteVinculadoNoOrcamento = limparVinculos;
  }

  function removerCamposAntigosDoGerador() {
    if (!ehGerador()) return;

    ocultarCampoPorInput('orcamento-cliente-id');
    ocultarElemento(document.querySelector('.cliente-id-acoes'));
    ocultarElemento(document.getElementById('cliente-vinculado-card'));
    ocultarElemento(document.getElementById('veiculo-vinculado-card'));
    ocultarElemento(document.querySelector('.veiculo-orcamento-card'));

    removerElemento(document.getElementById('modal-busca-cliente-orcamento'));
    removerElemento(document.getElementById('modal-busca-cliente'));
    document.querySelectorAll('.modal-busca-cliente-overlay, .modal-busca-cliente-box').forEach(removerElemento);

    limparValor('cliente-id-cadastrado');
    limparValor('orcamento-cliente-id');
    limparValor('orcamento-veiculo-id');

    try {
      window.veiculoSelecionadoOrcamento = null;
      window.veiculosClienteOrcamentoCache = [];
    } catch (_) {}

    const textoTeste = document.querySelector('#box-teste-premium-gerador p');
    if (textoTeste) {
      textoTeste.textContent = 'Disponível para Plano Grátis e Básico. Libere recursos profissionais para criar, enviar e acompanhar seus orçamentos.';
    }
  }

  function executarLimpezaGerador() {
    removerCssInlineAntigoGerador();
    desativarFuncoesAntigasGerador();
    removerCamposAntigosDoGerador();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executarLimpezaGerador);
  } else {
    executarLimpezaGerador();
  }

  window.addEventListener('load', executarLimpezaGerador);
  setTimeout(executarLimpezaGerador, 400);
  setTimeout(executarLimpezaGerador, 1200);
})();
