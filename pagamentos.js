// FS Orçamentos — pagamentos Pix de assinaturas e créditos Efex
(function(){
  'use strict';
  const BASE=window.FS_SUPABASE_FUNCTIONS_URL||'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';
  const PRODUTOS={
    essencial_mensal:{label:'Premium Essencial - 1 mês',valor:14.90,tipo:'assinatura'},
    pro_mensal:{label:'Premium Pro - 1 mês',valor:29.90,tipo:'assinatura'},
    creditos_20:{label:'20 créditos Efex',valor:9.90,tipo:'creditos'},
    creditos_60:{label:'60 créditos Efex',valor:24.90,tipo:'creditos'},
    creditos_150:{label:'150 créditos Efex',valor:49.90,tipo:'creditos'},
    creditos_400:{label:'400 créditos Efex',valor:99.90,tipo:'creditos'}
  };
  let pagamentoAtual=null;
  const $=id=>document.getElementById(id);
  const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function abrir(){const m=$('modal-pix-basico');if(!m)return false;m.style.setProperty('display','flex','important');document.body.style.overflow='hidden';return true}
  function fechar(){const m=$('modal-pix-basico');if(m)m.style.setProperty('display','none','important');document.body.style.overflow=''}
  async function sessao(){try{const{data,error}=await _supabase.auth.getSession();return error?null:data?.session||null}catch{return null}}
  function login(){try{localStorage.setItem('fs_destino_apos_login',`${location.pathname}${location.search}${location.hash}`)}catch{}if(typeof window.abrirModalLogin==='function')window.abrirModalLogin();else location.href='/index.html?login=1&dest='+encodeURIComponent('/planos.html')}
  function qrSrc(v){const s=String(v||'').trim();if(!s)return'';return s.startsWith('data:image')||s.startsWith('http')?s:`data:image/png;base64,${s}`}
  function carregando(p){if(!abrir())return;pagamentoAtual=null;$('pix-loading').style.display='block';$('pix-loading').textContent='Gerando Pix, aguarde...';$('pix-conteudo').style.display='none';$('pix-erro').style.display='none';$('pix-modal-subtitulo').textContent=`${p.label} - ${moeda(p.valor)}`;$('pix-plano-label').textContent=p.label;$('pix-valor').textContent=moeda(p.valor);$('pix-copia-cola').value='';$('pix-qrcode-img').style.display='none'}
  function erro(msg){abrir();$('pix-loading').style.display='none';$('pix-conteudo').style.display='none';$('pix-erro').style.display='block';$('pix-erro').textContent=msg||'Não foi possível gerar o Pix.'}
  function mostrar(d,p){pagamentoAtual=d?.pagamento_id||d?.id||null;$('pix-loading').style.display='none';$('pix-erro').style.display='none';$('pix-conteudo').style.display='block';$('pix-modal-subtitulo').textContent=`${d?.label||p.label} - ${moeda(d?.valor??p.valor)}`;$('pix-plano-label').textContent=d?.label||p.label;$('pix-valor').textContent=moeda(d?.valor??p.valor);const src=qrSrc(d?.qr_code||d?.qrcode||d?.imagem_qrcode);if(src){$('pix-qrcode-img').src=src;$('pix-qrcode-img').style.display='inline-block'}$('pix-copia-cola').value=d?.pix_copia_cola||d?.qrcode||''}
  async function gerarPixProduto(codigo){
    const p=PRODUTOS[codigo];if(!p)return alert('Produto inválido.');
    if(!window._supabase)return alert('Atualize a página e tente novamente.');
    const s=await sessao();if(!s)return login();
    carregando(p);
    try{
      const r=await fetch(`${BASE}/criar-pix-basico`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`},body:JSON.stringify({produto_codigo:codigo})});
      const d=await r.json().catch(()=>({}));if(!r.ok)return erro(d?.erro||d?.message||'Erro ao gerar Pix.');mostrar(d,p)
    }catch(e){console.error(e);erro('Erro inesperado ao gerar Pix.')}
  }
  async function verificar(){
    if(!pagamentoAtual)return alert('Gere um Pix primeiro.');
    const s=await sessao();if(!s)return login();
    try{
      const r=await fetch(`${BASE}/verificar-pix-basico`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`},body:JSON.stringify({pagamento_id:pagamentoAtual})});
      const d=await r.json().catch(()=>({}));if(!r.ok)return alert(d?.erro||'Não foi possível verificar o pagamento.');
      if(d?.status==='pago'||d?.plano_liberado||d?.creditos_liberados){alert(d?.mensagem||'Pagamento confirmado.');location.reload();return}
      alert(d?.mensagem||'Pagamento ainda não confirmado.')
    }catch(e){console.error(e);alert('Não foi possível verificar o pagamento agora.')}
  }
  async function copiar(){const t=$('pix-copia-cola');if(!t?.value)return;await navigator.clipboard.writeText(t.value);alert('Pix copiado.')}
  window.gerarPixProduto=gerarPixProduto;
  window.gerarPixPlano=(_plano,periodo)=>gerarPixProduto(periodo==='mensal'?'pro_mensal':'pro_mensal');
  window.fecharModalPixBasico=fechar;
  window.verificarPagamentoPixAtual=verificar;
  window.copiarPixCopiaCola=copiar;
})();