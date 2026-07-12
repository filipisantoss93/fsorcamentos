// ==================== NOTIFICACOES.JS ====================
// FS Orçamentos - Central de notificações segura.
// Não roda dentro de módulos embed/iframe para evitar travamento.

(function () {
  'use strict';

  function fsNotificacoesModoEmbed() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('embed') === '1' || params.get('iframe') === '1' || document.documentElement.classList.contains('fs-embed') || window.parent !== window;
    } catch (_) {
      return false;
    }
  }

  if (fsNotificacoesModoEmbed()) {
    window.abrirModalNotificacoes = function () {};
    window.fecharModalNotificacoes = function () {};
    window.marcarTodasNotificacoesComoLidas = async function () {};
    window.limparNotificacoes = async function () {};
    return;
  }

  const LIMITE_NOTIFICACOES = 20;
  let canalNotificacoes = null;
  let notificacoesIniciadas = false;
  let usuarioNotificacoesAtual = null;
  let notificacoesCache = [];
  let totalNaoLidas = 0;
  let overflowBodyAnterior = '';
  let elementoFocoAnterior = null;

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
    }).catch(() => pararNotificacoes());

    _supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) await iniciarNotificacoes(session);
      else pararNotificacoes();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fsNotificacoesInit);
  else fsNotificacoesInit();

  async function iniciarNotificacoes(session) {
    const usuarioId = session?.user?.id;
    if (!usuarioId) return;

    mostrarSininhoNotificacoes(true);
    criarBotaoAtivarNotificacoes();

    if (notificacoesIniciadas && usuarioNotificacoesAtual === usuarioId) {
      await Promise.all([
        carregarNotificacoesRecentes(usuarioId),
        atualizarContadorNaoLidas(usuarioId)
      ]);
      return;
    }

    pararCanalNotificacoes();
    usuarioNotificacoesAtual = usuarioId;
    notificacoesIniciadas = true;

    await Promise.all([
      carregarNotificacoesRecentes(usuarioId),
      atualizarContadorNaoLidas(usuarioId)
    ]);

    try {
      canalNotificacoes = _supabase
        .channel(`notificacoes-${usuarioId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${usuarioId}`
        }, payload => tratarEventoRealtime(payload, usuarioId))
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('Canal de notificações indisponível:', status);
          }
        });
    } catch (erro) {
      console.warn('Notificações realtime indisponíveis:', erro);
    }
  }

  function tratarEventoRealtime(payload, usuarioId) {
    const tipoEvento = payload?.eventType;

    if (tipoEvento === 'INSERT' && payload.new) {
      const notificacao = payload.new;
      notificacoesCache = [
        notificacao,
        ...notificacoesCache.filter(n => String(n.id) !== String(notificacao.id))
      ].slice(0, LIMITE_NOTIFICACOES);

      if (!notificacao.lida) totalNaoLidas += 1;
      atualizarSininhoNotificacoes(totalNaoLidas);
      renderizarListaNotificacoes();
      mostrarToastNotificacao(notificacao);
      mostrarNotificacaoNavegador(notificacao);
      return;
    }

    if (tipoEvento === 'UPDATE' && payload.new) {
      const atual = payload.new;

      notificacoesCache = notificacoesCache.map(n =>
        String(n.id) === String(atual.id) ? { ...n, ...atual } : n
      );

      renderizarListaNotificacoes();
      atualizarContadorNaoLidas(usuarioId);
      return;
    }

    if (tipoEvento === 'DELETE' && payload.old) {
      notificacoesCache = notificacoesCache.filter(n => String(n.id) !== String(payload.old.id));
      renderizarListaNotificacoes();
      atualizarContadorNaoLidas(usuarioId);
      return;
    }

    atualizarContadorNaoLidas(usuarioId);
  }

  function pararCanalNotificacoes() {
    if (canalNotificacoes && window._supabase) _supabase.removeChannel(canalNotificacoes);
    canalNotificacoes = null;
  }

  function pararNotificacoes() {
    notificacoesIniciadas = false;
    usuarioNotificacoesAtual = null;
    pararCanalNotificacoes();
    mostrarSininhoNotificacoes(false);
    atualizarSininhoNotificacoes(0);
    notificacoesCache = [];
    totalNaoLidas = 0;
    document.getElementById('btn-ativar-notificacoes')?.remove();
  }

  function mostrarSininhoNotificacoes(exibir) {
    const btn = document.getElementById('btn-notificacoes');
    if (btn) btn.style.display = exibir ? 'inline-flex' : 'none';
  }

  function atualizarSininhoNotificacoes(qtd) {
    const contador = document.getElementById('contador-notificacoes');
    if (!contador) return;
    const total = Math.max(0, Number(qtd || 0));
    contador.innerText = total >= 99 ? '99+' : String(total);
    contador.style.display = total > 0 ? 'inline-flex' : 'none';
    contador.setAttribute('aria-label', `${total} notificação${total === 1 ? '' : 'ões'} não lida${total === 1 ? '' : 's'}`);
  }

  async function atualizarContadorNaoLidas(usuarioId) {
    if (!window._supabase || !usuarioId) return;
    try {
      const { count, error } = await _supabase
        .from('notificacoes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('lida', false);

      if (error) {
        console.warn('Erro ao contar notificações não lidas:', error);
        return;
      }

      totalNaoLidas = Number(count || 0);
      atualizarSininhoNotificacoes(totalNaoLidas);
    } catch (erro) {
      console.warn('Falha ao contar notificações não lidas:', erro);
    }
  }

  async function carregarNotificacoesRecentes(usuarioId) {
    if (!window._supabase || !usuarioId) return;
    try {
      const { data, error } = await _supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .limit(LIMITE_NOTIFICACOES);

      if (error) {
        console.warn('Erro ao carregar notificações:', error);
        return;
      }

      notificacoesCache = data || [];
      renderizarListaNotificacoes();
    } catch (erro) {
      console.warn('Falha ao carregar notificações:', erro);
    }
  }

  function criarModalNotificacoes() {
    if (document.getElementById('modal-notificacoes')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-notificacoes';
    modal.className = 'modal-notificacoes-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-notificacoes-card" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-notificacoes">
        <div class="modal-notificacoes-topo">
          <div><strong id="titulo-modal-notificacoes">Notificações</strong><span>Avisos recentes da plataforma.</span></div>
          <button type="button" class="notificacoes-fechar" aria-label="Fechar notificações">×</button>
        </div>
        <div id="lista-notificacoes" class="lista-notificacoes"><div class="notificacao-vazia">Carregando notificações...</div></div>
        <div class="notificacoes-acoes">
          <button type="button" class="notificacoes-link-acao" data-acao-notificacao="marcar-todas">Marcar todas como lidas</button>
          <button type="button" class="notificacoes-link-acao limpar" data-acao-notificacao="limpar">Limpar notificações</button>
        </div>
      </div>`;

    modal.addEventListener('click', event => {
      if (event.target === modal) fecharModalNotificacoes();

      const fechar = event.target.closest('.notificacoes-fechar');
      if (fechar) fecharModalNotificacoes();

      const acao = event.target.closest('[data-acao-notificacao]')?.dataset.acaoNotificacao;
      if (acao === 'marcar-todas') marcarTodasNotificacoesComoLidas();
      if (acao === 'limpar') limparNotificacoes();
    });

    document.body.appendChild(modal);
  }

  async function abrirModalNotificacoes() {
    criarModalNotificacoes();
    garantirEstiloNotificacoes();

    const modal = document.getElementById('modal-notificacoes');
    if (modal) {
      elementoFocoAnterior = document.activeElement;
      overflowBodyAnterior = document.body.style.overflow;
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.notificacoes-fechar')?.focus();
    }

    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session?.user?.id) {
        await Promise.all([
          carregarNotificacoesRecentes(session.user.id),
          atualizarContadorNaoLidas(session.user.id)
        ]);
      }
    } catch (erro) {
      console.warn('Falha ao abrir notificações:', erro);
    }

    renderizarListaNotificacoes();
  }

  function fecharModalNotificacoes() {
    const modal = document.getElementById('modal-notificacoes');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = overflowBodyAnterior;
    if (elementoFocoAnterior instanceof HTMLElement) elementoFocoAnterior.focus();
    elementoFocoAnterior = null;
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
          <thead><tr><th>Status</th><th>Notificação</th><th>Data</th><th>Ação</th></tr></thead>
          <tbody>${notificacoesCache.map(n => {
            const tipo = normalizarTipoNotificacao(n.tipo);
            const classeTipo = obterClasseNotificacao(tipo);
            const icone = obterIconeNotificacao(tipo);
            const classeLida = n.lida ? 'lida' : 'nao-lida';
            const link = obterLinkNotificacao(n);
            const id = escaparHtmlNotificacao(n.id);
            return `<tr class="notificacao-linha ${classeTipo} ${classeLida}" data-notificacao-id="${id}" tabindex="0" role="button" aria-label="${escaparHtmlNotificacao(`${n.lida ? 'Lida' : 'Nova'}: ${n.titulo || 'Notificação'}`)}"><td class="notificacao-status"><span>${n.lida ? 'Lida' : 'Nova'}</span></td><td class="notificacao-texto"><strong>${icone} ${escaparHtmlNotificacao(n.titulo || 'Notificação')}</strong><small>${escaparHtmlNotificacao(n.mensagem || '')}</small></td><td class="notificacao-data">${formatarDataNotificacao(n.criado_em)}</td><td class="notificacao-acao">${link ? '<button type="button" tabindex="-1">Abrir</button>' : '<span>-</span>'}</td></tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;

    lista.onclick = event => {
      const linha = event.target.closest('[data-notificacao-id]');
      if (linha) abrirNotificacao(linha.dataset.notificacaoId);
    };

    lista.onkeydown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const linha = event.target.closest('[data-notificacao-id]');
      if (!linha) return;
      event.preventDefault();
      abrirNotificacao(linha.dataset.notificacaoId);
    };
  }

  async function marcarTodasNotificacoesComoLidas() {
    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { error } = await _supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', session.user.id)
        .eq('lida', false);

      if (error) {
        console.warn('Erro ao marcar todas as notificações como lidas:', error);
        alert('Não foi possível marcar as notificações como lidas.');
        return;
      }

      notificacoesCache = notificacoesCache.map(n => ({ ...n, lida: true }));
      totalNaoLidas = 0;
      atualizarSininhoNotificacoes(0);
      renderizarListaNotificacoes();
    } catch (erro) {
      console.warn('Falha ao marcar todas as notificações como lidas:', erro);
      alert('Não foi possível marcar as notificações como lidas.');
    }
  }

  async function limparNotificacoes() {
    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) return;
      if (!confirm('Limpar todas as notificações?')) return;

      const { error } = await _supabase
        .from('notificacoes')
        .delete()
        .eq('usuario_id', session.user.id);

      if (error) {
        console.warn('Erro ao limpar notificações:', error);
        alert('Não foi possível limpar as notificações.');
        return;
      }

      notificacoesCache = [];
      totalNaoLidas = 0;
      atualizarSininhoNotificacoes(0);
      renderizarListaNotificacoes();
    } catch (erro) {
      console.warn('Falha ao limpar notificações:', erro);
      alert('Não foi possível limpar as notificações.');
    }
  }

  async function abrirNotificacao(id) {
    const notificacao = notificacoesCache.find(n => String(n.id) === String(id));
    if (!notificacao) return;

    await marcarNotificacaoComoLida(notificacao.id);

    const link = obterLinkNotificacao(notificacao);
    if (link) window.location.assign(link);
  }

  async function marcarNotificacaoComoLida(id) {
    if (!id) return false;

    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) return false;

      const notificacaoAtual = notificacoesCache.find(n => String(n.id) === String(id));
      if (notificacaoAtual?.lida) return true;

      const { error } = await _supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', session.user.id)
        .eq('id', id);

      if (error) {
        console.warn('Erro ao marcar notificação como lida:', error);
        return false;
      }

      notificacoesCache = notificacoesCache.map(n =>
        String(n.id) === String(id) ? { ...n, lida: true } : n
      );
      totalNaoLidas = Math.max(0, totalNaoLidas - 1);
      atualizarSininhoNotificacoes(totalNaoLidas);
      renderizarListaNotificacoes();
      return true;
    } catch (erro) {
      console.warn('Falha ao marcar notificação como lida:', erro);
      return false;
    }
  }

  function normalizarLinkInterno(valor) {
    const link = String(valor || '').trim();
    if (!link) return '';

    const caminho = link.startsWith('/') ? link : `/${link.replace(/^\/+/, '')}`;
    if (caminho.startsWith('//')) return '';

    try {
      const url = new URL(caminho, window.location.origin);
      if (url.origin !== window.location.origin) return '';
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      return '';
    }
  }

  function obterLinkNotificacao(n) {
    const link = normalizarLinkInterno(n?.link);
    if (link) return link;
    if (n?.orcamento_id) return `/orcamentos.html?orcamento=${encodeURIComponent(n.orcamento_id)}`;
    if (n?.entidade_tipo === 'forum_topico' && n?.entidade_id) return `/forum.html#topico=${encodeURIComponent(n.entidade_id)}`;
    if (n?.entidade_tipo === 'ordem_servico' && n?.entidade_id) return `/ordem.html?id=${encodeURIComponent(n.entidade_id)}`;
    if (n?.entidade_tipo === 'estoque' && n?.entidade_id) return `/estoque.html?produto=${encodeURIComponent(n.entidade_id)}`;
    if (String(n?.tipo || '').includes('forum')) return '/forum.html';
    return '';
  }

  function criarBotaoAtivarNotificacoes() {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    if (document.getElementById('btn-ativar-notificacoes')) return;

    const botao = document.createElement('button');
    botao.id = 'btn-ativar-notificacoes';
    botao.type = 'button';
    botao.innerText = '🔔 Ativar avisos';
    botao.title = 'Receber avisos enquanto a plataforma estiver aberta';
    botao.style.cssText = 'position:fixed;right:18px;bottom:90px;z-index:16000;background:#374151;color:#fff;border:2px solid #111827;border-radius:999px;padding:11px 16px;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,.22)';
    botao.onclick = solicitarPermissaoNotificacoes;
    document.body.appendChild(botao);
  }

  async function solicitarPermissaoNotificacoes() {
    if (!('Notification' in window)) return alert('Este navegador não suporta notificações.');

    try {
      const permissao = await Notification.requestPermission();
      document.getElementById('btn-ativar-notificacoes')?.remove();

      if (permissao === 'granted') {
        new Notification('FS Orçamentos', {
          body: 'Avisos ativados enquanto a plataforma estiver aberta.',
          icon: '/favicon.png'
        });
      }
    } catch (erro) {
      console.warn('Não foi possível solicitar permissão para notificações:', erro);
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
      if (link) window.location.assign(link);
      notif.close();
    };
  }

  function mostrarToastNotificacao(n) {
    document.getElementById('toast-notificacao-orcamento')?.remove();

    const tipo = normalizarTipoNotificacao(n.tipo);
    const cor = tipo.includes('aprovado') ? '#16a34a' : tipo.includes('recusado') ? '#dc2626' : tipo.includes('forum') ? '#7c3aed' : tipo.includes('estoque') ? '#0891b2' : tipo.includes('agenda') ? '#f97316' : tipo.includes('os_') ? '#b45309' : tipo.includes('pix') ? '#2563eb' : '#374151';
    const toast = document.createElement('div');
    toast.id = 'toast-notificacao-orcamento';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<div style="display:flex;gap:12px;align-items:flex-start;"><div style="width:38px;height:38px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">${obterIconeNotificacao(tipo)}</div><div style="flex:1;"><strong style="display:block;margin-bottom:4px;color:#111827;">${escaparHtmlNotificacao(n.titulo || 'Notificação')}</strong><span style="display:block;color:#4b5563;font-size:14px;line-height:1.35;">${escaparHtmlNotificacao(n.mensagem || '')}</span><button type="button" data-toast-notificacao-id="${escaparHtmlNotificacao(n.id)}" style="margin-top:10px;background:#374151;color:#fff;border:1px solid #374151;padding:7px 11px;border-radius:8px;font-weight:800;cursor:pointer;">Abrir</button></div><button type="button" data-fechar-toast aria-label="Fechar aviso" style="background:transparent;border:none;color:#111827;font-size:22px;font-weight:bold;cursor:pointer;line-height:1;">×</button></div>`;
    toast.style.cssText = `position:fixed;right:18px;top:90px;width:min(420px,calc(100vw - 36px));background:#ffffff;border:2px solid #d1d5db;border-left:8px solid ${cor};border-radius:16px;padding:14px;z-index:17000;box-shadow:0 16px 45px rgba(15,23,42,.25)`;

    toast.addEventListener('click', event => {
      if (event.target.closest('[data-fechar-toast]')) fecharToastNotificacao();
      const abrir = event.target.closest('[data-toast-notificacao-id]');
      if (abrir) abrirNotificacao(abrir.dataset.toastNotificacaoId);
    });

    document.body.appendChild(toast);
    setTimeout(fecharToastNotificacao, 9000);
  }

  function fecharToastNotificacao() { document.getElementById('toast-notificacao-orcamento')?.remove(); }
  function normalizarTipoNotificacao(tipo) { return String(tipo || 'info').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  function obterClasseNotificacao(tipo) { if (tipo.includes('aprovado')) return 'notificacao-aprovado'; if (tipo.includes('recusado')) return 'notificacao-recusado'; if (tipo.includes('pix')) return 'notificacao-pix'; if (tipo.includes('forum')) return 'notificacao-forum'; if (tipo.includes('agenda')) return 'notificacao-agenda'; if (tipo.includes('estoque')) return 'notificacao-estoque'; if (tipo.includes('os_')) return 'notificacao-os'; return 'notificacao-info'; }
  function obterIconeNotificacao(tipo) { if (tipo.includes('aprovado')) return '✅'; if (tipo.includes('recusado')) return '❌'; if (tipo.includes('pix')) return '💠'; if (tipo.includes('forum_resposta')) return '💬'; if (tipo.includes('forum_curtida')) return '👍'; if (tipo.includes('forum_seguidor')) return '👥'; if (tipo.includes('agenda')) return '📅'; if (tipo.includes('estoque')) return '📦'; if (tipo.includes('os_') || tipo.includes('ordem')) return '🧾'; return '🔔'; }
  function formatarDataNotificacao(dataValor) { const data = new Date(dataValor || ''); if (isNaN(data.getTime())) return ''; return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function escaparHtmlNotificacao(valor) { return String(valor || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  function garantirEstiloNotificacoes() {
    if (document.getElementById('style-notificacoes-fs')) return;
    const style = document.createElement('style');
    style.id = 'style-notificacoes-fs';
    style.innerHTML = `
      .btn-notificacoes-header{position:relative;border:1px solid rgba(255,196,0,.55);background:rgba(255,196,0,.12);color:#ffc400;border-radius:999px;width:34px;height:34px;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:.2s ease}.btn-notificacoes-header:hover{background:rgba(255,196,0,.24);transform:translateY(-1px)}.contador-notificacoes{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;background:#dc2626;color:#fff;border-radius:999px;font-size:10px;font-weight:900;align-items:center;justify-content:center;border:2px solid #111827;line-height:1}.modal-notificacoes-overlay{position:fixed;inset:0;background:rgba(15,23,42,.62);display:none;align-items:center;justify-content:center;z-index:20000;padding:10px}.modal-notificacoes-card{width:min(720px,calc(100vw - 16px));max-height:76vh;display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#111827;border-radius:9px;border:1px solid #d1d5db;box-shadow:0 18px 50px rgba(15,23,42,.35)}.modal-notificacoes-topo{background:#1f2937;color:#fff;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-shrink:0}.modal-notificacoes-topo strong{display:block;font-size:15px;line-height:1.1;margin:0}.modal-notificacoes-topo span{display:block;color:#e5e7eb;font-size:10.5px;line-height:1.25;margin-top:2px;font-weight:650}.notificacoes-fechar{background:transparent;color:#fff;border:0;width:26px;height:26px;font-size:22px;font-weight:900;cursor:pointer;line-height:1}.lista-notificacoes{padding:0;overflow:auto;flex:1;min-height:110px;background:#fff}.notificacao-vazia{margin:8px;background:#f9fafb;color:#4b5563;border-left:3px solid #64748b;border-radius:5px;padding:8px;font-weight:800;text-align:center;font-size:12px}.notificacoes-tabela-wrap{width:100%;overflow:auto}.notificacoes-tabela{width:100%;border-collapse:collapse;min-width:620px;background:#fff}.notificacoes-tabela th{position:sticky;top:0;z-index:1;background:#f3f4f6;color:#111827;border-bottom:1px solid #e5e7eb;padding:5px 6px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.02em;font-weight:950;white-space:nowrap}.notificacoes-tabela td{border-bottom:1px solid #e5e7eb;padding:5px 6px;vertical-align:middle;font-size:11px;line-height:1.25;color:#111827}.notificacao-linha{cursor:pointer;background:#fff;border-left:3px solid #64748b}.notificacao-linha:hover,.notificacao-linha:focus{background:#f3f4f6;outline:2px solid #2563eb;outline-offset:-2px}.notificacao-linha.nao-lida{background:#f9fafb;font-weight:850}.notificacao-linha.lida{opacity:.72}.notificacao-aprovado{border-left-color:#16a34a}.notificacao-recusado{border-left-color:#dc2626}.notificacao-pix{border-left-color:#2563eb}.notificacao-forum{border-left-color:#7c3aed}.notificacao-agenda{border-left-color:#f97316}.notificacao-estoque{border-left-color:#0891b2}.notificacao-os{border-left-color:#b45309}.notificacao-info{border-left-color:#64748b}.notificacao-status span{display:inline-flex;align-items:center;justify-content:center;min-width:38px;padding:2px 5px;border-radius:999px;border:1px solid #d1d5db;background:#f3f4f6;color:#111827;font-size:9.5px;font-weight:950;white-space:nowrap}.notificacao-linha.nao-lida .notificacao-status span{background:#ffc400;border-color:#111827;color:#111827}.notificacao-texto strong{display:block;color:#111827;font-size:11px;line-height:1.2;font-weight:950;max-width:410px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.notificacao-texto small{display:block;color:#4b5563;font-size:10px;line-height:1.2;max-width:410px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;font-weight:650}.notificacao-data{width:96px;white-space:nowrap;color:#4b5563!important;font-size:10px!important;font-weight:750}.notificacao-acao{width:54px;text-align:center}.notificacao-acao button{background:transparent;color:#111827;border:0;padding:0;font-size:10.5px;font-weight:950;text-decoration:underline;cursor:pointer;white-space:nowrap}.notificacao-acao span{color:#6b7280;font-size:10px}.notificacoes-acoes{display:flex;justify-content:flex-end;gap:12px;padding:6px 9px;border-top:1px solid #e5e7eb;background:#f9fafb;flex-shrink:0}.notificacoes-link-acao{background:transparent!important;border:0!important;padding:0!important;color:#111827!important;font-size:10.5px!important;font-weight:900!important;text-decoration:underline!important;cursor:pointer!important;line-height:1.2!important}.notificacoes-link-acao.limpar{color:#991b1b!important}@media(max-width:560px){.modal-notificacoes-overlay{align-items:flex-start;padding:6px}.modal-notificacoes-card{width:100%;max-height:82vh}.notificacoes-tabela{min-width:560px}.notificacao-texto strong,.notificacao-texto small{max-width:290px}.notificacoes-acoes{justify-content:space-between}}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') fecharModalNotificacoes();
  });

  window.abrirModalNotificacoes = abrirModalNotificacoes;
  window.fecharModalNotificacoes = fecharModalNotificacoes;
  window.marcarTodasNotificacoesComoLidas = marcarTodasNotificacoesComoLidas;
  window.limparNotificacoes = limparNotificacoes;
  window.abrirNotificacao = abrirNotificacao;
  window.fecharToastNotificacao = fecharToastNotificacao;
})();