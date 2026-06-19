/* FS Orçamentos — Estoque integrado ao Fluxo de Caixa
   Renomeia a entrada manual para Compra/Reposição e reforça que gera saída no caixa.
   Mantém o tipo técnico "entrada" para compatibilidade com a RPC registrar_movimentacao_estoque.
*/
(function(){
  'use strict';

  function inserirCss(){
    if(document.getElementById('fs-estoque-compra-caixa-css')) return;
    const style=document.createElement('style');
    style.id='fs-estoque-compra-caixa-css';
    style.textContent=`
      .estoque-produto-botoes button.verde{
        background:#166534!important;
        color:#fff!important;
        border-color:#166534!important;
      }
      .fs-aviso-compra-caixa{
        display:block;
        margin-top:6px;
        padding:7px 8px;
        border-radius:6px;
        border:1px solid #bbf7d0;
        background:#f0fdf4;
        color:#166534;
        font-size:11.5px;
        line-height:1.35;
        font-weight:850;
      }
    `;
    document.head.appendChild(style);
  }

  function renomearBotoesEntrada(){
    document.querySelectorAll('.estoque-produto-botoes button.verde').forEach((btn)=>{
      const onclick=String(btn.getAttribute('onclick')||'');
      if(!onclick.includes("'entrada'") && !onclick.includes('"entrada"')) return;
      if(btn.dataset.fsCompraCaixaOk==='1') return;
      btn.dataset.fsCompraCaixaOk='1';
      btn.textContent='Compra/Reposição';
      btn.title='Registrar compra ou reposição. Se informar valor, gera saída no Fluxo de Caixa.';
    });
  }

  function reforcarModal(){
    const modal=document.getElementById('modal-movimentacao-estoque');
    const tipo=document.getElementById('movimentacao-tipo')?.value||'';
    if(!modal || !modal.classList.contains('ativo') || tipo!=='entrada') return;

    const titulo=document.getElementById('titulo-modal-movimentacao');
    const btn=document.getElementById('btn-confirmar-movimentacao');
    const campoValor=document.getElementById('movimentacao-valor-unitario');

    if(titulo) titulo.textContent='Compra/Reposição de estoque';
    if(btn) btn.textContent='Registrar compra';
    if(campoValor) campoValor.placeholder='Valor de custo unitário';

    let aviso=document.getElementById('fs-aviso-compra-caixa');
    const destino=document.getElementById('movimentacao-observacao')?.closest?.('.campo') || document.getElementById('movimentacao-observacao')?.parentElement;
    if(!aviso && destino){
      aviso=document.createElement('span');
      aviso.id='fs-aviso-compra-caixa';
      aviso.className='fs-aviso-compra-caixa';
      destino.appendChild(aviso);
    }
    if(aviso) aviso.textContent='Ao registrar uma compra/reposição com valor, o sistema lança automaticamente uma saída no Fluxo de Caixa.';
  }

  function sobrescreverTextosGlobais(){
    try{
      window.tituloMovimentacaoEstoque=function(tipo){
        const mapa={entrada:'Compra/Reposição de estoque',saida:'Saída de estoque',ajuste:'Ajuste de estoque'};
        return mapa[tipo]||'Movimentar estoque';
      };
      window.textoBotaoMovimentacaoEstoque=function(tipo){
        const mapa={entrada:'Registrar compra',saida:'Confirmar saída',ajuste:'Confirmar ajuste'};
        return mapa[tipo]||'Confirmar';
      };
      window.descricaoPadraoMovimentacaoEstoque=function(tipo){
        const mapa={entrada:'Compra/reposição manual de estoque',saida:'Saída manual de estoque',ajuste:'Ajuste manual de estoque'};
        return mapa[tipo]||'Movimentação manual de estoque';
      };
    }catch(_){ }
  }

  function iniciar(){
    inserirCss();
    sobrescreverTextosGlobais();
    renomearBotoesEntrada();
    reforcarModal();
    new MutationObserver(()=>{
      renomearBotoesEntrada();
      reforcarModal();
    }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','value']});
    setInterval(()=>{renomearBotoesEntrada();reforcarModal();},800);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();