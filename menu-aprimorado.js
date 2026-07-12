(async function(){
  'use strict';
  const planoEl=document.getElementById('fs-menu-plano');
  const saldoEl=document.getElementById('fs-menu-saldo');
  const cta=document.getElementById('fs-menu-cta');
  if(!planoEl||!saldoEl||!window._supabase)return;

  const normalizar=v=>String(v||'').toLowerCase().trim();
  const labelNivel=n=>n==='pro'?'Premium PRO':n==='essencial'?'Premium Essencial':'Plano Gratuito';

  try{
    const {data:{session}}=await _supabase.auth.getSession();
    if(!session?.user?.id){
      planoEl.textContent='Acesse sua conta';
      saldoEl.textContent='Crie orçamentos gratuitamente';
      if(cta)cta.style.display='none';
      return;
    }

    const uid=session.user.id;
    const [perfilResp,assinaturaResp,saldoResp]=await Promise.all([
      _supabase.from('perfis').select('plano,plano_nivel,plano_status,plano_expira_em').eq('id',uid).maybeSingle(),
      _supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id',uid).maybeSingle(),
      _supabase.rpc('fs_meu_saldo_efex')
    ]);

    const perfil=perfilResp.data||{};
    const assinatura=assinaturaResp.data||{};
    const expira=assinatura.expira_em||perfil.plano_expira_em;
    const status=normalizar(assinatura.status||perfil.plano_status||'ativo');
    const premium=normalizar(assinatura.plano||perfil.plano)==='premium'&&!['cancelado','expirado'].includes(status)&&(!expira||new Date(expira).getTime()>=Date.now());
    const nivel=premium?normalizar(assinatura.nivel||perfil.plano_nivel||'essencial'):'gratis';
    const saldo=Number(saldoResp.data?.saldo??saldoResp.data??0)||0;

    planoEl.textContent=labelNivel(nivel);
    saldoEl.textContent=`${saldo} crédito${saldo===1?'':'s'} Efex`;

    if(cta){
      const strong=cta.querySelector('strong');
      const small=cta.querySelector('small');
      if(saldo<=0){
        cta.querySelector('a').href='/carteira.html';
        if(strong)strong.textContent='◈ Recarregar créditos';
        if(small)small.textContent='Escolha um pacote e pague por Pix.';
      }else if(nivel==='gratis'){
        cta.querySelector('a').href='/planos.html';
        if(strong)strong.textContent='◇ Conhecer o Essencial';
        if(small)small.textContent='Histórico, Caixa, relatórios e 15 créditos por mês.';
      }
    }
  }catch(erro){
    console.warn('Não foi possível atualizar o resumo do menu:',erro);
    planoEl.textContent='Minha conta';
    saldoEl.textContent='Saldo indisponível';
  }
})();
