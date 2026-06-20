/* FS Orçamentos - ajustes da página pública ver.html */
(function(){
  'use strict';

  const TEMAS_VER = {
    original:{primaria:'#3e2723',destaque:'#ffc400',fundo:'#efebe9',textoTopo:'#ffffff',fundoPagina:'#f1f3f6',textoTabela:'#ffc400'},
    bw:{primaria:'#111111',destaque:'#d1d5db',fundo:'#f5f5f5',textoTopo:'#ffffff',fundoPagina:'#eeeeee',textoTabela:'#ffffff'},
    preto:{primaria:'#111111',destaque:'#d1d5db',fundo:'#f5f5f5',textoTopo:'#ffffff',fundoPagina:'#eeeeee',textoTabela:'#ffffff'},
    cinza:{primaria:'#4b5563',destaque:'#d1d5db',fundo:'#f3f4f6',textoTopo:'#ffffff',fundoPagina:'#f5f6f8',textoTabela:'#ffffff'},
    blue:{primaria:'#0056b3',destaque:'#ffc400',fundo:'#e3f2fd',textoTopo:'#ffffff',fundoPagina:'#eef6ff',textoTabela:'#ffc400'},
    azul:{primaria:'#0056b3',destaque:'#ffc400',fundo:'#e3f2fd',textoTopo:'#ffffff',fundoPagina:'#eef6ff',textoTabela:'#ffc400'},
    green:{primaria:'#2e7d32',destaque:'#81c784',fundo:'#e8f5e9',textoTopo:'#ffffff',fundoPagina:'#f0faf1',textoTabela:'#ffffff'},
    verde:{primaria:'#2e7d32',destaque:'#81c784',fundo:'#e8f5e9',textoTopo:'#ffffff',fundoPagina:'#f0faf1',textoTabela:'#ffffff'},
    red:{primaria:'#dc2626',destaque:'#fecaca',fundo:'#fff1f2',textoTopo:'#ffffff',fundoPagina:'#fff7f7',textoTabela:'#ffffff'},
    vermelho:{primaria:'#dc2626',destaque:'#fecaca',fundo:'#fff1f2',textoTopo:'#ffffff',fundoPagina:'#fff7f7',textoTabela:'#ffffff'}
  };

  const FORMAS_VALIDAS = { credito:'Crédito', debito:'Débito', pix:'Pix', dinheiro:'Dinheiro' };
  const params = new URLSearchParams(location.search || '');
  const linkToken = (params.get('token') || params.get('public_token') || '').trim();

  function normalizar(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function valor(...xs){for(const x of xs){if(x!==null&&x!==undefined&&String(x).trim()!=='')return String(x).trim();}return '';}
  function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function numeros(v){return String(v||'').replace(/\D/g,'');}

  function temaDoOrcamento(o){const t=normalizar(o?.tema_pdf||o?.tema||o?.theme||o?.cor_pdf||o?.cor||'original');return TEMAS_VER[t]?t:'original';}
  function aplicarTemaCorrigido(o){
    const c=TEMAS_VER[temaDoOrcamento(o||window.orcamentoAtual||{})]||TEMAS_VER.original;
    const r=document.documentElement;
    r.style.setProperty('--ver-cor-primaria',c.primaria);r.style.setProperty('--ver-cor-destaque',c.destaque);r.style.setProperty('--ver-cor-fundo',c.fundo);r.style.setProperty('--ver-cor-texto-topo',c.textoTopo);r.style.setProperty('--ver-cor-pagina',c.fundoPagina);r.style.setProperty('--ver-cor-texto-tabela',c.textoTabela);
    r.style.setProperty('--fs-marrom',c.primaria);r.style.setProperty('--fs-marrom-2',c.primaria);r.style.setProperty('--fs-amarelo',c.destaque);r.style.setProperty('--fs-creme',c.fundo);r.style.setProperty('--fs-creme-2',c.fundoPagina);
    return c;
  }

  function injetarEstilo(){
    if(document.getElementById('fs-ver-cliente-fix-style'))return;
    const s=document.createElement('style');s.id='fs-ver-cliente-fix-style';
    s.textContent='.gerar-os-box,.btn-gerar-os,a[href*="ordens.html?orcamento_id"],a[href*="ordens.html%3Forcamento_id"]{display:none!important}body:not(.gerando-pdf){background:var(--ver-cor-pagina)!important}.pagina-ver{background:#fff!important}.ver-emissor-topo{background:linear-gradient(135deg,var(--ver-cor-primaria),var(--ver-cor-primaria))!important;color:var(--ver-cor-texto-topo)!important;border-bottom-color:var(--ver-cor-destaque)!important}.ver-logo-box{border-color:var(--ver-cor-destaque)!important}#ver-logo-placeholder{color:var(--ver-cor-primaria)!important;background:var(--ver-cor-destaque)!important}.ver-emissor-info .ver-label,.ver-emissor-info h1{color:var(--ver-cor-destaque)!important}.ver-emissor-info p,.ver-emissor-dados span{color:var(--ver-cor-texto-topo)!important}h1#titulo-orcamento,.box-info strong,.observacoes-box strong,.veiculo-orcamento-box strong,.rodape strong,.numero-orcamento,.total-box{color:var(--ver-cor-primaria)!important}th,table th,.tabela-wrapper th,#conteudo-orcamento th{background:var(--ver-cor-primaria)!important;color:var(--ver-cor-texto-tabela)!important}.formas-pagamento-grid button[data-forma-invalida="true"]{display:none!important}';
    document.head.appendChild(s);
  }

  function dadosEmpresa(o,p){return{nomeEmpresa:valor(p?.nome_empresa,o?.nome_empresa,o?.empresa_nome,o?.empresa,'Empresa'),consultor:valor(o?.consultor,o?.responsavel,p?.nome,'Consultor'),telefone:valor(p?.telefone_empresa,o?.telefone_empresa,o?.whatsapp_empresa),cnpj:valor(p?.cnpj_empresa,o?.cnpj_empresa,o?.cpf_cnpj_empresa),endereco:valor(p?.endereco_empresa,o?.endereco_empresa),fotoUrl:valor(p?.foto_url,p?.logo_url,o?.foto_url,o?.logo_url,o?.empresa_logo)};}
  async function carregarPerfilEmissorCorrigido(uid,o){
    const ids=[uid,o?.usuario_id,o?.user_id,o?.perfil_id].filter(Boolean); if(!ids.length||!window._supabase)return null;
    for(const id of ids){try{const r=await window._supabase.from('perfis').select('nome,nome_empresa,telefone_empresa,endereco_empresa,cnpj_empresa,foto_url,logo_url').eq('id',id).maybeSingle();if(!r.error&&r.data)return r.data;}catch(_){}}
    return null;
  }
  function chip(el,t){if(!el)return;if(t){el.innerText=t;el.style.display='inline-flex';}else{el.innerText='';el.style.display='none';}}
  function configurarWhatsapp(t,nome){const box=document.getElementById('whatsapp-empresa-box'),link=document.getElementById('btn-whatsapp-empresa');if(!box||!link)return;const limpo=numeros(t);if(!limpo){box.style.display='none';return;}const num=limpo.startsWith('55')?limpo:'55'+limpo;link.href='https://wa.me/'+num+'?text='+encodeURIComponent('Olá! Estou falando sobre o orçamento recebido de '+(nome||'sua empresa')+'.');box.style.display='block';}
  function preencherTopo(o,p){const d=dadosEmpresa(o||{},p||{});const logo=document.getElementById('ver-logo-empresa'),ph=document.getElementById('ver-logo-placeholder');const nome=document.getElementById('ver-nome-empresa'),cons=document.getElementById('ver-consultor');if(nome)nome.innerText=d.nomeEmpresa;if(cons)cons.innerText='Consultor: '+d.consultor;chip(document.getElementById('ver-whatsapp-empresa'),d.telefone?'WhatsApp: '+d.telefone:'');chip(document.getElementById('ver-cnpj-empresa'),d.cnpj?'CNPJ/CPF: '+d.cnpj:'');chip(document.getElementById('ver-endereco-empresa'),d.endereco?'Endereço: '+d.endereco:'');configurarWhatsapp(d.telefone,d.nomeEmpresa);if(logo&&ph){if(d.fotoUrl){logo.src=d.fotoUrl+(d.fotoUrl.includes('?')?'&':'?')+'v='+Date.now();logo.style.display='block';ph.style.display='none';}else{logo.removeAttribute('src');logo.style.display='none';ph.style.display='block';ph.innerText=(d.nomeEmpresa||'FS').substring(0,2).toUpperCase();}}document.title=d.nomeEmpresa+' - '+(o?.assunto||'Orçamento');}
  function normalizarForma(f){const x=normalizar(f);if(x==='cartao_credito'||x==='cartao credito'||x==='credito')return'credito';if(x==='cartao_debito'||x==='cartao debito'||x==='debito')return'debito';if(x==='pix')return'pix';if(x==='dinheiro')return'dinheiro';return'';}
  function corrigirBotoes(){document.querySelectorAll('.formas-pagamento-grid button').forEach(btn=>{const m=(btn.getAttribute('onclick')||'').match(/selecionarFormaPagamento\(['"]([^'"]+)['"]\)/);const f=normalizarForma(m?.[1]||btn.dataset.forma||btn.textContent);if(!f||!FORMAS_VALIDAS[f]){btn.dataset.formaInvalida='true';return;}btn.dataset.formaInvalida='false';btn.textContent=FORMAS_VALIDAS[f];btn.onclick=()=>window.selecionarFormaPagamento(f);});}

  async function carregarPorToken(){
    if(!linkToken||!window._supabase)return null;
    const titulo=document.getElementById('titulo-orcamento'),box=document.getElementById('conteudo-orcamento');
    if(titulo)titulo.innerText='Carregando...'; if(box)box.innerHTML='<div class="msg msg-carregando">Carregando orçamento pelo link seguro...</div>';
    const r=await window._supabase.rpc('buscar_orcamento_publico',{p_token:linkToken});
    if(r.error){console.error(r.error);if(titulo)titulo.innerText='Aviso';if(box)box.innerHTML='<div class="msg msg-erro">Não foi possível carregar este orçamento.</div>';return null;}
    const o=Array.isArray(r.data)?r.data[0]:r.data; if(!o){if(titulo)titulo.innerText='Aviso';if(box)box.innerHTML='<div class="msg msg-erro">Orçamento não encontrado.</div>';return null;}
    window.orcamentoAtual=o; aplicarTemaCorrigido(o); window.perfilEmissorAtual=await carregarPerfilEmissorCorrigido(o.usuario_id,o); if(typeof window.carregarVeiculoDoOrcamento==='function')window.veiculoOrcamentoAtual=await window.carregarVeiculoDoOrcamento(o); preencherTopo(o,window.perfilEmissorAtual||{}); if(typeof window.preencherNumeroOrcamento==='function')window.preencherNumeroOrcamento(o); if(typeof window.renderizarOrcamento==='function')window.renderizarOrcamento(o); return o;
  }

  async function responderToken(status,forma){
    if(!linkToken||!window._supabase)return;
    if(typeof window.setBotoesRespostaDesabilitados==='function')window.setBotoesRespostaDesabilitados(true);
    const r=await window._supabase.rpc('responder_orcamento_publico_v2',{p_token:linkToken,p_resposta:status,p_forma_pagamento:forma||null});
    if(r.error){console.error(r.error);alert('Não foi possível registrar a resposta.');if(typeof window.setBotoesRespostaDesabilitados==='function')window.setBotoesRespostaDesabilitados(false);return;}
    const ret=Array.isArray(r.data)?r.data[0]:r.data; if(ret&&ret.sucesso===false)alert(ret.mensagem||'Resposta não registrada.');
    if(typeof window.fecharModalFormaPagamento==='function')window.fecharModalFormaPagamento(); await carregarPorToken();
  }

  function instalar(){
    injetarEstilo(); document.querySelectorAll('.gerar-os-box,.btn-gerar-os,a[href*="ordens.html?orcamento_id"]').forEach(el=>el.remove());
    window.FORMAS_PAGAMENTO={...FORMAS_VALIDAS}; window.textoFormaPagamento=f=>FORMAS_VALIDAS[normalizarForma(f)]||'-'; window.coresDoTema=t=>TEMAS_VER[normalizar(t)]||TEMAS_VER.original; window.aplicarTemaVerHtml=o=>aplicarTemaCorrigido(o); window.carregarPerfilEmissor=async uid=>carregarPerfilEmissorCorrigido(uid,window.orcamentoAtual||{}); window.preencherTopoEmpresaVer=(o,p)=>preencherTopo(o||window.orcamentoAtual||{},p||window.perfilEmissorAtual||{}); window.montarBotaoGerarOS=()=>'';
    corrigirBotoes();
    if(linkToken){window.aprovarOrcamento=function(){if(!window.orcamentoAtual){alert('Orçamento não carregado.');return;}if(window.orcamentoAtual.status!=='pendente'){alert('Este orçamento já foi respondido.');return;}if(typeof window.abrirModalFormaPagamento==='function')window.abrirModalFormaPagamento();};window.selecionarFormaPagamento=async f=>{if(!confirm('Confirmar aprovação do orçamento?'))return;await responderToken('aprovado',f);};window.recusarOrcamento=async()=>{if(!confirm('Deseja realmente recusar este orçamento?'))return;await responderToken('recusado',null);};}
    if(window.orcamentoAtual){aplicarTemaCorrigido(window.orcamentoAtual);preencherTopo(window.orcamentoAtual,window.perfilEmissorAtual||{});}
  }

  async function iniciar(){instalar(); if(linkToken) await carregarPorToken(); instalar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,350)); else setTimeout(iniciar,350);
  let n=0;const timer=setInterval(()=>{instalar();if(++n>30)clearInterval(timer);},400);
})();
