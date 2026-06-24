/* FS Orçamentos - fluxo-caixa.js
   Fluxo de caixa com lançamento manual e venda de produto do estoque.
*/

const CX = {
  userId: null,
  lista: [],
  produtos: []
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFluxoCaixa);
} else {
  initFluxoCaixa();
}

function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function html(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function val(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function set(id, v) {
  const e = document.getElementById(id);
  if (e) e.textContent = String(v);
}

function setVal(id, v) {
  const e = document.getElementById(id);
  if (e) e.value = v ?? '';
}

function dataBR(v) {
  if (!v) return '-';
  const d = new Date(String(v) + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
}

function msg(t, tipo = 'ok') {
  const e = document.getElementById('cx-msg');
  if (!e) return;
  e.textContent = t || '';
  e.className = t ? 'cx-msg ' + tipo : 'cx-msg';
}

function numero(id) {
  return Number(String(val(id)).replace(',', '.') || 0);
}

async function initFluxoCaixa() {
  try {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) {
      location.href = '/index.html?login=1';
      return;
    }

    CX.userId = session.user.id;
    datasPadrao();
    configurarEventosFluxoCaixa();
    await carregarProdutosEstoqueCaixa();
    await carregarFluxoCaixa();
  } catch (e) {
    console.error('Erro ao iniciar fluxo de caixa:', e);
  }
}

function datasPadrao() {
  const f = new Date();
  const i = new Date();
  i.setDate(f.getDate() - 30);
  if (!val('cx-inicio')) setVal('cx-inicio', iso(i));
  if (!val('cx-fim')) setVal('cx-fim', iso(f));
  if (!val('cx-data')) setVal('cx-data', iso(f));
}

function configurarEventosFluxoCaixa() {
  document.getElementById('form-caixa')?.addEventListener('submit', salvarLancamento);
  document.getElementById('cx-modo')?.addEventListener('change', atualizarModoLancamentoCaixa);
  document.getElementById('cx-produto-id')?.addEventListener('change', preencherProdutoVendaEstoqueCaixa);
  document.getElementById('cx-produto-quantidade')?.addEventListener('input', atualizarTotalVendaEstoqueCaixa);
  document.getElementById('cx-produto-valor-unitario')?.addEventListener('input', atualizarTotalVendaEstoqueCaixa);

  document.getElementById('card-form-caixa')?.addEventListener('click', event => {
    if (event.target?.id === 'card-form-caixa') ocultarFormularioCaixa();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') ocultarFormularioCaixa();
  });

  const params = new URLSearchParams(window.location.search || '');
  if (params.get('novo') === '1') {
    setTimeout(() => mostrarFormularioCaixa(), 300);
  }
}

function mostrarFormularioCaixa() {
  const modal = document.getElementById('card-form-caixa');
  if (!modal) return;
  modal.classList.add('ativo');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cx-modal-aberto');
  msg('');
  setVal('cx-data', iso(new Date()));
  atualizarModoLancamentoCaixa();
  setTimeout(() => document.getElementById('cx-modo')?.focus(), 160);
}

function ocultarFormularioCaixa() {
  const modal = document.getElementById('card-form-caixa');
  if (!modal) return;
  modal.classList.remove('ativo');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cx-modal-aberto');
  document.getElementById('form-caixa')?.reset();
  setVal('cx-data', iso(new Date()));
  setVal('cx-tipo', 'entrada');
  setVal('cx-forma', 'pix');
  msg('');
  atualizarModoLancamentoCaixa();
}

function atualizarModoLancamentoCaixa() {
  const modo = val('cx-modo') || 'manual';
  const box = document.getElementById('cx-venda-estoque-box');
  const tipo = document.getElementById('cx-tipo');

  if (box) box.classList.toggle('ativo', modo === 'venda_estoque');

  if (modo === 'venda_estoque') {
    setVal('cx-tipo', 'entrada');
    if (tipo) tipo.disabled = true;
    if (!val('cx-categoria')) setVal('cx-categoria', 'Venda de peça');
    preencherProdutoVendaEstoqueCaixa();
  } else {
    if (tipo) tipo.disabled = false;
    atualizarTotalVendaEstoqueCaixa();
  }
}

async function carregarProdutosEstoqueCaixa() {
  const select = document.getElementById('cx-produto-id');
  if (!select || !CX.userId) return;

  try {
    const { data, error } = await _supabase
      .from('produtos_estoque')
      .select('id,nome,codigo,unidade,valor_venda,valor_custo,quantidade_atual,controlar_estoque,ativo,categoria,subcategoria')
      .eq('user_id', CX.userId)
      .eq('ativo', true)
      .order('nome', { ascending: true })
      .limit(500);

    if (error) {
      console.warn('Não foi possível carregar produtos do estoque:', error);
      CX.produtos = [];
      select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
      return;
    }

    CX.produtos = Array.isArray(data) ? data : [];
    if (!CX.produtos.length) {
      select.innerHTML = '<option value="">Nenhum produto cadastrado no estoque</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecione um produto</option>' + CX.produtos.map(produto => {
      const nome = produto.nome || 'Produto sem nome';
      const qtd = produto.controlar_estoque === false ? 'sem controle' : `${Number(produto.quantidade_atual || 0)} ${produto.unidade || 'un'}`;
      return `<option value="${html(produto.id)}">${html(nome)} — ${html(qtd)} — ${html(moeda(produto.valor_venda || 0))}</option>`;
    }).join('');
  } catch (erro) {
    console.warn('Erro inesperado ao carregar produtos:', erro);
    CX.produtos = [];
    select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
  }
}

function produtoSelecionadoCaixa() {
  const id = val('cx-produto-id');
  return CX.produtos.find(produto => String(produto.id) === String(id)) || null;
}

function preencherProdutoVendaEstoqueCaixa() {
  const produto = produtoSelecionadoCaixa();

  if (!produto) {
    atualizarTotalVendaEstoqueCaixa();
    return;
  }

  if (!val('cx-produto-quantidade')) setVal('cx-produto-quantidade', '1');
  setVal('cx-produto-valor-unitario', numeroParaInput(produto.valor_venda || produto.valor_custo || 0));
  setVal('cx-categoria', 'Venda de peça');
  setVal('cx-descricao', `Venda de ${produto.nome || 'produto do estoque'}`);
  atualizarTotalVendaEstoqueCaixa();
}

function atualizarTotalVendaEstoqueCaixa() {
  const total = numero('cx-produto-quantidade') * numero('cx-produto-valor-unitario');
  set('cx-produto-total', moeda(total));
  if ((val('cx-modo') || 'manual') === 'venda_estoque') setVal('cx-valor', numeroParaInput(total));
}

function numeroParaInput(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? String(n.toFixed(2)) : '';
}

async function salvarLancamento(e) {
  e.preventDefault();

  const modo = val('cx-modo') || 'manual';

  if (modo === 'venda_estoque') {
    return salvarVendaEstoqueCaixa();
  }

  const valor = Number(val('cx-valor') || 0);
  if (valor <= 0) return msg('Informe um valor maior que zero.', 'erro');

  const payload = montarPayloadCaixa({
    tipo: val('cx-tipo') || 'entrada',
    categoria: val('cx-categoria') || 'Geral',
    descricao: val('cx-descricao') || 'Lançamento manual',
    valor,
    origem_tipo: 'manual',
    observacoes: val('cx-observacoes') || null
  });

  const { error } = await _supabase.from('fluxo_caixa').insert(payload);
  if (error) {
    console.error(error);
    return msg('Não foi possível salvar.', 'erro');
  }

  msg('Lançamento salvo.', 'ok');
  ocultarFormularioCaixa();
  await carregarFluxoCaixa();
}

async function salvarVendaEstoqueCaixa() {
  const produto = produtoSelecionadoCaixa();
  if (!produto) return msg('Selecione um produto do estoque.', 'erro');

  const quantidade = numero('cx-produto-quantidade');
  const valorUnitario = numero('cx-produto-valor-unitario');
  const valor = quantidade * valorUnitario;

  if (quantidade <= 0) return msg('Informe uma quantidade maior que zero.', 'erro');
  if (valorUnitario <= 0) return msg('Informe o valor unitário da venda.', 'erro');

  const controlaEstoque = produto.controlar_estoque !== false;
  const quantidadeAtual = Number(produto.quantidade_atual || 0);

  if (controlaEstoque && quantidade > quantidadeAtual) {
    return msg(`Estoque insuficiente. Disponível: ${quantidadeAtual} ${produto.unidade || 'un'}.`, 'erro');
  }

  const descricaoBase = val('cx-descricao') || `Venda de ${produto.nome || 'produto do estoque'}`;
  const obsUsuario = val('cx-observacoes');
  const obsSistema = `Produto: ${produto.nome || '-'} | ID: ${produto.id} | Quantidade: ${quantidade} ${produto.unidade || 'un'} | Valor unitário: ${moeda(valorUnitario)}`;

  const payload = montarPayloadCaixa({
    tipo: 'entrada',
    categoria: val('cx-categoria') || 'Venda de peça',
    descricao: descricaoBase,
    valor,
    origem_tipo: 'venda_estoque',
    observacoes: [obsUsuario, obsSistema].filter(Boolean).join(' | ')
  });

  const { error } = await _supabase.from('fluxo_caixa').insert(payload);
  if (error) {
    console.error(error);
    return msg('Não foi possível registrar a venda no caixa.', 'erro');
  }

  if (controlaEstoque) {
    const erroBaixa = await registrarSaidaEstoqueVenda(produto, quantidade, valorUnitario);
    if (erroBaixa) {
      console.warn('Venda salva, mas a baixa do estoque falhou:', erroBaixa);
      msg('Venda lançada no caixa, mas a baixa automática do estoque não foi concluída.', 'info');
      await carregarFluxoCaixa();
      await carregarProdutosEstoqueCaixa();
      return;
    }
  }

  msg('Venda de peça registrada no caixa e no estoque.', 'ok');
  ocultarFormularioCaixa();
  await carregarProdutosEstoqueCaixa();
  await carregarFluxoCaixa();
}

function montarPayloadCaixa({ tipo, categoria, descricao, valor, origem_tipo, observacoes }) {
  return {
    user_id: CX.userId,
    tipo,
    categoria,
    descricao,
    valor,
    data_movimento: val('cx-data') || iso(new Date()),
    forma_pagamento: val('cx-forma') || 'outro',
    origem_tipo,
    observacoes: observacoes || null
  };
}

async function registrarSaidaEstoqueVenda(produto, quantidade, valorUnitario) {
  try {
    const { error } = await _supabase.rpc('registrar_movimentacao_estoque', {
      p_user_id: CX.userId,
      p_produto_id: produto.id,
      p_tipo_movimentacao: 'saida',
      p_quantidade: quantidade,
      p_ordem_servico_id: null,
      p_ordem_servico_item_id: null,
      p_valor_unitario: valorUnitario,
      p_observacao: 'Venda registrada pelo Fluxo de Caixa'
    });

    return error || null;
  } catch (erro) {
    return erro;
  }
}

async function carregarFluxoCaixa() {
  let q = _supabase
    .from('fluxo_caixa')
    .select('*')
    .eq('user_id', CX.userId)
    .order('data_movimento', { ascending: false })
    .order('created_at', { ascending: false });

  const i = val('cx-inicio');
  const f = val('cx-fim');
  const tipo = val('cx-filtro-tipo');

  if (i) q = q.gte('data_movimento', i);
  if (f) q = q.lte('data_movimento', f);
  if (tipo) q = q.eq('tipo', tipo);

  const { data, error } = await q;
  if (error) {
    console.error(error);
    document.getElementById('cx-lista').innerHTML = '<div class="cx-empty">Erro ao carregar fluxo de caixa.</div>';
    document.getElementById('cx-lista-mobile').innerHTML = '';
    return;
  }

  CX.lista = data || [];
  renderResumo();
  renderLista();
}

function renderResumo() {
  const ent = CX.lista.filter(x => x.tipo === 'entrada');
  const sai = CX.lista.filter(x => x.tipo === 'saida');
  const ve = ent.reduce((s, x) => s + Number(x.valor || 0), 0);
  const vs = sai.reduce((s, x) => s + Number(x.valor || 0), 0);
  set('cx-entradas', moeda(ve));
  set('cx-saidas', moeda(vs));
  set('cx-saldo', moeda(ve - vs));
  set('cx-total', CX.lista.length);
  set('cx-ticket', moeda(ent.length ? ve / ent.length : 0));
}

function renderLista() {
  const desktop = document.getElementById('cx-lista');
  const mobile = document.getElementById('cx-lista-mobile');

  if (!CX.lista.length) {
    if (desktop) desktop.innerHTML = '<div class="cx-empty">Nenhum lançamento no período.</div>';
    if (mobile) mobile.innerHTML = '<div class="cx-empty">Nenhum lançamento no período.</div>';
    return;
  }

  if (desktop) {
    desktop.innerHTML = `
      <table class="cx-table">
        <thead>
          <tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Forma</th><th>Valor</th><th></th></tr>
        </thead>
        <tbody>
          ${CX.lista.map(linhaTabelaCaixa).join('')}
        </tbody>
      </table>`;
  }

  if (mobile) mobile.innerHTML = CX.lista.map(cardMobileCaixa).join('');
}

function linhaTabelaCaixa(x) {
  return `
    <tr>
      <td>${html(dataBR(x.data_movimento))}</td>
      <td><span class="cx-badge ${html(x.tipo)}">${html(x.tipo)}</span></td>
      <td>${html(x.categoria || '-')}</td>
      <td><strong>${html(x.descricao || '-')}</strong><br><small>${html(x.observacoes || '')}</small></td>
      <td>${html(x.forma_pagamento || '-')}</td>
      <td><strong>${html(moeda(x.valor))}</strong></td>
      <td><button class="cx-btn danger" onclick="excluirLancamentoCaixa('${html(x.id)}')">Excluir</button></td>
    </tr>`;
}

function cardMobileCaixa(x) {
  return `
    <article class="cx-item ${html(x.tipo)}">
      <div class="cx-item-top">
        <div><strong>${html(x.descricao || '-')}</strong><br><small>${html(dataBR(x.data_movimento))} • ${html(x.categoria || '-')}</small></div>
        <span class="cx-badge ${html(x.tipo)}">${html(x.tipo)}</span>
      </div>
      <div><strong>${html(moeda(x.valor))}</strong><br><small>${html(x.forma_pagamento || '-')} ${x.observacoes ? '• ' + html(x.observacoes) : ''}</small></div>
      <button class="cx-btn danger" onclick="excluirLancamentoCaixa('${html(x.id)}')">Excluir</button>
    </article>`;
}

async function excluirLancamentoCaixa(id) {
  if (!confirm('Excluir este lançamento?')) return;
  const { error } = await _supabase.from('fluxo_caixa').delete().eq('id', id).eq('user_id', CX.userId);
  if (error) return alert('Não foi possível excluir.');
  await carregarFluxoCaixa();
}

window.carregarFluxoCaixa = carregarFluxoCaixa;
window.mostrarFormularioCaixa = mostrarFormularioCaixa;
window.ocultarFormularioCaixa = ocultarFormularioCaixa;
window.excluirLancamentoCaixa = excluirLancamentoCaixa;
