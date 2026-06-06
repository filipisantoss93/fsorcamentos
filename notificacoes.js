// ==================== NOTIFICACOES.JS ====================
// FS Orçamentos - Notificações em tempo real
// Usa o sininho já existente no header.html:
//
// <button id="btn-notificacoes" onclick="abrirModalNotificacoes()">
//   🔔
//   <span id="contador-notificacoes">0</span>
// </button>
//
// Dependências:
// - Supabase carregado em config.js
// - window._supabase disponível
// - Tabela public.notificacoes
// - header.html contendo btn-notificacoes e contador-notificacoes

const LIMITE_NOTIFICACOES = 10;

let canalNotificacoes = null;
let notificacoesIniciadas = false;
let notificacoesCache = [];

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  if (!window._supabase) {
    console.warn('Supabase não carregado. Notificações desativadas.');
    return;
  }

  criarModalNotificacoes();
  garantirEstiloNotificacoes();

  const { data: { session } } = await _supabase.auth.getSession();

  if (session?.user?.id) {
    await iniciarNotificacoes(session);
  } else {
    pararNotificacoes();
  }

  _supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user?.id) {
      await iniciarNotificacoes(session);
      return;
    }

    pararNotificacoes();
  });
});

// ==================== CONTROLE PRINCIPAL ====================

async function iniciarNotificacoes(session) {
  if (!session?.user?.id) return;

  mostrarSininhoNotificacoes(true);
  criarBotaoAtivarNotificacoes();

  await carregarNotificacoesRecentes(session.user.id);

  if (notificacoesIniciadas) return;

  notificacoesIniciadas = true;

  canalNotificacoes = _supabase
    .channel(`notificacoes-orcamentos-${session.user.id}`)
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
        notificacoesCache = notificacoesCache.slice(0, LIMITE_NOTIFICACOES);

        atualizarContadorNaoLidasPeloCache();
        renderizarListaNotificacoes();

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
  atualizarSininhoNotificacoes(0);

  if (canalNotificacoes && window._supabase) {
    _supabase.removeChannel(canalNotificacoes);
  }

  canalNotificacoes = null;
  notificacoesCache = [];
}

// ==================== SININHO DO HEADER ====================

function mostrarSininhoNotificacoes(exibir) {
  const btn = document.getElementById('btn-notificacoes');

  if (!btn) {
    console.warn('Botão #btn-notificacoes não encontrado no header.');
    return;
  }

  btn.style.display = exibir ? 'inline-flex' : 'none';
}

function atualizarSininhoNotificacoes(qtd) {
  const contador = document.getElementById('contador-notificacoes');

  if (!contador) {
    console.warn('Contador #contador-notificacoes não encontrado no header.');
    return;
  }

  const numero = Math.min(Number(qtd || 0), 99);

  if (numero > 0) {
    contador.innerText = numero >= 99 ? '99+' : String(numero);
    contador.style.display = 'inline-flex';
  } else {
    contador.innerText = '0';
    contador.style.display = 'none';
  }
}

function atualizarContadorNaoLidasPeloCache() {
  const qtdNaoLidas = notificacoesCache
    .slice(0, LIMITE_NOTIFICACOES)
    .filter(n => !n.lida)
    .length;

  atualizarSininhoNotificacoes(qtdNaoLidas);
}

// ==================== BUSCAR NOTIFICAÇÕES ====================

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

async function atualizarContadorNaoLidas(usuarioId) {
  if (!window._supabase || !usuarioId) return;

  const { data, error } = await _supabase
    .from('notificacoes')
    .select('id, lida')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(LIMITE_NOTIFICACOES);

  if (error) {
    console.error('Erro ao contar notificações:', error);
    return;
  }

  const qtdNaoLidas = (data || []).filter(n => !n.lida).length;

  atualizarSininhoNotificacoes(qtdNaoLidas);
}

