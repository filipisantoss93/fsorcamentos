/* FS Orçamentos — Garantia da Ordem de Serviço */
(function(){
  'use strict';

  let ordemGarantiaAtual=null;
  let usuarioIdGarantia=null;

  function obterOrdemId(){
    const p=new URLSearchParams(location.search);
    return p.get('id')||p.get('ordem_id')||p.get('os_id')||localStorage.getItem('ultima_os_aberta_id')||'';
  }

  function html(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function val(id){return document.getElementById(id)?.value?.trim()||''}
  function setVal(id,v){const e=document.getElementById(id);if(e)e.value=v??''}
  function dataBR(v){if(!v)return'-';const d=new Date(String(v).includes('T')?v:String(v)+'T00:00:00');return Number.isNaN(d.getTime())?'-':d.toLocaleDateString('pt-BR')}
  function addDias(data,dias){const d=new Date(String(data||new Date().toISOString().slice(0,10))+'T00:00:00');d.setDate(d.getDate()+Number(dias||0));return d.toISOString().slice(0,10)}
  function mostrar(msg,tipo='info'){if(typeof window.mostrarMensagemOrdem==='function')return window.mostrarMensagemOrdem(msg,tipo);const e=document.getElementById('mensagem-ordem');if(e){e.className='mensagem-ordem '+tipo;e.textContent=msg}}

  async function aguardarSupabase(){
    for(let i=0;i<30;i++){
      if(window._supabase)return true;
      if(typeof window.inicializarSupabaseFS==='function')window.inicializarSupabaseFS();
      await new Promise(r=>setTimeout(r,120));
    }
    return false;
  }

  async function carregarOrdem(){
    await aguardarSupabase();
    if(!window._supabase)return null;
    const {data:{session}}=await _supabase.auth.getSession();
    if(!session?.user?.id)return null;
    usuarioIdGarantia=session.user.id;
    const id=obterOrdemId();
    if(!id)return null;
    const {data,error}=await _supabase
      .from('ordens_servico')
      .select('id,user_id,numero_os,titulo,cliente_id,veiculo_id,data_abertura,data_conclusao,descricao_servico,garantia_dias,garantia_observacoes,termo_garantia_texto,clientes(nome,cpf_cnpj,whatsapp,email),veiculos(placa,marca,modelo,ano)')
      .eq('id',id)
      .eq('user_id',session.user.id)
      .maybeSingle();
    if(error){console.warn('Erro ao carregar garantia da OS:',error);return null}
    ordemGarantiaAtual=data||null;
    return ordemGarantiaAtual;
  }

  function textoTermoPadrao(ordem){
    const dias=Number(ordem?.garantia_dias||0);
    const validade=dias>0?dataBR(addDias(ordem?.data_conclusao||ordem?.data_abertura,dias)):'sem prazo definido';
    const cliente=ordem?.clientes?.nome||document.getElementById('detalhe-cliente-nome')?.textContent?.trim()||'Cliente';
    const veiculo=[ordem?.veiculos?.placa,ordem?.veiculos?.marca,ordem?.veiculos?.modelo,ordem?.veiculos?.ano].filter(Boolean).join(' • ')||document.getElementById('detalhe-veiculo-placa')?.textContent?.trim()||'Veículo não informado';
    return `Termo de garantia referente à OS ${ordem?.numero_os?String(ordem.numero_os).padStart(6,'0'):ordem?.id||''}.

Cliente: ${cliente}
Veículo: ${veiculo}
Serviço: ${ordem?.descricao_servico||ordem?.titulo||'Serviço executado'}
Prazo de garantia: ${dias>0?dias+' dias':'não informado'}
Validade estimada: ${validade}

Condições: a garantia cobre exclusivamente o serviço executado e/ou peças informadas nesta ordem de serviço, desde que o veículo/equipamento seja utilizado em condições normais. A garantia poderá perder validade em caso de mau uso, violação por terceiros, falta de manutenção recomendada, alterações posteriores ou defeitos não relacionados ao serviço desta OS.

Observações: ${ordem?.garantia_observacoes||'Sem observações adicionais.'}`;
  }

  function injetarCss(){
    if(document.getElementById('fs-ordem-garantia-css'))return;
    const s=document.createElement('style');
    s.id='fs-ordem-garantia-css';
    s.textContent=`
      .fs-garantia-form{margin-top:14px;display:grid;gap:10px;border-top:1px solid #e4d8cc;padding-top:12px}.fs-garantia-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fs-garantia-campo{display:grid;gap:5px}.fs-garantia-campo label{font-size:11px;font-weight:950;text-transform:uppercase;color:#3e2723}.fs-garantia-campo input,.fs-garantia-campo textarea{width:100%;box-sizing:border-box;border:1px solid #d7ccc8;border-radius:7px;padding:9px;color:#2f241f;background:#fff;font-size:13px}.fs-garantia-campo textarea{min-height:88px;resize:vertical}.fs-garantia-termo-preview{white-space:pre-wrap;background:#fffaf0;border:1px solid #ffc400;border-radius:8px;padding:10px;color:#3e2723;font-size:12.5px;line-height:1.45;max-height:220px;overflow:auto}.fs-garantia-acoes{display:flex;gap:8px;flex-wrap:wrap}.fs-garantia-acoes button{min-height:34px;border-radius:7px;border:1px solid #ffc400;background:#3e2723;color:#ffc400;font-weight:950;padding:8px 11px;cursor:pointer}.fs-garantia-acoes button.sec{background:#fff;color:#3e2723;border-color:#d7ccc8}@media(max-width:620px){.fs-garantia-grid{grid-template-columns:1fr}.fs-garantia-acoes button{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function injetarFormulario(ordem){
    const card=[...document.querySelectorAll('.card')].find(c=>c.textContent.includes('Informações de garantia do serviço'));
    const body=card?.querySelector('.card-body');
    if(!body||document.getElementById('form-garantia-os'))return;
    const dias=Number(ordem?.garantia_dias||0);
    const validade=dias>0?dataBR(addDias(ordem?.data_conclusao||ordem?.data_abertura,dias)):'-';
    const form=document.createElement('div');
    form.id='form-garantia-os';
    form.className='fs-garantia-form';
    form.innerHTML=`
      <div class="fs-garantia-grid">
        <div class="fs-garantia-campo"><label for="garantia-dias-os">Prazo de garantia em dias</label><input id="garantia-dias-os" type="number" min="0" step="1" placeholder="Ex: 90"></div>
        <div class="fs-garantia-campo"><label>Validade estimada</label><input id="garantia-validade-os" type="text" readonly value="${html(validade)}"></div>
      </div>
      <div class="fs-garantia-campo"><label for="garantia-observacoes-os">Observações da garantia</label><textarea id="garantia-observacoes-os" placeholder="Ex: garantia não cobre mau uso, peças de desgaste natural ou serviços feitos por terceiros."></textarea></div>
      <div class="fs-garantia-campo"><label for="garantia-termo-os">Texto do termo de garantia</label><textarea id="garantia-termo-os"></textarea></div>
      <div class="fs-garantia-termo-preview" id="garantia-termo-preview-os">Termo ainda não gerado.</div>
      <div class="fs-garantia-acoes"><button type="button" id="btn-salvar-garantia-os">Salvar garantia</button><button type="button" id="btn-gerar-texto-garantia-os" class="sec">Gerar texto automático</button></div>
    `;
    body.appendChild(form);
    setVal('garantia-dias-os',dias||'');
    setVal('garantia-observacoes-os',ordem?.garantia_observacoes||'');
    setVal('garantia-termo-os',ordem?.termo_garantia_texto||textoTermoPadrao(ordem));
    atualizarPreview();
    document.getElementById('garantia-dias-os')?.addEventListener('input',atualizarValidade);
    document.getElementById('garantia-observacoes-os')?.addEventListener('input',()=>{if(!val('garantia-termo-os'))setVal('garantia-termo-os',textoTermoPadrao({...ordemGarantiaAtual,garantia_dias:Number(val('garantia-dias-os')||0),garantia_observacoes:val('garantia-observacoes-os')}));atualizarPreview();});
    document.getElementById('garantia-termo-os')?.addEventListener('input',atualizarPreview);
    document.getElementById('btn-salvar-garantia-os')?.addEventListener('click',salvarGarantia);
    document.getElementById('btn-gerar-texto-garantia-os')?.addEventListener('click',()=>{setVal('garantia-termo-os',textoTermoPadrao({...ordemGarantiaAtual,garantia_dias:Number(val('garantia-dias-os')||0),garantia_observacoes:val('garantia-observacoes-os')}));atualizarPreview();});
  }

  function atualizarValidade(){
    const dias=Number(val('garantia-dias-os')||0);
    const validade=dias>0?dataBR(addDias(ordemGarantiaAtual?.data_conclusao||ordemGarantiaAtual?.data_abertura,dias)):'-';
    setVal('garantia-validade-os',validade);
    const el=document.getElementById('detalhe-garantia-validade');if(el)el.textContent=validade;
  }

  function atualizarPreview(){
    const p=document.getElementById('garantia-termo-preview-os');
    if(p)p.textContent=val('garantia-termo-os')||'Termo ainda não gerado.';
  }

  function atualizarResumo(ordem){
    const dias=Number(ordem?.garantia_dias||0);
    const validade=dias>0?dataBR(addDias(ordem?.data_conclusao||ordem?.data_abertura,dias)):'-';
    const d=document.getElementById('detalhe-garantia-dias');if(d)d.textContent=dias>0?`${dias} dias`:'Sem garantia informada';
    const v=document.getElementById('detalhe-garantia-validade');if(v)v.textContent=validade;
    const o=document.getElementById('detalhe-garantia-observacoes');if(o)o.textContent=ordem?.garantia_observacoes||'-';
  }

  async function salvarGarantia(){
    try{
      const id=obterOrdemId();
      if(!id||!usuarioIdGarantia||!window._supabase)return mostrar('Não foi possível identificar a OS para salvar a garantia.','erro');
      const payload={
        garantia_dias:Number(val('garantia-dias-os')||0),
        garantia_observacoes:val('garantia-observacoes-os')||null,
        termo_garantia_texto:val('garantia-termo-os')||null
      };
      const btn=document.getElementById('btn-salvar-garantia-os');
      if(btn){btn.disabled=true;btn.textContent='Salvando...'}
      const {error}=await _supabase.from('ordens_servico').update(payload).eq('id',id).eq('user_id',usuarioIdGarantia);
      if(error){console.error(error);return mostrar('Não foi possível salvar a garantia.','erro')}
      ordemGarantiaAtual={...ordemGarantiaAtual,...payload};
      atualizarResumo(ordemGarantiaAtual);
      mostrar('Garantia da OS salva com sucesso.','sucesso');
    }catch(e){console.error(e);mostrar('Erro inesperado ao salvar garantia.','erro')}
    finally{const btn=document.getElementById('btn-salvar-garantia-os');if(btn){btn.disabled=false;btn.textContent='Salvar garantia'}}
  }

  function instalarBotaoTermo(){
    const btn=document.getElementById('btn-termo-garantia');
    if(!btn||btn.dataset.fsGarantiaOk==='1')return;
    btn.dataset.fsGarantiaOk='1';
    btn.addEventListener('click',()=>{
      const texto=val('garantia-termo-os')||ordemGarantiaAtual?.termo_garantia_texto||textoTermoPadrao(ordemGarantiaAtual||{});
      const w=window.open('','_blank');
      if(!w)return alert('Permita pop-ups para gerar o termo.');
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Termo de Garantia</title><style>body{font-family:Arial,sans-serif;color:#000;margin:32px;line-height:1.45}h1{text-align:center;font-size:20px;border-bottom:2px solid #000;padding-bottom:10px}.box{border:1px solid #000;padding:14px;white-space:pre-wrap}.assinatura{margin-top:60px;text-align:center;border-top:1px solid #000;padding-top:8px}</style></head><body><h1>TERMO DE GARANTIA</h1><div class="box">${html(texto)}</div><div class="assinatura">Assinatura do cliente/responsável</div><script>window.print()<\/script></body></html>`);
      w.document.close();
    });
  }

  async function iniciar(){
    injetarCss();
    const ordem=await carregarOrdem();
    if(ordem){atualizarResumo(ordem);injetarFormulario(ordem)}
    instalarBotaoTermo();
    setTimeout(instalarBotaoTermo,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,900));
  else setTimeout(iniciar,900);
})();