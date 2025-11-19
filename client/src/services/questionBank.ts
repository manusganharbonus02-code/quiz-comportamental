import { QuizQuestion } from '../types';

export const ALL_QUESTIONS: QuizQuestion[] = [
  // Foco
  { id: 1, module: "Foco", text: "Eu defino prioridades claras para minhas tarefas diárias." },
  { id: 2, module: "Foco", text: "Consigo manter o foco em objetivos de longo prazo sem me desviar." },
  { id: 3, module: "Foco", text: "Minimizo facilmente as distrações (notificações, conversas) quando preciso me concentrar." },
  { id: 4, module: "Foco", text: "Planejo meu dia de forma estruturada para maximizar minha eficiência." },
  { id: 5, module: "Foco", text: "Tenho o hábito de revisar periodicamente o andamento dos meus objetivos." },

  // Adaptabilidade
  { id: 6, module: "Adaptabilidade", text: "Eu me sinto confortável com mudanças inesperadas nos planos." },
  { id: 7, module: "Adaptabilidade", text: "Aprendo rapidamente novas ferramentas ou processos quando necessário." },
  { id: 8, module: "Adaptabilidade", text: "Consigo ajustar minha abordagem quando a estratégia inicial não está funcionando." },
  { id: 9, module: "Adaptabilidade", text: "Vejo a incerteza como uma oportunidade, não como uma ameaça." },
  { id: 10, module: "Adaptabilidade", text: "Estou aberto a ouvir e considerar pontos de vista diferentes dos meus." },

  // AgressorRotina (Inovação)
  { id: 11, module: "AgressorRotina", text: "Eu questiono ativamente o 'jeito que sempre fizemos as coisas'." },
  { id: 12, module: "AgressorRotina", text: "Gosto de experimentar novas ideias, mesmo que haja risco de falha." },
  { id: 13, module: "AgressorRotina", text: "Eu proponho soluções criativas para problemas existentes." },
  { id: 14, module: "AgressorRotina", text: "Dedico tempo para pensar em melhorias e inovações para minha área." },
  { id: 15, module: "AgressorRotina", text: "Sinto-me energizado por desafios que exigem pensar fora da caixa." },

  // MatadorDragoes (Coragem)
  { id: 16, module: "MatadorDragoes", text: "Eu defendo minhas ideias e convicções, mesmo que sejam impopulares." },
  { id: 17, module: "MatadorDragoes", text: "Eu assumo a responsabilidade por decisões difíceis." },
  { id: 18, module: "MatadorDragoes", text: "Não hesito em ter conversas difíceis quando são necessárias para o bem do projeto." },
  { id: 19, module: "MatadorDragoes", text: "Encaro os erros como parte essencial do processo de crescimento." },
  { id: 20, module: "MatadorDragoes", text: "Eu me voluntario para tarefas desafiadoras que outros podem evitar." },

  // RadarSocial (Inteligência Emocional)
  { id: 21, module: "RadarSocial", text: "Eu percebo facilmente o clima emocional de uma reunião ou equipe." },
  { id: 22, module: "RadarSocial", text: "Consigo adaptar meu estilo de comunicação para diferentes pessoas e situações." },
  { id: 23, module: "RadarSocial", text: "Sou bom em construir e manter relacionamentos profissionais de confiança." },
  { id: 24, module: "RadarSocial", text: "Eu ofereço feedback de forma construtiva e respeitosa." },
  { id: 25, module: "RadarSocial", text: "Eu consigo gerenciar minhas próprias emoções sob pressão." },
];

// Função simplificada para embaralhar e retornar as perguntas
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getRandomQuestions = (count: number = 25): QuizQuestion[] => {
  return shuffleArray(ALL_QUESTIONS).slice(0, count);
};
