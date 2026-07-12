// ==================== NOTIFICACOES.JS ====================
// Central de notificações integrada ao header, sem observador global do DOM.
(function(){
  'use strict';
  if(window.fsNotificacoesInicializadas)return;
  window.fsNotificacoesInicializadas=true;

  const LIMITE=20;
  let canal=null;
  let usuarioId=null;
  let cache=[];
  let totalNaoLidas=0;
  let overflowAnterior='';
  let focoAnterior=null;
  let carregamentoEmCurso=null;

  const embed=()=>{
    try{
      const p=new URLSearchParams(location.search);
      return p.get('embed')==='1'||p.get('iframe')==='1';
    }catch(_){return false}
  };

  if(embed()){
    ['abrirModalNotificacoes','fecharModalNotificacoes','marcarTodasNotificacoesComoLidas','limparNotificacoes']
      .forEach(nome=>window[nome]=async()=>{});
    return;
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
  const norm=v=>String(v||'info').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const dataBR=v=>{
    const d=new Date(v||'');
    return Number.isNaN(d.getTime())?'':d.toLocaleString('pt-BR',{
      day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'
    });
  };
  const tipoClasse=t=>t.includes('aprovado')?'notificacao-aprovado':t.includes('recusado')?'notificacao-recusado':t.includes('pix')?'notificacao-pix':t.includes('forum')?'notificacao-forum':t.includes('agenda')?'notificacao-agenda':t.includes('estoque')?'notificacao-estoque':t.includes('os_')||t.includes('ordem')?'notificacao-os':'notificacao-info';
  const icone=t=>t.includes('aprovado')?'✅':t.includes('recusado')?'❌':t.includes('pix')?'💠':t.includes('forum_resposta')?'💬':t.includes('forum_curtida')?'👍':t.includes('forum')?'👥':t.includes('agenda')?'📅':t.includes('estoque')?'📦':t.includes('os_')||t.includes('ordem')?'🧾':'🔔';

  function linkInterno(valor){
    const s=String(valor||'').trim();
    if(!s)return'';
    const caminho=s.startsWith('/')?s:`/${s.replace(/^\/+/, '')}`;
    if(caminho.startsWith('//'))return'';
    try{
      const u=new URL(caminho,location.origin);
      return u.origin===location.origin?`${u.pathname}${u.search}${u.hash}`:'';
    }catch(_){return''}
  }

  function obterLink(n){
    return linkInterno(n?.link)
      ||(n?.orcamento_id?`/orcamentos.html?orcamento=${encodeURIComponent(n.orcamento_id)}`:'')
      ||(n?.entidade_tipo==='forum_topico'&&n?.entidade_id?`/forum.html#topico=${encodeURIComponent(n.entidade_id)}`:'')
      ||(String(n?.tipo||'').includes('forum')?'/forum.html':'');
  }

  function sincronizarHeader(){
    const btn=document.getElementById('btn-notificacoes');
    const contador=document.getElementById('contador-notificacoes');
    if(btn)btn.style.display=usuarioId?'inline-flex':'none';
    if(contador){
      const texto=totalNaoLidas>=99?'99+':String(totalNaoLidas);
      if(contador.textContent!==texto)contador.textContent=texto;
      contador.style.display=totalNaoLidas>0?'inline-flex':'none';
      contador.setAttribute('aria-label',`${totalNaoLidas} notificação${totalNaoLidas===1?'':'ões'} não lida${totalNaoLidas===1?'':'s'}`);
    }
  }

  document.addEventListener('fs:header-carregado',sincronizarHeader);
  document.addEventListener('fs:estado-header',sincronizarHeader);
  window.addEventListener('pageshow',sincronizarHeader);

  function criarModal(){
    if(document.getElementById('modal-notificacoes'))return;
    const m=document.createElement('div');
    m.id='modal-notificacoes';
    m.className='modal-notificacoes-overlay';
    m.setAttribute('aria-hidden','true');
    m.innerHTML=`<div class="modal-notificacoes-card" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-notificacoes"><div class="modal-notificacoes-topo"><div><strong id="titulo-modal-notificacoes">Notificações</strong><span>Avisos recentes da plataforma.</span></div><button type="button" class="notificacoes-fechar" aria-label="Fechar notificações">×</button></div><div id="lista-notificacoes" class="lista-notificacoes"><div class="notificacao-vazia">Carregando notificações...</div></div><div class="notificacoes-acoes"><button type="button" class="notificacoes-link-acao" data-acao="ler-todas">Marcar todas como lidas</button><button type="button" class="notificacoes-link-acao limpar" data-acao="limpar">Limpar notificações</button></div></div>`;
    m.addEventListener('click',e=>{
      if(e.target===m||e.target.closest('.notificacoes-fechar'))fecharModal();
      const acao=e.target.closest('[data-acao]')?.dataset.acao;
      if(acao==='ler-todas')marcarTodas();
      if(acao==='limpar')limpar();
    });
    document.body.appendChild(m);
  }

  function render(){
    const lista=document.getElementById('lista-notificacoes');
    if(!lista)return;
    if(!cache.length){
      lista.innerHTML='<div class="notificacao-vazia">Nenhuma notificação recente.</div>';
      return;
    }
    lista.innerHTML=`<div class="notificacoes-tabela-wrap"><table class="notificacoes-tabela"><thead><tr><th>Status</th><th>Notificação</th><th>Data</th><th>Ação</th></tr></thead><tbody>${cache.map(n=>{
      const t=norm(n.tipo);
      return `<tr class="notificacao-linha ${tipoClasse(t)} ${n.lida?'lida':'nao-lida'}" data-id="${esc(n.id)}" tabindex="0" role="button"><td class="notificacao-status"><span>${n.lida?'Lida':'Nova'}</span></td><td class="notificacao-texto"><strong>${icone(t)} ${esc(n.titulo||'Notificação')}</strong><small>${esc(n.mensagem||'')}</small></td><td class="notificacao-data">${dataBR(n.criado_em)}</td><td class="notificacao-acao">${obterLink(n)?'<button type="button" tabindex="-1">Abrir</button>':'<span>-</span>'}</td></tr>`;
    }).join('')}</tbody></table></div>`;
    lista.onclick=e=>{
      const linha=e.target.closest('[data-id]');
      if(linha)abrir(linha.dataset.id);
    };
    lista.onkeydown=e=>{
      if(!['Enter',' '].includes(e.key))return;
      const linha=e.target.closest('[data-id]');
      if(linha){e.preventDefault();abrir(linha.dataset.id)}
    };
  }

  async function contar(){
    if(!usuarioId)return;
    const {count,error}=await _supabase.from('notificacoes').select('id',{count:'exact',head:true}).eq('usuario_id',usuarioId).eq('lida',false);
    if(!error){totalNaoLidas=Number(count||0);sincronizarHeader()}
  }

  async function carregar(){
    if(!usuarioId)return;
    if(carregamentoEmCurso)return carregamentoEmCurso;
    carregamentoEmCurso=(async()=>{
      const {data,error}=await _supabase.from('notificacoes').select('*').eq('usuario_id',usuarioId).order('criado_em',{ascending:false}).limit(LIMITE);
      if(!error){cache=data||[];render()}
      await contar();
    })().finally(()=>{carregamentoEmCurso=null});
    return carregamentoEmCurso;
  }

  function parar(){
    if(canal&&window._supabase)_supabase.removeChannel(canal);
    canal=null;
    usuarioId=null;
    cache=[];
    totalNaoLidas=0;
    sincronizarHeader();
  }

  async function iniciar(session){
    const id=session?.user?.id;
    if(!id){parar();return}
    if(usuarioId===id){sincronizarHeader();return carregar()}
    parar();
    usuarioId=id;
    sincronizarHeader();
    await carregar();
    canal=_supabase.channel(`notificacoes-${id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'notificacoes',filter:`usuario_id=eq.${id}`},async payload=>{
        if(payload.eventType==='INSERT'&&payload.new){
          cache=[payload.new,...cache.filter(n=>String(n.id)!==String(payload.new.id))].slice(0,LIMITE);
          render();
          toast(payload.new);
          notificacaoNavegador(payload.new);
        }else{
          await carregar();
        }
        await contar();
      }).subscribe();
  }

  async function abrirModal(){
    criarModal();
    const m=document.getElementById('modal-notificacoes');
    focoAnterior=document.activeElement;
    overflowAnterior=document.body.style.overflow;
    m.style.display='flex';
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    m.querySelector('.notificacoes-fechar')?.focus();
    await carregar();
  }

  function fecharModal(){
    const m=document.getElementById('modal-notificacoes');
    if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}
    document.body.style.overflow=overflowAnterior;
    focoAnterior?.focus?.();
    focoAnterior=null;
  }

  async function marcar(id){
    if(!usuarioId||!id)return false;
    const {error}=await _supabase.from('notificacoes').update({lida:true}).eq('usuario_id',usuarioId).eq('id',id);
    if(error)return false;
    cache=cache.map(n=>String(n.id)===String(id)?{...n,lida:true}:n);
    totalNaoLidas=Math.max(0,totalNaoLidas-1);
    sincronizarHeader();
    render();
    return true;
  }

  async function abrir(id){
    const n=cache.find(item=>String(item.id)===String(id));
    if(!n)return;
    await marcar(n.id);
    const link=obterLink(n);
    if(link)location.assign(link);
  }

  async function marcarTodas(){
    if(!usuarioId)return;
    const {error}=await _supabase.from('notificacoes').update({lida:true}).eq('usuario_id',usuarioId).eq('lida',false);
    if(error)return alert('Não foi possível marcar as notificações como lidas.');
    cache=cache.map(n=>({...n,lida:true}));
    totalNaoLidas=0;
    sincronizarHeader();
    render();
  }

  async function limpar(){
    if(!usuarioId||!confirm('Limpar todas as notificações?'))return;
    const {error}=await _supabase.from('notificacoes').delete().eq('usuario_id',usuarioId);
    if(error)return alert('Não foi possível limpar as notificações.');
    cache=[];
    totalNaoLidas=0;
    sincronizarHeader();
    render();
  }

  function toast(n){
    document.getElementById('toast-notificacao-orcamento')?.remove();
    const t=document.createElement('div');
    t.id='toast-notificacao-orcamento';
    t.innerHTML=`<strong>${esc(n.titulo||'Notificação')}</strong><span>${esc(n.mensagem||'')}</span><button type="button">Abrir</button>`;
    t.querySelector('button').onclick=()=>abrir(n.id);
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),9000);
  }

  function notificacaoNavegador(n){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    const aviso=new Notification(n.titulo||'FS Orçamentos',{body:n.mensagem||'Você recebeu uma atualização.',icon:'/favicon.png'});
    aviso.onclick=()=>{
      window.focus();
      const link=obterLink(n);
      if(link)location.assign(link);
      aviso.close();
    };
  }

  function estilo(){
    if(document.getElementById('style-notificacoes-fs'))return;
    const s=document.createElement('style');
    s.id='style-notificacoes-fs';
    s.textContent=`.btn-notificacoes-header{position:relative;border:1px solid rgba(246,181,0,.72);background:rgba(246,181,0,.14);color:#f6b500;border-radius:999px;width:34px;height:34px;align-items:center;justify-content:center;cursor:pointer}.contador-notificacoes{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;background:#dc2626;color:#fff;border-radius:999px;font-size:10px;font-weight:900;align-items:center;justify-content:center;border:2px solid #07111f}.modal-notificacoes-overlay{position:fixed;inset:0;background:rgba(7,17,31,.72);display:none;align-items:center;justify-content:center;z-index:20000;padding:10px}.modal-notificacoes-card{width:min(720px,calc(100vw - 16px));max-height:76vh;display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#07111f;border-radius:16px;border:1px solid rgba(21,101,192,.24);box-shadow:0 24px 70px rgba(7,17,31,.38)}.modal-notificacoes-topo{background:linear-gradient(135deg,#07111f,#0c2745);color:#fff;border-bottom:4px solid #f6b500;padding:13px 16px;display:flex;justify-content:space-between;align-items:center}.modal-notificacoes-topo strong,.modal-notificacoes-topo span{display:block}.modal-notificacoes-topo span{color:#cbd9e8;font-size:11px}.notificacoes-fechar{background:transparent;color:#fff;border:0;font-size:24px;cursor:pointer}.lista-notificacoes{overflow:auto;flex:1}.notificacao-vazia{margin:10px;padding:12px;background:#f5f9ff;border-left:3px solid #1565c0;text-align:center}.notificacoes-tabela{width:100%;border-collapse:collapse;min-width:620px}.notificacoes-tabela th{background:#eaf3ff;padding:7px;text-align:left;font-size:10px}.notificacoes-tabela td{border-bottom:1px solid #dbe4ee;padding:7px;font-size:11px}.notificacao-linha{cursor:pointer;border-left:3px solid #1565c0}.notificacao-linha.nao-lida{background:#fffaf0}.notificacao-linha.lida{opacity:.76}.notificacao-aprovado{border-left-color:#16a34a}.notificacao-recusado{border-left-color:#dc2626}.notificacao-forum{border-left-color:#7c3aed}.notificacao-agenda{border-left-color:#f59e0b}.notificacao-estoque{border-left-color:#0891b2}.notificacao-os{border-left-color:#b45309}.notificacao-texto strong,.notificacao-texto small{display:block}.notificacao-texto small{color:#475569}.notificacao-status span{background:#edf4fb;border:1px solid #c8d9e9;border-radius:999px;padding:2px 6px}.nao-lida .notificacao-status span{background:#f6b500;border-color:#07111f}.notificacoes-acoes{display:flex;justify-content:flex-end;gap:14px;padding:10px 14px;background:#f4f8fc;border-top:1px solid #dbe4ee}.notificacoes-link-acao{background:none;border:0;color:#1565c0;font-weight:800;cursor:pointer}.notificacoes-link-acao.limpar{color:#b91c1c}#toast-notificacao-orcamento{position:fixed;right:18px;top:90px;width:min(380px,calc(100vw - 36px));display:grid;gap:7px;background:#fff;border:1px solid #c8d9e9;border-left:7px solid #1565c0;border-radius:14px;padding:14px;z-index:17000;box-shadow:0 18px 48px rgba(7,17,31,.28)}#toast-notificacao-orcamento button{width:max-content;background:#1565c0;color:#fff;border:0;border-radius:8px;padding:7px 11px;font-weight:800}`;
    document.head.appendChild(s);
  }

  async function init(){
    if(!window._supabase)return;
    estilo();
    criarModal();
    const {data}=await _supabase.auth.getSession();
    await iniciar(data?.session);
    _supabase.auth.onAuthStateChange((_,session)=>setTimeout(()=>iniciar(session),0));
    sincronizarHeader();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharModal()});
  window.abrirModalNotificacoes=abrirModal;
  window.fecharModalNotificacoes=fecharModal;
  window.marcarTodasNotificacoesComoLidas=marcarTodas;
  window.limparNotificacoes=limpar;
  window.abrirNotificacao=abrir;
  window.fsSincronizarNotificacoesHeader=sincronizarHeader;
})();