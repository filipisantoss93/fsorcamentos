/* FS Orçamentos — Biblioteca Técnica com conteúdo protegido no Supabase */
(function bibliotecaFS() {
  'use strict';

  const estado = { conteudos: [], categoria: 'Todos', busca: '', perfil: { logado: false, premium: false } };
  const icones = {
    'Diagnóstico Elétrico':'⚡','Motor e Performance':'⚙','Sincronismo do Motor':'⏱','Ignição e Falha de Motor':'✹',
    'Ar-condicionado Automotivo':'❄','Suspensão e Direção':'◌','Freios a Disco e Tambor':'◉','Pneus e Geometria':'◎',
    'Proteção dos Ocupantes (Airbag)':'◈','Sistemas ADAS':'◬','Multímetro na Prática':'⌁','Sensores e Atuadores':'◍',
    'Rede CAN e Comunicação':'⟷','Orçamento Profissional':'▣','Atendimento ao Cliente':'☎','Checklists Prontos':'☑',
    'Modelos e Templates':'▤','Eletromobilidade':'◆','Estudos de Caso':'◎'
  };

  const $ = id => document.getElementById(id);
  const normalizar = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const escapar = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  async function carregarPerfil() {
    const perfil = { logado:false, premium:false };
    if (!window._supabase) return perfil;
    try {
      const { data:{ session }, error } = await _supabase.auth.getSession();
      if (error || !session?.user?.id) return perfil;
      perfil.logado = true;
      const { data, error: perfilErro } = await _supabase.from('perfis')
        .select('plano,plano_status,plano_expira_em').eq('id', session.user.id).maybeSingle();
      if (perfilErro || !data) return perfil;
      const plano = normalizar(data.plano || 'gratis');
      const status = normalizar(data.plano_status || 'ativo');
      const expira = data.plano_expira_em ? new Date(data.plano_expira_em) : null;
      perfil.premium = ['premium','basico','gestao','profissional'].includes(plano)
        && !['cancelado','expirado','inativo'].includes(status)
        && (!expira || !Number.isNaN(expira.getTime()) && expira >= new Date(new Date().setHours(0,0,0,0)));
    } catch (erro) {
      console.warn('Falha segura ao validar plano da biblioteca:', erro);
    }
    return perfil;
  }

  async function carregarMetadados() {
    if (!window._supabase) throw new Error('Supabase indisponível');
    const { data, error } = await _supabase.from('biblioteca_conteudos')
      .select('slug,titulo,categoria,tipo,descricao,tempo,nivel,itens,imagem_url,imagem_alt,premium,ordem')
      .eq('publicado', true).order('ordem', { ascending:true });
    if (error) throw error;
    estado.conteudos = Array.isArray(data) ? data : [];
  }

  function renderizarStatus() {
    const gratis = estado.conteudos.filter(item => !item.premium).length;
    $('biblioteca-total-conteudos').textContent = String(estado.conteudos.length);
    $('biblioteca-total-gratis').textContent = String(gratis);
    if (estado.perfil.premium) {
      $('biblioteca-status-titulo').textContent = 'Biblioteca Premium liberada';
      $('biblioteca-status-texto').textContent = 'Seu plano permite acessar todos os materiais técnicos disponíveis.';
      $('biblioteca-acesso-atual').textContent = 'Acesso atual: Premium';
    } else if (estado.perfil.logado) {
      $('biblioteca-status-titulo').textContent = 'Conteúdos grátis liberados';
      $('biblioteca-status-texto').textContent = 'Seu plano atual permite os exemplos gratuitos. Assine para desbloquear os demais.';
      $('biblioteca-acesso-atual').textContent = 'Acesso atual: Grátis';
    } else {
      $('biblioteca-status-titulo').textContent = 'Conheça a Biblioteca Técnica';
      $('biblioteca-status-texto').textContent = 'Veja os exemplos grátis e entre na sua conta para acessar seu plano.';
      $('biblioteca-acesso-atual').textContent = 'Acesso atual: Visitante';
    }
  }

  function renderizarCategorias() {
    const categorias = ['Todos', ...new Set(estado.conteudos.map(item => item.categoria))];
    const opcoes = categorias.map(cat => {
      const qtd = cat === 'Todos' ? estado.conteudos.length : estado.conteudos.filter(item => item.categoria === cat).length;
      return `<option value="${escapar(cat)}"${estado.categoria === cat ? ' selected' : ''}>${escapar(cat)} (${qtd})</option>`;
    }).join('');
    $('biblioteca-categorias').innerHTML = `<div class="biblioteca-categoria-select-card"><label for="biblioteca-categoria-select">Selecionar categoria</label><select id="biblioteca-categoria-select">${opcoes}</select><span class="biblioteca-categoria-select-ajuda">Escolha uma categoria para filtrar os conteúdos técnicos.</span></div>`;
    $('biblioteca-categoria-select').addEventListener('change', event => {
      estado.categoria = event.target.value || 'Todos';
      renderizarCards();
    });
  }

  function filtrados() {
    const termo = normalizar(estado.busca);
    return estado.conteudos.filter(item => {
      if (estado.categoria !== 'Todos' && item.categoria !== estado.categoria) return false;
      if (!termo) return true;
      return normalizar(`${item.titulo} ${item.categoria} ${item.tipo} ${item.descricao} ${(item.itens || []).join(' ')}`).includes(termo);
    });
  }

  function renderizarCards() {
    const lista = filtrados();
    if (!lista.length) {
      $('biblioteca-conteudos').innerHTML = '<div class="biblioteca-vazio">Nenhum conteúdo encontrado para essa busca.</div>';
      return;
    }
    $('biblioteca-conteudos').innerHTML = lista.map(item => {
      const bloqueado = item.premium && !estado.perfil.premium;
      const imagem = item.imagem_url ? `<div class="biblioteca-card-imagem-wrap"><img class="biblioteca-card-imagem" src="${escapar(item.imagem_url)}" alt="${escapar(item.imagem_alt || item.titulo)}" loading="lazy"></div>` : '';
      const info = (item.itens || []).slice(0,4).map(texto => `<li>${escapar(texto)}</li>`).join('');
      return `<article class="biblioteca-card" data-bloqueado="${bloqueado}" data-categoria="${escapar(item.categoria)}">
        <div class="biblioteca-card-topo"><div class="biblioteca-icone" aria-hidden="true">${escapar(icones[item.categoria] || '◆')}</div>
        <div class="biblioteca-badges"><span class="biblioteca-badge tipo">${escapar(item.tipo)}</span>
        <span class="biblioteca-badge ${item.premium ? 'premium' : 'free'}">${item.premium ? '◆ Premium' : '✓ Grátis'}</span></div></div>
        ${imagem}<h2>${escapar(item.titulo)}</h2><p>${escapar(item.descricao)}</p><ul class="biblioteca-card-info">${info}</ul>
        <div class="biblioteca-card-acao"><button type="button" class="btn ${bloqueado ? 'btn-secondary' : 'btn-primary'}" data-abrir-conteudo="${escapar(item.slug)}">${bloqueado ? 'Ver prévia premium' : 'Ver conteúdo'}</button></div>
      </article>`;
    }).join('');
    document.querySelectorAll('[data-abrir-conteudo]').forEach(botao => botao.addEventListener('click', () => abrirConteudo(botao.dataset.abrirConteudo)));
  }

  function renderizarBlocos(blocos) {
    return (blocos || []).map(bloco => {
      const textos = (bloco.texto || []).map(p => `<p>${escapar(p)}</p>`).join('');
      const lista = bloco.lista?.length ? `<ul class="biblioteca-lista">${bloco.lista.map(i => `<li>${escapar(i)}</li>`).join('')}</ul>` : '';
      return `<section class="biblioteca-conteudo-bloco"><h3>${escapar(bloco.titulo)}</h3>${textos}${lista}</section>`;
    }).join('');
  }

  async function abrirConteudo(slug) {
    const item = estado.conteudos.find(conteudo => conteudo.slug === slug);
    if (!item) return;
    $('biblioteca-modal-head').innerHTML = `<span class="biblioteca-tag">Carregando conteúdo...</span><h2 id="biblioteca-modal-titulo">${escapar(item.titulo)}</h2><p>${escapar(item.descricao)}</p>`;
    $('biblioteca-modal-corpo').innerHTML = '<section class="biblioteca-conteudo-bloco"><p>Consultando seu acesso com segurança...</p></section>';
    abrirModal();
    try {
      const { data, error } = await _supabase.rpc('obter_biblioteca_conteudo', { p_slug: slug });
      if (error) throw error;
      const conteudo = Array.isArray(data) ? data[0] : data;
      if (!conteudo) throw new Error('Conteúdo não encontrado');
      const imagem = conteudo.imagem_url ? `<section class="biblioteca-modal-imagem-wrap" data-categoria="${escapar(conteudo.categoria)}"><img class="biblioteca-modal-imagem" src="${escapar(conteudo.imagem_url)}" alt="${escapar(conteudo.imagem_alt || conteudo.titulo)}"></section>` : '';
      if (!conteudo.autorizado) {
        const login = `/index.html?login=1&dest=${encodeURIComponent('/biblioteca.html?conteudo=' + slug)}`;
        $('biblioteca-modal-head').innerHTML = `<span class="biblioteca-tag">◆ Conteúdo Premium</span><h2 id="biblioteca-modal-titulo">${escapar(conteudo.titulo)}</h2><p>${escapar(conteudo.descricao)}</p>`;
        $('biblioteca-modal-corpo').innerHTML = `${imagem}<section class="biblioteca-paywall"><strong>Este material faz parte da Biblioteca Técnica Premium.</strong><span>O corpo completo permanece protegido e será liberado após a validação de uma assinatura ativa.</span><div class="biblioteca-paywall-acoes"><a class="btn btn-primary" href="/planos.html#assinar-plano-premium">Assinar Premium</a><a class="btn btn-secondary" href="${escapar(login)}">Entrar na conta</a></div></section><section class="biblioteca-conteudo-bloco"><h3>Prévia do conteúdo</h3><ul class="biblioteca-lista">${(conteudo.itens || []).map(i => `<li>${escapar(i)}</li>`).join('')}</ul></section>`;
        return;
      }
      $('biblioteca-modal-head').innerHTML = `<span class="biblioteca-tag">${conteudo.premium ? 'Conteúdo Premium' : 'Exemplo Grátis'} • ${escapar(conteudo.categoria)}</span><h2 id="biblioteca-modal-titulo">${escapar(conteudo.titulo)}</h2><p>${escapar(conteudo.descricao)}</p>`;
      $('biblioteca-modal-corpo').innerHTML = `${imagem}<section class="biblioteca-conteudo-bloco"><h3>Resumo rápido</h3><p><strong>Tipo:</strong> ${escapar(conteudo.tipo)} • <strong>Nível:</strong> ${escapar(conteudo.nivel)} • <strong>Tempo:</strong> ${escapar(conteudo.tempo)}</p><ul class="biblioteca-lista">${(conteudo.itens || []).map(i => `<li>${escapar(i)}</li>`).join('')}</ul></section>${renderizarBlocos(conteudo.blocos)}<section class="biblioteca-conteudo-bloco"><h3>Aplicação prática</h3><p>Use este material junto com o FS Orçamentos para registrar testes e apresentar uma proposta profissional ao cliente.</p></section>`;
    } catch (erro) {
      console.error('Erro ao abrir conteúdo:', erro);
      $('biblioteca-modal-corpo').innerHTML = '<section class="biblioteca-conteudo-bloco"><h3>Não foi possível abrir</h3><p>Atualize a página e tente novamente.</p></section>';
    }
  }

  function abrirModal() {
    $('biblioteca-modal').classList.add('ativo');
    document.body.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';
  }
  function fecharModal() {
    $('biblioteca-modal').classList.remove('ativo');
    document.body.classList.remove('modal-aberto');
    document.body.style.overflow = '';
  }

  async function inicializar() {
    $('biblioteca-busca').addEventListener('input', event => { estado.busca = event.target.value || ''; renderizarCards(); });
    $('biblioteca-fechar').addEventListener('click', fecharModal);
    $('biblioteca-modal').addEventListener('click', event => { if (event.target === $('biblioteca-modal')) fecharModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') fecharModal(); });
    try {
      const [perfil] = await Promise.all([carregarPerfil(), carregarMetadados()]);
      estado.perfil = perfil;
      renderizarStatus();
      renderizarCategorias();
      renderizarCards();
    } catch (erro) {
      console.error('Erro ao inicializar biblioteca:', erro);
      $('biblioteca-conteudos').innerHTML = '<div class="biblioteca-vazio">Não foi possível carregar a biblioteca agora.</div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();
})();