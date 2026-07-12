let headerJaCarregado=false;
let fsMenuInicializado=false;

const FS_ROTAS_PROTEGIDAS_MENU=['/gerador.html','/gerador','/painel.html','/painel','/orcamentos.html','/orcamentos','/dashboard.html','/dashboard','/fluxo-caixa.html','/fluxo-caixa'];
const FS_ROTAS_PREMIUM_MENU=['/orcamentos.html','/orcamentos','/dashboard.html','/dashboard','/fluxo-caixa.html','/fluxo-caixa'];
const FS_ROTAS_REMOVIDAS_MENU=['/gestao.html','/gestao','/clientes.html','/clientes','/cliente.html','/cliente','/veiculos.html','/veiculos','/ordens.html','/ordens','/ordem.html','/ordem','/estoque.html','/estoque','/agenda.html','/agenda','/recorrentes.html','/recorrentes'];

function fsModoEmbedGestao(){try{const p=new URLSearchParams(location.search);return p.get('embed')==='1'||p.get('iframe')==='1'||window.parent!==window}catch(_){return false}}
function aplicarModoEmbedGestao(){if(!fsModoEmbedGestao())return false;document.documentElement.classList.add('modo-embed-gestao');document.body?.classList.add('modo-embed-gestao');const h=document.getElementById('header-container');if(h){h.innerHTML='';h.style.display='none'}document.querySelectorAll('footer,.footer,.site-footer,.forum-footer').forEach(e=>e.style.display='none');return true}
function removerCssObsoletoTemaMarrom(){document.querySelectorAll('style').forEach(s=>{const t=s.textContent||'';if(t.includes('FS FORMAL THEME OVERRIDES')||t.includes('FS CONTRAST FIX')||t.includes('marrom no header')||t.includes('Cores oficiais: marrom'))s.remove()})}
function fsNormalizarTextoMenu(v){const p=String(v||'gratis').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();return p==='basico'||p==='gestao'?'premium':p}
function fsPaginaAtual(){const p=location.pathname||'/';return p==='/'?'/index.html':p}
function fsEstaNaPaginaGerador(){const p=fsPaginaAtual();return p.endsWith('/gerador.html')||p.endsWith('/gerador')}
function fsEstaNaHome(){const p=fsPaginaAtual();return p==='/index.html'||p.endsWith('/index.html')}
function fsDestinoProtegidoMenu(href){try{if(!href||href.startsWith('#')||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('tel:'))return'';const u=new URL(href,location.origin);if(u.origin!==location.origin)return'';return`${u.pathname||'/index.html'}${u.search||''}${u.hash||''}`}catch(_){return''}}
function fsNormalizarPathMenu(destino){let p=String(destino||'').split('?')[0].split('#')[0].replace(/\/$/,'').toLowerCase();return p||'/index.html'}
function fsListaContemRotaMenu(lista,destino){const p=fsNormalizarPathMenu(destino);return lista.some(r=>p===r||p===r.replace(/\.html$/,''))}
function fsEhRotaRemovidaMenu(destino){return fsListaContemRotaMenu(FS_ROTAS_REMOVIDAS_MENU,destino)}
function fsEhRotaProtegidaMenu(destino){return fsListaContemRotaMenu(FS_ROTAS_PROTEGIDAS_MENU,destino)}
function fsPlanoMinimoDaRotaMenu(destino){if(fsEhRotaRemovidaMenu(destino))return'removida';if(!fsEhRotaProtegidaMenu(destino))return'publico';if(fsListaContemRotaMenu(FS_ROTAS_PREMIUM_MENU,destino))return'premium';return'gratis'}
function fsPlanoMenuAtual(){return fsNormalizarTextoMenu(localStorage.getItem('usuario_plano')||'gratis')}
function fsPlanoMenuOrdem(plano){return fsNormalizarTextoMenu(plano)==='premium'?1:0}
function fsPlanoPermiteDestinoMenu(destino,plano=fsPlanoMenuAtual()){const min=fsPlanoMinimoDaRotaMenu(destino);if(min==='removida')return false;if(min==='publico'||min==='gratis')return true;return fsPlanoMenuOrdem(plano)>=fsPlanoMenuOrdem(min)}

