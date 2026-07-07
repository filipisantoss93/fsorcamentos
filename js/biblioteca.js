/* =========================================================
   FS ORÇAMENTOS — Biblioteca Técnica
   Categorias em select, 3 conteúdos grátis e Premium.
   Imagens de ar-condicionado apontando para .PNG maiúsculo.
   ========================================================= */

(function bibliotecaFS() {
  'use strict';

  const CATEGORIAS = [
    'Diagnóstico Elétrico', 'Motor e Performance', 'Sincronismo do Motor',
    'Ignição e Falha de Motor', 'Ar-condicionado Automotivo', 'Suspensão e Direção',
    'Freios a Disco e Tambor', 'Pneus e Geometria', 'Proteção dos Ocupantes (Airbag)',
    'Sistemas ADAS', 'Multímetro na Prática', 'Sensores e Atuadores',
    'Rede CAN e Comunicação', 'Orçamento Profissional', 'Atendimento ao Cliente',
    'Checklists Prontos', 'Modelos e Templates', 'Eletromobilidade', 'Estudos de Caso'
  ];

  const IMG_AR = {
    funcionamento: '/imagens/funcionamento-ar-condicionado-automotivo.PNG',
    oxi: '/imagens/oxi-sanitizacao-ar-condicionado.PNG',
    pressoes: '/imagens/analise-de-pressoes-ar-condicionado.PNG'
  };

  const CONTEUDOS = [
    c('Checklist básico de entrada do veículo', 'Checklists Prontos', 'Checklist', false,
      'Modelo simples para registrar dados do cliente, queixa principal, itens visuais e autorização inicial.',
      '5 min', 'Básico', ['Identificação do veículo', 'Queixa principal do cliente', 'Condição visual', 'Autorização para diagnóstico'],
      [b('Objetivo', ['Evitar que o carro entre na oficina sem registro claro. Esse checklist ajuda a documentar o estado inicial do veículo e reduz ruído na comunicação com o cliente.']), b('Campos recomendados', null, ['Nome e telefone do cliente', 'Placa, modelo, ano e quilometragem', 'Queixa principal nas palavras do cliente', 'Itens visuais: riscos, avarias, acessórios e luzes acesas', 'Autorização para iniciar diagnóstico'])]),

    c('3 erros que fazem o mecânico trocar peça à toa', 'Diagnóstico Elétrico', 'Artigo', false,
      'Conteúdo introdutório para evitar diagnóstico por tentativa e melhorar a sequência de testes.',
      '6 min', 'Básico', ['Falta de sequência', 'Não testar alimentação', 'Não confirmar aterramento'],
      [b('Erro 1: começar pela peça mais provável', ['Mesmo quando o defeito parece óbvio, confirme alimentação, aterramento e sinal antes de condenar componente.']), b('Erro 2: ignorar queda de tensão', ['Um circuito pode ter 12 V parado e falhar em carga. Por isso a queda de tensão é etapa essencial em muitos diagnósticos elétricos.']), b('Erro 3: não registrar os testes', ['Sem registro fica mais difícil explicar o serviço e defender o valor do diagnóstico. Anote medições, sintomas e conclusão.'])]),

    c('Como organizar um orçamento profissional', 'Orçamento Profissional', 'Modelo', false,
      'Estrutura básica para apresentar diagnóstico, peças, mão de obra, prazo e observações com mais confiança.',
      '7 min', 'Básico', ['Diagnóstico encontrado', 'Peças e mão de obra', 'Prazo e garantia', 'Mensagem ao cliente'],
      [b('Estrutura recomendada', null, ['Defeito relatado pelo cliente', 'Testes realizados', 'Causa provável ou confirmada', 'Peças necessárias', 'Mão de obra', 'Prazo de execução', 'Garantia e observações']), b('Mensagem pronta', ['Olá, realizamos os testes no veículo e identificamos a causa da falha. Segue orçamento com peças, mão de obra e prazo para aprovação.'])]),

    c('Checklist de diagnóstico elétrico básico', 'Diagnóstico Elétrico', 'Checklist', true,
      'Sequência para verificar bateria, alternador, fusíveis, alimentação, aterramento e falhas registradas.',
      '12 min', 'Essencial', ['Bateria', 'Alternador', 'Fusíveis e relés', 'Alimentação e aterramento'],
      [b('Sequência de diagnóstico', null, ['Confirmar a reclamação do cliente', 'Inspecionar bateria, terminais e chicote visível', 'Medir tensão da bateria em repouso', 'Medir tensão durante partida', 'Testar sistema de carga', 'Conferir fusíveis e relés do circuito', 'Testar alimentação positiva e aterramento no componente', 'Registrar conclusão no orçamento'])]),

    c('Como testar bateria e alternador', 'Diagnóstico Elétrico', 'Passo a passo', true,
      'Roteiro prático para diferenciar falha de bateria, carga, mau contato e fuga aparente.',
      '10 min', 'Básico/Intermediário', ['Tensão em repouso', 'Teste na partida', 'Carga do alternador', 'Terminais e cabos'],
      [b('Pontos de verificação', null, ['Medir bateria antes da partida', 'Observar queda de tensão durante acionamento do motor de partida', 'Medir tensão com motor funcionando', 'Ligar consumidores elétricos e observar estabilidade', 'Verificar terminais, cabo positivo e aterramento do motor'])]),

    c('Diagnóstico de motor sem trocar peça por tentativa', 'Motor e Performance', 'Checklist', true,
      'Sequência geral para motor falhando, sem força, consumo alto, marcha lenta irregular ou dificuldade de partida.',
      '18 min', 'Intermediário', ['Compressão', 'Combustível', 'Entrada de ar', 'Sensores e atuadores'],
      [b('Sequência inicial', null, ['Confirmar o sintoma informado pelo cliente', 'Ler códigos de falha e parâmetros no scanner', 'Verificar admissão de ar e possíveis entradas falsas', 'Avaliar pressão e alimentação de combustível', 'Inspecionar velas, bobinas e bicos', 'Conferir compressão quando a falha persistir', 'Verificar sincronismo quando houver indício mecânico'])]),

    c('Sincronismo do motor: sintomas e conferência', 'Sincronismo do Motor', 'Guia', true,
      'Roteiro para suspeita de motor fora de ponto, correia/corrente, variador de fase e códigos de correlação.',
      '16 min', 'Intermediário', ['Correia/corrente', 'Ponto mecânico', 'Variador de fase', 'Sensor fase/rotação'],
      [b('Sintomas comuns', null, ['Dificuldade de partida', 'Motor sem força', 'Marcha lenta irregular', 'Consumo elevado', 'Códigos de correlação entre fase e rotação', 'Ruído em corrente ou tensionador', 'Falha após troca de correia'])]),

    c('Diagnóstico de falha de ignição e misfire', 'Ignição e Falha de Motor', 'Passo a passo', true,
      'Sequência para falha de cilindro, bobina, vela, cabo, bico, compressão, entrada falsa de ar e chicote.',
      '18 min', 'Intermediário', ['Vela', 'Bobina', 'Bico injetor', 'Compressão'],
      [b('Sequência de diagnóstico', null, ['Ler códigos de falha e dados de congelamento', 'Identificar cilindro com falha quando possível', 'Inspecionar vela e condição da queima', 'Testar bobina ou trocar de posição para confirmar', 'Conferir pulso e alimentação do bico injetor', 'Avaliar entrada falsa de ar', 'Testar compressão quando a falha persiste'])]),

    c('Diagnóstico de ar-condicionado sem trocar peça por tentativa', 'Ar-condicionado Automotivo', 'Checklist', true,
      'Sequência para verificar acionamento do compressor, ventilador, pressão, filtro, vazamento e comandos elétricos.',
      '15 min', 'Intermediário', ['Compressor', 'Ventilador', 'Pressão do sistema', 'Vazamentos'],
      [b('Sequência inicial', null, ['Confirmar a reclamação: não gela, gela pouco, ruído ou intermitência', 'Verificar filtro de cabine e fluxo de ar', 'Conferir acionamento do compressor ou embreagem eletromagnética quando aplicável', 'Verificar funcionamento do eletroventilador', 'Analisar pressão do sistema com equipamento adequado', 'Inspecionar vazamentos, mangueiras, condensador e conexões', 'Registrar testes e conclusão no orçamento']), b('Atenção', ['Evite apenas completar gás sem diagnóstico. Perda de eficiência pode envolver vazamento, restrição, ventilação, compressor, sensor de pressão ou comando elétrico.'])], IMG_AR.funcionamento, 'Funcionamento e diagnóstico inicial do ar-condicionado automotivo'),

    c('Oxi-sanitização no ar-condicionado automotivo', 'Ar-condicionado Automotivo', 'Higienização', true,
      'Importância da higienização do ar-condicionado para reduzir odores, impurezas e melhorar a qualidade do ar interno.',
      '9 min', 'Básico', ['Higienização', 'Odor', 'Qualidade do ar', 'Evaporador e dutos'],
      [b('Por que higienizar', ['A oxi-sanitização ajuda a reduzir odores desagradáveis, fungos, bactérias e impurezas acumuladas no sistema de ventilação.', 'Esse procedimento melhora a qualidade do ar para os ocupantes e valoriza o serviço prestado pela oficina.']), b('Quando recomendar', null, ['Mau cheiro ao ligar a ventilação', 'Veículo com uso intenso urbano', 'Troca de filtro de cabine com sujeira excessiva', 'Cliente com sensibilidade respiratória', 'Veículos que ficaram muito tempo parados'])], IMG_AR.oxi, 'Procedimento de oxi-sanitização no sistema de ar-condicionado automotivo'),

    c('Funcionamento e primeiro diagnóstico do ar-condicionado', 'Ar-condicionado Automotivo', 'Guia', true,
      'Visão geral do funcionamento do sistema e sequência inicial de diagnóstico antes de condenar componentes.',
      '14 min', 'Intermediário', ['Compressor', 'Condensador', 'Evaporador', 'Ventilação interna'],
      [b('Funcionamento básico', ['O compressor pressuriza o fluido refrigerante, o condensador dissipa calor, o evaporador resfria o ar e o ventilador interno distribui esse ar para a cabine.']), b('Primeiro diagnóstico', null, ['Confirmar a reclamação do cliente', 'Verificar se o compressor aciona', 'Verificar funcionamento do eletroventilador', 'Conferir temperatura do ar nas saídas', 'Inspecionar filtro de cabine', 'Observar ruídos, vazamentos e sinais visuais', 'Registrar os testes antes do orçamento'])], IMG_AR.funcionamento, 'Esquema prático de funcionamento do ar-condicionado automotivo'),

    c('Como analisar pressões do ar-condicionado', 'Ar-condicionado Automotivo', 'Diagnóstico', true,
      'Introdução prática para leitura de baixa e alta pressão com manifold e interpretação inicial do comportamento do sistema.',
      '15 min', 'Intermediário', ['Baixa pressão', 'Alta pressão', 'Manifold', 'Interpretação inicial'],
      [b('O que observar', ['A leitura das pressões ajuda a entender se o sistema trabalha de forma coerente ou se há indícios de carga incorreta, restrição, falha de ventilação ou problema no compressor.']), b('Análise inicial', null, ['Conectar manifold corretamente', 'Observar pressão de baixa', 'Observar pressão de alta', 'Verificar se o compressor está acionando', 'Conferir ventilação e troca térmica no condensador', 'Comparar comportamento das linhas e temperatura do ar interno'])], IMG_AR.pressoes, 'Mecânico analisando pressões do ar-condicionado com manifold'),

    c('Checklist de suspensão e direção', 'Suspensão e Direção', 'Checklist', true,
      'Roteiro para ruídos, folgas, desgaste irregular de pneus, amortecedores, buchas, pivôs, bieletas e terminais.',
      '13 min', 'Básico/Intermediário', ['Ruídos', 'Folgas', 'Amortecedores', 'Pneus e alinhamento'],
      [b('Itens de inspeção', null, ['Confirmar ruído com teste de rodagem quando necessário', 'Verificar pneus e desgaste irregular', 'Inspecionar amortecedores e batentes', 'Verificar buchas de bandeja', 'Conferir pivôs, terminais e axiais', 'Inspecionar bieletas e barras estabilizadoras', 'Avaliar coxins e rolamentos de roda'])]),

    c('Freios a disco: inspeção e orçamento seguro', 'Freios a Disco e Tambor', 'Guia', true,
      'Como avaliar pastilhas, discos, pinças, fluido, flexíveis e sintomas como vibração, ruído e pedal baixo.',
      '14 min', 'Essencial', ['Pastilhas', 'Discos', 'Pinças', 'Fluido de freio'],
      [b('Inspeção recomendada', null, ['Conferir espessura das pastilhas', 'Inspecionar discos quanto a desgaste, sulcos e trincas', 'Verificar deslizamento dos pinos da pinça', 'Avaliar vazamento em flexíveis e conexões', 'Verificar nível e condição do fluido', 'Testar pedal e eficiência após reparo'])]),

    c('Freio a tambor: lona, cilindro e regulagem', 'Freios a Disco e Tambor', 'Checklist', true,
      'Roteiro para revisar lonas, tambores, cilindros de roda, cabo de freio de estacionamento e regulagem.',
      '12 min', 'Essencial', ['Lonas', 'Cilindro de roda', 'Tambor', 'Freio de estacionamento'],
      [b('Itens de inspeção', null, ['Verificar espessura e contaminação das lonas', 'Inspecionar cilindro de roda quanto a vazamento', 'Conferir superfície interna do tambor', 'Verificar molas e travas', 'Checar regulagem automática ou manual', 'Testar cabo e alavanca do freio de estacionamento'])]),

    c('Pneus: desgaste irregular, alinhamento e balanceamento', 'Pneus e Geometria', 'Checklist', true,
      'Como avaliar desgaste dos pneus, calibragem, geometria, balanceamento, rodízio e sintomas de direção puxando.',
      '12 min', 'Básico', ['Calibragem', 'Desgaste irregular', 'Alinhamento', 'Balanceamento'],
      [b('Itens de inspeção', null, ['Conferir medida e aplicação correta do pneu', 'Verificar calibragem', 'Inspecionar desgaste nas bordas, centro e escamas', 'Avaliar bolhas, cortes e deformações', 'Relacionar desgaste com folgas de suspensão', 'Indicar alinhamento, balanceamento ou rodízio quando necessário'])]),

    c('Proteção dos ocupantes: airbag e pré-tensionadores', 'Proteção dos Ocupantes (Airbag)', 'Guia de segurança', true,
      'Roteiro seguro para luz de airbag, conectores, cinta do airbag, pré-tensionadores e sensores de impacto.',
      '15 min', 'Intermediário', ['Luz de airbag', 'Pré-tensionador', 'Cinta do airbag', 'Sensores de impacto'],
      [b('Cuidados antes de mexer', null, ['Consultar procedimento do fabricante', 'Desligar alimentação conforme orientação técnica', 'Evitar medir resistência diretamente em componentes pirotécnicos', 'Não improvisar chicote de airbag', 'Verificar conectores sob bancos e coluna de direção com segurança', 'Registrar código de falha e componente indicado'])]),

    c('Sistemas ADAS: câmera, radar e calibração', 'Sistemas ADAS', 'Guia', true,
      'Introdução para diagnóstico e orientação sobre câmera frontal, radar, sensores, calibração e pós-reparo.',
      '17 min', 'Introdução/Intermediário', ['Câmera frontal', 'Radar', 'Calibração', 'Pós-colisão'],
      [b('Quando suspeitar de calibração', null, ['Troca de para-brisa', 'Reparo de colisão dianteira', 'Troca ou remoção de para-choque', 'Alinhamento ou alteração de suspensão', 'Substituição de câmera, radar ou módulo', 'Mensagens de assistente indisponível no painel'])]),

    c('Como identificar mau aterramento', 'Multímetro na Prática', 'Aula rápida', true,
      'Aprenda a procurar queda de tensão em aterramentos antes de condenar sensor, atuador ou módulo.',
      '9 min', 'Intermediário', ['Queda de tensão', 'Teste sob carga', 'Pontos de massa', 'Sintomas comuns'],
      [b('Sinais comuns', null, ['Luzes fracas ou oscilando', 'Falhas intermitentes', 'Comunicação instável', 'Sensor com leitura incoerente', 'Motor de partida pesado mesmo com bateria boa'])]),

    c('Como usar o multímetro na oficina', 'Multímetro na Prática', 'Guia', true,
      'Aplicação prática de tensão, resistência, continuidade e sinal para diagnóstico automotivo.',
      '14 min', 'Básico', ['Tensão DC', 'Resistência', 'Continuidade', 'Sinal'],
      [b('Medições essenciais', null, ['Tensão de bateria', 'Alimentação 12 V', 'Aterramento', 'Continuidade de chicote', 'Resistência de sensores quando aplicável', 'Sinal variável de sensores'])]),

    c('Checklist de sensores automotivos', 'Sensores e Atuadores', 'Checklist', true,
      'Modelo para registrar alimentação, terra, sinal, chicote, conector e conclusão do sensor testado.',
      '12 min', 'Intermediário', ['Alimentação', 'Terra', 'Sinal', 'Conector e chicote'],
      [b('Campos do checklist', null, ['Sensor testado', 'Sintoma do veículo', 'Código de falha no scanner', 'Alimentação medida', 'Aterramento medido', 'Sinal esperado', 'Sinal encontrado', 'Condição do conector', 'Conclusão'])]),

    c('Noções básicas de rede CAN', 'Rede CAN e Comunicação', 'Guia', true,
      'Conceitos iniciais sobre CAN High, CAN Low, resistência da rede e sintomas de falha de comunicação.',
      '16 min', 'Intermediário', ['CAN High', 'CAN Low', 'Resistência', 'Falhas de comunicação'],
      [b('O que observar', null, ['Módulos sem comunicação', 'Diversos códigos U', 'Painel com mensagens múltiplas', 'Veículo não parte por ausência de comunicação', 'Oscilação ou curto nas linhas CAN'])]),

    c('Modelo de orçamento técnico profissional', 'Modelos e Templates', 'Template', true,
      'Estrutura para orçamento com diagnóstico, peças, mão de obra, garantia, prazo e observações.',
      '8 min', 'Básico', ['Diagnóstico', 'Itens', 'Mão de obra', 'Garantia'],
      [b('Blocos do modelo', null, ['Dados do cliente', 'Dados do veículo', 'Defeito relatado', 'Testes executados', 'Solução recomendada', 'Peças e serviços', 'Valor total', 'Prazo e garantia'])]),

    c('Mensagem pronta para enviar orçamento pelo WhatsApp', 'Atendimento ao Cliente', 'Mensagem', true,
      'Texto profissional para enviar orçamento, explicar diagnóstico e solicitar aprovação do cliente.',
      '5 min', 'Básico', ['Texto pronto', 'Aprovação', 'Prazo', 'Confiança'],
      [b('Modelo de mensagem', ['Olá, finalizamos os testes no veículo. Identificamos a falha descrita no orçamento e separamos peças, mão de obra, prazo e observações. Se estiver de acordo, podemos seguir com a execução do serviço.'])]),

    c('Como cobrar diagnóstico automotivo', 'Orçamento Profissional', 'Estratégia', true,
      'Como posicionar o diagnóstico como serviço técnico e reduzir resistência do cliente ao pagamento.',
      '11 min', 'Intermediário', ['Valor técnico', 'Comunicação', 'Relatório', 'Aprovação'],
      [b('Argumento principal', ['Diagnóstico não é tentativa. É tempo técnico, conhecimento, equipamento e responsabilidade para encontrar a causa real do problema.']), b('Como apresentar', null, ['Informe o valor antes de iniciar', 'Explique que o teste evita troca desnecessária', 'Registre medições e evidências', 'Desconte ou não do serviço conforme sua política', 'Inclua o diagnóstico no orçamento final'])]),

    c('Checklist de entrega do veículo ao cliente', 'Checklists Prontos', 'Checklist', true,
      'Lista para conferir serviço executado, limpeza, teste final, itens do cliente e orientações de garantia.',
      '6 min', 'Básico', ['Teste final', 'Itens pessoais', 'Garantia', 'Orientação'],
      [b('Conferência final', null, ['Serviço executado', 'Teste de rodagem quando necessário', 'Luzes de advertência', 'Ferramentas removidas do veículo', 'Itens pessoais preservados', 'Explicação da garantia', 'Próxima revisão recomendada'])]),

    c('Eletromobilidade: segurança antes de qualquer intervenção', 'Eletromobilidade', 'Guia', true,
      'Conteúdo introdutório sobre EPIs, identificação de alta tensão, isolamento, procedimento e limites de atuação.',
      '16 min', 'Introdução', ['Alta tensão', 'EPIs', 'Isolamento', 'Procedimento seguro'],
      [b('Pontos essenciais', null, ['Identificar cabos e componentes de alta tensão', 'Não intervir sem treinamento e procedimento adequado', 'Usar EPIs e ferramentas apropriadas quando o procedimento exigir', 'Respeitar etapas de desenergização do fabricante', 'Isolar área e registrar intervenção'])]),

    c('Carregamento AC e DC em veículos elétricos', 'Eletromobilidade', 'Guia', true,
      'Resumo prático para explicar wallbox, carregamento em corrente alternada e carregamento rápido DC.',
      '13 min', 'Introdução', ['Wallbox', 'AC', 'DC', 'Conector'],
      [b('Resumo comercial', ['Em casa ou empresa, o cliente geralmente usa carregamento AC via wallbox. Em estações rápidas, pode usar carregamento DC, quando compatível com o veículo.']), b('Pontos para explicar', null, ['Potência do carregador', 'Capacidade da bateria', 'Tempo estimado', 'Infraestrutura elétrica', 'Segurança e instalação profissional'])]),

    c('Estudo de caso: carro descarregando bateria', 'Estudos de Caso', 'Caso prático', true,
      'Sequência de investigação para diferenciar bateria ruim, alternador, fuga de corrente e mau contato.',
      '18 min', 'Intermediário', ['Sintoma', 'Sequência', 'Medições', 'Conclusão'],
      [b('Sequência sugerida', null, ['Confirmar histórico do cliente', 'Testar bateria', 'Testar alternador', 'Verificar terminais e aterramentos', 'Checar consumidores que ficam ativos', 'Investigar fuga de corrente conforme procedimento adequado', 'Registrar conclusão e orçamento'])]),

    c('Estudo de caso: falha intermitente de ignição', 'Estudos de Caso', 'Caso prático', true,
      'Exemplo de raciocínio para falha que aparece quente, em carga ou de forma intermitente.',
      '17 min', 'Intermediário', ['Intermitência', 'Scanner', 'Bobina', 'Chicote'],
      [b('Raciocínio', null, ['Confirmar condição em que a falha ocorre', 'Analisar códigos e parâmetros', 'Inspecionar velas e bobinas', 'Testar chicote e conectores', 'Avaliar alimentação e aterramento', 'Registrar teste que confirmou o defeito'])])
  ];

  const estado = { categoria: 'Todos', busca: '', perfil: { logado: false, plano: 'gratis', premium: false } };

  const icones = {
    'Diagnóstico Elétrico': '⚡', 'Motor e Performance': '⚙', 'Sincronismo do Motor': '⏱',
    'Ignição e Falha de Motor': '✹', 'Ar-condicionado Automotivo': '❄', 'Suspensão e Direção': '◌',
    'Freios a Disco e Tambor': '◉', 'Pneus e Geometria': '◎', 'Proteção dos Ocupantes (Airbag)': '◈',
    'Sistemas ADAS': '◬', 'Multímetro na Prática': '⌁', 'Sensores e Atuadores': '◍',
    'Rede CAN e Comunicação': '⟷', 'Orçamento Profissional': '▣', 'Atendimento ao Cliente': '☎',
    'Checklists Prontos': '☑', 'Modelos e Templates': '▤', 'Eletromobilidade': '◆', 'Estudos de Caso': '◎'
  };

  function c(titulo, categoria, tipo, premium, descricao, tempo, nivel, itens, blocos, imagem = '', imagemAlt = '') {
    return { titulo, categoria, tipo, premium, descricao, tempo, nivel, itens, blocos, imagem, imagemAlt };
  }

  function b(titulo, texto = null, lista = null) {
    return { titulo, texto: texto || [], lista: lista || [] };
  }

  function normalizar(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function slugify(v) {
    return normalizar(v).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function escaparHtml(v) {
    return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function garantirEstilosBiblioteca() {
    if (document.getElementById('biblioteca-estilos-js')) return;
    const style = document.createElement('style');
    style.id = 'biblioteca-estilos-js';
    style.textContent = `
      .biblioteca-categorias-select{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;overflow:visible!important;padding:0!important}
      .biblioteca-categoria-select-card{display:grid;gap:8px;padding:14px;border-radius:22px;background:rgba(255,255,255,.96);border:1px solid var(--fs-border);box-shadow:var(--fs-shadow-soft)}
      .biblioteca-categoria-select-card label{margin:0!important;color:var(--fs-text)!important;font-size:12px!important;font-weight:950!important;text-transform:uppercase;letter-spacing:.045em}
      #biblioteca-categoria-select{min-height:52px!important;border-radius:16px!important;font-weight:850!important;background:#fff!important;color:var(--fs-text)!important;border:1px solid var(--fs-border)!important;padding:0 14px!important;appearance:auto!important;-webkit-appearance:menulist!important}
      .biblioteca-categoria-select-ajuda{font-size:12px;color:var(--fs-muted);font-weight:800}
      .biblioteca-card-imagem-wrap{position:relative;z-index:1;width:100%;border-radius:18px;overflow:hidden;border:1px solid var(--fs-border);background:#eef4fb;box-shadow:0 8px 18px rgba(7,20,47,.08)}
      .biblioteca-card-imagem{display:block;width:100%;height:190px;object-fit:cover;object-position:center}
      .biblioteca-card[data-categoria="Ar-condicionado Automotivo"] .biblioteca-card-imagem{height:210px;object-position:center}
      .biblioteca-modal-imagem-wrap{overflow:hidden;border-radius:18px;border:1px solid var(--fs-border);background:#eef4fb;box-shadow:var(--fs-shadow-soft)}
      .biblioteca-modal-imagem{display:block;width:100%;height:auto;max-height:360px;object-fit:cover;object-position:center}
      .biblioteca-modal-imagem-wrap[data-categoria="Ar-condicionado Automotivo"] .biblioteca-modal-imagem{max-height:420px}
      @media(max-width:680px){.biblioteca-card-imagem{height:170px}.biblioteca-card[data-categoria="Ar-condicionado Automotivo"] .biblioteca-card-imagem{height:180px}.biblioteca-modal-imagem{max-height:240px}.biblioteca-modal-imagem-wrap[data-categoria="Ar-condicionado Automotivo"] .biblioteca-modal-imagem{max-height:280px}}
    `;
    document.head.appendChild(style);
  }

  function diasAteExpirar(v) {
    const data = v ? new Date(v) : null;
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
      const { data, error } = await _supabase.from('perfis').select('plano, plano_status, plano_expira_em').eq('id', session.user.id).maybeSingle();
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
      if (estado.categoria !== 'Todos' && item.categoria !== estado.categoria) return false;
      if (!termo) return true;
      return normalizar(`${item.titulo} ${item.categoria} ${item.tipo} ${item.descricao} ${(item.itens || []).join(' ')}`).includes(termo);
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
    } else if (estado.perfil.logado) {
      if (titulo) titulo.textContent = 'Conteúdos grátis liberados';
      if (texto) texto.textContent = 'Você está no plano grátis. Assine para desbloquear os checklists e modelos premium.';
      if (acesso) acesso.textContent = 'Acesso atual: Grátis';
    } else {
      if (titulo) titulo.textContent = 'Conheça a Biblioteca Técnica';
      if (texto) texto.textContent = 'Veja 3 exemplos grátis. Para desbloquear os demais, entre e assine o Premium.';
      if (acesso) acesso.textContent = 'Acesso atual: Visitante';
    }
  }

  function renderizarCategorias() {
    const nav = document.getElementById('biblioteca-categorias');
    if (!nav) return;
    garantirEstilosBiblioteca();
    nav.classList.add('biblioteca-categorias-select');
    const todas = ['Todos', ...CATEGORIAS];
    const opcoes = todas.map(cat => {
      const qtd = cat === 'Todos' ? CONTEUDOS.length : CONTEUDOS.filter(c => c.categoria === cat).length;
      const selected = estado.categoria === cat ? ' selected' : '';
      return `<option value="${escaparHtml(cat)}"${selected}>${escaparHtml(cat)} (${qtd})</option>`;
    }).join('');
    nav.innerHTML = `<div class="biblioteca-categoria-select-card"><label for="biblioteca-categoria-select">Selecionar categoria</label><select id="biblioteca-categoria-select" aria-label="Selecionar categoria da biblioteca">${opcoes}</select><span class="biblioteca-categoria-select-ajuda">Escolha uma categoria para filtrar os conteúdos técnicos.</span></div>`;
    const select = document.getElementById('biblioteca-categoria-select');
    if (select) select.addEventListener('change', () => { estado.categoria = select.value || 'Todos'; renderizarCategorias(); renderizarCards(); });
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
      const badgeAcesso = item.premium ? '<span class="biblioteca-badge premium">◆ Premium</span>' : '<span class="biblioteca-badge free">✓ Grátis</span>';
      const info = (item.itens || []).slice(0, 4).map(i => `<li>${escaparHtml(i)}</li>`).join('');
      const imagemCard = item.imagem ? `<div class="biblioteca-card-imagem-wrap"><img class="biblioteca-card-imagem" src="${escaparHtml(item.imagem)}" alt="${escaparHtml(item.imagemAlt || item.titulo)}" loading="lazy"></div>` : '';
      return `<article class="biblioteca-card" data-slug="${escaparHtml(slug)}" data-bloqueado="${bloqueado ? 'true' : 'false'}" data-categoria="${escaparHtml(item.categoria)}"><div class="biblioteca-card-topo"><div class="biblioteca-icone" aria-hidden="true">${escaparHtml(icones[item.categoria] || '◆')}</div><div class="biblioteca-badges"><span class="biblioteca-badge tipo">${escaparHtml(item.tipo)}</span>${badgeAcesso}</div></div>${imagemCard}<h2>${escaparHtml(item.titulo)}</h2><p>${escaparHtml(item.descricao)}</p><ul class="biblioteca-card-info">${info}</ul><div class="biblioteca-card-acao"><button type="button" class="btn ${bloqueado ? 'btn-secondary' : 'btn-primary'}" data-abrir-conteudo="${escaparHtml(slug)}">${bloqueado ? 'Ver prévia premium' : 'Ver conteúdo'}</button></div></article>`;
    }).join('');
    grid.querySelectorAll('[data-abrir-conteudo]').forEach(botao => botao.addEventListener('click', () => abrirConteudo(botao.dataset.abrirConteudo || '')));
  }

  function renderizarBlocos(blocos = []) {
    return blocos.map(bloco => {
      const textos = (bloco.texto || []).map(p => `<p>${escaparHtml(p)}</p>`).join('');
      const lista = bloco.lista?.length ? `<ul class="biblioteca-lista">${bloco.lista.map(item => `<li>${escaparHtml(item)}</li>`).join('')}</ul>` : '';
      return `<section class="biblioteca-conteudo-bloco"><h3>${escaparHtml(bloco.titulo)}</h3>${textos}${lista}</section>`;
    }).join('');
  }

  function renderizarImagemModal(item) {
    if (!item?.imagem) return '';
    return `<section class="biblioteca-modal-imagem-wrap" data-categoria="${escaparHtml(item.categoria)}"><img class="biblioteca-modal-imagem" src="${escaparHtml(item.imagem)}" alt="${escaparHtml(item.imagemAlt || item.titulo)}"></section>`;
  }

  function abrirPaywall(item) {
    const head = document.getElementById('biblioteca-modal-head');
    const corpo = document.getElementById('biblioteca-modal-corpo');
    if (!head || !corpo) return;
    const loginHref = `/index.html?login=1&dest=${encodeURIComponent('/biblioteca.html')}`;
    head.innerHTML = `<span class="biblioteca-tag">◆ Conteúdo Premium</span><h2 id="biblioteca-modal-titulo">${escaparHtml(item.titulo)}</h2><p>${escaparHtml(item.descricao)}</p>`;
    corpo.innerHTML = `${renderizarImagemModal(item)}<section class="biblioteca-paywall"><strong>Este material faz parte da Biblioteca Técnica Premium.</strong><span>Assinantes têm acesso aos checklists, modelos, mensagens prontas, guias técnicos e estudos de caso. Entre na sua conta ou assine o Premium para desbloquear.</span><div class="biblioteca-paywall-acoes"><a class="btn btn-primary" href="/planos.html#assinar-plano-premium">Assinar Premium</a><a class="btn btn-secondary" href="${escaparHtml(loginHref)}">Entrar na conta</a></div></section><section class="biblioteca-conteudo-bloco"><h3>Prévia do conteúdo</h3><ul class="biblioteca-lista">${(item.itens || []).map(i => `<li>${escaparHtml(i)}</li>`).join('')}</ul></section>`;
    abrirModal();
  }

  function abrirConteudo(slug) {
    const item = CONTEUDOS.find(c => slugify(c.titulo) === slug);
    if (!item) return;
    if (item.premium && !estado.perfil.premium) return abrirPaywall(item);
    const head = document.getElementById('biblioteca-modal-head');
    const corpo = document.getElementById('biblioteca-modal-corpo');
    if (!head || !corpo) return;
    head.innerHTML = `<span class="biblioteca-tag">${escaparHtml(item.premium ? 'Conteúdo Premium' : 'Exemplo Grátis')} • ${escaparHtml(item.categoria)}</span><h2 id="biblioteca-modal-titulo">${escaparHtml(item.titulo)}</h2><p>${escaparHtml(item.descricao)}</p>`;
    corpo.innerHTML = `${renderizarImagemModal(item)}<section class="biblioteca-conteudo-bloco"><h3>Resumo rápido</h3><p><strong>Tipo:</strong> ${escaparHtml(item.tipo)} • <strong>Nível:</strong> ${escaparHtml(item.nivel)} • <strong>Tempo:</strong> ${escaparHtml(item.tempo)}</p><ul class="biblioteca-lista">${(item.itens || []).map(i => `<li>${escaparHtml(i)}</li>`).join('')}</ul></section>${renderizarBlocos(item.blocos || [])}<section class="biblioteca-conteudo-bloco"><h3>Aplicação prática</h3><p>Use este material junto com o FS Orçamentos para registrar testes, organizar a explicação técnica e apresentar uma proposta mais profissional ao cliente.</p></section>`;
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
    if (busca) busca.addEventListener('input', () => { estado.busca = busca.value || ''; renderizarCards(); });
    if (fechar) fechar.addEventListener('click', fecharModal);
    if (modal) modal.addEventListener('click', event => { if (event.target === modal) fecharModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') fecharModal(); });
  }

  async function inicializar() {
    garantirEstilosBiblioteca();
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
