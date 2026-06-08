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

    abrirGeradorAutomaticamenteSeSolicitado();
});

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

window.addEventListener('scroll', () => {
    const btnContainer = document.querySelector('.floating-actions');
    const areaPrevia = document.getElementById('area-previa');

    if (!btnContainer || !areaPrevia) return;

    if (window.scrollY > 300 || areaPrevia.style.display === 'block') {
        btnContainer.classList.add('show');
    } else {
        btnContainer.classList.remove('show');
    }
});

// ==================== EMPRESA / PERFIL DO USUÁRIO ====================

async function carregarDadosEmpresaLogada() {
    if (!window._supabase) {
        console.error('Supabase não iniciado.');
        return null;
    }

    const { data: { session }, error: sessionError } =
        await _supabase.auth.getSession();

    if (sessionError) {
        console.error('Erro ao buscar sessão:', sessionError);
        return null;
    }

    if (!session) {
        return null;
    }

    const { data: perfil, error } = await _supabase
        .from('perfis')
        .select('nome, nome_empresa, telefone_empresa, endereco_empresa, cnpj_empresa, foto_url, plano')
        .eq('id', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        alert('Erro ao carregar os dados da empresa.');
        return null;
    }

    if (!perfil) {
        alert('Complete seus dados no Painel de Controle antes de gerar orçamentos.');
        window.location.href = '/painel.html';
        return null;
    }

    dadosEmpresaLogada = {
        nome: perfil.nome || '',
        nome_empresa: perfil.nome_empresa || '',
        telefone_empresa: perfil.telefone_empresa || '',
        endereco_empresa: perfil.endereco_empresa || '',
        cnpj_empresa: perfil.cnpj_empresa || '',
        foto_url: perfil.foto_url || '',
        plano: perfil.plano || 'gratis'
    };

    localStorage.setItem('usuario_plano', dadosEmpresaLogada.plano);
    localStorage.setItem(
        'usuario_nome',
        dadosEmpresaLogada.nome ||
        dadosEmpresaLogada.nome_empresa ||
        session.user.email.split('@')[0]
    );

    localStorage.setItem('nome_empresa', dadosEmpresaLogada.nome_empresa || '');
    localStorage.setItem('telefone_empresa', dadosEmpresaLogada.telefone_empresa || '');
    localStorage.setItem('endereco_empresa', dadosEmpresaLogada.endereco_empresa || '');
    localStorage.setItem('cnpj_empresa', dadosEmpresaLogada.cnpj_empresa || '');
    localStorage.setItem('foto_url', dadosEmpresaLogada.foto_url || '');

    if (typeof fsPreencherTopoEmpresa === 'function') {
        fsPreencherTopoEmpresa(dadosEmpresaLogada);
    }

    return dadosEmpresaLogada;
}

function empresaEstaCompleta(empresa) {
    return (
        empresa &&
        empresa.nome_empresa &&
        empresa.telefone_empresa
    );
}

function usuarioPodeSalvarOrcamentoLocal() {
    if (typeof usuarioPodeSalvarOrcamento === 'function') {
        return usuarioPodeSalvarOrcamento();
    }

    const plano = String(localStorage.getItem('usuario_plano') || 'gratis')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return plano === 'basico' || plano === 'premium';
}

// ==================== HELPERS DE TEXTO / NÚMEROS ====================

