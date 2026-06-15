/* =========================================================
   FS ORÇAMENTOS - dashboard.js
   Dashboard completo com visão comercial, operacional e Premium
   ========================================================= */

const DASHBOARD_TABELAS = {
  ORCAMENTOS: 'orcamentos',
  CLIENTES: 'clientes',
  ORDENS: 'ordens_servico',
  VEICULOS: 'veiculos',
  ESTOQUE: 'estoque'
};

function dashNormalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function dashSetTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function dashFormatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function dashFormatarData(valor) {
  if (!valor) return '';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';

  return data.toLocaleDateString('pt-BR');
}

function dashValorNumerico(registro) {
  const possiveisCampos = [
    registro?.total,
    registro?.valor_total,
    registro?.valor_final,
    registro?.total_geral,
    registro?.valor,
    registro?.subtotal
  ];

  for (const valor of possiveisCampos) {
    const numero = Number(valor || 0);
    if (Number.isFinite(numero) && numero > 0) return numero;
  }

  return 0;
}

function dashDataRegistro(registro) {
  return (
    registro?.criado_em ||
    registro?.created_at ||
    registro?.data_criacao ||
    registro?.data ||
    registro?.data_abertura ||
    registro?.atualizado_em ||
    registro?.updated_at ||
    ''
  );
}

function dashStatusRegistro(registro) {
  return dashNormalizarTexto(registro?.status || registro?.situacao || registro?.estado || 'pendente');
}

function dashStatusAprovado(status) {
  return [
    'aprovado',
    'aprovada',
    'em_servico',
    'em servico',
    'em_serviço',
    'em serviço',
    'finalizado',
    'finalizada',
    'concluido',
    'concluida',
    'concluído',
    'concluída'
  ].includes(status);
}

function dashStatusPendente(status) {
  return [
    'pendente',
    'enviado',
    'enviada',
    'aguardando',
    'aguardando_aprovacao',
    'aguardando aprovacao',
    'aguardando aprovação',
    'aberto',
    'aberta',
    ''
  ].includes(status);
}

function dashStatusRecusado(status) {
  return [
    'recusado',
    'recusada',
    'cancelado',
    'cancelada',
    'reprovado',
    'reprovada'
  ].includes(status);
}

function dashStatusOSAberta(status) {
  return [
    'aberta',
    'aberto',
    'em_analise',
    'em analise',
    'em análise',
    'aguardando_aprovacao',
    'aguardando aprovacao',
    'aguardando aprovação',
    'aprovada',
    'aprovado',
    'em_execucao',
    'em execucao',
    'em execução',
    'aguardando_peca',
    'aguardando peca',
    'aguardando peça'
  ].includes(status);
}

function dashStatusOSConcluida(status) {
  return [
    'concluida',
    'concluída',
    'concluido',
    'concluído',
    'finalizada',
    'finalizado'
  ].includes(status);
}

function dashPlanoEhPremium(plano) {
  return dashNormalizarTexto(plano) === 'premium';
}

function dashPlanoLabel(plano) {
  const normalizado = dashNormalizarTexto(plano);
  if (normalizado === 'premium') return 'Plano Premium';
  if (normalizado === 'basico') return 'Plano Básico';
  return 'Plano Grátis';
}

function dashMostrarAlerta(texto) {
  const alerta = document.getElementById('dashboard-alerta');
  if (!alerta) return;

  if (!texto) {
    alerta.style.display = 'none';
    alerta.textContent = '';
    return;
  }

  alerta.style.display = 'block';
  alerta.textContent = texto;
}

function dashEsconderLoading() {
  const loading = document.getElementById('dashboard-loading');
  if (loading) loading.style.display = 'none';
}

function dashMostrarConteudo() {
  const conteudo = document.getElementById('dashboard-conteudo');
  if (conteudo) conteudo.style.display = 'block';
}

function dashSalvarDestinoLogin() {
  try {
    localStorage.setItem('fs_destino_apos_login', '/dashboard.html');
  } catch (error) {
    console.warn('Não foi possível salvar destino do dashboard:', error);
  }
}

