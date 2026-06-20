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

  function instalar(){
    instalarHelper();
    instalarClipboardSeguro();
    corrigirLinksRenderizados();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalar();
    if(++tentativas > 40) clearInterval(timer);
  }, 500);
})();
