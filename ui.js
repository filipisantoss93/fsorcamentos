// ==================== VARIÁVEIS GLOBAIS DE UI ====================

let currentSlide = 0;
let dadosEmpresaLogada = null;
let orcamentoAtualSalvoId = window.orcamentoAtualSalvoId || null;
let numeroOrcamentoAtual = window.numeroOrcamentoAtual || null;
let linkOrcamentoAtual = null;
let gerandoPdfAgora = false;

// ==================== HELPERS DE CONTROLE DO ORÇAMENTO SALVO ====================

function definirOrcamentoAtualSalvo(id, numero = null) {
    if (!id) return;
    orcamentoAtualSalvoId = id;
    window.orcamentoAtualSalvoId = id;
    window.orcamentoSalvoAtualId = id;

    if (numero) {
        numeroOrcamentoAtual = numero;
        window.numeroOrcamentoAtual = numero;
    }

    linkOrcamentoAtual = montarLinkOrcamento(id);
    window.linkOrcamentoAtual = linkOrcamentoAtual;
}

function limparReferenciaOrcamentoAtual() {
    orcamentoAtualSalvoId = null;
    numeroOrcamentoAtual = null;
    linkOrcamentoAtual = null;
    window.orcamentoAtualSalvoId = null;
    window.orcamentoSalvoAtualId = null;
    window.numeroOrcamentoAtual = null;
    window.linkOrcamentoAtual = null;
}

function sincronizarReferenciaOrcamentoSalvo() {
    if (!orcamentoAtualSalvoId && window.orcamentoAtualSalvoId) orcamentoAtualSalvoId = window.orcamentoAtualSalvoId;
    if (!orcamentoAtualSalvoId && window.orcamentoSalvoAtualId) orcamentoAtualSalvoId = window.orcamentoSalvoAtualId;
    if (!numeroOrcamentoAtual && window.numeroOrcamentoAtual) numeroOrcamentoAtual = window.numeroOrcamentoAtual;

    if (orcamentoAtualSalvoId) {
        linkOrcamentoAtual = montarLinkOrcamento(orcamentoAtualSalvoId);
        window.linkOrcamentoAtual = linkOrcamentoAtual;
    }
}

function formatarNumeroOrcamento(numero) {
    if (!numero) return 'PRÉVIA';
    return String(numero).padStart(6, '0');
}

// ==================== INICIALIZAÇÃO DA INTERFACE ====================

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hide-splash');
    }, 1200);

    setInterval(() => {
        const carousel = document.getElementById('carousel');
        if (!carousel) return;
        const totalSlides = document.querySelectorAll('.carousel-slide a').length;
        if (totalSlides > 0) {
            currentSlide = (currentSlide + 1) % totalSlides;
            carousel.style.transform = `translateX(${-currentSlide * 100}%)`;
        }
    }, 5000);

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.querySelector('.nav-menu');
            const menuLinha = document.querySelector('.header-menu-linha');
            if (menu) menu.classList.remove('active');
            if (menuLinha) menuLinha.classList.remove('menu-aberto');
        });
    });

    if (document.getElementById('itens-lista')) {
        await carregarDadosEmpresaLogada();
        carregarEstadoSalvo();
    }

    inserirSecoesComerciaisHome();
    abrirGeradorAutomaticamenteSeSolicitado();
});

// ==================== HOME / CONVERSÃO ====================

function obterSvgPlano(tipo) {
    if (tipo === 'premium') {
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9Z"></path><path d="M2 9h20"></path><path d="M12 21 8 9l4-6 4 6-4 12Z"></path></svg>`;
    }

    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="M9 15h6"></path></svg>`;
}

function obterSvgAntesDepois(tipo) {
    if (tipo === 'depois') {
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="m8.5 14.2 2.2 2.2 4.8-5"></path></svg>`;
    }

    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8"></path><path d="M14 2v6h6"></path><path d="M8 13h5"></path><path d="m16 15 4 4"></path><path d="m20 15-4 4"></path></svg>`;
}

