import {
  QuestionBankItem,
  QuestionDifficulty,
  QuestionOption,
} from '../../domain/practice/types';

type QuestionSeedInput = {
  subject: string;
  topic: string;
  statement: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  estimatedTimeSeconds?: number;
};

function buildOptions(values: QuestionSeedInput['options']): QuestionOption[] {
  return values.map((text, index) => ({
    id: `option-${index + 1}`,
    text,
  }));
}

function createQuestion(id: string, input: QuestionSeedInput): QuestionBankItem {
  const options = buildOptions(input.options);

  return {
    id,
    questionId: id,
    subject: input.subject,
    topic: input.topic,
    statement: input.statement,
    options,
    correctOptionId: options[input.correctIndex].id,
    explanation: input.explanation,
    difficulty: input.difficulty,
    tags: input.tags,
    estimatedTimeSeconds: input.estimatedTimeSeconds ?? 90,
  };
}

export const questionBankSeed: QuestionBankItem[] = [
  createQuestion('pt-001', {
    subject: 'Portugues',
    topic: 'Interpretacao de texto',
    statement: 'Em um texto argumentativo, a tese corresponde a que elemento principal?',
    options: [
      'Ao assunto geral abordado sem posicionamento.',
      'Ao ponto de vista defendido pelo autor.',
      'A lista de exemplos usada no desenvolvimento.',
      'Ao titulo escolhido para o texto.',
    ],
    correctIndex: 1,
    explanation:
      'A tese e a ideia central que o autor procura sustentar ao longo do texto.',
    difficulty: 'easy',
    tags: ['leitura', 'argumentacao', 'tese'],
  }),
  createQuestion('pt-002', {
    subject: 'Portugues',
    topic: 'Concordancia verbal',
    statement: 'Assinale a frase com concordancia verbal correta.',
    options: [
      'Faltou documentos na reuniao.',
      'Existe varios caminhos para o problema.',
      'Chegaram os relatarios solicitados.',
      'Haviaam sinais de melhora no setor.',
    ],
    correctIndex: 2,
    explanation:
      'O verbo concorda com o sujeito posposto em "Chegaram os relatorios solicitados".',
    difficulty: 'medium',
    tags: ['concordancia', 'gramatica'],
  }),
  createQuestion('pt-003', {
    subject: 'Portugues',
    topic: 'Crase',
    statement: 'Em qual alternativa o uso da crase esta correto?',
    options: [
      'O servidor foi a reuniao ordinaria.',
      'A gestora se referiu a aquelas normas.',
      'A equipe retornou a sala principal.',
      'O parecer foi entregue as 10 horas.',
    ],
    correctIndex: 3,
    explanation:
      'Ha crase antes de locucao adverbial feminina de tempo: "as 10 horas".',
    difficulty: 'medium',
    tags: ['crase', 'gramatica'],
  }),
  createQuestion('pt-004', {
    subject: 'Portugues',
    topic: 'Pontuacao',
    statement: 'Qual frase esta corretamente pontuada?',
    options: [
      'Os candidatos que estudaram passaram.',
      'Os candidatos, que estudaram passaram.',
      'Os candidatos que estudaram, passaram.',
      'Os candidatos, que estudaram, passaram.',
    ],
    correctIndex: 0,
    explanation:
      'Sem virgulas, a oracao adjetiva e restritiva e mantem o sentido pretendido.',
    difficulty: 'medium',
    tags: ['pontuacao', 'oracoes'],
  }),
  createQuestion('pt-005', {
    subject: 'Portugues',
    topic: 'Regencia verbal',
    statement: 'Assinale a alternativa correta quanto a regencia.',
    options: [
      'O aluno assistiu o filme recomendado.',
      'O fiscal assistiu ao procedimento final.',
      'Todos preferem mais estabilidade do que pressa.',
      'O gestor aspirava um cargo tecnico.',
    ],
    correctIndex: 1,
    explanation:
      'No sentido de ver, o verbo assistir exige preposicao "a": assistir ao procedimento.',
    difficulty: 'medium',
    tags: ['regencia', 'verbos'],
  }),
  createQuestion('pt-006', {
    subject: 'Portugues',
    topic: 'Semantica',
    statement: 'A palavra "manga" em "a manga da camisa rasgou" exemplifica qual fenomeno?',
    options: ['Sinonimia', 'Antonimia', 'Paronimia', 'Polissemia'],
    correctIndex: 3,
    explanation:
      'A mesma palavra pode ter sentidos diferentes conforme o contexto, caracterizando polissemia.',
    difficulty: 'easy',
    tags: ['semantica', 'polissemia'],
  }),
  createQuestion('pt-007', {
    subject: 'Portugues',
    topic: 'Coesao textual',
    statement: 'O conectivo "portanto" costuma introduzir ideia de:',
    options: ['Causa', 'Conclusao', 'Concessao', 'Comparacao'],
    correctIndex: 1,
    explanation: '"Portanto" e conectivo conclusivo.',
    difficulty: 'easy',
    tags: ['coesao', 'conectivos'],
  }),
  createQuestion('pt-008', {
    subject: 'Portugues',
    topic: 'Classes de palavras',
    statement: 'Na frase "Ele chegou muito cedo", a palavra "muito" exerce funcao de:',
    options: ['Substantivo', 'Adjetivo', 'Adverbio', 'Pronome'],
    correctIndex: 2,
    explanation:
      '"Muito" intensifica o adverbio "cedo", logo funciona como adverbio.',
    difficulty: 'easy',
    tags: ['morfologia', 'adverbio'],
  }),
  createQuestion('math-001', {
    subject: 'Matematica',
    topic: 'Porcentagem',
    statement: 'Um produto de R$ 200 recebeu desconto de 15%. Qual e o preco final?',
    options: ['R$ 150', 'R$ 160', 'R$ 170', 'R$ 185'],
    correctIndex: 2,
    explanation: '15% de 200 e 30. Logo, 200 - 30 = 170.',
    difficulty: 'easy',
    tags: ['porcentagem', 'aritmetica'],
  }),
  createQuestion('math-002', {
    subject: 'Matematica',
    topic: 'Razao e proporcao',
    statement: 'Se 3 cadernos custam R$ 24, mantendo a proporcao, 5 cadernos custarao:',
    options: ['R$ 32', 'R$ 36', 'R$ 40', 'R$ 45'],
    correctIndex: 2,
    explanation: 'Cada caderno custa 8 reais. Entao 5 custam 40 reais.',
    difficulty: 'easy',
    tags: ['proporcao', 'razao'],
  }),
  createQuestion('math-003', {
    subject: 'Matematica',
    topic: 'Media aritmetica',
    statement: 'A media aritmetica de 6, 8, 10 e 12 e igual a:',
    options: ['8', '9', '10', '11'],
    correctIndex: 1,
    explanation: 'A soma e 36. Dividindo por 4, a media e 9.',
    difficulty: 'easy',
    tags: ['media', 'aritmetica'],
  }),
  createQuestion('math-004', {
    subject: 'Matematica',
    topic: 'Equacao do primeiro grau',
    statement: 'Qual o valor de x em 3x - 5 = 16?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    explanation: '3x = 21, portanto x = 7.',
    difficulty: 'easy',
    tags: ['equacao', 'algebra'],
  }),
  createQuestion('math-005', {
    subject: 'Matematica',
    topic: 'Juros simples',
    statement: 'Aplicacao de R$ 1.000 a juros simples de 2% ao mes por 3 meses gera montante de:',
    options: ['R$ 1.020', 'R$ 1.040', 'R$ 1.060', 'R$ 1.080'],
    correctIndex: 2,
    explanation:
      'Juros simples: 1000 x 0,02 x 3 = 60. Montante = 1060.',
    difficulty: 'medium',
    tags: ['juros', 'financeira'],
  }),
  createQuestion('math-006', {
    subject: 'Matematica',
    topic: 'Geometria plana',
    statement: 'A area de um retangulo com base 8 e altura 5 e:',
    options: ['13', '26', '40', '80'],
    correctIndex: 2,
    explanation: 'Area do retangulo = base x altura = 8 x 5 = 40.',
    difficulty: 'easy',
    tags: ['geometria', 'area'],
  }),
  createQuestion('math-007', {
    subject: 'Matematica',
    topic: 'Fracoes',
    statement: 'A soma de 1/4 com 1/2 e igual a:',
    options: ['2/4', '3/4', '4/6', '5/8'],
    correctIndex: 1,
    explanation: '1/2 equivale a 2/4. Logo, 1/4 + 2/4 = 3/4.',
    difficulty: 'easy',
    tags: ['fracoes', 'aritmetica'],
  }),
  createQuestion('math-008', {
    subject: 'Matematica',
    topic: 'Analise combinatoria',
    statement: 'Quantos anagramas diferentes podem ser formados com a palavra SOL?',
    options: ['3', '4', '6', '9'],
    correctIndex: 2,
    explanation: 'Sao 3 letras distintas. Logo, 3! = 6 anagramas.',
    difficulty: 'medium',
    tags: ['combinatoria', 'anagramas'],
  }),
  createQuestion('adm-001', {
    subject: 'Direito Administrativo',
    topic: 'Principios administrativos',
    statement: 'O principio da legalidade, na administracao publica, significa que o agente:',
    options: [
      'Pode fazer tudo o que a lei nao proibe.',
      'So pode agir conforme autorizacao legal.',
      'Pode inovar para atender ao interesse publico.',
      'Age segundo a propria conviccao tecnica.',
    ],
    correctIndex: 1,
    explanation:
      'Na administracao publica, a legalidade exige previsao ou autorizacao legal para agir.',
    difficulty: 'easy',
    tags: ['principios', 'legalidade'],
  }),
  createQuestion('adm-002', {
    subject: 'Direito Administrativo',
    topic: 'Atos administrativos',
    statement: 'Qual atributo do ato administrativo permite sua execucao direta pela administracao em certos casos?',
    options: ['Presuncao de legitimidade', 'Autoexecutoriedade', 'Tipicidade', 'Competencia'],
    correctIndex: 1,
    explanation:
      'A autoexecutoriedade possibilita executar o ato sem necessidade de previa ordem judicial, quando cabivel.',
    difficulty: 'medium',
    tags: ['atos administrativos', 'atributos'],
  }),
  createQuestion('adm-003', {
    subject: 'Direito Administrativo',
    topic: 'Poderes administrativos',
    statement: 'O poder disciplinar permite a administracao:',
    options: [
      'Editar leis complementares.',
      'Aplicar sancoes a agentes e particulares com vinculo juridico especial.',
      'Interferir livremente em qualquer atividade privada.',
      'Julgar crimes contra a administracao.',
    ],
    correctIndex: 1,
    explanation:
      'O poder disciplinar incide sobre servidores e particulares sujeitos a especial sujeicao.',
    difficulty: 'easy',
    tags: ['poder disciplinar', 'agentes publicos'],
  }),
  createQuestion('adm-004', {
    subject: 'Direito Administrativo',
    topic: 'Licitações',
    statement: 'A licitacao tem como um de seus objetivos:',
    options: [
      'Viabilizar favorecimentos discricionarios.',
      'Garantir isonomia entre os interessados.',
      'Eliminar o controle sobre contratacoes.',
      'Substituir a motivacao do ato administrativo.',
    ],
    correctIndex: 1,
    explanation:
      'A licitacao busca selecao da proposta mais vantajosa com isonomia entre os participantes.',
    difficulty: 'easy',
    tags: ['licitacoes', 'isonomia'],
  }),
  createQuestion('adm-005', {
    subject: 'Direito Administrativo',
    topic: 'Responsabilidade civil do Estado',
    statement: 'A responsabilidade civil objetiva do Estado, em regra, exige prova de:',
    options: [
      'Dolo do agente publico.',
      'Culpa grave da vitima.',
      'Dano e nexo causal.',
      'Sentenca penal condenatoria.',
    ],
    correctIndex: 2,
    explanation:
      'Pela teoria do risco administrativo, basta demonstrar dano e nexo causal, ressalvadas excludentes.',
    difficulty: 'medium',
    tags: ['responsabilidade civil', 'estado'],
  }),
  createQuestion('adm-006', {
    subject: 'Direito Administrativo',
    topic: 'Servicos publicos',
    statement: 'A delegacao de servico publico por contrato e feita, em regra, por meio de:',
    options: ['Permissao e concessao', 'Portaria e resolucao', 'Tombamento e desapropriacao', 'Consulta e audiencia'],
    correctIndex: 0,
    explanation:
      'A prestacao indireta ocorre principalmente por concessao ou permissao, observados os requisitos legais.',
    difficulty: 'medium',
    tags: ['servicos publicos', 'concessao'],
  }),
  createQuestion('adm-007', {
    subject: 'Direito Administrativo',
    topic: 'Agentes publicos',
    statement: 'Os cargos publicos sao criados, em regra, por:',
    options: ['Decreto autonomo', 'Lei', 'Portaria ministerial', 'Contrato administrativo'],
    correctIndex: 1,
    explanation: 'A criacao de cargos depende de lei.',
    difficulty: 'easy',
    tags: ['agentes publicos', 'cargos'],
  }),
  createQuestion('adm-008', {
    subject: 'Direito Administrativo',
    topic: 'Controle da administracao',
    statement: 'O controle exercido pela propria administracao sobre seus atos e chamado de:',
    options: ['Controle externo', 'Controle legislativo', 'Autotutela', 'Tutela jurisdicional'],
    correctIndex: 2,
    explanation:
      'Autotutela e o poder-dever de rever atos ilegais ou inconvenientes nos limites legais.',
    difficulty: 'easy',
    tags: ['controle', 'autotutela'],
  }),
  createQuestion('const-001', {
    subject: 'Direito Constitucional',
    topic: 'Direitos fundamentais',
    statement: 'Os direitos e garantias fundamentais previstos na Constituicao possuem aplicacao:',
    options: ['Somente apos regulamentacao legal', 'Imediata', 'Exclusivamente judicial', 'Apenas para brasileiros natos'],
    correctIndex: 1,
    explanation:
      'A Constituicao estabelece aplicacao imediata das normas definidoras de direitos e garantias fundamentais.',
    difficulty: 'easy',
    tags: ['direitos fundamentais', 'constituicao'],
  }),
  createQuestion('const-002', {
    subject: 'Direito Constitucional',
    topic: 'Poderes da Republica',
    statement: 'A separacao dos Poderes busca principalmente:',
    options: [
      'Concentrar funcoes no Executivo.',
      'Eliminar o controle reciproco entre orgaos.',
      'Evitar abusos por meio de freios e contrapesos.',
      'Subordinar o Judiciario ao Legislativo.',
    ],
    correctIndex: 2,
    explanation:
      'A divisao funcional com checks and balances limita abusos e preserva o equilibrio institucional.',
    difficulty: 'easy',
    tags: ['poderes', 'freios e contrapesos'],
  }),
  createQuestion('const-003', {
    subject: 'Direito Constitucional',
    topic: 'Controle de constitucionalidade',
    statement: 'No controle difuso de constitucionalidade, a analise ocorre:',
    options: [
      'Em caso concreto submetido ao Judiciario.',
      'Somente pelo Supremo em abstrato.',
      'Apenas pelo Legislativo antes da lei.',
      'Exclusivamente por acao direta.',
    ],
    correctIndex: 0,
    explanation:
      'O controle difuso nasce em um caso concreto, no julgamento de uma controverisa judicial.',
    difficulty: 'medium',
    tags: ['controle de constitucionalidade', 'difuso'],
  }),
  createQuestion('const-004', {
    subject: 'Direito Constitucional',
    topic: 'Remedios constitucionais',
    statement: 'O habeas data serve para:',
    options: [
      'Proteger locomocao ameacada.',
      'Assegurar acesso e retificacao de dados pessoais.',
      'Corrigir ilegalidade sem direito liquido e certo.',
      'Punir autoridade que descumpre ordem judicial.',
    ],
    correctIndex: 1,
    explanation:
      'Habeas data garante conhecimento e correcao de informacoes pessoais em registros.',
    difficulty: 'medium',
    tags: ['remedios constitucionais', 'habeas data'],
  }),
  createQuestion('const-005', {
    subject: 'Direito Constitucional',
    topic: 'Administracao publica',
    statement: 'A investidura em cargo ou emprego publico depende, em regra, de:',
    options: ['Escolha discricionaria da autoridade', 'Concurso publico', 'Apenas prova de titulos', 'Indicacao politica'],
    correctIndex: 1,
    explanation:
      'A regra constitucional e o concurso publico, ressalvadas as excecoes previstas.',
    difficulty: 'easy',
    tags: ['administracao publica', 'concurso'],
  }),
  createQuestion('const-006', {
    subject: 'Direito Constitucional',
    topic: 'Federalismo',
    statement: 'A Republica Federativa do Brasil e formada pela uniao indissoluvel de:',
    options: [
      'Estados, Municipios e Distrito Federal apenas.',
      'Uniao, Estados, Distrito Federal e Municipios.',
      'Uniao e Territorios apenas.',
      'Estados e Regioes administrativas.',
    ],
    correctIndex: 1,
    explanation:
      'O art. 1o menciona expressamente Uniao, Estados, Distrito Federal e Municipios.',
    difficulty: 'easy',
    tags: ['federalismo', 'organizacao do estado'],
  }),
  createQuestion('const-007', {
    subject: 'Direito Constitucional',
    topic: 'Nacionalidade',
    statement: 'Brasileiro naturalizado e, em regra, aquele que:',
    options: [
      'Nasce em territorio nacional.',
      'Adquire nacionalidade brasileira na forma da lei.',
      'Reside no Brasil por mais de cinco anos automaticamente.',
      'Tem pai brasileiro, independentemente de qualquer requisito.',
    ],
    correctIndex: 1,
    explanation:
      'A naturalizacao depende de requisitos e procedimento definidos em lei.',
    difficulty: 'medium',
    tags: ['nacionalidade', 'brasileiros'],
  }),
  createQuestion('const-008', {
    subject: 'Direito Constitucional',
    topic: 'Direitos politicos',
    statement: 'O voto no Brasil e, em regra,',
    options: ['Aberto e facultativo', 'Secreto e obrigatorio', 'Censitario e direto', 'Indireto e universal'],
    correctIndex: 1,
    explanation:
      'A Constituicao preve voto direto e secreto, com valor igual para todos, sendo obrigatorio nos casos previstos.',
    difficulty: 'easy',
    tags: ['direitos politicos', 'voto'],
  }),
  createQuestion('logic-001', {
    subject: 'Raciocinio Logico',
    topic: 'Proposicoes',
    statement: 'Qual das frases abaixo e uma proposicao logica?',
    options: [
      'Feche a porta, por favor.',
      'Que horas sao agora?',
      'Brasilia e a capital do Brasil.',
      'Tomara que chova hoje.',
    ],
    correctIndex: 2,
    explanation:
      'Proposicao e enunciado declarativo que pode ser classificado como verdadeiro ou falso.',
    difficulty: 'easy',
    tags: ['proposicoes', 'logica basica'],
  }),
  createQuestion('logic-002', {
    subject: 'Raciocinio Logico',
    topic: 'Conectivos',
    statement: 'A negacao da proposicao "Pedro estuda e trabalha" e:',
    options: [
      'Pedro nao estuda e nao trabalha.',
      'Pedro nao estuda ou nao trabalha.',
      'Pedro estuda ou nao trabalha.',
      'Pedro nao estuda ou trabalha.',
    ],
    correctIndex: 1,
    explanation:
      'A negacao de uma conjuncao segue De Morgan: nao p ou nao q.',
    difficulty: 'medium',
    tags: ['negacao', 'conectivos'],
  }),
  createQuestion('logic-003', {
    subject: 'Raciocinio Logico',
    topic: 'Condicional',
    statement: 'Na proposicao "Se estudo, entao passo", a unica situacao que a torna falsa e:',
    options: [
      'Estudo e passo.',
      'Nao estudo e passo.',
      'Nao estudo e nao passo.',
      'Estudo e nao passo.',
    ],
    correctIndex: 3,
    explanation:
      'A implicacao so e falsa quando antecedente verdadeiro leva a consequente falso.',
    difficulty: 'medium',
    tags: ['condicional', 'tabela verdade'],
  }),
  createQuestion('logic-004', {
    subject: 'Raciocinio Logico',
    topic: 'Equivalencias',
    statement: 'A proposicao "Nao (p ou q)" e equivalente a:',
    options: ['Nao p e nao q', 'Nao p ou nao q', 'p e q', 'p ou nao q'],
    correctIndex: 0,
    explanation:
      'Pela lei de De Morgan, a negacao da disjuncao vira conjuncao das negacoes.',
    difficulty: 'medium',
    tags: ['equivalencias', 'de morgan'],
  }),
  createQuestion('logic-005', {
    subject: 'Raciocinio Logico',
    topic: 'Sequencias',
    statement: 'Na sequencia 2, 4, 8, 16, o proximo termo e:',
    options: ['18', '24', '30', '32'],
    correctIndex: 3,
    explanation: 'A sequencia dobra a cada passo. Depois de 16 vem 32.',
    difficulty: 'easy',
    tags: ['sequencias', 'padroes'],
  }),
  createQuestion('logic-006', {
    subject: 'Raciocinio Logico',
    topic: 'Argumentacao',
    statement: 'Se todo servidor e pontual e Ana e servidora, conclui-se logicamente que:',
    options: [
      'Ana pode nao ser pontual.',
      'Ana e pontual.',
      'Nenhum servidor e pontual.',
      'Todo pontual e servidor.',
    ],
    correctIndex: 1,
    explanation:
      'Da universal afirmativa somada ao caso particular, conclui-se que Ana e pontual.',
    difficulty: 'easy',
    tags: ['argumentacao', 'silogismo'],
  }),
  createQuestion('logic-007', {
    subject: 'Raciocinio Logico',
    topic: 'Quantificadores',
    statement: 'A negacao de "Todos os candidatos estudaram" e:',
    options: [
      'Nenhum candidato estudou.',
      'Todos os candidatos nao estudaram.',
      'Pelo menos um candidato nao estudou.',
      'Pelo menos um candidato estudou.',
    ],
    correctIndex: 2,
    explanation:
      'Negar "todos" produz "existe pelo menos um ... nao".',
    difficulty: 'medium',
    tags: ['quantificadores', 'negacao'],
  }),
  createQuestion('logic-008', {
    subject: 'Raciocinio Logico',
    topic: 'Diagramas logicos',
    statement: 'Se todo A e B, entao e correto afirmar que:',
    options: [
      'Todo B e A.',
      'Algum B nao e A.',
      'O conjunto A esta contido em B.',
      'A e B sao conjuntos disjuntos.',
    ],
    correctIndex: 2,
    explanation: 'Se todo A e B, entao A e subconjunto de B.',
    difficulty: 'easy',
    tags: ['conjuntos', 'diagramas'],
  }),
  createQuestion('info-001', {
    subject: 'Informatica',
    topic: 'Hardware',
    statement: 'Qual componente e responsavel pelo processamento central do computador?',
    options: ['SSD', 'Memoria RAM', 'CPU', 'Monitor'],
    correctIndex: 2,
    explanation: 'A CPU executa instrucoes e coordena o processamento.',
    difficulty: 'easy',
    tags: ['hardware', 'cpu'],
  }),
  createQuestion('info-002', {
    subject: 'Informatica',
    topic: 'Sistemas operacionais',
    statement: 'No Windows, a Lixeira serve para:',
    options: [
      'Armazenar arquivos permanentemente.',
      'Executar backup automatico.',
      'Guardar temporariamente arquivos excluidos.',
      'Compactar pastas do sistema.',
    ],
    correctIndex: 2,
    explanation:
      'Arquivos apagados geralmente vao primeiro para a Lixeira, permitindo restauracao.',
    difficulty: 'easy',
    tags: ['windows', 'arquivos'],
  }),
  createQuestion('info-003', {
    subject: 'Informatica',
    topic: 'Internet',
    statement: 'HTTP e um protocolo associado principalmente a:',
    options: [
      'Transferencia de paginas web.',
      'Envio de arquivos por bluetooth.',
      'Gerenciamento de impressoras.',
      'Criptografia de discos locais.',
    ],
    correctIndex: 0,
    explanation: 'HTTP e o protocolo de transferencia usado na navegacao web.',
    difficulty: 'easy',
    tags: ['internet', 'protocolos'],
  }),
  createQuestion('info-004', {
    subject: 'Informatica',
    topic: 'Seguranca da informacao',
    statement: 'Phishing e uma tecnica usada para:',
    options: [
      'Melhorar a velocidade da rede.',
      'Enganar o usuario para obter dados sensiveis.',
      'Compactar arquivos em nuvem.',
      'Apagar virus automaticamente.',
    ],
    correctIndex: 1,
    explanation:
      'Phishing tenta capturar senhas e dados por meio de mensagens ou paginas falsas.',
    difficulty: 'easy',
    tags: ['seguranca', 'phishing'],
  }),
  createQuestion('info-005', {
    subject: 'Informatica',
    topic: 'Pacote Office',
    statement: 'No Excel, uma formula sempre deve comecar com:',
    options: ['#', '=', '@', '$'],
    correctIndex: 1,
    explanation: 'Formulas no Excel comecam pelo sinal de igual.',
    difficulty: 'easy',
    tags: ['excel', 'formulas'],
  }),
  createQuestion('info-006', {
    subject: 'Informatica',
    topic: 'Redes',
    statement: 'Um roteador tem como funcao principal:',
    options: [
      'Projetar imagens na tela.',
      'Interligar redes e encaminhar pacotes.',
      'Substituir a memoria RAM.',
      'Editar planilhas eletronicamente.',
    ],
    correctIndex: 1,
    explanation:
      'Roteadores conectam redes distintas e definem caminhos para os pacotes.',
    difficulty: 'medium',
    tags: ['redes', 'roteador'],
  }),
  createQuestion('info-007', {
    subject: 'Informatica',
    topic: 'Armazenamento',
    statement: 'Qual unidade normalmente oferece acesso mais rapido aos dados?',
    options: ['HD mecanico', 'Pendrive USB 2.0', 'SSD', 'DVD'],
    correctIndex: 2,
    explanation:
      'O SSD utiliza memoria flash e costuma ter leitura e escrita mais rapidas que HDs mecanicos.',
    difficulty: 'easy',
    tags: ['armazenamento', 'ssd'],
  }),
  createQuestion('info-008', {
    subject: 'Informatica',
    topic: 'Correio eletronico',
    statement: 'O campo CCO em um email permite:',
    options: [
      'Enviar sem assunto.',
      'Ocultar destinatarios de outros destinatarios.',
      'Bloquear anexos automaticamente.',
      'Assinar digitalmente a mensagem.',
    ],
    correctIndex: 1,
    explanation:
      'CCO adiciona destinatarios ocultos, nao visiveis para os demais.',
    difficulty: 'easy',
    tags: ['email', 'cco'],
  }),
  createQuestion('pt-009', {
    subject: 'Portugues',
    topic: 'Ortografia oficial',
    statement: 'Assinale a palavra grafada corretamente segundo a ortografia oficial.',
    options: ['Excessao', 'Excecao', 'Excessaoo', 'Excecssao'],
    correctIndex: 1,
    explanation: 'A grafia correta e "excecao".',
    difficulty: 'easy',
    tags: ['ortografia', 'grafia'],
  }),
  createQuestion('math-009', {
    subject: 'Matematica',
    topic: 'Probabilidade',
    statement: 'Ao lancar um dado honesto de seis faces, a probabilidade de sair numero par e:',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctIndex: 2,
    explanation:
      'Os resultados pares sao 2, 4 e 6: 3 casos favoraveis em 6 possiveis.',
    difficulty: 'easy',
    tags: ['probabilidade', 'dados'],
  }),
  createQuestion('pt-010', {
    subject: 'Portugues',
    topic: 'Colocacao pronominal',
    statement: 'Assinale a alternativa em que a colocacao pronominal esta correta na norma-padrao.',
    options: [
      'Me disseram a verdade ontem.',
      'Disseram-me a verdade ontem.',
      'Jamais disseram-me isso.',
      'Nao falaram-me do assunto.',
    ],
    correctIndex: 1,
    explanation:
      'Na norma-padrao, a enclise em "Disseram-me" e correta. Com palavra atrativa, como "nao" e "jamais", seria obrigatoria a proclise.',
    difficulty: 'medium',
    tags: ['colocacao pronominal', 'gramatica'],
  }),
  createQuestion('math-010', {
    subject: 'Matematica',
    topic: 'Regra de tres simples',
    statement: 'Se 4 servidores analisam 120 processos em um dia, mantendo o mesmo rendimento, 6 servidores analisam quantos processos?',
    options: ['150', '160', '180', '200'],
    correctIndex: 2,
    explanation:
      'A relacao e diretamente proporcional: 120 x 6 / 4 = 180.',
    difficulty: 'medium',
    tags: ['regra de tres', 'proporcao'],
  }),
  createQuestion('adm-009', {
    subject: 'Direito Administrativo',
    topic: 'Atos administrativos',
    statement: 'A anulacao de um ato administrativo decorre, em regra, de:',
    options: [
      'Conveniencia administrativa.',
      'Mudanca de governo.',
      'Ilegalidade.',
      'Decurso de prazo prescricional.',
    ],
    correctIndex: 2,
    explanation:
      'A anulacao afasta ato ilegal. A revogacao, por sua vez, se liga a conveniencia e oportunidade.',
    difficulty: 'medium',
    tags: ['atos administrativos', 'anulacao'],
  }),
  createQuestion('adm-010', {
    subject: 'Direito Administrativo',
    topic: 'Bens publicos',
    statement: 'Os bens publicos de uso comum do povo incluem:',
    options: [
      'Predios de reparticoes publicas.',
      'Pracas e ruas.',
      'Veiculos oficiais.',
      'Materiais de almoxarifado.',
    ],
    correctIndex: 1,
    explanation:
      'Pracas, ruas e mares sao exemplos classicos de bens de uso comum do povo.',
    difficulty: 'easy',
    tags: ['bens publicos', 'classificacao'],
  }),
  createQuestion('const-009', {
    subject: 'Direito Constitucional',
    topic: 'Remedios constitucionais',
    statement: 'O mandado de seguranca protege direito:',
    options: [
      'Difuso sem prova pre-constituida.',
      'Liquido e certo, nao amparado por habeas corpus ou habeas data.',
      'De locomocao exclusivamente.',
      'Coletivo por meio de acao popular.',
    ],
    correctIndex: 1,
    explanation:
      'Mandado de seguranca tutela direito liquido e certo, desde que nao caiba habeas corpus ou habeas data.',
    difficulty: 'medium',
    tags: ['mandado de seguranca', 'remedios constitucionais'],
  }),
  createQuestion('const-010', {
    subject: 'Direito Constitucional',
    topic: 'Direitos sociais',
    statement: 'Entre os direitos sociais previstos na Constituicao esta:',
    options: ['Sigilo de correspondencia', 'Saude', 'Nacionalidade', 'Separacao dos Poderes'],
    correctIndex: 1,
    explanation:
      'A saude integra o rol de direitos sociais ao lado de educacao, trabalho, moradia e outros.',
    difficulty: 'easy',
    tags: ['direitos sociais', 'saude'],
  }),
  createQuestion('logic-009', {
    subject: 'Raciocinio Logico',
    topic: 'Bicondicional',
    statement: 'A proposicao "p se, e somente se, q" e verdadeira quando:',
    options: [
      'p e q possuem valores lógicos diferentes.',
      'p e q sao ambas verdadeiras ou ambas falsas.',
      'p e verdadeira e q falsa.',
      'p e falsa e q verdadeira.',
    ],
    correctIndex: 1,
    explanation:
      'O bicondicional e verdadeiro quando as proposicoes possuem o mesmo valor logico.',
    difficulty: 'medium',
    tags: ['bicondicional', 'tabela verdade'],
  }),
  createQuestion('logic-010', {
    subject: 'Raciocinio Logico',
    topic: 'Disjuncao',
    statement: 'A proposicao "p ou q" sera falsa apenas quando:',
    options: [
      'p for verdadeira.',
      'q for verdadeira.',
      'p e q forem falsas.',
      'p e q forem verdadeiras.',
    ],
    correctIndex: 2,
    explanation:
      'A disjuncao inclusiva so e falsa quando ambas as proposicoes sao falsas.',
    difficulty: 'easy',
    tags: ['disjuncao', 'conectivos'],
  }),
  createQuestion('info-009', {
    subject: 'Informatica',
    topic: 'Seguranca da informacao',
    statement: 'Backup tem como objetivo principal:',
    options: [
      'Aumentar a resolucao do monitor.',
      'Garantir copia de seguranca para recuperacao de dados.',
      'Excluir arquivos duplicados automaticamente.',
      'Bloquear acesso a sites externos.',
    ],
    correctIndex: 1,
    explanation:
      'Backup cria copia de seguranca para restauracao em caso de perda, falha ou incidente.',
    difficulty: 'easy',
    tags: ['backup', 'seguranca'],
  }),
  createQuestion('info-010', {
    subject: 'Informatica',
    topic: 'Navegadores',
    statement: 'Cookies em navegadores sao usados, entre outras finalidades, para:',
    options: [
      'Substituir antivirus do sistema.',
      'Armazenar pequenas informacoes de sessao e preferencia.',
      'Aumentar a memoria fisica do computador.',
      'Converter paginas em arquivos PDF automaticamente.',
    ],
    correctIndex: 1,
    explanation:
      'Cookies guardam pequenos dados da navegacao, como identificacao de sessao e preferencias.',
    difficulty: 'easy',
    tags: ['navegadores', 'cookies'],
  }),
];

export const QUESTION_BANK_SUBJECTS = Array.from(
  new Set(questionBankSeed.map((item) => item.subject))
).sort((a, b) => a.localeCompare(b));
