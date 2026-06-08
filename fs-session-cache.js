/* =========================================================
   FS ORÇAMENTOS - fs-session-cache.js
   Evita piscar como Convidado enquanto o Supabase restaura a sessão.
   Usa cache local imediatamente e confirma a sessão em segundo plano.
   ========================================================= */
(function () {
  'use strict';

  const CHAVES_USUARIO = [
    'id',
    'usuario_email',
    'usuario_nome',
    'usuario_plano',
    'usuario_plano_status',
    'usuario_plano_expira_em',
    'nome_empresa',
    'telefone_empresa',
    'endereco_empresa',
    'cnpj_empresa',
    'foto_url'
  ];

  let verificacaoFinalizada = false;
  let patchStorageInstalado = false;
  let patchSignOutInstalado = false;
  let estiloInicialInstalado = false;
  let iniciado = false;

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function cacheTemUsuario() {
    const marcado = localStorage.getItem('fs_usuario_logado') === 'true';
    const temIdentidade = !!(localStorage.getItem('id') || localStorage.getItem('usuario_email'));
    const temPlano = !!localStorage.getItem('usuario_plano');
    return marcado || (temIdentidade && temPlano);
  }

  function planoCache() {
    return normalizar(localStorage.getItem('usuario_plano') || 'gratis');
  }

  function cachePremium() {
    return cacheTemUsuario() && planoCache() === 'premium';
  }

  function nomeCache() {
    return (
      localStorage.getItem('usuario_nome') ||
      localStorage.getItem('nome_empresa') ||
      localStorage.getItem('usuario_email')?.split('@')[0] ||
      'Usuário'
    );
  }

  function aplicarClasseRaizCache() {
    const root = document.documentElement;
    if (!root) return;

    root.classList.toggle('fs-cache-logado', cacheTemUsuario());
    root.classList.toggle('fs-cache-premium', cachePremium());
    root.classList.toggle('fs-cache-basico', cacheTemUsuario() && planoCache() === 'basico');
    root.classList.toggle('fs-cache-gratis', !cacheTemUsuario() || planoCache() === 'gratis');
  }

  function injetarEstiloInicial() {
    if (estiloInicialInstalado) return;
    estiloInicialInstalado = true;

    const css = `
      html.fs-cache-premium .teste-premium-card,
      html.fs-cache-premium .teste-premium-topo,
      html.fs-cache-premium .btn-teste-premium,
      html.fs-cache-premium .teste-gratis-premium,
      html.fs-cache-premium .fs-teste-premium,
      html.fs-cache-premium [data-teste-premium],
      html.fs-cache-premium [data-premium-trial],
      html.fs-cache-premium #teste-premium-topo,
      html.fs-cache-premium #bloco-teste-premium,
      html.fs-cache-premium #card-teste-premium,
      html.fs-cache-premium #teste-gratis-premium,
      html.fs-cache-premium #box-teste-gratis-premium {
        display: none !important;
        visibility: hidden !important;
      }

      html.fs-cache-premium #home-plano-gratis,
      html.fs-cache-premium #home-plano-basico {
        display: none !important;
      }

      html.fs-cache-premium #home-plano-premium {
        display: block;
      }
    `;

    const style = document.createElement('style');
    style.id = 'fs-session-cache-style';
    style.textContent = css;

    const alvo = document.head || document.documentElement;
    alvo.appendChild(style);
  }

  function inicializarVisualAntesDoDOM() {
    aplicarClasseRaizCache();
    injetarEstiloInicial();
  }

  function marcarCacheLogado() {
    if (!localStorage.getItem('id') && !localStorage.getItem('usuario_email')) return;
    localStorage.setItem('fs_usuario_logado', 'true');
    localStorage.setItem('fs_usuario_cache_atualizado_em', new Date().toISOString());
    aplicarClasseRaizCache();
  }

  function permitirLimpezaAgora() {
    return window.fsSessaoPermitindoLimpeza === true || localStorage.getItem('fs_logout_em_andamento') === '1' || verificacaoFinalizada === true;
  }

  function instalarPatchStorage() {
    if (patchStorageInstalado) return;
    patchStorageInstalado = true;

    const originalRemove = Storage.prototype.removeItem;
    const originalSet = Storage.prototype.setItem;

    Storage.prototype.removeItem = function removeItemFSCache(key) {
      try {
        if (this === localStorage && CHAVES_USUARIO.includes(String(key)) && cacheTemUsuario() && !permitirLimpezaAgora()) {
          return;
        }
      } catch (_) {}
      const retorno = originalRemove.call(this, key);
      try { aplicarClasseRaizCache(); } catch (_) {}
      return retorno;
    };

    Storage.prototype.setItem = function setItemFSCache(key, value) {
      const retorno = originalSet.call(this, key, value);
      try {
        if (this === localStorage && CHAVES_USUARIO.includes(String(key))) {
          setTimeout(marcarCacheLogado, 0);
        }
        aplicarClasseRaizCache();
      } catch (_) {}
      return retorno;
    };
  }

  function limparCacheUsuarioConfirmado() {
    window.fsSessaoPermitindoLimpeza = true;
    verificacaoFinalizada = true;

    CHAVES_USUARIO.forEach(chave => localStorage.removeItem(chave));
    localStorage.removeItem('fs_usuario_logado');
    localStorage.removeItem('fs_usuario_cache_atualizado_em');
    localStorage.removeItem('fs_logout_em_andamento');

    window.fsSessaoPermitindoLimpeza = false;
    aplicarClasseRaizCache();
  }

  function aplicarHeaderCache() {
    if (!cacheTemUsuario()) return;

    const saudacao = document.getElementById('usuario-saudacao');
    const btnEntrarDesktop = document.getElementById('btn-header-entrar');
    const btnSairDesktop = document.getElementById('btn-header-sair');
    const btnEntrarMobile = document.getElementById('btn-menu-mobile-entrar');
    const btnSairMobile = document.getElementById('btn-menu-mobile-sair');
    const btnNotificacoes = document.getElementById('btn-notificacoes');

    if (saudacao) saudacao.innerText = `Olá, ${nomeCache()}`;
    if (btnEntrarDesktop) btnEntrarDesktop.style.display = 'none';
    if (btnSairDesktop) btnSairDesktop.style.display = 'inline-block';
    if (btnEntrarMobile) btnEntrarMobile.style.display = 'none';
    if (btnSairMobile) btnSairMobile.style.display = 'block';
    if (btnNotificacoes) btnNotificacoes.style.display = 'inline-flex';

    const nivel = planoCache() === 'premium' ? 2 : planoCache() === 'basico' ? 1 : 0;
    document.querySelectorAll('[data-plano-min]').forEach(link => {
      const min = normalizar(link.getAttribute('data-plano-min') || 'gratis');
      const minNivel = min === 'premium' ? 2 : min === 'basico' ? 1 : 0;
      const permitido = nivel >= minNivel;
      const li = link.closest('li');
      if (li) li.style.display = permitido ? '' : 'none';
      else link.style.display = permitido ? '' : 'none';
    });
  }

  function ocultarTestePremiumSeCachePremium() {
    if (!cachePremium()) return;

    const seletores = [
      '[data-teste-premium]',
      '[data-premium-trial]',
      '.teste-premium-card',
      '.teste-premium-topo',
      '.btn-teste-premium',
      '.teste-gratis-premium',
      '.fs-teste-premium',
      '#teste-premium-topo',
      '#bloco-teste-premium',
      '#card-teste-premium',
      '#teste-gratis-premium',
      '#box-teste-gratis-premium'
    ];

    seletores.forEach(seletor => {
      document.querySelectorAll(seletor).forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.setAttribute('aria-hidden', 'true');
      });
    });

    document.querySelectorAll('a, button').forEach(el => {
      const texto = (el.textContent || '').toLowerCase();
      if (texto.includes('teste premium') || texto.includes('testar premium') || texto.includes('teste grátis premium') || texto.includes('teste gratis premium')) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function aplicarHomeCache() {
    if (!cacheTemUsuario()) return;
    const plano = planoCache();

    document.querySelectorAll('.home-visao-plano').forEach(secao => {
      secao.classList.remove('ativo');
      secao.style.display = 'none';
    });

    const id = plano === 'premium'
      ? 'home-plano-premium'
      : plano === 'basico'
        ? 'home-plano-basico'
        : 'home-plano-gratis';

    const secao = document.getElementById(id);
    if (secao) {
      secao.classList.add('ativo');
      secao.style.display = 'block';
    }

    ocultarTestePremiumSeCachePremium();
  }

  function aplicarCacheVisual() {
    aplicarClasseRaizCache();
    aplicarHeaderCache();
    aplicarHomeCache();
  }

  async function aguardarSupabase(tentativas = 35) {
    for (let i = 0; i < tentativas; i++) {
      if (window._supabase) return true;
      if (typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
        if (window._supabase) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  function instalarPatchSignOut() {
    if (patchSignOutInstalado || !window._supabase?.auth?.signOut) return;
    patchSignOutInstalado = true;

    const originalSignOut = window._supabase.auth.signOut.bind(window._supabase.auth);
    window._supabase.auth.signOut = async function signOutFSCache(...args) {
      window.fsSessaoPermitindoLimpeza = true;
      localStorage.setItem('fs_logout_em_andamento', '1');
      aplicarClasseRaizCache();
      return originalSignOut(...args);
    };
  }

  async function salvarPerfilCache(session) {
    if (!session?.user?.id || !window._supabase) return;

    try {
      localStorage.setItem('id', session.user.id);
      localStorage.setItem('usuario_email', session.user.email || '');

      const { data: perfil, error } = await window._supabase
        .from('perfis')
        .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status, plano_expira_em')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && perfil) {
        const nome = perfil.nome || perfil.nome_empresa || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
        localStorage.setItem('usuario_nome', nome);
        localStorage.setItem('usuario_plano', perfil.plano || 'gratis');
        if (perfil.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
        else localStorage.removeItem('usuario_plano_status');
        if (perfil.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
        else localStorage.removeItem('usuario_plano_expira_em');
        if (perfil.nome_empresa) localStorage.setItem('nome_empresa', perfil.nome_empresa);
        if (perfil.telefone_empresa) localStorage.setItem('telefone_empresa', perfil.telefone_empresa);
        if (perfil.endereco_empresa) localStorage.setItem('endereco_empresa', perfil.endereco_empresa);
        if (perfil.cnpj_empresa) localStorage.setItem('cnpj_empresa', perfil.cnpj_empresa);
        if (perfil.foto_url) localStorage.setItem('foto_url', perfil.foto_url);
      }

      marcarCacheLogado();
      verificacaoFinalizada = false;
      aplicarCacheVisual();

      if (typeof window.carregarMenu === 'function') window.carregarMenu(session);
      if (typeof window.fsAtualizarDashboardPremiumIndex === 'function') window.fsAtualizarDashboardPremiumIndex();
    } catch (error) {
      console.warn('Não foi possível atualizar cache de sessão:', error);
    }
  }

  async function confirmarSessaoEmSegundoPlano() {
    const ok = await aguardarSupabase();
    if (!ok) return;

    instalarPatchSignOut();

    try {
      const { data, error } = await window._supabase.auth.getSession();
      if (error) console.warn('Cache sessão: erro ao confirmar sessão:', error);

      const session = data?.session || null;
      if (session?.user?.id) {
        await salvarPerfilCache(session);
        return;
      }

      limparCacheUsuarioConfirmado();
      if (typeof window.carregarMenu === 'function') window.carregarMenu(null);
    } catch (error) {
      console.warn('Cache sessão: falha ao confirmar sessão:', error);
    }
  }

  function iniciar() {
    if (iniciado) return;
    iniciado = true;

    instalarPatchStorage();
    if (cacheTemUsuario()) marcarCacheLogado();

    aplicarCacheVisual();
    setTimeout(aplicarCacheVisual, 20);
    setTimeout(aplicarCacheVisual, 80);
    setTimeout(aplicarCacheVisual, 180);
    setTimeout(aplicarCacheVisual, 350);
    setTimeout(aplicarCacheVisual, 700);
    setTimeout(aplicarCacheVisual, 1500);

    confirmarSessaoEmSegundoPlano();
    setTimeout(confirmarSessaoEmSegundoPlano, 1200);
  }

  window.fsCacheSessaoTemUsuario = cacheTemUsuario;
  window.fsAplicarCacheSessaoVisual = aplicarCacheVisual;
  window.fsConfirmarSessaoEmSegundoPlano = confirmarSessaoEmSegundoPlano;

  inicializarVisualAntesDoDOM();
  iniciar();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      iniciado = false;
      iniciar();
    });
  }
})();
