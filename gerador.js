/* FS ORÇAMENTOS — carregador da camada de polimento do gerador */
(function carregarGeradorCore() {
  const core = document.createElement('script');
  core.src = 'gerador-core.js?v=20260715-polimento-v3';
  core.async = false;
  core.onload = aplicarPolimentoGerador;
  core.onerror = () => console.error('Não foi possível carregar o núcleo do gerador.');
  document.head.appendChild(core);
})();

function aplicarPolimentoGerador() {
  function inserirCamposCondicoes() {
    if (document.getElementById('validade-orcamento') || document.getElementById('forma-pagamento')) return;

    const observacoesTitulo = Array.from(document.querySelectorAll('.dadositens'))
      .find(el => el.textContent.includes('Observações'));
    if (!observacoesTitulo) return;

    const grid = document.createElement('div');
    grid.className = 'grid-duplo-gerador condicoes-orcamento-grid';
    grid.innerHTML = `
      <div class="campo-form">
        <label for="validade-orcamento">Validade do orçamento</label>
        <select id="validade-orcamento" onchange="salvarEstadoCompleto(); autoUpdatePreview()">
          <option value="">Selecione</option>
          <option value="7 dias">7 dias</option>
          <option value="15 dias">15 dias</option>
          <option value="30 dias">30 dias</option>
          <option value="60 dias">60 dias</option>
          <option value="90 dias">90 dias</option>
        </select>
      </div>
      <div class="campo-form">
        <label for="forma-pagamento">Forma de pagamento</label>
        <input type="text" id="forma-pagamento" maxlength="100" placeholder="Ex: Pix, cartão ou 50% de entrada" oninput="salvarEstadoCompleto(); autoUpdatePreview()">
      </div>
    `;

    observacoesTitulo.insertAdjacentElement('afterend', grid);
  }

  function decorarLinhaItem(row) {
    if (!row || row.classList.contains('header-labels')) return;

    const campos = [
      ['.desc-cell', 'Descrição'],
      ['.qtd', 'Quantidade'],
      ['.valor', 'Valor unitário'],
      ['.subtotal', 'Subtotal']
    ];

    campos.forEach(([seletor, rotulo]) => {
      const input = row.querySelector(seletor);
      if (!input) return;

      input.setAttribute('aria-label', rotulo);
      if (seletor === '.qtd') input.setAttribute('min', '0.01');

      if (input.parentElement?.classList.contains('item-campo-mobile')) return;

      const wrapper = document.createElement('label');
      wrapper.className = `item-campo-mobile item-campo-${seletor.replace('.', '')}`;
      const legenda = document.createElement('span');
      legenda.className = 'item-campo-mobile-label';
      legenda.textContent = rotulo;

      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(legenda);
      wrapper.appendChild(input);
    });
  }

  function decorarTodasLinhas() {
    document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(decorarLinhaItem);
  }

  window.calcularLinha = function calcularLinhaPolida(row) {
    const campoQtd = row?.querySelector('.qtd');
    const campoValor = row?.querySelector('.valor');
    const qtd = Math.max(0, fsValorNumero(campoQtd?.value || 0));
    const valor = Math.max(0, fsValorNumero(campoValor?.value || 0));
    const subtotal = qtd * valor;
    const campoSubtotal = row?.querySelector('.subtotal');
    if (campoSubtotal) campoSubtotal.value = fsMoeda(subtotal);
    return subtotal;
  };

  window.coletarItensTela = function coletarItensTelaPolido() {
    return Array.from(document.querySelectorAll('#itens-lista .item-row:not(.header-labels)')).map(row => {
      const descricao = row.querySelector('.desc-cell')?.value?.trim() || '';
      const qtd = Math.max(0, fsValorNumero(row.querySelector('.qtd')?.value || 0));
      const valor = Math.max(0, fsValorNumero(row.querySelector('.valor')?.value || 0));
      return { descricao, qtd, valor, subtotal: qtd * valor };
    }).filter(item => item.descricao);
  };

  const adicionarLinhaOriginal = window.adicionarLinha;
  window.adicionarLinha = function adicionarLinhaPolida(item = {}) {
    adicionarLinhaOriginal(item);
    const linhas = document.querySelectorAll('#itens-lista .item-row:not(.header-labels)');
    decorarLinhaItem(linhas[linhas.length - 1]);
  };

  decorarTodasLinhas();

  const gerarPreviaOriginal = window.gerarPrevia;
  window.gerarPrevia = function gerarPreviaPolida(exibirAcoes = true) {
    const titulo = document.getElementById('titulo');
    const cliente = document.getElementById('cliente');
    const data = document.getElementById('data-orcamento');
    const linhas = Array.from(document.querySelectorAll('#itens-lista .item-row:not(.header-labels)'));

    const camposInvalidos = [];
    if (!titulo?.value.trim()) camposInvalidos.push(titulo);
    if (!cliente?.value.trim()) camposInvalidos.push(cliente);
    if (!data?.value) camposInvalidos.push(data);

    let itemInvalido = null;
    linhas.forEach(row => {
      const descricao = row.querySelector('.desc-cell')?.value?.trim() || '';
      const qtd = fsValorNumero(row.querySelector('.qtd')?.value || 0);
      const valor = fsValorNumero(row.querySelector('.valor')?.value || 0);
      if (descricao && (qtd <= 0 || valor < 0) && !itemInvalido) itemInvalido = row;
    });

    document.querySelectorAll('.campo-invalido').forEach(el => el.classList.remove('campo-invalido'));
    camposInvalidos.forEach(el => el?.classList.add('campo-invalido'));
    if (itemInvalido) itemInvalido.classList.add('campo-invalido');

    if (camposInvalidos.length) {
      camposInvalidos[0]?.focus();
      alert('Preencha título, data e nome do cliente antes de gerar a prévia.');
      return;
    }

    if (itemInvalido) {
      itemInvalido.querySelector('.qtd, .valor')?.focus();
      alert('Revise os itens: a quantidade deve ser maior que zero e o valor não pode ser negativo.');
      return;
    }

    gerarPreviaOriginal(exibirAcoes);

    const tabela = document.querySelector('#conteudo-pdf .pdf-table');
    if (tabela && !tabela.querySelector('colgroup')) {
      tabela.insertAdjacentHTML('afterbegin', `
        <colgroup>
          <col style="width:55%">
          <col style="width:10%">
          <col style="width:17.5%">
          <col style="width:17.5%">
        </colgroup>
      `);
    }
  };

  const limparFormularioOriginal = window.limparFormulario;
  window.limparFormulario = function limparFormularioPolido(forcar = false) {
    const temConteudo = Boolean(
      document.getElementById('titulo')?.value.trim() ||
      document.getElementById('cliente')?.value.trim() ||
      document.getElementById('observacoes')?.value.trim() ||
      Array.from(document.querySelectorAll('#itens-lista .item-row:not(.header-labels)')).some(row =>
        row.querySelector('.desc-cell')?.value.trim() || fsValorNumero(row.querySelector('.valor')?.value || 0) > 0
      )
    );

    if (!forcar && temConteudo && !confirm('Iniciar um novo orçamento? Os dados ainda não salvos serão apagados.')) return;
    limparFormularioOriginal();
    inserirCamposCondicoes();
    setTimeout(decorarTodasLinhas, 0);
  };

  const carregarEstadoOriginal = window.carregarEstadoSalvo;
  window.carregarEstadoSalvo = function carregarEstadoSalvoPolido() {
    inserirCamposCondicoes();
    carregarEstadoOriginal();
    decorarTodasLinhas();
  };

  async function baixarPDFPolido() {
    const conteudoPdf = document.getElementById('conteudo-pdf');
    if (!conteudoPdf?.innerHTML.trim()) {
      alert('Gere a pré-visualização antes de baixar o PDF.');
      return;
    }

    if (typeof fsSalvarOrcamentoSePlanoPermitido === 'function') {
      await fsSalvarOrcamentoSePlanoPermitido('download_pdf');
    }

    const folha = conteudoPdf.firstElementChild || conteudoPdf;
    const nomeBase = document.getElementById('titulo')?.value || 'orcamento';
    const nomeArquivo = typeof fsNomeArquivoSeguro === 'function' ? fsNomeArquivoSeguro(nomeBase) : 'orcamento';

    document.body.classList.add('gerando-pdf');
    if (typeof fsAguardarRenderizacaoPDF === 'function') await fsAguardarRenderizacaoPDF(folha);

    const opt = {
      margin: 0,
      filename: `${nomeArquivo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123],
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(folha).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Não foi possível gerar o PDF.');
    } finally {
      document.body.classList.remove('gerando-pdf');
    }
  }

  function garantirBaixarPDFPolido() {
    window.baixarPDF = baixarPDFPolido;
  }

  garantirBaixarPDFPolido();
  document.addEventListener('DOMContentLoaded', garantirBaixarPDFPolido, { once: true });

  setTimeout(() => {
    inserirCamposCondicoes();
    const conteudo = document.getElementById('conteudo-gerador');
    const estaOculto = !conteudo || getComputedStyle(conteudo).display === 'none';

    if (estaOculto && typeof fsVerificarSessaoGerador === 'function') {
      fsVerificarSessaoGerador();
    } else if (typeof carregarEstadoSalvo === 'function') {
      carregarEstadoSalvo();
    }

    decorarTodasLinhas();
    garantirBaixarPDFPolido();
    if (typeof calcularTotal === 'function') calcularTotal();
  }, 100);
}