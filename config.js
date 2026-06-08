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
    console.warn(
      'SUPABASE_ANON_KEY não configurada. Cole a anon public key em config.js.'
    );
    return false;
  }

  const payload = fsConfigDecodificarPayloadJwt(chave);

  if (payload?.role === 'service_role') {
    console.error(
      'ERRO DE SEGURANÇA: config.js está usando service_role. Troque imediatamente pela anon public key e rotacione a service_role no Supabase.'
    );
    return false;
  }

  if (payload?.role && payload.role !== 'anon') {
    console.warn(
      `A chave Supabase informada tem role "${payload.role}". No frontend, o recomendado é role "anon".`
    );
  }

  return true;
}

function inicializarSupabaseFS() {
  if (window._supabase) return window._supabase;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn(
      'Biblioteca Supabase ainda não carregada. Verifique se o script @supabase/supabase-js vem antes do config.js.'
    );
    return null;
  }

  if (!fsConfigValidarChaveSupabase()) {
    return null;
  }

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
   - Dashboard Premium no index
   - PDF profissional em orçamentos
========================= */
function fsConfigCarregarScriptUnico(src, id) {
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.defer = true;
  script.onerror = () => console.warn(`Não foi possível carregar ${src}.`);
  document.head.appendChild(script);
}

function fsConfigCarregarAjustesPagina() {
  const path = (window.location.pathname || '/').toLowerCase();

  if (path === '/' || path.endsWith('/index') || path.endsWith('/index.html')) {
    fsConfigCarregarScriptUnico('/dashboard-premium-index.js', 'fs-dashboard-premium-index-js');
  }

  if (path.endsWith('/orcamentos') || path.endsWith('/orcamentos.html')) {
    fsConfigCarregarScriptUnico('/orcamentos-pdf.js', 'fs-orcamentos-pdf-js');
  }
}

fsConfigCarregarAjustesPagina();
