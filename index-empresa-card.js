/* =========================================================
   FS ORÇAMENTOS - index-empresa-card.js
   Card global da empresa no index para Grátis, Básico e Premium.
   Mostra logo, nome, WhatsApp, CPF/CNPJ e selo do plano no canto superior direito.
   ========================================================= */
(function () {
  'use strict';

  let atualizando = false;

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
  }

  function formatarTelefone(valor) {
    if (typeof window.fsFormatarTelefoneBR === 'function') return window.fsFormatarTelefoneBR(valor);
    let d = somenteNumeros(valor);
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    d = d.slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function formatarDocumento(valor) {
    if (typeof window.fsFormatarCpfCnpjBR === 'function') return window.fsFormatarCpfCnpjBR(valor);
    const d = somenteNumeros(valor).slice(0, 14);
    if (!d) return '';
    if (d.length <= 11) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }

  function labelDocumento(valor) {
    const d = somenteNumeros(valor);
    if (!d) return 'CPF/CNPJ';
    if (typeof window.fsLabelDocumentoBR === 'function') return window.fsLabelDocumentoBR(valor);
    return d.length <= 11 ? 'CPF' : 'CNPJ';
  }

  function labelPlano(plano, status) {
    const p = normalizar(plano || 'gratis');
    const s = normalizar(status || 'ativo');
    if (p === 'premium') return s === 'teste_gratis' ? 'Premium em teste' : 'Premium';
    if (p === 'basico') return 'Básico';
    return 'Grátis';
  }

  function classePlano(plano) {
    const p = normalizar(plano || 'gratis');
    if (p === 'premium') return 'premium';
    if (p === 'basico') return 'basico';
    return 'gratis';
  }

  async function aguardarSupabase(tentativas = 25) {
    for (let i = 0; i < tentativas; i += 1) {
      if (window._supabase) return true;
      if (typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
        if (window._supabase) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  async function obterPerfil() {
    const perfilLocal = {
      nome: localStorage.getItem('usuario_nome') || '',
      nome_empresa: localStorage.getItem('nome_empresa') || '',
      telefone_empresa: localStorage.getItem('telefone_empresa') || '',
      cnpj_empresa: localStorage.getItem('cnpj_empresa') || '',
      endereco_empresa: localStorage.getItem('endereco_empresa') || '',
      foto_url: localStorage.getItem('foto_url') || '',
      plano: localStorage.getItem('usuario_plano') || 'gratis',
      plano_status: localStorage.getItem('usuario_plano_status') || 'ativo'
    };

    try {
      const ok = await aguardarSupabase();
      if (!ok) return perfilLocal;

      const { data: sessaoData } = await window._supabase.auth.getSession();
      const userId = sessaoData?.session?.user?.id;
      if (!userId) return perfilLocal;

      const { data: perfil, error } = await window._supabase
        .from('perfis')
        .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano, plano_status')
        .eq('id', userId)
        .maybeSingle();

      if (error || !perfil) return perfilLocal;

      Object.entries(perfil).forEach(([chave, valor]) => {
        if (valor === null || valor === undefined || valor === '') return;
        if (chave === 'nome') localStorage.setItem('usuario_nome', valor);
        if (chave === 'plano') localStorage.setItem('usuario_plano', valor);
        if (chave === 'plano_status') localStorage.setItem('usuario_plano_status', valor);
        if (['nome_empresa', 'telefone_empresa', 'endereco_empresa', 'cnpj_empresa', 'foto_url'].includes(chave)) localStorage.setItem(chave, valor);
      });

      return { ...perfilLocal, ...perfil };
    } catch (error) {
      console.warn('Index card empresa: erro ao obter perfil:', error);
      return perfilLocal;
    }
  }

  function injetarEstilo() {
    if (document.getElementById('fs-index-empresa-card-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-index-empresa-card-style';
    style.textContent = `
      .fs-index-empresa-card {
        width: min(1120px, calc(100% - 24px));
        margin: 20px auto 16px;
        box-sizing: border-box;
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
        background: linear-gradient(135deg, var(--fs-marrom, #3e2723), var(--fs-marrom-2, #2c1b17));
        color: #fffaf0;
        border-radius: 24px;
        padding: 20px 20px 18px;
        box-shadow: 0 14px 38px rgba(0,0,0,.22);
        border: 1px solid rgba(255,255,255,.12);
        overflow: hidden;
      }

      .fs-index-empresa-card::after {
        content: '';
        position: absolute;
        right: -54px;
        bottom: -68px;
        width: 170px;
        height: 170px;
        border-radius: 50%;
        background: rgba(255, 196, 0, .10);
        pointer-events: none;
      }

      .fs-index-empresa-logo {
        width: 78px;
        height: 78px;
        border-radius: 22px;
        background: #fff;
        color: var(--fs-marrom, #3e2723);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-size: 28px;
        font-weight: 950;
        border: 4px solid var(--fs-amarelo, #ffc400);
        flex-shrink: 0;
        box-shadow: 0 8px 18px rgba(0,0,0,.20);
        z-index: 1;
      }

      .fs-index-empresa-logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 5px;
        box-sizing: border-box;
      }

      .fs-index-empresa-info {
        min-width: 0;
        padding-right: 160px;
        z-index: 1;
      }

      .fs-index-empresa-info h2 {
        margin: 0 0 8px;
        color: #ffffff !important;
        font-size: 28px;
        line-height: 1.12;
        font-weight: 950;
        word-break: break-word;
      }

      .fs-index-empresa-dados {
        display: flex;
        flex-wrap: wrap;
        gap: 7px 12px;
        align-items: center;
        color: rgba(255,255,255,.86);
        font-weight: 800;
        line-height: 1.4;
      }

      .fs-index-empresa-dados span {
        color: rgba(255,255,255,.86);
      }

      .fs-index-empresa-plano {
        position: absolute;
        top: 18px;
        right: 18px;
        z-index: 2;
        min-width: 122px;
        border-radius: 999px;
        padding: 10px 14px;
        text-align: center;
        font-weight: 950;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .2px;
        box-shadow: inset 0 -2px 0 rgba(0,0,0,.14), 0 8px 18px rgba(0,0,0,.18);
        border: 1px solid rgba(255,255,255,.18);
      }

      .fs-index-empresa-plano.gratis {
        background: #ffffff;
        color: var(--fs-marrom, #3e2723);
      }

      .fs-index-empresa-plano.basico {
        background: var(--fs-amarelo, #ffc400);
        color: var(--fs-marrom, #3e2723);
      }

      .fs-index-empresa-plano.premium {
        background: #18b26b;
        color: #ffffff;
        border-color: rgba(255,255,255,.35);
      }

      .premium-dashboard-oficina > .premium-empresa-topo {
        display: none !important;
      }

      @media (max-width: 640px) {
        .fs-index-empresa-card {
          width: min(100% - 24px, 1120px);
          grid-template-columns: auto 1fr;
          gap: 12px;
          padding: 18px 16px 18px;
          border-radius: 22px;
          margin-top: 18px;
        }

        .fs-index-empresa-logo {
          width: 72px;
          height: 72px;
          border-radius: 20px;
        }

        .fs-index-empresa-info {
          padding-right: 0;
          padding-top: 48px;
        }

        .fs-index-empresa-info h2 {
          font-size: 24px;
        }

        .fs-index-empresa-dados {
          font-size: 15px;
          gap: 4px 8px;
        }

        .fs-index-empresa-plano {
          top: 14px;
          right: 14px;
          min-width: 104px;
          padding: 9px 12px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function garantirCard() {
    let card = document.getElementById('fs-index-empresa-card');
    if (card) return card;

    const main = document.querySelector('main') || document.body;
    const primeiraHome = document.querySelector('.home-visao-plano') || main.firstElementChild;

    card = document.createElement('section');
    card.id = 'fs-index-empresa-card';
    card.className = 'fs-index-empresa-card';
    card.setAttribute('aria-label', 'Dados da empresa e plano atual');
    card.innerHTML = `
      <div class="fs-index-empresa-logo" id="fs-index-empresa-logo">FS</div>
      <div class="fs-index-empresa-info">
        <h2 id="fs-index-empresa-nome">FS Orçamentos</h2>
        <div class="fs-index-empresa-dados" id="fs-index-empresa-dados">
          <span>Complete os dados no Painel</span>
        </div>
      </div>
      <div class="fs-index-empresa-plano gratis" id="fs-index-empresa-plano">Grátis</div>
    `;

    if (primeiraHome && primeiraHome.parentNode) primeiraHome.parentNode.insertBefore(card, primeiraHome);
    else main.prepend(card);

    return card;
  }

  function removerCardPremiumDuplicado() {
    document.querySelectorAll('.premium-dashboard-oficina > .premium-empresa-topo').forEach(el => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function preencherCard(perfil) {
    const card = garantirCard();
    if (!card) return;

    const plano = perfil?.plano || localStorage.getItem('usuario_plano') || 'gratis';
    const status = perfil?.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo';
    const nome = perfil?.nome_empresa || localStorage.getItem('nome_empresa') || perfil?.nome || localStorage.getItem('usuario_nome') || 'FS Orçamentos';
    const telefone = perfil?.telefone_empresa || localStorage.getItem('telefone_empresa') || '';
    const doc = perfil?.cnpj_empresa || localStorage.getItem('cnpj_empresa') || '';
    const foto = perfil?.foto_url || localStorage.getItem('foto_url') || '';

    const logo = document.getElementById('fs-index-empresa-logo');
    const nomeEl = document.getElementById('fs-index-empresa-nome');
    const dados = document.getElementById('fs-index-empresa-dados');
    const planoEl = document.getElementById('fs-index-empresa-plano');

    if (nomeEl) nomeEl.textContent = nome;
    if (logo) logo.innerHTML = foto ? `<img src="${escapar(foto)}" alt="Logo da empresa">` : escapar((nome.trim().slice(0, 2).toUpperCase() || 'FS'));

    const partes = [];
    if (telefone) partes.push(`<span>WhatsApp: ${escapar(formatarTelefone(telefone))}</span>`);
    if (doc) partes.push(`<span>${escapar(labelDocumento(doc))}: ${escapar(formatarDocumento(doc))}</span>`);
    if (!partes.length) partes.push('<span>Complete WhatsApp e CPF/CNPJ no Painel</span>');
    if (dados) dados.innerHTML = partes.join('<span>·</span>');

    if (planoEl) {
      const classe = classePlano(plano);
      planoEl.className = `fs-index-empresa-plano ${classe}`;
      planoEl.textContent = labelPlano(plano, status);
    }

    removerCardPremiumDuplicado();
  }

  async function atualizar() {
    if (atualizando) return;
    atualizando = true;
    try {
      injetarEstilo();
      garantirCard();
      removerCardPremiumDuplicado();
      const perfil = await obterPerfil();
      preencherCard(perfil);
    } finally {
      atualizando = false;
    }
  }

  function iniciar() {
    atualizar();
    setTimeout(atualizar, 400);
    setTimeout(atualizar, 1200);
    setTimeout(atualizar, 2600);
  }

  window.fsAtualizarEmpresaCardIndex = atualizar;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  window.addEventListener('load', atualizar);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });
})();
