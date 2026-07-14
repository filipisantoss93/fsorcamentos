(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const character=$('efex-character');
  const status=$('efex-character-status');
  const progress=$('efex-progress');
  const error=$('efex-error');
  const result=$('efex-diagnostico-card');
  const form=$('efex-form');
  const symptom=$('efex-sintoma');
  const counter=$('efex-sintoma-count');
  const dropzone=$('efex-dropzone');
  const input=$('efex-fotos');

  const STATES={
    recepcao:{src:'/assets/img/efex/efex-recepcao.png',label:'Pronto para analisar',tone:''},
    analisando:{src:'/assets/img/efex/efex-analisando.png',label:'Analisando o veículo...',tone:'busy'},
    pronto:{src:'/assets/img/efex/efex-pronto.png',label:'Análise concluída',tone:''},
    erro:{src:'/assets/img/efex/efex-erro.png',label:'Não foi possível concluir',tone:'error'},
    orcamento:{src:'/assets/img/efex/efex-orcamento.png',label:'Orçamento preparado',tone:''}
  };

  let current='recepcao';
  const available=new Map();

  function preload(name){
    const state=STATES[name];
    if(!state||available.has(name))return;
    const image=new Image();
    image.onload=()=>available.set(name,state.src);
    image.onerror=()=>available.set(name,null);
    image.src=state.src;
  }

  function setState(name){
    const state=STATES[name]||STATES.recepcao;
    current=name;
    if(status){
      status.classList.remove('busy','error');
      if(state.tone)status.classList.add(state.tone);
      const label=status.querySelector('span:last-child');
      if(label)label.textContent=state.label;
    }
    if(!character)return;
    const next=available.get(name);
    if(!next){
      character.dataset.state=name;
      return;
    }
    if(character.src.endsWith(next))return;
    character.classList.add('is-changing');
    setTimeout(()=>{
      character.src=next;
      character.dataset.state=name;
      character.classList.remove('is-changing');
    },160);
  }

  Object.keys(STATES).forEach(preload);
  setState('recepcao');

  if(character){
    character.addEventListener('error',()=>{
      character.src=character.dataset.fallback||'/assets/efex-home.svg';
    });
  }

  function updateCounter(){
    if(counter&&symptom)counter.textContent=`${symptom.value.length}/4000`;
  }
  symptom?.addEventListener('input',updateCounter);
  updateCounter();

  form?.addEventListener('submit',()=>setState('analisando'));
  $('efex-mobile-analisar')?.addEventListener('click',()=>setState('analisando'));
  $('efex-limpar')?.addEventListener('click',()=>setState('recepcao'));
  $('efex-criar-rascunho')?.addEventListener('click',()=>setState('orcamento'));
  $('efex-editar-diagnostico')?.addEventListener('click',()=>{
    window.scrollTo({top:Math.max(0,(symptom?.getBoundingClientRect().top||0)+window.scrollY-100),behavior:'smooth'});
    symptom?.focus({preventScroll:true});
  });

  if(progress){
    new MutationObserver(()=>{
      if(progress.classList.contains('active'))setState('analisando');
      else if(result?.classList.contains('active'))setState('pronto');
    }).observe(progress,{attributes:true,childList:true,subtree:true});
  }

  if(result){
    new MutationObserver(()=>{
      if(result.classList.contains('active'))setState('pronto');
    }).observe(result,{attributes:true});
  }

  if(error){
    new MutationObserver(()=>{
      if(error.classList.contains('active')&&error.textContent.trim())setState('erro');
      else if(current==='erro')setState('recepcao');
    }).observe(error,{attributes:true,childList:true,subtree:true});
  }

  if(dropzone&&input){
    ['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type,event=>{
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    }));
    ['dragleave','drop'].forEach(type=>dropzone.addEventListener(type,event=>{
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
    }));
    dropzone.addEventListener('drop',event=>{
      const files=[...(event.dataTransfer?.files||[])].filter(file=>file.type.startsWith('image/'));
      if(!files.length)return;
      try{
        const transfer=new DataTransfer();
        files.forEach(file=>transfer.items.add(file));
        input.files=transfer.files;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(e){
        console.warn('EfeX: seleção por arrastar não suportada neste navegador.',e);
      }
    });
  }

  window.EfexUI={setState,states:Object.keys(STATES)};
})();
