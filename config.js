/* =========================================================
   FS ORÇAMENTOS - config.js
   Configuração pública do frontend

   IMPORTANTE:
   - Aqui deve ficar SOMENTE a anon public key do Supabase.
   - Nunca coloque service_role key no frontend.
   - Service role deve ficar apenas em Supabase Secrets / Edge Functions.
   ========================================================= */

const SUPABASE_URL = 'https://kvjvhoziqcevkzyszdke.supabase.co';

/*
  Cole abaixo a sua chave ANON PUBLIC do Supabase.

  Onde pegar:
  Supabase Dashboard > Project Settings > API > Project API keys > anon public

  A chave correta normalmente contém no payload JWT:
  "role": "anon"

  NÃO use chave com:
  "role": "service_role"
*/
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2anZob3ppcWNldmt6eXN6ZGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODc4MTksImV4cCI6MjA5MDM2MzgxOX0.ptXSP5LeasQgLuIicmTrtw_on5MfijUk26hllMsegfI';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

function fsConfigDecodificarPayloadJwt(token) {
  try {
    const partes = String(token || '').split('.');
    if (partes.length < 2) return null;

    const base64 = partes[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(json);
  } catch (erro) {
    return null;
  }
}

function fsConfigValidarChaveSupabase() {
  const chave = String(SUPABASE_ANON_KEY || '').trim();

  if (!chave || chave.includes('COLE_AQUI')) {
    console.warn('SUPABASE_ANON_KEY não configurada. Cole a anon public key em config.js.');
    return false;
  }

  const payload = fsConfigDecodificarPayloadJwt(chave);

  if (payload?.role === 'service_role') {
    console.error('ERRO DE SEGURANÇA: config.js está usando service_role. Troque imediatamente pela anon public key e rotacione a service_role no Supabase.');
    return false;
  }

  if (payload?.role && payload.role !== 'anon') {
    console.warn(`A chave Supabase informada tem role "${payload.role}". No frontend, o recomendado é role "anon".`);
  }

  return true;
}

function inicializarSupabaseFS() {
  if (window._supabase) return window._supabase;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Biblioteca Supabase ainda não carregada. Verifique se o script @supabase/supabase-js vem antes do config.js.');
    return null;
  }

  if (!fsConfigValidarChaveSupabase()) return null;

  window._supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  return window._supabase;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarSupabaseFS);
} else {
  inicializarSupabaseFS();
}

window.inicializarSupabaseFS = inicializarSupabaseFS;
window.fsConfigValidarChaveSupabase = fsConfigValidarChaveSupabase;

/* =========================
   CARREGAMENTO DE AJUSTES POR PÁGINA
========================= */

const FS_CONFIG_SCRIPTS_GLOBAIS = [
  ['fs-no-zoom.js', 'fs-no-zoom-js'],
  ['fs-session-cache.js', 'fs-session-cache-js'],
  ['fs-menu-close-outside.js', 'fs-menu-close-outside-js'],
  ['fs-format-br.js', 'fs-format-br-js'],
  ['fs-footer-legal.js', 'fs-footer-legal-js'],
  ['layout-grid-global-fix.js', 'fs-layout-grid-global-fix-js']
];

const FS_CONFIG_SCRIPTS_FINAIS = [
  ['fs-stable-visual-fix.js', 'fs-stable-visual-fix-js']
];

const FS_CONFIG_CSS_POR_PAGINA = [
  {
    paginas: ['/gerador', '/gerador.html'],
    estilos: [
      ['gerador.css', 'fs-gerador-css']
    ]
  },
  {
    paginas: ['/orcamentos', '/orcamentos.html'],
    estilos: [
      ['orcamentos.css', 'fs-orcamentos-css']
    ]
  }
];

