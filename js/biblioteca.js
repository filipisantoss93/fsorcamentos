/* =========================================================
   FS ORÇAMENTOS — Biblioteca Técnica
   Conteúdos separados por categorias.
   Acesso: 3 exemplos grátis + Premium para assinantes.
   Imagens: usar arquivos em /imagens.
   ========================================================= */

(function bibliotecaFS() {
  'use strict';

  const CATEGORIAS = [
    'Diagnóstico Elétrico',
    'Motor e Performance',
    'Sincronismo do Motor',
    'Ignição e Falha de Motor',
    'Ar-condicionado Automotivo',
    'Suspensão e Direção',
    'Freios a Disco e Tambor',
    'Pneus e Geometria',
    'Proteção dos Ocupantes (Airbag)',
    'Sistemas ADAS',
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
        { titulo: 'Como usar', texto: ['Preencha antes de iniciar qualquer teste. Depois use essas informações para montar o orçamento no FS Orçamentos com mais clareza.'] }
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
        { titulo: 'Erro 3: não registrar os testes', texto: ['Sem registro fica mais difícil explicar o serviço e defender o valor do diagnóstico. Anote medições, sintomas e conclusão.'] }
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
      titulo: 'Diagnóstico de motor sem trocar peça por tentativa',
      categoria: 'Motor e Performance',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Sequência geral para motor falhando, sem força, consumo alto, marcha lenta irregular ou dificuldade de partida.',
      tempo: '18 min',
      nivel: 'Intermediário',
      itens: ['Compressão', 'Combustível', 'Entrada de ar', 'Sensores e atuadores'],
      blocos: [
        { titulo: 'Sequência inicial', lista: ['Confirmar o sintoma informado pelo cliente', 'Ler códigos de falha e parâmetros no scanner', 'Verificar admissão de ar e possíveis entradas falsas', 'Avaliar pressão e alimentação de combustível conforme o sistema', 'Inspecionar velas, bobinas e bicos', 'Conferir compressão quando a falha persistir', 'Verificar sincronismo quando houver indício mecânico', 'Registrar conclusão técnica no orçamento'] },
        { titulo: 'Ponto importante', texto: ['Defeito de motor pode ser mecânico, elétrico, eletrônico ou de alimentação. A sequência evita condenar sensor, bobina ou bico sem confirmação.'] }
      ]
    },
    {
      titulo: 'Sincronismo do motor: sintomas e conferência',
      categoria: 'Sincronismo do Motor',
      tipo: 'Guia',
      premium: true,
      descricao: 'Roteiro para suspeita de motor fora de ponto, correia/corrente, variador de fase e códigos de correlação.',
      tempo: '16 min',
      nivel: 'Intermediário',
      itens: ['Correia/corrente', 'Ponto mecânico', 'Variador de fase', 'Sensor fase/rotação'],
      blocos: [
        { titulo: 'Sintomas comuns', lista: ['Dificuldade de partida', 'Motor sem força', 'Marcha lenta irregular', 'Consumo elevado', 'Códigos de correlação entre fase e rotação', 'Ruído em corrente ou tensionador', 'Falha após troca de correia'] },
        { titulo: 'Como diagnosticar', lista: ['Confirmar histórico do serviço', 'Ler códigos e parâmetros de fase quando disponíveis', 'Conferir marcas ou ferramentas de sincronismo conforme fabricante', 'Inspecionar tensionador, polias, corrente/correia e variadores', 'Registrar evidências antes de desmontar'] }
      ]
    },
    {
      titulo: 'Diagnóstico de falha de ignição e misfire',
      categoria: 'Ignição e Falha de Motor',
      tipo: 'Passo a passo',
      premium: true,
      descricao: 'Sequência para falha de cilindro, bobina, vela, cabo, bico, compressão, entrada falsa de ar e chicote.',
      tempo: '18 min',
      nivel: 'Intermediário',
      itens: ['Vela', 'Bobina', 'Bico injetor', 'Compressão'],
      blocos: [
        { titulo: 'Sequência de diagnóstico', lista: ['Ler códigos de falha e dados de congelamento', 'Identificar cilindro com falha quando possível', 'Inspecionar vela e condição da queima', 'Testar bobina ou trocar de posição para confirmar', 'Verificar cabo de vela quando aplicável', 'Conferir pulso e alimentação do bico injetor', 'Avaliar entrada falsa de ar', 'Testar compressão quando a falha persiste', 'Inspecionar chicote e conectores'] },
        { titulo: 'Conclusão técnica', texto: ['A falha de ignição nem sempre é bobina. Pode ser vela, bico, compressão, mistura, entrada de ar, combustível ou comando elétrico.'] }
      ]
    },
    {
      titulo: 'Diagnóstico de ar-condicionado sem trocar peça por tentativa',
      categoria: 'Ar-condicionado Automotivo',
      tipo: 'Checklist',
      premium: true,
      imagem: '/imagens/funcionamento-ar-condicionado-automotivo.png',
      imagemAlt: 'Funcionamento e diagnóstico inicial do ar-condicionado automotivo',
      descricao: 'Sequência para verificar acionamento do compressor, ventilador, pressão, filtro, vazamento e comandos elétricos.',
      tempo: '15 min',
      nivel: 'Intermediário',
      itens: ['Compressor', 'Ventilador', 'Pressão do sistema', 'Vazamentos'],
      blocos: [
        { titulo: 'Sequência inicial', lista: ['Confirmar a reclamação: não gela, gela pouco, ruído ou intermitência', 'Verificar filtro de cabine e fluxo de ar', 'Conferir acionamento do compressor ou embreagem eletromagnética quando aplicável', 'Verificar funcionamento do eletroventilador', 'Analisar pressão do sistema com equipamento adequado', 'Inspecionar vazamentos, mangueiras, condensador e conexões', 'Registrar testes e conclusão no orçamento'] },
        { titulo: 'Atenção', texto: ['Evite apenas completar gás sem diagnóstico. Perda de eficiência pode envolver vazamento, restrição, ventilação, compressor, sensor de pressão ou comando elétrico.'] }
      ]
    },
    {
      titulo: 'Oxi-sanitização no ar-condicionado automotivo',
      categoria: 'Ar-condicionado Automotivo',
      tipo: 'Higienização',
      premium: true,
      imagem: '/imagens/oxi-sanitizacao-ar-condicionado.png',
      imagemAlt: 'Procedimento de oxi-sanitização no sistema de ar-condicionado automotivo',
      descricao: 'Importância da higienização do ar-condicionado para reduzir odores, impurezas e melhorar a qualidade do ar interno.',
      tempo: '9 min',
      nivel: 'Básico',
      itens: ['Higienização', 'Odor', 'Qualidade do ar', 'Evaporador e dutos'],
      blocos: [
        { titulo: 'Por que higienizar', texto: ['A oxi-sanitização ajuda a reduzir odores desagradáveis, fungos, bactérias e impurezas acumuladas no sistema de ventilação.', 'Esse procedimento melhora a qualidade do ar para os ocupantes e valoriza o serviço prestado pela oficina.'] },
        { titulo: 'Quando recomendar', lista: ['Mau cheiro ao ligar a ventilação', 'Veículo com uso intenso urbano', 'Troca de filtro de cabine com sujeira excessiva', 'Cliente com sensibilidade respiratória', 'Veículos que ficaram muito tempo parados'] },
        { titulo: 'Orientação comercial', texto: ['Explique ao cliente que higienização não é só perfume: é manutenção preventiva para o ar interno do veículo.'] }
      ]
    },
    {
      titulo: 'Funcionamento e primeiro diagnóstico do ar-condicionado',
      categoria: 'Ar-condicionado Automotivo',
      tipo: 'Guia',
      premium: true,
      imagem: '/imagens/funcionamento-ar-condicionado-automotivo.png',
      imagemAlt: 'Esquema prático de funcionamento do ar-condicionado automotivo',
      descricao: 'Visão geral do funcionamento do sistema e sequência inicial de diagnóstico antes de condenar componentes.',
      tempo: '14 min',
      nivel: 'Intermediário',
      itens: ['Compressor', 'Condensador', 'Evaporador', 'Ventilação interna'],
      blocos: [
        { titulo: 'Funcionamento básico', texto: ['O compressor pressuriza o fluido refrigerante, o condensador dissipa calor, o evaporador resfria o ar e o ventilador interno distribui esse ar para a cabine.'] },
        { titulo: 'Primeiro diagnóstico', lista: ['Confirmar a reclamação do cliente', 'Verificar se o compressor aciona', 'Verificar funcionamento do eletroventilador', 'Conferir temperatura do ar nas saídas', 'Inspecionar filtro de cabine', 'Observar ruídos, vazamentos e sinais visuais', 'Registrar os testes antes do orçamento'] },
        { titulo: 'Erro comum', texto: ['Trocar compressor ou apenas completar gás sem avaliar o funcionamento do sistema inteiro pode gerar retorno e retrabalho.'] }
      ]
    },
    {
      titulo: 'Como analisar pressões do ar-condicionado',
      categoria: 'Ar-condicionado Automotivo',
      tipo: 'Diagnóstico',
      premium: true,
      imagem: '/imagens/analise-de-pressoes-ar-condicionado.png',
      imagemAlt: 'Mecânico analisando pressões do ar-condicionado com manifold',
      descricao: 'Introdução prática para leitura de baixa e alta pressão com manifold e interpretação inicial do comportamento do sistema.',
      tempo: '15 min',
      nivel: 'Intermediário',
      itens: ['Baixa pressão', 'Alta pressão', 'Manifold', 'Interpretação inicial'],
      blocos: [
        { titulo: 'O que observar', texto: ['A leitura das pressões ajuda a entender se o sistema está trabalhando de forma coerente ou se há indícios de carga incorreta, restrição, falha de ventilação ou problema no compressor.'] },
        { titulo: 'Análise inicial', lista: ['Conectar manifold corretamente', 'Observar pressão de baixa', 'Observar pressão de alta', 'Verificar se o compressor está acionando', 'Conferir ventilação e troca térmica no condensador', 'Comparar comportamento das linhas e temperatura do ar interno'] },
        { titulo: 'Atenção', texto: ['A interpretação de pressão deve sempre ser feita com critério técnico e procedimento adequado. A leitura isolada não deve ser usada para condenar peça sem outras confirmações.'] }
      ]
    },
    {
      titulo: 'Checklist de suspensão e direção',
      categoria: 'Suspensão e Direção',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Roteiro para ruídos, folgas, desgaste irregular de pneus, amortecedores, buchas, pivôs, bieletas e terminais.',
      tempo: '13 min',
      nivel: 'Básico/Intermediário',
      itens: ['Ruídos', 'Folgas', 'Amortecedores', 'Pneus e alinhamento'],
      blocos: [
        { titulo: 'Itens de inspeção', lista: ['Confirmar ruído com teste de rodagem quando necessário', 'Verificar pneus e desgaste irregular', 'Inspecionar amortecedores e batentes', 'Verificar buchas de bandeja', 'Conferir pivôs, terminais e axiais', 'Inspecionar bieletas e barras estabilizadoras', 'Avaliar coxins e rolamentos de roda', 'Orientar alinhamento e balanceamento após reparo'] },
        { titulo: 'Orçamento', texto: ['Separe peças de segurança, mão de obra e serviços complementares. Explique ao cliente quando alinhamento, cambagem ou balanceamento forem necessários.'] }
      ]
    },
    {
      titulo: 'Freios a disco: inspeção e orçamento seguro',
      categoria: 'Freios a Disco e Tambor',
      tipo: 'Guia',
      premium: true,
      descricao: 'Como avaliar pastilhas, discos, pinças, fluido, flexíveis e sintomas como vibração, ruído e pedal baixo.',
      tempo: '14 min',
      nivel: 'Essencial',
      itens: ['Pastilhas', 'Discos', 'Pinças', 'Fluido de freio'],
      blocos: [
        { titulo: 'Inspeção recomendada', lista: ['Conferir espessura das pastilhas', 'Inspecionar discos quanto a desgaste, empeno aparente, sulcos e trincas', 'Verificar deslizamento dos pinos da pinça', 'Avaliar vazamento em flexíveis e conexões', 'Verificar nível e condição do fluido', 'Testar pedal e eficiência após reparo'] },
        { titulo: 'Comunicação com cliente', texto: ['Freio é item de segurança. Mostre evidências do desgaste e explique riscos de trocar somente uma parte quando o conjunto está comprometido.'] }
      ]
    },
    {
      titulo: 'Freio a tambor: lona, cilindro e regulagem',
      categoria: 'Freios a Disco e Tambor',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Roteiro para revisar lonas, tambores, cilindros de roda, cabo de freio de estacionamento e regulagem.',
      tempo: '12 min',
      nivel: 'Essencial',
      itens: ['Lonas', 'Cilindro de roda', 'Tambor', 'Freio de estacionamento'],
      blocos: [
        { titulo: 'Itens de inspeção', lista: ['Verificar espessura e contaminação das lonas', 'Inspecionar cilindro de roda quanto a vazamento', 'Conferir superfície interna do tambor', 'Verificar molas e travas', 'Checar regulagem automática ou manual', 'Testar cabo e alavanca do freio de estacionamento', 'Realizar teste final de frenagem'] },
        { titulo: 'Erro comum', texto: ['Trocar lona sem verificar cilindro, tambor e regulagem pode gerar retorno por pedal baixo, roda presa ou freio ineficiente.'] }
      ]
    },
    {
      titulo: 'Pneus: desgaste irregular, alinhamento e balanceamento',
      categoria: 'Pneus e Geometria',
      tipo: 'Checklist',
      premium: true,
      descricao: 'Como avaliar desgaste dos pneus, calibragem, geometria, balanceamento, rodízio e sintomas de direção puxando.',
      tempo: '12 min',
      nivel: 'Básico',
      itens: ['Calibragem', 'Desgaste irregular', 'Alinhamento', 'Balanceamento'],
      blocos: [
        { titulo: 'Itens de inspeção', lista: ['Conferir medida e aplicação correta do pneu', 'Verificar calibragem', 'Inspecionar desgaste nas bordas, centro e escamas', 'Avaliar bolhas, cortes e deformações', 'Relacionar desgaste com folgas de suspensão', 'Indicar alinhamento, balanceamento ou rodízio quando necessário'] },
        { titulo: 'Explicação ao cliente', texto: ['Pneu desgastado irregularmente geralmente é consequência de calibragem incorreta, geometria fora, folgas ou falta de rodízio. Mostre o padrão de desgaste para justificar o orçamento.'] }
      ]
    },
    {
      titulo: 'Proteção dos ocupantes: airbag e pré-tensionadores',
      categoria: 'Proteção dos Ocupantes (Airbag)',
      tipo: 'Guia de segurança',
      premium: true,
      descricao: 'Roteiro seguro para luz de airbag, conectores, cinta do airbag, pré-tensionadores e sensores de impacto.',
      tempo: '15 min',
      nivel: 'Intermediário',
      itens: ['Luz de airbag', 'Pré-tensionador', 'Cinta do airbag', 'Sensores de impacto'],
      blocos: [
        { titulo: 'Cuidados antes de mexer', lista: ['Consultar procedimento do fabricante', 'Desligar alimentação conforme orientação técnica', 'Evitar medir resistência diretamente em componentes pirotécnicos', 'Não improvisar chicote de airbag', 'Verificar conectores sob bancos e coluna de direção com segurança', 'Registrar código de falha e componente indicado'] },
        { titulo: 'Mensagem profissional', texto: ['Airbag e pré-tensionadores são sistemas de segurança. O diagnóstico deve seguir procedimento correto, sem gambiarra, emenda inadequada ou apagamento de falha sem reparo.'] }
      ]
    },
    {
      titulo: 'Sistemas ADAS: câmera, radar e calibração',
      categoria: 'Sistemas ADAS',
      tipo: 'Guia',
      premium: true,
      descricao: 'Introdução para diagnóstico e orientação sobre câmera frontal, radar, sensores, calibração e pós-reparo.',
      tempo: '17 min',
      nivel: 'Introdução/Intermediário',
      itens: ['Câmera frontal', 'Radar', 'Calibração', 'Pós-colisão'],
      blocos: [
        { titulo: 'Quando suspeitar de calibração', lista: ['Troca de para-brisa', 'Reparo de colisão dianteira', 'Troca ou remoção de para-choque', 'Alinhamento ou alteração de suspensão', 'Substituição de câmera, radar ou módulo', 'Mensagens de assistente indisponível no painel'] },
        { titulo: 'Boas práticas', texto: ['ADAS exige procedimento, equipamento e ambiente adequado. Não prometa calibração sem confirmar requisitos do fabricante e estrutura necessária.'] }
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
      titulo: 'Eletromobilidade: segurança antes de qualquer intervenção',
      categoria: 'Eletromobilidade',
      tipo: 'Guia',
      premium: true,
      descricao: 'Conteúdo introdutório sobre EPIs, identificação de alta tensão, isolamento, procedimento e limites de atuação.',
      tempo: '16 min',
      nivel: 'Introdução',
      itens: ['Alta tensão', 'EPIs', 'Isolamento', 'Procedimento seguro'],
      blocos: [
        { titulo: 'Pontos essenciais', lista: ['Identificar cabos e componentes de alta tensão', 'Não intervir sem treinamento e procedimento adequado', 'Usar EPIs e ferramentas apropriadas quando o procedimento exigir', 'Respeitar etapas de desenergização do fabricante', 'Isolar área e registrar intervenção'] },
        { titulo: 'Mensagem comercial', texto: ['A eletromobilidade aumenta a exigência técnica da oficina. Segurança e procedimento valem mais do que improviso.'] }
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
    },
    {
      titulo: 'Estudo de caso: falha intermitente de ignição',
      categoria: 'Estudos de Caso',
      tipo: 'Caso prático',
      premium: true,
      descricao: 'Exemplo de raciocínio para falha que aparece quente, em carga ou de forma intermitente.',
      tempo: '17 min',
      nivel: 'Intermediário',
      itens: ['Intermitência', 'Scanner', 'Bobina', 'Chicote'],
      blocos: [
        { titulo: 'Raciocínio', lista: ['Confirmar condição em que a falha ocorre', 'Analisar códigos e parâmetros', 'Inspecionar velas e bobinas', 'Testar chicote e conectores', 'Avaliar alimentação e aterramento', 'Registrar teste que confirmou o defeito'] },
        { titulo: 'Como vender o diagnóstico', texto: ['Falha intermitente exige tempo de teste. Informe isso ao cliente antes e documente o que foi feito.'] }
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
    'Motor e Performance': '⚙',
    'Sincronismo do Motor': '⏱',
    'Ignição e Falha de Motor': '✹',
    'Ar-condicionado Automotivo': '❄',
    'Suspensão e Direção': '◌',
    'Freios a Disco e Tambor': '◉',
    'Pneus e Geometria': '◎',
    'Proteção dos Ocupantes (Airbag)': '◈',
    'Sistemas ADAS': '◬',
    'Multímetro na Prática': '⌁',
    'Sensores e Atuadores': '◍',
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

    garantirEstilosBiblioteca();
    nav.classList.add('biblioteca-categorias-select');

    const todas = ['Todos', ...CATEGORIAS];
    const opcoes = todas.map(cat => {
      const qtd = cat === 'Todos' ? CONTEUDOS.length : CONTEUDOS.filter(c => c.categoria === cat).length;
      const selected = estado.categoria === cat ? ' selected' : '';
      return `<option value="${escaparHtml(cat)}"${selected}>${escaparHtml(cat)} (${qtd})</option>`;
    }).join('');

    nav.innerHTML = `
      <div class="biblioteca-categoria-select-card">
        <label for="biblioteca-categoria-select">Selecionar categoria</label>
        <select id="biblioteca-categoria-select" aria-label="Selecionar categoria da biblioteca">
          ${opcoes}
        </select>
        <span class="biblioteca-categoria-select-ajuda">Escolha uma categoria para filtrar os conteúdos técnicos.</span>
      </div>`;

    const select = document.getElementById('biblioteca-categoria-select');
    if (select) {
      select.addEventListener('change', () => {
        estado.categoria = select.value || 'Todos';
        renderizarCategorias();
        renderizarCards();
      });
    }
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
      const imagemCard = item.imagem ? `
        <div class="biblioteca-card-imagem-wrap">
          <img class="biblioteca-card-imagem" src="${escaparHtml(item.imagem)}" alt="${escaparHtml(item.imagemAlt || item.titulo)}" loading="lazy">
        </div>` : '';

      return `
        <article class="biblioteca-card" data-slug="${escaparHtml(slug)}" data-bloqueado="${bloqueado ? 'true' : 'false'}" data-categoria="${escaparHtml(item.categoria)}">
          <div class="biblioteca-card-topo">
            <div class="biblioteca-icone" aria-hidden="true">${escaparHtml(icones[item.categoria] || '◆')}</div>
            <div class="biblioteca-badges">
              <span class="biblioteca-badge tipo">${escaparHtml(item.tipo)}</span>
              ${badgeAcesso}
            </div>
          </div>
          ${imagemCard}
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

  function renderizarImagemModal(item) {
    if (!item?.imagem) return '';
    return `
      <section class="biblioteca-modal-imagem-wrap" data-categoria="${escaparHtml(item.categoria)}">
        <img class="biblioteca-modal-imagem" src="${escaparHtml(item.imagem)}" alt="${escaparHtml(item.imagemAlt || item.titulo)}">
      </section>`;
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
      ${renderizarImagemModal(item)}
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
      ${renderizarImagemModal(item)}
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
