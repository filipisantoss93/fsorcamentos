(() => {
  const VERSION = '20260713-2';
  const BASE = '/assets/images/';
  const IMAGENS = Object.freeze({
    avatar: `${BASE}avatar-fundotransparente.PNG?v=${VERSION}`,
    arCondicionado: `${BASE}efex-arcondicionado.PNG?v=${VERSION}`,
    caixa: `${BASE}efex-caixa.PNG?v=${VERSION}`,
    dica: `${BASE}efex-dica.PNG?v=${VERSION}`,
    divulgacao: `${BASE}efex-divulgacao.JPG?v=${VERSION}`,
    equipamento: `${BASE}efex-equipdiagnose.PNG?v=${VERSION}`,
    orcamento: `${BASE}efex-montandoorcamento.PNG?v=${VERSION}`,
    multimetro: `${BASE}efex-multimetro.PNG?v=${VERSION}`,
    osciloscopio: `${BASE}efex-osciloscopio.PNG?v=${VERSION}`,
    relatorios: `${BASE}efex-relatorios.PNG?v=${VERSION}`
  });

  const PAGINAS = {
    '/dashboard.html': {
      imagem: IMAGENS.relatorios,
      tag: 'Efex Relatórios',
      titulo: 'Transforme números em decisões para a oficina.',
      texto: 'Acompanhe faturamento, aprovações e desempenho para descobrir rapidamente o que merece atenção.',
      link: '/efex.html',
      acao: 'Analisar com o Efex'
    },
    '/fluxo-caixa.html': {
      imagem: IMAGENS.caixa,
      tag: 'Efex Financeiro',
      titulo: 'Mantenha o caixa da oficina sob controle.',
      texto: 'Registre entradas e despesas, acompanhe o saldo e identifique períodos que exigem mais atenção.',
      link: '/dashboard.html',
      acao: 'Ver indicadores'
    },
    '/gerador.html': {
      imagem: IMAGENS.orcamento,
      tag: 'Efex Orçamentos',
      titulo: 'Vamos montar um orçamento claro e profissional.',
      texto: 'Preencha os dados do serviço e revise peças, mão de obra e condições antes de gerar o PDF.',
      link: '/efex.html',
      acao: 'Fazer diagnóstico'
    },
    '/orcamentos.html': {
      imagem: IMAGENS.orcamento,
      tag: 'Efex Orçamentos',
      titulo: 'Encontre rapidamente o que precisa de ação.',
      texto: 'Revise pendências, acompanhe aprovações e abra cada orçamento para consultar todos os detalhes.',
      link: '/gerador.html',
      acao: 'Novo orçamento'
    },
    '/ver.html': {
      imagem: IMAGENS.dica,
      tag: 'Dica do Efex',
      titulo: 'Revise tudo antes de apresentar ao cliente.',
      texto: 'Confira serviços, peças, valores e condições antes de baixar o PDF ou compartilhar o orçamento.',
      link: '/efex.html',
      acao: 'Consultar o Efex'
    },
    '/painel.html': {
      imagem: IMAGENS.avatar,
      tag: 'Configuração da oficina',
      titulo: 'Seu perfil também faz parte do orçamento.',
      texto: 'Logo, dados comerciais e contatos corretos deixam o documento mais profissional e confiável.',
      link: '/gerador.html',
      acao: 'Criar orçamento'
    },
    '/forum.html': {
      imagem: IMAGENS.dica,
      tag: 'Efex Comunidade',
      titulo: 'Compartilhe evidências, não apenas conclusões.',
      texto: 'Inclua sintomas, medições e testes realizados para receber respostas técnicas mais úteis.',
      link: '/efex.html',
      acao: 'Abrir diagnóstico'
    },
    '/perfil.html': {
      imagem: IMAGENS.dica,
      tag: 'Perfil profissional',
      titulo: 'Mostre sua experiência para a comunidade.',
      texto: 'Um perfil completo ajuda outros técnicos a reconhecer sua especialidade e confiar nas interações.',
      link: '/forum.html',
      acao: 'Ir ao fórum'
    },
    '/planos.html': {
      imagem: IMAGENS.divulgacao,
      tag: 'Efex Premium',
      titulo: 'Escolha os recursos certos para a rotina da oficina.',
      texto: 'Compare planos, benefícios e créditos para usar a inteligência artificial de forma previsível.',
      link: '/carteira.html',
      acao: 'Ver créditos'
    },
    '/carteira.html': {
      imagem: IMAGENS.caixa,
      tag: 'Carteira Efex',
      titulo: 'Controle seus créditos antes de cada análise.',
      texto: 'O custo aparece antes da execução para você escolher os recursos sem surpresas.',
      link: '/efex.html',
      acao: 'Usar o Efex'
    },
    '/equipdiagnose.html': {
      imagem: IMAGENS.equipamento,
      tag: 'Efex Equipamentos',
      titulo: 'Use a ferramenta certa para confirmar o diagnóstico.',
      texto: 'Organize scanners, instrumentos e procedimentos de teste para reduzir trocas por tentativa.',
      link: '/efex.html',
      acao: 'Iniciar diagnóstico'
    },
    '/osciloscopio.html': {
      imagem: IMAGENS.osciloscopio,
      tag: 'Efex Osciloscópio',
      titulo: 'Interprete sinais antes de substituir componentes.',
      texto: 'Compare formas de onda, alimentação e sincronismo para confirmar falhas elétricas e eletrônicas.',
      link: '/efex.html',
      acao: 'Analisar sinal'
    },
    '/ar-condicionado.html': {
      imagem: IMAGENS.arCondicionado,
      tag: 'Efex Climatização',
      titulo: 'Diagnóstico de climatização com método.',
      texto: 'Organize pressões, temperaturas e testes elétricos antes de condenar componentes do sistema.',
      link: '/efex.html',
      acao: 'Analisar sistema'
    },
    '/404.html': {
      imagem: IMAGENS.dica,
      tag: 'Página não encontrada',
      titulo: 'Parece que essa rota saiu da oficina.',
      texto: 'Volte ao início ou abra o gerador para continuar trabalhando.',
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

  function aplicarFallbackImagem(img) {
    if (!img || img.dataset.efexFallback === 'sim') return;
    img.dataset.efexFallback = 'sim';
    img.addEventListener('error', () => {
      if (img.src.includes('avatar-fundotransparente.PNG')) return;
      img.src = IMAGENS.avatar;
    });
  }

  function atualizarImagemPrincipal() {
    const rota = rotaAtual();
    const imagem = rota === '/index.html' ? IMAGENS.divulgacao : rota === '/efex.html' ? IMAGENS.multimetro : null;
    if (!imagem) return;
    const seletor = rota === '/index.html' ? '.home-hero-character' : '.efex-character';
    const personagem = document.querySelector(seletor);
    if (!personagem) return;
    aplicarFallbackImagem(personagem);
    if (personagem.dataset.efexImagem !== imagem) {
      personagem.src = imagem;
      personagem.dataset.efexImagem = imagem;
    }
  }

  function atualizarBotaoFlutuante() {
    const botao = document.getElementById('btn-flutuante-gerador-global');
    if (!botao) return;
    const avatarAtual = botao.querySelector('.fs-efex-avatar-btn');
    if (avatarAtual) {
      aplicarFallbackImagem(avatarAtual);
      avatarAtual.src = IMAGENS.avatar;
      return;
    }
    botao.dataset.efexAplicado = 'sim';
    botao.innerHTML = `<img class="fs-efex-avatar-btn" src="${IMAGENS.avatar}" alt="" aria-hidden="true"><span>Gerar orçamento</span>`;
    aplicarFallbackImagem(botao.querySelector('.fs-efex-avatar-btn'));
  }

  function criarBanner(config) {
    const banner = document.createElement('aside');
    banner.className = 'fs-efex-contextual';
    banner.dataset.efexContextual = 'sim';
    banner.setAttribute('aria-label', 'Orientação contextual do Efex');
    banner.innerHTML = `
      <div class="fs-efex-contextual-copy">
        <span class="fs-efex-contextual-tag">
          <span class="fs-efex-avatar-selo"><img src="${IMAGENS.avatar}" alt="" aria-hidden="true"></span>
          ${config.tag}
        </span>
        <h2>${config.titulo}</h2>
        <p>${config.texto}</p>
        <a class="fs-efex-contextual-acao" href="${config.link}">${config.acao}</a>
      </div>
      <img class="fs-efex-contextual-personagem" src="${config.imagem}" alt="Efex em uma representação relacionada a ${config.tag}">
    `;
    banner.querySelectorAll('img').forEach(aplicarFallbackImagem);
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
    atualizarImagemPrincipal();
    atualizarBotaoFlutuante();
    inserirBanner();
  }

  window.FS_EFEX_IMAGENS = IMAGENS;
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