// ==================== MODAL DE NOTIFICAÇÕES ====================

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
          <span>Acompanhe aprovações, recusas e avisos importantes.</span>
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

  if (!window._supabase) return;

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

  const notificacoesLimitadas = notificacoesCache.slice(0, LIMITE_NOTIFICACOES);

  if (!notificacoesLimitadas.length) {
    lista.innerHTML = `
      <div class="notificacao-vazia">
        Nenhuma notificação recente.
      </div>
    `;
    return;
  }

  lista.innerHTML = notificacoesLimitadas.map(notificacao => {
    const tipo = normalizarTipoNotificacao(notificacao.tipo);
    const classeTipo = obterClasseNotificacao(tipo);
    const icone = obterIconeNotificacao(tipo);
    const classeLida = notificacao.lida ? 'lida' : 'nao-lida';

    return `
      <div class="notificacao-item ${classeTipo} ${classeLida}">
        <div class="notificacao-icone">${icone}</div>

        <div class="notificacao-conteudo">
          <strong>${escaparHtmlNotificacao(notificacao.titulo || 'Notificação')}</strong>
          <p>${escaparHtmlNotificacao(notificacao.mensagem || '')}</p>
          <small>${formatarDataNotificacao(notificacao.criado_em)}</small>
        </div>

        ${
          notificacao.orcamento_id
            ? `
              <button type="button" onclick="abrirOrcamentoDaNotificacao('${notificacao.orcamento_id}')">
                Abrir
              </button>
            `
            : ''
        }
      </div>
    `;
  }).join('');
}

// ==================== MARCAR COMO LIDA ====================

async function marcarTodasNotificacoesComoLidas() {
  if (!window._supabase) return;

  const { data: { session } } = await _supabase.auth.getSession();

  if (!session?.user?.id) return;

  const idsVisiveis = notificacoesCache
    .slice(0, LIMITE_NOTIFICACOES)
    .filter(n => !n.lida)
    .map(n => n.id)
    .filter(Boolean);

  if (!idsVisiveis.length) {
    atualizarSininhoNotificacoes(0);
    renderizarListaNotificacoes();
    return;
  }

  const { error } = await _supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', session.user.id)
    .in('id', idsVisiveis);

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
  if (!window._supabase || !orcamentoId) return;

  const { data: { session } } = await _supabase.auth.getSession();

  if (!session?.user?.id) return;

  const idsVisiveisDoOrcamento = notificacoesCache
    .slice(0, LIMITE_NOTIFICACOES)
    .filter(n => n.orcamento_id === orcamentoId && !n.lida)
    .map(n => n.id)
    .filter(Boolean);

  if (!idsVisiveisDoOrcamento.length) return;

  await _supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', session.user.id)
    .in('id', idsVisiveisDoOrcamento);

  notificacoesCache = notificacoesCache.map(n => {
    if (n.orcamento_id === orcamentoId) {
      return {
        ...n,
        lida: true
      };
    }

    return n;
  });

  atualizarContadorNaoLidasPeloCache();
}

// ==================== NOTIFICAÇÃO DO NAVEGADOR ====================

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
  botao.style.bottom = '90px';
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

    return;
  }

  alert('As notificações não foram ativadas. Você pode permitir depois nas configurações do navegador.');
}

function mostrarNotificacaoNavegador(notificacao) {
  if (!('Notification' in window)) return;

  if (Notification.permission !== 'granted') return;

  const n = new Notification(notificacao.titulo || 'FS Orçamentos', {
    body: notificacao.mensagem || 'Houve uma atualização em um orçamento.',
    icon: '/favicon.png',
    badge: '/favicon.png'
  });

  n.onclick = () => {
    window.focus();

    if (notificacao.orcamento_id) {
      window.location.href = `/orcamentos.html?orcamento=${encodeURIComponent(notificacao.orcamento_id)}`;
    } else {
      window.location.href = '/orcamentos.html';
    }
  };
}

// ==================== TOAST ====================

