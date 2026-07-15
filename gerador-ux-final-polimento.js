/* FS ORÇAMENTOS — polimento final de UX do gerador */
(function () {
  'use strict';

  const STYLE_ID = 'fs-gerador-ux-final-style';
  const ERROR_CLASS = 'fs-campo-invalido';

  function instalarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${ERROR_CLASS} {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 3px rgba(220,38,38,.14) !important;
        background: #fffafa !important;
      }
      #fs-validacao-gerador {
        display: none;
        margin: 0 0 16px;
        padding: 12px 14px;
        border: 1px solid #fca5a5;
        border-left: 5px solid #dc2626;
        border-radius: 10px;
        background: #fff1f2;
        color: #7f1d1d;
        font-size: 14px;
        line-height: 1.45;
        font-weight: 700;
      }
      #fs-validacao-gerador.ativo { display: block; }
      #fs-validacao-gerador strong { display: block; margin-bottom: 4px; }
      .gerador-sidebar > .sidebar-card:last-child { display: none; }
      .gerador-sidebar { align-self: start; }
      @media (min-width: 981px) {
        .gerador-sidebar { position: sticky; top: 88px; }
      }
      @media (max-width: 680px) {
        #fs-validacao-gerador { margin-inline: 0; }
        .acoes-gerador-principal { gap: 8px !important; }
        .acoes-gerador-principal > button { width: 100% !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function obterResumoValidacao() {
    let box = document.getElementById('fs-validacao-gerador');
    if (box) return box;
    const form = document.getElementById('formulario-orcamento');
    if (!form) return null;
    box = document.createElement('div');
    box.id = 'fs-validacao-gerador';
    box.setAttribute('role', 'alert');
    box.setAttribute('aria-live', 'assertive');
    form.prepend(box);
    return box;
  }

  function limparErrosVisuais() {
    document.querySelectorAll(`.${ERROR_CLASS}`).forEach(el => {
      el.classList.remove(ERROR_CLASS);
      el.removeAttribute('aria-invalid');
    });
    const box = obterResumoValidacao();
    if (box) {
      box.classList.remove('ativo');
      box.replaceChildren();
    }
  }

  function marcarErro(campo) {
    if (!campo) return;
    campo.classList.add(ERROR_CLASS);
    campo.setAttribute('aria-invalid', 'true');
  }

  function numeroCampo(valor) {
    if (typeof window.fsValorNumero === 'function') return window.fsValorNumero(valor);
    const texto = String(valor || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function validarGerador({ exigirWhatsapp = false } = {}) {
    limparErrosVisuais();
    const erros = [];
    let primeiroCampo = null;

    const titulo = document.getElementById('titulo');
    const data = document.getElementById('data-orcamento');
    const cliente = document.getElementById('cliente');
    const telefone = document.getElementById('tel-cliente');

    function exigir(campo, mensagem) {
      if (String(campo?.value || '').trim()) return;
      erros.push(mensagem);
      marcarErro(campo);
      if (!primeiroCampo) primeiroCampo = campo;
    }

    exigir(titulo, 'Informe o título do orçamento.');
    exigir(data, 'Informe a data do orçamento.');
    exigir(cliente, 'Informe o nome do cliente.');
    if (exigirWhatsapp) exigir(telefone, 'Informe o WhatsApp do cliente para realizar o envio.');

    const linhas = Array.from(document.querySelectorAll('#itens-lista .item-row:not(.header-labels)'));
    if (!linhas.length) {
      erros.push('Adicione pelo menos um item ou serviço.');
    }

    linhas.forEach((row, index) => {
      const inputs = Array.from(row.querySelectorAll('input'));
      const descricao = row.querySelector('.desc-cell') || row.querySelector('.desc') || inputs[0];
      const qtd = row.querySelector('.qtd') || inputs[1];
      const valor = row.querySelector('.valor') || inputs[2];
      const numeroLinha = index + 1;

      if (!String(descricao?.value || '').trim()) {
        erros.push(`Informe a descrição do item ${numeroLinha}.`);
        marcarErro(descricao);
        if (!primeiroCampo) primeiroCampo = descricao;
      }

      if (numeroCampo(qtd?.value) <= 0) {
        erros.push(`A quantidade do item ${numeroLinha} deve ser maior que zero.`);
        marcarErro(qtd);
        if (!primeiroCampo) primeiroCampo = qtd;
      }

      if (numeroCampo(valor?.value) < 0) {
        erros.push(`O valor do item ${numeroLinha} não pode ser negativo.`);
        marcarErro(valor);
        if (!primeiroCampo) primeiroCampo = valor;
      }
    });

    if (!erros.length) return true;

    const box = obterResumoValidacao();
    if (box) {
      const tituloErro = document.createElement('strong');
      tituloErro.textContent = 'Revise os dados antes de continuar:';
      const lista = document.createElement('ul');
      lista.style.margin = '6px 0 0 18px';
      lista.style.padding = '0';
      [...new Set(erros)].forEach(mensagem => {
        const item = document.createElement('li');
        item.textContent = mensagem;
        lista.appendChild(item);
      });
      box.replaceChildren(tituloErro, lista);
      box.classList.add('ativo');
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => primeiroCampo?.focus?.({ preventScroll: true }), 350);
    return false;
  }

  function envolverFuncao(nome, opcoes) {
    const original = window[nome];
    if (typeof original !== 'function' || original.__fsUxValidado) return;
    const wrapper = function () {
      if (!validarGerador(opcoes)) return;
      return original.apply(this, arguments);
    };
    wrapper.__fsUxValidado = true;
    wrapper.__fsOriginal = original;
    window[nome] = wrapper;
  }

  function prepararCampos() {
    ['titulo', 'data-orcamento', 'cliente', 'tel-cliente'].forEach(id => {
      const campo = document.getElementById(id);
      if (!campo || campo.dataset.fsValidacaoLigada === '1') return;
      campo.dataset.fsValidacaoLigada = '1';
      campo.addEventListener('input', () => {
        if (String(campo.value || '').trim()) {
          campo.classList.remove(ERROR_CLASS);
          campo.removeAttribute('aria-invalid');
        }
      });
    });

    document.getElementById('itens-lista')?.addEventListener('input', event => {
      const campo = event.target;
      if (!(campo instanceof HTMLInputElement)) return;
      campo.classList.remove(ERROR_CLASS);
      campo.removeAttribute('aria-invalid');
    });
  }

  function instalar() {
    instalarEstilos();
    obterResumoValidacao();
    prepararCampos();
    envolverFuncao('gerarPrevia', { exigirWhatsapp: false });
    envolverFuncao('baixarPDF', { exigirWhatsapp: false });
    envolverFuncao('enviarPorWhatsApp', { exigirWhatsapp: true });
  }

  instalar();
  setTimeout(instalar, 700);
  setTimeout(instalar, 1800);
})();
