(function(){
  'use strict';

  const BASE = window.FS_SUPABASE_FUNCTIONS_URL || 'https://kvjvhoziqcevkzyszdke.supabase.co/functions/v1';
  const PRODUTOS = {
    assinatura_essencial:{codigo:'assinatura_essencial',tipo:'assinatura',label:'Premium Essencial - 1 mês',valor:14.90,plano:'premium',nivel:'essencial',dias:30,creditos:15},
    assinatura_pro:{codigo:'assinatura_pro',tipo:'assinatura',label:'Premium Pro - 1 mês',valor:29.90,plano:'premium',nivel:'pro',dias:30,creditos:30},
    creditos_20:{codigo:'creditos_20',tipo:'creditos',label:'20 créditos Efex',valor:9.90,creditos:20,dias:0,plano:'gratis'},
    creditos_50:{codigo:'creditos_50',tipo:'creditos',label:'50 créditos Efex',valor:24.90,creditos:50,dias:0,plano:'gratis'},
    creditos_100:{codigo:'creditos_100',tipo:'creditos',label:'100 créditos Efex',valor:49.90,creditos:100,dias:0,plano:'gratis'},
    creditos_200:{codigo:'creditos_200',tipo:'creditos',label:'200 créditos Efex',valor:99.90,creditos:200,dias:0,plano:'gratis'},
    creditos_400:{codigo:'creditos_400',tipo:'creditos',label:'400 créditos Efex',valor:189.90,creditos:400,dias:0,plano:'gratis'}
  };

  let pagamentoId = null;
  let produtoAtual = null;
  let botaoOrigem = null;
  let verificacaoAutomatica = null;
  let verificacoesRealizadas = 0;

  const $ = id => document.getElementById(id);
  const moeda = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  function avisar(mensagem, tipo = 'info'){
    if (typeof window.mostrarToastNotificacao === 'function') {
      window.mostrarToastNotificacao({ titulo:'FS Orçamentos', mensagem, tipo });
      return;
    }
    if (tipo === 'erro') console.error(mensagem);
    else console.info(mensagem);
  }

  async function sessao(){
    try {
      const { data } = await _supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  }

  function destinoLogin(){
    const naCarteira = /\/carteira(?:\.html)?$/i.test(location.pathname);
    return naCarteira ? '/carteira.html#comprar-creditos' : '/planos.html' + (location.hash || '');
  }

  function definirModalAberto(aberto){
    const modal = $('modal-pix-basico');
    if (!modal) return false;

    modal.classList.toggle('is-open', aberto);
    modal.classList.toggle('hidden', !aberto);
    modal.toggleAttribute('hidden', !aberto);
    modal.setAttribute('aria-hidden', aberto ? 'false' : 'true');
    modal.style.removeProperty('display');
    document.body.classList.toggle('modal-aberto', aberto);

    return true;
  }

  function abrir(){
    const modal = $('modal-pix-basico');
    if (!modal) return false;
    botaoOrigem = document.activeElement;
    definirModalAberto(true);
    setTimeout(() => modal.querySelector('.modal-pix-topo button')?.focus(), 0);
    return true;
  }

  function pararVerificacaoAutomatica(){
    if (verificacaoAutomatica) clearInterval(verificacaoAutomatica);
    verificacaoAutomatica = null;
    verificacoesRealizadas = 0;
  }

  function fechar(){
    definirModalAberto(false);
    pararVerificacaoAutomatica();
    botaoOrigem?.focus?.();
  }

  function login(){
    const destino = destinoLogin();
    try { localStorage.setItem('fs_destino_apos_login', destino); } catch {}
    if (typeof fsIrParaLoginComDestino === 'function') fsIrParaLoginComDestino(destino);
    else if (typeof abrirModalLogin === 'function') abrirModalLogin();
    else location.href = '/index.html?login=1&dest=' + encodeURIComponent(destino);
  }

  function loading(produto){
    produtoAtual = produto;
    pagamentoId = null;
    pararVerificacaoAutomatica();
    $('pix-loading')?.classList.remove('hidden');
    if ($('pix-loading')) $('pix-loading').textContent = 'Gerando Pix seguro...';
    $('pix-erro')?.classList.add('hidden');
    $('pix-conteudo')?.classList.add('hidden');
    if ($('pix-modal-subtitulo')) $('pix-modal-subtitulo').textContent = produto.label;
    if ($('pix-plano-label')) $('pix-plano-label').textContent = produto.label;
    if ($('pix-valor')) $('pix-valor').textContent = moeda(produto.valor);
    if ($('pix-copia-cola')) $('pix-copia-cola').value = '';
    $('pix-qrcode-img')?.classList.add('hidden');
    $('pix-qrcode-img')?.removeAttribute('src');
    if ($('pix-status')) $('pix-status').textContent = 'Aguardando geração do pagamento';
    abrir();
  }

  function erro(mensagem){
    $('pix-loading')?.classList.add('hidden');
    $('pix-conteudo')?.classList.add('hidden');
    if ($('pix-erro')) {
      $('pix-erro').textContent = mensagem || 'Não foi possível gerar o Pix.';
      $('pix-erro').classList.remove('hidden');
    }
    pararVerificacaoAutomatica();
  }

  function iniciarVerificacaoAutomatica(){
    pararVerificacaoAutomatica();
    verificacaoAutomatica = setInterval(async () => {
      verificacoesRealizadas += 1;
      if (verificacoesRealizadas > 30) return pararVerificacaoAutomatica();
      await verificar(true);
    }, 10000);
  }

  function mostrar(dados){
    pagamentoId = dados.pagamento_id || dados.id;
    $('pix-loading')?.classList.add('hidden');
    $('pix-erro')?.classList.add('hidden');
    $('pix-conteudo')?.classList.remove('hidden');
    if ($('pix-modal-subtitulo')) $('pix-modal-subtitulo').textContent = dados.label || produtoAtual.label;
    if ($('pix-plano-label')) $('pix-plano-label').textContent = dados.label || produtoAtual.label;
    if ($('pix-valor')) $('pix-valor').textContent = moeda(dados.valor ?? produtoAtual.valor);
    if ($('pix-copia-cola')) $('pix-copia-cola').value = dados.pix_copia_cola || '';
    if ($('pix-status')) $('pix-status').textContent = 'Aguardando pagamento';
    const qr = dados.qr_code || '';
    if (qr && $('pix-qrcode-img')) {
      $('pix-qrcode-img').src = qr.startsWith('data:') || qr.startsWith('http') ? qr : 'data:image/png;base64,' + qr;
      $('pix-qrcode-img').classList.remove('hidden');
    }
    iniciarVerificacaoAutomatica();
  }

  async function gerar(codigo){
    const produto = PRODUTOS[codigo];
    if (!produto) return avisar('Produto inválido.', 'erro');
    const session = await sessao();
    if (!session) return login();
    loading(produto);
    try {
      const resposta = await fetch(BASE + '/criar-pix-basico', {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer ' + session.access_token},
        body:JSON.stringify({produto_codigo:produto.codigo})
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) return erro(dados.erro || dados.error || 'Falha ao gerar Pix.');
      mostrar(dados);
    } catch (e) {
      console.error(e);
      erro('Erro inesperado ao gerar Pix. Verifique sua conexão.');
    }
  }

  async function verificar(silencioso = false){
    if (!pagamentoId) {
      if (!silencioso) avisar('Gere um Pix primeiro.', 'erro');
      return;
    }
    const session = await sessao();
    if (!session) return login();
    if ($('pix-status') && !silencioso) $('pix-status').textContent = 'Verificando pagamento...';
    try {
      const resposta = await fetch(BASE + '/verificar-pix-basico', {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer ' + session.access_token},
        body:JSON.stringify({pagamento_id:pagamentoId})
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        if (!silencioso) avisar(dados.erro || 'Pagamento ainda não confirmado.', 'erro');
        if ($('pix-status')) $('pix-status').textContent = 'Aguardando pagamento';
        return;
      }
      if (dados.status === 'pago' || dados.aplicado) {
        pararVerificacaoAutomatica();
        if ($('pix-status')) $('pix-status').textContent = 'Pagamento confirmado e créditos aplicados';
        avisar(dados.mensagem || 'Pagamento confirmado. Créditos adicionados.', 'sucesso');
        if (typeof window.atualizarCarteiraCompleta === 'function') await window.atualizarCarteiraCompleta();
        setTimeout(fechar, 1200);
        return;
      }
      if ($('pix-status')) $('pix-status').textContent = dados.mensagem || 'Aguardando pagamento';
      if (!silencioso) avisar(dados.mensagem || 'Pagamento ainda não confirmado.');
    } catch (e) {
      console.error(e);
      if (!silencioso) avisar('Não foi possível verificar agora.', 'erro');
      if ($('pix-status')) $('pix-status').textContent = 'Falha temporária na verificação';
    }
  }

  async function copiar(){
    const campo = $('pix-copia-cola');
    if (!campo?.value) return;
    try {
      await navigator.clipboard.writeText(campo.value);
      avisar('Pix copia e cola copiado.', 'sucesso');
    } catch {
      campo.select();
      document.execCommand('copy');
      avisar('Pix copia e cola copiado.', 'sucesso');
    }
  }

  function atualizarPacote(){
    const codigo = $('pacote-creditos')?.value || 'creditos_50';
    const produto = PRODUTOS[codigo];
    if (!produto) return;
    if ($('valor-pacote-creditos')) $('valor-pacote-creditos').textContent = moeda(produto.valor);
  }

  function comprar(){
    gerar($('pacote-creditos')?.value || 'creditos_50');
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('modal-pix-basico')?.classList.contains('is-open')) fechar();
  });

  document.addEventListener('click', event => {
    const modal = $('modal-pix-basico');
    if (modal?.classList.contains('is-open') && event.target === modal) fechar();
  });

  function inicializar(){
    definirModalAberto(false);
    atualizarPacote();
  }

  Object.assign(window, {
    gerarPixProduto:gerar,
    comprarPacoteSelecionado:comprar,
    atualizarPacoteCreditos:atualizarPacote,
    fecharModalPixBasico:fechar,
    verificarPagamentoPixAtual:() => verificar(false),
    copiarPixCopiaCola:copiar,
    FS_PRODUTOS_COMERCIAIS:PRODUTOS
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();
})();