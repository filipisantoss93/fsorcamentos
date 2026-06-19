/* =========================================================
   FS ORÇAMENTOS - dashboard.js
   Dashboard compacto de saúde da empresa
   ========================================================= */

const DASHBOARD_TABELAS = {
  ORCAMENTOS: 'orcamentos',
  CLIENTES: 'clientes',
  ORDENS: 'ordens_servico',
  VEICULOS: 'veiculos',
  ESTOQUE: 'produtos_estoque',
  AGENDA: 'agenda_servicos'
};

function dashNormalizarTexto(valor) {
  return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function dashEscaparHtml(valor) {
  return String(valor || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function dashSetTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function dashFormatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dashFormatarData(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR');
}

function dashValorNumerico(registro) {
  const possiveisCampos = [registro?.total, registro?.valor_total, registro?.valor_final, registro?.total_geral, registro?.valor, registro?.subtotal];
  for (const valor of possiveisCampos) {
    const numero = Number(valor || 0);
    if (Number.isFinite(numero) && numero > 0) return numero;
  }
  return 0;
}

function dashDataRegistro(registro) {
  return registro?.criado_em || registro?.created_at || registro?.data_criacao || registro?.data || registro?.data_abertura || registro?.data_servico || registro?.atualizado_em || registro?.updated_at || '';
}

function dashStatusRegistro(registro) {
  return dashNormalizarTexto(registro?.status || registro?.situacao || registro?.estado || 'pendente').replace(/\s+/g, '_');
}

function dashStatusAprovado(status) {
  return ['aprovado', 'aprovada', 'em_servico', 'em_serviço', 'finalizado', 'finalizada', 'concluido', 'concluida', 'concluído', 'concluída'].includes(status);
}

function dashStatusPendente(status) {
  return ['pendente', 'enviado', 'enviada', 'aguardando', 'aguardando_aprovacao', 'aberto', 'aberta', ''].includes(status);
}

function dashStatusRecusado(status) {
  return ['recusado', 'recusada', 'cancelado', 'cancelada', 'reprovado', 'reprovada'].includes(status);
}

function dashStatusOSAberta(status) {
  return ['aberta', 'aberto', 'em_analise', 'aguardando_aprovacao', 'aprovada', 'aprovado', 'em_execucao', 'aguardando_peca'].includes(status);
}

function dashStatusOSConcluida(status) {
  return ['concluida', 'concluído', 'concluido', 'concluída', 'finalizada', 'finalizado'].includes(status);
}

function dashStatusPago(status) {
  return ['pago', 'quitado', 'recebido', 'concluido', 'concluida'].includes(dashNormalizarTexto(status).replace(/\s+/g, '_'));
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
  try { localStorage.setItem('fs_destino_apos_login', '/dashboard.html'); } catch (_) {}
}

async function dashObterSessao() {
  if (!window._supabase) return null;
  const { data: { session }, error } = await _supabase.auth.getSession();
  if (error) return null;
  return session || null;
}

async function dashBuscarPerfil(userId) {
  if (!userId || !window._supabase) return null;
  const { data, error } = await _supabase
    .from('perfis')
    .select('nome, nome_empresa, telefone_empresa, plano, plano_status, plano_expira_em')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

function dashCampoUsuarioPorTabela(tabela) {
  if (['orcamentos', 'perfis', 'notificacoes', 'pagamentos_pix', 'forum_topicos', 'forum_respostas', 'forum_curtidas', 'forum_denuncias'].includes(tabela)) return 'usuario_id';
  return 'user_id';
}

async function dashBuscarTabelaPorUsuario(tabela, userId, limite = 500) {
  if (!tabela || !userId || !window._supabase) return [];
  const campo = dashCampoUsuarioPorTabela(tabela);
  try {
    const { data, error } = await _supabase
      .from(tabela)
      .select('*')
      .eq(campo, userId)
      .limit(limite);
    if (error) {
      console.warn(`Erro ao consultar ${tabela}.${campo}:`, error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Erro inesperado ao consultar ${tabela}:`, error);
    return [];
  }
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
    const quantidade = Number(item.quantidade_atual ?? item.quantidade ?? item.estoque ?? item.qtd ?? item.saldo ?? 0);
    const minimo = Number(item.estoque_minimo ?? item.minimo ?? item.qtd_minima ?? 0);
    if (!Number.isFinite(quantidade)) return false;
    if (!Number.isFinite(minimo) || minimo <= 0) return quantidade <= 0;
    return quantidade <= minimo;
  }).length;
}

function dashTabela(containerId, headers, rows, vazio) {
  const lista = document.getElementById(containerId);
  if (!lista) return;
  if (!rows.length) {
    lista.innerHTML = `<div class="dash-vazio">${dashEscaparHtml(vazio || 'Nenhum registro encontrado.')}</div>`;
    return;
  }
  lista.innerHTML = `<div class="dash-table-wrap"><table class="dash-table"><thead><tr>${headers.map(h => `<th>${dashEscaparHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function dashTag(status) {
  const classe = dashStatusRegistro({ status });
  return `<span class="dash-status ${dashEscaparHtml(classe)}">${dashEscaparHtml(status || '-')}</span>`;
}

function dashRenderListaOrcamentos(orcamentos) {
  const recentes = dashOrdenarRecentes(orcamentos).slice(0, 8);
  dashTabela('dashboard-lista-orcamentos', ['Cliente', 'Valor', 'Status', 'Data'], recentes.map(orcamento => {
    const cliente = orcamento.cliente_nome || orcamento.cliente || 'Cliente não informado';
    const assunto = orcamento.assunto || orcamento.titulo || 'Orçamento';
    const data = dashFormatarData(dashDataRegistro(orcamento)) || '-';
    const valor = dashFormatarMoeda(dashValorNumerico(orcamento));
    const status = orcamento.status || 'pendente';
    return `<tr><td><strong>${dashEscaparHtml(cliente)}</strong><small>${dashEscaparHtml(assunto)}</small></td><td><strong>${dashEscaparHtml(valor)}</strong></td><td>${dashTag(status)}</td><td>${dashEscaparHtml(data)}</td></tr>`;
  }), 'Nenhum orçamento encontrado. Crie um orçamento para começar a acompanhar seus números.');
}

function dashRenderListaClientes(clientes) {
  const recentes = dashOrdenarRecentes(clientes).slice(0, 8);
  dashTabela('dashboard-lista-clientes', ['Cliente', 'Contato', 'Cidade', 'Status'], recentes.map(cliente => {
    const codigo = cliente.numero_cliente ? `CLI-${String(cliente.numero_cliente).padStart(6, '0')}` : 'Cliente';
    const nome = cliente.nome || cliente.nome_cliente || 'Cliente sem nome';
    const contato = cliente.whatsapp || cliente.telefone || cliente.email || '-';
    const cidade = [cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || '-';
    return `<tr><td><strong>${dashEscaparHtml(nome)}</strong><small>${dashEscaparHtml(codigo)}</small></td><td>${dashEscaparHtml(contato)}</td><td>${dashEscaparHtml(cidade)}</td><td>${dashTag(cliente.status || 'ativo')}</td></tr>`;
  }), 'Nenhum cliente cadastrado ainda.');
}

function dashRenderListaOS(ordens) {
  const recentes = dashOrdenarRecentes(ordens).slice(0, 8);
  dashTabela('dashboard-lista-os', ['OS', 'Cliente', 'Status', 'Valor'], recentes.map(os => {
    const numero = os.numero_os ? `OS ${String(os.numero_os).padStart(6, '0')}` : 'OS';
    const cliente = os.cliente_nome || os.cliente || os.nome_cliente || 'Cliente não informado';
    const data = dashFormatarData(os.data_abertura || dashDataRegistro(os));
    const status = os.status || 'aberta';
    const valor = dashFormatarMoeda(os.valor_total || 0);
    return `<tr><td><strong>${dashEscaparHtml(numero)}</strong><small>${dashEscaparHtml(data || '-')}</small></td><td>${dashEscaparHtml(cliente)}</td><td>${dashTag(status)}</td><td><strong>${dashEscaparHtml(valor)}</strong></td></tr>`;
  }), 'Nenhuma ordem de serviço encontrada.');
}

function dashAtualizarHero(perfil) {
  const nomeEmpresa = perfil?.nome_empresa || localStorage.getItem('nome_empresa') || '';
  const nomeUsuario = perfil?.nome || localStorage.getItem('usuario_nome') || '';
  const plano = perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';
  dashSetTexto('dashboard-titulo', nomeEmpresa ? `Saúde da ${nomeEmpresa}` : 'Saúde da empresa');
  dashSetTexto('dashboard-subtitulo', `${nomeUsuario ? `${nomeUsuario}, acompanhe` : 'Acompanhe'} tudo que está em aberto, dinheiro em andamento, OS, estoque e pendências. Plano atual: ${dashPlanoLabel(plano)}.`);
}

function dashAplicarMetricas({ orcamentos, clientes, ordens, veiculos, estoque, agenda }) {
  const listaOrcamentos = Array.isArray(orcamentos) ? orcamentos : [];
  const listaClientes = Array.isArray(clientes) ? clientes : [];
  const listaOrdens = Array.isArray(ordens) ? ordens : [];
  const listaVeiculos = Array.isArray(veiculos) ? veiculos : [];
  const listaEstoque = Array.isArray(estoque) ? estoque : [];
  const listaAgenda = Array.isArray(agenda) ? agenda : [];

  const aprovados = listaOrcamentos.filter(o => dashStatusAprovado(dashStatusRegistro(o)));
  const pendentes = listaOrcamentos.filter(o => dashStatusPendente(dashStatusRegistro(o)));
  const recusados = listaOrcamentos.filter(o => dashStatusRecusado(dashStatusRegistro(o)));
  const valorAprovado = aprovados.reduce((soma, o) => soma + dashValorNumerico(o), 0);
  const valorPendente = pendentes.reduce((soma, o) => soma + dashValorNumerico(o), 0);
  const valorRecusado = recusados.reduce((soma, o) => soma + dashValorNumerico(o), 0);
  const ticketMedio = aprovados.length ? valorAprovado / aprovados.length : 0;
  const taxaAprovacao = listaOrcamentos.length ? Math.round((aprovados.length / listaOrcamentos.length) * 100) : 0;

  const osAbertasLista = listaOrdens.filter(os => dashStatusOSAberta(dashStatusRegistro(os)));
  const osConcluidasLista = listaOrdens.filter(os => dashStatusOSConcluida(dashStatusRegistro(os)));
  const estoqueBaixo = dashCalcularEstoqueBaixo(listaEstoque);
  const osAReceber = listaOrdens.filter(os => dashValorNumerico(os) > 0 && !dashStatusPago(os.status_pagamento)).reduce((s, os) => s + dashValorNumerico(os), 0);
  const agendaAberta = listaAgenda.filter(a => !['concluido', 'concluido', 'concluida', 'cancelado', 'cancelada'].includes(dashStatusRegistro(a))).length;

  dashSetTexto('dash-total-orcamentos', listaOrcamentos.length);
  dashSetTexto('dash-orcamentos-aprovados', aprovados.length);
  dashSetTexto('dash-orcamentos-pendentes', pendentes.length);
  dashSetTexto('dash-valor-aprovado', dashFormatarMoeda(valorAprovado));
  dashSetTexto('dash-total-clientes', listaClientes.length);
  dashSetTexto('dash-os-abertas', osAbertasLista.length);
  dashSetTexto('dash-os-concluidas', osConcluidasLista.length);
  dashSetTexto('dash-estoque-baixo', estoqueBaixo);
  dashSetTexto('dash-valor-pendente', dashFormatarMoeda(valorPendente));
  dashSetTexto('dash-valor-recusado', dashFormatarMoeda(valorRecusado));
  dashSetTexto('dash-ticket-medio', dashFormatarMoeda(ticketMedio));
  dashSetTexto('dash-taxa-aprovacao', `${taxaAprovacao}%`);
  dashSetTexto('dash-total-veiculos', listaVeiculos.length);
  dashSetTexto('dash-total-produtos', listaEstoque.length);
  dashSetTexto('dash-agenda-aberta', agendaAberta);
  dashSetTexto('dash-os-a-receber', dashFormatarMoeda(osAReceber));

  dashRenderSaudeOperacional({ pendentes, osAbertasLista, estoqueBaixo, osAReceber, agendaAberta, taxaAprovacao });
}

function dashRenderSaudeOperacional({ pendentes, osAbertasLista, estoqueBaixo, osAReceber, agendaAberta, taxaAprovacao }) {
  const box = document.getElementById('dashboard-saude-operacional');
  if (!box) return;
  const itens = [
    { titulo: `${pendentes.length} orçamento(s) pendente(s)`, texto: 'Clientes aguardando retorno. Envie follow-up antes de perder a venda.' },
    { titulo: `${osAbertasLista.length} OS em aberto`, texto: 'Serviços precisam de execução, baixa ou finalização.' },
    { titulo: `${estoqueBaixo} item(ns) com estoque baixo`, texto: 'Peças críticas podem atrasar serviços e entregas.' },
    { titulo: `${dashFormatarMoeda(osAReceber)} a receber`, texto: 'Valores de OS sem pagamento confirmado.' },
    { titulo: `${agendaAberta} compromisso(s) na agenda`, texto: 'Atendimentos agendados ou em execução.' },
    { titulo: `${taxaAprovacao}% de aprovação`, texto: 'Indicador comercial para medir qualidade das propostas.' }
  ];
  box.innerHTML = itens.map(item => `<div class="dash-health-item"><strong>${dashEscaparHtml(item.titulo)}</strong><span>${dashEscaparHtml(item.texto)}</span></div>`).join('');
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

    const [orcamentos, clientes, ordens, veiculos, estoque, agenda] = await Promise.all([
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ORCAMENTOS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.CLIENTES, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ORDENS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.VEICULOS, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.ESTOQUE, userId),
      dashBuscarTabelaPorUsuario(DASHBOARD_TABELAS.AGENDA, userId)
    ]);

    dashAplicarMetricas({ orcamentos, clientes, ordens, veiculos, estoque, agenda });
    dashRenderListaOrcamentos(orcamentos);
    dashRenderListaClientes(clientes);
    dashRenderListaOS(ordens);

    const avisos = [];
    if (!clientes.length) avisos.push('cadastre seus primeiros clientes');
    if (!ordens.length) avisos.push('registre ordens de serviço');
    if (!orcamentos.length) avisos.push('gere seu primeiro orçamento');
    dashMostrarAlerta(avisos.length ? `Próximos passos: ${avisos.join(', ')}.` : '');
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
    dashMostrarAlerta('Não foi possível carregar todos os dados do Dashboard. A página continua disponível para navegação.');
  } finally {
    dashEsconderLoading();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarDashboardFS);
else inicializarDashboardFS();

window.inicializarDashboardFS = inicializarDashboardFS;