function fsGarantirCss(id,href,trechoHref=''){
  if(document.getElementById(id)||(trechoHref&&document.querySelector(`link[href*="${trechoHref}"]`)))return;
  const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l);
}
function fsCarregarScript(id,src){
  return new Promise((resolve,reject)=>{
    const existente=document.getElementById(id);
    if(existente){if(existente.dataset.carregado==='sim')resolve();else existente.addEventListener('load',resolve,{once:true});return}
    const s=document.createElement('script');s.id=id;s.src=src;s.defer=true;s.onload=()=>{s.dataset.carregado='sim';resolve()};s.onerror=reject;document.head.appendChild(s);
  });
}
function garantirDependenciasHeader(){
  fsGarantirCss('fs-style-global','/style.css?v=20260712-header-blue-4','/style.css');
  fsGarantirCss('fs-header-clean-css','/header-clean.css?v=20260712-2','/header-clean.css');
  fsGarantirCss('fs-auth-clean-css','/auth-clean.css?v=20260712-2','/auth-clean.css');
  fsGarantirCss('fs-menu-css','/menu-aprimorado.css?v=20260712-5','/menu-aprimorado.css');
  fsGarantirCss('fs-efex-css','/efex-mascote.css?v=20260712-1','/efex-mascote.css');
}

function fecharMenuMobileSeAberto(){if(typeof window.fsFecharMenu==='function')window.fsFecharMenu({devolverFoco:false});else{document.querySelector('.header-menu-linha')?.classList.remove('menu-aberto');document.querySelector('.main-header')?.classList.remove('menu-aberto')}}
function toggleMenuMobile(){const m=document.querySelector('.header-menu-linha'),h=document.querySelector('.main-header');m?.classList.toggle('menu-aberto');h?.classList.toggle('menu-aberto',m?.classList.contains('menu-aberto'))}
function fsSalvarDestinoProtegidoMenu(destino){try{const d=fsDestinoProtegidoMenu(destino)||'/gerador.html';localStorage.setItem('fs_destino_apos_login',d);return d}catch(_){return'/gerador.html'}}
function fsAbrirLoginParaDestinoProtegido(destino){const d=fsSalvarDestinoProtegidoMenu(destino);fecharMenuMobileSeAberto();if(fsEstaNaHome()&&typeof window.abrirModalLogin==='function'){window.abrirModalLogin();return}location.href=`/index.html?login=1&dest=${encodeURIComponent(d)}`}
async function obterSessaoAtualMenu(){try{if(!window._supabase)return null;const{data,error}=await _supabase.auth.getSession();return error?null:data?.session||null}catch(_){return null}}

async function carregarHeaderHtmlMenu(){for(const c of ['/header.html','header.html','./header.html']){try{const r=await fetch(c,{cache:'no-cache'});if(r.ok)return await r.text()}catch(_){}}throw new Error('Não foi possível carregar header.html.')}
function configurarLinksDoHeader(){document.querySelectorAll('.header-menu-linha a').forEach(link=>{if(link.dataset.fsHeaderLinkConfigurado==='sim')return;link.dataset.fsHeaderLinkConfigurado='sim';link.addEventListener('click',async e=>{const d=fsDestinoProtegidoMenu(link.getAttribute('href')||'');if(fsEhRotaRemovidaMenu(d)){e.preventDefault();location.href='/gerador.html';return}if(!fsEhRotaProtegidaMenu(d)){fecharMenuMobileSeAberto();return}const s=await obterSessaoAtualMenu();if(!s?.user?.id){e.preventDefault();fsAbrirLoginParaDestinoProtegido(d);return}if(!fsPlanoPermiteDestinoMenu(d)){e.preventDefault();fecharMenuMobileSeAberto();location.href='/planos.html#assinar-plano-premium';return}fecharMenuMobileSeAberto()})})}
function configurarDropdownsHeader(){return}
function marcarLinkAtivoHeader(){if(typeof window.fsAtualizarResumoHeader==='function')window.fsAtualizarResumoHeader()}
function aplicarVisibilidadeMenuPorPlano(){document.querySelectorAll('[data-plano-min]').forEach(link=>{const li=link.closest('li');if(li)li.style.display=''})}
async function verificarExpiracaoTestePremiumMenu(){try{if(!window._supabase)return null;const{data:{session}}=await _supabase.auth.getSession();if(!session?.user?.id)return null;const{data,error}=await _supabase.rpc('verificar_expiracao_teste_premium');if(error)return null;return data||null}catch(_){return null}}
async function atualizarHeaderUsuario(){if(typeof window.fsAtualizarResumoHeader==='function')await window.fsAtualizarResumoHeader()}

