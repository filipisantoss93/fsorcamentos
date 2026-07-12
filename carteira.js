(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dataHora = valor => {
    if (!valor) return 'Data não informada';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Data não informada' : data.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  };

  let carregamentoInicialConcluido = false;
  let atualizandoCarteira = false;
  let extratoCompleto = [];
  let limiteVisivel = 20;

  function produtos(){ return window.FS_PRODUTOS_COMERCIAIS || {}; }
  function escapar(valor){ return String(valor ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function mostrarConteudo(mostrar){ $('conteudo-protegido')?.classList.toggle('hidden',!mostrar); }
  function mostrarErroCarteira(mensagem=''){ const el=$('carteira-erro'); if(!el)return; el.textContent=mensagem; el.classList.toggle('hidden',!mensagem); }
  function setBotaoCarregando(id,carregando,texto){ const botao=$(id); if(!botao)return; if(!botao.dataset.textoOriginal)botao.dataset.textoOriginal=botao.textContent; botao.disabled=carregando; botao.textContent=carregando?texto:botao.dataset.textoOriginal; }

  async function sessao(){
    const {data,error}=await _supabase.auth.getSession();
    if(error) throw error;
    return data?.session || null;
  }

  function irParaLogin(){
    const destino='/carteira.html'+(location.hash||'');
    if(typeof fsIrParaLoginComDestino==='function') return fsIrParaLoginComDestino(destino);
    try{localStorage.setItem('fs_destino_apos_login',destino);}catch(_){ }
    location.href='/index.html?login=1&dest='+encodeURIComponent(destino);
  }

  function assinaturaAtiva(assinatura){
    if(!assinatura?.status)return false;
    const status=String(assinatura.status).toLowerCase();
    if(!['ativo','active','pago','paid'].includes(status))return false;
    if(!assinatura.expira_em)return true;
    const expira=new Date(assinatura.expira_em).getTime();
    return Number.isFinite(expira)&&expira>Date.now();
  }

  function nivelLabel(nivel,plano){
    const n=String(nivel||'').toLowerCase();
    if(n==='pro')return 'Premium PRO';
    if(n==='essencial')return 'Premium Essencial';
    return String(plano||'').toLowerCase()==='premium'?'Premium Essencial':'Plano Gratuito';
  }

  function creditosPlano(nivel,plano){
    const n=String(nivel||'').toLowerCase();
    if(n==='pro')return {rotulo:'Créditos por renovação',texto:'30 créditos'};
    if(n==='essencial'||String(plano||'').toLowerCase()==='premium')return {rotulo:'Créditos por renovação',texto:'15 créditos'};
    return {rotulo:'Benefício inicial',texto:'5 créditos de boas-vindas'};
  }

  function preencherPacotes(){
    const select=$('pacote-creditos');
    const grid=$('pacotes-creditos');
    const lista=Object.values(produtos()).filter(item=>item?.tipo==='creditos');
    if(!select||!grid||!lista.length)return;
    const atual=select.value||'creditos_50';
    select.innerHTML=lista.map(item=>`<option value="${escapar(item.codigo)}">${escapar(item.creditos)} créditos — ${escapar(moeda(item.valor))}</option>`).join('');
    select.value=lista.some(item=>item.codigo===atual)?atual:(lista.find(item=>item.codigo==='creditos_50')?.codigo||lista[0].codigo);
    grid.innerHTML=lista.map(item=>{
      const unitario=item.creditos?item.valor/item.creditos:0;
      const promocional=item.codigo==='creditos_400';
      return `<button type="button" class="carteira-pacote" data-codigo="${escapar(item.codigo)}" role="radio" aria-checked="false"><strong>${escapar(item.creditos)} créditos</strong><span>${escapar(moeda(item.valor))}</span><small>${escapar(moeda(unitario))} por crédito</small>${promocional?'<small class="carteira-pacote-selo">Melhor custo</small>':''}<span class="carteira-pacote-preco">Selecionar</span></button>`;
    }).join('');
    atualizarResumoCarteira();
  }

  function atualizarResumoCarteira(){
    const codigo=$('pacote-creditos')?.value||'creditos_50';
    const pacote=produtos()[codigo];
    if(!pacote)return;
    $('resumo-pacote').textContent=pacote.label;
    $('valor-pacote-creditos').textContent=moeda(pacote.valor);
    $('resumo-promocao').textContent=codigo==='creditos_400'?'Preço promocional exclusivo deste pacote':'Sem desconto aplicado';
    $('resumo-unitario').textContent=`${moeda(pacote.valor/pacote.creditos)} por crédito`;
    document.querySelectorAll('.carteira-pacote').forEach(botao=>{
      const selecionado=botao.dataset.codigo===codigo;
      botao.classList.toggle('selecionado',selecionado);
      botao.setAttribute('aria-checked',selecionado?'true':'false');
    });
  }

  async function carregarCarteiraEfex(forcar=false){
    let session;
    try{session=await sessao();}catch(erro){
      console.error('Erro ao validar sessão da carteira:',erro);
      mostrarErroCarteira('Não foi possível validar sua sessão. Verifique sua conexão e tente novamente.');
      return;
    }
    if(!session){mostrarConteudo(false);irParaLogin();return;}

    mostrarConteudo(true); mostrarErroCarteira('');
    if(forcar)$('saldo-efex').textContent='...';
    try{
      const [saldoResp,perfilResp,assinaturaResp]=await Promise.all([
        _supabase.rpc('fs_meu_saldo_efex'),
        _supabase.from('perfis').select('plano,plano_status,plano_expira_em').eq('id',session.user.id).maybeSingle(),
        _supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id',session.user.id).order('expira_em',{ascending:false,nullsFirst:false}).limit(1).maybeSingle()
      ]);
      if(saldoResp.error)throw saldoResp.error;
      if(perfilResp.error)console.warn('Erro ao carregar perfil:',perfilResp.error);
      if(assinaturaResp.error)console.warn('Erro ao carregar assinatura:',assinaturaResp.error);

      const saldoBruto=saldoResp.data;
      $('saldo-efex').textContent=String(Number(saldoBruto?.saldo??saldoBruto??0)||0);
      const perfil=perfilResp.data||{};
      const assinatura=assinaturaResp.data||{};
      const ativa=assinaturaAtiva(assinatura);
      const plano=ativa?(assinatura.plano||'premium'):(perfil.plano||'gratis');
      const nivel=ativa?(assinatura.nivel||'essencial'):(String(plano).toLowerCase()==='premium'?'essencial':'gratis');
      const infoCreditos=creditosPlano(nivel,plano);
      $('carteira-plano').textContent=nivelLabel(nivel,plano);
      $('carteira-creditos-rotulo').textContent=infoCreditos.rotulo;
      $('carteira-creditos-mensais').textContent=infoCreditos.texto;
      if(ativa&&assinatura.expira_em){
        $('carteira-renovacao-rotulo').textContent='Válido até';
        $('carteira-renovacao').textContent=new Date(assinatura.expira_em).toLocaleDateString('pt-BR');
      }else{
        $('carteira-renovacao-rotulo').textContent='Assinatura';
        $('carteira-renovacao').textContent='Sem assinatura ativa';
      }
    }catch(erro){
      console.error('Erro ao carregar carteira:',erro);
      $('saldo-efex').textContent='—';
      $('carteira-plano').textContent='Não foi possível carregar';
      mostrarErroCarteira('Não foi possível carregar sua carteira agora. Verifique sua conexão e tente novamente.');
    }
  }

  function normalizarMovimento(item){
    const bruto=item.quantidade??item.creditos??item.valor_creditos??item.saldo_movimento??item.valor??0;
    const quantidade=Number(bruto)||0;
    const tipo=String(item.tipo||item.natureza||item.operacao||'').toLowerCase();
    const saida=quantidade<0||['consumo','debito','saida','uso'].includes(tipo);
    return {id:item.id||`${item.criado_em||item.created_at||''}-${quantidade}`,titulo:item.descricao||item.titulo||item.origem||item.motivo||(saida?'Consumo Efex':'Crédito Efex'),data:item.criado_em||item.created_at||item.data||item.ocorrido_em,valor:saida?-Math.abs(quantidade):Math.abs(quantidade),saldo:item.saldo_apos??item.saldo_resultante??null};
  }

  function listaFiltrada(){
    const filtro=$('filtro-extrato')?.value||'todos';
    return extratoCompleto.map(normalizarMovimento).filter(item=>filtro==='todos'||(filtro==='entrada'?item.valor>=0:item.valor<0));
  }

  function renderizarExtrato(){
    const container=$('extrato-lista'); const status=$('extrato-status'); const mais=$('btn-carregar-mais');
    if(!container||!status)return;
    const filtrada=listaFiltrada(); const visiveis=filtrada.slice(0,limiteVisivel);
    if(!filtrada.length){status.textContent='Nenhuma movimentação encontrada.';status.classList.remove('hidden');container.innerHTML='';mais?.classList.add('hidden');return;}
    status.classList.add('hidden');
    container.innerHTML=visiveis.map(mov=>{
      const classe=mov.valor<0?'saida':'entrada'; const sinal=mov.valor<0?'−':'+';
      const saldo=mov.saldo==null?'':` · Saldo após: ${Number(mov.saldo)||0}`;
      return `<article class="movimento"><div><div class="movimento-titulo">${escapar(mov.titulo)}</div><div class="movimento-meta">${escapar(dataHora(mov.data))}${escapar(saldo)}</div></div><div class="movimento-valor ${classe}">${sinal}${Math.abs(mov.valor)} crédito${Math.abs(mov.valor)===1?'':'s'}</div></article>`;
    }).join('');
    mais?.classList.toggle('hidden',visiveis.length>=filtrada.length);
  }

  async function carregarExtratoEfex(forcar=false){
    let session; try{session=await sessao();}catch{return;}
    if(!session)return;
    const status=$('extrato-status');
    if(status){status.textContent=forcar?'Atualizando movimentações...':'Carregando movimentações...';status.classList.remove('hidden');}
    try{
      const rpc=await _supabase.rpc('fs_extrato_efex',{limite:200});
      if(rpc.error)throw rpc.error;
      extratoCompleto=Array.isArray(rpc.data)?rpc.data:[];
      limiteVisivel=20;
      renderizarExtrato();
    }catch(erro){
      console.warn('Extrato Efex indisponível:',erro);
      if(status){status.textContent='O saldo está ativo, mas o extrato detalhado não pôde ser carregado agora.';status.classList.remove('hidden');}
    }
  }

  async function atualizarCarteiraCompleta(){
    if(atualizandoCarteira)return;
    atualizandoCarteira=true;
    setBotaoCarregando('btn-atualizar-carteira',true,'Atualizando...');
    setBotaoCarregando('btn-atualizar-extrato',true,'Atualizando...');
    try{await Promise.all([carregarCarteiraEfex(true),carregarExtratoEfex(true)]);}finally{
      atualizandoCarteira=false;
      setBotaoCarregando('btn-atualizar-carteira',false);
      setBotaoCarregando('btn-atualizar-extrato',false);
    }
  }

  function vincularEventos(){
    $('btn-atualizar-carteira')?.addEventListener('click',atualizarCarteiraCompleta);
    $('btn-atualizar-extrato')?.addEventListener('click',()=>carregarExtratoEfex(true));
    $('btn-gerar-pix')?.addEventListener('click',()=>window.comprarPacoteSelecionado?.());
    $('filtro-extrato')?.addEventListener('change',()=>{limiteVisivel=20;renderizarExtrato();});
    $('btn-carregar-mais')?.addEventListener('click',()=>{limiteVisivel+=20;renderizarExtrato();});
    $('pacotes-creditos')?.addEventListener('click',event=>{
      const botao=event.target.closest('[data-codigo]');
      if(!botao)return;
      $('pacote-creditos').value=botao.dataset.codigo;
      atualizarResumoCarteira();
      window.atualizarPacoteCreditos?.();
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    preencherPacotes(); vincularEventos();
    await atualizarCarteiraCompleta();
    carregamentoInicialConcluido=true;
  });

  _supabase?.auth?.onAuthStateChange?.((event,session)=>{
    if(event==='SIGNED_OUT'||!session){mostrarConteudo(false);if(carregamentoInicialConcluido)irParaLogin();return;}
    if(carregamentoInicialConcluido&&event==='SIGNED_IN')atualizarCarteiraCompleta();
  });

  Object.assign(window,{carregarCarteiraEfex,carregarExtratoEfex,atualizarResumoCarteira,atualizarCarteiraCompleta});
})();
