(function(){
  'use strict';

  const LIMITE = 20;
  let pagina = 0;
  let total = 0;
  let carregando = false;

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dataHora = valor => {
    if(!valor) return '—';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
  };
  const escapar = valor => String(valor ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const statusLabel = status => ({pago:'Pago',pendente:'Pendente',expirado:'Expirado',cancelado:'Cancelado',confirmado:'Confirmado',paid:'Pago'})[String(status||'').toLowerCase()] || status || '—';

  function renderMetricas(itens){
    $('m-total').textContent = total;
    $('m-pagos').textContent = itens.filter(i => ['pago','confirmado','paid'].includes(String(i.status||'').toLowerCase())).length;
    $('m-pendentes').textContent = itens.filter(i => String(i.status||'').toLowerCase() === 'pendente').length;
    $('m-expirados').textContent = itens.filter(i => String(i.status||'').toLowerCase() === 'expirado').length;
  }

  function renderLista(itens){
    const box = $('historico-lista');
    if(!itens.length){ box.innerHTML = '<div class="empty">Nenhum pagamento encontrado com esses filtros.</div>'; return; }
    box.innerHTML = itens.map(item => {
      const status = String(item.status || '').toLowerCase();
      const complemento = item.produto_tipo === 'creditos'
        ? `${Number(item.creditos || 0)} créditos`
        : (item.periodo ? `Período: ${escapar(item.periodo)}` : 'Assinatura FS');
      const momento = item.pago_em || item.criado_em;
      return `<article class="item">
        <div><strong>${escapar(item.descricao || 'Pagamento FS')}</strong><small>${complemento}</small></div>
        <div><span class="badge ${escapar(status)}">${escapar(statusLabel(status))}</span></div>
        <div><strong>${moeda(item.valor)}</strong><small>${item.aplicado_em ? 'Aplicado à conta' : 'Aguardando aplicação'}</small></div>
        <div><strong>${dataHora(momento)}</strong><small>${item.pago_em ? 'Data do pagamento' : 'Data da criação'}</small></div>
      </article>`;
    }).join('');
  }

  function atualizarPaginacao(){
    const inicio = total ? pagina * LIMITE + 1 : 0;
    const fim = Math.min((pagina + 1) * LIMITE, total);
    $('pager-info').textContent = total ? `${inicio}–${fim} de ${total}` : 'Nenhum registro';
    $('btn-anterior').disabled = pagina <= 0 || carregando;
    $('btn-proxima').disabled = (pagina + 1) * LIMITE >= total || carregando;
  }

  async function carregar(){
    if(carregando) return;
    carregando = true;
    atualizarPaginacao();
    $('historico-lista').innerHTML = '<div class="empty">Carregando...</div>';
    try{
      const { data: { session } } = await _supabase.auth.getSession();
      if(!session?.user?.id){ location.href = '/index.html?login=1&dest=' + encodeURIComponent('/historico-financeiro.html'); return; }
      const { data, error } = await _supabase.rpc('fs_historico_financeiro',{
        p_status: $('f-status').value || null,
        p_tipo: $('f-tipo').value || null,
        p_limite: LIMITE,
        p_offset: pagina * LIMITE
      });
      if(error) throw error;
      total = Number(data?.total || 0);
      const itens = Array.isArray(data?.itens) ? data.itens : [];
      renderMetricas(itens);
      renderLista(itens);
    }catch(erro){
      console.error(erro);
      total = 0;
      renderMetricas([]);
      $('historico-lista').innerHTML = '<div class="empty">Não foi possível carregar o histórico financeiro.</div>';
    }finally{
      carregando = false;
      atualizarPaginacao();
    }
  }

  $('btn-filtrar')?.addEventListener('click',()=>{pagina=0;carregar();});
  $('f-status')?.addEventListener('change',()=>{pagina=0;carregar();});
  $('f-tipo')?.addEventListener('change',()=>{pagina=0;carregar();});
  $('btn-anterior')?.addEventListener('click',()=>{if(pagina>0){pagina--;carregar();}});
  $('btn-proxima')?.addEventListener('click',()=>{if((pagina+1)*LIMITE<total){pagina++;carregar();}});

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',carregar);
  else carregar();
})();