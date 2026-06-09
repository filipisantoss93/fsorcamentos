/* FS Orçamentos - correção direta do PDF do gerador.
   Corrige o problema que vem do fluxo antigo do ui.js:
   1) título estava no topo e empresa no emissor;
   2) html2pdf gerava uma primeira página em branco em alguns navegadores.
*/
(function () {
  'use strict';

  const A4_W = 794;
  const A4_H = 1123;

  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function val(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function num(v) {
    if (typeof v === 'number') return v;
    const t = String(v || '')
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    return Number.parseFloat(t) || 0;
  }

  function moeda(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function numeroOrcamento() {
    const n = window.numeroOrcamentoAtual || window.numero_orcamento || '';
    if (!n) return 'PRÉVIA';
    return String(n).padStart(6, '0');
  }

  function empresaLocal() {
    const e = window.dadosEmpresaLogada || window.perfilGeradorAtual || {};
    return {
      nome: e.nome || localStorage.getItem('usuario_nome') || '',
      nome_empresa: e.nome_empresa || localStorage.getItem('nome_empresa') || 'Empresa',
      telefone_empresa: e.telefone_empresa || localStorage.getItem('telefone_empresa') || '',
      endereco_empresa: e.endereco_empresa || localStorage.getItem('endereco_empresa') || '',
      cnpj_empresa: e.cnpj_empresa || localStorage.getItem('cnpj_empresa') || '',
      foto_url: e.foto_url || localStorage.getItem('foto_url') || ''
    };
  }

  async function empresaAtual() {
    try {
      if (typeof window.carregarDadosEmpresaLogada === 'function') {
        const e = await window.carregarDadosEmpresaLogada();
        if (e) return e;
      }
    } catch (_) {}
    return empresaLocal();
  }

  function consultor(empresa) {
    try {
      if (typeof window.obterConsultorSelecionado === 'function') return window.obterConsultorSelecionado(empresa);
    } catch (_) {}
    return empresa.nome || localStorage.getItem('usuario_nome') || '';
  }

  function cores() {
    try {
      const tema = typeof window.obterTemaAtual === 'function' ? window.obterTemaAtual() : (val('selected-theme') || 'original');
      if (typeof window.obterCoresTema === 'function') return window.obterCoresTema(tema);
    } catch (_) {}
    return { primaria: '#3e2723', destaque: '#ffc400', fundo: '#fffaf0', textoHeader: '#fff' };
  }

  function itens() {
    try {
      if (typeof window.coletarItensDoOrcamento === 'function') return window.coletarItensDoOrcamento();
    } catch (_) {}

    const lista = [];
    document.querySelectorAll('#itens-lista .item-row:not(.header-labels)').forEach(row => {
      const inputs = Array.from(row.querySelectorAll('input'));
      const descricao = row.querySelector('.desc-cell')?.value?.trim() || row.querySelector('.desc')?.value?.trim() || inputs[0]?.value?.trim() || '';
      const qtd = num(row.querySelector('.qtd')?.value || inputs[1]?.value || 1) || 1;
      const valor = num(row.querySelector('.valor')?.value || inputs[2]?.value || 0);
      const subtotal = num(row.querySelector('.subtotal')?.value || inputs[3]?.value || (qtd * valor));
      if (descricao) lista.push({ descricao, qtd, valor, subtotal });
    });
    return lista;
  }

  function extrasCliente() {
    const box = document.getElementById('extra-cliente-container');
    if (!box) return '';
    return Array.from(box.querySelectorAll('.extra-field')).map(f => {
      const inputs = f.querySelectorAll('input');
      const label = inputs[0]?.value || '';
      const valor = inputs[1]?.value || '';
      return label || valor ? `<br>${esc(label)}: ${esc(valor)}` : '';
    }).join('');
  }

  function veiculoHtml(cor) {
    const card = document.getElementById('veiculo-vinculado-texto');
    const texto = card?.textContent?.trim() || '';
    if (!texto || texto.toLowerCase().includes('nenhum')) return '';
    return `<div style="margin-top:16px;border:1px solid #e0d6c8;border-left:6px solid ${cor.destaque};border-radius:10px;background:#fffaf0;padding:12px;color:#3e2723;page-break-inside:avoid;break-inside:avoid;"><b>Veículo</b><br><span style="font-size:12px;color:#5d4037;line-height:1.5;">${esc(texto)}</span></div>`;
  }

  function montarHtml(empresa, lista) {
    const cor = cores();
    const nomeEmpresa = empresa.nome_empresa || empresa.nome || 'Empresa';
    const titulo = val('titulo') || 'ORÇAMENTO';
    const cliente = val('cliente');
    const telCliente = val('tel-cliente');
    const obs = val('observacoes');
    const validade = val('validade-orcamento') || val('validade');
    const pagamento = val('forma-pagamento') || val('pagamento');
    const responsavel = consultor(empresa);
    const total = lista.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const logo = empresa.foto_url
      ? `<img src="${esc(empresa.foto_url)}" crossorigin="anonymous" style="max-width:128px;max-height:58px;object-fit:contain;display:block;">`
      : `<b style="font-size:22px;color:${cor.primaria};">FS</b>`;

    const linhas = lista.map((item, i) => `
      <tr style="background:${i % 2 ? '#fafafa' : '#fff'};border-bottom:1px solid #eee;page-break-inside:avoid;break-inside:avoid;">
        <td style="padding:10px;font-size:12px;color:#222;">${esc(item.descricao)}</td>
        <td style="padding:10px;text-align:center;font-size:12px;color:#222;">${esc(item.qtd)}</td>
        <td style="padding:10px;font-size:12px;color:#222;">${moeda(item.valor)}</td>
        <td style="padding:10px;text-align:right;font-size:12px;font-weight:bold;color:#222;">${moeda(item.subtotal)}</td>
      </tr>`).join('');

    const validadeHtml = validade ? `<div style="background:#fff;border-left:4px solid ${cor.destaque};padding:10px;border-radius:6px;font-size:11px;color:#333;"><b>VALIDADE:</b><br>${esc(validade)}</div>` : '';
    const pagamentoHtml = pagamento ? `<div style="background:#fff;border-left:4px solid ${cor.destaque};padding:10px;border-radius:6px;font-size:11px;color:#333;"><b>FORMA DE PAGAMENTO:</b><br>${esc(pagamento)}</div>` : '';

    return `<div class="pdf-documento-a4" style="width:${A4_W}px;min-height:${A4_H}px;box-sizing:border-box;padding:30px;background:#fff;font-family:Arial,sans-serif;color:#333;display:flex;flex-direction:column;margin:0;box-shadow:none;overflow:visible;">
      <div style="margin:-30px -30px 20px -30px;padding:20px;background:${cor.primaria};color:${cor.textoHeader || '#fff'};border-bottom:3px solid ${cor.destaque};display:flex;align-items:center;justify-content:space-between;gap:18px;page-break-inside:avoid;break-inside:avoid;">
        <div style="min-width:0;">
          <h1 style="margin:0 0 6px;font-size:24px;line-height:1.15;color:${cor.textoHeader || '#fff'};">${esc(nomeEmpresa)}</h1>
          <div style="font-size:11px;line-height:1.5;opacity:.92;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}<br>Orçamento Nº ${esc(numeroOrcamento())}</div>
        </div>
        <div style="width:96px;height:62px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${logo}</div>
      </div>

      <div style="flex:1 1 auto;">
        <div style="display:flex;justify-content:space-between;gap:25px;margin-bottom:20px;page-break-inside:avoid;break-inside:avoid;">
          <div style="width:50%;">
            <h2 style="margin:0 0 9px;font-size:22px;line-height:1.15;color:${cor.primaria};">${esc(titulo)}</h2>
            <b style="font-size:13px;color:#222;">EMISSOR:</b><br>
            <div style="font-size:12px;line-height:1.5;color:#333;"><b>${esc(nomeEmpresa)}</b><br>${responsavel ? `Responsável: ${esc(responsavel)}<br>` : ''}${empresa.telefone_empresa ? `WhatsApp: ${esc(empresa.telefone_empresa)}<br>` : ''}${empresa.endereco_empresa ? `Endereço: ${esc(empresa.endereco_empresa)}<br>` : ''}${empresa.cnpj_empresa ? `CNPJ/CPF: ${esc(empresa.cnpj_empresa)}` : ''}</div>
          </div>
          <div style="width:50%;text-align:right;font-size:12px;line-height:1.5;color:#333;"><b style="font-size:13px;color:#222;">CLIENTE:</b><br>${esc(cliente || 'Cliente não informado')}<br>${esc(telCliente)}${extrasCliente()}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;page-break-inside:auto;">
          <thead><tr style="background:${cor.primaria};"><th style="padding:10px;text-align:left;font-size:12px;color:${cor.destaque};">Item</th><th style="padding:10px;font-size:12px;color:${cor.destaque};">Qtd</th><th style="padding:10px;text-align:left;font-size:12px;color:${cor.destaque};">Unit.</th><th style="padding:10px;text-align:right;font-size:12px;color:${cor.destaque};">Subtotal</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>

        ${veiculoHtml(cor)}

        <div style="margin-top:20px;text-align:right;page-break-inside:avoid;break-inside:avoid;"><div style="display:inline-block;min-width:150px;background:${cor.fundo || '#fffaf0'};padding:15px;border:1px solid #ddd;border-radius:6px;"><span style="font-size:10px;color:#666;font-weight:bold;">VALOR TOTAL</span><br><strong style="font-size:20px;color:${cor.primaria};">${moeda(total)}</strong></div></div>
        ${validadeHtml || pagamentoHtml ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;page-break-inside:avoid;break-inside:avoid;">${validadeHtml}${pagamentoHtml}</div>` : ''}
        ${obs ? `<div style="margin-top:20px;font-size:11px;border-top:1px solid #eee;padding-top:10px;color:#333;page-break-inside:avoid;break-inside:avoid;"><b>OBSERVAÇÕES:</b><br>${esc(obs).replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <div style="margin-top:45px;padding-top:14px;border-top:1px dashed #ccc;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;page-break-inside:avoid;break-inside:avoid;"><div style="font-size:10px;color:#777;line-height:1.4;"><b>${esc(nomeEmpresa)}</b><br>${empresa.telefone_empresa ? `Contato: ${esc(empresa.telefone_empresa)}<br>` : ''}Orçamento Nº ${esc(numeroOrcamento())}</div><div style="width:240px;text-align:center;font-size:10px;color:#777;"><div style="border-top:1px solid #999;padding-top:6px;">Assinatura / Aprovação</div></div></div>
      <div style="text-align:center;font-size:10px;color:#999;margin-top:18px;">Orçamento gerado por <strong>fsorcamentos.com.br</strong></div>
    </div>`;
  }

  async function gerarPreviaCorrigida() {
    const empresa = await empresaAtual();
    if (!(empresa.nome_empresa && empresa.telefone_empresa)) {
      alert('Preencha os dados da empresa no Painel de Controle antes de gerar o orçamento.');
      location.href = '/painel.html';
      return;
    }
    if (!val('cliente')) return alert('Informe o nome do cliente.');
    const lista = itens();
    if (!lista.length) return alert('Adicione pelo menos um item ao orçamento.');

    const conteudo = document.getElementById('conteudo-pdf');
    const area = document.getElementById('area-previa');
    const botoes = document.getElementById('botoes-acao');
    if (!conteudo) return;

    conteudo.innerHTML = montarHtml(empresa, lista);
    conteudo.style.display = 'block';
    conteudo.style.background = '#fff';
    conteudo.style.overflow = 'visible';
    if (area) area.style.display = 'block';
    if (botoes) botoes.style.display = 'block';

    const fb = document.getElementById('btn-float-baixar');
    const fw = document.getElementById('btn-float-whatsapp');
    const fa = document.querySelector('.floating-actions');
    if (fb) fb.style.display = 'flex';
    if (fw) fw.style.display = 'flex';
    if (fa) fa.classList.add('show');
  }

  function aguardarImagens(el) {
    return new Promise(resolve => {
      const imgs = Array.from(el.querySelectorAll('img'));
      if (!imgs.length) return requestAnimationFrame(() => setTimeout(resolve, 250));
      let n = 0;
      const done = () => { if (++n >= imgs.length) requestAnimationFrame(() => setTimeout(resolve, 250)); };
      imgs.forEach(img => img.complete ? done() : (img.onload = img.onerror = done));
    });
  }

  async function baixarPDFCorrigido(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    if (window.__fs_pdf_gerando) return;
    window.__fs_pdf_gerando = true;

    let temp = null;
    try {
      if (typeof window.fsSalvarOrcamentoSePlanoPermitido === 'function') await window.fsSalvarOrcamentoSePlanoPermitido('download_pdf');
      else if (typeof window.salvarOrcamentoNoBanco === 'function') await window.salvarOrcamentoNoBanco('download_pdf');

      await gerarPreviaCorrigida();
      const original = document.querySelector('#conteudo-pdf .pdf-documento-a4') || document.getElementById('conteudo-pdf')?.firstElementChild;
      if (!original) return alert('Gere a pré-visualização antes de baixar o PDF.');

      temp = document.createElement('div');
      temp.id = 'fs-pdf-render-area-direto';
      temp.style.cssText = `position:absolute;left:0;top:0;width:${A4_W}px;background:#fff;z-index:2147483647;overflow:visible;margin:0;padding:0;`;
      const clone = original.cloneNode(true);
      clone.style.width = A4_W + 'px';
      clone.style.maxWidth = A4_W + 'px';
      clone.style.minHeight = A4_H + 'px';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.transform = 'none';
      clone.style.pageBreakBefore = 'auto';
      clone.style.breakBefore = 'auto';
      temp.appendChild(clone);

      document.body.classList.add('gerando-pdf');
      document.body.appendChild(temp);
      await aguardarImagens(clone);

      const h = Math.max(A4_H, Math.ceil(clone.scrollHeight || clone.offsetHeight || A4_H));
      const nome = (val('titulo') || 'orcamento').replace(/[^\wÀ-ÿ\s-]/g, '').replace(/\s+/g, '_').toLowerCase() || 'orcamento';

      await html2pdf().set({
        margin: 0,
        filename: nome + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, width: A4_W, height: h, windowWidth: A4_W, windowHeight: h },
        jsPDF: { unit: 'px', format: [A4_W, A4_H], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(clone).save();
    } catch (e) {
      console.error('Erro ao gerar PDF corrigido:', e);
      alert('Não foi possível gerar o PDF.');
    } finally {
      temp?.remove();
      document.body.classList.remove('gerando-pdf');
      window.__fs_pdf_gerando = false;
    }
  }

  function instalar() {
    window.gerarPrevia = gerarPreviaCorrigida;
    window.baixarPDF = baixarPDFCorrigido;

    ['btn-baixar', 'btn-float-baixar'].forEach(id => {
      const b = document.getElementById(id);
      if (!b || b.dataset.fsPdfFix === '1') return;
      b.dataset.fsPdfFix = '1';
      b.onclick = baixarPDFCorrigido;
      b.addEventListener('click', baixarPDFCorrigido, true);
    });
  }

  document.addEventListener('click', function (e) {
    const alvo = e.target?.closest?.('#btn-baixar, #btn-float-baixar, .btn-acao-pdf');
    if (alvo) baixarPDFCorrigido(e);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalar();
    if (++tentativas > 40) clearInterval(timer);
  }, 500);
})();
