/* =========================================================
   FS ORÇAMENTOS - ver-cliente-fix.js
   Correções da página pública do cliente (ver.html):
   - não exibe botão/box "Gerar OS" para o cliente;
   - carrega dados da empresa com fallbacks do orçamento/perfil;
   - aplica a cor/tema escolhido no orçamento, sobrescrevendo overrides globais;
   - limita forma_pagamento_cliente aos valores aceitos no banco.
   ========================================================= */
(function () {
  'use strict';

  const TEMAS_VER = {
    original: { primaria: '#3e2723', destaque: '#ffc400', fundo: '#efebe9', textoTopo: '#ffffff', fundoPagina: '#f1f3f6', textoTabela: '#ffc400' },
    bw: { primaria: '#111111', destaque: '#d1d5db', fundo: '#f5f5f5', textoTopo: '#ffffff', fundoPagina: '#eeeeee', textoTabela: '#ffffff' },
    preto: { primaria: '#111111', destaque: '#d1d5db', fundo: '#f5f5f5', textoTopo: '#ffffff', fundoPagina: '#eeeeee', textoTabela: '#ffffff' },
    black: { primaria: '#111111', destaque: '#d1d5db', fundo: '#f5f5f5', textoTopo: '#ffffff', fundoPagina: '#eeeeee', textoTabela: '#ffffff' },
    cinza: { primaria: '#4b5563', destaque: '#d1d5db', fundo: '#f3f4f6', textoTopo: '#ffffff', fundoPagina: '#f5f6f8', textoTabela: '#ffffff' },
    gray: { primaria: '#4b5563', destaque: '#d1d5db', fundo: '#f3f4f6', textoTopo: '#ffffff', fundoPagina: '#f5f6f8', textoTabela: '#ffffff' },
    blue: { primaria: '#0056b3', destaque: '#ffc400', fundo: '#e3f2fd', textoTopo: '#ffffff', fundoPagina: '#eef6ff', textoTabela: '#ffc400' },
    azul: { primaria: '#0056b3', destaque: '#ffc400', fundo: '#e3f2fd', textoTopo: '#ffffff', fundoPagina: '#eef6ff', textoTabela: '#ffc400' },
    green: { primaria: '#2e7d32', destaque: '#81c784', fundo: '#e8f5e9', textoTopo: '#ffffff', fundoPagina: '#f0faf1', textoTabela: '#ffffff' },
    verde: { primaria: '#2e7d32', destaque: '#81c784', fundo: '#e8f5e9', textoTopo: '#ffffff', fundoPagina: '#f0faf1', textoTabela: '#ffffff' },
    red: { primaria: '#dc2626', destaque: '#fecaca', fundo: '#fff1f2', textoTopo: '#ffffff', fundoPagina: '#fff7f7', textoTabela: '#ffffff' },
    vermelho: { primaria: '#dc2626', destaque: '#fecaca', fundo: '#fff1f2', textoTopo: '#ffffff', fundoPagina: '#fff7f7', textoTabela: '#ffffff' },
    pink: { primaria: '#db2777', destaque: '#f9a8d4', fundo: '#fdf2f8', textoTopo: '#ffffff', fundoPagina: '#fff7fb', textoTabela: '#ffffff' },
    rosa: { primaria: '#db2777', destaque: '#f9a8d4', fundo: '#fdf2f8', textoTopo: '#ffffff', fundoPagina: '#fff7fb', textoTabela: '#ffffff' }
  };

  const FORMAS_VALIDAS = {
    credito: 'Crédito',
    debito: 'Débito',
    pix: 'Pix',
    dinheiro: 'Dinheiro'
  };

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function valor(...valores) {
    for (const item of valores) {
      if (item !== null && item !== undefined && String(item).trim() !== '') return String(item).trim();
    }
    return '';
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function somenteNumeros(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function formatarTelefone(v) {
    if (typeof window.fsFormatarTelefoneBR === 'function') return window.fsFormatarTelefoneBR(v);
    let d = somenteNumeros(v);
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return v || '';
  }

  function formatarCpfCnpj(v) {
    if (typeof window.fsFormatarCpfCnpjBR === 'function') return window.fsFormatarCpfCnpjBR(v);
    return v || '';
  }

  function temaDoOrcamento(orcamento) {
    const tema = normalizar(orcamento?.tema_pdf || orcamento?.tema || orcamento?.theme || orcamento?.cor_pdf || orcamento?.cor || orcamento?.pdf_theme || 'original');
    return TEMAS_VER[tema] ? tema : 'original';
  }

  function aplicarTemaCorrigido(orcamento) {
    const tema = temaDoOrcamento(orcamento || window.orcamentoAtual || {});
    const c = TEMAS_VER[tema] || TEMAS_VER.original;
    const root = document.documentElement;

    root.style.setProperty('--ver-cor-primaria', c.primaria);
    root.style.setProperty('--ver-cor-destaque', c.destaque);
    root.style.setProperty('--ver-cor-fundo', c.fundo);
    root.style.setProperty('--ver-cor-texto-topo', c.textoTopo);
    root.style.setProperty('--ver-cor-pagina', c.fundoPagina);
    root.style.setProperty('--ver-cor-texto-tabela', c.textoTabela);
    root.style.setProperty('--fs-marrom', c.primaria);
    root.style.setProperty('--fs-marrom-2', c.primaria);
    root.style.setProperty('--fs-amarelo', c.destaque);
    root.style.setProperty('--fs-creme', c.fundo);
    root.style.setProperty('--fs-creme-2', c.fundoPagina);

    document.body.dataset.verTema = tema;
    return c;
  }

  function injetarEstiloTema() {
    if (document.getElementById('fs-ver-cliente-fix-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-ver-cliente-fix-style';
    style.textContent = `
      .gerar-os-box,
      .btn-gerar-os,
      a[href*="ordens.html?orcamento_id"],
      a[href*="ordens.html%3Forcamento_id"] {
        display: none !important;
      }

      body:not(.gerando-pdf) { background: var(--ver-cor-pagina) !important; }
      .pagina-ver { background: #ffffff !important; }
      .ver-emissor-topo { background: linear-gradient(135deg, var(--ver-cor-primaria), var(--ver-cor-primaria)) !important; color: var(--ver-cor-texto-topo) !important; border-bottom-color: var(--ver-cor-destaque) !important; }
      .ver-logo-box { border-color: var(--ver-cor-destaque) !important; }
      #ver-logo-placeholder { color: var(--ver-cor-primaria) !important; background: var(--ver-cor-destaque) !important; }
      .ver-emissor-info .ver-label,
      .ver-emissor-info h1 { color: var(--ver-cor-destaque) !important; }
      .ver-emissor-info p,
      .ver-emissor-dados span { color: var(--ver-cor-texto-topo) !important; }
      .ver-emissor-dados span { border-color: var(--ver-cor-destaque) !important; }
      h1#titulo-orcamento,
      .box-info strong,
      .observacoes-box strong,
      .veiculo-orcamento-box strong,
      .rodape strong,
      .numero-orcamento,
      .total-box { color: var(--ver-cor-primaria) !important; }
      .linha-divisoria,
      .numero-orcamento,
      .box-info,
      .observacoes-box,
      .veiculo-orcamento-box,
      .total-box,
      .msg-resposta { border-left-color: var(--ver-cor-destaque) !important; border-top-color: var(--ver-cor-destaque) !important; }
      .box-info,
      .numero-orcamento,
      .total-box,
      .veiculo-orcamento-box,
      .observacoes-box,
      .msg-resposta { background: var(--ver-cor-fundo) !important; }
      th,
      table th,
      .tabela-wrapper th,
      #conteudo-orcamento th { background: var(--ver-cor-primaria) !important; color: var(--ver-cor-texto-tabela) !important; }
      .btn-whatsapp-empresa { border-color: #1fb957 !important; }
      .formas-pagamento-grid button[data-forma-invalida="true"] { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function dadosEmpresaDoOrcamento(orcamento, perfil) {
    const nomeEmpresa = valor(perfil?.nome_empresa, orcamento?.nome_empresa, orcamento?.empresa_nome, orcamento?.empresa, orcamento?.emissor_nome_empresa, orcamento?.emissor_empresa, orcamento?.nome_empresa_emissor, orcamento?.dados_empresa?.nome_empresa, orcamento?.dados_empresa?.empresa, 'Empresa');
    const consultor = valor(orcamento?.consultor, orcamento?.responsavel, orcamento?.nome_responsavel, orcamento?.responsavel_nome, perfil?.nome, orcamento?.dados_empresa?.nome, 'Consultor');
    const telefone = valor(perfil?.telefone_empresa, orcamento?.telefone_empresa, orcamento?.whatsapp_empresa, orcamento?.empresa_telefone, orcamento?.telefone_emissor, orcamento?.emissor_telefone, orcamento?.dados_empresa?.telefone_empresa, orcamento?.dados_empresa?.whatsapp_empresa);
    const cnpj = valor(perfil?.cnpj_empresa, orcamento?.cnpj_empresa, orcamento?.cpf_cnpj_empresa, orcamento?.empresa_cnpj, orcamento?.emissor_cnpj, orcamento?.dados_empresa?.cnpj_empresa, orcamento?.dados_empresa?.cpf_cnpj_empresa);
    const endereco = valor(perfil?.endereco_empresa, orcamento?.endereco_empresa, orcamento?.empresa_endereco, orcamento?.endereco_emissor, orcamento?.dados_empresa?.endereco_empresa);
    const fotoUrl = valor(perfil?.foto_url, perfil?.logo_url, orcamento?.foto_url, orcamento?.logo_url, orcamento?.empresa_logo, orcamento?.logo_empresa, orcamento?.emissor_logo, orcamento?.dados_empresa?.foto_url, orcamento?.dados_empresa?.logo_url);
    return { nomeEmpresa, consultor, telefone, cnpj, endereco, fotoUrl };
  }

  async function carregarPerfilEmissorCorrigido(usuarioId, orcamento) {
    const possiveisIds = [usuarioId, orcamento?.usuario_id, orcamento?.user_id, orcamento?.id_usuario, orcamento?.perfil_id, orcamento?.emissor_id, orcamento?.empresa_id].filter(Boolean);
    if (!possiveisIds.length || !window._supabase) return null;

    for (const id of possiveisIds) {
      try {
        const { data, error } = await window._supabase
          .from('perfis')
          .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, logo_url')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (_) {}
    }
    return null;
  }

  function preencherChip(elemento, texto) {
    if (!elemento) return;
    if (texto) {
      elemento.innerText = texto;
      elemento.style.display = 'inline-flex';
    } else {
      elemento.innerText = '';
      elemento.style.display = 'none';
    }
  }

  function configurarWhatsapp(telefone, nomeEmpresa) {
    const box = document.getElementById('whatsapp-empresa-box');
    const link = document.getElementById('btn-whatsapp-empresa');
    if (!box || !link) return;

    const limpo = somenteNumeros(telefone);
    if (!limpo) {
      box.style.display = 'none';
      link.href = '#';
      return;
    }

    const numero = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const mensagem = `Olá! Estou falando sobre o orçamento recebido de ${nomeEmpresa || 'sua empresa'}.`;
    link.href = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    box.style.display = 'block';
  }

  function preencherTopoEmpresaCorrigido(orcamento, perfil) {
    const dados = dadosEmpresaDoOrcamento(orcamento || {}, perfil || {});

    const nomeEmpresaEl = document.getElementById('ver-nome-empresa');
    const consultorEl = document.getElementById('ver-consultor');
    const whatsappEl = document.getElementById('ver-whatsapp-empresa');
    const cnpjEl = document.getElementById('ver-cnpj-empresa');
    const enderecoEl = document.getElementById('ver-endereco-empresa');
    const logoImg = document.getElementById('ver-logo-empresa');
    const logoPlaceholder = document.getElementById('ver-logo-placeholder');

    if (nomeEmpresaEl) nomeEmpresaEl.innerText = dados.nomeEmpresa;
    if (consultorEl) consultorEl.innerText = `Consultor: ${dados.consultor}`;
    preencherChip(whatsappEl, dados.telefone ? `WhatsApp: ${formatarTelefone(dados.telefone)}` : '');
    preencherChip(cnpjEl, dados.cnpj ? `CNPJ/CPF: ${formatarCpfCnpj(dados.cnpj)}` : '');
    preencherChip(enderecoEl, dados.endereco ? `Endereço: ${dados.endereco}` : '');
    configurarWhatsapp(dados.telefone, dados.nomeEmpresa);

    if (logoImg && logoPlaceholder) {
      if (dados.fotoUrl) {
        logoImg.src = dados.fotoUrl + (dados.fotoUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
        logoImg.style.display = 'block';
        logoPlaceholder.style.display = 'none';
      } else {
        logoImg.removeAttribute('src');
        logoImg.style.display = 'none';
        logoPlaceholder.style.display = 'block';
        logoPlaceholder.innerText = (dados.nomeEmpresa || 'FS').substring(0, 2).toUpperCase();
      }
    }

    document.title = `${dados.nomeEmpresa} - ${orcamento?.assunto || 'Orçamento'}`;
  }

  function removerBotaoGerarOS() {
    document.querySelectorAll('.gerar-os-box, .btn-gerar-os, a[href*="ordens.html?orcamento_id"]').forEach(el => el.remove());
  }

  function normalizarFormaPagamento(forma) {
    const f = normalizar(forma);
    if (f === 'cartao_credito' || f === 'cartao credito' || f === 'credito') return 'credito';
    if (f === 'cartao_debito' || f === 'cartao debito' || f === 'debito') return 'debito';
    if (f === 'pix') return 'pix';
    if (f === 'dinheiro') return 'dinheiro';
    return '';
  }

  function corrigirBotoesPagamento() {
    document.querySelectorAll('.formas-pagamento-grid button').forEach((btn) => {
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/selecionarFormaPagamento\(['"]([^'"]+)['"]\)/);
      const forma = normalizarFormaPagamento(match?.[1] || btn.dataset.forma || btn.textContent);

      if (!forma || !FORMAS_VALIDAS[forma]) {
        btn.dataset.formaInvalida = 'true';
        return;
      }

      btn.dataset.formaInvalida = 'false';
      btn.textContent = FORMAS_VALIDAS[forma];
      btn.onclick = () => window.selecionarFormaPagamento(forma);
    });
  }

  function instalarPagamentoSchemaReal() {
    window.FORMAS_PAGAMENTO = { ...FORMAS_VALIDAS };
    window.textoFormaPagamento = function (forma) {
      return FORMAS_VALIDAS[normalizarFormaPagamento(forma)] || '-';
    };

    if (typeof window.selecionarFormaPagamento === 'function' && !window.selecionarFormaPagamento.__fsSchemaReal) {
      const original = window.selecionarFormaPagamento;
      window.selecionarFormaPagamento = function (forma) {
        const formaNormalizada = normalizarFormaPagamento(forma);
        if (!formaNormalizada) {
          alert('Forma de pagamento inválida. Escolha crédito, débito, Pix ou dinheiro.');
          return;
        }
        return original.call(this, formaNormalizada);
      };
      window.selecionarFormaPagamento.__fsSchemaReal = true;
    }

    corrigirBotoesPagamento();
  }

  function instalarOverrides() {
    injetarEstiloTema();
    removerBotaoGerarOS();
    instalarPagamentoSchemaReal();

    window.montarBotaoGerarOS = function () { return ''; };
    window.coresDoTema = function (tema) { return TEMAS_VER[normalizar(tema)] || TEMAS_VER.original; };
    window.aplicarTemaVerHtml = function (orcamento) { return aplicarTemaCorrigido(orcamento); };
    window.carregarPerfilEmissor = async function (usuarioId) { return carregarPerfilEmissorCorrigido(usuarioId, window.orcamentoAtual || {}); };
    window.preencherTopoEmpresaVer = function (orcamento, perfil) { preencherTopoEmpresaCorrigido(orcamento || window.orcamentoAtual || {}, perfil || window.perfilEmissorAtual || {}); };

    if (window.orcamentoAtual) {
      aplicarTemaCorrigido(window.orcamentoAtual);
      preencherTopoEmpresaCorrigido(window.orcamentoAtual, window.perfilEmissorAtual || {});
      removerBotaoGerarOS();
      instalarPagamentoSchemaReal();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarOverrides);
  else instalarOverrides();

  let tentativas = 0;
  const timer = setInterval(() => {
    instalarOverrides();
    if (++tentativas > 30) clearInterval(timer);
  }, 400);
})();