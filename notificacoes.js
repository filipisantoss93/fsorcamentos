// ==================== NOTIFICACOES.JS ====================
// FS Orçamentos - Central de notificações em tempo real

const LIMITE_NOTIFICACOES = 20;
let canalNotificacoes = null;
let notificacoesIniciadas = false;
let notificacoesCache = [];

function fsNotificacoesInit() {
  if (!window._supabase) {
    console.warn('Supabase não carregado. Notificações desativadas.');
    return;
  }

  criarModalNotificacoes();
  garantirEstiloNotificacoes();

  _supabase.auth.getSession().then(async ({ data }) => {
    if (data?.session?.user?.id) await iniciarNotificacoes(data.session);
    else pararNotificacoes();
  });

  _supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user?.id) await iniciarNotificacoes(session);
    else pararNotificacoes();
  });

  setTimeout(executarRotinaAlertasNotificacoes, 1800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fsNotificacoesInit);
else fsNotificacoesInit();

async function iniciarNotificacoes(session) {
  if (!session?.user?.id) return;
  mostrarSininhoNotificacoes(true);
  criarBotaoAtivarNotificacoes();
  await carregarNotificacoesRecentes(session.user.id);

  if (notificacoesIniciadas) return;
  notificacoesIniciadas = true;

  canalNotificacoes = _supabase
    .channel(`notificacoes-${session.user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notificacoes',
      filter: `usuario_id=eq.${session.user.id}`
    }, payload => {
      const notificacao = payload.new;
      notificacoesCache.unshift(notificacao);
      notificacoesCache = notificacoesCache.slice(0, LIMITE_NOTIFICACOES);
      atualizarContadorNaoLidasPeloCache();
      renderizarListaNotificacoes();
      mostrarToastNotificacao(notificacao);
      mostrarNotificacaoNavegador(notificacao);
    })
    .subscribe(status => console.log('Canal de notificações:', status));
}

function pararNotificacoes() {
  notificacoesIniciadas = false;
  mostrarSininhoNotificacoes(false);
  atualizarSininhoNotificacoes(0);
  if (canalNotificacoes && window._supabase) _supabase.removeChannel(canalNotificacoes);
  canalNotificacoes = null;
  notificacoesCache = [];
}

function mostrarSininhoNotificacoes(exibir) {
  const btn = document.getElementById('btn-notificacoes');
  if (btn) btn.style.display = exibir ? 'inline-flex' : 'none';
}

function atualizarSininhoNotificacoes(qtd) {
  const contador = document.getElementById('contador-notificacoes');
  if (!contador) return;
  const numero = Math.min(Number(qtd || 0), 99);
  contador.innerText = numero >= 99 ? '99+' : String(numero);
  contador.style.display = numero > 0 ? 'inline-flex' : 'none';
}

function atualizarContadorNaoLidasPeloCache() {
  atualizarSininhoNotificacoes(notificacoesCache.filter(n => !n.lida).length);
}

async function carregarNotificacoesRecentes(usuarioId) {
  if (!window._supabase || !usuarioId) return;
  const { data, error } = await _supabase.from('notificacoes').select('*').eq('usuario_id', usuarioId).order('criado_em', { ascending: false }).limit(LIMITE_NOTIFICACOES);
  if (error) { console.error('Erro ao carregar notificações:', error); return; }
  notificacoesCache = data || [];
  atualizarContadorNaoLidasPeloCache();
  renderizarListaNotificacoes();
}

function criarModalNotificacoes() {
  if (document.getElementById('modal-notificacoes')) return;
  const modal = document.createElement('div');
  modal.id = 'modal-notificacoes';
  modal.className = 'modal-notificacoes-overlay';
  modal.innerHTML = `<div class="modal-notificacoes-card"><div class="modal-notificacoes-topo"><div><strong>Notificações</strong><span>Aprovações, comunidade, agenda, OS e avisos importantes.</span></div><button type="button" onclick="fecharModalNotificacoes()">×</button></div><div id="lista-notificacoes" class="lista-notificacoes"><div class="notificacao-vazia">Carregando notificações...</div></div><div class="notificacoes-acoes"><button type="button" onclick="marcarTodasNotificacoesComoLidas()">Marcar todas como lidas</button><a href="/dashboard.html">Abrir Dashboard</a></div></div>`;
  modal.addEventListener('click', event => { if (event.target === modal) fecharModalNotificacoes(); });
  document.body.appendChild(modal);
}

async function abrirModalNotificacoes() {
  criarModalNotificacoes();
  const modal = document.getElementById('modal-notificacoes');
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  const { data: { session } } = await _supabase.auth.getSession();
  if (session?.user?.id) await carregarNotificacoesRecentes(session.user.id);
  renderizarListaNotificacoes();
}

function fecharModalNotificacoes() {
  const modal = document.getElementById('modal-notificacoes');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderizarListaNotificacoes() {
  const lista = document.getElementById('lista-notificacoes');
  if (!lista) return;
  if (!notificacoesCache.length) { lista.innerHTML = '<div class="notificacao-vazia">Nenhuma notificação recente.</div>'; return; }
  lista.innerHTML = notificacoesCache.map(n => {
    const tipo = normalizarTipoNotificacao(n.tipo);
    const classeTipo = obterClasseNotificacao(tipo);
    const icone = obterIconeNotificacao(tipo);
    const classeLida = n.lida ? 'lida' : 'nao-lida';
    const link = obterLinkNotificacao(n);
    return `<div class="notificacao-item ${classeTipo} ${classeLida}" onclick="abrirNotificacao('${escaparAtributoNotificacao(n.id)}')"><div class="notificacao-icone">${icone}</div><div class="notificacao-conteudo"><strong>${escaparHtmlNotificacao(n.titulo || 'Notificação')}</strong><p>${escaparHtmlNotificacao(n.mensagem || '')}</p><small>${formatarDataNotificacao(n.criado_em)}</small></div>${link ? '<button type="button">Abrir</button>' : ''}</div>`;
  }).join('');
}

async function marcarTodasNotificacoesComoLidas() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.user?.id) return;
  const ids = notificacoesCache.filter(n => !n.lida).map(n => n.id).filter(Boolean);
  if (!ids.length) return atualizarSininhoNotificacoes(0);
  const { error } = await _supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', session.user.id).in('id', ids);
  if (error) return alert('Não foi possível marcar as notificações como lidas.');
  notificacoesCache = notificacoesCache.map(n => ({ ...n, lida: true }));
  atualizarSininhoNotificacoes(0);
  renderizarListaNotificacoes();
}

async function abrirNotificacao(id) {
  const notificacao = notificacoesCache.find(n => String(n.id) === String(id));
  if (!notificacao) return;
  await marcarNotificacaoComoLida(notificacao.id);
  const link = obterLinkNotificacao(notificacao);
  if (link) window.location.href = link;
}

async function marcarNotificacaoComoLida(id) {
  if (!id) return;
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.user?.id) return;
  await _supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', session.user.id).eq('id', id);
  notificacoesCache = notificacoesCache.map(n => String(n.id) === String(id) ? { ...n, lida: true } : n);
  atualizarContadorNaoLidasPeloCache();
  renderizarListaNotificacoes();
}

async function abrirOrcamentoDaNotificacao(orcamentoId) { window.location.href = `/orcamentos.html?orcamento=${encodeURIComponent(orcamentoId)}`; }

function obterLinkNotificacao(n) {
  const link = String(n?.link || '').trim();
  if (link) return link.startsWith('/') ? link : `/${link.replace(/^\/+/, '')}`;
  if (n?.orcamento_id) return `/orcamentos.html?orcamento=${encodeURIComponent(n.orcamento_id)}`;
  if (n?.entidade_tipo === 'forum_topico' && n?.entidade_id) return `/forum.html#topico=${encodeURIComponent(n.entidade_id)}`;
  if (n?.entidade_tipo === 'forum_perfil' && n?.entidade_id) return `/perfil.html?id=${encodeURIComponent(n.entidade_id)}`;
  if (n?.entidade_tipo === 'ordem_servico' && n?.entidade_id) return `/ordem.html?id=${encodeURIComponent(n.entidade_id)}`;
  if (n?.entidade_tipo === 'agenda' && n?.entidade_id) return `/agendamento.html?id=${encodeURIComponent(n.entidade_id)}`;
  if (n?.entidade_tipo === 'estoque' && n?.entidade_id) return `/estoque.html?produto=${encodeURIComponent(n.entidade_id)}`;
  if (String(n?.tipo || '').includes('forum')) return '/forum.html';
  return '/dashboard.html';
}

function criarBotaoAtivarNotificacoes() {
  if (!('Notification' in window) || Notification.permission === 'granted') return;
  if (document.getElementById('btn-ativar-notificacoes')) return;
  const botao = document.createElement('button');
  botao.id = 'btn-ativar-notificacoes';
  botao.type = 'button';
  botao.innerText = '🔔 Ativar notificações';
  botao.style.cssText = 'position:fixed;right:18px;bottom:90px;z-index:16000;background:#ffc400;color:#3e2723;border:2px solid #3e2723;border-radius:999px;padding:11px 16px;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28)';
  botao.onclick = solicitarPermissaoNotificacoes;
  document.body.appendChild(botao);
}

async function solicitarPermissaoNotificacoes() {
  if (!('Notification' in window)) return alert('Este navegador não suporta notificações.');
  const permissao = await Notification.requestPermission();
  if (permissao === 'granted') {
    document.getElementById('btn-ativar-notificacoes')?.remove();
    new Notification('FS Orçamentos', { body: 'Notificações ativadas com sucesso.', icon: '/favicon.png' });
  } else alert('As notificações não foram ativadas. Você pode permitir depois nas configurações do navegador.');
}

function mostrarNotificacaoNavegador(n) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notif = new Notification(n.titulo || 'FS Orçamentos', { body: n.mensagem || 'Você recebeu uma atualização.', icon: '/favicon.png', badge: '/favicon.png' });
  notif.onclick = () => { window.focus(); window.location.href = obterLinkNotificacao(n); };
}

