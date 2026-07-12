(() => {
  const VERSION = '20260712-2';
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
    '/planos.html': { image: IMAGES.home, title: 'Escolha o plano certo para sua oficina', text: 'Compare os recursos do FS Orçamentos e use o Efex conforme a necessidade da sua operação.' },
    '/painel.html': { image: IMAGES.orcamento, title: 'Sua oficina organizada em um só lugar', text: 'Mantenha o perfil da empresa atualizado para gerar documentos profissionais e personalizados.' },
    '/biblioteca.html': { image: IMAGES.diagnostico, title: 'Conhecimento técnico para a rotina da oficina', text: 'Consulte materiais, referências e conteúdos que apoiam diagnósticos mais seguros.' },
    '/forum.html': { image: IMAGES.avatar, title: 'A comunidade também faz parte do diagnóstico', text: 'Compartilhe experiências, dúvidas e soluções com outros profissionais automotivos.' },
    '/post.html': { image: IMAGES.avatar, title: 'Conteúdo técnico em destaque', text: 'Leia, participe e contribua com a comunidade FS Orçamentos.' },
    '/perfil.html': { image: IMAGES.avatar, title: 'Seu perfil na comunidade', text: 'Organize sua presença profissional e acompanhe suas contribuições no fórum.' },
    '/fluxo-caixa.html': { image: IMAGES.caixa, title: 'Controle financeiro com precisão', text: 'Registre entradas e saídas para acompanhar o resultado real da oficina e tomar decisões com segurança.' },
    '/dashboard.html': { image: IMAGES.relatorios, title: 'Transforme dados em decisões', text: 'Acompanhe conversão, valores aprovados e movimentações financeiras em uma visão clara da operação.' },
    '/relatorios.html': { image: IMAGES.relatorios, title: 'Relatórios claros para uma gestão melhor', text: 'Analise desempenho, faturamento e produtividade sem perder tempo.' },
    '/contato.html': { image: IMAGES.home, title: 'Fale com o FS Orçamentos', text: 'Envie sua dúvida, sugestão ou solicitação de suporte.' },
    '/sobre.html': { image: IMAGES.home, title: 'Tecnologia criada para oficinas', text: 'Conheça a proposta do FS Orçamentos e do especialista digital Efex.' }
  };

  const dicas = {
    '/painel.html': 'Mantenha os dados e a logomarca da oficina atualizados. Eles são usados automaticamente nos documentos gerados.',
    '/orcamentos.html': 'Orçamentos com descrição clara, fotos e prazo de validade tendem a transmitir mais confiança ao cliente.',
    '/gerador.html': 'Revise quantidades, valores e observações antes de gerar o PDF para evitar retrabalho.',
    '/fluxo-caixa.html': 'Registre cada movimentação no dia em que ela ocorrer. Valor aprovado não é o mesmo que dinheiro recebido.',
    '/dashboard.html': 'Compare períodos equivalentes para identificar tendências reais e evitar conclusões distorcidas.',
    '/relatorios.html': 'Compare períodos equivalentes para identificar tendências reais e evitar conclusões distorcidas.',
    '/carteira.html': 'Acompanhe o saldo antes de iniciar uma análise com o Efex para evitar interrupções no atendimento.',
    '/biblioteca.html': 'Use os materiais como apoio técnico e confirme sempre os procedimentos específicos do fabricante.',
    '/forum.html': 'Ao publicar uma dúvida, informe modelo, ano, motorização, sintomas e testes já realizados.',
    '/perfil.html': 'Um perfil profissional completo aumenta a confiança nas suas contribuições para a comunidade.'
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
    return `<span class="fs-efex-avatar-selo"><img src="${AVATAR}" alt="" aria-hidden="true"></span>`;
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
    card.innerHTML = `<div class="fs-efex-contextual-copy"><span class="fs-efex-contextual-tag">${criarAvatarCabecalho()}Efex · Especialista da oficina</span><h2>${cfg.title}</h2><p>${cfg.text}</p></div><img class="fs-efex-contextual-personagem" src="${cfg.image}" alt="Efex, mascote do FS Orçamentos" loading="lazy" decoding="async">`;
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
    card.innerHTML = `<img class="fs-efex-dica-personagem" src="${IMAGES.dica}" alt="Efex dando uma dica" loading="lazy" decoding="async"><div class="fs-efex-dica-copy"><span class="fs-efex-dica-titulo">${criarAvatarCabecalho()}${opcoes.titulo || 'Dica do Efex'}</span><p></p></div>`;
    card.querySelector('p').textContent = texto;
    if (opcoes.posicao === 'inicio') destino.prepend(card);
    else destino.append(card);
    return card;
  }

  function adicionarDicaAutomatica() {
    const path = normalizarCaminho();
    const mensagem = dicas[path];
    if (!mensagem || document.querySelector('[data-efex-dica-id="automatica"]')) return;
    const main = document.querySelector('main');
    if (!main) return;
    mostrarDicaEfex(mensagem, { id: 'automatica', destino: main });
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
    adicionarDicaAutomatica();
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