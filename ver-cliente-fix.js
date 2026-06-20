/* FS Orçamentos - correção pública da página ver.html */
(function () {
  'use strict';

  const CINZA_ESCURO = '#111827';
  const CINZA_ESCURO_2 = '#1f2937';
  const CINZA_TEXTO = '#111827';
  const CINZA_SUAVE = '#4b5563';
  const CINZA_FUNDO = '#f3f4f6';
  const CINZA_BORDA = '#e5e7eb';
  const AMARELO = '#ffc400';

  const FORMAS_VALIDAS = {
    credito: 'Crédito',
    debito: 'Débito',
    pix: 'Pix',
    dinheiro: 'Dinheiro'
  };

  const params = new URLSearchParams(location.search || '');
  const linkToken = (params.get('token') || params.get('public_token') || '').trim();

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function valor(...opcoes) {
    for (const item of opcoes) {
      if (item !== null && item !== undefined && String(item).trim() !== '') return String(item).trim();
    }
    return '';
  }

  function numeros(valorOriginal) {
    return String(valorOriginal || '').replace(/\D/g, '');
  }

  function moeda(valorOriginal) {
    return Number(valorOriginal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function dataBR(valorOriginal) {
    const data = new Date(valorOriginal || '');
    return isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR');
  }

  function numeroFmt(numero) {
    if (!numero && numero !== 0) return '';
    const n = Number(numero);
    return Number.isFinite(n) ? String(n).padStart(6, '0') : String(numero);
  }

  function statusLabel(status) {
    return ({ pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', em_servico: 'Em serviço', finalizado: 'Finalizado' })[status] || status || 'Pendente';
  }

  function normalizarForma(forma) {
    const f = normalizar(forma);
    if (f === 'cartao_credito' || f === 'cartao credito' || f === 'credito') return 'credito';
    if (f === 'cartao_debito' || f === 'cartao debito' || f === 'debito') return 'debito';
    if (f === 'pix') return 'pix';
    if (f === 'dinheiro') return 'dinheiro';
    return '';
  }

  function normalizarItem(item) {
    const qtd = Number(item?.qtd ?? item?.quantidade ?? item?.qtde ?? 1);
    const valorUnitario = Number(item?.valor ?? item?.valor_unitario ?? item?.preco ?? 0);
    return {
      descricao: item?.descricao || item?.desc || item?.item || item?.nome || '',
      qtd,
      valor: valorUnitario,
      subtotal: Number(item?.subtotal ?? item?.total ?? qtd * valorUnitario)
    };
  }

  function aplicarCinzaForte() {
    const raiz = document.documentElement;
    raiz.style.setProperty('--ver-cor-primaria', CINZA_ESCURO);
    raiz.style.setProperty('--ver-cor-secundaria', CINZA_ESCURO_2);
    raiz.style.setProperty('--ver-cor-destaque', AMARELO);
    raiz.style.setProperty('--ver-cor-fundo', CINZA_FUNDO);
    raiz.style.setProperty('--ver-cor-pagina', '#f1f3f6');
    raiz.style.setProperty('--ver-cor-texto-topo', '#ffffff');
    raiz.style.setProperty('--ver-cor-texto-tabela', AMARELO);
    raiz.style.setProperty('--fs-marrom', CINZA_ESCURO);
    raiz.style.setProperty('--fs-marrom-2', CINZA_ESCURO_2);
    raiz.style.setProperty('--fs-marrom-3', '#374151');
    raiz.style.setProperty('--fs-texto', CINZA_TEXTO);
    raiz.style.setProperty('--fs-texto-suave', CINZA_SUAVE);
    raiz.style.setProperty('--fs-creme', CINZA_FUNDO);
    raiz.style.setProperty('--fs-creme-2', '#f9fafb');
  }

  function injetarEstilo() {
    let style = document.getElementById('fs-ver-cliente-fix-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'fs-ver-cliente-fix-style';
      document.head.appendChild(style);
    }

    style.textContent = `
      :root{--ver-cor-primaria:${CINZA_ESCURO}!important;--ver-cor-secundaria:${CINZA_ESCURO_2}!important;--ver-cor-destaque:${AMARELO}!important;--ver-cor-fundo:${CINZA_FUNDO}!important;--ver-cor-pagina:#f1f3f6!important;--fs-marrom:${CINZA_ESCURO}!important;--fs-marrom-2:${CINZA_ESCURO_2}!important;--fs-texto:${CINZA_TEXTO}!important;--fs-texto-suave:${CINZA_SUAVE}!important;--fs-creme:${CINZA_FUNDO}!important;}
      body:not(.gerando-pdf){background:#f1f3f6!important;color:${CINZA_TEXTO}!important;}
      .pagina-ver{background:#fff!important;color:${CINZA_TEXTO}!important;}
      .ver-emissor-topo{background:linear-gradient(135deg,${CINZA_ESCURO},${CINZA_ESCURO_2})!important;color:#fff!important;border-bottom-color:${AMARELO}!important;box-shadow:0 12px 28px rgba(15,23,42,.22)!important;}
      .ver-logo-box{border-color:${AMARELO}!important;background:#fff!important;}
      #ver-logo-placeholder{background:${AMARELO}!important;color:${CINZA_ESCURO}!important;}
      .ver-emissor-info .ver-label,.ver-emissor-info h1{color:${AMARELO}!important;}
      .ver-emissor-info p,.ver-emissor-dados span{color:#fff!important;}
      .numero-orcamento,.box-info,.observacoes-box,.msg-resposta,.veiculo-orcamento-box,.total-box{background:${CINZA_FUNDO}!important;color:${CINZA_TEXTO}!important;border-color:${CINZA_BORDA}!important;border-left-color:${AMARELO}!important;}
      h1#titulo-orcamento,.box-info strong,.observacoes-box strong,.veiculo-orcamento-box strong,.rodape strong,.numero-orcamento,.total-box{color:${CINZA_ESCURO}!important;}
      .linha-divisoria{background:${AMARELO}!important;}
      th,table th,.tabela-wrapper th,#conteudo-orcamento th{background:${CINZA_ESCURO}!important;color:${AMARELO}!important;}
      td,table td,#conteudo-orcamento td{color:${CINZA_TEXTO}!important;}
      tbody tr:nth-child(even),tr:nth-child(even){background:#f9fafb!important;}
      .modal-pagamento-card{background:#fff!important;color:${CINZA_ESCURO}!important;border-top-color:${AMARELO}!important;}
      .modal-pagamento-card h3{color:${CINZA_ESCURO}!important;}
      .modal-pagamento-card p{color:${CINZA_SUAVE}!important;}
      .formas-pagamento-grid button[data-forma-invalida="true"]{display:none!important;}
      .gerar-os-box,.btn-gerar-os,a[href*="ordens.html?orcamento_id"],a[href*="ordens.html%3Forcamento_id"]{display:none!important;}
      .botoes-cliente-ver{display:grid;grid-template-columns:1fr;gap:12px;margin-top:24px;}
      .btn-download-pdf-ver{border:2px solid ${AMARELO};background:${CINZA_ESCURO};color:${AMARELO};border-radius:14px;padding:15px 12px;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:.4px;box-shadow:0 8px 22px rgba(15,23,42,.16);}
      .btn-download-pdf-ver:hover{transform:translateY(-1px);}
      @media print{.botoes-cliente-ver,.botoes-status,.whatsapp-empresa-box{display:none!important;}}
    `;
  }

  function nomeEmpresaOrc(orcamento) {
    return valor(
      orcamento?.nome_empresa,
      orcamento?.empresa_nome,
      orcamento?.empresa,
      orcamento?.emissor_empresa,
      orcamento?.nomeEmpresa,
      orcamento?.dados_empresa?.nome_empresa,
      orcamento?.dadosEmpresa?.nome_empresa,
      orcamento?.perfil?.nome_empresa
    );
  }

  function consultorOrc(orcamento) {
    return valor(
      orcamento?.consultor,
      orcamento?.responsavel,
      orcamento?.nome_responsavel,
      orcamento?.dados_empresa?.nome,
      orcamento?.dadosEmpresa?.nome,
      orcamento?.perfil?.nome
    );
  }

  function dadosEmpresa(orcamento, perfil) {
    return {
      nomeEmpresa: valor(perfil?.nome_empresa, nomeEmpresaOrc(orcamento), 'Empresa'),
      consultor: valor(consultorOrc(orcamento), perfil?.nome, 'Consultor'),
      telefone: valor(perfil?.telefone_empresa, orcamento?.telefone_empresa, orcamento?.whatsapp_empresa, orcamento?.dados_empresa?.telefone_empresa, orcamento?.perfil?.telefone_empresa),
      cnpj: valor(perfil?.cnpj_empresa, orcamento?.cnpj_empresa, orcamento?.cpf_cnpj_empresa, orcamento?.dados_empresa?.cnpj_empresa, orcamento?.perfil?.cnpj_empresa),
      endereco: valor(perfil?.endereco_empresa, orcamento?.endereco_empresa, orcamento?.dados_empresa?.endereco_empresa, orcamento?.perfil?.endereco_empresa),
      fotoUrl: valor(perfil?.foto_url, orcamento?.foto_url, orcamento?.logo_url, orcamento?.empresa_logo, orcamento?.dados_empresa?.foto_url, orcamento?.perfil?.foto_url)
    };
  }

  async function carregarPerfilEmissorCorrigido(uid, orcamento) {
    const ids = [uid, orcamento?.usuario_id, orcamento?.user_id, orcamento?.perfil_id].filter(Boolean);
    if (!ids.length || !window._supabase) return null;

    for (const id of [...new Set(ids)]) {
      try {
        const resposta = await window._supabase
          .from('perfis')
          .select('nome,nome_empresa,telefone_empresa,endereco_empresa,cnpj_empresa,foto_url')
          .eq('id', id)
          .maybeSingle();
        if (!resposta.error && resposta.data) return resposta.data;
      } catch (_) {}
    }

    return null;
  }

  function chip(elemento, texto) {
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

    const limpo = numeros(telefone);
    if (!limpo) {
      box.style.display = 'none';
      return;
    }

    const numero = limpo.startsWith('55') ? limpo : '55' + limpo;
    link.href = 'https://wa.me/' + numero + '?text=' + encodeURIComponent('Olá! Estou falando sobre o orçamento recebido de ' + (nomeEmpresa || 'sua empresa') + '.');
    box.style.display = 'block';
  }

  function preencherTopo(orcamento, perfil) {
    const dados = dadosEmpresa(orcamento || {}, perfil || {});
    const logo = document.getElementById('ver-logo-empresa');
    const placeholder = document.getElementById('ver-logo-placeholder');
    const nome = document.getElementById('ver-nome-empresa');
    const consultor = document.getElementById('ver-consultor');
    const rodape = document.getElementById('rodape-nome-empresa');

    if (nome) nome.innerText = dados.nomeEmpresa;
    if (consultor) consultor.innerText = 'Consultor: ' + dados.consultor;
    if (rodape) rodape.innerText = dados.nomeEmpresa;

    chip(document.getElementById('ver-whatsapp-empresa'), dados.telefone ? 'WhatsApp: ' + dados.telefone : '');
    chip(document.getElementById('ver-cnpj-empresa'), dados.cnpj ? 'CNPJ/CPF: ' + dados.cnpj : '');
    chip(document.getElementById('ver-endereco-empresa'), dados.endereco ? 'Endereço: ' + dados.endereco : '');
    configurarWhatsapp(dados.telefone, dados.nomeEmpresa);

    if (logo && placeholder) {
      if (dados.fotoUrl) {
        logo.src = dados.fotoUrl + (dados.fotoUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
        logo.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        logo.removeAttribute('src');
        logo.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.innerText = (dados.nomeEmpresa || 'FS').substring(0, 2).toUpperCase();
      }
    }

    document.title = dados.nomeEmpresa + ' - ' + (orcamento?.assunto || 'Orçamento');
  }

  async function atualizarTopoComPerfil() {
    if (!window.orcamentoAtual) return;
    aplicarCinzaForte();
    const perfil = await carregarPerfilEmissorCorrigido(window.orcamentoAtual.usuario_id, window.orcamentoAtual);
    if (perfil) window.perfilEmissorAtual = perfil;
    preencherTopo(window.orcamentoAtual, window.perfilEmissorAtual || perfil || {});
  }

  function corrigirBotoesPagamento() {
    document.querySelectorAll('.formas-pagamento-grid button').forEach((botao) => {
      const match = (botao.getAttribute('onclick') || '').match(/selecionarFormaPagamento\(['"]([^'"]+)['"]\)/);
      const forma = normalizarForma(match?.[1] || botao.dataset.forma || botao.textContent);
      if (!forma || !FORMAS_VALIDAS[forma]) {
        botao.dataset.formaInvalida = 'true';
        return;
      }
      botao.dataset.formaInvalida = 'false';
      botao.textContent = FORMAS_VALIDAS[forma];
      botao.onclick = () => window.selecionarFormaPagamento(forma);
    });
  }

  function garantirBotaoPdf() {
    const container = document.getElementById('conteudo-orcamento');
    if (!container || document.getElementById('btn-baixar-pdf-cliente') || !window.orcamentoAtual) return;

    const box = document.createElement('div');
    box.className = 'botoes-cliente-ver';
    box.innerHTML = '<button type="button" id="btn-baixar-pdf-cliente" class="btn-download-pdf-ver">⬇️ Baixar PDF do orçamento</button>';

    const botoesStatus = container.querySelector('.botoes-status');
    if (botoesStatus) container.insertBefore(box, botoesStatus);
    else container.appendChild(box);

    box.querySelector('button').addEventListener('click', baixarPdfOrcamentoCliente);
  }

  function textoPdf() {
    const orcamento = window.orcamentoAtual || {};
    const perfil = window.perfilEmissorAtual || {};
    const dados = dadosEmpresa(orcamento, perfil);
    const itens = Array.isArray(orcamento.itens) ? orcamento.itens.map(normalizarItem) : [];
    const linhas = [dados.nomeEmpresa, 'Consultor: ' + dados.consultor];

    if (orcamento.numero_orcamento || orcamento.numero_orcamento === 0) linhas.push('Orçamento Nº ' + numeroFmt(orcamento.numero_orcamento));
    linhas.push('', 'Título: ' + (orcamento.assunto || 'Sem título'));
    linhas.push('Cliente: ' + (orcamento.cliente_nome || 'Não informado'));
    linhas.push('Contato: ' + (orcamento.cliente_whatsapp || 'Não informado'));
    linhas.push('Data: ' + dataBR(orcamento.criado_em || orcamento.created_at));
    linhas.push('Status: ' + statusLabel(orcamento.status || 'pendente'));
    linhas.push('', 'ITENS');

    if (itens.length) {
      itens.forEach((item, index) => {
        linhas.push(`${index + 1}. ${item.descricao || '-'} | Qtd: ${item.qtd} | Unit.: ${moeda(item.valor)} | Subtotal: ${moeda(item.subtotal)}`);
      });
    } else {
      linhas.push('Nenhum item encontrado.');
    }

    linhas.push('', 'TOTAL: ' + moeda(orcamento.total || 0));
    if (orcamento.observacoes) linhas.push('', 'Observações:', String(orcamento.observacoes));
    if (orcamento.forma_pagamento_cliente) linhas.push('', 'Forma de pagamento escolhida: ' + (FORMAS_VALIDAS[normalizarForma(orcamento.forma_pagamento_cliente)] || orcamento.forma_pagamento_cliente));

    return { linhas, nomeEmpresa: dados.nomeEmpresa, numero: orcamento.numero_orcamento || orcamento.numero || orcamento.id || 'cliente' };
  }

  function carregarJsPdf() {
    return new Promise((resolve) => {
      if (window.jspdf?.jsPDF) return resolve(true);
      const existente = document.getElementById('fs-jspdf-cliente');
      if (existente) {
        existente.addEventListener('load', () => resolve(true), { once: true });
        existente.addEventListener('error', () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = 'fs-jspdf-cliente';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function baixarPdfOrcamentoCliente() {
    if (!window.orcamentoAtual) {
      alert('Orçamento ainda não carregado.');
      return;
    }

    const ok = await carregarJsPdf();
    if (!ok || !window.jspdf?.jsPDF) {
      window.print();
      return;
    }

    try {
      const { linhas, nomeEmpresa, numero } = textoPdf();
      const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      let y = 14;
      const margem = 12;
      const largura = 186;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(nomeEmpresa, margem, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      linhas.slice(1).forEach((linha) => {
        doc.splitTextToSize(String(linha), largura).forEach((parte) => {
          if (y > 285) {
            doc.addPage();
            y = 14;
          }
          doc.text(parte, margem, y);
          y += 6;
        });
      });

      doc.save('orcamento-' + numeroFmt(numero) + '.pdf');
    } catch (erro) {
      console.error('Erro ao gerar PDF:', erro);
      window.print();
    }
  }

  async function carregarPorToken() {
    if (!linkToken || !window._supabase) return null;

    const titulo = document.getElementById('titulo-orcamento');
    const box = document.getElementById('conteudo-orcamento');
    if (titulo) titulo.innerText = 'Carregando...';
    if (box) box.innerHTML = '<div class="msg msg-carregando">Carregando orçamento pelo link seguro...</div>';

    const resposta = await window._supabase.rpc('buscar_orcamento_publico', { p_token: linkToken });
    if (resposta.error) {
      console.error(resposta.error);
      if (titulo) titulo.innerText = 'Aviso';
      if (box) box.innerHTML = '<div class="msg msg-erro">Não foi possível carregar este orçamento.</div>';
      return null;
    }

    const orcamento = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data;
    if (!orcamento) {
      if (titulo) titulo.innerText = 'Aviso';
      if (box) box.innerHTML = '<div class="msg msg-erro">Orçamento não encontrado.</div>';
      return null;
    }

    window.orcamentoAtual = orcamento;
    aplicarCinzaForte();
    window.perfilEmissorAtual = await carregarPerfilEmissorCorrigido(orcamento.usuario_id, orcamento);
    if (typeof window.carregarVeiculoDoOrcamento === 'function') window.veiculoOrcamentoAtual = await window.carregarVeiculoDoOrcamento(orcamento);
    preencherTopo(orcamento, window.perfilEmissorAtual || {});
    if (typeof window.preencherNumeroOrcamento === 'function') window.preencherNumeroOrcamento(orcamento);
    if (typeof window.renderizarOrcamento === 'function') window.renderizarOrcamento(orcamento);
    garantirBotaoPdf();
    return orcamento;
  }

  async function responderToken(status, forma) {
    if (!linkToken || !window._supabase) return;
    if (typeof window.setBotoesRespostaDesabilitados === 'function') window.setBotoesRespostaDesabilitados(true);

    const resposta = await window._supabase.rpc('responder_orcamento_publico_v2', {
      p_token: linkToken,
      p_resposta: status,
      p_forma_pagamento: forma || null
    });

    if (resposta.error) {
      console.error(resposta.error);
      alert('Não foi possível registrar a resposta.');
      if (typeof window.setBotoesRespostaDesabilitados === 'function') window.setBotoesRespostaDesabilitados(false);
      return;
    }

    const retorno = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data;
    if (retorno && retorno.sucesso === false) alert(retorno.mensagem || 'Resposta não registrada.');
    if (typeof window.fecharModalFormaPagamento === 'function') window.fecharModalFormaPagamento();
    await carregarPorToken();
  }

  function instalar() {
    aplicarCinzaForte();
    injetarEstilo();
    document.querySelectorAll('.gerar-os-box,.btn-gerar-os,a[href*="ordens.html?orcamento_id"]').forEach((el) => el.remove());

    window.FORMAS_PAGAMENTO = { ...FORMAS_VALIDAS };
    window.textoFormaPagamento = (forma) => FORMAS_VALIDAS[normalizarForma(forma)] || '-';
    window.aplicarTemaVerHtml = function () { aplicarCinzaForte(); return { primaria: CINZA_ESCURO, destaque: AMARELO, fundo: CINZA_FUNDO, textoTopo: '#ffffff', fundoPagina: '#f1f3f6' }; };
    window.coresDoTema = window.aplicarTemaVerHtml;
    window.carregarPerfilEmissor = async (uid) => carregarPerfilEmissorCorrigido(uid, window.orcamentoAtual || {});
    window.preencherTopoEmpresaVer = (orcamento, perfil) => preencherTopo(orcamento || window.orcamentoAtual || {}, perfil || window.perfilEmissorAtual || {});
    window.montarBotaoGerarOS = () => '';
    window.baixarPdfOrcamentoCliente = baixarPdfOrcamentoCliente;

    corrigirBotoesPagamento();
    garantirBotaoPdf();
    if (window.orcamentoAtual) atualizarTopoComPerfil();

    if (linkToken) {
      window.aprovarOrcamento = function () {
        if (!window.orcamentoAtual) return alert('Orçamento não carregado.');
        if (window.orcamentoAtual.status !== 'pendente') return alert('Este orçamento já foi respondido.');
        if (typeof window.abrirModalFormaPagamento === 'function') window.abrirModalFormaPagamento();
      };
      window.selecionarFormaPagamento = async (forma) => {
        if (!confirm('Confirmar aprovação do orçamento?')) return;
        await responderToken('aprovado', forma);
      };
      window.recusarOrcamento = async () => {
        if (!confirm('Deseja realmente recusar este orçamento?')) return;
        await responderToken('recusado', null);
      };
    }
  }

  async function iniciar() {
    instalar();
    if (linkToken) await carregarPorToken();
    instalar();
    setTimeout(() => { aplicarCinzaForte(); atualizarTopoComPerfil(); garantirBotaoPdf(); }, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, 350));
  else setTimeout(iniciar, 350);

  let tentativas = 0;
  const timer = setInterval(() => {
    instalar();
    if (++tentativas > 40) clearInterval(timer);
  }, 300);
})();