const FS_CONFIG_SCRIPTS_POR_PAGINA = [
  {
    paginas: ['/', '/index', '/index.html'],
    scripts: [
      ['index-visitante-lite.js', 'fs-index-visitante-lite-js'],
      ['index-ads-restore.js', 'fs-index-ads-restore-js'],
      ['index-cache-sync.js', 'fs-index-cache-sync-js'],
      ['index-empresa-card.js', 'fs-index-empresa-card-js'],
      ['dashboard-premium-index.js', 'fs-dashboard-premium-index-js']
    ]
  },
  {
    paginas: ['/ver', '/ver.html'],
    scripts: [
      ['ver-cliente-fix.js', 'fs-ver-cliente-fix-js']
    ]
  },
  {
    paginas: ['/gerador', '/gerador.html'],
    scripts: [
      ['gerador-pdf-fix.js', 'fs-gerador-pdf-fix-js'],
      ['gerador-cleanup-fix.js', 'fs-gerador-cleanup-fix-js']
    ]
  },
  {
    paginas: ['/agenda', '/agenda.html', '/ordens', '/ordens.html', '/clientes', '/clientes.html', '/veiculos', '/veiculos.html', '/estoque', '/estoque.html', '/forum', '/forum.html'],
    scripts: [
      ['fs-premium-mobile-layout-fix.js', 'fs-premium-mobile-layout-fix-js']
    ]
  },
  {
    paginas: ['/clientes', '/clientes.html'],
    scripts: [
      ['clientes-toggle-fix.js', 'fs-clientes-toggle-fix-js']
    ]
  },
  {
    paginas: ['/painel', '/painel.html'],
    scripts: [
      ['painel-logo-fix.js', 'fs-painel-logo-fix-js'],
      ['painel-perfil-fix.js', 'fs-painel-perfil-fix-js']
    ]
  },
  {
    paginas: ['/orcamentos', '/orcamentos.html'],
    scripts: [
      ['orcamentos-pdf.js', 'fs-orcamentos-pdf-js']
    ]
  },
  {
    paginas: ['/ordens', '/ordens.html', '/recorrentes', '/recorrentes.html', '/clientes', '/clientes.html'],
    scripts: [
      ['fs-cliente-modal.js', 'fs-cliente-modal-js']
    ]
  },
  {
    paginas: ['/ordem', '/ordem.html'],
    scripts: [
      ['ordem-extras.js', 'fs-ordem-extras-js'],
      ['ordem-pdf-extras.js', 'fs-ordem-pdf-extras-js']
    ]
  }
];

const FS_CONFIG_SCRIPTS_FINAIS_INDEX = [
  ['index-gratis-planos-simplify.js', 'fs-index-gratis-planos-simplify-js']
];

function fsConfigNormalizarPathAtual() {
  const path = (window.location.pathname || '/').toLowerCase().replace(/\/$/, '');
  return path || '/';
}

function fsConfigPathCorresponde(pathAtual, pagina) {
  if (pagina === '/') return pathAtual === '/';
  return pathAtual === pagina || pathAtual.endsWith(pagina);
}

function fsConfigEhIndex(pathAtual) {
  return ['/', '/index', '/index.html'].some((pagina) => fsConfigPathCorresponde(pathAtual, pagina));
}

function fsConfigCarregarScriptUnico(src, id) {
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = false;
  script.onerror = () => console.warn(`Não foi possível carregar ${src}.`);
  document.head.appendChild(script);
}

function fsConfigCarregarCssUnico(href, id) {
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  link.onerror = () => console.warn(`Não foi possível carregar ${href}.`);
  document.head.appendChild(link);
}

function fsConfigCarregarListaScripts(scripts) {
  scripts.forEach(([arquivo, id]) => {
    fsConfigCarregarScriptUnico(`/${arquivo}`, id);
  });
}

function fsConfigCarregarListaCss(estilos) {
  estilos.forEach(([arquivo, id]) => {
    fsConfigCarregarCssUnico(`/${arquivo}`, id);
  });
}

function fsConfigCarregarCssDaPagina(pathAtual) {
  FS_CONFIG_CSS_POR_PAGINA.forEach((grupo) => {
    const deveCarregar = grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina));
    if (deveCarregar) fsConfigCarregarListaCss(grupo.estilos);
  });
}

function fsConfigCarregarScriptsDaPagina(pathAtual) {
  FS_CONFIG_SCRIPTS_POR_PAGINA.forEach((grupo) => {
    const deveCarregar = grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina));
    if (deveCarregar) fsConfigCarregarListaScripts(grupo.scripts);
  });
}

function fsConfigCarregarAjustesPagina() {
  const pathAtual = fsConfigNormalizarPathAtual();

  fsConfigCarregarCssDaPagina(pathAtual);
  fsConfigCarregarListaScripts(FS_CONFIG_SCRIPTS_GLOBAIS);
  fsConfigCarregarScriptsDaPagina(pathAtual);

  // Camada final única: regras de comportamento visual consolidado.
  fsConfigCarregarListaScripts(FS_CONFIG_SCRIPTS_FINAIS);

  if (fsConfigEhIndex(pathAtual)) {
    fsConfigCarregarListaScripts(FS_CONFIG_SCRIPTS_FINAIS_INDEX);
  }
}