function obterSvgHome(tipo) {
    const svgs = {
        rocket: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4c3.4.5 5.5 2.6 6 6-2.6.5-5 1.8-6.7 3.7L10.3 17 7 13.7l3.3-3C12.2 9 13.5 6.6 14 4Z"></path><path d="M7 17c-1.8.5-2.8 1.5-3 3 1.5-.2 2.5-1.2 3-3Z"></path><path d="M15 8h.01"></path></svg>`,
        users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0"></path><path d="M5 20a7 7 0 0 1 14 0"></path><path d="M19 9a3 3 0 0 1 2 5"></path><path d="M3 14a3 3 0 0 1 2-5"></path></svg>`,
        adddoc: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="M9 15h6"></path></svg>`,
        pdf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><rect x="7" y="13" width="10" height="5" rx="1"></rect><path d="M8.5 16v-2h1a1 1 0 0 1 0 2h-1Zm3.5 0v-2h.8a1.2 1.2 0 0 1 0 2H12Zm3.5 0v-2h1.7"></path></svg>`,
        whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.5 7.5L4 20l1-3.4A8.5 8.5 0 1 1 20 11.5Z"></path><path d="M9 8.8c.4 2.7 2 4.7 4.4 6 .5.3 1.2.2 1.6-.2l.7-.7"></path></svg>`,
        cash: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="8" width="14" height="11" rx="2"></rect><path d="M8 8V5h8v3"></path><path d="M8 12h8"></path><path d="M8 15h3"></path><path d="M14 15h2"></path></svg>`,
        wrench: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a5 5 0 0 0-6 6L3 18l3 3 5.7-5.7a5 5 0 0 0 6-6l-3.1 3.1-3-3 3.1-3.1Z"></path></svg>`,
        speed: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a8 8 0 0 1 16 0"></path><path d="M12 14l4-4"></path><path d="M6 14h.01M18 14h.01M8 9h.01M16 9h.01"></path></svg>`,
        folder: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path></svg>`,
        shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"></path><path d="m9 12 2 2 4-4"></path></svg>`
    };

    return svgs[tipo] || '';
}

function decorarCardsPlanosHome(home) {
    const planos = [
        { seletor: '.planos .plano.gratis', tipo: 'gratis', rotulo: 'Grátis' },
        { seletor: '.planos .plano.premium', tipo: 'premium', rotulo: 'Premium' }
    ];

    planos.forEach(({ seletor, tipo, rotulo }) => {
        const card = home.querySelector(seletor);
        if (!card) return;
        card.classList.add('plano-home-decorado');

        const titulo = card.querySelector('h2');
        if (titulo && !card.querySelector('.plano-topo')) {
            const topo = document.createElement('div');
            topo.className = `plano-topo ${tipo}`;

            const icone = document.createElement('span');
            icone.className = `plano-icone ${tipo}`;
            icone.innerHTML = obterSvgPlano(tipo);

            const areaTexto = document.createElement('div');
            areaTexto.className = 'plano-topo-texto';

            const selo = document.createElement('span');
            selo.className = `plano-selo ${tipo}`;
            selo.textContent = rotulo;

            titulo.parentNode.insertBefore(topo, titulo);
            areaTexto.appendChild(selo);
            areaTexto.appendChild(titulo);
            topo.appendChild(icone);
            topo.appendChild(areaTexto);
        }

        const botao = card.querySelector('.home-btn');
        if (botao && !botao.querySelector('.plan-action-icon')) {
            const iconeBotao = document.createElement('span');
            iconeBotao.className = `plan-action-icon ${tipo}`;
            iconeBotao.innerHTML = obterSvgPlano(tipo);
            botao.prepend(iconeBotao);

            const textoExistente = botao.querySelector('div');
            if (textoExistente) textoExistente.classList.add('plan-action-texto');
        }
    });
}

