/* FS ORÇAMENTOS — veiculos-ficha-link.js
   Faz cards/linhas de veículos abrirem veiculo.html?id=...
   sem interferir nos botões internos de editar, excluir e ações.
*/
(function(){
  'use strict';

  function inserirCss(){
    if(document.getElementById('fs-veiculos-ficha-link-css')) return;
    const style=document.createElement('style');
    style.id='fs-veiculos-ficha-link-css';
    style.textContent=`
      [data-veiculo-id], .veiculo-item, .veiculo-card { cursor:pointer!important; }
      [data-veiculo-id]:hover, .veiculo-item:hover, .veiculo-card:hover { border-color:#ffc400!important; box-shadow:0 6px 18px rgba(62,39,35,.14)!important; }
      .veiculo-ficha-selo{display:inline-flex;margin-left:7px;padding:3px 6px;border-radius:999px;background:#f8f4ee;border:1px solid #e4d8cc;color:#3e2723;font-size:9px;font-weight:950;text-transform:uppercase;vertical-align:middle;}
    `;
    document.head.appendChild(style);
  }

  function obterIdVeiculo(el){
    if(!el) return '';
    if(el.dataset?.veiculoId) return el.dataset.veiculoId;
    const btn=el.querySelector('[onclick*="editarVeiculo"], [onclick*="excluirVeiculo"], [onclick*="inativarVeiculo"]');
    const onclick=btn?.getAttribute('onclick') || el.getAttribute('onclick') || '';
    const match=onclick.match(/Veiculo\(['"]([^'"]+)['"]\)/i) || onclick.match(/veiculo\(['"]([^'"]+)['"]\)/i);
    return match ? match[1] : '';
  }

  function ehAcao(event){
    return !!event.target.closest('button,a,input,select,textarea,label,.veiculo-acoes,.acoes-veiculo,.card-acoes,.acoes');
  }

  function abrirFicha(id){
    if(!id) return;
    window.location.href=`/veiculo.html?id=${encodeURIComponent(id)}`;
  }

  function preparar(){
    document.querySelectorAll('[data-veiculo-id], .veiculo-item, .veiculo-card').forEach(card=>{
      const id=obterIdVeiculo(card);
      if(!id || card.dataset.fichaVeiculoOk==='1') return;
      card.dataset.fichaVeiculoOk='1';
      card.dataset.veiculoId=id;
      card.setAttribute('role','link');
      card.setAttribute('tabindex','0');
      card.setAttribute('title','Abrir ficha completa do veículo');
      const titulo=card.querySelector('h3,strong,.veiculo-titulo');
      if(titulo && !titulo.querySelector('.veiculo-ficha-selo')){
        const selo=document.createElement('span');
        selo.className='veiculo-ficha-selo';
        selo.textContent='Ver ficha';
        titulo.appendChild(selo);
      }
    });
  }

  function configurarEventos(){
    document.addEventListener('click',event=>{
      const card=event.target.closest('[data-veiculo-id], .veiculo-item, .veiculo-card');
      if(!card || ehAcao(event)) return;
      abrirFicha(obterIdVeiculo(card));
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter' && event.key!==' ') return;
      const card=event.target.closest?.('[data-veiculo-id], .veiculo-item, .veiculo-card');
      if(!card) return;
      event.preventDefault();
      abrirFicha(obterIdVeiculo(card));
    });
  }

  function iniciar(){
    inserirCss();
    configurarEventos();
    preparar();
    new MutationObserver(preparar).observe(document.documentElement,{childList:true,subtree:true});
    setInterval(preparar,1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();

  window.abrirFichaVeiculo=abrirFicha;
})();