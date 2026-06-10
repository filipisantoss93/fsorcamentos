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
function fsConfigCarregarScriptUnico(src, id) {
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = false;
  script.onerror = () => console.warn(`Não foi possível carregar ${src}.`);
  document.head.appendChild(script);
}

function fsConfigCarregarAjustesPagina() {
  const path = (window.location.pathname || '/').toLowerCase();

  fsConfigCarregarScriptUnico('/fs-no-zoom.js', 'fs-no-zoom-js');
  fsConfigCarregarScriptUnico('/fs-session-cache.js', 'fs-session-cache-js');
  fsConfigCarregarScriptUnico('/fs-menu-close-outside.js', 'fs-menu-close-outside-js');
  fsConfigCarregarScriptUnico('/fs-format-br.js', 'fs-format-br-js');
  fsConfigCarregarScriptUnico('/fs-footer-legal.js', 'fs-footer-legal-js');
  fsConfigCarregarScriptUnico('/layout-grid-global-fix.js', 'fs-layout-grid-global-fix-js');

  if (path === '/' || path.endsWith('/index') || path.endsWith('/index.html')) {
    fsConfigCarregarScriptUnico('/index-visitante-lite.js', 'fs-index-visitante-lite-js');
    fsConfigCarregarScriptUnico('/index-ads-restore.js', 'fs-index-ads-restore-js');
    fsConfigCarregarScriptUnico('/index-cache-sync.js', 'fs-index-cache-sync-js');
    fsConfigCarregarScriptUnico('/index-empresa-card.js', 'fs-index-empresa-card-js');
    fsConfigCarregarScriptUnico('/dashboard-premium-index.js', 'fs-dashboard-premium-index-js');
    fsConfigCarregarScriptUnico('/index-dashboard-tag-fix.js', 'fs-index-dashboard-tag-fix-js');
  }

  if (path.endsWith('/ver') || path.endsWith('/ver.html')) {
    fsConfigCarregarScriptUnico('/ver-cliente-fix.js', 'fs-ver-cliente-fix-js');
  }

  if (path.endsWith('/gerador') || path.endsWith('/gerador.html')) {
    fsConfigCarregarScriptUnico('/gerador-pdf-fix.js', 'fs-gerador-pdf-fix-js');
    fsConfigCarregarScriptUnico('/gerador-acoes-fix.js', 'fs-gerador-acoes-fix-js');
    fsConfigCarregarScriptUnico('/gerador-cleanup-fix.js', 'fs-gerador-cleanup-fix-js');
  }

  if (
    path.endsWith('/agenda') || path.endsWith('/agenda.html') ||
    path.endsWith('/ordens') || path.endsWith('/ordens.html') ||
    path.endsWith('/clientes') || path.endsWith('/clientes.html')
  ) {
    fsConfigCarregarScriptUnico('/fs-premium-mobile-layout-fix.js', 'fs-premium-mobile-layout-fix-js');
  }

  if (path.endsWith('/agenda') || path.endsWith('/agenda.html')) {
    fsConfigCarregarScriptUnico('/agenda-visual-fix.js', 'fs-agenda-visual-fix-js');
  }

  if (path.endsWith('/clientes') || path.endsWith('/clientes.html')) {
    fsConfigCarregarScriptUnico('/clientes-toggle-fix.js', 'fs-clientes-toggle-fix-js');
  }

  if (path.endsWith('/painel') || path.endsWith('/painel.html')) {
    fsConfigCarregarScriptUnico('/painel-logo-fix.js', 'fs-painel-logo-fix-js');
    fsConfigCarregarScriptUnico('/painel-perfil-fix.js', 'fs-painel-perfil-fix-js');
  }

  if (path.endsWith('/orcamentos') || path.endsWith('/orcamentos.html')) {
    fsConfigCarregarScriptUnico('/orcamentos-pdf.js', 'fs-orcamentos-pdf-js');
    fsConfigCarregarScriptUnico('/orcamentos-resumo-grid-fix.js', 'fs-orcamentos-resumo-grid-fix-js');
  }

  if (
    path.endsWith('/ordens') || path.endsWith('/ordens.html') ||
    path.endsWith('/recorrentes') || path.endsWith('/recorrentes.html') ||
    path.endsWith('/clientes') || path.endsWith('/clientes.html')
  ) {
    fsConfigCarregarScriptUnico('/fs-cliente-modal.js', 'fs-cliente-modal-js');
  }

  if (path.endsWith('/ordem') || path.endsWith('/ordem.html')) {
    fsConfigCarregarScriptUnico('/ordem-extras.js', 'fs-ordem-extras-js');
    fsConfigCarregarScriptUnico('/ordem-pdf-extras.js', 'fs-ordem-pdf-extras-js');
  }

  // Camadas finais: devem entrar por último para corrigir visual sem quebrar funcionalidades.
  fsConfigCarregarScriptUnico('/fs-contrast-final.js', 'fs-contrast-final-js');
  fsConfigCarregarScriptUnico('/fs-header-offset-fix.js', 'fs-header-offset-fix-js');
  fsConfigCarregarScriptUnico('/fs-stable-visual-fix.js', 'fs-stable-visual-fix-js');
}

fsConfigCarregarAjustesPagina();