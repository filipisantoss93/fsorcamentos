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

function inserirSecoesComerciaisHome() {
    const home = document.querySelector('main.home');
    if (!home || document.getElementById('home-comparacao-conversao')) return;

    const estilo = document.createElement('style');
    estilo.textContent = `
        .home-comparacao-grid,.home-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
        .home-bloco-extra{padding:22px}.home-bloco-extra h2{margin:0 0 8px}.home-bloco-extra p{margin:0;color:#64748b;line-height:1.5;font-weight:650}
        .home-ab-card{border:1px solid #dbe3ee;border-radius:16px;padding:18px;background:#f8fafc}.home-ab-card h3{margin:0 0 10px;font-size:22px}.home-ab-card ul{margin:0;padding-left:18px;line-height:1.75;font-weight:800;color:#334155}
        .home-ab-card.antes{border-color:#fecaca;background:#fff7f7}.home-ab-card.antes h3{color:#991b1b}.home-ab-card.depois{border-color:#bbf7d0;background:#f0fdf4}.home-ab-card.depois h3{color:#166534}
        .home-faq-item{border:1px solid #dbe3ee;border-radius:14px;padding:16px;background:#f8fafc}.home-faq-item strong{display:block;margin-bottom:6px;color:#0f172a}.home-faq-item p{margin:0;color:#64748b;font-weight:650;line-height:1.5}
        @media(max-width:860px){.home-comparacao-grid,.home-faq-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(estilo);

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

function toggleMenuMobile() {
    const menu = document.querySelector('.nav-menu');
    const menuLinha = document.querySelector('.header-menu-linha');

    if (menu) menu.classList.toggle('active');
    if (menuLinha) menuLinha.classList.toggle('menu-aberto');
}