function mostrarToastNotificacao(n) {
  document.getElementById('toast-notificacao-orcamento')?.remove();
  const tipo = normalizarTipoNotificacao(n.tipo);
  const cor = tipo.includes('aprovado') ? '#16a34a' : tipo.includes('recusado') ? '#dc2626' : tipo.includes('forum') ? '#7c3aed' : tipo.includes('estoque') ? '#0891b2' : tipo.includes('agenda') ? '#f97316' : tipo.includes('os_') ? '#b45309' : tipo.includes('pix') ? '#2563eb' : '#3e2723';
  const toast = document.createElement('div');
  toast.id = 'toast-notificacao-orcamento';
  toast.innerHTML = `<div style="display:flex;gap:12px;align-items:flex-start;"><div style="width:38px;height:38px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">${obterIconeNotificacao(tipo)}</div><div style="flex:1;"><strong style="display:block;margin-bottom:4px;color:#3e2723;">${escaparHtmlNotificacao(n.titulo || 'Notificação')}</strong><span style="display:block;color:#5d4037;font-size:14px;line-height:1.35;">${escaparHtmlNotificacao(n.mensagem || '')}</span><button type="button" onclick="abrirNotificacao('${escaparAtributoNotificacao(n.id)}')" style="margin-top:10px;background:#3e2723;color:#ffc400;border:1px solid #ffc400;padding:7px 11px;border-radius:8px;font-weight:800;cursor:pointer;">Abrir</button></div><button type="button" onclick="fecharToastNotificacao()" style="background:transparent;border:none;color:#3e2723;font-size:22px;font-weight:bold;cursor:pointer;line-height:1;">×</button></div>`;
  toast.style.cssText = `position:fixed;right:18px;top:90px;width:min(420px,calc(100vw - 36px));background:#fffaf0;border:2px solid #ffc400;border-left:8px solid ${cor};border-radius:16px;padding:14px;z-index:17000;box-shadow:0 16px 45px rgba(0,0,0,.35)`;
  document.body.appendChild(toast);
  setTimeout(fecharToastNotificacao, 9000);
}

