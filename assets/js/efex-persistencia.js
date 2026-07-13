(()=>{'use strict';
const CHAVE='fs_efex_analise_atual_v1';
const $=id=>document.getElementById(id);
let restaurando=false,salvando=false,ultimoHash='';
const idsTexto=['efex-resumo','efex-explicacao-cliente'];
const idsHtml=['efex-hipoteses','efex-testes-recomendados','efex-alertas','efex-pecas','efex-servicos','efex-fontes','efex-chat-log'];
const idsCampos=['efex-cliente','efex-whatsapp','efex-marca','efex-modelo','efex-ano','efex-motor','efex-combustivel','efex-km','efex-dtc','efex-medicoes','efex-testes','efex-contexto','efex-valor-hora','efex-qualidade-peca','efex-sintoma','efex-pergunta'];
const idsChecks=['mod-imagens','mod-orcamento','mod-precos','mod-cliente'];
function seguro(fn,ret=null){try{return fn()}catch(e){console.warn('Efex persistência:',e);return ret}}
function veiculoResumo(){return [$('efex-marca')?.value,$('efex-modelo')?.value,$('efex-ano')?.value,$('efex-motor')?.value].map(v=>(v||'').trim()).filter(Boolean).join(' · ')}
function capturar(){
 const textos={},html={},campos={},checks={};
 idsTexto.forEach(id=>{if($(id))textos[id]=$(id).textContent||''});
 idsHtml.forEach(id=>{if($(id))html[id]=$(id).innerHTML||''});
 idsCampos.forEach(id=>{if($(id))campos[id]=$(id).value||''});
 idsChecks.forEach(id=>{if($(id))checks[id]=!!$(id).checked});
 const nivel=document.querySelector('[name="nivel"]:checked')?.value||'equilibrado';
 return {versao:1,salvo_em:new Date().toISOString(),textos,html,campos,checks,nivel,
  visibilidade:{diagnostico:$('efex-diagnostico-card')?.classList.contains('active'),pergunta:$('efex-pergunta-card')?.classList.contains('active'),alertas:!$('efex-alertas-wrap')?.classList.contains('efex-hidden'),cliente:!$('efex-cliente-wrap')?.classList.contains('efex-hidden'),pecas:!$('efex-pecas-wrap')?.classList.contains('efex-hidden'),servicos:!$('efex-servicos-wrap')?.classList.contains('efex-hidden'),fontes:!$('efex-fontes-wrap')?.classList.contains('efex-hidden'),rascunho:!$('efex-criar-rascunho')?.classList.contains('efex-hidden')},
  titulo:veiculoResumo()||((campos['efex-sintoma']||'Análise Efex').slice(0,70)),
  veiculo:veiculoResumo(),sintoma:campos['efex-sintoma']||'',configuracao:$('efex-configuracao')?.textContent||'',custo:$('efex-custo-relativo')?.textContent||''};
}
function aplicar(s){if(!s||!s.visibilidade?.diagnostico)return;restaurando=true;
 Object.entries(s.campos||{}).forEach(([id,v])=>{if($(id))$(id).value=v});
 Object.entries(s.checks||{}).forEach(([id,v])=>{if($(id)){$(id).checked=!!v;$(id).dispatchEvent(new Event('change',{bubbles:true}))}});
 const radio=document.querySelector(`[name="nivel"][value="${s.nivel||'equilibrado'}"]`);if(radio){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}))}
 Object.entries(s.textos||{}).forEach(([id,v])=>{if($(id))$(id).textContent=v});
 Object.entries(s.html||{}).forEach(([id,v])=>{if($(id))$(id).innerHTML=v});
 $('efex-diagnostico-card')?.classList.toggle('active',!!s.visibilidade.diagnostico);
 $('efex-pergunta-card')?.classList.toggle('active',!!s.visibilidade.pergunta);
 [['efex-alertas-wrap','alertas'],['efex-cliente-wrap','cliente'],['efex-pecas-wrap','pecas'],['efex-servicos-wrap','servicos'],['efex-fontes-wrap','fontes'],['efex-criar-rascunho','rascunho']].forEach(([id,k])=>$(id)?.classList.toggle('efex-hidden',!s.visibilidade[k]));
 setTimeout(()=>{restaurando=false},200);
}
async function sincronizar(s){
 if(salvando||!s?.visibilidade?.diagnostico)return;salvando=true;
 try{const {data:{session}}=await _supabase.auth.getSession();if(!session?.user?.id)return;
  const payload={usuario_id:session.user.id,titulo:s.titulo,cliente_nome:s.campos?.['efex-cliente']||null,veiculo:s.veiculo||null,sintoma:s.sintoma,dados_json:{campos:s.campos,checks:s.checks,nivel:s.nivel},configuracao_json:{resumo:s.configuracao},resultado_json:{textos:s.textos,html:s.html,visibilidade:s.visibilidade},fontes_json:[],conversa_json:[],creditos_consumidos:parseInt(s.custo,10)||0};
  const localId=localStorage.getItem('fs_efex_analise_atual_id');
  if(localId){const {error}=await _supabase.from('efex_analises').update(payload).eq('id',localId);if(error)throw error}
  else {const {data,error}=await _supabase.from('efex_analises').insert(payload).select('id').single();if(error)throw error;if(data?.id)localStorage.setItem('fs_efex_analise_atual_id',data.id)}
 }catch(e){console.warn('Não foi possível sincronizar o histórico Efex.',e)}finally{salvando=false}
}
function salvar(){if(restaurando||!$('efex-diagnostico-card')?.classList.contains('active'))return;const s=capturar(),hash=JSON.stringify(s.textos)+JSON.stringify(s.html)+s.sintoma;if(hash===ultimoHash)return;ultimoHash=hash;seguro(()=>localStorage.setItem(CHAVE,JSON.stringify(s)));sincronizar(s)}
function novaAnalise(){localStorage.removeItem(CHAVE);localStorage.removeItem('fs_efex_analise_atual_id');location.reload()}
function adicionarAcessoHistorico(){
 if(document.getElementById('efex-abrir-historico'))return;
 const link=document.createElement('a');link.id='efex-abrir-historico';link.href='/efex-historico.html';link.className='efex-btn secondary';link.textContent='Histórico de análises';
 const acoes=document.querySelector('.efex-desktop-actions');if(acoes)acoes.appendChild(link);
 const mobile=$('efex-mobile-action');if(mobile){const mini=link.cloneNode(true);mini.id='efex-abrir-historico-mobile';mini.setAttribute('aria-label','Abrir histórico de análises');mini.textContent='Histórico';mini.style.minHeight='48px';mobile.appendChild(mini);mobile.style.gridTemplateColumns='auto 1fr auto'}
}
function iniciar(){
 adicionarAcessoHistorico();
 const salvo=seguro(()=>JSON.parse(localStorage.getItem(CHAVE)||'null'));
 if(salvo)setTimeout(()=>aplicar(salvo),500);
 const alvo=$('efex-diagnostico-card');if(alvo)new MutationObserver(()=>setTimeout(salvar,250)).observe(alvo,{subtree:true,childList:true,characterData:true,attributes:true});
 const chat=$('efex-chat-log');if(chat)new MutationObserver(()=>setTimeout(salvar,250)).observe(chat,{subtree:true,childList:true,characterData:true});
 const btn=$('efex-limpar');if(btn){btn.onclick=novaAnalise;btn.textContent='Nova análise'}
 document.querySelectorAll('[data-efex-nova-analise]').forEach(b=>b.addEventListener('click',novaAnalise));
 window.addEventListener('beforeunload',salvar);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();