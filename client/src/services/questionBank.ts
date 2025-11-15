import { QuizQuestion } from '../types';

export const ALL_QUESTIONS: QuizQuestion[] = [
  // Foco (20 perguntas)
  { id: 1, dimension: "Foco", text: "Eu organizo minhas tarefas com clareza de prioridade." },
  { id: 2, dimension: "Foco", text: "Consigo manter o foco em objetivos de longo prazo sem me desviar." },
  { id: 3, dimension: "Foco", text: "Minimizo facilmente as distrações (e.g., notificações, conversas) quando preciso me concentrar." },
  { id: 4, dimension: "Foco", text: "Planejo meu dia ou semana de forma estruturada para maximizar minha eficiência." },
  { id: 5, dimension: "Foco", text: "Tenho o hábito de revisar periodicamente o andamento dos meus objetivos." },
  { id: 6, dimension: "Foco", text: "Sou disciplinado para seguir rotinas que favorecem meu desempenho." },
  { id: 7, dimension: "Foco", text: "Sei diferenciar tarefas urgentes de tarefas importantes e priorizo as segundas." },
  { id: 8, dimension: "Foco", text: "Tenho clareza sobre quais são meus principais objetivos profissionais no momento." },
  { id: 9, dimension: "Foco", text: "Dedico tempo para me manter atualizado sobre as tendências e conhecimentos da minha área." },
  { id: 10, dimension: "Foco", text: "Quando interrompido, consigo retomar minha linha de raciocínio rapidamente." },
  { id: 11, dimension: "Foco", text: "Prefiro trabalhar em uma tarefa de cada vez (monotarefa) em vez de várias ao mesmo tempo (multitarefa)." },
  { id: 12, dimension: "Foco", text: "Estabeleço metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais) para meus projetos." },
  { id: 13, dimension: "Foco", text: "Utilizo ferramentas ou técnicas, como listas de tarefas, para gerenciar meu trabalho." },
  { id: 14, dimension: "Foco", text: "Finalizo o que começo, evitando deixar tarefas importantes inacabadas." },
  { id: 15, dimension: "Foco", text: "Aloco blocos de tempo específicos na minha agenda para trabalho focado e ininterrupto." },
  { id: 16, dimension: "Foco", text: "Sou capaz de dizer 'não' a pedidos que possam comprometer minhas prioridades." },
  { id: 17, dimension: "Foco", text: "Meu espaço de trabalho, seja físico ou digital, é organizado para minimizar distrações." },
  { id: 18, dimension: "Foco", text: "Antes de iniciar um projeto, eu defino claramente o que significa 'concluído'." },
  { id: 19, dimension: "Foco", text: "Faço pausas estratégicas para recarregar minha energia mental e manter o foco." },
  { id: 20, dimension: "Foco", text: "A complexidade de uma tarefa não me intimida; eu a divido em partes menores e gerenciáveis." },
  
  // Produtividade (20 perguntas)
  { id: 21, dimension: "Produtividade", text: "Quando inicio uma tarefa, meu objetivo principal é concluí-la com eficiência." },
  { id: 22, dimension: "Produtividade", text: "Busco ativamente maneiras de medir os resultados do meu trabalho." },
  { id: 23, dimension: "Produtividade", text: "Sinto-me confortável em tomar decisões importantes de forma rápida e assertiva." },
  { id: 24, dimension: "Produtividade", text: "Sou conhecido por entregar minhas responsabilidades consistentemente dentro dos prazos." },
  { id: 25, dimension: "Produtividade", text: "Acredito que meu trabalho tem um impacto positivo e visível nos resultados da equipe/empresa." },
  { id: 26, dimension: "Produtividade", text: "Procuro constantemente formas de otimizar e melhorar meus processos de trabalho." },
  { id: 27, dimension: "Produtividade", text: "Tenho iniciativa para começar projetos e não espero que me peçam." },
  { id: 28, dimension: "Produtividade", text: "Tenho orgulho da qualidade do trabalho que entrego." },
  { id: 29, dimension: "Produtividade", text: "Delego tarefas quando apropriado para otimizar o resultado geral." },
  { id: 30, dimension: "Produtividade", text: "Automatizo tarefas repetitivas sempre que possível." },
  { id: 31, dimension: "Produtividade", text: "Sou bom em estimar o tempo necessário para completar diferentes tipos de tarefas." },
  { id: 32, dimension: "Produtividade", text: "Consigo identificar e eliminar gargalos nos meus fluxos de trabalho." },
  { id: 33, dimension: "Produtividade", text: "Em reuniões, foco em objetivos claros e próximos passos acionáveis." },
  { id: 34, dimension: "Produtividade", text: "Aproveito ao máximo as ferramentas e tecnologias disponíveis para melhorar meu desempenho." },
  { id: 35, dimension: "Produtividade", text: "Mesmo em dias de baixa motivação, consigo manter um nível de produtividade aceitável." },
  { id: 36, dimension: "Produtividade", text: "Sei quando uma tarefa está 'boa o suficiente' e evito o perfeccionismo excessivo que atrasa a entrega." },
  { id: 37, dimension: "Produtividade", text: "Comunico meu progresso de forma clara e proativa aos stakeholders." },
  { id: 38, dimension: "Produtividade", text: "Sinto-me energizado ao concluir tarefas e ver o progresso." },
  { id: 39, dimension: "Produtividade", text: "Organizo minhas informações e arquivos de forma que sejam fáceis e rápidos de encontrar." },
  { id: 40, dimension: "Produtividade", text: "Sou orientado para a ação e prefiro a execução à discussão prolongada." },

  // Resiliência (20 perguntas)
  { id: 41, dimension: "Resiliência", text: "Adapto-me bem a mudanças inesperadas nos planos ou no ambiente de trabalho." },
  { id: 42, dimension: "Resiliência", text: "Consigo manter a calma e a clareza de pensamento sob pressão ou em situações de estresse." },
  { id: 43, dimension: "Resiliência", text: "Colaboro de forma construtiva com colegas, mesmo quando temos opiniões divergentes." },
  { id: 44, dimension: "Resiliência", text: "Encaro falhas e erros como oportunidades de aprendizado e crescimento." },
  { id: 45, dimension: "Resiliência", text: "Mantenho uma atitude otimista e positiva, mesmo diante de adversidades e desafios." },
  { id: 46, dimension: "Resiliência", text: "Recebo feedback construtivo de forma aberta, sem ficar na defensiva." },
  { id: 47, dimension: "Resiliência", text: "Construo e mantenho relacionamentos profissionais saudáveis e de confiança." },
  { id: 48, dimension: "Resiliência", text: "Quando um problema surge, foco na solução em vez de me prender ao problema." },
  { id: 49, dimension: "Resiliência", text: "Consigo me recuperar rapidamente de contratempos ou decepções profissionais." },
  { id: 50, dimension: "Resiliência", text: "Busco ajuda ou conselho quando enfrento um desafio que não consigo resolver sozinho." },
  { id: 51, dimension: "Resiliência", text: "Tenho consciência das minhas emoções e consigo gerenciá-las no ambiente de trabalho." },
  { id: 52, dimension: "Resiliência", text: "Celebro o sucesso dos outros e ofereço apoio quando eles enfrentam dificuldades." },
  { id: 53, dimension: "Resiliência", text: "Consigo manter um equilíbrio saudável entre vida profissional e pessoal, evitando o esgotamento." },
  { id: 54, dimension: "Resiliência", text: "Vejo a incerteza como parte do processo e não como uma ameaça paralisante." },
  { id: 55, dimension: "Resiliência", text: "Sou paciente e persistente na busca de soluções para problemas complexos." },
  { id: 56, dimension: "Resiliência", text: "Tenho empatia e consigo entender as perspectivas e sentimentos dos meus colegas." },
  { id: 57, dimension: "Resiliência", text: "Sou flexível na minha abordagem e estou disposto a tentar novas maneiras de fazer as coisas." },
  { id: 58, dimension: "Resiliência", text: "Confio na minha capacidade de superar os desafios que surgem." },
  { id: 59, dimension: "Resiliência", text: "Resolvo conflitos de forma direta e respeitosa, buscando um resultado positivo para todos." },
  { id: 60, dimension: "Resiliência", text: "Sei reconhecer meus limites e cuidar do meu bem-estar para manter o desempenho a longo prazo." },
];

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getRandomQuestions = (count: number = 25): QuizQuestion[] => {
  const focusQuestions = ALL_QUESTIONS.filter(q => q.dimension === 'Foco');
  const productivityQuestions = ALL_QUESTIONS.filter(q => q.dimension === 'Produtividade');
  const resilienceQuestions = ALL_QUESTIONS.filter(q => q.dimension === 'Resiliência');

  // Garante uma distribuição aproximadamente igual das dimensões
  const numPerDimension = Math.floor(count / 3);
  const remainder = count % 3;

  const selectedFocus = shuffleArray(focusQuestions).slice(0, numPerDimension + (remainder > 0 ? 1 : 0));
  const selectedProductivity = shuffleArray(productivityQuestions).slice(0, numPerDimension + (remainder > 1 ? 1 : 0));
  const selectedResilience = shuffleArray(resilienceQuestions).slice(0, numPerDimension);

  const finalQuestions = [...selectedFocus, ...selectedProductivity, ...selectedResilience];
  
  // Garante que o número final de questões seja exatamente 'count'
  return shuffleArray(finalQuestions).slice(0, count);
};
