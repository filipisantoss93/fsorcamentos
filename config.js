/* =========================================================
   FS ORÇAMENTOS — config.js
   Configuração pública e helpers globais mínimos.

   Importante:
   - Este arquivo deve conter somente chave pública anon/publishable.
   - Nunca colocar service_role key no frontend.
   ========================================================= */

const SUPABASE_URL = 'https://kvjvhoziqcevkzyszdke.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-tw2F85KsudYX92fevBIQQ_VaWLx6Pl';
const FS_URL_OFICIAL = 'https://fsorcamentos.com.br';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.FS_URL_OFICIAL = FS_URL_OFICIAL;

(function fsConfigBase() {
  'use strict';

  function caminhoAtualLimpo() {
    return String(window.location.pathname || '/')
      .toLowerCase()
      .replace(/\/index\.html$/, '/')
      .replace(/\/$/, '') || '/';
  }

  function instalarCssGlobal() {
    const href = '/fs-theme-cinza.css?v=20260705-clean';
    const jaExiste = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(link => String(link.getAttribute('href') || '').includes('fs-theme-cinza.css'));

    if (jaExiste) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function carregarScriptUnico(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  function carregarCorrecaoLoginGoogle() {
    carregarScriptUnico('fs-login-google-fix-js', '/fs-login-google-fix.js?v=20260705-android-deeplink');
  }

  function carregarRascunhosGeradorSupabase() {
    const path = caminhoAtualLimpo();
    const ehGerador = path === '/gerador' || path === '/gerador.html' || path.endsWith('/gerador') || path.endsWith('/gerador.html');
    if (!ehGerador) return;

    carregarScriptUnico(
      'fs-gerador-rascunhos-supabase-js',
      '/gerador-rascunhos-supabase.js?v=20260711-supabase-drafts'
    );
  }

  function normalizarPlanoEfex(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function assinaturaEfexAtiva(assinatura) {
    const estadosAtivos = new Set(['ativo', 'pago', 'teste_gratis']);
    if (!assinatura || normalizarPlanoEfex(assinatura.plano) !== 'premium') return false;
    if (!estadosAtivos.has(normalizarPlanoEfex(assinatura.status))) return false;
    if (!assinatura.expira_em) return true;
    const expira = new Date(assinatura.expira_em).getTime();
    return Number.isFinite(expira) && expira >= Date.now();
  }

  function garantirItemMenuEfex() {
    const menu = document.querySelector('.nav-menu');
    if (!menu) return null;

    let item = document.getElementById('fs-menu-efex');
    if (!item) {
      item = document.createElement('li');
      item.id = 'fs-menu-efex';
      item.style.display = 'none';

      const link = document.createElement('a');
      link.href = '/efex.html';
      link.setAttribute('data-plano-min', 'premium');
      link.setAttribute('aria-label', 'Abrir Efex');

      const icone = document.createElement('span');
      icone.className = 'fs-menu-ico';
      icone.textContent = '✦';

      const texto = document.createElement('span');
      texto.textContent = 'Efex';

      link.append(icone, texto);
      item.appendChild(link);

      const itemGerador = menu.querySelector('a[href="/gerador.html"]')?.closest('li');
      if (itemGerador?.nextSibling) menu.insertBefore(item, itemGerador.nextSibling);
      else menu.appendChild(item);
    }

    return item;
  }

  function configurarMenuEfex() {
    let tentativas = 0;
    let finalizado = false;

    async function atualizar() {
      if (finalizado) return;
      const item = garantirItemMenuEfex();
      if (!item || !window._supabase) {
        tentativas += 1;
        if (tentativas < 100) window.setTimeout(atualizar, 120);
        return;
      }

      item.style.display = 'none';

      try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session?.user?.id) {
          finalizado = true;
          return;
        }

        const { data, error } = await window._supabase
          .from('assinaturas')
          .select('plano,status,expira_em')
          .eq('usuario_id', session.user.id)
          .maybeSingle();

        if (!error && assinaturaEfexAtiva(data)) item.style.display = '';
      } catch (erro) {
        console.warn('Não foi possível configurar o acesso ao Efex no menu:', erro);
      } finally {
        finalizado = true;
      }
    }

    atualizar();

    const observer = new MutationObserver(() => {
      if (finalizado || !document.querySelector('.nav-menu')) return;
      atualizar();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  function configurarPaginaEfex() {
    const path = caminhoAtualLimpo();
    const ehEfex = path === '/efex' || path === '/efex.html' || path.endsWith('/efex') || path.endsWith('/efex.html');
    if (!ehEfex) return;

    if (!document.getElementById('fs-efex-mobile-fix')) {
      const style = document.createElement('style');
      style.id = 'fs-efex-mobile-fix';
      style.textContent = `
        html, body {
          max-width: 100%;
          overflow-x: hidden !important;
        }

        body .efex-page,
        body .efex-layout,
        body .efex-column,
        body .efex-card,
        body .efex-result,
        body .efex-result-block,
        body .efex-hypothesis,
        body .efex-chat-log,
        body .efex-message {
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        body .efex-result-block,
        body .efex-result-block p,
        body .efex-result-block li,
        body .efex-hypothesis,
        body .efex-hypothesis p,
        body .efex-message {
          overflow-wrap: anywhere !important;
          word-break: normal !important;
          white-space: normal !important;
        }

        body .efex-table-wrap {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }

        body .efex-analisar-area {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }

        body #efex-analisar {
          width: 100% !important;
          min-height: 58px !important;
          padding: 14px 18px !important;
          background: #1f2937 !important;
          border: 2px solid #111827 !important;
          color: #ffffff !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          letter-spacing: .01em;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .18) !important;
        }

        body #efex-analisar:not(:disabled):hover,
        body #efex-analisar:not(:disabled):focus-visible {
          background: #111827 !important;
          transform: translateY(-1px);
        }

        body #efex-limpar {
          justify-self: center;
          min-height: 34px !important;
          padding: 6px 10px !important;
          border: 0 !important;
          background: transparent !important;
          color: #64748b !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }

        body .efex-conclusao {
          border-left: 4px solid #334155 !important;
          background: #f8fafc !important;
        }

        body .efex-conclusao h3 {
          font-size: 18px !important;
          color: #1f2937 !important;
        }

        @media (max-width: 980px) {
          body .efex-layout,
          body #efex-app {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            width: 100% !important;
          }

          body .efex-layout > *,
          body .efex-column > *,
          body .efex-card > * {
            min-width: 0 !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 620px) {
          body .efex-page {
            width: calc(100% - 12px) !important;
            margin-inline: auto !important;
          }

          body .efex-grid,
          body .efex-grid.three {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          body .efex-table {
            min-width: 620px !important;
          }

          body .efex-result-block {
            padding: 10px !important;
          }

          body .efex-result-block h3 {
            font-size: 16px !important;
            line-height: 1.25 !important;
          }

          body .efex-result-block p,
          body .efex-result-block li,
          body .efex-hypothesis p {
            font-size: 15px !important;
            line-height: 1.5 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    let tentativas = 0;
    function aplicarEstrutura() {
      const resultado = document.getElementById('efex-result');
      const resumo = document.getElementById('efex-resumo');
      const alertas = document.getElementById('efex-alertas-wrap');
      const testes = document.getElementById('efex-testes-recomendados');
      const hipoteses = document.getElementById('efex-hipoteses');
      const analisar = document.getElementById('efex-analisar');
      const limpar = document.getElementById('efex-limpar');

      if (!resultado || !resumo || !alertas || !testes || !hipoteses || !analisar || !limpar) {
        tentativas += 1;
        if (tentativas < 80) window.setTimeout(aplicarEstrutura, 100);
        return;
      }

      const blocoResumo = resumo.closest('.efex-result-block');
      const blocoTestes = testes.closest('.efex-result-block');
      const blocoHipoteses = hipoteses.closest('.efex-result-block');

      if (blocoResumo) {
        blocoResumo.classList.add('efex-conclusao');
        const titulo = blocoResumo.querySelector('h3');
        if (titulo) titulo.textContent = 'Conclusão técnica';
      }

      if (blocoTestes) {
        const titulo = blocoTestes.querySelector('h3');
        if (titulo) titulo.textContent = 'Recomendações de diagnóstico';
      }

      if (blocoHipoteses) {
        const titulo = blocoHipoteses.querySelector('h3');
        if (titulo) titulo.textContent = 'Hipóteses e causas prováveis';
      }

      const primeiroBloco = resultado.firstElementChild;
      if (blocoResumo && primeiroBloco !== blocoResumo) resultado.insertBefore(blocoResumo, primeiroBloco);
      if (alertas) resultado.insertBefore(alertas, blocoResumo?.nextSibling || resultado.firstChild);
      if (blocoTestes) resultado.insertBefore(blocoTestes, alertas?.nextSibling || blocoResumo?.nextSibling || resultado.firstChild);
      if (blocoHipoteses) resultado.insertBefore(blocoHipoteses, blocoTestes?.nextSibling || alertas?.nextSibling || blocoResumo?.nextSibling || resultado.firstChild);

      const areaAcoes = analisar.closest('.efex-actions');
      if (areaAcoes) areaAcoes.classList.add('efex-analisar-area');

      let resultadoJaVisivel = resultado.classList.contains('ativo');
      const observer = new MutationObserver(() => {
        const visivel = resultado.classList.contains('ativo');
        if (visivel && !resultadoJaVisivel) {
          window.setTimeout(() => {
            window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
            blocoResumo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
        resultadoJaVisivel = visivel;
      });
      observer.observe(resultado, { attributes: true, attributeFilter: ['class'] });
    }

    aplicarEstrutura();
  }

  function limparDestinoAntigoNoIndex() {
    try {
      const path = caminhoAtualLimpo();
      const ehIndex = path === '/' || path === '/index';
      if (!ehIndex) return;

      const params = new URLSearchParams(window.location.search || '');
      const destinoUrl = String(params.get('dest') || '').trim();

      if (!destinoUrl) {
        localStorage.removeItem('fs_destino_apos_login');
        return;
      }

      const destinoPath = destinoUrl
        .split('?')[0]
        .split('#')[0]
        .replace(/\/$/, '')
        .toLowerCase();

      if (!destinoPath || destinoPath === '/' || destinoPath === '/index' || destinoPath === '/index.html') {
        localStorage.removeItem('fs_destino_apos_login');
      }
    } catch (_) {}
  }

  function bloquearZoomMobile() {
    try {
      const conteudoViewport = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';
      let viewport = document.querySelector('meta[name="viewport"]');

      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }

      viewport.setAttribute('content', conteudoViewport);

      if (!document.getElementById('fs-bloqueio-zoom-css')) {
        const style = document.createElement('style');
        style.id = 'fs-bloqueio-zoom-css';
        style.textContent = `
          html, body {
            touch-action: manipulation;
            -ms-touch-action: manipulation;
            overscroll-behavior-x: none;
          }
          input, select, textarea, button {
            font-size: 16px !important;
          }
        `;
        document.head.appendChild(style);
      }

      if (window.__fsZoomBloqueado === true) return;
      window.__fsZoomBloqueado = true;

      let ultimoToque = 0;

      document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
      document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
      document.addEventListener('gestureend', event => event.preventDefault(), { passive: false });

      document.addEventListener('touchstart', event => {
        if (event.touches && event.touches.length > 1) {
          event.preventDefault();
          return;
        }

        const agora = Date.now();
        if (agora - ultimoToque < 320) event.preventDefault();
        ultimoToque = agora;
      }, { passive: false });

      document.addEventListener('touchmove', event => {
        if (event.touches && event.touches.length > 1) event.preventDefault();
      }, { passive: false });

      document.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) event.preventDefault();
      }, { passive: false });

      document.addEventListener('keydown', event => {
        const tecla = String(event.key || '').toLowerCase();
        if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(tecla)) event.preventDefault();
      }, { passive: false });
    } catch (erro) {
      console.warn('Não foi possível aplicar bloqueio de zoom:', erro);
    }
  }

  function inicializar() {
    instalarCssGlobal();
    carregarCorrecaoLoginGoogle();
    carregarRascunhosGeradorSupabase();
    configurarMenuEfex();
    configurarPaginaEfex();
    limparDestinoAntigoNoIndex();
    bloquearZoomMobile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