function configurarHeaderInteligente(){const h=document.getElementById('header-container');if(!h)return;h.classList.remove('header-oculto');h.classList.add('header-visivel')}
function controlarHeaderInteligente(){configurarHeaderInteligente()}

async function carregarDependenciasComponente(){
  await fsCarregarScript('fs-menu-js','/menu-aprimorado.js?v=20260712-4');
  await fsCarregarScript('fs-efex-js','/efex-mascote.js?v=20260712-1');
  if(fsEstaNaPaginaGerador())await fsCarregarScript('fs-gerador-extras-js','/gerador-extras.js?v=20260712-1');
}

async function carregarMenu(){
  removerCssObsoletoTemaMarrom();
  if(aplicarModoEmbedGestao())return;
  garantirDependenciasHeader();
  const h=document.getElementById('header-container');
  if(!h)return;
  try{
    if(!headerJaCarregado){
      h.innerHTML=await carregarHeaderHtmlMenu();
      h.style.display='block';
      headerJaCarregado=true;
      configurarLinksDoHeader();
      configurarDropdownsHeader();
      configurarHeaderInteligente();
      await carregarDependenciasComponente();
    }
    await atualizarHeaderUsuario();
    aplicarVisibilidadeMenuPorPlano();
    configurarHeaderInteligente();
  }catch(e){console.error('Erro ao carregar menu:',e)}
}

function fsRedirecionarIndexSePlanoNaoPermite(session,destino=fsPaginaAtual()){
  if(fsEhRotaRemovidaMenu(destino)){location.replace('/gerador.html');return true}
  if(!session?.user?.id||!fsEhRotaProtegidaMenu(destino))return false;
  if(fsPlanoPermiteDestinoMenu(destino))return false;
  localStorage.removeItem('fs_destino_apos_login');
  location.replace('/planos.html#assinar-plano-premium');
  return true;
}

async function controlarBotaoFlutuanteGeradorGlobal(sessionRecebida=undefined){if(fsModoEmbedGestao())return removerBotaoFlutuanteGeradorGlobal();let s=sessionRecebida;if(s===undefined)s=await obterSessaoAtualMenu();if(!s?.user?.id||fsEstaNaPaginaGerador())return removerBotaoFlutuanteGeradorGlobal();criarBotaoFlutuanteGeradorGlobal()}
function criarBotaoFlutuanteGeradorGlobal(){if(document.getElementById('btn-flutuante-gerador-global'))return;const b=document.createElement('button');b.type='button';b.id='btn-flutuante-gerador-global';b.innerHTML='🧾 <span>Gerar orçamento</span>';b.title='Gerar orçamento';b.setAttribute('aria-label','Gerar orçamento');b.onclick=abrirGeradorGlobal;document.body.appendChild(b)}
function removerBotaoFlutuanteGeradorGlobal(){document.getElementById('btn-flutuante-gerador-global')?.remove();document.body.classList.remove('gerador-aberto')}
async function abrirGeradorGlobal(){const s=await obterSessaoAtualMenu();if(!s?.user?.id){removerBotaoFlutuanteGeradorGlobal();if(fsEstaNaHome()&&typeof window.abrirModalLogin==='function')return window.abrirModalLogin();location.href='/index.html?login=1&dest='+encodeURIComponent('/gerador.html');return}location.href='/gerador.html'}
function irParaLogin(){fecharMenuMobileSeAberto();if(fsEstaNaHome()&&typeof window.abrirModalLogin==='function')return window.abrirModalLogin();location.href='/index.html?login=1'}
async function deslogar(){try{fecharMenuMobileSeAberto();if(window._supabase)await _supabase.auth.signOut();['id','usuario_nome','usuario_email','usuario_plano','usuario_plano_status','usuario_plano_expira_em','nome_empresa','telefone_empresa','endereco_empresa','cnpj_empresa','foto_url'].forEach(k=>localStorage.removeItem(k));removerBotaoFlutuanteGeradorGlobal();location.href='/index.html'}catch(e){console.error(e);alert('Não foi possível sair da conta. Tente novamente.')}}

