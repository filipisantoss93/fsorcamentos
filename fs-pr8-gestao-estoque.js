/* FS Orçamentos - PR8 limpo */
(function () {
  'use strict';
  const path = (location.pathname || '').toLowerCase();
  const page = (path.split('/').pop() || '').replace('.html', '');
  const isEstoque = page === 'estoque' || path.endsWith('/estoque');
  let cache = [];

  const dash = {
    clientes: ['.clientes-resumo', 'Dashboard de clientes', 'Resumo rápido da carteira de clientes para acompanhar relacionamento, status e recorrência.'],
    veiculos: ['.veiculos-resumo', 'Dashboard de veículos', 'Resumo rápido da frota cadastrada para acompanhar veículos ativos, vínculos e histórico.'],
    ordens: ['.ordens-resumo', 'Dashboard de ordens', 'Resumo rápido das OSs para acompanhar execução, conclusão e pagamentos.'],
    estoque: ['.estoque-resumo', 'Dashboard de estoque', 'Resumo rápido dos produtos para acompanhar disponibilidade, estoque mínimo e valor em venda.'],
    agenda: ['.agenda-resumo,.agenda-resumo-grid', 'Dashboard de agenda', 'Resumo rápido dos agendamentos para acompanhar serviços do dia, atrasos e próximos atendimentos.'],
    relatorios: ['.relatorios-resumo,.relatorios-dashboard,.dashboard-relatorios', 'Dashboard de relatórios', 'Resumo rápido dos indicadores para acompanhar desempenho, faturamento e produtividade.'],
    recorrentes: ['.recorrentes-resumo,.recorrentes-dashboard', 'Dashboard de recorrentes', 'Resumo rápido dos serviços recorrentes para acompanhar contratos, próximas cobranças e clientes ativos.']
  };

  const modalCampos = ['id','user_id','descricao','fabricante','categoria','subcategoria','codigo','unidade','quantidade_atual','estoque_minimo','valor_custo','valor_venda','controlar_estoque','ativo','observacoes','created_at','updated_at','marca_veiculo','modelo_veiculo','ano_inicial','ano_final','versao_veiculo','motor_veiculo','codigo_original','codigo_fabricante','aplicacao','produto_universal'];
  const labels = {id:'ID',user_id:'Usuário',descricao:'Descrição',fabricante:'Fabricante',categoria:'Categoria',subcategoria:'Subcategoria',codigo:'Código',unidade:'Unidade',quantidade_atual:'Qtd disponível',estoque_minimo:'Estoque mínimo',valor_custo:'Valor de custo',valor_venda:'Valor de venda',controlar_estoque:'Controlar estoque',ativo:'Ativo',observacoes:'Observações',created_at:'Criado em',updated_at:'Atualizado em',marca_veiculo:'Marca do veículo',modelo_veiculo:'Modelo do veículo',ano_inicial:'Ano inicial',ano_final:'Ano final',versao_veiculo:'Versão',motor_veiculo:'Motor',codigo_original:'Código original',codigo_fabricante:'Código fabricante',aplicacao:'Aplicação',produto_universal:'Produto universal'};

  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const num = v => { if (v === null || v === undefined || v === '') return 0; if (typeof v === 'number') return Number.isFinite(v) ? v : 0; let s = String(v).replace(/[^\d.,-]/g,''); if (!s) return 0; if (s.includes(',')) s = s.replace(/\./g,'').replace(',','.'); const n = Number(s); return Number.isFinite(n) ? n : 0; };
  const moeda = v => num(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const qtd = v => { const n = num(v); return n.toLocaleString('pt-BR',{minimumFractionDigits:n % 1 === 0 ? 0 : 2, maximumFractionDigits:2}); };
  const val = id => document.getElementById(id)?.value?.trim?.() || '';
  const setVal = (id,v) => { const e = document.getElementById(id); if (e) e.value = v ?? ''; };
  const ck = id => !!document.getElementById(id)?.checked;
  const setCk = (id,v) => { const e = document.getElementById(id); if (e) e.checked = !!v; };
  const nome = p => String(p?.descricao || p?.nome || '').trim() || 'Produto sem descrição';

  function css() {
    if (document.getElementById('fs-pr8-css')) return;
    const s = document.createElement('style');
    s.id = 'fs-pr8-css';
    s.textContent = '.clientes-hero,.veiculos-hero,.ordens-hero,.estoque-hero,.agenda-hero,.relatorios-hero,.recorrentes-hero{display:none!important}.fs-dashboard-gestao-bloco,.clientes-resumo,.veiculos-resumo,.ordens-resumo,.estoque-resumo,.agenda-resumo,.agenda-resumo-grid,.relatorios-resumo,.relatorios-dashboard,.dashboard-relatorios,.recorrentes-resumo,.recorrentes-dashboard{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;margin:0 0 18px!important;padding:16px!important;background:#fff!important;border:1px solid #d1d5db!important;border-radius:14px!important;box-shadow:0 8px 22px rgba(15,23,42,.08)!important}.fs-dashboard-gestao-cabecalho{grid-column:1/-1!important}.fs-dashboard-gestao-cabecalho h2{margin:0!important;color:#111827!important;font-size:22px!important;font-weight:950!important}.fs-dashboard-gestao-cabecalho p{margin:6px 0 0!important;color:#64748b!important;font-size:14px!important;font-weight:800!important}.card-resumo,.agenda-metrica{min-height:84px!important;padding:13px!important;background:#fff!important;border:1px solid #d1d5db!important;border-radius:10px!important;box-shadow:0 3px 10px rgba(15,23,42,.05)!important}.card-resumo.destaque{background:#475569!important;color:#fff!important}.card-resumo span,.agenda-metrica span{color:#64748b!important;font-size:11px!important;font-weight:950!important;text-transform:uppercase!important}.card-resumo strong,.agenda-metrica strong{color:#1f2937!important;font-size:22px!important;font-weight:950!important}.card-resumo.destaque *{color:#fff!important}.fs-tabela-lista-wrapper{width:100%!important;overflow-x:auto!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:10px!important}.fs-tabela-lista{width:100%!important;min-width:1040px!important;border-collapse:collapse!important;table-layout:fixed!important}.fs-tabela-lista th,.fs-tabela-lista td{padding:8px 9px!important;border-bottom:1px solid #e5e7eb!important;text-align:left!important;color:#111827!important;font-size:12px!important}.fs-tabela-lista th{background:#f3f4f6!important;text-transform:uppercase!important;font-weight:950!important}.fs-tabela-lista tr{cursor:pointer!important}.fs-tabela-lista tr:nth-child(even){background:#f9fafb!important}.fs-tabela-lista tr:hover{background:#f3f4f6!important}.fs-tabela-lista small{display:block!important;color:#6b7280!important;font-size:10.5px!important}.fs-pr8-modal{position:fixed!important;inset:0!important;z-index:59000!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:16px!important;background:rgba(17,24,39,.62)!important;overflow:auto!important}.fs-pr8-card{width:min(860px,100%)!important;margin-top:16px!important;background:#fff!important;border:1px solid #d1d5db!important;border-radius:10px!important;box-shadow:0 18px 42px rgba(0,0,0,.22)!important;overflow:hidden!important}.fs-pr8-top{display:flex!important;justify-content:space-between!important;padding:12px 14px!important;background:#f3f4f6!important;border-bottom:1px solid #e5e7eb!important}.fs-pr8-close{width:32px!important;height:32px!important;border:1px solid #d1d5db!important;background:#fff!important;color:#991b1b!important;font-size:20px!important;font-weight:900!important}.fs-pr8-body{padding:13px 14px!important}.fs-pr8-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.fs-pr8-dado{background:#f9fafb!important;border:1px solid #e5e7eb!important;border-radius:8px!important;padding:8px!important}.fs-pr8-dado strong{display:block!important;color:#374151!important;font-size:10px!important;text-transform:uppercase!important}.fs-pr8-acoes{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin-top:12px!important;padding-top:10px!important;border-top:1px solid #e5e7eb!important}.fs-pr8-acoes button{min-height:32px!important;padding:7px 10px!important;border:1px solid #d1d5db!important;background:#fff!important;font-weight:900!important}.fs-pr8-acoes .perigo{background:#fff5f5!important;color:#b91c1c!important;border-color:#fecaca!important}@media(max-width:760px){.fs-dashboard-gestao-bloco,.clientes-resumo,.veiculos-resumo,.ordens-resumo,.estoque-resumo,.agenda-resumo,.agenda-resumo-grid,.relatorios-resumo,.relatorios-dashboard,.dashboard-relatorios,.recorrentes-resumo,.recorrentes-dashboard{grid-template-columns:repeat(2,minmax(0,1fr))!important}.fs-pr8-grid{grid-template-columns:1fr!important}.fs-pr8-acoes{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}}';
    document.head.appendChild(s);
  }

  function dashboard() {
    const d = dash[page]; if (!d) return;
    const sec = document.querySelector(d[0]); if (!sec) return;
    sec.classList.add('fs-dashboard-gestao-bloco');
    if (!sec.querySelector('.fs-dashboard-gestao-cabecalho')) {
      const h = document.createElement('div');
      h.className = 'fs-dashboard-gestao-cabecalho';
      h.innerHTML = '<h2>'+esc(d[1])+'</h2><p>'+esc(d[2])+'</p>';
      sec.prepend(h);
    }
  }

  async function session() { const r = await window._supabase?.auth.getSession(); return r?.data?.session || null; }

  function form() {
    const input = document.getElementById('produto-nome');
    const label = document.querySelector('label[for="produto-nome"]'); if (label) label.textContent = 'Descrição do produto *';
    if (input) input.placeholder = 'Ex: Correia dentada, Palheta, Disco de freio';
    const desc = document.getElementById('produto-descricao')?.closest('.campo'); if (desc) desc.style.display = 'none';
    if (!document.getElementById('produto-fabricante') && input?.closest('.campo')) {
      const c = document.createElement('div'); c.className = 'campo';
      c.innerHTML = '<label for="produto-fabricante">Fabricante / marca da peça</label><input type="text" id="produto-fabricante" placeholder="Ex: Bosch, Cofap, Nakata, Gates" autocomplete="off"><small>Marca/fabricante da peça. Não é a marca do veículo.</small>';
      input.closest('.campo').after(c);
    }
    const marca = document.querySelector('label[for="produto-marca-veiculo"]'); if (marca) marca.textContent = 'Marca do veículo compatível';
    const busca = document.getElementById('busca-produtos'); if (busca) busca.placeholder = 'Descrição, fabricante, código, marca, modelo, categoria ou subcategoria';
  }

  function payload() {
    return {descricao:val('produto-nome')||val('produto-descricao'),fabricante:val('produto-fabricante'),categoria:val('produto-categoria')==='__outra__'?val('produto-categoria-outra'):val('produto-categoria'),subcategoria:val('produto-subcategoria'),marca_veiculo:val('produto-marca-veiculo'),modelo_veiculo:val('produto-modelo-veiculo'),ano_inicial:val('produto-ano-inicial')?parseInt(val('produto-ano-inicial'),10):null,ano_final:val('produto-ano-final')?parseInt(val('produto-ano-final'),10):null,versao_veiculo:val('produto-versao-veiculo'),motor_veiculo:val('produto-motor-veiculo'),codigo_original:val('produto-codigo-original'),codigo_fabricante:val('produto-codigo-fabricante'),aplicacao:val('produto-aplicacao'),produto_universal:ck('produto-universal'),codigo:val('produto-codigo'),unidade:val('produto-unidade')||'un',quantidade_atual:num(val('produto-quantidade-atual')),estoque_minimo:num(val('produto-estoque-minimo')),valor_custo:num(val('produto-valor-custo')),valor_venda:num(val('produto-valor-venda')),controlar_estoque:ck('produto-controlar-estoque'),ativo:val('produto-ativo')!=='false',observacoes:val('produto-observacoes')};
  }

  async function salvar(e) {
    e?.preventDefault?.(); e?.stopImmediatePropagation?.();
    const s = await session(); if (!s?.user?.id) return;
    const p = payload(); if (!p.descricao) return;
    const id = val('produto-id');
    let r = id ? await _supabase.from('produtos_estoque').update(p).eq('id',id).eq('user_id',s.user.id) : await _supabase.from('produtos_estoque').insert({...p,user_id:s.user.id});
    if (r.error && !id && String(r.error.message||'').toLowerCase().includes('nome')) r = await _supabase.from('produtos_estoque').insert({...p,nome:p.descricao,user_id:s.user.id});
    if (r.error) return alert('Erro ao salvar produto.');
    document.getElementById('form-produto-estoque')?.reset(); setVal('produto-id',''); setVal('produto-unidade','un'); setVal('produto-ativo','true'); setCk('produto-controlar-estoque',true); carregar();
  }

  async function carregar() {
    if (!isEstoque || !window._supabase) return;
    const s = await session(); if (!s?.user?.id) return;
    const termo = val('busca-produtos'), status = val('filtro-status-produtos'), est = val('filtro-estoque-produtos'), cat = val('filtro-categoria-produtos'), sub = val('filtro-subcategoria-produtos');
    let q = _supabase.from('produtos_estoque').select('*').eq('user_id',s.user.id).order('categoria',{ascending:true}).order('descricao',{ascending:true}).limit(20);
    if (termo) { const t='%'+termo+'%'; q=q.or('descricao.ilike.'+t+',fabricante.ilike.'+t+',codigo.ilike.'+t+',categoria.ilike.'+t+',subcategoria.ilike.'+t+',marca_veiculo.ilike.'+t+',modelo_veiculo.ilike.'+t+',codigo_original.ilike.'+t+',codigo_fabricante.ilike.'+t+',aplicacao.ilike.'+t+',observacoes.ilike.'+t); }
    if (status==='ativo') q=q.eq('ativo',true); if (status==='inativo') q=q.eq('ativo',false); if (cat&&cat!=='Sem categoria') q=q.eq('categoria',cat); if (sub&&sub!=='Sem subcategoria') q=q.eq('subcategoria',sub); if (est==='sem_controle') q=q.eq('controlar_estoque',false);
    const {data,error}=await q; if(error){console.error(error);return;}
    let lista=Array.isArray(data)?data:[]; if(est==='baixo') lista=lista.filter(p=>p.ativo!==false&&p.controlar_estoque!==false&&num(p.quantidade_atual)<=num(p.estoque_minimo)); if(est==='normal') lista=lista.filter(p=>p.controlar_estoque!==false&&num(p.quantidade_atual)>num(p.estoque_minimo));
    render(lista); try{window.atualizarResumoEstoque?.(lista)}catch(_){ }
  }

  function render(lista) {
    const c=document.getElementById('lista-produtos-estoque'); if(!c)return; cache=Array.isArray(lista)?lista:[]; window.produtosEstoqueCache=cache;
    if(!cache.length){c.innerHTML='<div class="estado-vazio"><strong>Nenhum produto encontrado</strong><p>Cadastre produtos ou ajuste os filtros.</p></div>';return;}
    const heads=['Código','Descrição','Fabricante','Qtd disponível','Valor','Marca veículo','Modelo','Categoria','Subcategoria'].map(h=>'<th>'+h+'</th>').join('');
    const rows=cache.map(p=>'<tr data-id="'+esc(p.id)+'"><td>'+esc(p.codigo||p.codigo_original||p.codigo_fabricante||'-')+'</td><td><strong>'+esc(nome(p))+'</strong><small>'+esc(p.aplicacao||'')+'</small></td><td>'+esc(p.fabricante||'-')+'</td><td><strong>'+qtd(p.quantidade_atual)+' '+esc(p.unidade||'un')+'</strong><small>mín. '+qtd(p.estoque_minimo)+' '+esc(p.unidade||'un')+'</small></td><td><strong>'+moeda(p.valor_venda)+'</strong></td><td>'+esc(p.marca_veiculo||'-')+'</td><td>'+esc(p.modelo_veiculo||'-')+'</td><td>'+esc(p.categoria||'-')+'</td><td>'+esc(p.subcategoria||'-')+'</td></tr>').join('');
    c.innerHTML='<div class="fs-tabela-lista-wrapper"><table class="fs-tabela-lista"><thead><tr>'+heads+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
    c.querySelectorAll('tbody tr').forEach(tr=>tr.onclick=()=>abrirModal(tr.dataset.id));
  }

  function fechar(){document.getElementById('fs-pr8-modal')?.remove();}
  function abrirModal(id){const p=cache.find(x=>String(x.id)===String(id)); if(!p)return; fechar(); const dados=modalCampos.map(k=>'<div class="fs-pr8-dado"><strong>'+esc(labels[k]||k)+'</strong><span>'+esc((k==='valor_custo'||k==='valor_venda')?moeda(p[k]):(k==='quantidade_atual'||k==='estoque_minimo')?qtd(p[k]):typeof p[k]==='boolean'?(p[k]?'Sim':'Não'):(p[k]??'-'))+'</span></div>').join(''); const m=document.createElement('div'); m.id='fs-pr8-modal'; m.className='fs-pr8-modal'; m.innerHTML='<section class="fs-pr8-card"><header class="fs-pr8-top"><div><strong>'+esc(nome(p))+'</strong><span>'+esc([p.codigo,p.fabricante,p.marca_veiculo,p.modelo_veiculo].filter(Boolean).join(' • ')||'Produto do estoque')+'</span></div><button class="fs-pr8-close">×</button></header><div class="fs-pr8-body"><div class="fs-pr8-grid">'+dados+'</div><div class="fs-pr8-acoes"><button data-a="edit">Editar</button><button data-a="entrada">Entrada</button><button data-a="saida">Saída</button><button data-a="ajuste">Ajuste</button><button class="perigo" data-a="del">Excluir</button></div></div></section>'; m.querySelector('.fs-pr8-close').onclick=fechar; m.onclick=e=>{if(e.target===m)fechar()}; m.querySelector('[data-a="edit"]').onclick=()=>editar(p.id); m.querySelector('[data-a="entrada"]').onclick=()=>abrirModalMovimentacaoEstoque(p.id,'entrada'); m.querySelector('[data-a="saida"]').onclick=()=>abrirModalMovimentacaoEstoque(p.id,'saida'); m.querySelector('[data-a="ajuste"]').onclick=()=>abrirModalMovimentacaoEstoque(p.id,'ajuste'); m.querySelector('[data-a="del"]').onclick=()=>excluirProdutoEstoque(p.id); document.body.appendChild(m);}

  function editar(id){const p=cache.find(x=>String(x.id)===String(id)); if(!p)return; fechar(); setVal('produto-id',p.id); setVal('produto-nome',nome(p)); setVal('produto-fabricante',p.fabricante||''); setVal('produto-categoria',p.categoria||''); setVal('produto-subcategoria',p.subcategoria||''); setVal('produto-marca-veiculo',p.marca_veiculo||''); setVal('produto-modelo-veiculo',p.modelo_veiculo||''); setVal('produto-ano-inicial',p.ano_inicial||''); setVal('produto-ano-final',p.ano_final||''); setVal('produto-versao-veiculo',p.versao_veiculo||''); setVal('produto-motor-veiculo',p.motor_veiculo||''); setVal('produto-codigo-original',p.codigo_original||''); setVal('produto-codigo-fabricante',p.codigo_fabricante||''); setVal('produto-aplicacao',p.aplicacao||''); setCk('produto-universal',p.produto_universal===true); setVal('produto-codigo',p.codigo||''); setVal('produto-unidade',p.unidade||'un'); setVal('produto-ativo',p.ativo===false?'false':'true'); setCk('produto-controlar-estoque',p.controlar_estoque!==false); setVal('produto-quantidade-atual',num(p.quantidade_atual).toFixed(2)); setVal('produto-estoque-minimo',num(p.estoque_minimo).toFixed(2)); setVal('produto-valor-custo',num(p.valor_custo).toFixed(2)); setVal('produto-valor-venda',num(p.valor_venda).toFixed(2)); setVal('produto-observacoes',p.observacoes||''); document.getElementById('card-form-produto')?.classList.remove('form-fechado'); scrollTo({top:0,behavior:'smooth'});}

  function instalar(){css();dashboard(); if(!isEstoque)return; form(); window.carregarProdutosEstoque=carregar; window.renderizarProdutosEstoque=render; window.editarProdutoEstoque=editar; const f=document.getElementById('form-produto-estoque'); if(f&&f.dataset.pr8!=='1'){f.dataset.pr8='1';f.addEventListener('submit',salvar,true)} ['btn-atualizar-estoque','busca-produtos','filtro-status-produtos','filtro-estoque-produtos','filtro-categoria-produtos','filtro-subcategoria-produtos'].forEach(id=>{const e=document.getElementById(id); if(e&&e.dataset.pr8!=='1'){e.dataset.pr8='1'; e.addEventListener(id==='busca-produtos'?'input':id==='btn-atualizar-estoque'?'click':'change',ev=>{ev.stopImmediatePropagation();carregar()},true)}}); setTimeout(carregar,250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);else instalar(); [500,1500,3000].forEach(t=>setTimeout(instalar,t)); document.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});
})();
