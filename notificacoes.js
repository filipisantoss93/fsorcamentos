let canalNotificacoes = null;
let notificacoesIniciadas = false;
let notificacoesCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!window._supabase) return;

  criarModalNotificacoes();

  const { data: { session } } = await _supabase.auth.getSession();

  if (session) {
    iniciarNotificacoes(session);
  }

  _supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      iniciarNotificacoes(session);
    } else {
      pararNotificacoes();
      atualizarSininhoNotificacoes(0);
    }
  });
});

async function iniciarNotificacoes(session) {
  if (!session?.user?.id) return;

 setTimeout(() => {
  mostrarSininhoNotificacoes(true);
}, 300);
  criarBotaoAtivarNotificacoes();

  await carregarNotificacoesRecentes(session.user.id);

  if (notificacoesIniciadas) return;

  notificacoesIniciadas = true;

  canalNotificacoes = _supabase
    .channel('notificacoes-orcamentos')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `usuario_id=eq.${session.user.id}`
      },
      async payload => {
        const notificacao = payload.new;

        notificacoesCache.unshift(notificacao);
        notificacoesCache = notificacoesCache.slice(0, 15);

        await atualizarContadorNaoLidas(session.user.id);

        mostrarToastNotificacao(notificacao);
        mostrarNotificacaoNavegador(notificacao);
      }
    )
    .subscribe(status => {
      console.log('Canal de notificações:', status);
    });
}

function pararNotificacoes() {
  notificacoesIniciadas = false;
  mostrarSininhoNotificacoes(false);

  if (canalNotificacoes && window._supabase) {
    _supabase.removeChannel(canalNotificacoes);
  }

  canalNotificacoes = null;
  notificacoesCache = [];
}

function mostrarSininhoNotificacoes(exibir) {
  const btn = document.getElementById('btn-notificacoes');

  if (btn) {
    btn.style.display = exibir ? 'inline-flex' : 'none';
  }
}

async function carregarNotificacoesRecentes(usuarioId) {
  if (!window._supabase || !usuarioId) return;

  const { data, error } = await _supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Erro ao carregar notificações:', error);
    return;
  }

  notificacoesCache = data || [];

  await atualizarContadorNaoLidas(usuarioId);
  renderizarListaNotificacoes();
}

async function atualizarContadorNaoLidas(usuarioId) {
  if (!window._supabase || !usuarioId) return;

  const { count, error } = await _supabase
    .from('notificacoes')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('lida', false);

  if (error) {
    console.error('Erro ao contar notificações:', error);
    return;
  }

  atualizarSininhoNotificacoes(count || 0);
}