fsConfigCarregarAjustesPagina();

(function fsConfigAjusteOrdens() {
  const pathAtual = fsConfigNormalizarPathAtual();
  const ehOrdens = fsConfigPathCorresponde(pathAtual, '/ordens') || fsConfigPathCorresponde(pathAtual, '/ordens.html');
  if (!ehOrdens) return;

  function cssOrdens() {
    if (document.getElementById('fs-config-ordens-modal-css')) return;
    const style = document.createElement('style');
    style.id = 'fs-config-ordens-modal-css';
    style.textContent = `
      body.fs-ordens-modal-mode .ordens-grid { display:block !important; }
      body.fs-ordens-modal-mode #card-form-ordem { position:fixed !important; inset:0 !important; z-index:62000 !important; display:none !important; width:100% !important; max-width:none !important; height:100vh !important; margin:0 !important; padding:16px !important; background:rgba(20,13,11,.64) !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; overflow-y:auto !important; }
      body.fs-ordens-modal-mode #card-form-ordem.fs-modal-os-aberto { display:block !important; }
      body.fs-ordens-modal-mode #card-form-ordem .ordens-card-header,
      body.fs-ordens-modal-mode #card-form-ordem .ordens-card-body { width:min(760px,100%) !important; margin-left:auto !important; margin-right:auto !important; background:#ffffff !important; }
      body.fs-ordens-modal-mode #card-form-ordem .ordens-card-header { margin-top:18px !important; border-radius:7px 7px 0 0 !important; border:1px solid #ded3c5 !important; border-bottom:0 !important; background:var(--fs-marrom,#2f211d) !important; }
      body.fs-ordens-modal-mode #card-form-ordem .ordens-card-body { border-radius:0 0 7px 7px !important; border:1px solid #ded3c5 !important; border-top:0 !important; max-height:calc(100vh - 130px) !important; overflow-y:auto !important; }
      body.fs-ordens-modal-mode #btn-toggle-form-ordem { display:inline-flex !important; }
      .fs-btn-nova-os-topo { display:inline-flex !important; align-items:center !important; justify-content:center !important; min-height:34px !important; padding:8px 11px !important; border-radius:4px !important; background:var(--fs-marrom,#2f211d) !important; color:var(--fs-amarelo,#ffc400) !important; border:1px solid var(--fs-marrom,#2f211d) !important; font-size:12px !important; font-weight:950 !important; cursor:pointer !important; text-decoration:none !important; }
    `;
    document.head.appendChild(style);
  }

  function abrirModalOS() {
    const card = document.getElementById('card-form-ordem');
    if (!card) return;
    card.classList.add('fs-modal-os-aberto');
    setTimeout(() => document.getElementById('ordem-titulo')?.focus(), 80);
  }

  function fecharModalOS() {
    document.getElementById('card-form-ordem')?.classList.remove('fs-modal-os-aberto');
  }

  function configurarModalOS() {
    const card = document.getElementById('card-form-ordem');
    if (!card || card.dataset.fsModalOs === '1') return;
    card.dataset.fsModalOs = '1';
    document.body.classList.add('fs-ordens-modal-mode');

    const btnToggle = document.getElementById('btn-toggle-form-ordem');
    if (btnToggle) {
      btnToggle.textContent = 'Fechar';
      btnToggle.onclick = fecharModalOS;
    }

    const topo = document.querySelector('.ordens-topo-acoes');
    if (topo && !document.getElementById('fs-btn-nova-os-topo')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'fs-btn-nova-os-topo';
      btn.className = 'fs-btn-nova-os-topo';
      btn.textContent = '+ Nova OS';
      btn.addEventListener('click', () => {
        if (typeof window.limparFormularioOrdem === 'function') window.limparFormularioOrdem();
        abrirModalOS();
      });
      topo.appendChild(btn);
    }

    card.addEventListener('click', (event) => {
      if (event.target === card) fecharModalOS();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') fecharModalOS();
    });

    if (new URLSearchParams(window.location.search).get('orcamento_id')) abrirModalOS();
  }

  function autoCarregarOrdens() {
    if (window.__fsOrdensAutoLoad) return;
    if (typeof window.carregarOrdens !== 'function') return;
    window.__fsOrdensAutoLoad = true;
    window.carregarOrdens(true);
  }

  let tentativas = 0;
  const timer = setInterval(() => {
    cssOrdens();
    configurarModalOS();
    autoCarregarOrdens();
    tentativas += 1;
    if (tentativas > 30) clearInterval(timer);
  }, 300);
})();