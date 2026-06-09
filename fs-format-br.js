/* =========================================================
   FS ORÇAMENTOS - fs-format-br.js
   Formatação brasileira global:
   - telefone/WhatsApp;
   - CPF/CNPJ com reconhecimento automático;
   - aplica em index/dashboard e painel.
   ========================================================= */
(function () {
  'use strict';

  let observerInstalado = false;
  let aplicando = false;

  function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
  }

  function formatarTelefoneBR(valor) {
    const digitos = somenteNumeros(valor);
    if (!digitos) return '';

    let d = digitos;
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    d = d.slice(0, 11);

    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function tipoDocumentoBR(valor) {
    const d = somenteNumeros(valor);
    if (d.length <= 11) return 'CPF';
    return 'CNPJ';
  }

  function formatarCpfCnpjBR(valor) {
    const d = somenteNumeros(valor).slice(0, 14);
    if (!d) return '';

    if (d.length <= 11) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }

    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }

  function labelDocumentoBR(valor) {
    const d = somenteNumeros(valor);
    if (!d) return 'CNPJ / CPF';
    return tipoDocumentoBR(d);
  }

  function formatarTelefoneOuVazio(valor) {
    const d = somenteNumeros(valor);
    return d ? formatarTelefoneBR(d) : '-';
  }

  function formatarDocOuVazio(valor) {
    const d = somenteNumeros(valor);
    return d ? formatarCpfCnpjBR(d) : '-';
  }

  function dadosEmpresaFormatados({ telefone, documento, endereco } = {}) {
    const partes = [];
    const tel = somenteNumeros(telefone);
    const doc = somenteNumeros(documento);

    if (tel) partes.push(`WhatsApp: ${formatarTelefoneBR(tel)}`);
    if (doc) partes.push(`${labelDocumentoBR(doc)}: ${formatarCpfCnpjBR(doc)}`);
    if (String(endereco || '').trim()) partes.push(String(endereco).trim());

    return partes.join(' · ');
  }

  function setText(id, valor) {
    const el = document.getElementById(id);
    if (el && valor !== undefined && valor !== null) el.textContent = valor;
  }

  function formatarInputTelefone(input) {
    if (!input || input.dataset.fsFormatTelefone === '1') return;
    input.dataset.fsFormatTelefone = '1';
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'tel');

    const aplicar = () => {
      const posFim = document.activeElement === input;
      input.value = formatarTelefoneBR(input.value);
      if (posFim) {
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
      }
    };

    input.addEventListener('input', aplicar);
    input.addEventListener('blur', aplicar);
    if (input.value) aplicar();
  }

  function formatarInputDocumento(input) {
    if (!input || input.dataset.fsFormatDoc === '1') return;
    input.dataset.fsFormatDoc = '1';
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'off');

    const aplicar = () => {
      const posFim = document.activeElement === input;
      input.value = formatarCpfCnpjBR(input.value);
      atualizarLabelsDocumento(input.value);
      if (posFim) {
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
      }
    };

    input.addEventListener('input', aplicar);
    input.addEventListener('blur', aplicar);
    if (input.value) aplicar();
  }

  function atualizarLabelsDocumento(valor) {
    const label = labelDocumentoBR(valor);

    document.querySelectorAll('[data-fs-label-documento]').forEach(el => {
      el.textContent = label;
    });

    document.querySelectorAll('label').forEach(el => {
      const forAttr = el.getAttribute('for') || '';
      const texto = (el.textContent || '').trim().toLowerCase();
      if (
        forAttr === 'cnpj_empresa' ||
        forAttr === 'empresa-cnpj' ||
        forAttr === 'cnpj_cpf' ||
        texto === 'cnpj / cpf' ||
        texto === 'cpf / cnpj'
      ) {
        el.textContent = label;
      }
    });

    document.querySelectorAll('.info-card strong, .painel-os-card strong, .premium-metrica-card span').forEach(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      if (t === 'cnpj / cpf' || t === 'cpf / cnpj' || t === 'cnpj' || t === 'cpf') {
        el.textContent = label;
      }
    });
  }

  function formatarPainel() {
    const telefone = localStorage.getItem('telefone_empresa') || '';
    const documento = localStorage.getItem('cnpj_empresa') || '';

    ['telefone_empresa', 'empresa_telefone', 'telefone', 'whatsapp_empresa'].forEach(id => {
      formatarInputTelefone(document.getElementById(id));
    });

    ['cnpj_empresa', 'empresa_cnpj', 'cnpj_cpf', 'cpf_cnpj'].forEach(id => {
      formatarInputDocumento(document.getElementById(id));
    });

    const telFormatado = formatarTelefoneOuVazio(telefone || document.getElementById('telefone_empresa')?.value);
    const docValor = documento || document.getElementById('cnpj_empresa')?.value;
    const docFormatado = formatarDocOuVazio(docValor);

    setText('perfil-telefone', telFormatado);
    setText('perfil-cnpj', docFormatado);
    setText('perfil-cpf-cnpj', docFormatado);
    setText('painel-telefone-empresa', telFormatado);
    setText('painel-cnpj-empresa', docFormatado);
    setText('empresa-telefone-display', telFormatado);
    setText('empresa-cnpj-display', docFormatado);

    if (docValor) atualizarLabelsDocumento(docValor);
  }

  function formatarDashboardIndex() {
    const telefone = localStorage.getItem('telefone_empresa') || '';
    const documento = localStorage.getItem('cnpj_empresa') || '';
    const endereco = localStorage.getItem('endereco_empresa') || '';
    const el = document.getElementById('home-premium-empresa-dados');

    if (el && (telefone || documento || endereco)) {
      const novo = dadosEmpresaFormatados({ telefone, documento, endereco });
      if (novo) el.textContent = novo;
    }
  }

  function carregarFixPdfGerador() {
    const path = (window.location.pathname || '').toLowerCase();
    if (!path.endsWith('/gerador') && !path.endsWith('/gerador.html')) return;
    if (document.getElementById('fs-gerador-pdf-fix-js')) return;

    const script = document.createElement('script');
    script.id = 'fs-gerador-pdf-fix-js';
    script.src = '/gerador-pdf-fix.js';
    script.async = false;
    script.onerror = () => console.warn('Não foi possível carregar /gerador-pdf-fix.js');
    document.head.appendChild(script);
  }

  function formatarTextoConhecido() {
    formatarPainel();
    formatarDashboardIndex();
  }

  function instalarObserver() {
    if (observerInstalado || typeof MutationObserver === 'undefined') return;
    observerInstalado = true;

    const observer = new MutationObserver(() => {
      if (aplicando) return;
      aplicando = true;
      setTimeout(() => {
        formatarTextoConhecido();
        aplicando = false;
      }, 80);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  function iniciar() {
    carregarFixPdfGerador();
    formatarTextoConhecido();
    instalarObserver();
    setTimeout(carregarFixPdfGerador, 250);
    setTimeout(formatarTextoConhecido, 250);
    setTimeout(formatarTextoConhecido, 900);
    setTimeout(formatarTextoConhecido, 1800);
    setTimeout(formatarTextoConhecido, 3200);
  }

  window.fsSomenteNumeros = somenteNumeros;
  window.fsFormatarTelefoneBR = formatarTelefoneBR;
  window.fsFormatarCpfCnpjBR = formatarCpfCnpjBR;
  window.fsTipoDocumentoBR = tipoDocumentoBR;
  window.fsLabelDocumentoBR = labelDocumentoBR;
  window.fsDadosEmpresaFormatados = dadosEmpresaFormatados;
  window.fsAplicarFormatacaoBR = formatarTextoConhecido;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
