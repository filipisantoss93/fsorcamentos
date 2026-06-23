/* =========================================================
   FS ORÇAMENTOS - comportamento final de sistema
   Listas compactas em tabela + modais de detalhe.
   Estoque usa DESCRIÇÃO como identificação do produto.
   ========================================================= */
(function () {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();
  const isEstoque = path.endsWith('/estoque') || path.endsWith('/estoque.html');
  window.fsListasCompactasCache = window.fsListasCompactasCache || {};

  const CAMPOS_ESTOQUE_SUPABASE = [
    'id', 'user_id', 'descricao', 'fabricante', 'categoria', 'subcategoria', 'codigo', 'unidade',
    'quantidade_atual', 'estoque_minimo', 'valor_custo', 'valor_venda',
    'controlar_estoque', 'ativo', 'observacoes', 'created_at', 'updated_at',
    'marca_veiculo', 'modelo_veiculo', 'ano_inicial', 'ano_final', 'versao_veiculo',
    'motor_veiculo', 'codigo_original', 'codigo_fabricante', 'aplicacao', 'produto_universal'
  ];

  const ROTULOS_ESTOQUE = {
    id: 'ID', user_id: 'Usuário', descricao: 'Descrição', fabricante: 'Fabricante', categoria: 'Categoria',
    subcategoria: 'Subcategoria', codigo: 'Código', unidade: 'Unidade',
    quantidade_atual: 'Qtd disponível', estoque_minimo: 'Estoque mínimo',
    valor_custo: 'Valor de custo', valor_venda: 'Valor de venda',
    controlar_estoque: 'Controlar estoque', ativo: 'Ativo', observacoes: 'Observações',
    created_at: 'Criado em', updated_at: 'Atualizado em', marca_veiculo: 'Marca do veículo',
    modelo_veiculo: 'Modelo do veículo', ano_inicial: 'Ano inicial', ano_final: 'Ano final',
    versao_veiculo: 'Versão', motor_veiculo: 'Motor', codigo_original: 'Código original',
    codigo_fabricante: 'Código fabricante', aplicacao: 'Aplicação', produto_universal: 'Produto universal'
  };

  function esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function numero(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    let texto = String(valor).trim().replace(/[^\d.,-]/g, '');
    if (!texto) return 0;
    if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
    const convertido = Number(texto);
    return Number.isFinite(convertido) ? convertido : 0;
  }

  function moeda(valor) {
    return numero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function quantidade(valor) {
    const convertido = numero(valor);
    return convertido.toLocaleString('pt-BR', {
      minimumFractionDigits: convertido % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function valorInput(id) {
    const el = document.getElementById(id);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function setValor(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor ?? '';
  }

  function checkboxMarcado(id) {
    return !!document.getElementById(id)?.checked;
  }

  function setCheckbox(id, valor) {
    const el = document.getElementById(id);
    if (el) el.checked = !!valor;
  }

  function textoProdutoEstoque(produto) {
    return String(produto?.descricao || produto?.nome || '').trim() || 'Produto sem descrição';
  }

  function valorModalEstoque(campo, valor) {
    if (campo === 'valor_custo' || campo === 'valor_venda') return moeda(valor);
    if (campo === 'quantidade_atual' || campo === 'estoque_minimo') return quantidade(valor);
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    return valor === null || valor === undefined || valor === '' ? '-' : String(valor);
  }

  function mensagem(id, texto, tipo = 'info') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `mensagem-estoque ${tipo}`;
    el.textContent = texto || '';
  }

  function limparMensagem(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'mensagem-estoque';
    el.textContent = '';
  }

  function injetarEstilo() {
    if (document.getElementById('fs-stable-visual-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-stable-visual-fix-style';
    style.textContent = `
      body.fs-modal-form-lock { overflow: hidden !important; }
      .fs-tabela-lista-wrapper { width:100% !important; overflow-x:auto !important; background:#fff !important; border:1px solid var(--fs-borda-suave,#e5e7eb) !important; border-radius:7px !important; box-shadow:0 3px 10px rgba(17,24,39,.07) !important; }
      .fs-tabela-lista { width:100% !important; border-collapse:collapse !important; table-layout:fixed !important; background:#fff !important; }
      .fs-tabela-lista th,.fs-tabela-lista td { padding:8px 9px !important; border-bottom:1px solid var(--fs-borda-suave,#e5e7eb) !important; text-align:left !important; vertical-align:middle !important; color:var(--fs-texto,#111827) !important; font-size:12px !important; line-height:1.25 !important; overflow-wrap:anywhere !important; }
      .fs-tabela-lista th { background:#f3f4f6 !important; color:var(--fs-cinza-900,#111827) !important; font-size:11px !important; text-transform:uppercase !important; font-weight:950 !important; }
      .fs-tabela-lista tbody tr { cursor:pointer !important; background:#fff !important; }
      .fs-tabela-lista tbody tr:nth-child(even) { background:#f9fafb !important; }
      .fs-tabela-lista tbody tr:hover { background:#f3f4f6 !important; }
      .fs-tabela-lista small { display:block !important; color:var(--fs-texto-suave,#6b7280) !important; font-size:10.5px !important; font-weight:700 !important; line-height:1.15 !important; margin-top:2px !important; }
      .fs-tag-lista { display:inline-flex !important; align-items:center !important; justify-content:center !important; border:1px solid var(--fs-borda-suave,#e5e7eb) !important; border-radius:3px !important; padding:3px 6px !important; background:#f3f4f6 !important; color:var(--fs-cinza-900,#111827) !important; font-size:10px !important; font-weight:900 !important; }
      .fs-tag-lista.ativo,.fs-tag-lista.pago,.fs-tag-lista.concluido,.fs-tag-lista.concluida,.fs-tag-lista.confirmado { background:#ecfdf5 !important; color:#166534 !important; border-color:#bbf7d0 !important; }
      .fs-tag-lista.inativo,.fs-tag-lista.cancelado,.fs-tag-lista.cancelada { background:#fff5f5 !important; color:#b91c1c !important; border-color:#fecaca !important; }
      .fs-tag-lista.em_execucao,.fs-tag-lista.baixo,.fs-tag-lista.pendente,.fs-tag-lista.agendado { background:#fff7ed !important; color:#9a3412 !important; border-color:#fed7aa !important; }
      .fs-item-modal-overlay { position:fixed !important; inset:0 !important; z-index:59000 !important; display:flex !important; align-items:flex-start !important; justify-content:center !important; padding:16px !important; background:rgba(17,24,39,.62) !important; overflow-y:auto !important; }
      .fs-item-modal-card { width:min(820px,100%) !important; margin-top:16px !important; background:#fff !important; color:var(--fs-texto,#111827) !important; border:1px solid var(--fs-borda,#d1d5db) !important; border-radius:7px !important; box-shadow:0 18px 42px rgba(0,0,0,.22) !important; overflow:hidden !important; }
      .fs-item-modal-topo { display:flex !important; justify-content:space-between !important; align-items:flex-start !important; gap:10px !important; padding:11px 13px !important; background:#f3f4f6 !important; border-bottom:1px solid var(--fs-borda-suave,#e5e7eb) !important; }
      .fs-item-modal-topo strong { display:block !important; color:var(--fs-cinza-900,#111827) !important; font-size:16px !important; line-height:1.2 !important; }
      .fs-item-modal-topo span { display:block !important; color:var(--fs-texto-suave,#6b7280) !important; font-size:12px !important; margin-top:3px !important; }
      .fs-item-modal-corpo { padding:12px 13px !important; }
      .fs-modal-acoes-geradas,.fs-item-modal-corpo .cliente-acoes,.fs-item-modal-corpo .veiculo-acoes,.fs-item-modal-corpo .ordem-acoes,.fs-item-modal-corpo .estoque-produto-acoes,.fs-item-modal-corpo .estoque-acoes,.fs-item-modal-corpo .agenda-acoes,.fs-item-modal-corpo .forum-topico-acoes { display:flex !important; flex-wrap:wrap !important; gap:6px !important; margin-top:12px !important; padding-top:10px !important; border-top:1px solid var(--fs-borda-suave,#e5e7eb) !important; }
      .fs-modal-acoes-geradas button,.fs-modal-acoes-geradas a,.fs-item-modal-corpo button,.fs-item-modal-corpo a[class*="btn"] { min-height:31px !important; padding:7px 10px !important; border-radius:4px !important; font-size:12px !important; box-shadow:none !important; }
      .fs-modal-fechar { width:32px !important; height:32px !important; border-radius:4px !important; border:1px solid #d1d5db !important; background:#fff !important; color:#991b1b !important; font-size:20px !important; font-weight:900 !important; cursor:pointer !important; }
      @media (max-width:760px) { .fs-tabela-lista-wrapper { overflow-x:auto !important; } .fs-tabela-lista { min-width:1040px !important; } .fs-tabela-lista th,.fs-tabela-lista td { padding:6px 4px !important; font-size:10.5px !important; line-height:1.15 !important; } .fs-item-modal-overlay { padding:10px !important; } .fs-modal-acoes-geradas { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }
    `;
    document.head.appendChild(style);
  }

  function td(conteudo) { return `<td>${conteudo}</td>`; }
  function tag(texto, classe) { return `<span class="fs-tag-lista ${esc(classe || normalizar(texto).replace(/\s+/g, '_'))}">${esc(texto || '-')}</span>`; }

  function tabela(containerId, cabecalhos, linhas) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!linhas.length) {
      container.innerHTML = '<div class="estado-vazio"><strong>Nenhum registro encontrado</strong><p>A página carrega automaticamente os 20 registros mais recentes.</p></div>';
      return;
    }
    container.innerHTML = `<div class="fs-tabela-lista-wrapper"><table class="fs-tabela-lista"><thead><tr>${cabecalhos.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody></table></div>`;
  }

  function detalhesModalPadrao(item) {
    return Object.entries(item)
      .filter(([, valor]) => valor !== null && valor !== undefined && typeof valor !== 'object')
      .map(([chave, valor]) => `<div class="fs-modal-dado"><strong>${esc(chave.replace(/_/g, ' '))}</strong><span>${esc(valor)}</span></div>`)
      .join('');
  }

  function detalhesModalEstoque(item) {
    return CAMPOS_ESTOQUE_SUPABASE
      .map((campo) => `<div class="fs-modal-dado"><strong>${esc(ROTULOS_ESTOQUE[campo] || campo.replace(/_/g, ' '))}</strong><span>${esc(valorModalEstoque(campo, item[campo]))}</span></div>`)
      .join('');
  }

  function abrirModalRegistro(tipo, id) {
    const lista = window.fsListasCompactasCache[tipo] || [];
    const item = lista.find(reg => String(reg.id) === String(id));
    if (!item) return;

    const titulo = tipo === 'estoque'
      ? textoProdutoEstoque(item)
      : (item.nome || item.titulo || item.placa || item.numero_os || item.nome_cliente || item.cliente_nome || item.nome_produto || 'Detalhes');
    const subtitulo = tipo === 'estoque'
      ? [item.codigo, item.fabricante, item.marca_veiculo, item.modelo_veiculo].filter(Boolean).join(' • ') || 'Produto do estoque.'
      : [item.whatsapp, item.email, item.status, item.categoria, item.data_servico, item.hora_inicio].filter(Boolean).slice(0, 3).join(' • ') || 'Ações disponíveis abaixo.';

    const overlay = document.createElement('div');
    overlay.id = 'fs-item-modal-overlay';
    overlay.className = 'fs-item-modal-overlay';
    const detalhes = tipo === 'estoque' ? detalhesModalEstoque(item) : detalhesModalPadrao(item);
    overlay.innerHTML = `
      <section class="fs-item-modal-card" role="dialog" aria-modal="true">
        <header class="fs-item-modal-topo">
          <div><strong>${esc(titulo)}</strong><span>${esc(subtitulo)}</span></div>
          <button type="button" class="fs-modal-fechar" aria-label="Fechar">×</button>
        </header>
        <div class="fs-item-modal-corpo">
          <div class="modal-resumo-grid">${detalhes}</div>
          <div class="fs-modal-acoes-geradas">${acoesModal(tipo, id, item)}</div>
        </div>
      </section>`;
    overlay.querySelector('.fs-modal-fechar').onclick = fecharModalItem;
    overlay.addEventListener('click', event => { if (event.target === overlay) fecharModalItem(); });
    document.body.appendChild(overlay);
    document.body.classList.add('fs-modal-form-lock');
  }

  function acoesModal(tipo, id, item) {
    const idEsc = esc(id);
    if (tipo === 'clientes') {
      return `<button type="button" onclick="editarCliente('${idEsc}')">Editar</button><button type="button" onclick="copiarIdCliente('${idEsc}')">Copiar ID</button><button type="button" onclick="abrirWhatsAppCliente('${idEsc}')">WhatsApp</button><button type="button" onclick="criarOrcamentoCliente('${idEsc}')">Novo orçamento</button><button type="button" onclick="criarOSCliente('${idEsc}')">Nova OS</button><button type="button" onclick="excluirCliente('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'veiculos') {
      return `<button type="button" onclick="editarVeiculo('${idEsc}')">Editar</button><button type="button" onclick="novoOrcamentoComVeiculo('${idEsc}')">Novo orçamento</button><button type="button" onclick="novaOSComVeiculo('${idEsc}')">Nova OS</button><button type="button" onclick="inativarVeiculo('${idEsc}')">${item.ativo === false ? 'Ativar' : 'Inativar'}</button><button type="button" onclick="excluirVeiculo('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'estoque') {
      return `<button type="button" onclick="editarProdutoEstoque('${idEsc}')">Editar</button><button type="button" onclick="abrirModalMovimentacaoEstoque('${idEsc}', 'entrada')">Entrada</button><button type="button" onclick="abrirModalMovimentacaoEstoque('${idEsc}', 'saida')">Saída</button><button type="button" onclick="abrirModalMovimentacaoEstoque('${idEsc}', 'ajuste')">Ajuste</button><button type="button" onclick="excluirProdutoEstoque('${idEsc}')">Excluir</button>`;
    }
    if (tipo === 'agenda') {
      return `<button type="button" onclick="editarAgendamento('${idEsc}')">Editar</button><button type="button" onclick="marcarAgendaComoConcluida('${idEsc}')">Concluir</button><button type="button" onclick="cancelarAgendamento('${idEsc}')">Cancelar</button><button type="button" onclick="excluirAgendamento('${idEsc}')">Excluir</button>`;
    }
    return `<button type="button" onclick="fecharModalItem()">Fechar</button>`;
  }

  function fecharModalItem() {
    document.getElementById('fs-item-modal-overlay')?.remove();
    document.body.classList.remove('fs-modal-form-lock');
  }

  function renderizarEstoqueCompacto(lista) {
    const produtos = Array.isArray(lista) ? lista : [];
    window.fsListasCompactasCache.estoque = produtos;
    tabela('lista-produtos-estoque', ['Código', 'Descrição', 'Fabricante', 'Qtd disponível', 'Valor', 'Marca veículo', 'Modelo', 'Categoria', 'Subcategoria'], produtos.map(p => `
      <tr onclick="fsAbrirModalRegistro('estoque','${esc(p.id)}')">
        ${td(esc(p.codigo || p.codigo_original || p.codigo_fabricante || '-'))}
        ${td(`<strong>${esc(textoProdutoEstoque(p))}</strong><small>${esc(p.aplicacao || '')}</small>`)}
        ${td(esc(p.fabricante || '-'))}
        ${td(`<strong>${esc(quantidade(p.quantidade_atual))} ${esc(p.unidade || 'un')}</strong><small>mín. ${esc(quantidade(p.estoque_minimo))} ${esc(p.unidade || 'un')}</small>`)}
        ${td(`<strong>${moeda(p.valor_venda || 0)}</strong>`)}
        ${td(esc(p.marca_veiculo || '-'))}
        ${td(esc(p.modelo_veiculo || '-'))}
        ${td(esc(p.categoria || '-'))}
        ${td(esc(p.subcategoria || '-'))}
      </tr>`));
  }

  function instalarRenderizadoresCompactos() {
    if (typeof window.renderizarClientes === 'function' && !window.renderizarClientes.__fsCompacta) {
      window.renderizarClientes = function (lista) {
        window.fsListasCompactasCache.clientes = Array.isArray(lista) ? lista : [];
        tabela('lista-clientes', ['ID', 'Cliente', 'Contato', 'Cidade', 'Status'], window.fsListasCompactasCache.clientes.map(c => `
          <tr onclick="fsAbrirModalRegistro('clientes','${esc(c.id)}')">
            ${td(`<strong>${esc(typeof obterCodigoClienteVisivel === 'function' ? obterCodigoClienteVisivel(c) : c.numero_cliente || '')}</strong>`)}
            ${td(`${esc(c.nome || 'Sem nome')}<small>${esc(c.tipo_cliente || '')}</small>`)}
            ${td(`${esc(c.whatsapp || '-')}<small>${esc(c.email || '')}</small>`)}
            ${td(`${esc([c.cidade, c.estado].filter(Boolean).join(' / ') || '-')}`)}
            ${td(`${tag(c.status || 'ativo', c.status || 'ativo')}`)}
          </tr>`));
      };
      window.renderizarClientes.__fsCompacta = true;
    }

    if (typeof window.renderizarVeiculos === 'function' && !window.renderizarVeiculos.__fsCompacta) {
      window.renderizarVeiculos = function (lista) {
        window.fsListasCompactasCache.veiculos = Array.isArray(lista) ? lista : [];
        tabela('lista-veiculos', ['Placa', 'Veículo', 'Cliente', 'Ano', 'Status'], window.fsListasCompactasCache.veiculos.map(v => `
          <tr onclick="fsAbrirModalRegistro('veiculos','${esc(v.id)}')">
            ${td(`<strong>${esc(v.placa || '-')}</strong>`)}
            ${td(`${esc([v.marca, v.modelo].filter(Boolean).join(' ') || '-') }<small>${esc([v.cor, v.prisma].filter(Boolean).join(' • '))}</small>`)}
            ${td(`${esc(v.cliente_nome || 'Sem cliente')}<small>${esc(v.cliente_whatsapp || '')}</small>`)}
            ${td(esc(v.ano || '-'))}
            ${td(tag(v.ativo === false ? 'Inativo' : 'Ativo', v.ativo === false ? 'inativo' : 'ativo'))}
          </tr>`));
      };
      window.renderizarVeiculos.__fsCompacta = true;
    }

    if (typeof window.renderizarProdutosEstoque === 'function' && !window.renderizarProdutosEstoque.__fsCompacta) {
      window.renderizarProdutosEstoque = renderizarEstoqueCompacto;
      window.renderizarProdutosEstoque.__fsCompacta = true;
    }

    if (typeof window.renderizarAgenda === 'function' && !window.renderizarAgenda.__fsCompacta) {
      window.renderizarAgenda = function (lista) {
        window.fsListasCompactasCache.agenda = Array.isArray(lista) ? lista : [];
        tabela('lista-agenda', ['Data', 'Serviço', 'Cliente', 'Veículo', 'Status'], window.fsListasCompactasCache.agenda.map(a => `
          <tr onclick="fsAbrirModalRegistro('agenda','${esc(a.id)}')">
            ${td(`<strong>${esc(a.data_servico || '-')}</strong><small>${esc([a.hora_inicio, a.hora_fim].filter(Boolean).join(' - '))}</small>`)}
            ${td(`${esc(a.titulo || 'Agendamento')}<small>${esc(a.responsavel || '')}</small>`)}
            ${td(esc(a.clientes?.nome || a.cliente_nome || '-'))}
            ${td(esc([a.veiculos?.placa, a.veiculos?.marca, a.veiculos?.modelo].filter(Boolean).join(' ') || '-'))}
            ${td(tag(a.status || 'agendado', a.status || 'agendado'))}
          </tr>`));
      };
      window.renderizarAgenda.__fsCompacta = true;
    }
  }

  async function obterSessaoEstoque() {
    if (!window._supabase) return null;
    const { data, error } = await window._supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  }

  async function carregarProdutosEstoqueDescricao(resetar = true) {
    if (!isEstoque || !window._supabase) return;
    try {
      const session = await obterSessaoEstoque();
      if (!session) return;
      limparMensagem('mensagem-estoque-lista');

      const termo = valorInput('busca-produtos');
      const status = valorInput('filtro-status-produtos');
      const estoque = valorInput('filtro-estoque-produtos');
      const categoria = valorInput('filtro-categoria-produtos');
      const subcategoria = valorInput('filtro-subcategoria-produtos');

      let query = window._supabase
        .from('produtos_estoque')
        .select('*')
        .eq('user_id', session.user.id)
        .order('categoria', { ascending: true })
        .order('descricao', { ascending: true })
        .limit(20);

      if (termo) {
        const t = `%${termo}%`;
        query = query.or(`descricao.ilike.${t},fabricante.ilike.${t},codigo.ilike.${t},categoria.ilike.${t},subcategoria.ilike.${t},marca_veiculo.ilike.${t},modelo_veiculo.ilike.${t},versao_veiculo.ilike.${t},motor_veiculo.ilike.${t},codigo_original.ilike.${t},codigo_fabricante.ilike.${t},aplicacao.ilike.${t},observacoes.ilike.${t},unidade.ilike.${t}`);
      }
      if (status === 'ativo') query = query.eq('ativo', true);
      if (status === 'inativo') query = query.eq('ativo', false);
      if (categoria && categoria !== 'Sem categoria') query = query.eq('categoria', categoria);
      if (subcategoria && subcategoria !== 'Sem subcategoria') query = query.eq('subcategoria', subcategoria);
      if (estoque === 'sem_controle') query = query.eq('controlar_estoque', false);

      const { data, error } = await query;
      if (error) throw error;

      let lista = Array.isArray(data) ? data : [];
      if (estoque === 'baixo') lista = lista.filter(p => p.ativo !== false && p.controlar_estoque !== false && numero(p.quantidade_atual) <= numero(p.estoque_minimo));
      if (estoque === 'normal') lista = lista.filter(p => p.controlar_estoque !== false && numero(p.quantidade_atual) > numero(p.estoque_minimo));

      renderizarEstoqueCompacto(lista);
      if (typeof window.atualizarResumoEstoque === 'function') {
        try { window.atualizarResumoEstoque(lista); } catch (_) {}
      }
    } catch (erro) {
      console.error('Erro ao carregar estoque por descrição:', erro);
      mensagem('mensagem-estoque-lista', 'Erro ao carregar produtos do estoque.', 'erro');
    }
  }

  function montarProdutoFormularioDescricao() {
    return {
      descricao: valorInput('produto-nome') || valorInput('produto-descricao'),
      fabricante: valorInput('produto-fabricante'),
      categoria: (valorInput('produto-categoria') === '__outra__' ? valorInput('produto-categoria-outra') : valorInput('produto-categoria')) || '',
      subcategoria: valorInput('produto-subcategoria'),
      marca_veiculo: valorInput('produto-marca-veiculo'),
      modelo_veiculo: valorInput('produto-modelo-veiculo'),
      ano_inicial: valorInput('produto-ano-inicial') ? parseInt(valorInput('produto-ano-inicial'), 10) : null,
      ano_final: valorInput('produto-ano-final') ? parseInt(valorInput('produto-ano-final'), 10) : null,
      versao_veiculo: valorInput('produto-versao-veiculo'),
      motor_veiculo: valorInput('produto-motor-veiculo'),
      codigo_original: valorInput('produto-codigo-original'),
      codigo_fabricante: valorInput('produto-codigo-fabricante'),
      aplicacao: valorInput('produto-aplicacao'),
      produto_universal: checkboxMarcado('produto-universal'),
      codigo: valorInput('produto-codigo'),
      unidade: valorInput('produto-unidade') || 'un',
      quantidade_atual: numero(valorInput('produto-quantidade-atual')),
      estoque_minimo: numero(valorInput('produto-estoque-minimo')),
      valor_custo: numero(valorInput('produto-valor-custo')),
      valor_venda: numero(valorInput('produto-valor-venda')),
      controlar_estoque: checkboxMarcado('produto-controlar-estoque'),
      ativo: valorInput('produto-ativo') !== 'false',
      observacoes: valorInput('produto-observacoes')
    };
  }

  async function salvarProdutoDescricao(event) {
    if (!isEstoque) return;
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    try {
      const session = await obterSessaoEstoque();
      if (!session) return;
      limparMensagem('mensagem-estoque-form');
      const produto = montarProdutoFormularioDescricao();
      if (!produto.descricao) {
        mensagem('mensagem-estoque-form', 'Informe a descrição do produto.', 'erro');
        return;
      }
      const id = valorInput('produto-id');
      const query = id
        ? window._supabase.from('produtos_estoque').update(produto).eq('id', id).eq('user_id', session.user.id).select().single()
        : window._supabase.from('produtos_estoque').insert({ ...produto, user_id: session.user.id }).select().single();
      const { error } = await query;
      if (error) throw error;
      mensagem('mensagem-estoque-form', id ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.', 'sucesso');
      document.getElementById('form-produto-estoque')?.reset();
      setValor('produto-id', '');
      setValor('produto-unidade', 'un');
      setValor('produto-ativo', 'true');
      setCheckbox('produto-controlar-estoque', true);
      await carregarProdutosEstoqueDescricao(true);
    } catch (erro) {
      console.error('Erro ao salvar produto por descrição:', erro);
      mensagem('mensagem-estoque-form', 'Erro ao salvar produto. Confira os campos e tente novamente.', 'erro');
    }
  }

  function editarProdutoDescricao(id) {
    const produto = (window.fsListasCompactasCache.estoque || []).find(p => String(p.id) === String(id));
    if (!produto) return;
    fecharModalItem();
    setValor('produto-id', produto.id);
    setValor('produto-nome', textoProdutoEstoque(produto));
    setValor('produto-descricao', '');
    setValor('produto-fabricante', produto.fabricante || '');
    setValor('produto-categoria', produto.categoria || '');
    setValor('produto-subcategoria', produto.subcategoria || '');
    setValor('produto-marca-veiculo', produto.marca_veiculo || '');
    setValor('produto-modelo-veiculo', produto.modelo_veiculo || '');
    setValor('produto-ano-inicial', produto.ano_inicial || '');
    setValor('produto-ano-final', produto.ano_final || '');
    setValor('produto-versao-veiculo', produto.versao_veiculo || '');
    setValor('produto-motor-veiculo', produto.motor_veiculo || '');
    setValor('produto-codigo-original', produto.codigo_original || '');
    setValor('produto-codigo-fabricante', produto.codigo_fabricante || '');
    setValor('produto-aplicacao', produto.aplicacao || '');
    setCheckbox('produto-universal', produto.produto_universal === true);
    setValor('produto-codigo', produto.codigo || '');
    setValor('produto-unidade', produto.unidade || 'un');
    setValor('produto-ativo', produto.ativo === false ? 'false' : 'true');
    setCheckbox('produto-controlar-estoque', produto.controlar_estoque !== false);
    setValor('produto-quantidade-atual', numero(produto.quantidade_atual).toFixed(2));
    setValor('produto-estoque-minimo', numero(produto.estoque_minimo).toFixed(2));
    setValor('produto-valor-custo', numero(produto.valor_custo).toFixed(2));
    setValor('produto-valor-venda', numero(produto.valor_venda).toFixed(2));
    setValor('produto-observacoes', produto.observacoes || '');
    const titulo = document.getElementById('titulo-form-produto');
    if (titulo) titulo.textContent = 'Editar produto';
    const btn = document.getElementById('btn-salvar-produto');
    if (btn) btn.textContent = 'Atualizar produto';
    document.getElementById('card-form-produto')?.classList.remove('form-fechado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirModalMovimentacaoDescricao(id, tipo) {
    const produto = (window.fsListasCompactasCache.estoque || []).find(p => String(p.id) === String(id));
    if (!produto) return;
    fecharModalItem();
    setValor('movimentacao-produto-id', produto.id);
    setValor('movimentacao-tipo', tipo);
    setValor('movimentacao-produto-nome', textoProdutoEstoque(produto));
    setValor('movimentacao-quantidade', '');
    setValor('movimentacao-valor-unitario', numero(tipo === 'saida' ? produto.valor_venda : produto.valor_custo).toFixed(2));
    setValor('movimentacao-observacao', '');
    const titulo = document.getElementById('titulo-modal-movimentacao');
    if (titulo) titulo.textContent = tipo === 'entrada' ? 'Entrada de estoque' : tipo === 'saida' ? 'Saída de estoque' : 'Ajuste de estoque';
    document.getElementById('modal-movimentacao-estoque')?.classList.add('ativo');
  }

  async function confirmarMovimentacaoDescricao(event) {
    if (!isEstoque) return;
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    try {
      const session = await obterSessaoEstoque();
      if (!session) return;
      const produtoId = valorInput('movimentacao-produto-id');
      const tipo = valorInput('movimentacao-tipo');
      const qtd = numero(valorInput('movimentacao-quantidade'));
      const valorUnitario = numero(valorInput('movimentacao-valor-unitario'));
      if (!produtoId || !tipo || qtd <= 0) {
        mensagem('mensagem-estoque-modal', 'Informe uma quantidade maior que zero.', 'erro');
        return;
      }
      const { error } = await window._supabase.rpc('registrar_movimentacao_estoque', {
        p_user_id: session.user.id,
        p_produto_id: produtoId,
        p_tipo_movimentacao: tipo,
        p_quantidade: qtd,
        p_ordem_servico_id: null,
        p_ordem_servico_item_id: null,
        p_valor_unitario: valorUnitario,
        p_observacao: valorInput('movimentacao-observacao') || `${tipo} manual de estoque`
      });
      if (error) throw error;
      document.getElementById('modal-movimentacao-estoque')?.classList.remove('ativo');
      await carregarProdutosEstoqueDescricao(true);
      mensagem('mensagem-estoque-lista', 'Movimentação registrada com sucesso.', 'sucesso');
    } catch (erro) {
      console.error('Erro na movimentação por descrição:', erro);
      mensagem('mensagem-estoque-modal', 'Erro ao registrar movimentação.', 'erro');
    }
  }

  function garantirCampoFabricante() {
    if (document.getElementById('produto-fabricante')) return;
    const campoNome = document.getElementById('produto-nome')?.closest('.campo');
    if (!campoNome) return;
    const campo = document.createElement('div');
    campo.className = 'campo';
    campo.innerHTML = `
      <label for="produto-fabricante">Fabricante / marca da peça</label>
      <input type="text" id="produto-fabricante" placeholder="Ex: Bosch, Cofap, Nakata, Gates" autocomplete="off" />
      <small>Use para informar a marca/fabricante da peça. Não é a marca do veículo.</small>
    `;
    campoNome.insertAdjacentElement('afterend', campo);
  }

  function ajustarFormularioEstoqueDescricao() {
    if (!isEstoque) return;
    garantirCampoFabricante();
    const labelNome = document.querySelector('label[for="produto-nome"]');
    if (labelNome) labelNome.textContent = 'Descrição do produto *';
    const inputNome = document.getElementById('produto-nome');
    if (inputNome) inputNome.placeholder = 'Ex: Correia dentada, Palheta, Disco de freio';
    const campoDescricao = document.getElementById('produto-descricao')?.closest('.campo');
    if (campoDescricao) campoDescricao.style.display = 'none';
    const labelMarcaVeiculo = document.querySelector('label[for="produto-marca-veiculo"]');
    if (labelMarcaVeiculo) labelMarcaVeiculo.textContent = 'Marca do veículo compatível';
    const busca = document.getElementById('busca-produtos');
    if (busca) busca.placeholder = 'Descrição, fabricante, código, marca, modelo, categoria ou subcategoria';

    const form = document.getElementById('form-produto-estoque');
    if (form && form.dataset.fsDescricaoSubmit !== '1') {
      form.dataset.fsDescricaoSubmit = '1';
      form.addEventListener('submit', salvarProdutoDescricao, true);
    }
    const formMov = document.getElementById('form-movimentacao-estoque');
    if (formMov && formMov.dataset.fsDescricaoSubmit !== '1') {
      formMov.dataset.fsDescricaoSubmit = '1';
      formMov.addEventListener('submit', confirmarMovimentacaoDescricao, true);
    }
    ['btn-atualizar-estoque', 'busca-produtos', 'filtro-status-produtos', 'filtro-estoque-produtos', 'filtro-categoria-produtos', 'filtro-subcategoria-produtos'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.fsDescricaoEvento === '1') return;
      el.dataset.fsDescricaoEvento = '1';
      const evento = id === 'busca-produtos' ? 'input' : (id === 'btn-atualizar-estoque' ? 'click' : 'change');
      el.addEventListener(evento, (event) => {
        event.stopImmediatePropagation();
        carregarProdutosEstoqueDescricao(true);
      }, true);
    });

    window.carregarProdutosEstoque = carregarProdutosEstoqueDescricao;
    window.renderizarProdutosEstoque = renderizarEstoqueCompacto;
    window.editarProdutoEstoque = editarProdutoDescricao;
    window.abrirModalMovimentacaoEstoque = abrirModalMovimentacaoDescricao;
  }

  function executarQuandoExistir(nomeFuncao, argumento, tentativas = 24) {
    let i = 0;
    const tentar = () => {
      i += 1;
      if (typeof window[nomeFuncao] === 'function') {
        try { argumento !== undefined ? window[nomeFuncao](argumento) : window[nomeFuncao](); } catch (_) {}
        return;
      }
      if (i < tentativas) setTimeout(tentar, 180);
    };
    tentar();
  }

  function precargarListasRecentes() {
    if (path.endsWith('/clientes') || path.endsWith('/clientes.html')) executarQuandoExistir('carregarClientes');
    if (path.endsWith('/veiculos') || path.endsWith('/veiculos.html')) executarQuandoExistir('carregarVeiculos');
    if (isEstoque) carregarProdutosEstoqueDescricao(true);
    if (path.endsWith('/ordens') || path.endsWith('/ordens.html')) executarQuandoExistir('carregarOrdens', true);
    if (path.endsWith('/agenda') || path.endsWith('/agenda.html')) executarQuandoExistir('carregarAgendaServicos');
  }

  function instalarModalDeItensDaLista() {
    const seletor = ['.cliente-item', '.veiculo-item', '.ordem-item', '.estoque-produto-bloco', '.estoque-item', '.agenda-item', '.forum-topico'].join(',');
    document.querySelectorAll(seletor).forEach((item) => {
      if (item.dataset.fsLinhaClicavel === '1' || item.closest('.fs-item-modal-corpo')) return;
      item.dataset.fsLinhaClicavel = '1';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('click', (event) => {
        if (event.target.closest('button, a, input, select, textarea, label')) return;
        abrirModalRegistro('estoque', item.dataset.produtoId || item.dataset.id);
      });
    });
  }

  function iniciar() {
    injetarEstilo();
    ajustarFormularioEstoqueDescricao();
    instalarRenderizadoresCompactos();
    precargarListasRecentes();
    instalarModalDeItensDaLista();
    setTimeout(() => { ajustarFormularioEstoqueDescricao(); instalarRenderizadoresCompactos(); precargarListasRecentes(); instalarModalDeItensDaLista(); }, 600);
    setTimeout(() => { ajustarFormularioEstoqueDescricao(); instalarRenderizadoresCompactos(); instalarModalDeItensDaLista(); }, 1600);
    setInterval(() => { ajustarFormularioEstoqueDescricao(); instalarRenderizadoresCompactos(); instalarModalDeItensDaLista(); }, 2500);
  }

  window.fsAbrirModalRegistro = abrirModalRegistro;
  window.fecharModalItem = fecharModalItem;
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModalItem(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
