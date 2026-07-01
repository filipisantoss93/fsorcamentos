let perfilGeradorAtual = null;
let usuarioGeradorId = null;
let orcamentoSalvoAtualId = null;
let linkOrcamentoAtual = '';
let tokenPublicoAtual = '';
let eventosGeradorConfigurados = false;
let restaurandoRascunho = false;
let orcamentoAlterado = false;
let recorrentesSupabaseDisponivel = false;
let recorrentesCache = { mao_obra: [], produto: [] };

const FS_REC_MAO = 'fs_mao_obra_recorrente_v1';
const FS_REC_PROD = 'fs_itens_recorrentes_v1';
const FS_RASCUNHO = 'fs_rascunho_orcamento';

function $(id) { return document.getElementById(id); }
function moeda(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function html(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(v) { return Number(String(v || '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0; }
function planoNorm(v) { const p = String(v || 'gratis').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); return ['premium', 'basico', 'gestao'].includes(p) ? 'premium' : 'gratis'; }
function ehPremium() { return planoNorm(localStorage.getItem('usuario_plano') || perfilGeradorAtual?.plano) === 'premium'; }
function dataBR(v) { if (!v) return ''; const d = new Date(String(v) + 'T00:00:00'); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR'); }
function chaveRecorrente(tipo) { return tipo === 'mao_obra' ? FS_REC_MAO : FS_REC_PROD; }
function gerarTokenPublico() { const b = new Uint8Array(24); crypto.getRandomValues(b); return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(''); }
function montarLinkPublico(token = tokenPublicoAtual, id = orcamentoSalvoAtualId) { return token ? `${location.origin}/aprovacao.html?t=${encodeURIComponent(token)}` : (id ? `${location.origin}/aprovacao.html?id=${encodeURIComponent(id)}` : ''); }
function parametro(nome) { return new URLSearchParams(location.search || '').get(nome) || ''; }

function abrirModalLoginGerador() {
  if (typeof window.fsAplicarModoAuth === 'function') window.fsAplicarModoAuth('login');
  const authArea = $('auth-area');
  const authContainer = $('auth-container');
  const modal = $('modal-login');
  if (authArea) authArea.style.display = 'block';
  if (authContainer) authContainer.style.display = 'block';
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('login-modal-aberto');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('auth-email')?.focus(), 150);
  }
}

function fecharModalLoginGerador() {
  const modal = $('modal-login');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('login-modal-aberto');
  document.body.style.overflow = '';
}

async function iniciarGerador() {
  try {
    if (!window._supabase && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      window._supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    if (!window._supabase) return mostrarStatus('Supabase não carregou. Atualize a página.');
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.user?.id) {
      if (typeof window.fsSalvarDestinoAposLogin === 'function') window.fsSalvarDestinoAposLogin('/gerador.html');
      abrirModalLoginGerador();
      return;
    }
    usuarioGeradorId = session.user.id;
    await carregarPerfilGerador(session.user.id);
    const conteudo = $('conteudo-gerador');
    if (conteudo) conteudo.style.display = 'grid';
    prepararDatas();
    configurarEventosCamposGerador();
    const carregadoUrl = await carregarOrcamentoPorUrl();
    if (!carregadoUrl) restaurarRascunho();
    garantirLinhaPadrao('mao_obra');
    garantirLinhaPadrao('produto');
    aplicarPlanoGerador();
    await carregarRecorrentesGerador();
    renderRecorrentes();
    calcularTotal();
    atualizarAcoesLink();
    if (coletarItens().length) gerarPreviaOrcamento({ silencioso: true }); else limparPreviaOrcamento();
  } catch (e) {
    console.error(e);
    mostrarStatus('Erro ao carregar o gerador. Atualize a página.');
  }
}

async function carregarPerfilGerador(userId) {
  try {
    const { data, error } = await _supabase.from('perfis').select('*').eq('id', userId).maybeSingle();
    if (error) console.warn('Perfil não carregado:', error);
    perfilGeradorAtual = data || {};
    if (data?.plano) localStorage.setItem('usuario_plano', planoNorm(data.plano));
  } catch (e) { perfilGeradorAtual = {}; }
}

async function carregarOrcamentoPorUrl() {
  const editarId = parametro('orcamento_id');
  const duplicarId = parametro('duplicar_orcamento_id');
  const id = editarId || duplicarId;
  if (!id) return false;
  if (!ehPremium()) {
    window.location.href = '/planos.html#assinar-plano-premium';
    return true;
  }
  try {
    const { data, error } = await _supabase.from('orcamentos').select('*').eq('id', id).eq('usuario_id', usuarioGeradorId).maybeSingle();
    if (error) throw error;
    if (!data) {
      mostrarStatus('Orçamento não encontrado ou sem permissão de acesso.');
      return false;
    }
    preencherFormularioComOrcamento(data, !!duplicarId);
    return true;
  } catch (e) {
    console.error(e);
    mostrarStatus('Não foi possível carregar o orçamento informado.');
    return false;
  }
}

function preencherFormularioComOrcamento(o, duplicar = false) {
  restaurandoRascunho = true;
  try {
    localStorage.removeItem(FS_RASCUNHO);
    if ($('numero-orcamento')) $('numero-orcamento').value = duplicar ? '' : (o.numero_orcamento || '');
    if ($('titulo')) $('titulo').value = o.titulo || 'Orçamento';
    if ($('cliente')) $('cliente').value = o.cliente_nome || '';
    if ($('tel-cliente')) $('tel-cliente').value = o.cliente_whatsapp || '';
    if ($('forma-pagamento')) $('forma-pagamento').value = o.forma_pagamento || '';
    if ($('prazo-execucao')) $('prazo-execucao').value = o.prazo_execucao || '';
    if ($('garantia')) $('garantia').value = o.garantia || '';
    if ($('observacoes')) $('observacoes').value = o.observacoes || '';
    if ($('lista-mao-obra')) $('lista-mao-obra').innerHTML = '';
    if ($('lista-produtos')) $('lista-produtos').innerHTML = '';
    const itens = Array.isArray(o.itens) ? o.itens : [];
    itens.filter(i => i.tipo === 'mao_obra').forEach(i => adicionarLinhaOrcamento('mao_obra', i, { salvar: false }));
    itens.filter(i => i.tipo !== 'mao_obra').forEach(i => adicionarLinhaOrcamento('produto', i, { salvar: false }));
    if (duplicar) {
      orcamentoSalvoAtualId = null;
      tokenPublicoAtual = '';
      linkOrcamentoAtual = '';
      orcamentoAlterado = true;
      mostrarStatus('Orçamento duplicado. Revise os dados e salve para criar um novo orçamento.');
    } else {
      orcamentoSalvoAtualId = o.id || null;
      tokenPublicoAtual = o.public_token || '';
      linkOrcamentoAtual = o.link_publico || montarLinkPublico(tokenPublicoAtual, orcamentoSalvoAtualId);
      orcamentoAlterado = false;
      mostrarStatus('Modo edição: as alterações serão salvas neste orçamento.');
    }
    calcularTotal();
  } finally {
    restaurandoRascunho = false;
    atualizarAcoesLink();
  }
}

function prepararDatas() {
  if (!$('validade')?.value) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    $('validade').value = d.toISOString().slice(0, 10);
  }
}

function configurarEventosCamposGerador() {
  if (eventosGeradorConfigurados) return;
  eventosGeradorConfigurados = true;
  ['numero-orcamento','titulo','validade','cliente','tel-cliente','forma-pagamento','prazo-execucao','garantia','observacoes'].forEach(id => {
    const campo = $(id);
    if (!campo) return;
    const evento = campo.tagName === 'SELECT' || campo.type === 'date' ? 'change' : 'input';
    campo.addEventListener(evento, marcarOrcamentoAlterado);
  });
}

function marcarOrcamentoAlterado() {
  if (restaurandoRascunho) return;
  orcamentoAlterado = true;
  salvarRascunho();
  atualizarAcoesLink();
}

function mostrarStatus(t) {
  const el = $('status-sessao-card');
  if (!el) return;
  el.style.display = t ? 'block' : 'none';
  el.textContent = t || '';
}

function aplicarPlanoGerador() {
  const premium = ehPremium();
  const btnPlano = $('btn-plano-gerador');
  if (btnPlano) {
    btnPlano.textContent = premium ? 'Plano Premium ativo' : 'Plano Grátis';
    btnPlano.href = premium ? '/orcamentos.html' : '/planos.html#assinar-plano-premium';
  }
  ['btn-salvar-premium','btn-whatsapp-premium'].forEach(id => { const b = $(id); if (b) b.disabled = !premium; });
  document.querySelectorAll('.fs-anuncio-gratis').forEach(e => { e.style.display = premium ? 'none' : 'block'; });
  const textoPremium = $('texto-premium-gerador');
  if (textoPremium) textoPremium.textContent = premium ? 'Premium ativo: salve, envie link e acompanhe aprovação online.' : 'No Grátis você gera PDF. Assine o Premium para salvar e enviar link.';
  try { if (!premium) { window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({}); } } catch (_) {}
}

function criarLinha(tipo, item = {}) {
  const id = 'row_' + Math.random().toString(36).slice(2);
  const wrap = document.createElement('div');
  wrap.className = 'linha';
  wrap.dataset.tipo = tipo;
  wrap.id = id;
  wrap.innerHTML = `
    <div><small>Descrição</small><input class="desc" value="${html(item.descricao || item.nome || '')}" placeholder="${tipo === 'mao_obra' ? 'Ex: Troca de pastilhas' : 'Ex: Jogo de pastilhas'}"></div>
    <div><small>Qtd</small><input class="qtd" type="number" min="0" step="0.01" value="${html(item.qtd ?? item.quantidade ?? 1)}"></div>
    <div><small>Unitário</small><input class="valor" type="number" min="0" step="0.01" value="${html(item.valor ?? item.valor_unitario ?? 0)}"></div>
    <div><small>Subtotal</small><strong class="subtotal">R$ 0,00</strong></div>
    <button type="button" class="btn" onclick="duplicarLinhaOrcamento('${id}')">Duplicar</button>
    <button type="button" class="btn red" onclick="removerLinhaOrcamento('${id}')">×</button>`;
  wrap.querySelectorAll('input').forEach(input => input.addEventListener('input', () => { calcularTotal(); marcarOrcamentoAlterado(); }));
  return wrap;
}

function adicionarLinhaOrcamento(tipo, item = {}, opcoes = {}) {
  const lista = tipo === 'mao_obra' ? 'lista-mao-obra' : 'lista-produtos';
  $(lista)?.appendChild(criarLinha(tipo, item));
  calcularTotal();
  if (opcoes.salvar !== false) marcarOrcamentoAlterado();
}
function garantirLinhaPadrao(tipo) { if (!document.querySelector(`.linha[data-tipo="${tipo}"]`)) adicionarLinhaOrcamento(tipo, {}, { salvar: false }); }
function removerLinhaOrcamento(id) { const el = $(id); const tipo = el?.dataset.tipo; el?.remove(); if (tipo && document.querySelectorAll(`.linha[data-tipo="${tipo}"]`).length === 0) adicionarLinhaOrcamento(tipo, {}, { salvar: false }); calcularTotal(); marcarOrcamentoAlterado(); }
function duplicarLinhaOrcamento(id) { const row = $(id); if (!row) return; adicionarLinhaOrcamento(row.dataset.tipo, { descricao: row.querySelector('.desc')?.value || '', qtd: row.querySelector('.qtd')?.value || 1, valor: row.querySelector('.valor')?.value || 0 }); }

function coletarItens(tipo = null) {
  return Array.from(document.querySelectorAll('.linha')).map(row => {
    const qtd = numero(row.querySelector('.qtd')?.value || 1);
    const valor = numero(row.querySelector('.valor')?.value || 0);
    const descricao = row.querySelector('.desc')?.value?.trim() || '';
    return { tipo: row.dataset.tipo, descricao, nome: descricao, qtd, quantidade: qtd, valor, valor_unitario: valor, subtotal: qtd * valor, total: qtd * valor };
  }).filter(i => i.descricao && i.qtd > 0 && (!tipo || i.tipo === tipo));
}

function calcularTotal() {
  let totalMao = 0, totalProdutos = 0;
  document.querySelectorAll('.linha').forEach(row => {
    const sub = numero(row.querySelector('.qtd')?.value || 0) * numero(row.querySelector('.valor')?.value || 0);
    if (row.dataset.tipo === 'mao_obra') totalMao += sub; else totalProdutos += sub;
    const s = row.querySelector('.subtotal'); if (s) s.textContent = moeda(sub);
  });
  if ($('total-mao-obra')) $('total-mao-obra').textContent = moeda(totalMao);
  if ($('total-produtos')) $('total-produtos').textContent = moeda(totalProdutos);
  if ($('total-orcamento')) $('total-orcamento').textContent = moeda(totalMao + totalProdutos);
  return totalMao + totalProdutos;
}

function dadosOrcamento() {
  return {
    numero: $('numero-orcamento')?.value?.trim() || '',
    titulo: $('titulo')?.value?.trim() || 'Orçamento',
    cliente: $('cliente')?.value?.trim() || 'Cliente',
    telefone: $('tel-cliente')?.value?.trim() || '',
    validade: $('validade')?.value || '',
    formaPagamento: $('forma-pagamento')?.value?.trim() || '',
    prazoExecucao: $('prazo-execucao')?.value?.trim() || '',
    garantia: $('garantia')?.value?.trim() || '',
    observacoes: $('observacoes')?.value?.trim() || '',
    maoObra: coletarItens('mao_obra'),
    produtos: coletarItens('produto'),
    total: calcularTotal()
  };
}

function gerarHtmlOrcamento() {
  const d = dadosOrcamento();
  const empresa = perfilGeradorAtual?.nome_empresa || 'FS Orçamentos';
  const tel = perfilGeradorAtual?.telefone_empresa || '';
  const resp = perfilGeradorAtual?.nome || '';
  const hoje = new Date().toLocaleDateString('pt-BR');
  const totalMao = d.maoObra.reduce((s,i)=>s+i.subtotal,0), totalProdutos = d.produtos.reduce((s,i)=>s+i.subtotal,0);
  const tabela = (titulo, itens) => `<h3 style="margin:18px 0 6px;color:#0f172a">${titulo}</h3><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#0f172a;color:#fff"><th style="padding:8px;text-align:left">Descrição</th><th style="padding:8px;text-align:right">Qtd</th><th style="padding:8px;text-align:right">Unit.</th><th style="padding:8px;text-align:right">Subtotal</th></tr></thead><tbody>${itens.length ? itens.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${html(i.descricao)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${html(i.qtd)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${moeda(i.valor)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${moeda(i.subtotal)}</td></tr>`).join('') : `<tr><td colspan="4" style="padding:8px;border-bottom:1px solid #e5e7eb">Nenhum item informado.</td></tr>`}</tbody></table>`;
  const detalhe = (label, valor) => valor ? `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:8px"><strong>${label}</strong><br>${html(valor)}</div>` : '';
  return `<div style="width:794px;min-height:1123px;box-sizing:border-box;padding:34px;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff"><div style="display:flex;justify-content:space-between;gap:20px;border-bottom:4px solid #0f172a;padding-bottom:14px"><div><h1 style="margin:0;color:#0f172a;font-size:28px">${html(empresa)}</h1><p style="margin:5px 0 0;color:#475569">${html(tel)}${resp ? ' • ' + html(resp) : ''}</p></div><div style="text-align:right"><strong style="font-size:22px;color:#0f172a">ORÇAMENTO</strong><p style="margin:5px 0;color:#475569">${html(d.numero || hoje)}</p></div></div><div style="margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><strong>Cliente</strong><br>${html(d.cliente)}</div><div><strong>Validade</strong><br>${html(dataBR(d.validade) || '-')}</div><div><strong>Título</strong><br>${html(d.titulo)}</div><div><strong>WhatsApp</strong><br>${html(d.telefone || '-')}</div>${detalhe('Forma de pagamento', d.formaPagamento)}${detalhe('Prazo de execução', d.prazoExecucao)}${detalhe('Garantia', d.garantia)}</div>${tabela('Mão de obra', d.maoObra)}${tabela('Itens / produtos', d.produtos)}<div style="margin-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:right"><div><small>Mão de obra</small><br><strong>${moeda(totalMao)}</strong></div><div><small>Produtos</small><br><strong>${moeda(totalProdutos)}</strong></div><div style="font-size:24px;color:#0f172a"><small>Total geral</small><br><strong>${moeda(d.total)}</strong></div></div>${d.observacoes ? `<div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:8px;padding:10px"><strong>Observações</strong><p style="white-space:pre-wrap;margin:6px 0 0">${html(d.observacoes)}</p></div>` : ''}</div>`;
}

