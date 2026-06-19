/* FS Orçamentos — melhorias profissionais para recorrentes */
(function(){
  'use strict';

  function css(){
    if(document.getElementById('fs-recorrentes-pro-css'))return;
    const s=document.createElement('style');
    s.id='fs-recorrentes-pro-css';
    s.textContent=`
      body{padding-top:96px!important}.pagina-recorrentes{max-width:1180px!important;padding:10px 8px 36px!important}.recorrentes-hero{border-radius:8px!important;border:1px solid #e4d8cc!important;border-top:0!important;padding:13px!important;box-shadow:0 4px 14px rgba(47,33,29,.075)!important;background:#fff!important}.recorrentes-hero h1{font-size:26px!important;color:#2f211d!important}.layout-recorrentes{grid-template-columns:.82fr 1.18fr!important;gap:10px!important}.card-recorrente{border-radius:8px!important;border:1px solid #e4d8cc!important;border-top:0!important;box-shadow:0 4px 14px rgba(47,33,29,.075)!important;margin-bottom:10px!important}.card-header{padding:10px 12px!important;background:#2f211d!important;border-bottom:1px solid #ffc400!important}.card-header h2{font-size:17px!important}.card-body{padding:10px!important}.resumo-recorrentes{gap:8px!important;margin-bottom:10px!important}.resumo-card{border-radius:7px!important;padding:9px!important}.resumo-card strong{font-size:22px!important}.filtros-recorrentes{gap:8px!important;margin-bottom:9px!important}.campo input,.campo select,.campo textarea{border-radius:5px!important;padding:8px!important;font-size:12.5px!important}.btn{border-radius:5px!important;min-height:34px!important;padding:8px 10px!important;font-size:12px!important}.lista-recorrentes{display:block!important;overflow:auto;border:1px solid #e4d8cc;border-radius:7px;background:#fff}.fs-rec-table{width:100%;border-collapse:collapse;min-width:860px}.fs-rec-table th{background:#2f211d;color:#ffc400;font-size:10px;text-transform:uppercase;text-align:left;padding:8px;font-weight:950}.fs-rec-table td{padding:8px;border-bottom:1px solid #eee3d8;color:#2b211d;font-size:12px;line-height:1.25;vertical-align:middle}.fs-rec-table tbody tr:nth-child(even){background:#fbf8f4}.fs-rec-table tbody tr:hover{background:#fff4ce}.fs-rec-table .tag{border-radius:999px;padding:3px 7px;font-size:10px}.fs-rec-actions{display:flex;gap:5px;flex-wrap:wrap}.fs-rec-actions button{min-height:28px;padding:5px 7px;border-radius:4px;border:1px solid #d7ccc8;background:#fff;color:#2f211d;font-size:10.5px;font-weight:900;cursor:pointer}.fs-rec-actions .main{background:#2f211d;color:#ffc400;border-color:#2f211d}.fs-rec-actions .danger{background:#fff1f1;color:#991b1b;border-color:#fecaca}@media(max-width:980px){.layout-recorrentes{grid-template-columns:1fr!important}body{padding-top:86px!important}}
    `;
    document.head.appendChild(s);
  }

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function attr(v){return esc(v).replace(/`/g,'')}
  function data(v){if(!v)return'-';const p=String(v).substring(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:'-'}
  function veic(v){if(!v)return'-';return [v.placa?String(v.placa).toUpperCase():'',v.marca,v.modelo,v.ano].filter(Boolean).join(' • ')||'-'}
  function cli(item){const c=item.clientes||{};const n=c.numero_cliente?`CLI-${String(c.numero_cliente).padStart(6,'0')}`:'';return [n,c.nome].filter(Boolean).join(' - ')||'Sem cliente'}
  function cls(item){if(typeof window.classificarRecorrente==='function')return window.classificarRecorrente(item);return{classe:'ok',label:item.status||'ativo'}}

  function renderTabela(lista){
    const box=document.getElementById('lista-recorrentes');
    if(!box)return;
    if(!lista.length){box.innerHTML='<div class="estado-vazio">Nenhum serviço recorrente encontrado.</div>';return;}
    box.innerHTML=`<table class="fs-rec-table"><thead><tr><th>Serviço</th><th>Cliente</th><th>Veículo</th><th>Último</th><th>Próximo</th><th>Km</th><th>Status</th><th>Ações</th></tr></thead><tbody>${lista.map(item=>{const i=cls(item);return`<tr><td><strong>${esc(item.titulo||'Serviço recorrente')}</strong><br><small>${esc(item.tipo_servico||'')}</small></td><td>${esc(cli(item))}</td><td>${esc(veic(item.veiculos))}</td><td>${esc(data(item.data_ultimo_servico))}</td><td><strong>${esc(data(item.proxima_data))}</strong></td><td>${esc(item.proximo_km?Number(item.proximo_km).toLocaleString('pt-BR')+' km':'-')}</td><td><span class="tag ${attr(i.classe)}">${esc(i.label)}</span></td><td><div class="fs-rec-actions"><button class="main" onclick="fsGerarOSRecorrente('${attr(item.id)}')">Gerar OS</button><button onclick="editarRecorrente('${attr(item.id)}')">Editar</button><button class="danger" onclick="excluirRecorrente('${attr(item.id)}')">Excluir</button></div></td></tr>`}).join('')}</tbody></table>`;
  }

  function instalarRender(){
    if(typeof window.renderizarRecorrentes==='function'&&!window.renderizarRecorrentes.__fsPro){
      const original=window.renderizarRecorrentes;
      const novo=function(lista){try{return renderTabela(lista||[])}catch(e){console.warn(e);return original(lista)}};
      novo.__fsPro=true;
      window.renderizarRecorrentes=novo;
      if(Array.isArray(window.recorrentesCache)) renderTabela(window.recorrentesCache);
    }
  }

  function obterItem(id){return (window.recorrentesCache||[]).find(x=>String(x.id)===String(id));}
  window.fsGerarOSRecorrente=function(id){
    const item=obterItem(id);
    if(!item){alert('Recorrência não encontrada.');return;}
    const params=new URLSearchParams();
    if(item.cliente_id)params.set('cliente_id',item.cliente_id);
    if(item.veiculo_id)params.set('veiculo_id',item.veiculo_id);
    params.set('titulo',item.titulo||'Manutenção preventiva');
    params.set('origem_recorrente',item.id);
    location.href='/ordens.html?'+params.toString();
  };

  function init(){css();instalarRender();setTimeout(instalarRender,500);setTimeout(instalarRender,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();