/* FS Orçamentos — Relatórios Premium seguro
   Sem MutationObserver infinito e sem tema marrom. */
(function(){
  'use strict';

  let fsRelatoriosProInstalado = false;
  let fsRelatoriosProTimer = null;

  function css(){
    if(document.getElementById('fs-relatorios-pro-css')) return;
    const s=document.createElement('style');
    s.id='fs-relatorios-pro-css';
    s.textContent=`
      .fs-rel-actions{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 10px}.fs-rel-actions button,.fs-rel-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:8px 10px;border-radius:5px;border:1px solid #374151;background:#374151;color:#fff;font-size:12px;font-weight:950;text-decoration:none;cursor:pointer}.fs-rel-actions .sec{background:#fff;color:#111827;border-color:#d1d5db}.fs-rel-extra{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.fs-rel-table{width:100%;border-collapse:collapse;min-width:600px;background:#fff;color:#111827}.fs-rel-table th{background:#f3f4f6;color:#0f172a;font-size:10px;text-transform:uppercase;text-align:left;padding:8px;font-weight:950;border-bottom:1px solid #e5e7eb}.fs-rel-table td{padding:8px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:12px;line-height:1.25;vertical-align:middle}.fs-rel-table tbody tr:nth-child(even){background:#f9fafb}.fs-rel-table tbody tr:hover{background:#f3f4f6}@media(max-width:900px){.fs-rel-extra{grid-template-columns:1fr}.fs-rel-actions button,.fs-rel-actions a{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function moeda(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,'_');}
  function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
  function ordens(){return Array.isArray(window.ordensRelatorioCache)?window.ordensRelatorioCache:[];}
  function valorOS(o){return num(o.valor_total||o.total||o.valor_final||0);}
  function pagoOS(o){return num(o.valor_pago||0);}
  function saldoOS(o){return num(o.saldo_restante||Math.max(valorOS(o)-pagoOS(o),0));}

  function inserirAcoes(){
    if(document.getElementById('fs-rel-actions')) return;
    const filtros=document.querySelector('.filtros-relatorios');
    if(!filtros) return;
    const div=document.createElement('div');
    div.id='fs-rel-actions';
    div.className='fs-rel-actions';
    div.innerHTML='<button type="button" onclick="fsImprimirRelatorioPremium()">Imprimir relatório</button><button type="button" class="sec" onclick="fsExportarRelatorioCSV()">Exportar CSV</button><a class="sec" href="dashboard.html" target="_top">Dashboard</a><a class="sec" href="fluxo-caixa.html" target="_top">Fluxo de caixa</a>';
    filtros.insertAdjacentElement('afterend',div);
  }

  function tabela(containerId,lista,vazio){
    const c=document.getElementById(containerId);
    if(!c) return;
    if(!lista.length){c.innerHTML=`<div class="estado-vazio">${esc(vazio)}</div>`;return;}
    c.innerHTML=`<table class="fs-rel-table"><thead><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>${lista.map((i,idx)=>`<tr><td>${idx+1}</td><td><strong>${esc(i.titulo)}</strong><br><small>${esc(i.detalhe||'')}</small></td><td>${esc(formatQtd(i.quantidade))}</td><td><strong>${esc(moeda(i.valor))}</strong></td></tr>`).join('')}</tbody></table>`;
  }

  function formatQtd(v){
    const n=Number(v||0);
    return n.toLocaleString('pt-BR',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2});
  }

  function agruparStatus(){
    const m=new Map();
    ordens().forEach(o=>{
      const s=o.status||'sem status';
      const k=norm(s);
      if(!m.has(k)) m.set(k,{titulo:s,quantidade:0,valor:0,detalhe:''});
      const a=m.get(k);a.quantidade++;a.valor+=valorOS(o);
    });
    return [...m.values()].sort((a,b)=>b.valor-a.valor).slice(0,12);
  }

  function agruparPagamento(){
    const m=new Map();
    ordens().forEach(o=>{
      const s=o.forma_pagamento||o.status_pagamento||'não informado';
      const k=norm(s);
      if(!m.has(k)) m.set(k,{titulo:s,quantidade:0,valor:0,detalhe:''});
      const a=m.get(k);a.quantidade++;a.valor+=valorOS(o);
    });
    return [...m.values()].sort((a,b)=>b.valor-a.valor).slice(0,12);
  }

  function extras(){
    if(document.getElementById('fs-rel-extra')) return;
    const grid=document.querySelector('.relatorio-grid');
    if(!grid) return;
    const sec=document.createElement('section');
    sec.id='fs-rel-extra';
    sec.className='fs-rel-extra';
    sec.innerHTML='<div class="card-relatorio"><h2>Relatório por status da OS</h2><p>Volume e valor por situação operacional.</p><div id="ranking-status-os" class="lista-ranking"></div></div><div class="card-relatorio"><h2>Relatório por pagamento</h2><p>Forma/status de pagamento no período.</p><div id="ranking-pagamento-os" class="lista-ranking"></div></div>';
    grid.insertAdjacentElement('afterend',sec);
  }

  function recalcularMetricas(){
    const base=ordens();
    const faturamento=base.reduce((s,o)=>s+valorOS(o),0);
    const recebido=base.reduce((s,o)=>s+(pagoOS(o)>0?pagoOS(o):(norm(o.status_pagamento)==='pago'?valorOS(o):0)),0);
    const pendente=base.reduce((s,o)=>s+saldoOS(o),0);
    const ticket=base.length?faturamento/base.length:0;
    setText('relatorio-faturamento',moeda(faturamento));
    setText('relatorio-ticket-medio',moeda(ticket));
    setText('relatorio-pendente',moeda(pendente));
    const cards=[...document.querySelectorAll('.metrica-card')];
    const faturamentoCard=cards.find(c=>/faturamento/i.test(c.textContent));
    if(faturamentoCard){
      const sm=faturamentoCard.querySelector('small');
      if(sm) sm.textContent=`Recebido: ${moeda(recebido)} • Pendente: ${moeda(pendente)}`;
    }
  }

  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v);}

  function substituirRender(){
    if(typeof window.renderizarRankingGenerico==='function'&&!window.renderizarRankingGenerico.__fsPro){
      const novo=function(id,lista,vazio){tabela(id,lista||[],vazio);agendarAtualizacao();};
      novo.__fsPro=true;
      window.renderizarRankingGenerico=novo;
    }
  }

  function renderExtras(){
    extras();
    tabela('ranking-status-os',agruparStatus(),'Nenhuma OS encontrada por status.');
    tabela('ranking-pagamento-os',agruparPagamento(),'Nenhuma OS encontrada por pagamento.');
    recalcularMetricas();
    if(typeof window.notificarAlturaRelatorios==='function') window.notificarAlturaRelatorios();
  }

  function agendarAtualizacao(){
    if(fsRelatoriosProTimer) clearTimeout(fsRelatoriosProTimer);
    fsRelatoriosProTimer=setTimeout(()=>{substituirRender();renderExtras();},120);
  }

  window.fsImprimirRelatorioPremium=function(){window.print();};
  window.fsExportarRelatorioCSV=function(){
    const rows=[['OS','Cliente','Veiculo','Status','Pagamento','Valor','Pago','Saldo']];
    ordens().forEach(o=>rows.push([o.numero_os||o.id,o.clientes?.nome||'',o.veiculos?.placa||'',o.status||'',o.status_pagamento||o.forma_pagamento||'',valorOS(o),pagoOS(o),saldoOS(o)]));
    const csv=rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='relatorio-fs-orcamentos.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  function init(){
    if(fsRelatoriosProInstalado) return;
    fsRelatoriosProInstalado=true;
    css();
    inserirAcoes();
    substituirRender();
    extras();
    agendarAtualizacao();
    setTimeout(agendarAtualizacao,900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
