/* FS Orçamentos — Fotos antes/depois da OS */
(function(){
  'use strict';

  const BUCKET='os-fotos';
  let userId='', ordemId='', fotos=[];

  function qs(){return new URLSearchParams(location.search)}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function dataBR(v){if(!v)return'-';const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleString('pt-BR')}
  function msg(t){const e=document.getElementById('fs-fotos-msg');if(e)e.textContent=t||''}

  function obterId(){ordemId=qs().get('id')||qs().get('ordem_id')||qs().get('os_id')||'';return ordemId}

  async function initSession(){
    if(!window._supabase&&window.inicializarSupabaseFS)window.inicializarSupabaseFS();
    const r=await _supabase.auth.getSession();
    userId=r.data.session?.user?.id||'';
    return !!userId;
  }

  function css(){
    if(document.getElementById('fs-os-fotos-css'))return;
    const s=document.createElement('style');
    s.id='fs-os-fotos-css';
    s.textContent=`
      .fs-fotos-os{margin-top:12px;border:1px solid #e4d8cc;border-radius:8px;background:#fff;overflow:hidden}.fs-fotos-head{background:#2f211d;color:#ffc400;padding:10px 12px;border-bottom:1px solid #ffc400}.fs-fotos-head h3{margin:0;font-size:16px;color:#ffc400}.fs-fotos-head p{margin:3px 0 0;color:#fffaf0;font-size:12px;font-weight:700}.fs-fotos-body{padding:10px;display:grid;gap:10px}.fs-fotos-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fs-foto-upload{border:1px dashed #d7ccc8;border-radius:7px;background:#fbf8f4;padding:10px;display:grid;gap:7px}.fs-foto-upload strong{color:#2f211d;font-size:13px}.fs-foto-upload input{width:100%;border:1px solid #d7ccc8;border-radius:5px;padding:8px;background:#fff}.fs-galeria-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fs-galeria-col{display:grid;gap:7px}.fs-galeria-col h4{margin:0;color:#2f211d;font-size:13px}.fs-foto-card{border:1px solid #e4d8cc;border-radius:7px;overflow:hidden;background:#fff}.fs-foto-card img{width:100%;height:145px;object-fit:cover;display:block;background:#f8f4ee}.fs-foto-info{padding:7px;font-size:11px;color:#62554d;display:flex;justify-content:space-between;gap:6px;align-items:center}.fs-foto-info button{border:1px solid #fecaca;background:#fff1f1;color:#991b1b;border-radius:4px;padding:5px 7px;font-size:10px;font-weight:900;cursor:pointer}.fs-fotos-msg{font-size:12px;font-weight:800;color:#3e2723}.fs-vazio-foto{padding:12px;border:1px dashed #e4d8cc;border-radius:7px;text-align:center;color:#62554d;font-size:12px}@media(max-width:720px){.fs-fotos-actions,.fs-galeria-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function alvo(){return document.querySelector('main')||document.body}
  function ui(){
    if(document.getElementById('fs-fotos-os'))return;
    const div=document.createElement('section');
    div.id='fs-fotos-os';
    div.className='fs-fotos-os';
    div.innerHTML=`
      <div class="fs-fotos-head"><h3>Fotos da OS</h3><p>Registre imagens antes e depois do serviço.</p></div>
      <div class="fs-fotos-body">
        <div class="fs-fotos-actions">
          <label class="fs-foto-upload"><strong>Fotos antes</strong><input id="fs-foto-antes" type="file" accept="image/*" multiple></label>
          <label class="fs-foto-upload"><strong>Fotos depois</strong><input id="fs-foto-depois" type="file" accept="image/*" multiple></label>
        </div>
        <div id="fs-fotos-msg" class="fs-fotos-msg"></div>
        <div class="fs-galeria-grid"><div class="fs-galeria-col"><h4>Antes</h4><div id="fs-galeria-antes"></div></div><div class="fs-galeria-col"><h4>Depois</h4><div id="fs-galeria-depois"></div></div></div>
      </div>`;
    alvo().appendChild(div);
    document.getElementById('fs-foto-antes')?.addEventListener('change',e=>upload(e.target.files,'antes'));
    document.getElementById('fs-foto-depois')?.addEventListener('change',e=>upload(e.target.files,'depois'));
  }

  async function reduzirImagem(file){
    if(file.size<=700*1024)return file;
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)});
    const max=1400,ratio=Math.min(1,max/img.width,max/img.height);
    const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    let q=.82,blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',q));
    while(blob&&blob.size>700*1024&&q>.45){q-=.08;blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',q));}
    return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
  }

  async function upload(fileList,tipo){
    const files=[...(fileList||[])]; if(!files.length)return;
    msg('Enviando fotos...');
    for(const original of files){
      try{
        const file=await reduzirImagem(original);
        const nome=`${userId}/${ordemId}/${tipo}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const up=await _supabase.storage.from(BUCKET).upload(nome,file,{contentType:file.type||'image/jpeg',upsert:false});
        if(up.error)throw up.error;
        const url=_supabase.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl;
        const ins=await _supabase.from('ordem_servico_fotos').insert({user_id:userId,ordem_servico_id:ordemId,tipo,path:nome,url,descricao:null});
        if(ins.error)throw ins.error;
      }catch(e){console.error(e);msg('Uma foto não pôde ser enviada. Verifique permissões/bucket.');}
    }
    await carregarFotos(); msg('Fotos atualizadas.');
  }

  async function carregarFotos(){
    const r=await _supabase.from('ordem_servico_fotos').select('*').eq('user_id',userId).eq('ordem_servico_id',ordemId).order('created_at',{ascending:false});
    fotos=r.data||[]; render();
  }

  function render(){
    ['antes','depois'].forEach(tipo=>{
      const box=document.getElementById('fs-galeria-'+tipo); if(!box)return;
      const lista=fotos.filter(f=>f.tipo===tipo);
      if(!lista.length){box.innerHTML='<div class="fs-vazio-foto">Nenhuma foto.</div>';return;}
      box.innerHTML=lista.map(f=>`<div class="fs-foto-card"><img src="${esc(f.url)}" alt="Foto ${esc(tipo)}"><div class="fs-foto-info"><span>${esc(dataBR(f.created_at))}</span><button onclick="fsExcluirFotoOS('${esc(f.id)}','${esc(f.path)}')">Excluir</button></div></div>`).join('');
    });
  }

  window.fsExcluirFotoOS=async function(id,path){
    if(!confirm('Excluir esta foto?'))return;
    await _supabase.storage.from(BUCKET).remove([path]);
    await _supabase.from('ordem_servico_fotos').delete().eq('id',id).eq('user_id',userId);
    await carregarFotos();
  };

  async function init(){css();obterId();if(!ordemId)return;if(!await initSession())return;ui();await carregarFotos();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1300));else setTimeout(init,1300);
})();