async function dashObterSessao() {
  if (!window._supabase) return null;

  const { data: { session }, error } = await _supabase.auth.getSession();

  if (error) {
    console.warn('Erro ao obter sessão no dashboard:', error);
    return null;
  }

  return session || null;
}

async function dashBuscarPerfil(userId) {
  if (!userId || !window._supabase) return null;

  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, telefone_empresa, plano, plano_status, plano_expira_em')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Não foi possível carregar perfil para o dashboard:', error);
    return null;
  }

  return data || null;
}

async function dashBuscarTabelaPorUsuario(tabela, userId, limite = 500) {
  if (!tabela || !userId || !window._supabase) return [];

  const camposUsuario = ['usuario_id', 'user_id', 'perfil_id', 'id_usuario'];

  for (const campo of camposUsuario) {
    try {
      const { data, error } = await _supabase
        .from(tabela)
        .select('*')
        .eq(campo, userId)
        .limit(limite);

      if (!error) return Array.isArray(data) ? data : [];

      const mensagem = String(error.message || error.details || '').toLowerCase();
      const erroEstrutura =
        mensagem.includes('column') ||
        mensagem.includes('schema cache') ||
        mensagem.includes('does not exist') ||
        mensagem.includes('not found');

      if (!erroEstrutura) {
        console.warn(`Erro ao consultar ${tabela}.${campo}:`, error);
      }
    } catch (error) {
      console.warn(`Erro inesperado ao consultar ${tabela}.${campo}:`, error);
    }
  }

  return [];
}

function dashOrdenarRecentes(lista) {
  return [...(Array.isArray(lista) ? lista : [])].sort((a, b) => {
    const dataA = new Date(dashDataRegistro(a)).getTime() || 0;
    const dataB = new Date(dashDataRegistro(b)).getTime() || 0;
    return dataB - dataA;
  });
}

function dashCalcularEstoqueBaixo(itens) {
  return (Array.isArray(itens) ? itens : []).filter(item => {
    const quantidade = Number(item.quantidade ?? item.estoque ?? item.qtd ?? item.saldo ?? 0);
    const minimo = Number(item.estoque_minimo ?? item.minimo ?? item.qtd_minima ?? 0);

    if (!Number.isFinite(quantidade)) return false;
    if (!Number.isFinite(minimo) || minimo <= 0) return quantidade <= 0;

    return quantidade <= minimo;
  }).length;
}

function dashMontarItemLista({ titulo, subtitulo, status, href }) {
  const linkAbre = href ? `<a href="${href}" class="dashboard-status">Abrir</a>` : `<span class="dashboard-status">${status || 'Info'}</span>`;

  return `
    <div class="dashboard-lista-item">
      <div>
        <strong>${dashEscaparHtml(titulo || 'Registro sem título')}</strong>
        <span>${dashEscaparHtml(subtitulo || '')}</span>
      </div>
      ${href ? linkAbre : `<span class="dashboard-status">${dashEscaparHtml(status || 'Info')}</span>`}
    </div>
  `;
}

