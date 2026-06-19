/* FS Orçamentos — Relatórios Premium profissional */
(function(){
  'use strict';

  function css(){
    if(document.getElementById('fs-relatorios-pro-css'))return;
    const s=document.createElement('style');
    s.id='fs-relatorios-pro-css';
    s.textContent=`
      body{padding-top:96px!important;background:#f6f1ea!important;color:#2b211d!important}.pagina-relatorios{max-width:1180px!important;padding:10px 8px 36px!important}.relatorios-hero{border-radius:8px!important;border:1px solid #e4d8cc!important;border-top:0!important;padding:13px!important;box-shadow:0 4px 14px rgba(47,33,29,.075)!important;background:#fff!important;margin-bottom:10px!important}.tag-premium{border-radius:4px!important;padding:4px 7px!important;font-size:10px!important}.relatorios-hero h1{font-size:26px!important;color:#2f211d!important}.relatorios-hero p{font-size:13px!important;line-height:1.42!important}.filtros-relatorios{border-radius:8px!important;padding:10px!important;margin-bottom:10px!important;box-shadow:0 4px 14px rgba(47,33,29,.075)!important;gap:8px!important}.campo label{font-size:10px!important;text-transform:uppercase!important}.campo input,.campo select{border-radius:5px!important;padding:8px!important;font-size:12.5px!important}.btn{border-radius:5px!important;min-height:34px!important;padding:8px 10px!important;font-size:12px!important;border-width:1px!important}.metricas-grid{gap:8px!important;margin-bottom:10px!important}.metrica-card{border-radius:7px!important;padding:10px!important;box-shadow:0 3px 10px rgba(47,33,29,.055)!important;border-left-width:4px!important}.metrica-card strong{font-size:22px!important}.metrica-card span{font-size:10px!important;margin-bottom:5px!important}.metrica-card small{font-size:11px!important;margin-top:5px!important}.relatorio-grid{gap:10px!important}.card-relatorio{border-radius:8px!important;padding:0!important;margin-bottom:10px!important;overflow:hidden!important;box-shadow:0 4px 14px rgba(47,33,29,.075)!important}.card-relatorio h2{background:#2f211d!important;color:#ffc400!important;margin:0!important;padding:10px 12px!important;font-size:17px!important;border-bottom:1px solid #ffc400!important}.card-relatorio p{margin:0!important;padding:8px 12px!important;font-size:12px!important;background:#f8f4ee!important;color:#62554d!important}.lista-ranking{display:block!important;padding:10px!important;overflow:auto}.fs-rel-table{width:100%;border-collapse:collapse;min-width:600px}.fs-rel-table th{background:#2f211d;color:#ffc400;font-size:10px;text-transform:uppercase;text-align:left;padding:8px;font-weight:950}.fs-rel-table td{padding:8px;border-bottom:1px solid #eee3d8;color:#2b211d;font-size:12px;line-height:1.25;vertical-align:middle}.fs-rel-table tbody tr:nth-child(even){background:#fbf8f4}.fs-rel-table tbody tr:hover{background:#fff4ce}.fs-rel-extra{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:0}.fs-rel-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.fs-rel-actions button,.fs-rel-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:8px 10px;border-radius:5px;border:1px solid #2f211d;background:#2f211d;color:#ffc400;font-size:12px;font-weight:950;text-decoration:none;cursor:pointer}.fs-rel-actions .sec{background:#fff;color:#2f211d;border-color:#d7ccc8}@media(max-width:900px){body{padding-top:86px!important}.relatorio-grid,.metricas-grid,.filtros-relatorios,.fs-rel-extra{grid-template-columns:1fr!important}.fs-rel-actions button,.fs-rel-actions a{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function moeda(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,'_')}
  function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0}
  function ordens(){return Array.isArray(window.ordensRelatorioCache)?window.ordensRelatorioCache:[]}
  function itens(){return Array.isArray(window.itensRelatorioCache)?window.itensRelatorioCache:[]}
  function valorOS(o){return num(o.valor_total||o.total||o.valor_final||0)}
  function pagoOS(o){return num(o.valor_pago||0)}
  function saldoOS(o){return num(o.saldo_restante||Math.max(valorOS(o)-pagoOS(o),0))}

  function inserirAcoes(){
    if(document.getElementById('fs-rel-actions'))return;
    const filtros=document.querySelector('.filtros-relatorios');
    if(!filtros)return;
    const div=document.createElement('div');
    div.id='fs-rel-actions';
    div.className='fs-rel-actions';
    div.innerHTML='<button type="button" onclick="fsImprimirRelatorioPremium()">Imprimir relatório</button><button type="button" class="sec" onclick="fsExportarRelatorioCSV()">Exportar CSV</button><a class="sec" href="dashboard.html">Dashboard</a><a class="sec" href="fluxo-caixa.html">Fluxo de caixa</a>';
    filtros.insertAdjacentElement('afterend',div);
  }

  function tabela(containerId,lista,vazio){
    const c=document.getElementById(containerId); if(!c)return;
    if(!lista.length){c.innerHTML=`<div class="estado-vazio">${esc(vazio)}</div>`;return;}
    c.innerHTML=`<table class="fs-rel-table"><thead><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>${lista.map((i,idx)=>`<tr><td>${idx+1}</td><td><strong>${esc(i.titulo)}</strong><br><small>${esc(i.detalhe||'')}</small></td><td>${esc(formatQtd(i.quantidade))}</td><td><strong>${esc(moeda(i.valor))}</strong></td></tr>`).join('')}</tbody></table>`;
  }

  function formatQtd(v){const n=Number(v||0);return n.toLocaleString('pt-BR',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}

  function agruparStatus(){
    const m=new Map();
    ordens().forEach(o=>{const s=o.status||'sem status';const k=norm(s);if(!m.has(k))m.set(k,{titulo:s,quantidade:0,valor:0,detalhe:''});const a=m.get(k);a.quantidade++;a.valor+=valorOS(o)});
    return [...m.values()].sort((a,b)=>b.valor-a.valor).slice(0,12);
  }
  function agruparPagamento(){
    const m=new Map();
    ordens().forEach(o=>{const s=o.forma_pagamento||o.status_pagamento||'não informado';const k=norm(s);if(!m.has(k))m.set(k,{titulo:s,quantidade:0,valor:0,detalhe:''});const a=m.get(k);a.quantidade++;a.valor+=valorOS(o)});
    return [...m.values()].sort((a,b)=>b.valor-a.valor).slice(0,12);
  }

  function extras(){
    if(document.getElementById('fs-rel-extra'))return;
    const grid=document.querySelector('.relatorio-grid'); if(!grid)return;
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
    if(faturamentoCard){const sm=faturamentoCard.querySelector('small');if(sm)sm.textContent=`Recebido: ${moeda(recebido)} • Pendente: ${moeda(pendente)}`;}
  }
  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v)}

  function substituirRender(){
    if(typeof window.renderizarRankingGenerico==='function'&&!window.renderizarRankingGenerico.__fsPro){
      const novo=function(id,lista,vazio){tabela(id,lista||[],vazio)};
      novo.__fsPro=true;
      window.renderizarRankingGenerico=novo;
    }
  }

  function renderExtras(){extras();tabela('ranking-status-os',agruparStatus(),'Nenhuma OS encontrada por status.');tabela('ranking-pagamento-os',agruparPagamento(),'Nenhuma OS encontrada por pagamento.');recalcularMetricas();}

  function observar(){
    const main=document.querySelector('.pagina-relatorios');if(!main)return;
    new MutationObserver(()=>{substituirRender();renderExtras();}).observe(main,{childList:true,subtree:true});
  }

  window.fsImprimirRelatorioPremium=function(){window.print()};
  window.fsExportarRelatorioCSV=function(){
    const rows=[['OS','Cliente','Veiculo','Status','Pagamento','Valor','Pago','Saldo']];
    ordens().forEach(o=>rows.push([o.numero_os||o.id,o.clientes?.nome||'',o.veiculos?.placa||'',o.status||'',o.status_pagamento||o.forma_pagamento||'',valorOS(o),pagoOS(o),saldoOS(o)]));
    const csv=rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relatorio-fs-orcamentos.csv';a.click();URL.revokeObjectURL(a.href);
  };

  function init(){css();inserirAcoes();substituirRender();extras();observar();setTimeout(()=>{substituirRender();renderExtras();},1000);setTimeout(renderExtras,2200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();