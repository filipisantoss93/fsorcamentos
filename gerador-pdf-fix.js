/* =========================================================
   FS ORÇAMENTOS - gerador-pdf-fix.js
   Correção definitiva do PDF do gerador:
   - Remove página em branco inicial causada por pagebreak/clone fixo.
   - Coloca o nome da empresa no topo.
   - Coloca o título do orçamento acima do bloco EMISSOR.
   ========================================================= */
(function () {
  'use strict';

  function escapar(valor) {
    if (typeof window.escaparHtml === 'function') return window.escaparHtml(valor);
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function textoComQuebraSeguro(valor) {
    if (typeof window.textoComQuebra === 'function') return window.textoComQuebra(valor);
    return escapar(valor).replace(/\n/g, '<br>');
  }

  function moeda(valor) {
    if (typeof window.formatarMoeda === 'function') return window.formatarMoeda(valor);
    return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function moedaSimbolo(valor) {
    if (typeof window.formatarMoedaComSimbolo === 'function') return window.formatarMoedaComSimbolo(valor);
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function valorNumerico(valor) {
    if (typeof valor === 'number') return valor;
    const texto = String(valor || '').replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    return Number.parseFloat(texto) || 0;
  }

  function getCampo(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function obterNumeroOrcamento() {
    const numero = window.numeroOrcamentoAtual || window.numero_orcamento || null;
    if (typeof window.formatarNumeroOrcamento === 'function') return window.formatarNumeroOrcamento(numero);
    return numero ? String(numero).padStart(6, '0') : 'PRÉVIA';
  }

  function obterEmpresaLocal() {
    const base = window.dadosEmpresaLogada || window.perfilGeradorAtual || {};
    return {
      nome: base.nome || localStorage.getItem('usuario_nome') || '',
      nome_empresa: base.nome_empresa || localStorage.getItem('nome_empresa') || 'Empresa',
      telefone_empresa: base.telefone_empresa || localStorage.getItem('telefone_empresa') || '',
      endereco_empresa: base.endereco_empresa || localStorage.getItem('endereco_empresa') || '',
      cnpj_empresa: base.cnpj_empresa || localStorage.getItem('cnpj_empresa') || '',
      foto_url: base.foto_url || localStorage.getItem('foto_url') || '',
      plano: base.plano || localStorage.getItem('usuario_plano') || 'gratis'
    };
  }

  async function obterEmpresa() {
    if (typeof window.carregarDadosEmpresaLogada === 'function') {
      try {
        const empresa = await window.carregarDadosEmpresaLogada();
        if (empresa) return empresa;
      } catch (error) {
        console.warn('PDF: usando dados locais da empresa.', error);
      }
    }
    return obterEmpresaLocal();
  }

  function empresaCompleta(empresa) {
    if (typeof window.empresaEstaCompleta === 'function') return window.empresaEstaCompleta(empresa);
    return !!(empresa?.nome_empresa && empresa?.telefone_empresa);
  }

  function obterConsultor(empresa) {
    if (typeof window.obterConsultorSelecionado === 'function') return window.obterConsultorSelecionado(empresa);
    return empresa?.nome || localStorage.getItem('usuario_nome') || '';
  }

  function obterCores() {
    const tema = typeof window.obterTemaAtual === 'function'
      ? window.obterTemaAtual()
      : (document.getElementById('selected-theme')?.value || 'original');

    if (typeof window.obterCoresTema === 'function') return window.obterCoresTema(tema);

    const primaria = getComputedStyle(document.documentElement).getPropertyValue('--fs-marrom')?.trim() || '#3e2723';
    const destaque = getComputedStyle(document.documentElement).getPropertyValue('--fs-amarelo')?.trim() || '#ffc400';
    return { primaria, destaque, fundo: '#fffaf0', textoHeader: '#ffffff' };
  }

  function coletarItens() {
    if (typeof window.coletarItensDoOrcamento === 'function') return window.coletarItensDoOrcamento();

    const itens = [];
    document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(row => {
      const inputs = Array.from(row.querySelectorAll('input'));
      const descricao = row.querySelector('.desc-cell')?.value?.trim() || row.querySelector('.desc')?.value?.trim() || inputs[0]?.value?.trim() || '';
      const qtd = valorNumerico(row.querySelector('.qtd')?.value || inputs[1]?.value || 1) || 1;
      const valor = valorNumerico(row.querySelector('.valor')?.value || inputs[2]?.value || 0);
      const subtotal = valorNumerico(row.querySelector('.subtotal')?.value || inputs[3]?.value || (qtd * valor));
      if (descricao) itens.push({ descricao, qtd, valor, subtotal });
    });
    return itens;
  }

  function montarExtrasClienteHtml() {
    if (typeof window.montarExtrasClienteHtml === 'function') return window.montarExtrasClienteHtml();
    const extraClienteContainer = document.getElementById('extra-cliente-container');
    if (!extraClienteContainer) return '';
    return Array.from(extraClienteContainer.querySelectorAll('.extra-field')).map(f => {
      const inputs = f.querySelectorAll('input');
      const label = inputs[0]?.value || '';
      const valor = inputs[1]?.value || '';
      return label || valor ? `<br>${escapar(label)}: ${escapar(valor)}` : '';
    }).join('');
  }

  function montarLinhasItens(itens) {
    return itens.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}; border-bottom:1px solid #eee; page-break-inside:avoid; break-inside:avoid;">
        <td style="padding:10px; font-size:12px; color:#222;">${escapar(item.descricao)}</td>
        <td style="padding:10px; text-align:center; font-size:12px; color:#222;">${escapar(item.qtd)}</td>
        <td style="padding:10px; font-size:12px; color:#222;">${moedaSimbolo(item.valor)}</td>
        <td style="padding:10px; text-align:right; font-weight:bold; font-size:12px; color:#222;">${moedaSimbolo(item.subtotal)}</td>
      </tr>
    `).join('');
  }

  function montarHtmlPdf({ empresa, itens, titulo, cliente, telCliente, observacoes, validade, formaPagamento }) {
    const cor = obterCores();
    const nomeEmpresa = empresa.nome_empresa || empresa.nome || 'Empresa';
    const consultor = obterConsultor(empresa);
    const numero = obterNumeroOrcamento();
    const total = itens.reduce((soma, item) => soma + Number(item.subtotal || 0), 0);
    const logoHtml = empresa.foto_url
      ? `<img src="${escapar(empresa.foto_url)}" crossorigin="anonymous" style="max-height:58px; max-width:135px; object-fit:contain;">`
      : `<b style="font-size:20px;color:${cor.primaria};">FS</b>`;

    const validadeHtml = validade
      ? `<div style="background:#fff; border-left:4px solid ${cor.destaque}; padding:10px; border-radius:6px; font-size:11px; color:#333;"><b>VALIDADE:</b><br>${escapar(validade)}</div>`
      : '';

    const pagamentoHtml = formaPagamento
      ? `<div style="background:#fff; border-left:4px solid ${cor.destaque}; padding:10px; border-radius:6px; font-size:11px; color:#333;"><b>FORMA DE PAGAMENTO:</b><br>${escapar(formaPagamento)}</div>`
      : '';

    return `
      <div class="pdf-documento-a4" style="width:794px; min-height:1123px; box-sizing:border-box; padding:30px; background:#ffffff; font-family:Arial, sans-serif; color:#333; display:flex; flex-direction:column; page-break-before:auto; break-before:auto;">
        <div style="border-bottom:3px solid ${cor.destaque}; background:${cor.primaria}; padding:20px; margin:-30px -30px 20px -30px; color:${cor.textoHeader || '#fff'}; display:flex; justify-content:space-between; align-items:center; gap:18px;">
          <div style="min-width:0;">
            <h1 style="margin:0; font-size:24px; line-height:1.15; color:${cor.textoHeader || '#fff'};">${escapar(nomeEmpresa)}</h1>
            <span style="font-size:11px; opacity:.9;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</span><br>
            <span style="font-size:11px; opacity:.95;">Orçamento Nº ${escapar(numero)}</span>
          </div>
          <div style="width:96px; height:62px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">${logoHtml}</div>
        </div>

        <div style="flex-grow:1;">
          <div style="display:flex; justify-content:space-between; gap:25px; margin-bottom:20px; page-break-inside:avoid; break-inside:avoid;">
            <div style="width:50%;">
              <h2 style="margin:0 0 9px; font-size:22px; line-height:1.15; color:${cor.primaria};">${escapar(titulo || 'ORÇAMENTO')}</h2>
              <b style="font-size:13px; color:#222;">EMISSOR:</b><br>
              <div style="font-size:12px; line-height:1.5; color:#333;">
                <b>${escapar(nomeEmpresa)}</b><br>
                ${consultor ? `Responsável: ${escapar(consultor)}<br>` : ''}
                ${empresa.telefone_empresa ? `WhatsApp: ${escapar(empresa.telefone_empresa)}<br>` : ''}
                ${empresa.endereco_empresa ? `Endereço: ${escapar(empresa.endereco_empresa)}<br>` : ''}
                ${empresa.cnpj_empresa ? `CNPJ/CPF: ${escapar(empresa.cnpj_empresa)}` : ''}
              </div>
            </div>

            <div style="width:50%; text-align:right; font-size:12px; line-height:1.5; color:#333;">
              <b style="font-size:13px; color:#222;">CLIENTE:</b><br>
              ${escapar(cliente || 'Cliente não informado')}<br>
              ${escapar(telCliente || '')}
              ${montarExtrasClienteHtml()}
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; page-break-inside:auto;">
            <thead>
              <tr style="background:${cor.primaria}; color:#fff;">
                <th style="padding:10px; text-align:left; font-size:12px; color:${cor.destaque || '#fff'};">Item</th>
                <th style="padding:10px; font-size:12px; color:${cor.destaque || '#fff'};">Qtd</th>
                <th style="padding:10px; text-align:left; font-size:12px; color:${cor.destaque || '#fff'};">Unit.</th>
                <th style="padding:10px; text-align:right; font-size:12px; color:${cor.destaque || '#fff'};">Subtotal</th>
              </tr>
            </thead>
            <tbody>${montarLinhasItens(itens)}</tbody>
          </table>

          <div style="margin-top:20px; text-align:right; page-break-inside:avoid; break-inside:avoid;">
            <div style="display:inline-block; background:${cor.fundo || '#fffaf0'}; padding:15px; border:1px solid #ddd; border-radius:6px; min-width:150px;">
              <span style="font-size:10px; color:#666; font-weight:bold;">VALOR TOTAL</span><br>
              <strong style="font-size:20px; color:${cor.primaria};">${moedaSimbolo(total)}</strong>
            </div>
          </div>

          ${validadeHtml || pagamentoHtml ? `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; page-break-inside:avoid; break-inside:avoid;">${validadeHtml}${pagamentoHtml}</div>` : ''}

          ${observacoes ? `<div style="margin-top:20px; font-size:11px; border-top:1px solid #eee; padding-top:10px; color:#333; page-break-inside:avoid; break-inside:avoid;"><b>OBSERVAÇÕES:</b><br>${textoComQuebraSeguro(observacoes)}</div>` : ''}
        </div>

        <div style="margin-top:45px; padding-top:14px; border-top:1px dashed #ccc; display:flex; justify-content:space-between; align-items:flex-end; gap:20px; page-break-inside:avoid; break-inside:avoid;">
          <div style="font-size:10px; color:#777; line-height:1.4;">
            <b>${escapar(nomeEmpresa)}</b><br>
            ${empresa.telefone_empresa ? `Contato: ${escapar(empresa.telefone_empresa)}<br>` : ''}
            Orçamento Nº ${escapar(numero)}
          </div>
          <div style="width:240px; text-align:center; font-size:10px; color:#777;">
            <div style="border-top:1px solid #999; padding-top:6px;">Assinatura / Aprovação</div>
          </div>
        </div>

        <div style="text-align:center; font-size:10px; color:#999; margin-top:18px;">Orçamento gerado por <strong>fsorcamentos.com.br</strong></div>
      </div>
    `;
  }

  async function gerarPreviaCorrigida() {
    const btn = document.getElementById('btn-previa');
    if (btn) {
      btn.innerText = 'PROCESSANDO...';
      btn.disabled = true;
    }

    try {
      const empresa = await obterEmpresa();
      if (!empresaCompleta(empresa)) {
        alert('Preencha os dados da empresa no Painel de Controle antes de gerar o orçamento.');
        window.location.href = '/painel.html';
        return;
      }

      const titulo = getCampo('titulo') || 'ORÇAMENTO';
      const cliente = getCampo('cliente');
      const telCliente = getCampo('tel-cliente');
      const observacoes = getCampo('observacoes');
      const validade = getCampo('validade-orcamento') || getCampo('validade');
      const formaPagamento = getCampo('forma-pagamento') || getCampo('pagamento');

      if (!cliente) {
        alert('Informe o nome do cliente.');
        return;
      }

      const itens = coletarItens();
      if (!itens.length) {
        alert('Adicione pelo menos um item ao orçamento.');
        return;
      }

      const conteudoPdf = document.getElementById('conteudo-pdf');
      const areaPrevia = document.getElementById('area-previa');
      const botoesAcao = document.getElementById('botoes-acao');

      if (conteudoPdf) {
        conteudoPdf.innerHTML = montarHtmlPdf({ empresa, itens, titulo, cliente, telCliente, observacoes, validade, formaPagamento });
        conteudoPdf.style.display = 'block';
        conteudoPdf.style.background = '#ffffff';
        conteudoPdf.style.overflow = 'visible';
      }

      if (typeof window.fsInserirVeiculoNaPreviaOrcamento === 'function') {
        window.fsInserirVeiculoNaPreviaOrcamento();
      }

      if (areaPrevia) areaPrevia.style.display = 'block';
      if (botoesAcao) botoesAcao.style.display = 'block';

      const btnFloatBaixar = document.getElementById('btn-float-baixar');
      const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');
      const floatingActions = document.querySelector('.floating-actions');
      if (btnFloatBaixar) btnFloatBaixar.style.display = 'flex';
      if (btnFloatWhatsapp) btnFloatWhatsapp.style.display = 'flex';
      if (floatingActions) floatingActions.classList.add('show');

      if (areaPrevia) {
        window.scrollTo({ top: Math.max(0, areaPrevia.offsetTop - 20), behavior: 'smooth' });
      }
    } finally {
      if (btn) {
        btn.innerText = '👁️ PRÉ-VISUALIZAÇÃO';
        btn.disabled = false;
      }
    }
  }

  function aguardarRender(container) {
    return new Promise(resolve => {
      const imagens = Array.from(container.querySelectorAll('img'));
      if (!imagens.length) {
        requestAnimationFrame(() => setTimeout(resolve, 350));
        return;
      }

      let finalizadas = 0;
      const finalizar = () => {
        finalizadas += 1;
        if (finalizadas >= imagens.length) requestAnimationFrame(() => setTimeout(resolve, 350));
      };

      imagens.forEach(img => {
        if (img.complete) finalizar();
        else {
          img.onload = finalizar;
          img.onerror = finalizar;
        }
      });
    });
  }

  function criarAreaRender(elementoOriginal) {
    const existente = document.getElementById('fs-pdf-render-area-corrigido');
    if (existente) existente.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'fs-pdf-render-area-corrigido';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = '794px';
    wrapper.style.minHeight = '1123px';
    wrapper.style.background = '#ffffff';
    wrapper.style.opacity = '1';
    wrapper.style.zIndex = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'visible';

    const clone = elementoOriginal.cloneNode(true);
    clone.style.width = '794px';
    clone.style.maxWidth = '794px';
    clone.style.minHeight = '1123px';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.transform = 'none';
    clone.style.background = '#ffffff';
    clone.style.overflow = 'visible';
    clone.style.pageBreakBefore = 'auto';
    clone.style.breakBefore = 'auto';

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    return { wrapper, clone };
  }

  function nomeArquivoSeguro(valor) {
    return String(valor || 'orcamento')
      .trim()
      .replace(/[^\wÀ-ÿ\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase() || 'orcamento';
  }

  async function baixarPDFCorrigido() {
    if (window.gerandoPdfAgora) return;

    const conteudoPdf = document.getElementById('conteudo-pdf');
    if (!conteudoPdf) {
      alert('Área do PDF não encontrada.');
      return;
    }

    window.gerandoPdfAgora = true;

    try {
      if (typeof window.fsSalvarOrcamentoSePlanoPermitido === 'function') {
        await window.fsSalvarOrcamentoSePlanoPermitido('download_pdf');
      } else if (typeof window.salvarOrcamentoNoBanco === 'function') {
        await window.salvarOrcamentoNoBanco('download_pdf');
      }

      await gerarPreviaCorrigida();

      const folha = conteudoPdf.firstElementChild || conteudoPdf;
      if (!folha || !conteudoPdf.innerHTML.trim()) {
        alert('Gere a pré-visualização antes de baixar o PDF.');
        return;
      }

      document.body.classList.add('gerando-pdf');
      const area = criarAreaRender(folha);
      await aguardarRender(area.clone);

      const alturaConteudo = Math.max(1123, Math.ceil(area.clone.scrollHeight || area.clone.offsetHeight || 1123));
      const nomeArquivo = nomeArquivoSeguro(getCampo('titulo') || 'orcamento');

      await html2pdf().set({
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
          width: 794,
          height: alturaConteudo,
          windowWidth: 794,
          windowHeight: alturaConteudo
        },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(area.clone).save();

      area.wrapper.remove();
    } catch (error) {
      console.error('Erro ao gerar PDF corrigido:', error);
      alert('Não foi possível gerar o PDF.');
    } finally {
      const area = document.getElementById('fs-pdf-render-area-corrigido');
      if (area) area.remove();
      document.body.classList.remove('gerando-pdf');
      window.gerandoPdfAgora = false;
    }
  }

  function instalar() {
    window.gerarPrevia = gerarPreviaCorrigida;
    window.baixarPDF = baixarPDFCorrigido;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(instalar, 200);
      setTimeout(instalar, 900);
      setTimeout(instalar, 1800);
    });
  } else {
    setTimeout(instalar, 200);
    setTimeout(instalar, 900);
    setTimeout(instalar, 1800);
  }
})();