function atualizarSininhoNotificacoes(qtd) {
  const contador = document.getElementById('contador-notificacoes');

  if (!contador) return;

  if (qtd > 0) {
    contador.innerText = qtd > 99 ? '99+' : String(qtd);
    contador.style.display = 'inline-flex';
  } else {
    contador.innerText = '0';
    contador.style.display = 'none';
  }
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
          <span>Acompanhe aprovações e recusas dos seus orçamentos.</span>
        </div>

        <button type="button" onclick="fecharModalNotificacoes()">×</button>
      </div>

      <div id="lista-notificacoes" class="lista-notificacoes">
        <div class="notificacao-vazia">Carregando notificações...</div>
      </div>

      <div class="notificacoes-acoes">
        <button type="button" onclick="marcarTodasNotificacoesComoLidas()">
          Marcar todas como lidas
        </button>

        <a href="/orcamentos.html">
          Ver orçamentos
        </a>
      </div>
    </div>
  `;

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      fecharModalNotificacoes();
    }
  });

  document.body.appendChild(modal);
}

async function abrirModalNotificacoes() {
  criarModalNotificacoes();

  const modal = document.getElementById('modal-notificacoes');

  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  const { data: { session } } = await _supabase.auth.getSession();

  if (session?.user?.id) {
    await carregarNotificacoesRecentes(session.user.id);
  }

  renderizarListaNotificacoes();
}

function fecharModalNotificacoes() {
  const modal = document.getElementById('modal-notificacoes');

  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function renderizarListaNotificacoes() {
  const lista = document.getElementById('lista-notificacoes');

  if (!lista) return;

  if (!notificacoesCache.length) {
    lista.innerHTML = `
      <div class="notificacao-vazia">
        Nenhuma notificação recente.
      </div>
    `;
    return;
  }

  lista.innerHTML = notificacoesCache.map(notificacao => {
    const tipo = notificacao.tipo || 'info';
    const classeTipo =
      tipo === 'aprovado'
        ? 'notificacao-aprovado'
        : tipo === 'recusado'
          ? 'notificacao-recusado'
          : 'notificacao-info';

    const icone =
      tipo === 'aprovado'
        ? '✅'
        : tipo === 'recusado'
          ? '❌'
          : '🔔';

    const classeLida = notificacao.lida ? 'lida' : 'nao-lida';

    return `
      <div class="notificacao-item ${classeTipo} ${classeLida}">
        <div class="notificacao-icone">${icone}</div>

        <div class="notificacao-conteudo">
          <strong>${escaparHtmlNotificacao(notificacao.titulo)}</strong>
          <p>${escaparHtmlNotificacao(notificacao.mensagem)}</p>
          <small>${formatarDataNotificacao(notificacao.criado_em)}</small>
        </div>

        ${
          notificacao.orcamento_id
            ? `<button type="button" onclick="abrirOrcamentoDaNotificacao('${notificacao.orcamento_id}')">Abrir</button>`
            : ''
        }
      </div>
    `;
  }).join('');
}

async function marcarTodasNotificacoesComoLidas() {
  const { data: { session } } = await _supabase.auth.getSession();

  if (!session?.user?.id) return;

  const { error } = await _supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', session.user.id)
    .eq('lida', false);

  if (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    alert('Não foi possível marcar as notificações como lidas.');
    return;
  }

  notificacoesCache = notificacoesCache.map(n => ({
    ...n,
    lida: true
  }));

  atualizarSininhoNotificacoes(0);
  renderizarListaNotificacoes();
}

async function abrirOrcamentoDaNotificacao(orcamentoId) {
  await marcarNotificacaoComoLidaPorOrcamento(orcamentoId);

  window.location.href = `/orcamentos.html?orcamento=${encodeURIComponent(orcamentoId)}`;
}

async function marcarNotificacaoComoLidaPorOrcamento(orcamentoId) {
  const { data: { session } } = await _supabase.auth.getSession();

  if (!session?.user?.id || !orcamentoId) return;

  await _supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', session.user.id)
    .eq('orcamento_id', orcamentoId);

  notificacoesCache = notificacoesCache.map(n => {
    if (n.orcamento_id === orcamentoId) {
      return {
        ...n,
        lida: true
      };
    }

    return n;
  });

  await atualizarContadorNaoLidas(session.user.id);
}

function criarBotaoAtivarNotificacoes() {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') return;

  if (document.getElementById('btn-ativar-notificacoes')) return;

  const botao = document.createElement('button');
  botao.id = 'btn-ativar-notificacoes';
  botao.type = 'button';
  botao.innerText = '🔔 Ativar notificações';

  botao.style.position = 'fixed';
  botao.style.right = '18px';
  botao.style.bottom = '18px';
  botao.style.zIndex = '16000';
  botao.style.background = '#ffc400';
  botao.style.color = '#3e2723';
  botao.style.border = '2px solid #3e2723';
  botao.style.borderRadius = '999px';
  botao.style.padding = '11px 16px';
  botao.style.fontWeight = '900';
  botao.style.cursor = 'pointer';
  botao.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)';

  botao.onclick = solicitarPermissaoNotificacoes;

  document.body.appendChild(botao);
}

async function solicitarPermissaoNotificacoes() {
  if (!('Notification' in window)) {
    alert('Este navegador não suporta notificações.');
    return;
  }

  const permissao = await Notification.requestPermission();

  if (permissao === 'granted') {
    const botao = document.getElementById('btn-ativar-notificacoes');

    if (botao) {
      botao.remove();
    }

    new Notification('FS Orçamentos', {
      body: 'Notificações ativadas com sucesso.',
      icon: '/favicon.png'
    });
  } else {
    alert('As notificações não foram ativadas. Você pode permitir depois nas configurações do navegador.');
  }
}

function mostrarToastNotificacao(notificacao) {
  const antigo = document.getElementById('toast-notificacao-orcamento');

  if (antigo) {
    antigo.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'toast-notificacao-orcamento';

  const cor =
    notificacao.tipo === 'aprovado'
      ? '#28a745'
      : notificacao.tipo === 'recusado'
        ? '#dc2626'
        : '#3e2723';

  toast.innerHTML = `
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <div style="
        width:38px;
        height:38px;
        border-radius:50%;
        background:${cor};
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        flex-shrink:0;
      ">
        ${notificacao.tipo === 'aprovado' ? '✓' : notificacao.tipo === 'recusado' ? '×' : '!'}
      </div>

      <div style="flex:1;">
        <strong style="display:block; margin-bottom:4px; color:#3e2723;">
          ${escaparHtmlNotificacao(notificacao.titulo)}
        </strong>

        <span style="display:block; color:#5d4037; font-size:14px; line-height:1.35;">
          ${escaparHtmlNotificacao(notificacao.mensagem)}
        </span>

        <button type="button" onclick="abrirOrcamentosDaNotificacao()" style="
          margin-top:10px;
          background:#3e2723;
          color:#ffc400;
          border:1px solid #ffc400;
          padding:7px 11px;
          border-radius:8px;
          font-weight:800;
          cursor:pointer;
        ">
          Ver orçamentos
        </button>
      </div>

      <button type="button" onclick="fecharToastNotificacao()" style="
        background:transparent;
        border:none;
        color:#3e2723;
        font-size:22px;
        font-weight:bold;
        cursor:pointer;
        line-height:1;
      ">
        ×
      </button>
    </div>
  `;

  toast.style.position = 'fixed';
  toast.style.right = '18px';
  toast.style.top = '90px';
  toast.style.width = 'min(420px, calc(100vw - 36px))';
  toast.style.background = '#fffaf0';
  toast.style.border = '2px solid #ffc400';
  toast.style.borderLeft = `8px solid ${cor}`;
  toast.style.borderRadius = '16px';
  toast.style.padding = '14px';
  toast.style.zIndex = '17000';
  toast.style.boxShadow = '0 16px 45px rgba(0,0,0,0.35)';

  document.body.appendChild(toast);

  setTimeout(() => {
    fecharToastNotificacao();
  }, 9000);
}

function fecharToastNotificacao() {
  const toast = document.getElementById('toast-notificacao-orcamento');

  if (toast) {
    toast.remove();
  }
}

function abrirOrcamentosDaNotificacao() {
  window.location.href = '/orcamentos.html';
}

function mostrarNotificacaoNavegador(notificacao) {
  if (!('Notification' in window)) return;

  if (Notification.permission !== 'granted') return;

  const n = new Notification(notificacao.titulo || 'FS Orçamentos', {
    body: notificacao.mensagem || 'Houve uma alteração em um orçamento.',
    icon: '/favicon.png',
    badge: '/favicon.png'
  });

  n.onclick = () => {
    window.focus();
    window.location.href = '/orcamentos.html';
  };
}

function formatarDataNotificacao(dataValor) {
  if (!dataValor) return '';

  const data = new Date(dataValor);

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
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    fecharModalNotificacoes();
  }
});

window.abrirModalNotificacoes = abrirModalNotificacoes;
window.fecharModalNotificacoes = fecharModalNotificacoes;