/* =========================================================
   FS ORÇAMENTOS - clientes-toggle-fix.js
   Modal do formulário + link da lista para cliente.html?id=...
   ========================================================= */
(function () {
  'use strict';

  let eventosConfigurados = false;
  let eventosFichaConfigurados = false;

  function obterElementos() {
    const card = document.getElementById('card-form-cliente');
    const header = card?.querySelector('.clientes-card-header');
    const body = document.getElementById('corpo-form-cliente') || card?.querySelector('.clientes-card-body');
    const form = document.getElementById('form-cliente');
    return { card, header, body, form };
  }

  function abrirModalCliente() {
    const { card } = obterElementos();
    if (!card) return;
    card.classList.add('fs-modal-form-aberto');
    card.classList.remove('fs-form-card-collapsed', 'form-fechado');
    card.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fs-modal-form-lock');
    const botao = document.getElementById('btn-toggle-form-cliente');
    if (botao) {
      botao.textContent = 'Fechar';
      botao.setAttribute('aria-expanded', 'true');
    }
    setTimeout(() => document.getElementById('cliente-nome')?.focus(), 80);
  }

  function fecharModalCliente() {
    const { card } = obterElementos();
    if (!card) return;
    card.classList.remove('fs-modal-form-aberto');
    card.classList.add('fs-form-card-collapsed', 'form-fechado');
    card.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fs-modal-form-lock');
    const botao = document.getElementById('btn-toggle-form-cliente');
    if (botao) {
      botao.textContent = '+ Novo cliente';
      botao.setAttribute('aria-expanded', 'false');
    }
  }

  function abrirNovoCliente() {
    if (typeof window.limparFormularioCliente === 'function') window.limparFormularioCliente();
    const titulo = document.getElementById('titulo-form-cliente');
    const btnSalvar = document.getElementById('btn-salvar-cliente');
    if (titulo) titulo.textContent = 'Novo cliente';
    if (btnSalvar) btnSalvar.textContent = 'Salvar cliente';
    abrirModalCliente();
  }

  function formularioClienteTemErro() {
    const mensagem = document.getElementById('mensagem-clientes-form');
    return !!mensagem && mensagem.classList.contains('erro') && mensagem.textContent.trim().length > 0;
  }

  function formularioClienteProcessando() {
    const btnSalvar = document.getElementById('btn-salvar-cliente');
    const loading = String(btnSalvar?.textContent || '').toLowerCase().includes('salvando');
    return !!btnSalvar?.disabled || loading;
  }

  function fecharAposSalvarComSucesso() {
    const { card } = obterElementos();
    if (!card?.classList.contains('fs-modal-form-aberto')) return;
    let tentativas = 0;
    const checar = () => {
      tentativas += 1;
      if (!card.classList.contains('fs-modal-form-aberto')) return;
      if (formularioClienteTemErro()) return;
      if (!formularioClienteProcessando()) {
        const nome = document.getElementById('cliente-nome')?.value?.trim() || '';
        const id = document.getElementById('cliente-id')?.value?.trim() || '';
        const titulo = String(document.getElementById('titulo-form-cliente')?.textContent || '').toLowerCase();
        const voltouParaNovo = titulo.includes('novo cliente') && !id;
        if (voltouParaNovo && !nome) return fecharModalCliente();
      }
      if (tentativas < 12) setTimeout(checar, 250);
    };
    setTimeout(checar, 350);
  }

  function configurarModalCliente() {
    const { card, header, body } = obterElementos();
    if (!card || !header || !body) return;
    const h2 = header.querySelector('#titulo-form-cliente') || header.querySelector('h2');
    const p = header.querySelector('p');
    let botaoOriginal = document.getElementById('btn-toggle-form-cliente');
    if (!botaoOriginal) {
      botaoOriginal = document.createElement('button');
      botaoOriginal.type = 'button';
      botaoOriginal.id = 'btn-toggle-form-cliente';
      botaoOriginal.className = 'btn-toggle-form-mobile';
    }
    header.querySelectorAll('.fs-btn-toggle-card, .fs-modal-fechar').forEach((btn) => btn.remove());
    const titulo = h2?.textContent?.trim() || 'Novo cliente';
    const descricao = p?.textContent?.trim() || 'Preencha os dados principais do cliente para usar depois em orçamentos, ordens de serviço e histórico.';
    header.innerHTML = `<div class="clientes-header-texto"><h2 id="titulo-form-cliente">${titulo}</h2><p>${descricao}</p></div>`;
    botaoOriginal.textContent = '+ Novo cliente';
    botaoOriginal.setAttribute('aria-expanded', 'false');
    botaoOriginal.onclick = abrirNovoCliente;
    const btnFechar = document.createElement('button');
    btnFechar.type = 'button';
    btnFechar.className = 'fs-modal-fechar';
    btnFechar.innerHTML = '×';
    btnFechar.setAttribute('aria-label', 'Fechar');
    btnFechar.onclick = fecharModalCliente;
    header.appendChild(botaoOriginal);
    header.appendChild(btnFechar);
    header.classList.add('fs-card-header-toggle');
    body.classList.add('fs-collapsible-body');
    card.dataset.fsModalFormulario = 'cliente';
    card.classList.add('fs-form-card-collapsed', 'form-fechado');
    card.setAttribute('aria-hidden', 'true');
    if (!eventosConfigurados) {
      eventosConfigurados = true;
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') fecharModalCliente(); });
      card.addEventListener('click', (event) => { if (event.target === card) fecharModalCliente(); });
      const form = document.getElementById('form-cliente');
      if (form) form.addEventListener('submit', fecharAposSalvarComSucesso);
    }
  }

  function abrirFichaCliente(id) {
    if (!id) return;
    window.location.href = `/cliente.html?id=${encodeURIComponent(id)}`;
  }

  function prepararCardsFicha() {
    document.querySelectorAll('.cliente-item[data-cliente-id]').forEach((card) => {
      if (card.dataset.fichaClienteOk === '1') return;
      card.dataset.fichaClienteOk = '1';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('title', 'Abrir ficha completa do cliente');
    });
  }

  function configurarLinkFicha() {
    if (eventosFichaConfigurados) return;
    eventosFichaConfigurados = true;
    document.addEventListener('click', (event) => {
      const card = event.target.closest('.cliente-item[data-cliente-id]');
      if (!card) return;
      if (event.target.closest('button,a,input,select,textarea,label,.cliente-acoes')) return;
      abrirFichaCliente(card.dataset.clienteId);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest?.('.cliente-item[data-cliente-id]');
      if (!card) return;
      event.preventDefault();
      abrirFichaCliente(card.dataset.clienteId);
    });
    new MutationObserver(prepararCardsFicha).observe(document.documentElement, { childList: true, subtree: true });
  }

  function interceptarEdicao() {
    if (typeof window.editarCliente !== 'function' || window.editarCliente.__fsModalInterceptado) return;
    const original = window.editarCliente;
    window.editarCliente = function (id) {
      original(id);
      abrirModalCliente();
    };
    window.editarCliente.__fsModalInterceptado = true;
  }

  function interceptarLimpeza() {
    if (typeof window.limparFormularioCliente !== 'function' || window.limparFormularioCliente.__fsModalInterceptado) return;
    const original = window.limparFormularioCliente;
    window.limparFormularioCliente = function () {
      original();
      const botao = document.getElementById('btn-toggle-form-cliente');
      if (botao && !document.getElementById('card-form-cliente')?.classList.contains('fs-modal-form-aberto')) botao.textContent = '+ Novo cliente';
    };
    window.limparFormularioCliente.__fsModalInterceptado = true;
  }

  function injetarEstilo() {
    if (document.getElementById('fs-clientes-toggle-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'fs-clientes-toggle-fix-style';
    style.textContent = `
      body.fs-modal-form-lock{overflow:hidden!important}.clientes-grid{grid-template-columns:1fr!important}.cliente-item{cursor:pointer!important;position:relative!important}.cliente-item:hover{border-color:#ffc400!important;box-shadow:0 6px 18px rgba(62,39,35,.14)!important}.cliente-item .cliente-info h3::after{content:' Ver ficha';display:inline-flex;margin-left:7px;padding:3px 6px;border-radius:999px;background:#f8f4ee;border:1px solid #e4d8cc;color:#3e2723;font-size:9px;font-weight:950;text-transform:uppercase;vertical-align:middle}
      #card-form-cliente{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;margin:0 0 10px!important}#card-form-cliente>.clientes-card-header{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;background:transparent!important;border:0!important;padding:0!important;box-shadow:none!important}#card-form-cliente>.clientes-card-header .clientes-header-texto,#card-form-cliente>.clientes-card-header .fs-modal-fechar{display:none!important}#card-form-cliente #btn-toggle-form-cliente{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:132px!important;min-height:36px!important;border-radius:6px!important;border:1px solid var(--fs-amarelo,#ffc400)!important;background:var(--fs-marrom,#3e2723)!important;color:var(--fs-amarelo,#ffc400)!important;font-size:12px!important;font-weight:900!important;text-transform:uppercase!important;box-shadow:none!important;padding:8px 12px!important;cursor:pointer!important}#card-form-cliente:not(.fs-modal-form-aberto) .clientes-card-body{display:none!important}
      #card-form-cliente.fs-modal-form-aberto{position:fixed!important;inset:0!important;z-index:56000!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:16px!important;background:rgba(20,13,11,.68)!important;overflow-y:auto!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header,#card-form-cliente.fs-modal-form-aberto>.clientes-card-body{width:min(760px,100%)!important;margin:0 auto!important;background:#ffffff!important;color:var(--fs-texto,#2f241f)!important;border-left:1px solid var(--fs-borda,#d7ccc8)!important;border-right:1px solid var(--fs-borda,#d7ccc8)!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header{margin-top:28px!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;padding:12px 14px!important;border-top:4px solid var(--fs-amarelo,#ffc400)!important;border-bottom:1px solid var(--fs-borda,#d7ccc8)!important;border-radius:8px 8px 0 0!important;box-shadow:0 16px 34px rgba(0,0,0,.18)!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header .clientes-header-texto,#card-form-cliente.fs-modal-form-aberto>.clientes-card-header .fs-modal-fechar{display:block!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header h2{margin:0!important;color:var(--fs-marrom,#3e2723)!important;font-size:18px!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header p{margin:4px 0 0!important;color:var(--fs-texto-suave,#6d4c41)!important;font-size:12px!important;line-height:1.35!important}#card-form-cliente.fs-modal-form-aberto #btn-toggle-form-cliente{display:none!important}#card-form-cliente.fs-modal-form-aberto .fs-modal-fechar{width:34px!important;height:34px!important;border-radius:6px!important;border:1px solid #fecaca!important;background:#fff5f5!important;color:#b91c1c!important;font-size:22px!important;line-height:1!important;font-weight:900!important;cursor:pointer!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-body{display:block!important;padding:14px!important;border-bottom:1px solid var(--fs-borda,#d7ccc8)!important;border-radius:0 0 8px 8px!important;box-shadow:0 20px 44px rgba(0,0,0,.20)!important}#card-form-cliente.fs-modal-form-aberto .form-clientes,#card-form-cliente.fs-modal-form-aberto .form-linha{gap:10px!important}#card-form-cliente.fs-modal-form-aberto .campo input,#card-form-cliente.fs-modal-form-aberto .campo select,#card-form-cliente.fs-modal-form-aberto .campo textarea{border-radius:5px!important;padding:9px 10px!important;font-size:13px!important}#card-form-cliente.fs-modal-form-aberto .campo textarea{min-height:76px!important}@media(max-width:680px){#card-form-cliente.fs-modal-form-aberto{padding:10px!important}#card-form-cliente.fs-modal-form-aberto>.clientes-card-header{margin-top:10px!important}#card-form-cliente.fs-modal-form-aberto .form-linha{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarEstilo();
    configurarModalCliente();
    configurarLinkFicha();
    prepararCardsFicha();
    interceptarEdicao();
    interceptarLimpeza();
    setTimeout(() => { configurarModalCliente(); prepararCardsFicha(); interceptarEdicao(); interceptarLimpeza(); }, 250);
    setTimeout(() => { configurarModalCliente(); prepararCardsFicha(); interceptarEdicao(); interceptarLimpeza(); }, 900);
    setTimeout(() => { configurarModalCliente(); prepararCardsFicha(); interceptarEdicao(); interceptarLimpeza(); }, 1800);
  }

  window.fsAbrirModalCliente = abrirNovoCliente;
  window.fsFecharModalCliente = fecharModalCliente;
  window.abrirFichaCliente = abrirFichaCliente;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();