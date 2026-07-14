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
  const resetButton=$('efex-limpar');

  const STORAGE_KEYS=['fs_efex_analise_atual_v1','fs_efex_historico_v1'];

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

  function injectEnhancements(){
    if(document.getElementById('efex-ui-enhancements'))return;
    const style=document.createElement('style');
    style.id='efex-ui-enhancements';
    style.textContent=`
      .efex-reset-all{border-color:#ef5350!important;color:#ffd7d5!important;background:#35191d!important}
      .efex-reset-all:hover{background:#4a2025!important}
      .efex-privacy-storage{display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:10px 12px;border:1px solid #31506f;border-radius:12px;background:#0a1c31;color:#b9cbe0;font-size:12px;line-height:1.45}
      .efex-privacy-storage strong{color:#fff}
      .efex-module-cost{margin-left:auto;white-space:nowrap;color:#ffd166;font-size:11px;font-weight:900}
      .efex-balance-progress-label{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:var(--muted);font-size:11px}
      .efex-result .efex-block{content-visibility:auto;contain-intrinsic-size:120px}
      @media(max-width:650px){
        .efex-chat-hero .efex-tag{font-size:10px!important}
        .efex-chat-hero .efex-metric span{font-size:10px!important}
        .efex-chat-hero .efex-metric strong{font-size:15px!important}
        .efex-free-banner{font-size:11px!important}
        .efex-actions{display:grid!important;grid-template-columns:1fr!important}
        .efex-actions .efex-btn{width:100%!important}
        .efex-assistant-card{display:none!important}
      }
    `;
    document.head.append(style);

    const moduleCosts={
      'mod-imagens':'+2 por imagem',
      'mod-orcamento':'+1 crédito',
      'mod-precos':'+2 créditos',
      'mod-cliente':'+1 crédito'
    };
    Object.entries(moduleCosts).forEach(([id,label])=>{
      const option=$(id)?.closest('.efex-specialist');
      if(!option||option.querySelector('.efex-module-cost'))return;
      const cost=document.createElement('b');
      cost.className='efex-module-cost';
      cost.textContent=label;
      option.append(cost);
    });

    const estimate=document.querySelector('.efex-estimate');
    if(estimate&&!document.getElementById('efex-balance-progress-label')){
      const label=document.createElement('div');
      label.id='efex-balance-progress-label';
      label.className='efex-balance-progress-label';
      label.innerHTML='<span id="efex-progress-cost">Custo: 2</span><span id="efex-progress-balance">Saldo: —</span>';
      document.querySelector('.efex-bar')?.after(label);

      const privacy=document.createElement('div');
      privacy.className='efex-privacy-storage';
      privacy.innerHTML='<span>🔒</span><span><strong>Privacidade:</strong> o rascunho e o histórico ficam somente neste dispositivo. Use “Limpar tudo e gerar nova análise” para apagar esses dados locais.</span>';
      estimate.append(privacy);
    }

    if(resetButton){
      resetButton.textContent='🗑️ Limpar tudo e gerar nova análise';
      resetButton.classList.add('efex-reset-all');
      resetButton.setAttribute('aria-label','Apagar todos os dados locais do EfeX e iniciar nova análise');
    }
  }

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

  function setImage(image,src,immediate){
    if(!image||!src)return;
    try{if(decodeURI(image.src).endsWith(decodeURI(src)))return}catch{}
    const swap=()=>{
      image.src=src;
      image.dataset.state=current;
      image.classList.remove('is-changing');
    };
    if(immediate){swap();return}
    image.classList.add('is-changing');
    setTimeout(swap,160);
  }

  function setState(name,immediate=false){
    const state=STATES[name]||STATES.recepcao;
    current=name;
    preload(name);

    if(status){
      status.classList.remove('busy','error');
      if(state.tone)status.classList.add(state.tone);
      const label=status.querySelector('span:last-child');
      if(label)label.textContent=state.label;
    }

    const next=available.get(name);
    if(next)setImage(character,next,immediate);
    document.documentElement.dataset.efexState=name;
  }

  function fallbackImage(event){
    const image=event.currentTarget;
    if(image.dataset.fallbackApplied==='1')return;
    image.dataset.fallbackApplied='1';
    image.src=image.dataset.fallback||'/assets/efex-home.svg';
  }

  function updateCounter(){
    if(counter&&symptom)counter.textContent=`${symptom.value.length}/4000`;
  }

  function numericText(value){
    const match=String(value||'').match(/\d+/);
    return match?Number(match[0]):0;
  }

  function updateCreditProgress(){
    const cost=numericText($('efex-custo-relativo')?.textContent);
    const balance=numericText($('efex-cota')?.textContent);
    const fill=$('efex-credit-fill');
    if(fill)fill.style.width=balance>0?`${Math.min(100,(cost/balance)*100)}%`:'0%';
    const costLabel=$('efex-progress-cost');
    const balanceLabel=$('efex-progress-balance');
    if(costLabel)costLabel.textContent=`Custo: ${cost} crédito${cost===1?'':'s'}`;
    if(balanceLabel)balanceLabel.textContent=`Saldo: ${balance} crédito${balance===1?'':'s'}`;
  }

  function clearAllAndRestart(event){
    event?.preventDefault();
    event?.stopImmediatePropagation();
    const confirmed=window.confirm('Apagar rascunho, resultado, conversa, imagens e todo o histórico do EfeX neste dispositivo?');
    if(!confirmed)return;
    STORAGE_KEYS.forEach(key=>localStorage.removeItem(key));
    try{sessionStorage.removeItem('fs_efex_analise_atual_v1')}catch{}
    location.replace('/efex.html?nova=1');
  }

  injectEnhancements();
  preload('recepcao');
  preload('aguardando');
  preload('analisando');
  character?.addEventListener('error',fallbackImage);
  setState('recepcao');
  updateCounter();
  updateCreditProgress();

  symptom?.addEventListener('input',()=>{
    updateCounter();
    if(progress?.classList.contains('active'))return;
    if(input?.files?.length)setState('dadosSeguros');
    else if(symptom.value.trim())setState('aguardando');
    else setState('recepcao');
  });

  resetButton?.addEventListener('click',clearAllAndRestart,true);

  $('efex-editar-diagnostico')?.addEventListener('click',()=>{
    window.scrollTo({top:Math.max(0,(symptom?.getBoundingClientRect().top||0)+window.scrollY-100),behavior:'smooth'});
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
      if(processingKind==='orcamento'&&!error?.classList.contains('active'))setState('orcamentoGerado');
      else if(result?.classList.contains('active'))setState('concluido');
      else if(input?.files?.length)setState('dadosSeguros');
      else if(symptom?.value.trim())setState('aguardando');
      else setState('recepcao');
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

  [$('efex-custo-relativo'),$('efex-cota')].filter(Boolean).forEach(node=>{
    new MutationObserver(updateCreditProgress).observe(node,{childList:true,subtree:true,characterData:true});
  });

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
        files.slice(0,4).forEach(file=>transfer.items.add(file));
        input.files=transfer.files;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(e){console.warn('EfeX: seleção por arrastar não suportada neste navegador.',e)}
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
        <div class="efex-credit-summary"><span>Custo desta pergunta</span><strong>1 crédito</strong></div>
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
    clearAllAndRestart,
    markSent:()=>setState('enviado'),
    markApproved:()=>setState('aprovado'),
    markBudgetReady:()=>setState('orcamentoGerado')
  };
})();