// ==================== VARIÁVEIS GLOBAIS DE UI ====================

let currentSlide = 0;
let dadosEmpresaLogada = null;
let orcamentoAtualSalvoId = window.orcamentoAtualSalvoId || null;
let linkOrcamentoAtual = null;

// ==================== HELPERS DE CONTROLE DO ORÇAMENTO SALVO ====================

function definirOrcamentoAtualSalvo(id) {
    if (!id) return;

    orcamentoAtualSalvoId = id;
    window.orcamentoAtualSalvoId = id;
    window.orcamentoSalvoAtualId = id;

    linkOrcamentoAtual = montarLinkOrcamento(id);
    window.linkOrcamentoAtual = linkOrcamentoAtual;
}

function limparReferenciaOrcamentoAtual() {
    orcamentoAtualSalvoId = null;
    linkOrcamentoAtual = null;

    window.orcamentoAtualSalvoId = null;
    window.orcamentoSalvoAtualId = null;
    window.linkOrcamentoAtual = null;
}

function sincronizarReferenciaOrcamentoSalvo() {
    if (!orcamentoAtualSalvoId && window.orcamentoAtualSalvoId) {
        orcamentoAtualSalvoId = window.orcamentoAtualSalvoId;
    }

    if (!orcamentoAtualSalvoId && window.orcamentoSalvoAtualId) {
        orcamentoAtualSalvoId = window.orcamentoSalvoAtualId;
    }

    if (orcamentoAtualSalvoId) {
        linkOrcamentoAtual = montarLinkOrcamento(orcamentoAtualSalvoId);
        window.linkOrcamentoAtual = linkOrcamentoAtual;
    }
}

// ==================== INICIALIZAÇÃO DA INTERFACE ====================

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hide-splash');
    }, 1500);

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
            if (menu) menu.classList.remove('active');
        });
    });

    if (document.getElementById('itens-lista')) {
        await carregarDadosEmpresaLogada();
        carregarEstadoSalvo();
    }
});

// ==================== MENU E SCROLL ====================

function toggleMenuMobile() {
    const menu = document.querySelector('.nav-menu');
    if (menu) menu.classList.toggle('active');
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
        const descricao = row.querySelector('.desc-cell')?.value || '';
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
        original: { primaria: '#3e2723', destaque: '#ffc400', fundo: '#efebe9', textoHeader: '#ffffff' },
        yellow: { primaria: '#f9a825', destaque: '#ffc400', fundo: '#fff8e1', textoHeader: '#ffffff' },
        red: { primaria: '#4a0000', destaque: '#ff0000', fundo: '#ffebee', textoHeader: '#ffffff' },
        bw: { primaria: '#ffffff', destaque: '#000000', fundo: '#f9f9f9', textoHeader: '#000000' },
        blue: { primaria: '#0056b3', destaque: '#00aaff', fundo: '#e3f2fd', textoHeader: '#ffffff' },
        green: { primaria: '#2e7d32', destaque: '#81c784', fundo: '#e8f5e9', textoHeader: '#ffffff' }
    };

    return coresTema[temaAtivo] || coresTema.original;
}

