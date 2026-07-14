(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const character=$('efex-character');
  const status=$('efex-character-status');
  const progress=$('efex-progress');
  const error=$('efex-error');
  const result=$('efex-diagnostico-card');
  const layout=document.querySelector('.efex-hybrid-layout');
  const symptom=$('efex-sintoma');
  const counter=$('efex-sintoma-count');
  const dropzone=$('efex-dropzone');
  const input=$('efex-fotos');
  const followupCard=$('efex-pergunta-card');
  const followupOpen=$('efex-abrir-pergunta');
  const followupCompose=$('efex-followup-compose');
  const followupInput=$('efex-pergunta');
  const followupSend=$('efex-enviar-pergunta');
  const draftButton=$('efex-criar-rascunho');

  const STATES={
    recepcao:{src:'/assets/images/efex-recepcao%20.PNG',label:'Pronto para analisar',tone:''},
    aguardando:{src:'/assets/images/efex-aguardando.PNG',label:'Aguardando suas informações',tone:''},
    analisando:{src:'/assets/images/efex-analisando.PNG',label:'Analisando o veículo...',tone:'busy'},
    dadosSeguros:{src:'/assets/images/efex-dados-seguros.PNG',label:'Dados preparados com segurança',tone:''},
    concluido:{src:'/assets/images/efeX-concluido%20.PNG',label:'Análise concluída',tone:''},
    gerandoOrcamento:{src:'/assets/images/efex-gerando-orcamento.PNG',label:'Gerando orçamento...',tone:'busy'},
    orcamentoGerado:{src:'/assets/images/efex-orcamento-gerado.PNG',label:'Orçamento gerado',tone:''},
    enviado:{src:'/assets/images/efex-enviado.PNG',label:'Orçamento enviado',tone:''},
    aprovado:{src:'/assets/images/efex-orcamento-aprovado.PNG',label:'Orçamento aprovado',tone:''},
    erro:{src:'/assets/images/efex-erro.PNG',label:'Não foi possível concluir',tone:'error'}
  };

  let current='recepcao';
  let processingKind='';
  const available=new Map();

  function preload(name){
    const state=STATES[name];
    if(!state||available.has(name))return;
    const image=new Image();
    image.onload=()=>{
      available.set(name,state.src);
      if(name===current)setState(name,true);
    };
    image.onerror=()=>available.set(name,null);
    image.src=state.src;
  }

  function stateImages(){
    return [character,...document.querySelectorAll('.efex-chat-avatar img,.efex-mini-avatar img')].filter(Boolean);
  }

  function setImage(image,src,immediate){
    if(!src)return;
    try{
      if(decodeURI(image.src).endsWith(decodeURI(src)))return;
    }catch{}
    const swap=()=>{
      image.src=src;
      image.dataset.state=current;
      image.classList.remove('is-changing');
    };
    if(immediate){swap();return;}
    image.classList.add('is-changing');
    setTimeout(swap,160);
  }

  function setState(name,immediate=false){
    const state=STATES[name]||STATES.recepcao;
    current=name;

    if(status){
      status.classList.remove('busy','error');
      if(state.tone)status.classList.add(state.tone);
      const label=status.querySelector('span:last-child');
      if(label)label.textContent=state.label;
    }

    const next=available.get(name);
    stateImages().forEach(image=>{
      image.dataset.state=name;
      if(next)setImage(image,next,immediate);
    });

    document.documentElement.dataset.efexState=name;
  }

  function fallbackImage(event){
    const image=event.currentTarget;
    if(image.dataset.fallbackApplied==='1')return;
    image.dataset.fallbackApplied='1';
    image.src=image.dataset.fallback||'/assets/efex-home.svg';
  }

  Object.keys(STATES).forEach(preload);
  stateImages().forEach(image=>image.addEventListener('error',fallbackImage));
  setState('recepcao');

  function updateCounter(){
    if(counter&&symptom)counter.textContent=`${symptom.value.length}/4000`;
  }

  symptom?.addEventListener('input',()=>{
    updateCounter();
    if(progress?.classList.contains('active'))return;
    if(input?.files?.length)setState('dadosSeguros');
    else if(symptom.value.trim())setState('aguardando');
    else setState('recepcao');
  });
  updateCounter();

  $('efex-limpar')?.addEventListener('click',()=>setState('recepcao'));
  $('efex-editar-diagnostico')?.addEventListener('click',()=>{
    window.scrollTo({
      top:Math.max(0,(symptom?.getBoundingClientRect().top||0)+window.scrollY-100),
      behavior:'smooth'
    });
    symptom?.focus({preventScroll:true});
  });

  function setResultVisibility(){
    const active=Boolean(result?.classList.contains('active'));
    layout?.classList.toggle('has-result',active);
    if(active)setState('concluido');
  }

  if(result){
    new MutationObserver(setResultVisibility).observe(result,{attributes:true,attributeFilter:['class']});
    setResultVisibility();
  }

  if(progress){
    new MutationObserver(()=>{
      const active=progress.classList.contains('active');
      const message=progress.textContent.toLowerCase();

      if(active){
        processingKind=message.includes('rascunho')||message.includes('orçamento')?'orcamento':'analise';
        setState(processingKind==='orcamento'?'gerandoOrcamento':'analisando');
        return;
      }

      if(processingKind==='orcamento'&&!error?.classList.contains('active')){
        setState('orcamentoGerado');
      }else if(result?.classList.contains('active')){
        setState('concluido');
      }else if(input?.files?.length){
        setState('dadosSeguros');
      }else if(symptom?.value.trim()){
        setState('aguardando');
      }else{
        setState('recepcao');
      }
      processingKind='';
    }).observe(progress,{attributes:true,childList:true,subtree:true});
  }

  if(error){
    new MutationObserver(()=>{
      if(error.classList.contains('active')&&error.textContent.trim())setState('erro');
      else if(current==='erro'){
        if(result?.classList.contains('active'))setState('concluido');
        else if(input?.files?.length)setState('dadosSeguros');
        else if(symptom?.value.trim())setState('aguardando');
        else setState('recepcao');
      }
    }).observe(error,{attributes:true,childList:true,subtree:true});
  }

  input?.addEventListener('change',()=>{
    if(progress?.classList.contains('active'))return;
    if(input.files?.length)setState('dadosSeguros');
    else if(symptom?.value.trim())setState('aguardando');
    else setState('recepcao');
  });

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

  function setFollowupOpen(open){
    if(followupCompose)followupCompose.hidden=!open;
    followupCard?.classList.toggle('is-compose-open',open);
    if(followupOpen){
      followupOpen.textContent=open?'Cancelar pergunta complementar':'Fazer pergunta complementar · 1 crédito';
      followupOpen.setAttribute('aria-expanded',String(open));
    }
    if(open)setTimeout(()=>followupInput?.focus(),50);
  }

  followupOpen?.addEventListener('click',()=>setFollowupOpen(followupCompose?.hidden!==false));

  document.querySelectorAll('[data-efex-question]').forEach(button=>button.addEventListener('click',()=>{
    setFollowupOpen(true);
    if(followupInput){
      followupInput.value=button.dataset.efexQuestion||'';
      followupInput.focus();
    }
  }));

  function createCreditModal(){
    const modal=document.createElement('div');
    modal.id='efex-credit-modal';
    modal.className='efex-credit-modal';
    modal.hidden=true;
    modal.innerHTML=`
      <div class="efex-credit-modal-backdrop" data-close-modal></div>
      <section class="efex-credit-dialog" role="dialog" aria-modal="true" aria-labelledby="efex-credit-modal-title">
        <button type="button" class="efex-credit-modal-close" data-close-modal aria-label="Fechar">×</button>
        <span class="efex-credit-modal-icon">◉</span>
        <h2 id="efex-credit-modal-title">Confirmar pergunta complementar</h2>
        <p>Esta mensagem fará uma nova chamada ao EfeX.</p>
        <div class="efex-credit-summary">
          <span>Custo desta pergunta</span><strong>1 crédito</strong>
        </div>
        <p class="efex-credit-modal-note">Reúna todos os novos dados em uma única mensagem para evitar consumo desnecessário.</p>
        <div class="efex-credit-modal-actions">
          <button type="button" class="efex-btn secondary" data-close-modal>Cancelar</button>
          <button type="button" class="efex-btn primary" data-confirm-credit>Confirmar e enviar</button>
        </div>
      </section>`;
    document.body.append(modal);
    return modal;
  }

  const creditModal=createCreditModal();
  let pendingSend=false;

  function closeCreditModal(){
    creditModal.hidden=true;
    document.body.classList.remove('efex-modal-open');
    pendingSend=false;
    followupSend?.focus();
  }

  function openCreditModal(){
    creditModal.hidden=false;
    document.body.classList.add('efex-modal-open');
    setTimeout(()=>creditModal.querySelector('[data-confirm-credit]')?.focus(),30);
  }

  creditModal.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',closeCreditModal));
  creditModal.querySelector('[data-confirm-credit]')?.addEventListener('click',()=>{
    if(!pendingSend)return;
    creditModal.hidden=true;
    document.body.classList.remove('efex-modal-open');
    pendingSend=false;
    followupSend?.onclick?.call(followupSend,new MouseEvent('click',{bubbles:true}));
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!creditModal.hidden)closeCreditModal();
  });

  followupSend?.addEventListener('click',event=>{
    const question=followupInput?.value.trim()||'';
    if(!question)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingSend=true;
    openCreditModal();
  },true);

  draftButton?.addEventListener('click',()=>{
    if(!draftButton.disabled)setState('gerandoOrcamento');
  });

  window.EfexUI={
    setState,
    states:Object.keys(STATES),
    markSent:()=>setState('enviado'),
    markApproved:()=>setState('aprovado'),
    markBudgetReady:()=>setState('orcamentoGerado')
  };
})();