/* FS Orçamentos — pré-preenchimento de OS gerada por recorrência */
(function(){
  'use strict';

  function qs(){return new URLSearchParams(location.search)}
  function set(id,v){const el=document.getElementById(id);if(el&&!el.value)el.value=v||''}
  function abrirForm(){
    const card=document.getElementById('card-form-ordem');
    if(card)card.classList.remove('form-fechado');
    const btn=document.getElementById('btn-toggle-form-ordem');
    if(btn)btn.textContent='Fechar';
  }
  function aplicar(){
    const p=qs();
    const origem=p.get('origem_recorrente')||'';
    if(!origem)return;
    const titulo=p.get('titulo')||'Manutenção preventiva';
    set('ordem-titulo',titulo);
    set('ordem-status','aberta');
    set('ordem-descricao-problema','Serviço gerado a partir de manutenção preventiva/recorrente.');
    set('ordem-descricao-servico',titulo);
    const obs=`Origem: serviço recorrente ${origem}.\nConfira cliente, veículo, descrição e salve a OS.`;
    set('ordem-observacoes-internas',obs);
    abrirForm();
    const msg=document.getElementById('mensagem-ordens-form');
    if(msg){msg.className='mensagem info';msg.textContent='Recorrência carregada. Confira os dados e clique em Salvar OS.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,900));else setTimeout(aplicar,900);
})();