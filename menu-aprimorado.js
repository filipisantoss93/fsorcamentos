(function(){
  'use strict';
  if(window.fsMenuAprimoradoInicializado)return;
  window.fsMenuAprimoradoInicializado=true;

  const $=id=>document.getElementById(id);
  const normalizar=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const caminhoAtual=()=>{const p=location.pathname||'/';return p==='/'?'/index.html':p.replace(/\/$/,'')||'/index.html'};
  const planoValido=(plano,status,expira)=>normalizar(plano)==='premium'&&!['cancelado','expirado','inativo'].includes(normalizar(status||'ativo'))&&(!expira||new Date(expira).getTime()>=Date.now());
  const labelNivel=n=>n==='pro'?'Premium PRO':n==='essencial'?'Premium Essencial':'Plano Gratuito';
  let ultimoResumo=null;
  let atualizacaoEmCurso=null;
  let elementoFocoAnterior=null;

  function setDisplay(el,valor){if(el)el.style.display=valor}
  function removerItensEfexDuplicados(){
    const itens=Array.from(document.querySelectorAll('.header-menu-linha .nav-menu > li:not([data-role="efex-cta"]) > a[href]')).filter(link=>{
      try{return (new URL(link.getAttribute('href')||'',location.origin).pathname.replace(/\/$/,'')||'/')==='/efex.html'}catch(_){return false}
    });
    itens.slice(1).forEach(link=>link.closest('li')?.remove());
  }
  function limparEstadoResidualMenu(){
    document.querySelector('.header-menu-linha')?.classList.remove('menu-aberto');
    document.querySelector('.main-header')?.classList.remove('menu-aberto');
    document.body?.classList.remove('fs-menu-aberto');
    const b=document.getElementById('fs-menu-backdrop');
    if(b){b.classList.remove('visivel');b.style.display='none';b.style.pointerEvents='none'}
  }
  function obterBackdrop(){let b=$('fs-menu-backdrop');if(b)return b;b=document.createElement('button');b.type='button';b.id='fs-menu-backdrop';b.className='fs-menu-backdrop';b.setAttribute('aria-label','Fechar menu');b.addEventListener('click',fecharMenu);document.body.appendChild(b);return b}
  function atualizarAcessibilidadeMenu(){const m=document.querySelector('.header-menu-linha'),b=document.querySelector('.menu-mobile-btn');if(!m||!b){limparEstadoResidualMenu();return}const aberto=m.classList.contains('menu-aberto');b.setAttribute('aria-expanded',String(aberto));b.setAttribute('aria-label',aberto?'Fechar menu':'Abrir menu');m.setAttribute('aria-hidden',String(!aberto));const backdrop=obterBackdrop();backdrop.classList.toggle('visivel',aberto);backdrop.style.display=aberto?'block':'none';backdrop.style.pointerEvents=aberto?'auto':'none';document.body.classList.toggle('fs-menu-aberto',aberto)}
  function fecharMenu({devolverFoco=true}={}){document.querySelector('.header-menu-linha')?.classList.remove('menu-aberto');document.querySelector('.main-header')?.classList.remove('menu-aberto');atualizarAcessibilidadeMenu();if(devolverFoco)setTimeout(()=>(elementoFocoAnterior||document.querySelector('.menu-mobile-btn'))?.focus?.(),0)}
  function abrirMenu(){const m=document.querySelector('.header-menu-linha');if(!m)return;elementoFocoAnterior=document.activeElement;m.classList.add('menu-aberto');document.querySelector('.main-header')?.classList.add('menu-aberto');atualizarAcessibilidadeMenu();setTimeout(()=>m.querySelector('a:not([aria-disabled="true"]),button:not([disabled])')?.focus(),0)}
  window.toggleMenuMobile=function(){document.querySelector('.header-menu-linha')?.classList.contains('menu-aberto')?fecharMenu():abrirMenu()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharMenu()});
  window.addEventListener('pageshow',()=>limparEstadoResidualMenu());

  function marcarLinkAtivo(){const atual=caminhoAtual();document.querySelectorAll('.header-menu-linha a[href]').forEach(link=>{let path='';try{path=new URL(link.getAttribute('href')||'',location.origin).pathname.replace(/\/$/,'')||'/index.html'}catch(_){return}const ativo=path===atual&&!link.closest('[data-role="efex-cta"]');link.classList.toggle('ativo',ativo);ativo?link.setAttribute('aria-current','page'):link.removeAttribute('aria-current')})}
  async function verificarAdmin(){
    if(!window._supabase)return false;
    try{
      const {data,error}=await _supabase.rpc('fs_admin_verificar_acesso');
      if(error)return false;
      return data?.admin===true;
    }catch(_){return false}
  }
  function aplicarAcessoAdmin(admin){
    const item=$('fs-menu-admin');
    if(item){item.hidden=!admin;item.style.display=admin?'':'none'}
    localStorage.setItem('fs_usuario_admin',admin?'1':'0');
  }
  async function obterResumo(){if(!window._supabase)return {estado:'carregando'};const resp=await _supabase.auth.getSession();if(resp?.error)throw resp.error;const session=resp?.data?.session||null;if(!session?.user?.id)return {estado:'visitante',session:null,admin:false};const uid=session.user.id;const [perfilResp,assinaturaResp,saldoResp,adminResp]=await Promise.allSettled([_supabase.from('perfis').select('nome,nome_empresa,plano,plano_nivel,plano_status,plano_expira_em').eq('id',uid).maybeSingle(),_supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id',uid).maybeSingle(),_supabase.rpc('fs_meu_saldo_efex'),verificarAdmin()]);const perfil=perfilResp.status==='fulfilled'?(perfilResp.value.data||{}):{};const assinatura=assinaturaResp.status==='fulfilled'?(assinaturaResp.value.data||{}):{};const expira=assinatura.expira_em||perfil.plano_expira_em||null;const status=assinatura.status||perfil.plano_status||'ativo';const premium=planoValido(assinatura.plano||perfil.plano,status,expira);const nivel=premium?normalizar(assinatura.nivel||perfil.plano_nivel||'essencial'):'gratis';const saldo=saldoResp.status==='fulfilled'&&!saldoResp.value.error?(Number(saldoResp.value.data?.saldo??saldoResp.value.data??0)||0):null;const admin=adminResp.status==='fulfilled'&&adminResp.value===true;const nome=perfil.nome||perfil.nome_empresa||session.user.user_metadata?.nome||session.user.user_metadata?.name||session.user.email?.split('@')[0]||'Usuário';localStorage.setItem('usuario_nome',nome);localStorage.setItem('usuario_email',session.user.email||'');localStorage.setItem('usuario_plano',premium?'premium':'gratis');return {estado:'autenticado',session,nome,premium,nivel,saldo,admin}}
  function configurarLinksPremium(premium){document.querySelectorAll('[data-plano-min="premium"]').forEach(link=>{link.classList.toggle('fs-link-premium-bloqueado',!premium);if(link.dataset.fsPremiumListener)return;link.dataset.fsPremiumListener='1';link.addEventListener('click',e=>{if(localStorage.getItem('usuario_plano')==='premium')return;e.preventDefault();fecharMenu({devolverFoco:false});location.href='/planos.html#assinar-plano-premium'})})}
  function aplicarCarregando(){const h=document.querySelector('.main-header');if(h)h.setAttribute('aria-busy','true');aplicarAcessoAdmin(false);['btn-header-entrar','btn-header-sair','btn-menu-mobile-entrar','btn-menu-mobile-sair','btn-notificacoes'].forEach(id=>setDisplay($(id),'none'))}
  function aplicarResumo(r){ultimoResumo=r;removerItensEfexDuplicados();const saudacao=$('usuario-saudacao'),plano=$('fs-menu-plano'),saldo=$('fs-menu-saldo'),cta=$('fs-menu-cta'),h=document.querySelector('.main-header'),notificacoes=$('btn-notificacoes');if(r.estado==='visitante'){aplicarAcessoAdmin(false);if(saudacao)saudacao.textContent='Olá, Convidado';if(plano)plano.textContent='Acesse sua conta';if(saldo)saldo.textContent='Crie orçamentos gratuitamente';setDisplay($('btn-header-entrar'),'inline-flex');setDisplay($('btn-header-sair'),'none');setDisplay($('btn-menu-mobile-entrar'),'inline-flex');setDisplay($('btn-menu-mobile-sair'),'none');setDisplay(notificacoes,'none');if(cta)cta.style.display='none';configurarLinksPremium(false)}else if(r.estado==='autenticado'){aplicarAcessoAdmin(r.admin===true);if(saudacao)saudacao.textContent=`Olá, ${r.nome}`;if(plano)plano.textContent=r.admin?'Admin':labelNivel(r.nivel);if(saldo)saldo.textContent=r.saldo===null?'Saldo Efex indisponível':`${r.saldo} crédito${r.saldo===1?'':'s'} Efex`;setDisplay($('btn-header-entrar'),'none');setDisplay($('btn-header-sair'),'inline-flex');setDisplay($('btn-menu-mobile-entrar'),'none');setDisplay($('btn-menu-mobile-sair'),'inline-flex');setDisplay(notificacoes,'inline-flex');configurarLinksPremium(r.premium||r.admin);if(cta)cta.style.display=''}
    marcarLinkAtivo();atualizarAcessibilidadeMenu();if(h){h.setAttribute('aria-busy','false');h.classList.add('fs-header-pronto')}document.dispatchEvent(new CustomEvent('fs:estado-header',{detail:r}))
  }
  async function atualizar(){if(atualizacaoEmCurso)return atualizacaoEmCurso;aplicarCarregando();atualizacaoEmCurso=(async()=>{try{aplicarResumo(await obterResumo())}catch(e){console.warn('Não foi possível atualizar o resumo do menu:',e);if(ultimoResumo?.estado==='autenticado')aplicarResumo({...ultimoResumo,saldo:null});else aplicarCarregando()}finally{atualizacaoEmCurso=null}})();return atualizacaoEmCurso}

  limparEstadoResidualMenu();removerItensEfexDuplicados();marcarLinkAtivo();atualizarAcessibilidadeMenu();document.addEventListener('fs:header-carregado',atualizar);atualizar();if(window._supabase)_supabase.auth.onAuthStateChange(()=>setTimeout(atualizar,0));
  window.fsAtualizarResumoHeader=atualizar;window.fsFecharMenu=fecharMenu;window.fsVerificarAdmin=verificarAdmin;
})();