function removerParametrosUrlMenu(){history.replaceState({},document.title,location.origin+location.pathname)}
function abrirLoginAutomaticamenteSeSolicitado(){const p=new URLSearchParams(location.search),d=p.get('dest')||'';if(d&&fsEhRotaProtegidaMenu(d))fsSalvarDestinoProtegidoMenu(d);if(p.get('login')!=='1')return;setTimeout(()=>{irParaLogin();removerParametrosUrlMenu()},300)}
async function abrirGeradorAutomaticamenteSeSolicitado(){const p=new URLSearchParams(location.search);if(p.get('abrirGerador')!=='1')return;const s=await obterSessaoAtualMenu();removerParametrosUrlMenu();if(!s?.user?.id){fsSalvarDestinoProtegidoMenu('/gerador.html');irParaLogin();return}location.href='/gerador.html'}

async function inicializarMenuFS(){
  if(fsMenuInicializado)return;
  fsMenuInicializado=true;
  if(aplicarModoEmbedGestao())return;
  await carregarMenu();
  const s=await obterSessaoAtualMenu();
  const d=fsPaginaAtual();
  // auth.js é a única autoridade para bloquear páginas e redirecionar ao login.
  // O menu apenas aplica restrições de plano e gerencia seus próprios componentes.
  if(fsRedirecionarIndexSePlanoNaoPermite(s,d))return;
  abrirLoginAutomaticamenteSeSolicitado();
  await abrirGeradorAutomaticamenteSeSolicitado();
  await controlarBotaoFlutuanteGeradorGlobal(s);
  if(window._supabase){
    _supabase.auth.onAuthStateChange(async(_,session)=>{
      await atualizarHeaderUsuario();
      if(fsRedirecionarIndexSePlanoNaoPermite(session,fsPaginaAtual()))return;
      await controlarBotaoFlutuanteGeradorGlobal(session);
    });
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicializarMenuFS,{once:true});else inicializarMenuFS();

window.carregarMenu=carregarMenu;
window.verificarExpiracaoTestePremiumMenu=verificarExpiracaoTestePremiumMenu;
window.atualizarHeaderUsuario=atualizarHeaderUsuario;
window.irParaLogin=irParaLogin;
window.toggleMenuMobile=toggleMenuMobile;
window.deslogar=deslogar;
window.abrirGeradorGlobal=abrirGeradorGlobal;
window.controlarBotaoFlutuanteGeradorGlobal=controlarBotaoFlutuanteGeradorGlobal;
window.configurarHeaderInteligente=configurarHeaderInteligente;
window.controlarHeaderInteligente=controlarHeaderInteligente;
window.aplicarVisibilidadeMenuPorPlano=aplicarVisibilidadeMenuPorPlano;
window.inicializarMenuFS=inicializarMenuFS;
window.fsAbrirLoginParaDestinoProtegido=fsAbrirLoginParaDestinoProtegido;
window.fsSalvarDestinoProtegidoMenu=fsSalvarDestinoProtegidoMenu;
window.removerCssObsoletoTemaMarrom=removerCssObsoletoTemaMarrom;
window.fsRedirecionarIndexSePlanoNaoPermite=fsRedirecionarIndexSePlanoNaoPermite;
window.fsPlanoPermiteDestinoMenu=fsPlanoPermiteDestinoMenu;