function dashEscaparHtml(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dashRenderListaOrcamentos(orcamentos) {
  const lista = document.getElementById('dashboard-lista-orcamentos');
  if (!lista) return;

  const recentes = dashOrdenarRecentes(orcamentos).slice(0, 6);

  if (!recentes.length) {
    lista.innerHTML = '<div class="dashboard-vazio">Nenhum orçamento encontrado. Crie um orçamento para começar a acompanhar seus números.</div>';
    return;
  }

  lista.innerHTML = recentes.map(orcamento => {
    const titulo = orcamento.titulo || orcamento.nome || orcamento.cliente_nome || 'Orçamento';
    const cliente = orcamento.cliente_nome || orcamento.cliente || 'Cliente não informado';
    const data = dashFormatarData(dashDataRegistro(orcamento));
    const valor = dashFormatarMoeda(dashValorNumerico(orcamento));
    const status = orcamento.status || 'pendente';

    return dashMontarItemLista({
      titulo,
      subtitulo: `${cliente} • ${valor}${data ? ` • ${data}` : ''}`,
      status
    });
  }).join('');
}

function dashRenderListaClientes(clientes) {
  const lista = document.getElementById('dashboard-lista-clientes');
  if (!lista) return;

  const recentes = dashOrdenarRecentes(clientes).slice(0, 5);

  if (!recentes.length) {
    lista.innerHTML = '<div class="dashboard-vazio">Nenhum cliente cadastrado ainda. O cadastro de clientes é parte importante da gestão Premium.</div>';
    return;
  }

  lista.innerHTML = recentes.map(cliente => {
    const codigo = cliente.numero_cliente ? `CLI-${String(cliente.numero_cliente).padStart(6, '0')}` : 'Cliente';
    const nome = cliente.nome || cliente.nome_cliente || 'Cliente sem nome';
    const contato = cliente.whatsapp || cliente.telefone || cliente.email || 'Sem contato cadastrado';

    return dashMontarItemLista({
      titulo: `${codigo} - ${nome}`,
      subtitulo: contato,
      status: cliente.status || 'ativo'
    });
  }).join('');
}

function dashRenderListaOS(ordens) {
  const lista = document.getElementById('dashboard-lista-os');
  if (!lista) return;

  const recentes = dashOrdenarRecentes(ordens).slice(0, 6);

  if (!recentes.length) {
    lista.innerHTML = '<div class="dashboard-vazio">Nenhuma ordem de serviço encontrada. Quando o Premium estiver em uso, as OS aparecerão aqui.</div>';
    return;
  }

  lista.innerHTML = recentes.map(os => {
    const numero = os.numero_os || os.numero || os.codigo || os.id || 'OS';
    const cliente = os.cliente_nome || os.cliente || os.nome_cliente || 'Cliente não informado';
    const data = dashFormatarData(os.data_abertura || dashDataRegistro(os));
    const status = os.status || os.situacao || 'aberta';

    return dashMontarItemLista({
      titulo: `OS ${numero}`,
      subtitulo: `${cliente}${data ? ` • ${data}` : ''}`,
      status
    });
  }).join('');
}

function dashAtualizarHero(perfil) {
  const nomeEmpresa = perfil?.nome_empresa || localStorage.getItem('nome_empresa') || '';
  const nomeUsuario = perfil?.nome || localStorage.getItem('usuario_nome') || '';
  const plano = perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';

  dashSetTexto(
    'dashboard-titulo',
    nomeEmpresa ? `Dashboard da ${nomeEmpresa}` : 'Dashboard do FS Orçamentos'
  );

  dashSetTexto(
    'dashboard-subtitulo',
    `${nomeUsuario ? `${nomeUsuario}, acompanhe` : 'Acompanhe'} seus orçamentos, clientes, ordens de serviço e indicadores. Plano atual: ${dashPlanoLabel(plano)}.`
  );
}

function dashAtualizarBoxPremium(perfil) {
  const box = document.getElementById('dashboard-premium-box');
  const texto = document.getElementById('dashboard-premium-texto');
  const plano = perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';

  if (!box || !texto) return;

  if (dashPlanoEhPremium(plano)) {
    texto.textContent = 'Seu plano Premium está pronto para centralizar clientes, ordens de serviço, veículos, estoque, agenda e relatórios avançados.';
    return;
  }

  texto.textContent = 'Clientes, ordens de serviço, veículos, estoque, agenda e relatórios avançados fazem parte do Premium. Use este Dashboard para acompanhar a evolução da sua gestão.';
}

function dashAplicarMetricas({ orcamentos, clientes, ordens, estoque }) {
  const listaOrcamentos = Array.isArray(orcamentos) ? orcamentos : [];
  const listaClientes = Array.isArray(clientes) ? clientes : [];
  const listaOrdens = Array.isArray(ordens) ? ordens : [];
  const listaEstoque = Array.isArray(estoque) ? estoque : [];

  const aprovados = listaOrcamentos.filter(o => dashStatusAprovado(dashStatusRegistro(o)));
  const pendentes = listaOrcamentos.filter(o => dashStatusPendente(dashStatusRegistro(o)));
  const recusados = listaOrcamentos.filter(o => dashStatusRecusado(dashStatusRegistro(o)));

  const valorAprovado = aprovados.reduce((soma, o) => soma + dashValorNumerico(o), 0);
  const valorPendente = pendentes.reduce((soma, o) => soma + dashValorNumerico(o), 0);
  const valorRecusado = recusados.reduce((soma, o) => soma + dashValorNumerico(o), 0);

  const ticketMedio = aprovados.length ? valorAprovado / aprovados.length : 0;
  const taxaAprovacao = listaOrcamentos.length ? Math.round((aprovados.length / listaOrcamentos.length) * 100) : 0;

  const osAbertas = listaOrdens.filter(os => dashStatusOSAberta(dashStatusRegistro(os))).length;
  const osConcluidas = listaOrdens.filter(os => dashStatusOSConcluida(dashStatusRegistro(os))).length;
  const estoqueBaixo = dashCalcularEstoqueBaixo(listaEstoque);

  dashSetTexto('dash-total-orcamentos', listaOrcamentos.length);
  dashSetTexto('dash-orcamentos-aprovados', aprovados.length);
  dashSetTexto('dash-orcamentos-pendentes', pendentes.length);
  dashSetTexto('dash-valor-aprovado', dashFormatarMoeda(valorAprovado));
  dashSetTexto('dash-total-clientes', listaClientes.length);
  dashSetTexto('dash-os-abertas', osAbertas);
  dashSetTexto('dash-os-concluidas', osConcluidas);
  dashSetTexto('dash-estoque-baixo', estoqueBaixo);
  dashSetTexto('dash-valor-pendente', dashFormatarMoeda(valorPendente));
  dashSetTexto('dash-valor-recusado', dashFormatarMoeda(valorRecusado));
  dashSetTexto('dash-ticket-medio', dashFormatarMoeda(ticketMedio));
  dashSetTexto('dash-taxa-aprovacao', `${taxaAprovacao}%`);
}

async function inicializarDashboardFS() {
  dashMostrarConteudo();

  try {
    if (!window._supabase) {
      dashMostrarAlerta('Supabase não carregou. Atualize a página e tente novamente.');
      dashEsconderLoading();
      return;
    }

    const session = await dashObterSessao();

    if (!session?.user?.id) {
      dashSalvarDestinoLogin();
      window.location.href = '/index.html?login=1';
      return;
    }

    const userId = session.user.id;
    const perfil = await dashBuscarPerfil(userId);

    if (perfil?.plano) localStorage.setItem('usuario_plano', perfil.plano);
    if (perfil?.nome) localStorage.setItem('usuario_nome', perfil.nome);
    if (perfil?.nome_empresa) localStorage.setItem('nome_empresa', perfil.nome_empresa);
    if (perfil?.telefone_empresa) localStorage.setItem('telefone_empresa', perfil.telefone_empresa);

    dashAtualizarHero(perfil);
    dashAtualizarBoxPremium(perfil);

    const [orcamentos, clientes, ordens, veiculos, estoque] = await Promise.all([
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ORCAMENTOS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.CLIENTES, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ORDENS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.VEICULOS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ESTOQUE, userId)
    ]);

    dashAplicarMetricas({
      orcamentos,
      clientes,
      ordens,
      veiculos,
      estoque
    });

    dashRenderListaOrcamentos(orcamentos);
    dashRenderListaClientes(clientes);
    dashRenderListaOS(ordens);

    const avisos = [];
    if (!clientes.length) avisos.push('cadastre seus primeiros clientes');
    if (!ordens.length) avisos.push('comece a registrar ordens de serviço');
    if (!orcamentos.length) avisos.push('gere seu primeiro orçamento');

    dashMostrarAlerta(
      avisos.length
        ? `Próximos passos sugeridos: ${avisos.join(', ')}.`
        : ''
    );

  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
    dashMostrarAlerta('Não foi possível carregar todos os dados do Dashboard. A página continua disponível para navegação.');
  } finally {
    dashEsconderLoading();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDashboardFS);
} else {
  inicializarDashboardFS();
}

window.inicializarDashboardFS = inicializarDashboardFS;