function limparPreviaOrcamento() { const previa = $('area-previa'); const conteudo = $('conteudo-pdf'); if (conteudo) conteudo.innerHTML = ''; if (previa) previa.style.display = 'none'; }
function gerarPreviaOrcamento(opcoes = {}) { if (!coletarItens().length) { limparPreviaOrcamento(); if (!opcoes.silencioso) alert('Adicione pelo menos uma mão de obra ou produto.'); return false; } $('conteudo-pdf').innerHTML = gerarHtmlOrcamento(); $('area-previa').style.display = 'block'; calcularTotal(); salvarRascunho(); return true; }
function baixarPDF() { if (!gerarPreviaOrcamento()) return; if (typeof html2pdf !== 'function') return alert('Biblioteca de PDF não carregou. Atualize a página.'); document.body.classList.add('gerando-pdf'); const nome = ($('titulo')?.value || 'orcamento').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'orcamento'; const worker = html2pdf().set({ margin: 0, filename: `${nome}.pdf`, image: { type: 'jpeg', quality: .98 }, html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 }, jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' } }).from($('conteudo-pdf')).save(); Promise.resolve(worker).catch(error => { console.error('Erro ao gerar PDF:', error); alert('Não foi possível gerar o PDF.'); }).then(() => document.body.classList.remove('gerando-pdf')); }

async function salvarPayloadOrcamento(payloadCompleto, payloadCompat) {
  if (orcamentoSalvoAtualId) {
    let resp = await _supabase.from('orcamentos').update(payloadCompleto).eq('id', orcamentoSalvoAtualId).eq('usuario_id', usuarioGeradorId).select('id,public_token,link_publico').maybeSingle();
    if (resp.error) resp = await _supabase.from('orcamentos').update(payloadCompat).eq('id', orcamentoSalvoAtualId).eq('usuario_id', usuarioGeradorId).select('id').maybeSingle();
    return resp;
  }
  let resp = await _supabase.from('orcamentos').insert(payloadCompleto).select('id,public_token,link_publico').single();
  if (resp.error) resp = await _supabase.from('orcamentos').insert(payloadCompat).select('id').single();
  return resp;
}

async function salvarOrcamentoPremium(opcoes = {}) {
  if (!ehPremium()) { if (!opcoes.silencioso) window.location.href = '/planos.html#assinar-plano-premium'; return null; }
  if (!gerarPreviaOrcamento({ silencioso: opcoes.silencioso })) return null;
  const d = dadosOrcamento();
  const itens = [...d.maoObra, ...d.produtos];
  try {
    if (!tokenPublicoAtual) tokenPublicoAtual = gerarTokenPublico();
    const link = montarLinkPublico(tokenPublicoAtual, orcamentoSalvoAtualId);
    const payloadCompat = { usuario_id: usuarioGeradorId, cliente_nome: d.cliente, total: d.total, status: 'pendente', itens };
    const payloadCompleto = { ...payloadCompat, numero_orcamento: d.numero, cliente_whatsapp: d.telefone, titulo: d.titulo, observacoes: d.observacoes, forma_pagamento: d.formaPagamento, prazo_execucao: d.prazoExecucao, garantia: d.garantia, public_token: tokenPublicoAtual, link_publico: link, atualizado_em: new Date().toISOString() };
    if (!orcamentoSalvoAtualId) payloadCompleto.criado_em = new Date().toISOString();
    const resp = await salvarPayloadOrcamento(payloadCompleto, payloadCompat);
    if (resp.error) throw resp.error;
    orcamentoSalvoAtualId = resp.data?.id || orcamentoSalvoAtualId;
    tokenPublicoAtual = resp.data?.public_token || tokenPublicoAtual;
    linkOrcamentoAtual = montarLinkPublico(tokenPublicoAtual, orcamentoSalvoAtualId);
    if (!resp.data?.link_publico && tokenPublicoAtual) { try { await _supabase.from('orcamentos').update({ link_publico: linkOrcamentoAtual }).eq('id', orcamentoSalvoAtualId).eq('usuario_id', usuarioGeradorId); } catch (_) {} }
    orcamentoAlterado = false;
    mostrarStatus('Orçamento salvo. Link disponível para envio.');
    atualizarAcoesLink();
    salvarRascunho();
    return orcamentoSalvoAtualId;
  } catch (e) { console.error(e); if (!opcoes.silencioso) alert('Não foi possível salvar. Verifique a tabela orcamentos no Supabase.'); return null; }
}

function atualizarAcoesLink() {
  const temLink = !!(linkOrcamentoAtual && orcamentoSalvoAtualId && !orcamentoAlterado);
  ['btn-copiar-link','btn-abrir-online','btn-registrar-caixa'].forEach(id => { const b = $(id); if (b) b.disabled = !temLink; });
  const box = $('link-orcamento-box'), inp = $('link-orcamento-input');
  if (box) box.style.display = temLink ? 'block' : 'none';
  if (inp) inp.value = temLink ? linkOrcamentoAtual : '';
}
async function copiarLinkOrcamento() { if (!linkOrcamentoAtual || orcamentoAlterado) { const id = await salvarOrcamentoPremium({ silencioso: true }); if (!id) return alert('Salve o orçamento antes de copiar o link.'); } await navigator.clipboard.writeText(linkOrcamentoAtual); alert('Link copiado.'); }
function abrirOrcamentoOnline() { if (!linkOrcamentoAtual || orcamentoAlterado) return alert('Salve o orçamento antes de abrir online.'); window.open(linkOrcamentoAtual, '_blank'); }
function registrarCaixaAtual() { if (!orcamentoSalvoAtualId || orcamentoAlterado) return alert('Salve o orçamento antes de registrar no caixa.'); location.href = `/fluxo-caixa.html?orcamento_id=${encodeURIComponent(orcamentoSalvoAtualId)}`; }

async function enviarWhatsappPremium() {
  if (!ehPremium()) return window.location.href = '/planos.html#assinar-plano-premium';
  const d = dadosOrcamento();
  const tel = d.telefone.replace(/\D/g, '');
  if (!tel) return alert('Informe o WhatsApp do cliente.');
  const id = await salvarOrcamentoPremium({ silencioso: true });
  if (!id) return alert('Não foi possível salvar o orçamento antes do envio.');
  const numero = tel.startsWith('55') ? tel : '55' + tel;
  const msg = `Olá ${d.cliente}, segue seu orçamento: ${linkOrcamentoAtual}\n\nVocê pode aprovar ou recusar pelo link.`;
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
}

function carregarListaLocal(chave) { try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch (_) { return []; } }
function salvarListaLocal(chave, lista) { localStorage.setItem(chave, JSON.stringify(lista.slice(0, 80))); }
function recorrenteExiste(lista, item) { return lista.some(x => String(x.descricao || '').trim().toLowerCase() === String(item.descricao || '').trim().toLowerCase() && Number(x.valor || 0) === Number(item.valor || 0)); }
function carregarRecorrentesLocais() { recorrentesCache = { mao_obra: carregarListaLocal(FS_REC_MAO).map(i => ({ ...i, tipo: 'mao_obra' })), produto: carregarListaLocal(FS_REC_PROD).map(i => ({ ...i, tipo: 'produto' })) }; }
async function migrarRecorrentesLocaisParaSupabase() { if (!recorrentesSupabaseDisponivel || !usuarioGeradorId || !ehPremium()) return; const locais = [...carregarListaLocal(FS_REC_MAO).map(i => ({ ...i, tipo: 'mao_obra' })), ...carregarListaLocal(FS_REC_PROD).map(i => ({ ...i, tipo: 'produto' }))].filter(i => i.descricao); if (!locais.length) return; const payload = locais.map(i => ({ usuario_id: usuarioGeradorId, tipo: i.tipo, descricao: i.descricao, qtd: Number(i.qtd || i.quantidade || 1), valor: Number(i.valor || i.valor_unitario || 0) })); try { await _supabase.from('recorrentes_orcamento').upsert(payload, { onConflict: 'usuario_id,tipo,descricao,valor', ignoreDuplicates: true }); localStorage.removeItem(FS_REC_MAO); localStorage.removeItem(FS_REC_PROD); } catch (e) { console.warn('Não foi possível migrar recorrentes locais:', e); } }
async function carregarRecorrentesGerador() { recorrentesSupabaseDisponivel = false; carregarRecorrentesLocais(); if (!usuarioGeradorId || !ehPremium()) return; try { const { data, error } = await _supabase.from('recorrentes_orcamento').select('id,tipo,descricao,qtd,valor,created_at').eq('usuario_id', usuarioGeradorId).order('created_at', { ascending: false }).limit(200); if (error) throw error; recorrentesSupabaseDisponivel = true; await migrarRecorrentesLocaisParaSupabase(); const { data: atualizados, error: erroReload } = await _supabase.from('recorrentes_orcamento').select('id,tipo,descricao,qtd,valor,created_at').eq('usuario_id', usuarioGeradorId).order('created_at', { ascending: false }).limit(200); const lista = erroReload ? (data || []) : (atualizados || []); recorrentesCache = { mao_obra: lista.filter(i => i.tipo === 'mao_obra'), produto: lista.filter(i => i.tipo === 'produto') }; } catch (e) { recorrentesSupabaseDisponivel = false; carregarRecorrentesLocais(); console.warn('Tabela recorrentes_orcamento indisponível. Usando fallback local:', e); } }
async function salvarRecorrentes(tipo) { if (!ehPremium()) return window.location.href = '/planos.html#assinar-plano-premium'; const itens = coletarItens(tipo); if (!itens.length) return alert('Preencha pelo menos um item para salvar como recorrente.'); const novos = itens.filter(i => !recorrenteExiste(recorrentesCache[tipo] || [], i)); if (!novos.length) return alert('Esses recorrentes já estão salvos.'); if (recorrentesSupabaseDisponivel && usuarioGeradorId) { try { const payload = novos.map(i => ({ usuario_id: usuarioGeradorId, tipo, descricao: i.descricao, qtd: Number(i.qtd || 1), valor: Number(i.valor || 0) })); const { error } = await _supabase.from('recorrentes_orcamento').upsert(payload, { onConflict: 'usuario_id,tipo,descricao,valor', ignoreDuplicates: true }); if (error) throw error; await carregarRecorrentesGerador(); renderRecorrentes(); alert('Recorrente salvo na sua conta.'); return; } catch (e) { recorrentesSupabaseDisponivel = false; console.warn('Erro ao salvar recorrente no Supabase. Usando fallback local:', e); } } const chave = chaveRecorrente(tipo); const lista = carregarListaLocal(chave); novos.forEach(i => lista.unshift({ descricao: i.descricao, qtd: i.qtd, valor: i.valor, tipo })); salvarListaLocal(chave, lista); await carregarRecorrentesGerador(); renderRecorrentes(); alert('Recorrente salvo neste dispositivo.'); }
function usarRecorrente(tipo, index) { const item = (recorrentesCache[tipo] || [])[index]; if (item) adicionarLinhaOrcamento(tipo, item); }
async function excluirRecorrente(tipo, index) { const item = (recorrentesCache[tipo] || [])[index]; if (!item) return; if (item.id && recorrentesSupabaseDisponivel && usuarioGeradorId) { try { const { error } = await _supabase.from('recorrentes_orcamento').delete().eq('id', item.id).eq('usuario_id', usuarioGeradorId); if (error) throw error; await carregarRecorrentesGerador(); renderRecorrentes(); return; } catch (e) { console.warn('Erro ao excluir recorrente no Supabase:', e); } } const chave = chaveRecorrente(tipo); const lista = carregarListaLocal(chave); const idx = lista.findIndex(x => String(x.descricao) === String(item.descricao) && Number(x.valor || 0) === Number(item.valor || 0)); if (idx >= 0) lista.splice(idx, 1); salvarListaLocal(chave, lista); await carregarRecorrentesGerador(); renderRecorrentes(); }
function renderRecorrentes() { const render = (id, tipo) => { const box = $(id); if (!box) return; const lista = recorrentesCache[tipo] || []; box.innerHTML = lista.length ? lista.map((i, idx) => `<div class="rec-item"><span>${html(i.descricao)} • ${moeda(i.valor)}</span><div><button class="btn" type="button" onclick="usarRecorrente('${tipo}',${idx})">Usar</button><button class="btn red" type="button" onclick="excluirRecorrente('${tipo}',${idx})">×</button></div></div>`).join('') : '<small>Nenhum recorrente salvo.</small>'; }; render('rec-mao-obra', 'mao_obra'); render('rec-produtos', 'produto'); }

function salvarRascunho() { if (restaurandoRascunho) return; try { localStorage.setItem(FS_RASCUNHO, JSON.stringify({ ...dadosOrcamento(), orcamentoSalvoAtualId, tokenPublicoAtual, linkOrcamentoAtual })); } catch (_) {} }
function restaurarRascunho() { try { const r = JSON.parse(localStorage.getItem(FS_RASCUNHO) || 'null'); if (!r) return false; restaurandoRascunho = true; if ($('numero-orcamento')) $('numero-orcamento').value = r.numero || ''; $('titulo').value = r.titulo || ''; $('cliente').value = r.cliente || ''; $('tel-cliente').value = r.telefone || ''; $('validade').value = r.validade || $('validade').value; if ($('forma-pagamento')) $('forma-pagamento').value = r.formaPagamento || ''; if ($('prazo-execucao')) $('prazo-execucao').value = r.prazoExecucao || ''; if ($('garantia')) $('garantia').value = r.garantia || ''; $('observacoes').value = r.observacoes || ''; orcamentoSalvoAtualId = r.orcamentoSalvoAtualId || null; tokenPublicoAtual = r.tokenPublicoAtual || ''; linkOrcamentoAtual = r.linkOrcamentoAtual || montarLinkPublico(tokenPublicoAtual, orcamentoSalvoAtualId); $('lista-mao-obra').innerHTML = ''; $('lista-produtos').innerHTML = ''; (r.maoObra || []).forEach(i => adicionarLinhaOrcamento('mao_obra', i, { salvar: false })); (r.produtos || []).forEach(i => adicionarLinhaOrcamento('produto', i, { salvar: false })); return true; } catch (_) { return false; } finally { restaurandoRascunho = false; } }
function limparOrcamento() { if (!confirm('Limpar orçamento atual?')) return; localStorage.removeItem(FS_RASCUNHO); orcamentoSalvoAtualId = null; tokenPublicoAtual = ''; linkOrcamentoAtual = ''; orcamentoAlterado = false; ['numero-orcamento','titulo','cliente','tel-cliente','forma-pagamento','prazo-execucao','garantia','observacoes'].forEach(id => { const campo = $(id); if (campo) campo.value = ''; }); $('lista-mao-obra').innerHTML = ''; $('lista-produtos').innerHTML = ''; prepararDatas(); adicionarLinhaOrcamento('mao_obra', {}, { salvar: false }); adicionarLinhaOrcamento('produto', {}, { salvar: false }); calcularTotal(); limparPreviaOrcamento(); mostrarStatus(''); atualizarAcoesLink(); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarGerador); else iniciarGerador();
window.abrirModalLoginGerador = abrirModalLoginGerador;
window.fecharModalLoginGerador = fecharModalLoginGerador;
window.adicionarLinhaOrcamento = adicionarLinhaOrcamento;
window.removerLinhaOrcamento = removerLinhaOrcamento;
window.duplicarLinhaOrcamento = duplicarLinhaOrcamento;
window.gerarPreviaOrcamento = gerarPreviaOrcamento;
window.baixarPDF = baixarPDF;
window.salvarOrcamentoPremium = salvarOrcamentoPremium;
window.enviarWhatsappPremium = enviarWhatsappPremium;
window.copiarLinkOrcamento = copiarLinkOrcamento;
window.abrirOrcamentoOnline = abrirOrcamentoOnline;
window.registrarCaixaAtual = registrarCaixaAtual;
window.salvarRecorrentes = salvarRecorrentes;
window.usarRecorrente = usarRecorrente;
window.excluirRecorrente = excluirRecorrente;
window.limparOrcamento = limparOrcamento;