function escaparHtml(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function textoComQuebra(valor) {
    return escaparHtml(valor).replace(/\n/g, '<br>');
}

function valorMonetarioParaNumero(valor) {
    const textoOriginal = String(valor ?? '').trim();

    if (!textoOriginal) return 0;

    let texto = textoOriginal
        .replace(/R\$/gi, '')
        .replace(/\s/g, '')
        .trim();

    if (!texto) return 0;

    if (texto.includes(',')) {
        texto = texto
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');

        return Number.parseFloat(texto) || 0;
    }

    texto = texto.replace(/[^\d.-]/g, '');

    return Number.parseFloat(texto) || 0;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatarMoedaComSimbolo(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function obterValorCampoMoeda(campo) {
    if (!campo) return 0;

    if (
        campo.dataset &&
        campo.dataset.valorNumerico !== undefined &&
        campo.dataset.valorNumerico !== ''
    ) {
        return Number(campo.dataset.valorNumerico) || 0;
    }

    return valorMonetarioParaNumero(campo.value);
}

function aplicarValorMoedaNoCampo(campo, valor) {
    if (!campo) return;

    const numero = valorMonetarioParaNumero(valor);

    campo.dataset.valorNumerico = String(numero);
    campo.value = formatarMoedaComSimbolo(numero);
}

function formatarCampoMoedaEmTempoReal(campo) {
    if (!campo) return;

    const somenteDigitos = String(campo.value || '').replace(/\D/g, '');
    const numero = somenteDigitos ? Number(somenteDigitos) / 100 : 0;

    campo.dataset.valorNumerico = String(numero);
    campo.value = formatarMoedaComSimbolo(numero);

    calcular();
}

function prepararCampoMoedaAoFocar(campo) {
    if (!campo) return;

    if (!campo.value || valorMonetarioParaNumero(campo.value) === 0) {
        campo.value = '';
        campo.dataset.valorNumerico = '0';
    }
}

function finalizarCampoMoeda(campo) {
    if (!campo) return;

    const numero = obterValorCampoMoeda(campo);

    campo.dataset.valorNumerico = String(numero);
    campo.value = formatarMoedaComSimbolo(numero);

    calcular();
}

function limparTelefone(telefone) {
    return String(telefone || '').replace(/\D/g, '');
}

function montarLinkOrcamento(id) {
    return `${window.location.origin}/ver.html?id=${id}`;
}

function obterConsultorSelecionado(empresa) {
    return (
        localStorage.getItem('responsavel_selecionado_nome') ||
        localStorage.getItem('consultor_selecionado_nome') ||
        localStorage.getItem('usuario_nome') ||
        empresa?.nome ||
        empresa?.nome_empresa ||
        'Consultor'
    );
}

function obterTemaAtual() {
    return document.getElementById('selected-theme')?.value || 'original';
}

function obterValorCampoTexto(id) {
    return document.getElementById(id)?.value?.trim() || '';
}

// ==================== CAMPOS EXTRAS E ITENS ====================

function adicionarCampoExtra(containerId, label = '', valor = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'extra-field';

    div.innerHTML = `
        <input type="text" placeholder="Ex: CPF/Placa" value="${escaparHtml(label)}" oninput="salvarEstadoCompleto(); autoUpdatePreview()">
        <input type="text" placeholder="Dados" value="${escaparHtml(valor)}" oninput="salvarEstadoCompleto(); autoUpdatePreview()">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove(); salvarEstadoCompleto(); autoUpdatePreview()">X</button>
    `;

    container.appendChild(div);
}

function adicionarLinha(desc = '', qtd = 1, valor = 0) {
    const lista = document.getElementById('itens-lista');
    if (!lista) return;

    const div = document.createElement('div');
    div.className = 'item-row';

    const valorNumerico = valorMonetarioParaNumero(valor);
    const valorFormatado = formatarMoedaComSimbolo(valorNumerico);

    div.innerHTML = `
        <input type="text" class="desc desc-cell" placeholder="Serviço/Produto" value="${escaparHtml(desc)}" oninput="calcular()">
        <input type="number" class="qtd" value="${escaparHtml(qtd)}" min="0" step="1" oninput="calcular()">
        <input type="text" class="valor campo-moeda" inputmode="numeric" placeholder="R$ 0,00" value="${escaparHtml(valorFormatado)}" data-valor-numerico="${escaparHtml(valorNumerico)}" onfocus="prepararCampoMoedaAoFocar(this)" oninput="formatarCampoMoedaEmTempoReal(this)" onblur="finalizarCampoMoeda(this)">
        <input type="text" class="subtotal campo-moeda" value="R$ 0,00" readonly>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove(); calcular()">X</button>
    `;

    lista.appendChild(div);
    calcular();
}

function calcular() {
    let totalGeral = 0;

    document.querySelectorAll('.item-row:not(.header-labels)').forEach(row => {
        const qtd = Number(row.querySelector('.qtd')?.value) || 0;
        const valorEl = row.querySelector('.valor');
        const valor = obterValorCampoMoeda(valorEl);
        const subtotal = qtd * valor;

        if (valorEl && valorEl.value && !valorEl.value.includes('R$')) {
            aplicarValorMoedaNoCampo(valorEl, valor);
        }

        const subtotalEl = row.querySelector('.subtotal');

        if (subtotalEl) {
            subtotalEl.value = formatarMoedaComSimbolo(subtotal);
        }

        totalGeral += subtotal;
    });

    const totalEl = document.getElementById('total-geral');

    if (totalEl) {
        totalEl.innerText = formatarMoeda(totalGeral);
    }

    salvarEstadoCompleto();
}

function coletarItensDoOrcamento() {
    const linhas = document.querySelectorAll('.item-row:not(.header-labels)');
    const itens = [];

    linhas.forEach(row => {
        const descricao =
            row.querySelector('.desc-cell')?.value ||
            row.querySelector('.desc')?.value ||
            '';

        const qtd = Number(row.querySelector('.qtd')?.value) || 0;
        const valor = obterValorCampoMoeda(row.querySelector('.valor'));
        const subtotal = qtd * valor;

        if (descricao.trim()) {
            itens.push({
                descricao,
                qtd,
                valor,
                subtotal
            });
        }
    });

    return itens;
}

// ==================== TEMA E CORES ====================

function setTheme(tema) {
    const selectedThemeEl = document.getElementById('selected-theme');
    if (!selectedThemeEl) return;

    selectedThemeEl.value = tema;

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.style.border = '2px solid #fff';
    });

    const dotAtivo = document.querySelector('.' + tema);

    if (dotAtivo) {
        dotAtivo.style.border = '2px solid #ffc400';
    }

    salvarEstadoCompleto();
    autoUpdatePreview();
}

function obterCoresTema(temaAtivo) {
    const coresTema = {
        original: {
            primaria: '#3e2723',
            destaque: '#ffc400',
            fundo: '#efebe9',
            textoHeader: '#ffffff'
        },
        yellow: {
            primaria: '#f9a825',
            destaque: '#ffc400',
            fundo: '#fff8e1',
            textoHeader: '#ffffff'
        },
        red: {
            primaria: '#4a0000',
            destaque: '#ff0000',
            fundo: '#ffebee',
            textoHeader: '#ffffff'
        },
        bw: {
            primaria: '#ffffff',
            destaque: '#000000',
            fundo: '#f9f9f9',
            textoHeader: '#000000'
        },
        blue: {
            primaria: '#0056b3',
            destaque: '#00aaff',
            fundo: '#e3f2fd',
            textoHeader: '#ffffff'
        },
        green: {
            primaria: '#2e7d32',
            destaque: '#81c784',
            fundo: '#e8f5e9',
            textoHeader: '#ffffff'
        }
    };

    return coresTema[temaAtivo] || coresTema.original;
}

// ==================== EXTRAS DO CLIENTE ====================

function montarExtrasClienteHtml() {
    const extraClienteContainer = document.getElementById('extra-cliente-container');

    if (!extraClienteContainer) return '';

    const extras = Array.from(extraClienteContainer.querySelectorAll('.extra-field')).map(f => {
        const inputs = f.querySelectorAll('input');

        return {
            label: inputs[0]?.value || '',
            valor: inputs[1]?.value || ''
        };
    }).filter(extra => extra.label || extra.valor);

    if (!extras.length) return '';

    return extras.map(extra => {
        return `<br>${escaparHtml(extra.label)}: ${escaparHtml(extra.valor)}`;
    }).join('');
}

// ==================== GERAÇÃO DA PRÉVIA ====================

async function gerarPrevia() {
    const btn = document.getElementById('btn-previa');

    if (btn) {
        btn.innerText = 'PROCESSANDO...';
        btn.disabled = true;
    }

    try {
        const empresa =
            dadosEmpresaLogada || await carregarDadosEmpresaLogada();

        if (!empresaEstaCompleta(empresa)) {
            alert('Preencha os dados da empresa no Painel de Controle antes de gerar o orçamento.');
            window.location.href = '/painel.html';
            return;
        }

        const titulo =
            document.getElementById('titulo')?.value || 'ORÇAMENTO';

        const cliente =
            document.getElementById('cliente')?.value || '';

        const telCliente =
            document.getElementById('tel-cliente')?.value || '';

        const observacoes =
            document.getElementById('observacoes')?.value || '';

        const validade =
            obterValorCampoTexto('validade-orcamento') ||
            obterValorCampoTexto('validade') ||
            '';

        const formaPagamento =
            obterValorCampoTexto('forma-pagamento') ||
            obterValorCampoTexto('pagamento') ||
            '';

        if (!cliente.trim()) {
            alert('Informe o nome do cliente.');
            return;
        }

        const itens = coletarItensDoOrcamento();

        if (!itens.length) {
            alert('Adicione pelo menos um item ao orçamento.');
            return;
        }

        const temaAtivo = obterTemaAtual();
        const cor = obterCoresTema(temaAtivo);

        let linhasHtml = '';

        itens.forEach((item, i) => {
            linhasHtml += `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}; border-bottom:1px solid #eee;">
                    <td style="padding:10px; font-size:12px;">${escaparHtml(item.descricao)}</td>
                    <td style="padding:10px; text-align:center; font-size:12px;">${escaparHtml(item.qtd)}</td>
                    <td style="padding:10px; font-size:12px;">R$ ${formatarMoeda(item.valor)}</td>
                    <td style="padding:10px; text-align:right; font-weight:bold; font-size:12px;">R$ ${formatarMoeda(item.subtotal)}</td>
                </tr>
            `;
        });

        const consultorSelecionado = obterConsultorSelecionado(empresa);
        const numeroFormatado = formatarNumeroOrcamento(numeroOrcamentoAtual || window.numeroOrcamentoAtual);

        const logoHtml = empresa.foto_url
            ? `<img src="${escaparHtml(empresa.foto_url)}" crossorigin="anonymous" style="max-height:58px; max-width:135px; object-fit:contain;">`
            : `<b style="font-size:20px;">FS</b>`;

        const dadosEmpresaHtml = `
            <div style="font-size:12px; line-height:1.5;">
                <b>${escaparHtml(empresa.nome_empresa || empresa.nome || 'Empresa')}</b><br>
                ${consultorSelecionado ? `Responsável: ${escaparHtml(consultorSelecionado)}<br>` : ''}
                ${empresa.telefone_empresa ? `WhatsApp: ${escaparHtml(empresa.telefone_empresa)}<br>` : ''}
                ${empresa.endereco_empresa ? `Endereço: ${escaparHtml(empresa.endereco_empresa)}<br>` : ''}
                ${empresa.cnpj_empresa ? `CNPJ/CPF: ${escaparHtml(empresa.cnpj_empresa)}` : ''}
            </div>
        `;

        const extrasClienteHtml = montarExtrasClienteHtml();
        const totalTexto = document.getElementById('total-geral')?.innerText || '0,00';

        const validadeHtml = validade
            ? `<div style="background:#fff; border-left:4px solid ${cor.destaque}; padding:10px; border-radius:6px; font-size:11px;">
                    <b>VALIDADE:</b><br>${escaparHtml(validade)}
               </div>`
            : '';

        const pagamentoHtml = formaPagamento
            ? `<div style="background:#fff; border-left:4px solid ${cor.destaque}; padding:10px; border-radius:6px; font-size:11px;">
                    <b>FORMA DE PAGAMENTO:</b><br>${escaparHtml(formaPagamento)}
               </div>`
            : '';

        const template = `
            <div class="pdf-documento-a4" style="width:794px; min-height:1123px; box-sizing:border-box; padding:30px; background:#ffffff; font-family:Arial, sans-serif; color:#333; display:flex; flex-direction:column;">
                
                <div style="border-bottom:3px solid ${cor.destaque}; background:${cor.primaria}; padding:20px; margin:-30px -30px 20px -30px; color:${cor.textoHeader}; display:flex; justify-content:space-between; align-items:center; border:${temaAtivo === 'bw' ? '1px solid #ddd' : 'none'}">
                    <div>
                        <h1 style="margin:0; font-size:22px;">${escaparHtml(titulo)}</h1>
                        <span style="font-size:11px; opacity:0.85;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</span><br>
                        <span style="font-size:11px; opacity:0.95;">Orçamento Nº ${escaparHtml(numeroFormatado)}</span>
                    </div>
                    ${logoHtml}
                </div>

                <div style="flex-grow:1;">
                    <div style="display:flex; justify-content:space-between; gap:25px; margin-bottom:20px;">
                        <div style="width:50%;">
                            <b style="font-size:13px;">EMISSOR:</b><br>
                            ${dadosEmpresaHtml}
                        </div>

                        <div style="width:50%; text-align:right; font-size:12px; line-height:1.5;">
                            <b style="font-size:13px;">CLIENTE:</b><br>
                            ${escaparHtml(cliente)}<br>
                            ${escaparHtml(telCliente)}
                            ${extrasClienteHtml}
                        </div>
                    </div>

                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:${temaAtivo === 'bw' ? '#eee' : cor.primaria}; color:${temaAtivo === 'bw' ? '#000' : '#fff'};">
                                <th style="padding:10px; text-align:left; font-size:12px;">Item</th>
                                <th style="padding:10px; font-size:12px;">Qtd</th>
                                <th style="padding:10px; text-align:left; font-size:12px;">Unit.</th>
                                <th style="padding:10px; text-align:right; font-size:12px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasHtml}
                        </tbody>
                    </table>

                    <div style="margin-top:20px; text-align:right;">
                        <div style="display:inline-block; background:${cor.fundo}; padding:15px; border:1px solid #ddd; border-radius:6px;">
                            <span style="font-size:10px; color:#666;">VALOR TOTAL</span><br>
                            <strong style="font-size:20px; color:${cor.destaque === '#000000' ? '#000' : cor.primaria}">
                                R$ ${escaparHtml(totalTexto)}
                            </strong>
                        </div>
                    </div>

                    ${
                        validadeHtml || pagamentoHtml
                            ? `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
                                ${validadeHtml}
                                ${pagamentoHtml}
                               </div>`
                            : ''
                    }

                    ${
                        observacoes
                            ? `<div style="margin-top:20px; font-size:11px; border-top:1px solid #eee; padding-top:10px;">
                                <b>OBSERVAÇÕES:</b><br>${textoComQuebra(observacoes)}
                               </div>`
                            : ''
                    }
                </div>

                <div style="margin-top:45px; padding-top:14px; border-top:1px dashed #ccc; display:flex; justify-content:space-between; align-items:flex-end; gap:20px;">
                    <div style="font-size:10px; color:#777; line-height:1.4;">
                        <b>${escaparHtml(empresa.nome_empresa || 'Empresa')}</b><br>
                        ${empresa.telefone_empresa ? `Contato: ${escaparHtml(empresa.telefone_empresa)}<br>` : ''}
                        Orçamento Nº ${escaparHtml(numeroFormatado)}
                    </div>

                    <div style="width:240px; text-align:center; font-size:10px; color:#777;">
                        <div style="border-top:1px solid #999; padding-top:6px;">
                            Assinatura / Aprovação
                        </div>
                    </div>
                </div>

                <div style="text-align:center; font-size:10px; color:#999; margin-top:18px;">
                    Orçamento gerado por <strong>fsorcamentos.com.br</strong>
                </div>
            </div>
        `;

        const conteudoPdf = document.getElementById('conteudo-pdf');
        const areaPrevia = document.getElementById('area-previa');
        const botoesAcao = document.getElementById('botoes-acao');

        if (conteudoPdf) {
            conteudoPdf.innerHTML = template;
            conteudoPdf.style.display = 'block';
            conteudoPdf.style.background = '#ffffff';
            conteudoPdf.style.overflow = 'visible';
        }

        if (areaPrevia) {
            areaPrevia.style.display = 'block';
        }

        if (botoesAcao) {
            botoesAcao.style.display = 'block';
        }

        const btnFloatBaixar = document.getElementById('btn-float-baixar');
        const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');
        const floatingActions = document.querySelector('.floating-actions');

        if (btnFloatBaixar) btnFloatBaixar.style.display = 'flex';
        if (btnFloatWhatsapp) btnFloatWhatsapp.style.display = 'flex';
        if (floatingActions) floatingActions.classList.add('show');

        if (areaPrevia) {
            window.scrollTo({
                top: areaPrevia.offsetTop - 20,
                behavior: 'smooth'
            });
        }

    } finally {
        if (btn) {
            btn.innerText = '👁️ PRÉ-VISUALIZAÇÃO';
            btn.disabled = false;
        }
    }
}

function autoUpdatePreview() {
    if (gerandoPdfAgora) return;

    const area = document.getElementById('area-previa');

    if (area && area.style.display === 'block') {
        gerarPrevia();
    }
}

// ==================== BAIXAR PDF CORRIGIDO ====================

function aguardarRenderizacaoPDF(container) {
    return new Promise(resolve => {
        const imagens = Array.from(container.querySelectorAll('img'));

        if (!imagens.length) {
            requestAnimationFrame(() => {
                setTimeout(resolve, 500);
            });
            return;
        }

        let finalizadas = 0;

        function finalizar() {
            finalizadas++;

            if (finalizadas >= imagens.length) {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 500);
                });
            }
        }

        imagens.forEach(img => {
            if (img.complete) {
                finalizar();
            } else {
                img.onload = finalizar;
                img.onerror = finalizar;
            }
        });
    });
}

