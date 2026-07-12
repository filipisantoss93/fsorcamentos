(() => {
  const VERSION = '20260712-1';
  const BASE = '/assets/images/';
  const AVATAR = `${BASE}avatar-fundotransparente.PNG?v=${VERSION}`;
  const IMAGES = {
    home: `${BASE}efex-divulgacao.JPG?v=${VERSION}`,
    diagnostico: `${BASE}efex-equipdiagnose.PNG?v=${VERSION}`,
    orcamento: `${BASE}efex-montandoorcamento.PNG?v=${VERSION}`,
    multimetro: `${BASE}efex-multimetro.PNG?v=${VERSION}`,
    osciloscopio: `${BASE}efex-osciloscopio.PNG?v=${VERSION}`,
    ar: `${BASE}efex-arcondicionado.PNG?v=${VERSION}`,
    avatar: AVATAR
  };

  const contextos = {
    '/planos.html': { image: IMAGES.home, title: 'Escolha o plano certo para sua oficina', text: 'Compare os recursos do FS Orçamentos e use o Efex conforme a necessidade da sua operação.' },
    '/painel.html': { image: IMAGES.orcamento, title: 'Sua oficina organizada em um só lugar', text: 'Mantenha o perfil da empresa atualizado para gerar documentos profissionais e personalizados.' },
    '/biblioteca.html': { image: IMAGES.diagnostico, title: 'Conhecimento técnico para a rotina da oficina', text: 'Consulte materiais, referências e conteúdos que apoiam diagnósticos mais seguros.' },
    '/forum.html': { image: IMAGES.avatar, title: 'A comunidade também faz parte do diagnóstico', text: 'Compartilhe experiências, dúvidas e soluções com outros profissionais automotivos.' },
    '/post.html': { image: IMAGES.avatar, title: 'Conteúdo técnico em destaque', text: 'Leia, participe e contribua com a comunidade FS Orçamentos.' },
    '/perfil.html': { image: IMAGES.avatar, title: 'Seu perfil na comunidade', text: 'Organize sua presença profissional e acompanhe suas contribuições no fórum.' },
    '/fluxo-caixa.html': { image: IMAGES.multimetro, title: 'Controle financeiro com precisão', text: 'Acompanhe entradas, saídas e resultados para tomar decisões mais seguras na oficina.' },
    '/dashboard.html': { image: IMAGES.osciloscopio, title: 'Transforme dados em decisões', text: 'Visualize indicadores e acompanhe a evolução da sua operação.' },
    '/relatorios.html': { image: IMAGES.osciloscopio, title: 'Relatórios claros para uma gestão melhor', text: 'Analise desempenho, faturamento e produtividade sem perder tempo.' },
    '/contato.html': { image: IMAGES.home, title: 'Fale com o FS Orçamentos', text: 'Envie sua dúvida, sugestão ou solicitação de suporte.' },
    '/sobre.html': { image: IMAGES.home, title: 'Tecnologia criada para oficinas', text: 'Conheça a proposta do FS Orçamentos e do especialista digital Efex.' }
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

  function adicionarContextoDaPagina() {
    const path = normalizarCaminho();
    const cfg = contextos[path];
    if (!cfg || document.querySelector('.fs-efex-contextual')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const card = document.createElement('section');
    card.className = 'fs-efex-contextual';
    card.setAttribute('aria-label', 'Mensagem do Efex');
    card.innerHTML = `<div class="fs-efex-contextual-copy"><span class="fs-efex-contextual-tag">Efex · Especialista da oficina</span><h2>${cfg.title}</h2><p>${cfg.text}</p></div><img src="${cfg.image}" alt="Efex, mascote do FS Orçamentos" loading="lazy" decoding="async">`;
    main.prepend(card);
  }

  function atualizarBotaoFlutuante() {
    const botao = document.getElementById('btn-flutuante-gerador-global');
    if (!botao || botao.dataset.efexAplicado === 'sim') return;
    botao.dataset.efexAplicado = 'sim';
    botao.innerHTML = `<img class="fs-efex-avatar-btn" src="${AVATAR}" alt="" aria-hidden="true"><span>Gerar orçamento</span>`;
  }

  function aplicar() {
    substituirImagensPrincipais();
    adicionarContextoDaPagina();
    atualizarBotaoFlutuante();
  }

  const observar = new MutationObserver(() => atualizarBotaoFlutuante());
  function iniciar() {
    aplicar();
    observar.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
