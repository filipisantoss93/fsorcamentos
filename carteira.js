(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const dataHora = valor => {
    if (!valor) return 'Data não informada';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Data não informada' : data.toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });
  };

  const PACOTES = {
    creditos_20:{creditos:20,valor:9.90,label:'20 créditos Efex',promocao:false},
    creditos_50:{creditos:50,valor:24.90,label:'50 créditos Efex',promocao:false},
    creditos_100:{creditos:100,valor:49.90,label:'100 créditos Efex',promocao:false},
    creditos_200:{creditos:200,valor:99.90,label:'200 créditos Efex',promocao:false},
    creditos_400:{creditos:400,valor:189.90,label:'400 créditos Efex',promocao:true}
  };

  function escapar(valor){
    return String(valor ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  async function sessao(){
    try {
      const { data:{ session } } = await _supabase.auth.getSession();
      return session || null;
    } catch (erro) {
      console.error('Erro ao obter sessão da carteira:', erro);
      return null;
    }
  }

  function nivelLabel(nivel, plano){
    const n = String(nivel || '').toLowerCase();
    if (n === 'pro') return 'Premium PRO';
    if (n === 'essencial') return 'Premium Essencial';
    return String(plano || '').toLowerCase() === 'premium' ? 'Premium Essencial' : 'Plano Gratuito';
  }

  function creditosMensais(nivel, plano){
    const n = String(nivel || '').toLowerCase();
    if (n === 'pro') return '30 créditos por mês';
    if (n === 'essencial' || String(plano || '').toLowerCase() === 'premium') return '15 créditos por mês';
    return '5 créditos de boas-vindas';
  }

  function atualizarResumoCarteira(){
    const codigo = $('pacote-creditos')?.value || 'creditos_50';
    const pacote = PACOTES[codigo] || PACOTES.creditos_50;
    if ($('resumo-pacote')) $('resumo-pacote').textContent = pacote.label;
    if ($('valor-pacote-creditos')) $('valor-pacote-creditos').textContent = moeda(pacote.valor);
    if ($('resumo-promocao')) $('resumo-promocao').textContent = pacote.promocao ? 'Preço promocional exclusivo deste pacote' : 'Sem desconto aplicado';
  }

  async function carregarCarteiraEfex(forcar = false){
    const session = await sessao();
    if (!session) {
      window.location.href = '/index.html?login=1&dest=' + encodeURIComponent('/carteira.html');
      return;
    }

    if ($('saldo-efex')) $('saldo-efex').textContent = forcar ? '...' : '—';

    try {
      const [saldoResp, perfilResp, assinaturaResp] = await Promise.all([
        _supabase.rpc('fs_meu_saldo_efex'),
        _supabase.from('perfis').select('plano,plano_status,plano_expira_em').eq('id', session.user.id).maybeSingle(),
        _supabase.from('assinaturas').select('plano,nivel,status,expira_em').eq('usuario_id', session.user.id).maybeSingle()
      ]);

      if (saldoResp.error) throw saldoResp.error;
      const saldoBruto = saldoResp.data;
      const saldo = Number(saldoBruto?.saldo ?? saldoBruto ?? 0) || 0;
      if ($('saldo-efex')) $('saldo-efex').textContent = String(saldo);

      const perfil = perfilResp.data || {};
      const assinatura = assinaturaResp.data || {};
      const plano = assinatura.plano || perfil.plano || 'gratis';
      const nivel = assinatura.nivel || (String(plano).toLowerCase() === 'premium' ? 'essencial' : 'gratis');
      const expira = assinatura.expira_em || perfil.plano_expira_em || null;

      if ($('carteira-plano')) $('carteira-plano').textContent = nivelLabel(nivel, plano);
      if ($('carteira-creditos-mensais')) $('carteira-creditos-mensais').textContent = creditosMensais(nivel, plano);
      if ($('carteira-renovacao')) $('carteira-renovacao').textContent = expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Sem data definida';
    } catch (erro) {
      console.error('Erro ao carregar carteira:', erro);
      if ($('saldo-efex')) $('saldo-efex').textContent = '—';
      if ($('carteira-plano')) $('carteira-plano').textContent = 'Não foi possível carregar';
    }
  }

  function normalizarMovimento(item){
    const quantidadeBruta = item.quantidade ?? item.creditos ?? item.valor_creditos ?? item.saldo_movimento ?? item.valor ?? 0;
    const quantidade = Number(quantidadeBruta) || 0;
    const tipo = String(item.tipo || item.natureza || item.operacao || '').toLowerCase();
    const saida = quantidade < 0 || ['consumo','debito','saida','uso'].includes(tipo);
    const valor = saida ? -Math.abs(quantidade) : Math.abs(quantidade);
    return {
      id:item.id || `${item.criado_em || item.created_at || ''}-${quantidade}`,
      titulo:item.descricao || item.titulo || item.origem || item.motivo || (saida ? 'Consumo Efex' : 'Crédito Efex'),
      data:item.criado_em || item.created_at || item.data || item.ocorrido_em,
      valor,
      saldo:item.saldo_apos ?? item.saldo_resultante ?? null
    };
  }

  function renderizarExtrato(lista){
    const container = $('extrato-lista');
    const status = $('extrato-status');
    if (!container || !status) return;

    if (!lista.length) {
      status.textContent = 'Nenhuma movimentação registrada ainda.';
      status.classList.remove('hidden');
      container.innerHTML = '';
      return;
    }

    status.classList.add('hidden');
    container.innerHTML = lista.map(item => {
      const mov = normalizarMovimento(item);
      const classe = mov.valor < 0 ? 'saida' : 'entrada';
      const sinal = mov.valor < 0 ? '−' : '+';
      const saldo = mov.saldo === null || mov.saldo === undefined ? '' : ` · Saldo após: ${Number(mov.saldo) || 0}`;
      return `<article class="movimento"><div><div class="movimento-titulo">${escapar(mov.titulo)}</div><div class="movimento-meta">${escapar(dataHora(mov.data))}${escapar(saldo)}</div></div><div class="movimento-valor ${classe}">${sinal}${Math.abs(mov.valor)} crédito${Math.abs(mov.valor) === 1 ? '' : 's'}</div></article>`;
    }).join('');
  }

  async function carregarExtratoEfex(forcar = false){
    const session = await sessao();
    if (!session) return;
    const status = $('extrato-status');
    const container = $('extrato-lista');
    if (status) { status.textContent = forcar ? 'Atualizando movimentações...' : 'Carregando movimentações...'; status.classList.remove('hidden'); }
    if (container) container.innerHTML = '';

    try {
      let lista = [];
      const rpc = await _supabase.rpc('fs_extrato_efex', { limite:50 });
      if (!rpc.error && Array.isArray(rpc.data)) {
        lista = rpc.data;
      } else {
        const tabela = await _supabase
          .from('efex_movimentacoes')
          .select('*')
          .eq('usuario_id', session.user.id)
          .order('criado_em', { ascending:false })
          .limit(50);
        if (!tabela.error && Array.isArray(tabela.data)) lista = tabela.data;
        else if (rpc.error && tabela.error) throw tabela.error;
      }
      renderizarExtrato(lista);
    } catch (erro) {
      console.warn('Extrato Efex ainda não disponível:', erro);
      if (status) {
        status.textContent = 'O saldo está ativo, mas o extrato detalhado ainda não foi disponibilizado pelo backend.';
        status.classList.remove('hidden');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    atualizarResumoCarteira();
    await Promise.all([carregarCarteiraEfex(), carregarExtratoEfex()]);
  });

  _supabase?.auth?.onAuthStateChange?.((event, session) => {
    if (!session) return;
    carregarCarteiraEfex(true);
    carregarExtratoEfex(true);
  });

  Object.assign(window, { carregarCarteiraEfex, carregarExtratoEfex, atualizarResumoCarteira });
})();