function ajustarSecoesFluxoHome(home) {
    const comoFunciona = Array.from(home.querySelectorAll('.fluxo')).find(secao => secao.textContent.includes('Como funciona') || secao.textContent.includes('Em 4 passos'));
    const paraQuem = Array.from(home.querySelectorAll('.fluxo')).find(secao => secao.textContent.includes('Para quem é') || secao.textContent.includes('Prestadores que precisam vender'));

    if (comoFunciona && !comoFunciona.classList.contains('home-como-funciona')) {
        comoFunciona.classList.add('home-como-funciona');
        comoFunciona.innerHTML = `
            <span class="home-section-pill"><span class="pill-icon">${obterSvgHome('rocket')}</span><span>Como funciona</span></span>
            <h2>Em 4 passos</h2>
            <div class="home-steps-list">
                <a href="/gerador.html" class="home-step-card"><span class="step-number">1</span><span class="step-divider"></span><span class="step-icon">${obterSvgHome('adddoc')}</span><strong>1. Crie o orçamento</strong><span class="step-arrow">›</span></a>
                <a href="/gerador.html" class="home-step-card"><span class="step-number">2</span><span class="step-divider"></span><span class="step-icon">${obterSvgHome('pdf')}</span><strong>2. Gere PDF ou salve</strong><span class="step-arrow">›</span></a>
                <a href="/planos.html" class="home-step-card"><span class="step-number">3</span><span class="step-divider"></span><span class="step-icon">${obterSvgHome('whatsapp')}</span><strong>3. Envie pelo WhatsApp</strong><span class="step-arrow">›</span></a>
                <a href="/fluxo-caixa.html" class="home-step-card"><span class="step-number">4</span><span class="step-divider"></span><span class="step-icon">${obterSvgHome('cash')}</span><strong>4. Registre no Caixa</strong><span class="step-arrow">›</span></a>
            </div>`;
    }

    if (paraQuem && !paraQuem.classList.contains('home-para-quem')) {
        paraQuem.classList.add('home-para-quem');
        paraQuem.innerHTML = `
            <span class="home-section-pill"><span class="pill-icon simple">${obterSvgHome('users')}</span><span>Para quem é</span></span>
            <h2>Prestadores que precisam vender rápido e parecer profissionais</h2>
            <p>Mecânicos, técnicos, instaladores, eletricistas e pequenos negócios que querem orçamento organizado, histórico e controle simples.</p>
            <div class="audience-grid">
                <div class="audience-card"><span>${obterSvgHome('wrench')}</span><strong>Profissionais<br>de serviço</strong></div>
                <div class="audience-card"><span>${obterSvgHome('speed')}</span><strong>Mais agilidade<br>nas vendas</strong></div>
                <div class="audience-card"><span>${obterSvgHome('folder')}</span><strong>Organização e<br>histórico</strong></div>
                <div class="audience-card"><span>${obterSvgHome('shield')}</span><strong>Imagem<br>profissional</strong></div>
            </div>`;
    }
}

