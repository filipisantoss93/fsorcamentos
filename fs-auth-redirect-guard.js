/* FS Orçamentos — compatibilidade global leve.
   Remove overrides inline antigos do gerador e oculta blocos fora do escopo atual. */
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

  function removerCamposAntigosDoGerador() {
    if (!ehGerador()) return;

    ocultarCampoPorInput('orcamento-cliente-id');
    ocultarElemento(document.querySelector('.cliente-id-acoes'));
    ocultarElemento(document.getElementById('cliente-vinculado-card'));
    ocultarElemento(document.getElementById('veiculo-vinculado-card'));
    ocultarElemento(document.querySelector('.veiculo-orcamento-card'));
    ocultarElemento(document.getElementById('modal-busca-cliente-orcamento'));
    ocultarElemento(document.querySelector('.modal-busca-cliente-overlay'));

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
    removerCamposAntigosDoGerador();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executarLimpezaGerador);
  } else {
    executarLimpezaGerador();
  }

  window.addEventListener('load', executarLimpezaGerador);
})();
