(function(){
  'use strict';

  function byId(id){ return document.getElementById(id); }
  function msg(t, tipo){
    if (typeof window.mostrarStatus === 'function') return window.mostrarStatus('status-logo', t, tipo || 'sucesso');
    const el = byId('status-logo');
    if (el){ el.className = 'status-msg ' + (tipo || 'sucesso'); el.textContent = t; }
  }
  async function supa(){
    for (let i=0;i<30;i++){
      if (window._supabase) return window._supabase;
      if (typeof window.inicializarSupabaseFS === 'function') window.inicializarSupabaseFS();
      await new Promise(r=>setTimeout(r,100));
    }
    return null;
  }
  async function session(){
    const s = await supa();
    if (!s) return null;
    const { data } = await s.auth.getSession();
    return data && data.session ? data.session : null;
  }
  function loadImage(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onerror = ()=>reject(new Error('Não foi possível ler a imagem.'));
      r.onload = ()=>{
        const img = new Image();
        img.onerror = ()=>reject(new Error('Formato não suportado. Use JPG, PNG ou WEBP.'));
        img.onload = ()=>resolve(img);
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  async function compress(file){
    const img = await loadImage(file);
    const max = 900;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
    let q = 0.82;
    let dataUrl = c.toDataURL('image/jpeg', q);
    while (dataUrl.length > 680000 && q > 0.5){ q -= 0.08; dataUrl = c.toDataURL('image/jpeg', q); }
    const blob = await new Promise(r=>c.toBlob(r,'image/jpeg',q));
    return { blob, dataUrl };
  }
  function preview(url){
    if (typeof window.atualizarPreviewLogo === 'function') window.atualizarPreviewLogo(url || '');
    if (typeof window.atualizarLogoEstatica === 'function') window.atualizarLogoEstatica(url || '');
    const a = byId('preview-logo'); const b = byId('logo-placeholder');
    if (a && b){ a.src = url || ''; a.style.display = url ? 'block':'none'; b.style.display = url ? 'none':'block'; }
    const c = byId('perfil-logo-img'); const d = byId('perfil-logo-placeholder');
    if (c && d){ c.src = url || ''; c.style.display = url ? 'block':'none'; d.style.display = url ? 'none':'block'; }
  }
  async function savePerfil(sess, url){
    const { error } = await window._supabase.from('perfis').upsert({ id: sess.user.id, foto_url: url || '', atualizado_em: new Date().toISOString() }, { onConflict:'id' });
    if (error) throw error;
    const input = byId('foto_url'); if (input) input.value = url || '';
    if (url) localStorage.setItem('foto_url', url); else localStorage.removeItem('foto_url');
    if (window.perfilAtual) window.perfilAtual.foto_url = url || '';
    preview(url || '');
  }
  async function enviarLogoPerfil(file){
    const sess = await session();
    if (!sess){ msg('Sessão não encontrada. Faça login novamente.', 'erro'); return; }
    if (!file || !String(file.type||'').startsWith('image/')){ msg('Selecione uma imagem válida.', 'erro'); return; }
    try{
      msg('Otimizando imagem...', 'info');
      const img = await compress(file);
      let url = '';
      try{
        msg('Enviando imagem...', 'info');
        const path = sess.user.id + '/logo-' + Date.now() + '.jpg';
        const up = await window._supabase.storage.from('logos').upload(path, img.blob, { contentType:'image/jpeg', upsert:false, cacheControl:'3600' });
        if (up.error) throw up.error;
        const pub = window._supabase.storage.from('logos').getPublicUrl(path);
        url = pub.data.publicUrl + '?v=' + Date.now();
      }catch(e){
        console.warn('Upload no bucket logos falhou, usando imagem otimizada no perfil:', e);
        url = img.dataUrl;
      }
      await savePerfil(sess, url);
      msg(url.startsWith('data:') ? 'Imagem salva no perfil. Para URL pública, ajuste o bucket logos.' : 'Foto/logo salva com sucesso.', url.startsWith('data:') ? 'info' : 'sucesso');
    }catch(e){
      console.error(e);
      msg('Erro ao salvar foto do perfil: ' + (e.message || 'tente novamente.'), 'erro');
    }
  }
  async function removerLogoPerfil(){
    if (!confirm('Deseja remover a foto/logo do perfil?')) return;
    const sess = await session();
    if (!sess){ msg('Sessão não encontrada.', 'erro'); return; }
    try{ await savePerfil(sess, ''); msg('Foto/logo removida.', 'sucesso'); }catch(e){ msg('Erro ao remover foto/logo.', 'erro'); }
  }
  function instalar(){
    const old = byId('logo_file');
    if (!old || old.dataset.logoFix === '1') return;
    const input = old.cloneNode(true);
    input.dataset.logoFix = '1';
    input.dataset.configurado = 'sim';
    old.parentNode.replaceChild(input, old);
    input.addEventListener('change', async (ev)=>{ const f = ev.target.files && ev.target.files[0]; if (f) await enviarLogoPerfil(f); ev.target.value=''; });
    window.enviarLogoPerfil = enviarLogoPerfil;
    window.removerLogoPerfil = removerLogoPerfil;
  }
  window.enviarLogoPerfil = enviarLogoPerfil;
  window.removerLogoPerfil = removerLogoPerfil;
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(instalar,300); setTimeout(instalar,1200); });
  setTimeout(instalar,700);
})();
