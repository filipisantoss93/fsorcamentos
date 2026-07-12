(function(){
  'use strict';

  if(window.fsMenuAprimoradoInicializado)return;
  window.fsMenuAprimoradoInicializado=true;

  const $=id=>document.getElementById(id);
  const normalizar=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const planoValido=(plano,status,expira)=>normalizar(plano)==='premium'&&!['cancelado','expirado','inativo'].includes(normalizar(status||'ativo'))&&(!expira||new Date(expira).getTime()>=Date.now());
  const labelNivel=n=>n==='pro'?'Premium PRO':n==='essencial'?'Premium Essencial':'Plano Gratuito';
  const caminhoAtual=()=>{const p=location.pathname||'/';return p==='/'?'/index.html':p.replace(/\/$/,'')||'/index.html'};

  let ultimoResumo=null;
  let elementoFocoAnterior=null;

  function setDisplay(el,valor){if(el)el.style.display=valor}

  function obterBackdrop(){
    let backdrop=$('fs-menu-backdrop');
    if(backdrop)return backdrop;
    backdrop=document.createElement('button');
    backdrop.type='button';
    backdrop.id='fs-menu-backdrop';
    backdrop.className='fs-menu-backdrop';
    backdrop.setAttribute('aria-label','Fechar menu');
    backdrop.addEventListener('click',fecharMenu);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function atualizarAcessibilidadeMenu(){
    const menu=document.querySelector('.header-menu-linha');
    const botao=document.querySelector('.menu-mobile-btn');
    if(!menu||!botao)return;
    const aberto=menu.classList.contains('menu-aberto');
    botao.setAttribute('aria-expanded',String(aberto));
    botao.setAttribute('aria-label',aberto?'Fechar menu':'Abrir menu');
    menu.setAttribute('aria-hidden',String(!aberto));
    obterBackdrop().classList.toggle('visivel',aberto);
    document.body.classList.toggle('fs-menu-aberto',aberto);
  }

  function fecharMenu({devolverFoco=true}={}){
    const menu=document.querySelector('.header-menu-linha');
    const header=document.querySelector('.main-header');
    menu?.classList.remove('menu-aberto');
    header?.classList.remove('menu-aberto');
    atualizarAcessibilidadeMenu();
    if(devolverFoco){
      const alvo=elementoFocoAnterior||document.querySelector('.menu-mobile-btn');
      setTimeout(()=>alvo?.focus?.(),0);
    }
  }

  function abrirMenu(){
    const menu=document.querySelector('.header-menu-linha');
    const header=document.querySelector('.main-header');
    if(!menu)return;
    elementoFocoAnterior=document.activeElement;
    menu.classList.add('menu-aberto');
    header?.classList.add('menu-aberto');
    atualizarAcessibilidadeMenu();
    setTimeout(()=>menu.querySelector('a:not([aria-disabled="true"]),button:not([disabled])')?.focus(),0);
  }

  window.toggleMenuMobile=function(){
    const menu=document.querySelector('.header-menu-linha');
    if(menu?.classList.contains('menu-aberto'))fecharMenu();
    else abrirMenu();
  };

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')fecharMenu();
  });

  function marcarLinkAtivo(){
    const atual=caminhoAtual();
    document.querySelectorAll('.header-menu-linha a[href]').forEach(link=>{
      const href=link.getAttribute('href')||'';
      let path='';
      try{path=new URL(href,location.origin).pathname.replace(/\/$/,'')||'/index.html'}catch(_){return}
      const ativo=path===atual;
      link.classList.toggle('ativo',ativo);
      if(ativo)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }

  async function obterResumo(){
    if(!window._supabase)return {session:null,erroSessao:true};
    const sessaoResp=await _supabase.auth.getSession();
    const session=sessaoResp?.data?.session||null;
    if(!session?.user?.id)return {session:null};

    const uid=session.user.id;
    const [perfilResp,assinaturaResp,saldoResp]=await Promise.allSettled([
      _supabase.from('perfis').select('nome,nome_empresa,plano,plano_nivel,plano_status,plano_expira_em').eq('id',uid).maybeSingle(),
      _supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id',uid).maybeSingle(),
      _supabase.rpc('fs_meu_saldo_efex')
    ]);

    const perfil=perfilResp.status==='fulfilled'?(perfilResp.value.data||{}):{};
    const assinatura=assinaturaResp.status==='fulfilled'?(assinaturaResp.value.data||{}):{};
    const saldoDisponivel=saldoResp.status==='fulfilled'&&!saldoResp.value.error;
    const saldoData=saldoDisponivel?saldoResp.value.data:null;
    const expira=assinatura.expira_em||perfil.plano_expira_em||null;
    const status=assinatura.status||perfil.plano_status||'ativo';
    const premium=planoValido(assinatura.plano||perfil.plano,status,expira);
    const nivel=premium?normalizar(assinatura.nivel||perfil.plano_nivel||'essencial'):'gratis';
    const saldo=saldoDisponivel?(Number(saldoData?.saldo??saldoData??0)||0):null;
    const nome=perfil.nome||perfil.nome_empresa||session.user.user_metadata?.nome||session.user.user_metadata?.name||session.user.email?.split('@')[0]||'Usuário';

    localStorage.setItem('usuario_nome',nome);
    localStorage.setItem('usuario_email',session.user.email||'');
    localStorage.setItem('usuario_plano',premium?'premium':'gratis');
    if(status)localStorage.setItem('usuario_plano_status',status);else localStorage.removeItem('usuario_plano_status');
    if(expira)localStorage.setItem('usuario_plano_expira_em',expira);else localStorage.removeItem('usuario_plano_expira_em');

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
        fecharMenu({devolverFoco:false});
        location.href='/planos.html#assinar-plano-premium';
      });
    });
  }

  function aplicarResumo(resumo){
    ultimoResumo=resumo;
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
      localStorage.removeItem('usuario_plano_status');
      localStorage.removeItem('usuario_plano_expira_em');
      configurarLinksPremium(false);
    }else{
      if(saudacao)saudacao.textContent=`Olá, ${resumo.nome}`;
      if(planoEl)planoEl.textContent=labelNivel(resumo.nivel);
      if(saldoEl)saldoEl.textContent=resumo.saldo===null?'Saldo Efex indisponível':`${resumo.saldo} crédito${resumo.saldo===1?'':'s'} Efex`;
      setDisplay(entrarD,'none');setDisplay(sairD,'inline-flex');
      setDisplay(entrarM,'none');setDisplay(sairM,'inline-flex');
      setDisplay(notificacoes,resumo.premium?'inline-flex':'none');
      configurarLinksPremium(resumo.premium);

      if(cta){
        cta.style.display='';
        const a=cta.querySelector('a');
        const strong=cta.querySelector('strong');
        const small=cta.querySelector('small');
        if(resumo.saldo===0){
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
          if(small)small.textContent=resumo.saldo===null?'Acesse o especialista da oficina.':'Use seus créditos para apoiar um diagnóstico.';
        }
      }
    }

    marcarLinkAtivo();
    atualizarAcessibilidadeMenu();
    header?.setAttribute('aria-busy','false');
    header?.classList.add('fs-header-pronto');
  }

  async function atualizar(){
    try{aplicarResumo(await obterResumo())}
    catch(erro){
      console.warn('Não foi possível atualizar o resumo do menu:',erro);
      if(ultimoResumo?.session)aplicarResumo({...ultimoResumo,saldo:null});
      else aplicarResumo({session:null});
    }
  }

  marcarLinkAtivo();
  atualizarAcessibilidadeMenu();
  atualizar();
  setTimeout(atualizar,450);

  if(window._supabase){
    _supabase.auth.onAuthStateChange(()=>setTimeout(atualizar,0));
  }

  window.fsAtualizarResumoHeader=atualizar;
  window.fsFecharMenu=fecharMenu;
})();