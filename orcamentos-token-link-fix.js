/* FS Orçamentos — links públicos por token na lista de orçamentos */
(function(){
  'use strict';

  function cache(){
    return Array.isArray(window.orcamentosCache) ? window.orcamentosCache : [];
  }

  function acharOrcamento(ref){
    if(ref && typeof ref === 'object') return ref;
    const id = String(ref || '').trim();
    if(!id) return null;
    return cache().find(o => String(o.id) === id) || null;
  }

  function linkPublico(ref){
    const o = acharOrcamento(ref);
    const token = String(o?.public_token || '').trim();
    if(token) return `${location.origin}/ver.html?token=${encodeURIComponent(token)}`;
    const id = String(o?.id || ref || '').trim();
    return id ? `${location.origin}/ver.html?id=${encodeURIComponent(id)}` : `${location.origin}/ver.html`;
  }

  function instalarHelper(){
    window.fsLinkPublicoOrcamento = linkPublico;
    window.montarLinkOrcamento = linkPublico;
  }

  function corrigirLinksRenderizados(){
    document.querySelectorAll('a[href*="ver.html?id="]').forEach(a => {
      try{
        const url = new URL(a.getAttribute('href'), location.origin);
        const id = url.searchParams.get('id');
        const novo = linkPublico(id);
        if(novo && novo !== a.href) a.href = novo;
      }catch(_){ }
    });
  }

  function corrigirModalAberto(){
    const id = window.orcamentoVisualizadoId;
    const orcamento = acharOrcamento(id);
    if(!orcamento) return;
    const link = linkPublico(orcamento);

    document.querySelectorAll('#modal-orcamento-body a[href*="ver.html"], #modal-visualizar-orcamento a[href*="ver.html"]').forEach(a => {
      a.href = link;
    });

    document.querySelectorAll('#modal-orcamento-body .fs-orc-info-card, #modal-visualizar-orcamento .fs-orc-info-card').forEach(card => {
      const titulo = (card.querySelector('strong')?.textContent || '').toLowerCase();
      if(titulo.includes('link')){
        const span = card.querySelector('span');
        if(span) span.textContent = link;
      }
    });
  }

  function instalarClipboardSeguro(){
    if(window.copiarLinkOrcamento?.__fsTokenPublico) return;
    window.copiarLinkOrcamento = async function(id){
      const link = linkPublico(id);
      try{
        await navigator.clipboard.writeText(link);
        alert('Link copiado com sucesso.');
      }catch(_){
        prompt('Copie o link do orçamento:', link);
      }
    };
    window.copiarLinkOrcamento.__fsTokenPublico = true;
  }

  function instalarWhatsappSeguro(){
    if(window.enviarWhatsAppOrcamentoVisualizado?.__fsTokenPublico) return;
    window.enviarWhatsAppOrcamentoVisualizado = function(){
      const orcamento = acharOrcamento(window.orcamentoVisualizadoId);
      if(!orcamento) return alert('Abra um orçamento primeiro.');
      const telefoneBruto = String(orcamento.cliente_whatsapp || orcamento.cliente_telefone || orcamento.telefone_cliente || orcamento.telefone || '').replace(/\D/g, '');
      const telefone = telefoneBruto ? (telefoneBruto.startsWith('55') ? telefoneBruto : `55${telefoneBruto}`) : '';
      const numero = orcamento.numero_orcamento ? `Nº ${String(orcamento.numero_orcamento).padStart(6,'0')}` : 'orçamento';
      const cliente = orcamento.cliente_nome || orcamento.nome_cliente || orcamento.cliente || 'cliente';
      const total = Number(orcamento.total || orcamento.valor_total || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
      const link = linkPublico(orcamento);
      const msg = `Olá, ${cliente}! Segue seu orçamento ${numero} no valor de ${total}: ${link}`;
      const url = telefone ? `https://wa.me/${telefone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener');
    };
    window.enviarWhatsAppOrcamentoVisualizado.__fsTokenPublico = true;
  }

  function instalarModalSeguro(){
    if(window.__fsOrcamentosTokenModalInstalado) return;
    if(typeof window.abrirModalVisualizar !== 'function') return;
    const original = window.abrirModalVisualizar;
    window.abrirModalVisualizar = function(){
      const retorno = original.apply(this, arguments);
      setTimeout(corrigirModalAberto, 30);
      setTimeout(corrigirModalAberto, 250);
      return retorno;
    };
    window.__fsOrcamentosTokenModalInstalado = true;
  }

  function instalar(){
    instalarHelper();
    instalarClipboardSeguro();
    instalarWhatsappSeguro();
    instalarModalSeguro();
    corrigirLinksRenderizados();
    corrigirModalAberto();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalar();
    if(++tentativas > 40) clearInterval(timer);
  }, 500);
})();
