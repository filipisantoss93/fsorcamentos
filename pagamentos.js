(function(){
  'use strict';

  const BASE=window.FS_SUPABASE_FUNCTIONS_URL||'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';
  const PRODUTOS={
    assinatura_essencial:{codigo:'assinatura_essencial',tipo:'assinatura',label:'Premium Essencial - 1 mês',valor:14.90,plano:'premium',nivel:'essencial',dias:30,creditos:15},
    assinatura_pro:{codigo:'assinatura_pro',tipo:'assinatura',label:'Premium Pro - 1 mês',valor:29.90,plano:'premium',nivel:'pro',dias:30,creditos:30},
    creditos_20:{codigo:'creditos_20',tipo:'creditos',label:'20 créditos Efex',valor:9.90,creditos:20,dias:0,plano:'gratis'},
    creditos_50:{codigo:'creditos_50',tipo:'creditos',label:'50 créditos Efex',valor:24.90,creditos:50,dias:0,plano:'gratis'},
    creditos_100:{codigo:'creditos_100',tipo:'creditos',label:'100 créditos Efex',valor:49.90,creditos:100,dias:0,plano:'gratis'},
    creditos_200:{codigo:'creditos_200',tipo:'creditos',label:'200 créditos Efex',valor:99.90,creditos:200,dias:0,plano:'gratis'},
    creditos_400:{codigo:'creditos_400',tipo:'creditos',label:'400 créditos Efex',valor:189.90,creditos:400,dias:0,plano:'gratis'}
  };

  let pagamentoId=null,produtoAtual=null,botaoOrigem=null,verificacaoAutomatica=null,verificacoesRealizadas=0;
  let gerandoPix=false,verificandoPix=false;
  const $=id=>document.getElementById(id);
  const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  function avisar(mensagem,tipo='info'){
    if(typeof window.mostrarToastNotificacao==='function')return window.mostrarToastNotificacao({titulo:'FS Orçamentos',mensagem,tipo});
    (tipo==='erro'?console.error:console.info)(mensagem);
  }

  async function sessao(){
    const {data,error}=await _supabase.auth.getSession();
    if(error)throw error;
    return data?.session||null;
  }

  function destinoLogin(){return /\/carteira(?:\.html)?$/i.test(location.pathname)?'/carteira.html#comprar-creditos':'/planos.html'+(location.hash||'');}
  function login(){
    const destino=destinoLogin();
    try{localStorage.setItem('fs_destino_apos_login',destino);}catch{}
    if(typeof fsIrParaLoginComDestino==='function')fsIrParaLoginComDestino(destino);
    else if(typeof abrirModalLogin==='function')abrirModalLogin();
    else location.href='/index.html?login=1&dest='+encodeURIComponent(destino);
  }

  function definirModalAberto(aberto){
    const modal=$('modal-pix-basico'); if(!modal)return false;
    modal.classList.toggle('is-open',aberto);
    modal.classList.toggle('hidden',!aberto);
    modal.toggleAttribute('hidden',!aberto);
    modal.setAttribute('aria-hidden',aberto?'false':'true');
    document.body.classList.toggle('modal-aberto',aberto);
    $('conteudo-protegido')?.toggleAttribute('inert',aberto);
    $('header-container')?.toggleAttribute('inert',aberto);
    return true;
  }

  function abrir(){
    const modal=$('modal-pix-basico'); if(!modal)return false;
    botaoOrigem=document.activeElement;
    definirModalAberto(true);
    setTimeout(()=>$('btn-fechar-pix')?.focus(),0);
    return true;
  }

  function pararVerificacaoAutomatica(){if(verificacaoAutomatica)clearInterval(verificacaoAutomatica);verificacaoAutomatica=null;verificacoesRealizadas=0;}
  function fechar(){definirModalAberto(false);pararVerificacaoAutomatica();botaoOrigem?.focus?.();}

  function loading(produto){
    produtoAtual=produto; pagamentoId=null; pararVerificacaoAutomatica();
    $('pix-loading')?.classList.remove('hidden');
    if($('pix-loading'))$('pix-loading').textContent='Gerando Pix seguro...';
    $('pix-erro')?.classList.add('hidden'); $('pix-conteudo')?.classList.add('hidden');
    if($('pix-modal-subtitulo'))$('pix-modal-subtitulo').textContent=produto.label;
    if($('pix-plano-label'))$('pix-plano-label').textContent=produto.label;
    if($('pix-valor'))$('pix-valor').textContent=moeda(produto.valor);
    if($('pix-copia-cola'))$('pix-copia-cola').value='';
    $('pix-qrcode-img')?.classList.add('hidden'); $('pix-qrcode-img')?.removeAttribute('src');
    if($('pix-status'))$('pix-status').textContent='Aguardando geração do pagamento';
    abrir();
  }

  function erro(mensagem){
    $('pix-loading')?.classList.add('hidden'); $('pix-conteudo')?.classList.add('hidden');
    if($('pix-erro')){$('pix-erro').textContent=mensagem||'Não foi possível gerar o Pix.';$('pix-erro').classList.remove('hidden');}
    pararVerificacaoAutomatica();
  }

  function iniciarVerificacaoAutomatica(){
    pararVerificacaoAutomatica();
    verificacaoAutomatica=setInterval(async()=>{
      verificacoesRealizadas+=1;
      if(verificacoesRealizadas>30){
        pararVerificacaoAutomatica();
        if($('pix-status'))$('pix-status').textContent='Verificação automática pausada. Use o botão para consultar novamente.';
        return;
      }
      await verificar(true);
    },10000);
  }

  function mostrar(dados){
    pagamentoId=dados.pagamento_id||dados.id;
    $('pix-loading')?.classList.add('hidden'); $('pix-erro')?.classList.add('hidden'); $('pix-conteudo')?.classList.remove('hidden');
    if($('pix-modal-subtitulo'))$('pix-modal-subtitulo').textContent=dados.label||produtoAtual.label;
    if($('pix-plano-label'))$('pix-plano-label').textContent=dados.label||produtoAtual.label;
    if($('pix-valor'))$('pix-valor').textContent=moeda(dados.valor??produtoAtual.valor);
    if($('pix-copia-cola'))$('pix-copia-cola').value=dados.pix_copia_cola||'';
    if($('pix-status'))$('pix-status').textContent='Aguardando pagamento';
    const qr=dados.qr_code||'';
    if(qr&&$('pix-qrcode-img')){$('pix-qrcode-img').src=qr.startsWith('data:')||qr.startsWith('http')?qr:'data:image/png;base64,'+qr;$('pix-qrcode-img').classList.remove('hidden');}
    iniciarVerificacaoAutomatica();
  }

  function setGerando(ativo){
    gerandoPix=ativo;
    const botao=$('btn-gerar-pix');
    if(!botao)return;
    if(!botao.dataset.textoOriginal)botao.dataset.textoOriginal=botao.textContent;
    botao.disabled=ativo;
    botao.textContent=ativo?'Gerando Pix...':botao.dataset.textoOriginal;
  }

  async function gerar(codigo){
    if(gerandoPix)return;
    const produto=PRODUTOS[codigo];
    if(!produto)return avisar('Produto inválido.','erro');
    let session;
    try{session=await sessao();}catch{return avisar('Não foi possível validar sua sessão.','erro');}
    if(!session)return login();
    setGerando(true); loading(produto);
    try{
      const resposta=await fetch(BASE+'/criar-pix-basico',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({produto_codigo:produto.codigo})});
      const dados=await resposta.json().catch(()=>({}));
      if(!resposta.ok)return erro(dados.erro||dados.error||'Falha ao gerar Pix.');
      mostrar(dados);
    }catch(e){console.error(e);erro('Erro inesperado ao gerar Pix. Verifique sua conexão.');}
    finally{setGerando(false);}
  }

  function tratarStatusPagamento(dados,silencioso){
    const status=String(dados.status||'').toLowerCase();
    if(dados.aplicado||['pago','paid','approved','confirmado'].includes(status))return 'pago';
    if(['expired','expirado'].includes(status))return 'expirado';
    if(['cancelled','canceled','cancelado','rejected','recusado'].includes(status))return 'cancelado';
    if(!silencioso&&dados.mensagem)avisar(dados.mensagem);
    return 'pendente';
  }

  async function verificar(silencioso=false){
    if(verificandoPix)return;
    if(!pagamentoId){if(!silencioso)avisar('Gere um Pix primeiro.','erro');return;}
    let session; try{session=await sessao();}catch{return;}
    if(!session)return login();
    verificandoPix=true;
    const botao=$('btn-verificar-pix');
    if(botao&&!silencioso){botao.disabled=true;botao.textContent='Verificando...';}
    if($('pix-status')&&!silencioso)$('pix-status').textContent='Verificando pagamento...';
    try{
      const resposta=await fetch(BASE+'/verificar-pix-basico',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({pagamento_id:pagamentoId})});
      const dados=await resposta.json().catch(()=>({}));
      if(!resposta.ok){if(!silencioso)avisar(dados.erro||'Pagamento ainda não confirmado.','erro');if($('pix-status'))$('pix-status').textContent='Aguardando pagamento';return;}
      const estado=tratarStatusPagamento(dados,silencioso);
      if(estado==='pago'){
        pararVerificacaoAutomatica();
        if($('pix-status'))$('pix-status').textContent='Pagamento confirmado e créditos aplicados';
        avisar(dados.mensagem||'Pagamento confirmado. Créditos adicionados.','sucesso');
        if(typeof window.atualizarCarteiraCompleta==='function')await window.atualizarCarteiraCompleta();
        setTimeout(fechar,1200); return;
      }
      if(estado==='expirado'){
        pararVerificacaoAutomatica();
        if($('pix-status'))$('pix-status').textContent='Este Pix expirou. Gere um novo pagamento.';
        return;
      }
      if(estado==='cancelado'){
        pararVerificacaoAutomatica();
        if($('pix-status'))$('pix-status').textContent='Pagamento cancelado ou recusado.';
        return;
      }
      if($('pix-status'))$('pix-status').textContent=dados.mensagem||'Aguardando pagamento';
    }catch(e){console.error(e);if(!silencioso)avisar('Não foi possível verificar agora.','erro');if($('pix-status'))$('pix-status').textContent='Falha temporária na verificação';}
    finally{verificandoPix=false;if(botao){botao.disabled=false;botao.textContent='Já paguei, verificar';}}
  }

  async function copiar(){
    const campo=$('pix-copia-cola'); if(!campo?.value)return;
    try{await navigator.clipboard.writeText(campo.value);avisar('Pix copia e cola copiado.','sucesso');}
    catch{campo.select();document.execCommand('copy');avisar('Pix copia e cola copiado.','sucesso');}
  }

  function atualizarPacote(){
    const codigo=$('pacote-creditos')?.value||'creditos_50'; const produto=PRODUTOS[codigo]; if(!produto)return;
    if($('valor-pacote-creditos'))$('valor-pacote-creditos').textContent=moeda(produto.valor);
  }
  function comprar(){gerar($('pacote-creditos')?.value||'creditos_50');}

  function manterFocoNoModal(event){
    const modal=$('modal-pix-basico');
    if(event.key!=='Tab'||!modal?.classList.contains('is-open'))return;
    const focaveis=[...modal.querySelectorAll('button,[href],textarea,input,select,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden);
    if(!focaveis.length)return;
    const primeiro=focaveis[0],ultimo=focaveis[focaveis.length-1];
    if(event.shiftKey&&document.activeElement===primeiro){event.preventDefault();ultimo.focus();}
    else if(!event.shiftKey&&document.activeElement===ultimo){event.preventDefault();primeiro.focus();}
  }

  function inicializar(){
    definirModalAberto(false); atualizarPacote();
    $('btn-fechar-pix')?.addEventListener('click',fechar);
    $('btn-copiar-pix')?.addEventListener('click',copiar);
    $('btn-verificar-pix')?.addEventListener('click',()=>verificar(false));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('modal-pix-basico')?.classList.contains('is-open'))fechar();manterFocoNoModal(event);});
    document.addEventListener('click',event=>{const modal=$('modal-pix-basico');if(modal?.classList.contains('is-open')&&event.target===modal)fechar();});
  }

  Object.assign(window,{gerarPixProduto:gerar,comprarPacoteSelecionado:comprar,atualizarPacoteCreditos:atualizarPacote,fecharModalPixBasico:fechar,verificarPagamentoPixAtual:()=>verificar(false),copiarPixCopiaCola:copiar,FS_PRODUTOS_COMERCIAIS:PRODUTOS});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicializar);else inicializar();
})();