function mostrarToastNotificacao(notificacao) {
  const antigo = document.getElementById('toast-notificacao-orcamento');

  if (antigo) {
    antigo.remove();
  }

  const tipo = normalizarTipoNotificacao(notificacao.tipo);

  const cor =
    tipo === 'aprovado'
      ? '#28a745'
      : tipo === 'recusado'
        ? '#dc2626'
        : tipo === 'pix'
          ? '#2563eb'
          : '#3e2723';

  const icone =
    tipo === 'aprovado'
      ? '✓'
      : tipo === 'recusado'
        ? '×'
        : tipo === 'pix'
          ? 'P'
          : '!';

  const toast = document.createElement('div');
  toast.id = 'toast-notificacao-orcamento';

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
        ${icone}
      </div>

      <div style="flex:1;">
        <strong style="display:block; margin-bottom:4px; color:#3e2723;">
          ${escaparHtmlNotificacao(notificacao.titulo || 'Notificação')}
        </strong>

        <span style="display:block; color:#5d4037; font-size:14px; line-height:1.35;">
          ${escaparHtmlNotificacao(notificacao.mensagem || '')}
        </span>

        ${
          notificacao.orcamento_id
            ? `
              <button type="button" onclick="abrirOrcamentoDaNotificacao('${notificacao.orcamento_id}')" style="
                margin-top:10px;
                background:#3e2723;
                color:#ffc400;
                border:1px solid #ffc400;
                padding:7px 11px;
                border-radius:8px;
                font-weight:800;
                cursor:pointer;
              ">
                Abrir orçamento
              </button>
            `
            : `
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
            `
        }
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

// ==================== HELPERS ====================

function normalizarTipoNotificacao(tipo) {
  return String(tipo || 'info')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function obterClasseNotificacao(tipo) {
  if (tipo === 'aprovado') return 'notificacao-aprovado';
  if (tipo === 'recusado') return 'notificacao-recusado';
  if (tipo === 'pix') return 'notificacao-pix';

  return 'notificacao-info';
}

function obterIconeNotificacao(tipo) {
  if (tipo === 'aprovado') return '✅';
  if (tipo === 'recusado') return '❌';
  if (tipo === 'pix') return '💠';

  return '🔔';
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

// ==================== CSS DO MODAL ====================

function garantirEstiloNotificacoes() {
  if (document.getElementById('style-notificacoes-fs')) return;

  const style = document.createElement('style');
  style.id = 'style-notificacoes-fs';

  style.innerHTML = `
    .btn-notificacoes-header {
      position: relative;
      border: 1px solid rgba(255, 196, 0, 0.55);
      background: rgba(255, 196, 0, 0.12);
      color: #ffc400;
      border-radius: 999px;
      width: 38px;
      height: 38px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: .2s ease;
    }

    .btn-notificacoes-header:hover {
      background: rgba(255, 196, 0, 0.24);
      transform: translateY(-1px);
    }

    .contador-notificacoes {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 19px;
      height: 19px;
      padding: 0 5px;
      background: #dc2626;
      color: #ffffff;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      align-items: center;
      justify-content: center;
      border: 2px solid #3e2723;
      line-height: 1;
    }

    .modal-notificacoes-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.72);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      padding: 18px;
    }

    .modal-notificacoes-card {
      width: min(100%, 560px);
      max-height: 90vh;
      overflow-y: auto;
      background: #f4ece1;
      color: #3e2723;
      border-radius: 18px;
      border-top: 6px solid #ffc400;
      box-shadow: 0 24px 70px rgba(0,0,0,0.55);
    }

    .modal-notificacoes-topo {
      background: #3e2723;
      color: #ffc400;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .modal-notificacoes-topo strong {
      display: block;
      font-size: 20px;
      margin-bottom: 3px;
    }

    .modal-notificacoes-topo span {
      display: block;
      color: #f4ece1;
      font-size: 13px;
      line-height: 1.35;
    }

    .modal-notificacoes-topo button {
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 9px;
      width: 34px;
      height: 34px;
      font-size: 22px;
      font-weight: 900;
      cursor: pointer;
      flex-shrink: 0;
    }

    .lista-notificacoes {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .notificacao-vazia {
      background: #fff8e1;
      color: #5d4037;
      border-left: 5px solid #ffc400;
      border-radius: 12px;
      padding: 14px;
      font-weight: 800;
      text-align: center;
    }

    .notificacao-item {
      display: grid;
      grid-template-columns: 42px 1fr auto;
      gap: 12px;
      align-items: start;
      background: #ffffff;
      border-radius: 14px;
      padding: 13px;
      border-left: 6px solid #3e2723;
      box-shadow: 0 6px 18px rgba(0,0,0,0.10);
    }

    .notificacao-item.nao-lida {
      background: #fffaf0;
      border-color: #ffc400;
    }

    .notificacao-item.lida {
      opacity: .75;
    }

    .notificacao-aprovado {
      border-left-color: #28a745;
    }

    .notificacao-recusado {
      border-left-color: #dc2626;
    }

    .notificacao-pix {
      border-left-color: #2563eb;
    }

    .notificacao-info {
      border-left-color: #3e2723;
    }

    .notificacao-icone {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #f4ece1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .notificacao-conteudo strong {
      display: block;
      color: #3e2723;
      margin-bottom: 4px;
      font-size: 15px;
    }

    .notificacao-conteudo p {
      margin: 0 0 5px;
      color: #5d4037;
      font-size: 14px;
      line-height: 1.35;
    }

    .notificacao-conteudo small {
      color: #8d6e63;
      font-size: 12px;
      font-weight: 700;
    }

    .notificacao-item button {
      background: #3e2723;
      color: #ffc400;
      border: 1px solid #ffc400;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      white-space: nowrap;
    }

    .notificacoes-acoes {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid #e0d6c8;
      background: #fffaf0;
      flex-wrap: wrap;
    }

    .notificacoes-acoes button,
    .notificacoes-acoes a {
      flex: 1;
      text-align: center;
      background: #ffc400;
      color: #3e2723;
      border: 2px solid #3e2723;
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
      font-size: 13px;
    }

    .notificacoes-acoes a {
      background: #3e2723;
      color: #ffc400;
      border-color: #ffc400;
    }

    @media (max-width: 560px) {
      .notificacao-item {
        grid-template-columns: 36px 1fr;
      }

      .notificacao-item button {
        grid-column: 1 / -1;
        width: 100%;
      }

      .notificacoes-acoes {
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(style);
}

// ==================== EVENTOS GLOBAIS ====================

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    fecharModalNotificacoes();
  }
});

async function verificarLembretesOrcamentosPendentes24h() {
    try {
        if (!window._supabase) return;

        const { data: { session }, error: erroSessao } = await _supabase.auth.getSession();

        if (erroSessao || !session?.user?.id) return;

        const usuarioId = session.user.id;

        const dataLimite = new Date();
        dataLimite.setHours(dataLimite.getHours() - 24);

        const { data: orcamentosPendentes, error } = await _supabase
            .from('orcamentos')
            .select('id, titulo, cliente_nome, status, criado_em, lembrete_24h_enviado_em')
            .eq('usuario_id', usuarioId)
            .eq('status', 'pendente')
            .lte('criado_em', dataLimite.toISOString())
            .is('lembrete_24h_enviado_em', null);

        if (error) {
            console.warn('Erro ao buscar orçamentos pendentes para lembrete:', error);
            return;
        }

        if (!orcamentosPendentes || !orcamentosPendentes.length) return;

        for (const orcamento of orcamentosPendentes) {
            const cliente = orcamento.cliente_nome || 'cliente';
            const titulo = orcamento.titulo || 'orçamento pendente';

            await _supabase
                .from('notificacoes')
                .insert({
                    usuario_id: usuarioId,
                    orcamento_id: orcamento.id,
                    tipo: 'lembrete_orcamento',
                    titulo: 'Orçamento pendente há 24h',
                    mensagem: `O orçamento "${titulo}" para ${cliente} ainda está pendente. Talvez seja hora de chamar o cliente.`,
                    link: `orcamentos.html?id=${orcamento.id}`,
                    lida: false
                });

            await _supabase
                .from('orcamentos')
                .update({
                    lembrete_24h_enviado_em: new Date().toISOString()
                })
                .eq('id', orcamento.id)
                .eq('usuario_id', usuarioId);
        }

        if (typeof carregarNotificacoes === 'function') {
            carregarNotificacoes();
        }

    } catch (e) {
        console.warn('Erro geral ao verificar lembretes de orçamento:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(verificarLembretesOrcamentosPendentes24h, 1500);
});

// ==================== EXPORTAÇÕES GLOBAIS ====================

window.abrirModalNotificacoes = abrirModalNotificacoes;
window.fecharModalNotificacoes = fecharModalNotificacoes;
window.marcarTodasNotificacoesComoLidas = marcarTodasNotificacoesComoLidas;
window.abrirOrcamentoDaNotificacao = abrirOrcamentoDaNotificacao;
window.fecharToastNotificacao = fecharToastNotificacao;
window.abrirOrcamentosDaNotificacao = abrirOrcamentosDaNotificacao;
window.solicitarPermissaoNotificacoes = solicitarPermissaoNotificacoes;
