/* =========================================================
   FS ORÇAMENTOS — Biblioteca Técnica
   Conteúdos estáticos iniciais, separados por categorias.
   Acesso: 3 exemplos grátis + premium para assinantes.
   ========================================================= */

(function bibliotecaFS() {
  'use strict';

  const CATEGORIAS = [
    'Diagnóstico Elétrico',
    'Multímetro na Prática',
    'Sensores e Atuadores',
    'Rede CAN e Comunicação',
    'Orçamento Profissional',
    'Atendimento ao Cliente',
    'Checklists Prontos',
    'Modelos e Templates',
    'Eletromobilidade',
    'Estudos de Caso'
  ];

  const CONTEUDOS = [
    {
      titulo: 'Checklist básico de entrada do veículo',
      categoria: 'Checklists Prontos',
      tipo: 'Checklist',
      premium: false,
      descricao: 'Modelo simples para registrar dados do cliente, queixa principal, itens visuais e autorização inicial.',
      tempo: '5 min',
      nivel: 'Básico',
      itens: ['Identificação do veículo', 'Queixa principal do cliente', 'Condição visual', 'Autorização para diagnóstico'],
      blocos: [
        { titulo: 'Objetivo', texto: ['Evitar que o carro entre na oficina sem registro claro. Esse checklist ajuda a documentar o estado inicial do veículo e reduz ruído na comunicação com o cliente.'] },
        { titulo: 'Campos recomendados', lista: ['Nome e telefone do cliente', 'Placa, modelo, ano e quilometragem', 'Queixa principal nas palavras do cliente', 'Itens visuais: riscos, avarias, acessórios e luzes acesas', 'Autorização para iniciar diagnóstico'] },
        { titulo: 'Como usar', texto: ['Preencha antes de iniciar qualquer teste. Depois, use essas informações para montar o orçamento no FS Orçamentos com mais clareza.'] }
      ]
    },
    {
      titulo: '3 erros que fazem o mecânico trocar peça à toa',
      categoria: 'Diagnóstico Elétrico',
      tipo: 'Artigo',
      premium: false,
      descricao: 'Conteúdo introdutório para evitar diagnóstico por tentativa e melhorar a sequência de testes.',
      tempo: '6 min',
      nivel: 'Básico',
      itens: ['Falta de sequência', 'Não testar alimentação', 'Não confirmar aterramento'],
      blocos: [
        { titulo: 'Erro 1: começar pela peça mais provável', texto: ['Mesmo quando o defeito parece óbvio, o ideal é confirmar alimentação, aterramento e sinal antes de condenar componente.'] },
        { titulo: 'Erro 2: ignorar queda de tensão', texto: ['Um circuito pode ter 12 V parado e falhar em carga. Por isso a queda de tensão é uma etapa essencial em muitos diagnósticos elétricos.'] },
        { titulo: 'Erro 3: não registrar os testes', texto: ['Sem registro, fica mais difícil explicar o serviço e defender o valor do diagnóstico. Anote medições, sintomas e conclusão.'] }
      ]
    },
    {
      titulo: 'Como organizar um orçamento profissional',
      categoria: 'Orçamento Profissional',
      tipo: 'Modelo',
      premium: false,
      descricao: 'Estrutura básica para apresentar diagnóstico, peças, mão de obra, prazo e observações com mais confiança.',
      tempo: '7 min',
      nivel: 'Básico',
      itens: ['Diagnóstico encontrado', 'Peças e mão de obra', 'Prazo e garantia', 'Mensagem ao cliente'],
      blocos: [
        { titulo: 'Estrutura recomendada', lista: ['Defeito relatado pelo cliente', 'Testes realizados', 'Causa provável ou confirmada', 'Peças necessárias', 'Mão de obra', 'Prazo de execução', 'Garantia e observações'] },
        { titulo: 'Mensagem pronta', texto: ['Olá, realizamos os testes no veículo e identificamos a causa da falha. Segue orçamento com peças, mão de obra e prazo para aprovação.'] },
        { titulo: 'Dica de venda', texto: ['Explique o que foi testado antes de falar preço. Isso aumenta a percepção de valor do serviço técnico.'] }
      ]
    },
    {
      titulo: 'Checklist de diagnóstico elétrico básico',
      categoria: 'Diagnóstico Elétrico',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Sequência para verificar bateria, alternador, fusíveis, alimentação, aterramento e falhas registradas.',
      tempo: '12 min',
      nivel: 'Essencial',
      itens: ['Bateria', 'Alternador', 'Fusíveis e relés', 'Alimentação e aterramento'],
      blocos: [
        { titulo: 'Sequência de diagnóstico', lista: ['Confirmar a reclamação do cliente', 'Inspecionar bateria, terminais e chicote visível', 'Medir tensão da bateria em repouso', 'Medir tensão durante partida', 'Testar sistema de carga', 'Conferir fusíveis e relés do circuito', 'Testar alimentação positiva e aterramento no componente', 'Registrar conclusão no orçamento'] },
        { titulo: 'Observação técnica', texto: ['Não condene módulo ou componente eletrônico antes de confirmar alimentação, aterramento e integridade do chicote.'] }
      ]
    },
    {
      titulo: 'Como testar bateria e alternador',
      categoria: 'Diagnóstico Elétrico',
      tipo: 'Passo a passo',
      premium: true,
      descricao: 'Roteiro prático para diferenciar falha de bateria, carga, mau contato e fuga aparente.',
      tempo: '10 min',
      nivel: 'Básico/Intermediário',
      itens: ['Tensão em repouso', 'Teste na partida', 'Carga do alternador', 'Terminais e cabos'],
      blocos: [
        { titulo: 'Pontos de verificação', lista: ['Medir bateria antes da partida', 'Observar queda de tensão durante acionamento do motor de partida', 'Medir tensão com motor funcionando', 'Ligar consumidores elétricos e observar estabilidade', 'Verificar terminais, cabo positivo e aterramento do motor'] },
        { titulo: 'Como explicar ao cliente', texto: ['Antes de trocar bateria ou alternador, informe que o sistema de carga foi testado para confirmar a causa real da falha.'] }
      ]
    },
    {
      titulo: 'Como identificar mau aterramento',
      categoria: 'Multímetro na Prática',
      tipo: 'Aula rápida',
      premium: true,
      descricao: 'Aprenda a procurar queda de tensão em aterramentos antes de condenar sensor, atuador ou módulo.',
      tempo: '9 min',
      nivel: 'Intermediário',
      itens: ['Queda de tensão', 'Teste sob carga', 'Pontos de massa', 'Sintomas comuns'],
      blocos: [
        { titulo: 'Sinais comuns', lista: ['Luzes fracas ou oscilando', 'Falhas intermitentes', 'Comunicação instável', 'Sensor com leitura incoerente', 'Motor de partida pesado mesmo com bateria boa'] },
        { titulo: 'Teste recomendado', texto: ['Use o multímetro em escala de tensão para medir a diferença entre o negativo da bateria e o ponto de aterramento do circuito durante funcionamento.'] }
      ]
    },
    {
      titulo: 'Como usar o multímetro na oficina',
      categoria: 'Multímetro na Prática',
      tipo: 'Guia',
      premium: true,
      descricao: 'Aplicação prática de tensão, resistência, continuidade e sinal para diagnóstico automotivo.',
      tempo: '14 min',
      nivel: 'Básico',
      itens: ['Tensão DC', 'Resistência', 'Continuidade', 'Sinal'],
      blocos: [
        { titulo: 'Medições essenciais', lista: ['Tensão de bateria', 'Alimentação 12 V', 'Aterramento', 'Continuidade de chicote', 'Resistência de sensores quando aplicável', 'Sinal variável de sensores'] },
        { titulo: 'Cuidado', texto: ['Nunca meça resistência em circuito energizado. Desligue o circuito e confirme o procedimento antes de testar.'] }
      ]
    },
    {
      titulo: 'Checklist de sensores automotivos',
      categoria: 'Sensores e Atuadores',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Modelo para registrar alimentação, terra, sinal, chicote, conector e conclusão do sensor testado.',
      tempo: '12 min',
      nivel: 'Intermediário',
      itens: ['Alimentação', 'Terra', 'Sinal', 'Conector e chicote'],
      blocos: [
        { titulo: 'Campos do checklist', lista: ['Sensor testado', 'Sintoma do veículo', 'Código de falha no scanner', 'Alimentação medida', 'Aterramento medido', 'Sinal esperado', 'Sinal encontrado', 'Condição do conector', 'Conclusão'] },
        { titulo: 'Aplicação', texto: ['Use para sensor de rotação, MAP, temperatura, pedal eletrônico, corpo de borboleta e outros sensores com alimentação/sinal.'] }
      ]
    },
    {
      titulo: 'Noções básicas de rede CAN',
      categoria: 'Rede CAN e Comunicação',
      tipo: 'Guia',
      premium: true,
      descricao: 'Conceitos iniciais sobre CAN High, CAN Low, resistência da rede e sintomas de falha de comunicação.',
      tempo: '16 min',
      nivel: 'Intermediário',
      itens: ['CAN High', 'CAN Low', 'Resistência', 'Falhas de comunicação'],
      blocos: [
        { titulo: 'O que observar', lista: ['Módulos sem comunicação', 'Diversos códigos U', 'Painel com mensagens múltiplas', 'Veículo não parte por ausência de comunicação', 'Oscilação ou curto nas linhas CAN'] },
        { titulo: 'Primeiro caminho', texto: ['Antes de condenar módulo, verifique alimentação, aterramento, integridade da rede e resistência entre as linhas conforme o sistema do veículo.'] }
      ]
    },
    {
      titulo: 'Modelo de orçamento técnico profissional',
      categoria: 'Modelos e Templates',
      tipo: 'Template',
      premium: true,
      descricao: 'Estrutura para orçamento com diagnóstico, peças, mão de obra, garantia, prazo e observações.',
      tempo: '8 min',
      nivel: 'Básico',
      itens: ['Diagnóstico', 'Itens', 'Mão de obra', 'Garantia'],
      blocos: [
        { titulo: 'Blocos do modelo', lista: ['Dados do cliente', 'Dados do veículo', 'Defeito relatado', 'Testes executados', 'Solução recomendada', 'Peças e serviços', 'Valor total', 'Prazo e garantia'] },
        { titulo: 'Uso no FS Orçamentos', texto: ['Transforme essa estrutura em orçamento PDF profissional e envie ao cliente pelo WhatsApp com uma descrição clara do serviço.'] }
      ]
    },
    {
      titulo: 'Mensagem pronta para enviar orçamento pelo WhatsApp',
      categoria: 'Atendimento ao Cliente',
      tipo: 'Mensagem',
      premium: true,
      descricao: 'Texto profissional para enviar orçamento, explicar diagnóstico e solicitar aprovação do cliente.',
      tempo: '5 min',
      nivel: 'Básico',
      itens: ['Texto pronto', 'Aprovação', 'Prazo', 'Confiança'],
      blocos: [
        { titulo: 'Modelo de mensagem', texto: ['Olá, finalizamos os testes no veículo. Identificamos a falha descrita no orçamento e separamos peças, mão de obra, prazo e observações. Se estiver de acordo, podemos seguir com a execução do serviço.'] },
        { titulo: 'Variação para diagnóstico', texto: ['Antes de substituir peças, realizamos os testes necessários para confirmar a causa do defeito. Isso evita troca por tentativa e melhora a segurança do reparo.'] }
      ]
    },
    {
      titulo: 'Como cobrar diagnóstico automotivo',
      categoria: 'Orçamento Profissional',
      tipo: 'Estratégia',
      premium: true,
      descricao: 'Como posicionar o diagnóstico como serviço técnico e reduzir resistência do cliente ao pagamento.',
      tempo: '11 min',
      nivel: 'Intermediário',
      itens: ['Valor técnico', 'Comunicação', 'Relatório', 'Aprovação'],
      blocos: [
        { titulo: 'Argumento principal', texto: ['Diagnóstico não é tentativa. É tempo técnico, conhecimento, equipamento e responsabilidade para encontrar a causa real do problema.'] },
        { titulo: 'Como apresentar', lista: ['Informe o valor antes de iniciar', 'Explique que o teste evita troca desnecessária', 'Registre medições e evidências', 'Desconte ou não do serviço conforme sua política', 'Inclua o diagnóstico no orçamento final'] }
      ]
    },
    {
      titulo: 'Checklist de entrega do veículo ao cliente',
      categoria: 'Checklists Prontos',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Lista para conferir serviço executado, limpeza, teste final, itens do cliente e orientações de garantia.',
      tempo: '6 min',
      nivel: 'Básico',
      itens: ['Teste final', 'Itens pessoais', 'Garantia', 'Orientação'],
      blocos: [
        { titulo: 'Conferência final', lista: ['Serviço executado', 'Teste de rodagem quando necessário', 'Luzes de advertência', 'Ferramentas removidas do veículo', 'Itens pessoais preservados', 'Explicação da garantia', 'Próxima revisão recomendada'] },
        { titulo: 'Benefício', texto: ['A entrega organizada reduz retorno por mal-entendido e aumenta a percepção de profissionalismo.'] }
      ]
    },
    {
      titulo: 'Carregamento AC e DC em veículos elétricos',
      categoria: 'Eletromobilidade',
      tipo: 'Guia',
      premium: true,
      descricao: 'Resumo prático para explicar wallbox, carregamento em corrente alternada e carregamento rápido DC.',
      tempo: '13 min',
      nivel: 'Introdução',
      itens: ['Wallbox', 'AC', 'DC', 'Conector'],
      blocos: [
        { titulo: 'Resumo comercial', texto: ['Em casa ou empresa, o cliente geralmente usa carregamento AC via wallbox. Em estações rápidas, pode usar carregamento DC, quando compatível com o veículo.'] },
        { titulo: 'Pontos para explicar', lista: ['Potência do carregador', 'Capacidade da bateria', 'Tempo estimado', 'Infraestrutura elétrica', 'Segurança e instalação profissional'] }
      ]
    },
    {
      titulo: 'Estudo de caso: carro descarregando bateria',
      categoria: 'Estudos de Caso',
      tipo: 'Caso prático',
      premium: true,
      descricao: 'Sequência de investigação para diferenciar bateria ruim, alternador, fuga de corrente e mau contato.',
      tempo: '18 min',
      nivel: 'Intermediário',
      itens: ['Sintoma', 'Sequência', 'Medições', 'Conclusão'],
      blocos: [
        { titulo: 'Sequência sugerida', lista: ['Confirmar histórico do cliente', 'Testar bateria', 'Testar alternador', 'Verificar terminais e aterramentos', 'Checar consumidores que ficam ativos', 'Investigar fuga de corrente conforme procedimento adequado', 'Registrar conclusão e orçamento'] },
        { titulo: 'Orçamento', texto: ['O orçamento deve separar diagnóstico, peça necessária, mão de obra e observação sobre condições encontradas durante os testes.'] }
      ]
    }
  ];

  const estado = {
    categoria: 'Todos',
    busca: '',
    perfil: { logado: false, plano: 'gratis', premium: false }
  };

  const icones = {
    'Diagnóstico Elétrico': '⚡',
    'Multímetro na Prática': '⌁',
    'Sensores e Atuadores': '◉',
    'Rede CAN e Comunicação': '⟷',
    'Orçamento Profissional': '▣',
    'Atendimento ao Cliente': '☎',
    'Checklists Prontos': '☑',
    'Modelos e Templates': '▤',
    'Eletromobilidade': '◆',
    'Estudos de Caso': '◎'
  };

  function normalizar(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function slugify(valor) {
    return normalizar(valor).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function escaparHtml(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function diasAteExpirar(valor) {
    const data = valor ? new Date(valor) : null;
    if (!data || Number.isNaN(data.getTime())) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);
    return Math.ceil((data.getTime() - hoje.getTime()) / 86400000);
  }

  function planoPremiumAtivo(perfil = {}) {
    const plano = normalizar(perfil.plano || localStorage.getItem('usuario_plano') || 'gratis');
    const status = normalizar(perfil.plano_status || localStorage.getItem('usuario_plano_status') || 'ativo');
    const dias = diasAteExpirar(perfil.plano_expira_em || localStorage.getItem('usuario_plano_expira_em') || '');
    const planoPago = ['premium', 'basico', 'gestao', 'profissional'].includes(plano);
    return planoPago && !['cancelado', 'expirado', 'inativo'].includes(status) && (dias === null || dias >= 0);
  }

  async function carregarPerfil() {
    const perfil = { logado: false, plano: 'gratis', plano_status: 'ativo', premium: false };

    try {
      if (!window._supabase) {
        perfil.plano = localStorage.getItem('usuario_plano') || 'gratis';
        perfil.premium = planoPremiumAtivo(perfil);
        return perfil;
      }

      const { data: { session } } = await _supabase.auth.getSession();
      if (!session?.user?.id) return perfil;

      perfil.logado = true;
      perfil.email = session.user.email || '';

      const { data, error } = await _supabase
        .from('perfis')
        .select('plano, plano_status, plano_expira_em')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) Object.assign(perfil, data);
      perfil.premium = planoPremiumAtivo(perfil);

      localStorage.setItem('usuario_plano', perfil.premium ? 'premium' : normalizar(perfil.plano || 'gratis'));
      if (perfil.plano_status) localStorage.setItem('usuario_plano_status', perfil.plano_status);
      if (perfil.plano_expira_em) localStorage.setItem('usuario_plano_expira_em', perfil.plano_expira_em);
    } catch (erro) {
      console.warn('Não foi possível carregar perfil da biblioteca:', erro);
      perfil.plano = localStorage.getItem('usuario_plano') || 'gratis';
      perfil.premium = planoPremiumAtivo(perfil);
    }

    return perfil;
  }

  function obterConteudosFiltrados() {
    const termo = normalizar(estado.busca);
    return CONTEUDOS.filter(item => {
      const categoriaOk = estado.categoria === 'Todos' || item.categoria === estado.categoria;
      if (!categoriaOk) return false;
      if (!termo) return true;
      const alvo = normalizar(`${item.titulo} ${item.categoria} ${item.tipo} ${item.descricao} ${(item.itens || []).join(' ')}`);
      return alvo.includes(termo);
    });
  }

  function renderizarStatus() {
    const total = document.getElementById('biblioteca-total-conteudos');
    const totalGratis = document.getElementById('biblioteca-total-gratis');
    const titulo = document.getElementById('biblioteca-status-titulo');
    const texto = document.getElementById('biblioteca-status-texto');
    const acesso = document.getElementById('biblioteca-acesso-atual');

    const gratis = CONTEUDOS.filter(c => !c.premium).length;

    if (total) total.textContent = String(CONTEUDOS.length);
    if (totalGratis) totalGratis.textContent = String(gratis);

    if (estado.perfil.premium) {
      if (titulo) titulo.textContent = 'Biblioteca Premium liberada';
      if (texto) texto.textContent = 'Seu plano permite acessar todos os materiais técnicos disponíveis nesta página.';
      if (acesso) acesso.textContent = 'Acesso atual: Premium';
      return;
    }

    if (estado.perfil.logado) {
      if (titulo) titulo.textContent = 'Conteúdos grátis liberados';
      if (texto) texto.textContent = 'Você está no plano grátis. Assine para desbloquear os checklists e modelos premium.';
      if (acesso) acesso.textContent = 'Acesso atual: Grátis';
      return;
    }

    if (titulo) titulo.textContent = 'Conheça a Biblioteca Técnica';
    if (texto) texto.textContent = 'Veja 3 exemplos grátis. Para desbloquear os demais, entre e assine o Premium.';
    if (acesso) acesso.textContent = 'Acesso atual: Visitante';
  }

  function renderizarCategorias() {
    const nav = document.getElementById('biblioteca-categorias');
    if (!nav) return;

    const todas = ['Todos', ...CATEGORIAS];
    nav.innerHTML = todas.map(cat => {
      const qtd = cat === 'Todos' ? CONTEUDOS.length : CONTEUDOS.filter(c => c.categoria === cat).length;
      const ativo = estado.categoria === cat ? ' ativo' : '';
      return `<button type="button" class="biblioteca-cat-btn${ativo}" data-categoria="${escaparHtml(cat)}">${escaparHtml(cat)} <span>${qtd}</span></button>`;
    }).join('');

    nav.querySelectorAll('[data-categoria]').forEach(botao => {
      botao.addEventListener('click', () => {
        estado.categoria = botao.dataset.categoria || 'Todos';
        renderizarCategorias();
        renderizarCards();
      });
    });
  }

  function renderizarCards() {
    const grid = document.getElementById('biblioteca-conteudos');
    if (!grid) return;

    const filtrados = obterConteudosFiltrados();

    if (!filtrados.length) {
      grid.innerHTML = '<div class="biblioteca-vazio">Nenhum conteúdo encontrado para essa busca.</div>';
      return;
    }

    grid.innerHTML = filtrados.map(item => {
      const bloqueado = item.premium && !estado.perfil.premium;
      const slug = slugify(item.titulo);
      const badgeAcesso = item.premium
        ? '<span class="biblioteca-badge premium">◆ Premium</span>'
        : '<span class="biblioteca-badge free">✓ Grátis</span>';
      const textoBotao = bloqueado ? 'Ver prévia premium' : 'Ver conteúdo';
      const info = (item.itens || []).slice(0, 4).map(i => `<li>${escaparHtml(i)}</li>`).join('');

      return `
        <article class="biblioteca-card" data-slug="${escaparHtml(slug)}" data-bloqueado="${bloqueado ? 'true' : 'false'}">
          <div class="biblioteca-card-topo">
            <div class="biblioteca-icone" aria-hidden="true">${escaparHtml(icones[item.categoria] || '◆')}</div>
            <div class="biblioteca-badges">
              <span class="biblioteca-badge tipo">${escaparHtml(item.tipo)}</span>
              ${badgeAcesso}
            </div>
          </div>
          <h2>${escaparHtml(item.titulo)}</h2>
          <p>${escaparHtml(item.descricao)}</p>
          <ul class="biblioteca-card-info">${info}</ul>
          <div class="biblioteca-card-acao">
            <button type="button" class="btn ${bloqueado ? 'btn-secondary' : 'btn-primary'}" data-abrir-conteudo="${escaparHtml(slug)}">${textoBotao}</button>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('[data-abrir-conteudo]').forEach(botao => {
      botao.addEventListener('click', () => abrirConteudo(botao.dataset.abrirConteudo || ''));
    });
  }

  function renderizarBlocos(blocos = []) {
    return blocos.map(bloco => {
      const textos = (bloco.texto || []).map(p => `<p>${escaparHtml(p)}</p>`).join('');
      const lista = bloco.lista?.length
        ? `<ul class="biblioteca-lista">${bloco.lista.map(item => `<li>${escaparHtml(item)}</li>`).join('')}</ul>`
        : '';
      return `
        <section class="biblioteca-conteudo-bloco">
          <h3>${escaparHtml(bloco.titulo)}</h3>
          ${textos}
          ${lista}
        </section>`;
    }).join('');
  }

  function abrirPaywall(item) {
    const head = document.getElementById('biblioteca-modal-head');
    const corpo = document.getElementById('biblioteca-modal-corpo');
    if (!head || !corpo) return;

    head.innerHTML = `
      <span class="biblioteca-tag">◆ Conteúdo Premium</span>
      <h2 id="biblioteca-modal-titulo">${escaparHtml(item.titulo)}</h2>
      <p>${escaparHtml(item.descricao)}</p>`;

    const destino = '/biblioteca.html';
    const loginHref = `/index.html?login=1&dest=${encodeURIComponent(destino)}`;

    corpo.innerHTML = `
      <section class="biblioteca-paywall">
        <strong>Este material faz parte da Biblioteca Técnica Premium.</strong>
        <span>Assinantes têm acesso aos checklists, modelos, mensagens prontas, guias técnicos e estudos de caso. Entre na sua conta ou assine o Premium para desbloquear.</span>
        <div class="biblioteca-paywall-acoes">
          <a class="btn btn-primary" href="/planos.html#assinar-plano-premium">Assinar Premium</a>
          <a class="btn btn-secondary" href="${escaparHtml(loginHref)}">Entrar na conta</a>
        </div>
      </section>
      <section class="biblioteca-conteudo-bloco">
        <h3>Prévia do conteúdo</h3>
        <ul class="biblioteca-lista">${(item.itens || []).map(i => `<li>${escaparHtml(i)}</li>`).join('')}</ul>
      </section>`;

    abrirModal();
  }

  function abrirConteudo(slug) {
    const item = CONTEUDOS.find(c => slugify(c.titulo) === slug);
    if (!item) return;

    if (item.premium && !estado.perfil.premium) {
      abrirPaywall(item);
      return;
    }

    const head = document.getElementById('biblioteca-modal-head');
    const corpo = document.getElementById('biblioteca-modal-corpo');
    if (!head || !corpo) return;

    const acesso = item.premium ? 'Conteúdo Premium' : 'Exemplo Grátis';
    head.innerHTML = `
      <span class="biblioteca-tag">${escaparHtml(acesso)} • ${escaparHtml(item.categoria)}</span>
      <h2 id="biblioteca-modal-titulo">${escaparHtml(item.titulo)}</h2>
      <p>${escaparHtml(item.descricao)}</p>`;

    corpo.innerHTML = `
      <section class="biblioteca-conteudo-bloco">
        <h3>Resumo rápido</h3>
        <p><strong>Tipo:</strong> ${escaparHtml(item.tipo)} • <strong>Nível:</strong> ${escaparHtml(item.nivel)} • <strong>Tempo:</strong> ${escaparHtml(item.tempo)}</p>
        <ul class="biblioteca-lista">${(item.itens || []).map(i => `<li>${escaparHtml(i)}</li>`).join('')}</ul>
      </section>
      ${renderizarBlocos(item.blocos || [])}
      <section class="biblioteca-conteudo-bloco">
        <h3>Aplicação prática</h3>
        <p>Use este material junto com o FS Orçamentos para registrar testes, organizar a explicação técnica e apresentar uma proposta mais profissional ao cliente.</p>
      </section>`;

    abrirModal();
  }

  function abrirModal() {
    const modal = document.getElementById('biblioteca-modal');
    if (!modal) return;
    modal.classList.add('ativo');
    document.body.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';
  }

  function fecharModal() {
    const modal = document.getElementById('biblioteca-modal');
    if (!modal) return;
    modal.classList.remove('ativo');
    document.body.classList.remove('modal-aberto');
    document.body.style.overflow = '';
  }

  function configurarEventos() {
    const busca = document.getElementById('biblioteca-busca');
    const fechar = document.getElementById('biblioteca-fechar');
    const modal = document.getElementById('biblioteca-modal');

    if (busca) {
      busca.addEventListener('input', () => {
        estado.busca = busca.value || '';
        renderizarCards();
      });
    }

    if (fechar) fechar.addEventListener('click', fecharModal);
    if (modal) {
      modal.addEventListener('click', event => {
        if (event.target === modal) fecharModal();
      });
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') fecharModal();
    });
  }

  async function inicializar() {
    configurarEventos();
    renderizarCategorias();
    renderizarCards();
    estado.perfil = await carregarPerfil();
    renderizarStatus();
    renderizarCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();

  window.FS_BIBLIOTECA_CONTEUDOS = CONTEUDOS;
  window.FS_BIBLIOTECA_CATEGORIAS = CATEGORIAS;
})();
