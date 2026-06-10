/* FS Orçamentos - simplifica anúncios de planos na home do Plano Grátis */
(function () {
  'use strict';

  const STYLE_ID = 'fs-index-gratis-planos-simplify-style';
  const BLOCO_ID = 'fs-planos-gratis-simples';

  function homeGratisAtiva() {
    const homeGratis = document.getElementById('home-plano-gratis');
    if (!homeGratis) return false;
    if (document.body.classList.contains('fs-visitante-lite')) return false;
    return homeGratis.classList.contains('ativo') || getComputedStyle(homeGratis).display !== 'none';
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body:not(.gerando-pdf) #home-plano-gratis .fs-remover-anuncio-plano-gratis {
        display: none !important;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin: 26px auto 28px;
        max-width: 1150px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples {
        background: #ffffff !important;
        color: #3e2723 !important;
        border: 1px solid #e8dccb;
        border-left: 7px solid #ffc400;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(62,39,35,.13);
        min-width: 0;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples.premium {
        border-left-color: #18b26b;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        max-width: 100%;
        background: #3e2723 !important;
        color: #ffc400 !important;
        border: 1px solid #ffc400 !important;
        border-radius: 999px;
        padding: 8px 13px;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.2;
        margin-bottom: 16px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} h2 {
        color: #3e2723 !important;
        margin: 0 0 12px;
        font-size: clamp(24px, 4vw, 34px);
        line-height: 1.15;
        font-weight: 950;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} p {
        color: #6d5b52 !important;
        margin: 0 0 18px;
        font-size: 16px;
        line-height: 1.5;
        font-weight: 780;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} ul {
        margin: 0 0 22px;
        padding-left: 20px;
        display: grid;
        gap: 7px;
        color: #3e2723 !important;
        font-weight: 850;
        line-height: 1.38;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} li {
        color: #3e2723 !important;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} li::marker {
        color: #6d4c41;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-acoes {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-conhecer,
      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-como-funciona {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        border-radius: 999px;
        padding: 13px 18px;
        text-decoration: none;
        font-weight: 950;
        letter-spacing: .3px;
        text-transform: uppercase;
        box-sizing: border-box;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-conhecer {
        background: #3e2723 !important;
        color: #ffc400 !important;
        border: 2px solid #ffc400 !important;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-como-funciona {
        width: fit-content;
        background: #ffffff !important;
        color: #3e2723 !important;
        border: 2px solid #d8c9b8 !important;
        padding-inline: 24px;
      }

      @media (max-width: 760px) {
        body:not(.gerando-pdf) #${BLOCO_ID} {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples {
          padding: 22px 18px;
          border-radius: 22px;
        }

        body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-conhecer,
        body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-como-funciona {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function esconderPromocoesAntigas(homeGratis) {
    if (!homeGratis) return;

    const seletores = [
      '.home-premium-showcase',
      '.home-basico-showcase',
      '.home-whatsapp-section',
      '.home-aprovacao-section',
      '.home-status-section',
      '.home-comparativo-section'
    ];

    seletores.forEach((seletor) => {
      homeGratis.querySelectorAll(seletor).forEach((el) => {
        if (el.id === BLOCO_ID || el.closest(`#${BLOCO_ID}`)) return;
        el.classList.add('fs-remover-anuncio-plano-gratis');
        el.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function criarCards() {
    const bloco = document.createElement('section');
    bloco.id = BLOCO_ID;
    bloco.setAttribute('aria-label', 'Planos recomendados do FS Orçamentos');
    bloco.innerHTML = `
      <article class="fs-plano-card-simples basico">
        <span class="fs-plano-tag">⭐ Básico a partir de R$ 19,90/mês</span>
        <h2>Venda com link pelo WhatsApp</h2>
        <p>O Plano Básico é para quem quer salvar orçamentos, enviar link para o cliente e acompanhar status.</p>
        <ul>
          <li>PDF profissional sem anúncios</li>
          <li>Histórico e gestão de orçamentos</li>
          <li>Link para aprovação ou recusa do cliente</li>
          <li>Resumo financeiro de orçamentos</li>
        </ul>
        <div class="fs-plano-card-acoes">
          <a href="/planos.html#assinar-plano-basico" class="fs-btn-conhecer">Conhecer Básico</a>
          <a href="/manual-basico.html" class="fs-btn-como-funciona">Ver como funciona</a>
        </div>
      </article>

      <article class="fs-plano-card-simples premium">
        <span class="fs-plano-tag">🚀 Premium a partir de R$ 69,90/mês</span>
        <h2>Gestão completa para oficina e serviços</h2>
        <p>O Premium libera clientes, veículos, ordens de serviço, estoque e controle profissional da execução.</p>
        <ul>
          <li>Cadastro de clientes e veículos</li>
          <li>Ordens de serviço com PDF</li>
          <li>Controle de estoque e itens usados</li>
          <li>Histórico por cliente, veículo e OS</li>
        </ul>
        <div class="fs-plano-card-acoes">
          <a href="/planos.html#assinar-plano-premium" class="fs-btn-conhecer">Conhecer Premium</a>
          <a href="/manual-premium.html" class="fs-btn-como-funciona">Ver como funciona</a>
        </div>
      </article>
    `;
    return bloco;
  }

  function garantirCards(homeGratis) {
    if (!homeGratis) return;

    let bloco = document.getElementById(BLOCO_ID);
    if (!bloco) {
      bloco = criarCards();

      const depoisDoAnuncio = homeGratis.querySelector('#adsense-gratis-topo');
      const depoisStory = homeGratis.querySelector('.home-story-section');
      const referencia = depoisStory || depoisDoAnuncio || homeGratis.querySelector('.home-plano-hero');

      if (referencia && referencia.parentNode) {
        referencia.insertAdjacentElement('afterend', bloco);
      } else {
        homeGratis.appendChild(bloco);
      }
    }

    bloco.style.display = '';
    bloco.removeAttribute('aria-hidden');
  }

  function aplicar() {
    addStyle();

    if (!homeGratisAtiva()) return;

    const homeGratis = document.getElementById('home-plano-gratis');
    esconderPromocoesAntigas(homeGratis);
    garantirCards(homeGratis);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
  else aplicar();

  window.addEventListener('load', aplicar);
  window.addEventListener('storage', aplicar);
  setTimeout(aplicar, 300);
  setTimeout(aplicar, 1200);
  setTimeout(aplicar, 2600);
})();
