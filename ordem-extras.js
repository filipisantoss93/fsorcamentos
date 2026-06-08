/* =========================================================
   FS ORÇAMENTOS - ordem-extras.js
   Correções: até 5 fotos antes da OS + assinatura desenhável.
   Persistência principal: Supabase em ordens_servico.
   Fallback: localStorage, caso as colunas ainda não existam.
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
  let ultimoHashSalvo = '';

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
    localStorage.setItem(storageKey(), JSON.stringify(payload || {}));
  }

  async function obterUsuarioId() {
    try {
      if (!window._supabase && typeof window.inicializarSupabaseFS === 'function') {
        window.inicializarSupabaseFS();
      }

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
        console.warn('Extras da OS ainda sem colunas no Supabase, usando localStorage:', error);
        return null;
      }

      return data || null;
    } catch (erro) {
      console.warn('Erro ao carregar extras da OS:', erro);
      return null;
    }
  }

  async function salvarExtrasSupabase(payload) {
    const ordemId = obterOrdemId();
    const userId = await obterUsuarioId();

    if (!ordemId || !userId || !window._supabase) return false;

    try {
      const { error } = await window._supabase
        .from('ordens_servico')
        .update(payload)
        .eq('id', ordemId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Não foi possível salvar extras no Supabase. Fallback localStorage:', error);
        return false;
      }

      return true;
    } catch (erro) {
      console.warn('Erro ao salvar extras no Supabase:', erro);
      return false;
    }
  }

  async function persistirFotos() {
    const local = obterPayloadLocal();
    local.fotos_antes = fotosAntesOS;
    salvarPayloadLocal(local);

    return await salvarExtrasSupabase({ fotos_antes: fotosAntesOS });
  }

  async function persistirAssinatura() {
    const nome = document.getElementById('assinatura-cliente-nome')?.value?.trim() || '';
    const local = obterPayloadLocal();
    local.assinatura_cliente_data_url = assinaturaDataURL || null;
    local.assinatura_cliente_nome = nome || null;
    local.assinatura_cliente_em = assinaturaDataURL ? new Date().toISOString() : null;
    salvarPayloadLocal(local);

    return await salvarExtrasSupabase({
      assinatura_cliente_data_url: assinaturaDataURL || null,
      assinatura_cliente_nome: nome || null,
      assinatura_cliente_em: assinaturaDataURL ? new Date().toISOString() : null
    });
  }

  function prepararHTMLFotos() {
    const input = document.getElementById('input-foto-antes-os');
    if (input) {
      input.multiple = true;
      input.accept = 'image/*';
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
    if (span) span.textContent = 'Registro visual antes da execução da OS.';

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
      await persistirFotos();
      renderizarFotos();
      input.value = '';
      mostrarMensagem('Foto(s) salva(s) com sucesso.', 'sucesso');
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
    if (index === undefined || index === null) return;
    fotosAntesOS.splice(Number(index), 1);
    await persistirFotos();
    renderizarFotos();
    mostrarMensagem('Foto removida com sucesso.', 'sucesso');
  }

  async function removerTodasFotosAntesOS() {
    if (!fotosAntesOS.length) {
      mostrarMensagem('Nenhuma foto salva para remover.', 'info');
      return;
    }

    const confirmar = confirm('Deseja remover todas as fotos antes do serviço desta OS?');
    if (!confirmar) return;

    fotosAntesOS = [];
    await persistirFotos();
    renderizarFotos();
    mostrarMensagem('Fotos removidas com sucesso.', 'sucesso');
  }

  function prepararCanvasAssinatura() {
    canvasAssinatura = document.getElementById('canvas-assinatura-cliente');
    if (!canvasAssinatura) return;

    ctxAssinatura = canvasAssinatura.getContext('2d', { willReadFrequently: true });
    redimensionarCanvasAssinatura(false);

    const iniciar = (event) => {
      event.preventDefault();
      desenhando = true;
      assinaturaDesenhada = true;
      ultimoPonto = pontoCanvas(event);
    };

    const mover = (event) => {
      if (!desenhando || !ctxAssinatura) return;
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

    canvasAssinatura.addEventListener('pointerdown', iniciar);
    canvasAssinatura.addEventListener('pointermove', mover);
    canvasAssinatura.addEventListener('pointerup', finalizar);
    canvasAssinatura.addEventListener('pointercancel', finalizar);
    canvasAssinatura.addEventListener('pointerleave', finalizar);

    window.addEventListener('resize', () => redimensionarCanvasAssinatura(true));
  }

  function redimensionarCanvasAssinatura(preservar = true) {
    if (!canvasAssinatura) return;

    const antigo = preservar && assinaturaDesenhada ? canvasAssinatura.toDataURL('image/png') : '';
    const rect = canvasAssinatura.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const larguraCss = Math.max(rect.width || canvasAssinatura.clientWidth || 320, 300);
    const alturaCss = Math.max(rect.height || canvasAssinatura.clientHeight || 220, 180);

    canvasAssinatura.width = Math.round(larguraCss * ratio);
    canvasAssinatura.height = Math.round(alturaCss * ratio);

    ctxAssinatura = canvasAssinatura.getContext('2d', { willReadFrequently: true });
    ctxAssinatura.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctxAssinatura.fillStyle = '#ffffff';
    ctxAssinatura.fillRect(0, 0, larguraCss, alturaCss);

    if (antigo) {
      const img = new Image();
      img.onload = () => ctxAssinatura.drawImage(img, 0, 0, larguraCss, alturaCss);
      img.src = antigo;
    }
  }

  function pontoCanvas(event) {
    const rect = canvasAssinatura.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function canvasVazio() {
    if (!canvasAssinatura || !ctxAssinatura) return true;
    if (assinaturaDesenhada) return false;

    try {
      const pixels = ctxAssinatura.getImageData(0, 0, canvasAssinatura.width, canvasAssinatura.height).data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) return false;
      }
    } catch (_) {}

    return true;
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
        if (span) span.textContent = nome ? `Assinado por ${nome}.` : 'Assinatura registrada para esta OS.';
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

    assinaturaDataURL = canvasAssinatura.toDataURL('image/png');
    ultimoHashSalvo = assinaturaDataURL;
    await persistirAssinatura();
    renderizarAssinatura();
    mostrarMensagem('Assinatura salva com sucesso.', 'sucesso');
  }

  function limparDesenhoAssinaturaClienteOS() {
    assinaturaDesenhada = false;
    redimensionarCanvasAssinatura(false);
  }

  async function removerAssinaturaClienteOS() {
    const confirmar = !assinaturaDataURL || confirm('Deseja remover a assinatura salva desta OS?');
    if (!confirmar) return;

    assinaturaDataURL = '';
    ultimoHashSalvo = '';
    assinaturaDesenhada = false;
    redimensionarCanvasAssinatura(false);
    await persistirAssinatura();
    renderizarAssinatura();
    mostrarMensagem('Assinatura removida com sucesso.', 'sucesso');
  }

  async function carregarEstadoInicial() {
    const remoto = await carregarExtrasSupabase();
    const local = obterPayloadLocal();
    const dados = remoto || local || {};

    fotosAntesOS = Array.isArray(dados.fotos_antes)
      ? dados.fotos_antes.filter(f => f && f.dataUrl).slice(0, MAX_FOTOS)
      : [];

    assinaturaDataURL = dados.assinatura_cliente_data_url || '';

    const nomeInput = document.getElementById('assinatura-cliente-nome');
    if (nomeInput && dados.assinatura_cliente_nome) {
      nomeInput.value = dados.assinatura_cliente_nome;
    }

    renderizarFotos();
    renderizarAssinatura();
  }

  function instalarEventos() {
    document.getElementById('btn-salvar-foto-antes')?.addEventListener('click', salvarFotoAntesOS);
    document.getElementById('btn-remover-foto-antes')?.addEventListener('click', removerTodasFotosAntesOS);
    document.getElementById('btn-salvar-assinatura-cliente')?.addEventListener('click', salvarAssinaturaClienteOS);
    document.getElementById('btn-limpar-assinatura-cliente')?.addEventListener('click', limparDesenhoAssinaturaClienteOS);
    document.getElementById('btn-remover-assinatura-cliente')?.addEventListener('click', removerAssinaturaClienteOS);

    const nomeInput = document.getElementById('assinatura-cliente-nome');
    if (nomeInput) {
      nomeInput.addEventListener('input', () => {
        if (assinaturaDataURL && assinaturaDataURL === ultimoHashSalvo) renderizarAssinatura();
      });
    }
  }

  function iniciar() {
    injetarEstilo();
    prepararHTMLFotos();
    prepararCanvasAssinatura();
    instalarEventos();
    carregarEstadoInicial();

    setTimeout(() => {
      prepararHTMLFotos();
      renderizarFotos();
      redimensionarCanvasAssinatura(true);
    }, 900);
  }

  window.salvarFotoAntesOS = salvarFotoAntesOS;
  window.removerFotoAntesOS = removerFotoAntesOS;
  window.removerTodasFotosAntesOS = removerTodasFotosAntesOS;
  window.salvarAssinaturaClienteOS = salvarAssinaturaClienteOS;
  window.limparDesenhoAssinaturaClienteOS = limparDesenhoAssinaturaClienteOS;
  window.removerAssinaturaClienteOS = removerAssinaturaClienteOS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