function inserirSecoesComerciaisHome() {
    const home = document.querySelector('main.home');
    if (!home) return;

    if (!document.getElementById('home-visual-overrides')) {
        const estilo = document.createElement('style');
        estilo.id = 'home-visual-overrides';
        estilo.textContent = `
            .home .planos{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px!important;padding:10px!important;border:1px solid rgba(214,231,255,.88)!important;border-radius:30px!important;background:linear-gradient(180deg,rgba(234,243,255,.78),rgba(234,243,255,.42))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important}
            .home .plano{position:relative!important;overflow:hidden!important;background:#fff!important;border:1px solid #d6e7ff!important;border-radius:28px!important;padding:32px 34px 36px!important;box-shadow:0 18px 42px rgba(20,92,255,.10)!important;border-top:1px solid #d6e7ff!important;color:#040f2f!important}
            .home .plano::before{content:"";position:absolute;right:-42px;top:-42px;width:142px;height:142px;border-radius:50%;background:radial-gradient(circle,rgba(47,123,255,.12) 0%,rgba(47,123,255,0) 72%);pointer-events:none}
            .home .plano.premium::before{background:radial-gradient(circle,rgba(255,208,92,.30) 0%,rgba(255,208,92,0) 72%)}
            .home .plano.premium::after{content:"✦";position:absolute;top:18px;right:22px;font-size:18px;color:#d4a73f;text-shadow:0 0 12px rgba(212,167,63,.35);pointer-events:none}
            .home .plano-topo{display:flex!important;align-items:center!important;gap:14px!important;margin:0 0 18px!important}
            .home .plano-icone{flex:0 0 auto;display:grid;place-items:center;width:54px;height:54px;border-radius:17px;box-shadow:0 15px 28px rgba(20,92,255,.14)}
            .home .plano-icone svg{width:28px;height:28px;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
            .home .plano-icone.gratis{background:linear-gradient(135deg,#eef5ff,#dce9ff);color:#145cff;border:1px solid #cfe1ff}.home .plano-icone.gratis svg{stroke:currentColor}
            .home .plano-icone.premium{background:linear-gradient(135deg,#fff7d7,#f6d977 55%,#d4a73f 100%);color:#7f4f00;border:1px solid rgba(212,167,63,.48);box-shadow:0 18px 34px rgba(212,167,63,.22)}.home .plano-icone.premium svg{stroke:currentColor}
            .home .plano-topo-texto{min-width:0}.home .plano-selo{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:10px;font-weight:950;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px}.home .plano-selo.gratis{background:#eaf3ff;color:#145cff;border:1px solid #cfe1ff}.home .plano-selo.premium{background:linear-gradient(135deg,#fff7d7,#f6d977);color:#7f4f00;border:1px solid rgba(212,167,63,.45);box-shadow:0 8px 18px rgba(212,167,63,.16)}
            .home .plano h2{font-size:25px!important;font-weight:950!important;letter-spacing:-.03em!important;margin:0!important;color:#040f2f!important;line-height:1.12!important}.home .plano .preco{display:block!important;font-size:clamp(48px,5.4vw,68px)!important;line-height:.98!important;font-weight:950!important;letter-spacing:-.06em!important;color:#145cff!important;margin:0 0 22px!important}.home .plano ul{list-style:none!important;margin:0 0 26px!important;padding:0!important;color:#3560a3!important;font-weight:820!important;line-height:1.52!important}.home .plano li{position:relative!important;padding-left:28px!important;font-size:18px!important;font-weight:820!important;line-height:1.52!important;margin-bottom:3px!important;color:#3560a3!important}.home .plano li::before{content:"";position:absolute;left:0;top:.62em;width:10px;height:10px;border-radius:50%;background:#145cff;box-shadow:0 0 0 5px rgba(20,92,255,.10)}.home .plano.premium li::before{background:#d4a73f;box-shadow:0 0 0 5px rgba(212,167,63,.16)}
            .home .plano .home-btn{display:grid!important;grid-template-columns:auto 1fr!important;align-items:center!important;width:100%!important;min-height:92px!important;border-radius:18px!important;padding:18px 22px!important;text-decoration:none!important;border:1px solid #d6e7ff!important;box-shadow:0 14px 30px rgba(20,92,255,.08)!important;gap:14px!important}.home .plano .home-btn .plan-action-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;flex:0 0 auto}.home .plano .home-btn .plan-action-icon svg{width:24px;height:24px;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.home .plano .home-btn .plan-action-icon.gratis{background:#eaf3ff;color:#145cff}.home .plano .home-btn .plan-action-icon.gratis svg{stroke:currentColor}.home .plano .home-btn .plan-action-icon.premium{background:rgba(255,255,255,.18);color:#ffffff;box-shadow:0 0 0 1px rgba(255,255,255,.14) inset}.home .plano .home-btn .plan-action-icon.premium svg{stroke:currentColor}.home .plano .home-btn strong{display:block!important;font-size:23px!important;line-height:1.05!important;font-weight:950!important;color:inherit!important}.home .plano .home-btn span{display:block!important;margin-top:7px!important;font-size:15px!important;font-weight:820!important}.home .plano.gratis .home-btn{background:#fff!important;color:#040f2f!important;border-color:#d6e7ff!important}.home .plano.gratis .home-btn span{color:#6e84ab!important}.home .plano.premium .home-btn{background:linear-gradient(135deg,#4d86ff 0%,#145cff 48%,#1239b4 100%)!important;color:#fff!important;border-color:#4d86ff!important;box-shadow:0 18px 38px rgba(20,92,255,.24)!important}.home .plano.premium .home-btn span{color:#dfeaff!important}
            .home-bloco-extra,.home .home-como-funciona,.home .home-para-quem{padding:34px 38px!important;border-radius:28px!important;background:rgba(255,255,255,.96)!important;border:1px solid #d6e7ff!important;box-shadow:0 18px 42px rgba(20,92,255,.10)!important}
            .home-bloco-extra>.tag{display:inline-flex!important;align-items:center!important;width:max-content!important;border-radius:999px!important;padding:8px 14px!important;background:#f5f9ff!important;border:1px solid #d6e7ff!important;color:#145cff!important;font-size:15px!important;font-weight:850!important;margin-bottom:18px!important;text-transform:none!important;letter-spacing:0!important}
            .home-bloco-extra h2{margin:0 0 18px!important;max-width:650px!important;color:#040f2f!important;font-size:clamp(30px,4.4vw,46px)!important;line-height:1.18!important;letter-spacing:-.045em!important;font-weight:950!important}.home-bloco-extra>p{max-width:780px!important;margin:0 0 28px!important;color:#65718a!important;line-height:1.45!important;font-size:20px!important;font-weight:520!important}.home-comparacao-grid{display:grid!important;grid-template-columns:1fr!important;gap:22px!important;margin-top:0!important}.home-ab-card{display:grid!important;grid-template-columns:220px 1fr!important;gap:24px!important;align-items:center!important;border-radius:24px!important;padding:24px!important;background:#fff!important;box-shadow:none!important}.home-ab-card.antes{border:1px solid #f0cfd1!important;background:linear-gradient(135deg,#fff,#fff8f8)!important}.home-ab-card.depois{position:relative!important;border:1px solid #9ec4ff!important;background:linear-gradient(135deg,#fff,#f7fbff)!important;box-shadow:0 12px 26px rgba(20,92,255,.12)!important}.ab-side{display:flex!important;flex-direction:column!important;gap:14px!important;padding-right:24px!important;border-right:1px solid #e4eaf6!important;min-height:134px!important;justify-content:center!important}.ab-side-top{display:flex!important;align-items:center!important;gap:12px!important}.ab-icon-box{width:76px!important;height:76px!important;border-radius:22px!important;display:grid!important;place-items:center!important;box-shadow:0 15px 30px rgba(4,15,47,.08)!important}.ab-icon-box svg{width:38px!important;height:38px!important;fill:none!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}.ab-icon-box.antes{background:#fff!important;color:#5b3a3a!important;border:1px solid #f5dddd!important;box-shadow:0 16px 28px rgba(219,92,92,.10)!important}.ab-icon-box.antes svg,.ab-icon-box.depois svg{stroke:currentColor!important}.ab-icon-box.depois{background:linear-gradient(135deg,#2f7bff,#145cff)!important;color:#fff!important;border:1px solid #2f7bff!important;box-shadow:0 16px 30px rgba(20,92,255,.28)!important}.ab-stars{position:relative;min-width:58px;height:58px;color:#9ec4ff;font-weight:950}.ab-stars span{position:absolute;display:inline-block;color:#9ec4ff;text-shadow:0 0 12px rgba(20,92,255,.20)}.ab-stars span:first-child{font-size:26px;left:0;top:2px}.ab-stars span:last-child{font-size:34px;right:2px;bottom:0}.ab-heading h3{margin:0!important;font-size:28px!important;line-height:1.05!important;font-weight:950!important;letter-spacing:-.035em!important;color:#040f2f!important}.ab-heading span{display:block;margin-top:6px;color:#6a7182!important;font-weight:650!important;font-size:16px!important}.home-ab-card.depois .ab-heading span{color:#145cff!important;font-weight:800!important}.ab-list{display:grid!important;gap:14px!important}.ab-item{display:grid!important;grid-template-columns:auto 1fr!important;align-items:start!important;gap:14px!important}.ab-item p{margin:0!important;color:#040f2f!important;font-size:20px!important;line-height:1.3!important;font-weight:740!important}.ab-bullet{width:26px!important;height:26px!important;border-radius:50%!important;display:grid!important;place-items:center!important;font-size:16px!important;line-height:1!important;font-weight:950!important;flex:0 0 auto!important}.ab-bullet.x{background:#ffe9e9!important;color:#df8b8b!important}.ab-bullet.check{background:#145cff!important;color:#fff!important;box-shadow:0 8px 16px rgba(20,92,255,.22)!important}
            .home .home-como-funciona{display:block!important}.home-section-pill{display:inline-flex!important;align-items:center!important;gap:12px!important;width:max-content!important;max-width:100%!important;border-radius:999px!important;padding:8px 18px 8px 10px!important;background:#fff!important;border:1px solid #d6e7ff!important;color:#145cff!important;font-size:15px!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.04em!important;margin-bottom:24px!important;box-shadow:0 10px 24px rgba(20,92,255,.09)!important}.pill-icon{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;border-radius:50%!important;background:linear-gradient(135deg,#2f7bff,#145cff)!important;color:#fff!important;box-shadow:0 10px 20px rgba(20,92,255,.22)!important}.pill-icon.simple{background:#fff!important;color:#145cff!important;box-shadow:none!important}.pill-icon svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.home-como-funciona h2,.home-para-quem h2{margin:0!important;color:#040f2f!important;font-size:clamp(30px,4vw,42px)!important;line-height:1.15!important;letter-spacing:-.045em!important;font-weight:950!important}.home-steps-list{display:grid!important;grid-template-columns:1fr!important;gap:16px!important;margin-top:26px!important}.home-step-card{display:grid!important;grid-template-columns:58px 1px 54px 1fr auto!important;align-items:center!important;gap:18px!important;min-height:86px!important;padding:14px 22px!important;border:1px solid #d6e7ff!important;border-radius:20px!important;background:linear-gradient(135deg,#fff,#f8fbff)!important;box-shadow:0 12px 28px rgba(20,92,255,.08)!important;text-decoration:none!important;color:#040f2f!important}.step-number{display:grid!important;place-items:center!important;width:48px!important;height:48px!important;border-radius:50%!important;background:linear-gradient(135deg,#2f7bff,#145cff)!important;color:#fff!important;font-size:22px!important;font-weight:950!important;box-shadow:0 10px 18px rgba(20,92,255,.22)!important}.step-divider{display:block!important;width:1px!important;height:52px!important;background:#dce8ff!important}.step-icon{display:grid!important;place-items:center!important;color:#145cff!important}.step-icon svg{width:40px!important;height:40px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}.home-step-card strong{font-size:22px!important;line-height:1.15!important;font-weight:950!important;color:#040f2f!important;white-space:normal!important}.step-arrow{color:#145cff!important;font-size:42px!important;line-height:1!important;font-weight:400!important;margin-left:6px!important}
            .home-para-quem{position:relative!important;overflow:hidden!important}.home-para-quem::before{content:"";position:absolute;right:60px;top:32px;width:150px;height:110px;opacity:.38;background-image:radial-gradient(#b8d4ff 1.5px,transparent 1.5px);background-size:14px 14px;pointer-events:none}.home-para-quem::after{content:"";position:absolute;right:-56px;bottom:-50px;width:210px;height:210px;border-radius:50%;border:34px solid rgba(234,243,255,.9);pointer-events:none}.home-para-quem>*{position:relative;z-index:1}.home-para-quem h2{max-width:720px!important;margin-top:2px!important}.home-para-quem p{max-width:760px!important;margin:16px 0 22px!important;color:#245eac!important;font-size:20px!important;line-height:1.35!important;font-weight:780!important}.audience-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-top:18px!important}.audience-card{min-height:122px!important;border:1px solid #d6e7ff!important;border-radius:18px!important;background:rgba(255,255,255,.86)!important;box-shadow:0 10px 24px rgba(20,92,255,.08)!important;padding:18px 10px 14px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}.audience-card span{display:grid!important;place-items:center!important;color:#145cff!important;margin-bottom:12px!important}.audience-card svg{width:38px!important;height:38px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.audience-card strong{font-size:14px!important;line-height:1.2!important;color:#245eac!important;font-weight:850!important}
            .home-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.home-faq-item{border:1px solid #d6e7ff;border-radius:14px;padding:16px;background:#f5f9ff}.home-faq-item strong{display:block;margin-bottom:6px;color:#040f2f}.home-faq-item p{margin:0;color:#245eac;font-weight:650;line-height:1.5}
            @media(max-width:880px){.home .planos{grid-template-columns:1fr!important;gap:16px!important;padding:8px!important}.home .plano{padding:26px 22px 26px!important;border-radius:24px!important}.home .plano h2{font-size:21px!important}.home .plano .preco{font-size:clamp(44px,11vw,58px)!important;margin-bottom:17px!important}.home .plano li{font-size:16px!important;line-height:1.46!important}.home .plano .home-btn{min-height:78px!important;padding:15px 17px!important}.home .plano .home-btn strong{font-size:19px!important}.home .plano .home-btn span{font-size:13px!important}.home-faq-grid{grid-template-columns:1fr!important}}
            @media(max-width:760px){.home-bloco-extra,.home .home-como-funciona,.home .home-para-quem{padding:28px 22px!important}.home-bloco-extra h2{font-size:31px!important;line-height:1.18!important}.home-bloco-extra>p{font-size:18px!important}.home-ab-card{grid-template-columns:1fr!important;gap:18px!important;padding:20px 18px!important}.ab-side{border-right:0!important;border-bottom:1px solid #e4eaf6!important;padding-right:0!important;padding-bottom:16px!important;min-height:0!important}.ab-item p{font-size:17px!important}.ab-heading h3{font-size:26px!important}.home-section-pill{font-size:13px!important;padding:7px 15px 7px 8px!important;margin-bottom:20px!important}.pill-icon{width:38px!important;height:38px!important}.home-como-funciona h2,.home-para-quem h2{font-size:30px!important}.home-step-card{grid-template-columns:48px 1px 45px 1fr auto!important;gap:13px!important;min-height:78px!important;padding:12px 16px!important;border-radius:18px!important}.step-number{width:42px!important;height:42px!important;font-size:20px!important}.step-divider{height:48px!important}.step-icon svg{width:34px!important;height:34px!important}.home-step-card strong{font-size:18px!important}.step-arrow{font-size:36px!important}.home-para-quem p{font-size:17px!important;line-height:1.38!important}.audience-grid{gap:10px!important}.audience-card{min-height:106px!important;padding:14px 7px 12px!important}.audience-card svg{width:31px!important;height:31px!important}.audience-card strong{font-size:11.5px!important;line-height:1.18!important}}
            @media(max-width:430px){.home .plano .preco{font-size:46px!important}.home-bloco-extra h2{font-size:28px!important}.home-bloco-extra>p{font-size:16px!important}.ab-item p{font-size:16px!important}.ab-bullet{width:24px!important;height:24px!important;font-size:14px!important}.ab-icon-box{width:68px!important;height:68px!important}.ab-icon-box svg{width:34px!important;height:34px!important}.home-como-funciona h2,.home-para-quem h2{font-size:28px!important}.home-step-card{grid-template-columns:42px 1px 38px 1fr auto!important;gap:10px!important;min-height:72px!important;padding:10px 12px!important}.step-number{width:38px!important;height:38px!important;font-size:18px!important}.step-divider{height:42px!important}.step-icon svg{width:30px!important;height:30px!important}.home-step-card strong{font-size:15.5px!important;line-height:1.18!important}.step-arrow{font-size:32px!important}.home-para-quem p{font-size:15.5px!important}.audience-grid{gap:8px!important}.audience-card{min-height:96px!important;padding:12px 5px 10px!important;border-radius:14px!important}.audience-card span{margin-bottom:9px!important}.audience-card svg{width:27px!important;height:27px!important}.audience-card strong{font-size:10px!important;line-height:1.15!important}}
        `;
        document.head.appendChild(estilo);
    }

    decorarCardsPlanosHome(home);
    ajustarSecoesFluxoHome(home);

    if (!document.getElementById('home-comparacao-conversao')) {
        const comparacao = document.createElement('section');
        comparacao.id = 'home-comparacao-conversao';
        comparacao.className = 'card home-bloco-extra';
        comparacao.innerHTML = `
            <span class="tag">Antes e depois</span>
            <h2>De proposta informal para orçamento organizado.</h2>
            <p>Mostre preço, mão de obra, produtos e total em um formato claro para o cliente decidir.</p>
            <div class="home-comparacao-grid">
                <article class="home-ab-card antes">
                    <div class="ab-side"><div class="ab-side-top"><span class="ab-icon-box antes">${obterSvgAntesDepois('antes')}</span></div><div class="ab-heading"><h3>Antes</h3><span>Como é hoje</span></div></div>
                    <div class="ab-list">
                        <div class="ab-item"><span class="ab-bullet x">×</span><p>Valores espalhados na conversa</p></div>
                        <div class="ab-item"><span class="ab-bullet x">×</span><p>Sem padrão visual</p></div>
                        <div class="ab-item"><span class="ab-bullet x">×</span><p>Sem histórico claro</p></div>
                        <div class="ab-item"><span class="ab-bullet x">×</span><p>Sem controle do que virou venda</p></div>
                    </div>
                </article>
                <article class="home-ab-card depois">
                    <div class="ab-side"><div class="ab-side-top"><span class="ab-icon-box depois">${obterSvgAntesDepois('depois')}</span><span class="ab-stars"><span>✦</span><span>✦</span></span></div><div class="ab-heading"><h3>Depois</h3><span>Com o FS Orçamento</span></div></div>
                    <div class="ab-list">
                        <div class="ab-item"><span class="ab-bullet check">✓</span><p>Orçamento separado por mão de obra e produtos</p></div>
                        <div class="ab-item"><span class="ab-bullet check">✓</span><p>Cliente aprova ou recusa pelo link</p></div>
                        <div class="ab-item"><span class="ab-bullet check">✓</span><p>Histórico salvo no Premium</p></div>
                        <div class="ab-item"><span class="ab-bullet check">✓</span><p>Venda pode ir para o Caixa</p></div>
                    </div>
                </article>
            </div>`;

        const comoFunciona = home.querySelector('.home-como-funciona') || Array.from(home.querySelectorAll('.fluxo')).find(secao => secao.textContent.includes('Como funciona') || secao.textContent.includes('Em 4 passos'));
        if (comoFunciona) home.insertBefore(comparacao, comoFunciona);
        else home.appendChild(comparacao);
    }

    if (!document.getElementById('home-faq-comercial')) {
        const faq = document.createElement('section');
        faq.id = 'home-faq-comercial';
        faq.className = 'card home-bloco-extra';
        faq.innerHTML = `
            <span class="tag">Dúvidas rápidas</span>
            <h2>FAQ comercial</h2>
            <div class="home-faq-grid">
                <div class="home-faq-item"><strong>Preciso pagar para usar?</strong><p>Não. Você pode criar orçamento e baixar PDF no plano grátis.</p></div>
                <div class="home-faq-item"><strong>O cliente precisa criar conta?</strong><p>Não. No Premium, ele abre o link e aprova ou recusa online.</p></div>
                <div class="home-faq-item"><strong>Funciona pelo WhatsApp?</strong><p>Sim. O Premium gera o link e a mensagem para envio ao cliente.</p></div>
                <div class="home-faq-item"><strong>Qual é o foco?</strong><p>Orçamento profissional, aprovação online, Caixa simples e relatórios essenciais.</p></div>
            </div>`;
        home.appendChild(faq);
    }
}

