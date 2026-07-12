(function(){
  'use strict';

  if(window.fsMenuAprimoradoInicializado)return;
  window.fsMenuAprimoradoInicializado=true;

  const $=id=>document.getElementById(id);
  const normalizar=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const planoValido=(plano,status,expira)=>normalizar(plano)==='premium'&&!['cancelado','expirado','inativo'].includes(normalizar(status||'ativo'))&&(!expira||new Date(expira).getTime()>=Date.now());
  const labelNivel=n=>n==='pro'?'Premium PRO':n==='essencial'?'Premium Essencial':'Plano Gratuito';

  function removerEfexDuplicado(){
    const links=Array.from(document.querySelectorAll('.header-menu-linha a[href]')).filter(link=>{
      try{return new URL(link.getAttribute('href'),location.origin).pathname.replace(/\/$/,'')==='/efex.html'}catch(_){return false}
    });
    links.slice(0,-1).forEach(link=>link.closest('li')?.remove());
  }

  removerEfexDuplicado();
  const observadorMenu=new MutationObserver(()=>removerEfexDuplicado());
  const menuObservado=document.querySelector('.header-menu-linha .nav-menu');
  if(menuObservado)observadorMenu.observe(menuObservado,{childList:true,subtree:true});

  function setDisplay(el,valor){if(el)el.style.display=valor}
  function fecharMenu(){
    const menu=document.querySelector('.header-menu-linha');
    const header=document.querySelector('.main-header');
    const botao=document.querySelector('.menu-mobile-btn');
    menu?.classList.remove('menu-aberto');
    header?.classList.remove('menu-aberto');
    botao?.setAttribute('aria-expanded','false');
    botao?.setAttribute('aria-label','Abrir menu');
  }

  function atualizarAcessibilidadeMenu(){
    const menu=document.querySelector('.header-menu-linha');
    const botao=document.querySelector('.menu-mobile-btn');
    if(!menu||!botao)return;
    const aberto=menu.classList.contains('menu-aberto');
    botao.setAttribute('aria-expanded',String(aberto));
    botao.setAttribute('aria-label',aberto?'Fechar menu':'Abrir menu');
  }

  const toggleOriginal=window.toggleMenuMobile;
  window.toggleMenuMobile=function(){
    if(typeof toggleOriginal==='function')toggleOriginal();
    else{
      const menu=document.querySelector('.header-menu-linha');
      const header=document.querySelector('.main-header');
      menu?.classList.toggle('menu-aberto');
      header?.classList.toggle('menu-aberto',menu?.classList.contains('menu-aberto'));
    }
    atualizarAcessibilidadeMenu();
  };

  document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharMenu()});
  document.addEventListener('click',e=>{
    const header=document.querySelector('.main-header');
    if(header?.classList.contains('menu-aberto')&&!header.contains(e.target))fecharMenu();
  });

  async function obterResumo(){
    if(!window._supabase)return {session:null};
    const {data:{session}}=await _supabase.auth.getSession();
    if(!session?.user?.id)return {session:null};

    const uid=session.user.id;
    const [perfilResp,assinaturaResp,saldoResp]=await Promise.allSettled([
      _supabase.from('perfis').select('nome,nome_empresa,plano,plano_nivel,plano_status,plano_expira_em').eq('id',uid).maybeSingle(),
      _supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id',uid).maybeSingle(),
      _supabase.rpc('fs_meu_saldo_efex')
    ]);

    const perfil=perfilResp.status==='fulfilled'?(perfilResp.value.data||{}):{};
    const assinatura=assinaturaResp.status==='fulfilled'?(assinaturaResp.value.data||{}):{};
    const saldoData=saldoResp.status==='fulfilled'?saldoResp.value.data:0;
    const expira=assinatura.expira_em||perfil.plano_expira_em||null;
    const status=assinatura.status||perfil.plano_status||'ativo';
    const premium=planoValido(assinatura.plano||perfil.plano,status,expira);
    const nivel=premium?normalizar(assinatura.nivel||perfil.plano_nivel||'essencial'):'gratis';
    const saldo=Number(saldoData?.saldo??saldoData??0)||0;
    const nome=perfil.nome||perfil.nome_empresa||session.user.user_metadata?.nome||session.user.user_metadata?.name||session.user.email?.split('@')[0]||'Usuário';

    localStorage.setItem('usuario_nome',nome);
    localStorage.setItem('usuario_email',session.user.email||'');
    localStorage.setItem('usuario_plano',premium?'premium':'gratis');
    if(status)localStorage.setItem('usuario_plano_status',status);
    if(expira)localStorage.setItem('usuario_plano_expira_em',expira);

    return {session,nome,premium,nivel,saldo};
  }

  function configurarLinksPremium(premium){
    document.querySelectorAll('[data-plano-min="premium"]').forEach(link=>{
      const li=link.closest('li');
      if(li)li.style.display='';
      link.classList.toggle('fs-link-premium-bloqueado',!premium);
      link.setAttribute('aria-label',premium?link.textContent.trim():`${link.textContent.trim()} — recurso Premium`);
      if(link.dataset.fsPremiumListener)return;
      link.dataset.fsPremiumListener='1';
      link.addEventListener('click',e=>{
        if(localStorage.getItem('usuario_plano')==='premium')return;
        e.preventDefault();
        fecharMenu();
        location.href='/planos.html#assinar-plano-premium';
      });
    });
  }

  function aplicarResumo(resumo){
    removerEfexDuplicado();
    const saudacao=$('usuario-saudacao');
    const planoEl=$('fs-menu-plano');
    const saldoEl=$('fs-menu-saldo');
    const cta=$('fs-menu-cta');
    const entrarD=$('btn-header-entrar');
    const sairD=$('btn-header-sair');
    const entrarM=$('btn-menu-mobile-entrar');
    const sairM=$('btn-menu-mobile-sair');
    const notificacoes=$('btn-notificacoes');
    const header=document.querySelector('.main-header');

    if(!resumo.session){
      if(saudacao)saudacao.textContent='Olá, Convidado';
      if(planoEl)planoEl.textContent='Acesse sua conta';
      if(saldoEl)saldoEl.textContent='Crie orçamentos gratuitamente';
      setDisplay(entrarD,'inline-flex');setDisplay(sairD,'none');
      setDisplay(entrarM,'inline-flex');setDisplay(sairM,'none');
      setDisplay(notificacoes,'none');
      if(cta)cta.style.display='none';
      localStorage.removeItem('usuario_plano');
      configurarLinksPremium(false);
    }else{
      if(saudacao)saudacao.textContent=`Olá, ${resumo.nome}`;
      if(planoEl)planoEl.textContent=labelNivel(resumo.nivel);
      if(saldoEl)saldoEl.textContent=`${resumo.saldo} crédito${resumo.saldo===1?'':'s'} Efex`;
      setDisplay(entrarD,'none');setDisplay(sairD,'inline-flex');
      setDisplay(entrarM,'none');setDisplay(sairM,'inline-flex');
      setDisplay(notificacoes,resumo.premium?'inline-flex':'none');
      configurarLinksPremium(resumo.premium);

      if(cta){
        cta.style.display='';
        const a=cta.querySelector('a');
        const strong=cta.querySelector('strong');
        const small=cta.querySelector('small');
        if(resumo.saldo<=0){
          if(a)a.href='/carteira.html';
          if(strong)strong.textContent='◈ Recarregar créditos';
          if(small)small.textContent='Escolha um pacote e pague por Pix.';
        }else if(!resumo.premium){
          if(a)a.href='/planos.html';
          if(strong)strong.textContent='◇ Conhecer o Essencial';
          if(small)small.textContent='Histórico, Caixa, relatórios e créditos mensais.';
        }else{
          if(a)a.href='/efex.html';
          if(strong)strong.textContent='✦ Pergunte ao Efex';
          if(small)small.textContent='Use seus créditos para apoiar um diagnóstico.';
        }
      }
    }

    header?.setAttribute('aria-busy','false');
    header?.classList.add('fs-header-pronto');
  }

  async function atualizar(){
    try{aplicarResumo(await obterResumo())}
    catch(erro){
      console.warn('Não foi possível atualizar o resumo do menu:',erro);
      aplicarResumo({session:null});
    }
  }

  atualizar();
  if(window._supabase){
    _supabase.auth.onAuthStateChange(()=>setTimeout(atualizar,0));
  }
})();