function fecharToastNotificacao() { document.getElementById('toast-notificacao-orcamento')?.remove(); }
function abrirOrcamentosDaNotificacao() { window.location.href = '/orcamentos.html'; }
function normalizarTipoNotificacao(tipo) { return String(tipo || 'info').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function obterClasseNotificacao(tipo) {
  if (tipo.includes('aprovado')) return 'notificacao-aprovado';
  if (tipo.includes('recusado')) return 'notificacao-recusado';
  if (tipo.includes('pix')) return 'notificacao-pix';
  if (tipo.includes('forum')) return 'notificacao-forum';
  if (tipo.includes('agenda')) return 'notificacao-agenda';
  if (tipo.includes('estoque')) return 'notificacao-estoque';
  if (tipo.includes('os_')) return 'notificacao-os';
  return 'notificacao-info';
}
function obterIconeNotificacao(tipo) {
  if (tipo.includes('aprovado')) return '✅';
  if (tipo.includes('recusado')) return '❌';
  if (tipo.includes('pix')) return '💠';
  if (tipo.includes('forum_resposta')) return '💬';
  if (tipo.includes('forum_curtida')) return '👍';
  if (tipo.includes('forum_seguidor')) return '👥';
  if (tipo.includes('agenda')) return '📅';
  if (tipo.includes('estoque')) return '📦';
  if (tipo.includes('os_') || tipo.includes('ordem')) return '🧾';
  return '🔔';
}
function formatarDataNotificacao(dataValor) {
  const data = new Date(dataValor || '');
  if (isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}
function escaparHtmlNotificacao(valor) { return String(valor || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function escaparAtributoNotificacao(valor) { return String(valor || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function garantirEstiloNotificacoes() {
  if (document.getElementById('style-notificacoes-fs')) return;
  const style = document.createElement('style');
  style.id = 'style-notificacoes-fs';
  style.innerHTML = `.btn-notificacoes-header{position:relative;border:1px solid rgba(255,196,0,.55);background:rgba(255,196,0,.12);color:#ffc400;border-radius:999px;width:38px;height:38px;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:.2s ease}.btn-notificacoes-header:hover{background:rgba(255,196,0,.24);transform:translateY(-1px)}.contador-notificacoes{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;background:#dc2626;color:#fff;border-radius:999px;font-size:11px;font-weight:900;align-items:center;justify-content:center;border:2px solid #3e2723;line-height:1}.modal-notificacoes-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:20000;padding:18px}.modal-notificacoes-card{width:min(100%,560px);max-height:90vh;overflow-y:auto;background:#fff;color:#3e2723;border-radius:12px;border:1px solid #d7ccc8;box-shadow:0 24px 70px rgba(0,0,0,.55)}.modal-notificacoes-topo{background:#2f211d;color:#ffc400;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}.modal-notificacoes-topo strong{display:block;font-size:19px;margin-bottom:3px}.modal-notificacoes-topo span{display:block;color:#fffaf0;font-size:12.5px;line-height:1.35}.modal-notificacoes-topo button{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:6px;width:32px;height:32px;font-size:22px;font-weight:900;cursor:pointer}.lista-notificacoes{padding:12px;display:flex;flex-direction:column;gap:8px}.notificacao-vazia{background:#fff8e1;color:#5d4037;border-left:5px solid #ffc400;border-radius:8px;padding:12px;font-weight:800;text-align:center}.notificacao-item{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:start;background:#fff;border-radius:8px;padding:11px;border:1px solid #e4d8cc;border-left:6px solid #3e2723;box-shadow:none;cursor:pointer}.notificacao-item.nao-lida{background:#fffaf0;border-left-color:#ffc400}.notificacao-item.lida{opacity:.72}.notificacao-aprovado{border-left-color:#16a34a}.notificacao-recusado{border-left-color:#dc2626}.notificacao-pix{border-left-color:#2563eb}.notificacao-forum{border-left-color:#7c3aed}.notificacao-agenda{border-left-color:#f97316}.notificacao-estoque{border-left-color:#0891b2}.notificacao-os{border-left-color:#b45309}.notificacao-info{border-left-color:#3e2723}.notificacao-icone{width:36px;height:36px;border-radius:50%;background:#f4ece1;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}.notificacao-conteudo strong{display:block;color:#3e2723;margin-bottom:3px;font-size:14px}.notificacao-conteudo p{margin:0 0 4px;color:#5d4037;font-size:12.5px;line-height:1.35}.notificacao-conteudo small{color:#8d6e63;font-size:11px;font-weight:700}.notificacao-item button{background:#3e2723;color:#ffc400;border:1px solid #ffc400;border-radius:6px;padding:7px 9px;font-size:11.5px;font-weight:900;cursor:pointer;white-space:nowrap}.notificacoes-acoes{display:flex;justify-content:space-between;gap:8px;padding:12px;border-top:1px solid #e0d6c8;background:#fffaf0;flex-wrap:wrap}.notificacoes-acoes button,.notificacoes-acoes a{flex:1;text-align:center;background:#ffc400;color:#3e2723;border:1px solid #3e2723;border-radius:6px;padding:9px 10px;font-weight:900;text-decoration:none;cursor:pointer;font-size:12px}.notificacoes-acoes a{background:#3e2723;color:#ffc400;border-color:#3e2723}@media(max-width:560px){.notificacao-item{grid-template-columns:36px 1fr}.notificacao-item button{grid-column:1/-1;width:100%}.notificacoes-acoes{flex-direction:column}}`;
  document.head.appendChild(style);
}

document.addEventListener('keydown', event => { if (event.key === 'Escape') fecharModalNotificacoes(); });

async function executarRotinaAlertasNotificacoes() {
  await verificarAlertasOperacionais();
  await verificarLembretesOrcamentosPendentes24h();
}

async function verificarAlertasOperacionais() {
  try {
    if (!window._supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { data, error } = await _supabase.rpc('fs_gerar_alertas_operacionais_usuario');
    if (error) { console.warn('Erro ao gerar alertas operacionais:', error); return; }
    const total = Number(data?.os_atrasadas || 0) + Number(data?.agenda_amanha || 0) + Number(data?.estoque_baixo || 0);
    if (total > 0) await carregarNotificacoesRecentes(session.user.id);
  } catch (e) { console.warn('Erro geral nos alertas operacionais:', e); }
}

async function verificarLembretesOrcamentosPendentes24h() {
  try {
    if (!window._supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return;
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 24);
    const { data, error } = await _supabase.from('orcamentos').select('id, titulo, assunto, cliente_nome, status, criado_em, lembrete_24h_enviado_em').eq('usuario_id', session.user.id).eq('status', 'pendente').lte('criado_em', dataLimite.toISOString()).is('lembrete_24h_enviado_em', null).limit(20);
    if (error || !data?.length) return;
    for (const o of data) {
      await _supabase.from('notificacoes').insert({ usuario_id: session.user.id, orcamento_id: o.id, entidade_tipo:'orcamento', entidade_id:o.id, tipo:'lembrete_orcamento', titulo:'Orçamento pendente há 24h', mensagem:`O orçamento "${o.titulo || o.assunto || 'Orçamento'}" para ${o.cliente_nome || 'cliente'} ainda está pendente.`, link:`/orcamentos.html?orcamento=${o.id}`, prioridade:'normal', lida:false });
      await _supabase.from('orcamentos').update({ lembrete_24h_enviado_em: new Date().toISOString() }).eq('id', o.id).eq('usuario_id', session.user.id);
    }
    await carregarNotificacoesRecentes(session.user.id);
  } catch (e) { console.warn('Erro ao verificar lembretes de orçamento:', e); }
}

window.abrirModalNotificacoes = abrirModalNotificacoes;
window.fecharModalNotificacoes = fecharModalNotificacoes;
window.marcarTodasNotificacoesComoLidas = marcarTodasNotificacoesComoLidas;
window.abrirOrcamentoDaNotificacao = abrirOrcamentoDaNotificacao;
window.fecharToastNotificacao = fecharToastNotificacao;
window.abrirOrcamentosDaNotificacao = abrirOrcamentosDaNotificacao;
window.solicitarPermissaoNotificacoes = solicitarPermissaoNotificacoes;
window.abrirNotificacao = abrirNotificacao;
window.verificarAlertasOperacionais = verificarAlertasOperacionais;