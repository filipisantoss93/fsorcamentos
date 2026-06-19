/* FS Orçamentos - cards de planos na home do Plano Grátis */
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
        gap: 12px;
        margin: 16px auto 18px;
        max-width: 1120px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples {
        background: #ffffff !important;
        color: #2b211d !important;
        border: 1px solid #ebe2d7;
        border-radius: 7px;
        padding: 14px;
        box-shadow: 0 3px 10px rgba(47,33,29,.07);
        min-width: 0;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples:hover {
        background: #fbf8f4 !important;
        border-color: #ded3c5;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        max-width: 100%;
        background: #f8f4ee !important;
        color: #2f211d !important;
        border: 1px solid #ded3c5 !important;
        border-radius: 4px;
        padding: 4px 7px;
        font-size: 11px;
        font-weight: 950;
        line-height: 1.2;
        margin-bottom: 9px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} h2 {
        color: #2f211d !important;
        margin: 0 0 7px;
        font-size: clamp(18px, 2.5vw, 24px);
        line-height: 1.15;
        font-weight: 950;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} p {
        color: #62554d !important;
        margin: 0 0 10px;
        font-size: 13px;
        line-height: 1.38;
        font-weight: 700;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} ul {
        margin: 0 0 12px;
        padding-left: 17px;
        display: grid;
        gap: 4px;
        color: #2b211d !important;
        font-size: 12px;
        font-weight: 760;
        line-height: 1.32;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} li {
        color: #2b211d !important;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} li::marker {
        color: #62554d;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-acoes {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-conhecer,
      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-como-funciona {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        border-radius: 4px;
        padding: 8px 11px;
        text-decoration: none;
        font-size: 12px;
        font-weight: 950;
        box-sizing: border-box;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-conhecer {
        background: #2f211d !important;
        color: #ffc400 !important;
        border: 1px solid #2f211d !important;
      }

      body:not(.gerando-pdf) #${BLOCO_ID} .fs-btn-como-funciona {
        background: #ffffff !important;
        color: #2f211d !important;
        border: 1px solid #d7ccc8 !important;
      }

      @media (max-width: 760px) {
        body:not(.gerando-pdf) #${BLOCO_ID} {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        body:not(.gerando-pdf) #${BLOCO_ID} .fs-plano-card-simples {
          padding: 12px;
          border-radius: 7px;
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
      '.home-comparativo-section',
      '.whatsapp-preview-home',
      '.cliente-aprovacao-home',
      '.status-orcamentos-home',
      '.comparativo-home:not(.fs-visitante-comparativo-wrapper)'
    ];

    seletores.forEach((seletor) => {
      homeGratis.querySelectorAll(seletor).forEach((el) => {
        if (el.id === BLOCO_ID || el.closest(`#${BLOCO_ID}`)) return;
        el.classList.add('fs-remover-anuncio-plano-gratis');
        el.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function removerDuplicados() {
    const novos = Array.from(document.querySelectorAll(`#${BLOCO_ID}`));
    novos.slice(1).forEach((el) => el.remove());
  }

  function criarCards() {
    const bloco = document.createElement('section');
    bloco.id = BLOCO_ID;
    bloco.setAttribute('aria-label', 'Planos recomendados do FS Orçamentos');
    bloco.innerHTML = `
      <article class="fs-plano-card-simples basico">
        <span class="fs-plano-tag">Básico • R$ 19,90/mês</span>
        <h2>Venda com link pelo WhatsApp</h2>
        <p>Para salvar orçamentos, enviar link para o cliente e acompanhar status.</p>
        <ul>
          <li>PDF profissional sem anúncios</li>
          <li>Histórico e gestão de orçamentos</li>
          <li>Link de aprovação ou recusa</li>
          <li>Resumo financeiro de orçamentos</li>
        </ul>
        <div class="fs-plano-card-acoes">
          <a href="/planos.html#assinar-plano-basico" class="fs-btn-conhecer">Conhecer Básico</a>
          <a href="/manual-basico.html" class="fs-btn-como-funciona">Ver como funciona</a>
        </div>
      </article>

      <article class="fs-plano-card-simples premium">
        <span class="fs-plano-tag">Gestão • R$ 69,90/mês</span>
        <h2>Gestão completa para oficina e serviços</h2>
        <p>Clientes, veículos, OS, estoque e controle profissional da execução.</p>
        <ul>
          <li>Cadastro de clientes e veículos</li>
          <li>Ordens de serviço com PDF</li>
          <li>Controle de estoque e itens usados</li>
          <li>Histórico por cliente, veículo e OS</li>
        </ul>
        <div class="fs-plano-card-acoes">
          <a href="/planos.html#assinar-plano-premium" class="fs-btn-conhecer">Conhecer Gestão</a>
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
    removerDuplicados();
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
