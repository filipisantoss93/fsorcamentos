/* FS ORÇAMENTOS — clientes-ficha-link.js
   Faz o card/linha do cliente abrir a ficha completa cliente.html?id=...
   sem interferir nos botões internos de editar, excluir, WhatsApp, OS etc.
*/
(function(){
  'use strict';

  function inserirCss(){
    if(document.getElementById('fs-clientes-ficha-link-css')) return;
    const style=document.createElement('style');
    style.id='fs-clientes-ficha-link-css';
    style.textContent=`
      .cliente-item{cursor:pointer!important;position:relative!important;}
      .cliente-item:hover{border-color:#ffc400!important;box-shadow:0 6px 18px rgba(62,39,35,.14)!important;}
      .cliente-item .cliente-info h3::after{content:' Ver ficha';display:inline-flex;margin-left:7px;padding:3px 6px;border-radius:999px;background:#f8f4ee;border:1px solid #e4d8cc;color:#3e2723;font-size:9px;font-weight:950;text-transform:uppercase;vertical-align:middle;}
    `;
    document.head.appendChild(style);
  }

  function ehElementoAcao(event){
    return !!event.target.closest('button,a,input,select,textarea,label,.cliente-acoes');
  }

  function abrirFichaCliente(id){
    if(!id) return;
    window.location.href=`/cliente.html?id=${encodeURIComponent(id)}`;
  }

  function configurarClique(){
    document.addEventListener('click',function(event){
      const card=event.target.closest('.cliente-item[data-cliente-id]');
      if(!card) return;
      if(ehElementoAcao(event)) return;
      abrirFichaCliente(card.dataset.clienteId);
    });

    document.addEventListener('keydown',function(event){
      if(event.key!=='Enter' && event.key!==' ') return;
      const card=event.target.closest?.('.cliente-item[data-cliente-id]');
      if(!card) return;
      event.preventDefault();
      abrirFichaCliente(card.dataset.clienteId);
    });
  }

  function prepararCards(){
    document.querySelectorAll('.cliente-item[data-cliente-id]').forEach(card=>{
      if(card.dataset.fichaLinkOk==='1') return;
      card.dataset.fichaLinkOk='1';
      card.setAttribute('role','link');
      card.setAttribute('tabindex','0');
      card.setAttribute('title','Abrir ficha completa do cliente');
    });
  }

  function iniciar(){
    inserirCss();
    configurarClique();
    prepararCards();
    new MutationObserver(prepararCards).observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();

  window.abrirFichaCliente=function(id){abrirFichaCliente(id)};
})();