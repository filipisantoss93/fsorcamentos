/* =========================================================
   FS ORÇAMENTOS - index-visitante-lite.js
   Home deslogada mais objetiva:
   - promessa principal;
   - 3 benefícios rápidos;
   - CTA para gerar orçamento;
   - comparação simples de planos.
   Usuários logados continuam vendo a home/dashboards por plano.
   ========================================================= */
(function () {
  'use strict';

  function possuiSessaoLocal() {
    return !!(
      localStorage.getItem('id') ||
      localStorage.getItem('usuario_email') ||
      Object.keys(localStorage).some(k => k.startsWith('sb-') && k.includes('auth-token'))
    );
  }

  function injetarEstilo() {
    if (document.getElementById('fs-index-visitante-lite-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-index-visitante-lite-style';
    style.textContent = `
      body.fs-visitante-lite #fs-index-empresa-card,
      body.fs-visitante-lite #box-teste-premium-index,
      body.fs-visitante-lite #home-plano-gratis,
      body.fs-visitante-lite #home-plano-basico,
      body.fs-visitante-lite #home-plano-premium,
      body.fs-visitante-lite .home-premium-showcase,
      body.fs-visitante-lite .home-basico-showcase,
      body.fs-visitante-lite .home-story-section,
      body.fs-visitante-lite .home-whatsapp-section,
      body.fs-visitante-lite .home-aprovacao-section,
      body.fs-visitante-lite .home-status-section,
      body.fs-visitante-lite .status-orcamentos-home,
      body.fs-visitante-lite .whatsapp-preview-home,
      body.fs-visitante-lite .cliente-aprovacao-home,
      body.fs-visitante-lite .secao-como-funciona,
      body.fs-visitante-lite .comparativo-home:not(.fs-visitante-comparativo-wrapper),
      body.fs-visitante-lite .bloco-anuncio.fs-adsense-zone {
        display: none !important;
      }

      .fs-visitante-home-lite {
        max-width: 1120px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }

      .fs-visitante-hero {
        background: linear-gradient(135deg, #ffffff 0%, #fffaf0 100%) !important;
        border-top: 7px solid var(--fs-amarelo, #ffc400);
        border-radius: 28px;
        padding: 34px 24px;
        box-shadow: 0 16px 40px rgba(62, 39, 35, .14);
        color: var(--fs-marrom, #3e2723);
        position: relative;
        overflow: hidden;
      }

      .fs-visitante-hero::after {
        content: '';
        position: absolute;
        width: 250px;
        height: 250px;
        right: -110px;
        top: -110px;
        border-radius: 999px;
        background: rgba(255,196,0,.18);
      }

      .fs-visitante-hero > * { position: relative; z-index: 1; }

      .fs-visitante-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--fs-marrom, #3e2723);
        color: var(--fs-amarelo, #ffc400);
        border: 1px solid var(--fs-amarelo, #ffc400);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        margin-bottom: 14px;
      }

      .fs-visitante-hero h1 {
        max-width: 820px;
        margin: 0 0 12px;
        color: var(--fs-marrom, #3e2723) !important;
        font-size: clamp(30px, 6vw, 50px);
        line-height: 1.08;
        font-weight: 950;
      }

      .fs-visitante-hero p {
        max-width: 780px;
        margin: 0;
        color: #6d5b52 !important;
        font-size: clamp(16px, 3.6vw, 20px);
        line-height: 1.48;
        font-weight: 750;
      }

      .fs-visitante-acoes {
        margin-top: 22px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .fs-visitante-btn-principal,
      .fs-visitante-btn-secundario {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        border-radius: 999px;
        padding: 14px 22px;
        font-weight: 950;
        text-decoration: none;
        border: 2px solid var(--fs-amarelo, #ffc400);
        box-shadow: 0 10px 24px rgba(62, 39, 35, .16);
        cursor: pointer;
      }

      .fs-visitante-btn-principal {
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
      }

      .fs-visitante-btn-secundario {
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border-color: #d8c9b8;
      }

      .fs-visitante-beneficios {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .fs-visitante-beneficio,
      .fs-visitante-plano {
        background: #ffffff;
        color: var(--fs-marrom, #3e2723);
        border-radius: 20px;
        padding: 18px;
        border-left: 7px solid var(--fs-amarelo, #ffc400);
        box-shadow: 0 10px 26px rgba(62,39,35,.11);
        min-width: 0;
      }

      .fs-visitante-beneficio strong,
      .fs-visitante-plano strong {
        display: block;
        color: var(--fs-marrom, #3e2723);
        font-size: 18px;
        margin-bottom: 7px;
        line-height: 1.2;
      }

      .fs-visitante-beneficio span,
      .fs-visitante-plano span {
        display: block;
        color: #6d5b52;
        font-weight: 750;
        line-height: 1.42;
        font-size: 14px;
      }

      .fs-visitante-comparativo-wrapper {
        background: linear-gradient(135deg, #ffffff 0%, #fffaf0 100%) !important;
        border-top: 6px solid var(--fs-amarelo, #ffc400);
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 12px 30px rgba(62,39,35,.12);
      }

      .fs-visitante-comparativo-wrapper h2 {
        margin: 0 0 7px;
        color: var(--fs-marrom, #3e2723) !important;
        font-size: 28px;
        line-height: 1.15;
      }

      .fs-visitante-comparativo-wrapper > p {
        margin: 0 0 16px;
        color: #6d5b52 !important;
        font-weight: 750;
        line-height: 1.45;
      }

      .fs-visitante-planos-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .fs-visitante-plano.destaque {
        border-left-color: #18b26b;
        outline: 2px solid rgba(24,178,107,.22);
      }

      .fs-visitante-preco {
        display: inline-flex !important;
        margin: 4px 0 9px;
        background: var(--fs-marrom, #3e2723);
        color: var(--fs-amarelo, #ffc400) !important;
        border-radius: 999px;
        padding: 6px 10px;
        font-weight: 950 !important;
        font-size: 13px !important;
      }

      @media (max-width: 760px) {
        .home-publica { padding-top: 18px !important; }
        .fs-visitante-hero { padding: 26px 18px; border-radius: 22px; }
        .fs-visitante-beneficios,
        .fs-visitante-planos-grid { grid-template-columns: 1fr; }
        .fs-visitante-acoes { display: grid; }
        .fs-visitante-btn-principal,
        .fs-visitante-btn-secundario { width: 100%; box-sizing: border-box; }
      }
    `;
    document.head.appendChild(style);
  }

  function htmlLanding() {
    return `
      <section id="fs-visitante-home-lite" class="fs-visitante-home-lite" aria-label="Resumo do FS Orçamentos para visitantes">
        <div class="fs-visitante-hero">
          <span class="fs-visitante-tag">Gerador de orçamento profissional</span>
          <h1>Crie orçamento em PDF com aparência profissional em poucos minutos.</h1>
          <p>Ideal para MEI, oficinas e prestadores de serviço que querem enviar uma proposta organizada, com dados da empresa, itens, total e visual confiável.</p>
          <div class="fs-visitante-acoes">
            <button type="button" class="fs-visitante-btn-principal" onclick="abrirGeradorHomeProtegido()">🧾 Gerar orçamento grátis</button>
            <a href="/planos.html" class="fs-visitante-btn-secundario">Ver planos</a>
          </div>
        </div>

        <div class="fs-visitante-beneficios">
          <div class="fs-visitante-beneficio"><strong>PDF bonito e organizado</strong><span>Monte orçamento com cliente, itens, observações, total e identidade da empresa.</span></div>
          <div class="fs-visitante-beneficio"><strong>Envio rápido ao cliente</strong><span>Use o PDF ou link para apresentar a proposta com mais profissionalismo.</span></div>
          <div class="fs-visitante-beneficio"><strong>Evolui para gestão</strong><span>Quando precisar, ative histórico, aprovação, clientes, veículos, OS e estoque.</span></div>
        </div>

        <section class="fs-visitante-comparativo-wrapper comparativo-home">
          <h2>Escolha o plano conforme sua fase</h2>
          <p>Comece grátis para gerar PDF. Depois evolua para acompanhar orçamentos ou controlar a oficina completa.</p>
          <div class="fs-visitante-planos-grid">
            <div class="fs-visitante-plano"><strong>Grátis</strong><span class="fs-visitante-preco">R$ 0</span><span>Gerar orçamento, prévia e PDF com anúncios.</span></div>
            <div class="fs-visitante-plano"><strong>Básico</strong><span class="fs-visitante-preco">R$ 19,90/mês</span><span>Histórico, link, aprovação/recusa e acompanhamento comercial.</span></div>
            <div class="fs-visitante-plano destaque"><strong>Premium</strong><span class="fs-visitante-preco">Gestão de oficina</span><span>Clientes, veículos, ordens de serviço, estoque, agenda e financeiro.</span></div>
          </div>
          <div class="fs-visitante-acoes" style="justify-content:center;margin-top:18px;">
            <button type="button" class="fs-visitante-btn-principal" onclick="abrirGeradorHomeProtegido()">Começar agora</button>
            <a href="/planos.html" class="fs-visitante-btn-secundario">Comparar detalhes</a>
          </div>
        </section>
      </section>
    `;
  }

  function aplicar() {
    injetarEstilo();

    if (possuiSessaoLocal()) {
      document.body.classList.remove('fs-visitante-lite');
      document.getElementById('fs-visitante-home-lite')?.remove();
      return;
    }

    document.body.classList.add('fs-visitante-lite');
    document.getElementById('fs-index-empresa-card')?.remove();

    const main = document.getElementById('home-publica') || document.querySelector('main');
    if (!main) return;

    if (!document.getElementById('fs-visitante-home-lite')) {
      main.insertAdjacentHTML('afterbegin', htmlLanding());
    }
  }

  window.fsAplicarHomeVisitanteLite = aplicar;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
  else aplicar();

  setTimeout(aplicar, 300);
  setTimeout(aplicar, 1200);
  window.addEventListener('storage', aplicar);
})();
