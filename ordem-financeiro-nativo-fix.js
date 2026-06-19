/* FS Orçamentos — financeiro nativo da OS
   Usa o formulário existente em ordem.html e evita card duplicado de pagamento.
*/
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const num=v=>{const n=Number(String(v||0).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:0};
  const val=id=>$(id)?.value?.trim()||'';
  const setVal=(id,v)=>{const e=$(id);if(e)e.value=String(v??'')};
  const setTxt=(id,v)=>{const e=$(id);if(e)e.textContent=String(v)};

  function ordemId(){
    const p=new URLSearchParams(location.search);
    return p.get('id')||p.get('ordem_id')||p.get('os_id')||localStorage.getItem('ultima_os_aberta_id')||'';
  }

  function totalItensTela(){
    const materiais=num($('detalhe-valor-materiais')?.textContent||0);
    if(materiais>0)return materiais;
    let total=0;
    document.querySelectorAll('#lista-itens-ordem .item-ordem-card,#lista-itens-ordem .ordem-item,#lista-itens-ordem article,#lista-itens-ordem .card').forEach(el=>{
      const t=el.textContent||'';
      const achou=[...t.matchAll(/R\$\s*([0-9\.]+,[0-9]{2})/g)].pop();
      if(achou)total+=num(achou[1]);
    });
    return total;
  }

  function calcular(){
    const itens=totalItensTela();
    const mao=num(val('financeiro-valor-mao-obra'));
    const desc=num(val('financeiro-desconto'));
    const entrada=num(val('financeiro-valor-entrada'));
    let pago=num(val('financeiro-valor-pago'));
    const status=val('financeiro-status-pagamento')||'pendente';
    const total=Math.max(itens+mao-desc,0);

    if(status==='pendente')pago=0;
    if(status==='pago')pago=total;
    if(status==='parcial'&&entrada>pago)pago=entrada;
    if(total>0&&pago>total)pago=total;

    const saldo=Math.max(total-pago,0);
    setVal('financeiro-valor-pago',pago.toFixed(2));
    setVal('financeiro-valor-total',total.toFixed(2));
    setVal('financeiro-saldo-restante',saldo.toFixed(2));
    setTxt('detalhe-valor-entrada',moeda(entrada));
    setTxt('detalhe-valor-pago',moeda(pago));
    setTxt('detalhe-saldo-restante',moeda(saldo));
    setTxt('detalhe-valor-total',moeda(total));
    setTxt('detalhe-forma-pagamento',val('financeiro-forma-pagamento')||'-');
    return{valor_mao_obra:mao,desconto:desc,valor_materiais:itens,valor_total:total,valor_entrada:entrada,valor_pago:pago,saldo_restante:saldo,forma_pagamento:val('financeiro-forma-pagamento')||null,status_pagamento:status};
  }

  async function salvar(ev){
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const id=ordemId();
    if(!id||!window._supabase)return;
    const dados=calcular();
    const btn=$('btn-salvar-financeiro');
    const old=btn?.textContent||'Salvar pagamento';
    try{
      if(btn){btn.disabled=true;btn.textContent='Salvando...'}
      const s=await _supabase.auth.getSession();
      const uid=s.data.session?.user?.id;
      if(!uid)throw new Error('sem sessão');
      const r=await _supabase.from('ordens_servico').update(dados).eq('id',id).eq('user_id',uid).select('*').maybeSingle();
      if(r.error)throw r.error;
      window.dispatchEvent(new CustomEvent('fs:pagamento-os-atualizado',{detail:dados}));
      if(window.mostrarMensagemFinanceiroOrdem)window.mostrarMensagemFinanceiroOrdem('Pagamento salvo com sucesso.','sucesso');
      else if(window.mostrarMensagemOrdem)window.mostrarMensagemOrdem('Pagamento salvo com sucesso.','sucesso');
    }catch(e){
      console.error(e);
      if(window.mostrarMensagemFinanceiroOrdem)window.mostrarMensagemFinanceiroOrdem('Erro ao salvar pagamento.','erro');
      else alert('Erro ao salvar pagamento.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old;}
    }
  }

  function removerCardDuplicado(){
    document.getElementById('fs-pag-ctrl')?.remove();
  }

  function iniciar(){
    removerCardDuplicado();
    const form=$('form-financeiro-ordem');
    if(!form||form.dataset.fsFinanceiroNativoFix==='1')return;
    form.dataset.fsFinanceiroNativoFix='1';
    form.addEventListener('submit',salvar,true);
    ['financeiro-valor-mao-obra','financeiro-desconto','financeiro-valor-entrada','financeiro-valor-pago','financeiro-forma-pagamento','financeiro-status-pagamento'].forEach(id=>$(id)?.addEventListener('input',calcular));
    $('financeiro-status-pagamento')?.addEventListener('change',calcular);
    setTimeout(calcular,400);
    setTimeout(calcular,1400);
  }

  window.fsCalcularFinanceiroNativoOS=calcular;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,1200));
  else setTimeout(iniciar,1200);
})();