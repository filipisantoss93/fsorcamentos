// FS Orçamentos - pagamento do Plano Premium via Pix
(function(){
  'use strict';
  const FS_SUPABASE_FUNCTIONS_URL = window.FS_SUPABASE_FUNCTIONS_URL || 'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';
  const FS_PLANOS_PIX = {
    premium: {
      mensal: { label: 'Plano Premium Lançamento - 1 mês', valor: 29.90, dias: 30 },
      semestral: { label: 'Plano Premium Lançamento - 6 meses', valor: 149.90, dias: 180 },
      anual: { label: 'Plano Premium Lançamento - 12 meses', valor: 299.90, dias: 365 }
    }
  };
  let pagamentoPixAtualIdInterno = null;
  const el = id => document.getElementById(id);
  const moeda = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const periodoValido = p => Object.prototype.hasOwnProperty.call(FS_PLANOS_PIX.premium,p);
  const planoPix = periodo => FS_PLANOS_PIX.premium[periodoValido(periodo)?periodo:'mensal'];
  function abrirModalPixBasico(){const m=el('modal-pix-basico');if(!m)return false;m.style.setProperty('display','flex','important');document.body.style.overflow='hidden';return true}
  function fecharModalPixBasico(){const m=el('modal-pix-basico');if(!m)return;m.style.setProperty('display','none','important');document.body.style.overflow=''}
  function salvarDestino(){try{localStorage.setItem('fs_destino_apos_login',`${location.pathname||'/planos.html'}${location.search||''}${location.hash||''}`)}catch(_){}}
  async function sessao(){try{if(!window._supabase)return null;const{data,error}=await _supabase.auth.getSession();return error?null:data?.session||null}catch(_){return null}}
  function obrigarLogin(){salvarDestino();if(typeof window.abrirModalLogin==='function')window.abrirModalLogin();else location.href='/index.html?login=1'}
  function setAtual(id){pagamentoPixAtualIdInterno=id||null;window.pagamentoPixAtualId=pagamentoPixAtualIdInterno}
  function getAtual(){return pagamentoPixAtualIdInterno||window.pagamentoPixAtualId||null}
  function qrSrc(v){const q=String(v||'').trim();if(!q)return'';if(q.startsWith('data:image')||q.startsWith('http://')||q.startsWith('https://'))return q;return`data:image/png;base64,${q}`}
  function extrairQr(d){return d?.qr_code||d?.qrcode||d?.qrCode||d?.imagem_qrcode||d?.base64||d?.qrcode_base64||''}
  function extrairCopia(d){return d?.pix_copia_cola||d?.copia_cola||d?.pixCopiaCola||d?.brcode||d?.copiaECola||d?.pix||''}
  function extrairId(d){return d?.pagamento_id||d?.pagamentoId||d?.id_pagamento||d?.id||null}
  function estadoCarregando(periodo){if(!abrirModalPixBasico())return;const p=planoPix(periodo);setAtual(null);if(el('pix-loading')){el('pix-loading').style.display='block';el('pix-loading').innerText='Gerando Pix, aguarde...'}if(el('pix-conteudo'))el('pix-conteudo').style.display='none';if(el('pix-erro')){el('pix-erro').style.display='none';el('pix-erro').innerText=''}if(el('pix-modal-subtitulo'))el('pix-modal-subtitulo').innerText=`${p.label} - ${moeda(p.valor)}`;if(el('pix-plano-label'))el('pix-plano-label').innerText=p.label;if(el('pix-valor'))el('pix-valor').innerText=moeda(p.valor);if(el('pix-qrcode-img')){el('pix-qrcode-img').removeAttribute('src');el('pix-qrcode-img').style.display='none'}if(el('pix-copia-cola'))el('pix-copia-cola').value=''}
  function estadoErro(msg){if(!abrirModalPixBasico()){alert(msg||'Não foi possível gerar o Pix.');return}if(el('pix-loading'))el('pix-loading').style.display='none';if(el('pix-conteudo'))el('pix-conteudo').style.display='none';if(el('pix-erro')){el('pix-erro').style.display='block';el('pix-erro').innerText=msg||'Não foi possível gerar o Pix.'}}
  function estadoConteudo(dados){const loading=el('pix-loading'),conteudo=el('pix-conteudo'),erro=el('pix-erro'),qr=el('pix-qrcode-img');setAtual(extrairId(dados));if(loading)loading.style.display='none';if(conteudo)conteudo.style.display='block';if(erro){erro.style.display='none';erro.innerText=''}if(el('pix-modal-subtitulo'))el('pix-modal-subtitulo').innerText=`${dados?.label||'Plano Premium'} - ${moeda(dados?.valor)}`;if(el('pix-plano-label'))el('pix-plano-label').innerText=dados?.label||'Plano Premium';if(el('pix-valor'))el('pix-valor').innerText=moeda(dados?.valor);if(qr){const src=qrSrc(extrairQr(dados));if(src){qr.src=src;qr.style.display='inline-block'}else{qr.removeAttribute('src');qr.style.display='none'}}if(el('pix-copia-cola'))el('pix-copia-cola').value=extrairCopia(dados)||''}
  async function gerarPixPlano(planoSelecionado='premium',periodo='mensal'){
    try{
      const periodoFinal=periodoValido(periodo)?periodo:'mensal';
      const plano=planoPix(periodoFinal);
      if(!window._supabase){alert('Atualize a página e tente novamente.');return}
      if(!el('modal-pix-basico')){location.href=`/planos.html?plano=premium&periodo=${encodeURIComponent(periodoFinal)}#assinar-plano-premium`;return}
      const s=await sessao();if(!s){obrigarLogin();return}
      estadoCarregando(periodoFinal);
      const resposta=await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/criar-pix-basico`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`},body:JSON.stringify({plano:'premium',periodo:periodoFinal,valor:plano.valor,dias:plano.dias,label:plano.label})});
      const dados=await resposta.json().catch(()=>({}));
      if(!resposta.ok){estadoErro(dados?.erro||dados?.message||'Erro ao gerar Pix.');return}
      estadoConteudo({...dados,plano:'premium',periodo:periodoFinal,label:dados?.label||plano.label,valor:dados?.valor??plano.valor,dias:dados?.dias??plano.dias});
    }catch(e){console.error(e);estadoErro('Erro inesperado ao gerar Pix.')}
  }
  async function verificarPagamentoPixAtual(){try{const id=getAtual();if(!id)return alert('Gere um Pix primeiro.');const s=await sessao();if(!s)return obrigarLogin();const r=await fetch(`${FS_SUPABASE_FUNCTIONS_URL}/verificar-pix-basico`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`},body:JSON.stringify({pagamento_id:id})});const d=await r.json().catch(()=>({}));if(!r.ok)return alert(d?.erro||d?.message||'Pagamento ainda não confirmado.');if(d?.status==='approved'||d?.status==='pago'||d?.plano_liberado){localStorage.setItem('usuario_plano','premium');alert('Premium liberado.');location.reload();return}alert(d?.mensagem||'Pagamento ainda não confirmado.')}catch(e){console.error(e);alert('Não foi possível verificar o pagamento agora.')}}
  async function copiarPixCopiaCola(){const t=el('pix-copia-cola');if(!t?.value)return;await navigator.clipboard.writeText(t.value);alert('Pix copiado.')}
  function iniciarPixPorUrl(){const p=new URLSearchParams(location.search||'');if((p.get('plano')||'')==='premium'&&p.get('periodo'))setTimeout(()=>gerarPixPlano('premium',p.get('periodo')),600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarPixPorUrl);else iniciarPixPorUrl();
  window.gerarPixPlano=gerarPixPlano;window.gerarPixPlanoPremium=periodo=>gerarPixPlano('premium',periodo);window.gerarPixPlanoBasico=periodo=>gerarPixPlano('premium',periodo);window.fecharModalPixBasico=fecharModalPixBasico;window.verificarPagamentoPixAtual=verificarPagamentoPixAtual;window.copiarPixCopiaCola=copiarPixCopiaCola;
})();