// ==================== GERADOR INLINE / COMPATIBILIDADE ====================

async function usuarioTemSessaoAtiva() {
    if (!window._supabase) return false;
    const { data: { session } } = await _supabase.auth.getSession();
    return !!session?.user?.id;
}

async function abrirModalGerador() {
    const temSessao = await usuarioTemSessaoAtiva();

    if (!temSessao) {
        if (typeof abrirModalLogin === 'function') abrirModalLogin();
        else window.location.href = '/index.html?login=1';
        return;
    }

    const secao = document.getElementById('secao-gerador-orcamento');
    const modalAntigo = document.getElementById('modal-gerador-orcamento');
    const formulario = document.getElementById('formulario-orcamento');

    if (secao) {
        secao.classList.add('ativo');
        secao.style.display = 'block';
    }

    if (modalAntigo) {
        modalAntigo.style.display = 'flex';
        modalAntigo.classList.add('ativo');
        modalAntigo.classList.remove('active');
        modalAntigo.setAttribute('aria-hidden', 'false');
    }

    if (formulario) formulario.style.display = 'block';

    document.body.classList.add('gerador-aberto');
    document.body.classList.remove('modal-aberto');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    await carregarDadosEmpresaLogada();
    if (typeof carregarDadosEmissorNoModal === 'function') await carregarDadosEmissorNoModal();

    setTimeout(() => {
        const alvo = secao || modalAntigo || formulario;
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function fecharModalGerador() {
    const secao = document.getElementById('secao-gerador-orcamento');
    const modalAntigo = document.getElementById('modal-gerador-orcamento');
    const formulario = document.getElementById('formulario-orcamento');

    if (secao) {
        secao.classList.remove('ativo');
        secao.style.display = 'none';
    }

    if (modalAntigo) {
        modalAntigo.style.display = 'none';
        modalAntigo.classList.remove('ativo');
        modalAntigo.classList.remove('active');
        modalAntigo.setAttribute('aria-hidden', 'true');
    }

    if (formulario && secao) formulario.style.display = 'none';

    document.body.classList.remove('gerador-aberto');
    document.body.classList.remove('modal-aberto');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

function abrirGeradorAutomaticamenteSeSolicitado() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('abrirGerador') !== '1') return;

    setTimeout(async () => {
        await abrirModalGerador();
        const novaUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, novaUrl);
    }, 700);
}

// ==================== MENU E SCROLL ====================