// ==================== GERAÇÃO DO PDF ====================

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

        if (!cliente.trim()) {
            alert('Informe o nome do cliente.');
            return;
        }

        const temaAtivo = obterTemaAtual();
        const cor = obterCoresTema(temaAtivo);

        let linhasHtml = '';

        document.querySelectorAll('.item-row:not(.header-labels)').forEach((row, i) => {
            const d = row.querySelector('.desc-cell')?.value || '-';
            const q = row.querySelector('.qtd')?.value || '0';
            const v = obterValorCampoMoeda(row.querySelector('.valor')) || 0;
            const s = row.querySelector('.subtotal')?.value || 'R$ 0,00';

            linhasHtml += `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}; border-bottom:1px solid #eee;">
                    <td style="padding:10px; font-size:12px;">${escaparHtml(d)}</td>
                    <td style="padding:10px; text-align:center; font-size:12px;">${escaparHtml(q)}</td>
                    <td style="padding:10px; font-size:12px;">R$ ${formatarMoeda(v)}</td>
                    <td style="padding:10px; text-align:right; font-weight:bold; font-size:12px;">${escaparHtml(s)}</td>
                </tr>
            `;
        });

        if (!linhasHtml) {
            alert('Adicione pelo menos um item ao orçamento.');
            return;
        }

        const consultorSelecionado = obterConsultorSelecionado(empresa);

        const logoHtml = empresa.foto_url
            ? `<img src="${escaparHtml(empresa.foto_url)}" crossorigin="anonymous" style="max-height:55px; max-width:130px; object-fit:contain;">`
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

        const template = `
            <div style="width:794px; min-height:1123px; box-sizing:border-box; padding:30px; background:#ffffff; font-family:Arial, sans-serif; color:#333; display:flex; flex-direction:column;">
                
                <div style="border-bottom:3px solid ${cor.destaque}; background:${cor.primaria}; padding:20px; margin:-30px -30px 20px -30px; color:${cor.textoHeader}; display:flex; justify-content:space-between; align-items:center; border:${temaAtivo === 'bw' ? '1px solid #ddd' : 'none'}">
                    <div>
                        <h1 style="margin:0; font-size:22px;">${escaparHtml(titulo)}</h1>
                        <span style="font-size:11px; opacity:0.8;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</span>
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
                        <div style="display:inline-block; background:${cor.fundo}; padding:15px; border:1px solid #ddd; border-radius:4px;">
                            <span style="font-size:10px; color:#666;">VALOR TOTAL</span><br>
                            <strong style="font-size:18px; color:${cor.destaque === '#000000' ? '#000' : cor.primaria}">
                                R$ ${escaparHtml(document.getElementById('total-geral')?.innerText || '0,00')}
                            </strong>
                        </div>
                    </div>

                    ${
                        observacoes
                            ? `<div style="margin-top:20px; font-size:11px; border-top:1px solid #eee; padding-top:10px;">
                                <b>OBSERVAÇÕES:</b><br>${textoComQuebra(observacoes)}
                               </div>`
                            : ''
                    }
                </div>

                <div style="text-align:center; font-size:10px; color:#999; margin-top:30px; border-top:1px dashed #ccc; padding-top:10px;">
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

        if (btnFloatBaixar) {
            btnFloatBaixar.style.display = 'flex';
        }

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

function autoUpdatePreview() {
    const area = document.getElementById('area-previa');

    if (area && area.style.display === 'block') {
        gerarPrevia();
    }
}

function aguardarRenderizacaoPDF(container) {
    return new Promise(resolve => {
        const imagens = Array.from(container.querySelectorAll('img'));

        if (!imagens.length) {
            setTimeout(resolve, 400);
            return;
        }

        let carregadas = 0;

        function finalizarImagem() {
            carregadas++;

            if (carregadas >= imagens.length) {
                setTimeout(resolve, 400);
            }
        }

        imagens.forEach(img => {
            if (img.complete) {
                finalizarImagem();
            } else {
                img.onload = finalizarImagem;
                img.onerror = finalizarImagem;
            }
        });
    });
}

async function baixarPDF() {
    const elementOriginal = document.getElementById('conteudo-pdf');

    if (!elementOriginal) {
        alert('Área do PDF não encontrada.');
        return;
    }

    if (!elementOriginal.innerHTML.trim()) {
        await gerarPrevia();
    }

    if (!elementOriginal.innerHTML.trim()) {
        alert('Gere a pré-visualização antes de baixar o PDF.');
        return;
    }

    if (usuarioPodeSalvarOrcamentoLocal()) {
        await salvarOrcamentoNoBanco('download_pdf');
    }

    const titulo = document.getElementById('titulo')?.value || 'orcamento';

    const nomeArquivo = titulo
        .trim()
        .replace(/[^\wÀ-ÿ\s-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase() || 'orcamento';

    const cloneWrapper = document.createElement('div');

    cloneWrapper.id = 'pdf-clone-wrapper';
    cloneWrapper.style.position = 'fixed';
    cloneWrapper.style.left = '-9999px';
    cloneWrapper.style.top = '0';
    cloneWrapper.style.width = '794px';
    cloneWrapper.style.minHeight = '1123px';
    cloneWrapper.style.background = '#ffffff';
    cloneWrapper.style.zIndex = '-1';
    cloneWrapper.style.opacity = '1';
    cloneWrapper.style.pointerEvents = 'none';
    cloneWrapper.style.display = 'block';
    cloneWrapper.style.overflow = 'visible';

    const clone = elementOriginal.cloneNode(true);

    clone.style.display = 'block';
    clone.style.width = '794px';
    clone.style.minHeight = '1123px';
    clone.style.background = '#ffffff';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.overflow = 'visible';

    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);

    await aguardarRenderizacaoPDF(cloneWrapper);

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
            windowWidth: 794,
            windowHeight: 1123
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

    try {
        await html2pdf()
            .set(opt)
            .from(clone)
            .save();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Não foi possível gerar o PDF.');
    } finally {
        cloneWrapper.remove();
    }
}

// ==================== SALVAMENTO E ENVIO (WPP / BANCO) ====================

async function salvarOrcamentoNoBanco(origem = 'manual') {
    sincronizarReferenciaOrcamentoSalvo();

    if (!usuarioPodeSalvarOrcamentoLocal()) {
        console.log('Plano grátis: orçamento não será salvo no Supabase.');
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
        consultor: consultorSelecionado,
        tema_pdf: temaPdf
    };

    const payloadCompleto = {
        ...payloadBase,
        origem_salvamento: origem
    };

    console.log('Payload orçamento:', payloadCompleto);

    let resposta;

    if (orcamentoAtualSalvoId) {
        resposta = await _supabase
            .from('orcamentos')
            .update(payloadCompleto)
            .eq('id', orcamentoAtualSalvoId)
            .eq('usuario_id', session.user.id)
            .select()
            .single();
    } else {
        resposta = await _supabase
            .from('orcamentos')
            .insert([payloadCompleto])
            .select()
            .single();
    }

    if (resposta.error) {
        const mensagemErro = String(resposta.error.message || '');

        if (
            mensagemErro.includes('origem_salvamento') ||
            mensagemErro.includes('tema_pdf')
        ) {
            const payloadMinimo = {
                usuario_id: session.user.id,
                assunto,
                cliente_nome: clienteNome,
                cliente_whatsapp: clienteWhatsapp,
                total,
                itens,
                status: 'pendente',
                consultor: consultorSelecionado
            };

            if (orcamentoAtualSalvoId) {
                resposta = await _supabase
                    .from('orcamentos')
                    .update(payloadMinimo)
                    .eq('id', orcamentoAtualSalvoId)
                    .eq('usuario_id', session.user.id)
                    .select()
                    .single();
            } else {
                resposta = await _supabase
                    .from('orcamentos')
                    .insert([payloadMinimo])
                    .select()
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

    definirOrcamentoAtualSalvo(resposta.data.id);

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

    const botaoWhatsapp = document.querySelector('.btn-whatsapp');

    if (botaoWhatsapp) {
        botaoWhatsapp.disabled = true;
        botaoWhatsapp.innerText = 'AGUARDE...';
    }

    try {
        const salvo = await salvarOrcamentoNoBanco('whatsapp_manual');

        if (!salvo?.id) {
            alert('Não foi possível gerar o link do orçamento.');
            return;
        }

        definirOrcamentoAtualSalvo(salvo.id);

        const numeroComPais =
            whatsCliente.startsWith('55') ? whatsCliente : '55' + whatsCliente;

        const mensagem =
`Olá${nomeCliente ? `, ${nomeCliente}` : ''}! Tudo bem?

Seu orçamento está pronto para visualização.

Acesse o link abaixo para conferir os detalhes e aprovar ou recusar a proposta:

${linkOrcamentoAtual}

Qualquer dúvida, estou à disposição.`;

        const urlWhatsapp =
            `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;

        window.open(urlWhatsapp, 'fsorcamentos_whatsapp');

    } catch (error) {
        console.error('Erro ao enviar por WhatsApp:', error);
        alert('Não foi possível abrir o WhatsApp.');
    } finally {
        if (botaoWhatsapp) {
            botaoWhatsapp.disabled = false;
            botaoWhatsapp.innerText = 'ENVIAR POR WHATSAPP';
        }
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

    ['titulo', 'cliente', 'tel-cliente', 'observacoes'].forEach(id => {
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

    if (btnFloatBaixar) {
        btnFloatBaixar.style.display = 'none';
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