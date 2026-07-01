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
    if (!orcamentoAtualSalvoId && window.orcamentoAtualSalvoId) {
        orcamentoAtualSalvoId = window.orcamentoAtualSalvoId;
    }

    if (!orcamentoAtualSalvoId && window.orcamentoSalvoAtualId) {
        orcamentoAtualSalvoId = window.orcamentoSalvoAtualId;
    }

    if (!numeroOrcamentoAtual && window.numeroOrcamentoAtual) {
        numeroOrcamentoAtual = window.numeroOrcamentoAtual;
    }

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
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12l4 6-10 12L2 9Z"></path>
                <path d="M2 9h20"></path>
                <path d="M12 21 8 9l4-6 4 6-4 12Z"></path>
            </svg>`;
    }

    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path>
            <path d="M14 2v6h6"></path>
            <path d="M12 12v6"></path>
            <path d="M9 15h6"></path>
        </svg>`;
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

function inserirSecoesComerciaisHome() {
    const home = document.querySelector('main.home');
    if (!home || document.getElementById('home-comparacao-conversao')) return;

    const estilo = document.createElement('style');
    estilo.textContent = `
        .home .planos{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px!important;padding:10px!important;border:1px solid rgba(214,231,255,.88)!important;border-radius:30px!important;background:linear-gradient(180deg,rgba(234,243,255,.78),rgba(234,243,255,.42))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important}
        .home .plano{position:relative!important;overflow:hidden!important;background:#fff!important;border:1px solid #d6e7ff!important;border-radius:28px!important;padding:32px 34px 36px!important;box-shadow:0 18px 42px rgba(20,92,255,.10)!important;border-top:1px solid #d6e7ff!important;color:#040f2f!important}
        .home .plano::before{content:"";position:absolute;right:-42px;top:-42px;width:142px;height:142px;border-radius:50%;background:radial-gradient(circle,rgba(47,123,255,.12) 0%,rgba(47,123,255,0) 72%);pointer-events:none}
        .home .plano.premium::before{background:radial-gradient(circle,rgba(255,208,92,.30) 0%,rgba(255,208,92,0) 72%)}
        .home .plano.premium::after{content:"✦";position:absolute;top:18px;right:22px;font-size:18px;color:#d4a73f;text-shadow:0 0 12px rgba(212,167,63,.35);pointer-events:none}
        .home .plano-topo{display:flex!important;align-items:center!important;gap:14px!important;margin:0 0 18px!important}
        .home .plano-icone{flex:0 0 auto;display:grid;place-items:center;width:54px;height:54px;border-radius:17px;box-shadow:0 15px 28px rgba(20,92,255,.14)}
        .home .plano-icone svg{width:28px;height:28px;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .home .plano-icone.gratis{background:linear-gradient(135deg,#eef5ff,#dce9ff);color:#145cff;border:1px solid #cfe1ff}
        .home .plano-icone.gratis svg{stroke:currentColor}
        .home .plano-icone.premium{background:linear-gradient(135deg,#fff7d7,#f6d977 55%,#d4a73f 100%);color:#7f4f00;border:1px solid rgba(212,167,63,.48);box-shadow:0 18px 34px rgba(212,167,63,.22)}
        .home .plano-icone.premium svg{stroke:currentColor}
        .home .plano-topo-texto{min-width:0}
        .home .plano-selo{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:10px;font-weight:950;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px}
        .home .plano-selo.gratis{background:#eaf3ff;color:#145cff;border:1px solid #cfe1ff}
        .home .plano-selo.premium{background:linear-gradient(135deg,#fff7d7,#f6d977);color:#7f4f00;border:1px solid rgba(212,167,63,.45);box-shadow:0 8px 18px rgba(212,167,63,.16)}
        .home .plano h2{font-size:25px!important;font-weight:950!important;letter-spacing:-.03em!important;margin:0!important;color:#040f2f!important;line-height:1.12!important}
        .home .plano .preco{display:block!important;font-size:clamp(48px,5.4vw,68px)!important;line-height:.98!important;font-weight:950!important;letter-spacing:-.06em!important;color:#145cff!important;margin:0 0 22px!important}
        .home .plano.premium .preco{text-shadow:0 2px 14px rgba(20,92,255,.10)}
        .home .plano ul{list-style:none!important;margin:0 0 26px!important;padding:0!important;color:#3560a3!important;font-weight:820!important;line-height:1.52!important}
        .home .plano li{position:relative!important;padding-left:28px!important;font-size:18px!important;font-weight:820!important;line-height:1.52!important;margin-bottom:3px!important;color:#3560a3!important}
        .home .plano li::before{content:"";position:absolute;left:0;top:.62em;width:10px;height:10px;border-radius:50%;background:#145cff;box-shadow:0 0 0 5px rgba(20,92,255,.10)}
        .home .plano.premium li::before{background:#d4a73f;box-shadow:0 0 0 5px rgba(212,167,63,.16)}
        .home .plano .home-btn{display:grid!important;grid-template-columns:auto 1fr!important;align-items:center!important;width:100%!important;min-height:92px!important;border-radius:18px!important;padding:18px 22px!important;text-decoration:none!important;border:1px solid #d6e7ff!important;box-shadow:0 14px 30px rgba(20,92,255,.08)!important;gap:14px!important}
        .home .plano .home-btn .plan-action-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;flex:0 0 auto}
        .home .plano .home-btn .plan-action-icon svg{width:24px;height:24px;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .home .plano .home-btn .plan-action-icon.gratis{background:#eaf3ff;color:#145cff}
        .home .plano .home-btn .plan-action-icon.gratis svg{stroke:currentColor}
        .home .plano .home-btn .plan-action-icon.premium{background:rgba(255,255,255,.18);color:#ffffff;box-shadow:0 0 0 1px rgba(255,255,255,.14) inset}
        .home .plano .home-btn .plan-action-icon.premium svg{stroke:currentColor}
        .home .plano .home-btn .plan-action-texto{display:block!important;min-width:0!important}
        .home .plano .home-btn strong{display:block!important;font-size:23px!important;line-height:1.05!important;font-weight:950!important;color:inherit!important}
        .home .plano .home-btn span{display:block!important;margin-top:7px!important;font-size:15px!important;font-weight:820!important}
        .home .plano.gratis .home-btn{background:#fff!important;color:#040f2f!important;border-color:#d6e7ff!important}
        .home .plano.gratis .home-btn span{color:#6e84ab!important}
        .home .plano.premium .home-btn{background:linear-gradient(135deg,#4d86ff 0%,#145cff 48%,#1239b4 100%)!important;color:#fff!important;border-color:#4d86ff!important;box-shadow:0 18px 38px rgba(20,92,255,.24)!important}
        .home .plano.premium .home-btn span{color:#dfeaff!important}
        @media(max-width:880px){.home .planos{grid-template-columns:1fr!important;gap:16px!important;padding:8px!important}.home .plano{padding:26px 22px 26px!important;border-radius:24px!important}.home .plano-topo{gap:12px!important;margin-bottom:15px!important}.home .plano-icone{width:48px!important;height:48px!important;border-radius:15px!important}.home .plano-icone svg{width:25px!important;height:25px!important}.home .plano h2{font-size:21px!important}.home .plano .preco{font-size:clamp(44px,11vw,58px)!important;margin-bottom:17px!important}.home .plano ul{margin-bottom:20px!important}.home .plano li{font-size:16px!important;line-height:1.46!important;padding-left:25px!important}.home .plano .home-btn{min-height:78px!important;padding:15px 17px!important;border-radius:16px!important;gap:11px!important}.home .plano .home-btn .plan-action-icon{width:40px!important;height:40px!important;border-radius:13px!important}.home .plano .home-btn .plan-action-icon svg{width:22px!important;height:22px!important}.home .plano .home-btn strong{font-size:19px!important}.home .plano .home-btn span{font-size:13px!important;margin-top:6px!important}}
        @media(max-width:430px){.home .plano{padding:21px 17px 21px!important}.home .plano-icone{width:44px!important;height:44px!important}.home .plano-selo{padding:5px 9px!important;font-size:9px!important;margin-bottom:7px!important}.home .plano h2{font-size:20px!important}.home .plano .preco{font-size:46px!important}.home .plano li{font-size:15px!important;padding-left:23px!important}.home .plano .home-btn{min-height:74px!important;padding:14px 16px!important}.home .plano .home-btn strong{font-size:18px!important}.home .plano .home-btn span{font-size:11px!important}.home .plano .home-btn .plan-action-icon{width:38px!important;height:38px!important}}
        .home-comparacao-grid,.home-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
        .home-bloco-extra{padding:22px}.home-bloco-extra h2{margin:0 0 8px}.home-bloco-extra p{margin:0;color:#245eac;line-height:1.5;font-weight:650}
        .home-ab-card{border:1px solid #d6e7ff;border-radius:16px;padding:18px;background:#f5f9ff}.home-ab-card h3{margin:0 0 10px;font-size:22px}.home-ab-card ul{margin:0;padding-left:18px;line-height:1.75;font-weight:800;color:#245eac}
        .home-ab-card.antes{border-color:#fecaca;background:#fff7f7}.home-ab-card.antes h3{color:#991b1b}.home-ab-card.depois{border-color:#a7f3e5;background:#dcfff7}.home-ab-card.depois h3{color:#05765f}
        .home-faq-item{border:1px solid #d6e7ff;border-radius:14px;padding:16px;background:#f5f9ff}.home-faq-item strong{display:block;margin-bottom:6px;color:#040f2f}.home-faq-item p{margin:0;color:#245eac;font-weight:650;line-height:1.5}
        @media(max-width:860px){.home-comparacao-grid,.home-faq-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(estilo);

    decorarCardsPlanosHome(home);

    const comparacao = document.createElement('section');
    comparacao.id = 'home-comparacao-conversao';
    comparacao.className = 'card home-bloco-extra';
    comparacao.innerHTML = `
        <span class="tag">Antes e depois</span>
        <h2>De proposta informal para orçamento organizado.</h2>
        <p>Mostre preço, mão de obra, produtos e total em um formato claro para o cliente decidir.</p>
        <div class="home-comparacao-grid">
            <div class="home-ab-card antes"><h3>Antes</h3><ul><li>Valores espalhados na conversa</li><li>Sem padrão visual</li><li>Sem histórico claro</li><li>Sem controle do que virou venda</li></ul></div>
            <div class="home-ab-card depois"><h3>Depois</h3><ul><li>Orçamento separado por mão de obra e produtos</li><li>Cliente aprova ou recusa pelo link</li><li>Histórico salvo no Premium</li><li>Venda pode ir para o Caixa</li></ul></div>
        </div>`;

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

    const comoFunciona = Array.from(home.querySelectorAll('.fluxo')).find(secao => secao.textContent.includes('Como funciona'));
    if (comoFunciona) home.insertBefore(comparacao, comoFunciona);
    else home.appendChild(comparacao);
    home.appendChild(faq);
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
        if (typeof abrirModalLogin === 'function') {
            abrirModalLogin();
        } else {
            window.location.href = '/index.html?login=1';
        }

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

    if (formulario) {
        formulario.style.display = 'block';
    }

    document.body.classList.add('gerador-aberto');
    document.body.classList.remove('modal-aberto');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    await carregarDadosEmpresaLogada();

    if (typeof carregarDadosEmissorNoModal === 'function') {
        await carregarDadosEmissorNoModal();
    }

    setTimeout(() => {
        const alvo = secao || modalAntigo || formulario;

        if (alvo) {
            alvo.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
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

    if (formulario && secao) {
        formulario.style.display = 'none';
    }

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
