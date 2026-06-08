/* =========================================================
   FS ORÇAMENTOS - ordem-pdf-extras.js
   Gera PDF da OS incluindo fotos e assinatura do cliente.
   Este script intercepta o botão Gerar PDF da ordem.html.
   ========================================================= */
(function () {
  'use strict';

  function obterOrdemId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('ordem_id') || params.get('os_id') || localStorage.getItem('ultima_os_aberta_id') || '';
  }

  function storageKey() {
    return `fs_ordem_extras_${obterOrdemId()}`;
  }

  function texto(id, fallback = '-') {
    const valor = document.getElementById(id)?.textContent?.trim();
    return valor || fallback;
  }

  function valorInput(id, fallback = '') {
    const valor = document.getElementById(id)?.value?.trim();
    return valor || fallback;
  }

  function lerLocal() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function normalizarFotos(lista) {
    if (!Array.isArray(lista)) return [];
    return lista
      .filter(f => f && (f.dataUrl || f.url))
      .map(f => ({
        nome: f.nome || f.name || 'foto.jpg',
        dataUrl: f.dataUrl || f.url
      }))
      .slice(0, 5);
  }

  async function obterUsuarioId() {
    try {
      if (!window._supabase && typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
      }
      if (!window._supabase) return null;
      const { data: { session } } = await window._supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (_) {
      return null;
    }
  }

  async function carregarExtras() {
    const local = lerLocal();
    const ordemId = obterOrdemId();
    const userId = await obterUsuarioId();
    let remoto = null;

    if (ordemId && userId && window._supabase) {
      try {
        const { data, error } = await window._supabase
          .from('ordens_servico')
          .select('fotos_antes, assinatura_cliente_data_url, assinatura_cliente_nome, assinatura_cliente_em')
          .eq('id', ordemId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) remoto = data;
      } catch (_) {}
    }

    const previewAssinatura = document.getElementById('assinatura-cliente-preview')?.src || '';
    const canvas = document.getElementById('canvas-assinatura-cliente');
    let canvasAssinatura = '';

    try {
      if (canvas) canvasAssinatura = canvas.toDataURL('image/png');
    } catch (_) {}

    const assinatura =
      remoto?.assinatura_cliente_data_url ||
      local.assinatura_cliente_data_url ||
      (previewAssinatura && previewAssinatura.startsWith('data:image') ? previewAssinatura : '') ||
      (canvasAssinatura && canvasAssinatura.startsWith('data:image') ? canvasAssinatura : '');

    const nomeAssinatura =
      remoto?.assinatura_cliente_nome ||
      local.assinatura_cliente_nome ||
      valorInput('assinatura-cliente-nome', texto('detalhe-cliente-nome', 'Cliente'));

    return {
      fotos: normalizarFotos(remoto?.fotos_antes).length ? normalizarFotos(remoto?.fotos_antes) : normalizarFotos(local.fotos_antes),
      assinatura,
      nomeAssinatura
    };
  }

  function formatarNomeArquivo(valor) {
    return String(valor || 'os')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'os';
  }

  function imagemTipo(dataUrl) {
    if (String(dataUrl).startsWith('data:image/png')) return 'PNG';
    return 'JPEG';
  }

  function adicionarImagemSegura(doc, dataUrl, tipo, x, y, w, h) {
    try {
      doc.addImage(dataUrl, tipo || imagemTipo(dataUrl), x, y, w, h);
      return true;
    } catch (erro) {
      console.warn('Não foi possível inserir imagem no PDF:', erro);
      return false;
    }
  }

  function mostrarMensagem(textoMsg, tipo = 'info') {
    if (typeof window.mostrarMensagemOrdem === 'function') {
      window.mostrarMensagemOrdem(textoMsg, tipo);
      return;
    }
    const el = document.getElementById('mensagem-ordem');
    if (el) {
      el.className = `mensagem-ordem ${tipo}`;
      el.textContent = textoMsg;
    }
  }

  function coletarItensDaTela() {
    const itens = [];
    document.querySelectorAll('#lista-itens-ordem .item-ordem-card, #lista-itens-ordem .ordem-item, #lista-itens-ordem article, #lista-itens-ordem .card').forEach((el) => {
      const textoItem = el.textContent?.replace(/\s+/g, ' ').trim();
      if (textoItem && !textoItem.toLowerCase().includes('nenhum item')) itens.push(textoItem);
    });
    return itens.slice(0, 20);
  }

  async function gerarPDFOrdemComExtras() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Biblioteca jsPDF não carregada.');
      return;
    }

    const btn = document.getElementById('btn-pdf-ordem');
    const textoOriginal = btn?.textContent || 'Gerar PDF';

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Gerando PDF...';
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const extras = await carregarExtras();

      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const m = 12;
      const usable = W - m * 2;
      let y = m;

      function pageCheck(need = 20) {
        if (y + need <= H - 16) return;
        rodape();
        doc.addPage();
        y = m;
        cabecalhoSimples();
      }

      function rodape() {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text('Gerado pelo FS Orçamentos', m, H - 8);
        doc.text(String(doc.internal.getNumberOfPages()), W - m, H - 8, { align: 'right' });
      }

      function cabecalhoSimples() {
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, W, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('FS Orçamentos • Ordem de Serviço', m, 5.5);
        y = 15;
      }

      function secao(titulo) {
        pageCheck(14);
        doc.setFillColor(0, 0, 0);
        doc.roundedRect(m, y, usable, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(titulo, m + 3, y + 5.5);
        y += 12;
      }

      function bloco(rotulo, valor, alturaMin = 15) {
        const linhas = doc.splitTextToSize(String(valor || '-'), usable - 8);
        const h = Math.max(alturaMin, 9 + linhas.length * 4.3);
        pageCheck(h + 4);
        doc.setDrawColor(160, 160, 160);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(m, y, usable, h, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(rotulo, m + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(linhas, m + 3, y + 10);
        y += h + 4;
      }

      function linhaInfo(colunas) {
        const gap = 3;
        const colW = (usable - gap * (colunas.length - 1)) / colunas.length;
        const h = 18;
        pageCheck(h + 4);
        colunas.forEach((item, i) => {
          const x = m + i * (colW + gap);
          doc.setDrawColor(170, 170, 170);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x, y, colW, h, 2, 2, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(item.rotulo, x + 2.5, y + 5);
          doc.setFontSize(8.5);
          doc.setTextColor(0, 0, 0);
          doc.text(doc.splitTextToSize(String(item.valor || '-'), colW - 5), x + 2.5, y + 10);
        });
        y += h + 4;
      }

      // Cabeçalho principal
      doc.setFillColor(0, 0, 0);
      doc.roundedRect(m, y, usable, 28, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ORDEM DE SERVIÇO', m + 4, y + 10);
      doc.setFontSize(10);
      doc.text(texto('detalhe-numero-os', 'OS Nº 000000'), m + 4, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString('pt-BR'), W - m - 4, y + 10, { align: 'right' });
      y += 34;

      secao('DADOS PRINCIPAIS');
      linhaInfo([
        { rotulo: 'Cliente', valor: texto('detalhe-cliente-nome') },
        { rotulo: 'WhatsApp', valor: texto('detalhe-cliente-whatsapp') }
      ]);
      linhaInfo([
        { rotulo: 'Status', valor: texto('detalhe-status-os') },
        { rotulo: 'Pagamento', valor: texto('detalhe-status-pagamento-os') },
        { rotulo: 'Responsável', valor: texto('detalhe-responsavel-os') }
      ]);
      linhaInfo([
        { rotulo: 'Abertura', valor: texto('detalhe-data-abertura-os') },
        { rotulo: 'Previsão', valor: texto('detalhe-data-prevista-os') },
        { rotulo: 'Conclusão', valor: texto('detalhe-data-conclusao-os') }
      ]);

      secao('VEÍCULO');
      linhaInfo([
        { rotulo: 'Placa', valor: texto('detalhe-veiculo-placa') },
        { rotulo: 'Marca', valor: texto('detalhe-veiculo-marca') },
        { rotulo: 'Modelo', valor: texto('detalhe-veiculo-modelo') }
      ]);

      secao('SOLICITAÇÃO E SERVIÇO');
      bloco('Solicitação / problema', texto('detalhe-descricao-problema', 'Não informado.'));
      bloco('Serviço a executar', texto('detalhe-descricao-servico', 'Não informado.'));

      secao('ITENS / SERVIÇOS / PEÇAS');
      const itens = coletarItensDaTela();
      if (itens.length) itens.forEach((item, i) => bloco(`Item ${i + 1}`, item, 12));
      else bloco('Itens', 'Nenhum item detalhado encontrado na tela.');

      secao('VALORES E PAGAMENTO');
      linhaInfo([
        { rotulo: 'Mão de obra', valor: texto('detalhe-valor-mao-obra') },
        { rotulo: 'Materiais/peças', valor: texto('detalhe-valor-materiais') },
        { rotulo: 'Desconto', valor: texto('detalhe-desconto') }
      ]);
      linhaInfo([
        { rotulo: 'Valor pago', valor: texto('detalhe-valor-pago') },
        { rotulo: 'Saldo restante', valor: texto('detalhe-saldo-restante') },
        { rotulo: 'Forma', valor: texto('detalhe-forma-pagamento') }
      ]);
      doc.setFillColor(0, 0, 0);
      doc.roundedRect(m, y, usable, 16, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL DA OS', m + 4, y + 10);
      doc.setFontSize(15);
      doc.text(texto('detalhe-valor-total', 'R$ 0,00'), W - m - 4, y + 10, { align: 'right' });
      y += 22;

      secao('GARANTIA');
      linhaInfo([
        { rotulo: 'Garantia', valor: texto('detalhe-garantia-dias') },
        { rotulo: 'Validade', valor: texto('detalhe-garantia-validade') }
      ]);
      bloco('Observações da garantia', texto('detalhe-garantia-observacoes', 'Nenhuma observação.'));

      if (extras.fotos.length) {
        secao('FOTOS ANTES DO SERVIÇO');
        const imgW = (usable - 6) / 2;
        const imgH = 58;
        extras.fotos.forEach((foto, index) => {
          if (index % 2 === 0) pageCheck(imgH + 16);
          const x = m + (index % 2) * (imgW + 6);
          const posY = y;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(70, 70, 70);
          doc.text(`Foto ${index + 1}`, x, posY);
          adicionarImagemSegura(doc, foto.dataUrl, imagemTipo(foto.dataUrl), x, posY + 3, imgW, imgH);
          if (index % 2 === 1 || index === extras.fotos.length - 1) y += imgH + 10;
        });
      }

      secao('ASSINATURAS');
      pageCheck(55);
      const assW = (usable - 12) / 2;
      const assY = y;

      doc.setDrawColor(110, 110, 110);
      doc.roundedRect(m, assY, assW, 36, 2, 2, 'S');
      doc.roundedRect(m + assW + 12, assY, assW, 36, 2, 2, 'S');

      if (extras.assinatura && String(extras.assinatura).startsWith('data:image')) {
        adicionarImagemSegura(doc, extras.assinatura, imagemTipo(extras.assinatura), m + 4, assY + 4, assW - 8, 22);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Assinatura do cliente', m + assW / 2, assY + 30, { align: 'center' });
      doc.text('Assinatura do consultor técnico', m + assW + 12 + assW / 2, assY + 30, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(extras.nomeAssinatura || texto('detalhe-cliente-nome', 'Cliente'), m + assW / 2, assY + 34, { align: 'center' });
      doc.text(texto('detalhe-responsavel-os', 'Consultor Técnico'), m + assW + 12 + assW / 2, assY + 34, { align: 'center' });
      y += 44;

      rodape();
      const nomeArquivo = formatarNomeArquivo(texto('detalhe-numero-os', 'ordem-servico'));
      doc.save(`${nomeArquivo}.pdf`);
      mostrarMensagem('PDF da OS gerado com fotos e assinatura.', 'sucesso');
    } catch (erro) {
      console.error('Erro ao gerar PDF com extras:', erro);
      mostrarMensagem('Não foi possível gerar o PDF com assinatura. Verifique se a assinatura foi salva.', 'erro');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    }
  }

  function instalarInterceptadorPDF() {
    const btn = document.getElementById('btn-pdf-ordem');
    if (!btn || btn.dataset.fsPdfExtras === '1') return;

    btn.dataset.fsPdfExtras = '1';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      gerarPDFOrdemComExtras();
    }, true);
  }

  function iniciar() {
    instalarInterceptadorPDF();
    setTimeout(instalarInterceptadorPDF, 600);
    setTimeout(instalarInterceptadorPDF, 1600);
  }

  window.gerarPDFOrdemComExtras = gerarPDFOrdemComExtras;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