function criarCloneParaPdf(elementoOriginal) {
    const wrapperExistente = document.getElementById('fs-pdf-render-area');

    if (wrapperExistente) {
        wrapperExistente.remove();
    }

    const wrapper = document.createElement('div');

    wrapper.id = 'fs-pdf-render-area';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '794px';
    wrapper.style.minHeight = '1123px';
    wrapper.style.background = '#ffffff';
    wrapper.style.zIndex = '-1';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'visible';
    wrapper.style.opacity = '0';

    const clone = elementoOriginal.cloneNode(true);

    clone.style.width = '794px';
    clone.style.maxWidth = '794px';
    clone.style.minHeight = '1123px';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.transform = 'none';
    clone.style.background = '#ffffff';
    clone.style.overflow = 'visible';

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    return {
        wrapper,
        clone
    };
}

async function baixarPDF() {
    if (gerandoPdfAgora) return;

    const conteudoPdf = document.getElementById('conteudo-pdf');
    const areaPrevia = document.getElementById('area-previa');

    if (!conteudoPdf) {
        alert('Área do PDF não encontrada.');
        return;
    }

    gerandoPdfAgora = true;

    try {
        if (usuarioPodeSalvarOrcamentoLocal()) {
            const salvo = await salvarOrcamentoNoBanco('download_pdf');

            if (salvo?.numero_orcamento) {
                numeroOrcamentoAtual = salvo.numero_orcamento;
                window.numeroOrcamentoAtual = salvo.numero_orcamento;
            }
        }

        await gerarPrevia();

        if (!conteudoPdf.innerHTML.trim()) {
            alert('Gere a pré-visualização antes de baixar o PDF.');
            return;
        }

        const elementoOriginal = conteudoPdf.firstElementChild || conteudoPdf;

        if (!elementoOriginal) {
            alert('Conteúdo do PDF não encontrado.');
            return;
        }

        const titulo = document.getElementById('titulo')?.value || 'orcamento';

        const nomeArquivo = titulo
            .trim()
            .replace(/[^\wÀ-ÿ\s-]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase() || 'orcamento';

        if (areaPrevia) {
            areaPrevia.style.display = 'block';
        }

        conteudoPdf.style.display = 'block';

        document.body.classList.add('gerando-pdf');

        let areaTemporaria = null;

        try {
            areaTemporaria = criarCloneParaPdf(elementoOriginal);

            await aguardarRenderizacaoPDF(areaTemporaria.clone);

            const alturaConteudo = Math.max(
                1123,
                areaTemporaria.clone.scrollHeight,
                areaTemporaria.clone.offsetHeight
            );

            const opt = {
                margin: 0,
                filename: `${nomeArquivo}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: 0,
                    width: 794,
                    height: alturaConteudo,
                    windowWidth: 794,
                    windowHeight: alturaConteudo
                },
                jsPDF: {
                    unit: 'px',
                    format: [794, 1123],
                    orientation: 'portrait'
                },
                pagebreak: {
                    mode: ['avoid-all', 'css', 'legacy']
                }
            };

            await html2pdf()
                .set(opt)
                .from(areaTemporaria.clone)
                .save();

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o PDF.');
        } finally {
            if (areaTemporaria?.wrapper) {
                areaTemporaria.wrapper.remove();
            }

            document.body.classList.remove('gerando-pdf');
        }

    } finally {
        gerandoPdfAgora = false;
    }
}

// ==================== SALVAMENTO E ENVIO (WPP / BANCO) ====================

async function salvarOrcamentoNoBanco(origem = 'manual') {
    sincronizarReferenciaOrcamentoSalvo();

    if (!usuarioPodeSalvarOrcamentoLocal()) {
        console.log('Plano grátis: orçamento não será salvo no Supabase.');
        return null;
    }

    if (!window._supabase) {
        alert('Supabase não carregou. Atualize a página.');
        return null;
    }

    const { data: { session }, error: sessionError } =
        await _supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('Erro de sessão:', sessionError);
        alert('Sessão expirada.');
        window.location.href = '/index.html';
        return null;
    }

    const empresa =
        dadosEmpresaLogada || await carregarDadosEmpresaLogada();

    if (!empresaEstaCompleta(empresa)) {
        alert('Preencha os dados da empresa no Painel de Controle.');
        window.location.href = '/painel.html';
        return null;
    }

    const assunto =
        document.getElementById('titulo')?.value?.trim() || 'Orçamento sem título';

    const clienteNome =
        document.getElementById('cliente')?.value?.trim() || '';

    const clienteWhatsapp =
        document.getElementById('tel-cliente')?.value?.trim() || '';

    const observacoes =
        document.getElementById('observacoes')?.value?.trim() || '';

    const itens = coletarItensDoOrcamento();

    const total = itens.reduce((soma, item) => {
        return soma + Number(item.subtotal || 0);
    }, 0);

    if (!clienteNome) {
        alert('Informe o nome do cliente.');
        return null;
    }

    if (!itens.length) {
        alert('Adicione pelo menos um item ao orçamento.');
        return null;
    }

    const consultorSelecionado = obterConsultorSelecionado(empresa);
    const temaPdf = obterTemaAtual();

    const payloadBase = {
        usuario_id: session.user.id,
        assunto,
        cliente_nome: clienteNome,
        cliente_whatsapp: clienteWhatsapp,
        total,
        itens,
        status: 'pendente',
        consultor: consultorSelecionado
    };

    const payloadCompleto = {
        ...payloadBase,
        observacoes,
        tema_pdf: temaPdf,
        origem_salvamento: origem
    };

    let resposta;

    if (orcamentoAtualSalvoId) {
        resposta = await _supabase
            .from('orcamentos')
            .update(payloadCompleto)
            .eq('id', orcamentoAtualSalvoId)
            .eq('usuario_id', session.user.id)
            .select('*')
            .single();
    } else {
        resposta = await _supabase
            .from('orcamentos')
            .insert([payloadCompleto])
            .select('*')
            .single();
    }

    if (resposta.error) {
        const mensagemErro = String(resposta.error.message || '');

        if (
            mensagemErro.includes('origem_salvamento') ||
            mensagemErro.includes('tema_pdf') ||
            mensagemErro.includes('observacoes') ||
            mensagemErro.includes('consultor')
        ) {
            const payloadMinimo = {
                usuario_id: session.user.id,
                assunto,
                cliente_nome: clienteNome,
                cliente_whatsapp: clienteWhatsapp,
                total,
                itens,
                status: 'pendente'
            };

            if (orcamentoAtualSalvoId) {
                resposta = await _supabase
                    .from('orcamentos')
                    .update(payloadMinimo)
                    .eq('id', orcamentoAtualSalvoId)
                    .eq('usuario_id', session.user.id)
                    .select('*')
                    .single();
            } else {
                resposta = await _supabase
                    .from('orcamentos')
                    .insert([payloadMinimo])
                    .select('*')
                    .single();
            }
        }
    }

    if (resposta.error) {
        console.error('Erro ao salvar orçamento:', {
            code: resposta.error.code,
            message: resposta.error.message,
            details: resposta.error.details,
            hint: resposta.error.hint
        });

        alert('Erro ao salvar orçamento no Supabase.');
        return null;
    }

    definirOrcamentoAtualSalvo(
        resposta.data.id,
        resposta.data.numero_orcamento || null
    );

    if (resposta.data.numero_orcamento) {
        numeroOrcamentoAtual = resposta.data.numero_orcamento;
        window.numeroOrcamentoAtual = resposta.data.numero_orcamento;
    }

    console.log(`Orçamento salvo/atualizado no Supabase via ${origem}:`, resposta.data);

    return resposta.data;
}

async function enviarPorWhatsApp() {
    if (!usuarioPodeSalvarOrcamentoLocal()) {
        alert('Esta função está disponível apenas para o Plano Básico.');
        return;
    }

    const nomeCliente =
        document.getElementById('cliente')?.value?.trim() || '';

    const whatsCliente =
        limparTelefone(document.getElementById('tel-cliente')?.value || '');

    if (!nomeCliente) {
        alert('Informe o nome do cliente.');
        return;
    }

    if (!whatsCliente) {
        alert('Por favor, informe o WhatsApp do cliente.');
        return;
    }

    const itens = coletarItensDoOrcamento();

    if (!itens.length) {
        alert('Adicione pelo menos um item ao orçamento.');
        return;
    }

    const botoesWhatsapp = document.querySelectorAll('.btn-whatsapp, .btn-acao-whatsapp, .btn-float-whatsapp');

    botoesWhatsapp.forEach(btn => {
        btn.disabled = true;
        if (btn.innerText) btn.dataset.textoOriginal = btn.innerText;
        if (btn.innerText) btn.innerText = 'AGUARDE...';
    });

    try {
        const salvo = await salvarOrcamentoNoBanco('whatsapp_manual');

        if (!salvo?.id) {
            alert('Não foi possível gerar o link do orçamento.');
            return;
        }

        definirOrcamentoAtualSalvo(
            salvo.id,
            salvo.numero_orcamento || null
        );

        if (salvo.numero_orcamento) {
            numeroOrcamentoAtual = salvo.numero_orcamento;
            window.numeroOrcamentoAtual = salvo.numero_orcamento;
        }

        await gerarPrevia();

        const numeroComPais =
            whatsCliente.startsWith('55') ? whatsCliente : '55' + whatsCliente;

        const numeroFormatado = formatarNumeroOrcamento(salvo.numero_orcamento || numeroOrcamentoAtual);

        const mensagem =
`Olá${nomeCliente ? `, ${nomeCliente}` : ''}! Tudo bem?

Seu orçamento Nº ${numeroFormatado} está pronto para visualização.

Acesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:

${linkOrcamentoAtual}

Qualquer dúvida, estou à disposição.`;

        const urlWhatsapp =
            `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;

        const janela = window.open(urlWhatsapp, 'fsorcamentos_whatsapp');

        if (!janela) {
            alert('O navegador bloqueou a abertura do WhatsApp. Permita pop-ups para este site.');
            return;
        }

        janela.focus();

    } catch (error) {
        console.error('Erro ao enviar por WhatsApp:', error);
        alert('Não foi possível abrir o WhatsApp.');
    } finally {
        botoesWhatsapp.forEach(btn => {
            btn.disabled = false;

            if (btn.dataset.textoOriginal) {
                btn.innerText = btn.dataset.textoOriginal;
                delete btn.dataset.textoOriginal;
            }
        });
    }
}

// ==================== PERSISTÊNCIA LOCAL (AUTO-SAVE) ====================

function salvarEstadoCompleto() {
    const extraClienteContainer = document.getElementById('extra-cliente-container');

    const extraCliente = extraClienteContainer
        ? Array.from(extraClienteContainer.querySelectorAll('.extra-field')).map(f => ({
            label: f.querySelectorAll('input')[0]?.value || '',
            valor: f.querySelectorAll('input')[1]?.value || ''
        }))
        : [];

    const dados = {
        titulo: document.getElementById('titulo')?.value || '',
        cliente: document.getElementById('cliente')?.value || '',
        telCliente: document.getElementById('tel-cliente')?.value || '',
        extraCliente,
        observacoes: document.getElementById('observacoes')?.value || '',
        validade: document.getElementById('validade-orcamento')?.value || '',
        formaPagamento: document.getElementById('forma-pagamento')?.value || '',
        theme: document.getElementById('selected-theme')?.value || 'original',
        itens: Array.from(document.querySelectorAll('.item-row:not(.header-labels)')).map(row => ({
            desc: row.querySelector('.desc-cell')?.value || '',
            qtd: row.querySelector('.qtd')?.value || '1',
            valor: obterValorCampoMoeda(row.querySelector('.valor')) || 0
        }))
    };

    localStorage.setItem('fs_backup', JSON.stringify(dados));
}

function carregarEstadoSalvo() {
    const salvo = localStorage.getItem('fs_backup');

    if (!salvo) {
        adicionarLinha();
        return;
    }

    let d = {};

    try {
        d = JSON.parse(salvo);
    } catch (err) {
        console.warn('Backup local inválido. Limpando backup.', err);
        localStorage.removeItem('fs_backup');
        adicionarLinha();
        return;
    }

    if (document.getElementById('titulo')) {
        document.getElementById('titulo').value = d.titulo || '';
    }

    if (document.getElementById('cliente')) {
        document.getElementById('cliente').value = d.cliente || '';
    }

    if (document.getElementById('tel-cliente')) {
        document.getElementById('tel-cliente').value = d.telCliente || '';
    }

    if (document.getElementById('observacoes')) {
        document.getElementById('observacoes').value = d.observacoes || '';
    }

    if (document.getElementById('validade-orcamento')) {
        document.getElementById('validade-orcamento').value = d.validade || '';
    }

    if (document.getElementById('forma-pagamento')) {
        document.getElementById('forma-pagamento').value = d.formaPagamento || '';
    }

    const extraClienteContainer = document.getElementById('extra-cliente-container');

    if (extraClienteContainer) {
        extraClienteContainer.innerHTML = '';

        if (d.extraCliente) {
            d.extraCliente.forEach(ex => {
                adicionarCampoExtra('extra-cliente-container', ex.label, ex.valor);
            });
        }
    }

    const contItens = document.getElementById('itens-lista');

    if (contItens) {
        while (contItens.children.length > 1) {
            contItens.removeChild(contItens.lastChild);
        }

        if (d.itens && d.itens.length > 0) {
            d.itens.forEach(item => {
                adicionarLinha(item.desc, item.qtd, item.valor);
            });
        } else {
            adicionarLinha();
        }
    }

    if (d.theme) {
        setTheme(d.theme);
    }
}

// ==================== HELPERS E MÁSCARAS ====================

function addFrase(frase) {
    const obs = document.getElementById('observacoes');

    if (obs) {
        obs.value += (obs.value ? '\n' : '') + frase;
        salvarEstadoCompleto();
        autoUpdatePreview();
    }
}

function toggleFrases() {
    const corpo = document.getElementById('frases-corpo');
    const seta = document.getElementById('seta-frases');

    if (!corpo) return;

    if (corpo.style.display === 'none' || corpo.style.display === '') {
        corpo.style.display = 'block';
        if (seta) seta.innerText = '▲';
    } else {
        corpo.style.display = 'none';
        if (seta) seta.innerText = '▼';
    }
}

function mascaraTelefone(event) {
    let v = event.target.value.replace(/\D/g, '');

    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 10) {
        v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 6) {
        v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
        v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }

    event.target.value = v;
}

function toggleAjuda() {
    const modal = document.getElementById('modal-ajuda');

    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
}

function limparFormulario() {
    if (!confirm('Isso apagará os dados do cliente e itens. Continuar?')) return;

    ['titulo', 'cliente', 'tel-cliente', 'observacoes', 'validade-orcamento', 'forma-pagamento'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const extraCliente = document.getElementById('extra-cliente-container');

    if (extraCliente) {
        extraCliente.innerHTML = '';
    }

    const contItens = document.getElementById('itens-lista');

    if (contItens) {
        while (contItens.children.length > 1) {
            contItens.removeChild(contItens.lastChild);
        }

        adicionarLinha();
    }

    const areaPrevia = document.getElementById('area-previa');

    if (areaPrevia) {
        areaPrevia.style.display = 'none';
    }

    const conteudoPdf = document.getElementById('conteudo-pdf');

    if (conteudoPdf) {
        conteudoPdf.innerHTML = '';
    }

    const botoesAcao = document.getElementById('botoes-acao');

    if (botoesAcao) {
        botoesAcao.style.display = 'none';
    }

    const btnFloatBaixar = document.getElementById('btn-float-baixar');
    const btnFloatWhatsapp = document.getElementById('btn-float-whatsapp');

    if (btnFloatBaixar) {
        btnFloatBaixar.style.display = 'none';
    }

    if (btnFloatWhatsapp) {
        btnFloatWhatsapp.style.display = 'none';
    }

    limparReferenciaOrcamentoAtual();
    salvarEstadoCompleto();
}

// ==================== FUNÇÕES LEGADAS DE LOGO ====================

function processarLogo() {
    console.warn('processarLogo() não é mais usada. A logo agora vem do Painel de Controle.');
}

function removerLogo() {
    console.warn('removerLogo() não é mais usada. A logo agora vem do Painel de Controle.');
}

// ==================== EXPORTS GLOBAIS ====================

window.definirOrcamentoAtualSalvo = definirOrcamentoAtualSalvo;
window.limparReferenciaOrcamentoAtual = limparReferenciaOrcamentoAtual;
window.sincronizarReferenciaOrcamentoSalvo = sincronizarReferenciaOrcamentoSalvo;

window.abrirModalGerador = abrirModalGerador;
window.fecharModalGerador = fecharModalGerador;

window.carregarDadosEmpresaLogada = carregarDadosEmpresaLogada;
window.empresaEstaCompleta = empresaEstaCompleta;
window.usuarioPodeSalvarOrcamentoLocal = usuarioPodeSalvarOrcamentoLocal;

window.adicionarCampoExtra = adicionarCampoExtra;
window.adicionarLinha = adicionarLinha;
window.calcular = calcular;

window.setTheme = setTheme;
window.gerarPrevia = gerarPrevia;
window.baixarPDF = baixarPDF;
window.salvarOrcamentoNoBanco = salvarOrcamentoNoBanco;
window.enviarPorWhatsApp = enviarPorWhatsApp;

window.salvarEstadoCompleto = salvarEstadoCompleto;
window.carregarEstadoSalvo = carregarEstadoSalvo;

window.addFrase = addFrase;
window.toggleFrases = toggleFrases;
window.mascaraTelefone = mascaraTelefone;
window.toggleAjuda = toggleAjuda;
window.limparFormulario = limparFormulario;
// ==================== BUSCA COM ENTER (GLOBAL) ====================
// Permite usar Enter em campos de busca/filtro como atalho para o botão físico de busca da página.
document.addEventListener('keydown', function fsBuscaEnterGlobal(event) {
  const campo = event.target;
  if (!campo || event.key !== 'Enter') return;

  const tag = (campo.tagName || '').toLowerCase();
  const tipo = (campo.getAttribute('type') || '').toLowerCase();
  const idClasse = `${campo.id || ''} ${campo.className || ''}`.toLowerCase();

  const pareceBusca =
    tipo === 'search' ||
    idClasse.includes('busca') ||
    idClasse.includes('filtro') ||
    (campo.placeholder || '').toLowerCase().includes('buscar');

  if (tag !== 'input' || !pareceBusca) return;

  const form = campo.closest('form');
  if (form) event.preventDefault();

  const escopo = campo.closest('.ordens-card-body, .clientes-card-body, .veiculos-card-body, .estoque-card-body, .modal-busca-cliente-body, .modal-busca-produto-body, main, body') || document;
  const botoes = Array.from(escopo.querySelectorAll('button, a'));
  const botaoBusca = botoes.find((botao) => {
    const texto = (botao.textContent || '').trim().toLowerCase();
    return texto.includes('buscar') || texto.includes('filtrar') || texto.includes('atualizar');
  });

  if (botaoBusca && typeof botaoBusca.click === 'function') {
    botaoBusca.click();
  }
});
