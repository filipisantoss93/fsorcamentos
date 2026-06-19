/* FS Orçamentos — fotos depois da OS
   Complementa o módulo existente de fotos antes, usando ordens_servico.fotos_depois.
*/
(function(){
  'use strict';

  let fotosDepois=[];
  let usuarioId='';
  let ordemId='';

  const LIMITE=5;
  const MAX_BYTES=700*1024;

  function $(id){return document.getElementById(id)}
  function qs(){return new URLSearchParams(location.search)}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function msg(t,tipo='info'){
    if(typeof window.mostrarMensagemOrdem==='function')return window.mostrarMensagemOrdem(t,tipo);
    const e=$('mensagem-ordem');if(e){e.className='mensagem-ordem '+tipo;e.textContent=t;}
  }
  function chaveLocal(){return `fs_os_fotos_depois_${ordemId}`}

  function obterOrdemId(){
    ordemId=qs().get('id')||qs().get('ordem_id')||qs().get('os_id')||localStorage.getItem('ultima_os_aberta_id')||'';
    return ordemId;
  }

  async function obterSessao(){
    if(!window._supabase&&typeof window.inicializarSupabaseFS==='function')window.inicializarSupabaseFS();
    if(!window._supabase)return false;
    const {data:{session}}=await _supabase.auth.getSession();
    usuarioId=session?.user?.id||'';
    return !!usuarioId;
  }

  function injetarCss(){
    if($('fs-fotos-depois-css'))return;
    const s=document.createElement('style');
    s.id='fs-fotos-depois-css';
    s.textContent=`
      .fs-fotos-depois-card{margin-top:12px;border:1px solid #e4d8cc;border-radius:8px;background:#fff;overflow:hidden}.fs-fotos-depois-head{background:#2f211d;color:#ffc400;padding:10px 12px;border-bottom:1px solid #ffc400}.fs-fotos-depois-head h3{margin:0;font-size:16px;color:#ffc400}.fs-fotos-depois-head p{margin:3px 0 0;color:#fffaf0;font-size:12px;font-weight:700}.fs-fotos-depois-body{padding:10px;display:grid;gap:9px}.fs-fotos-depois-upload{border:1px dashed #d7ccc8;border-radius:7px;background:#fbf8f4;padding:10px;display:grid;gap:7px}.fs-fotos-depois-upload input{border:1px solid #d7ccc8;border-radius:5px;padding:8px;background:#fff}.fs-fotos-depois-acoes{display:flex;gap:7px;flex-wrap:wrap}.fs-fotos-depois-acoes button{min-height:32px;border-radius:6px;border:1px solid #ffc400;background:#3e2723;color:#ffc400;font-weight:900;padding:7px 10px;cursor:pointer}.fs-fotos-depois-acoes .sec{background:#fff;color:#3e2723;border-color:#d7ccc8}.fs-fotos-depois-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.fs-fotos-depois-item{border:1px solid #e4d8cc;border-radius:7px;overflow:hidden;background:#fff}.fs-fotos-depois-item img{width:100%;height:120px;object-fit:cover;display:block;background:#f8f4ee}.fs-fotos-depois-item button{width:100%;border:0;border-top:1px solid #e4d8cc;background:#fff1f1;color:#991b1b;font-size:10.5px;font-weight:900;padding:6px;cursor:pointer}.fs-fotos-depois-vazio{padding:12px;text-align:center;border:1px dashed #e4d8cc;border-radius:7px;color:#62554d;font-size:12px}@media(max-width:540px){.fs-fotos-depois-acoes button{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function alvo(){
    const cardAssinatura=$('card-assinatura-cliente')||$('assinatura-cliente-nome')?.closest('.card');
    const cardFotos=$('input-foto-antes-os')?.closest('.card');
    return cardFotos||cardAssinatura||document.querySelector('main')||document.body;
  }

  function injetarHtml(){
    if($('fs-fotos-depois-card'))return;
    const el=document.createElement('section');
    el.id='fs-fotos-depois-card';
    el.className='fs-fotos-depois-card';
    el.innerHTML=`
      <div class="fs-fotos-depois-head"><h3>Foto depois do serviço</h3><p>Registre o resultado final da execução. Máximo de 5 fotos.</p></div>
      <div class="fs-fotos-depois-body">
        <label class="fs-fotos-depois-upload"><strong>Selecionar fotos depois</strong><input id="input-foto-depois-os" type="file" accept="image/*" multiple></label>
        <div class="fs-fotos-depois-acoes"><button type="button" id="btn-salvar-foto-depois">Salvar fotos depois</button><button type="button" class="sec" id="btn-remover-foto-depois">Remover todas</button></div>
        <div id="preview-fotos-depois-os" class="fs-fotos-depois-grid"></div>
      </div>`;
    alvo().insertAdjacentElement('afterend',el);
    $('input-foto-depois-os')?.addEventListener('change',selecionarFotos);
    $('btn-salvar-foto-depois')?.addEventListener('click',salvarFotosDepois);
    $('btn-remover-foto-depois')?.addEventListener('click',removerTodasFotosDepois);
  }

  function lerLocal(){
    try{return JSON.parse(localStorage.getItem(chaveLocal())||'[]')||[]}catch(_){return[]}
  }
  function salvarLocal(){localStorage.setItem(chaveLocal(),JSON.stringify(fotosDepois||[]))}

  async function reduzir(file){
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)});
    const max=1200,ratio=Math.min(1,max/img.width,max/img.height);
    const c=document.createElement('canvas');c.width=Math.round(img.width*ratio);c.height=Math.round(img.height*ratio);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    let q=.82,blob=await new Promise(r=>c.toBlob(r,'image/jpeg',q));
    while(blob&&blob.size>MAX_BYTES&&q>.45){q-=.08;blob=await new Promise(r=>c.toBlob(r,'image/jpeg',q));}
    return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob||file)});
  }

  async function selecionarFotos(ev){
    const arquivos=[...(ev.target.files||[])];
    if(!arquivos.length)return;
    const restantes=Math.max(0,LIMITE-fotosDepois.length);
    if(restantes<=0){msg('Limite de 5 fotos depois atingido.','info');return;}
    msg('Processando fotos depois...','info');
    for(const file of arquivos.slice(0,restantes)){
      try{fotosDepois.push({src:await reduzir(file),nome:file.name,em:new Date().toISOString()});}
      catch(e){console.error(e);msg('Não foi possível processar uma das fotos.','erro');}
    }
    renderizar();
    msg('Fotos depois prontas para salvar.','info');
  }

  async function carregarBanco(){
    const {data,error}=await _supabase.from('ordens_servico').select('fotos_depois').eq('id',ordemId).eq('user_id',usuarioId).maybeSingle();
    if(error){console.warn('Fotos depois:',error);return null;}
    return Array.isArray(data?.fotos_depois)?data.fotos_depois:[];
  }

  async function persistirBanco(){
    if(!window._supabase||!usuarioId||!ordemId)return false;
    const {error}=await _supabase.from('ordens_servico').update({fotos_depois:fotosDepois}).eq('id',ordemId).eq('user_id',usuarioId);
    if(error){console.warn('Erro ao salvar fotos depois:',error);return false;}
    return true;
  }

  async function salvarFotosDepois(){
    const ok=await persistirBanco();
    salvarLocal();
    msg(ok?'Fotos depois salvas na OS.':'Fotos depois salvas neste aparelho. Verifique permissões do Supabase. ',ok?'sucesso':'info');
  }

  async function removerTodasFotosDepois(){
    if(!confirm('Remover todas as fotos depois desta OS?'))return;
    fotosDepois=[];
    await persistirBanco();
    salvarLocal();
    renderizar();
    msg('Fotos depois removidas.','sucesso');
  }

  function removerFoto(i){
    fotosDepois.splice(i,1);
    salvarLocal();
    renderizar();
  }

  function renderizar(){
    const box=$('preview-fotos-depois-os');if(!box)return;
    if(!fotosDepois.length){box.innerHTML='<div class="fs-fotos-depois-vazio">Nenhuma foto depois adicionada.</div>';return;}
    box.innerHTML=fotosDepois.map((f,i)=>`<div class="fs-fotos-depois-item"><img src="${esc(f.src||f)}" alt="Foto depois ${i+1}"><button type="button" data-i="${i}">Remover</button></div>`).join('');
    box.querySelectorAll('button[data-i]').forEach(b=>b.addEventListener('click',()=>removerFoto(Number(b.dataset.i))));
  }

  async function iniciar(){
    injetarCss();
    obterOrdemId();
    if(!ordemId)return;
    await obterSessao();
    injetarHtml();
    const remoto=usuarioId?await carregarBanco():null;
    fotosDepois=(remoto&&remoto.length?remoto:lerLocal()).slice(0,LIMITE);
    renderizar();
  }

  window.salvarFotoDepoisOS=salvarFotosDepois;
  window.removerTodasFotosDepoisOS=removerTodasFotosDepois;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,1300));
  else setTimeout(iniciar,1300);
})();