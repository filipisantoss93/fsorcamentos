/* =========================================================
   FS ORÇAMENTOS - orcamentos.js
   Página de histórico/lista de orçamentos em nuvem.
   ========================================================= */
(function () {
  'use strict';

  const ESTADO = {
    session: null,
    perfil: null,
    plano: 'gratis',
    filtroStatus: 'todos',
    filtroPeriodo: 'total',
    busca: '',
    orcamentos: [],
    orcamentoSelecionado: null
  };

  const TABELAS_ORCAMENTOS = ['orcamentos', 'orcamentos_salvos', 'historico_orcamentos'];
  const CAMPOS_USUARIO = ['usuario_id', 'user_id', 'perfil_id', 'criado_por'];

  function $(id) {
    return document.getElementById(id);
  }

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escaparHtml(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatarMoeda(valor) {
    const numero = Number(valor || 0);
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(valor) {
    if (!valor) return '-';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '-';
    return data.toLocaleDateString('pt-BR');
  }

  function obterCampo(orcamento, nomes, fallback = '') {
    for (const nome of nomes) {
      if (orcamento && orcamento[nome] !== undefined && orcamento[nome] !== null && orcamento[nome] !== '') {
        return orcamento[nome];
      }
    }
    return fallback;
  }

  function obterClienteNome(orcamento) {
    return obterCampo(orcamento, ['cliente_nome', 'nome_cliente', 'cliente', 'nome', 'clienteNome'], 'Não informado');
  }

  function obterTotal(orcamento) {
    return Number(obterCampo(orcamento, ['total', 'valor_total', 'valor', 'total_geral', 'valor_final'], 0)) || 0;
  }

  function obterStatus(orcamento) {
    return normalizar(obterCampo(orcamento, ['status', 'situacao'], 'pendente')).replace(/\s+/g, '_') || 'pendente';
  }

  function obterNumero(orcamento) {
    const numero = obterCampo(orcamento, ['numero_orcamento', 'numero', 'sequencial', 'codigo'], '');
    if (!numero) return `#${String(orcamento?.id || '').slice(0, 8)}`;
    if (/^\d+$/.test(String(numero))) return `Nº ${String(numero).padStart(6, '0')}`;
    return String(numero);
  }

  function obterDataCriacao(orcamento) {
    return obterCampo(orcamento, ['created_at', 'criado_em', 'data_criacao', 'data', 'updated_at'], null);
  }

  function statusLabel(status) {
    const mapa = {
      pendente: 'Pendente',
      aprovado: 'Aprovado',
      aprovada: 'Aprovado',
      recusado: 'Recusado',
      recusada: 'Recusado',
      em_servico: 'Em serviço',
      em_serviço: 'Em serviço',
      finalizado: 'Finalizado',
      finalizada: 'Finalizado'
    };
    return mapa[status] || status || 'Pendente';
  }

  function classeStatus(status) {
    return normalizar(status).replace(/[^a-z0-9_-]/g, '') || 'pendente';
  }

  function classeLinhaPorStatus(status) {
    return `linha-status-${classeStatus(status)}`;
  }

  function numeroOrcamentoFormatado(orcamento) {
    return obterNumero(orcamento);
  }

  function mostrar(el, deveMostrar) {
    if (!el) return;
    el.style.display = deveMostrar ? '' : 'none';
  }

  function setTexto(id, valor) {
    const el = $(id);
    if (el) el.textContent = valor;
  }

  function planoPermiteOrcamentos(plano) {
    const p = normalizar(plano);
    return p === 'basico' || p === 'premium' || p === 'gestao' || p === 'admin';
  }

  async function aguardarSupabase(tentativas = 30) {
    for (let i = 0; i < tentativas; i += 1) {
      if (window._supabase) return window._supabase;
      if (typeof window.inicializarSupabaseFS === 'function') {
        const client = window.inicializarSupabaseFS();
        if (client) return client;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return null;
  }

  async function obterSessao() {
    const supabase = await aguardarSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  async function carregarPerfil(userId) {
    const supabase = await aguardarSupabase();
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Não foi possível carregar perfil:', error.message);
      return null;
    }

    return data || null;
  }

  function aplicarVisibilidadeInicial() {
    const authArea = $('auth-area');
    const conteudo = $('conteudo-protegido');
    const bloqueio = $('bloqueio-plano-gratis');
    const funcoes = $('area-orcamentos-funcoes');

    if (!ESTADO.session?.user?.id) {
      mostrar(authArea, true);
      mostrar(conteudo, false);
      mostrar(bloqueio, false);
      mostrar(funcoes, false);
      return;
    }

    mostrar(authArea, false);
    mostrar(conteudo, true);

    const permitido = planoPermiteOrcamentos(ESTADO.plano);
    mostrar(bloqueio, !permitido);
    mostrar(funcoes, permitido);
  }

  async function consultarTabelaOrcamentos(userId) {
    const supabase = await aguardarSupabase();
    if (!supabase || !userId) return [];

    let ultimoErro = null;

    for (const tabela of TABELAS_ORCAMENTOS) {
      for (const campo of CAMPOS_USUARIO) {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .eq(campo, userId)
          .order('created_at', { ascending: false })
          .limit(300);

        if (!error) {
          console.info(`Orçamentos carregados de ${tabela}.${campo}:`, data?.length || 0);
          return Array.isArray(data) ? data : [];
        }

        ultimoErro = error;
      }
    }

    if (ultimoErro) {
      console.warn('Não foi possível consultar orçamentos com os nomes esperados:', ultimoErro.message);
    }

    return [];
  }

  function filtrarPorPeriodo(lista) {
    const periodo = ESTADO.filtroPeriodo;
    if (!periodo || periodo === 'total') return lista;

    const dias = Number(periodo);
    if (!dias) return lista;

    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    return lista.filter((orcamento) => {
      const data = new Date(obterDataCriacao(orcamento));
      if (Number.isNaN(data.getTime())) return true;
      return data >= limite;
    });
  }

  function obterOrcamentosFiltrados() {
    const status = ESTADO.filtroStatus;
    const busca = normalizar(ESTADO.busca);

    let lista = Array.isArray(ESTADO.orcamentos) ? [...ESTADO.orcamentos] : [];

    if (status && status !== 'todos') {
      lista = lista.filter((orcamento) => obterStatus(orcamento) === normalizar(status));
    }

    if (busca) {
      lista = lista.filter((orcamento) => {
        const texto = normalizar([
          obterNumero(orcamento),
          obterClienteNome(orcamento),
          obterStatus(orcamento),
          obterCampo(orcamento, ['assunto', 'descricao', 'observacoes', 'observacao'], '')
        ].join(' '));
        return texto.includes(busca);
      });
    }

    return lista;
  }

  function obterOrcamentosPeriodoResumo() {
    return filtrarPorPeriodo(Array.isArray(ESTADO.orcamentos) ? ESTADO.orcamentos : []);
  }

  function atualizarResumoFinanceiro() {
    const lista = obterOrcamentosPeriodoResumo();
    const grupos = {
      pendente: lista.filter(o => obterStatus(o) === 'pendente'),
      aprovado: lista.filter(o => ['aprovado', 'aprovada'].includes(obterStatus(o))),
      recusado: lista.filter(o => ['recusado', 'recusada'].includes(obterStatus(o))),
      em_servico: lista.filter(o => obterStatus(o) === 'em_servico'),
      finalizado: lista.filter(o => ['finalizado', 'finalizada'].includes(obterStatus(o)))
    };

    Object.entries(grupos).forEach(([status, itens]) => {
      const total = itens.reduce((soma, orcamento) => soma + obterTotal(orcamento), 0);
      setTexto(`resumo-${status}`, formatarMoeda(total));
      setTexto(`qtd-${status}`, itens.length);
    });

    const label = $('resumo-periodo-label');
    if (label) {
      label.textContent = ESTADO.filtroPeriodo === 'total' ? 'Período: Total' : `Período: últimos ${ESTADO.filtroPeriodo} dias`;
    }
  }

  function renderizarTabelaNativa(lista) {
    const destino = $('lista-orcamentos');
    if (!destino) return;

    if (!lista.length) {
      destino.innerHTML = '<div class="msg-vazia">Nenhum orçamento encontrado neste filtro.</div>';
      return;
    }

    destino.innerHTML = `
      <div class="tabela-wrapper tabela-orcamentos-compacta">
        <table class="tabela-orcamentos">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((orcamento) => {
              const id = escaparHtml(orcamento.id);
              const status = obterStatus(orcamento);
              return `
                <tr class="linha-orcamento ${classeLinhaPorStatus(status)}" onclick="abrirModalVisualizar('${id}')" title="Abrir orçamento">
                  <td><strong>${escaparHtml(obterNumero(orcamento))}</strong></td>
                  <td>${escaparHtml(obterClienteNome(orcamento))}</td>
                  <td><strong>${formatarMoeda(obterTotal(orcamento))}</strong></td>
                  <td><span class="status status-${classeStatus(status)}">${escaparHtml(statusLabel(status))}</span></td>
                  <td>${escaparHtml(formatarData(obterDataCriacao(orcamento)))}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderizarOrcamentos() {
    const lista = obterOrcamentosFiltrados();
    window.orcamentosCache = lista;

    if (typeof window.renderizarTabelaOrcamentos === 'function') {
      window.renderizarTabelaOrcamentos(lista);
    } else {
      renderizarTabelaNativa(lista);
    }

    atualizarResumoFinanceiro();
  }

  async function carregarOrcamentos() {
    try {
      const lista = $('lista-orcamentos');
      if (lista) lista.innerHTML = '<div class="msg-vazia">Carregando orçamentos...</div>';

      if (!ESTADO.session?.user?.id) return;

      ESTADO.orcamentos = await consultarTabelaOrcamentos(ESTADO.session.user.id);
      window.orcamentosCache = ESTADO.orcamentos;
      renderizarOrcamentos();
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      const lista = $('lista-orcamentos');
      if (lista) {
        lista.innerHTML = `
          <div class="msg-vazia erro">
            Não foi possível carregar seus orçamentos. Verifique a conexão e as permissões da tabela no Supabase.
          </div>
        `;
      }
    }
  }

  function garantirModalVisualizacao() {
    let modal = $('modal-visualizar-orcamento');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modal-visualizar-orcamento';
    modal.className = 'modal-orcamento-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-orcamento-card">
        <div class="modal-orcamento-topo">
          <div>
            <h2 id="modal-orcamento-titulo">Orçamento</h2>
            <p id="modal-orcamento-subtitulo">Detalhes do orçamento</p>
          </div>
          <button type="button" class="btn-fechar-modal-orcamento" onclick="fecharModalVisualizar()">×</button>
        </div>
        <div id="modal-orcamento-corpo" class="modal-orcamento-corpo"></div>
        <div class="botoes-modal">
          <button type="button" class="btn-pequeno btn-editar" onclick="editarOrcamentoSelecionado()">Editar</button>
          <button type="button" class="btn-pequeno btn-ver-link" onclick="copiarLinkOrcamentoSelecionado()">Copiar link</button>
          <button type="button" class="btn-pequeno btn-whatsapp-orcamento" onclick="enviarWhatsappOrcamentoSelecionado()">WhatsApp</button>
          <button type="button" class="btn-pequeno btn-excluir" onclick="excluirOrcamentoSelecionado()">Excluir</button>
          <button type="button" class="btn-pequeno btn-cancelar" onclick="fecharModalVisualizar()">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) fecharModalVisualizar();
    });
    return modal;
  }

  function abrirModalVisualizar(id) {
    const orcamento = ESTADO.orcamentos.find(item => String(item.id) === String(id));
    if (!orcamento) return;

    ESTADO.orcamentoSelecionado = orcamento;
    const modal = garantirModalVisualizacao();
    const titulo = $('modal-orcamento-titulo');
    const subtitulo = $('modal-orcamento-subtitulo');
    const corpo = $('modal-orcamento-corpo');

    if (titulo) titulo.textContent = obterNumero(orcamento);
    if (subtitulo) subtitulo.textContent = `${obterClienteNome(orcamento)} • ${statusLabel(obterStatus(orcamento))}`;
    if (corpo) {
      corpo.innerHTML = `
        <div class="orcamento-detalhes-grid">
          <div><strong>Cliente</strong><span>${escaparHtml(obterClienteNome(orcamento))}</span></div>
          <div><strong>Total</strong><span>${formatarMoeda(obterTotal(orcamento))}</span></div>
          <div><strong>Status</strong><span>${escaparHtml(statusLabel(obterStatus(orcamento)))}</span></div>
          <div><strong>Data</strong><span>${escaparHtml(formatarData(obterDataCriacao(orcamento)))}</span></div>
        </div>
        <div class="orcamento-json-box">
          <strong>Dados salvos</strong>
          <pre>${escaparHtml(JSON.stringify(orcamento, null, 2))}</pre>
        </div>
      `;
    }

    modal.style.display = 'flex';
    document.body.classList.add('fs-modal-form-lock');
  }

  function fecharModalVisualizar() {
    const modal = $('modal-visualizar-orcamento');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('fs-modal-form-lock');
  }

  function editarOrcamentoSelecionado() {
    const id = ESTADO.orcamentoSelecionado?.id;
    if (!id) return;
    window.location.href = `/gerador.html?orcamento_id=${encodeURIComponent(id)}`;
  }

  async function copiarLinkOrcamentoSelecionado() {
    const id = ESTADO.orcamentoSelecionado?.id;
    if (!id) return;
    const link = `${window.location.origin}/ver.html?id=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Link copiado.');
    } catch (_) {
      prompt('Copie o link:', link);
    }
  }

  function enviarWhatsappOrcamentoSelecionado() {
    const id = ESTADO.orcamentoSelecionado?.id;
    if (!id) return;
    const link = `${window.location.origin}/ver.html?id=${encodeURIComponent(id)}`;
    const texto = encodeURIComponent(`Olá! Segue o link do orçamento: ${link}`);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  async function excluirOrcamentoSelecionado() {
    const orcamento = ESTADO.orcamentoSelecionado;
    if (!orcamento?.id) return;
    if (!confirm('Deseja realmente excluir este orçamento?')) return;

    const supabase = await aguardarSupabase();
    if (!supabase) return;

    let excluido = false;
    for (const tabela of TABELAS_ORCAMENTOS) {
      const { error } = await supabase.from(tabela).delete().eq('id', orcamento.id);
      if (!error) {
        excluido = true;
        break;
      }
    }

    if (!excluido) {
      alert('Não foi possível excluir. Verifique permissões no Supabase.');
      return;
    }

    fecharModalVisualizar();
    await carregarOrcamentos();
  }

  function trocarAbaOrcamentos(valor) {
    ESTADO.filtroStatus = valor || 'todos';
    renderizarOrcamentos();
  }

  function trocarPeriodoResumo(valor) {
    ESTADO.filtroPeriodo = valor || 'total';
    atualizarResumoFinanceiro();
  }

  function filtrarTabelaLocal() {
    ESTADO.busca = $('filtro-busca')?.value || '';
    renderizarOrcamentos();
  }

  function toggleResumoFinanceiro() {
    const conteudo = document.querySelector('#resumo-financeiro .resumo-conteudo');
    const botao = $('btn-toggle-resumo');
    if (!conteudo) return;
    const oculto = conteudo.style.display === 'none';
    conteudo.style.display = oculto ? '' : 'none';
    if (botao) botao.textContent = oculto ? 'Minimizar ▲' : 'Expandir ▼';
  }

  async function inicializarOrcamentos() {
    try {
      ESTADO.session = await obterSessao();

      if (ESTADO.session?.user?.id) {
        ESTADO.perfil = await carregarPerfil(ESTADO.session.user.id);
        ESTADO.plano = ESTADO.perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';
      }

      aplicarVisibilidadeInicial();

      if (ESTADO.session?.user?.id && planoPermiteOrcamentos(ESTADO.plano)) {
        await carregarOrcamentos();
      }
    } catch (error) {
      console.error('Erro ao inicializar página de orçamentos:', error);
      aplicarVisibilidadeInicial();
    }
  }

  window.escaparHtml = escaparHtml;
  window.formatarMoeda = formatarMoeda;
  window.statusLabel = statusLabel;
  window.classeStatus = classeStatus;
  window.classeLinhaPorStatus = classeLinhaPorStatus;
  window.numeroOrcamentoFormatado = numeroOrcamentoFormatado;
  window.carregarOrcamentos = carregarOrcamentos;
  window.abrirModalVisualizar = abrirModalVisualizar;
  window.fecharModalVisualizar = fecharModalVisualizar;
  window.editarOrcamentoSelecionado = editarOrcamentoSelecionado;
  window.copiarLinkOrcamentoSelecionado = copiarLinkOrcamentoSelecionado;
  window.enviarWhatsappOrcamentoSelecionado = enviarWhatsappOrcamentoSelecionado;
  window.excluirOrcamentoSelecionado = excluirOrcamentoSelecionado;
  window.trocarAbaOrcamentos = trocarAbaOrcamentos;
  window.trocarPeriodoResumo = trocarPeriodoResumo;
  window.filtrarTabelaLocal = filtrarTabelaLocal;
  window.toggleResumoFinanceiro = toggleResumoFinanceiro;
  window.inicializarOrcamentos = inicializarOrcamentos;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarOrcamentos);
  } else {
    inicializarOrcamentos();
  }
})();