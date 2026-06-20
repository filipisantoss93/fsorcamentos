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
  const { data, error } = await _supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(LIMITE_NOTIFICACOES);

  if (error) {
    console.error('Erro ao carregar notificações:', error);
    return;
  }

  notificacoesCache = data || [];
  atualizarContadorNaoLidasPeloCache();
  renderizarListaNotificacoes();
}

function criarModalNotificacoes() {
  if (document.getElementById('modal-notificacoes')) return;
  const modal = document.createElement('div');
  modal.id = 'modal-notificacoes';
  modal.className = 'modal-notificacoes-overlay';
  modal.innerHTML = `
    <div class="modal-notificacoes-card">
      <div class="modal-notificacoes-topo">
        <div>
          <strong>Notificações</strong>
          <span>Avisos recentes da plataforma.</span>
        </div>
        <button type="button" class="notificacoes-fechar" onclick="fecharModalNotificacoes()">×</button>
      </div>
      <div id="lista-notificacoes" class="lista-notificacoes">
        <div class="notificacao-vazia">Carregando notificações...</div>
      </div>
      <div class="notificacoes-acoes">
        <button type="button" class="notificacoes-link-acao" onclick="marcarTodasNotificacoesComoLidas()">Marcar todos como lido</button>
        <button type="button" class="notificacoes-link-acao limpar" onclick="limparNotificacoes()">Limpar notificações</button>
      </div>
    </div>`;
  modal.addEventListener('click', event => {
    if (event.target === modal) fecharModalNotificacoes();
  });
  document.body.appendChild(modal);
}

async function abrirModalNotificacoes() {
  criarModalNotificacoes();
  garantirEstiloNotificacoes();
  const modal = document.getElementById('modal-notificacoes');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
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

  if (!notificacoesCache.length) {
    lista.innerHTML = '<div class="notificacao-vazia">Nenhuma notificação recente.</div>';
    return;
  }

  lista.innerHTML = `
    <div class="notificacoes-tabela-wrap">
      <table class="notificacoes-tabela">
        <thead>
          <tr>
            <th>Status</th>
            <th>Notificação</th>
            <th>Data</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          ${notificacoesCache.map(n => {
            const tipo = normalizarTipoNotificacao(n.tipo);
            const classeTipo = obterClasseNotificacao(tipo);
            const icone = obterIconeNotificacao(tipo);
            const classeLida = n.lida ? 'lida' : 'nao-lida';
            const link = obterLinkNotificacao(n);
            return `
              <tr class="notificacao-linha ${classeTipo} ${classeLida}" onclick="abrirNotificacao('${escaparAtributoNotificacao(n.id)}')">
                <td class="notificacao-status"><span>${n.lida ? 'Lida' : 'Nova'}</span></td>
                <td class="notificacao-texto"><strong>${icone} ${escaparHtmlNotificacao(n.titulo || 'Notificação')}</strong><small>${escaparHtmlNotificacao(n.mensagem || '')}</small></td>
                <td class="notificacao-data">${formatarDataNotificacao(n.criado_em)}</td>
                <td class="notificacao-acao">${link ? '<button type="button">Abrir</button>' : '<span>-</span>'}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

async function marcarTodasNotificacoesComoLidas() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.user?.id) return;

  const ids = notificacoesCache.filter(n => !n.lida).map(n => n.id).filter(Boolean);
  if (!ids.length) return atualizarSininhoNotificacoes(0);

  const { error } = await _supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', session.user.id)
    .in('id', ids);

  if (error) return alert('Não foi possível marcar as notificações como lidas.');

  notificacoesCache = notificacoesCache.map(n => ({ ...n, lida: true }));
  atualizarSininhoNotificacoes(0);
  renderizarListaNotificacoes();
}

async function limparNotificacoes() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.user?.id) return;
  if (!notificacoesCache.length) return;
  if (!confirm('Limpar todas as notificações?')) return;

  const { error } = await _supabase
    .from('notificacoes')
    .delete()
    .eq('usuario_id', session.user.id);

  if (error) return alert('Não foi possível limpar as notificações.');

  notificacoesCache = [];
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

async function abrirOrcamentoDaNotificacao(orcamentoId) {
  window.location.href = `/orcamentos.html?orcamento=${encodeURIComponent(orcamentoId)}`;
}

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
  return '';
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
  } else {
    alert('As notificações não foram ativadas. Você pode permitir depois nas configurações do navegador.');
  }
}

