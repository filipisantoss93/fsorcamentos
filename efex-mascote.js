(() => {
  const VERSION = '20260712-3';
  const BASE = '/assets/images/';
  const AVATAR = `${BASE}avatar-fundotransparente.PNG?v=${VERSION}`;
  const IMAGES = {
    home: `${BASE}efex-divulgacao.JPG?v=${VERSION}`,
    diagnostico: `${BASE}efex-equipdiagnose.PNG?v=${VERSION}`,
    orcamento: `${BASE}efex-montandoorcamento.PNG?v=${VERSION}`,
    multimetro: `${BASE}efex-multimetro.PNG?v=${VERSION}`,
    osciloscopio: `${BASE}efex-osciloscopio.PNG?v=${VERSION}`,
    ar: `${BASE}efex-arcondicionado.PNG?v=${VERSION}`,
    caixa: `${BASE}efex-caixa.PNG?v=${VERSION}`,
    dica: `${BASE}efex-dica.PNG?v=${VERSION}`,
    relatorios: `${BASE}efex-relatorios.PNG?v=${VERSION}`,
    avatar: AVATAR
  };

  const contextos = {
    '/fluxo-caixa.html': {
      image: IMAGES.caixa,
      title: 'Controle financeiro com precisão',
      text: 'Registre entradas e saídas para acompanhar o resultado real da oficina e tomar decisões com segurança.'
    },
    '/dashboard.html': {
      image: IMAGES.relatorios,
      title: 'Transforme dados em decisões',
      text: 'Acompanhe conversão, valores aprovados e movimentações financeiras em uma visão clara da operação.'
    },
    '/relatorios.html': {
      image: IMAGES.relatorios,
      title: 'Relatórios claros para uma gestão melhor',
      text: 'Analise desempenho, faturamento e produtividade sem perder tempo.'
    }
  };

  function normalizarCaminho() {
    const p = location.pathname || '/';
    return p === '/' ? '/index.html' : p.replace(/\/$/, '') || '/index.html';
  }

  function substituirImagensPrincipais() {
    const home = document.querySelector('.home-hero-character');
    if (home) {
      home.src = IMAGES.home;
      home.alt = 'Efex, mascote especialista automotivo do FS Orçamentos';
      home.loading = 'eager';
      home.decoding = 'async';
    }
    const efex = document.querySelector('img.character');
    if (efex) {
      efex.src = IMAGES.diagnostico;
      efex.alt = 'Efex com equipamento de diagnóstico automotivo';
      efex.loading = 'eager';
      efex.decoding = 'async';
    }
  }

  function criarAvatarCabecalho() {
    return `<span class="fs-efex-avatar-selo" style="display:inline-grid;width:27px;height:27px;flex:0 0 27px;place-items:center;overflow:hidden;border-radius:50%;background:#fff"><img src="${AVATAR}" alt="" aria-hidden="true" style="display:block;width:27px!important;height:27px!important;max-width:27px!important;max-height:27px!important;object-fit:contain"></span>`;
  }

  function adicionarContextoDaPagina() {
    const path = normalizarCaminho();
    const cfg = contextos[path];
    if (!cfg || document.querySelector('.fs-efex-contextual')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const card = document.createElement('section');
    card.className = 'fs-efex-contextual';
    card.setAttribute('aria-label', 'Mensagem do Efex');
    card.innerHTML = `<div class="fs-efex-contextual-copy"><span class="fs-efex-contextual-tag">Efex · Especialista da oficina</span><h2>${cfg.title}</h2><p>${cfg.text}</p></div><img class="fs-efex-contextual-personagem" src="${cfg.image}" alt="Efex, mascote do FS Orçamentos" loading="lazy" decoding="async" style="display:block;width:100%;max-width:250px;max-height:210px;object-fit:contain;justify-self:end">`;
    main.prepend(card);
  }

  function mostrarDicaEfex(mensagem, opcoes = {}) {
    const texto = String(mensagem || '').trim();
    if (!texto) return null;
    const id = opcoes.id ? String(opcoes.id) : '';
    if (id && document.querySelector(`[data-efex-dica-id="${CSS.escape(id)}"]`)) return null;
    const destino = opcoes.destino instanceof Element ? opcoes.destino : document.querySelector(opcoes.destino || 'main');
    if (!destino) return null;
    const card = document.createElement('aside');
    card.className = 'fs-efex-dica';
    if (id) card.dataset.efexDicaId = id;
    card.setAttribute('aria-label', opcoes.titulo || 'Dica do Efex');
    card.innerHTML = `<img class="fs-efex-dica-personagem" src="${IMAGES.dica}" alt="Efex dando uma dica" loading="lazy" decoding="async" style="display:block;width:100%;max-width:130px;max-height:125px;object-fit:contain"><div class="fs-efex-dica-copy"><span class="fs-efex-dica-titulo">${criarAvatarCabecalho()}${opcoes.titulo || 'Dica do Efex'}</span><p></p></div>`;
    card.querySelector('p').textContent = texto;
    if (opcoes.posicao === 'inicio') destino.prepend(card);
    else destino.append(card);
    return card;
  }

  function atualizarBotaoFlutuante() {
    const botao = document.getElementById('btn-flutuante-gerador-global');
    if (!botao || botao.dataset.efexAplicado === 'sim') return;
    botao.dataset.efexAplicado = 'sim';
    botao.innerHTML = `<img class="fs-efex-avatar-btn" src="${AVATAR}" alt="" aria-hidden="true" style="width:38px;height:38px;max-width:38px;max-height:38px;object-fit:contain"><span>Gerar orçamento</span>`;
  }

  function aplicar() {
    substituirImagensPrincipais();
    adicionarContextoDaPagina();
    atualizarBotaoFlutuante();
  }

  window.mostrarDicaEfex = mostrarDicaEfex;
  window.FS_EFEX_IMAGENS = Object.freeze({ ...IMAGES });

  const observar = new MutationObserver(() => atualizarBotaoFlutuante());
  function iniciar() {
    aplicar();
    observar.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();