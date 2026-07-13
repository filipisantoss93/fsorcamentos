(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const data = valor => {
    if (!valor) return '—';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  };

  function normalizar(valor, padrao = '') {
    return String(valor || padrao).toLowerCase().trim();
  }

  function labelNivel(nivel) {
    const n = normalizar(nivel, 'gratis');
    if (n === 'pro') return 'Premium PRO';
    if (n === 'essencial') return 'Premium Essencial';
    return 'Plano Gratuito';
  }

  function creditosDoNivel(nivel) {
    const n = normalizar(nivel, 'gratis');
    if (n === 'pro') return 30;
    if (n === 'essencial') return 15;
    return 5;
  }

  function nivelDoPerfil(perfil, assinatura) {
    if (assinatura?.nivel) return normalizar(assinatura.nivel);
    if (perfil?.nivel) return normalizar(perfil.nivel);
    return normalizar(perfil?.plano) === 'premium' ? 'essencial' : 'gratis';
  }

  function planoAtivo(plano, status, expiraEm) {
    if (normalizar(plano) !== 'premium') return false;
    if (['cancelado', 'expirado'].includes(normalizar(status))) return false;
    if (!expiraEm) return true;
    const expira = new Date(expiraEm);
    return !Number.isNaN(expira.getTime()) && expira.getTime() >= Date.now();
  }

  function exibirConteudoProtegidoPainel() {
    const conteudo = $('conteudo-protegido');
    const authArea = $('auth-area');
    if (conteudo) {
      conteudo.removeAttribute('hidden');
      conteudo.style.display = 'block';
    }
    if (authArea) authArea.style.display = 'none';
  }

  function sincronizarIndicadorOSExecucao() {
    const origem = $('painel-os-execucao');
    const destino = $('painel-os-execucao-resumo');
    if (!origem || !destino) return;

    const atualizar = () => { destino.textContent = origem.textContent || '0'; };
    atualizar();
    new MutationObserver(atualizar).observe(origem, { childList: true, characterData: true, subtree: true });
  }

  function aplicarEstadoComercial({ perfil, assinatura, saldo }) {
    const plano = assinatura?.plano || perfil?.plano || 'gratis';
    const status = assinatura?.status || perfil?.plano_status || 'ativo';
    const expira = assinatura?.expira_em || perfil?.plano_expira_em || null;
    const nivel = planoAtivo(plano, status, expira) ? nivelDoPerfil(perfil, assinatura) : 'gratis';
    const label = labelNivel(nivel);

    if ($('perfil-plano')) {
      $('perfil-plano').textContent = label;
      $('perfil-plano').className = `plano-badge plano-${nivel}`;
    }
    if ($('perfil-plano-status')) $('perfil-plano-status').textContent = planoAtivo(plano, status, expira) ? 'Ativo' : (nivel === 'gratis' ? 'Gratuito' : 'Inativo');
    if ($('perfil-plano-expira')) $('perfil-plano-expira').textContent = nivel === 'gratis' ? 'Sem expiração' : data(expira);
    if ($('perfil-creditos-mensais')) $('perfil-creditos-mensais').textContent = `${creditosDoNivel(nivel)} créditos/mês`;
    if ($('perfil-saldo-efex')) $('perfil-saldo-efex').textContent = `${Number(saldo || 0)} créditos`;

    const aviso = $('perfil-plano-aviso');
    if (aviso) {
      aviso.className = `painel-plano-aviso ${nivel === 'gratis' ? 'plano-alerta' : 'plano-ok'}`;
      aviso.textContent = nivel === 'gratis'
        ? 'Você está no Plano Gratuito. Assine o Premium Essencial ou o Premium PRO para liberar histórico na nuvem, Caixa, relatórios e aprovação por WhatsApp.'
        : `${label} ativo. Seus créditos mensais são adicionados conforme a vigência da assinatura.`;
    }

    try {
      localStorage.setItem('usuario_plano', nivel === 'gratis' ? 'gratis' : 'premium');
      localStorage.setItem('usuario_nivel_plano', nivel);
      localStorage.setItem('usuario_plano_status', status || 'ativo');
      if (expira) localStorage.setItem('usuario_plano_expira_em', expira);
    } catch (_) {}

    window.FS_ESTADO_COMERCIAL = { plano, nivel, status, expira, saldo: Number(saldo || 0) };
  }

  async function carregar() {
    if (!window._supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
      if ($('status-plano-box')) $('status-plano-box').textContent = 'Não autenticado';
      if ($('saldo-creditos-planos')) $('saldo-creditos-planos').textContent = '—';
      return;
    }

    exibirConteudoProtegidoPainel();
    sincronizarIndicadorOSExecucao();

    const uid = session.user.id;
    let perfil = null;
    let assinatura = null;
    let saldo = 0;

    try {
      const [perfilResp, assinaturaResp, saldoResp] = await Promise.all([
        _supabase.from('perfis').select('plano,plano_status,plano_expira_em').eq('id', uid).maybeSingle(),
        _supabase.from('assinaturas').select('plano,status,expira_em,nivel').eq('usuario_id', uid).maybeSingle(),
        _supabase.rpc('fs_meu_saldo_efex')
      ]);
      perfil = perfilResp.data;
      assinatura = assinaturaResp.data;
      saldo = Number(saldoResp.data?.saldo ?? saldoResp.data ?? 0) || 0;
    } catch (erro) {
      console.warn('Não foi possível carregar o estado comercial:', erro);
    }

    aplicarEstadoComercial({ perfil, assinatura, saldo });

    const nivel = window.FS_ESTADO_COMERCIAL?.nivel || 'gratis';
    if ($('status-plano-box')) $('status-plano-box').textContent = labelNivel(nivel);
    if ($('saldo-creditos-planos')) $('saldo-creditos-planos').textContent = `${saldo} créditos`;
    if ($('renovacao-plano')) $('renovacao-plano').textContent = data(window.FS_ESTADO_COMERCIAL?.expira);
  }

  function iniciarSincronizacao() {
    carregar();
    setTimeout(carregar, 900);
  }

  function carregarScriptPagina(id, src, caminhos) {
    const path = String(location.pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
    if (!caminhos.includes(path)) return;
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    document.body.appendChild(script);
  }

  function carregarGestaoLinksOrcamentos() {
    carregarScriptPagina('fs-orcamentos-links-js','/orcamentos-links.js?v=20260711-links-seguros',['/orcamentos.html','/orcamentos']);
  }

  function carregarModuloMinhaConta() {
    carregarScriptPagina('fs-minha-conta-js','/minha-conta.js?v=20260711-conta-consolidada',['/painel.html','/painel']);
  }

  function carregarLandingDefinitiva() {
    carregarScriptPagina('fs-landing-final-js','/landing-final.js?v=20260711-launch-ready',['/','/index','/index.html']);
  }

  function carregarPersistenciaEfex() {
    carregarScriptPagina('fs-efex-persistencia-js','/assets/js/efex-persistencia.js?v=20260713-1',['/efex.html','/efex']);
  }

  window.fsLabelNivelPlano = labelNivel;
  window.fsCreditosDoNivelPlano = creditosDoNivel;
  window.carregarStatusPlanoPagina = carregar;

  const iniciarModulos = () => {
    iniciarSincronizacao();
    carregarGestaoLinksOrcamentos();
    carregarModuloMinhaConta();
    carregarLandingDefinitiva();
    carregarPersistenciaEfex();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarModulos);
  else iniciarModulos();

  if (window._supabase?.auth) {
    _supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (sessao?.user?.id) setTimeout(carregar, 150);
    });
  }
})();