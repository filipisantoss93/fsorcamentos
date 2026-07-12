(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const inteiro=v=>Number(v||0).toLocaleString('pt-BR');
  const dataBR=v=>{const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?'-':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})};
  const dataHora=v=>{const d=new Date(v||'');return Number.isNaN(d.getTime())?'-':d.toLocaleString('pt-BR')};
  const escapar=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const definir=(id,v)=>{const el=$(id);if(el)el.textContent=String(v)};

  function iso(d){return d.toISOString().slice(0,10)}
  function configurarPeriodo(){const fim=new Date(),inicio=new Date();inicio.setDate(fim.getDate()-30);$('inicio').value=iso(inicio);$('fim').value=iso(fim)}
  function mostrarErro(msg){const el=$('erro');el.hidden=false;el.textContent=msg}
  function limparErro(){$('erro').hidden=true;$('erro').textContent=''}

  function renderMetricas(d){
    definir('receita-total',moeda(d.receita_total));definir('receita-assinaturas',moeda(d.receita_assinaturas));definir('receita-creditos',moeda(d.receita_creditos));definir('valor-pendente',moeda(d.valor_pendente));definir('ticket-medio',moeda(d.ticket_medio));definir('assinaturas-ativas',inteiro(d.assinaturas_ativas));definir('usuarios-novos',inteiro(d.usuarios_novos));definir('creditos-vendidos',inteiro(d.creditos_vendidos));definir('usuarios-total',inteiro(d.usuarios_total));definir('essencial-ativos',inteiro(d.essencial_ativos));definir('pro-ativos',inteiro(d.pro_ativos));definir('pagamentos-pagos',inteiro(d.pagamentos_pagos));definir('pagamentos-pendentes',inteiro(d.pagamentos_pendentes));
  }

  function renderGrafico(lista){const box=$('grafico');const dados=Array.isArray(lista)?lista:[];if(!dados.length){box.innerHTML='<div class="empty">Nenhuma receita confirmada no período.</div>';return}const max=Math.max(...dados.map(x=>Number(x.receita||0)),1);box.innerHTML=dados.map(x=>`<div class="bar"><strong>${escapar(dataBR(x.data))}</strong><div class="track"><div class="fill" style="width:${Math.max(3,Math.round(Number(x.receita||0)/max*100))}%"></div></div><strong>${moeda(x.receita)}</strong></div>`).join('')}

  function produtoLabel(p){const codigo=String(p.produto_codigo||'');if(codigo==='assinatura_essencial')return'Premium Essencial';if(codigo==='assinatura_pro')return'Premium PRO';if(p.produto_tipo==='creditos')return`${inteiro(p.creditos)} créditos Efex`;return codigo||p.produto_tipo||'Pagamento'}
  function renderPagamentos(lista){const box=$('pagamentos');const dados=Array.isArray(lista)?lista:[];if(!dados.length){box.innerHTML='<div class="empty">Nenhum pagamento no período.</div>';return}box.innerHTML=`<table class="table"><thead><tr><th>Data</th><th>Produto</th><th>Valor</th><th>Status</th><th>Pago em</th></tr></thead><tbody>${dados.map(p=>`<tr><td>${escapar(dataHora(p.criado_em))}</td><td>${escapar(produtoLabel(p))}</td><td><strong>${moeda(p.valor)}</strong></td><td><span class="badge ${escapar(String(p.status||'').toLowerCase())}">${escapar(p.status||'-')}</span></td><td>${escapar(dataHora(p.pago_em))}</td></tr>`).join('')}</tbody></table>`}

  async function carregar(){
    limparErro();$('atualizar').disabled=true;$('atualizar').textContent='Carregando...';
    try{
      const inicio=$('inicio').value,fim=$('fim').value;
      if(!inicio||!fim||fim<inicio)throw new Error('Selecione um período válido.');
      const {data,error}=await _supabase.rpc('fs_admin_dashboard_financeiro',{p_inicio:inicio,p_fim:fim});
      if(error)throw error;
      renderMetricas(data||{});renderGrafico(data?.serie_diaria);renderPagamentos(data?.ultimos_pagamentos);
    }catch(err){console.error(err);mostrarErro(String(err?.message||'Não foi possível carregar o dashboard.'));if(String(err?.message||'').toLowerCase().includes('acesso administrativo'))setTimeout(()=>location.replace('/painel.html'),1800)}
    finally{$('atualizar').disabled=false;$('atualizar').textContent='Atualizar'}
  }

  async function iniciar(){
    if(!window._supabase)return mostrarErro('Supabase não inicializado.');
    const {data:{session}}=await _supabase.auth.getSession();
    if(!session?.user?.id){location.replace('/index.html?login=1&dest='+encodeURIComponent('/admin-financeiro.html'));return}
    configurarPeriodo();$('atualizar').addEventListener('click',carregar);await carregar();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();