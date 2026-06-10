/* =========================================================
   FS ORÇAMENTOS - index-visitante-lite.js
   Home deslogada objetiva, mas com conteúdo útil:
   - promessa principal;
   - benefícios rápidos;
   - como funciona;
   - para quem é;
   - comparação simples de planos;
   - perguntas frequentes;
   - links legais.
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

      .fs-visitante-hero,
      .fs-visitante-secao,
      .fs-visitante-comparativo-wrapper,
      .fs-visitante-legal-box {
        background: linear-gradient(135deg, #ffffff 0%, #fffaf0 100%) !important;
        border-top: 7px solid var(--fs-amarelo, #ffc400);
        border-radius: 28px;
        padding: 34px 24px;
        box-shadow: 0 16px 40px rgba(62, 39, 35, .14);
        color: var(--fs-marrom, #3e2723);
        position: relative;
        overflow: hidden;
      }

      .fs-visitante-hero::after,
      .fs-visitante-secao::after,
      .fs-visitante-comparativo-wrapper::after {
        content: '';
        position: absolute;
        width: 250px;
        height: 250px;
        right: -110px;
        top: -110px;
        border-radius: 999px;
        background: rgba(255,196,0,.18);
        pointer-events: none;
      }

      .fs-visitante-hero > *,
      .fs-visitante-secao > *,
      .fs-visitante-comparativo-wrapper > *,
      .fs-visitante-legal-box > * {
        position: relative;
        z-index: 1;
      }

      .fs-visitante-tag,
      .fs-visitante-mini-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--fs-marrom, #3e2723);
        color: var(--fs-amarelo, #ffc400) !important;
        border: 1px solid var(--fs-amarelo, #ffc400);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        margin-bottom: 14px;
      }

      .fs-visitante-hero h1,
      .fs-visitante-secao h2,
      .fs-visitante-comparativo-wrapper h2,
      .fs-visitante-legal-box h2 {
        max-width: 900px;
        margin: 0 0 12px;
        color: var(--fs-marrom, #3e2723) !important;
        font-size: clamp(28px, 5vw, 44px);
        line-height: 1.1;
        font-weight: 950;
      }

      .fs-visitante-hero p,
      .fs-visitante-secao > p,
      .fs-visitante-comparativo-wrapper > p,
      .fs-visitante-legal-box > p {
        max-width: 820px;
        margin: 0;
        color: #6d5b52 !important;
        font-size: clamp(16px, 3.4vw, 20px);
        line-height: 1.5;
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

      .fs-visitante-beneficios,
      .fs-visitante-passos-grid,
      .fs-visitante-publico-grid,
      .fs-visitante-faq-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .fs-visitante-beneficio,
      .fs-visitante-plano,
      .fs-visitante-passo,
      .fs-visitante-publico,
      .fs-visitante-faq-item {
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border-radius: 20px;
        padding: 18px;
        border: 1px solid #e8dccb;
        border-left: 7px solid var(--fs-amarelo, #ffc400);
        box-shadow: 0 10px 26px rgba(62,39,35,.11);
        min-width: 0;
      }

      .fs-visitante-beneficio strong,
      .fs-visitante-plano strong,
      .fs-visitante-passo strong,
      .fs-visitante-publico strong,
      .fs-visitante-faq-item strong {
        display: block;
        color: var(--fs-marrom, #3e2723) !important;
        font-size: 18px;
        margin-bottom: 7px;
        line-height: 1.22;
      }

      .fs-visitante-beneficio span,
      .fs-visitante-plano span,
      .fs-visitante-passo span,
      .fs-visitante-publico span,
      .fs-visitante-faq-item span {
        display: block;
        color: #6d5b52 !important;
        font-weight: 750;
        line-height: 1.45;
        font-size: 14px;
      }

      .fs-visitante-planos-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .fs-visitante-plano.destaque {
        border-left-color: #18b26b;
        outline: 2px solid rgba(24,178,107,.22);
      }

      .fs-visitante-preco {
        display: inline-flex !important;
        width: fit-content;
        margin: 4px 0 9px;
        background: var(--fs-marrom, #3e2723) !important;
        color: var(--fs-amarelo, #ffc400) !important;
        border: 1px solid var(--fs-amarelo, #ffc400) !important;
        border-radius: 999px;
        padding: 6px 10px;
        font-weight: 950 !important;
        font-size: 13px !important;
      }

      .fs-visitante-lista {
        margin: 18px 0 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
        color: #6d5b52;
        font-weight: 750;
        line-height: 1.45;
      }

      .fs-visitante-lista li::marker {
        color: var(--fs-amarelo, #ffc400);
      }

      .fs-visitante-legal-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .fs-visitante-legal-links a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 10px 14px;
        border-radius: 999px;
        background: #ffffff !important;
        color: var(--fs-marrom, #3e2723) !important;
        border: 1px solid #d8c9b8;
        font-weight: 900;
        text-decoration: none;
      }

      @media (max-width: 900px) {
        .fs-visitante-beneficios,
        .fs-visitante-passos-grid,
        .fs-visitante-publico-grid,
        .fs-visitante-faq-grid,
        .fs-visitante-planos-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .home-publica { padding-top: 18px !important; }
        .fs-visitante-hero,
        .fs-visitante-secao,
        .fs-visitante-comparativo-wrapper,
        .fs-visitante-legal-box {
          padding: 26px 18px;
          border-radius: 22px;
        }
        .fs-visitante-beneficios,
        .fs-visitante-passos-grid,
        .fs-visitante-publico-grid,
        .fs-visitante-faq-grid,
        .fs-visitante-planos-grid {
          grid-template-columns: 1fr;
        }
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
          <p>O FS Orçamentos ajuda MEIs, oficinas e prestadores de serviço a montar propostas organizadas, com dados da empresa, cliente, itens, observações, total e visual confiável para enviar ao cliente.</p>
          <div class="fs-visitante-acoes">
            <button type="button" class="fs-visitante-btn-principal" onclick="abrirGeradorHomeProtegido()">🧾 Gerar orçamento grátis</button>
            <a href="/planos.html" class="fs-visitante-btn-secundario">Ver planos</a>
          </div>
        </div>

        <div class="fs-visitante-beneficios">
          <div class="fs-visitante-beneficio"><strong>PDF bonito e organizado</strong><span>Monte orçamento com cliente, itens, observações, total, dados da empresa e identidade visual.</span></div>
          <div class="fs-visitante-beneficio"><strong>Envio rápido ao cliente</strong><span>Use o PDF ou link para apresentar a proposta com mais profissionalismo pelo celular ou computador.</span></div>
          <div class="fs-visitante-beneficio"><strong>Evolui para gestão</strong><span>Quando precisar, ative histórico, aprovação, clientes, veículos, OS, estoque, agenda e financeiro.</span></div>
        </div>

        <section class="fs-visitante-secao" aria-label="Como funciona o FS Orçamentos">
          <span class="fs-visitante-mini-tag">Como funciona</span>
          <h2>Do orçamento ao acompanhamento do serviço</h2>
          <p>A plataforma começa simples para quem só precisa gerar PDF, mas pode evoluir para um fluxo completo de atendimento, aprovação, ordem de serviço e controle operacional.</p>
          <div class="fs-visitante-passos-grid">
            <div class="fs-visitante-passo"><strong>1. Cadastre os dados</strong><span>Informe cliente, descrição do serviço, produtos, peças, mão de obra, condições e observações importantes.</span></div>
            <div class="fs-visitante-passo"><strong>2. Gere a proposta</strong><span>Crie uma prévia organizada e baixe o orçamento em PDF com aparência profissional para enviar ao cliente.</span></div>
            <div class="fs-visitante-passo"><strong>3. Acompanhe o retorno</strong><span>No plano Básico, acompanhe histórico, aprovação, recusa e status dos orçamentos enviados.</span></div>
            <div class="fs-visitante-passo"><strong>4. Transforme em OS</strong><span>No Premium, o orçamento pode virar ordem de serviço para execução, conclusão, histórico e controle financeiro.</span></div>
            <div class="fs-visitante-passo"><strong>5. Controle clientes</strong><span>Organize clientes, veículos, serviços realizados e informações úteis para atendimentos futuros.</span></div>
            <div class="fs-visitante-passo"><strong>6. Gerencie a operação</strong><span>Use estoque, agenda, ordens de serviço e relatórios para acompanhar melhor a rotina da oficina ou prestação de serviço.</span></div>
          </div>
        </section>

        <section class="fs-visitante-secao" aria-label="Para quem é o FS Orçamentos">
          <span class="fs-visitante-mini-tag">Para quem é</span>
          <h2>Feito para profissionais que precisam vender serviço com clareza</h2>
          <p>O FS Orçamentos pode ser usado por profissionais autônomos, oficinas, pequenos negócios e equipes que precisam apresentar valores com organização e registrar o histórico do atendimento.</p>
          <div class="fs-visitante-publico-grid">
            <div class="fs-visitante-publico"><strong>Oficinas mecânicas</strong><span>Orçamentos para revisão, manutenção, peças, mão de obra, diagnóstico e serviços recorrentes.</span></div>
            <div class="fs-visitante-publico"><strong>MEI e autônomos</strong><span>Propostas rápidas para clientes, com descrição do serviço, valores e condições combinadas.</span></div>
            <div class="fs-visitante-publico"><strong>Prestadores de serviço</strong><span>Eletricistas, encanadores, instaladores, técnicos e profissionais que precisam formalizar valores.</span></div>
            <div class="fs-visitante-publico"><strong>Pequenas empresas</strong><span>Controle de propostas, responsáveis, clientes e status sem precisar começar por um sistema complexo.</span></div>
            <div class="fs-visitante-publico"><strong>Serviços com peças</strong><span>Organização de produtos, materiais, peças, quantidades, custo, venda e uso em ordens de serviço.</span></div>
            <div class="fs-visitante-publico"><strong>Atendimento recorrente</strong><span>Histórico de clientes, serviços anteriores, pagamentos e próximos atendimentos em um só lugar.</span></div>
          </div>
        </section>

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

        <section class="fs-visitante-secao" aria-label="Perguntas frequentes sobre o FS Orçamentos">
          <span class="fs-visitante-mini-tag">Perguntas frequentes</span>
          <h2>Dúvidas comuns antes de começar</h2>
          <p>Veja respostas rápidas sobre uso gratuito, anúncios, login, dados salvos e recursos de gestão.</p>
          <div class="fs-visitante-faq-grid">
            <div class="fs-visitante-faq-item"><strong>O plano grátis tem anúncio?</strong><span>Sim. O plano grátis pode exibir anúncios para manter a geração de orçamento sem cobrança mensal.</span></div>
            <div class="fs-visitante-faq-item"><strong>Preciso instalar aplicativo?</strong><span>Não. A plataforma funciona pelo navegador. Em celulares, também pode ser adicionada à tela inicial como app.</span></div>
            <div class="fs-visitante-faq-item"><strong>Consigo usar no celular?</strong><span>Sim. A interface foi pensada para celular, tablet e computador, com geração de orçamento em PDF.</span></div>
            <div class="fs-visitante-faq-item"><strong>Meus orçamentos ficam salvos?</strong><span>No plano Básico, o histórico e acompanhamento dos orçamentos ficam disponíveis na conta do usuário.</span></div>
            <div class="fs-visitante-faq-item"><strong>O cliente pode aprovar?</strong><span>No Básico, o orçamento pode ser acompanhado com status de aprovação, recusa e retorno do cliente.</span></div>
            <div class="fs-visitante-faq-item"><strong>O Premium é para quê?</strong><span>O Premium é voltado para gestão operacional: clientes, veículos, OS, estoque, agenda, financeiro e relatórios.</span></div>
          </div>
        </section>

        <section class="fs-visitante-legal-box" aria-label="Informações legais e contato">
          <span class="fs-visitante-mini-tag">Transparência</span>
          <h2>Informações importantes</h2>
          <p>Antes de usar a plataforma, consulte os termos, a política de privacidade e os canais de contato. Essas páginas explicam regras de uso, dados da conta, privacidade e suporte.</p>
          <ul class="fs-visitante-lista">
            <li>O usuário é responsável pelas informações inseridas nos orçamentos e documentos gerados.</li>
            <li>Os recursos podem variar conforme o plano escolhido e a situação da conta.</li>
            <li>Dados de login e perfil são usados para manter a conta, histórico e preferências do usuário.</li>
          </ul>
          <div class="fs-visitante-legal-links">
            <a href="/sobre.html">Sobre</a>
            <a href="/contato.html">Contato</a>
            <a href="/termos.html">Termos de uso</a>
            <a href="/privacidade.html">Privacidade</a>
            <a href="/exclusao-dados.html">Exclusão de dados</a>
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