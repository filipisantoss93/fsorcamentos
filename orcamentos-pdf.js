// FS Orçamentos - PDF profissional direto da página orcamentos.html
(function () {
  'use strict';

  function escapar(valor) {
    if (typeof window.escaparHtml === 'function') return window.escaparHtml(valor);
    return String(valor || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function moeda(valor) {
    if (typeof window.formatarMoeda === 'function') return window.formatarMoeda(valor);
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function itemNormalizado(item = {}) {
    if (typeof window.normalizarItem === 'function') return window.normalizarItem(item);
    const qtd = Number(item.qtd ?? item.quantidade ?? 1) || 0;
    const valor = Number(item.valor ?? item.valor_unitario ?? item.preco ?? 0) || 0;
    const subtotal = Number(item.subtotal ?? item.total ?? (qtd * valor)) || 0;
    return { descricao: item.descricao || item.nome || item.item || '', qtd, valor, subtotal };
  }

  function numeroOrcamento(orcamento) {
    if (typeof window.numeroOrcamentoFormatado === 'function') return window.numeroOrcamentoFormatado(orcamento);
    const numero = orcamento?.numero_orcamento || orcamento?.numero || '';
    return numero ? String(numero).padStart(6, '0') : 'PREVIA';
  }

  function statusOrcamento(status) {
    if (typeof window.statusLabel === 'function') return window.statusLabel(status);
    const mapa = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado' };
    return mapa[status] || status || 'Pendente';
  }

  function carregarHtml2Pdf() {
    return new Promise((resolve, reject) => {
      if (typeof window.html2pdf === 'function') return resolve();
      if (document.getElementById('fs-html2pdf-orcamentos')) {
        const checar = setInterval(() => {
          if (typeof window.html2pdf === 'function') {
            clearInterval(checar);
            resolve();
          }
        }, 120);
        setTimeout(() => {
          clearInterval(checar);
          if (typeof window.html2pdf === 'function') resolve();
          else reject(new Error('html2pdf não carregou.'));
        }, 8000);
        return;
      }
      const script = document.createElement('script');
      script.id = 'fs-html2pdf-orcamentos';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar html2pdf.'));
      document.head.appendChild(script);
    });
  }

  async function obterEmpresa() {
    try {
      if (!window._supabase) throw new Error('Supabase ausente.');
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sem sessão.');
      const { data, error } = await _supabase
        .from('perfis')
        .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!error && data) return data;
    } catch (erro) {
      console.warn('Empresa para PDF usando localStorage:', erro);
    }
    return {
      nome: localStorage.getItem('usuario_nome') || '',
      nome_empresa: localStorage.getItem('nome_empresa') || 'Empresa',
      telefone_empresa: localStorage.getItem('telefone_empresa') || '',
      endereco_empresa: localStorage.getItem('endereco_empresa') || '',
      cnpj_empresa: localStorage.getItem('cnpj_empresa') || '',
      foto_url: localStorage.getItem('foto_url') || ''
    };
  }

  function linhasItens(itens) {
    const lista = Array.isArray(itens) ? itens.map(itemNormalizado) : [];
    if (!lista.length) {
      return '<tr><td colspan="4" style="padding:12px;text-align:center;color:#777;">Nenhum item detalhado salvo.</td></tr>';
    }

    return lista.map((item, indice) => `
      <tr style="background:${indice % 2 === 0 ? '#fff' : '#f8f8f8'};border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px;font-size:12px;color:#222;">${escapar(item.descricao)}</td>
        <td style="padding:10px;text-align:center;font-size:12px;color:#222;">${escapar(item.qtd)}</td>
        <td style="padding:10px;font-size:12px;color:#222;">${moeda(item.valor)}</td>
        <td style="padding:10px;text-align:right;font-size:12px;font-weight:bold;color:#222;">${moeda(item.subtotal)}</td>
      </tr>
    `).join('');
  }

  function montarHtml(orcamento, empresa) {
    const corPrimaria = getComputedStyle(document.documentElement).getPropertyValue('--fs-marrom')?.trim() || '#3e2723';
    const corDestaque = getComputedStyle(document.documentElement).getPropertyValue('--fs-amarelo')?.trim() || '#ffc400';
    const nomeEmpresa = empresa?.nome_empresa || empresa?.nome || localStorage.getItem('nome_empresa') || 'Empresa';
    const titulo = orcamento?.assunto || 'ORÇAMENTO';
    const numero = numeroOrcamento(orcamento);
    const logoHtml = empresa?.foto_url
      ? `<img src="${escapar(empresa.foto_url)}" crossorigin="anonymous" style="max-width:128px;max-height:58px;object-fit:contain;">`
      : `<strong style="font-size:22px;color:${corPrimaria};">FS</strong>`;

    return `
      <div style="width:794px;min-height:1123px;box-sizing:border-box;padding:30px;background:#fff;font-family:Arial,sans-serif;color:#222;">
        <div style="margin:-30px -30px 18px -30px;padding:18px 24px;background:${corPrimaria};color:#fff;border-bottom:4px solid ${corDestaque};display:flex;align-items:center;justify-content:space-between;gap:18px;">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;">
            <div style="width:82px;height:62px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${logoHtml}</div>
            <div>
              <h1 style="margin:0;font-size:24px;line-height:1.15;color:#fff;">${escapar(nomeEmpresa)}</h1>
              <div style="font-size:11px;line-height:1.45;opacity:.92;">
                ${empresa?.telefone_empresa ? `WhatsApp: ${escapar(empresa.telefone_empresa)}<br>` : ''}
                ${empresa?.cnpj_empresa ? `CNPJ/CPF: ${escapar(empresa.cnpj_empresa)}` : ''}
              </div>
            </div>
          </div>
          <div style="text-align:right;font-size:11px;line-height:1.45;white-space:nowrap;">Gerado em<br><b>${new Date().toLocaleDateString('pt-BR')}</b><br>Nº ${escapar(numero)}</div>
        </div>

        <div style="background:#f7f2ea;border-left:6px solid ${corDestaque};border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;">
          <div style="width:55%;">
            <h2 style="margin:0 0 8px;color:${corPrimaria};font-size:22px;line-height:1.15;">${escapar(titulo)}</h2>
            <div style="font-size:11px;line-height:1.5;color:#333;">
              <b>EMISSOR</b><br>${escapar(nomeEmpresa)}<br>
              ${empresa?.telefone_empresa ? `WhatsApp: ${escapar(empresa.telefone_empresa)}<br>` : ''}
              ${empresa?.endereco_empresa ? `Endereço: ${escapar(empresa.endereco_empresa)}<br>` : ''}
              ${empresa?.cnpj_empresa ? `CNPJ/CPF: ${escapar(empresa.cnpj_empresa)}` : ''}
            </div>
          </div>
          <div style="width:45%;text-align:right;font-size:12px;line-height:1.5;color:#333;">
            <b>CLIENTE</b><br>${escapar(orcamento?.cliente_nome || 'Cliente não informado')}<br>${escapar(orcamento?.cliente_whatsapp || '')}<br>
            <b>Status:</b> ${escapar(statusOrcamento(orcamento?.status || 'pendente'))}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead><tr style="background:${corPrimaria};color:#fff;"><th style="padding:10px;text-align:left;font-size:12px;">Item</th><th style="padding:10px;text-align:center;font-size:12px;">Qtd</th><th style="padding:10px;text-align:left;font-size:12px;">Unit.</th><th style="padding:10px;text-align:right;font-size:12px;">Subtotal</th></tr></thead>
          <tbody>${linhasItens(orcamento?.itens)}</tbody>
        </table>

        <div style="margin-top:22px;text-align:right;"><div style="display:inline-block;min-width:190px;background:#f7f2ea;border:1px solid #e0d6c8;border-radius:10px;padding:14px;"><span style="font-size:10px;color:#666;font-weight:bold;">VALOR TOTAL</span><br><strong style="font-size:22px;color:${corPrimaria};">${moeda(Number(orcamento?.total || 0))}</strong></div></div>
        <div style="margin-top:44px;display:flex;justify-content:space-between;gap:30px;align-items:flex-end;"><div style="font-size:10px;color:#777;line-height:1.45;"><b>${escapar(nomeEmpresa)}</b><br>Orçamento Nº ${escapar(numero)}</div><div style="width:240px;text-align:center;font-size:10px;color:#777;"><div style="border-top:1px solid #999;padding-top:6px;">Assinatura / Aprovação</div></div></div>
      </div>
    `;
  }

  function encontrarOrcamentoVisualizado() {
    const id = typeof orcamentoVisualizadoId !== 'undefined' ? orcamentoVisualizadoId : null;
    const lista = typeof orcamentosCacheOriginal !== 'undefined' ? orcamentosCacheOriginal : [];
    return lista.find(o => String(o.id) === String(id));
  }

  async function baixarPdfOrcamentoVisualizado() {
    const orcamento = encontrarOrcamentoVisualizado();
    if (!orcamento) {
      alert('Orçamento não encontrado para gerar PDF. Abra um orçamento novamente.');
      return;
    }

    try {
      await carregarHtml2Pdf();
      const empresa = await obterEmpresa();
      const area = document.createElement('div');
      area.style.position = 'fixed';
      area.style.left = '0';
      area.style.top = '0';
      area.style.width = '794px';
      area.style.opacity = '0.01';
      area.style.zIndex = '-1';
      area.style.background = '#ffffff';
      area.innerHTML = montarHtml(orcamento, empresa);

      document.body.classList.add('gerando-pdf');
      document.body.appendChild(area);

      await html2pdf().set({
        margin: 0,
        filename: `orcamento-${numeroOrcamento(orcamento)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(area.firstElementChild).save();

      area.remove();
      document.body.classList.remove('gerando-pdf');
    } catch (erro) {
      console.error('Erro ao gerar PDF do orçamento salvo:', erro);
      document.body.classList.remove('gerando-pdf');
      alert('Não foi possível gerar o PDF deste orçamento.');
    }
  }

  function adicionarBotaoPdf() {
    if (document.getElementById('btn-pdf-orcamento-visualizado')) return;
    const modal = document.querySelector('#modal-visualizar-orcamento .botoes-modal');
    if (!modal) return;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.id = 'btn-pdf-orcamento-visualizado';
    botao.className = 'btn-pequeno btn-acao-pdf';
    botao.textContent = 'Baixar PDF';
    botao.onclick = baixarPdfOrcamentoVisualizado;

    const gerarOS = document.getElementById('btn-gerar-os-visualizado');
    if (gerarOS) modal.insertBefore(botao, gerarOS);
    else modal.appendChild(botao);
  }

  window.baixarPdfOrcamentoVisualizado = baixarPdfOrcamentoVisualizado;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', adicionarBotaoPdf);
  else adicionarBotaoPdf();
})();
