/* =========================================================
   FS ORÇAMENTOS - ordem-extras.js
   Correções finais da página ordem.html:
   - até 5 fotos antes da OS;
   - assinatura desenhável em celular e computador;
   - salvamento no Supabase + fallback localStorage;
   - recuperação correta mesmo quando o banco ainda estiver sem dados;
   - botões auxiliares da OS com ação segura.
   ========================================================= */
(function () {
  'use strict';

  const MAX_FOTOS = 5;
  const MAX_DIMENSAO = 1280;
  const QUALIDADE = 0.72;

  let fotosAntesOS = [];
  let assinaturaDataURL = '';
  let assinaturaDesenhada = false;
  let canvasAssinatura = null;
  let ctxAssinatura = null;
  let desenhando = false;
  let ultimoPonto = null;
  let eventosCanvasInstalados = false;
  let salvamentoBancoDisponivel = null;

  function obterOrdemId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('ordem_id') || params.get('os_id') || localStorage.getItem('ultima_os_aberta_id') || '';
  }

  function storageKey() {
    return `fs_ordem_extras_${obterOrdemId()}`;
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function mostrarMensagem(texto, tipo = 'info') {
    if (typeof window.mostrarMensagemOrdem === 'function') {
      window.mostrarMensagemOrdem(texto, tipo);
      return;
    }

    const el = document.getElementById('mensagem-ordem');
    if (el) {
      el.className = `mensagem-ordem ${tipo}`;
      el.textContent = texto;
    }
  }

  function obterPayloadLocal() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function salvarPayloadLocal(payload) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(payload || {}));
      return true;
    } catch (erro) {
      console.error('Não foi possível salvar extras da OS no localStorage:', erro);
      return false;
    }
  }

  async function aguardarSupabase(tentativas = 30) {
    for (let i = 0; i < tentativas; i++) {
      if (window._supabase) return true;
      if (typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
        if (window._supabase) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return false;
  }

  async function obterUsuarioId() {
    try {
      await aguardarSupabase();
      if (!window._supabase) return null;
      const { data: { session } } = await window._supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (_) {
      return null;
    }
  }

  async function carregarExtrasSupabase() {
    const ordemId = obterOrdemId();
    const userId = await obterUsuarioId();

    if (!ordemId || !userId || !window._supabase) return null;

    try {
      const { data, error } = await window._supabase
        .from('ordens_servico')
        .select('fotos_antes, assinatura_cliente_data_url, assinatura_cliente_nome, assinatura_cliente_em')
        .eq('id', ordemId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        salvamentoBancoDisponivel = false;
        console.warn('Extras da OS sem colunas ou sem permissão no Supabase. Usando localStorage:', error);
        return null;
      }

      salvamentoBancoDisponivel = true;
      return data || null;
    } catch (erro) {
      salvamentoBancoDisponivel = false;
      console.warn('Erro ao carregar extras da OS:', erro);
      return null;
    }
  }

  async function salvarExtrasSupabase(payload) {
    const ordemId = obterOrdemId();
    const userId = await obterUsuarioId();

    if (!ordemId || !userId || !window._supabase) {
      salvamentoBancoDisponivel = false;
      return false;
    }

    try {
      const { error } = await window._supabase
        .from('ordens_servico')
        .update(payload)
        .eq('id', ordemId)
        .eq('user_id', userId);

      if (error) {
        salvamentoBancoDisponivel = false;
        console.warn('Não foi possível salvar extras no Supabase. Fallback localStorage:', error);
        return false;
      }

      salvamentoBancoDisponivel = true;
      return true;
    } catch (erro) {
      salvamentoBancoDisponivel = false;
      console.warn('Erro ao salvar extras no Supabase:', erro);
      return false;
    }
  }

  function normalizarFotos(lista) {
    if (!Array.isArray(lista)) return [];
    return lista
      .filter(foto => foto && (foto.dataUrl || foto.url))
      .map(foto => ({
        id: foto.id || uid(),
        nome: foto.nome || foto.name || 'foto.jpg',
        dataUrl: foto.dataUrl || foto.url,
        criado_em: foto.criado_em || foto.created_at || new Date().toISOString()
      }))
      .slice(0, MAX_FOTOS);
  }

  function mesclarDadosExtras(remoto, local) {
    const fotosRemotas = normalizarFotos(remoto?.fotos_antes);
    const fotosLocais = normalizarFotos(local?.fotos_antes);

    return {
      fotos_antes: fotosRemotas.length ? fotosRemotas : fotosLocais,
      assinatura_cliente_data_url: remoto?.assinatura_cliente_data_url || local?.assinatura_cliente_data_url || '',
      assinatura_cliente_nome: remoto?.assinatura_cliente_nome || local?.assinatura_cliente_nome || '',
      assinatura_cliente_em: remoto?.assinatura_cliente_em || local?.assinatura_cliente_em || null
    };
  }

  async function persistirFotos() {
    const local = obterPayloadLocal();
    local.fotos_antes = fotosAntesOS;
    salvarPayloadLocal(local);

    const salvoBanco = await salvarExtrasSupabase({ fotos_antes: fotosAntesOS });
    sincronizarOrdemAtualLocal({ fotos_antes: fotosAntesOS });
    return salvoBanco;
  }

  async function persistirAssinatura() {
    const nome = document.getElementById('assinatura-cliente-nome')?.value?.trim() || '';
    const agora = assinaturaDataURL ? new Date().toISOString() : null;

    const payload = {
      assinatura_cliente_data_url: assinaturaDataURL || null,
      assinatura_cliente_nome: nome || null,
      assinatura_cliente_em: agora
    };

    const local = obterPayloadLocal();
    Object.assign(local, payload);
    salvarPayloadLocal(local);

    const salvoBanco = await salvarExtrasSupabase(payload);
    sincronizarOrdemAtualLocal(payload);
    return salvoBanco;
  }

  function sincronizarOrdemAtualLocal(payload) {
    try {
      if (window.ordemAtual && typeof window.ordemAtual === 'object') {
        Object.assign(window.ordemAtual, payload);
      }
    } catch (_) {}
  }

  function prepararHTMLFotos() {
    const input = document.getElementById('input-foto-antes-os');
    if (input) {
      input.multiple = true;
      input.accept = 'image/*';
      input.removeAttribute('capture');
    }

    const status = document.getElementById('foto-antes-status');
    if (status && !document.getElementById('fotos-antes-galeria-os')) {
      const galeria = document.createElement('div');
      galeria.id = 'fotos-antes-galeria-os';
      galeria.className = 'fotos-antes-galeria-os';
      status.appendChild(galeria);
    }

    const small = input?.closest('.campo')?.querySelector('small');
    if (small) {
      small.textContent = 'É possível salvar até 5 fotos. As imagens serão otimizadas antes de salvar.';
    }
  }

  function injetarEstilo() {
    if (document.getElementById('fs-ordem-extras-style')) return;

    const style = document.createElement('style');
    style.id = 'fs-ordem-extras-style';
    style.textContent = `
      .fotos-antes-galeria-os{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;}
      .foto-antes-card-os{background:#fff;border:1px solid var(--fs-borda,#d7ccc8);border-radius:12px;overflow:hidden;color:var(--fs-marrom,#3e2723);}
      .foto-antes-card-os img{width:100%;height:125px;display:block;object-fit:cover;background:#fff;}
      .foto-antes-card-os div{padding:8px;display:grid;gap:6px;}
      .foto-antes-card-os span{font-size:12px;color:#6d5b52;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .foto-antes-card-os button{min-height:32px;border-radius:9px;border:1px solid #dc2626;background:#fff1f1;color:#991b1b;font-weight:900;cursor:pointer;}
      #canvas-assinatura-cliente{width:100%!important;height:220px!important;display:block;background:#fff;border:2px dashed #8d7a70;border-radius:12px;touch-action:none;cursor:crosshair;}
      .assinatura-canvas-wrap{touch-action:none;user-select:none;-webkit-user-select:none;}
      .assinatura-preview-img{background:#fff!important;}
      @media(max-width:640px){.fotos-antes-galeria-os{grid-template-columns:1fr;}.foto-antes-card-os img{height:160px;}#canvas-assinatura-cliente{height:260px!important;}}
    `;

    document.head.appendChild(style);
  }

  function renderizarFotos() {
    prepararHTMLFotos();

    const status = document.getElementById('foto-antes-status');
    const previewAntigo = document.getElementById('foto-antes-preview');
    const galeria = document.getElementById('fotos-antes-galeria-os');

    if (!status || !galeria) return;

    const strong = status.querySelector('strong');
    const span = status.querySelector('span');

    if (!fotosAntesOS.length) {
      if (strong) strong.textContent = 'Nenhuma foto salva';
      if (span) span.textContent = 'Envie até 5 fotos opcionais antes de iniciar o serviço.';
      if (previewAntigo) {
        previewAntigo.src = '';
        previewAntigo.style.display = 'none';
      }
      galeria.innerHTML = '';
      return;
    }

    if (strong) strong.textContent = `${fotosAntesOS.length} foto(s) salva(s)`;
    if (span) span.textContent = salvamentoBancoDisponivel === false
      ? 'Fotos mantidas neste aparelho. Rode o SQL de extras para salvar no banco.'
      : 'Registro visual antes da execução da OS.';

    if (previewAntigo) {
      previewAntigo.src = fotosAntesOS[0]?.dataUrl || '';
      previewAntigo.style.display = 'none';
    }

    galeria.innerHTML = fotosAntesOS.map((foto, index) => `
      <article class="foto-antes-card-os">
        <img src="${escapar(foto.dataUrl)}" alt="Foto antes do serviço ${index + 1}">
        <div>
          <span>${index + 1}. ${escapar(foto.nome || 'foto.jpg')}</span>
          <button type="button" onclick="removerFotoAntesOS(${index})">Remover esta foto</button>
        </div>
      </article>
    `).join('');
  }

  function carregarImagem(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Erro ao ler imagem.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
        img.onload = () => resolve(img);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function otimizarImagem(file) {
    const img = await carregarImagem(file);
    const escala = Math.min(1, MAX_DIMENSAO / Math.max(img.width, img.height));
    const largura = Math.max(1, Math.round(img.width * escala));
    const altura = Math.max(1, Math.round(img.height * escala));

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, 0, 0, largura, altura);

    return canvas.toDataURL('image/jpeg', QUALIDADE);
  }

  async function salvarFotoAntesOS() {
    const input = document.getElementById('input-foto-antes-os');
    const files = Array.from(input?.files || []);

    if (!files.length) {
      mostrarMensagem('Selecione pelo menos uma foto antes de salvar.', 'erro');
      return;
    }

    if (fotosAntesOS.length >= MAX_FOTOS) {
      mostrarMensagem('Esta OS já possui 5 fotos salvas. Remova uma foto para adicionar outra.', 'erro');
      return;
    }

    const vagas = MAX_FOTOS - fotosAntesOS.length;
    const selecionadas = files.slice(0, vagas);
    const btn = document.getElementById('btn-salvar-foto-antes');
    const textoOriginal = btn?.textContent || 'Salvar foto';

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Otimizando...';
      }

      for (const file of selecionadas) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await otimizarImagem(file);
        fotosAntesOS.push({
          id: uid(),
          nome: file.name || 'foto.jpg',
          dataUrl,
          criado_em: new Date().toISOString()
        });
      }

      fotosAntesOS = fotosAntesOS.slice(0, MAX_FOTOS);
      const salvoBanco = await persistirFotos();
      renderizarFotos();
      if (input) input.value = '';

      mostrarMensagem(
        salvoBanco
          ? 'Foto(s) salva(s) com sucesso no banco.'
          : 'Foto(s) salva(s) neste aparelho. Rode o SQL de extras para salvar definitivamente no Supabase.',
        salvoBanco ? 'sucesso' : 'info'
      );
    } catch (erro) {
      console.error('Erro ao salvar foto antes da OS:', erro);
      mostrarMensagem('Não foi possível salvar a foto. Tente outra imagem.', 'erro');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    }
  }

  async function removerFotoAntesOS(index) {
    const posicao = Number(index);
    if (!Number.isInteger(posicao) || posicao < 0 || posicao >= fotosAntesOS.length) return;

    fotosAntesOS.splice(posicao, 1);
    const salvoBanco = await persistirFotos();
    renderizarFotos();
    mostrarMensagem(salvoBanco ? 'Foto removida com sucesso.' : 'Foto removida neste aparelho.', salvoBanco ? 'sucesso' : 'info');
  }

  async function removerTodasFotosAntesOS() {
    if (!fotosAntesOS.length) {
      mostrarMensagem('Nenhuma foto salva para remover.', 'info');
      return;
    }

    const confirmar = confirm('Deseja remover todas as fotos antes do serviço desta OS?');
    if (!confirmar) return;

    fotosAntesOS = [];
    const salvoBanco = await persistirFotos();
    renderizarFotos();
    mostrarMensagem(salvoBanco ? 'Fotos removidas com sucesso.' : 'Fotos removidas neste aparelho.', salvoBanco ? 'sucesso' : 'info');
  }

  function prepararCanvasAssinatura() {
    canvasAssinatura = document.getElementById('canvas-assinatura-cliente');
    if (!canvasAssinatura) return;

    ctxAssinatura = canvasAssinatura.getContext('2d', { willReadFrequently: true });
    redimensionarCanvasAssinatura(false);

    if (eventosCanvasInstalados) return;
    eventosCanvasInstalados = true;

    const iniciar = (event) => {
      event.preventDefault();
      try { canvasAssinatura.setPointerCapture?.(event.pointerId); } catch (_) {}
      desenhando = true;
      assinaturaDesenhada = true;
      ultimoPonto = pontoCanvas(event);
      desenharPonto(ultimoPonto);
    };

    const mover = (event) => {
      if (!desenhando || !ctxAssinatura || !ultimoPonto) return;
      event.preventDefault();

      const ponto = pontoCanvas(event);
      ctxAssinatura.lineCap = 'round';
      ctxAssinatura.lineJoin = 'round';
      ctxAssinatura.strokeStyle = '#111111';
      ctxAssinatura.lineWidth = 3;
      ctxAssinatura.beginPath();
      ctxAssinatura.moveTo(ultimoPonto.x, ultimoPonto.y);
      ctxAssinatura.lineTo(ponto.x, ponto.y);
      ctxAssinatura.stroke();
      ultimoPonto = ponto;
    };

    const finalizar = (event) => {
      if (event) event.preventDefault();
      desenhando = false;
      ultimoPonto = null;
    };

    canvasAssinatura.addEventListener('pointerdown', iniciar, { passive: false });
    canvasAssinatura.addEventListener('pointermove', mover, { passive: false });
    canvasAssinatura.addEventListener('pointerup', finalizar, { passive: false });
    canvasAssinatura.addEventListener('pointercancel', finalizar, { passive: false });
    canvasAssinatura.addEventListener('pointerleave', finalizar, { passive: false });

    canvasAssinatura.addEventListener('touchstart', (event) => iniciar(event.touches[0] || event), { passive: false });
    canvasAssinatura.addEventListener('touchmove', (event) => mover(event.touches[0] || event), { passive: false });
    canvasAssinatura.addEventListener('touchend', finalizar, { passive: false });

    canvasAssinatura.addEventListener('mousedown', iniciar, { passive: false });
    canvasAssinatura.addEventListener('mousemove', mover, { passive: false });
    document.addEventListener('mouseup', finalizar, { passive: false });

    window.addEventListener('resize', () => redimensionarCanvasAssinatura(true));
  }

  function redimensionarCanvasAssinatura(preservar = true) {
    if (!canvasAssinatura) return;

    const antigo = preservar && !canvasVazioSeguro() ? canvasAssinatura.toDataURL('image/png') : '';
    const rect = canvasAssinatura.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const larguraCss = Math.max(rect.width || canvasAssinatura.clientWidth || 320, 300);
    const alturaCss = Math.max(rect.height || canvasAssinatura.clientHeight || 220, 180);

    canvasAssinatura.width = Math.round(larguraCss * ratio);
    canvasAssinatura.height = Math.round(alturaCss * ratio);

    ctxAssinatura = canvasAssinatura.getContext('2d', { willReadFrequently: true });
    ctxAssinatura.setTransform(ratio, 0, 0, ratio, 0, 0);
    limparCanvasAssinaturaInterno(larguraCss, alturaCss);

    if (antigo) desenharImagemNoCanvas(antigo);
    else if (assinaturaDataURL) desenharImagemNoCanvas(assinaturaDataURL);
  }

  function limparCanvasAssinaturaInterno(larguraCss, alturaCss) {
    if (!ctxAssinatura || !canvasAssinatura) return;
    const rect = canvasAssinatura.getBoundingClientRect();
    const largura = larguraCss || Math.max(rect.width || 320, 300);
    const altura = alturaCss || Math.max(rect.height || 220, 180);
    ctxAssinatura.fillStyle = '#ffffff';
    ctxAssinatura.fillRect(0, 0, largura, altura);
  }

  function desenharImagemNoCanvas(src) {
    if (!src || !canvasAssinatura || !ctxAssinatura) return;
    const rect = canvasAssinatura.getBoundingClientRect();
    const largura = Math.max(rect.width || 320, 300);
    const altura = Math.max(rect.height || 220, 180);
    const img = new Image();
    img.onload = () => {
      limparCanvasAssinaturaInterno(largura, altura);
      ctxAssinatura.drawImage(img, 0, 0, largura, altura);
      assinaturaDesenhada = true;
    };
    img.src = src;
  }

  function desenharPonto(ponto) {
    if (!ctxAssinatura || !ponto) return;
    ctxAssinatura.fillStyle = '#111111';
    ctxAssinatura.beginPath();
    ctxAssinatura.arc(ponto.x, ponto.y, 1.6, 0, Math.PI * 2);
    ctxAssinatura.fill();
  }

  function pontoCanvas(event) {
    const rect = canvasAssinatura.getBoundingClientRect();
    const clientX = event.clientX ?? 0;
    const clientY = event.clientY ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function canvasVazioSeguro() {
    if (!canvasAssinatura || !ctxAssinatura) return true;

    try {
      const pixels = ctxAssinatura.getImageData(0, 0, canvasAssinatura.width, canvasAssinatura.height).data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) return false;
      }
    } catch (_) {
      return !assinaturaDesenhada;
    }

    return true;
  }

  function canvasVazio() {
    return canvasVazioSeguro();
  }

  function renderizarAssinatura() {
    const status = document.getElementById('assinatura-cliente-status');
    const preview = document.getElementById('assinatura-cliente-preview');

    if (preview) {
      preview.src = assinaturaDataURL || '';
      preview.style.display = assinaturaDataURL ? 'block' : 'none';
    }

    if (status) {
      const strong = status.querySelector('strong');
      const span = status.querySelector('span');
      const nome = document.getElementById('assinatura-cliente-nome')?.value?.trim() || '';

      if (assinaturaDataURL) {
        if (strong) strong.textContent = 'Assinatura salva';
        if (span) span.textContent = salvamentoBancoDisponivel === false
          ? `Assinado${nome ? ` por ${nome}` : ''}. Salvo neste aparelho; rode o SQL de extras para salvar no banco.`
          : nome ? `Assinado por ${nome}.` : 'Assinatura registrada para esta OS.';
      } else {
        if (strong) strong.textContent = 'Nenhuma assinatura salva';
        if (span) span.textContent = 'Peça para o cliente assinar e clique em Salvar assinatura.';
      }
    }
  }

  async function salvarAssinaturaClienteOS() {
    if (!canvasAssinatura) prepararCanvasAssinatura();

    const nome = document.getElementById('assinatura-cliente-nome')?.value?.trim() || '';

    if (!nome) {
      mostrarMensagem('Informe o nome de quem assinou.', 'erro');
      return;
    }

    if (canvasVazio()) {
      mostrarMensagem('Peça para o cliente desenhar a assinatura antes de salvar.', 'erro');
      return;
    }

    const btn = document.getElementById('btn-salvar-assinatura-cliente');
    const textoOriginal = btn?.textContent || 'Salvar assinatura';

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Salvando...';
      }

      assinaturaDataURL = canvasAssinatura.toDataURL('image/png');
      const salvoBanco = await persistirAssinatura();
      renderizarAssinatura();

      mostrarMensagem(
        salvoBanco
          ? 'Assinatura salva com sucesso no banco.'
          : 'Assinatura salva neste aparelho. Rode o SQL de extras para salvar definitivamente no Supabase.',
        salvoBanco ? 'sucesso' : 'info'
      );
    } catch (erro) {
      console.error('Erro ao salvar assinatura:', erro);
      mostrarMensagem('Não foi possível salvar a assinatura. Tente novamente.', 'erro');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    }
  }

  function limparDesenhoAssinaturaClienteOS() {
    assinaturaDesenhada = false;
    assinaturaDataURL = '';
    redimensionarCanvasAssinatura(false);
    renderizarAssinatura();
  }

  async function removerAssinaturaClienteOS() {
    const confirmar = !assinaturaDataURL || confirm('Deseja remover a assinatura salva desta OS?');
    if (!confirmar) return;

    assinaturaDataURL = '';
    assinaturaDesenhada = false;
    redimensionarCanvasAssinatura(false);
    const salvoBanco = await persistirAssinatura();
    renderizarAssinatura();
    mostrarMensagem(salvoBanco ? 'Assinatura removida com sucesso.' : 'Assinatura removida neste aparelho.', salvoBanco ? 'sucesso' : 'info');
  }

  async function carregarEstadoInicial() {
    const [remoto, local] = await Promise.all([
      carregarExtrasSupabase(),
      Promise.resolve(obterPayloadLocal())
    ]);

    const dados = mesclarDadosExtras(remoto, local);

    fotosAntesOS = normalizarFotos(dados.fotos_antes);
    assinaturaDataURL = dados.assinatura_cliente_data_url || '';

    const nomeInput = document.getElementById('assinatura-cliente-nome');
    if (nomeInput && dados.assinatura_cliente_nome) {
      nomeInput.value = dados.assinatura_cliente_nome;
    }

    renderizarFotos();
    renderizarAssinatura();
    if (assinaturaDataURL) desenharImagemNoCanvas(assinaturaDataURL);
  }

  function instalarEventos() {
    const mapa = {
      'btn-salvar-foto-antes': salvarFotoAntesOS,
      'btn-remover-foto-antes': removerTodasFotosAntesOS,
      'btn-salvar-assinatura-cliente': salvarAssinaturaClienteOS,
      'btn-limpar-assinatura-cliente': limparDesenhoAssinaturaClienteOS,
      'btn-remover-assinatura-cliente': removerAssinaturaClienteOS,
      'btn-agendar-ordem': abrirAgendaDaOS,
      'btn-termo-garantia': gerarTermoGarantiaSimples,
      'btn-recibo-pagamento': gerarReciboPagamentoSimples
    };

    Object.entries(mapa).forEach(([id, handler]) => {
      const botao = document.getElementById(id);
      if (!botao || botao.dataset.fsExtraEvento === '1') return;
      botao.dataset.fsExtraEvento = '1';
      botao.addEventListener('click', (event) => {
        event.preventDefault();
        handler();
      });
    });

    const nomeInput = document.getElementById('assinatura-cliente-nome');
    if (nomeInput && nomeInput.dataset.fsExtraEvento !== '1') {
      nomeInput.dataset.fsExtraEvento = '1';
      nomeInput.addEventListener('input', renderizarAssinatura);
    }
  }

  function abrirAgendaDaOS() {
    const ordemId = obterOrdemId();
    const params = new URLSearchParams();
    if (ordemId) params.set('ordem_id', ordemId);
    try {
      if (window.ordemAtual?.cliente_id) params.set('cliente_id', window.ordemAtual.cliente_id);
      if (window.ordemAtual?.veiculo_id) params.set('veiculo_id', window.ordemAtual.veiculo_id);
    } catch (_) {}
    window.location.href = `agenda.html?${params.toString()}`;
  }

  function dadosBasicosDocumento() {
    const numero = document.getElementById('detalhe-numero-os')?.textContent || 'Ordem de Serviço';
    const cliente = document.getElementById('detalhe-cliente-nome')?.textContent || 'Cliente';
    const total = document.getElementById('detalhe-valor-total')?.textContent || 'R$ 0,00';
    const pago = document.getElementById('detalhe-valor-pago')?.textContent || 'R$ 0,00';
    const saldo = document.getElementById('detalhe-saldo-restante')?.textContent || 'R$ 0,00';
    const garantia = document.getElementById('detalhe-garantia-dias')?.textContent || '-';
    const validade = document.getElementById('detalhe-garantia-validade')?.textContent || '-';
    const servico = document.getElementById('detalhe-titulo-os')?.textContent || 'Serviço';
    return { numero, cliente, total, pago, saldo, garantia, validade, servico };
  }

  function gerarDocumentoTexto(titulo, linhas) {
    const janela = window.open('', '_blank');
    if (!janela) {
      mostrarMensagem('Permita pop-ups para gerar o documento.', 'erro');
      return;
    }

    janela.document.write(`
      <!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>${escapar(titulo)}</title>
      <style>body{font-family:Arial,sans-serif;color:#111;margin:32px;line-height:1.5}.box{border:1px solid #222;padding:24px}.assinatura{margin-top:60px;border-top:1px solid #111;text-align:center;padding-top:8px}</style>
      </head><body><div class="box"><h1>${escapar(titulo)}</h1>${linhas.map(l => `<p>${escapar(l)}</p>`).join('')}<div class="assinatura">Assinatura do cliente/responsável</div></div><script>window.print();</script></body></html>
    `);
    janela.document.close();
  }

  function gerarTermoGarantiaSimples() {
    const d = dadosBasicosDocumento();
    gerarDocumentoTexto('Termo de garantia', [
      `${d.numero}`,
      `Cliente: ${d.cliente}`,
      `Serviço: ${d.servico}`,
      `Garantia: ${d.garantia}`,
      `Validade estimada: ${d.validade}`,
      'Este termo registra a garantia informada na ordem de serviço, conforme condições e observações cadastradas.'
    ]);
  }

  function gerarReciboPagamentoSimples() {
    const d = dadosBasicosDocumento();
    gerarDocumentoTexto('Recibo de pagamento', [
      `${d.numero}`,
      `Cliente: ${d.cliente}`,
      `Serviço: ${d.servico}`,
      `Valor total: ${d.total}`,
      `Valor pago: ${d.pago}`,
      `Saldo restante: ${d.saldo}`,
      'Recebemos do cliente/responsável os valores descritos acima, referentes à ordem de serviço informada.'
    ]);
  }

  function iniciar() {
    injetarEstilo();
    prepararHTMLFotos();
    prepararCanvasAssinatura();
    instalarEventos();
    carregarEstadoInicial();

    setTimeout(() => {
      prepararHTMLFotos();
      instalarEventos();
      renderizarFotos();
      redimensionarCanvasAssinatura(true);
    }, 900);

    setTimeout(() => {
      instalarEventos();
      if (assinaturaDataURL) desenharImagemNoCanvas(assinaturaDataURL);
    }, 1800);
  }

  window.salvarFotoAntesOS = salvarFotoAntesOS;
  window.removerFotoAntesOS = removerFotoAntesOS;
  window.removerTodasFotosAntesOS = removerTodasFotosAntesOS;
  window.salvarAssinaturaClienteOS = salvarAssinaturaClienteOS;
  window.limparDesenhoAssinaturaClienteOS = limparDesenhoAssinaturaClienteOS;
  window.removerAssinaturaClienteOS = removerAssinaturaClienteOS;
  window.abrirAgendaDaOS = abrirAgendaDaOS;
  window.gerarTermoGarantiaSimples = gerarTermoGarantiaSimples;
  window.gerarReciboPagamentoSimples = gerarReciboPagamentoSimples;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
