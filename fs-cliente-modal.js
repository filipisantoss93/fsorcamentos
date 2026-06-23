/* =========================================================
   FS ORÇAMENTOS - Modal padrão de busca/seleção de cliente
   Usado em ordens.html, recorrentes.html e clientes.html.
   Tema limpo em cinza, sem marrom/bege.
   ========================================================= */
(function () {
  'use strict';

  const MODAL_ID = 'fs-modal-cliente-padrao';
  const STYLE_ID = 'fs-modal-cliente-padrao-style';
  let clientesCacheModal = [];
  let contextoAtual = null;
  let carregandoClientes = false;

  function normalizar(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
  }

  function formatarClienteId(clienteOuNumero) {
    const numero = typeof clienteOuNumero === 'object' ? clienteOuNumero?.numero_cliente : clienteOuNumero;
    const n = Number(numero);
    return Number.isFinite(n) && n > 0 ? `CLI-${String(Math.trunc(n)).padStart(6, '0')}` : '';
  }

  function textoBuscaCliente(cliente) {
    return normalizar([
      formatarClienteId(cliente), cliente?.numero_cliente, cliente?.nome, cliente?.whatsapp,
      cliente?.email, cliente?.cpf_cnpj, cliente?.endereco, cliente?.cidade, cliente?.estado, cliente?.cep
    ].filter(Boolean).join(' '));
  }

  function contatoCliente(cliente) {
    return [
      cliente?.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : '',
      cliente?.email ? `E-mail: ${cliente.email}` : '',
      cliente?.cpf_cnpj ? `CPF/CNPJ: ${cliente.cpf_cnpj}` : ''
    ].filter(Boolean).join(' • ');
  }

  function localCliente(cliente) {
    return [cliente?.endereco, cliente?.cidade, cliente?.estado, cliente?.cep].filter(Boolean).join(' • ');
  }

  async function obterUsuarioId() {
    if (contextoAtual?.usuarioId) return contextoAtual.usuarioId;
    if (window.usuarioLogadoOS?.id) return window.usuarioLogadoOS.id;
    if (window.usuarioLogadoRecorrentes?.id) return window.usuarioLogadoRecorrentes.id;
    if (window.usuarioLogado?.id) return window.usuarioLogado.id;

    try {
      if (!window._supabase && typeof window.inicializarSupabaseFS === 'function') window.inicializarSupabaseFS();
      const { data: { session } } = await window._supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (erro) {
      console.warn('Modal cliente: erro ao obter usuário:', erro);
      return null;
    }
  }

  async function carregarClientesModal(forcar = false) {
    if (carregandoClientes) return clientesCacheModal;
    if (!forcar && clientesCacheModal.length) return clientesCacheModal;

    if (Array.isArray(contextoAtual?.clientes) && contextoAtual.clientes.length) {
      clientesCacheModal = contextoAtual.clientes;
      return clientesCacheModal;
    }
    if (Array.isArray(window.clientesCacheOS) && window.clientesCacheOS.length) {
      clientesCacheModal = window.clientesCacheOS;
      return clientesCacheModal;
    }
    if (Array.isArray(window.clientesRecorrentesCache) && window.clientesRecorrentesCache.length) {
      clientesCacheModal = window.clientesRecorrentesCache;
      return clientesCacheModal;
    }
    if (Array.isArray(window.clientesCache) && window.clientesCache.length) {
      clientesCacheModal = window.clientesCache;
      return clientesCacheModal;
    }

    if (!window._supabase) return [];
    const usuarioId = await obterUsuarioId();
    if (!usuarioId) return [];

    carregandoClientes = true;
    try {
      const { data, error } = await window._supabase
        .from('clientes')
        .select('id, numero_cliente, nome, cpf_cnpj, whatsapp, email, endereco, cidade, estado, cep, status, categoria')
        .eq('user_id', usuarioId)
        .order('nome', { ascending: true });

      if (error) {
        console.warn('Modal cliente: erro ao carregar clientes:', error);
        clientesCacheModal = [];
        return [];
      }

      clientesCacheModal = Array.isArray(data) ? data : [];
      return clientesCacheModal;
    } finally {
      carregandoClientes = false;
    }
  }

  function injetarEstilo() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fs-modal-cliente-overlay{position:fixed;inset:0;background:rgba(15,23,42,.72);display:none;align-items:flex-start;justify-content:center;z-index:30000;padding:18px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
      .fs-modal-cliente-overlay.ativo{display:flex;}
      .fs-modal-cliente-box{width:min(100%,760px);margin:28px auto;background:#fff;border-radius:18px;border:1px solid #d1d5db;border-top:6px solid #64748b;box-shadow:0 22px 70px rgba(15,23,42,.32);overflow:hidden;color:#111827;}
      .fs-modal-cliente-header{background:#1f2937;color:#fff;padding:18px 20px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #374151;}
      .fs-modal-cliente-header h3{margin:0;color:#fff;font-size:22px;line-height:1.15;font-weight:950;}
      .fs-modal-cliente-header p{margin:6px 0 0;color:#e5e7eb;font-size:14px;line-height:1.35;font-weight:650;}
      .fs-modal-cliente-fechar{border:none;background:#dc2626;color:#fff;width:42px;height:42px;border-radius:12px;font-size:28px;line-height:1;font-weight:950;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center;}
      .fs-modal-cliente-body{padding:20px;background:#fff;display:grid;gap:12px;}
      .fs-modal-cliente-input{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:14px 15px;font-size:16px;color:#111827;background:#fff;outline:none;box-shadow:0 0 0 4px rgba(100,116,139,.12);}
      .fs-modal-cliente-input:focus{border-color:#64748b;box-shadow:0 0 0 4px rgba(100,116,139,.22);}
      .fs-modal-cliente-btn{width:100%;min-height:50px;border-radius:12px;border:1px solid #64748b;background:#64748b;color:#fff;font-weight:950;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;}
      .fs-modal-cliente-btn.secundario{background:#fff;color:#1f2937;border-color:#cbd5e1;}
      .fs-modal-cliente-btn:hover{filter:brightness(.98);transform:translateY(-1px);}
      .fs-modal-cliente-resultados{display:grid;gap:10px;max-height:440px;overflow-y:auto;padding-right:2px;}
      .fs-modal-cliente-vazio{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:28px 18px;text-align:center;color:#475569;font-weight:800;line-height:1.45;}
      .fs-modal-cliente-vazio strong{display:block;color:#111827;font-size:20px;margin-bottom:8px;}
      .fs-modal-cliente-item{width:100%;text-align:left;background:#fff;border:1px solid #e5e7eb;border-left:6px solid #64748b;color:#111827;border-radius:14px;padding:14px;cursor:pointer;transition:.2s ease;}
      .fs-modal-cliente-item:hover{border-color:#94a3b8;box-shadow:0 8px 20px rgba(15,23,42,.12);transform:translateY(-1px);}
      .fs-modal-cliente-item strong{display:block;font-size:15px;margin-bottom:5px;}
      .fs-modal-cliente-item span{display:block;color:#475569;font-size:12px;line-height:1.45;font-weight:700;}
      @media(max-width:640px){.fs-modal-cliente-overlay{padding:14px 10px;}.fs-modal-cliente-box{margin:20px auto;border-radius:16px;}.fs-modal-cliente-header{padding:16px;}.fs-modal-cliente-body{padding:16px;}.fs-modal-cliente-header h3{font-size:21px;}.fs-modal-cliente-header p{font-size:13px;}}
    `;
    document.head.appendChild(style);
  }

  function garantirModal() {
    injetarEstilo();
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'fs-modal-cliente-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="fs-modal-cliente-box" role="dialog" aria-modal="true" aria-labelledby="fs-modal-cliente-titulo">
        <div class="fs-modal-cliente-header">
          <div><h3 id="fs-modal-cliente-titulo">Buscar cliente</h3><p id="fs-modal-cliente-descricao">Pesquise por ID, nome, telefone, e-mail, endereço, cidade ou CEP.</p></div>
          <button type="button" class="fs-modal-cliente-fechar" aria-label="Fechar" onclick="fsFecharModalClientePadrao()">×</button>
        </div>
        <div class="fs-modal-cliente-body">
          <input id="fs-modal-cliente-campo" class="fs-modal-cliente-input" type="search" placeholder="Ex: CLI-000001, João, telefone, cidade..." autocomplete="off">
          <button type="button" class="fs-modal-cliente-btn" onclick="fsBuscarClientesModalPadrao()">Buscar</button>
          <a id="fs-modal-cliente-cadastrar" class="fs-modal-cliente-btn secundario" href="clientes.html?novo=1">Cadastrar novo</a>
          <div id="fs-modal-cliente-resultados" class="fs-modal-cliente-resultados"><div class="fs-modal-cliente-vazio"><strong>Pesquise um cliente</strong>Digite ID, nome, telefone, e-mail ou endereço.</div></div>
        </div>
      </div>`;

    modal.addEventListener('click', (event) => { if (event.target === modal) window.fsFecharModalClientePadrao(); });
    document.body.appendChild(modal);

    const campo = document.getElementById('fs-modal-cliente-campo');
    if (campo) {
      campo.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          window.fsBuscarClientesModalPadrao();
        }
      });
    }
    return modal;
  }

  function estadoInicial() {
    const resultado = document.getElementById('fs-modal-cliente-resultados');
    if (resultado) resultado.innerHTML = '<div class="fs-modal-cliente-vazio"><strong>Pesquise um cliente</strong>Digite ID, nome, telefone, e-mail ou endereço.</div>';
  }

  async function abrirModalClientePadrao(opcoes = {}) {
    contextoAtual = {
      titulo: opcoes.titulo || 'Buscar cliente',
      descricao: opcoes.descricao || 'Pesquise por ID, nome, telefone, e-mail, endereço, cidade ou CEP.',
      cadastrarUrl: opcoes.cadastrarUrl || 'clientes.html?novo=1',
      onSelect: typeof opcoes.onSelect === 'function' ? opcoes.onSelect : null,
      usuarioId: opcoes.usuarioId || null,
      clientes: Array.isArray(opcoes.clientes) ? opcoes.clientes : null
    };

    const modal = garantirModal();
    const campo = document.getElementById('fs-modal-cliente-campo');
    const titulo = document.getElementById('fs-modal-cliente-titulo');
    const descricao = document.getElementById('fs-modal-cliente-descricao');
    const cadastrar = document.getElementById('fs-modal-cliente-cadastrar');

    if (titulo) titulo.textContent = contextoAtual.titulo;
    if (descricao) descricao.textContent = contextoAtual.descricao;
    if (cadastrar) cadastrar.href = contextoAtual.cadastrarUrl;
    if (campo) campo.value = '';

    estadoInicial();
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    await carregarClientesModal(true);
    setTimeout(() => campo?.focus(), 80);
  }

  function fecharModalClientePadrao() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.classList.remove('ativo');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function buscarClientesModalPadrao() {
    const campo = document.getElementById('fs-modal-cliente-campo');
    const resultado = document.getElementById('fs-modal-cliente-resultados');
    if (!resultado) return;

    const termoOriginal = campo?.value || '';
    const termo = normalizar(termoOriginal);
    const termoNumerico = apenasNumeros(termoOriginal);

    if (termo.length < 2 && termoNumerico.length < 1) {
      resultado.innerHTML = '<div class="fs-modal-cliente-vazio"><strong>Digite mais informações</strong>Digite o ID do cliente ou pelo menos 2 caracteres.</div>';
      return;
    }

    const encontrados = clientesCacheModal.filter((cliente) => {
      const texto = textoBuscaCliente(cliente);
      const numero = String(Number(cliente?.numero_cliente || 0));
      return texto.includes(termo) || (termoNumerico && numero === String(Number(termoNumerico)));
    }).slice(0, 40);

    if (!encontrados.length) {
      resultado.innerHTML = '<div class="fs-modal-cliente-vazio"><strong>Nenhum cliente encontrado</strong>Cadastre um novo cliente ou tente outro termo de busca.</div>';
      return;
    }

    resultado.innerHTML = encontrados.map((cliente) => {
      const codigo = formatarClienteId(cliente);
      const contato = contatoCliente(cliente);
      const local = localCliente(cliente);
      return `<button type="button" class="fs-modal-cliente-item" onclick="fsSelecionarClienteModalPadrao('${escapar(cliente.id)}')"><strong>${codigo ? escapar(codigo + ' - ') : ''}${escapar(cliente.nome || 'Cliente sem nome')}</strong><span>${escapar(contato || 'Sem contato cadastrado')}</span><span>${escapar(local || 'Sem endereço cadastrado')}</span></button>`;
    }).join('');
  }

  function selecionarClienteModalPadrao(clienteId) {
    const cliente = clientesCacheModal.find(item => String(item.id) === String(clienteId));
    if (!cliente) return;
    if (contextoAtual?.onSelect) contextoAtual.onSelect(cliente);
    fecharModalClientePadrao();
  }

  function instalarAdaptadores() {
    if (document.getElementById('form-ordem') || document.getElementById('ordem-cliente-id')) {
      window.abrirModalBuscaClienteOS = function abrirModalBuscaClienteOSPadrao() {
        abrirModalClientePadrao({
          titulo: 'Buscar cliente',
          descricao: 'Pesquise por ID, nome, telefone, e-mail, endereço, cidade ou CEP.',
          clientes: Array.isArray(window.clientesCacheOS) ? window.clientesCacheOS : null,
          usuarioId: window.usuarioLogadoOS?.id || null,
          cadastrarUrl: 'clientes.html?novo=1',
          onSelect(cliente) {
            if (typeof window.setValorOS === 'function') window.setValorOS('ordem-cliente-id', cliente.id || '');
            else {
              const input = document.getElementById('ordem-cliente-id');
              if (input) input.value = cliente.id || '';
            }
            if (typeof window.atualizarClienteVisualOS === 'function') window.atualizarClienteVisualOS(cliente.id || '');
            if (typeof window.atualizarSelectVeiculosPorClienteOS === 'function') window.atualizarSelectVeiculosPorClienteOS(cliente.id || '');
          }
        });
      };
    }

    if (document.getElementById('form-recorrente') || document.getElementById('recorrente-cliente-id')) {
      window.abrirModalBuscaClienteRecorrentes = function abrirModalBuscaClienteRecorrentesPadrao() {
        abrirModalClientePadrao({
          titulo: 'Buscar cliente',
          descricao: 'Pesquise por ID, nome, telefone, e-mail, endereço, cidade ou CEP.',
          clientes: Array.isArray(window.clientesRecorrentesCache) ? window.clientesRecorrentesCache : null,
          usuarioId: window.usuarioLogadoRecorrentes?.id || null,
          cadastrarUrl: 'clientes.html?novo=1',
          onSelect(cliente) {
            const input = document.getElementById('recorrente-cliente-id');
            if (input) input.value = cliente.id || '';
            if (typeof window.atualizarClienteSelecionadoRecorrentes === 'function') window.atualizarClienteSelecionadoRecorrentes(cliente.id || '');
            if (typeof window.renderizarSelectVeiculosRecorrentes === 'function') window.renderizarSelectVeiculosRecorrentes(cliente.id || '');
          }
        });
      };
    }

    if (document.getElementById('lista-clientes')) {
      window.abrirModalClientesPagina = function abrirModalClientesPaginaPadrao() {
        abrirModalClientePadrao({
          titulo: 'Buscar cliente',
          descricao: 'Pesquise por ID, nome, telefone, e-mail, CPF/CNPJ, endereço, cidade ou CEP.',
          clientes: Array.isArray(window.clientesCache) ? window.clientesCache : null,
          usuarioId: window.usuarioLogado?.id || null,
          cadastrarUrl: 'clientes.html?novo=1',
          onSelect(cliente) {
            if (Array.isArray(window.clientesCache) && !window.clientesCache.some(item => String(item.id) === String(cliente.id))) {
              window.clientesCache.unshift(cliente);
            }
            if (typeof window.renderizarClientes === 'function') window.renderizarClientes([cliente]);
            if (typeof window.atualizarResumoClientes === 'function') window.atualizarResumoClientes([cliente]);
            if (typeof window.editarCliente === 'function') window.editarCliente(cliente.id);
          }
        });
      };

      if (!document.getElementById('btn-buscar-cliente-modal-clientes')) {
        const alvo = document.querySelector('.clientes-topo-acoes') || document.querySelector('.filtros-clientes') || document.querySelector('.clientes-card-header');
        if (alvo) {
          const botao = document.createElement('button');
          botao.type = 'button';
          botao.id = 'btn-buscar-cliente-modal-clientes';
          botao.className = 'btn btn-primario';
          botao.textContent = 'Buscar cliente';
          botao.addEventListener('click', () => window.abrirModalClientesPagina());
          alvo.appendChild(botao);
        }
      }
    }
  }

  window.fsAbrirModalClientePadrao = abrirModalClientePadrao;
  window.fsFecharModalClientePadrao = fecharModalClientePadrao;
  window.fsBuscarClientesModalPadrao = buscarClientesModalPadrao;
  window.fsSelecionarClienteModalPadrao = selecionarClienteModalPadrao;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fecharModalClientePadrao();
  });

  function iniciar() {
    injetarEstilo();
    instalarAdaptadores();
    setTimeout(instalarAdaptadores, 700);
    setTimeout(instalarAdaptadores, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
