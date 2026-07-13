(() => {
  const VERSION = '20260713-1';
  const AVATAR = `/assets/images/avatar-fundotransparente.PNG?v=${VERSION}`;

  const PAGINAS = {
    '/dashboard.html': {
      tag: 'Resumo inteligente',
      titulo: 'Olá! Eu sou o Efex.',
      texto: 'Acompanhe os indicadores da oficina e use meus alertas para decidir o que merece atenção primeiro.',
      link: '/efex.html',
      acao: 'Analisar com o Efex'
    },
    '/orcamentos.html': {
      tag: 'Histórico de orçamentos',
      titulo: 'Encontre rapidamente o que precisa de ação.',
      texto: 'Revise orçamentos pendentes, acompanhe aprovações e abra cada registro para consultar todos os detalhes.',
      link: '/efex.html',
      acao: 'Criar diagnóstico'
    },
    '/ver.html': {
      tag: 'Orçamento profissional',
      titulo: 'Tudo pronto para apresentar ao cliente.',
      texto: 'Confira serviços, peças e condições antes de baixar o PDF ou compartilhar o orçamento.',
      link: '/efex.html',
      acao: 'Consultar o Efex'
    },
    '/painel.html': {
      tag: 'Configuração da oficina',
      titulo: 'Complete seu perfil para valorizar seus orçamentos.',
      texto: 'Logo, dados comerciais e contatos corretos deixam o documento mais profissional e facilitam a aprovação.',
      link: '/painel.html',
      acao: 'Revisar cadastro'
    },
    '/forum.html': {
      tag: 'Comunidade técnica',
      titulo: 'Compartilhe evidências, não apenas conclusões.',
      texto: 'Inclua sintomas, medições e testes realizados para receber respostas mais úteis da comunidade.',
      link: '/efex.html',
      acao: 'Abrir o Efex'
    },
    '/perfil.html': {
      tag: 'Perfil da comunidade',
      titulo: 'Mostre sua experiência profissional.',
      texto: 'Um perfil completo ajuda outros técnicos a entender sua especialidade e aumenta a confiança nas interações.',
      link: '/forum.html',
      acao: 'Ir ao fórum'
    },
    '/planos.html': {
      tag: 'Planos e créditos',
      titulo: 'Use o Efex de forma previsível e sustentável.',
      texto: 'Escolha o plano adequado à rotina da oficina e recarregue créditos somente quando precisar de análises adicionais.',
      link: '/carteira.html',
      acao: 'Ver créditos'
    },
    '/carteira.html': {
      tag: 'Carteira Efex',
      titulo: 'Controle o consumo antes de cada análise.',
      texto: 'O custo é exibido antes da execução para você decidir quais recursos ativar sem surpresas.',
      link: '/efex.html',
      acao: 'Usar o Efex'
    },
    '/404.html': {
      tag: 'Página não encontrada',
      titulo: 'Parece que essa rota saiu da oficina.',
      texto: 'Volte para o início ou abra o gerador para continuar trabalhando.',
      link: '/index.html',
      acao: 'Voltar ao início'
    }
  };

  function rotaAtual() {
    let rota = (location.pathname || '/').toLowerCase();
    if (rota.length > 1 && rota.endsWith('/')) rota = rota.slice(0, -1);
    if (!rota.includes('.')) rota += '.html';
    return rota === '/.html' ? '/index.html' : rota;
  }

  function atualizarBotaoFlutuante() {
    const botao = document.getElementById('btn-flutuante-gerador-global');
    if (!botao) return;

    const avatarAtual = botao.querySelector('.fs-efex-avatar-btn');
    if (avatarAtual) {
      avatarAtual.src = AVATAR;
      return;
    }

    botao.dataset.efexAplicado = 'sim';
    botao.innerHTML = `<img class="fs-efex-avatar-btn" src="${AVATAR}" alt="" aria-hidden="true"><span>Gerar orçamento</span>`;
  }

  function criarBanner(config) {
    const banner = document.createElement('aside');
    banner.className = 'fs-efex-contextual';
    banner.dataset.efexContextual = 'sim';
    banner.setAttribute('aria-label', 'Orientação do Efex');
    banner.innerHTML = `
      <div class="fs-efex-contextual-copy">
        <span class="fs-efex-contextual-tag">
          <span class="fs-efex-avatar-selo"><img src="${AVATAR}" alt="" aria-hidden="true"></span>
          ${config.tag}
        </span>
        <h2>${config.titulo}</h2>
        <p>${config.texto}</p>
        <a class="fs-efex-contextual-acao" href="${config.link}">${config.acao}</a>
      </div>
      <img class="fs-efex-contextual-personagem" src="${AVATAR}" alt="Efex, assistente automotivo do FS Orçamentos">
    `;
    return banner;
  }

  function encontrarDestino() {
    const principal = document.querySelector('main');
    if (principal) return principal;
    return document.querySelector('.container, .page-container, .conteudo, #conteudo') || document.body;
  }

  function inserirBanner() {
    if (document.querySelector('[data-efex-contextual="sim"]')) return true;

    const config = PAGINAS[rotaAtual()];
    if (!config) return false;

    const destino = encontrarDestino();
    if (!destino) return false;

    const banner = criarBanner(config);
    const primeiroBloco = Array.from(destino.children).find((elemento) => {
      if (elemento.id === 'header-container') return false;
      if (elemento.tagName === 'SCRIPT' || elemento.tagName === 'STYLE') return false;
      return true;
    });

    if (primeiroBloco) destino.insertBefore(banner, primeiroBloco);
    else destino.appendChild(banner);
    return true;
  }

  function aplicar() {
    atualizarBotaoFlutuante();
    inserirBanner();
  }

  window.FS_EFEX_IMAGENS = Object.freeze({ avatar: AVATAR });
  window.mostrarDicaEfex = inserirBanner;

  let agendado = false;
  const observar = new MutationObserver(() => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      aplicar();
    });
  });

  function iniciar() {
    aplicar();
    observar.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();