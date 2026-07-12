(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const dataHora = valor => {
    if (!valor) return 'Data não informada';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Data não informada' : data.toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });
  };

  let carregamentoInicialConcluido = false;

  function produtos(){
    return window.FS_PRODUTOS_COMERCIAIS || {};
  }

  function escapar(valor){
    return String(valor ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function mostrarConteudo(mostrar){
    const conteudo = $('conteudo-protegido');
    if (conteudo) conteudo.classList.toggle('hidden', !mostrar);
  }

  function mostrarErroCarteira(mensagem = ''){
    const erro = $('carteira-erro');
    if (!erro) return;
    erro.textContent = mensagem;
    erro.classList.toggle('hidden', !mensagem);
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

  function irParaLogin(){
    const destino = '/carteira.html' + (location.hash || '');
    if (typeof fsIrParaLoginComDestino === 'function') {
      fsIrParaLoginComDestino(destino);
      return;
    }
    try { localStorage.setItem('fs_destino_apos_login', destino); } catch (_) {}
    window.location.href = '/index.html?login=1&dest=' + encodeURIComponent(destino);
  }

  function assinaturaAtiva(assinatura){
    if (!assinatura || !assinatura.status) return false;
    const status = String(assinatura.status).toLowerCase();
    const statusValido = ['ativo','active','pago','paid'].includes(status);
    if (!statusValido) return false;
    if (!assinatura.expira_em) return true;
    const expira = new Date(assinatura.expira_em).getTime();
    return Number.isFinite(expira) && expira > Date.now();
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

  function preencherPacotes(){
    const select = $('pacote-creditos');
    if (!select) return;
    const lista = Object.values(produtos()).filter(item => item?.tipo === 'creditos');
    if (!lista.length) return;
    const atual = select.value || 'creditos_50';
    select.innerHTML = lista.map(item => `<option value="${escapar(item.codigo)}">${escapar(item.creditos)} créditos — ${escapar(moeda(item.valor))}</option>`).join('');
    select.value = lista.some(item => item.codigo === atual) ? atual : (lista.find(item => item.codigo === 'creditos_50')?.codigo || lista[0].codigo);
  }

  function atualizarResumoCarteira(){
    const codigo = $('pacote-creditos')?.value || 'creditos_50';
    const pacote = produtos()[codigo];
    if (!pacote) return;
    if ($('resumo-pacote')) $('resumo-pacote').textContent = pacote.label;
    if ($('valor-pacote-creditos')) $('valor-pacote-creditos').textContent = moeda(pacote.valor);
    if ($('resumo-promocao')) $('resumo-promocao').textContent = codigo === 'creditos_400' ? 'Preço promocional exclusivo deste pacote' : 'Sem desconto aplicado';
  }

  async function carregarCarteiraEfex(forcar = false){
    const session = await sessao();
    if (!session) {
      mostrarConteudo(false);
      irParaLogin();
      return;
    }

    mostrarConteudo(true);
    mostrarErroCarteira('');
    if ($('saldo-efex')) $('saldo-efex').textContent = forcar ? '...' : '—';

    try {
      const [saldoResp, perfilResp, assinaturaResp] = await Promise.all([
        _supabase.rpc('fs_meu_saldo_efex'),
        _supabase.from('perfis').select('plano,plano_status,plano_expira_em').eq('id', session.user.id).maybeSingle(),
        _supabase.from('assinaturas')
          .select('plano,nivel,status,expira_em')
          .eq('usuario_id', session.user.id)
          .order('expira_em', { ascending:false, nullsFirst:false })
          .limit(1)
          .maybeSingle()
      ]);

      if (saldoResp.error) throw saldoResp.error;
      if (perfilResp.error) console.warn('Erro ao carregar perfil da carteira:', perfilResp.error);
      if (assinaturaResp.error) console.warn('Erro ao carregar assinatura da carteira:', assinaturaResp.error);

      const saldoBruto = saldoResp.data;
      const saldo = Number(saldoBruto?.saldo ?? saldoBruto ?? 0) || 0;
      if ($('saldo-efex')) $('saldo-efex').textContent = String(saldo);

      const perfil = perfilResp.data || {};
      const assinatura = assinaturaResp.data || {};
      const ativa = assinaturaAtiva(assinatura);
      const plano = ativa ? (assinatura.plano || 'premium') : (perfil.plano || 'gratis');
      const nivel = ativa ? (assinatura.nivel || 'essencial') : (String(plano).toLowerCase() === 'premium' ? 'essencial' : 'gratis');
      const expira = ativa ? assinatura.expira_em : (perfil.plano_expira_em || null);

      if ($('carteira-plano')) $('carteira-plano').textContent = nivelLabel(nivel, plano);
      if ($('carteira-creditos-mensais')) $('carteira-creditos-mensais').textContent = creditosMensais(nivel, plano);
      if ($('carteira-renovacao')) $('carteira-renovacao').textContent = expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Sem data definida';
    } catch (erro) {
      console.error('Erro ao carregar carteira:', erro);
      if ($('saldo-efex')) $('saldo-efex').textContent = '—';
      if ($('carteira-plano')) $('carteira-plano').textContent = 'Não foi possível carregar';
      mostrarErroCarteira('Não foi possível carregar sua carteira agora. Verifique sua conexão e tente novamente.');
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
      const rpc = await _supabase.rpc('fs_extrato_efex', { limite:50 });
      if (rpc.error) throw rpc.error;
      renderizarExtrato(Array.isArray(rpc.data) ? rpc.data : []);
    } catch (erro) {
      console.warn('Extrato Efex indisponível:', erro);
      if (status) {
        status.textContent = 'O saldo está ativo, mas o extrato detalhado não pôde ser carregado agora.';
        status.classList.remove('hidden');
      }
    }
  }

  async function atualizarCarteiraCompleta(){
    await Promise.all([carregarCarteiraEfex(true), carregarExtratoEfex(true)]);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    preencherPacotes();
    atualizarResumoCarteira();
    await atualizarCarteiraCompleta();
    carregamentoInicialConcluido = true;
  });

  _supabase?.auth?.onAuthStateChange?.((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      mostrarConteudo(false);
      if (carregamentoInicialConcluido) irParaLogin();
      return;
    }
    if (carregamentoInicialConcluido && event === 'SIGNED_IN') atualizarCarteiraCompleta();
  });

  Object.assign(window, { carregarCarteiraEfex, carregarExtratoEfex, atualizarResumoCarteira, atualizarCarteiraCompleta });
})();