function mostrarNotificacaoNavegador(n) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notif = new Notification(n.titulo || 'FS Orçamentos', {
    body: n.mensagem || 'Você recebeu uma atualização.',
    icon: '/favicon.png',
    badge: '/favicon.png'
  });
  notif.onclick = () => {
    window.focus();
    const link = obterLinkNotificacao(n);
    if (link) window.location.href = link;
  };
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

function fecharToastNotificacao() {
  document.getElementById('toast-notificacao-orcamento')?.remove();
}

function abrirOrcamentosDaNotificacao() {
  window.location.href = '/orcamentos.html';
}

function normalizarTipoNotificacao(tipo) {
  return String(tipo || 'info').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

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
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escaparHtmlNotificacao(valor) {
  return String(valor || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function escaparAtributoNotificacao(valor) {
  return String(valor || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}

function garantirEstiloNotificacoes() {
  if (document.getElementById('style-notificacoes-fs')) return;
  const style = document.createElement('style');
  style.id = 'style-notificacoes-fs';
  style.innerHTML = `
    .btn-notificacoes-header{position:relative;border:1px solid rgba(255,196,0,.55);background:rgba(255,196,0,.12);color:#ffc400;border-radius:999px;width:34px;height:34px;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:.2s ease}
    .btn-notificacoes-header:hover{background:rgba(255,196,0,.24);transform:translateY(-1px)}
    .contador-notificacoes{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;background:#dc2626;color:#fff;border-radius:999px;font-size:10px;font-weight:900;align-items:center;justify-content:center;border:2px solid #3e2723;line-height:1}
    .modal-notificacoes-overlay{position:fixed;inset:0;background:rgba(0,0,0,.62);display:none;align-items:center;justify-content:center;z-index:20000;padding:10px}
    .modal-notificacoes-card{width:min(720px,calc(100vw - 16px));max-height:76vh;display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#3e2723;border-radius:9px;border:1px solid #d7ccc8;box-shadow:0 18px 50px rgba(0,0,0,.45)}
    .modal-notificacoes-topo{background:#2f211d;color:#ffc400;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-shrink:0}
    .modal-notificacoes-topo strong{display:block;font-size:15px;line-height:1.1;margin:0}
    .modal-notificacoes-topo span{display:block;color:#fffaf0;font-size:10.5px;line-height:1.25;margin-top:2px;font-weight:650}
    .notificacoes-fechar{background:transparent;color:#fff;border:0;width:26px;height:26px;font-size:22px;font-weight:900;cursor:pointer;line-height:1}
    .lista-notificacoes{padding:0;overflow:auto;flex:1;min-height:110px;background:#fff}
    .notificacao-vazia{margin:8px;background:#fff8e1;color:#5d4037;border-left:3px solid #ffc400;border-radius:5px;padding:8px;font-weight:800;text-align:center;font-size:12px}
    .notificacoes-tabela-wrap{width:100%;overflow:auto}
    .notificacoes-tabela{width:100%;border-collapse:collapse;min-width:620px;background:#fff}
    .notificacoes-tabela th{position:sticky;top:0;z-index:1;background:#f8f4ee;color:#3e2723;border-bottom:1px solid #e4d8cc;padding:5px 6px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.02em;font-weight:950;white-space:nowrap}
    .notificacoes-tabela td{border-bottom:1px solid #eee4d9;padding:5px 6px;vertical-align:middle;font-size:11px;line-height:1.25;color:#3e2723}
    .notificacao-linha{cursor:pointer;background:#fff;border-left:3px solid #3e2723}
    .notificacao-linha:hover{background:#fff8e1}
    .notificacao-linha.nao-lida{background:#fffdf5;font-weight:850}
    .notificacao-linha.lida{opacity:.72}
    .notificacao-aprovado{border-left-color:#16a34a}.notificacao-recusado{border-left-color:#dc2626}.notificacao-pix{border-left-color:#2563eb}.notificacao-forum{border-left-color:#7c3aed}.notificacao-agenda{border-left-color:#f97316}.notificacao-estoque{border-left-color:#0891b2}.notificacao-os{border-left-color:#b45309}.notificacao-info{border-left-color:#3e2723}
    .notificacao-status span{display:inline-flex;align-items:center;justify-content:center;min-width:38px;padding:2px 5px;border-radius:999px;border:1px solid #d7ccc8;background:#f8f4ee;color:#3e2723;font-size:9.5px;font-weight:950;white-space:nowrap}
    .notificacao-linha.nao-lida .notificacao-status span{background:#ffc400;border-color:#3e2723;color:#2f211d}
    .notificacao-texto strong{display:block;color:#3e2723;font-size:11px;line-height:1.2;font-weight:950;max-width:410px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .notificacao-texto small{display:block;color:#6b5b53;font-size:10px;line-height:1.2;max-width:410px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;font-weight:650}
    .notificacao-data{width:96px;white-space:nowrap;color:#6b5b53!important;font-size:10px!important;font-weight:750}
    .notificacao-acao{width:54px;text-align:center}
    .notificacao-acao button{background:transparent;color:#3e2723;border:0;padding:0;font-size:10.5px;font-weight:950;text-decoration:underline;cursor:pointer;white-space:nowrap}
    .notificacao-acao span{color:#8d6e63;font-size:10px}
    .notificacoes-acoes{display:flex;justify-content:flex-end;gap:12px;padding:6px 9px;border-top:1px solid #e0d6c8;background:#fffaf0;flex-shrink:0}
    .notificacoes-link-acao{background:transparent!important;border:0!important;padding:0!important;color:#3e2723!important;font-size:10.5px!important;font-weight:900!important;text-decoration:underline!important;cursor:pointer!important;line-height:1.2!important}
    .notificacoes-link-acao.limpar{color:#991b1b!important}
    @media(max-width:560px){.modal-notificacoes-overlay{align-items:flex-start;padding:6px}.modal-notificacoes-card{width:100%;max-height:82vh}.notificacoes-tabela{min-width:560px}.notificacao-texto strong,.notificacao-texto small{max-width:290px}.notificacoes-acoes{justify-content:space-between}}
  `;
  document.head.appendChild(style);
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') fecharModalNotificacoes();
});

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
    if (error) {
      console.warn('Erro ao gerar alertas operacionais:', error);
      return;
    }
    const total = Number(data?.os_atrasadas || 0) + Number(data?.agenda_amanha || 0) + Number(data?.estoque_baixo || 0);
    if (total > 0) await carregarNotificacoesRecentes(session.user.id);
  } catch (e) {
    console.warn('Erro geral nos alertas operacionais:', e);
  }
}

async function verificarLembretesOrcamentosPendentes24h() {
  try {
    if (!window._supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) return;
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 24);
    const { data, error } = await _supabase
      .from('orcamentos')
      .select('id, titulo, assunto, cliente_nome, status, criado_em, lembrete_24h_enviado_em')
      .eq('usuario_id', session.user.id)
      .eq('status', 'pendente')
      .lte('criado_em', dataLimite.toISOString())
      .is('lembrete_24h_enviado_em', null)
      .limit(20);

    if (error || !data?.length) return;

    for (const o of data) {
      await _supabase.from('notificacoes').insert({
        usuario_id: session.user.id,
        orcamento_id: o.id,
        entidade_tipo: 'orcamento',
        entidade_id: o.id,
        tipo: 'lembrete_orcamento',
        titulo: 'Orçamento pendente há 24h',
        mensagem: `O orçamento "${o.titulo || o.assunto || 'Orçamento'}" para ${o.cliente_nome || 'cliente'} ainda está pendente.`,
        link: `/orcamentos.html?orcamento=${o.id}`,
        prioridade: 'normal',
        lida: false
      });
      await _supabase
        .from('orcamentos')
        .update({ lembrete_24h_enviado_em: new Date().toISOString() })
        .eq('id', o.id)
        .eq('usuario_id', session.user.id);
    }

    await carregarNotificacoesRecentes(session.user.id);
  } catch (e) {
    console.warn('Erro ao verificar lembretes de orçamento:', e);
  }
}

window.abrirModalNotificacoes = abrirModalNotificacoes;
window.fecharModalNotificacoes = fecharModalNotificacoes;
window.marcarTodasNotificacoesComoLidas = marcarTodasNotificacoesComoLidas;
window.limparNotificacoes = limparNotificacoes;
window.abrirOrcamentoDaNotificacao = abrirOrcamentoDaNotificacao;
window.fecharToastNotificacao = fecharToastNotificacao;
window.abrirOrcamentosDaNotificacao = abrirOrcamentosDaNotificacao;
window.solicitarPermissaoNotificacoes = solicitarPermissaoNotificacoes;
window.abrirNotificacao = abrirNotificacao;
window.verificarAlertasOperacionais = verificarAlertasOperacionais;
