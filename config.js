/* =========================================================
   FS ORÇAMENTOS - config.js
   Configuração pública do frontend

   IMPORTANTE:
   - Aqui deve ficar SOMENTE a anon public key do Supabase.
   - Nunca coloque service_role key no frontend.
   ========================================================= */

const SUPABASE_URL = 'https://kvjvhoziqcevkzyszdke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdmp2aG96aXFjZXZrenlzemRrZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc0Nzg3ODE5LCJleHAiOjIwOTAzNjM4MTl9.ptXSP5LeasQgLuIicmTrtw_on5MfijUk26hllMsegfI';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

function fsConfigDecodificarPayloadJwt(token) {
  try {
    const partes = String(token || '').split('.');
    if (partes.length < 2) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (erro) { return null; }
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
  if (payload?.role && payload.role !== 'anon') console.warn(`A chave Supabase informada tem role "${payload.role}". No frontend, o recomendado é role "anon".`);
  return true;
}

function inicializarSupabaseFS() {
  if (window._supabase) return window._supabase;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Biblioteca Supabase ainda não carregada. Verifique se o script @supabase/supabase-js vem antes do config.js.');
    return null;
  }
  if (!fsConfigValidarChaveSupabase()) return null;
  window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return window._supabase;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarSupabaseFS);
else inicializarSupabaseFS();

window.inicializarSupabaseFS = inicializarSupabaseFS;
window.fsConfigValidarChaveSupabase = fsConfigValidarChaveSupabase;

const FS_CONFIG_CSS_GLOBAIS = [
  ['fs-theme-cinza.css?v=20260622-limpeza-gerador-1', 'fs-theme-cinza-css']
];

const FS_CONFIG_SCRIPTS_GLOBAIS = [
  ['fs-auth-redirect-guard.js?v=20260622-limpeza-gerador-1', 'fs-auth-redirect-guard-js'],
  ['fs-pwa-register.js?v=20260622-limpeza-gerador-1', 'fs-pwa-register-js'],
  ['fs-session-cache.js?v=20260623-cache-dados-1', 'fs-session-cache-js'],
  ['fs-menu-close-outside.js?v=20260622-limpeza-gerador-1', 'fs-menu-close-outside-js'],
  ['fs-footer-legal.js?v=20260622-limpeza-gerador-1', 'fs-footer-legal-js']
];

const FS_CONFIG_CSS_POR_PAGINA = [
  { paginas: ['/gerador', '/gerador.html'], estilos: [['gerador.css?v=20260622-limpeza-gerador-1', 'fs-gerador-css']] },
  { paginas: ['/orcamentos', '/orcamentos.html'], estilos: [['orcamentos.css?v=20260622-limpeza-gerador-1', 'fs-orcamentos-css']] }
];

const FS_CONFIG_SCRIPTS_POR_PAGINA = [
  { paginas: ['/', '/index', '/index.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js'], ['fs-home-auth-fix.js?v=20260622-limpeza-gerador-1', 'fs-home-auth-fix-js'], ['fs-home-premium-dashboard.js?v=20260622-limpeza-gerador-1', 'fs-home-premium-dashboard-js']] },
  { paginas: ['/painel', '/painel.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js']] },
  { paginas: ['/ver', '/ver.html'], scripts: [['ver-cliente-fix.js?v=20260622-limpeza-gerador-1', 'fs-ver-cliente-fix-js']] },
  { paginas: ['/gerador', '/gerador.html'], scripts: [['fs-format-br.js?v=20260622-limpeza-gerador-1', 'fs-format-br-js'], ['gerador-pdf-fix.js?v=20260622-limpeza-gerador-1', 'fs-gerador-pdf-fix-js']] },
  { paginas: ['/orcamentos', '/orcamentos.html'], scripts: [['orcamentos-pdf.js?v=20260622-limpeza-gerador-1', 'fs-orcamentos-pdf-js']] },
  { paginas: ['/ordens', '/ordens.html'], scripts: [['ordens-recorrente-prefill.js?v=20260622-limpeza-gerador-1', 'fs-ordens-recorrente-prefill-js']] },
  { paginas: ['/ordens', '/ordens.html', '/recorrentes', '/recorrentes.html', '/clientes', '/clientes.html'], scripts: [['fs-cliente-modal.js?v=20260622-limpeza-gerador-1', 'fs-cliente-modal-js']] },
  { paginas: ['/ordem', '/ordem.html'], scripts: [['ordem-extras.js?v=20260622-limpeza-gerador-1', 'fs-ordem-extras-js'], ['ordem-fotos-depois.js?v=20260622-limpeza-gerador-1', 'fs-ordem-fotos-depois-js'], ['ordem-pdf-fotos-depois.js?v=20260622-limpeza-gerador-1', 'fs-ordem-pdf-fotos-depois-js'], ['ordem-financeiro-nativo-fix.js?v=20260622-limpeza-gerador-1', 'fs-ordem-financeiro-nativo-fix-js'], ['ordem-garantia.js?v=20260622-limpeza-gerador-1', 'fs-ordem-garantia-js'], ['ordem-recibo.js?v=20260622-limpeza-gerador-1', 'fs-ordem-recibo-js']] }
];

function fsConfigNormalizarPathAtual() {
  const path = (window.location.pathname || '/').toLowerCase().replace(/\/$/, '');
  return path || '/';
}
function fsConfigPathCorresponde(pathAtual, pagina) {
  if (pagina === '/') return pathAtual === '/';
  return pathAtual === pagina || pathAtual.endsWith(pagina);
}
function fsConfigCarregarScriptUnico(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = src.startsWith('/') ? src : `/${src}`;
  script.async = false;
  script.onerror = () => console.warn(`Não foi possível carregar ${src}.`);
  document.head.appendChild(script);
}
function fsConfigCarregarCssUnico(href, id) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href.startsWith('/') ? href : `/${href}`;
  link.onerror = () => console.warn(`Não foi possível carregar ${href}.`);
  document.head.appendChild(link);
}
function fsConfigCarregarListaScripts(scripts) { scripts.forEach(([arquivo, id]) => fsConfigCarregarScriptUnico(arquivo, id)); }
function fsConfigCarregarListaCss(estilos) { estilos.forEach(([arquivo, id]) => fsConfigCarregarCssUnico(arquivo, id)); }
function fsConfigCarregarCssDaPagina(pathAtual) { FS_CONFIG_CSS_POR_PAGINA.forEach((grupo) => { if (grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina))) fsConfigCarregarListaCss(grupo.estilos); }); }
function fsConfigCarregarScriptsDaPagina(pathAtual) { FS_CONFIG_SCRIPTS_POR_PAGINA.forEach((grupo) => { if (grupo.paginas.some((pagina) => fsConfigPathCorresponde(pathAtual, pagina))) fsConfigCarregarListaScripts(grupo.scripts); }); }
function fsConfigModoEmbed() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('embed') === '1' || params.get('iframe') === '1' || document.documentElement.classList.contains('fs-embed');
  } catch (_) { return false; }
}
function fsConfigCarregarAjustesPagina() {
  const pathAtual = fsConfigNormalizarPathAtual();
  const modoEmbed = fsConfigModoEmbed();
  fsConfigCarregarListaCss(FS_CONFIG_CSS_GLOBAIS);
  fsConfigCarregarCssDaPagina(pathAtual);
  if (modoEmbed) return;
  fsConfigCarregarListaScripts(FS_CONFIG_SCRIPTS_GLOBAIS);
  fsConfigCarregarScriptsDaPagina(pathAtual);
}

fsConfigCarregarAjustesPagina();